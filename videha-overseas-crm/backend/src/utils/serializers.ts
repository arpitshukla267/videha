import { refId } from "./objectId";

function iso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeUser(doc: Record<string, unknown>) {
  const departmentPopulated =
    doc.departmentId && typeof doc.departmentId === "object"
      ? (doc.departmentId as Record<string, unknown>)
      : null;

  const rolePopulated =
    doc.roleId && typeof doc.roleId === "object" ? (doc.roleId as Record<string, unknown>) : null;

  const departmentId = departmentPopulated
    ? String(departmentPopulated._id ?? departmentPopulated.id)
    : doc.departmentId
      ? String(doc.departmentId)
      : null;

  const departmentName =
    (departmentPopulated?.name as string | undefined) ||
    (typeof doc.department === "string" ? doc.department : undefined) ||
    "";

  return {
    id: String(doc._id ?? doc.id),
    name: doc.name,
    email: doc.email,
    roleId: rolePopulated ? String(rolePopulated._id ?? rolePopulated.id) : String(doc.roleId ?? ""),
    roleName: doc.roleName,
    roleDisplayName: rolePopulated?.displayName || undefined,
    status: doc.status,
    phone: doc.phone || "",
    designation: doc.designation || "",
    departmentId,
    department: departmentName,
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
  };
}

export function serializeLead(doc: Record<string, unknown>) {
  const assigned = doc.assignedToId && typeof doc.assignedToId === "object"
    ? (doc.assignedToId as Record<string, unknown>)
    : null;

  const assignedToId = assigned
    ? String(assigned._id ?? assigned.id)
    : doc.assignedToId
      ? String(doc.assignedToId)
      : null;

  const departmentId =
    doc.departmentId && typeof doc.departmentId === "object"
      ? String((doc.departmentId as { _id?: unknown })._id ?? doc.departmentId)
      : doc.departmentId
        ? String(doc.departmentId)
        : null;

  return {
    id: String(doc._id ?? doc.id),
    leadCode: doc.leadCode,
    name: doc.name,
    company: doc.company,
    phoneNumber: doc.phoneNumber,
    whatsAppNumber: doc.whatsAppNumber || "",
    email: doc.email || "",
    country: doc.country,
    city: "",
    productInterest: doc.productInterest || "",
    leadSource: doc.source || doc.leadSource || "Direct Inquiry",
    source: doc.source || doc.leadSource || "Direct Inquiry",
    leadCategory: "",
    leadStatus: doc.status || doc.leadStatus || "New",
    status: doc.status || doc.leadStatus || "New",
    priority: doc.priority || "Medium",
    assignedMemberId: assignedToId,
    assignedToId,
    assignedMemberName: assigned?.name ? String(assigned.name) : doc.assignedMemberName || undefined,
    departmentId,
    createdDate: iso(doc.createdAt) || new Date().toISOString(),
    nextFollowUp: iso(doc.nextFollowUp),
    notes: doc.notes || "",
    createdById: refId(doc.createdById) || "",
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    archived: Boolean(doc.archived),
  };
}

export function serializeTask(doc: Record<string, unknown>) {
  const assigned = doc.assignedToId && typeof doc.assignedToId === "object"
    ? (doc.assignedToId as Record<string, unknown>)
    : null;
  const creator = doc.createdById && typeof doc.createdById === "object"
    ? (doc.createdById as Record<string, unknown>)
    : null;
  const lead = doc.relatedLeadId && typeof doc.relatedLeadId === "object"
    ? (doc.relatedLeadId as Record<string, unknown>)
    : null;

  const status = String(doc.status || "Pending");
  const dueDate = iso(doc.dueDate) || new Date().toISOString();
  let isOverdue = false;
  let overdueDays = 0;
  if (status !== "Completed" && status !== "Cancelled") {
    const dueTime = new Date(dueDate).getTime();
    const now = Date.now();
    if (dueTime < now) {
      isOverdue = true;
      overdueDays = Math.max(1, Math.floor((now - dueTime) / (1000 * 60 * 60 * 24)));
    }
  }

  const title = String(doc.title || doc.taskTitle || "");
  const relatedLeadId = lead
    ? String(lead._id ?? lead.id)
    : doc.relatedLeadId
      ? String(doc.relatedLeadId)
      : null;

  let relatedLeadName: string | undefined = doc.relatedLeadName as string | undefined;
  if (lead) {
    const name = lead.name ? String(lead.name) : "";
    const company = lead.company ? String(lead.company) : "";
    relatedLeadName = company ? `${name} (${company})` : name || relatedLeadName;
  }

  return {
    id: String(doc._id ?? doc.id),
    taskCode: doc.taskCode,
    title,
    taskTitle: title,
    description: doc.description || "",
    assignedToId: assigned ? String(assigned._id ?? assigned.id) : String(doc.assignedToId || ""),
    assignedToName: assigned?.name ? String(assigned.name) : doc.assignedToName || undefined,
    createdById: creator ? String(creator._id ?? creator.id) : String(doc.createdById || ""),
    createdByName: creator?.name ? String(creator.name) : doc.createdByName || undefined,
    relatedLeadId,
    relatedLeadName,
    relatedOrderId: null,
    priority: doc.priority || "Medium",
    status,
    dueDate,
    createdDate: iso(doc.createdAt) || new Date().toISOString(),
    completedDate: iso(doc.completedAt),
    completedAt: iso(doc.completedAt),
    isOverdue,
    overdueDays,
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
  };
}

export function serializeOrder(doc: Record<string, unknown>) {
  const assigned = doc.assignedToId && typeof doc.assignedToId === "object"
    ? (doc.assignedToId as Record<string, unknown>)
    : null;

  const assignedToId = assigned
    ? String(assigned._id ?? assigned.id)
    : doc.assignedToId
      ? String(doc.assignedToId)
      : null;

  return {
    id: String(doc._id ?? doc.id),
    orderCode: doc.orderCode,
    customerName: doc.customerName,
    company: doc.company,
    phone: doc.phone || "",
    email: doc.email || "",
    country: doc.country,
    products: doc.products,
    quantity: doc.quantity || "",
    orderValue: Number(doc.orderValue) || 0,
    currency: doc.currency || "USD",
    assignedMemberId: assignedToId,
    assignedToId,
    assignedMemberName: assigned?.name ? String(assigned.name) : doc.assignedMemberName || undefined,
    orderStatus: doc.status || doc.orderStatus || "Order Confirmed",
    status: doc.status || doc.orderStatus || "Order Confirmed",
    expectedDelivery: iso(doc.expectedDelivery) || "",
    createdDate: iso(doc.createdAt) || new Date().toISOString(),
    notes: doc.notes || "",
    destinationPort: doc.destinationPort || "",
    shippingCarrier: doc.shippingCarrier || "",
    trackingNumber: doc.trackingNumber || "",
    relatedLeadId: refId(doc.relatedLeadId),
    createdById: refId(doc.createdById) || "",
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
  };
}

export function serializeRole(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    name: doc.name,
    displayName: doc.displayName,
    description: doc.description || "",
    permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
  };
}

export function serializeDepartment(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    name: doc.name,
    description: doc.description || "",
    status: doc.status || "active",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
  };
}

export function serializeNotification(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    userId: refId(doc.userId) || "",
    title: doc.title,
    message: doc.message,
    type: doc.type,
    isRead: Boolean(doc.isRead),
    linkUrl: doc.linkUrl,
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
  };
}

export function serializeAudit(doc: Record<string, unknown>) {
  const timestamp = iso(doc.createdAt) || new Date().toISOString();
  return {
    id: String(doc._id ?? doc.id),
    userId: refId(doc.userId) || "",
    userName: doc.userName,
    userRole: doc.userRole,
    action: doc.action,
    entity: doc.entity,
    entityId: doc.entityId || "",
    details: doc.details || "",
    timestamp,
    createdAt: timestamp,
  };
}

export function serializeLeadNote(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    leadId: refId(doc.leadId) || "",
    content: doc.content,
    authorId: refId(doc.authorId) || "",
    authorName: doc.authorName,
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
  };
}

export function serializeLeadActivity(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    leadId: refId(doc.leadId) || "",
    type: doc.type,
    title: doc.title,
    description: doc.description || "",
    performedById: refId(doc.performedById) || "",
    performedByName: doc.performedByName,
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
  };
}

export function serializeOrderHistory(doc: Record<string, unknown>) {
  const timestamp = iso(doc.createdAt) || new Date().toISOString();
  return {
    id: String(doc._id ?? doc.id),
    orderId: refId(doc.orderId) || "",
    previousStatus: doc.previousStatus ?? null,
    newStatus: doc.newStatus,
    changedById: refId(doc.changedById) || "",
    changedByName: doc.changedByName,
    notes: doc.notes || "",
    timestamp,
  };
}
