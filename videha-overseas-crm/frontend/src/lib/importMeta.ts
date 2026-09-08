export type ImportFieldMeta = {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
};

import { safeString } from './importSafe';

export function normalizeImportFields(raw: unknown): ImportFieldMeta[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const key = safeString(row.key);
      if (!key) return null;

      return {
        key,
        label: safeString(row.label) || key,
        required: Boolean(row.required),
        aliases: Array.isArray(row.aliases) ? row.aliases.map(a => safeString(a)).filter(Boolean) : []
      };
    })
    .filter((field): field is ImportFieldMeta => field !== null);
}

export function getMissingRequiredMappings(
  fields: ImportFieldMeta[],
  mapping: Record<string, string | null>
): ImportFieldMeta[] {
  const mappedKeys = new Set(
    Object.values(mapping).filter((value): value is string => Boolean(value))
  );
  return fields.filter((field) => field.required && !mappedKeys.has(field.key));
}

export function getDuplicateMappedFieldKeys(mapping: Record<string, string | null>): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const key of Object.values(mapping)) {
    if (!key) continue;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }

  return [...duplicates];
}

export function applyMappingSelection(
  mapping: Record<string, string | null>,
  header: string,
  value: string
): Record<string, string | null> {
  const next = { ...mapping, [header]: value || null };

  if (value) {
    for (const otherHeader of Object.keys(next)) {
      if (otherHeader !== header && next[otherHeader] === value) {
        next[otherHeader] = null;
      }
    }
  }

  return next;
}
