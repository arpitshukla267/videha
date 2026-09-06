import { apiFetch, type ApiService } from "@/lib/api";

export type ServicePageItem = {
  num: string;
  title: string;
  tagline: string;
  copy: string;
  image: string;
  specs: string[];
};

/** Static fallback — CORE SUPPLY CAPABILITIES on /services */
export const STATIC_SERVICES_PAGE: ServicePageItem[] = [
  {
    num: "01",
    title: "BULK EXPORT SUPPLY",
    tagline: "Reliable Supply for International Buyers",
    copy: "We support international buyers with bulk supply of premium agricultural and food products, with product specifications, quantities, packaging, and supply requirements aligned to individual buyer needs.",
    image: "/images/process-process.webp",
    specs: [
      "Bulk supply options",
      "Buyer-specific product requirements",
      "Flexible packaging solutions",
    ],
  },
  {
    num: "02",
    title: "PRIVATE LABEL",
    tagline: "Your Brand. Our Product. Export Support.",
    copy: "We support private label requirements, especially for Makhana, with product selection, grade or flavour selection, packaging, branding, and export-ready supply based on buyer requirements.",
    image: "/images/product-flavoured.webp",
    specs: [
      "Private label support",
      "Retail and custom packaging",
      "Product and branding requirements",
    ],
  },
  {
    num: "03",
    title: "PRODUCT SOURCING",
    tagline: "Quality-Focused Indian Sourcing",
    copy: "We focus on reliable Indian sourcing and quality-focused procurement across our agricultural and food product range, with attention to product specifications and buyer requirements.",
    image: "/images/process-source.webp",
    specs: [
      "Reliable Indian sourcing",
      "Quality-focused procurement",
      "Buyer-specific requirements",
    ],
  },
  {
    num: "04",
    title: "QUALITY & SPECIFICATIONS",
    tagline: "Focused on Consistent Product Requirements",
    copy: "Product quality parameters, grades, specifications, and buyer requirements are considered throughout the sourcing and supply process. Final technical specifications are provided as applicable to each product.",
    image: "/images/quality-macro.webp",
    specs: [
      "Product grade and size specifications",
      "Quality parameters",
      "Buyer-specific requirements",
    ],
  },
  {
    num: "05",
    title: "EXPORT DOCUMENTATION",
    tagline: "Documentation Based on Destination Requirements",
    copy: "Documentation can be arranged as applicable to the product, destination country, and buyer requirement, supporting a smoother international trade process.",
    image: "/images/process-export.webp",
    specs: [
      "Commercial Invoice",
      "Packing List",
      "Certificate of Origin and COA",
    ],
  },
  {
    num: "06",
    title: "LOGISTICS SUPPORT",
    tagline: "Supporting the Export Process",
    copy: "We coordinate the export process and logistics requirements according to the product, destination, and agreed buyer requirements.",
    image: "/images/process-pack.webp",
    specs: [
      "Export dispatch coordination",
      "Destination-based requirements",
      "Flexible Incoterm options",
    ],
  },
];

function fallbackForIndex(index: number): ServicePageItem {
  return STATIC_SERVICES_PAGE[index] ?? STATIC_SERVICES_PAGE[0];
}

export function mapApiServicesToPageItems(data: ApiService[]): ServicePageItem[] {
  return [...data]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item, index) => {
      const fallback = fallbackForIndex(index);
      return {
        num: item.num || fallback.num,
        title: item.title || fallback.title,
        tagline: item.detail || fallback.tagline,
        copy: item.copy || fallback.copy,
        image: fallback.image,
        specs: [...fallback.specs],
      };
    });
}

/** Active services from CMS/API, merged with static images & specs. Falls back to static list. */
export async function getServicesPageContent(): Promise<ServicePageItem[]> {
  const data = await apiFetch<ApiService[]>("/api/content/services");
  if (!data || data.length === 0) return STATIC_SERVICES_PAGE;
  return mapApiServicesToPageItems(data);
}
