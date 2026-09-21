import { Types, type ClientSession } from "mongoose";
import { Customer } from "../models/Customer";
import { Company } from "../models/Company";
import { Lead } from "../models/Lead";
import { AppError } from "../utils/AppError";
import { assertObjectId, optionalObjectId } from "../utils/objectId";
import { nextCompanyCode, nextCustomerCode } from "../utils/codes";

export interface CustomerResolutionInput {
  customerId?: string | Types.ObjectId | null;
  customerCode?: string | null;
  relatedLeadId?: string | Types.ObjectId | null;
  customerName?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  notes?: string | null;
  assignedToId?: string | Types.ObjectId | null;
}

export type CustomerMatchReason =
  | "customerId"
  | "customerCode"
  | "lead"
  | "email"
  | "phone"
  | "company_and_name"
  | "company_and_contact"
  | "created_new";

export interface CustomerResolutionResult {
  customer: InstanceType<typeof Customer>;
  company: InstanceType<typeof Company>;
  isNewCustomer: boolean;
  isNewCompany: boolean;
  matchedBy: CustomerMatchReason;
}

export interface CustomerDryRunResult {
  type: "existing" | "new" | "ambiguous" | "error";
  matchedBy?: CustomerMatchReason;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  companyName?: string;
  error?: string;
}

const UNICODE_DASHES_REGEX =
  /[\u002D\u00AD\u058A\u05BE\u1400\u1806\u2010-\u2015\u2053\u207B\u208B\u2212\u2E17\u2E1A\u301C\u3030\uFE58\uFE63\uFF0D]/gu;
const INSIGNIFICANT_PUNCTUATION_REGEX = /[.,'"’`“”()[\]{}!?;:/\\#]/g;

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeEmail(email: string | null | undefined): string {
  return email ? email.trim().toLowerCase() : "";
}

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "").trim();
}

export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeCompany(company: string | null | undefined): string {
  if (!company) return "";
  return company.trim().replace(/\s+/g, " ");
}

/**
 * Normalizes company and customer names consistently for comparisons:
 * - trim
 * - lowercase
 * - normalize hyphens/dashes (including Unicode hyphens) to spaces
 * - normalize underscores to spaces
 * - remove insignificant punctuation (dots, commas, quotes, etc.)
 * - collapse multiple spaces
 */
export function normalizeComparableName(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(UNICODE_DASHES_REGEX, " ")
    .replace(/_+/g, " ")
    .toLowerCase()
    .replace(INSIGNIFICANT_PUNCTUATION_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds candidate companies that match the canonical company name.
 * Uses flexible regex to account for hyphens/spaces/punctuation in the DB,
 * then validates matches in memory using normalizeComparableName.
 * Results are sorted with oldest/canonical company first.
 */
export async function findMatchingCompanies(
  companyName: string | null | undefined,
  country?: string | null,
  session?: ClientSession | null,
): Promise<InstanceType<typeof Company>[]> {
  const targetCanonical = normalizeComparableName(companyName);
  if (!targetCanonical) return [];

  const words = targetCanonical.split(" ").filter(Boolean);
  if (words.length === 0) return [];

  const pattern = "^\\s*" + words.map(escapeRegex).join("[\\s\\-_.,']+") + "[\\s\\-_.,']*$";
  const flexibleRegex = new RegExp(pattern, "i");

  const query = Company.find({
    $or: [
      { name: flexibleRegex },
      { legalName: flexibleRegex },
      { name: new RegExp(`^${escapeRegex(companyName?.trim() || "")}$`, "i") },
      { name: new RegExp(escapeRegex(words[0]), "i") },
    ],
  }).sort({ createdAt: 1 });

  if (session) query.session(session);
  const candidates = await query;

  let matched = candidates.filter(
    (c) =>
      normalizeComparableName(c.name) === targetCanonical ||
      normalizeComparableName(c.legalName) === targetCanonical,
  );

  if (country && matched.length > 1) {
    const countryNorm = country.trim().toLowerCase();
    const sameCountry = matched.filter(
      (c) => c.country && c.country.trim().toLowerCase() === countryNorm,
    );
    if (sameCountry.length > 0) {
      matched = sameCountry;
    }
  }

  // Preserve oldest (canonical) record first
  matched.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return matched;
}

/**
 * Finds all customers under a company whose name matches target customerName
 * using canonical name comparison.
 */
export async function findMatchingCustomersForCompanyByName(
  companyId: Types.ObjectId,
  customerName: string | null | undefined,
  session?: ClientSession | null,
): Promise<InstanceType<typeof Customer>[]> {
  const targetCanonical = normalizeComparableName(customerName);
  if (!targetCanonical) return [];

  const query = Customer.find({ companyId }).sort({ createdAt: 1 });
  if (session) query.session(session);
  const allCusts = await query;

  return allCusts.filter((c) => normalizeComparableName(c.name) === targetCanonical);
}

/**
 * Robust, unified customer matching and auto-linking service.
 * Used identically for:
 * 1. Standard Order creation
 * 2. Orders converted from Quotations
 * 3. CSV Order Import
 */
export async function resolveOrCreateCustomerForOrder(
  input: CustomerResolutionInput,
  actorId: string,
  session?: ClientSession,
): Promise<CustomerResolutionResult> {
  // 1. Explicit customerId provided
  const customerIdStr = input.customerId ? String(input.customerId) : null;
  if (customerIdStr) {
    assertObjectId(customerIdStr, "customerId");
    const query = Customer.findById(customerIdStr);
    if (session) query.session(session);
    const existing = await query;
    if (!existing) {
      throw new AppError(`Customer with ID ${customerIdStr} not found.`, 404);
    }
    const compQuery = Company.findById(existing.companyId);
    if (session) compQuery.session(session);
    const company = await compQuery;
    if (!company) {
      throw new AppError(`Company associated with customer ${existing.customerCode} not found.`, 404);
    }
    return {
      customer: existing,
      company,
      isNewCustomer: false,
      isNewCompany: false,
      matchedBy: "customerId",
    };
  }

  // 1b. Customer Code provided
  const customerCodeStr = input.customerCode ? input.customerCode.trim() : null;
  if (customerCodeStr) {
    const query = Customer.findOne({ customerCode: customerCodeStr });
    if (session) query.session(session);
    const existing = await query;
    if (existing) {
      const compQuery = Company.findById(existing.companyId);
      if (session) compQuery.session(session);
      const company = await compQuery;
      if (company) {
        return {
          customer: existing,
          company,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "customerCode",
        };
      }
    }
  }

  // 2. Related Lead provided
  const leadIdStr = input.relatedLeadId ? String(input.relatedLeadId) : null;
  if (leadIdStr) {
    assertObjectId(leadIdStr, "relatedLeadId");
    const leadQuery = Lead.findById(leadIdStr);
    if (session) leadQuery.session(session);
    const lead = await leadQuery;
    if (!lead) {
      throw new AppError(`Lead with ID ${leadIdStr} not found.`, 404);
    }

    // Lead already converted and has linked customer
    if (lead.customerId && lead.companyId) {
      const custQuery = Customer.findById(lead.customerId);
      const compQuery = Company.findById(lead.companyId);
      if (session) {
        custQuery.session(session);
        compQuery.session(session);
      }
      const [existingCust, existingComp] = await Promise.all([custQuery, compQuery]);
      if (existingCust && existingComp) {
        return {
          customer: existingCust,
          company: existingComp,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "lead",
        };
      }
    }

    // Lead might have customer referencing relatedLeadId
    const custByLeadQuery = Customer.findOne({ relatedLeadId: lead._id });
    if (session) custByLeadQuery.session(session);
    const custByLead = await custByLeadQuery;
    if (custByLead) {
      const compQuery = Company.findById(custByLead.companyId);
      if (session) compQuery.session(session);
      const existingComp = await compQuery;
      if (existingComp) {
        // Ensure lead is updated if missing links
        if (!lead.customerId || !lead.companyId) {
          lead.customerId = custByLead._id;
          lead.companyId = existingComp._id;
          lead.status = "Converted";
          lead.convertedAt = lead.convertedAt || new Date();
          await lead.save({ session });
        }
        return {
          customer: custByLead,
          company: existingComp,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "lead",
        };
      }
    }

    // Auto-convert lead to company & customer atomically
    const companyName = normalizeCompany(lead.company);
    const country = lead.country?.trim() || "United Arab Emirates";

    const matchedCompanies = await findMatchingCompanies(companyName, country, session);
    let comp: InstanceType<typeof Company>;
    let isNewCompany = false;
    if (matchedCompanies.length > 0) {
      comp = matchedCompanies[0];
    } else {
      const companyCode = await nextCompanyCode();
      const compDocs = await Company.create(
        [
          {
            companyCode,
            name: companyName,
            legalName: companyName,
            country,
            assignedToId: lead.assignedToId || (input.assignedToId ? optionalObjectId(String(input.assignedToId)) : null),
            createdById: new Types.ObjectId(actorId),
            notes: `Converted from lead ${lead.leadCode}.`,
          },
        ],
        { session },
      );
      comp = compDocs[0];
      isNewCompany = true;
    }

    const customerCode = await nextCustomerCode();
    const custDocs = await Customer.create(
      [
        {
          customerCode,
          companyId: comp._id,
          name: normalizeName(lead.name),
          email: normalizeEmail(lead.email),
          phone: lead.phoneNumber || "",
          normalizedPhone: normalizePhone(lead.phoneNumber),
          whatsAppNumber: lead.whatsAppNumber || lead.phoneNumber || "",
          isPrimaryContact: true,
          relatedLeadId: lead._id,
          createdById: new Types.ObjectId(actorId),
          notes: lead.notes || "",
        },
      ],
      { session },
    );
    const customer = custDocs[0];

    lead.status = "Converted";
    lead.customerId = customer._id;
    lead.companyId = comp._id;
    lead.convertedAt = new Date();
    await lead.save({ session });

    return {
      customer,
      company: comp,
      isNewCustomer: true,
      isNewCompany,
      matchedBy: "lead",
    };
  }

  // 3. No customerId or relatedLeadId — match by contact details
  const normEmail = normalizeEmail(input.email);
  const normPhone = normalizePhone(input.phone);
  const companyName = normalizeCompany(input.company);
  const customerName = normalizeName(input.customerName);
  const country = input.country?.trim() || "United Arab Emirates";

  // Check 1: Exact match on normalized email
  if (normEmail) {
    const custEmailQuery = Customer.find({ email: normEmail });
    if (session) custEmailQuery.session(session);
    const emailMatches = await custEmailQuery;

    if (emailMatches.length === 1) {
      const matchedCust = emailMatches[0];
      const compQuery = Company.findById(matchedCust.companyId);
      if (session) compQuery.session(session);
      const matchedComp = await compQuery;
      if (matchedComp) {
        return {
          customer: matchedCust,
          company: matchedComp,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "email",
        };
      }
    } else if (emailMatches.length > 1) {
      // Multiple matches exist - check if one matches the company
      const sameCompanyMatches = [];
      for (const m of emailMatches) {
        const comp = await Company.findById(m.companyId).session(session ?? null);
        if (comp && normalizeComparableName(comp.name) === normalizeComparableName(companyName)) {
          sameCompanyMatches.push({ customer: m, company: comp });
        }
      }
      if (sameCompanyMatches.length === 1) {
        return {
          customer: sameCompanyMatches[0].customer,
          company: sameCompanyMatches[0].company,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "email",
        };
      }
      throw new AppError(
        `Multiple customers match email "${normEmail}". Cannot merge automatically. Manual resolution required.`,
        409,
        "AMBIGUOUS_CUSTOMER_MATCH",
      );
    }
  }

  // Check 2: Exact match on normalized phone (minimum 7 characters to avoid false positives)
  if (normPhone && normPhone.length >= 7) {
    const phoneDigits = normPhone.replace(/\D/g, "");
    const phoneFilter: any[] = [
      { normalizedPhone: normPhone },
      { phone: normPhone },
      { phone: input.phone?.trim() },
    ];
    if (phoneDigits.length >= 7) {
      phoneFilter.push({ normalizedPhone: phoneDigits });
      phoneFilter.push({ normalizedPhone: new RegExp(`${phoneDigits.slice(-8)}$`) });
      phoneFilter.push({ phone: new RegExp(phoneDigits.slice(-8)) });
    }
    const custPhoneQuery = Customer.find({ $or: phoneFilter });
    if (session) custPhoneQuery.session(session);
    const phoneMatches = await custPhoneQuery;

    if (phoneMatches.length === 1) {
      const matchedCust = phoneMatches[0];
      const compQuery = Company.findById(matchedCust.companyId);
      if (session) compQuery.session(session);
      const matchedComp = await compQuery;
      if (matchedComp) {
        return {
          customer: matchedCust,
          company: matchedComp,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "phone",
        };
      }
    } else if (phoneMatches.length > 1) {
      // Check company
      const sameCompanyMatches = [];
      for (const m of phoneMatches) {
        const comp = await Company.findById(m.companyId).session(session ?? null);
        if (comp && normalizeComparableName(comp.name) === normalizeComparableName(companyName)) {
          sameCompanyMatches.push({ customer: m, company: comp });
        }
      }
      if (sameCompanyMatches.length === 1) {
        return {
          customer: sameCompanyMatches[0].customer,
          company: sameCompanyMatches[0].company,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "phone",
        };
      }
      throw new AppError(
        `Multiple customers match phone "${input.phone}". Cannot merge automatically. Manual resolution required.`,
        409,
        "AMBIGUOUS_CUSTOMER_MATCH",
      );
    }
  }

  // Check 3: Normalized company + customer name (both must be present)
  if (companyName && customerName) {
    const matchedCompanies = await findMatchingCompanies(companyName, country, session);
    if (matchedCompanies.length > 0) {
      for (const comp of matchedCompanies) {
        const matchedCusts = await findMatchingCustomersForCompanyByName(
          comp._id,
          customerName,
          session,
        );

        if (matchedCusts.length === 1) {
          return {
            customer: matchedCusts[0],
            company: comp,
            isNewCustomer: false,
            isNewCompany: false,
            matchedBy: "company_and_name",
          };
        } else if (matchedCusts.length > 1) {
          throw new AppError(
            `Multiple customers with name "${customerName}" found at company "${comp.name}". Manual resolution required.`,
            409,
            "AMBIGUOUS_CUSTOMER_MATCH",
          );
        }
      }
    }
  }

  // Check 4 (Priority 5): Company + email/phone strong match
  if (companyName && (normEmail || (normPhone && normPhone.length >= 7))) {
    const matchedCompanies = await findMatchingCompanies(companyName, country, session);
    if (matchedCompanies.length > 0) {
      const canonicalComp = matchedCompanies[0];
      const contactFilters: any[] = [];
      if (normEmail) {
        contactFilters.push({ email: normEmail });
      }
      if (normPhone && normPhone.length >= 7) {
        const phoneDigits = normPhone.replace(/\D/g, "");
        contactFilters.push({ normalizedPhone: normPhone });
        contactFilters.push({ phone: normPhone });
        contactFilters.push({ phone: input.phone?.trim() });
        if (phoneDigits.length >= 7) {
          contactFilters.push({ normalizedPhone: phoneDigits });
          contactFilters.push({ normalizedPhone: new RegExp(`${phoneDigits.slice(-8)}$`) });
          contactFilters.push({ phone: new RegExp(phoneDigits.slice(-8)) });
        }
      }

      const custQuery = Customer.find({
        companyId: canonicalComp._id,
        $or: contactFilters,
      });
      if (session) custQuery.session(session);
      const contactMatches = await custQuery;

      if (contactMatches.length === 1) {
        return {
          customer: contactMatches[0],
          company: canonicalComp,
          isNewCustomer: false,
          isNewCompany: false,
          matchedBy: "company_and_contact",
        };
      } else if (contactMatches.length > 1) {
        throw new AppError(
          `Multiple contacts matching email/phone found under company "${canonicalComp.name}". Manual resolution required.`,
          409,
          "AMBIGUOUS_CUSTOMER_MATCH",
        );
      }
    }
  }

  // NOTE: We NEVER match by customer name alone (strictly per requirements).

  // 6. No confident match — create new Company (if not exists) and Customer
  if (!companyName) {
    throw new AppError("Company name is required to create a customer account.", 400);
  }
  if (!customerName) {
    throw new AppError("Customer name is required to create a customer account.", 400);
  }

  const matchedCompanies = await findMatchingCompanies(companyName, country, session);
  let comp: InstanceType<typeof Company>;
  let isNewCompany = false;

  if (matchedCompanies.length > 0) {
    comp = matchedCompanies[0];
  } else {
    const companyCode = await nextCompanyCode();
    const compDocs = await Company.create(
      [
        {
          companyCode,
          name: companyName.trim(),
          legalName: companyName.trim(),
          country,
          assignedToId: input.assignedToId ? optionalObjectId(String(input.assignedToId)) : null,
          createdById: new Types.ObjectId(actorId),
          notes: "Automatically created during order registration.",
        },
      ],
      { session },
    );
    comp = compDocs[0];
    isNewCompany = true;
  }

  const customerCode = await nextCustomerCode();
  let customer: InstanceType<typeof Customer>;
  try {
    const custDocs = await Customer.create(
      [
        {
          customerCode,
          companyId: comp._id,
          name: customerName,
          email: normEmail,
          phone: input.phone?.trim() || "",
          normalizedPhone: normPhone,
          whatsAppNumber: input.phone?.trim() || "",
          isPrimaryContact: true,
          createdById: new Types.ObjectId(actorId),
          notes: input.notes || "Created during order registration.",
        },
      ],
      { session },
    );
    customer = custDocs[0];
  } catch (err: any) {
    // Handle race-condition duplicates gracefully
    if (err && (err.code === 11000 || err.name === "MongoServerError")) {
      let existingCust: InstanceType<typeof Customer> | null = null;
      if (normEmail) {
        existingCust = await Customer.findOne({ email: normEmail }).session(session ?? null);
      }
      if (!existingCust && normPhone) {
        existingCust = await Customer.findOne({
          $or: [{ normalizedPhone: normPhone }, { phone: input.phone?.trim() }],
        }).session(session ?? null);
      }
      if (existingCust) {
        return {
          customer: existingCust,
          company: comp,
          isNewCustomer: false,
          isNewCompany,
          matchedBy: normEmail ? "email" : "phone",
        };
      }
    }
    throw err;
  }

  return {
    customer,
    company: comp,
    isNewCustomer: true,
    isNewCompany,
    matchedBy: "created_new",
  };
}

/**
 * Pure read-only preview/dry-run of customer resolution.
 * Follows the EXACT same priority and matching rules without writing to the database.
 */
export async function dryRunResolveCustomer(
  input: CustomerResolutionInput,
): Promise<CustomerDryRunResult> {
  // 1. Explicit customerId
  const customerIdStr = input.customerId ? String(input.customerId) : null;
  if (customerIdStr) {
    try {
      assertObjectId(customerIdStr, "customerId");
      const existing = await Customer.findById(customerIdStr);
      if (!existing) return { type: "error", error: `Customer with ID ${customerIdStr} not found.` };
      const company = await Company.findById(existing.companyId);
      return {
        type: "existing",
        matchedBy: "customerId",
        customerId: String(existing._id),
        customerCode: existing.customerCode,
        customerName: existing.name,
        companyName: company?.name || "",
      };
    } catch (e: any) {
      return { type: "error", error: e.message };
    }
  }

  // 1b. Customer Code
  const customerCodeStr = input.customerCode ? input.customerCode.trim() : null;
  if (customerCodeStr) {
    const existing = await Customer.findOne({ customerCode: customerCodeStr });
    if (existing) {
      const company = await Company.findById(existing.companyId);
      return {
        type: "existing",
        matchedBy: "customerCode",
        customerId: String(existing._id),
        customerCode: existing.customerCode,
        customerName: existing.name,
        companyName: company?.name || "",
      };
    }
  }

  // 2. Related Lead
  const leadIdStr = input.relatedLeadId ? String(input.relatedLeadId) : null;
  if (leadIdStr) {
    try {
      assertObjectId(leadIdStr, "relatedLeadId");
      const lead = await Lead.findById(leadIdStr);
      if (!lead) return { type: "error", error: `Lead with ID ${leadIdStr} not found.` };
      if (lead.customerId && lead.companyId) {
        const [existingCust, existingComp] = await Promise.all([
          Customer.findById(lead.customerId),
          Company.findById(lead.companyId),
        ]);
        if (existingCust && existingComp) {
          return {
            type: "existing",
            matchedBy: "lead",
            customerId: String(existingCust._id),
            customerCode: existingCust.customerCode,
            customerName: existingCust.name,
            companyName: existingComp.name,
          };
        }
      }
      const custByLead = await Customer.findOne({ relatedLeadId: lead._id });
      if (custByLead) {
        const existingComp = await Company.findById(custByLead.companyId);
        return {
          type: "existing",
          matchedBy: "lead",
          customerId: String(custByLead._id),
          customerCode: custByLead.customerCode,
          customerName: custByLead.name,
          companyName: existingComp?.name || "",
        };
      }
    } catch (e: any) {
      return { type: "error", error: e.message };
    }
  }

  const normEmail = normalizeEmail(input.email);
  const normPhone = normalizePhone(input.phone);
  const companyName = normalizeCompany(input.company);
  const customerName = normalizeName(input.customerName);
  const country = input.country?.trim() || "United Arab Emirates";

  // Priority 2: Normalized email exact match
  if (normEmail) {
    const emailMatches = await Customer.find({ email: normEmail });
    if (emailMatches.length === 1) {
      const matchedCust = emailMatches[0];
      const matchedComp = await Company.findById(matchedCust.companyId);
      return {
        type: "existing",
        matchedBy: "email",
        customerId: String(matchedCust._id),
        customerCode: matchedCust.customerCode,
        customerName: matchedCust.name,
        companyName: matchedComp?.name || "",
      };
    } else if (emailMatches.length > 1) {
      const sameCompanyMatches: { customer: InstanceType<typeof Customer>; company: InstanceType<typeof Company> }[] = [];
      for (const m of emailMatches) {
        const comp = await Company.findById(m.companyId);
        if (comp && normalizeComparableName(comp.name) === normalizeComparableName(companyName)) {
          sameCompanyMatches.push({ customer: m, company: comp });
        }
      }
      if (sameCompanyMatches.length === 1) {
        return {
          type: "existing",
          matchedBy: "email",
          customerId: String(sameCompanyMatches[0].customer._id),
          customerCode: sameCompanyMatches[0].customer.customerCode,
          customerName: sameCompanyMatches[0].customer.name,
          companyName: sameCompanyMatches[0].company.name,
        };
      }
      return {
        type: "ambiguous",
        error: `Multiple customers match email "${normEmail}". Manual resolution required.`,
      };
    }
  }

  // Priority 3: Normalized phone match
  if (normPhone && normPhone.length >= 7) {
    const phoneDigits = normPhone.replace(/\D/g, "");
    const phoneFilter: any[] = [
      { normalizedPhone: normPhone },
      { phone: normPhone },
      { phone: input.phone?.trim() },
    ];
    if (phoneDigits.length >= 7) {
      phoneFilter.push({ normalizedPhone: phoneDigits });
      phoneFilter.push({ normalizedPhone: new RegExp(`${phoneDigits.slice(-8)}$`) });
      phoneFilter.push({ phone: new RegExp(phoneDigits.slice(-8)) });
    }
    const phoneMatches = await Customer.find({ $or: phoneFilter });

    if (phoneMatches.length === 1) {
      const matchedCust = phoneMatches[0];
      const matchedComp = await Company.findById(matchedCust.companyId);
      return {
        type: "existing",
        matchedBy: "phone",
        customerId: String(matchedCust._id),
        customerCode: matchedCust.customerCode,
        customerName: matchedCust.name,
        companyName: matchedComp?.name || "",
      };
    } else if (phoneMatches.length > 1) {
      const sameCompanyMatches: { customer: InstanceType<typeof Customer>; company: InstanceType<typeof Company> }[] = [];
      for (const m of phoneMatches) {
        const comp = await Company.findById(m.companyId);
        if (comp && normalizeComparableName(comp.name) === normalizeComparableName(companyName)) {
          sameCompanyMatches.push({ customer: m, company: comp });
        }
      }
      if (sameCompanyMatches.length === 1) {
        return {
          type: "existing",
          matchedBy: "phone",
          customerId: String(sameCompanyMatches[0].customer._id),
          customerCode: sameCompanyMatches[0].customer.customerCode,
          customerName: sameCompanyMatches[0].customer.name,
          companyName: sameCompanyMatches[0].company.name,
        };
      }
      return {
        type: "ambiguous",
        error: `Multiple customers match phone "${input.phone}". Manual resolution required.`,
      };
    }
  }

  // Priority 4: Normalized company + customer name exact match
  if (companyName && customerName) {
    const matchedCompanies = await findMatchingCompanies(companyName, country);
    if (matchedCompanies.length > 0) {
      for (const comp of matchedCompanies) {
        const matchedCusts = await findMatchingCustomersForCompanyByName(
          comp._id,
          customerName,
        );

        if (matchedCusts.length === 1) {
          return {
            type: "existing",
            matchedBy: "company_and_name",
            customerId: String(matchedCusts[0]._id),
            customerCode: matchedCusts[0].customerCode,
            customerName: matchedCusts[0].name,
            companyName: comp.name,
          };
        } else if (matchedCusts.length > 1) {
          return {
            type: "ambiguous",
            error: `Multiple customers with name "${customerName}" found at company "${comp.name}". Manual resolution required.`,
          };
        }
      }
    }
  }

  // Priority 5: Company + email/phone strong match
  if (companyName && (normEmail || (normPhone && normPhone.length >= 7))) {
    const matchedCompanies = await findMatchingCompanies(companyName, country);
    if (matchedCompanies.length > 0) {
      const canonicalComp = matchedCompanies[0];
      const contactFilters: any[] = [];
      if (normEmail) contactFilters.push({ email: normEmail });
      if (normPhone && normPhone.length >= 7) {
        const phoneDigits = normPhone.replace(/\D/g, "");
        contactFilters.push({ normalizedPhone: normPhone });
        contactFilters.push({ phone: normPhone });
        contactFilters.push({ phone: input.phone?.trim() });
        if (phoneDigits.length >= 7) {
          contactFilters.push({ normalizedPhone: phoneDigits });
          contactFilters.push({ normalizedPhone: new RegExp(`${phoneDigits.slice(-8)}$`) });
          contactFilters.push({ phone: new RegExp(phoneDigits.slice(-8)) });
        }
      }

      const contactMatches = await Customer.find({
        companyId: canonicalComp._id,
        $or: contactFilters,
      });

      if (contactMatches.length === 1) {
        return {
          type: "existing",
          matchedBy: "company_and_contact",
          customerId: String(contactMatches[0]._id),
          customerCode: contactMatches[0].customerCode,
          customerName: contactMatches[0].name,
          companyName: canonicalComp.name,
        };
      } else if (contactMatches.length > 1) {
        return {
          type: "ambiguous",
          error: `Multiple contacts matching email/phone found under company "${canonicalComp.name}". Manual resolution required.`,
        };
      }
    }
  }

  // Priority 6: Never auto-match by name alone.
  if (!companyName) {
    return { type: "error", error: "Company name is required." };
  }
  if (!customerName) {
    return { type: "error", error: "Customer name is required." };
  }

  return {
    type: "new",
    customerName,
    companyName,
  };
}
