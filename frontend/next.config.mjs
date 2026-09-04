/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "**", pathname: "/uploads/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/process", destination: "/our-process", permanent: true },
      { source: "/reach", destination: "/global-reach", permanent: true },
    ]
  },
}

export default nextConfig
