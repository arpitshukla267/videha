import { refId } from "./objectId";

function iso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function revisionOf(doc: Record<string, unknown>): number {
  return typeof doc.revision === "number" ? doc.revision : 0;
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
    revision: revisionOf(doc),
  };
}

/** Lightweight lead payload for paginated list views. */
export function serializeLeadSummary(doc: Record<string, unknown>) {
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
    leadCode: doc.leadCode,
    name: doc.name,
    company: doc.company,
    phoneNumber: doc.phoneNumber,
    email: doc.email || "",
    country: doc.country,
    productInterest: doc.productInterest || "",
    leadSource: doc.source || doc.leadSource || "Direct Inquiry",
    source: doc.source || doc.leadSource || "Direct Inquiry",
    leadStatus: doc.status || doc.leadStatus || "New",
    status: doc.status || doc.leadStatus || "New",
    priority: doc.priority || "Medium",
    assignedMemberId: assignedToId,
    assignedToId,
    assignedMemberName: assigned?.name ? String(assigned.name) : undefined,
    createdDate: iso(doc.createdAt) || new Date().toISOString(),
    nextFollowUp: iso(doc.nextFollowUp),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
    companyId: refId(doc.companyId),
    customerId: refId(doc.customerId),
    lostReason: doc.lostReason || "",
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
    lastCallAt: iso(doc.lastCallAt),
    lastCallOutcome: doc.lastCallOutcome || null,
    lastCallChannel: doc.lastCallChannel || null,
    lastCallPickedUp: doc.lastCallPickedUp ?? null,
    totalCallsCount: Number(doc.totalCallsCount ?? 0),
    createdById: refId(doc.createdById) || "",
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    archived: Boolean(doc.archived),
    revision: revisionOf(doc),
    companyId: refId(doc.companyId),
    customerId: refId(doc.customerId),
    lostReason: doc.lostReason || "",
    convertedAt: iso(doc.convertedAt),
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
    taskType: doc.taskType || "follow_up_call",
    category: doc.taskType || "follow_up_call",
    channel: doc.channel || "phone",
    pickedUp: doc.pickedUp ?? null,
    outcome: doc.outcome || "",
    completionNotes: doc.completionNotes || "",
    priority: doc.priority || "Medium",
    status,
    dueDate,
    createdDate: iso(doc.createdAt) || new Date().toISOString(),
    completedDate: iso(doc.completedAt),
    completedAt: iso(doc.completedAt),
    isOverdue,
    overdueDays,
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
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
    companyId: refId(doc.companyId),
    customerId: refId(doc.customerId),
    createdById: refId(doc.createdById) || "",
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
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
    revision: revisionOf(doc),
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

export function serializeCallLog(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    leadId: refId(doc.leadId) || "",
    performedById: refId(doc.performedById) || "",
    performedByName: doc.performedByName,
    channel: doc.channel || "phone",
    direction: doc.direction || "outbound",
    pickedUp: Boolean(doc.pickedUp),
    outcome: doc.outcome,
    durationMinutes: Number(doc.durationMinutes ?? 0),
    spokeWith: doc.spokeWith || "",
    interestLevel: doc.interestLevel || "none",
    disposition: doc.disposition || "",
    notes: doc.notes || "",
    nextFollowUp: iso(doc.nextFollowUp),
    followUpRequired: Boolean(doc.followUpRequired),
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

export function serializeBill(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    billCode: doc.billCode,
    orderId: refId(doc.orderId) || "",
    orderCode: doc.orderCode,
    customerName: doc.customerName,
    company: doc.company,
    phone: doc.phone || "",
    email: doc.email || "",
    country: doc.country,
    products: doc.products,
    quantity: doc.quantity || "",
    lineItems: Array.isArray(doc.lineItems) ? doc.lineItems : [],
    subtotal: Number(doc.subtotal) || 0,
    taxRate: Number(doc.taxRate) || 0,
    taxAmount: Number(doc.taxAmount) || 0,
    totalAmount: Number(doc.totalAmount) || 0,
    amountPaid: Number(doc.amountPaid) || 0,
    amountDue: Number(doc.amountDue) || 0,
    currency: doc.currency || "USD",
    paymentTerms: doc.paymentTerms || "",
    status: doc.status || "issued",
    dueDate: iso(doc.dueDate) || "",
    issuedAt: iso(doc.issuedAt) || "",
    paidAt: iso(doc.paidAt) || "",
    invoiceNotes: doc.invoiceNotes || "",
    billingAddress: doc.billingAddress || "",
    gstNumber: doc.gstNumber || "",
    bankDetails: doc.bankDetails || "",
    createdById: refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
  };
}

export function serializeCompany(doc: Record<string, unknown>) {
  const assigned = doc.assignedToId && typeof doc.assignedToId === "object"
    ? (doc.assignedToId as Record<string, unknown>)
    : null;

  return {
    id: String(doc._id ?? doc.id),
    companyCode: doc.companyCode,
    name: doc.name,
    legalName: doc.legalName || "",
    country: doc.country,
    city: doc.city || "",
    address: doc.address || "",
    website: doc.website || "",
    industry: doc.industry || "",
    taxId: doc.taxId || "",
    notes: doc.notes || "",
    status: doc.status || "active",
    assignedToId: assigned
      ? String(assigned._id ?? assigned.id)
      : refId(doc.assignedToId),
    assignedToName: assigned?.name ? String(assigned.name) : undefined,
    createdById: refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
  };
}

export function serializeCompanySummary(doc: Record<string, unknown>) {
  return {
    id: String(doc._id ?? doc.id),
    companyCode: doc.companyCode,
    name: doc.name,
    country: doc.country,
    industry: doc.industry || "",
    status: doc.status || "active",
    revision: revisionOf(doc),
  };
}

export function serializeCustomer(doc: Record<string, unknown>) {
  const company = doc.companyId && typeof doc.companyId === "object"
    ? (doc.companyId as Record<string, unknown>)
    : null;

  return {
    id: String(doc._id ?? doc.id),
    customerCode: doc.customerCode,
    companyId: company
      ? String(company._id ?? company.id)
      : refId(doc.companyId) || "",
    companyName: company?.name ? String(company.name) : undefined,
    name: doc.name,
    email: doc.email || "",
    phone: doc.phone || "",
    whatsAppNumber: doc.whatsAppNumber || "",
    designation: doc.designation || "",
    isPrimaryContact: Boolean(doc.isPrimaryContact),
    notes: doc.notes || "",
    status: doc.status || "active",
    relatedLeadId: refId(doc.relatedLeadId),
    createdById: refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
  };
}

export function serializeFollowUp(doc: Record<string, unknown>) {
  const assigned = doc.assignedToId && typeof doc.assignedToId === "object"
    ? (doc.assignedToId as Record<string, unknown>)
    : null;
  const lead = doc.leadId && typeof doc.leadId === "object"
    ? (doc.leadId as Record<string, unknown>)
    : null;

  return {
    id: String(doc._id ?? doc.id),
    leadId: lead ? String(lead._id ?? lead.id) : refId(doc.leadId) || "",
    leadCode: lead?.leadCode ? String(lead.leadCode) : undefined,
    leadCompany: lead?.company ? String(lead.company) : undefined,
    assignedToId: assigned
      ? String(assigned._id ?? assigned.id)
      : refId(doc.assignedToId) || "",
    assignedToName: assigned?.name ? String(assigned.name) : undefined,
    dueAt: iso(doc.dueAt) || new Date().toISOString(),
    type: doc.type,
    status: doc.status || "Pending",
    outcome: doc.outcome || "",
    notes: doc.notes || "",
    completedAt: iso(doc.completedAt),
    createdById: refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
  };
}

export function serializeQuotation(doc: Record<string, unknown>) {
  const assigned = doc.assignedToId && typeof doc.assignedToId === "object"
    ? (doc.assignedToId as Record<string, unknown>)
    : null;
  const lead = doc.leadId && typeof doc.leadId === "object"
    ? (doc.leadId as Record<string, unknown>)
    : null;
  const company = doc.companyId && typeof doc.companyId === "object"
    ? (doc.companyId as Record<string, unknown>)
    : null;
  const customer = doc.customerId && typeof doc.customerId === "object"
    ? (doc.customerId as Record<string, unknown>)
    : null;
  const order = doc.orderId && typeof doc.orderId === "object"
    ? (doc.orderId as Record<string, unknown>)
    : null;

  return {
    id: String(doc._id ?? doc.id),
    quotationCode: doc.quotationCode,
    title: doc.title,
    currency: doc.currency || "USD",
    lineItems: Array.isArray(doc.lineItems) ? doc.lineItems : [],
    subtotal: doc.subtotal ?? 0,
    discountAmount: doc.discountAmount ?? 0,
    taxRate: doc.taxRate ?? 0,
    taxAmount: doc.taxAmount ?? 0,
    totalAmount: doc.totalAmount ?? 0,
    validityDate: iso(doc.validityDate),
    paymentTerms: doc.paymentTerms || "",
    notes: doc.notes || "",
    status: doc.status || "Draft",
    leadId: lead ? String(lead._id ?? lead.id) : refId(doc.leadId),
    leadCode: lead?.leadCode ? String(lead.leadCode) : undefined,
    leadName: lead?.name ? String(lead.name) : undefined,
    leadCountry: lead?.country ? String(lead.country) : undefined,
    leadEmail: lead?.email ? String(lead.email) : undefined,
    leadPhone: lead?.phoneNumber ? String(lead.phoneNumber) : undefined,
    companyId: company ? String(company._id ?? company.id) : refId(doc.companyId),
    companyCode: company?.companyCode ? String(company.companyCode) : undefined,
    companyName: company?.name
      ? String(company.name)
      : lead?.company
        ? String(lead.company)
        : undefined,
    companyCountry: company?.country
      ? String(company.country)
      : lead?.country
        ? String(lead.country)
        : undefined,
    customerId: customer ? String(customer._id ?? customer.id) : refId(doc.customerId),
    customerCode: customer?.customerCode ? String(customer.customerCode) : undefined,
    customerName: customer?.name
      ? String(customer.name)
      : lead?.name
        ? String(lead.name)
        : undefined,
    customerEmail: customer?.email
      ? String(customer.email)
      : lead?.email
        ? String(lead.email)
        : undefined,
    customerPhone: customer?.phone
      ? String(customer.phone)
      : lead?.phoneNumber
        ? String(lead.phoneNumber)
        : undefined,
    orderId: order ? String(order._id ?? order.id) : refId(doc.orderId),
    orderCode: order?.orderCode ? String(order.orderCode) : undefined,
    assignedToId: assigned
      ? String(assigned._id ?? assigned.id)
      : refId(doc.assignedToId),
    assignedToName: assigned?.name ? String(assigned.name) : undefined,
    sentAt: iso(doc.sentAt),
    acceptedAt: iso(doc.acceptedAt),
    createdById: refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
  };
}

export function serializeDocument(doc: Record<string, unknown>, id?: string) {
  const createdBy =
    doc.createdById && typeof doc.createdById === "object"
      ? (doc.createdById as Record<string, unknown>)
      : null;

  const docId = id || String(doc._id ?? doc.id);
  const resourceType = (doc.resourceType || "raw") as "image" | "raw";
  const publicId = String(doc.publicId || "");
  const previewUrl = `/api/documents/${docId}/file?disposition=inline`;
  const downloadUrl = `/api/documents/${docId}/file?disposition=attachment`;

  return {
    id: docId,
    documentCode: doc.documentCode,
    title: doc.title,
    fileName: doc.fileName,
    category: doc.category,
    entityType: doc.entityType,
    entityId: String(doc.entityId ?? ""),
    entityLabel: doc.entityLabel || "",
    entityCode: doc.entityCode || "",
    mimeType: doc.mimeType,
    fileSize: doc.fileSize ?? 0,
    publicId,
    url: previewUrl,
    resourceType,
    previewUrl,
    downloadUrl,
    createdById: createdBy
      ? String(createdBy._id ?? createdBy.id)
      : refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
  };
}

export function serializeShipment(doc: Record<string, unknown>) {
  const order =
    doc.orderId && typeof doc.orderId === "object"
      ? (doc.orderId as Record<string, unknown>)
      : null;
  const company =
    doc.companyId && typeof doc.companyId === "object"
      ? (doc.companyId as Record<string, unknown>)
      : null;
  const customer =
    doc.customerId && typeof doc.customerId === "object"
      ? (doc.customerId as Record<string, unknown>)
      : null;
  const assignee =
    doc.assignedToId && typeof doc.assignedToId === "object"
      ? (doc.assignedToId as Record<string, unknown>)
      : null;

  return {
    id: String(doc._id ?? doc.id),
    shipmentCode: doc.shipmentCode,
    shipmentReference: doc.shipmentReference || "",
    containerReference: doc.containerReference || "",
    orderId: order ? String(order._id ?? order.id) : refId(doc.orderId),
    orderCode: order?.orderCode ? String(order.orderCode) : "",
    orderStatus: order?.status ? String(order.status) : "",
    companyId: company ? String(company._id ?? company.id) : refId(doc.companyId),
    companyName: company?.name ? String(company.name) : "",
    customerId: customer ? String(customer._id ?? customer.id) : refId(doc.customerId),
    customerName: customer?.name ? String(customer.name) : "",
    product: doc.product || "",
    quantity: doc.quantity || "",
    originPort: doc.originPort || "",
    destinationPort: doc.destinationPort || "",
    etd: iso(doc.etd),
    eta: iso(doc.eta),
    carrier: doc.carrier || "",
    shippingLine: doc.shippingLine || "",
    trackingNumber: doc.trackingNumber || "",
    status: doc.status,
    notes: doc.notes || "",
    assignedToId: assignee ? String(assignee._id ?? assignee.id) : refId(doc.assignedToId),
    assignedToName: assignee?.name ? String(assignee.name) : "",
    createdById: refId(doc.createdById) || "",
    createdAt: iso(doc.createdAt) || new Date().toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date().toISOString(),
    revision: revisionOf(doc),
  };
}
