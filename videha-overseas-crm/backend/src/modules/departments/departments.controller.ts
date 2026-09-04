import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./departments.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = await service.listDepartments(status);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createDepartment(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateDepartment(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: "active" | "inactive" };
  const data = await service.setDepartmentStatus(req.params.id, status, req.user!);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteDepartment(req.params.id, req.user!);
  res.json({ success: true, message: "Department deleted successfully." });
});
