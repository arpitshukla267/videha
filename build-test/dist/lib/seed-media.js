"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapInBatches = mapInBatches;
exports.uploadSeedMedia = uploadSeedMedia;
exports.uploadSeedPdf = uploadSeedPdf;
exports.assertCloudinaryForSeed = assertCloudinaryForSeed;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("./cloudinary");
const FRONTEND_PUBLIC = path_1.default.resolve(__dirname, "../../../frontend/public");
function mimeForExtension(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
    };
    return map[ext] || "application/octet-stream";
}
function resolveLocalAsset(assetPath) {
    if (!assetPath || assetPath.startsWith("http"))
        return null;
    const relative = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
    const absolute = path_1.default.join(FRONTEND_PUBLIC, relative);
    if (fs_1.default.existsSync(absolute))
        return absolute;
    const parsed = path_1.default.parse(absolute);
    const alternates = [".webp", ".jpeg", ".jpg", ".png"].filter((ext) => ext !== parsed.ext.toLowerCase());
    for (const ext of alternates) {
        const candidate = path_1.default.join(parsed.dir, `${parsed.name}${ext}`);
        if (fs_1.default.existsSync(candidate))
            return candidate;
    }
    return null;
}
async function mapInBatches(items, batchSize, fn) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((item, offset) => fn(item, i + offset)));
        results.push(...batchResults);
    }
    return results;
}
async function uploadSeedMedia(section, identifier, field, assetPath) {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        return assetPath;
    }
    const localFile = resolveLocalAsset(assetPath);
    if (!localFile) {
        console.warn(`  ⚠ Local file not found for ${assetPath} — keeping path as-is`);
        return assetPath;
    }
    const mime = mimeForExtension(localFile);
    const publicId = (0, cloudinary_1.buildPublicId)(section, identifier, field);
    const fileSize = fs_1.default.statSync(localFile).size;
    const usesChunks = mime.startsWith("image/") && fileSize > cloudinary_1.CLOUDINARY_MAX_BYTES;
    const { url } = await (0, cloudinary_1.uploadToCloudinary)(localFile, {
        section,
        identifier,
        field,
        mime,
        originalName: path_1.default.basename(localFile),
    });
    console.log(`  ↑ ${publicId}${usesChunks ? " (chunked)" : ""}`);
    return url;
}
/** Brochure PDFs stay on the local /brochure path — not uploaded to Cloudinary. */
async function uploadSeedPdf(_identifier, assetPath, _field = "file") {
    console.log(`  ↷ keeping local PDF path (${assetPath})`);
    return assetPath;
}
async function assertCloudinaryForSeed() {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        console.warn("\n⚠ Cloudinary is not fully configured (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET).\n" +
            "  Seed will keep local /images paths instead of uploading.\n");
        return;
    }
    console.log(`\n☁ Uploading seed media to Cloudinary (cloud: ${process.env.CLOUDINARY_CLOUD_NAME?.trim()}, batches of ${cloudinary_1.SEED_UPLOAD_BATCH_SIZE})…`);
    await (0, cloudinary_1.verifyCloudinaryCredentials)();
    console.log("  ✓ Cloudinary credentials OK\n");
}
