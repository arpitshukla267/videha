/**
 * Videha Overseas — API client
 *
 * All fetch calls go to the Express backend (NEXT_PUBLIC_API_URL).
 * Each function falls back to the static data in lib/content.ts if the
 * backend is unreachable or returns an error, so the frontend always
 * renders correctly even without the backend running.
 */

import {
  PRODUCTS,
  PROCESS_STEPS,
  QUALITY_POINTS,
  MARKETS,
  SERVICES,
  BUYER_EXPECTATIONS,
  INTRO_FACTS,
  ORIGIN,
} from "@/lib/content";
import {
  mergeSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiProduct = {
  _id: string;
  index: string;
  slug: string;
  name: string;
  image: string;
  copy: string;
  meta: string[];
  grade: string;
  format: string;
  application: string;
  packaging: string;
  tagline: string;
  description: string;
  origin: string;
  gradeSize: string;
  appearance: string;
  moisture: string;
  qualityParameters: { label: string; value: string }[];
  packagingOptions: string;
  moq: string;
  shelfLife: string;
  privateLabel: string;
  bulkSupply: string;
  exportMarkets: string;
  sampleAvailability: string;
  processingSteps: string[];
  isActive: boolean;
  order: number;
};

export type ApiHeroStory = {
  _id: string;
  id: string;
  number: string;
  label: string;
  heading: [string, string];
  description: string;
  image: string;
  mobileImage?: string;
  alt: string;
  ctaLabel?: string;
  ctaHref?: string;
  isActive: boolean;
  order: number;
};

export type ApiProcessStep = {
  _id: string;
  num: string;
  label: string;
  heading: string;
  copy: string;
  image: string;
  order: number;
};

export type ApiQualityPoint = {
  _id: string;
  title: string;
  copy: string;
  order: number;
};

export type ApiMarket = {
  _id: string;
  marketId: string;
  name: string;
  x: number;
  y: number;
  info: string;
  order: number;
};

export type ApiService = {
  _id: string;
  num: string;
  title: string;
  copy: string;
  detail: string;
  order: number;
};

export type ApiBuyerExpectation = {
  _id: string;
  title: string;
  copy: string;
  order: number;
};

export type ApiIntroFact = {
  _id: string;
  value: string;
  label: string;
  order: number;
};

export type BulkContent = {
  processSteps: ApiProcessStep[];
  qualityPoints: ApiQualityPoint[];
  markets: ApiMarket[];
  services: ApiService[];
  buyerExpectations: ApiBuyerExpectation[];
  introFacts: ApiIntroFact[];
  config: Record<string, unknown>;
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as T) : null;
  } catch {
    return null;
  }
}

/** Resolve CMS upload paths to the backend host; leave static /images as-is. */
export function mediaUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/uploads/")) return `${API_URL}${src}`;
  return src;
}

// ─── Products ─────────────────────────────────────────────────────────────────

/** Returns all active products. Falls back to static PRODUCTS. */
export async function getProducts(): Promise<ApiProduct[]> {
  const data = await apiFetch<ApiProduct[]>("/api/products");
  if (data && data.length > 0) {
    return data.map((p) => ({ ...p, image: mediaUrl(p.image) }));
  }

  // Fallback: map static data to ApiProduct shape
  return PRODUCTS.map((p, i) => ({
    _id: `static-${i}`,
    index: p.index,
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: p.name,
    image: p.image,
    copy: p.copy,
    meta: [...p.meta],
    grade: p.grade,
    format: p.format,
    application: p.application,
    packaging: p.packaging,
    tagline: "",
    description: "",
    origin: "",
    gradeSize: p.grade,
    appearance: "",
    moisture: "",
    qualityParameters: [],
    packagingOptions: p.packaging,
    moq: "",
    shelfLife: "",
    privateLabel: "",
    bulkSupply: "",
    exportMarkets: "",
    sampleAvailability: "",
    processingSteps: [],
    isActive: true,
    order: i + 1,
  }));
}

/** Returns a single product by slug. Falls back to null (caller shows 404). */
export async function getProductBySlug(slug: string): Promise<ApiProduct | null> {
  const product = await apiFetch<ApiProduct>(`/api/products/${slug}`);
  if (!product) return null;
  return { ...product, image: mediaUrl(product.image) };
}

// ─── Hero Stories ─────────────────────────────────────────────────────────────

/** Returns active hero stories. Empty array means the hero should use its static fallback. */
export async function getHeroStories(): Promise<ApiHeroStory[]> {
  const data = await apiFetch<ApiHeroStory[]>("/api/hero");
  if (!data || data.length === 0) return [];
  return data.map((story) => {
    const heading = Array.isArray(story.heading)
      ? ([story.heading[0] || "", story.heading[1] || ""] as [string, string])
      : ([String(story.heading || ""), ""] as [string, string]);
    return {
      ...story,
      heading,
      image: mediaUrl(story.image),
      mobileImage: story.mobileImage ? mediaUrl(story.mobileImage) : story.mobileImage,
    };
  });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const config = await apiFetch<Record<string, unknown>>("/api/content/config");
  return mergeSiteSettings(config);
}

// ─── Bulk content (all site content at once) ─────────────────────────────────

export async function getBulkContent(): Promise<BulkContent> {
  const data = await apiFetch<BulkContent>("/api/content/bulk/all");

  if (data) {
    return {
      ...data,
      processSteps: data.processSteps.map((s) => ({ ...s, image: mediaUrl(s.image) })),
    };
  }

  // Fallback: static data
  return {
    processSteps: PROCESS_STEPS.map((s, i) => ({ _id: `static-${i}`, ...s, order: i + 1 })),
    qualityPoints: QUALITY_POINTS.map((q, i) => ({ _id: `static-${i}`, ...q, order: i + 1 })),
    markets: MARKETS.map((m, i) => ({
      _id: `static-${i}`,
      marketId: m.id,
      name: m.name,
      x: m.x,
      y: m.y,
      info: m.info,
      order: i + 1,
    })),
    services: SERVICES.map((s, i) => ({ _id: `static-${i}`, ...s, order: i + 1 })),
    buyerExpectations: BUYER_EXPECTATIONS.map((b, i) => ({ _id: `static-${i}`, ...b, order: i + 1 })),
    introFacts: INTRO_FACTS.map((f, i) => ({ _id: `static-${i}`, ...f, order: i + 1 })),
    config: { origin: ORIGIN },
  };
}
