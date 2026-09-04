import type { LineItem, QuotationCharges, QuotationData, QuotationTotals, LineTotals } from "../types";
import { COMPANY } from "../config/company";

export function createEmptyLine(): LineItem {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    quantity: 1,
    unit: "MT",
    rate: 0,
    discountPercent: 0,
    taxPercent: 0,
  };
}

export function createDefaultQuotation(): QuotationData {
  const today = new Date();
  const valid = new Date(today);
  valid.setDate(valid.getDate() + 15);

  const y = today.getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);

  return {
    meta: {
      quotationNumber: `VO/${y}/${seq}`,
      date: today.toISOString().slice(0, 10),
      validUntil: valid.toISOString().slice(0, 10),
      currency: String(COMPANY.currency),
    },
    client: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      country: "",
    },
    items: [createEmptyLine()],
    charges: {
      discountAmount: 0,
      documentTaxPercent: 0,
      otherChargesLabel: "Freight / Documentation",
      otherChargesAmount: 0,
    },
    terms: {
      paymentTerms: COMPANY.defaultPaymentTerms,
      deliveryTerms: COMPANY.defaultDeliveryTerms,
      notes: COMPANY.defaultNotes,
    },
  };
}

function lineTotals(item: LineItem): LineTotals {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const discPct = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
  const taxPct = Math.min(100, Math.max(0, Number(item.taxPercent) || 0));

  const gross = qty * rate;
  const discount = (gross * discPct) / 100;
  const taxable = gross - discount;
  const tax = (taxable * taxPct) / 100;
  const amount = taxable + tax;

  return {
    id: item.id,
    gross,
    discount,
    taxable,
    tax,
    amount,
  };
}

export function calculateTotals(
  items: LineItem[],
  charges: QuotationCharges,
): QuotationTotals {
  const lines = items.map(lineTotals);
  const itemsSubtotal = lines.reduce((s, l) => s + l.gross, 0);
  const lineDiscounts = lines.reduce((s, l) => s + l.discount, 0);
  const lineTaxes = lines.reduce((s, l) => s + l.tax, 0);

  const afterLineNet = lines.reduce((s, l) => s + l.amount, 0);
  const documentDiscount = Math.max(0, Number(charges.discountAmount) || 0);
  const afterDocDiscount = Math.max(0, afterLineNet - documentDiscount);
  const documentTax =
    (afterDocDiscount * Math.min(100, Math.max(0, Number(charges.documentTaxPercent) || 0))) /
    100;
  const otherCharges = Math.max(0, Number(charges.otherChargesAmount) || 0);

  const grandTotal = afterDocDiscount + documentTax + otherCharges;

  return {
    lines,
    itemsSubtotal,
    lineDiscounts,
    lineTaxes,
    documentDiscount,
    documentTax,
    otherCharges,
    grandTotal,
  };
}

export function formatMoney(amount: number, currency: string = COMPANY.currency): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${COMPANY.currencySymbol}${(amount || 0).toFixed(2)}`;
  }
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
