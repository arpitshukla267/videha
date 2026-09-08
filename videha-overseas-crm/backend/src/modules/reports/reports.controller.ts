import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./reports.service";
import * as advancedService from "./reports.advanced.service";

export const getReports = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getReports();
  res.json({ success: true, data });
});

export const getAdvancedReports = asyncHandler(async (req: Request, res: Response) => {
  const data = await advancedService.getAdvancedReports(req.user!, {
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    memberId: req.query.memberId as string | undefined,
    departmentId: req.query.departmentId as string | undefined,
  });
  res.json({ success: true, data });
});
