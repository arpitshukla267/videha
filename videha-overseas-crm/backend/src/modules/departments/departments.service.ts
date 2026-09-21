import { Department } from "../../models/Department";
import { User } from "../../models/User";
import { Lead } from "../../models/Lead";
import { Role } from "../../models/Role";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeDepartment } from "../../utils/serializers";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";

function lean(doc: { toObject: () => Record<string, unknown> }) {
  return doc.toObject() as Record<string, unknown>;
}

async function validateRoleIds(roleIds: string[] | undefined | null) {
  if (!roleIds?.length) return [];
  const unique = [...new Set(roleIds)];
  for (const roleId of unique) {
    assertObjectId(roleId, "role id");
    const exists = await Role.exists({ _id: roleId });
    if (!exists) throw new AppError("One or more selected roles were not found.", 400);
  }
  return unique;
}

export async function listDepartments(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  const docs = await Department.find(filter)
    .populate("defaultRoleId", "displayName name")
    .populate("allowedRoleIds", "displayName name")
    .sort({ name: 1 });
  const memberCounts = await User.aggregate<{ _id: unknown; count: number }>([
    { $match: { departmentId: { $ne: null } } },
    { $group: { _id: "$departmentId", count: { $sum: 1 } } },
  ]);
  const countByDept = new Map(memberCounts.map((row) => [String(row._id), row.count]));

  return docs.map((d) => {
    const serialized = serializeDepartment(lean(d));
    return { ...serialized, memberCount: countByDept.get(serialized.id) ?? 0 };
  });
}

export async function createDepartment(
  data: {
    name: string;
    description?: string;
    defaultRoleId?: string | null;
    allowedRoleIds?: string[];
  },
  actor: AuthUser,
) {
  if (!data.name?.trim()) throw new AppError("Department name is required.", 400);
  if (!data.defaultRoleId) {
    throw new AppError("An assigned role is required for each department.", 400);
  }

  assertObjectId(data.defaultRoleId, "defaultRoleId");
  const roleExists = await Role.exists({ _id: data.defaultRoleId });
  if (!roleExists) throw new AppError("Assigned role not found.", 400);

  const doc = await Department.create({
    name: data.name.trim(),
    description: data.description || "",
    status: "active",
    defaultRoleId: data.defaultRoleId,
    allowedRoleIds: [],
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Department Created",
    entity: "Setting",
    entityId: String(doc._id),
    details: `Created department ${doc.name}.`,
  });

  const populated = await Department.findById(doc._id)
    .populate("defaultRoleId", "displayName name")
    .populate("allowedRoleIds", "displayName name");
  return serializeDepartment(lean(populated!));
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: "active" | "inactive";
    defaultRoleId?: string | null;
    allowedRoleIds?: string[];
    revision?: number;
  },
  actor: AuthUser,
) {
  assertObjectId(id, "department id");
  const expectedRevision = parseRevision(data as Record<string, unknown>);
  const setFields: Record<string, unknown> = {};

  const existing = await Department.findById(id).select("name");
  if (!existing) throw new AppError("Department not found.", 404);

  if (data.name !== undefined) setFields.name = data.name.trim() || existing.name;
  if (data.description !== undefined) setFields.description = data.description;
  if (data.status !== undefined) setFields.status = data.status;

  if (data.defaultRoleId !== undefined) {
    if (data.defaultRoleId) {
      assertObjectId(data.defaultRoleId, "defaultRoleId");
      const exists = await Role.exists({ _id: data.defaultRoleId });
      if (!exists) throw new AppError("Default role not found.", 400);
      setFields.defaultRoleId = data.defaultRoleId;
    } else {
      setFields.defaultRoleId = null;
    }
  }

  if (data.allowedRoleIds !== undefined) {
    let allowedRoleIds = await validateRoleIds(data.allowedRoleIds);
    const defaultRoleId =
      (setFields.defaultRoleId as string | null | undefined) ??
      (data.defaultRoleId !== undefined ? data.defaultRoleId : undefined);
    if (defaultRoleId && !allowedRoleIds.includes(defaultRoleId)) {
      allowedRoleIds = [...allowedRoleIds, defaultRoleId];
    }
    setFields.allowedRoleIds = allowedRoleIds;
  }

  if (Object.keys(setFields).length === 0) {
    const doc = await Department.findById(id)
      .populate("defaultRoleId", "displayName name")
      .populate("allowedRoleIds", "displayName name");
    if (!doc) throw new AppError("Department not found.", 404);
    return serializeDepartment(lean(doc));
  }

  const doc = await applyOptimisticUpdate(Department, id, expectedRevision, setFields, {
    notFoundMessage: "Department not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Department Updated",
    entity: "Setting",
    entityId: String(doc._id),
    details: `Updated department ${doc.name}.`,
  });

  const populated = await Department.findById(doc._id)
    .populate("defaultRoleId", "displayName name")
    .populate("allowedRoleIds", "displayName name");
  return serializeDepartment(lean(populated!));
}

export async function setDepartmentStatus(
  id: string,
  status: "active" | "inactive",
  actor: AuthUser,
  body: Record<string, unknown> = {},
) {
  return updateDepartment(id, { status }, actor);
}

export async function deleteDepartment(id: string, actor: AuthUser) {
  assertObjectId(id, "department id");
  const doc = await Department.findById(id);
  if (!doc) throw new AppError("Department not found.", 404);

  const [userCount, leadCount] = await Promise.all([
    User.countDocuments({ departmentId: id }),
    Lead.countDocuments({ departmentId: id }),
  ]);

  if (userCount > 0 || leadCount > 0) {
    throw new AppError(
      "Cannot delete department while users or leads reference it. Deactivate it instead.",
      409,
      "DEPARTMENT_IN_USE",
    );
  }

  await doc.deleteOne();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Department Deleted",
    entity: "Setting",
    entityId: id,
    details: `Deleted department ${doc.name}.`,
  });
}
