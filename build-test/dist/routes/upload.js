"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("../lib/cloudinary");
const router = (0, express_1.Router)();
const UPLOAD_DIR = path_1.default.join(__dirname, "../../uploads");
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif|svg|pdf/;
        const originalname = String(file.originalname || "");
        const extname = allowed.test(path_1.default.extname(originalname).toLowerCase());
        const mimetype = allowed.test(String(file.mimetype)) || String(file.mimetype) === "application/pdf";
        if (extname && mimetype)
            cb(null, true);
        else
            cb(null, false);
    },
});
function saveLocalFallback(file) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${path_1.default.extname(String(file.originalname))}`;
    fs_1.default.writeFileSync(path_1.default.join(UPLOAD_DIR, filename), file.buffer);
    return `/uploads/${filename}`;
}
// POST /api/upload — upload to Cloudinary with section-based naming
router.post("/", upload.single("image"), async (req, res) => {
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
        if (!cloudinary_1.UPLOAD_SECTIONS.includes(section)) {
            res.status(400).json({
                success: false,
                error: `Invalid section "${section}". Allowed: ${cloudinary_1.UPLOAD_SECTIONS.join(", ")}`,
            });
            return;
        }
        if ((0, cloudinary_1.isCloudinaryConfigured)()) {
            const { url, publicId } = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, {
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
    }
    catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        });
    }
});
// DELETE /api/upload — delete by Cloudinary public id or local filename
router.delete("/:target", async (req, res) => {
    try {
        const target = decodeURIComponent(String(req.params.target));
        if (target.includes("/") && (0, cloudinary_1.isCloudinaryConfigured)()) {
            const resourceType = target.includes("/assets/") ? "raw" : "image";
            await (0, cloudinary_1.deleteFromCloudinary)(target, resourceType);
            res.json({ success: true, message: "Cloudinary asset deleted" });
            return;
        }
        const filePath = path_1.default.join(UPLOAD_DIR, target);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ success: false, error: "File not found" });
            return;
        }
        fs_1.default.unlinkSync(filePath);
        res.json({ success: true, message: "File deleted" });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Delete failed",
        });
    }
});
// POST /api/upload/delete-by-url — delete Cloudinary asset from stored URL
router.post("/delete-by-url", async (req, res) => {
    try {
        const url = String(req.body.url || "");
        const publicId = (0, cloudinary_1.publicIdFromCloudinaryUrl)(url);
        if (!publicId || !(0, cloudinary_1.isCloudinaryConfigured)()) {
            res.status(400).json({ success: false, error: "Not a Cloudinary URL" });
            return;
        }
        const resourceType = publicId.includes("/assets/") ? "raw" : "image";
        await (0, cloudinary_1.deleteFromCloudinary)(publicId, resourceType);
        res.json({ success: true, message: "Asset deleted" });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Delete failed",
        });
    }
});
exports.default = router;
