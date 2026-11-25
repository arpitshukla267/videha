import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User, type IUser } from "../../models/User";
import type { IRole } from "../../models/Role";
import { PasswordResetOtp } from "../../models/PasswordResetOtp";
import { sendEmailViaResend } from "../../services/emailReminder.service";
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

  const normalized = email.toLowerCase().trim();
  const emailAliases: Record<string, string> = {
    "md@videhaoverseas.com": "superadmin@videhaoverseas.com",
    "shilpa.shelar@videhaoverseas.com": "shilpasachin31@gmail.com",
    "sejal.bidgar@videhaoverseas.com": "sejalbidgar@gmail.com",
  };

  // 1. Direct match on user's actual login email
  let user = (await User.findOne({ email: normalized })
    .select("+passwordHash")
    .populate("roleId")
    .populate("departmentId")) as PopulatedUser | null;

  // 2. Legacy alias fallback only if direct match not found
  if (!user && emailAliases[normalized]) {
    user = (await User.findOne({ email: emailAliases[normalized] })
      .select("+passwordHash")
      .populate("roleId")
      .populate("departmentId")) as PopulatedUser | null;
  }

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

export async function changeEmail(
  userId: string,
  newEmail: string,
  currentPassword?: string,
) {
  if (!newEmail || typeof newEmail !== "string") {
    throw new AppError("New email address is required.", 400);
  }

  const normalized = newEmail.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  const user = (await User.findById(userId)
    .select("+passwordHash")
    .populate("roleId")
    .populate("departmentId")) as PopulatedUser | null;

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (currentPassword) {
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError("Current password does not match.", 400);
    }
  }

  if (user.email === normalized) {
    throw new AppError("The new email must be different from your current email.", 400);
  }

  // Prevent duplicate email accounts
  const existing = await User.findOne({
    email: normalized,
    _id: { $ne: user._id },
  });
  if (existing) {
    throw new AppError("An account with this email address already exists.", 409);
  }

  const oldEmail = user.email;
  user.email = normalized;
  user.revision = (user.revision || 0) + 1;
  await user.save();

  await user.populate("roleId");
  await user.populate("departmentId");

  await writeAudit({
    userId: String(user._id),
    userName: user.name,
    userRole: user.roleName,
    action: "Login Email Changed",
    entity: "User",
    entityId: String(user._id),
    details: `User ${user.name} changed login email from ${oldEmail} to ${normalized}.`,
  });

  const role = getRole(user);
  const roleId = role?._id ? String(role._id) : String(user.roleId);
  const permissions = resolveRolePermissions(
    role?.name || user.roleName,
    role?.permissions,
  );

  const token = signToken({
    id: String(user._id),
    email: user.email,
    roleId,
    roleName: user.roleName,
  });

  return {
    token,
    user: serializeUser(asRecord(user)),
    role: role ? serializeRole(role.toObject() as unknown as Record<string, unknown>) : null,
    permissions,
  };
}

export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string; email?: string },
) {
  const user = (await User.findById(userId)
    .populate("roleId")
    .populate("departmentId")) as PopulatedUser | null;
  if (!user) throw new AppError("User not found.", 404);

  if (data.name !== undefined) user.name = String(data.name).trim() || user.name;
  if (data.phone !== undefined) user.phone = String(data.phone);

  if (data.email !== undefined && data.email.trim() && data.email.toLowerCase().trim() !== user.email) {
    const normalized = data.email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new AppError("Please provide a valid email address.", 400);
    }
    const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
    if (existing) {
      throw new AppError("An account with this email address already exists.", 409);
    }
    const oldEmail = user.email;
    user.email = normalized;
    await writeAudit({
      userId: String(user._id),
      userName: user.name,
      userRole: user.roleName,
      action: "Login Email Changed",
      entity: "User",
      entityId: String(user._id),
      details: `User ${user.name} changed login email from ${oldEmail} to ${normalized}.`,
    });
  }

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

export async function requestPasswordReset(email: string) {
  if (!email || typeof email !== "string") {
    throw new AppError("Email address is required.", 400);
  }

  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new AppError("Please provide a valid corporate email address.", 400);
  }

  // Uniform response message to avoid leaking user existence
  const genericSuccessMessage =
    "If an active account is registered with this email, a verification code has been sent.";

  const user = await User.findOne({ email: normalized, status: "active" });
  if (!user) {
    console.log(`[Forgot Password] Account not found or inactive for: ${normalized}. Returning uniform response.`);
    return { success: true, message: genericSuccessMessage };
  }

  // Remove any stale OTPs for this email
  await PasswordResetOtp.deleteMany({ email: normalized });

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await PasswordResetOtp.create({
    email: normalized,
    otp,
    verified: false,
    expiresAt,
  });

  const subject = "Videha Overseas CRM – Password Reset Verification Code";
  const text = [
    `Hello ${user.name},`,
    "",
    "You requested to reset your password for your Videha Overseas CRM account.",
    "",
    `Your 6-digit verification code (OTP) is: ${otp}`,
    "",
    "This verification code will expire in 10 minutes.",
    "If you did not request a password reset, please ignore this email or notify your system administrator.",
    "",
    "Regards,",
    "Videha Overseas CRM Security Team",
  ].join("\n");

  const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #182430; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2DED2; border-radius: 8px;">
  <h2 style="color: #0E3B2E; margin-top: 0;">Password Reset Request</h2>
  <p>Hello ${user.name},</p>
  <p>You requested to reset your password for your Videha Overseas CRM account.</p>
  <div style="background-color: #F6F8F6; border-left: 4px solid #1E7A52; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #57534E;">Your 6-digit verification code (OTP) is:</p>
    <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0E3B2E;">${otp}</p>
  </div>
  <p style="font-size: 13px; color: #78716C;">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
  <p style="margin-top: 24px; font-size: 13px;">Regards,<br /><strong>Videha Overseas CRM Security Team</strong></p>
</div>`;

  await sendEmailViaResend({
    to: normalized,
    subject,
    text,
    html,
    itemType: "OTP",
    userName: user.name,
    entityId: String(user._id),
  });

  return { success: true, message: genericSuccessMessage };
}

export async function verifyPasswordResetOtp(email: string, otp: string) {
  if (!email || !otp) {
    throw new AppError("Email and verification code are required.", 400);
  }

  const normalized = email.toLowerCase().trim();
  const cleanedOtp = otp.trim();

  const record = await PasswordResetOtp.findOne({
    email: normalized,
    otp: cleanedOtp,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new AppError("Invalid or expired verification code. Please check your code or request a new one.", 400);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  record.verified = true;
  record.resetToken = resetToken;
  await record.save();

  return {
    success: true,
    resetToken,
    message: "Verification code verified successfully. You may now enter your new password.",
  };
}

export async function resetPasswordWithOtp(
  email: string,
  resetToken: string,
  newPassword: string,
) {
  if (!email || !resetToken || !newPassword) {
    throw new AppError("Email, reset token, and new password are required.", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters long.", 400);
  }

  const normalized = email.toLowerCase().trim();
  const record = await PasswordResetOtp.findOne({
    email: normalized,
    resetToken: resetToken.trim(),
    verified: true,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new AppError("Invalid or expired password reset session. Please request a new verification code.", 400);
  }

  const user = await User.findOne({ email: normalized, status: "active" }).select("+passwordHash");
  if (!user) {
    throw new AppError("User account not found or inactive.", 404);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.revision = (user.revision || 0) + 1;
  await user.save();

  // Delete consumed OTPs
  await PasswordResetOtp.deleteMany({ email: normalized });

  await writeAudit({
    userId: String(user._id),
    userName: user.name,
    userRole: user.roleName,
    action: "Password Reset via OTP",
    entity: "User",
    entityId: String(user._id),
    details: `User ${user.email} successfully reset their password via email OTP.`,
  });

  return {
    success: true,
    message: "Your password has been reset successfully. You can now sign in with your new password.",
  };
}
