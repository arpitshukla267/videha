const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";

/** Resolve stored image/PDF paths for CMS previews. */
export function resolveMediaUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/uploads/")) return `${API}${src}`;
  if (src.startsWith("/images/") || src.startsWith("/brochure/") || src.startsWith("/logo")) {
    return `${SITE}${src}`;
  }
  return src;
}

export function isCloudinaryUrl(src: string): boolean {
  return src.includes("res.cloudinary.com");
}
