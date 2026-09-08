import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./import.service";

export const getMeta = asyncHandler(async (req: Request, res: Response) => {
  const data = service.getImportMeta(req.params.entity);
  res.json({ success: true, data });
});

export const preview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "CSV file is required." });
    return;
  }

  let mapping: Record<string, string | null> | undefined;
  if (req.body.mapping) {
    mapping = typeof req.body.mapping === "string" ? JSON.parse(req.body.mapping) : req.body.mapping;
  }

  const data = await service.previewImport(req.params.entity, req.file, mapping, req.user!);
  res.json({ success: true, data });
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = String(req.body.sessionId || "");
  if (!sessionId) {
    res.status(400).json({ success: false, message: "sessionId is required." });
    return;
  }
  const data = await service.confirmImport(sessionId, req.user!);
  res.json({ success: true, data });
});

export const downloadErrors = asyncHandler(async (req: Request, res: Response) => {
  await service.downloadImportErrors(req.params.sessionId, req.user!, res);
});
