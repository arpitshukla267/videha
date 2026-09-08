/**
 * Assign asset_folder for website assets (dynamic folder mode).
 * Does not rename public_ids or duplicate assets.
 *
 * Usage: npm run cloudinary:fix-folders
 */
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_WEBSITE_FOLDER,
  assetFolderFromPublicId,
  configureCloudinary,
} from "../lib/cloudinary";

configureCloudinary();

type Resource = {
  public_id: string;
  resource_type: string;
  asset_folder?: string;
  secure_url?: string;
};

async function listByPrefix(prefix: string): Promise<Resource[]> {
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

async function main() {
  await cloudinary.api.ping();
  console.log(`Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`Assigning asset_folder under ${CLOUDINARY_WEBSITE_FOLDER}/ …\n`);

  const assets = await listByPrefix(CLOUDINARY_WEBSITE_FOLDER);
  let fixed = 0;
  let skipped = 0;

  for (const asset of assets) {
    const targetFolder = assetFolderFromPublicId(asset.public_id);
    const current = asset.asset_folder ?? "";

    if (current === targetFolder) {
      skipped += 1;
      continue;
    }

    const resourceType = (asset.resource_type || "image") as "image" | "raw" | "video";
    await cloudinary.api.update(asset.public_id, {
      resource_type: resourceType,
      asset_folder: targetFolder,
    });
    console.log(`  ${asset.public_id}: asset_folder "" → "${targetFolder}"`);
    fixed += 1;
  }

  const byFolder = await cloudinary.api.resources_by_asset_folder(CLOUDINARY_WEBSITE_FOLDER, {
    max_results: 500,
  });
  const directCount = byFolder.resources?.length ?? 0;

  const subfolders = await cloudinary.api.sub_folders(CLOUDINARY_WEBSITE_FOLDER);

  console.log(`\n✓ Updated ${fixed} asset(s), skipped ${skipped} already correct`);
  console.log(`✓ resources_by_asset_folder("${CLOUDINARY_WEBSITE_FOLDER}") → ${directCount} direct asset(s)`);
  console.log(`✓ sub_folders("${CLOUDINARY_WEBSITE_FOLDER}") → ${subfolders.folders?.length ?? 0} subfolder(s)`);
  if (subfolders.folders?.length) {
    for (const folder of subfolders.folders.slice(0, 10)) {
      console.log(`    ${folder.path}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
