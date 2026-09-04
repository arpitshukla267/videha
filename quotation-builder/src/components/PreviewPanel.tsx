"use client";

import type { QuotationData, QuotationTotals } from "../types";
import { QuotationDocument } from "./QuotationDocument";

type Props = {
  data: QuotationData;
  totals: QuotationTotals;
  logoSrc?: string;
};

export function PreviewPanel({ data, totals, logoSrc }: Props) {
  return (
    <div className="qb-preview-col">
      <div className="qb-preview-toolbar">
        <span>Live preview · A4</span>
        <span>{data.meta.quotationNumber || "Draft"}</span>
      </div>
      <div className="qb-paper-stack">
        <QuotationDocument data={data} totals={totals} logoSrc={logoSrc} />
      </div>
    </div>
  );
}
