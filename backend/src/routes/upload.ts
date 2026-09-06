import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  UPLOAD_SECTIONS,
  deleteFromCloudinary,
  isCloudinaryConfigured,
  publicIdFromCloudinaryUrl,
  resourceTypeForMime,
  uploadToCloudinary,
} from "../lib/cloudinary";

const router = Router();

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|pdf/;
    const originalname = String(file.originalname || "");
    const extname = allowed.test(path.extname(originalname).toLowerCase());
    const mimetype = allowed.test(String(file.mimetype)) || String(file.mimetype) === "application/pdf";
    if (extname && mimetype) cb(null, true);
    else cb(null, false);
  },
});

function saveLocalFallback(file: Express.Multer.File): string {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}${path.extname(String(file.originalname))}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

// POST /api/upload — upload to Cloudinary with section-based naming
router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const section = String(req.body.section || "").trim();
    const identifier = String(req.body.identifier || "").trim();
    const field = String(req.body.field || "main").trim();

    if (!section || !identifier) {
      res.status(400).json({
        success: false,
        error: "Upload requires section and identifier (e.g. products + product-slug).",
      });
      return;
    }

    if (!UPLOAD_SECTIONS.includes(section as (typeof UPLOAD_SECTIONS)[number])) {
      res.status(400).json({
        success: false,
        error: `Invalid section "${section}". Allowed: ${UPLOAD_SECTIONS.join(", ")}`,
      });
      return;
    }

    if (isCloudinaryConfigured()) {
      const { url, publicId } = await uploadToCloudinary(req.file.buffer, {
        section,
        identifier,
        field,
        mime: req.file.mimetype,
        originalName: req.file.originalname,
      });

      res.json({
        success: true,
        url,
        publicId,
        section,
        identifier,
        field,
      });
      return;
    }

    const url = saveLocalFallback(req.file);
    res.json({
      success: true,
      url,
      section,
      identifier,
      field,
      warning: "Cloudinary is not configured — file saved locally.",
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

// DELETE /api/upload — delete by Cloudinary public id or local filename
router.delete("/:target", async (req: Request, res: Response) => {
  try {
    const target = decodeURIComponent(String(req.params.target));

    if (target.includes("/") && isCloudinaryConfigured()) {
      const resourceType = target.includes("/assets/") ? "raw" : "image";
      await deleteFromCloudinary(target, resourceType);
      res.json({ success: true, message: "Cloudinary asset deleted" });
      return;
    }

    const filePath = path.join(UPLOAD_DIR, target);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: "File not found" });
      return;
    }
    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    });
  }
});

// POST /api/upload/delete-by-url — delete Cloudinary asset from stored URL
router.post("/delete-by-url", async (req: Request, res: Response) => {
  try {
    const url = String(req.body.url || "");
    const publicId = publicIdFromCloudinaryUrl(url);
    if (!publicId || !isCloudinaryConfigured()) {
      res.status(400).json({ success: false, error: "Not a Cloudinary URL" });
      return;
    }
    const resourceType = publicId.includes("/assets/") ? "raw" : "image";
    await deleteFromCloudinary(publicId, resourceType);
    res.json({ success: true, message: "Asset deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    });
  }
});

export default router;
