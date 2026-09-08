/** Safe string helpers for CSV import — never throw on null/undefined. */

export function safeString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function safeLower(value: unknown): string {
  return safeString(value).toLowerCase();
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function safeRegexExact(value: unknown, flags = "i"): RegExp | null {
  const text = safeString(value);
  if (!text) return null;
  return new RegExp(`^${escapeRegex(text)}$`, flags);
}

export function normalizeImportToken(value: unknown): string {
  return safeLower(value).replace(/[^a-z0-9]+/g, "");
}

export function camelFromSnake(value: unknown): string {
  const text = safeString(value);
  if (!text) return "";
  return text
    .replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
    .replace(/^_+/, "");
}
