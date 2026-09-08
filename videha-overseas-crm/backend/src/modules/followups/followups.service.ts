import { FollowUp, FOLLOWUP_TYPES, FOLLOWUP_STATUSES, type FollowUpType, type FollowUpStatus } from "../../models/FollowUp";
import { Lead } from "../../models/Lead";
import { LeadActivity } from "../../models/LeadActivity";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { serializeFollowUp } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import { buildAssigneeVisibilityFilter } from "../../utils/visibility";
import { exportFilename } from "../../utils/csv";
import { streamCsvExport } from "../../utils/csvExport";
import { FOLLOWUP_EXPORT_COLUMNS } from "../../constants/exportColumns";

const POPULATE = [
  { path: "leadId", select: "leadCode company name status" },
  { path: "assignedToId", select: "name email" },
];

function dayBounds(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function addLeadActivity(
  leadId: string,
  type: "followup_created" | "followup_completed",
  title: string,
  description: string,
  actor: AuthUser,
  session?: import("mongoose").ClientSession,
) {
  await LeadActivity.create(
    [
      {
        leadId,
        type,
        title,
        description,
        performedById: actor.id,
        performedByName: actor.name,
      },
    ],
    session ? { session } : undefined,
  );
}

function normalizeInput(body: Record<string, unknown>) {
  const type = String(body.type || "Call");
  const status = String(body.status || "Pending");

  if (!FOLLOWUP_TYPES.includes(type as FollowUpType)) {
    throw new AppError(`Invalid follow-up type: ${type}`, 400);
  }
  if (status && !FOLLOWUP_STATUSES.includes(status as FollowUpStatus)) {
    throw new AppError(`Invalid follow-up status: ${status}`, 400);
  }

  const dueAtRaw = body.dueAt ?? body.dueDate;
  const dueAt =
    dueAtRaw === null || dueAtRaw === undefined || dueAtRaw === ""
      ? undefined
      : new Date(String(dueAtRaw));

  if (dueAt && Number.isNaN(dueAt.getTime())) {
    throw new AppError("Invalid due date.", 400);
  }

  return {
    leadId: optionalObjectId((body.leadId as string | null | undefined) ?? null),
    assignedToId: optionalObjectId(
      (body.assignedToId ?? body.assignedMemberId ?? null) as string | null,
    ),
    dueAt,
    type: type as FollowUpType,
    status: status as FollowUpStatus,
    outcome: body.outcome !== undefined ? String(body.outcome || "") : undefined,
    notes: body.notes !== undefined ? String(body.notes || "") : undefined,
  };
}

function applyScheduleFilter(
  query: Record<string, unknown>,
  schedule?: string,
) {
  if (!schedule || schedule === "all") return;

  const { start, end } = dayBounds();

  if (schedule === "today") {
    query.dueAt = { $gte: start, $lt: end };
    query.status = query.status ?? "Pending";
  } else if (schedule === "upcoming") {
    query.dueAt = { $gte: end };
    query.status = query.status ?? "Pending";
  } else if (schedule === "overdue") {
    query.dueAt = { $lt: start };
    query.status = query.status ?? "Pending";
  } else {
    throw new AppError(`Invalid schedule filter: ${schedule}`, 400);
  }
}

export async function syncFollowUpFromLead(
  lead: {
    _id: import("mongoose").Types.ObjectId;
    assignedToId: import("mongoose").Types.ObjectId | null;
    nextFollowUp: Date | null;
  },
  actor: AuthUser,
  session?: import("mongoose").ClientSession,
) {
  if (!lead.nextFollowUp) return;

  const assignedToId = lead.assignedToId ? String(lead.assignedToId) : actor.id;
  const assignee = await User.findById(assignedToId).session(session ?? null);
  if (!assignee || assignee.status !== "active") return;

  const existing = await FollowUp.findOne({
    leadId: lead._id,
    status: "Pending",
  })
    .sort({ dueAt: 1 })
    .session(session ?? null);

  if (existing) {
    existing.dueAt = lead.nextFollowUp;
    existing.assignedToId = assignee._id;
    await existing.save({ session });
    return;
  }

  await FollowUp.create(
    [
      {
        leadId: lead._id,
        assignedToId: assignee._id,
        dueAt: lead.nextFollowUp,
        type: "Call",
        status: "Pending",
        outcome: "",
        notes: "Scheduled from lead next follow-up.",
        createdById: actor.id,
      },
    ],
    session ? { session } : undefined,
  );
}

async function buildFollowUpsQuery(
  filters: {
    schedule?: string;
    leadId?: string;
    assignedToId?: string;
    status?: string;
    type?: string;
    search?: string;
  },
  actor?: AuthUser,
) {
  const clauses: Record<string, unknown>[] = [];

  const scheduleQuery: Record<string, unknown> = {};
  applyScheduleFilter(scheduleQuery, filters.schedule);
  if (Object.keys(scheduleQuery).length > 0) clauses.push(scheduleQuery);

  if (filters.leadId) {
    assertObjectId(filters.leadId, "leadId");
    clauses.push({ leadId: filters.leadId });
  }
  if (filters.assignedToId && filters.assignedToId !== "all") {
    assertObjectId(filters.assignedToId, "assignedToId");
    clauses.push({ assignedToId: filters.assignedToId });
  } else if (actor && !filters.leadId) {
    const visibility = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
    if (Object.keys(visibility).length > 0) clauses.push(visibility);
  }
  if (filters.status && filters.status !== "all") {
    if (!FOLLOWUP_STATUSES.includes(filters.status as FollowUpStatus)) {
      throw new AppError(`Invalid follow-up status: ${filters.status}`, 400);
    }
    clauses.push({ status: filters.status });
  }
  if (filters.type && filters.type !== "all") {
    if (!FOLLOWUP_TYPES.includes(filters.type as FollowUpType)) {
      throw new AppError(`Invalid follow-up type: ${filters.type}`, 400);
    }
    clauses.push({ type: filters.type });
  }

  if (filters.search?.trim()) {
    const leadIds = await Lead.find({
      archived: { $ne: true },
      $or: [
        { leadCode: new RegExp(filters.search.trim(), "i") },
        { company: new RegExp(filters.search.trim(), "i") },
        { name: new RegExp(filters.search.trim(), "i") },
      ],
    })
      .select("_id")
      .lean();
    clauses.push({ leadId: { $in: leadIds.map((l) => l._id) } });
  }

  return clauses.length === 0 ? {} : clauses.length === 1 ? clauses[0] : { $and: clauses };
}

export async function exportFollowUps(
  filters: {
    schedule?: string;
    leadId?: string;
    assignedToId?: string;
    status?: string;
    type?: string;
    search?: string;
  },
  actor: AuthUser,
) {
  const query = await buildFollowUpsQuery(filters, actor);
  const result = await streamCsvExport({
    columns: FOLLOWUP_EXPORT_COLUMNS,
    count: () => FollowUp.countDocuments(query),
    fetchBatch: async (skip, limit) => {
      const docs = await FollowUp.find(query)
        .populate(POPULATE)
        .sort({ dueAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
      return docs.map((d) =>
        serializeFollowUp(d.toObject() as unknown as Record<string, unknown>) as Record<string, unknown>,
      );
    },
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Follow-ups Exported",
    entity: "FollowUp",
    entityId: "export",
    details: `Exported ${result.total} follow-up(s) to CSV.`,
  });

  return { body: result.body, filename: exportFilename("followups"), total: result.total };
}

export async function listFollowUps(
  filters: {
    schedule?: string;
    leadId?: string;
    assignedToId?: string;
    status?: string;
    type?: string;
    search?: string;
    page?: unknown;
    limit?: unknown;
  },
  actor?: AuthUser,
) {
  const { page, limit, skip } = parsePagination(filters);
  const query = await buildFollowUpsQuery(filters, actor);

  const [total, docs] = await Promise.all([
    FollowUp.countDocuments(query),
    FollowUp.find(query)
      .populate(POPULATE)
      .sort({ dueAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const items = docs.map((d) => serializeFollowUp(d.toObject() as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getFollowUp(id: string) {
  assertObjectId(id, "follow-up id");
  const doc = await FollowUp.findById(id).populate(POPULATE);
  if (!doc) throw new AppError("Follow-up not found.", 404);
  return serializeFollowUp(doc.toObject() as unknown as Record<string, unknown>);
}

export async function createFollowUp(body: Record<string, unknown>, actor: AuthUser) {
  const clientRequestId = parseClientRequestId(body);
  if (clientRequestId) {
    const existing = await FollowUp.findOne({ clientRequestId }).populate(POPULATE);
    if (existing) {
      return serializeFollowUp(existing.toObject() as unknown as Record<string, unknown>);
    }
  }

  const input = normalizeInput(body);
  if (!input.leadId) throw new AppError("Lead is required.", 400);
  if (!input.assignedToId) throw new AppError("Assigned team member is required.", 400);
  if (!input.dueAt) throw new AppError("Due date/time is required.", 400);

  const [lead, assignee] = await Promise.all([
    Lead.findById(input.leadId),
    User.findById(input.assignedToId),
  ]);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);
  if (!assignee || assignee.status !== "active") {
    throw new AppError("Assigned member not found.", 400);
  }

  const doc = await FollowUp.create({
    leadId: input.leadId,
    assignedToId: input.assignedToId,
    dueAt: input.dueAt,
    type: input.type,
    status: input.status || "Pending",
    outcome: input.outcome || "",
    notes: input.notes || "",
    createdById: actor.id,
    ...(clientRequestId ? { clientRequestId } : {}),
  });

  await addLeadActivity(
    String(lead._id),
    "followup_created",
    "Follow-up Scheduled",
    `${input.type} follow-up scheduled for ${input.dueAt.toISOString()}.`,
    actor,
  );

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Follow-up Created",
    entity: "Lead",
    entityId: String(lead._id),
    details: `Scheduled ${input.type} follow-up for ${lead.leadCode}.`,
  });

  await doc.populate(POPULATE);
  return serializeFollowUp(doc.toObject() as unknown as Record<string, unknown>);
}

export async function updateFollowUp(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "follow-up id");
  const existing = await FollowUp.findById(id);
  if (!existing) throw new AppError("Follow-up not found.", 404);
  if (existing.status !== "Pending") {
    throw new AppError("Only pending follow-ups can be edited.", 409, "FOLLOWUP_NOT_PENDING");
  }

  const input = normalizeInput({ ...existing.toObject(), ...body });
  const expectedRevision = parseRevision(body);
  const setFields: Record<string, unknown> = {};

  if (body.leadId !== undefined) {
    if (!input.leadId) throw new AppError("Lead is required.", 400);
    const lead = await Lead.findById(input.leadId);
    if (!lead || lead.archived) throw new AppError("Lead not found.", 404);
    setFields.leadId = input.leadId;
  }
  if (body.assignedToId !== undefined || body.assignedMemberId !== undefined) {
    if (!input.assignedToId) throw new AppError("Assigned team member is required.", 400);
    const assignee = await User.findById(input.assignedToId);
    if (!assignee || assignee.status !== "active") {
      throw new AppError("Assigned member not found.", 400);
    }
    setFields.assignedToId = input.assignedToId;
  }
  if (body.dueAt !== undefined || body.dueDate !== undefined) {
    if (!input.dueAt) throw new AppError("Due date/time is required.", 400);
    setFields.dueAt = input.dueAt;
  }
  if (body.type !== undefined) setFields.type = input.type;
  if (body.notes !== undefined) setFields.notes = input.notes ?? "";

  if (Object.keys(setFields).length === 0) {
    await existing.populate(POPULATE);
    return serializeFollowUp(existing.toObject() as unknown as Record<string, unknown>);
  }

  const doc = await applyOptimisticUpdate(FollowUp, id, expectedRevision, setFields, {
    notFoundMessage: "Follow-up not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Follow-up Updated",
    entity: "Lead",
    entityId: String(doc.leadId),
    details: `Updated follow-up ${String(doc._id)}.`,
  });

  await doc.populate(POPULATE);
  return serializeFollowUp(doc.toObject() as unknown as Record<string, unknown>);
}

async function completeOrSkip(
  id: string,
  status: "Completed" | "Skipped",
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "follow-up id");
  const existing = await FollowUp.findById(id);
  if (!existing) throw new AppError("Follow-up not found.", 404);
  if (existing.status !== "Pending") {
    throw new AppError(`Follow-up is already ${existing.status.toLowerCase()}.`, 409);
  }

  const expectedRevision = parseRevision(body);
  const outcome = body.outcome !== undefined ? String(body.outcome || "") : existing.outcome;
  const notes = body.notes !== undefined ? String(body.notes || "") : existing.notes;

  const doc = await applyOptimisticUpdate(
    FollowUp,
    id,
    expectedRevision,
    {
      status,
      outcome,
      notes,
      completedAt: new Date(),
    },
    { notFoundMessage: "Follow-up not found." },
  );

  await addLeadActivity(
    String(doc.leadId),
    "followup_completed",
    status === "Completed" ? "Follow-up Completed" : "Follow-up Skipped",
    `${doc.type} follow-up marked as ${status.toLowerCase()}${outcome ? `: ${outcome}` : ""}.`,
    actor,
  );

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: status === "Completed" ? "Follow-up Completed" : "Follow-up Skipped",
    entity: "Lead",
    entityId: String(doc.leadId),
    details: `${doc.type} follow-up ${status.toLowerCase()}.`,
  });

  await doc.populate(POPULATE);
  return serializeFollowUp(doc.toObject() as unknown as Record<string, unknown>);
}

export function completeFollowUp(id: string, body: Record<string, unknown>, actor: AuthUser) {
  return completeOrSkip(id, "Completed", body, actor);
}

export function skipFollowUp(id: string, body: Record<string, unknown>, actor: AuthUser) {
  return completeOrSkip(id, "Skipped", body, actor);
}

export async function deleteFollowUp(id: string, actor: AuthUser) {
  assertObjectId(id, "follow-up id");
  const doc = await FollowUp.findById(id);
  if (!doc) throw new AppError("Follow-up not found.", 404);

  await doc.deleteOne();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Follow-up Deleted",
    entity: "Lead",
    entityId: String(doc.leadId),
    details: `Deleted ${doc.type} follow-up scheduled for ${doc.dueAt.toISOString()}.`,
  });
}
