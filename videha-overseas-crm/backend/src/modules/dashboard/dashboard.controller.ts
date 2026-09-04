import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./dashboard.service";

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getOverview(req.user!.id);
  res.json({ success: true, data });
});
