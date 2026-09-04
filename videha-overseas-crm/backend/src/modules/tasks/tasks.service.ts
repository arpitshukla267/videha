import { Types } from "mongoose";
import { Task, TASK_STATUSES, type TaskStatus } from "../../models/Task";
import { Lead } from "../../models/Lead";
import { User } from "../../models/User";
import type { Priority } from "../../models/Lead";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextTaskCode } from "../../utils/codes";
import { serializeTask } from "../../utils/serializers";
import { writeAudit } from "../../services/audit.service";
import { createNotification } from "../../services/notification.service";
import type { AuthUser } from "../../middleware/auth";

const POPULATE = [
  { path: "assignedToId", select: "name email" },
  { path: "createdById", select: "name email" },
  { path: "relatedLeadId", select: "name company leadCode" },
];

function normalizeTaskInput(body: Record<string, unknown>) {
  const title = (body.title ?? body.taskTitle) as string | undefined;
  const status = body.status as string | undefined;
  if (status && !TASK_STATUSES.includes(status as TaskStatus)) {
    throw new AppError(`Invalid task status: ${status}`, 400);
  }
  return {
    title,
    description: body.description as string | undefined,
    assignedToId: body.assignedToId as string | undefined,
    relatedLeadId: optionalObjectId((body.relatedLeadId ?? null) as string | null),
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
  },
  currentUserId: string,
) {
  const query: Record<string, unknown> = {};
  const view = filters.view || "all";

  if (view === "my") query.assignedToId = currentUserId;
  else if (view === "pending") query.status = "Pending";
  else if (view === "in_progress") query.status = "In Progress";
  else if (view === "completed") query.status = "Completed";

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

  let docs = await Task.find(query).populate(POPULATE).sort({ dueDate: 1, createdAt: -1 });

  let serialized = docs.map((d) => serializeTask(d.toObject() as unknown as Record<string, unknown>));

  if (view === "overdue") {
    serialized = serialized.filter((t) => t.isOverdue);
  }

  // Keep completed / cancelled tasks at the bottom in mixed views
  if (view !== "completed") {
    serialized.sort((a, b) => {
      const aDone = a.status === "Completed" || a.status === "Cancelled" ? 1 : 0;
      const bDone = b.status === "Completed" || b.status === "Cancelled" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return 0;
    });
  }

  return serialized;
}

export async function getTask(id: string) {
  assertObjectId(id, "task id");
  const task = await Task.findById(id).populate(POPULATE);
  if (!task) throw new AppError("Task not found.", 404);
  return serializeTask(task.toObject() as unknown as Record<string, unknown>);
}

export async function createTask(body: Record<string, unknown>, actor: AuthUser) {
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
    priority: input.priority || "Medium",
    status,
    dueDate: input.dueDate,
    createdById: actor.id,
    completedAt: status === "Completed" ? new Date() : null,
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
  const task = await Task.findById(id);
  if (!task) throw new AppError("Task not found.", 404);

  const prevAssignee = task.assignedToId ? String(task.assignedToId) : null;
  const prevStatus = task.status;
  const input = normalizeTaskInput(body);
  if (input.title !== undefined) task.title = input.title.trim();
  if (input.description !== undefined) task.description = input.description;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  if (body.relatedLeadId !== undefined) {
    task.relatedLeadId = input.relatedLeadId as Types.ObjectId | null;
  }
  if (input.assignedToId !== undefined) {
    assertObjectId(input.assignedToId, "assignedToId");
    task.assignedToId = new Types.ObjectId(input.assignedToId);
  }
  if (input.status !== undefined) {
    task.status = input.status;
    if (input.status === "Completed" && !task.completedAt) {
      task.completedAt = new Date();
    }
    if (input.status !== "Completed") {
      task.completedAt = null;
    }
  }

  await task.save();

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

export async function updateTaskStatus(id: string, status: string, actor: AuthUser) {
  if (!status) throw new AppError("Status is required.", 400);
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new AppError(`Invalid task status: ${status}`, 400);
  }
  return updateTask(id, { status }, actor);
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
