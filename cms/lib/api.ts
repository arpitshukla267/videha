const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function req<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "API error");
  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type QualityParam = { label: string; value: string };

export type Product = {
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
  qualityParameters: QualityParam[];
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

export type HeroStory = {
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

export type ProcessStep = {
  _id: string;
  num: string;
  label: string;
  heading: string;
  copy: string;
  image: string;
  isActive: boolean;
  order: number;
};

export type QualityPoint = {
  _id: string;
  title: string;
  copy: string;
  isActive: boolean;
  order: number;
};

export type Market = {
  _id: string;
  marketId: string;
  name: string;
  x: number;
  y: number;
  info: string;
  isActive: boolean;
  order: number;
};

export type Service = {
  _id: string;
  num: string;
  title: string;
  copy: string;
  detail: string;
  isActive: boolean;
  order: number;
};

export type BuyerExpectation = {
  _id: string;
  title: string;
  copy: string;
  isActive: boolean;
  order: number;
};

export type IntroFact = {
  _id: string;
  value: string;
  label: string;
  isActive: boolean;
  order: number;
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: () => req<Product[]>("/api/products/all"),
  get: (slug: string) => req<Product>(`/api/products/${slug}`),
  create: (data: Partial<Product>) =>
    req<Product>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>) =>
    req<Product>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggle: (id: string) =>
    req<Product>(`/api/products/${id}/toggle`, { method: "PATCH" }),
  delete: (id: string) =>
    req<{ message: string }>(`/api/products/${id}`, { method: "DELETE" }),
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
export const heroApi = {
  list: () => req<HeroStory[]>("/api/hero/all"),
  create: (data: Partial<HeroStory>) =>
    req<HeroStory>("/api/hero", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<HeroStory>) =>
    req<HeroStory>(`/api/hero/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggle: (id: string) =>
    req<HeroStory>(`/api/hero/${id}/toggle`, { method: "PATCH" }),
  delete: (id: string) =>
    req<{ message: string }>(`/api/hero/${id}`, { method: "DELETE" }),
};

// ─── Content helpers (process-steps, quality-points, etc.) ───────────────────
function contentApi<T>(segment: string) {
  return {
    list: () => req<T[]>(`/api/content/${segment}/all`),
    create: (data: Partial<T>) =>
      req<T>(`/api/content/${segment}`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<T>) =>
      req<T>(`/api/content/${segment}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    toggle: (id: string) =>
      req<T>(`/api/content/${segment}/${id}/toggle`, { method: "PATCH" }),
    delete: (id: string) =>
      req<{ message: string }>(`/api/content/${segment}/${id}`, { method: "DELETE" }),
  };
}

export const processStepsApi = contentApi<ProcessStep>("process-steps");
export const qualityPointsApi = contentApi<QualityPoint>("quality-points");
export const marketsApi = contentApi<Market>("markets");
export const servicesApi = contentApi<Service>("services");
export const buyerExpectationsApi = contentApi<BuyerExpectation>("buyer-expectations");
export const introFactsApi = contentApi<IntroFact>("intro-facts");

// ─── Site settings (config keys) ─────────────────────────────────────────────
export const siteSettingsApi = {
  getAll: () => req<Record<string, unknown>>("/api/content/config"),
  update: (key: string, value: unknown) =>
    req<{ key: string; value: unknown }>(`/api/content/config/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API}/api/upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Upload failed");
  return json.url as string;
}

/** @deprecated use uploadFile */
export const uploadImage = uploadFile;

// ─── Health ───────────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
