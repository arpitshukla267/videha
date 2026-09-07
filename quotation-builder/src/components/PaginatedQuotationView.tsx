import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react";
import { COMPANY } from "../config/company";
import type { QuotationData, QuotationTotals } from "../types";
import { formatDisplayDate, formatMoney } from "../lib/calculations";
import { paginateQuotation, type QuotationMeasuredHeights } from "../lib/pagination";
import { measureRowMeta } from "../lib/row-segments";
import { QuotationDocument } from "./QuotationDocument";

type Props = {
  data: QuotationData;
  totals: QuotationTotals;
  logoSrc?: string;
  exportMode?: boolean;
};

const defaultHeights: QuotationMeasuredHeights = {
  header: 180,
  client: 80,
  thead: 36,
  rows: {},
  rowMeta: {},
  totals: 120,
  terms: 60,
  thanks: 40,
  contact: 36,
  pageFooter: 100,
};

function measureBlock(el: Element | null | undefined): number {
  if (!el) return 0;
  return Math.ceil(el.getBoundingClientRect().height);
}

const PaginationProbe = forwardRef<
  HTMLDivElement,
  { data: QuotationData; totals: QuotationTotals; logoSrc?: string }
>(function PaginationProbe({ data, totals, logoSrc }, ref) {
  const currency = data.meta.currency || COMPANY.currency;
  const linesById = new Map(totals.lines.map((l) => [l.id, l]));

  return (
    <div ref={ref} className="qb-pagination-probe" aria-hidden="true">
      <div className="qb-a4 qb-a4--probe">
        <div className="qb-a4-inner">
          <header className="qb-doc-header" data-qb-block="header">
            <div className="qb-doc-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="qb-doc-logo"
                src={logoSrc || "/quotation-builder-logo.png"}
                alt=""
              />
              <div className="qb-doc-brand-text">
                <strong>{COMPANY.brandName}</strong>
                <em>{COMPANY.tagline}</em>
                <div className="qb-doc-company-meta">
                  {COMPANY.addressLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                  <div>
                    {COMPANY.email} · {COMPANY.phone}
                  </div>
                </div>
              </div>
            </div>
            <div className="qb-doc-meta-block">
              <div className="qb-doc-meta-title">Quotation</div>
              <div className="qb-doc-meta-rows">
                <div className="qb-doc-meta-row">
                  <span className="qb-doc-meta-label">Quotation No.</span>
                  <span className="qb-doc-meta-value">{data.meta.quotationNumber || "—"}</span>
                </div>
                <div className="qb-doc-meta-row">
                  <span className="qb-doc-meta-label">Date</span>
                  <span className="qb-doc-meta-value">{formatDisplayDate(data.meta.date)}</span>
                </div>
              </div>
            </div>
          </header>

          <section className="qb-doc-client" data-qb-block="client">
            <div className="qb-doc-label">Client details</div>
            <h3>Company Name: {data.client.companyName || ""}</h3>
            <p>
              {[
                `Contact Person: ${data.client.contactPerson}`,
                `Email: ${data.client.email}`,
                `Phone: ${data.client.phone}`,
                `Address: ${data.client.address}`,
                `Country: ${data.client.country}`,
              ]
                .filter(Boolean)
                .join("\n") || "Client contact details"}
            </p>
          </section>

          <table className="qb-doc-table">
            <thead data-qb-block="thead">
              <tr>
                <th style={{ width: "58px" }}>S No.</th>
                <th>Product / Description</th>
                <th className="num">Qty</th>
                <th className="center">Unit</th>
                <th className="num">Rate</th>
                <th className="num">Disc.</th>
                <th className="num">Tax</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => {
                const lt = linesById.get(item.id);
                return (
                  <tr key={item.id} data-qb-row-id={item.id}>
                    <td>{idx + 1}</td>
                    <td className="desc">{item.description || "—"}</td>
                    <td className="num">{item.quantity || 0}</td>
                    <td className="center">{item.unit || "—"}</td>
                    <td className="num">{formatMoney(item.rate || 0, currency)}</td>
                    <td className="num">
                      {item.discountPercent ? `${item.discountPercent}%` : "—"}
                    </td>
                    <td className="num">{item.taxPercent ? `${item.taxPercent}%` : "—"}</td>
                    <td className="num">{formatMoney(lt?.amount ?? 0, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="qb-doc-totals" data-qb-block="totals">
            <div className="qb-doc-totals-row">
              <span>Subtotal</span>
              <span>{formatMoney(totals.itemsSubtotal, currency)}</span>
            </div>
            <div className="qb-doc-totals-row grand">
              <span>Grand Total</span>
              <span>{formatMoney(totals.grandTotal, currency)}</span>
            </div>
          </div>

          <div className="qb-doc-footer-blocks" data-qb-block="terms">
            {data.terms.paymentTerms && (
              <div className="qb-doc-block">
                <h4>Payment terms</h4>
                <p>{data.terms.paymentTerms}</p>
              </div>
            )}
            {data.terms.deliveryTerms && (
              <div className="qb-doc-block">
                <h4>Delivery terms</h4>
                <p>{data.terms.deliveryTerms}</p>
              </div>
            )}
            {data.terms.notes && (
              <div className="qb-doc-block">
                <h4>Notes / Terms &amp; Conditions</h4>
                <p>{data.terms.notes}</p>
              </div>
            )}
          </div>

          <p className="qb-doc-thanks" data-qb-block="thanks">
            {COMPANY.thankYou}
          </p>
          <div className="qb-doc-contact-bar" data-qb-block="contact">
            {COMPANY.legalName} · {COMPANY.email} · {COMPANY.phone} · {COMPANY.website}
          </div>

          <footer className="qb-doc-page-footer" data-qb-block="page-footer">
            <div className="qb-doc-page-footer-line" />
            <div className="qb-doc-page-footer-grid">
              <div className="qb-doc-page-footer-left">
                <span>Page 1 of 1</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="qb-doc-footer-logo" src={logoSrc || "/logo.png"} alt="" />
              </div>
              <div className="qb-doc-page-footer-right">
                <span>Quotation No: {data.meta.quotationNumber || "—"}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
});

export const PaginatedQuotationView = forwardRef<HTMLDivElement, Props>(
  function PaginatedQuotationView({ data, totals, logoSrc, exportMode }, ref) {
    const probeRef = useRef<HTMLDivElement>(null);
    const [heights, setHeights] = useState<QuotationMeasuredHeights>(defaultHeights);

    useLayoutEffect(() => {
      const root = probeRef.current;
      if (!root) return;

      const measure = () => {
        const rows: Record<string, number> = {};
        const rowMeta: QuotationMeasuredHeights["rowMeta"] = {};
        root.querySelectorAll<HTMLTableRowElement>("tr[data-qb-row-id]").forEach((row) => {
          const id = row.dataset.qbRowId;
          if (!id) return;
          rows[id] = measureBlock(row);
          rowMeta[id] = measureRowMeta(row);
        });

        setHeights({
          header: measureBlock(root.querySelector("[data-qb-block='header']")),
          client: measureBlock(root.querySelector("[data-qb-block='client']")),
          thead: measureBlock(root.querySelector("[data-qb-block='thead']")),
          rows,
          rowMeta,
          totals: measureBlock(root.querySelector("[data-qb-block='totals']")),
          terms: measureBlock(root.querySelector("[data-qb-block='terms']")),
          thanks: measureBlock(root.querySelector("[data-qb-block='thanks']")),
          contact: measureBlock(root.querySelector("[data-qb-block='contact']")),
          pageFooter: measureBlock(root.querySelector("[data-qb-block='page-footer']")),
        });
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(root);
      return () => observer.disconnect();
    }, [data, totals, logoSrc]);

    const pages = useMemo(
      () =>
        paginateQuotation(
          data.items.map((item) => item.id),
          heights,
          {
            hasTerms: Boolean(
              data.terms.paymentTerms || data.terms.deliveryTerms || data.terms.notes,
            ),
            hasThanks: Boolean(COMPANY.thankYou),
            hasContact: true,
          },
        ),
      [data.items, data.terms, heights],
    );

    const totalPages = pages.length;

    return (
      <>
        <PaginationProbe ref={probeRef} data={data} totals={totals} logoSrc={logoSrc} />
        <div ref={ref} className="qb-paginated-root">
          {pages.map((pagePlan, index) => (
            <QuotationDocument
              key={pagePlan.pageIndex}
              data={data}
              totals={totals}
              logoSrc={logoSrc}
              exportMode={exportMode}
              pagePlan={pagePlan}
              pageNum={index + 1}
              totalPages={totalPages}
            />
          ))}
        </div>
      </>
    );
  },
);
