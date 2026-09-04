export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  /** Line discount percent 0–100 */
  discountPercent: number;
  /** Line tax percent 0–100 */
  taxPercent: number;
};

export type QuotationMeta = {
  quotationNumber: string;
  date: string;
  validUntil: string;
  currency: string;
};

export type ClientDetails = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  country: string;
};

export type QuotationCharges = {
  /** Document-level discount amount (absolute) */
  discountAmount: number;
  /** Document-level tax percent applied to (subtotal - discount) if not using line tax only */
  documentTaxPercent: number;
  otherChargesLabel: string;
  otherChargesAmount: number;
};

export type QuotationTerms = {
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
};

export type QuotationData = {
  meta: QuotationMeta;
  client: ClientDetails;
  items: LineItem[];
  charges: QuotationCharges;
  terms: QuotationTerms;
};

export type LineTotals = {
  id: string;
  gross: number;
  discount: number;
  taxable: number;
  tax: number;
  amount: number;
};

export type QuotationTotals = {
  lines: LineTotals[];
  itemsSubtotal: number;
  lineDiscounts: number;
  lineTaxes: number;
  documentDiscount: number;
  documentTax: number;
  otherCharges: number;
  grandTotal: number;
};
