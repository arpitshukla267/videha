"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_SECTIONS = exports.SEED_UPLOAD_BATCH_SIZE = exports.CLOUDINARY_MAX_BYTES = void 0;
exports.isCloudinaryConfigured = isCloudinaryConfigured;
exports.configureCloudinary = configureCloudinary;
exports.verifyCloudinaryCredentials = verifyCloudinaryCredentials;
exports.slugifySegment = slugifySegment;
exports.buildPublicId = buildPublicId;
exports.resourceTypeForMime = resourceTypeForMime;
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.publicIdFromCloudinaryUrl = publicIdFromCloudinaryUrl;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || "videha-overseas";
exports.CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024;
const CHUNKED_UPLOAD_BYTES = 6 * 1024 * 1024;
exports.SEED_UPLOAD_BATCH_SIZE = 5;
exports.UPLOAD_SECTIONS = [
    "products",
    "hero",
    "process-steps",
    "assets",
];
function isCloudinaryConfigured() {
    return Boolean(process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET);
}
function configureCloudinary() {
    if (!isCloudinaryConfigured())
        return;
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
        api_key: process.env.CLOUDINARY_API_KEY?.trim(),
        api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
        secure: true,
    });
}
/** Throws with a readable message when credentials do not match. */
async function verifyCloudinaryCredentials() {
    if (!isCloudinaryConfigured())
        return;
    configureCloudinary();
    const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const key = process.env.CLOUDINARY_API_KEY?.trim();
    const testPublicId = `${ROOT_FOLDER}/_credential_test`;
    // 1×1 PNG — ping alone can pass with read-only API keys.
    const testImage = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    try {
        await cloudinary_1.v2.api.ping();
        await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({ public_id: testPublicId, overwrite: true }, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
            stream.end(testImage);
        });
        await cloudinary_1.v2.uploader.destroy(testPublicId, { invalidate: true });
    }
    catch (error) {
        const message = String(error?.message || error);
        const httpCode = error?.http_code ?? error?.error?.http_code;
        let hint = message;
        if (message.includes("Unknown API key") || message.includes("Invalid api_key")) {
            hint = `API key "${key}" is not valid for cloud "${cloud}". Copy the API Key from Cloudinary → Settings → Access Keys for cloud "${cloud}".`;
        }
        else if (message.includes("Invalid Signature")) {
            hint = `API secret does not match API key "${key}" on cloud "${cloud}". Copy a fresh API Key + API Secret pair from Cloudinary → Settings → Access Keys.`;
        }
        else if (httpCode === 403 || message.includes("403")) {
            hint =
                `Upload is forbidden for cloud "${cloud}". The API key may be read-only — ` +
                    `create or use a key with upload/write permissions in Cloudinary → Settings → Access Keys.`;
        }
        throw new Error(`Cloudinary auth failed: ${hint}`);
    }
}
function slugifySegment(value) {
    return (value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "item");
}
function buildPublicId(section, identifier, field) {
    const safeSection = slugifySegment(section);
    const safeIdentifier = slugifySegment(identifier);
    const safeField = slugifySegment(field);
    return `${ROOT_FOLDER}/${safeSection}/${safeIdentifier}/${safeField}`;
}
function resourceTypeForMime(mime) {
    if (mime === "application/pdf")
        return "raw";
    if (mime.startsWith("image/"))
        return "image";
    return "auto";
}
async function uploadToCloudinary(source, options) {
    configureCloudinary();
    const publicId = buildPublicId(options.section, options.identifier, options.field);
    const resourceType = resourceTypeForMime(options.mime);
    const size = typeof source === "string" ? fs_1.default.statSync(source).size : source.length;
    if (resourceType === "raw" && size > exports.CLOUDINARY_MAX_BYTES) {
        throw new Error(`${options.originalName} is ${(size / (1024 * 1024)).toFixed(1)} MB — PDFs over 10 MB are not uploaded to Cloudinary.`);
    }
    const uploadOptions = {
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: resourceType,
    };
    if (resourceType === "raw") {
        const ext = path_1.default.extname(options.originalName).replace(/^\./, "");
        if (ext)
            uploadOptions.format = ext;
    }
    let filePath = typeof source === "string" ? source : null;
    let tempFile = null;
    if (Buffer.isBuffer(source) && size > exports.CLOUDINARY_MAX_BYTES) {
        tempFile = path_1.default.join(os_1.default.tmpdir(), `cloudinary-${Date.now()}-${path_1.default.basename(options.originalName)}`);
        fs_1.default.writeFileSync(tempFile, source);
        filePath = tempFile;
    }
    try {
        const useChunkedUpload = resourceType === "image" && size > exports.CLOUDINARY_MAX_BYTES && filePath !== null;
        const result = useChunkedUpload
            ? await uploadChunkedFile(filePath, uploadOptions)
            : await uploadDirect(source, filePath, uploadOptions);
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
    finally {
        if (tempFile)
            fs_1.default.unlinkSync(tempFile);
    }
}
function uploadDirect(source, filePath, uploadOptions) {
    return new Promise((resolve, reject) => {
        if (filePath !== null) {
            cloudinary_1.v2.uploader.upload(filePath, uploadOptions, (error, uploadResult) => {
                if (error)
                    reject(error);
                else
                    resolve(uploadResult);
            });
            return;
        }
        const stream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
            if (error)
                reject(error);
            else
                resolve(uploadResult);
        });
        stream.end(source);
    });
}
function uploadChunkedFile(filePath, uploadOptions) {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload_chunked(filePath, {
            ...uploadOptions,
            chunk_size: CHUNKED_UPLOAD_BYTES,
        }, (error, uploadResult) => {
            if (error)
                reject(error);
            else
                resolve(uploadResult);
        });
    });
}
async function deleteFromCloudinary(publicId, resourceType = "image") {
    configureCloudinary();
    return cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}
function publicIdFromCloudinaryUrl(url) {
    if (!url.includes("res.cloudinary.com"))
        return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (!match?.[1])
        return null;
    return decodeURIComponent(match[1]);
}
