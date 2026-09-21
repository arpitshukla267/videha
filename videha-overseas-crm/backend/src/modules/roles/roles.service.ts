import { Role, SYSTEM_ROLE_NAMES, type VisibilityScope } from "../../models/Role";
import { User } from "../../models/User";
import { Department } from "../../models/Department";
import { PERMISSIONS, resolveRolePermissions } from "../../constants/permissions";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeRole } from "../../utils/serializers";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";

function lean(doc: { toObject: () => Record<string, unknown> }) {
  return doc.toObject() as Record<string, unknown>;
}

function slugifyRoleName(displayName: string): string {
  const base = displayName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return base || `CUSTOM_ROLE_${Date.now()}`;
}

async function uniqueRoleName(displayName: string, preferred?: string): Promise<string> {
  let candidate = (preferred || slugifyRoleName(displayName)).toUpperCase();
  if (!candidate) candidate = slugifyRoleName(displayName);

  let suffix = 0;
  while (await Role.exists({ name: candidate })) {
    suffix += 1;
    candidate = `${slugifyRoleName(displayName)}_${suffix}`;
  }
  return candidate;
}

export function getPermissionsCatalog() {
  return PERMISSIONS.map((p, index) => ({
    id: `p-${index + 1}`,
    code: p.code,
    name: p.name,
    category: p.category,
    description: p.description,
  }));
}

export async function listRoles() {
  const roles = await Role.find().sort({ isSystem: -1, displayName: 1 });
  return {
    roles: roles.map((r) => serializeRole(lean(r))),
    permissions: getPermissionsCatalog(),
  };
}

export async function createRole(
  data: {
    displayName: string;
    description?: string;
    visibilityScope?: VisibilityScope;
    permissions?: string[];
    name?: string;
  },
  actor: AuthUser,
) {
  if (!data.displayName?.trim()) {
    throw new AppError("Role display name is required.", 400);
  }

  const name = await uniqueRoleName(data.displayName, data.name?.trim());
  if (SYSTEM_ROLE_NAMES.includes(name as (typeof SYSTEM_ROLE_NAMES)[number])) {
    throw new AppError("This role name is reserved for system roles.", 400);
  }

  const validCodes = new Set(PERMISSIONS.map((p) => p.code));
  const permissions = (data.permissions || []).filter((code) => validCodes.has(code as never));

  const doc = await Role.create({
    name,
    displayName: data.displayName.trim(),
    description: data.description || "",
    permissions,
    isSystem: false,
    visibilityScope: data.visibilityScope || "own",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Role Created",
    entity: "Role",
    entityId: String(doc._id),
    details: `Created role ${doc.displayName} (${doc.name}).`,
  });

  return serializeRole(lean(doc));
}

export async function updateRole(
  id: string,
  data: {
    displayName?: string;
    description?: string;
    visibilityScope?: VisibilityScope;
    revision?: number;
  },
  actor: AuthUser,
) {
  assertObjectId(id, "role id");
  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found.", 404);

  if (data.displayName !== undefined) role.displayName = data.displayName.trim() || role.displayName;
  if (data.description !== undefined) role.description = data.description;
  if (data.visibilityScope !== undefined) {
    role.visibilityScope = data.visibilityScope;
  }

  await role.save();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Role Updated",
    entity: "Role",
    entityId: id,
    details: `Updated role ${role.displayName}.`,
  });

  return serializeRole(lean(role));
}

export async function deleteRole(id: string, actor: AuthUser) {
  assertObjectId(id, "role id");
  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found.", 404);
  if (role.isSystem || role.name === "SUPER_ADMIN" || role.name === "ADMIN") {
    throw new AppError("System roles cannot be deleted.", 400);
  }

  const [userCount, deptDefaultCount, deptAllowedCount] = await Promise.all([
    User.countDocuments({ roleId: id }),
    Department.countDocuments({ defaultRoleId: id }),
    Department.countDocuments({ allowedRoleIds: id }),
  ]);

  if (userCount > 0 || deptDefaultCount > 0 || deptAllowedCount > 0) {
    throw new AppError(
      "Cannot delete role while users or departments reference it. Reassign them first.",
      409,
      "ROLE_IN_USE",
    );
  }

  await role.deleteOne();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Role Deleted",
    entity: "Role",
    entityId: id,
    details: `Deleted role ${role.displayName}.`,
  });
}

export async function updateRolePermissions(
  id: string,
  permissions: string[],
  actor: AuthUser,
) {
  assertObjectId(id, "role id");
  if (!Array.isArray(permissions)) {
    throw new AppError("Permissions array is required.", 400);
  }

  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found.", 404);
  if (role.name === "SUPER_ADMIN") {
    throw new AppError("Super Admin permissions cannot be restricted.", 400);
  }

  const validCodes = new Set(PERMISSIONS.map((p) => p.code));
  const merged = resolveRolePermissions(role.name, permissions);
  role.permissions = merged.filter((p) => validCodes.has(p as (typeof PERMISSIONS)[number]["code"]));
  await role.save();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Role Permissions Modified",
    entity: "Role",
    entityId: id,
    details: `Modified access permissions for role ${role.displayName}.`,
  });

  return serializeRole(lean(role));
}
