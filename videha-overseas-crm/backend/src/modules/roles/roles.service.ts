import { Role } from "../../models/Role";
import { PERMISSIONS } from "../../constants/permissions";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeRole } from "../../utils/serializers";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";

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
  const roles = await Role.find().sort({ name: 1 });
  return {
    roles: roles.map((r) => serializeRole(r.toObject() as unknown as Record<string, unknown>)),
    permissions: getPermissionsCatalog(),
  };
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
  role.permissions = permissions.filter((p) => validCodes.has(p as (typeof PERMISSIONS)[number]["code"]));
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

  return serializeRole(role.toObject() as unknown as Record<string, unknown>);
}
