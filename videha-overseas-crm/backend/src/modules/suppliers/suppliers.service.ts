import { Supplier, SUPPLIER_STATUSES, type SupplierStatus } from "../../models/Supplier";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { nextSupplierCode } from "../../utils/codes";
import { serializeSupplier } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import { exportFilename } from "../../utils/csv";
import { streamCsvExport } from "../../utils/csvExport";
import { SUPPLIER_EXPORT_COLUMNS } from "../../constants/exportColumns";
import { buildSupplierNormalizedFields } from "../../services/supplierResolution.service";
import { normalizeCurrencyCode } from "../../utils/currency";

const SORTABLE_FIELDS: Record<string, string> = {
  supplierCode: "supplierCode",
  supplierName: "supplierName",
  companyName: "companyName",
  country: "country",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

function buildSuppliersQuery(filters: {
  search?: string;
  status?: string;
  country?: string;
}) {
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.country && filters.country !== "all") query.country = filters.country;

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { supplierName: new RegExp(s, "i") },
      { companyName: new RegExp(s, "i") },
      { supplierCode: new RegExp(s, "i") },
      { contactPerson: new RegExp(s, "i") },
      { email: new RegExp(s, "i") },
      { phone: new RegExp(s, "i") },
      { country: new RegExp(s, "i") },
      { taxId: new RegExp(s, "i") },
      { productsSupplied: new RegExp(s, "i") },
    ];
  }

  return query;
}

function resolveSort(sortBy?: string, sortOrder?: string) {
  const field = SORTABLE_FIELDS[sortBy || "supplierName"] || "supplierName";
  const direction = sortOrder === "desc" ? -1 : 1;
  return { [field]: direction } as Record<string, 1 | -1>;
}

function normalizeSupplierInput(body: Record<string, unknown>) {
  const status = body.status ? String(body.status) : undefined;
  if (status && !SUPPLIER_STATUSES.includes(status as SupplierStatus)) {
    throw new AppError(`Invalid supplier status: ${status}`, 400);
  }

  const norm = buildSupplierNormalizedFields({
    supplierName: body.supplierName !== undefined ? String(body.supplierName) : undefined,
    companyName: body.companyName !== undefined ? String(body.companyName || "") : undefined,
    email: body.email !== undefined ? String(body.email || "") : undefined,
    phone: body.phone !== undefined ? String(body.phone || "") : undefined,
  });

  return {
    supplierName: body.supplierName !== undefined ? norm.supplierName : undefined,
    companyName: body.companyName !== undefined ? norm.companyName : undefined,
    contactPerson:
      body.contactPerson !== undefined ? String(body.contactPerson || "").trim() : undefined,
    email: body.email !== undefined ? norm.normalizedEmail : undefined,
    normalizedEmail: body.email !== undefined ? norm.normalizedEmail : undefined,
    phone: body.phone !== undefined ? String(body.phone || "").trim() : undefined,
    normalizedPhone: body.phone !== undefined ? norm.normalizedPhone : undefined,
    normalizedSupplierName:
      body.supplierName !== undefined ? norm.normalizedSupplierName : undefined,
    normalizedCompanyName:
      body.companyName !== undefined || body.supplierName !== undefined
        ? norm.normalizedCompanyName
        : undefined,
    address: body.address !== undefined ? String(body.address || "") : undefined,
    country: body.country !== undefined ? String(body.country || "").trim() : undefined,
    taxId: body.taxId !== undefined ? String(body.taxId || "").trim() : undefined,
    paymentTerms: body.paymentTerms !== undefined ? String(body.paymentTerms || "") : undefined,
    currency:
      body.currency !== undefined ? normalizeCurrencyCode(String(body.currency || "USD")) : undefined,
    productsSupplied:
      body.productsSupplied !== undefined ? String(body.productsSupplied || "") : undefined,
    status: status as SupplierStatus | undefined,
    notes: body.notes !== undefined ? String(body.notes || "") : undefined,
  };
}

export async function exportSuppliers(
  filters: { search?: string; status?: string; country?: string },
  actor: AuthUser,
) {
  const query = buildSuppliersQuery(filters);
  const result = await streamCsvExport({
    columns: SUPPLIER_EXPORT_COLUMNS,
    count: () => Supplier.countDocuments(query),
    fetchBatch: async (skip, limit) => {
      const docs = await Supplier.find(query).sort({ supplierName: 1 }).skip(skip).limit(limit);
      return docs.map((d) =>
        serializeSupplier(d.toObject() as unknown as Record<string, unknown>) as Record<string, unknown>,
      );
    },
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Suppliers Exported",
    entity: "Supplier",
    entityId: "export",
    details: `Exported ${result.total} supplier(s) to CSV.`,
  });

  return { body: result.body, filename: exportFilename("suppliers"), total: result.total };
}

export async function listSuppliers(filters: {
  search?: string;
  status?: string;
  country?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: unknown;
  limit?: unknown;
}) {
  const { page, limit, skip } = parsePagination(filters);
  const query = buildSuppliersQuery(filters);
  const sort = resolveSort(filters.sortBy, filters.sortOrder);

  const [total, docs] = await Promise.all([
    Supplier.countDocuments(query),
    Supplier.find(query).sort(sort).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) => serializeSupplier(d.toObject() as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getSupplier(id: string) {
  assertObjectId(id, "supplier id");
  const doc = await Supplier.findById(id);
  if (!doc) throw new AppError("Supplier not found.", 404);
  return serializeSupplier(doc.toObject() as unknown as Record<string, unknown>);
}

export async function createSupplier(body: Record<string, unknown>, actor: AuthUser) {
  const input = normalizeSupplierInput(body);
  if (!input.supplierName) {
    throw new AppError("Supplier name is required.", 400);
  }

  const supplierCode = await nextSupplierCode();
  const norm = buildSupplierNormalizedFields({
    supplierName: input.supplierName,
    companyName: input.companyName || input.supplierName,
    email: input.email,
    phone: input.phone,
  });

  const doc = await Supplier.create({
    supplierCode,
    supplierName: norm.supplierName,
    companyName: norm.companyName || norm.supplierName,
    contactPerson: input.contactPerson || "",
    email: norm.normalizedEmail,
    normalizedEmail: norm.normalizedEmail,
    phone: input.phone || "",
    normalizedPhone: norm.normalizedPhone,
    address: input.address || "",
    country: input.country || "",
    taxId: input.taxId || "",
    paymentTerms: input.paymentTerms || "",
    currency: input.currency || "USD",
    productsSupplied: input.productsSupplied || "",
    status: input.status || "active",
    notes: input.notes || "",
    normalizedSupplierName: norm.normalizedSupplierName,
    normalizedCompanyName: norm.normalizedCompanyName,
    createdById: actor.id,
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Supplier Created",
    entity: "Supplier",
    entityId: String(doc._id),
    details: `Created supplier ${doc.supplierCode} (${doc.supplierName}).`,
  });

  return serializeSupplier(doc.toObject() as unknown as Record<string, unknown>);
}

export async function updateSupplier(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "supplier id");
  const existing = await Supplier.findById(id);
  if (!existing) throw new AppError("Supplier not found.", 404);

  const input = normalizeSupplierInput(body);
  const expectedRevision = parseRevision(body);
  const setFields: Record<string, unknown> = {};

  if (input.supplierName !== undefined) {
    setFields.supplierName = input.supplierName;
    setFields.normalizedSupplierName = input.normalizedSupplierName;
  }
  if (input.companyName !== undefined) {
    setFields.companyName = input.companyName;
    setFields.normalizedCompanyName = input.normalizedCompanyName;
  }
  if (input.contactPerson !== undefined) setFields.contactPerson = input.contactPerson;
  if (input.email !== undefined) {
    setFields.email = input.normalizedEmail;
    setFields.normalizedEmail = input.normalizedEmail;
  }
  if (input.phone !== undefined) {
    setFields.phone = input.phone;
    setFields.normalizedPhone = input.normalizedPhone;
  }
  if (input.address !== undefined) setFields.address = input.address;
  if (input.country !== undefined) setFields.country = input.country;
  if (input.taxId !== undefined) setFields.taxId = input.taxId;
  if (input.paymentTerms !== undefined) setFields.paymentTerms = input.paymentTerms;
  if (input.currency !== undefined) setFields.currency = input.currency;
  if (input.productsSupplied !== undefined) setFields.productsSupplied = input.productsSupplied;
  if (input.notes !== undefined) setFields.notes = input.notes;
  if (input.status !== undefined) setFields.status = input.status;

  if (Object.keys(setFields).length === 0) {
    return serializeSupplier(existing.toObject() as unknown as Record<string, unknown>);
  }

  const doc = await applyOptimisticUpdate(Supplier, id, expectedRevision, setFields, {
    notFoundMessage: "Supplier not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Supplier Updated",
    entity: "Supplier",
    entityId: id,
    details: `Updated supplier ${doc.supplierCode}.`,
  });

  return serializeSupplier(doc.toObject() as unknown as Record<string, unknown>);
}

export async function deleteSupplier(id: string, actor: AuthUser) {
  assertObjectId(id, "supplier id");
  const doc = await Supplier.findById(id);
  if (!doc) throw new AppError("Supplier not found.", 404);

  doc.status = "inactive";
  await doc.save();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Supplier Deactivated",
    entity: "Supplier",
    entityId: id,
    details: `Deactivated supplier ${doc.supplierCode}.`,
  });

  return serializeSupplier(doc.toObject() as unknown as Record<string, unknown>);
}
