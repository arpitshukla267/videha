import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./quotations.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listQuotations(
    {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      leadId: req.query.leadId as string | undefined,
      companyId: req.query.companyId as string | undefined,
      customerId: req.query.customerId as string | undefined,
      assignedToId: (req.query.assignedToId || req.query.assignedMemberId) as string | undefined,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
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

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getQuotation(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createQuotation(req.body, req.user!);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateQuotation(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateQuotationStatus(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteQuotation(req.params.id, req.user!);
  res.json({ success: true, message: "Quotation deleted successfully." });
});
