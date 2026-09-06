import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./finance.service";

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getFinanceOverview();
  res.json({ success: true, data });
});
