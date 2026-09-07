import { forwardRef } from "react";
import { COMPANY } from "../config/company";
import type { QuotationData, QuotationTotals } from "../types";
import { formatDisplayDate, formatMoney } from "../lib/calculations";
import type { QuotationPagePlan } from "../lib/pagination";
import { QuotationPageFooter } from "./QuotationPageFooter";

type Props = {
  data: QuotationData;
  totals: QuotationTotals;
  logoSrc?: string;
  exportMode?: boolean;
  pagePlan?: QuotationPagePlan;
  pageNum?: number;
  totalPages?: number;
};

export const QuotationDocument = forwardRef<HTMLDivElement, Props>(
  function QuotationDocument(
    {
      data,
      totals,
      logoSrc,
      exportMode,
      pagePlan,
      pageNum = 1,
      totalPages = 1,
    },
    ref,
  ) {
    const currency = data.meta.currency || COMPANY.currency;
    const linesById = new Map(totals.lines.map((l) => [l.id, l]));
    const pageBreakSegments = new Set(pagePlan?.pageBreakAfterSegmentKeys ?? []);
    const rowSegments = pagePlan?.rowSegments ?? data.items.map((item) => ({
      itemId: item.id,
      lineStart: 0,
      lineEnd: 1,
      lineCount: 1,
      lineHeight: 16,
      showMeta: true,
    }));

    const showHeader = pagePlan ? pagePlan.showHeader : true;
    const showClient = pagePlan ? pagePlan.showClient : true;
    const showTotals = pagePlan ? pagePlan.showTotals : true;
    const showTerms = pagePlan ? pagePlan.showTerms : true;
    const showThanks = pagePlan ? pagePlan.showThanks : true;
    const showContact = pagePlan ? pagePlan.showContact : true;
    const showTable = rowSegments.length > 0;
    const tableEndsAtPageBreak = pagePlan ? pagePlan.pageBreakAfterSegmentKeys.length > 0 : false;
    const tableContinuesFromPrevPage = pagePlan
      ? pagePlan.pageIndex > 0 && rowSegments.length > 0
      : false;
    const tableClass = [
      "qb-doc-table",
      tableEndsAtPageBreak && "qb-doc-table--split-end",
      tableContinuesFromPrevPage && "qb-doc-table--split-start",
    ]
      .filter(Boolean)
      .join(" ");

    const paperClass = [
      "qb-a4",
      exportMode && "qb-a4--export",
      pagePlan && "qb-a4--fixed-page",
    ]
      .filter(Boolean)
      .join(" ");

    const innerClass = [
      "qb-a4-inner",
      pagePlan &&
        !showHeader &&
        !showClient &&
        rowSegments.length === 0 &&
        "qb-a4-inner--from-top",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={paperClass}
        ref={ref}
        data-qb-paper="true"
        data-qb-page={pagePlan ? pageNum : undefined}
      >
        <div className={innerClass}>
          <div className="qb-a4-body">
          {showHeader && (
            <header className="qb-doc-header">
              <div className="qb-doc-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="qb-doc-logo"
                  src={logoSrc || "/quotation-builder-logo.png"}
                  alt={COMPANY.brandName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
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
                    <div>
                      IEC {COMPANY.registrations.iec} · GST {COMPANY.registrations.gst}
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
                  <div className="qb-doc-meta-row">
                    <span className="qb-doc-meta-label">Valid until</span>
                    <span className="qb-doc-meta-value">{formatDisplayDate(data.meta.validUntil)}</span>
                  </div>
                  <div className="qb-doc-meta-row">
                    <span className="qb-doc-meta-label">Currency</span>
                    <span className="qb-doc-meta-value">{currency}</span>
                  </div>
                </div>
              </div>
            </header>
          )}

          {showClient && (
            <section className="qb-doc-client">
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
          )}

          {showTable && (
            <table className={tableClass}>
              <thead>
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
                {rowSegments.map((segment) => {
                  const item = data.items.find((row) => row.id === segment.itemId);
                  if (!item) return null;

                  const lt = linesById.get(item.id);
                  const itemIndex = data.items.findIndex((row) => row.id === item.id);
                  const segmentKey = `${segment.itemId}@${segment.lineEnd}`;
                  const rowClasses = [
                    pageBreakSegments.has(segmentKey) && "qb-doc-table-row--page-break",
                    !segment.showMeta && "qb-doc-table-row--continued",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const visibleLines = segment.lineEnd - segment.lineStart;
                  const clipHeight = visibleLines * segment.lineHeight;

                  return (
                    <tr key={`${segment.itemId}-${segment.lineStart}-${segment.lineEnd}`} className={rowClasses}>
                      <td>{segment.showMeta ? itemIndex + 1 : ""}</td>
                      <td className="desc">
                        <div
                          className="qb-desc-clip"
                          style={{ maxHeight: `${clipHeight}px` }}
                        >
                          <div
                            className="qb-desc-clip-inner"
                            style={{ transform: `translateY(-${segment.lineStart * segment.lineHeight}px)` }}
                          >
                            {item.description || "—"}
                          </div>
                        </div>
                      </td>
                      {segment.showMeta ? (
                        <>
                          <td className="num">{item.quantity || 0}</td>
                          <td className="center">{item.unit || "—"}</td>
                          <td className="num">{formatMoney(item.rate || 0, currency)}</td>
                          <td className="num">
                            {item.discountPercent ? `${item.discountPercent}%` : "—"}
                          </td>
                          <td className="num">{item.taxPercent ? `${item.taxPercent}%` : "—"}</td>
                          <td className="num">{formatMoney(lt?.amount ?? 0, currency)}</td>
                        </>
                      ) : (
                        <>
                          <td className="num" />
                          <td className="center" />
                          <td className="num" />
                          <td className="num" />
                          <td className="num" />
                          <td className="num" />
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {showTotals && (
            <div className="qb-doc-totals">
              <div className="qb-doc-totals-row">
                <span>Subtotal</span>
                <span>{formatMoney(totals.itemsSubtotal, currency)}</span>
              </div>
              {(totals.lineDiscounts > 0 || totals.documentDiscount > 0) && (
                <div className="qb-doc-totals-row">
                  <span>Discount</span>
                  <span>
                    −{formatMoney(totals.lineDiscounts + totals.documentDiscount, currency)}
                  </span>
                </div>
              )}
              {(totals.lineTaxes > 0 || totals.documentTax > 0) && (
                <div className="qb-doc-totals-row">
                  <span>Tax</span>
                  <span>{formatMoney(totals.lineTaxes + totals.documentTax, currency)}</span>
                </div>
              )}
              {totals.otherCharges > 0 && (
                <div className="qb-doc-totals-row">
                  <span>{data.charges.otherChargesLabel || "Other charges"}</span>
                  <span>{formatMoney(totals.otherCharges, currency)}</span>
                </div>
              )}
              <div className="qb-doc-totals-row grand">
                <span>Grand Total</span>
                <span>{formatMoney(totals.grandTotal, currency)}</span>
              </div>
            </div>
          )}

          {showTerms && (
            <div className="qb-doc-footer-blocks">
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
          )}

          {showThanks && <p className="qb-doc-thanks">{COMPANY.thankYou}</p>}
          {showContact && (
            <div className="qb-doc-contact-bar">
              {COMPANY.legalName} · {COMPANY.email} · {COMPANY.phone} · {COMPANY.website}
            </div>
          )}
          </div>

          <QuotationPageFooter
            data={data}
            pageNum={pageNum}
            totalPages={totalPages}
            logoSrc={logoSrc}
            aria-hidden={exportMode ? "true" : undefined}
          />
        </div>
      </div>
    );
  },
);
