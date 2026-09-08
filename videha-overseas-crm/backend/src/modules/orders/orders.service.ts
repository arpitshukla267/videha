import { Types } from "mongoose";
import { Order, ORDER_STATUSES, type OrderStatus } from "../../models/Order";
import { OrderStatusHistory } from "../../models/OrderStatusHistory";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextOrderCode } from "../../utils/codes";
import { serializeOrder, serializeOrderHistory } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { withTransaction } from "../../utils/transactions";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import { createBillFromOrder } from "../bills/bills.service";
import type { AuthUser } from "../../middleware/auth";

const POPULATE = [{ path: "assignedToId", select: "name email" }];

const LIST_SELECT =
  "orderCode customerName company phone email country products quantity orderValue currency assignedToId status expectedDelivery notes destinationPort shippingCarrier trackingNumber relatedLeadId createdById revision createdAt updatedAt";

async function historyFor(orderId: string) {
  const docs = await OrderStatusHistory.find({ orderId }).sort({ createdAt: 1 });
  return docs.map((d) => serializeOrderHistory(d.toObject() as unknown as Record<string, unknown>));
}

export async function listOrders(filters: {
  search?: string;
  status?: string;
  country?: string;
  assignedMemberId?: string;
  page?: unknown;
  limit?: unknown;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { page, limit, skip } = parsePagination(filters);
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.country && filters.country !== "all") query.country = filters.country;
  if (filters.assignedMemberId && filters.assignedMemberId !== "all") {
    assertObjectId(filters.assignedMemberId, "assignedMemberId");
    query.assignedToId = filters.assignedMemberId;
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

  const [total, docs] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .select(LIST_SELECT)
      .populate(POPULATE)
      .sort({ [sortField]: sortDir })
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
  return {
    order: serializeOrder(order.toObject() as unknown as Record<string, unknown>),
    history: await historyFor(id),
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

  const statusRaw = (body.orderStatus ?? body.status ?? "Order Confirmed") as string;
  if (!ORDER_STATUSES.includes(statusRaw as OrderStatus)) {
    throw new AppError(`Invalid order status: ${statusRaw}`, 400);
  }

  const order = await Order.create({
    orderCode: await nextOrderCode(),
    customerName: customerName.trim(),
    company: company.trim(),
    phone: (body.phone as string) || "",
    email: (body.email as string) || "",
    country: (body.country as string) || "United Arab Emirates",
    products: products.trim(),
    quantity: (body.quantity as string) || "Standard Container Batch",
    orderValue: Number(body.orderValue) || 0,
    currency: (body.currency as string) || "USD",
    assignedToId: assignedMemberId,
    status: statusRaw as OrderStatus,
    expectedDelivery: new Date(expectedDelivery),
    notes: (body.notes as string) || "",
    destinationPort: (body.destinationPort as string) || "",
    shippingCarrier: (body.shippingCarrier as string) || "",
    trackingNumber: (body.trackingNumber as string) || "",
    relatedLeadId: optionalObjectId((body.relatedLeadId as string) || null),
    companyId: optionalObjectId((body.companyId as string) || null),
    customerId: optionalObjectId((body.customerId as string) || null),
    createdById: actor.id,
    clientRequestId: clientRequestId ?? null,
  });

  await OrderStatusHistory.create({
    orderId: order._id,
    previousStatus: null,
    newStatus: order.status,
    changedById: actor.id,
    changedByName: actor.name,
    notes: "Order created",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Order Created",
    entity: "Order",
    entityId: String(order._id),
    details: `Created order ${order.orderCode} for ${order.company} ($${order.orderValue}).`,
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

  if (Object.keys(setFields).length === 0) {
    const order = await Order.findById(id).populate(POPULATE);
    if (!order) throw new AppError("Order not found.", 404);
    return serializeOrder(order.toObject() as unknown as Record<string, unknown>);
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

  if (result.status === "Delivered") {
    try {
      await createBillFromOrder(id, actor.id);
    } catch {
      // Bill may already exist — safe to ignore
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
