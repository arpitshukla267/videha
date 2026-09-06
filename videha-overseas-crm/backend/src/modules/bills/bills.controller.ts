import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./bills.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.listBills(
    {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      sync: req.query.sync !== "false",
    },
    req.user!,
  );
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getBill(req.params.id);
  res.json({ success: true, data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateBill(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { amount, notes } = req.body as { amount?: number; notes?: string };
  const data = await service.recordBillPayment(req.params.id, Number(amount) || 0, notes, req.user!);
  res.json({ success: true, data });
});

export const downloadPdf = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, filename } = await service.getBillPdf(req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const sync = asyncHandler(async (req: Request, res: Response) => {
  const created = await service.syncDeliveredOrdersToBills(req.user!.id);
  res.json({ success: true, data: { created } });
});
