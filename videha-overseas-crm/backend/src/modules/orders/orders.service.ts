import { Types } from "mongoose";
import { Order, ORDER_STATUSES, type OrderStatus } from "../../models/Order";
import { OrderStatusHistory } from "../../models/OrderStatusHistory";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextOrderCode } from "../../utils/codes";
import { serializeOrder, serializeOrderHistory } from "../../utils/serializers";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import type { AuthUser } from "../../middleware/auth";

const POPULATE = [{ path: "assignedToId", select: "name email" }];

async function historyFor(orderId: string) {
  const docs = await OrderStatusHistory.find({ orderId }).sort({ createdAt: 1 });
  return docs.map((d) => serializeOrderHistory(d.toObject() as unknown as Record<string, unknown>));
}

export async function listOrders(filters: {
  search?: string;
  status?: string;
  country?: string;
  assignedMemberId?: string;
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

  const docs = await Order.find(query).populate(POPULATE).sort({ createdAt: -1 });
  return docs.map((d) => serializeOrder(d.toObject() as unknown as Record<string, unknown>));
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
    createdById: actor.id,
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
  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found.", 404);

  if (body.customerName !== undefined) order.customerName = String(body.customerName);
  if (body.company !== undefined) order.company = String(body.company);
  if (body.phone !== undefined) order.phone = String(body.phone);
  if (body.email !== undefined) order.email = String(body.email);
  if (body.country !== undefined) order.country = String(body.country);
  if (body.products !== undefined) order.products = String(body.products);
  if (body.quantity !== undefined) order.quantity = String(body.quantity);
  if (body.orderValue !== undefined) order.orderValue = Number(body.orderValue) || 0;
  if (body.currency !== undefined) order.currency = String(body.currency);
  if (body.expectedDelivery !== undefined) {
    order.expectedDelivery = new Date(String(body.expectedDelivery));
  }
  if (body.notes !== undefined) order.notes = String(body.notes);
  if (body.destinationPort !== undefined) order.destinationPort = String(body.destinationPort);
  if (body.shippingCarrier !== undefined) order.shippingCarrier = String(body.shippingCarrier);
  if (body.trackingNumber !== undefined) order.trackingNumber = String(body.trackingNumber);

  const assigneeId = body.assignedMemberId ?? body.assignedToId;
  if (assigneeId !== undefined) {
    const idStr = optionalObjectId(assigneeId as string | null);
    if (idStr) {
      const assignee = await User.findById(idStr);
      if (!assignee) throw new AppError("Assigned member not found.", 400);
      order.assignedToId = new Types.ObjectId(idStr);
    }
  }

  await order.save();

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
) {
  assertObjectId(id, "order id");
  if (!status) throw new AppError("New status is required.", 400);
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new AppError(`Invalid order status: ${status}`, 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found.", 404);

  const previousStatus = order.status;
  order.status = status as OrderStatus;
  await order.save();

  await OrderStatusHistory.create({
    orderId: order._id,
    previousStatus,
    newStatus: order.status,
    changedById: actor.id,
    changedByName: actor.name,
    notes: notes || "",
  });

  if (order.assignedToId && String(order.assignedToId) !== actor.id) {
    await createNotification({
      userId: String(order.assignedToId),
      title: "Order Status Updated",
      message: `Order ${order.orderCode} moved to ${order.status}.`,
      type: "order_status",
      linkUrl: `/orders/${order._id}`,
    });
  }

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Order Status Changed",
    entity: "Order",
    entityId: id,
    details: `Transitioned status to ${status}. Notes: ${notes || "Standard progression"}`,
  });

  await order.populate(POPULATE);
  return {
    order: serializeOrder(order.toObject() as unknown as Record<string, unknown>),
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
