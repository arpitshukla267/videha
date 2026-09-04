import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./leads.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listLeads({
    search: req.query.search as string | undefined,
    status: (req.query.status || req.query.leadStatus) as string | undefined,
    country: req.query.country as string | undefined,
    priority: req.query.priority as string | undefined,
    assignedMemberId: (req.query.assignedMemberId || req.query.assignedToId) as string | undefined,
    page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
    limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 10,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
  });
  res.json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getLead(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createLead(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateLead(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const { assignedMemberId, assignedToId } = req.body as {
    assignedMemberId?: string | null;
    assignedToId?: string | null;
  };
  const data = await service.assignLead(
    req.params.id,
    (assignedMemberId ?? assignedToId ?? null) as string | null,
    req.user!,
  );
  res.json({ success: true, data });
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };
  const data = await service.addNote(req.params.id, content || "", req.user!);
  res.status(201).json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteLead(req.params.id, req.user!);
  res.json({ success: true, message: "Lead deleted successfully." });
});
