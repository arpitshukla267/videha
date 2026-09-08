import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./shipments.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listShipments({
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    orderId: req.query.orderId as string | undefined,
    companyId: req.query.companyId as string | undefined,
    customerId: req.query.customerId as string | undefined,
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json({ success: true, data: result.items, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getShipment(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createShipment(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateShipment(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const listByOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.listOrderShipments(req.params.orderId);
  res.json({ success: true, data });
});
