import {
  COMPANY_REGISTRATIONS,
  REGISTRATION_DISCLAIMER,
} from "@/lib/registrations";

export type RegistrationItem = {
  id: string;
  label: string;
  shortLabel: string;
  value: string;
};

export type ContactSettings = {
  companyName: string;
  brandName: string;
  tagline: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  addressLines: string[];
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
  };
  copyrightTagline: string;
};

export type RegistrationSettings = {
  disclaimer: string;
  items: RegistrationItem[];
};

export type BrochureSettings = {
  enabled: boolean;
  label: string;
  url: string;
  fileName: string;
};

export type SiteSettings = {
  contact: ContactSettings;
  registrations: RegistrationSettings;
  brochure: BrochureSettings;
};

export const DEFAULT_CONTACT: ContactSettings = {
  companyName: "VIDEHA OVERSEAS PRIVATE LIMITED",
  brandName: "Videha",
  tagline: "Exporter of Premium Agricultural & Food Products",
  email: "info@videhaoverseas.com",
  phone: "+919373923799",
  phoneDisplay: "+91 93739 23799",
  addressLines: [
    "Flat No. 4, B Wing, Samruddhi Enclave,",
    "Kedgaon Chufula Road, Bori Paradhi,",
    "Pune, Maharashtra – 412203",
  ],
  social: {
    facebook: "https://www.facebook.com/share/1Yta2hcPKY/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/videhaoverseas/",
    linkedin: "",
    whatsapp: "919373923799",
  },
  copyrightTagline: "Indian Origin · Global Reach",
};

export const DEFAULT_REGISTRATIONS: RegistrationSettings = {
  disclaimer: REGISTRATION_DISCLAIMER,
  items: COMPANY_REGISTRATIONS.map((r) => ({ ...r })),
};

export const DEFAULT_BROCHURE: BrochureSettings = {
  enabled: true,
  label: "Download Brochure",
  url: "/brochure/VIDEHA-OVERSEAS.pdf",
  fileName: "VIDEHA-OVERSEAS.pdf",
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: DEFAULT_CONTACT,
  registrations: DEFAULT_REGISTRATIONS,
  brochure: DEFAULT_BROCHURE,
};

export function mergeSiteSettings(
  config: Record<string, unknown> | undefined | null,
): SiteSettings {
  const contact = {
    ...DEFAULT_CONTACT,
    ...(config?.contact as Partial<ContactSettings> | undefined),
    social: {
      ...DEFAULT_CONTACT.social,
      ...((config?.contact as ContactSettings | undefined)?.social ?? {}),
    },
  };

  const regFromApi = config?.registrations as Partial<RegistrationSettings> | undefined;
  // Prefer API registrations whenever the key exists (including after CMS edits)
  const hasApiRegs = regFromApi != null && Array.isArray(regFromApi.items);
  const registrations: RegistrationSettings = {
    disclaimer: regFromApi?.disclaimer ?? DEFAULT_REGISTRATIONS.disclaimer,
    items: hasApiRegs && (regFromApi.items?.length ?? 0) > 0
      ? regFromApi.items!.map((item, i) => ({
          id: item.id || `reg-${i}`,
          label: item.label || item.shortLabel || "",
          shortLabel: item.shortLabel || item.label || "",
          value: item.value || "",
        }))
      : DEFAULT_REGISTRATIONS.items,
  };

  const brochure = {
    ...DEFAULT_BROCHURE,
    ...(config?.brochure as Partial<BrochureSettings> | undefined),
  };

  return { contact, registrations, brochure };
}

/** Resolve brochure/contact asset URLs (backend uploads vs static public paths). */
export function resolveAssetUrl(url: string, apiBase?: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) {
    const base = apiBase || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return `${base}${url}`;
  }
  return url;
}
