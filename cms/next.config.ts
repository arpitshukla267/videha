import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow importing the standalone quotation-builder sibling package
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "http", hostname: "localhost", port: "3005" },
    ],
  },
};

export default nextConfig;
