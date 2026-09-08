import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendCsvResponse } from "../../utils/csvExport";
import * as service from "./companies.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listCompanies({
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    country: req.query.country as string | undefined,
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
  const result = await service.exportCompanies(
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
  const data = await service.getCompany(req.params.id);
  res.json({ success: true, data });
});

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listCompanyCustomers(req.params.id, {
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
  const data = await service.createCompany(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateCompany(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});
