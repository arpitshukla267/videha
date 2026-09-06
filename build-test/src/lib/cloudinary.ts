import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import os from "os";
import path from "path";

const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || "videha-overseas";
export const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024;
const CHUNKED_UPLOAD_BYTES = 6 * 1024 * 1024;
export const SEED_UPLOAD_BATCH_SIZE = 5;

export const UPLOAD_SECTIONS = [
  "products",
  "hero",
  "process-steps",
  "assets",
] as const;

export type UploadSection = (typeof UPLOAD_SECTIONS)[number];

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function configureCloudinary(): void {
  if (!isCloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    secure: true,
  });
}

/** Throws with a readable message when credentials do not match. */
export async function verifyCloudinaryCredentials(): Promise<void> {
  if (!isCloudinaryConfigured()) return;

  configureCloudinary();

  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const testPublicId = `${ROOT_FOLDER}/_credential_test`;

  // 1×1 PNG — ping alone can pass with read-only API keys.
  const testImage = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  try {
    await cloudinary.api.ping();

    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: testPublicId, overwrite: true },
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
      stream.end(testImage);
    });

    await cloudinary.uploader.destroy(testPublicId, { invalidate: true });
  } catch (error: any) {
    const message = String(error?.message || error);
    const httpCode = error?.http_code ?? error?.error?.http_code;

    let hint = message;
    if (message.includes("Unknown API key") || message.includes("Invalid api_key")) {
      hint = `API key "${key}" is not valid for cloud "${cloud}". Copy the API Key from Cloudinary → Settings → Access Keys for cloud "${cloud}".`;
    } else if (message.includes("Invalid Signature")) {
      hint = `API secret does not match API key "${key}" on cloud "${cloud}". Copy a fresh API Key + API Secret pair from Cloudinary → Settings → Access Keys.`;
    } else if (httpCode === 403 || message.includes("403")) {
      hint =
        `Upload is forbidden for cloud "${cloud}". The API key may be read-only — ` +
        `create or use a key with upload/write permissions in Cloudinary → Settings → Access Keys.`;
    }

    throw new Error(`Cloudinary auth failed: ${hint}`);
  }
}

export function slugifySegment(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

export function buildPublicId(section: string, identifier: string, field: string): string {
  const safeSection = slugifySegment(section);
  const safeIdentifier = slugifySegment(identifier);
  const safeField = slugifySegment(field);
  return `${ROOT_FOLDER}/${safeSection}/${safeIdentifier}/${safeField}`;
}

export function resourceTypeForMime(mime: string): "image" | "raw" | "auto" {
  if (mime === "application/pdf") return "raw";
  if (mime.startsWith("image/")) return "image";
  return "auto";
}

export async function uploadToCloudinary(
  source: Buffer | string,
  options: {
    section: string;
    identifier: string;
    field: string;
    mime: string;
    originalName: string;
  },
): Promise<{ url: string; publicId: string }> {
  configureCloudinary();

  const publicId = buildPublicId(options.section, options.identifier, options.field);
  const resourceType = resourceTypeForMime(options.mime);
  const size = typeof source === "string" ? fs.statSync(source).size : source.length;

  if (resourceType === "raw" && size > CLOUDINARY_MAX_BYTES) {
    throw new Error(
      `${options.originalName} is ${(size / (1024 * 1024)).toFixed(1)} MB — PDFs over 10 MB are not uploaded to Cloudinary.`,
    );
  }

  const uploadOptions: Record<string, unknown> = {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: resourceType,
  };

  if (resourceType === "raw") {
    const ext = path.extname(options.originalName).replace(/^\./, "");
    if (ext) uploadOptions.format = ext;
  }

  let filePath = typeof source === "string" ? source : null;
  let tempFile: string | null = null;

  if (Buffer.isBuffer(source) && size > CLOUDINARY_MAX_BYTES) {
    tempFile = path.join(
      os.tmpdir(),
      `cloudinary-${Date.now()}-${path.basename(options.originalName)}`,
    );
    fs.writeFileSync(tempFile, source);
    filePath = tempFile;
  }

  try {
    const useChunkedUpload =
      resourceType === "image" && size > CLOUDINARY_MAX_BYTES && filePath !== null;

    const result = useChunkedUpload
      ? await uploadChunkedFile(filePath!, uploadOptions)
      : await uploadDirect(source, filePath, uploadOptions);

    return {
      url: result.secure_url as string,
      publicId: result.public_id as string,
    };
  } finally {
    if (tempFile) fs.unlinkSync(tempFile);
  }
}

function uploadDirect(
  source: Buffer | string,
  filePath: string | null,
  uploadOptions: Record<string, unknown>,
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (filePath !== null) {
      cloudinary.uploader.upload(filePath, uploadOptions, (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      });
      return;
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
      if (error) reject(error);
      else resolve(uploadResult);
    });
    stream.end(source as Buffer);
  });
}

function uploadChunkedFile(
  filePath: string,
  uploadOptions: Record<string, unknown>,
): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_chunked(
      filePath,
      {
        ...uploadOptions,
        chunk_size: CHUNKED_UPLOAD_BYTES,
      },
      (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      },
    );
  });
}

export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "raw" = "image") {
  configureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}

export function publicIdFromCloudinaryUrl(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
}
