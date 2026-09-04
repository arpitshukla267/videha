import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { resolveRolePermissions } from "../constants/permissions";
import type { RoleName } from "../models/Role";
import type { IRole } from "../models/Role";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: RoleName;
  departmentId: string | null;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  roleId?: string;
  roleName?: string;
}

export function signToken(user: {
  id: string;
  email: string;
  roleId: string;
  roleName: RoleName;
}): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
    },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new AppError("Authentication required. No token provided.", 401, "UNAUTHORIZED");
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired session token.", 401, "UNAUTHORIZED");
  }

  if (!Types.ObjectId.isValid(decoded.id)) {
    throw new AppError("Invalid session. User no longer exists.", 401, "UNAUTHORIZED");
  }

  const user = await User.findById(decoded.id).populate<{ roleId: IRole }>("roleId");
  if (!user) {
    throw new AppError("Invalid session. User no longer exists.", 401, "UNAUTHORIZED");
  }
  if (user.status !== "active") {
    throw new AppError(
      "Account is deactivated. Please contact your administrator.",
      403,
      "ACCOUNT_INACTIVE",
    );
  }

  const role = user.roleId && typeof user.roleId === "object" && "name" in user.roleId
    ? (user.roleId as IRole)
    : null;

  const roleId =
    role && role._id
      ? String(role._id)
      : typeof user.roleId === "object"
        ? String((user.roleId as { _id?: Types.ObjectId })._id || user.roleId)
        : String(user.roleId);

  req.user = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    roleId,
    roleName: (role?.name || user.roleName) as RoleName,
    departmentId: user.departmentId ? String(user.departmentId) : null,
    permissions: resolveRolePermissions(
      role?.name || user.roleName,
      role?.permissions,
    ),
  };

  next();
});

/** SUPER_ADMIN bypasses; otherwise caller needs any of the given permission codes. */
export function requirePermission(...codes: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required.", 401, "UNAUTHORIZED"));
      return;
    }

    if (req.user.roleName === "SUPER_ADMIN") {
      next();
      return;
    }

    const hasAny = codes.some((code) => req.user!.permissions.includes(code));
    if (!hasAny) {
      next(
        new AppError(
          codes.length === 1
            ? `Forbidden: You lack the required permission [${codes[0]}] to perform this action.`
            : "Forbidden: Insufficient permissions for this resource.",
          403,
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}
