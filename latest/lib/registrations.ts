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
    value: "AAMCV3205B",
  },
  {
    id: "gst",
    label: "GST Registration",
    shortLabel: "GST",
    value: "27AAMCV3205B1ZM",
  },
  {
    id: "fssai",
    label: "FSSAI License",
    shortLabel: "FSSAI",
    value: "11526996000869",
  },
  {
    id: "apeda-rcmc",
    label: "APEDA / RCMC",
    shortLabel: "APEDA / RCMC",
    value: "RCMC/APEDA/33029/2026-2027",
  },
  // {
  //   id: "cin",
  //   label: "CIN (Corporate Identity Number)",
  //   shortLabel: "CIN",
  //   value: "[Add CIN]",
  // },
] as const;

export const REGISTRATION_DISCLAIMER =
  "We do not display product or system certifications (such as ISO, HACCP, Organic, Halal, Kosher, or US FDA registration) unless a valid, current certificate has been confirmed and supplied by Videha Overseas.";
