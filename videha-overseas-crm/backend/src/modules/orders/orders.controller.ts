import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./orders.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.listOrders({
    search: req.query.search as string | undefined,
    status: (req.query.status || req.query.orderStatus) as string | undefined,
    country: req.query.country as string | undefined,
    assignedMemberId: (req.query.assignedMemberId || req.query.assignedToId) as
      | string
      | undefined,
  });
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getOrder(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createOrder(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateOrder(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body as { status?: string; notes?: string };
  const data = await service.updateOrderStatus(req.params.id, status || "", notes, req.user!);
  res.json({ success: true, data });
});
