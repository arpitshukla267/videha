import mongoose, { Schema, Document, Types } from "mongoose";

export const QUOTATION_STATUSES = [
  "Draft",
  "Sent",
  "Negotiation",
  "Accepted",
  "Rejected",
  "Expired",
  "Cancelled",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export interface IQuotationLineItem {
  description: string;
  quantity: string;
  unitPrice: number;
  discountPercent: number;
  amount: number;
}

export interface IQuotation extends Document {
  quotationCode: string;
  leadId: Types.ObjectId | null;
  companyId: Types.ObjectId | null;
  customerId: Types.ObjectId | null;
  orderId: Types.ObjectId | null;
  title: string;
  currency: string;
  lineItems: IQuotationLineItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validityDate: Date | null;
  paymentTerms: string;
  notes: string;
  status: QuotationStatus;
  assignedToId: Types.ObjectId | null;
  createdById: Types.ObjectId;
  sentAt: Date | null;
  acceptedAt: Date | null;
  revision: number;
  clientRequestId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IQuotationLineItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: String, default: "1" },
    unitPrice: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    amount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const quotationSchema = new Schema<IQuotation>(
  {
    quotationCode: { type: String, required: true, unique: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    title: { type: String, required: true, trim: true },
    currency: { type: String, default: "USD", index: true },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    validityDate: { type: Date, default: null, index: true },
    paymentTerms: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, enum: QUOTATION_STATUSES, default: "Draft", index: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    revision: { type: Number, default: 0, min: 0 },
    clientRequestId: { type: String, default: null, sparse: true, unique: true, index: true },
  },
  { timestamps: true },
);

quotationSchema.index({ status: 1, createdAt: -1 });
quotationSchema.index({ assignedToId: 1, status: 1, createdAt: -1 });
quotationSchema.index({ companyId: 1, status: 1 });

export const Quotation = mongoose.model<IQuotation>("Quotation", quotationSchema);
