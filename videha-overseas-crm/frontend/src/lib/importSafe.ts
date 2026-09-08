/** Safe string helpers for CSV import UI — never throw on null/undefined. */

export function safeString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function safeLower(value: unknown): string {
  return safeString(value).toLowerCase();
}

export function normalizeImportToken(value: unknown): string {
  return safeLower(value).replace(/[^a-z0-9]+/g, '');
}
