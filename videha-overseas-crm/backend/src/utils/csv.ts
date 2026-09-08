/** RFC 4180-style CSV cell escaping. */
export function csvEscape(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return csvEscape(formatExportDate(value));
  }
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function formatExportDate(value: unknown): string {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function csvRow(values: unknown[]): string {
  return `${values.map(csvEscape).join(",")}\r\n`;
}

export function csvHeader(headers: string[]): string {
  return csvRow(headers);
}

export type ExportColumn<T extends Record<string, unknown>> = {
  header: string;
  value: (row: T) => unknown;
};

export function rowsToCsv<T extends Record<string, unknown>>(
  columns: ExportColumn<T>[],
  rows: T[],
): string {
  let output = `\uFEFF${csvHeader(columns.map((c) => c.header))}`;
  for (const row of rows) {
    output += csvRow(columns.map((c) => c.value(row)));
  }
  return output;
}

export function exportFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `videha_${prefix}_${date}.csv`;
}
