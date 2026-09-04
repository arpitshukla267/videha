/**
 * Local company / branding config for the Quotation Builder.
 * Edit this file when extracting the module to another project.
 * No CMS or API — values live here only.
 */

export const COMPANY = {
  legalName: "Videha Overseas Private Limited",
  brandName: "Videha Overseas",
  tagline: "Exporter of Premium Agricultural & Food Products",
  email: "info@videhaoverseas.com",
  phone: "+91 93739 23799",
  phoneTel: "+919373923799",
  website: "www.videhaoverseas.com",
  addressLines: [
    "Flat No. 4, B Wing, Samruddhi Enclave,",
    "Kedgaon Chufula Road, Bori Paradhi,",
    "Pune, Maharashtra – 412203, India",
  ],
  registrations: {
    iec: "AAMCV3205B",
    gst: "27AAMCV3205B1ZM",
  },
  currency: "USD",
  currencySymbol: "$",
  defaultPaymentTerms:
    "30% advance against Proforma Invoice; balance against copy of shipping documents / as mutually agreed.",
  defaultDeliveryTerms: "FOB / CIF / CFR — Incoterms® 2020, as confirmed on order.",
  defaultNotes:
    "Prices are subject to confirmation at the time of order. Product specifications, packaging, and documentation will be as agreed with the buyer. This quotation is valid until the date stated above unless withdrawn earlier.",
  thankYou:
    "Thank you for considering Videha Overseas. We look forward to a long-term export partnership.",
} as const;

/** CSS-friendly brand tokens used by the builder UI + document */
export const BRAND = {
  ink: "#1F2421",
  muted: "#665E52",
  line: "#E2D9CB",
  paper: "#FFFFFF",
  cream: "#F7F4EF",
  accent: "#C86D3B",
  primary: "#483226",
  surface: "#FAF8F5",
} as const;
