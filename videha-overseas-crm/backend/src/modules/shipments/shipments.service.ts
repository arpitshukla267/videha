import { Shipment, SHIPMENT_STATUSES, type ShipmentStatus } from "../../models/Shipment";
import { Order } from "../../models/Order";
import { Company } from "../../models/Company";
import { Customer } from "../../models/Customer";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextShipmentCode } from "../../utils/codes";
import { serializeShipment } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";

const POPULATE = [
  { path: "orderId", select: "orderCode customerName company status" },
  { path: "companyId", select: "companyCode name" },
  { path: "customerId", select: "customerCode name" },
  { path: "assignedToId", select: "name email" },
];

function buildShipmentsQuery(filters: {
  search?: string;
  status?: string;
  orderId?: string;
  companyId?: string;
  customerId?: string;
}) {
  const query: Record<string, unknown> = {};
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.orderId) {
    assertObjectId(filters.orderId, "orderId");
    query.orderId = filters.orderId;
  }
  if (filters.companyId) {
    assertObjectId(filters.companyId, "companyId");
    query.companyId = filters.companyId;
  }
  if (filters.customerId) {
    assertObjectId(filters.customerId, "customerId");
    query.customerId = filters.customerId;
  }
  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { shipmentCode: new RegExp(s, "i") },
      { shipmentReference: new RegExp(s, "i") },
      { containerReference: new RegExp(s, "i") },
      { trackingNumber: new RegExp(s, "i") },
      { product: new RegExp(s, "i") },
      { destinationPort: new RegExp(s, "i") },
      { carrier: new RegExp(s, "i") },
    ];
  }
  return query;
}

function normalizeInput(body: Record<string, unknown>) {
  const status = body.status ? String(body.status) : undefined;
  if (status && !SHIPMENT_STATUSES.includes(status as ShipmentStatus)) {
    throw new AppError(`Invalid shipment status: ${status}`, 400);
  }

  const parseDate = (value: unknown) => {
    if (value == null || value === "") return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) throw new AppError("Invalid date value.", 400);
    return date;
  };

  return {
    shipmentReference: body.shipmentReference !== undefined ? String(body.shipmentReference || "").trim() : undefined,
    containerReference: body.containerReference !== undefined ? String(body.containerReference || "").trim() : undefined,
    orderId: optionalObjectId((body.orderId as string | null | undefined) ?? null),
    companyId: optionalObjectId((body.companyId as string | null | undefined) ?? null),
    customerId: optionalObjectId((body.customerId as string | null | undefined) ?? null),
    product: body.product !== undefined ? String(body.product || "").trim() : undefined,
    quantity: body.quantity !== undefined ? String(body.quantity || "").trim() : undefined,
    originPort: body.originPort !== undefined ? String(body.originPort || "").trim() : undefined,
    destinationPort: body.destinationPort !== undefined ? String(body.destinationPort || "").trim() : undefined,
    etd: body.etd !== undefined ? parseDate(body.etd) : undefined,
    eta: body.eta !== undefined ? parseDate(body.eta) : undefined,
    carrier: body.carrier !== undefined ? String(body.carrier || "").trim() : undefined,
    shippingLine: body.shippingLine !== undefined ? String(body.shippingLine || "").trim() : undefined,
    trackingNumber: body.trackingNumber !== undefined ? String(body.trackingNumber || "").trim() : undefined,
    status: status as ShipmentStatus | undefined,
    notes: body.notes !== undefined ? String(body.notes || "") : undefined,
    assignedToId: optionalObjectId((body.assignedToId ?? body.assignedMemberId ?? null) as string | null),
  };
}

async function resolveLinkedEntities(input: ReturnType<typeof normalizeInput>) {
  if (input.orderId) {
    const order = await Order.findById(input.orderId).select("companyId customerId company customerName").lean();
    if (!order) throw new AppError("Linked order not found.", 404);
    if (!input.companyId && order.companyId) input.companyId = String(order.companyId);
    if (!input.customerId && order.customerId) input.customerId = String(order.customerId);
  }
  if (input.companyId) {
    const company = await Company.findById(input.companyId).select("_id").lean();
    if (!company) throw new AppError("Linked company not found.", 404);
  }
  if (input.customerId) {
    const customer = await Customer.findById(input.customerId).select("_id").lean();
    if (!customer) throw new AppError("Linked customer not found.", 404);
  }
}

export async function listShipments(filters: {
  search?: string;
  status?: string;
  orderId?: string;
  companyId?: string;
  customerId?: string;
  page?: unknown;
  limit?: unknown;
}) {
  const { page, limit, skip } = parsePagination(filters);
  const query = buildShipmentsQuery(filters);
  const [total, docs] = await Promise.all([
    Shipment.countDocuments(query),
    Shipment.find(query).populate(POPULATE).sort({ eta: 1, createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return paginatedResponse(
    docs.map((doc) => serializeShipment(doc.toObject() as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
  );
}

export async function getShipment(id: string) {
  assertObjectId(id, "shipment id");
  const doc = await Shipment.findById(id).populate(POPULATE);
  if (!doc) throw new AppError("Shipment not found.", 404);
  return serializeShipment(doc.toObject() as unknown as Record<string, unknown>);
}

export async function listOrderShipments(orderId: string) {
  assertObjectId(orderId, "order id");
  const docs = await Shipment.find({ orderId }).populate(POPULATE).sort({ createdAt: -1 });
  return docs.map((doc) => serializeShipment(doc.toObject() as unknown as Record<string, unknown>));
}

export async function createShipment(body: Record<string, unknown>, actor: AuthUser) {
  const input = normalizeInput(body);
  await resolveLinkedEntities(input);
  if (!input.shipmentReference && !input.containerReference && !input.trackingNumber) {
    throw new AppError("Provide at least a shipment reference, container reference, or tracking number.", 400);
  }

  const shipmentCode = await nextShipmentCode();
  const shipment = await Shipment.create({
    shipmentCode,
    shipmentReference: input.shipmentReference || "",
    containerReference: input.containerReference || "",
    orderId: input.orderId || null,
    companyId: input.companyId || null,
    customerId: input.customerId || null,
    product: input.product || "",
    quantity: input.quantity || "",
    originPort: input.originPort || "",
    destinationPort: input.destinationPort || "",
    etd: input.etd ?? null,
    eta: input.eta ?? null,
    carrier: input.carrier || "",
    shippingLine: input.shippingLine || "",
    trackingNumber: input.trackingNumber || "",
    status: input.status || "Planned",
    notes: input.notes || "",
    assignedToId: input.assignedToId || null,
    createdById: actor.id,
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Shipment Created",
    entity: "Shipment",
    entityId: String(shipment._id),
    details: `Created shipment ${shipment.shipmentCode}.`,
  });

  await shipment.populate(POPULATE);
  return serializeShipment(shipment.toObject() as unknown as Record<string, unknown>);
}

export async function updateShipment(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "shipment id");
  const existing = await Shipment.findById(id);
  if (!existing) throw new AppError("Shipment not found.", 404);

  const input = normalizeInput(body);
  await resolveLinkedEntities(input);
  const revision = parseRevision(body);

  const updated = await applyOptimisticUpdate(Shipment, id, revision, {
    ...(input.shipmentReference !== undefined ? { shipmentReference: input.shipmentReference } : {}),
    ...(input.containerReference !== undefined ? { containerReference: input.containerReference } : {}),
    ...(input.orderId !== undefined ? { orderId: input.orderId } : {}),
    ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
    ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
    ...(input.product !== undefined ? { product: input.product } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.originPort !== undefined ? { originPort: input.originPort } : {}),
    ...(input.destinationPort !== undefined ? { destinationPort: input.destinationPort } : {}),
    ...(input.etd !== undefined ? { etd: input.etd } : {}),
    ...(input.eta !== undefined ? { eta: input.eta } : {}),
    ...(input.carrier !== undefined ? { carrier: input.carrier } : {}),
    ...(input.shippingLine !== undefined ? { shippingLine: input.shippingLine } : {}),
    ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Shipment Updated",
    entity: "Shipment",
    entityId: id,
    details: `Updated shipment ${updated.shipmentCode}.`,
  });

  await updated.populate(POPULATE);
  return serializeShipment(updated.toObject() as unknown as Record<string, unknown>);
}
