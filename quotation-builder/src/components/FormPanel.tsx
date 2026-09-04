"use client";

import type { QuotationData, LineItem } from "../types";
import { createEmptyLine, formatMoney } from "../lib/calculations";
import type { QuotationTotals } from "../types";

type Props = {
  data: QuotationData;
  totals: QuotationTotals;
  onChange: (next: QuotationData) => void;
  onGeneratePdf: () => void;
  generating: boolean;
};

const UNITS = ["MT", "KG", "Bag", "Carton", "Container", "PCS", "Lot"];

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export function FormPanel({ data, totals, onChange, onGeneratePdf, generating }: Props) {
  function patchMeta<K extends keyof QuotationData["meta"]>(key: K, value: QuotationData["meta"][K]) {
    onChange({ ...data, meta: { ...data.meta, [key]: value } });
  }

  function patchClient<K extends keyof QuotationData["client"]>(
    key: K,
    value: QuotationData["client"][K],
  ) {
    onChange({ ...data, client: { ...data.client, [key]: value } });
  }

  function patchCharges<K extends keyof QuotationData["charges"]>(
    key: K,
    value: QuotationData["charges"][K],
  ) {
    onChange({ ...data, charges: { ...data.charges, [key]: value } });
  }

  function patchTerms<K extends keyof QuotationData["terms"]>(
    key: K,
    value: QuotationData["terms"][K],
  ) {
    onChange({ ...data, terms: { ...data.terms, [key]: value } });
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    onChange({
      ...data,
      items: data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function removeItem(id: string) {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((item) => item.id !== id) });
  }

  function addItem() {
    onChange({ ...data, items: [...data.items, createEmptyLine()] });
  }

  return (
    <div className="qb-form-col">
      <div className="qb-form-header">
        <h1>Quotation Builder</h1>
        <p>Create an export quotation, preview live on the right, then download as PDF.</p>
      </div>

      <section className="qb-section">
        <h2 className="qb-section-title">Quotation details</h2>
        <div className="qb-grid-2">
          <div className="qb-field">
            <label>Quotation no.</label>
            <input
              value={data.meta.quotationNumber}
              onChange={(e) => patchMeta("quotationNumber", e.target.value)}
            />
          </div>
          <div className="qb-field">
            <label>Currency</label>
            <select
              value={data.meta.currency}
              onChange={(e) => patchMeta("currency", e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
              <option value="AED">AED</option>
            </select>
          </div>
          <div className="qb-field">
            <label>Date</label>
            <input
              type="date"
              value={data.meta.date}
              onChange={(e) => patchMeta("date", e.target.value)}
            />
          </div>
          <div className="qb-field">
            <label>Valid until</label>
            <input
              type="date"
              value={data.meta.validUntil}
              onChange={(e) => patchMeta("validUntil", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="qb-section">
        <h2 className="qb-section-title">Client details</h2>
        <div className="qb-field">
          <label>Company / Client name</label>
          <input
            value={data.client.companyName}
            onChange={(e) => patchClient("companyName", e.target.value)}
            placeholder="Buyer company name"
          />
        </div>
        <div className="qb-grid-2">
          <div className="qb-field">
            <label>Contact person</label>
            <input
              value={data.client.contactPerson}
              onChange={(e) => patchClient("contactPerson", e.target.value)}
            />
          </div>
          <div className="qb-field">
            <label>Country</label>
            <input
              value={data.client.country}
              onChange={(e) => patchClient("country", e.target.value)}
              placeholder="Destination country"
            />
          </div>
          <div className="qb-field">
            <label>Email</label>
            <input
              type="email"
              value={data.client.email}
              onChange={(e) => patchClient("email", e.target.value)}
            />
          </div>
          <div className="qb-field">
            <label>Phone</label>
            <input
              value={data.client.phone}
              onChange={(e) => patchClient("phone", e.target.value)}
            />
          </div>
        </div>
        <div className="qb-field">
          <label>Address</label>
          <textarea
            value={data.client.address}
            onChange={(e) => patchClient("address", e.target.value)}
            rows={3}
          />
        </div>
      </section>

      <section className="qb-section">
        <h2 className="qb-section-title">Products / Items</h2>
        {data.items.map((item, idx) => (
          <div className="qb-line-card" key={item.id}>
            <div className="qb-line-top">
              <span>ITEM {String(idx + 1).padStart(2, "0")}</span>
              <button
                type="button"
                className="qb-icon-btn"
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                disabled={data.items.length <= 1}
              >
                <IconTrash />
              </button>
            </div>
            <div className="qb-field">
              <label>Product / Description</label>
              <input
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="e.g. Premium Makhana — Export Grade"
              />
            </div>
            <div className="qb-grid-3">
              <div className="qb-field">
                <label>Qty</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                />
              </div>
              <div className="qb-field">
                <label>Unit</label>
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="qb-field">
                <label>Rate</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                />
              </div>
              <div className="qb-field">
                <label>Discount %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={item.discountPercent}
                  onChange={(e) =>
                    updateItem(item.id, { discountPercent: Number(e.target.value) })
                  }
                />
              </div>
              <div className="qb-field">
                <label>Tax %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={item.taxPercent}
                  onChange={(e) => updateItem(item.id, { taxPercent: Number(e.target.value) })}
                />
              </div>
              <div className="qb-field">
                <label>Line amount</label>
                <input
                  readOnly
                  value={formatMoney(
                    totals.lines.find((l) => l.id === item.id)?.amount ?? 0,
                    data.meta.currency,
                  )}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="qb-btn-row">
          <button type="button" className="qb-btn qb-btn-ghost" onClick={addItem}>
            <IconPlus /> Add item
          </button>
        </div>
      </section>

      <section className="qb-section">
        <h2 className="qb-section-title">Discount / Tax / Charges</h2>
        <div className="qb-grid-2">
          <div className="qb-field">
            <label>Document discount (amount)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={data.charges.discountAmount}
              onChange={(e) => patchCharges("discountAmount", Number(e.target.value))}
            />
          </div>
          <div className="qb-field">
            <label>Additional tax %</label>
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={data.charges.documentTaxPercent}
              onChange={(e) => patchCharges("documentTaxPercent", Number(e.target.value))}
            />
          </div>
          <div className="qb-field">
            <label>Other charges label</label>
            <input
              value={data.charges.otherChargesLabel}
              onChange={(e) => patchCharges("otherChargesLabel", e.target.value)}
            />
          </div>
          <div className="qb-field">
            <label>Other charges amount</label>
            <input
              type="number"
              min={0}
              step="any"
              value={data.charges.otherChargesAmount}
              onChange={(e) => patchCharges("otherChargesAmount", Number(e.target.value))}
            />
          </div>
        </div>
        <p className="qb-hint">
          Grand total: <strong>{formatMoney(totals.grandTotal, data.meta.currency)}</strong>
        </p>
      </section>

      <section className="qb-section">
        <h2 className="qb-section-title">Payment &amp; delivery</h2>
        <div className="qb-field">
          <label>Payment terms</label>
          <textarea
            value={data.terms.paymentTerms}
            onChange={(e) => patchTerms("paymentTerms", e.target.value)}
            rows={3}
          />
        </div>
        <div className="qb-field">
          <label>Delivery terms</label>
          <textarea
            value={data.terms.deliveryTerms}
            onChange={(e) => patchTerms("deliveryTerms", e.target.value)}
            rows={2}
          />
        </div>
      </section>

      <section className="qb-section">
        <h2 className="qb-section-title">Notes</h2>
        <div className="qb-field">
          <label>Notes / Terms &amp; Conditions</label>
          <textarea
            value={data.terms.notes}
            onChange={(e) => patchTerms("notes", e.target.value)}
            rows={4}
          />
        </div>
      </section>

      <button
        type="button"
        className="qb-btn qb-btn-primary"
        onClick={onGeneratePdf}
        disabled={generating}
      >
        {generating ? "Generating PDF…" : "Generate PDF"}
      </button>
      <p className="qb-hint">PDF is generated entirely in your browser. Nothing is uploaded.</p>
    </div>
  );
}
