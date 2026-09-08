import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./leads.service";
import * as followupsService from "../followups/followups.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listLeads(
    {
      search: req.query.search as string | undefined,
      status: (req.query.status || req.query.leadStatus) as string | undefined,
      country: req.query.country as string | undefined,
      priority: req.query.priority as string | undefined,
      assignedMemberId: (req.query.assignedMemberId || req.query.assignedToId) as string | undefined,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
    },
    req.user!,
  );
  res.json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getLead(req.params.id, {
    activitiesPage: req.query.activitiesPage ?? req.query.page,
    activitiesLimit: req.query.activitiesLimit ?? req.query.limit,
    notesPage: req.query.notesPage ?? req.query.page,
    notesLimit: req.query.notesLimit ?? req.query.limit,
    callsPage: req.query.callsPage ?? req.query.page,
    callsLimit: req.query.callsLimit ?? req.query.limit,
  });
  res.json({ success: true, data });
});

export const getActivities = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listLeadActivities(req.params.id, {
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

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listLeadNotes(req.params.id, {
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

export const getCalls = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listLeadCalls(req.params.id, {
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
    req.body as Record<string, unknown>,
  );
  res.json({ success: true, data });
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };
  const data = await service.addNote(req.params.id, content || "", req.user!);
  res.status(201).json({ success: true, data });
});

export const logCall = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.logCall(req.params.id, req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const convert = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.convertLeadToCustomer(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const getFollowUps = asyncHandler(async (req: Request, res: Response) => {
  const result = await followupsService.listFollowUps(
    {
      leadId: req.params.id,
      schedule: req.query.schedule as string | undefined,
      status: req.query.status as string | undefined,
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

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteLead(req.params.id, req.user!);
  res.json({ success: true, message: "Lead deleted successfully." });
});
