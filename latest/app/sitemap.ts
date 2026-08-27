import type { MetadataRoute } from "next";

const PRODUCTS = [
  "Raw / Plain Makhana",
  "Premium Makhana",
  "Jumbo Makhana",
  "Roasted Makhana",
  "Peri Peri Makhana",
  "Cream & Onion Makhana",
  "Bulk Makhana",
  "Private Label Makhana",
  "Makhana Powder",
  "Food Grade Guar Gum",
];

const getSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

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

  const productRoutes = PRODUCTS.map((productName) => ({
    url: `${baseUrl}/products/${getSlug(productName)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
