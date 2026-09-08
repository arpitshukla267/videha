import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { authenticate, requirePermission } from "../../middleware/auth";
import {
  IMPORT_ENTITY_PERMISSION,
  IMPORT_ENTITY_TYPES,
  IMPORT_MAX_FILE_BYTES,
  type ImportEntityType,
} from "../../constants/importFields";
import { AppError } from "../../utils/AppError";
import * as ctrl from "./import.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMPORT_MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();
    if (name.endsWith(".csv") || mime.includes("csv") || mime === "text/plain") {
      cb(null, true);
      return;
    }
    cb(new Error("Only CSV files are supported."));
  },
});

function importEntityGuard(req: Request, _res: Response, next: NextFunction) {
  const entity = req.params.entity;
  if (!entity || !IMPORT_ENTITY_TYPES.includes(entity as ImportEntityType)) {
    next(new AppError(`Unsupported import entity: ${entity ?? "undefined"}`, 400, "INVALID_IMPORT_ENTITY"));
    return;
  }
  const permission = IMPORT_ENTITY_PERMISSION[entity as ImportEntityType];
  requirePermission(permission)(req, _res, next);
}

export const importRoutes = Router();

importRoutes.use(authenticate);

importRoutes.get("/:entity/meta", importEntityGuard, ctrl.getMeta);
importRoutes.post("/:entity/preview", importEntityGuard, upload.single("file"), ctrl.preview);
importRoutes.post("/:entity/confirm", importEntityGuard, ctrl.confirm);
importRoutes.get("/:entity/errors/:sessionId", importEntityGuard, ctrl.downloadErrors);
