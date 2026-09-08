/**
 * Audit Cloudinary assets by prefix and folder API.
 * Usage: npm run cloudinary:verify
 */
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true,
});

async function listByPrefix(prefix: string) {
  const items: Array<{ public_id: string; bytes: number; secure_url?: string; asset_folder?: string; folder?: string }> = [];
  let nextCursor: string | undefined;
  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 500,
      next_cursor: nextCursor,
    });
    items.push(...result.resources);
    nextCursor = result.next_cursor;
  } while (nextCursor);
  return items;
}

async function main() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  await cloudinary.api.ping();
  console.log(`Cloud: ${cloud}\n`);

  const prefixes = ["website", "videha", "videha-overseas", "crm"];
  for (const prefix of prefixes) {
    const items = await listByPrefix(prefix);
    const bytes = items.reduce((s, i) => s + (i.bytes || 0), 0);
    console.log(`=== prefix "${prefix}/" → ${items.length} asset(s), ${bytes} bytes ===`);
    for (const item of items.slice(0, 5)) {
      console.log(`  ${item.public_id} (${item.bytes}b) folder=${item.folder ?? "-"} asset_folder=${item.asset_folder ?? "-"}`);
    }
    if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
    console.log("");
  }

  try {
    const byFolder = await cloudinary.api.resources_by_asset_folder("website", { max_results: 500 });
    const folderAssets = byFolder.resources ?? [];
    console.log(`=== resources_by_asset_folder('website') → ${folderAssets.length} direct asset(s) ===`);
    for (const item of folderAssets.slice(0, 3)) {
      console.log(`  ${item.public_id} asset_folder=${item.asset_folder ?? "-"}`);
    }
    console.log("");
  } catch (e: any) {
    console.log("resources_by_asset_folder('website') error:", e.message || e);
  }

  try {
    const subfolders = await cloudinary.api.sub_folders("website");
    console.log("=== sub_folders('website') ===");
    console.log(JSON.stringify(subfolders, null, 2));
  } catch (e: any) {
    console.log("sub_folders('website') error:", e.message || e);
  }

  try {
    const root = await cloudinary.api.root_folders();
    console.log("\n=== root_folders() ===");
    console.log(JSON.stringify(root, null, 2));
  } catch (e: any) {
    console.log("root_folders error:", e.message || e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
