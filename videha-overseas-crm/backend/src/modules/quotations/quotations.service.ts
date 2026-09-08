import { Types } from "mongoose";
import {
  Quotation,
  QUOTATION_STATUSES,
  type QuotationStatus,
  type IQuotationLineItem,
} from "../../models/Quotation";
import { Lead } from "../../models/Lead";
import { Company } from "../../models/Company";
import { Customer } from "../../models/Customer";
import { Order } from "../../models/Order";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextQuotationCode, nextOrderCode } from "../../utils/codes";
import { serializeQuotation } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { withTransaction } from "../../utils/transactions";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import type { AuthUser } from "../../middleware/auth";
import { buildAssigneeVisibilityFilter } from "../../utils/visibility";

const POPULATE = [
  { path: "assignedToId", select: "name email" },
  { path: "leadId", select: "leadCode company name country" },
  { path: "companyId", select: "companyCode name country" },
  { path: "customerId", select: "customerCode name email phone" },
  { path: "orderId", select: "orderCode status" },
];

function parseLineItems(raw: unknown): IQuotationLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    const quantity = String(row.quantity ?? "1");
    const unitPrice = Number(row.unitPrice ?? 0);
    const discountPercent = Math.min(100, Math.max(0, Number(row.discountPercent ?? 0)));
    const qtyNum = parseFloat(quantity) || 1;
    const gross = qtyNum * unitPrice;
    const amount = Math.round(gross * (1 - discountPercent / 100) * 100) / 100;
    return {
      description: String(row.description ?? "").trim(),
      quantity,
      unitPrice: Math.max(0, unitPrice),
      discountPercent,
      amount,
    };
  });
}

function computeTotals(
  lineItems: IQuotationLineItem[],
  discountAmount: number,
  taxRate: number,
) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const afterDiscount = Math.max(0, subtotal - Math.max(0, discountAmount));
  const taxAmount = Math.round(afterDiscount * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, totalAmount };
}

function normalizeQuotationInput(body: Record<string, unknown>, partial = false) {
  const status = body.status ? String(body.status) : undefined;
  if (status && !QUOTATION_STATUSES.includes(status as QuotationStatus)) {
    throw new AppError(`Invalid quotation status: ${status}`, 400);
  }

  const lineItems =
    body.lineItems !== undefined ? parseLineItems(body.lineItems) : undefined;
  if (lineItems && lineItems.some((item) => !item.description)) {
    throw new AppError("Each line item requires a description.", 400);
  }

  const discountAmount =
    body.discountAmount !== undefined ? Math.max(0, Number(body.discountAmount)) : undefined;
  const taxRate = body.taxRate !== undefined ? Math.max(0, Number(body.taxRate)) : undefined;

  let totals: ReturnType<typeof computeTotals> | undefined;
  if (lineItems !== undefined) {
    totals = computeTotals(
      lineItems,
      discountAmount ?? Number(body.discountAmount ?? 0),
      taxRate ?? Number(body.taxRate ?? 0),
    );
  }

  return {
    title: body.title !== undefined ? String(body.title).trim() : undefined,
    currency: body.currency !== undefined ? String(body.currency || "USD").trim() : undefined,
    lineItems,
    discountAmount,
    taxRate,
    subtotal: totals?.subtotal,
    taxAmount: totals?.taxAmount,
    totalAmount: totals?.totalAmount,
    validityDate:
      body.validityDate !== undefined
        ? body.validityDate
          ? new Date(String(body.validityDate))
          : null
        : undefined,
    paymentTerms:
      body.paymentTerms !== undefined ? String(body.paymentTerms || "") : undefined,
    notes: body.notes !== undefined ? String(body.notes || "") : undefined,
    status: status as QuotationStatus | undefined,
    leadId: optionalObjectId((body.leadId as string | null | undefined) ?? null),
    companyId: optionalObjectId((body.companyId as string | null | undefined) ?? null),
    customerId: optionalObjectId((body.customerId as string | null | undefined) ?? null),
    assignedToId: optionalObjectId(
      (body.assignedToId ?? body.assignedMemberId ?? null) as string | null,
    ),
  };
}

async function assertLinkedEntities(input: {
  leadId?: string | null;
  companyId?: string | null;
  customerId?: string | null;
}) {
  if (input.leadId) {
    const lead = await Lead.findById(input.leadId);
    if (!lead || lead.archived) throw new AppError("Linked lead not found.", 404);
  }
  if (input.companyId) {
    const company = await Company.findById(input.companyId);
    if (!company) throw new AppError("Linked company not found.", 404);
  }
  if (input.customerId) {
    const customer = await Customer.findById(input.customerId);
    if (!customer) throw new AppError("Linked customer not found.", 404);
  }
}

export async function listQuotations(
  filters: {
    search?: string;
    status?: string;
    leadId?: string;
    companyId?: string;
    customerId?: string;
    assignedToId?: string;
    page?: unknown;
    limit?: unknown;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  actor?: AuthUser,
) {
  const { page, limit, skip } = parsePagination(filters);
  const clauses: Record<string, unknown>[] = [];

  if (filters.status && filters.status !== "all") {
    if (!QUOTATION_STATUSES.includes(filters.status as QuotationStatus)) {
      throw new AppError(`Invalid quotation status: ${filters.status}`, 400);
    }
    clauses.push({ status: filters.status });
  }
  if (filters.leadId) {
    assertObjectId(filters.leadId, "leadId");
    clauses.push({ leadId: filters.leadId });
  }
  if (filters.companyId) {
    assertObjectId(filters.companyId, "companyId");
    clauses.push({ companyId: filters.companyId });
  }
  if (filters.customerId) {
    assertObjectId(filters.customerId, "customerId");
    clauses.push({ customerId: filters.customerId });
  }
  if (filters.assignedToId && filters.assignedToId !== "all") {
    assertObjectId(filters.assignedToId, "assignedToId");
    clauses.push({ assignedToId: filters.assignedToId });
  } else if (actor) {
    const visibility = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
    if (Object.keys(visibility).length > 0) clauses.push(visibility);
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    clauses.push({
      $or: [
        { quotationCode: new RegExp(s, "i") },
        { title: new RegExp(s, "i") },
        { notes: new RegExp(s, "i") },
      ],
    });
  }

  const query = clauses.length === 0 ? {} : clauses.length === 1 ? clauses[0] : { $and: clauses };
  const sortField = filters.sortBy === "validityDate" ? "validityDate" : "createdAt";
  const sortDir = filters.sortOrder === "asc" ? 1 : -1;

  const [total, docs] = await Promise.all([
    Quotation.countDocuments(query),
    Quotation.find(query).populate(POPULATE).sort({ [sortField]: sortDir }).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) =>
    serializeQuotation(d.toObject() as unknown as Record<string, unknown>),
  );
  return paginatedResponse(items, total, page, limit);
}

export async function getQuotation(id: string) {
  assertObjectId(id, "quotation id");
  const doc = await Quotation.findById(id).populate(POPULATE);
  if (!doc) throw new AppError("Quotation not found.", 404);
  return serializeQuotation(doc.toObject() as unknown as Record<string, unknown>);
}

export async function createQuotation(body: Record<string, unknown>, actor: AuthUser) {
  const clientRequestId = parseClientRequestId(body);
  if (clientRequestId) {
    const existing = await Quotation.findOne({ clientRequestId }).populate(POPULATE);
    if (existing) {
      return serializeQuotation(existing.toObject() as unknown as Record<string, unknown>);
    }
  }

  const input = normalizeQuotationInput(body);
  if (!input.title) throw new AppError("Quotation title is required.", 400);
  if (!input.lineItems?.length) {
    throw new AppError("At least one line item is required.", 400);
  }

  await assertLinkedEntities(input);

  const assignedToId = input.assignedToId ?? actor.id;
  const assignee = await User.findById(assignedToId);
  if (!assignee) throw new AppError("Assigned member not found.", 400);

  const quotationCode = await nextQuotationCode();
  const doc = await Quotation.create({
    quotationCode,
    title: input.title,
    currency: input.currency || "USD",
    lineItems: input.lineItems,
    subtotal: input.subtotal ?? 0,
    discountAmount: input.discountAmount ?? 0,
    taxRate: input.taxRate ?? 0,
    taxAmount: input.taxAmount ?? 0,
    totalAmount: input.totalAmount ?? 0,
    validityDate: input.validityDate ?? null,
    paymentTerms: input.paymentTerms ?? "",
    notes: input.notes ?? "",
    status: input.status && input.status !== "Draft" ? input.status : "Draft",
    leadId: input.leadId,
    companyId: input.companyId,
    customerId: input.customerId,
    assignedToId,
    createdById: actor.id,
    clientRequestId,
  });

  await doc.populate(POPULATE);
  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Quotation Created",
    entity: "Quotation",
    entityId: String(doc._id),
    details: `${doc.quotationCode}: ${doc.title}`,
  });

  return serializeQuotation(doc.toObject() as unknown as Record<string, unknown>);
}

export async function updateQuotation(
  id: string,
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "quotation id");
  const existing = await Quotation.findById(id);
  if (!existing) throw new AppError("Quotation not found.", 404);

  if (["Accepted", "Cancelled"].includes(existing.status)) {
    throw new AppError(`Cannot edit quotation in ${existing.status} status.`, 400);
  }

  const input = normalizeQuotationInput(body, true);
  await assertLinkedEntities(input);

  const update: Record<string, unknown> = {};
  for (const key of [
    "title",
    "currency",
    "lineItems",
    "discountAmount",
    "taxRate",
    "subtotal",
    "taxAmount",
    "totalAmount",
    "validityDate",
    "paymentTerms",
    "notes",
    "leadId",
    "companyId",
    "customerId",
    "assignedToId",
  ] as const) {
    if (input[key] !== undefined) update[key] = input[key];
  }

  if (input.lineItems) {
    const totals = computeTotals(
      input.lineItems,
      (input.discountAmount ?? existing.discountAmount) as number,
      (input.taxRate ?? existing.taxRate) as number,
    );
    update.subtotal = totals.subtotal;
    update.taxAmount = totals.taxAmount;
    update.totalAmount = totals.totalAmount;
  }

  const revision = parseRevision(body);
  const updated = await applyOptimisticUpdate(Quotation, id, revision, update, {
    notFoundMessage: "Quotation not found.",
  });
  await updated.populate(POPULATE);

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Quotation Updated",
    entity: "Quotation",
    entityId: id,
    details: updated.quotationCode,
  });

  return serializeQuotation(updated.toObject() as unknown as Record<string, unknown>);
}

export async function updateQuotationStatus(
  id: string,
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "quotation id");
  const nextStatus = String(body.status || "");
  if (!QUOTATION_STATUSES.includes(nextStatus as QuotationStatus)) {
    throw new AppError(`Invalid quotation status: ${nextStatus}`, 400);
  }

  const revision = parseRevision(body);
  const createOrder = Boolean(body.createOrder);

  return withTransaction(async (session) => {
    const existing = await Quotation.findById(id).session(session);
    if (!existing) throw new AppError("Quotation not found.", 404);

    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "Sent" && !existing.sentAt) update.sentAt = new Date();
    if (nextStatus === "Accepted") update.acceptedAt = new Date();

    const updated = await applyOptimisticUpdate(Quotation, id, revision, update, {
      session,
      notFoundMessage: "Quotation not found.",
    });
    let orderPayload: Record<string, unknown> | null = null;

    if (nextStatus === "Accepted" && createOrder && !updated.orderId) {
      orderPayload = await createOrderFromQuotation(updated, actor, session);
      updated.orderId = orderPayload.id as Types.ObjectId;
      await updated.save({ session });
    }

    if (updated.leadId && nextStatus === "Sent") {
      await Lead.updateOne(
        { _id: updated.leadId, status: { $nin: ["Won", "Lost", "Converted"] } },
        { $set: { status: "Quotation Sent" } },
        { session },
      );
    }

    await writeAudit(
      {
        userId: actor.id,
        userName: actor.name,
        userRole: actor.roleName,
        action: "Quotation Status Changed",
        entity: "Quotation",
        entityId: id,
        details: `${updated.quotationCode} → ${nextStatus}`,
      },
      session,
    );

    await updated.populate(POPULATE);
    const result = serializeQuotation(updated.toObject() as unknown as Record<string, unknown>);
    return orderPayload ? { quotation: result, order: orderPayload } : { quotation: result };
  });
}

async function createOrderFromQuotation(
  quotation: InstanceType<typeof Quotation>,
  actor: AuthUser,
  session: import("mongoose").ClientSession,
) {
  let customerName = "Customer";
  let companyName = "Company";
  let phone = "";
  let email = "";
  let country = "India";

  if (quotation.customerId) {
    const customer = await Customer.findById(quotation.customerId).session(session);
    if (customer) {
      customerName = customer.name;
      phone = customer.phone || "";
      email = customer.email || "";
    }
  }
  if (quotation.companyId) {
    const company = await Company.findById(quotation.companyId).session(session);
    if (company) {
      companyName = company.name;
      country = company.country || country;
    }
  }
  if (quotation.leadId) {
    const lead = await Lead.findById(quotation.leadId).session(session);
    if (lead) {
      if (!quotation.customerId) customerName = lead.name;
      if (!quotation.companyId) companyName = lead.company;
      if (!phone) phone = lead.phoneNumber || "";
      if (!email) email = lead.email || "";
      country = lead.country || country;
    }
  }

  const products = quotation.lineItems.map((i) => i.description).join(", ");
  const quantity = quotation.lineItems.map((i) => i.quantity).join(", ");
  const expectedDelivery = quotation.validityDate || new Date(Date.now() + 30 * 86400000);

  const order = await Order.create(
    [
      {
        orderCode: await nextOrderCode(),
        customerName,
        company: companyName,
        phone,
        email,
        country,
        products,
        quantity,
        orderValue: quotation.totalAmount,
        currency: quotation.currency,
        assignedToId: quotation.assignedToId,
        status: "Order Confirmed",
        expectedDelivery,
        notes: `Created from quotation ${quotation.quotationCode}`,
        relatedLeadId: quotation.leadId,
        companyId: quotation.companyId,
        customerId: quotation.customerId,
        createdById: actor.id,
      },
    ],
    { session },
  );

  const created = order[0];
  await createNotification(
    {
      userId: String(quotation.assignedToId ?? actor.id),
      type: "system",
      title: "Order created from quotation",
      message: `Order ${created.orderCode} was created from ${quotation.quotationCode}.`,
      linkUrl: `/orders`,
    },
    session,
  );

  return {
    id: created._id,
    orderCode: created.orderCode,
    status: created.status,
    totalAmount: created.orderValue,
    currency: created.currency,
  };
}

export async function deleteQuotation(id: string, actor: AuthUser) {
  assertObjectId(id, "quotation id");
  const doc = await Quotation.findById(id);
  if (!doc) throw new AppError("Quotation not found.", 404);

  if (doc.status === "Accepted") {
    throw new AppError("Accepted quotations cannot be deleted. Cancel instead.", 400);
  }

  await Quotation.findByIdAndDelete(id);
  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Quotation Deleted",
    entity: "Quotation",
    entityId: id,
    details: doc.quotationCode,
  });
}
