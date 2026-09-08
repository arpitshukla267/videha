/**
 * One-time organizer: move website assets under website/ and prepare crm/.
 * Uses rename (not re-upload) so bytes are not duplicated.
 *
 * Usage: npm run cloudinary:organize
 */
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "../db";
import {
  CLOUDINARY_WEBSITE_FOLDER,
  assetFolderFromPublicId,
  configureCloudinary,
} from "../lib/cloudinary";
import { Product } from "../models/Product";
import { HeroStory } from "../models/HeroStory";
import { ProcessStep, SiteConfig } from "../models/SiteContent";

const WEBSITE_ROOT = CLOUDINARY_WEBSITE_FOLDER;
const CRM_ROOT = process.env.CLOUDINARY_CRM_FOLDER || "crm";
const LEGACY_PREFIXES = ["videha-overseas", "videha"];

function configure() {
  configureCloudinary();
}

type Resource = {
  public_id: string;
  resource_type: string;
  secure_url?: string;
};

async function listAllResources(prefix: string): Promise<Resource[]> {
  const items: Resource[] = [];
  let nextCursor: string | undefined;

  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 500,
      next_cursor: nextCursor,
    });
    items.push(...(result.resources as Resource[]));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return items;
}

function targetPublicId(publicId: string): string | null {
  if (publicId.startsWith(`${WEBSITE_ROOT}/`) || publicId.startsWith(`${CRM_ROOT}/`)) {
    return null;
  }
  for (const legacy of LEGACY_PREFIXES) {
    if (publicId === legacy || publicId.startsWith(`${legacy}/`)) {
      const rest = publicId === legacy ? "" : publicId.slice(legacy.length + 1);
      return rest ? `${WEBSITE_ROOT}/${rest}` : WEBSITE_ROOT;
    }
  }
  return null;
}

function remapUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  let next = url;
  for (const legacy of LEGACY_PREFIXES) {
    next = next.replace(`/${legacy}/`, `/${WEBSITE_ROOT}/`);
  }
  return next;
}

function remapDeep(value: unknown): unknown {
  if (typeof value === "string") return remapUrl(value);
  if (Array.isArray(value)) return value.map(remapDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = remapDeep(nested);
    }
    return out;
  }
  return value;
}

async function renameResource(
  from: string,
  to: string,
  resourceType: "image" | "raw" | "video",
): Promise<void> {
  await cloudinary.uploader.rename(from, to, {
    resource_type: resourceType,
    invalidate: true,
  });
}

async function ensureCrmFolder(): Promise<void> {
  try {
    await cloudinary.api.create_folder(CRM_ROOT);
    console.log(`✓ Created Cloudinary folder: ${CRM_ROOT}/`);
  } catch (error: any) {
    const message = String(error?.message || error);
    if (message.toLowerCase().includes("already exists")) {
      console.log(`✓ Folder ${CRM_ROOT}/ already exists`);
      return;
    }
    throw error;
  }
}

async function ensureWebsiteFolder(): Promise<void> {
  try {
    await cloudinary.api.create_folder(WEBSITE_ROOT);
    console.log(`✓ Created Cloudinary folder: ${WEBSITE_ROOT}/`);
  } catch (error: any) {
    const message = String(error?.message || error);
    if (message.toLowerCase().includes("already exists")) {
      console.log(`✓ Folder ${WEBSITE_ROOT}/ already exists`);
      return;
    }
    throw error;
  }
}

async function updateMongoReferences(): Promise<number> {
  await connectDB();
  let updated = 0;

  const products = await Product.find({
    image: { $regex: "res\\.cloudinary\\.com.*/(videha|videha-overseas)/" },
  });
  for (const doc of products) {
    doc.image = remapUrl(doc.image);
    await doc.save();
    updated += 1;
  }

  const heroes = await HeroStory.find({
    $or: [
      { image: { $regex: "res\\.cloudinary\\.com.*/(videha|videha-overseas)/" } },
      { mobileImage: { $regex: "res\\.cloudinary\\.com.*/(videha|videha-overseas)/" } },
    ],
  });
  for (const doc of heroes) {
    doc.image = remapUrl(doc.image);
    if (doc.mobileImage) doc.mobileImage = remapUrl(doc.mobileImage);
    await doc.save();
    updated += 1;
  }

  const steps = await ProcessStep.find({
    image: { $regex: "res\\.cloudinary\\.com.*/(videha|videha-overseas)/" },
  });
  for (const doc of steps) {
    doc.image = remapUrl(doc.image);
    await doc.save();
    updated += 1;
  }

  const configs = await SiteConfig.find({
    value: { $regex: "res\\.cloudinary\\.com.*/(videha|videha-overseas)/" },
  });
  for (const doc of configs) {
    doc.value = remapDeep(doc.value) as typeof doc.value;
    await doc.save();
    updated += 1;
  }

  return updated;
}

async function main() {
  configure();
  await cloudinary.api.ping();
  console.log(`Organizing Cloudinary assets on cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  await ensureWebsiteFolder();
  await ensureCrmFolder();

  const seen = new Map<string, Resource>();
  for (const prefix of LEGACY_PREFIXES) {
    const batch = await listAllResources(prefix);
    for (const item of batch) {
      seen.set(item.public_id, item);
    }
  }

  const toMove = [...seen.values()]
    .map((item) => ({ item, to: targetPublicId(item.public_id) }))
    .filter((row): row is { item: Resource; to: string } => row.to !== null)
    .sort((a, b) => a.item.public_id.localeCompare(b.item.public_id));

  if (toMove.length === 0) {
    console.log("No legacy assets found under videha/ or videha-overseas/.");
  } else {
    console.log(`Renaming ${toMove.length} asset(s) into ${WEBSITE_ROOT}/ …`);
    for (const { item, to } of toMove) {
      const resourceType = (item.resource_type || "image") as "image" | "raw" | "video";
      console.log(`  ${item.public_id} → ${to}`);
      await renameResource(item.public_id, to, resourceType);
    }
  }

  const mongoUpdates = await updateMongoReferences();
  console.log(`✓ Updated ${mongoUpdates} MongoDB document(s) with new Cloudinary URLs`);

  const websiteAssets = await listAllResources(WEBSITE_ROOT);
  let folderFixes = 0;
  for (const asset of websiteAssets) {
    const targetFolder = assetFolderFromPublicId(asset.public_id);
    const resourceType = (asset.resource_type || "image") as "image" | "raw" | "video";
    await cloudinary.api.update(asset.public_id, {
      resource_type: resourceType,
      asset_folder: targetFolder,
    });
    folderFixes += 1;
  }
  if (folderFixes > 0) {
    console.log(`✓ Set asset_folder on ${folderFixes} asset(s) under ${WEBSITE_ROOT}/`);
  }

  const sample = await cloudinary.api.resources({
    type: "upload",
    prefix: `${WEBSITE_ROOT}/`,
    max_results: 3,
  });
  if (sample.resources?.length) {
    console.log("\nSample website URLs:");
    for (const row of sample.resources as Resource[]) {
      console.log(`  ${row.secure_url || row.public_id}`);
    }
  }

  console.log("\n✅ Cloudinary organization complete.");
  console.log(`   Website assets: ${WEBSITE_ROOT}/`);
  console.log(`   CRM folder ready: ${CRM_ROOT}/`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Organization failed:", err);
  process.exit(1);
});
