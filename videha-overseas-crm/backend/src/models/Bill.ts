import mongoose, { Schema, Document, Types } from "mongoose";

export const BILL_STATUSES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
] as const;

export type BillStatus = (typeof BILL_STATUSES)[number];

export interface IBillLineItem {
  description: string;
  quantity: string;
  unitPrice: number;
  amount: number;
}

export interface IBill extends Document {
  billCode: string;
  orderId: Types.ObjectId;
  orderCode: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  country: string;
  products: string;
  quantity: string;
  lineItems: IBillLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  paymentTerms: string;
  status: BillStatus;
  dueDate: Date | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  invoiceNotes: string;
  billingAddress: string;
  gstNumber: string;
  bankDetails: string;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IBillLineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: String, default: "1" },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

const billSchema = new Schema<IBill>(
  {
    billCode: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    orderCode: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    company: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    country: { type: String, required: true },
    products: { type: String, required: true },
    quantity: { type: String, default: "" },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    paymentTerms: { type: String, default: "Net 30 days from invoice date" },
    status: { type: String, enum: BILL_STATUSES, default: "issued", index: true },
    dueDate: { type: Date, default: null, index: true },
    issuedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    invoiceNotes: { type: String, default: "" },
    billingAddress: { type: String, default: "" },
    gstNumber: { type: String, default: "07AABCV1234F1Z5" },
    bankDetails: {
      type: String,
      default:
        "Beneficiary: Videha Overseas Pvt. Ltd.\nBank: HDFC Bank\nAccount: 50200012345678\nIFSC: HDFC0001234\nSWIFT: HDFCINBB",
    },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Bill = mongoose.model<IBill>("Bill", billSchema);
