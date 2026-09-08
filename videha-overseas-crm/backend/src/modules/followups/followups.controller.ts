import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendCsvResponse } from "../../utils/csvExport";
import * as service from "./followups.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listFollowUps(
    {
      schedule: req.query.schedule as string | undefined,
      leadId: req.query.leadId as string | undefined,
      assignedToId: (req.query.assignedToId || req.query.assignedMemberId) as string | undefined,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page,
      limit: req.query.limit,
    },
    req.user!,
  );
  res.json({
    success: true,
    data: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.exportFollowUps(
    {
      schedule: req.query.schedule as string | undefined,
      leadId: req.query.leadId as string | undefined,
      assignedToId: (req.query.assignedToId || req.query.assignedMemberId) as string | undefined,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      search: req.query.search as string | undefined,
    },
    req.user!,
  );
  sendCsvResponse(res, result.filename, result.body);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getFollowUp(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createFollowUp(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateFollowUp(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.completeFollowUp(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const skip = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.skipFollowUp(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteFollowUp(req.params.id, req.user!);
  res.json({ success: true, message: "Follow-up deleted successfully." });
});
