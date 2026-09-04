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

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  const data = await authService.updateProfile(req.user!.id, { name, phone });
  res.json({ success: true, data });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!);
  res.json({ success: true, message: "Signed out successfully." });
});
