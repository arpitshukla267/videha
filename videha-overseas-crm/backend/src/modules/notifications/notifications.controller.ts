import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
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

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const success = await service.markRead(req.params.id, req.user!.id);
  res.json({ success });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await service.markAllRead(req.user!.id);
  res.json({ success: true });
});
