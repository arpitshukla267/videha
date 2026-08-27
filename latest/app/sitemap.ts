import type { MetadataRoute } from "next";
import {
  CONTACT_PRODUCT_OPTIONS,
  getProductSlug,
} from "@/lib/product-options";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.videhaoverseas.com";

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/guar-gum",
    "/our-process",
    "/products",
    "/quality",
    "/services",
    "/why-videha",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const productRoutes = CONTACT_PRODUCT_OPTIONS.map((productName) => ({
    url: `${baseUrl}/products/${getProductSlug(productName)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
