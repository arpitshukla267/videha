import { PRODUCTS } from "@/lib/content";

export const GUAR_GUM_PRODUCT = "Food Grade Guar Gum" as const;

export const CONTACT_PRODUCT_OPTIONS = [
  ...PRODUCTS.map((product) => product.name),
  GUAR_GUM_PRODUCT,
];

const PRODUCT_ALIASES: Record<string, string> = {
  "mint masala": "Mint Masala Makhana",
  "peri peri": "Peri Peri Makhana",
  "cream onion": "Cream & Onion Makhana",
  "cream & onion": "Cream & Onion Makhana",
  "cream and onion": "Cream & Onion Makhana",
  "guar gum": GUAR_GUM_PRODUCT,
  "food grade guar gum": GUAR_GUM_PRODUCT,
  e412: GUAR_GUM_PRODUCT,
};

function normalizeParam(value: string) {
  return value.toLowerCase().replace(/[-_]/g, " ").trim().replace(/\s+/g, " ");
}

export function matchProductOption(param: string): string {
  const normalized = normalizeParam(param);

  if (PRODUCT_ALIASES[normalized]) {
    return PRODUCT_ALIASES[normalized];
  }

  const exact = CONTACT_PRODUCT_OPTIONS.find(
    (option) => normalizeParam(option) === normalized,
  );
  if (exact) return exact;

  const aliasKey = Object.keys(PRODUCT_ALIASES).find(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
  if (aliasKey) return PRODUCT_ALIASES[aliasKey];

  const candidates = CONTACT_PRODUCT_OPTIONS.filter((option) => {
    const label = normalizeParam(option);
    return label.includes(normalized) || normalized.includes(label);
  });

  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => b.length - a.length)[0];
  }

  return param.trim();
}

export function getProductSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
