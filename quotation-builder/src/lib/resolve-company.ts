import { COMPANY } from "../config/company";
import type { CompanyDetails, QuotationData } from "../types";

/** Company details pre-filled from config/company.ts (used as the form's initial values) */
export function createDefaultCompany(): CompanyDetails {
  return {
    name: COMPANY.brandName,
    tagline: COMPANY.tagline,
    address: COMPANY.addressLines.join("\n"),
    email: COMPANY.email,
    phone: COMPANY.phone,
    website: COMPANY.website,
    legalName: COMPANY.legalName,
    iec: COMPANY.registrations.iec,
    gst: COMPANY.registrations.gst,
    /** Empty = keep the default logo file */
    logoDataUrl: "",
  };
}

/**
 * Single source of truth for what the quotation shows as "our company".
 * - No company data yet  -> config/company.ts defaults
 * - Company data present -> exactly what the form contains
 * Use this in BOTH the preview probe and QuotationDocument so page
 * measurements always match what is rendered (and the PDF, which is
 * captured from that same DOM).
 */
export function resolveCompany(data: QuotationData) {
  const c = data.company ?? createDefaultCompany();

  return {
    name: c.name.trim(),
    tagline: c.tagline.trim(),
    addressLines: c.address
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    email: c.email.trim(),
    phone: c.phone.trim(),
    website: c.website.trim(),
    legalName: c.legalName.trim(),
    iec: c.iec.trim(),
    gst: c.gst.trim(),
    /** Empty string = caller should use its default logo */
    customLogoSrc: c.logoDataUrl || "",
  };
}
