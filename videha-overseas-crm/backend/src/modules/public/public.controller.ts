import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { trackOrderPublic } from "../orders/orders.service";

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = await trackOrderPublic(req.params.orderCode);
  res.json({ success: true, data });
});
