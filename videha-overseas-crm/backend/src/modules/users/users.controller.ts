import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./users.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listUsers({
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
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

export const directory = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listTeamDirectory();
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createUser(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateUser(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: "active" | "inactive" };
  const data = await service.setUserStatus(
    req.params.id,
    status,
    req.user!,
    req.body as Record<string, unknown>,
  );
  res.json({ success: true, data });
});
