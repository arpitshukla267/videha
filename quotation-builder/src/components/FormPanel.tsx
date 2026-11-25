import type { ChangeEvent } from "react";
import type { QuotationData, LineItem, CompanyDetails } from "../types";
import { COMPANY } from "../config/company";
import { createDefaultCompany } from "../lib/resolve-company";
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
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export function FormPanel({
  data,
  totals,
  onChange,
  onGeneratePdf,
  generating,
}: Props) {
  function patchMeta<K extends keyof QuotationData["meta"]>(
    key: K,
    value: QuotationData["meta"][K],
  ) {
    onChange({ ...data, meta: { ...data.meta, [key]: value } });
  }

  // Form starts pre-filled with the defaults from config/company.ts
  const company: CompanyDetails = data.company ?? createDefaultCompany();

  function patchCompany<K extends keyof CompanyDetails>(
    key: K,
    value: CompanyDetails[K],
  ) {
    onChange({ ...data, company: { ...company, [key]: value } });
  }

  function handleLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patchCompany("logoDataUrl", String(reader.result));
    reader.readAsDataURL(file);
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
      items: data.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
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
        <p>
          Create an export quotation, preview live on the right, then download
          as PDF.
        </p>
      </div>

      <section className="qb-section">
        <h2 className="qb-section-title">Company details</h2>
        <div className="qb-btn-row">
          <button
            type="button"
            className="qb-btn qb-btn-ghost"
            onClick={() =>
              onChange({ ...data, company: createDefaultCompany() })
            }
          >
            Reset company details
          </button>
        </div>

        <div className="qb-field">
          <label>Logo</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.logoDataUrl || "/quotation-builder-logo.png"}
              alt="Company logo"
              style={{
                height: 56,
                maxWidth: 160,
                objectFit: "contain",
                border: "1px solid #d4c8b6",
                borderRadius: 6,
                padding: 4,
                background: "#fff",
              }}
            />
            <label
              className="qb-btn qb-btn-ghost"
              style={{ cursor: "pointer" }}
            >
              Change logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFile}
                style={{ display: "none" }}
              />
            </label>
            {company.logoDataUrl && (
              <button
                type="button"
                className="qb-btn qb-btn-ghost"
                onClick={() => patchCompany("logoDataUrl", "")}
              >
                Reset to default
              </button>
            )}
          </div>
        </div>

        <div className="qb-field">
          <label>Company name</label>
          <input
            value={company.name}
            onChange={(e) => patchCompany("name", e.target.value)}
            placeholder={COMPANY.brandName}
          />
        </div>
        <div className="qb-field">
          <label>Tagline</label>
          <input
            value={company.tagline}
            onChange={(e) => patchCompany("tagline", e.target.value)}
            placeholder={COMPANY.tagline}
          />
        </div>
        <div className="qb-field">
          <label>Address (one line per row)</label>
          <textarea
            rows={4}
            value={company.address}
            onChange={(e) => patchCompany("address", e.target.value)}
            placeholder={COMPANY.addressLines.join("\n")}
          />
        </div>
        <div className="qb-grid-2">
          <div className="qb-field">
            <label>Email</label>
            <input
              type="email"
              value={company.email}
              onChange={(e) => patchCompany("email", e.target.value)}
              placeholder={COMPANY.email}
            />
          </div>
          <div className="qb-field">
            <label>Phone</label>
            <input
              value={company.phone}
              onChange={(e) => patchCompany("phone", e.target.value)}
              placeholder={COMPANY.phone}
            />
          </div>
          <div className="qb-field">
            <label>Website</label>
            <input
              value={company.website}
              onChange={(e) => patchCompany("website", e.target.value)}
              placeholder={COMPANY.website}
            />
          </div>
          <div className="qb-field">
            <label>Legal name (contact bar)</label>
            <input
              value={company.legalName}
              onChange={(e) => patchCompany("legalName", e.target.value)}
              placeholder={COMPANY.legalName}
            />
          </div>
          <div className="qb-field">
            <label>IEC</label>
            <input
              value={company.iec}
              onChange={(e) => patchCompany("iec", e.target.value)}
              placeholder={COMPANY.registrations.iec}
            />
          </div>
          <div className="qb-field">
            <label>GST No.</label>
            <input
              value={company.gst}
              onChange={(e) => patchCompany("gst", e.target.value)}
              placeholder={COMPANY.registrations.gst}
            />
          </div>
        </div>
      </section>

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
              <textarea
                rows={5}
                value={item.description}
                onChange={(e) =>
                  updateItem(item.id, { description: e.target.value })
                }
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
                  onChange={(e) =>
                    updateItem(item.id, { quantity: Number(e.target.value) })
                  }
                />
              </div>
              <div className="qb-field">
                <label>Unit</label>
                <select
                  value={item.unit}
                  onChange={(e) =>
                    updateItem(item.id, { unit: e.target.value })
                  }
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
                  onChange={(e) =>
                    updateItem(item.id, { rate: Number(e.target.value) })
                  }
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
                    updateItem(item.id, {
                      discountPercent: Number(e.target.value),
                    })
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
                  onChange={(e) =>
                    updateItem(item.id, { taxPercent: Number(e.target.value) })
                  }
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
          <button
            type="button"
            className="qb-btn qb-btn-ghost"
            onClick={addItem}
          >
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
              onChange={(e) =>
                patchCharges("discountAmount", Number(e.target.value))
              }
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
              onChange={(e) =>
                patchCharges("documentTaxPercent", Number(e.target.value))
              }
            />
          </div>
          <div className="qb-field">
            <label>Other charges label</label>
            <input
              value={data.charges.otherChargesLabel}
              onChange={(e) =>
                patchCharges("otherChargesLabel", e.target.value)
              }
            />
          </div>
          <div className="qb-field">
            <label>Other charges amount</label>
            <input
              type="number"
              min={0}
              step="any"
              value={data.charges.otherChargesAmount}
              onChange={(e) =>
                patchCharges("otherChargesAmount", Number(e.target.value))
              }
            />
          </div>
        </div>
        <p className="qb-hint">
          Grand total:{" "}
          <strong>{formatMoney(totals.grandTotal, data.meta.currency)}</strong>
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
      <p className="qb-hint">
        PDF is generated entirely in your browser. Nothing is uploaded.
      </p>
    </div>
  );
}
