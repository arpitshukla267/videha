import fs from "fs";
import path from "path";
import {
  buildPublicId,
  CLOUDINARY_MAX_BYTES,
  isCloudinaryConfigured,
  uploadToCloudinary,
  verifyCloudinaryCredentials,
} from "./cloudinary";

const FRONTEND_PUBLIC = path.resolve(__dirname, "../../../frontend/public");

function mimeForExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
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

function resolveLocalAsset(assetPath: string): string | null {
  if (!assetPath || assetPath.startsWith("http")) return null;

  const relative = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  const absolute = path.join(FRONTEND_PUBLIC, relative);

  if (fs.existsSync(absolute)) return absolute;

  const parsed = path.parse(absolute);
  const alternates = [".webp", ".jpeg", ".jpg", ".png"].filter(
    (ext) => ext !== parsed.ext.toLowerCase(),
  );

  for (const ext of alternates) {
    const candidate = path.join(parsed.dir, `${parsed.name}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

export async function uploadSeedMedia(
  section: string,
  identifier: string,
  field: string,
  assetPath: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    return assetPath;
  }

  const localFile = resolveLocalAsset(assetPath);
  if (!localFile) {
    console.warn(`  ⚠ Local file not found for ${assetPath} — keeping path as-is`);
    return assetPath;
  }

  const fileSize = fs.statSync(localFile).size;
  if (fileSize > CLOUDINARY_MAX_BYTES) {
    console.warn(
      `  ⚠ ${path.basename(localFile)} (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds Cloudinary 10 MB limit — keeping local path`,
    );
    return assetPath;
  }

  const mime = mimeForExtension(localFile);
  const publicId = buildPublicId(section, identifier, field);

  const { url } = await uploadToCloudinary(localFile, {
    section,
    identifier,
    field,
    mime,
    originalName: path.basename(localFile),
  });

  console.log(`  ↑ ${publicId}`);
  return url;
}

export async function uploadSeedPdf(
  identifier: string,
  assetPath: string,
  field = "file",
): Promise<string> {
  return uploadSeedMedia("assets", identifier, field, assetPath);
}

export async function assertCloudinaryForSeed(): Promise<void> {
  if (!isCloudinaryConfigured()) {
    console.warn(
      "\n⚠ Cloudinary is not fully configured (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET).\n" +
        "  Seed will keep local /images paths instead of uploading.\n",
    );
    return;
  }

  console.log(
    `\n☁ Uploading seed media to Cloudinary (cloud: ${process.env.CLOUDINARY_CLOUD_NAME?.trim()})…`,
  );
  await verifyCloudinaryCredentials();
  console.log("  ✓ Cloudinary credentials OK\n");
}
