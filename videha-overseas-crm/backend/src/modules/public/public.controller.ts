import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { trackOrderPublic } from "../orders/orders.service";
import { createPublicRfq } from "./public.service";

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = await trackOrderPublic(req.params.orderCode);
  res.json({ success: true, data });
});

export const submitRfq = asyncHandler(async (req: Request, res: Response) => {
  const data = await createPublicRfq(req.body);
  res.status(201).json({
    success: true,
    message: "RFQ successfully received and registered as Lead.",
    data,
  });
});
