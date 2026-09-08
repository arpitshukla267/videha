import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { configureCloudinary } from "../lib/cloudinary";

configureCloudinary();

async function check(id: string) {
  try {
    const r = await cloudinary.api.resource(id, { resource_type: "raw" });
    console.log("OK", id, "bytes=", r.bytes);
    console.log("  type=", r.type, "access_mode=", r.access_mode, "access_control=", JSON.stringify(r.access_control));
    console.log("  url=", r.secure_url);
    const res = await fetch(r.secure_url);
    console.log("  delivery:", res.status);
    const signed = cloudinary.utils.private_download_url(id, "pdf", {
      resource_type: "raw",
      type: "upload",
    });
    console.log("  private_download_url:", signed.slice(0, 120) + "...");
    const signedRes = await fetch(signed);
    console.log("  signed delivery:", signedRes.status, signedRes.headers.get("content-type"));
  } catch (e: unknown) {
    console.log("FAIL", id, (e as Error).message);
  }
}

async function main() {
  await check("crm/documents/lead/6a9aa8889d8821af86db914b/6a9fecdf6bb45f45f0dcddde.pdf");
  // compare website asset
  try {
    const r = await cloudinary.api.resource("website/products/black-pepper", { resource_type: "image" });
    console.log("\nwebsite asset:", r.secure_url);
    const res = await fetch(r.secure_url);
    console.log("  website delivery:", res.status);
  } catch (e) {
    console.log("website check failed", (e as Error).message);
  }
}

main();
