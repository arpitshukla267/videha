import { Types } from "mongoose";
import { Lead } from "../../models/Lead";
import { LEAD_STATUSES } from "../../constants/leadPipeline";
import { Company, COMPANY_STATUSES } from "../../models/Company";
import { Customer, CUSTOMER_STATUSES } from "../../models/Customer";
import { FollowUp, FOLLOWUP_TYPES, FOLLOWUP_STATUSES } from "../../models/FollowUp";
import { Quotation, QUOTATION_STATUSES } from "../../models/Quotation";
import { Order, ORDER_STATUSES } from "../../models/Order";
import { User } from "../../models/User";
import { ImportSession, type ImportSessionRow } from "../../models/ImportSession";
import {
  IMPORT_ENTITY_PERMISSION,
  IMPORT_ENTITY_TYPES,
  IMPORT_FIELDS_BY_ENTITY,
  IMPORT_ENTITY_LABELS,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_FILE_ERROR,
  IMPORT_MAX_ROWS,
  IMPORT_PREVIEW_ROWS,
  IMPORT_SESSION_TTL_MS,
  suggestMapping,
  serializeImportFields,
  getMissingRequiredMappings,
  getDuplicateMappedFieldKeys,
  type ImportEntityType,
  type ImportFieldDef,
} from "../../constants/importFields";
import { AppError } from "../../utils/AppError";
import { parseCsv, rowsToObjects } from "../../utils/csvParse";
import { csvHeader, csvRow, exportFilename } from "../../utils/csv";
import { sendCsvResponse } from "../../utils/csvExport";
import {
  isDuplicateKeyError,
  nextCompanyCode,
  nextCustomerCode,
  nextLeadCode,
  nextOrderCode,
  nextQuotationCode,
} from "../../utils/codes";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import type { Response } from "express";
import { safeLower, safeRegexExact, safeString } from "../../utils/importSafe";

type UserLookup = {
  byEmail: Map<string, Types.ObjectId>;
  byName: Map<string, Types.ObjectId>;
};

function assertEntityType(value: string): ImportEntityType {
  if (!IMPORT_ENTITY_TYPES.includes(value as ImportEntityType)) {
    throw new AppError(`Unsupported import entity: ${value}`, 400, "INVALID_IMPORT_ENTITY");
  }
  return value as ImportEntityType;
}

function parseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function parseBoolean(value: unknown): boolean {
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "1", "y"].includes(text);
}

async function loadUsersLookup(): Promise<UserLookup> {
  const users = await User.find({ status: "active" }).select("email name _id").lean();
  const byEmail = new Map<string, Types.ObjectId>();
  const byName = new Map<string, Types.ObjectId>();
  for (const user of users) {
    if (user.email) byEmail.set(safeLower(user.email), user._id as Types.ObjectId);
    if (user.name) byName.set(safeLower(user.name), user._id as Types.ObjectId);
  }
  return { byEmail, byName };
}

function resolveUserRef(ref: unknown, users: UserLookup): Types.ObjectId | null {
  const value = safeString(ref);
  if (!value) return null;
  if (value.includes("@")) {
    return users.byEmail.get(safeLower(value)) ?? null;
  }
  return users.byName.get(safeLower(value)) ?? users.byEmail.get(safeLower(value)) ?? null;
}

async function resolveLeadRef(ref: unknown) {
  const value = safeString(ref);
  if (!value) return null;

  let lead = await Lead.findOne({ leadCode: value, archived: { $ne: true } })
    .select("_id leadCode company name")
    .lean();
  if (lead) return lead;

  const codeMatch = value.match(/VO-LEAD-\d+/i);
  if (codeMatch) {
    lead = await Lead.findOne({ leadCode: codeMatch[0].toUpperCase(), archived: { $ne: true } })
      .select("_id leadCode company name")
      .lean();
    if (lead) return lead;
  }

  const exactName = safeRegexExact(value);
  if (!exactName) return null;

  return Lead.findOne({
    archived: { $ne: true },
    $or: [{ name: exactName }, { company: exactName }],
  })
    .select("_id leadCode company name")
    .lean();
}

function applyMapping(
  raw: Record<string, string>,
  mapping: Record<string, string | null>,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [header, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey) continue;
    mapped[fieldKey] = raw[header] ?? "";
  }
  return mapped;
}

function validateRequired(fields: ImportFieldDef[], mapped: Record<string, string>): string[] {
  const errors: string[] = [];
  for (const field of fields) {
    if (field.required && !String(mapped[field.key] ?? "").trim()) {
      errors.push(`${field.label} is required.`);
    }
  }
  return errors;
}

function getLeadDuplicateKeyFromStrings(mapped: Record<string, string>): string | null {
  const email = String(mapped.email ?? "").trim().toLowerCase();
  const company = String(mapped.company ?? "").trim().toLowerCase();
  const phone = String(mapped.phoneNumber ?? "").trim();
  if (email && company) return `email:${email}|company:${company}`;
  if (phone && company) return `phone:${phone}|company:${company}`;
  return null;
}

function getLeadDuplicateKeyFromMapped(mapped: Record<string, unknown>): string | null {
  return getLeadDuplicateKeyFromStrings({
    email: String(mapped.email ?? ""),
    company: String(mapped.company ?? ""),
    phoneNumber: String(mapped.phoneNumber ?? ""),
  });
}

function plainSessionRow(row: ImportSessionRow): ImportSessionRow {
  return {
    rowNumber: row.rowNumber,
    raw: { ...row.raw },
    mapped: { ...(row.mapped as Record<string, unknown>) },
    errors: [...row.errors],
    warnings: [...row.warnings],
    isDuplicate: row.isDuplicate,
    valid: row.valid,
  };
}

function formatImportError(error: unknown): string {
  if (isDuplicateKeyError(error)) {
    const err = error as { keyPattern?: Record<string, number> };
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
    if (field === "leadCode") return "Duplicate lead code detected during import.";
    if (field === "clientRequestId") return "Duplicate idempotency key detected during import.";
    return "Duplicate record detected during import.";
  }
  return error instanceof Error ? error.message : "Import failed.";
}

async function validateLeadRow(
  mapped: Record<string, string>,
  users: UserLookup,
): Promise<{ mapped: Record<string, unknown>; errors: string[]; warnings: string[]; isDuplicate: boolean }> {
  const errors = validateRequired(IMPORT_FIELDS_BY_ENTITY.leads, mapped);
  const warnings: string[] = [];
  const output: Record<string, unknown> = { ...mapped };

  const status = safeString(mapped.status);
  if (status && !LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) {
    errors.push(`Invalid status: ${status}`);
  }
  const priority = safeString(mapped.priority);
  if (priority && !["Low", "Medium", "High", "Urgent"].includes(priority)) {
    errors.push(`Invalid priority: ${priority}`);
  }

  const assignedEmail = safeString(mapped.assignedToEmail);
  if (assignedEmail) {
    const userId = resolveUserRef(assignedEmail, users);
    if (!userId) errors.push(`Assigned user not found: ${assignedEmail}`);
    else output.assignedToId = userId;
  }

  const email = safeLower(mapped.email);
  const company = safeString(mapped.company);
  const phone = safeString(mapped.phoneNumber);
  const companyRegex = safeRegexExact(company);

  let isDuplicate = false;
  if (email && companyRegex) {
    const existing = await Lead.findOne({
      archived: { $ne: true },
      email,
      company: companyRegex,
    }).select("_id leadCode").lean();
    if (existing) {
      isDuplicate = true;
      errors.push(`Duplicate lead already exists (${existing.leadCode}).`);
    }
  } else if (phone && companyRegex) {
    const existing = await Lead.findOne({
      archived: { $ne: true },
      phoneNumber: phone,
      company: companyRegex,
    }).select("_id leadCode").lean();
    if (existing) {
      isDuplicate = true;
      errors.push(`Duplicate lead already exists (${existing.leadCode}).`);
    }
  }

  return { mapped: output, errors, warnings, isDuplicate };
}

async function validateCompanyRow(
  mapped: Record<string, string>,
  users: UserLookup,
): Promise<{ mapped: Record<string, unknown>; errors: string[]; warnings: string[]; isDuplicate: boolean }> {
  const errors = validateRequired(IMPORT_FIELDS_BY_ENTITY.companies, mapped);
  const output: Record<string, unknown> = { ...mapped };

  const status = safeString(mapped.status);
  if (status && !COMPANY_STATUSES.includes(status as (typeof COMPANY_STATUSES)[number])) {
    errors.push(`Invalid status: ${status}`);
  }
  const assignedEmail = safeString(mapped.assignedToEmail);
  if (assignedEmail) {
    const userId = resolveUserRef(assignedEmail, users);
    if (!userId) errors.push(`Assigned user not found: ${assignedEmail}`);
    else output.assignedToId = userId;
  }

  const name = safeString(mapped.name);
  const country = safeString(mapped.country);
  const nameRegex = safeRegexExact(name);
  let isDuplicate = false;
  if (nameRegex && country) {
    const existing = await Company.findOne({ name: nameRegex, country }).select("_id companyCode").lean();
    isDuplicate = !!existing;
    if (existing) errors.push(`Duplicate company already exists (${existing.companyCode}).`);
  }

  return { mapped: output, errors, warnings: [], isDuplicate };
}

async function validateCustomerRow(
  mapped: Record<string, string>,
): Promise<{ mapped: Record<string, unknown>; errors: string[]; warnings: string[]; isDuplicate: boolean }> {
  const errors = validateRequired(IMPORT_FIELDS_BY_ENTITY.customers, mapped);
  const output: Record<string, unknown> = { ...mapped };

  const companyCode = safeString(mapped.companyCode);
  const companyRegex = safeRegexExact(companyCode);
  const company = companyCode
    ? await Company.findOne({
        $or: [
          { companyCode },
          ...(companyRegex ? [{ name: companyRegex }] : []),
        ],
      }).select("_id companyCode name").lean()
    : null;

  if (!company) {
    if (companyCode) errors.push(`Company not found: ${companyCode}`);
  } else {
    output.companyId = company._id;
  }

  const status = safeString(mapped.status);
  if (status && !CUSTOMER_STATUSES.includes(status as (typeof CUSTOMER_STATUSES)[number])) {
    errors.push(`Invalid status: ${status}`);
  }

  const email = safeLower(mapped.email);
  let isDuplicate = false;
  if (company && email) {
    const existing = await Customer.findOne({ companyId: company._id, email }).select("_id customerCode").lean();
    if (existing) {
      isDuplicate = true;
      errors.push(`Duplicate customer already exists (${existing.customerCode}).`);
    }
  }

  output.isPrimaryContact = parseBoolean(mapped.isPrimaryContact);
  return { mapped: output, errors, warnings: [], isDuplicate };
}

async function validateFollowUpRow(
  mapped: Record<string, string>,
  users: UserLookup,
): Promise<{ mapped: Record<string, unknown>; errors: string[]; warnings: string[]; isDuplicate: boolean }> {
  const errors = validateRequired(IMPORT_FIELDS_BY_ENTITY["follow-ups"], mapped);
  const output: Record<string, unknown> = { ...mapped };

  const leadRef = safeString(mapped.leadCode);
  const lead = await resolveLeadRef(leadRef);
  if (!lead) errors.push(`Lead not found: ${leadRef || "(empty)"}`);
  else output.leadId = lead._id;

  const dueAt = parseDate(mapped.dueAt);
  if (!dueAt) errors.push("Invalid due date.");
  else output.dueAt = dueAt;

  const type = safeString(mapped.type);
  if (type && !FOLLOWUP_TYPES.includes(type as (typeof FOLLOWUP_TYPES)[number])) {
    errors.push(`Invalid follow-up type: ${type}`);
  } else if (!type) {
    errors.push("Type is required.");
  }

  const status = safeString(mapped.status);
  if (status && !FOLLOWUP_STATUSES.includes(status as (typeof FOLLOWUP_STATUSES)[number])) {
    errors.push(`Invalid follow-up status: ${status}`);
  }

  const assigneeRef = safeString(mapped.assignee || mapped.assignedToEmail);
  const assignee = resolveUserRef(assigneeRef, users);
  if (!assignee) errors.push(`Assigned user not found: ${assigneeRef || "(empty)"}`);
  else output.assignedToId = assignee;

  let isDuplicate = false;
  if (lead && dueAt && type) {
    const existing = await FollowUp.findOne({ leadId: lead._id, dueAt, type }).select("_id").lean();
    if (existing) {
      isDuplicate = true;
      errors.push("Duplicate follow-up already exists for this lead, date, and type.");
    }
  }

  return { mapped: output, errors, warnings: [], isDuplicate };
}

async function validateQuotationRow(
  mapped: Record<string, string>,
  users: UserLookup,
): Promise<{ mapped: Record<string, unknown>; errors: string[]; warnings: string[]; isDuplicate: boolean }> {
  const errors = validateRequired(IMPORT_FIELDS_BY_ENTITY.quotations, mapped);
  const output: Record<string, unknown> = { ...mapped };

  const status = safeString(mapped.status);
  if (status && !QUOTATION_STATUSES.includes(status as (typeof QUOTATION_STATUSES)[number])) {
    errors.push(`Invalid quotation status: ${status}`);
  }

  const totalAmount = parseNumber(mapped.totalAmount);
  if (safeString(mapped.totalAmount) && totalAmount == null) errors.push("Invalid total amount.");
  else output.totalAmount = totalAmount ?? 0;

  const leadCode = safeString(mapped.leadCode);
  if (leadCode) {
    const lead = await resolveLeadRef(leadCode);
    if (!lead) errors.push(`Lead not found: ${leadCode}`);
    else {
      output.leadId = lead._id;
      const fullLead = await Lead.findById(lead._id).select("companyId customerId").lean();
      output.companyId = fullLead?.companyId ?? null;
      output.customerId = fullLead?.customerId ?? null;
    }
  }

  const assignedEmail = safeString(mapped.assignedToEmail);
  if (assignedEmail) {
    const userId = resolveUserRef(assignedEmail, users);
    if (!userId) errors.push(`Assigned user not found: ${assignedEmail}`);
    else output.assignedToId = userId;
  }

  const title = safeString(mapped.title);
  const titleRegex = safeRegexExact(title);
  if (titleRegex) {
    const existing = await Quotation.findOne({
      title: titleRegex,
      ...(output.leadId ? { leadId: output.leadId } : {}),
    }).select("_id quotationCode").lean();
    if (existing) {
      return {
        mapped: output,
        errors: [...errors, `Duplicate quotation title already exists (${existing.quotationCode}).`],
        warnings: [],
        isDuplicate: true,
      };
    }
  }

  return { mapped: output, errors, warnings: [], isDuplicate: false };
}

async function validateOrderRow(
  mapped: Record<string, string>,
  users: UserLookup,
): Promise<{ mapped: Record<string, unknown>; errors: string[]; warnings: string[]; isDuplicate: boolean }> {
  const errors = validateRequired(IMPORT_FIELDS_BY_ENTITY.orders, mapped);
  const output: Record<string, unknown> = { ...mapped };

  const status = safeString(mapped.status);
  if (status && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    errors.push(`Invalid order status: ${status}`);
  }

  const orderValue = parseNumber(mapped.orderValue);
  if (safeString(mapped.orderValue) && orderValue == null) errors.push("Invalid order value.");
  else output.orderValue = orderValue ?? 0;

  const assignedEmail = safeString(mapped.assignedToEmail);
  if (assignedEmail) {
    const userId = resolveUserRef(assignedEmail, users);
    if (!userId) errors.push(`Assigned user not found: ${assignedEmail}`);
    else output.assignedToId = userId;
  }

  const customerName = safeString(mapped.customerName);
  const company = safeString(mapped.company);
  const products = safeString(mapped.products);
  const customerRegex = safeRegexExact(customerName);
  const companyRegex = safeRegexExact(company);
  const productsRegex = safeRegexExact(products);

  let isDuplicate = false;
  if (customerRegex && companyRegex && productsRegex) {
    const existing = await Order.findOne({
      customerName: customerRegex,
      company: companyRegex,
      products: productsRegex,
    }).select("_id orderCode").lean();
    isDuplicate = !!existing;
    if (existing) errors.push(`Duplicate order already exists (${existing.orderCode}).`);
  }

  return { mapped: output, errors, warnings: [], isDuplicate };
}

async function validateRow(
  entityType: ImportEntityType,
  mapped: Record<string, string>,
  users: UserLookup,
) {
  switch (entityType) {
    case "leads":
      return validateLeadRow(mapped, users);
    case "companies":
      return validateCompanyRow(mapped, users);
    case "customers":
      return validateCustomerRow(mapped);
    case "follow-ups":
      return validateFollowUpRow(mapped, users);
    case "quotations":
      return validateQuotationRow(mapped, users);
    case "orders":
      return validateOrderRow(mapped, users);
    default:
      throw new AppError("Unsupported import entity.", 400);
  }
}

async function importLeadRow(mapped: Record<string, unknown>, actor: AuthUser) {
  const leadCode = await nextLeadCode();
  await Lead.create({
    leadCode,
    name: String(mapped.name).trim(),
    company: String(mapped.company).trim(),
    phoneNumber: String(mapped.phoneNumber).trim(),
    whatsAppNumber: String(mapped.phoneNumber).trim(),
    email: String(mapped.email || "").toLowerCase(),
    country: String(mapped.country).trim(),
    source: mapped.source || "CSV Import",
    productInterest: mapped.productInterest || "General Commodity Inquiry",
    status: mapped.status || "New",
    priority: mapped.priority || "Medium",
    assignedToId: mapped.assignedToId ? (mapped.assignedToId as Types.ObjectId) : null,
    notes: mapped.notes || "",
    createdById: new Types.ObjectId(actor.id),
    archived: false,
  });
}

async function importCompanyRow(mapped: Record<string, unknown>, actor: AuthUser) {
  const companyCode = await nextCompanyCode();
  await Company.create({
    companyCode,
    name: safeString(mapped.name),
    legalName: safeString(mapped.legalName),
    country: safeString(mapped.country),
    city: safeString(mapped.city),
    industry: safeString(mapped.industry),
    website: safeString(mapped.website),
    status: safeString(mapped.status) || "active",
    assignedToId: mapped.assignedToId ? (mapped.assignedToId as Types.ObjectId) : null,
    notes: safeString(mapped.notes),
    createdById: new Types.ObjectId(actor.id),
  });
}

async function importCustomerRow(mapped: Record<string, unknown>, actor: AuthUser) {
  const customerCode = await nextCustomerCode();
  await Customer.create({
    customerCode,
    companyId: mapped.companyId,
    name: safeString(mapped.name),
    email: safeLower(mapped.email),
    phone: safeString(mapped.phone),
    whatsAppNumber: safeString(mapped.whatsAppNumber),
    designation: safeString(mapped.designation),
    isPrimaryContact: Boolean(mapped.isPrimaryContact),
    status: safeString(mapped.status) || "active",
    notes: safeString(mapped.notes),
    createdById: new Types.ObjectId(actor.id),
  });
}

async function importFollowUpRow(mapped: Record<string, unknown>, actor: AuthUser) {
  await FollowUp.create({
    leadId: mapped.leadId,
    assignedToId: mapped.assignedToId,
    dueAt: mapped.dueAt,
    type: safeString(mapped.type),
    status: safeString(mapped.status) || "Pending",
    outcome: safeString(mapped.outcome),
    notes: safeString(mapped.notes),
    createdById: new Types.ObjectId(actor.id),
  });
}

async function importQuotationRow(mapped: Record<string, unknown>, actor: AuthUser) {
  const quotationCode = await nextQuotationCode();
  const totalAmount = Number(mapped.totalAmount) || 0;
  const description = safeString(mapped.lineDescription || mapped.title) || "Imported line item";
  await Quotation.create({
    quotationCode,
    title: safeString(mapped.title),
    currency: safeString(mapped.currency) || "USD",
    status: safeString(mapped.status) || "Draft",
    leadId: mapped.leadId ? (mapped.leadId as Types.ObjectId) : null,
    companyId: mapped.companyId ? (mapped.companyId as Types.ObjectId) : null,
    customerId: mapped.customerId ? (mapped.customerId as Types.ObjectId) : null,
    assignedToId: mapped.assignedToId ? (mapped.assignedToId as Types.ObjectId) : null,
    paymentTerms: safeString(mapped.paymentTerms) || "Net 30",
    notes: safeString(mapped.notes),
    lineItems: [
      {
        description,
        quantity: "1",
        unitPrice: totalAmount,
        discountPercent: 0,
        amount: totalAmount,
      },
    ],
    subtotal: totalAmount,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    totalAmount,
    createdById: new Types.ObjectId(actor.id),
  });
}

async function importOrderRow(mapped: Record<string, unknown>, actor: AuthUser) {
  const orderCode = await nextOrderCode();
  await Order.create({
    orderCode,
    customerName: safeString(mapped.customerName),
    company: safeString(mapped.company),
    phone: safeString(mapped.phone),
    email: safeLower(mapped.email),
    country: safeString(mapped.country),
    products: safeString(mapped.products),
    quantity: safeString(mapped.quantity),
    orderValue: Number(mapped.orderValue) || 0,
    currency: safeString(mapped.currency) || "USD",
    status: safeString(mapped.status) || "Order Confirmed",
    destinationPort: safeString(mapped.destinationPort),
    shippingCarrier: safeString(mapped.shippingCarrier),
    trackingNumber: safeString(mapped.trackingNumber),
    assignedToId: mapped.assignedToId ? (mapped.assignedToId as Types.ObjectId) : null,
    notes: safeString(mapped.notes),
    createdById: new Types.ObjectId(actor.id),
  });
}

async function importRow(
  entityType: ImportEntityType,
  mapped: Record<string, unknown>,
  actor: AuthUser,
) {
  switch (entityType) {
    case "leads":
      return importLeadRow(mapped, actor);
    case "companies":
      return importCompanyRow(mapped, actor);
    case "customers":
      return importCustomerRow(mapped, actor);
    case "follow-ups":
      return importFollowUpRow(mapped, actor);
    case "quotations":
      return importQuotationRow(mapped, actor);
    case "orders":
      return importOrderRow(mapped, actor);
    default:
      throw new AppError("Unsupported import entity.", 400);
  }
}

export function getImportMeta(entityTypeRaw: string) {
  const entityType = assertEntityType(entityTypeRaw);
  const fieldDefs = IMPORT_FIELDS_BY_ENTITY[entityType];
  return {
    entityType,
    label: IMPORT_ENTITY_LABELS[entityType],
    permission: IMPORT_ENTITY_PERMISSION[entityType],
    fields: serializeImportFields(fieldDefs),
    limits: {
      maxFileBytes: IMPORT_MAX_FILE_BYTES,
      maxRows: IMPORT_MAX_ROWS,
      previewRows: IMPORT_PREVIEW_ROWS,
    },
  };
}

export async function previewImport(
  entityTypeRaw: string,
  file: Express.Multer.File,
  mappingOverride: Record<string, string | null> | undefined,
  actor: AuthUser,
) {
  const entityType = assertEntityType(entityTypeRaw);
  if (file.size > IMPORT_MAX_FILE_BYTES) {
    throw new AppError(IMPORT_MAX_FILE_ERROR, 413, "IMPORT_FILE_TOO_LARGE");
  }

  const content = file.buffer.toString("utf8");
  const parsed = parseCsv(content);
  if (parsed.headers.length === 0) {
    throw new AppError("CSV file has no headers.", 400, "IMPORT_EMPTY");
  }
  if (parsed.rows.length === 0) {
    throw new AppError("CSV file has no data rows.", 400, "IMPORT_EMPTY");
  }
  if (parsed.rows.length > IMPORT_MAX_ROWS) {
    throw new AppError(`Import exceeds the maximum of ${IMPORT_MAX_ROWS} rows.`, 413, "IMPORT_TOO_LARGE");
  }

  const fields = IMPORT_FIELDS_BY_ENTITY[entityType];
  const mapping = mappingOverride ?? suggestMapping(parsed.headers, fields);
  if (mappingOverride) {
    const duplicateKeys = getDuplicateMappedFieldKeys(mapping);
    if (duplicateKeys.length > 0) {
      throw new AppError(
        `Each CRM field can only be mapped once: ${duplicateKeys.join(", ")}`,
        400,
        "IMPORT_DUPLICATE_MAPPING",
      );
    }
    const missingRequired = getMissingRequiredMappings(fields, mapping);
    if (missingRequired.length > 0) {
      throw new AppError(
        `Required fields not mapped: ${missingRequired.map((field) => field.label).join(", ")}`,
        400,
        "IMPORT_REQUIRED_MAPPING",
      );
    }
  }
  const rawRows = rowsToObjects(parsed.headers, parsed.rows);
  const users = await loadUsersLookup();

  const rows: ImportSessionRow[] = [];
  const batchDuplicateKeys = new Set<string>();
  for (let index = 0; index < rawRows.length; index++) {
    const raw = rawRows[index];
    const mappedStrings = applyMapping(raw, mapping);
    let mapped: Record<string, unknown> = mappedStrings;
    let errors: string[] = [];
    let warnings: string[] = [];
    let isDuplicate = false;

    try {
      const result = await validateRow(entityType, mappedStrings, users);
      mapped = result.mapped;
      errors = result.errors;
      warnings = result.warnings;
      isDuplicate = result.isDuplicate;
    } catch (error) {
      errors = [error instanceof Error ? error.message : "Validation failed."];
    }

    if (entityType === "leads") {
      const batchKey = getLeadDuplicateKeyFromStrings(mappedStrings);
      if (batchKey && batchDuplicateKeys.has(batchKey)) {
        errors = [...errors, "Duplicate row in CSV (matches an earlier row)."];
        isDuplicate = true;
      } else if (batchKey) {
        batchDuplicateKeys.add(batchKey);
      }
    }

    rows.push({
      rowNumber: index + 2,
      raw,
      mapped,
      errors,
      warnings,
      isDuplicate,
      valid: errors.length === 0,
    });
  }

  const session = await ImportSession.create({
    userId: actor.id,
    entityType,
    fileName: file.originalname || "import.csv",
    mapping,
    headers: parsed.headers,
    rows,
    expiresAt: new Date(Date.now() + IMPORT_SESSION_TTL_MS),
  });

  const validCount = rows.filter((row) => row.valid).length;
  const errorCount = rows.length - validCount;
  const duplicateCount = rows.filter((row) => row.isDuplicate).length;

  return {
    sessionId: String(session._id),
    entityType,
    fileName: session.fileName,
    headers: parsed.headers,
    mapping,
    fields: serializeImportFields(fields),
    summary: {
      totalRows: rows.length,
      validRows: validCount,
      errorRows: errorCount,
      duplicateRows: duplicateCount,
    },
    previewRows: rows.slice(0, IMPORT_PREVIEW_ROWS),
  };
}

export async function confirmImport(sessionId: string, actor: AuthUser) {
  const session = await ImportSession.findById(sessionId).lean();
  if (!session) throw new AppError("Import session not found or expired.", 404);
  if (String(session.userId) !== actor.id) {
    throw new AppError("You do not have access to this import session.", 403);
  }

  const rows = session.rows ?? [];
  const importable = rows.filter((row) => row.valid);
  let imported = 0;
  const failed: ImportSessionRow[] = [];
  const batchImportedKeys = new Set<string>();

  for (const row of importable) {
    const plainRow = plainSessionRow(row);
    try {
      if (session.entityType === "leads") {
        const batchKey = getLeadDuplicateKeyFromMapped(plainRow.mapped);
        if (batchKey && batchImportedKeys.has(batchKey)) {
          failed.push({
            ...plainRow,
            valid: false,
            errors: [...plainRow.errors, "Duplicate row in import batch."],
            isDuplicate: true,
          });
          continue;
        }
      }

      await importRow(session.entityType, plainRow.mapped, actor);

      if (session.entityType === "leads") {
        const batchKey = getLeadDuplicateKeyFromMapped(plainRow.mapped);
        if (batchKey) batchImportedKeys.add(batchKey);
      }

      imported++;
    } catch (error) {
      failed.push({
        ...plainRow,
        valid: false,
        errors: [...plainRow.errors, formatImportError(error)],
      });
    }
  }

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: `${IMPORT_ENTITY_LABELS[session.entityType]} Imported`,
    entity: session.entityType,
    entityId: sessionId,
    details: `Imported ${imported} row(s) from ${session.fileName}. ${failed.length} failed, ${rows.length - importable.length} skipped as invalid/duplicate.`,
  });

  await ImportSession.findByIdAndDelete(sessionId);

  return {
    processed: importable.length,
    imported,
    failed: failed.length,
    skipped: rows.length - importable.length,
    duplicates: rows.filter((row) => row.isDuplicate).length,
    totalRows: rows.length,
    failedRows: failed,
  };
}

export async function downloadImportErrors(sessionId: string, actor: AuthUser, res: Response) {
  const session = await ImportSession.findById(sessionId);
  if (!session) throw new AppError("Import session not found or expired.", 404);
  if (String(session.userId) !== actor.id) {
    throw new AppError("You do not have access to this import session.", 403);
  }

  const errorRows = session.rows.filter((row) => !row.valid || row.errors.length > 0);
  let body = `\uFEFF${csvHeader(["Row Number", "Errors", ...session.headers])}`;
  for (const row of errorRows) {
    body += csvRow([
      row.rowNumber,
      row.errors.join("; "),
      ...session.headers.map((header) => row.raw[header] ?? ""),
    ]);
  }

  sendCsvResponse(res, exportFilename(`${session.entityType}_import_errors`), body);
}
