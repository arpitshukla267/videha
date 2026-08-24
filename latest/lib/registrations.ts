/**
 * Company registrations and export credentials actually held by Videha Overseas.
 * Replace placeholder values with confirmed numbers before publishing.
 *
 * Do NOT add ISO, HACCP, Organic, Halal, Kosher, US FDA, or similar
 * product/system certifications here unless a valid document exists.
 */
export const COMPANY_REGISTRATIONS = [
  {
    id: "iec",
    label: "IEC (Import Export Code)",
    shortLabel: "IEC",
    value: "[Add IEC number]",
  },
  {
    id: "gst",
    label: "GST Registration",
    shortLabel: "GST",
    value: "[Add GSTIN]",
  },
  {
    id: "fssai",
    label: "FSSAI License",
    shortLabel: "FSSAI",
    value: "[Add FSSAI license number]",
  },
  {
    id: "apeda-rcmc",
    label: "APEDA / RCMC",
    shortLabel: "APEDA / RCMC",
    value: "[Add APEDA Registration-cum-Membership Certificate number]",
  },
  {
    id: "cin",
    label: "CIN (Corporate Identity Number)",
    shortLabel: "CIN",
    value: "[Add CIN]",
  },
] as const;

export const REGISTRATION_DISCLAIMER =
  "We do not display product or system certifications (such as ISO, HACCP, Organic, Halal, Kosher, or US FDA registration) unless a valid, current certificate has been confirmed and supplied by Videha Overseas.";
