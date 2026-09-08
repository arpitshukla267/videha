import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./audit.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listAuditLogs(req.query);
  res.json({ success: true, data: result.data, total: result.total, page: result.page, limit: result.limit });
});
