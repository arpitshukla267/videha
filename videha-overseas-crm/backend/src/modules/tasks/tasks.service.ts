import { Types } from "mongoose";
import { Task, TASK_STATUSES, TASK_TYPES, TASK_CHANNELS, type TaskStatus, type TaskType, type TaskChannel } from "../../models/Task";
import { Lead } from "../../models/Lead";
import { User } from "../../models/User";
import type { Priority } from "../../models/Lead";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextTaskCode } from "../../utils/codes";
import { serializeTask } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseClientRequestId, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import type { AuthUser } from "../../middleware/auth";

const POPULATE = [
  { path: "assignedToId", select: "name email" },
  { path: "createdById", select: "name email" },
  { path: "relatedLeadId", select: "name company leadCode" },
];

const LIST_SELECT =
  "taskCode title description assignedToId relatedLeadId taskType channel pickedUp outcome completionNotes priority status dueDate createdById completedAt revision createdAt updatedAt";

const LOWER_STATUS_AFTER_COMPLETED: TaskStatus[] = ["Pending", "In Progress"];

const SORT_FIELD_MAP: Record<string, string> = {
  dueDate: "dueDate",
  createdDate: "createdAt",
  createdAt: "createdAt",
  priority: "priority",
  status: "status",
  title: "title",
};

function normalizeTaskInput(body: Record<string, unknown>) {
  const title = (body.title ?? body.taskTitle) as string | undefined;
  const status = body.status as string | undefined;
  if (status && !TASK_STATUSES.includes(status as TaskStatus)) {
    throw new AppError(`Invalid task status: ${status}`, 400);
  }

  const taskType = (body.taskType ?? body.category) as string | undefined;
  if (taskType && !TASK_TYPES.includes(taskType as TaskType)) {
    throw new AppError(`Invalid task type: ${taskType}`, 400);
  }

  const channel = body.channel as string | undefined;
  if (channel && !TASK_CHANNELS.includes(channel as TaskChannel)) {
    throw new AppError(`Invalid channel: ${channel}`, 400);
  }

  let pickedUp: boolean | null | undefined = undefined;
  if (body.pickedUp === null || body.pickedUp === "") pickedUp = null;
  else if (body.pickedUp !== undefined) pickedUp = Boolean(body.pickedUp);

  return {
    title,
    description: body.description as string | undefined,
    assignedToId: body.assignedToId as string | undefined,
    relatedLeadId: optionalObjectId((body.relatedLeadId ?? null) as string | null),
    taskType: taskType as TaskType | undefined,
    channel: channel as TaskChannel | undefined,
    pickedUp,
    outcome: body.outcome as string | undefined,
    completionNotes: body.completionNotes as string | undefined,
    priority: body.priority as Priority | undefined,
    status: status as TaskStatus | undefined,
    dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined,
  };
}

export async function listTasks(
  filters: {
    view?: string;
    search?: string;
    assignedToId?: string;
    priority?: string;
    page?: unknown;
    limit?: unknown;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  currentUserId: string,
) {
  const { page, limit, skip } = parsePagination(filters);
  const query: Record<string, unknown> = {};
  const view = filters.view || "all";

  if (view === "my") query.assignedToId = currentUserId;
  else if (view === "pending") query.status = "Pending";
  else if (view === "in_progress") query.status = "In Progress";
  else if (view === "completed") query.status = "Completed";
  else if (view === "overdue") {
    query.status = { $nin: ["Completed", "Cancelled"] };
    query.dueDate = { $lt: new Date() };
  }

  if (filters.assignedToId && filters.assignedToId !== "all") {
    assertObjectId(filters.assignedToId, "assignedToId");
    query.assignedToId = filters.assignedToId;
  }
  if (filters.priority && filters.priority !== "all") query.priority = filters.priority;

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { title: new RegExp(s, "i") },
      { taskCode: new RegExp(s, "i") },
      { description: new RegExp(s, "i") },
    ];
  }

  const sortField = SORT_FIELD_MAP[filters.sortBy || "dueDate"] || "dueDate";
  const sortDir = filters.sortOrder === "desc" ? -1 : 1;
  const sort: Record<string, 1 | -1> =
    view !== "completed"
      ? { status: 1, [sortField]: sortDir, createdAt: -1 }
      : { [sortField]: sortDir, createdAt: -1 };

  const [total, docs] = await Promise.all([
    Task.countDocuments(query),
    Task.find(query)
      .select(LIST_SELECT)
      .populate(POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const items = docs.map((d) => serializeTask(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getTask(id: string) {
  assertObjectId(id, "task id");
  const task = await Task.findById(id).populate(POPULATE);
  if (!task) throw new AppError("Task not found.", 404);
  return serializeTask(task.toObject() as unknown as Record<string, unknown>);
}

export async function createTask(body: Record<string, unknown>, actor: AuthUser) {
  const clientRequestId = parseClientRequestId(body);
  if (clientRequestId) {
    const existing = await Task.findOne({ clientRequestId }).populate(POPULATE);
    if (existing) {
      return serializeTask(existing.toObject() as unknown as Record<string, unknown>);
    }
  }

  const input = normalizeTaskInput(body);
  if (!input.title || !input.assignedToId || !input.dueDate) {
    throw new AppError("Task title, assigned member, and due date are required.", 400);
  }
  assertObjectId(input.assignedToId, "assignedToId");

  const assignee = await User.findById(input.assignedToId);
  if (!assignee) throw new AppError("Assigned member not found.", 400);

  if (input.relatedLeadId) {
    const lead = await Lead.findById(input.relatedLeadId);
    if (!lead) throw new AppError("Related lead not found.", 400);
  }

  const status = input.status || "Pending";
  const task = await Task.create({
    taskCode: await nextTaskCode(),
    title: input.title.trim(),
    description: input.description || "",
    assignedToId: input.assignedToId,
    relatedLeadId: input.relatedLeadId,
    taskType: input.taskType || "follow_up_call",
    channel: input.channel || "phone",
    pickedUp: input.pickedUp ?? null,
    outcome: input.outcome || "",
    completionNotes: input.completionNotes || "",
    priority: input.priority || "Medium",
    status,
    dueDate: input.dueDate,
    createdById: actor.id,
    completedAt: status === "Completed" ? new Date() : null,
    clientRequestId: clientRequestId ?? null,
  });

  if (String(assignee._id) !== actor.id) {
    await createNotification({
      userId: String(assignee._id),
      title: "New Task Assigned",
      message: `Task "${task.title}" assigned to you by ${actor.name}.`,
      type: "task_assigned",
      linkUrl: `/tasks/${task._id}`,
    });
  }

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Task Created",
    entity: "Task",
    entityId: String(task._id),
    details: `Created task "${task.title}" assigned to ${assignee.name}.`,
  });

  await task.populate(POPULATE);
  return serializeTask(task.toObject() as unknown as Record<string, unknown>);
}

export async function updateTask(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "task id");
  const existing = await Task.findById(id).select("status assignedToId title taskCode revision");
  if (!existing) throw new AppError("Task not found.", 404);

  const prevAssignee = existing.assignedToId ? String(existing.assignedToId) : null;
  const prevStatus = existing.status;
  const expectedRevision = parseRevision(body);
  const input = normalizeTaskInput(body);

  if (
    prevStatus === "Completed" &&
    input.status &&
    LOWER_STATUS_AFTER_COMPLETED.includes(input.status) &&
    expectedRevision === undefined
  ) {
    throw new AppError(
      "Reopening a completed task requires the current revision. Please refresh and try again.",
      409,
      "REVISION_REQUIRED",
    );
  }

  const setFields: Record<string, unknown> = {};
  if (input.title !== undefined) setFields.title = input.title.trim();
  if (input.description !== undefined) setFields.description = input.description;
  if (input.priority !== undefined) setFields.priority = input.priority;
  if (input.dueDate !== undefined) setFields.dueDate = input.dueDate;
  if (body.relatedLeadId !== undefined) {
    if (input.relatedLeadId) {
      const lead = await Lead.findById(input.relatedLeadId);
      if (!lead) throw new AppError("Related lead not found.", 400);
    }
    setFields.relatedLeadId = input.relatedLeadId;
  }
  if (input.taskType !== undefined) setFields.taskType = input.taskType;
  if (input.channel !== undefined) setFields.channel = input.channel;
  if (body.pickedUp !== undefined) setFields.pickedUp = input.pickedUp ?? null;
  if (input.outcome !== undefined) setFields.outcome = input.outcome;
  if (input.completionNotes !== undefined) setFields.completionNotes = input.completionNotes;
  if (input.assignedToId !== undefined) {
    assertObjectId(input.assignedToId, "assignedToId");
    setFields.assignedToId = new Types.ObjectId(input.assignedToId);
  }
  if (input.status !== undefined) {
    setFields.status = input.status;
    if (input.status === "Completed") {
      setFields.completedAt = new Date();
    } else {
      setFields.completedAt = null;
    }
  }

  if (Object.keys(setFields).length === 0) {
    const task = await Task.findById(id).populate(POPULATE);
    if (!task) throw new AppError("Task not found.", 404);
    return serializeTask(task.toObject() as unknown as Record<string, unknown>);
  }

  const task = await applyOptimisticUpdate(Task, id, expectedRevision, setFields, {
    notFoundMessage: "Task not found.",
  });

  const newAssignee = task.assignedToId ? String(task.assignedToId) : null;
  if (newAssignee && newAssignee !== prevAssignee && newAssignee !== actor.id) {
    await createNotification({
      userId: newAssignee,
      title: "Task Assigned",
      message: `Task "${task.title}" assigned to you by ${actor.name}.`,
      type: "task_assigned",
      linkUrl: `/tasks/${task._id}`,
    });
  }

  const becameCompleted = prevStatus !== "Completed" && task.status === "Completed";
  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: becameCompleted ? "Task Completed" : "Task Updated",
    entity: "Task",
    entityId: id,
    details: becameCompleted
      ? `Task "${task.title}" (${task.taskCode}) marked completed.`
      : `Updated details for task "${task.title}".`,
  });

  await task.populate(POPULATE);
  return serializeTask(task.toObject() as unknown as Record<string, unknown>);
}

export async function updateTaskStatus(
  id: string,
  status: string,
  actor: AuthUser,
  body: Record<string, unknown> = {},
) {
  if (!status) throw new AppError("Status is required.", 400);
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new AppError(`Invalid task status: ${status}`, 400);
  }
  return updateTask(id, { ...body, status }, actor);
}

export async function assignTask(id: string, assignedToId: string, actor: AuthUser) {
  if (!assignedToId) throw new AppError("Target member is required.", 400);
  assertObjectId(assignedToId, "assignedToId");

  const assignee = await User.findById(assignedToId);
  if (!assignee) throw new AppError("Assigned member not found.", 400);

  const result = await updateTask(id, { assignedToId }, actor);

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Task Assigned",
    entity: "Task",
    entityId: id,
    details: `Task "${result.taskTitle}" assigned to ${assignee.name}.`,
  });

  return result;
}

export async function deleteTask(id: string, actor: AuthUser) {
  assertObjectId(id, "task id");
  const task = await Task.findById(id);
  if (!task) throw new AppError("Task not found.", 404);

  await task.deleteOne();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Task Deleted",
    entity: "Task",
    entityId: id,
    details: `Deleted task "${task.title}".`,
  });
}
