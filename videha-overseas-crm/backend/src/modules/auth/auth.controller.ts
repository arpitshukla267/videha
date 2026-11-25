import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const data = await authService.login(email || "", password || "");
  res.json({ success: true, data });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.getMe(req.user!.id);
  res.json({ success: true, data });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  await authService.changePassword(req.user!.id, currentPassword || "", newPassword || "");
  res.json({ success: true, message: "Password updated successfully." });
});

export const changeEmail = asyncHandler(async (req: Request, res: Response) => {
  const { newEmail, email, currentPassword, password } = req.body as {
    newEmail?: string;
    email?: string;
    currentPassword?: string;
    password?: string;
  };
  const targetEmail = (newEmail || email || "").trim();
  const pwd = currentPassword || password;

  const data = await authService.changeEmail(req.user!.id, targetEmail, pwd);
  res.json({
    success: true,
    message: "Login email changed successfully. Please use your new email for future logins.",
    data,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, email } = req.body as { name?: string; phone?: string; email?: string };
  const data = await authService.updateProfile(req.user!.id, { name, phone, email });
  res.json({ success: true, data });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!);
  res.json({ success: true, message: "Signed out successfully." });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  const result = await authService.requestPasswordReset(email || "");
  res.json(result);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email?: string; otp?: string };
  const result = await authService.verifyPasswordResetOtp(email || "", otp || "");
  res.json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, resetToken, newPassword } = req.body as {
    email?: string;
    resetToken?: string;
    newPassword?: string;
  };
  const result = await authService.resetPasswordWithOtp(
    email || "",
    resetToken || "",
    newPassword || "",
  );
  res.json(result);
});
