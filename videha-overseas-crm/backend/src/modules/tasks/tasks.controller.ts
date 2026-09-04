import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./tasks.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.listTasks(
    {
      view: req.query.view as string | undefined,
      search: req.query.search as string | undefined,
      assignedToId: req.query.assignedToId as string | undefined,
      priority: req.query.priority as string | undefined,
    },
    req.user!.id,
  );
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getTask(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createTask(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateTask(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  const data = await service.updateTaskStatus(req.params.id, status || "", req.user!);
  res.json({ success: true, data });
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const { assignedToId } = req.body as { assignedToId?: string };
  const data = await service.assignTask(req.params.id, assignedToId || "", req.user!);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteTask(req.params.id, req.user!);
  res.json({ success: true, message: "Task deleted successfully." });
});
