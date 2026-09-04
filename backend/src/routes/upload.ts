import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Store uploads in /backend/uploads (you can later move to S3/Cloudinary)
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const name = String(file.originalname);
    cb(null, `${uniqueSuffix}${path.extname(name)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|pdf/;
    const originalname = Array.isArray(file.originalname) ? file.originalname[0] : file.originalname;
    const extname = allowed.test(path.extname(originalname).toLowerCase());
    const mimetype = allowed.test(String(file.mimetype)) || String(file.mimetype) === "application/pdf";
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// POST /api/upload — upload image or PDF
router.post("/", upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
});

// DELETE /api/upload/:filename — delete uploaded file
router.delete("/:filename", (req: Request, res: Response) => {
  const filePath = path.join(UPLOAD_DIR, String(req.params.filename));
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: "File not found" });
    return;
  }
  fs.unlinkSync(filePath);
  res.json({ success: true, message: "File deleted" });
});

export default router;
