import { Types } from "mongoose";
import { Lead, LEAD_STATUSES, type LeadStatus, type Priority } from "../../models/Lead";
import { LeadNote } from "../../models/LeadNote";
import { LeadActivity } from "../../models/LeadActivity";
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
import { nextLeadCode } from "../../utils/codes";
import {
  serializeLead,
  serializeLeadNote,
  serializeLeadActivity,
  serializeCallLog,
} from "../../utils/serializers";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import type { AuthUser } from "../../middleware/auth";
import { User } from "../../models/User";

type ActivityType =
  | "created"
  | "assigned"
  | "status_change"
  | "followup_scheduled"
  | "note_added"
  | "priority_changed"
  | "call_logged";

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
  if (["Converted", "Lost", "Not Interested"].includes(currentStatus)) return null;
  if (pickedUp) {
    if (interestLevel === "hot") return "Interested";
    if (currentStatus === "New") return "Contacted";
    return null;
  }
  if (["New", "Contacted", "Interested"].includes(currentStatus)) return "Follow-up";
  return null;
}

async function addActivity(
  leadId: string,
  type: ActivityType,
  title: string,
  description: string,
  actor: AuthUser,
) {
  return LeadActivity.create({
    leadId,
    type,
    title,
    description,
    performedById: actor.id,
    performedByName: actor.name,
  });
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
    nextFollowUp: body.nextFollowUp
      ? new Date(String(body.nextFollowUp))
      : body.nextFollowUp === null
        ? null
        : undefined,
    notes: body.notes as string | undefined,
  };
}

const POPULATE = [{ path: "assignedToId", select: "name email" }, { path: "departmentId", select: "name" }];

export async function listLeads(filters: {
  search?: string;
  status?: string;
  country?: string;
  priority?: string;
  assignedMemberId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 10));
  const query: Record<string, unknown> = { archived: { $ne: true } };

  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.country && filters.country !== "all") query.country = filters.country;
  if (filters.priority && filters.priority !== "all") query.priority = filters.priority;
  if (filters.assignedMemberId && filters.assignedMemberId !== "all") {
    if (filters.assignedMemberId === "unassigned") {
      query.assignedToId = null;
    } else {
      assertObjectId(filters.assignedMemberId, "assignedMemberId");
      query.assignedToId = filters.assignedMemberId;
    }
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { name: new RegExp(s, "i") },
      { company: new RegExp(s, "i") },
      { leadCode: new RegExp(s, "i") },
      { phoneNumber: new RegExp(s, "i") },
      { email: new RegExp(s, "i") },
      { productInterest: new RegExp(s, "i") },
    ];
  }

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
      .populate(POPULATE)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: docs.map((d) => serializeLead(d.toObject() as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getLead(id: string) {
  assertObjectId(id, "lead id");
  const lead = await Lead.findById(id).populate(POPULATE);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);

  const [activities, notes, callLogs] = await Promise.all([
    LeadActivity.find({ leadId: id }).sort({ createdAt: -1 }),
    LeadNote.find({ leadId: id }).sort({ createdAt: -1 }),
    CallLog.find({ leadId: id }).sort({ createdAt: -1 }).limit(50),
  ]);

  return {
    lead: serializeLead(lead.toObject() as unknown as Record<string, unknown>),
    activities: activities.map((a) =>
      serializeLeadActivity(a.toObject() as unknown as Record<string, unknown>),
    ),
    notes: notes.map((n) => serializeLeadNote(n.toObject() as unknown as Record<string, unknown>)),
    callLogs: callLogs.map((c) =>
      serializeCallLog(c.toObject() as unknown as Record<string, unknown>),
    ),
  };
}

export async function createLead(body: Record<string, unknown>, actor: AuthUser) {
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

  await lead.populate(POPULATE);
  return serializeLead(lead.toObject() as unknown as Record<string, unknown>);
}

export async function updateLead(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "lead id");
  const lead = await Lead.findById(id);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);

  const input = normalizeLeadInput({
    ...body,
    // preserve existing if aliases missing
    source: body.source ?? body.leadSource ?? lead.source,
    status: body.status ?? body.leadStatus ?? lead.status,
    assignedToId: body.assignedToId ?? body.assignedMemberId ?? lead.assignedToId,
    departmentId: body.departmentId !== undefined ? body.departmentId : lead.departmentId,
  });

  const prevStatus = lead.status;
  const prevPriority = lead.priority;
  const prevAssignee = lead.assignedToId ? String(lead.assignedToId) : null;
  const prevFollowUp = lead.nextFollowUp?.toISOString() || null;

  if (input.name !== undefined) lead.name = input.name.trim();
  if (input.company !== undefined) lead.company = input.company.trim();
  if (input.phoneNumber !== undefined) lead.phoneNumber = input.phoneNumber.trim();
  if (input.whatsAppNumber !== undefined) lead.whatsAppNumber = input.whatsAppNumber;
  if (input.email !== undefined) lead.email = input.email.toLowerCase();
  if (input.country !== undefined) lead.country = input.country.trim();
  if (input.source !== undefined) lead.source = input.source;
  if (input.productInterest !== undefined) lead.productInterest = input.productInterest;
  if (input.status !== undefined) lead.status = input.status;
  if (input.priority !== undefined) lead.priority = input.priority;
  if (body.assignedToId !== undefined || body.assignedMemberId !== undefined) {
    lead.assignedToId = input.assignedToId as Types.ObjectId | null;
  }
  if (body.departmentId !== undefined) {
    lead.departmentId = input.departmentId as Types.ObjectId | null;
  }
  if (body.nextFollowUp !== undefined) {
    lead.nextFollowUp = input.nextFollowUp === undefined ? lead.nextFollowUp : input.nextFollowUp;
  }
  if (input.notes !== undefined) lead.notes = input.notes;

  await lead.save();

  if (lead.status !== prevStatus) {
    await addActivity(
      id,
      "status_change",
      "Status Changed",
      `Status changed from ${prevStatus} to ${lead.status}.`,
      actor,
    );
  }
  if (input.priority && lead.priority !== prevPriority) {
    await addActivity(
      id,
      "priority_changed",
      "Priority Changed",
      `Priority changed from ${prevPriority} to ${lead.priority}.`,
      actor,
    );
  }
  const newAssignee = lead.assignedToId ? String(lead.assignedToId) : null;
  if (newAssignee !== prevAssignee) {
    await addActivity(id, "assigned", "Lead Reassigned", `Assignment updated.`, actor);
    if (newAssignee && newAssignee !== actor.id) {
      await createNotification({
        userId: newAssignee,
        title: "Lead Assigned",
        message: `Lead ${lead.leadCode} (${lead.company}) was assigned to you.`,
        type: "lead_assigned",
        linkUrl: `/leads/${lead._id}`,
      });
    }
  }
  const newFollowUp = lead.nextFollowUp?.toISOString() || null;
  if (newFollowUp !== prevFollowUp && newFollowUp) {
    await addActivity(
      id,
      "followup_scheduled",
      "Follow-up Scheduled",
      `Next follow-up set to ${newFollowUp}.`,
      actor,
    );
  }

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action:
      prevStatus !== "Converted" && lead.status === "Converted"
        ? "Lead Completed"
        : "Lead Updated",
    entity: "Lead",
    entityId: id,
    details:
      prevStatus !== "Converted" && lead.status === "Converted"
        ? `Lead ${lead.leadCode} (${lead.company}) converted successfully.`
        : `Updated details for ${lead.leadCode} (${lead.company}).`,
  });

  await lead.populate(POPULATE);
  return serializeLead(lead.toObject() as unknown as Record<string, unknown>);
}

export async function assignLead(
  id: string,
  assignedMemberId: string | null,
  actor: AuthUser,
) {
  return updateLead(id, { assignedMemberId }, actor);
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
  const lead = await Lead.findById(id);
  if (!lead || lead.archived) throw new AppError("Lead not found.", 404);

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

  const callLog = await CallLog.create({
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
  });

  lead.lastCallAt = new Date();
  lead.lastCallOutcome = outcome;
  lead.lastCallChannel = channel;
  lead.lastCallPickedUp = pickedUp;
  lead.totalCallsCount = (lead.totalCallsCount || 0) + 1;

  if (nextFollowUp) {
    lead.nextFollowUp = nextFollowUp;
  }

  const autoStatus = suggestedStatusAfterCall(lead.status, pickedUp, interestLevel as InterestLevel);
  if (autoStatus && autoStatus !== lead.status) {
    const prevStatus = lead.status;
    lead.status = autoStatus;
    await addActivity(
      id,
      "status_change",
      "Status Changed",
      `Status auto-updated from ${prevStatus} to ${lead.status} after call log.`,
      actor,
    );
  }

  await lead.save();

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

  await addActivity(
    id,
    "call_logged",
    pickedUp ? "Call Connected" : "Call Attempt Logged",
    activityDescription,
    actor,
  );

  if (nextFollowUp) {
    await addActivity(
      id,
      "followup_scheduled",
      "Follow-up Scheduled",
      `Next follow-up set to ${nextFollowUp.toLocaleString()}.`,
      actor,
    );
  }

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Call Logged",
    entity: "Lead",
    entityId: id,
    details: `${OUTCOME_LABELS[outcome]} on ${lead.leadCode} (${lead.company}).`,
  });

  const [activities, callLogs] = await Promise.all([
    LeadActivity.find({ leadId: id }).sort({ createdAt: -1 }),
    CallLog.find({ leadId: id }).sort({ createdAt: -1 }).limit(50),
  ]);

  await lead.populate(POPULATE);

  return {
    callLog: serializeCallLog(callLog.toObject() as unknown as Record<string, unknown>),
    lead: serializeLead(lead.toObject() as unknown as Record<string, unknown>),
    activities: activities.map((a) =>
      serializeLeadActivity(a.toObject() as unknown as Record<string, unknown>),
    ),
    callLogs: callLogs.map((c) =>
      serializeCallLog(c.toObject() as unknown as Record<string, unknown>),
    ),
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
