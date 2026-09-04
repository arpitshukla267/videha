import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./roles.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listRoles();
  res.json({ success: true, data });
});

export const permissionsCatalog = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: service.getPermissionsCatalog() });
});

export const updatePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { permissions } = req.body as { permissions: string[] };
  const data = await service.updateRolePermissions(req.params.id, permissions, req.user!);
  res.json({ success: true, data });
});
