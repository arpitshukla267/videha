import { Types } from "mongoose";
import { Lead } from "../models/Lead";
import { Company } from "../models/Company";
import { Customer } from "../models/Customer";
import { Quotation, type QuotationStatus } from "../models/Quotation";
import { Order } from "../models/Order";
import { Document } from "../models/Document";
import { AppError } from "./AppError";
import type { AuthUser } from "../middleware/auth";
import {
  buildAssigneeVisibilityFilter,
  isAdminRole,
  isManagerRole,
  resolveVisibilityScope,
  userIdsInActorScope,
} from "./visibility";

type QuotationRecord = {
  _id: Types.ObjectId | string;
  status: QuotationStatus;
  createdById: Types.ObjectId | string;
  assignedToId?: Types.ObjectId | string | null;
};

async function visibleLeadIds(actor: AuthUser): Promise<Types.ObjectId[]> {
  const filter = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
  return Lead.find({ archived: { $ne: true }, ...filter }).distinct("_id");
}

async function visibleCustomerIds(actor: AuthUser): Promise<Types.ObjectId[]> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return [];

  const leadIds = await visibleLeadIds(actor);
  const creatorFilter = await buildAssigneeVisibilityFilter(actor, "createdById");
  const clauses: Record<string, unknown>[] = [];
  if (leadIds.length > 0) {
    clauses.push({ relatedLeadId: { $in: leadIds } });
  }
  if (Object.keys(creatorFilter).length > 0) {
    clauses.push(creatorFilter);
  }
  if (clauses.length === 0) return [];

  return Customer.find(clauses.length === 1 ? clauses[0] : { $or: clauses }).distinct("_id");
}

/** Quotations visible via assignee/creator OR linked lead/customer access. */
export async function buildQuotationVisibilityFilter(
  actor: AuthUser,
): Promise<Record<string, unknown>> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return {};

  const assigneeVisibility = await buildAssigneeVisibilityFilter(
    actor,
    "assignedToId",
    "createdById",
  );
  const [leadIds, customerIds] = await Promise.all([
    visibleLeadIds(actor),
    visibleCustomerIds(actor),
  ]);
  const clauses: Record<string, unknown>[] = [];

  if (Object.keys(assigneeVisibility).length > 0) {
    clauses.push(assigneeVisibility);
  }
  if (leadIds.length > 0) {
    clauses.push({ leadId: { $in: leadIds } });
  }
  if (customerIds.length > 0) {
    clauses.push({ customerId: { $in: customerIds } });
  }

  if (clauses.length === 0) {
    return { _id: null };
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

export async function canAccessQuotation(actor: AuthUser, quotationId: string): Promise<boolean> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return true;

  const filter = await buildQuotationVisibilityFilter(actor);
  if (Object.keys(filter).length === 0) return true;

  const match = await Quotation.findOne({ _id: quotationId, ...filter }).select("_id").lean();
  return Boolean(match);
}

export async function assertQuotationView(actor: AuthUser, quotationId: string): Promise<void> {
  const allowed = await canAccessQuotation(actor, quotationId);
  if (!allowed) {
    throw new AppError("Quotation not found.", 404);
  }
}

function isQuotationOwner(actor: AuthUser, quotation: QuotationRecord): boolean {
  if (String(quotation.createdById) === actor.id) return true;
  if (quotation.assignedToId && String(quotation.assignedToId) === actor.id) return true;
  return false;
}

async function isDepartmentQuotation(actor: AuthUser, quotation: QuotationRecord): Promise<boolean> {
  if (!isManagerRole(actor.roleName)) return false;
  const scopeIds = await userIdsInActorScope(actor);
  const allowed = new Set(scopeIds.map(String));
  if (allowed.has(String(quotation.createdById))) return true;
  if (quotation.assignedToId && allowed.has(String(quotation.assignedToId))) return true;
  return false;
}

async function assertDraftOwnerOrElevated(
  actor: AuthUser,
  quotation: QuotationRecord,
  action: "edit" | "send" | "delete" | "status",
): Promise<void> {
  if (isAdminRole(actor.roleName)) return;

  if (quotation.status !== "Draft" && action !== "status") {
    throw new AppError("Only draft quotations can be modified this way.", 403, "FORBIDDEN");
  }

  if (isManagerRole(actor.roleName)) {
    if (await isDepartmentQuotation(actor, quotation)) return;
    throw new AppError(
      `You do not have permission to ${action} this quotation.`,
      403,
      "FORBIDDEN",
    );
  }

  if (isQuotationOwner(actor, quotation)) return;

  throw new AppError(
    `You do not have permission to ${action} this quotation.`,
    403,
    "FORBIDDEN",
  );
}

export async function assertQuotationEdit(
  actor: AuthUser,
  quotation: QuotationRecord,
): Promise<void> {
  await assertQuotationView(actor, String(quotation._id));

  if (isAdminRole(actor.roleName)) {
    if (["Accepted", "Cancelled"].includes(quotation.status)) {
      throw new AppError(`Cannot edit quotation in ${quotation.status} status.`, 400);
    }
    return;
  }

  if (quotation.status !== "Draft") {
    throw new AppError(
      "Sent, negotiation, and accepted quotations cannot be edited.",
      403,
      "FORBIDDEN",
    );
  }

  await assertDraftOwnerOrElevated(actor, quotation, "edit");
}

export async function assertQuotationSend(
  actor: AuthUser,
  quotation: QuotationRecord,
): Promise<void> {
  await assertQuotationView(actor, String(quotation._id));

  if (isAdminRole(actor.roleName)) return;

  if (quotation.status !== "Draft") {
    throw new AppError("Only draft quotations can be sent.", 403, "FORBIDDEN");
  }

  await assertDraftOwnerOrElevated(actor, quotation, "send");
}

export async function assertQuotationStatusChange(
  actor: AuthUser,
  quotation: QuotationRecord,
  nextStatus: QuotationStatus,
): Promise<void> {
  await assertQuotationView(actor, String(quotation._id));

  if (isAdminRole(actor.roleName)) return;

  if (quotation.status === "Draft" && nextStatus === "Sent") {
    await assertQuotationSend(actor, quotation);
    return;
  }

  if (isManagerRole(actor.roleName)) {
    if (await isDepartmentQuotation(actor, quotation)) return;
    throw new AppError(
      "You do not have permission to change this quotation status.",
      403,
      "FORBIDDEN",
    );
  }

  if (isQuotationOwner(actor, quotation)) return;

  throw new AppError(
    "You do not have permission to change this quotation status.",
    403,
    "FORBIDDEN",
  );
}

export async function assertQuotationDelete(
  actor: AuthUser,
  quotation: QuotationRecord,
): Promise<void> {
  await assertQuotationView(actor, String(quotation._id));

  if (isAdminRole(actor.roleName)) return;

  if (quotation.status !== "Draft") {
    throw new AppError("Only draft quotations can be deleted.", 403, "FORBIDDEN");
  }

  await assertDraftOwnerOrElevated(actor, quotation, "delete");
}

export async function assertQuotationOrderCreate(
  actor: AuthUser,
  quotation: QuotationRecord,
): Promise<void> {
  await assertQuotationView(actor, String(quotation._id));

  if (isAdminRole(actor.roleName)) return;

  if (isManagerRole(actor.roleName)) {
    if (await isDepartmentQuotation(actor, quotation)) return;
    throw new AppError(
      "You do not have permission to create an order from this quotation.",
      403,
      "FORBIDDEN",
    );
  }

  if (isQuotationOwner(actor, quotation)) return;

  throw new AppError(
    "You do not have permission to create an order from this quotation.",
    403,
    "FORBIDDEN",
  );
}

/** Documents visible when linked entity is accessible to the actor. */
export async function buildDocumentVisibilityFilter(
  actor: AuthUser,
): Promise<Record<string, unknown>> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return {};

  const leadFilter = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
  const companyFilter = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
  const creatorFilter = await buildAssigneeVisibilityFilter(actor, "createdById");

  const [leadIds, companyIds] = await Promise.all([
    Lead.find({ archived: { $ne: true }, ...leadFilter }).distinct("_id"),
    Company.find(companyFilter).distinct("_id"),
  ]);

  const customerClauses: Record<string, unknown>[] = [];
  if (leadIds.length > 0) {
    customerClauses.push({ relatedLeadId: { $in: leadIds } });
  }
  if (Object.keys(creatorFilter).length > 0) {
    customerClauses.push(creatorFilter);
  }
  const customerIds =
    customerClauses.length > 0
      ? await Customer.find(
          customerClauses.length === 1 ? customerClauses[0] : { $or: customerClauses },
        ).distinct("_id")
      : [];

  const quotationFilter = await buildQuotationVisibilityFilter(actor);
  const quotationIds =
    Object.keys(quotationFilter).length > 0
      ? await Quotation.find(quotationFilter).distinct("_id")
      : [];

  const orderClauses: Record<string, unknown>[] = [];
  const orderAssignee = await buildAssigneeVisibilityFilter(
    actor,
    "assignedToId",
    "createdById",
  );
  if (Object.keys(orderAssignee).length > 0) {
    orderClauses.push(orderAssignee);
  }
  if (leadIds.length > 0) {
    orderClauses.push({ relatedLeadId: { $in: leadIds } });
  }
  const orderIds =
    orderClauses.length > 0
      ? await Order.find(orderClauses.length === 1 ? orderClauses[0] : { $or: orderClauses }).distinct(
          "_id",
        )
      : [];

  const orClauses: Record<string, unknown>[] = [];
  if (leadIds.length > 0) {
    orClauses.push({ entityType: "Lead", entityId: { $in: leadIds } });
  }
  if (companyIds.length > 0) {
    orClauses.push({ entityType: "Company", entityId: { $in: companyIds } });
  }
  if (customerIds.length > 0) {
    orClauses.push({ entityType: "Customer", entityId: { $in: customerIds } });
  }
  if (quotationIds.length > 0) {
    orClauses.push({ entityType: "Quotation", entityId: { $in: quotationIds } });
  }
  if (orderIds.length > 0) {
    orClauses.push({ entityType: "Order", entityId: { $in: orderIds } });
  }

  if (orClauses.length === 0) {
    return { _id: null };
  }
  return { $or: orClauses };
}

export async function assertDocumentAccess(actor: AuthUser, documentId: string): Promise<void> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return;

  const filter = await buildDocumentVisibilityFilter(actor);
  const allowed = await Document.findOne({ _id: documentId, ...filter }).select("_id").lean();
  if (!allowed) {
    throw new AppError("Document not found.", 404);
  }
}
