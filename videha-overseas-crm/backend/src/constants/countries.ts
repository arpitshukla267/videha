/**
 * Destination countries for Videha Overseas CRM.
 * Aligned with website target markets:
 * Middle East, North America, Europe, Southeast Asia, Oceania.
 * Edit this list to stay in sync with the public site.
 */
export const CRM_COUNTRIES = [
  // Middle East
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  // North America
  "United States",
  "Canada",
  // Europe
  "United Kingdom",
  "Germany",
  "Netherlands",
  "France",
  "Italy",
  "Spain",
  // Southeast Asia
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Vietnam",
  // Oceania
  "Australia",
  "New Zealand",
] as const;

export type CrmCountry = (typeof CRM_COUNTRIES)[number];
