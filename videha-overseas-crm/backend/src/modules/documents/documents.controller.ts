import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./documents.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listDocuments(
    {
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      fileKind: req.query.fileKind as string | undefined,
      page: req.query.page,
      limit: req.query.limit,
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
  const data = await service.getDocument(req.params.id, req.user!);
  res.json({ success: true, data });
});

export const streamFile = asyncHandler(async (req: Request, res: Response) => {
  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";
  const file = await service.streamDocumentFile(req.params.id, req.user!, disposition);
  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `${file.disposition}; filename="${encodeURIComponent(file.fileName)}"`,
  );
  res.send(file.buffer);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createDocument(
    {
      title: req.body.title,
      category: req.body.category,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      file: req.file,
    },
    req.user!,
  );
  res.status(201).json({ success: true, data });
});

export const rename = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.renameDocument(req.params.id, req.body, req.user!);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteDocument(req.params.id, req.user!);
  res.json({ success: true, message: "Document deleted successfully." });
});
