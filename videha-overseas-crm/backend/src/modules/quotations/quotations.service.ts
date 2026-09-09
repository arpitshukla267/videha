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
import { OrderStatusHistory } from "../../models/OrderStatusHistory";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId, refId } from "../../utils/objectId";
import { nextQuotationCode, nextOrderCode, isDuplicateKeyError } from "../../utils/codes";
import { serializeQuotation } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { withTransaction } from "../../utils/transactions";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import type { AuthUser } from "../../middleware/auth";
import {
  assertQuotationDelete,
  assertQuotationEdit,
  assertQuotationOrderCreate,
  assertQuotationStatusChange,
  assertQuotationView,
  buildQuotationVisibilityFilter,
} from "../../utils/entityAccess";
import { exportFilename } from "../../utils/csv";
import { streamCsvExport } from "../../utils/csvExport";
import { QUOTATION_EXPORT_COLUMNS } from "../../constants/exportColumns";

const POPULATE = [
  { path: "assignedToId", select: "name email" },
  { path: "leadId", select: "leadCode company name country email phoneNumber" },
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

async function resolveLeadLinks(leadId: string) {
  const lead = await Lead.findById(leadId).select("companyId customerId assignedToId leadCode company name");
  if (!lead || lead.archived) throw new AppError("Linked lead not found.", 404);
  return {
    companyId: lead.companyId ? String(lead.companyId) : null,
    customerId: lead.customerId ? String(lead.customerId) : null,
    assignedToId: lead.assignedToId ? String(lead.assignedToId) : null,
    leadCode: lead.leadCode,
    leadLabel: `${lead.leadCode} — ${lead.company || lead.name}`,
  };
}

async function applyLeadLinks(
  input: {
    leadId?: string | null;
    companyId?: string | null;
    customerId?: string | null;
    assignedToId?: string | null;
  },
  actor: AuthUser,
  requireLead = false,
) {
  if (!input.leadId) {
    if (requireLead) throw new AppError("Lead is required for quotations.", 400);
    return input;
  }

  assertObjectId(input.leadId, "leadId");
  const links = await resolveLeadLinks(input.leadId);

  return {
    ...input,
    leadId: input.leadId,
    companyId: input.companyId ?? links.companyId,
    customerId: input.customerId ?? links.customerId,
    assignedToId: input.assignedToId ?? links.assignedToId ?? actor.id,
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

async function buildQuotationsQuery(
  filters: {
    search?: string;
    status?: string;
    leadId?: string;
    companyId?: string;
    customerId?: string;
    assignedToId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  actor?: AuthUser,
) {
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
    const visibility = await buildQuotationVisibilityFilter(actor);
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
  return { query, sort: { [sortField]: sortDir } as Record<string, 1 | -1> };
}

export async function exportQuotations(
  filters: {
    search?: string;
    status?: string;
    leadId?: string;
    companyId?: string;
    customerId?: string;
    assignedToId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  actor: AuthUser,
) {
  const { query, sort } = await buildQuotationsQuery(filters, actor);
  const result = await streamCsvExport({
    columns: QUOTATION_EXPORT_COLUMNS,
    count: () => Quotation.countDocuments(query),
    fetchBatch: async (skip, limit) => {
      const docs = await Quotation.find(query).populate(POPULATE).sort(sort).skip(skip).limit(limit);
      return docs.map((d) =>
        serializeQuotation(d.toObject() as unknown as Record<string, unknown>) as Record<string, unknown>,
      );
    },
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Quotations Exported",
    entity: "Quotation",
    entityId: "export",
    details: `Exported ${result.total} quotation(s) to CSV.`,
  });

  return { body: result.body, filename: exportFilename("quotations"), total: result.total };
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
  const { query, sort } = await buildQuotationsQuery(filters, actor);

  const [total, docs] = await Promise.all([
    Quotation.countDocuments(query),
    Quotation.find(query).populate(POPULATE).sort(sort).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) =>
    serializeQuotation(d.toObject() as unknown as Record<string, unknown>),
  );
  return paginatedResponse(items, total, page, limit);
}

export async function getQuotation(id: string, actor?: AuthUser) {
  assertObjectId(id, "quotation id");
  const doc = await Quotation.findById(id).populate(POPULATE);
  if (!doc) throw new AppError("Quotation not found.", 404);
  if (actor) {
    await assertQuotationView(actor, id);
  }
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

  const linked = await applyLeadLinks(input, actor, true);
  await assertLinkedEntities(linked);

  const assignedToId = linked.assignedToId ?? actor.id;
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
    leadId: linked.leadId,
    companyId: linked.companyId,
    customerId: linked.customerId,
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

  await assertQuotationEdit(actor, {
    _id: existing._id,
    status: existing.status,
    createdById: existing.createdById,
    assignedToId: existing.assignedToId,
  });

  const input = normalizeQuotationInput(body, true);
  const linked = await applyLeadLinks(
    {
      leadId: input.leadId ?? (existing.leadId ? String(existing.leadId) : null),
      companyId: input.companyId ?? (existing.companyId ? String(existing.companyId) : null),
      customerId: input.customerId ?? (existing.customerId ? String(existing.customerId) : null),
      assignedToId:
        input.assignedToId ?? (existing.assignedToId ? String(existing.assignedToId) : null),
    },
    actor,
    true,
  );
  await assertLinkedEntities(linked);

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
    "assignedToId",
  ] as const) {
    if (input[key] !== undefined) update[key] = input[key];
  }
  update.leadId = linked.leadId;
  update.companyId = linked.companyId;
  update.customerId = linked.customerId;
  if (linked.assignedToId) update.assignedToId = linked.assignedToId;

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
    action: "Quotation Edited",
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

    await assertQuotationStatusChange(actor, {
      _id: existing._id,
      status: existing.status,
      createdById: existing.createdById,
      assignedToId: existing.assignedToId,
    }, nextStatus as QuotationStatus);

    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "Sent" && !existing.sentAt) update.sentAt = new Date();
    if (nextStatus === "Accepted") update.acceptedAt = new Date();

    const updated = await applyOptimisticUpdate(Quotation, id, revision, update, {
      session,
      notFoundMessage: "Quotation not found.",
    });
    let orderPayload: Record<string, unknown> | null = null;

    // Legacy path: createOrder on status change. Idempotent if order already linked.
    if (nextStatus === "Accepted" && createOrder) {
      if (updated.orderId) {
        const linked = await Order.findById(updated.orderId).session(session);
        if (linked) {
          orderPayload = {
            id: linked._id,
            orderCode: linked.orderCode,
            status: linked.status,
            totalAmount: linked.orderValue,
            currency: linked.currency,
          };
        }
      } else {
        orderPayload = await createOrderFromQuotation(updated, {}, actor, session);
        updated.orderId = orderPayload.id as Types.ObjectId;
        await updated.save({ session });
      }
    }

    if (updated.leadId && nextStatus === "Sent") {
      await Lead.updateOne(
        { _id: updated.leadId, status: { $nin: ["Converted", "Lost"] } },
        { $set: { status: "Quotation Sent" } },
        { session },
      );
    }

    await writeAudit(
      {
        userId: actor.id,
        userName: actor.name,
        userRole: actor.roleName,
        action: nextStatus === "Sent" ? "Quotation Sent" : "Quotation Status Changed",
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

async function resolveQuotationContactDetails(
  quotation: InstanceType<typeof Quotation>,
  session?: import("mongoose").ClientSession,
) {
  let customerName = "";
  let companyName = "";
  let phone = "";
  let email = "";
  let country = "";

  if (quotation.customerId) {
    const customer = await Customer.findById(quotation.customerId).session(session ?? null);
    if (customer) {
      customerName = customer.name;
      phone = customer.phone || "";
      email = customer.email || "";
    }
  }
  if (quotation.companyId) {
    const company = await Company.findById(quotation.companyId).session(session ?? null);
    if (company) {
      companyName = company.name;
      country = company.country || country;
    }
  }
  if (quotation.leadId) {
    const lead = await Lead.findById(quotation.leadId).session(session ?? null);
    if (lead) {
      if (!customerName) customerName = lead.name;
      if (!companyName) companyName = lead.company;
      if (!phone) phone = lead.phoneNumber || "";
      if (!email) email = lead.email || "";
      if (!country) country = lead.country || "";
    }
  }

  return {
    customerName: customerName || "Customer",
    companyName: companyName || "Company",
    phone,
    email,
    country: country || "India",
  };
}

function buildOrderDraftFromQuotation(
  quotation: InstanceType<typeof Quotation>,
  contact: Awaited<ReturnType<typeof resolveQuotationContactDetails>>,
) {
  const products = quotation.lineItems.map((i) => i.description).join(", ");
  const quantity = quotation.lineItems.map((i) => i.quantity).join(", ");
  const expectedDelivery =
    quotation.validityDate || new Date(Date.now() + 30 * 86400000);
  const termsNote = quotation.paymentTerms
    ? `Payment terms: ${quotation.paymentTerms}`
    : "";
  const notes = [termsNote, quotation.notes, `From quotation ${quotation.quotationCode}`]
    .filter(Boolean)
    .join("\n");

  return {
    quotationId: String(quotation._id),
    quotationCode: quotation.quotationCode,
    customerName: contact.customerName,
    company: contact.companyName,
    phone: contact.phone,
    email: contact.email,
    country: contact.country,
    products,
    quantity,
    orderValue: quotation.totalAmount,
    currency: quotation.currency,
    assignedMemberId: refId(quotation.assignedToId),
    orderStatus: "Order Confirmed" as const,
    expectedDelivery: expectedDelivery.toISOString(),
    notes,
    destinationPort: "",
    shippingCarrier: "",
    trackingNumber: "",
    relatedLeadId: refId(quotation.leadId),
    companyId: refId(quotation.companyId),
    customerId: refId(quotation.customerId),
    lineItems: quotation.lineItems,
    subtotal: quotation.subtotal,
    discountAmount: quotation.discountAmount,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    totalAmount: quotation.totalAmount,
    paymentTerms: quotation.paymentTerms,
  };
}

export async function getQuotationOrderDraft(id: string, actor: AuthUser) {
  assertObjectId(id, "quotation id");
  await assertQuotationView(actor, id);

  const quotation = await Quotation.findById(id).populate(POPULATE);
  if (!quotation) throw new AppError("Quotation not found.", 404);

  if (quotation.status !== "Accepted") {
    throw new AppError("Only accepted quotations can be converted to orders.", 400);
  }

  if (quotation.orderId) {
    const order = await Order.findById(quotation.orderId);
    if (order) {
      return {
        alreadyLinked: true,
        order: {
          id: String(order._id),
          orderCode: order.orderCode,
          status: order.status,
        },
      };
    }
  }

  const contact = await resolveQuotationContactDetails(quotation);
  return {
    alreadyLinked: false,
    draft: buildOrderDraftFromQuotation(quotation, contact),
  };
}

export async function createQuotationOrder(
  id: string,
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "quotation id");
  const clientRequestId = parseClientRequestId(body);
  const revision = parseRevision(body);

  return withTransaction(async (session) => {
    const quotation = await Quotation.findById(id).session(session);
    if (!quotation) throw new AppError("Quotation not found.", 404);

    await assertQuotationOrderCreate(actor, {
      _id: quotation._id,
      status: quotation.status,
      createdById: quotation.createdById,
      assignedToId: quotation.assignedToId,
    });

    if (quotation.status !== "Accepted") {
      throw new AppError("Only accepted quotations can be converted to orders.", 400);
    }

    if (quotation.orderId) {
      const linked = await Order.findById(quotation.orderId).session(session).populate([
        { path: "assignedToId", select: "name email" },
      ]);
      if (linked) {
        await quotation.populate(POPULATE);
        return {
          quotation: serializeQuotation(quotation.toObject() as unknown as Record<string, unknown>),
          order: {
            id: String(linked._id),
            orderCode: linked.orderCode,
            status: linked.status,
            totalAmount: linked.orderValue,
            currency: linked.currency,
          },
          alreadyExists: true,
        };
      }
    }

    if (clientRequestId) {
      const existingOrder = await Order.findOne({ clientRequestId }).session(session);
      if (existingOrder) {
        await applyOptimisticUpdate(
          Quotation,
          id,
          revision,
          { orderId: existingOrder._id },
          { session, notFoundMessage: "Quotation not found." },
        );
        const refreshed = await Quotation.findById(id).session(session).populate(POPULATE);
        return {
          quotation: serializeQuotation(refreshed!.toObject() as unknown as Record<string, unknown>),
          order: {
            id: String(existingOrder._id),
            orderCode: existingOrder.orderCode,
            status: existingOrder.status,
            totalAmount: existingOrder.orderValue,
            currency: existingOrder.currency,
          },
          alreadyExists: true,
        };
      }
    }

    const orderPayload = await createOrderFromQuotation(quotation, body, actor, session);
    const refreshed = await applyOptimisticUpdate(
      Quotation,
      id,
      revision,
      { orderId: orderPayload.id },
      { session, notFoundMessage: "Quotation not found." },
    );
    await refreshed.populate(POPULATE);

    await writeAudit(
      {
        userId: actor.id,
        userName: actor.name,
        userRole: actor.roleName,
        action: "Order Created From Quotation",
        entity: "Quotation",
        entityId: id,
        details: `${quotation.quotationCode} → ${orderPayload.orderCode}`,
      },
      session,
    );

    return {
      quotation: serializeQuotation(refreshed.toObject() as unknown as Record<string, unknown>),
      order: orderPayload,
      alreadyExists: false,
    };
  });
}

async function createOrderFromQuotation(
  quotation: InstanceType<typeof Quotation>,
  body: Record<string, unknown>,
  actor: AuthUser,
  session: import("mongoose").ClientSession,
) {
  const contact = await resolveQuotationContactDetails(quotation, session);
  const draft = buildOrderDraftFromQuotation(quotation, contact);

  const customerName = String(body.customerName ?? draft.customerName).trim();
  const company = String(body.company ?? draft.company).trim();
  const products = String(body.products ?? draft.products).trim();
  const expectedDeliveryRaw = body.expectedDelivery ?? draft.expectedDelivery;

  if (!customerName || !company || !products || !expectedDeliveryRaw) {
    throw new AppError(
      "Customer, company, products, and expected delivery date are required.",
      400,
    );
  }

  const assignedMemberId = optionalObjectId(
    (body.assignedMemberId ?? body.assignedToId ?? draft.assignedMemberId ?? actor.id) as
      | string
      | null,
  );
  if (!assignedMemberId) throw new AppError("Assigned member is required.", 400);

  const assignee = await User.findById(assignedMemberId).session(session);
  if (!assignee) throw new AppError("Assigned member not found.", 400);

  const orderData = {
    customerName,
    company,
    phone: String(body.phone ?? draft.phone),
    email: String(body.email ?? draft.email),
    country: String(body.country ?? draft.country),
    products,
    quantity: String(body.quantity ?? draft.quantity),
    orderValue: Number(body.orderValue ?? draft.orderValue) || 0,
    currency: String(body.currency ?? draft.currency),
    assignedToId: assignedMemberId,
    status: String(body.orderStatus ?? body.status ?? draft.orderStatus),
    expectedDelivery: new Date(String(expectedDeliveryRaw)),
    notes: String(body.notes ?? draft.notes),
    destinationPort: String(body.destinationPort ?? draft.destinationPort),
    shippingCarrier: String(body.shippingCarrier ?? draft.shippingCarrier),
    trackingNumber: String(body.trackingNumber ?? draft.trackingNumber),
    relatedLeadId: optionalObjectId(
      (body.relatedLeadId as string | null | undefined) ?? draft.relatedLeadId,
    ),
    companyId: optionalObjectId((body.companyId as string | null | undefined) ?? draft.companyId),
    customerId: optionalObjectId(
      (body.customerId as string | null | undefined) ?? draft.customerId,
    ),
    createdById: actor.id,
    clientRequestId: parseClientRequestId(body) ?? null,
  };

  let created: InstanceType<typeof Order> | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const orderCode = await nextOrderCode();
      const result = await Order.create([{ ...orderData, orderCode }], { session });
      created = result[0];
      break;
    } catch (error: unknown) {
      if (isDuplicateKeyError(error, "orderCode") && attempt < 4) continue;
      throw error;
    }
  }

  if (!created) {
    throw new AppError("Failed to allocate a unique order code.", 500);
  }

  await OrderStatusHistory.create(
    [
      {
        orderId: created._id,
        previousStatus: null,
        newStatus: created.status,
        changedById: actor.id,
        changedByName: actor.name,
        notes: `Created from quotation ${quotation.quotationCode}`,
      },
    ],
    { session },
  );

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

  await assertQuotationDelete(actor, {
    _id: doc._id,
    status: doc.status,
    createdById: doc.createdById,
    assignedToId: doc.assignedToId,
  });

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
