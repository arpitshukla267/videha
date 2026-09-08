import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticate, requirePermission } from "../../middleware/auth";
import {
  CLOUDINARY_MAX_BYTES,
  CRM_DOCUMENT_ALLOWED_EXTENSIONS,
  CRM_DOCUMENT_ALLOWED_MIMES,
} from "../../lib/cloudinary";
import * as ctrl from "./documents.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CLOUDINARY_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase();
    const mime = String(file.mimetype || "");
    const allowedMime = CRM_DOCUMENT_ALLOWED_MIMES.includes(
      mime as (typeof CRM_DOCUMENT_ALLOWED_MIMES)[number],
    );
    const allowedExt = CRM_DOCUMENT_ALLOWED_EXTENSIONS.includes(
      ext as (typeof CRM_DOCUMENT_ALLOWED_EXTENSIONS)[number],
    );
    if (allowedMime || allowedExt) {
      cb(null, true);
      return;
    }
    cb(new Error("Unsupported file type."));
  },
});

export const documentsRoutes = Router();

documentsRoutes.use(authenticate);

documentsRoutes.get("/", requirePermission("documents.view"), ctrl.list);
documentsRoutes.get("/:id/file", requirePermission("documents.view"), ctrl.streamFile);
documentsRoutes.get("/:id", requirePermission("documents.view"), ctrl.getOne);
documentsRoutes.post(
  "/",
  requirePermission("documents.create"),
  upload.single("file"),
  ctrl.create,
);
documentsRoutes.patch("/:id", requirePermission("documents.edit"), ctrl.rename);
documentsRoutes.delete("/:id", requirePermission("documents.delete"), ctrl.remove);
