import { Types } from "mongoose";
import {
  Order,
  ORDER_STATUSES,
  ORDER_BILLING_STATUSES,
  type OrderStatus,
  type OrderBillingStatus,
} from "../../models/Order";
import { OrderStatusHistory } from "../../models/OrderStatusHistory";
import { Shipment } from "../../models/Shipment";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextOrderCode, isDuplicateKeyError } from "../../utils/codes";
import { serializeOrder, serializeOrderHistory, serializeShipment } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { withTransaction } from "../../utils/transactions";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import { createBillFromOrder } from "../bills/bills.service";
import { buildOrderReportingAmounts } from "../../utils/currency";
import { resolveOrCreateCustomerForOrder } from "../../services/customerResolution.service";
import type { AuthUser } from "../../middleware/auth";
import { exportFilename } from "../../utils/csv";
import { streamCsvExport } from "../../utils/csvExport";
import { ORDER_EXPORT_COLUMNS } from "../../constants/exportColumns";

const POPULATE = [{ path: "assignedToId", select: "name email" }];

const LIST_SELECT =
  "orderCode customerName company phone email country products quantity orderValue currency assignedToId status billingStatus amountPaid amountDue billId expectedDelivery notes destinationPort shippingCarrier trackingNumber relatedLeadId companyId customerId createdById revision createdAt updatedAt";

async function historyFor(orderId: string) {
  const docs = await OrderStatusHistory.find({ orderId }).sort({ createdAt: 1 });
  return docs.map((d) => serializeOrderHistory(d.toObject() as unknown as Record<string, unknown>));
}

function buildOrdersQuery(filters: {
  search?: string;
  status?: string;
  country?: string;
  assignedMemberId?: string;
  customerId?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.country && filters.country !== "all") query.country = filters.country;
  if (filters.assignedMemberId && filters.assignedMemberId !== "all") {
    assertObjectId(filters.assignedMemberId, "assignedMemberId");
    query.assignedToId = filters.assignedMemberId;
  }
  if (filters.customerId && filters.customerId !== "all") {
    assertObjectId(filters.customerId, "customerId");
    query.customerId = filters.customerId;
  }
  if (filters.companyId && filters.companyId !== "all") {
    assertObjectId(filters.companyId, "companyId");
    query.companyId = filters.companyId;
  }
  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { orderCode: new RegExp(s, "i") },
      { customerName: new RegExp(s, "i") },
      { company: new RegExp(s, "i") },
      { products: new RegExp(s, "i") },
      { trackingNumber: new RegExp(s, "i") },
    ];
  }

  const sortField = filters.sortBy === "expectedDelivery" ? "expectedDelivery" : "createdAt";
  const sortDir = filters.sortOrder === "asc" ? 1 : -1;
  return { query, sort: { [sortField]: sortDir } as Record<string, 1 | -1> };
}

export async function exportOrders(
  filters: {
    search?: string;
    status?: string;
    country?: string;
    assignedMemberId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  actor: AuthUser,
) {
  const { query, sort } = buildOrdersQuery(filters);
  const result = await streamCsvExport({
    columns: ORDER_EXPORT_COLUMNS,
    count: () => Order.countDocuments(query),
    fetchBatch: async (skip, limit) => {
      const docs = await Order.find(query)
        .select(LIST_SELECT)
        .populate(POPULATE)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      return docs.map((d) => serializeOrder(d as unknown as Record<string, unknown>) as Record<string, unknown>);
    },
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Orders Exported",
    entity: "Order",
    entityId: "export",
    details: `Exported ${result.total} order(s) to CSV.`,
  });

  return { body: result.body, filename: exportFilename("orders"), total: result.total };
}

export async function listOrders(filters: {
  search?: string;
  status?: string;
  country?: string;
  assignedMemberId?: string;
  customerId?: string;
  companyId?: string;
  page?: unknown;
  limit?: unknown;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { page, limit, skip } = parsePagination(filters);
  const { query, sort } = buildOrdersQuery(filters);

  const [total, docs] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .select(LIST_SELECT)
      .populate(POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const items = docs.map((d) => serializeOrder(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getOrder(id: string) {
  assertObjectId(id, "order id");
  const order = await Order.findById(id).populate(POPULATE);
  if (!order) throw new AppError("Order not found.", 404);
  const shipmentDocs = await Shipment.find({ orderId: id })
    .populate([
      { path: "orderId", select: "orderCode customerName company status" },
      { path: "companyId", select: "companyCode name" },
      { path: "customerId", select: "customerCode name" },
      { path: "assignedToId", select: "name email" },
    ])
    .sort({ createdAt: -1 });
  return {
    order: serializeOrder(order.toObject() as unknown as Record<string, unknown>),
    history: await historyFor(id),
    shipments: shipmentDocs.map((doc) =>
      serializeShipment(doc.toObject() as unknown as Record<string, unknown>),
    ),
  };
}

export async function createOrder(body: Record<string, unknown>, actor: AuthUser) {
  const clientRequestId = parseClientRequestId(body);
  if (clientRequestId) {
    const existing = await Order.findOne({ clientRequestId }).populate(POPULATE);
    if (existing) {
      return serializeOrder(existing.toObject() as unknown as Record<string, unknown>);
    }
  }

  const customerName = body.customerName as string | undefined;
  const company = body.company as string | undefined;
  const products = body.products as string | undefined;
  const expectedDelivery = body.expectedDelivery as string | undefined;

  if (!customerName || !company || !products || !expectedDelivery) {
    throw new AppError(
      "Customer, company, products, and expected delivery date are required.",
      400,
    );
  }

  const assignedMemberId = optionalObjectId(
    (body.assignedMemberId ?? body.assignedToId ?? actor.id) as string | null,
  );
  if (!assignedMemberId) throw new AppError("Assigned member is required.", 400);

  const assignee = await User.findById(assignedMemberId);
  if (!assignee) throw new AppError("Assigned member not found.", 400);

  let statusRaw = (body.orderStatus ?? body.status ?? "Order Confirmed") as string;
  if (statusRaw === "Confirmed") statusRaw = "Order Confirmed";
  if (statusRaw === "Processing" || statusRaw === "In Progress") statusRaw = "Processing";

  if (!ORDER_STATUSES.includes(statusRaw as OrderStatus)) {
    throw new AppError(`Invalid order status: ${statusRaw}`, 400);
  }

  const orderValue = Number(body.orderValue) || 0;
  const isDraft = statusRaw === "Draft";
  const initialBillingStatus = isDraft ? "draft" : "pending";

  const order = await withTransaction(async (session) => {
    // 1. Resolve or create customer & company safely without duplicates
    const resolved = await resolveOrCreateCustomerForOrder(
      {
        customerId: optionalObjectId((body.customerId as string) || null),
        customerCode: (body.customerCode as string) || null,
        relatedLeadId: optionalObjectId((body.relatedLeadId as string) || null),
        customerName,
        company,
        email: (body.email as string) || null,
        phone: (body.phone as string) || null,
        country: (body.country as string) || null,
        notes: (body.notes as string) || null,
        assignedToId: assignedMemberId,
      },
      actor.id,
      session,
    );

    const currency = (body.currency as string) || "USD";
    const reporting = buildOrderReportingAmounts(
      { orderValue, amountPaid: 0, amountDue: orderValue },
      currency,
    );

    const orderPayload = {
      customerName: resolved.customer.name,
      company: resolved.company.name,
      phone: (body.phone as string) || resolved.customer.phone || "",
      email: (body.email as string) || resolved.customer.email || "",
      country: (body.country as string) || resolved.company.country || "United Arab Emirates",
      products: products.trim(),
      quantity: (body.quantity as string) || "Standard Container Batch",
      orderValue,
      currency,
      exchangeRateSnapshot: reporting.exchangeRateSnapshot,
      reportingAmountINR: reporting.reportingAmountINR,
      assignedToId: assignedMemberId,
      status: statusRaw as OrderStatus,
      billingStatus: initialBillingStatus,
      amountPaid: 0,
      amountDue: orderValue,
      billId: null,
      expectedDelivery: new Date(expectedDelivery),
      notes: (body.notes as string) || "",
      destinationPort: (body.destinationPort as string) || "",
      shippingCarrier: (body.shippingCarrier as string) || "",
      trackingNumber: (body.trackingNumber as string) || "",
      relatedLeadId: optionalObjectId((body.relatedLeadId as string) || null),
      companyId: resolved.company._id,
      customerId: resolved.customer._id,
      createdById: new Types.ObjectId(actor.id),
      clientRequestId: clientRequestId ?? null,
    };

    let createdOrder: InstanceType<typeof Order> | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const orderCode = await nextOrderCode();
        const docs = await Order.create([{ ...orderPayload, orderCode }], { session });
        createdOrder = docs[0];
        break;
      } catch (error: unknown) {
        if (isDuplicateKeyError(error, "orderCode") && attempt < 4) continue;
        throw error;
      }
    }

    if (!createdOrder) {
      throw new AppError("Failed to allocate a unique order code.", 500);
    }

    // 2. Automatically create exactly ONE linked Bill if confirmed
    if (!isDraft) {
      await createBillFromOrder(String(createdOrder._id), actor.id, session);
    }

    await OrderStatusHistory.create(
      [
        {
          orderId: createdOrder._id,
          previousStatus: null,
          newStatus: createdOrder.status,
          changedById: actor.id,
          changedByName: actor.name,
          notes: isDraft ? "Order created in draft" : "Order created & confirmed with billing pending",
        },
      ],
      { session },
    );

    return createdOrder;
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Order Created",
    entity: "Order",
    entityId: String(order._id),
    details: `Created order ${order.orderCode} for ${order.company} ($${order.orderValue}). Billing: ${order.billingStatus}.`,
  });

  await order.populate(POPULATE);
  return serializeOrder(order.toObject() as unknown as Record<string, unknown>);
}

export async function updateOrder(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "order id");
  const expectedRevision = parseRevision(body);
  const setFields: Record<string, unknown> = {};

  if (body.customerName !== undefined) setFields.customerName = String(body.customerName);
  if (body.company !== undefined) setFields.company = String(body.company);
  if (body.phone !== undefined) setFields.phone = String(body.phone);
  if (body.email !== undefined) setFields.email = String(body.email);
  if (body.country !== undefined) setFields.country = String(body.country);
  if (body.products !== undefined) setFields.products = String(body.products);
  if (body.quantity !== undefined) setFields.quantity = String(body.quantity);
  if (body.orderValue !== undefined) setFields.orderValue = Number(body.orderValue) || 0;
  if (body.currency !== undefined) setFields.currency = String(body.currency);
  if (body.expectedDelivery !== undefined) {
    setFields.expectedDelivery = new Date(String(body.expectedDelivery));
  }
  if (body.notes !== undefined) setFields.notes = String(body.notes);
  if (body.destinationPort !== undefined) setFields.destinationPort = String(body.destinationPort);
  if (body.shippingCarrier !== undefined) setFields.shippingCarrier = String(body.shippingCarrier);
  if (body.trackingNumber !== undefined) setFields.trackingNumber = String(body.trackingNumber);
  if (body.companyId !== undefined) {
    setFields.companyId = optionalObjectId((body.companyId as string) || null);
  }
  if (body.customerId !== undefined) {
    setFields.customerId = optionalObjectId((body.customerId as string) || null);
  }

  const assigneeId = body.assignedMemberId ?? body.assignedToId;
  if (assigneeId !== undefined) {
    const idStr = optionalObjectId(assigneeId as string | null);
    if (idStr) {
      const assignee = await User.findById(idStr);
      if (!assignee) throw new AppError("Assigned member not found.", 400);
      setFields.assignedToId = new Types.ObjectId(idStr);
    }
  }

  if (body.billingStatus !== undefined) {
    const billingStatus = String(body.billingStatus);
    if (!ORDER_BILLING_STATUSES.includes(billingStatus as OrderBillingStatus)) {
      throw new AppError("Invalid billing status.", 400);
    }
    setFields.billingStatus = billingStatus;
  }

  if (body.amountPaid !== undefined) {
    const amountPaid = Math.max(0, Number(body.amountPaid) || 0);
    setFields.amountPaid = amountPaid;
  }

  if (Object.keys(setFields).length === 0) {
    const order = await Order.findById(id).populate(POPULATE);
    if (!order) throw new AppError("Order not found.", 404);
    return serializeOrder(order.toObject() as unknown as Record<string, unknown>);
  }

  const existing = await Order.findById(id);
  if (!existing) throw new AppError("Order not found.", 404);

  const nextOrderValue =
    setFields.orderValue !== undefined ? Number(setFields.orderValue) || 0 : existing.orderValue;
  const nextCurrency =
    setFields.currency !== undefined ? String(setFields.currency) : existing.currency;
  const nextAmountPaid =
    setFields.amountPaid !== undefined ? Number(setFields.amountPaid) || 0 : existing.amountPaid;

  if (setFields.amountPaid !== undefined) {
    const due = Math.max(0, Math.round((nextOrderValue - nextAmountPaid) * 100) / 100);
    setFields.amountDue = due;
    if (body.billingStatus === undefined) {
      if (due <= 0 && nextAmountPaid > 0) {
        setFields.billingStatus = "paid";
      } else if (nextAmountPaid > 0) {
        setFields.billingStatus = "partially_paid";
      } else if (existing.billingStatus !== "draft" && existing.billingStatus !== "void") {
        setFields.billingStatus = "pending";
      }
    }
  }

  const nextAmountDue =
    setFields.amountDue !== undefined ? Number(setFields.amountDue) || 0 : existing.amountDue;

  if (
    setFields.orderValue !== undefined ||
    setFields.currency !== undefined ||
    setFields.amountPaid !== undefined ||
    setFields.amountDue !== undefined
  ) {
    const currencyChanged =
      existing.exchangeRateSnapshot &&
      existing.exchangeRateSnapshot.fromCurrency !== String(nextCurrency || "USD").trim().toUpperCase();
    const reporting = buildOrderReportingAmounts(
      {
        orderValue: nextOrderValue,
        amountPaid: nextAmountPaid,
        amountDue: nextAmountDue,
      },
      nextCurrency,
      currencyChanged ? null : existing.exchangeRateSnapshot,
    );
    setFields.exchangeRateSnapshot = reporting.exchangeRateSnapshot;
    setFields.reportingAmountINR = reporting.reportingAmountINR;
  }

  const order = await applyOptimisticUpdate(Order, id, expectedRevision, setFields, {
    notFoundMessage: "Order not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Order Details Updated",
    entity: "Order",
    entityId: id,
    details: `Updated parameters for ${order.orderCode}.`,
  });

  await order.populate(POPULATE);
  return serializeOrder(order.toObject() as unknown as Record<string, unknown>);
}

export async function updateOrderStatus(
  id: string,
  status: string,
  notes: string | undefined,
  actor: AuthUser,
  body: Record<string, unknown> = {},
) {
  assertObjectId(id, "order id");
  if (!status) throw new AppError("New status is required.", 400);
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new AppError(`Invalid order status: ${status}`, 400);
  }

  const expectedRevision = parseRevision(body);
  const existing = await Order.findById(id).select("status orderCode assignedToId");
  if (!existing) throw new AppError("Order not found.", 404);

  const previousStatus = existing.status;

  const result = await withTransaction(async (session) => {
    const order = await applyOptimisticUpdate(
      Order,
      id,
      expectedRevision,
      { status: status as OrderStatus },
      { session, notFoundMessage: "Order not found." },
    );

    await OrderStatusHistory.create(
      [
        {
          orderId: order._id,
          previousStatus,
          newStatus: order.status,
          changedById: actor.id,
          changedByName: actor.name,
          notes: notes || "",
        },
      ],
      { session },
    );

    if (order.assignedToId && String(order.assignedToId) !== actor.id) {
      await createNotification(
        {
          userId: String(order.assignedToId),
          title: "Order Status Updated",
          message: `Order ${order.orderCode} moved to ${order.status}.`,
          type: "order_status",
          linkUrl: `/orders/${order._id}`,
        },
        session,
      );
    }

    return order;
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Order Status Changed",
    entity: "Order",
    entityId: id,
    details: `Transitioned status to ${status}. Notes: ${notes || "Standard progression"}`,
  });

  // When an order is confirmed, if it doesn't have a linked bill yet, create initial Pending bill
  if (result.status === "Order Confirmed" && !result.billId) {
    try {
      await createBillFromOrder(id, actor.id);
    } catch {
      // Safe to ignore if exists
    }
  }

  // NOTE: When an order is Delivered, the billing status must NOT be marked as Paid.
  // Order status and Billing status are completely independent. Payment is user-controlled.
  // If a bill does not exist for some legacy reason, ensure one is created as Pending (NOT Paid).
  if (result.status === "Delivered" && !result.billId) {
    try {
      await createBillFromOrder(id, actor.id);
    } catch {
      // Safe to ignore if exists
    }
  }

  await result.populate(POPULATE);
  return {
    order: serializeOrder(result.toObject() as unknown as Record<string, unknown>),
    history: await historyFor(id),
  };
}

export async function trackOrderPublic(orderCode: string) {
  if (!orderCode?.trim()) {
    throw new AppError("Please provide a valid Order ID (e.g. VO-2026-0182).", 400);
  }

  const clean = orderCode.trim().toUpperCase();
  const order = await Order.findOne({ orderCode: new RegExp(`^${clean}$`, "i") });
  if (!order) {
    throw new AppError(
      `No shipment found for Order ID "${orderCode}". Please check your invoice or confirmation document.`,
      404,
    );
  }

  const history = await OrderStatusHistory.find({ orderId: order._id }).sort({ createdAt: 1 });

  return {
    orderCode: order.orderCode,
    customerCompany: order.company,
    country: order.country,
    products: order.products,
    quantity: order.quantity,
    orderStatus: order.status,
    expectedDelivery: order.expectedDelivery?.toISOString() || "",
    destinationPort: order.destinationPort || "Standard Port Entry",
    shippingCarrier: order.shippingCarrier || "International Logistics Partner",
    trackingNumber: order.trackingNumber || "Available upon vessel departure",
    statusHistory: history.map((h) => ({
      status: h.newStatus,
      timestamp: h.createdAt.toISOString(),
      notes: h.notes || undefined,
    })),
  };
}
