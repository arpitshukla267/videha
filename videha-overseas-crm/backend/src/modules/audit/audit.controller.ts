import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./audit.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
  const result = await service.listAuditLogs(page, limit);
  // Frontend expects `{ success, data: AuditLog[] }`
  res.json({ success: true, data: result.data, total: result.total, page: result.page, limit: result.limit });
});
