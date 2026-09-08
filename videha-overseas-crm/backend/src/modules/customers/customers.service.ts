import { Customer, CUSTOMER_STATUSES, type CustomerStatus } from "../../models/Customer";
import { Company } from "../../models/Company";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextCustomerCode } from "../../utils/codes";
import { serializeCustomer } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";

const POPULATE = [{ path: "companyId", select: "companyCode name country status" }];

function normalizeCustomerInput(body: Record<string, unknown>) {
  const status = body.status ? String(body.status) : undefined;
  if (status && !CUSTOMER_STATUSES.includes(status as CustomerStatus)) {
    throw new AppError(`Invalid customer status: ${status}`, 400);
  }

  return {
    companyId: optionalObjectId((body.companyId as string | null | undefined) ?? null),
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    email: body.email !== undefined ? String(body.email || "").toLowerCase().trim() : undefined,
    phone: body.phone !== undefined ? String(body.phone || "").trim() : undefined,
    whatsAppNumber:
      body.whatsAppNumber !== undefined ? String(body.whatsAppNumber || "") : undefined,
    designation: body.designation !== undefined ? String(body.designation || "") : undefined,
    isPrimaryContact:
      body.isPrimaryContact !== undefined ? Boolean(body.isPrimaryContact) : undefined,
    notes: body.notes !== undefined ? String(body.notes || "") : undefined,
    status: status as CustomerStatus | undefined,
    relatedLeadId: optionalObjectId((body.relatedLeadId as string | null | undefined) ?? null),
  };
}

export async function listCustomers(filters: {
  search?: string;
  status?: string;
  companyId?: string;
  page?: unknown;
  limit?: unknown;
}) {
  const { page, limit, skip } = parsePagination(filters);
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.companyId && filters.companyId !== "all") {
    assertObjectId(filters.companyId, "companyId");
    query.companyId = filters.companyId;
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { name: new RegExp(s, "i") },
      { email: new RegExp(s, "i") },
      { phone: new RegExp(s, "i") },
      { customerCode: new RegExp(s, "i") },
    ];
  }

  const [total, docs] = await Promise.all([
    Customer.countDocuments(query),
    Customer.find(query).populate(POPULATE).sort({ name: 1 }).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) => serializeCustomer(d.toObject() as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getCustomer(id: string) {
  assertObjectId(id, "customer id");
  const doc = await Customer.findById(id).populate(POPULATE);
  if (!doc) throw new AppError("Customer not found.", 404);
  return serializeCustomer(doc.toObject() as unknown as Record<string, unknown>);
}

export async function createCustomer(body: Record<string, unknown>, actor: AuthUser) {
  const input = normalizeCustomerInput(body);
  if (!input.companyId || !input.name) {
    throw new AppError("Company and contact name are required.", 400);
  }

  const company = await Company.findById(input.companyId);
  if (!company) throw new AppError("Company not found.", 404);

  if (input.isPrimaryContact) {
    await Customer.updateMany(
      { companyId: input.companyId, isPrimaryContact: true },
      { $set: { isPrimaryContact: false } },
    );
  }

  const customerCode = await nextCustomerCode();
  const doc = await Customer.create({
    customerCode,
    companyId: input.companyId,
    name: input.name,
    email: input.email || "",
    phone: input.phone || "",
    whatsAppNumber: input.whatsAppNumber || input.phone || "",
    designation: input.designation || "",
    isPrimaryContact: input.isPrimaryContact ?? false,
    notes: input.notes || "",
    status: input.status || "active",
    relatedLeadId: input.relatedLeadId,
    createdById: actor.id,
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Customer Created",
    entity: "Setting",
    entityId: String(doc._id),
    details: `Created customer ${doc.customerCode} (${doc.name}) for ${company.name}.`,
  });

  await doc.populate(POPULATE);
  return serializeCustomer(doc.toObject() as unknown as Record<string, unknown>);
}

export async function updateCustomer(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "customer id");
  const existing = await Customer.findById(id);
  if (!existing) throw new AppError("Customer not found.", 404);

  const input = normalizeCustomerInput(body);
  const expectedRevision = parseRevision(body);
  const setFields: Record<string, unknown> = {};

  if (body.companyId !== undefined) {
    if (!input.companyId) throw new AppError("Company is required.", 400);
    const company = await Company.findById(input.companyId);
    if (!company) throw new AppError("Company not found.", 404);
    setFields.companyId = input.companyId;
  }
  if (input.name !== undefined) setFields.name = input.name;
  if (input.email !== undefined) setFields.email = input.email;
  if (input.phone !== undefined) setFields.phone = input.phone;
  if (input.whatsAppNumber !== undefined) setFields.whatsAppNumber = input.whatsAppNumber;
  if (input.designation !== undefined) setFields.designation = input.designation;
  if (input.notes !== undefined) setFields.notes = input.notes;
  if (input.status !== undefined) setFields.status = input.status;
  if (body.relatedLeadId !== undefined) setFields.relatedLeadId = input.relatedLeadId;

  if (input.isPrimaryContact === true) {
    await Customer.updateMany(
      { companyId: existing.companyId, _id: { $ne: existing._id }, isPrimaryContact: true },
      { $set: { isPrimaryContact: false } },
    );
    setFields.isPrimaryContact = true;
  } else if (input.isPrimaryContact === false) {
    setFields.isPrimaryContact = false;
  }

  if (Object.keys(setFields).length === 0) {
    await existing.populate(POPULATE);
    return serializeCustomer(existing.toObject() as unknown as Record<string, unknown>);
  }

  const doc = await applyOptimisticUpdate(Customer, id, expectedRevision, setFields, {
    notFoundMessage: "Customer not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Customer Updated",
    entity: "Setting",
    entityId: id,
    details: `Updated customer ${doc.customerCode}.`,
  });

  await doc.populate(POPULATE);
  return serializeCustomer(doc.toObject() as unknown as Record<string, unknown>);
}
