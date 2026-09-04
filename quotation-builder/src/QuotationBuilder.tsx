"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { QuotationData } from "./types";
import { calculateTotals, createDefaultQuotation } from "./lib/calculations";
import { downloadQuotationPdf } from "./lib/pdf";
import { FormPanel } from "./components/FormPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { QuotationDocument } from "./components/QuotationDocument";
import "./styles/quotation-builder.css";

export type QuotationBuilderProps = {
  /** Optional initial quotation state */
  initialData?: QuotationData;
  /** Logo URL for the document (place logo in host public/ or pass absolute URL) */
  logoSrc?: string;
};

/**
 * Standalone Quotation Builder root.
 * All state is local. No CMS, API, or database.
 */
export function QuotationBuilder({ initialData, logoSrc }: QuotationBuilderProps) {
  const [data, setData] = useState<QuotationData | null>(initialData ?? null);
  const [generating, setGenerating] = useState(false);
  /** Dedicated off-screen A4 sheet used only for PDF capture */
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData((prev) => prev ?? createDefaultQuotation());
  }, []);

  const totals = useMemo(
    () => (data ? calculateTotals(data.items, data.charges) : null),
    [data],
  );

  async function handleGeneratePdf() {
    if (!exportRef.current || !data || !totals) return;
    setGenerating(true);
    try {
      await downloadQuotationPdf(exportRef.current, data, totals);
    } catch (err) {
      console.error(err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (!data || !totals) {
    return (
      <div className="qb-root">
        <div className="qb-shell">
          <div className="qb-form-col">
            <div className="qb-form-header">
              <h1>Quotation Builder</h1>
              <p>Loading…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qb-root">
      <div className="qb-shell">
        <FormPanel
          data={data}
          totals={totals}
          onChange={(next) => setData(next)}
          onGeneratePdf={handleGeneratePdf}
          generating={generating}
        />
        <PreviewPanel data={data} totals={totals} logoSrc={logoSrc} />
      </div>

      {/* Fixed-size export sheet — never clipped by the preview pane */}
      <div className="qb-export-host" aria-hidden="true">
        <QuotationDocument
          ref={exportRef}
          data={data}
          totals={totals}
          logoSrc={logoSrc}
          exportMode
        />
      </div>
    </div>
  );
}

export default QuotationBuilder;
