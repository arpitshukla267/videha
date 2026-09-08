import {
  normalizeImportToken,
  camelFromSnake,
  safeString,
} from "../utils/importSafe";

export type ImportEntityType =
  | "leads"
  | "companies"
  | "customers"
  | "follow-ups"
  | "quotations"
  | "orders";

export type ImportFieldDef = {
  key: string;
  label: string;
  required?: boolean;
  aliases?: string[];
};

export const IMPORT_ENTITY_TYPES: ImportEntityType[] = [
  "leads",
  "companies",
  "customers",
  "follow-ups",
  "quotations",
  "orders",
];

export const IMPORT_ENTITY_LABELS: Record<ImportEntityType, string> = {
  leads: "Leads",
  companies: "Companies",
  customers: "Customers",
  "follow-ups": "Follow-ups",
  quotations: "Quotations",
  orders: "Orders",
};

export const IMPORT_ENTITY_PERMISSION: Record<ImportEntityType, string> = {
  leads: "leads.create",
  companies: "companies.create",
  customers: "customers.create",
  "follow-ups": "followups.create",
  quotations: "quotations.create",
  orders: "orders.create",
};

export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_FILE_ERROR = "CSV file must be 5MB or smaller.";
export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_PREVIEW_ROWS = 50;
export const IMPORT_SESSION_TTL_MS = 30 * 60 * 1000;

export const LEAD_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "name", label: "Name", required: true, aliases: ["Buyer Name", "Contact Name"] },
  { key: "company", label: "Company", required: true },
  { key: "phoneNumber", label: "Phone", required: true, aliases: ["Phone Number", "Mobile"] },
  { key: "country", label: "Country", required: true },
  { key: "email", label: "Email" },
  { key: "source", label: "Source", aliases: ["Lead Source"] },
  { key: "productInterest", label: "Product Interest", aliases: ["Product of Interest", "product_interest"] },
  { key: "status", label: "Status", aliases: ["Lead Status"] },
  { key: "priority", label: "Priority" },
  {
    key: "assignedToEmail",
    label: "Assigned To Email",
    aliases: ["Assigned Member Email", "assigned_user", "assigned_to", "assigned_to_email"],
  },
  { key: "notes", label: "Notes" },
];

export const COMPANY_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "name", label: "Name", required: true, aliases: ["Company Name"] },
  { key: "country", label: "Country", required: true },
  { key: "legalName", label: "Legal Name", aliases: ["legal_name"] },
  { key: "city", label: "City" },
  { key: "industry", label: "Industry" },
  { key: "website", label: "Website" },
  { key: "status", label: "Status" },
  {
    key: "assignedToEmail",
    label: "Assigned To Email",
    aliases: ["assigned_user", "assigned_to", "assigned_to_email"],
  },
  { key: "notes", label: "Notes" },
];

export const CUSTOMER_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "name", label: "Name", required: true, aliases: ["Contact Name"] },
  { key: "companyCode", label: "Company Code", required: true, aliases: ["Company", "company_code"] },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone", aliases: ["Phone Number"] },
  { key: "whatsAppNumber", label: "WhatsApp", aliases: ["WhatsApp Number", "whatsapp_number"] },
  { key: "designation", label: "Designation" },
  { key: "isPrimaryContact", label: "Primary Contact", aliases: ["Is Primary Contact"] },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

export const FOLLOWUP_IMPORT_FIELDS: ImportFieldDef[] = [
  {
    key: "leadCode",
    label: "Lead",
    required: true,
    aliases: ["lead", "lead_code", "Lead Code", "Lead"],
  },
  {
    key: "assignee",
    label: "Assignee",
    required: true,
    aliases: [
      "assignee",
      "assigned_to",
      "assigned_user",
      "Assigned To Email",
      "assigned_to_email",
      "Assigned Member",
    ],
  },
  {
    key: "dueAt",
    label: "Due At",
    required: true,
    aliases: ["Due Date", "dueDate", "due_date", "Scheduled At", "next_follow_up", "next_followup", "due_at"],
  },
  { key: "type", label: "Type", required: true },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
  { key: "outcome", label: "Outcome" },
];

export const QUOTATION_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Status" },
  { key: "totalAmount", label: "Total Amount", aliases: ["Amount", "Total", "total_amount"] },
  { key: "leadCode", label: "Lead Code", aliases: ["lead_code"] },
  { key: "paymentTerms", label: "Payment Terms", aliases: ["payment_terms"] },
  { key: "lineDescription", label: "Line Description", aliases: ["Description", "Product", "line_description"] },
  { key: "assignedToEmail", label: "Assigned To Email", aliases: ["assigned_user", "assigned_to", "assigned_to_email"] },
  { key: "notes", label: "Notes" },
];

export const ORDER_IMPORT_FIELDS: ImportFieldDef[] = [
  {
    key: "customerName",
    label: "Customer Name",
    required: true,
    aliases: ["customer_name", "Customer", "Buyer Name", "Contact Name"],
  },
  {
    key: "company",
    label: "Company",
    required: true,
    aliases: ["Company / Buyer", "Buyer", "company_name", "Buyer Company"],
  },
  {
    key: "country",
    label: "Country",
    required: true,
    aliases: ["Destination Country", "destination_country"],
  },
  {
    key: "products",
    label: "Products",
    required: true,
    aliases: ["Products Ordered", "products_ordered", "Product", "Items"],
  },
  { key: "phone", label: "Phone", aliases: ["phone_number"] },
  { key: "email", label: "Email" },
  { key: "quantity", label: "Quantity" },
  { key: "orderValue", label: "Order Value", aliases: ["Value", "Amount", "order_value"] },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Status", aliases: ["Order Status"] },
  { key: "destinationPort", label: "Destination Port", aliases: ["destination_port"] },
  { key: "shippingCarrier", label: "Shipping Carrier", aliases: ["Carrier", "shipping_carrier"] },
  { key: "trackingNumber", label: "Tracking Number", aliases: ["tracking_number"] },
  { key: "assignedToEmail", label: "Assigned To Email", aliases: ["assigned_user", "assigned_to", "assigned_to_email"] },
  { key: "notes", label: "Notes" },
];

export const IMPORT_FIELDS_BY_ENTITY: Record<ImportEntityType, ImportFieldDef[]> = {
  leads: LEAD_IMPORT_FIELDS,
  companies: COMPANY_IMPORT_FIELDS,
  customers: CUSTOMER_IMPORT_FIELDS,
  "follow-ups": FOLLOWUP_IMPORT_FIELDS,
  quotations: QUOTATION_IMPORT_FIELDS,
  orders: ORDER_IMPORT_FIELDS,
};

export function normalizeHeader(value: unknown): string {
  return normalizeImportToken(value);
}

export function serializeImportFields(fields: ImportFieldDef[]) {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: Boolean(field.required),
    aliases: field.aliases ?? [],
  }));
}

function registerLookupKey(lookup: Map<string, string>, raw: unknown, fieldKey: string) {
  const text = safeString(raw);
  if (!text) return;
  lookup.set(normalizeHeader(text), fieldKey);
  lookup.set(normalizeHeader(fieldKey), fieldKey);
  if (text.includes("_")) {
    lookup.set(normalizeHeader(camelFromSnake(text)), fieldKey);
  }
  const snakeFromCamel = fieldKey.replace(/([A-Z])/g, "_$1").toLowerCase();
  lookup.set(normalizeHeader(snakeFromCamel), fieldKey);
}

export function buildFieldLookup(fields: ImportFieldDef[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const field of fields) {
    if (!safeString(field.key)) continue;
    registerLookupKey(lookup, field.key, field.key);
    registerLookupKey(lookup, field.label, field.key);
    for (const alias of field.aliases || []) {
      registerLookupKey(lookup, alias, field.key);
    }
  }
  return lookup;
}

export function resolveHeaderToFieldKey(header: unknown, lookup: Map<string, string>): string | null {
  const text = safeString(header);
  if (!text) return null;
  const attempts = [normalizeHeader(text), normalizeHeader(camelFromSnake(text))];
  for (const key of attempts) {
    if (!key) continue;
    const match = lookup.get(key);
    if (match) return match;
  }
  return null;
}

export function suggestMapping(
  headers: string[],
  fields: ImportFieldDef[],
): Record<string, string | null> {
  const lookup = buildFieldLookup(fields);
  const usedKeys = new Set<string>();
  const mapping: Record<string, string | null> = {};

  for (const header of headers) {
    const headerText = safeString(header);
    if (!headerText) {
      mapping[String(header ?? "")] = null;
      continue;
    }
    const candidate = resolveHeaderToFieldKey(headerText, lookup);
    if (candidate && !usedKeys.has(candidate)) {
      mapping[header] = candidate;
      usedKeys.add(candidate);
    } else {
      mapping[header] = null;
    }
  }

  return mapping;
}

export function getMissingRequiredMappings(
  fields: ImportFieldDef[],
  mapping: Record<string, string | null>,
): ImportFieldDef[] {
  const mappedKeys = new Set(
    Object.values(mapping).filter((value): value is string => Boolean(value)),
  );
  return fields.filter((field) => field.required && !mappedKeys.has(field.key));
}

export function getDuplicateMappedFieldKeys(mapping: Record<string, string | null>): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const key of Object.values(mapping)) {
    if (!key) continue;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}
