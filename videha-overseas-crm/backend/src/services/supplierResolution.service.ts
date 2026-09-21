import { Types, type ClientSession } from "mongoose";
import { Supplier } from "../models/Supplier";
import { AppError } from "../utils/AppError";
import {
  normalizeComparableName,
  normalizeEmail,
  normalizePhone,
  normalizeName,
} from "./customerResolution.service";
import { isDuplicateKeyError, nextSupplierCode } from "../utils/codes";

export interface SupplierResolutionInput {
  supplierId?: string | Types.ObjectId | null;
  supplierCode?: string | null;
  supplierName?: string | null;
  companyName?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  currency?: string | null;
  productsSupplied?: string | null;
  status?: string | null;
  notes?: string | null;
}

export type SupplierMatchReason =
  | "supplierId"
  | "supplierCode"
  | "email"
  | "phone"
  | "company_and_name"
  | "identifying_fields"
  | "created_new";

export interface SupplierResolutionResult {
  supplier: InstanceType<typeof Supplier>;
  isNewSupplier: boolean;
  matchedBy: SupplierMatchReason;
}

export interface SupplierDryRunResult {
  type: "existing" | "new" | "ambiguous" | "error";
  matchedBy?: SupplierMatchReason;
  supplierId?: string;
  supplierCode?: string;
  supplierName?: string;
  companyName?: string;
  error?: string;
}

export interface SupplierMatchCandidate {
  rowKey?: string;
  supplierCode: string;
  supplierName: string;
  companyName: string;
  email: string;
  phone: string;
  normalizedSupplierName: string;
  normalizedCompanyName: string;
  normalizedEmail: string;
  normalizedPhone: string;
}

export type SupplierPriorMatchResult =
  | { type: "none" }
  | { type: "match"; matchedBy: SupplierMatchReason; candidate: SupplierMatchCandidate }
  | { type: "ambiguous"; error: string };

function normalizeCompanyName(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

export function buildSupplierNormalizedFields(input: SupplierResolutionInput) {
  const supplierName = normalizeName(input.supplierName);
  const companyName = normalizeCompanyName(input.companyName || input.supplierName);
  return {
    supplierName,
    companyName,
    normalizedSupplierName: normalizeComparableName(supplierName),
    normalizedCompanyName: normalizeComparableName(companyName),
    normalizedEmail: normalizeEmail(input.email),
    normalizedPhone: normalizePhone(input.phone),
  };
}

async function findSuppliersByCompanyAndName(
  normalizedCompanyName: string,
  normalizedSupplierName: string,
  session?: ClientSession | null,
): Promise<InstanceType<typeof Supplier>[]> {
  if (!normalizedCompanyName || !normalizedSupplierName) return [];

  const query = Supplier.find({
    normalizedCompanyName,
    normalizedSupplierName,
  }).sort({ createdAt: 1 });
  if (session) query.session(session);
  return query;
}

async function findSuppliersByIdentifyingFields(
  normalizedCompanyName: string,
  normalizedSupplierName: string,
  normalizedEmail: string,
  normalizedPhone: string,
  session?: ClientSession | null,
): Promise<InstanceType<typeof Supplier>[]> {
  const filters: Record<string, unknown>[] = [];
  if (normalizedEmail) filters.push({ normalizedEmail });
  if (normalizedPhone && normalizedPhone.length >= 7) {
    filters.push({ normalizedPhone });
    const digits = normalizedPhone.replace(/\D/g, "");
    if (digits.length >= 7) filters.push({ normalizedPhone: digits });
  }

  if (filters.length === 0) return [];

  const query = Supplier.find({ $or: filters }).sort({ createdAt: 1 });
  if (session) query.session(session);
  const candidates = await query;

  return candidates.filter((supplier) => {
    const companyMatch =
      !normalizedCompanyName ||
      supplier.normalizedCompanyName === normalizedCompanyName ||
      supplier.normalizedSupplierName === normalizedCompanyName;
    const nameMatch =
      !normalizedSupplierName ||
      supplier.normalizedSupplierName === normalizedSupplierName ||
      supplier.normalizedCompanyName === normalizedSupplierName;
    return companyMatch && nameMatch;
  });
}

export function toSupplierMatchCandidate(
  input: SupplierResolutionInput,
  rowKey?: string,
): SupplierMatchCandidate {
  const norm = buildSupplierNormalizedFields(input);
  return {
    rowKey,
    supplierCode: input.supplierCode?.trim() || "",
    supplierName: norm.supplierName,
    companyName: norm.companyName,
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    normalizedSupplierName: norm.normalizedSupplierName,
    normalizedCompanyName: norm.normalizedCompanyName,
    normalizedEmail: norm.normalizedEmail,
    normalizedPhone: norm.normalizedPhone,
  };
}

function resolvePriorMatches(
  matches: SupplierMatchCandidate[],
  matchedBy: SupplierMatchReason,
): SupplierPriorMatchResult | null {
  if (matches.length === 1) {
    return { type: "match", matchedBy, candidate: matches[0] };
  }
  if (matches.length > 1) {
    return {
      type: "ambiguous",
      error: "Multiple earlier CSV rows match this supplier. Manual resolution required.",
    };
  }
  return null;
}

function filterIdentifyingFieldCandidates(
  target: SupplierMatchCandidate,
  priorCandidates: SupplierMatchCandidate[],
): SupplierMatchCandidate[] {
  const hasContact =
    Boolean(target.normalizedEmail) ||
    (target.normalizedPhone.length >= 7 && Boolean(target.normalizedPhone));

  if (!hasContact) return [];

  return priorCandidates.filter((candidate) => {
    const emailMatch =
      target.normalizedEmail &&
      candidate.normalizedEmail &&
      target.normalizedEmail === candidate.normalizedEmail;
    const phoneMatch =
      target.normalizedPhone.length >= 7 &&
      candidate.normalizedPhone.length >= 7 &&
      (target.normalizedPhone === candidate.normalizedPhone ||
        target.normalizedPhone.replace(/\D/g, "") === candidate.normalizedPhone.replace(/\D/g, ""));

    if (!emailMatch && !phoneMatch) return false;

    const companyMatch =
      !target.normalizedCompanyName ||
      candidate.normalizedCompanyName === target.normalizedCompanyName ||
      candidate.normalizedSupplierName === target.normalizedCompanyName;
    const nameMatch =
      !target.normalizedSupplierName ||
      candidate.normalizedSupplierName === target.normalizedSupplierName ||
      candidate.normalizedCompanyName === target.normalizedSupplierName;
    return companyMatch && nameMatch;
  });
}

/**
 * Matches a supplier input against earlier CSV rows using the same priority order
 * as database resolution. Empty/missing fields are ignored, never treated as mismatches.
 */
export function matchSupplierAmongPriorCandidates(
  input: SupplierResolutionInput,
  priorCandidates: SupplierMatchCandidate[],
): SupplierPriorMatchResult {
  if (priorCandidates.length === 0) return { type: "none" };

  const target = toSupplierMatchCandidate(input);

  const supplierCode = input.supplierCode?.trim();
  if (supplierCode) {
    const codeLower = supplierCode.toLowerCase();
    const result = resolvePriorMatches(
      priorCandidates.filter((c) => c.supplierCode.trim().toLowerCase() === codeLower),
      "supplierCode",
    );
    if (result) return result;
  }

  if (target.normalizedEmail) {
    const result = resolvePriorMatches(
      priorCandidates.filter((c) => c.normalizedEmail === target.normalizedEmail),
      "email",
    );
    if (result) return result;
  }

  if (target.normalizedPhone.length >= 7) {
    const phoneDigits = target.normalizedPhone.replace(/\D/g, "");
    const result = resolvePriorMatches(
      priorCandidates.filter((c) => {
        if (c.normalizedPhone.length < 7) return false;
        if (c.normalizedPhone === target.normalizedPhone) return true;
        return phoneDigits.length >= 7 && c.normalizedPhone.replace(/\D/g, "") === phoneDigits;
      }),
      "phone",
    );
    if (result) return result;
  }

  if (target.normalizedCompanyName && target.normalizedSupplierName) {
    const result = resolvePriorMatches(
      priorCandidates.filter(
        (c) =>
          c.normalizedCompanyName === target.normalizedCompanyName &&
          c.normalizedSupplierName === target.normalizedSupplierName,
      ),
      "company_and_name",
    );
    if (result) return result;
  }

  const identifyingMatches = filterIdentifyingFieldCandidates(target, priorCandidates);
  const identifyingResult = resolvePriorMatches(identifyingMatches, "identifying_fields");
  if (identifyingResult) return identifyingResult;

  return { type: "none" };
}

export function supplierInputFromMapped(mapped: Record<string, unknown>): SupplierResolutionInput {
  return {
    supplierCode: mapped.supplierCode ? String(mapped.supplierCode).trim() : null,
    supplierName: mapped.supplierName ? String(mapped.supplierName).trim() : null,
    companyName: mapped.companyName ? String(mapped.companyName).trim() : null,
    contactPerson: mapped.contactPerson ? String(mapped.contactPerson).trim() : null,
    email: mapped.email ? String(mapped.email).trim() : null,
    phone: mapped.phone ? String(mapped.phone).trim() : null,
    address: mapped.address ? String(mapped.address).trim() : null,
    country: mapped.country ? String(mapped.country).trim() : null,
    taxId: mapped.taxId ? String(mapped.taxId).trim() : null,
    paymentTerms: mapped.paymentTerms ? String(mapped.paymentTerms).trim() : null,
    currency: mapped.currency ? String(mapped.currency).trim() : null,
    productsSupplied: mapped.productsSupplied ? String(mapped.productsSupplied).trim() : null,
    status: mapped.status ? String(mapped.status).trim() : null,
    notes: mapped.notes ? String(mapped.notes).trim() : null,
  };
}

export async function dryRunResolveSupplier(
  input: SupplierResolutionInput,
): Promise<SupplierDryRunResult> {
  const supplierIdStr = input.supplierId ? String(input.supplierId) : null;
  if (supplierIdStr) {
    const existing = await Supplier.findById(supplierIdStr);
    if (!existing) return { type: "error", error: `Supplier with ID ${supplierIdStr} not found.` };
    return {
      type: "existing",
      matchedBy: "supplierId",
      supplierId: String(existing._id),
      supplierCode: existing.supplierCode,
      supplierName: existing.supplierName,
      companyName: existing.companyName,
    };
  }

  const supplierCodeStr = input.supplierCode ? input.supplierCode.trim() : null;
  if (supplierCodeStr) {
    const existing = await Supplier.findOne({ supplierCode: supplierCodeStr });
    if (existing) {
      return {
        type: "existing",
        matchedBy: "supplierCode",
        supplierId: String(existing._id),
        supplierCode: existing.supplierCode,
        supplierName: existing.supplierName,
        companyName: existing.companyName,
      };
    }
  }

  const norm = buildSupplierNormalizedFields(input);

  if (norm.normalizedEmail) {
    const emailMatches = await Supplier.find({ normalizedEmail: norm.normalizedEmail });
    if (emailMatches.length === 1) {
      const matched = emailMatches[0];
      return {
        type: "existing",
        matchedBy: "email",
        supplierId: String(matched._id),
        supplierCode: matched.supplierCode,
        supplierName: matched.supplierName,
        companyName: matched.companyName,
      };
    }
    if (emailMatches.length > 1) {
      return {
        type: "ambiguous",
        error: `Multiple suppliers match email "${norm.normalizedEmail}". Manual resolution required.`,
      };
    }
  }

  if (norm.normalizedPhone && norm.normalizedPhone.length >= 7) {
    const phoneDigits = norm.normalizedPhone.replace(/\D/g, "");
    const phoneFilter: Record<string, unknown>[] = [
      { normalizedPhone: norm.normalizedPhone },
      { phone: input.phone?.trim() },
    ];
    if (phoneDigits.length >= 7) phoneFilter.push({ normalizedPhone: phoneDigits });

    const phoneMatches = await Supplier.find({ $or: phoneFilter });
    if (phoneMatches.length === 1) {
      const matched = phoneMatches[0];
      return {
        type: "existing",
        matchedBy: "phone",
        supplierId: String(matched._id),
        supplierCode: matched.supplierCode,
        supplierName: matched.supplierName,
        companyName: matched.companyName,
      };
    }
    if (phoneMatches.length > 1) {
      return {
        type: "ambiguous",
        error: `Multiple suppliers match phone "${input.phone}". Manual resolution required.`,
      };
    }
  }

  if (norm.normalizedCompanyName && norm.normalizedSupplierName) {
    const nameMatches = await findSuppliersByCompanyAndName(
      norm.normalizedCompanyName,
      norm.normalizedSupplierName,
    );
    if (nameMatches.length === 1) {
      const matched = nameMatches[0];
      return {
        type: "existing",
        matchedBy: "company_and_name",
        supplierId: String(matched._id),
        supplierCode: matched.supplierCode,
        supplierName: matched.supplierName,
        companyName: matched.companyName,
      };
    }
    if (nameMatches.length > 1) {
      return {
        type: "ambiguous",
        error: `Multiple suppliers match company and name. Manual resolution required.`,
      };
    }
  }

  const identifyingMatches = await findSuppliersByIdentifyingFields(
    norm.normalizedCompanyName,
    norm.normalizedSupplierName,
    norm.normalizedEmail,
    norm.normalizedPhone,
  );
  if (identifyingMatches.length === 1) {
    const matched = identifyingMatches[0];
    return {
      type: "existing",
      matchedBy: "identifying_fields",
      supplierId: String(matched._id),
      supplierCode: matched.supplierCode,
      supplierName: matched.supplierName,
      companyName: matched.companyName,
    };
  }
  if (identifyingMatches.length > 1) {
    return {
      type: "ambiguous",
      error: "Multiple suppliers match the available identifying fields. Manual resolution required.",
    };
  }

  if (!norm.supplierName) {
    return { type: "error", error: "Supplier name is required." };
  }

  return {
    type: "new",
    supplierName: norm.supplierName,
    companyName: norm.companyName || norm.supplierName,
  };
}

export async function resolveOrCreateSupplierForImport(
  input: SupplierResolutionInput,
  actorId: string,
  session?: ClientSession,
): Promise<SupplierResolutionResult> {
  const dryRun = await dryRunResolveSupplier(input);
  if (dryRun.type === "ambiguous") {
    throw new AppError(dryRun.error || "Ambiguous supplier match.", 409, "AMBIGUOUS_SUPPLIER_MATCH");
  }
  if (dryRun.type === "error") {
    throw new AppError(dryRun.error || "Supplier resolution failed.", 400);
  }
  if (dryRun.type === "existing" && dryRun.supplierId) {
    const query = Supplier.findById(dryRun.supplierId);
    if (session) query.session(session);
    const supplier = await query;
    if (!supplier) throw new AppError("Matched supplier not found.", 404);
    return {
      supplier,
      isNewSupplier: false,
      matchedBy: dryRun.matchedBy || "supplierCode",
    };
  }

  const norm = buildSupplierNormalizedFields(input);
  if (!norm.supplierName) {
    throw new AppError("Supplier name is required.", 400);
  }

  const explicitCode = input.supplierCode?.trim();
  if (explicitCode) {
    const codeTaken = await Supplier.findOne({ supplierCode: explicitCode }).session(session ?? null);
    if (codeTaken) {
      return { supplier: codeTaken, isNewSupplier: false, matchedBy: "supplierCode" };
    }
  }

  const supplierCode = explicitCode || (await nextSupplierCode());
  try {
    const docs = await Supplier.create(
      [
        {
          supplierCode,
          supplierName: norm.supplierName,
          companyName: norm.companyName || norm.supplierName,
          contactPerson: normalizeName(input.contactPerson),
          email: norm.normalizedEmail,
          normalizedEmail: norm.normalizedEmail,
          phone: input.phone?.trim() || "",
          normalizedPhone: norm.normalizedPhone,
          address: input.address?.trim() || "",
          country: input.country?.trim() || "",
          taxId: input.taxId?.trim() || "",
          paymentTerms: input.paymentTerms?.trim() || "",
          currency: String(input.currency || "USD").trim().toUpperCase() || "USD",
          productsSupplied: input.productsSupplied?.trim() || "",
          status: input.status === "inactive" ? "inactive" : "active",
          notes: input.notes?.trim() || "",
          normalizedSupplierName: norm.normalizedSupplierName,
          normalizedCompanyName: norm.normalizedCompanyName,
          createdById: new Types.ObjectId(actorId),
        },
      ],
      { session },
    );
    return { supplier: docs[0], isNewSupplier: true, matchedBy: "created_new" };
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      if (norm.normalizedEmail) {
        const existing = await Supplier.findOne({ normalizedEmail: norm.normalizedEmail }).session(
          session ?? null,
        );
        if (existing) {
          return { supplier: existing, isNewSupplier: false, matchedBy: "email" };
        }
      }
      if (norm.normalizedPhone) {
        const existing = await Supplier.findOne({ normalizedPhone: norm.normalizedPhone }).session(
          session ?? null,
        );
        if (existing) {
          return { supplier: existing, isNewSupplier: false, matchedBy: "phone" };
        }
      }
    }
    throw err;
  }
}
