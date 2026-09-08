import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";
import path from "path";

const CRM_ROOT = process.env.CLOUDINARY_CRM_FOLDER || "crm";
const DOCUMENTS_ROOT = `${CRM_ROOT}/documents`;

export const CLOUDINARY_CRM_FOLDER = CRM_ROOT;
export const CLOUDINARY_DOCUMENTS_ROOT = DOCUMENTS_ROOT;
export const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024;

export const CRM_DOCUMENT_ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const CRM_DOCUMENT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
] as const;

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

export function slugifySegment(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

export function buildDocumentPublicId(
  entityType: string,
  entityId: string,
  documentId: string,
): string {
  return `${DOCUMENTS_ROOT}/${slugifySegment(entityType)}/${entityId}/${documentId}`;
}

export function buildDocumentAssetFolder(entityType: string, entityId: string): string {
  return `${DOCUMENTS_ROOT}/${slugifySegment(entityType)}/${entityId}`;
}

export function resourceTypeForMime(mime: string): "image" | "raw" {
  if (mime.startsWith("image/")) return "image";
  return "raw";
}

export function validateDocumentFile(mime: string, size: number, originalName: string): void {
  if (!CRM_DOCUMENT_ALLOWED_MIMES.includes(mime as (typeof CRM_DOCUMENT_ALLOWED_MIMES)[number])) {
    const ext = path.extname(originalName).toLowerCase();
    if (!CRM_DOCUMENT_ALLOWED_EXTENSIONS.includes(ext as (typeof CRM_DOCUMENT_ALLOWED_EXTENSIONS)[number])) {
      throw new Error(
        "Unsupported file type. Allowed: PDF, images (JPG/PNG/WebP/GIF), Word, and Excel files.",
      );
    }
  }
  if (size <= 0) {
    throw new Error("File is empty.");
  }
  if (size > CLOUDINARY_MAX_BYTES) {
    throw new Error(
      `File is ${(size / (1024 * 1024)).toFixed(1)} MB — maximum allowed size is 10 MB.`,
    );
  }
}

export async function uploadDocumentToCloudinary(
  buffer: Buffer,
  options: {
    entityType: string;
    entityId: string;
    documentId: string;
    mime: string;
    originalName: string;
    displayName?: string;
  },
): Promise<{ url: string; publicId: string; resourceType: "image" | "raw" }> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  configureCloudinary();
  validateDocumentFile(options.mime, buffer.length, options.originalName);

  const publicId = buildDocumentPublicId(options.entityType, options.entityId, options.documentId);
  const resourceType = resourceTypeForMime(options.mime);
  const uploadOptions: Record<string, unknown> = {
    public_id: publicId,
    asset_folder: buildDocumentAssetFolder(options.entityType, options.entityId),
    overwrite: true,
    invalidate: true,
    resource_type: resourceType,
  };

  if (options.displayName?.trim()) {
    uploadOptions.display_name = options.displayName.trim();
  }

  if (resourceType === "raw") {
    const ext = path.extname(options.originalName).replace(/^\./, "");
    if (ext) uploadOptions.format = ext;
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, uploadResult?: UploadApiResponse) => {
        if (error) reject(error);
        else resolve(uploadResult!);
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url as string,
    publicId: result.public_id as string,
    resourceType,
  };
}

function formatForPublicId(publicId: string, mime?: string): string {
  const ext = path.extname(publicId).replace(/^\./, "").toLowerCase();
  if (ext) return ext;
  if (mime === "application/pdf") return "pdf";
  if (mime?.startsWith("image/")) return mime.split("/")[1] || "jpg";
  return "";
}

/** Signed Cloudinary download URL — required for CRM raw assets on this cloud (CDN returns 401). */
export function buildDocumentSignedDownloadUrl(
  publicId: string,
  resourceType: "image" | "raw",
  options?: { attachment?: boolean; mime?: string },
): string {
  configureCloudinary();
  const format = formatForPublicId(publicId, options?.mime);
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "upload",
    ...(options?.attachment ? { attachment: true } : {}),
  });
}

/** Legacy CDN URL — kept for reference; prefer API proxy with signed download. */
export function buildDocumentDeliveryUrl(
  publicId: string,
  resourceType: "image" | "raw",
  options?: { attachment?: boolean; fileName?: string },
): string {
  configureCloudinary();
  const flags = options?.attachment ? "attachment" : undefined;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "upload",
    secure: true,
    ...(flags ? { flags } : {}),
    ...(options?.fileName && flags ? { attachment: options.fileName } : {}),
  });
}

export async function deleteDocumentFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw",
): Promise<void> {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}

export async function renameDocumentDisplayName(
  publicId: string,
  resourceType: "image" | "raw",
  displayName: string,
): Promise<void> {
  configureCloudinary();
  await cloudinary.api.update(publicId, {
    resource_type: resourceType,
    display_name: displayName,
  });
}
