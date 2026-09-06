import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "http", hostname: "localhost", port: "3005" },
    ],
  },
};

export default nextConfig;
