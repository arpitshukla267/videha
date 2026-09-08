import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { Document } from "../models/Document";
import { buildDocumentDeliveryUrl, configureCloudinary } from "../lib/cloudinary";

async function main() {
  configureCloudinary();
  await mongoose.connect(process.env.MONGODB_URI!);
  const docs = await Document.find().limit(1).lean();
  const d = docs[0];
  if (!d) {
    console.log("No documents");
    return;
  }

  const signed = cloudinary.url(d.publicId, {
    resource_type: d.resourceType,
    type: "upload",
    secure: true,
    sign_url: true,
  });

  console.log("publicId:", d.publicId);
  console.log("stored:", d.url);
  console.log("built:", buildDocumentDeliveryUrl(d.publicId, d.resourceType as "image" | "raw"));
  console.log("signed:", signed);

  for (const [label, url] of [
    ["stored", d.url],
    ["built", buildDocumentDeliveryUrl(d.publicId, d.resourceType as "image" | "raw")],
    ["signed", signed],
  ] as const) {
    const r = await fetch(url);
    console.log(`${label} fetch:`, r.status);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
