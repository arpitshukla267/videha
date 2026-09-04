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
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import type { RoleName } from "../../models/Role";

async function workload(userId: string) {
  const tasks = await Task.find({ assignedToId: userId }).select("status dueDate").lean();
  const now = Date.now();
  let activeTasks = 0;
  let overdueTasks = 0;
  for (const t of tasks) {
    if (t.status === "Completed" || t.status === "Cancelled") continue;
    activeTasks++;
    if (t.dueDate && new Date(t.dueDate).getTime() < now) overdueTasks++;
  }
  const leadsAssigned = await Lead.countDocuments({
    assignedToId: userId,
    archived: { $ne: true },
  });
  return { activeTasks, overdueTasks, leadsAssigned };
}

async function serializeWithWorkload(doc: InstanceType<typeof User>) {
  const base = serializeUser(doc.toObject() as unknown as Record<string, unknown>);
  const stats = await workload(String(doc._id));
  return { ...base, ...stats };
}

export async function listUsers() {
  const users = await User.find()
    .populate("roleId")
    .populate("departmentId")
    .sort({ name: 1 });

  return Promise.all(users.map((u) => serializeWithWorkload(u)));
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

  return serializeWithWorkload(user);
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
  },
  actor: AuthUser,
) {
  assertObjectId(id, "user id");
  const user = await User.findById(id);
  if (!user) throw new AppError("Team member not found.", 404);

  const isSelf = actor.id === id;
  const isAdmin = actor.roleName === "SUPER_ADMIN" || actor.roleName === "ADMIN";

  // Never allow non-admin to change role; never allow user to change own role (unless SUPER_ADMIN)
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
    user.roleId = role._id as Types.ObjectId;
    user.roleName = role.name as RoleName;
  }

  if (data.name !== undefined) user.name = data.name.trim() || user.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.designation !== undefined) user.designation = data.designation;
  if (data.status !== undefined) user.status = data.status;
  if (data.departmentId !== undefined || data.department !== undefined) {
    const resolved = await resolveDepartmentId(
      data.departmentId === undefined ? null : data.departmentId,
      data.department,
    );
    // If only free-text department was sent and no match, keep existing id
    if (data.departmentId !== undefined || resolved) {
      user.departmentId = resolved ? (new Types.ObjectId(resolved) as Types.ObjectId) : null;
    }
  }

  await user.save();
  await user.populate("roleId");
  await user.populate("departmentId");

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Member Updated",
    entity: "User",
    entityId: id,
    details: `Updated details for member ${user.name}.`,
  });

  return serializeWithWorkload(user);
}

export async function setUserStatus(id: string, status: "active" | "inactive", actor: AuthUser) {
  assertObjectId(id, "user id");
  if (actor.id === id) {
    throw new AppError("You cannot deactivate your own account.", 400);
  }
  if (status !== "active" && status !== "inactive") {
    throw new AppError("Invalid status value.", 400);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError("User not found.", 404);

  user.status = status;
  await user.save();
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
