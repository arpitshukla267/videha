import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendCsvResponse } from "../../utils/csvExport";
import * as service from "./suppliers.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listSuppliers({
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    country: req.query.country as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: req.query.sortOrder as string | undefined,
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

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.exportSuppliers(
    {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      country: req.query.country as string | undefined,
    },
    req.user!,
  );
  sendCsvResponse(res, result.filename, result.body);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getSupplier(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createSupplier(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateSupplier(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.deleteSupplier(req.params.id, req.user!);
  res.json({ success: true, data });
});
