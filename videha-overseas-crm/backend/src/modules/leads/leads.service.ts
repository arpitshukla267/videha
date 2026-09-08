import { Lead, LEAD_STATUSES, type LeadStatus, type Priority } from "../../models/Lead";
import { LeadNote } from "../../models/LeadNote";
import { LeadActivity, type LeadActivityType } from "../../models/LeadActivity";
import { Company } from "../../models/Company";
import { Customer } from "../../models/Customer";
import {
  CallLog,
  CALL_CHANNELS,
  CALL_DIRECTIONS,
  CALL_OUTCOMES,
  INTEREST_LEVELS,
  type CallChannel,
  type CallDirection,
  type CallOutcome,
  type InterestLevel,
} from "../../models/CallLog";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextLeadCode, nextCompanyCode, nextCustomerCode } from "../../utils/codes";
import {
  serializeLead,
  serializeLeadSummary,
  serializeLeadNote,
  serializeLeadActivity,
  serializeCallLog,
  serializeCompany,
  serializeCustomer,
} from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { withTransaction } from "../../utils/transactions";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import { syncFollowUpFromLead } from "../followups/followups.service";
import type { AuthUser } from "../../middleware/auth";
import { User } from "../../models/User";
import {
  isClosedLeadStatus,
  isConvertibleLeadStatus,
  isLostLeadStatus,
  isWonLeadStatus,
} from "../../constants/leadPipeline";
import { buildAssigneeVisibilityFilter } from "../../utils/visibility";

type ActivityType = LeadActivityType;

const OUTCOME_LABELS: Record<CallOutcome, string> = {
  picked_up: "Call picked up",
  not_picked_up: "Call not picked up",
  busy: "Line busy",
  voicemail: "Voicemail left",
  wrong_number: "Wrong number",
  switched_off: "Phone switched off",
  callback_requested: "Callback requested",
  no_answer: "No answer",
};

function outcomeFromPickedUp(pickedUp: boolean, outcome?: string): CallOutcome {
  if (outcome && CALL_OUTCOMES.includes(outcome as CallOutcome)) {
    return outcome as CallOutcome;
  }
  return pickedUp ? "picked_up" : "not_picked_up";
}

function buildCallActivityDescription(input: {
  channel: CallChannel;
  direction: CallDirection;
  outcome: CallOutcome;
  durationMinutes: number;
  spokeWith: string;
  interestLevel: InterestLevel;
  disposition: string;
  notes: string;
}) {
  const parts = [
    `${input.direction === "inbound" ? "Inbound" : "Outbound"} ${input.channel.replace("_", " ")} — ${OUTCOME_LABELS[input.outcome]}.`,
  ];
  if (input.spokeWith) parts.push(`Spoke with: ${input.spokeWith}.`);
  if (input.durationMinutes > 0) parts.push(`Duration: ${input.durationMinutes} min.`);
  if (input.interestLevel !== "none") {
    parts.push(`Interest: ${input.interestLevel.charAt(0).toUpperCase()}${input.interestLevel.slice(1)}.`);
  }
  if (input.disposition) parts.push(`Disposition: ${input.disposition}.`);
  if (input.notes) parts.push(`Notes: ${input.notes}`);
  return parts.join(" ");
}

function suggestedStatusAfterCall(
  currentStatus: LeadStatus,
  pickedUp: boolean,
  interestLevel: InterestLevel,
): LeadStatus | null {
  if (isClosedLeadStatus(currentStatus)) return null;
  if (pickedUp) {
    if (interestLevel === "hot") return "Qualified";
    if (currentStatus === "New") return "Contacted";
    return null;
  }
  if (["New", "Contacted", "Qualified", "Interested", "Follow-up"].includes(currentStatus)) {
    return "Contacted";
  }
  return null;
}

async function addActivity(
  leadId: string,
  type: ActivityType,
  title: string,
  description: string,
  actor: AuthUser,
  session?: import("mongoose").ClientSession,
) {
  const docs = await LeadActivity.create(
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
  return docs[0];
}

function normalizeLeadInput(body: Record<string, unknown>) {
  const source = (body.source ?? body.leadSource ?? "Direct Inquiry") as string;
  const status = (body.status ?? body.leadStatus ?? "New") as string;
  const assignedToId = optionalObjectId(
    (body.assignedToId ?? body.assignedMemberId ?? null) as string | null,
  );
  const departmentId = optionalObjectId((body.departmentId ?? null) as string | null);

  if (status && !LEAD_STATUSES.includes(status as LeadStatus)) {
    throw new AppError(`Invalid lead status: ${status}`, 400);
  }

  return {
    name: body.name as string | undefined,
    company: body.company as string | undefined,
    phoneNumber: body.phoneNumber as string | undefined,
    whatsAppNumber: (body.whatsAppNumber as string | undefined) ?? undefined,
    email: body.email as string | undefined,
    country: body.country as string | undefined,
    source,
    productInterest: body.productInterest as string | undefined,
    status: status as LeadStatus,
    priority: (body.priority as Priority | undefined) || undefined,
    assignedToId,
    departmentId,
    companyId: optionalObjectId((body.companyId as string | null | undefined) ?? null),
    customerId: optionalObjectId((body.customerId as string | null | undefined) ?? null),
    lostReason: body.lostReason !== undefined ? String(body.lostReason || "").trim() : undefined,
    nextFollowUp: body.nextFollowUp
      ? new Date(String(body.nextFollowUp))
      : body.nextFollowUp === null
        ? null
        : undefined,
    notes: body.notes as string | undefined,
  };
}

const POPULATE = [{ path: "assignedToId", select: "name email" }, { path: "departmentId", select: "name" }];

const LEAD_LIST_SELECT =
  "leadCode name company phoneNumber email country source productInterest status priority assignedToId nextFollowUp revision createdAt updatedAt";

export async function listLeads(
  filters: {
    search?: string;
    status?: string;
    country?: string;
    priority?: string;
    assignedMemberId?: string;
    page?: unknown;
    limit?: unknown;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  actor?: AuthUser,
) {
  const { page, limit, skip } = parsePagination(filters);
  const clauses: Record<string, unknown>[] = [{ archived: { $ne: true } }];

  if (filters.status && filters.status !== "all") clauses.push({ status: filters.status });
  if (filters.country && filters.country !== "all") clauses.push({ country: filters.country });
  if (filters.priority && filters.priority !== "all") clauses.push({ priority: filters.priority });
  if (filters.assignedMemberId && filters.assignedMemberId !== "all") {
    if (filters.assignedMemberId === "unassigned") {
      clauses.push({ assignedToId: null });
    } else {
      assertObjectId(filters.assignedMemberId, "assignedMemberId");
      clauses.push({ assignedToId: filters.assignedMemberId });
    }
  } else if (actor) {
    const visibility = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
    if (Object.keys(visibility).length > 0) clauses.push(visibility);
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    clauses.push({
      $or: [
        { name: new RegExp(s, "i") },
        { company: new RegExp(s, "i") },
        { leadCode: new RegExp(s, "i") },
        { phoneNumber: new RegExp(s, "i") },
        { email: new RegExp(s, "i") },
        { productInterest: new RegExp(s, "i") },
      ],
    });
  }

  const query = clauses.length === 1 ? clauses[0] : { $and: clauses };

  const sortFieldMap: Record<string, string> = {
    createdDate: "createdAt",
    createdAt: "createdAt",
    name: "name",
    company: "company",
    priority: "priority",
    status: "status",
    leadStatus: "status",
    nextFollowUp: "nextFollowUp",
  };
  const sortField = sortFieldMap[filters.sortBy || "createdDate"] || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

  const [total, docs] = await Promise.all([
    Lead.countDocuments(query),
    Lead.find(query)
      .select(LEAD_LIST_SELECT)
      .populate(POPULATE)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const items = docs.map((d) => serializeLeadSummary(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function listLeadActivities(
  leadId: string,
  query: { page?: unknown; limit?: unknown },
) {
  assertObjectId(leadId, "lead id");
  const { page, limit, skip } = parsePagination(query);
  const filter = { leadId };
  const [total, docs] = await Promise.all([
    LeadActivity.countDocuments(filter),
    LeadActivity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  const items = docs.map((d) => serializeLeadActivity(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function listLeadNotes(leadId: string, query: { page?: unknown; limit?: unknown }) {
  assertObjectId(leadId, "lead id");
  const { page, limit, skip } = parsePagination(query);
  const filter = { leadId };
  const [total, docs] = await Promise.all([
    LeadNote.countDocuments(filter),
    LeadNote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  const items = docs.map((d) => serializeLeadNote(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function listLeadCalls(leadId: string, query: { page?: unknown; limit?: unknown }) {
  assertObjectId(leadId, "lead id");
  const { page, limit, skip } = parsePagination(query);
  const filter = { leadId };
  const [total, docs] = await Promise.all([
    CallLog.countDocuments(filter),
    CallLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  const items = docs.map((d) => serializeCallLog(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getLead(
  id: string,
  relatedQuery: {
    activitiesPage?: unknown;
    activitiesLimit?: unknown;
    notesPage?: unknown;
    notesLimit?: unknown;
    callsPage?: unknown;
    callsLimit?: unknown;
  } = {},
) {
  assertObjectId(id, "lead id");
  const lead = await Lead.findById(id).populate(POPULATE);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);

  const [activitiesResult, notesResult, callLogsResult] = await Promise.all([
    listLeadActivities(id, {
      page: relatedQuery.activitiesPage,
      limit: relatedQuery.activitiesLimit,
    }),
    listLeadNotes(id, { page: relatedQuery.notesPage, limit: relatedQuery.notesLimit }),
    listLeadCalls(id, { page: relatedQuery.callsPage, limit: relatedQuery.callsLimit }),
  ]);

  return {
    lead: serializeLead(lead.toObject() as unknown as Record<string, unknown>),
    activities: activitiesResult.items,
    notes: notesResult.items,
    callLogs: callLogsResult.items,
    activitiesPagination: {
      total: activitiesResult.total,
      page: activitiesResult.page,
      limit: activitiesResult.limit,
      totalPages: activitiesResult.totalPages,
    },
    notesPagination: {
      total: notesResult.total,
      page: notesResult.page,
      limit: notesResult.limit,
      totalPages: notesResult.totalPages,
    },
    callLogsPagination: {
      total: callLogsResult.total,
      page: callLogsResult.page,
      limit: callLogsResult.limit,
      totalPages: callLogsResult.totalPages,
    },
  };
}

export async function createLead(body: Record<string, unknown>, actor: AuthUser) {
  const clientRequestId = parseClientRequestId(body);
  if (clientRequestId) {
    const existing = await Lead.findOne({ clientRequestId }).populate(POPULATE);
    if (existing) {
      return serializeLead(existing.toObject() as unknown as Record<string, unknown>);
    }
  }

  const input = normalizeLeadInput(body);
  if (!input.name || !input.company || !input.phoneNumber || !input.country) {
    throw new AppError("Name, company, phone number, and country are required.", 400);
  }

  const leadCode = await nextLeadCode();
  const lead = await Lead.create({
    leadCode,
    name: input.name.trim(),
    company: input.company.trim(),
    phoneNumber: input.phoneNumber.trim(),
    whatsAppNumber: input.whatsAppNumber || input.phoneNumber,
    email: (input.email || "").toLowerCase(),
    country: input.country.trim(),
    source: input.source || "Direct Inquiry",
    productInterest: input.productInterest || "General Commodity Inquiry",
    status: input.status || "New",
    priority: input.priority || "Medium",
    assignedToId: input.assignedToId,
    departmentId: input.departmentId,
    nextFollowUp: input.nextFollowUp ?? null,
    notes: input.notes || "",
    createdById: actor.id,
    archived: false,
    clientRequestId: clientRequestId ?? null,
  });

  await addActivity(
    String(lead._id),
    "created",
    "Lead Created",
    `New inquiry registered as ${lead.leadCode}.`,
    actor,
  );

  if (input.assignedToId) {
    await addActivity(
      String(lead._id),
      "assigned",
      "Lead Assigned",
      `Lead assigned on creation.`,
      actor,
    );
    if (input.assignedToId !== actor.id) {
      await createNotification({
        userId: input.assignedToId,
        title: "New Lead Assigned",
        message: `Lead ${lead.leadCode} (${lead.company}) was assigned to you.`,
        type: "lead_assigned",
        linkUrl: `/leads/${lead._id}`,
      });
    }
  } else {
    const recipients = await User.find({ status: "active" }).select("_id");
    await Promise.all(
      recipients
        .filter((u) => String(u._id) !== actor.id)
        .map((u) =>
          createNotification({
            userId: String(u._id),
            title: "New Lead Added",
            message: `${actor.name} added unassigned lead ${lead.leadCode} (${lead.company}).`,
            type: "lead_assigned",
            linkUrl: `/leads/${lead._id}`,
          }),
        ),
    );
  }

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Lead Created",
    entity: "Lead",
    entityId: String(lead._id),
    details: `Created lead ${lead.leadCode} for ${lead.company}.`,
  });

  if (input.nextFollowUp) {
    await syncFollowUpFromLead(lead, actor);
  }

  await lead.populate(POPULATE);
  return serializeLead(lead.toObject() as unknown as Record<string, unknown>);
}

export async function updateLead(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "lead id");
  const existing = await Lead.findById(id);
  if (!existing || existing.archived) throw new AppError("Lead not found.", 404);

  const input = normalizeLeadInput({
    ...body,
    source: body.source ?? body.leadSource ?? existing.source,
    status: body.status ?? body.leadStatus ?? existing.status,
    assignedToId: body.assignedToId ?? body.assignedMemberId ?? existing.assignedToId,
    departmentId: body.departmentId !== undefined ? body.departmentId : existing.departmentId,
  });

  const prevStatus = existing.status;
  const prevPriority = existing.priority;
  const prevAssignee = existing.assignedToId ? String(existing.assignedToId) : null;
  const prevFollowUp = existing.nextFollowUp?.toISOString() || null;
  const expectedRevision = parseRevision(body);

  const setFields: Record<string, unknown> = {};
  if (input.name !== undefined) setFields.name = input.name.trim();
  if (input.company !== undefined) setFields.company = input.company.trim();
  if (input.phoneNumber !== undefined) setFields.phoneNumber = input.phoneNumber.trim();
  if (input.whatsAppNumber !== undefined) setFields.whatsAppNumber = input.whatsAppNumber;
  if (input.email !== undefined) setFields.email = input.email.toLowerCase();
  if (input.country !== undefined) setFields.country = input.country.trim();
  if (input.source !== undefined) setFields.source = input.source;
  if (input.productInterest !== undefined) setFields.productInterest = input.productInterest;
  if (input.status !== undefined) setFields.status = input.status;
  if (input.priority !== undefined) setFields.priority = input.priority;
  if (body.assignedToId !== undefined || body.assignedMemberId !== undefined) {
    setFields.assignedToId = input.assignedToId;
  }
  if (body.departmentId !== undefined) {
    setFields.departmentId = input.departmentId;
  }
  if (body.nextFollowUp !== undefined) {
    setFields.nextFollowUp = input.nextFollowUp === undefined ? existing.nextFollowUp : input.nextFollowUp;
  }
  if (input.notes !== undefined) setFields.notes = input.notes;
  if (body.companyId !== undefined) setFields.companyId = input.companyId;
  if (body.customerId !== undefined) setFields.customerId = input.customerId;

  const nextStatus = input.status ?? existing.status;
  if (input.status !== undefined && input.status !== existing.status) {
    if (input.status === "Won" && !isWonLeadStatus(existing.status)) {
      throw new AppError(
        "Use POST /api/leads/:id/convert to mark a lead as Won.",
        400,
        "WON_REQUIRES_CONVERT",
      );
    }
    if (
      isClosedLeadStatus(existing.status) &&
      !isClosedLeadStatus(input.status) &&
      expectedRevision === undefined
    ) {
      throw new AppError(
        "Reopening a closed lead requires the current revision. Please refresh and try again.",
        409,
        "REVISION_REQUIRED",
      );
    }
  }

  if (body.lostReason !== undefined || input.status !== undefined) {
    const lostReason =
      body.lostReason !== undefined ? String(body.lostReason || "").trim() : existing.lostReason;
    if (nextStatus === "Lost" && !lostReason) {
      throw new AppError("Lost reason is required when marking a lead as Lost.", 400, "LOST_REASON_REQUIRED");
    }
    if (body.lostReason !== undefined || nextStatus === "Lost") {
      setFields.lostReason = lostReason;
    }
    if (input.status !== undefined && !isLostLeadStatus(nextStatus)) {
      setFields.lostReason = "";
    }
  }

  if (Object.keys(setFields).length === 0) {
    await existing.populate(POPULATE);
    return serializeLead(existing.toObject() as unknown as Record<string, unknown>);
  }

  const lead = await withTransaction(async (session) => {
    const updated = await applyOptimisticUpdate(Lead, id, expectedRevision, setFields, {
      session,
      notFoundMessage: "Lead not found.",
    });

    if (updated.status !== prevStatus) {
      await addActivity(
        id,
        updated.status === "Lost" ? "lost" : "status_change",
        updated.status === "Lost" ? "Lead Marked Lost" : "Status Changed",
        updated.status === "Lost"
          ? `Lead marked as Lost${updated.lostReason ? `: ${updated.lostReason}` : ""}.`
          : `Status changed from ${prevStatus} to ${updated.status}.`,
        actor,
        session,
      );
    }
    if (input.priority && updated.priority !== prevPriority) {
      await addActivity(
        id,
        "priority_changed",
        "Priority Changed",
        `Priority changed from ${prevPriority} to ${updated.priority}.`,
        actor,
        session,
      );
    }
    const newAssignee = updated.assignedToId ? String(updated.assignedToId) : null;
    if (newAssignee !== prevAssignee) {
      await addActivity(id, "assigned", "Lead Reassigned", "Assignment updated.", actor, session);
      if (newAssignee && newAssignee !== actor.id) {
        await createNotification(
          {
            userId: newAssignee,
            title: "Lead Assigned",
            message: `Lead ${updated.leadCode} (${updated.company}) was assigned to you.`,
            type: "lead_assigned",
            linkUrl: `/leads/${updated._id}`,
          },
          session,
        );
      }
    }
    const newFollowUp = updated.nextFollowUp?.toISOString() || null;
    if (newFollowUp !== prevFollowUp && newFollowUp) {
      await addActivity(
        id,
        "followup_scheduled",
        "Follow-up Scheduled",
        `Next follow-up set to ${newFollowUp}.`,
        actor,
        session,
      );
      await syncFollowUpFromLead(updated, actor, session);
    }

    await writeAudit(
      {
        userId: actor.id,
        userName: actor.name,
        userRole: actor.roleName,
        action:
          !isWonLeadStatus(prevStatus) && isWonLeadStatus(updated.status)
            ? "Lead Completed"
            : "Lead Updated",
        entity: "Lead",
        entityId: id,
        details:
          !isWonLeadStatus(prevStatus) && isWonLeadStatus(updated.status)
            ? `Lead ${updated.leadCode} (${updated.company}) converted successfully.`
            : `Updated details for ${updated.leadCode} (${updated.company}).`,
      },
      session,
    );

    return updated;
  });

  await lead.populate(POPULATE);
  return serializeLead(lead.toObject() as unknown as Record<string, unknown>);
}

export async function assignLead(
  id: string,
  assignedMemberId: string | null,
  actor: AuthUser,
  body: Record<string, unknown> = {},
) {
  return updateLead(id, { ...body, assignedMemberId }, actor);
}

export async function addNote(id: string, content: string, actor: AuthUser) {
  assertObjectId(id, "lead id");
  if (!content?.trim()) throw new AppError("Note content cannot be empty.", 400);

  const lead = await Lead.findById(id);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);

  const note = await LeadNote.create({
    leadId: id,
    content: content.trim(),
    authorId: actor.id,
    authorName: actor.name,
  });

  await addActivity(id, "note_added", "Note Added", content.trim().slice(0, 120), actor);

  const activities = await LeadActivity.find({ leadId: id }).sort({ createdAt: -1 });

  return {
    note: serializeLeadNote(note.toObject() as unknown as Record<string, unknown>),
    activities: activities.map((a) =>
      serializeLeadActivity(a.toObject() as unknown as Record<string, unknown>),
    ),
  };
}

export async function logCall(
  id: string,
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "lead id");
  const existing = await Lead.findById(id);
  if (!existing || existing.archived) throw new AppError("Lead not found.", 404);

  const pickedUp = Boolean(body.pickedUp);
  const channel = String(body.channel || "phone");
  const direction = String(body.direction || "outbound");
  const interestLevel = String(body.interestLevel || "none");

  if (!CALL_CHANNELS.includes(channel as CallChannel)) {
    throw new AppError(`Invalid channel: ${channel}`, 400);
  }
  if (!CALL_DIRECTIONS.includes(direction as CallDirection)) {
    throw new AppError(`Invalid direction: ${direction}`, 400);
  }
  if (!INTEREST_LEVELS.includes(interestLevel as InterestLevel)) {
    throw new AppError(`Invalid interest level: ${interestLevel}`, 400);
  }

  const outcome = outcomeFromPickedUp(pickedUp, body.outcome as string | undefined);
  const durationMinutes = Math.max(0, Number(body.durationMinutes ?? 0) || 0);
  const spokeWith = String(body.spokeWith || "").trim();
  const disposition = String(body.disposition || "").trim();
  const notes = String(body.notes || "").trim();
  const followUpRequired = Boolean(body.followUpRequired);
  const nextFollowUp =
    body.nextFollowUp === null || body.nextFollowUp === ""
      ? null
      : body.nextFollowUp
        ? new Date(String(body.nextFollowUp))
        : null;

  if (nextFollowUp && Number.isNaN(nextFollowUp.getTime())) {
    throw new AppError("Invalid next follow-up date.", 400);
  }

  const expectedRevision = parseRevision(body);
  const prevStatus = existing.status;
  const autoStatus = suggestedStatusAfterCall(prevStatus, pickedUp, interestLevel as InterestLevel);

  const activityDescription = buildCallActivityDescription({
    channel: channel as CallChannel,
    direction: direction as CallDirection,
    outcome,
    durationMinutes,
    spokeWith,
    interestLevel: interestLevel as InterestLevel,
    disposition,
    notes,
  });

  const result = await withTransaction(async (session) => {
    const callLogDocs = await CallLog.create(
      [
        {
          leadId: id,
          performedById: actor.id,
          performedByName: actor.name,
          channel,
          direction,
          pickedUp,
          outcome,
          durationMinutes,
          spokeWith,
          interestLevel,
          disposition,
          notes,
          nextFollowUp,
          followUpRequired,
        },
      ],
      { session },
    );
    const callLog = callLogDocs[0];

    const leadSetFields: Record<string, unknown> = {
      lastCallAt: new Date(),
      lastCallOutcome: outcome,
      lastCallChannel: channel,
      lastCallPickedUp: pickedUp,
    };
    if (nextFollowUp) {
      leadSetFields.nextFollowUp = nextFollowUp;
    }
    if (autoStatus && autoStatus !== prevStatus) {
      leadSetFields.status = autoStatus;
    }

    const lead = await applyOptimisticUpdate(Lead, id, expectedRevision, leadSetFields, {
      session,
      notFoundMessage: "Lead not found.",
      incFields: { totalCallsCount: 1 },
    });

    await addActivity(
      id,
      "call_logged",
      pickedUp ? "Call Connected" : "Call Attempt Logged",
      activityDescription,
      actor,
      session,
    );

    if (autoStatus && autoStatus !== prevStatus) {
      await addActivity(
        id,
        "status_change",
        "Status Changed",
        `Status auto-updated from ${prevStatus} to ${lead.status} after call log.`,
        actor,
        session,
      );
    }

    if (nextFollowUp) {
      await addActivity(
        id,
        "followup_scheduled",
        "Follow-up Scheduled",
        `Next follow-up set to ${nextFollowUp.toLocaleString()}.`,
        actor,
        session,
      );
      await syncFollowUpFromLead(lead, actor, session);
    }

    await writeAudit(
      {
        userId: actor.id,
        userName: actor.name,
        userRole: actor.roleName,
        action: "Call Logged",
        entity: "Lead",
        entityId: id,
        details: `${OUTCOME_LABELS[outcome]} on ${lead.leadCode} (${lead.company}).`,
      },
      session,
    );

    return { callLog, lead };
  });

  const [activitiesResult, callLogsResult] = await Promise.all([
    listLeadActivities(id, {}),
    listLeadCalls(id, {}),
  ]);

  await result.lead.populate(POPULATE);

  return {
    callLog: serializeCallLog(result.callLog.toObject() as unknown as Record<string, unknown>),
    lead: serializeLead(result.lead.toObject() as unknown as Record<string, unknown>),
    activities: activitiesResult.items,
    callLogs: callLogsResult.items,
  };
}

export async function convertLeadToCustomer(
  id: string,
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "lead id");
  const expectedRevision = parseRevision(body);
  const existing = await Lead.findById(id);
  if (!existing || existing.archived) throw new AppError("Lead not found.", 404);

  if (existing.customerId && existing.companyId) {
    const [company, customer] = await Promise.all([
      Company.findById(existing.companyId),
      Customer.findById(existing.customerId).populate({
        path: "companyId",
        select: "name companyCode country",
      }),
    ]);
    await existing.populate(POPULATE);
    return {
      lead: serializeLead(existing.toObject() as unknown as Record<string, unknown>),
      company: company
        ? serializeCompany(company.toObject() as unknown as Record<string, unknown>)
        : null,
      customer: customer
        ? serializeCustomer(customer.toObject() as unknown as Record<string, unknown>)
        : null,
      alreadyConverted: true,
    };
  }

  if (!isConvertibleLeadStatus(existing.status)) {
    throw new AppError(
      `Lead status "${existing.status}" is not eligible for conversion. Qualify the lead first.`,
      409,
      "LEAD_NOT_CONVERTIBLE",
    );
  }

  const result = await withTransaction(async (session) => {
    const fresh = await Lead.findById(id).session(session);
    if (!fresh) throw new AppError("Lead not found.", 404);
    if (fresh.customerId && fresh.companyId) {
      const [company, customer] = await Promise.all([
        Company.findById(fresh.companyId).session(session),
        Customer.findById(fresh.customerId).session(session),
      ]);
      return { lead: fresh, company, customer, alreadyConverted: true as const };
    }

    const existingCustomer = await Customer.findOne({ relatedLeadId: fresh._id }).session(session);
    if (existingCustomer) {
      const company = await Company.findById(existingCustomer.companyId).session(session);
      const lead = await applyOptimisticUpdate(
        Lead,
        id,
        expectedRevision,
        {
          status: "Won",
          companyId: existingCustomer.companyId,
          customerId: existingCustomer._id,
          convertedAt: fresh.convertedAt ?? new Date(),
        },
        { session, notFoundMessage: "Lead not found." },
      );
      return { lead, company, customer: existingCustomer, alreadyConverted: true as const };
    }

    let company = await Company.findOne({
      name: fresh.company.trim(),
      country: fresh.country,
      status: "active",
    }).session(session);

    if (!company) {
      const companyCode = await nextCompanyCode();
      const companyDocs = await Company.create(
        [
          {
            companyCode,
            name: fresh.company.trim(),
            legalName: fresh.company.trim(),
            country: fresh.country,
            notes: fresh.productInterest
              ? `Converted from lead ${fresh.leadCode}. Interest: ${fresh.productInterest}.`
              : `Converted from lead ${fresh.leadCode}.`,
            assignedToId: fresh.assignedToId,
            createdById: actor.id,
          },
        ],
        { session },
      );
      company = companyDocs[0];
    }

    const customerCode = await nextCustomerCode();
    const customerDocs = await Customer.create(
      [
        {
          customerCode,
          companyId: company._id,
          name: fresh.name.trim(),
          email: fresh.email,
          phone: fresh.phoneNumber,
          whatsAppNumber: fresh.whatsAppNumber || fresh.phoneNumber,
          isPrimaryContact: true,
          notes: fresh.notes || "",
          relatedLeadId: fresh._id,
          createdById: actor.id,
        },
      ],
      { session },
    );
    const customer = customerDocs[0];

    const lead = await applyOptimisticUpdate(
      Lead,
      id,
      expectedRevision,
      {
        status: "Won",
        companyId: company._id,
        customerId: customer._id,
        convertedAt: new Date(),
      },
      { session, notFoundMessage: "Lead not found." },
    );

    await addActivity(
      id,
      "converted",
      "Lead Converted to Customer",
      `Lead ${lead.leadCode} converted to customer ${customer.customerCode} at company ${company.companyCode}.`,
      actor,
      session,
    );

    await writeAudit(
      {
        userId: actor.id,
        userName: actor.name,
        userRole: actor.roleName,
        action: "Lead Converted",
        entity: "Lead",
        entityId: id,
        details: `Converted ${lead.leadCode} into customer ${customer.customerCode} (${company.name}).`,
      },
      session,
    );

    return { lead, company, customer, alreadyConverted: false as const };
  });

  await result.lead.populate(POPULATE);

  return {
    lead: serializeLead(result.lead.toObject() as unknown as Record<string, unknown>),
    company: result.company
      ? serializeCompany(result.company.toObject() as unknown as Record<string, unknown>)
      : null,
    customer: result.customer
      ? serializeCustomer(result.customer.toObject() as unknown as Record<string, unknown>)
      : null,
    alreadyConverted: result.alreadyConverted,
  };
}

export async function deleteLead(id: string, actor: AuthUser) {
  assertObjectId(id, "lead id");
  const lead = await Lead.findById(id);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);

  lead.archived = true;
  await lead.save();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Lead Deleted",
    entity: "Lead",
    entityId: id,
    details: `Archived lead ${lead.leadCode} (${lead.company}).`,
  });
}
