import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { EmailReminderLog } from "../../models/EmailReminderLog";
import * as service from "./notifications.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMine(req.user!.id, {
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json({
    success: true,
    data: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const listEmailReminders = asyncHandler(async (req: Request, res: Response) => {
  const query: Record<string, unknown> = {};
  if (req.user?.roleName !== "SUPER_ADMIN") {
    query.to = req.user?.email.toLowerCase().trim();
  }
  const logs = await EmailReminderLog.find(query).sort({ sentAt: -1 }).limit(50).lean();
  res.json({
    success: true,
    data: logs,
  });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const success = await service.markRead(req.params.id, req.user!.id);
  res.json({ success });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await service.markAllRead(req.user!.id);
  res.json({ success: true });
});
