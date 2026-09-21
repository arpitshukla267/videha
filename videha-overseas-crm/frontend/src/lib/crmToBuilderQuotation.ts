import type { Quotation, QuotationLineItem, Lead } from '../types/crm';

/** Shape expected by @videha/quotation-builder (mirrors quotation-builder/src/types.ts). */
export type BuilderQuotationData = {
  meta: {
    quotationNumber: string;
    date: string;
    validUntil: string;
    currency: string;
  };
  client: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    country: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    discountPercent: number;
    taxPercent: number;
  }>;
  charges: {
    discountAmount: number;
    documentTaxPercent: number;
    otherChargesLabel: string;
    otherChargesAmount: number;
  };
  terms: {
    paymentTerms: string;
    deliveryTerms: string;
    notes: string;
  };
};

type QuotationFormLike = {
  title: string;
  currency: string;
  companyLabel: string;
  customerLabel: string;
  validityDate: string;
  paymentTerms: string;
  notes: string;
  discountAmount: string;
  taxRate: string;
  lineItems: QuotationLineItem[];
};

const DEFAULT_DELIVERY_TERMS = 'FOB / CIF / CFR — Incoterms® 2020, as confirmed on order.';

function toIsoDate(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function defaultValidUntil(fromDate: string): string {
  const base = new Date(fromDate);
  base.setDate(base.getDate() + 15);
  return base.toISOString().slice(0, 10);
}

function lineItemUnitRate(item: QuotationLineItem): number {
  const qty = parseFloat(String(item.quantity)) || 1;
  const unitPrice = Number(item.unitPrice) || 0;
  if (unitPrice > 0) return unitPrice;
  const amount = Number(item.amount) || 0;
  if (amount <= 0) return 0;
  return qty > 0 ? amount / qty : amount;
}

function quotationNumberFromCode(code?: string): string {
  if (!code) {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `VO/${year}/${seq}`;
  }
  return code.replace(/^QT-?/i, 'VO/').replace(/-/g, '/');
}

export function mapCrmQuotationToBuilder(
  form: QuotationFormLike,
  options?: {
    quotationCode?: string;
    lead?: Lead | null;
    quotation?: Quotation | null;
  }
): BuilderQuotationData {
  const lead = options?.lead;
  const quotation = options?.quotation;
  const today = new Date().toISOString().slice(0, 10);
  const validUntil = form.validityDate
    ? toIsoDate(form.validityDate)
    : quotation?.validityDate
      ? toIsoDate(quotation.validityDate)
      : defaultValidUntil(today);

  const taxRate = parseFloat(form.taxRate) || quotation?.taxRate || 0;

  return {
    meta: {
      quotationNumber: quotationNumberFromCode(options?.quotationCode || quotation?.quotationCode),
      date: today,
      validUntil,
      currency: form.currency || quotation?.currency || 'USD'
    },
    client: {
      companyName: form.companyLabel || quotation?.companyName || lead?.company || '',
      contactPerson: form.customerLabel || quotation?.customerName || lead?.name || '',
      email: quotation?.leadEmail || quotation?.customerEmail || lead?.email || '',
      phone: quotation?.leadPhone || quotation?.customerPhone || lead?.phoneNumber || '',
      address: lead?.city ? `${lead.city}${lead.country ? `, ${lead.country}` : ''}` : '',
      country: quotation?.leadCountry || quotation?.companyCountry || lead?.country || ''
    },
    items: (form.lineItems.length ? form.lineItems : quotation?.lineItems || []).map((item, index) => ({
      id: `crm-line-${index}-${Date.now()}`,
      description: item.description || form.title || 'Export goods',
      quantity: parseFloat(String(item.quantity)) || 1,
      unit: 'MT',
      rate: lineItemUnitRate(item),
      discountPercent: item.discountPercent || 0,
      taxPercent: taxRate
    })),
    charges: {
      discountAmount: parseFloat(form.discountAmount) || quotation?.discountAmount || 0,
      documentTaxPercent: taxRate,
      otherChargesLabel: 'Freight / Documentation',
      otherChargesAmount: 0
    },
    terms: {
      paymentTerms: form.paymentTerms || quotation?.paymentTerms || 'Net 30',
      deliveryTerms: DEFAULT_DELIVERY_TERMS,
      notes: form.notes || quotation?.notes || ''
    }
  };
}

export const QUOTATION_BUILDER_SESSION_KEY = 'videha_crm_quotation_builder_payload';

export function stashBuilderPayload(payload: BuilderQuotationData): void {
  sessionStorage.setItem(QUOTATION_BUILDER_SESSION_KEY, JSON.stringify(payload));
}

export function readBuilderPayload(): BuilderQuotationData | null {
  const raw = sessionStorage.getItem(QUOTATION_BUILDER_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BuilderQuotationData;
  } catch {
    return null;
  }
}

export function clearBuilderPayload(): void {
  sessionStorage.removeItem(QUOTATION_BUILDER_SESSION_KEY);
}
