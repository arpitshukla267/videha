"use client";

import { forwardRef } from "react";
import { COMPANY } from "../config/company";
import type { QuotationData, QuotationTotals } from "../types";
import { formatDisplayDate, formatMoney } from "../lib/calculations";

type Props = {
  data: QuotationData;
  totals: QuotationTotals;
  /** Optional logo URL — defaults to bundled asset path relative to host */
  logoSrc?: string;
  /** Fixed A4 sizing for off-screen PDF capture */
  exportMode?: boolean;
};

export const QuotationDocument = forwardRef<HTMLDivElement, Props>(
  function QuotationDocument({ data, totals, logoSrc, exportMode }, ref) {
    const currency = data.meta.currency || COMPANY.currency;
    const linesById = new Map(totals.lines.map((l) => [l.id, l]));

    return (
      <div
        className={exportMode ? "qb-a4 qb-a4--export" : "qb-a4"}
        ref={ref}
        data-qb-paper="true"
      >
        <div className="qb-a4-inner">
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
              <div className="qb-doc-meta-row">
                <span className="qb-doc-meta-label">No.</span>
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
          </header>

          <section className="qb-doc-client">
            <div className="qb-doc-label">Client details</div>
            <h3>{data.client.companyName || "Client company name"}</h3>
            <p>
              {[
                data.client.contactPerson,
                data.client.email,
                data.client.phone,
                data.client.address,
                data.client.country,
              ]
                .filter(Boolean)
                .join("\n") || "Client contact details"}
            </p>
          </section>

          <table className="qb-doc-table">
            <thead>
              <tr>
                <th style={{ width: "28px" }}>#</th>
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
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td className="desc">{item.description || "—"}</td>
                    <td className="num">{item.quantity || 0}</td>
                    <td className="center">{item.unit || "—"}</td>
                    <td className="num">{formatMoney(item.rate || 0, currency)}</td>
                    <td className="num">
                      {item.discountPercent ? `${item.discountPercent}%` : "—"}
                    </td>
                    <td className="num">
                      {item.taxPercent ? `${item.taxPercent}%` : "—"}
                    </td>
                    <td className="num">{formatMoney(lt?.amount ?? 0, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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

          <p className="qb-doc-thanks">{COMPANY.thankYou}</p>
          <div className="qb-doc-contact-bar">
            {COMPANY.legalName} · {COMPANY.email} · {COMPANY.phone} · {COMPANY.website}
          </div>
        </div>
      </div>
    );
  },
);
