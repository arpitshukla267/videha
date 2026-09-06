import fs from "fs";
import path from "path";
import {
  buildPublicId,
  CLOUDINARY_MAX_BYTES,
  isCloudinaryConfigured,
  SEED_UPLOAD_BATCH_SIZE,
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

export async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item, offset) => fn(item, i + offset)));
    results.push(...batchResults);
  }

  return results;
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

  const mime = mimeForExtension(localFile);
  const publicId = buildPublicId(section, identifier, field);
  const fileSize = fs.statSync(localFile).size;
  const usesChunks = mime.startsWith("image/") && fileSize > CLOUDINARY_MAX_BYTES;

  const { url } = await uploadToCloudinary(localFile, {
    section,
    identifier,
    field,
    mime,
    originalName: path.basename(localFile),
  });

  console.log(`  ↑ ${publicId}${usesChunks ? " (chunked)" : ""}`);
  return url;
}

/** Brochure PDFs stay on the local /brochure path — not uploaded to Cloudinary. */
export async function uploadSeedPdf(
  _identifier: string,
  assetPath: string,
  _field = "file",
): Promise<string> {
  console.log(`  ↷ keeping local PDF path (${assetPath})`);
  return assetPath;
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
    `\n☁ Uploading seed media to Cloudinary (cloud: ${process.env.CLOUDINARY_CLOUD_NAME?.trim()}, batches of ${SEED_UPLOAD_BATCH_SIZE})…`,
  );
  await verifyCloudinaryCredentials();
  console.log("  ✓ Cloudinary credentials OK\n");
}
