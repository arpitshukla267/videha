import { Types } from "mongoose";
import { User } from "../models/User";
import type { AuthUser } from "../middleware/auth";
import type { RoleName } from "../models/Role";

export type VisibilityScope = "own" | "team" | "department" | "all";

export function resolveVisibilityScope(roleName: RoleName): VisibilityScope {
  switch (roleName) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "all";
    case "MANAGER":
      return "department";
    case "OPERATIONS":
      return "team";
    case "SALES_MEMBER":
    default:
      return "own";
  }
}

async function userIdsInDepartment(departmentId: string | null): Promise<Types.ObjectId[]> {
  if (!departmentId || !Types.ObjectId.isValid(departmentId)) return [];
  const deptObjectId = new Types.ObjectId(departmentId);
  const users = await User.find({ departmentId: deptObjectId, status: "active" }).select("_id").lean();
  return users.map((u) => u._id as Types.ObjectId);
}

export function isAdminRole(roleName: RoleName): boolean {
  return roleName === "SUPER_ADMIN" || roleName === "ADMIN";
}

export function isManagerRole(roleName: RoleName): boolean {
  return roleName === "MANAGER";
}

export async function userIdsInActorScope(actor: AuthUser): Promise<Types.ObjectId[]> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return [];
  if (scope === "own") return [new Types.ObjectId(actor.id)];
  return userIdsInDepartment(actor.departmentId);
}

/** Build MongoDB filter for assignee/owner fields based on role visibility. */
export async function buildAssigneeVisibilityFilter(
  actor: AuthUser,
  assigneeField = "assignedToId",
  creatorField?: string,
): Promise<Record<string, unknown>> {
  const scope = resolveVisibilityScope(actor.roleName);
  if (scope === "all") return {};

  const actorId = new Types.ObjectId(actor.id);

  if (scope === "own") {
    const or: Record<string, unknown>[] = [{ [assigneeField]: actorId }];
    if (creatorField) or.push({ [creatorField]: actorId });
    return { $or: or };
  }

  const deptUserIds = await userIdsInDepartment(actor.departmentId);
  const allowedIds =
    scope === "department"
      ? deptUserIds
      : actor.departmentId
        ? deptUserIds
        : [actorId];

  if (allowedIds.length === 0) {
    return { [assigneeField]: actorId };
  }

  return { [assigneeField]: { $in: allowedIds } };
}
