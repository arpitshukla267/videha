import { AppError } from "./AppError";
import { csvHeader, csvRow, type ExportColumn } from "./csv";
import type { Response } from "express";

export const CSV_EXPORT_MAX_ROWS = 10_000;
export const CSV_EXPORT_BATCH_SIZE = 500;

export async function streamCsvExport<T extends Record<string, unknown>>(options: {
  columns: ExportColumn<T>[];
  count: () => Promise<number>;
  fetchBatch: (skip: number, limit: number) => Promise<T[]>;
}): Promise<{ body: string; total: number }> {
  const total = await options.count();
  if (total === 0) {
    return {
      body: `\uFEFF${csvHeader(options.columns.map((c) => c.header))}`,
      total: 0,
    };
  }
  if (total > CSV_EXPORT_MAX_ROWS) {
    throw new AppError(
      `Export exceeds the maximum of ${CSV_EXPORT_MAX_ROWS.toLocaleString()} rows. Narrow your filters and try again.`,
      413,
      "EXPORT_TOO_LARGE",
    );
  }

  let body = `\uFEFF${csvHeader(options.columns.map((c) => c.header))}`;
  for (let skip = 0; skip < total; skip += CSV_EXPORT_BATCH_SIZE) {
    const batch = await options.fetchBatch(skip, CSV_EXPORT_BATCH_SIZE);
    for (const row of batch) {
      body += csvRow(options.columns.map((c) => c.value(row)));
    }
  }

  return { body, total };
}

export function sendCsvResponse(res: Response, filename: string, body: string): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(body);
}
