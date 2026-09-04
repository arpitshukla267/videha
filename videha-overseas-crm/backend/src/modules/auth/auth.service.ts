import bcrypt from "bcryptjs";
import { User, type IUser } from "../../models/User";
import type { IRole } from "../../models/Role";
import { AppError } from "../../utils/AppError";
import { signToken } from "../../middleware/auth";
import { writeAudit } from "../../services/audit.service";
import { serializeUser, serializeRole } from "../../utils/serializers";
import { resolveRolePermissions } from "../../constants/permissions";

type PopulatedUser = IUser & {
  roleId: IRole | IUser["roleId"];
  departmentId?: IUser["departmentId"];
};

function asRecord(doc: IUser): Record<string, unknown> {
  return doc.toObject() as unknown as Record<string, unknown>;
}

function getRole(user: PopulatedUser): IRole | null {
  if (user.roleId && typeof user.roleId === "object" && "permissions" in user.roleId) {
    return user.roleId as IRole;
  }
  return null;
}

export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = (await User.findOne({ email: email.toLowerCase().trim() })
    .select("+passwordHash")
    .populate("roleId")
    .populate("departmentId")) as PopulatedUser | null;

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }
  if (user.status !== "active") {
    throw new AppError(
      "Your account is currently inactive. Contact your administrator.",
      403,
      "ACCOUNT_INACTIVE",
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError("Invalid email or password.", 401);
  }

  const role = getRole(user);
  const roleId = role?._id ? String(role._id) : String(user.roleId);
  const roleName = (role?.name || user.roleName) as typeof user.roleName;
  const permissions = resolveRolePermissions(roleName, role?.permissions);

  const token = signToken({
    id: String(user._id),
    email: user.email,
    roleId,
    roleName,
  });

  await writeAudit({
    userId: String(user._id),
    userName: user.name,
    userRole: roleName,
    action: "User Logged In",
    entity: "Auth",
    entityId: String(user._id),
    details: `User ${user.email} authenticated successfully.`,
  });

  return {
    token,
    user: serializeUser(asRecord(user)),
    role: role ? serializeRole(role.toObject() as unknown as Record<string, unknown>) : null,
    permissions,
  };
}

export async function getMe(userId: string) {
  const user = (await User.findById(userId)
    .populate("roleId")
    .populate("departmentId")) as PopulatedUser | null;
  if (!user) throw new AppError("User not found.", 404);

  const role = getRole(user);
  const permissions = resolveRolePermissions(
    role?.name || user.roleName,
    role?.permissions,
  );

  return {
    user: serializeUser(asRecord(user)),
    role: role ? serializeRole(role.toObject() as unknown as Record<string, unknown>) : null,
    permissions,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required.", 400);
  }
  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters long.", 400);
  }

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError("User not found.", 404);

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new AppError("Current password does not match.", 400);

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await writeAudit({
    userId: String(user._id),
    userName: user.name,
    userRole: user.roleName,
    action: "Password Changed",
    entity: "User",
    entityId: String(user._id),
    details: "User updated their security password.",
  });
}

export async function updateProfile(userId: string, data: { name?: string; phone?: string }) {
  const user = (await User.findById(userId)
    .populate("roleId")
    .populate("departmentId")) as PopulatedUser | null;
  if (!user) throw new AppError("User not found.", 404);

  if (data.name !== undefined) user.name = String(data.name).trim() || user.name;
  if (data.phone !== undefined) user.phone = String(data.phone);

  await user.save();
  await user.populate("roleId");
  await user.populate("departmentId");

  return serializeUser(asRecord(user));
}

export async function logout(user: { id: string; name: string; email: string; roleName: string }) {
  await writeAudit({
    userId: user.id,
    userName: user.name,
    userRole: user.roleName,
    action: "User Logged Out",
    entity: "Auth",
    entityId: user.id,
    details: `User ${user.email} signed out.`,
  });
}
