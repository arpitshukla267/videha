/**
 * Destination countries for Videha Overseas CRM.
 * Kept in sync with website target markets:
 * Middle East, North America, Europe, Southeast Asia, Oceania.
 * Also mirrored in backend/src/constants/countries.ts
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
