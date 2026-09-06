"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cloudinary_1 = require("../lib/cloudinary");
async function main() {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        console.error("Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET in backend/.env");
        process.exit(1);
    }
    console.log(`Testing Cloudinary (cloud: ${process.env.CLOUDINARY_CLOUD_NAME?.trim()})…`);
    await (0, cloudinary_1.verifyCloudinaryCredentials)();
    console.log("Cloudinary credentials are valid.");
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
