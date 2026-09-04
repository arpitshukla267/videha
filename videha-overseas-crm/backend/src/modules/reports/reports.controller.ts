import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./reports.service";

export const getReports = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getReports();
  res.json({ success: true, data });
});
