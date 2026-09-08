import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { User } from "../../models/User";
import { Role } from "../../models/Role";
import { Department } from "../../models/Department";
import { Lead } from "../../models/Lead";
import { Task } from "../../models/Task";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeUser } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import type { RoleName } from "../../models/Role";

type WorkloadStats = {
  activeTasks: number;
  overdueTasks: number;
  leadsAssigned: number;
};

async function workloadForUserIds(userIds: Types.ObjectId[]): Promise<Map<string, WorkloadStats>> {
  const map = new Map<string, WorkloadStats>();
  if (userIds.length === 0) return map;

  const now = new Date();
  const [taskAgg, leadAgg] = await Promise.all([
    Task.aggregate<{ _id: Types.ObjectId; activeTasks: number; overdueTasks: number }>([
      { $match: { assignedToId: { $in: userIds } } },
      {
        $group: {
          _id: "$assignedToId",
          activeTasks: {
            $sum: {
              $cond: [{ $in: ["$status", ["Completed", "Cancelled"]] }, 0, 1],
            },
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["Completed", "Cancelled"]] } },
                    { $lt: ["$dueDate", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    Lead.aggregate<{ _id: Types.ObjectId; leadsAssigned: number }>([
      {
        $match: {
          assignedToId: { $in: userIds },
          archived: { $ne: true },
        },
      },
      { $group: { _id: "$assignedToId", leadsAssigned: { $sum: 1 } } },
    ]),
  ]);

  for (const id of userIds) {
    map.set(String(id), { activeTasks: 0, overdueTasks: 0, leadsAssigned: 0 });
  }
  for (const row of taskAgg) {
    const key = String(row._id);
    const existing = map.get(key) || { activeTasks: 0, overdueTasks: 0, leadsAssigned: 0 };
    map.set(key, {
      ...existing,
      activeTasks: row.activeTasks,
      overdueTasks: row.overdueTasks,
    });
  }
  for (const row of leadAgg) {
    const key = String(row._id);
    const existing = map.get(key) || { activeTasks: 0, overdueTasks: 0, leadsAssigned: 0 };
    map.set(key, { ...existing, leadsAssigned: row.leadsAssigned });
  }

  return map;
}

function serializeWithWorkload(
  doc: Record<string, unknown>,
  stats: WorkloadStats,
) {
  return { ...serializeUser(doc), ...stats };
}

export async function listUsers(filters: {
  search?: string;
  status?: string;
  page?: unknown;
  limit?: unknown;
}) {
  const { page, limit, skip } = parsePagination(filters);
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { name: new RegExp(s, "i") },
      { email: new RegExp(s, "i") },
      { phone: new RegExp(s, "i") },
      { designation: new RegExp(s, "i") },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .populate("roleId")
      .populate("departmentId")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
  ]);

  const userIds = users.map((u) => u._id as Types.ObjectId);
  const workloadMap = await workloadForUserIds(userIds);

  const items = users.map((u) => {
    const stats = workloadMap.get(String(u._id)) || {
      activeTasks: 0,
      overdueTasks: 0,
      leadsAssigned: 0,
    };
    return serializeWithWorkload(u.toObject() as unknown as Record<string, unknown>, stats);
  });

  return paginatedResponse(items, total, page, limit);
}

async function resolveDepartmentId(
  departmentId?: string | null,
  departmentName?: string | null,
): Promise<string | null> {
  if (departmentId) {
    assertObjectId(departmentId, "department id");
    const dept = await Department.findById(departmentId);
    if (!dept) throw new AppError("Department not found.", 400);
    return departmentId;
  }
  if (departmentName?.trim()) {
    const dept = await Department.findOne({
      name: new RegExp(`^${departmentName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    return dept ? String(dept._id) : null;
  }
  return null;
}

async function serializeSingleUser(user: InstanceType<typeof User>) {
  const stats = await workloadForUserIds([user._id as Types.ObjectId]);
  const workload = stats.get(String(user._id)) || {
    activeTasks: 0,
    overdueTasks: 0,
    leadsAssigned: 0,
  };
  return serializeWithWorkload(user.toObject() as unknown as Record<string, unknown>, workload);
}

export async function createUser(
  data: {
    name: string;
    email: string;
    password: string;
    roleId: string;
    phone?: string;
    departmentId?: string | null;
    department?: string | null;
    designation?: string;
  },
  actor: AuthUser,
) {
  if (!data.name || !data.email || !data.password || !data.roleId) {
    throw new AppError("Name, email, password, and role are required.", 400);
  }

  assertObjectId(data.roleId, "role id");
  const role = await Role.findById(data.roleId);
  if (!role) throw new AppError("Selected role does not exist.", 400);

  const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
  if (existing) {
    throw new AppError("A team member with this email already exists.", 400);
  }

  const departmentId = await resolveDepartmentId(data.departmentId, data.department);

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    passwordHash,
    roleId: role._id,
    roleName: role.name as RoleName,
    departmentId,
    status: "active",
    phone: data.phone || "",
    designation: data.designation || "",
  });

  await user.populate("roleId");
  await user.populate("departmentId");

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "User Created",
    entity: "User",
    entityId: String(user._id),
    details: `Created new member ${user.name} with role ${role.displayName}.`,
  });

  return serializeSingleUser(user);
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    roleId?: string;
    phone?: string;
    departmentId?: string | null;
    department?: string | null;
    status?: "active" | "inactive";
    designation?: string;
    revision?: number;
    expectedRevision?: number;
  },
  actor: AuthUser,
) {
  assertObjectId(id, "user id");
  const user = await User.findById(id);
  if (!user) throw new AppError("Team member not found.", 404);

  const isSelf = actor.id === id;
  const isAdmin = actor.roleName === "SUPER_ADMIN" || actor.roleName === "ADMIN";

  if (data.roleId && data.roleId !== String(user.roleId)) {
    if (!isAdmin) {
      throw new AppError("You cannot change user roles.", 403);
    }
    if (isSelf && actor.roleName !== "SUPER_ADMIN") {
      throw new AppError("You cannot alter your own administrative role.", 403);
    }
    assertObjectId(data.roleId, "role id");
    const role = await Role.findById(data.roleId);
    if (!role) throw new AppError("Selected role does not exist.", 400);
  }

  const expectedRevision = parseRevision(data as Record<string, unknown>);
  const setFields: Record<string, unknown> = {};

  if (data.roleId && data.roleId !== String(user.roleId)) {
    const role = await Role.findById(data.roleId);
    if (!role) throw new AppError("Selected role does not exist.", 400);
    setFields.roleId = role._id;
    setFields.roleName = role.name;
  }
  if (data.name !== undefined) setFields.name = data.name.trim() || user.name;
  if (data.phone !== undefined) setFields.phone = data.phone;
  if (data.designation !== undefined) setFields.designation = data.designation;
  if (data.status !== undefined) setFields.status = data.status;
  if (data.departmentId !== undefined || data.department !== undefined) {
    const resolved = await resolveDepartmentId(
      data.departmentId === undefined ? null : data.departmentId,
      data.department,
    );
    if (data.departmentId !== undefined || resolved) {
      setFields.departmentId = resolved ? new Types.ObjectId(resolved) : null;
    }
  }

  if (Object.keys(setFields).length === 0) {
    await user.populate("roleId");
    await user.populate("departmentId");
    return serializeSingleUser(user);
  }

  const updated = await applyOptimisticUpdate(User, id, expectedRevision, setFields, {
    notFoundMessage: "Team member not found.",
  });

  await updated.populate("roleId");
  await updated.populate("departmentId");

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Member Updated",
    entity: "User",
    entityId: id,
    details: `Updated details for member ${updated.name}.`,
  });

  return serializeSingleUser(updated);
}

export async function setUserStatus(
  id: string,
  status: "active" | "inactive",
  actor: AuthUser,
  body: Record<string, unknown> = {},
) {
  assertObjectId(id, "user id");
  if (actor.id === id) {
    throw new AppError("You cannot deactivate your own account.", 400);
  }
  if (status !== "active" && status !== "inactive") {
    throw new AppError("Invalid status value.", 400);
  }

  const expectedRevision = parseRevision(body);
  const user = await applyOptimisticUpdate(User, id, expectedRevision, { status }, {
    notFoundMessage: "User not found.",
  });

  await user.populate("roleId");
  await user.populate("departmentId");

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: status === "active" ? "User Activated" : "User Deactivated",
    entity: "User",
    entityId: id,
    details: `${status === "active" ? "Re-activated" : "Deactivated"} account for ${user.name}.`,
  });

  return serializeUser(user.toObject() as unknown as Record<string, unknown>);
}
