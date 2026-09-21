import mongoose, { Schema, Document, Types } from "mongoose";
import type { ExchangeRateSnapshot, OrderReportingAmountINR } from "../utils/currency";

export const ORDER_STATUSES = [
  "Draft",
  "Order Confirmed",
  "Processing",
  "Production",
  "Packed",
  "Shipped",
  "In Transit",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_BILLING_STATUSES = [
  "draft",
  "pending",
  "partially_paid",
  "paid",
  "overdue",
  "void",
] as const;

export type OrderBillingStatus = (typeof ORDER_BILLING_STATUSES)[number];

export interface IOrder extends Document {
  orderCode: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  country: string;
  products: string;
  quantity: string;
  orderValue: number;
  currency: string;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  reportingAmountINR: OrderReportingAmountINR | null;
  assignedToId: Types.ObjectId | null;
  status: OrderStatus;
  billingStatus: OrderBillingStatus;
  amountPaid: number;
  amountDue: number;
  billId: Types.ObjectId | null;
  expectedDelivery: Date | null;
  notes: string;
  destinationPort: string;
  shippingCarrier: string;
  trackingNumber: string;
  relatedLeadId: Types.ObjectId | null;
  companyId: Types.ObjectId | null;
  customerId: Types.ObjectId | null;
  createdById: Types.ObjectId;
  revision: number;
  clientRequestId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    company: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    country: { type: String, required: true, index: true },
    products: { type: String, required: true },
    quantity: { type: String, default: "" },
    orderValue: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    exchangeRateSnapshot: {
      type: {
        fromCurrency: { type: String, default: "" },
        toCurrency: { type: String, default: "INR" },
        rate: { type: Number, default: 1 },
        capturedAt: { type: Date, default: null },
      },
      default: null,
    },
    reportingAmountINR: {
      type: {
        orderValue: { type: Number, default: 0 },
        amountPaid: { type: Number, default: 0 },
        amountDue: { type: Number, default: 0 },
      },
      default: null,
    },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: { type: String, enum: ORDER_STATUSES, default: "Order Confirmed", index: true },
    billingStatus: {
      type: String,
      enum: ORDER_BILLING_STATUSES,
      default: "pending",
      index: true,
    },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    billId: { type: Schema.Types.ObjectId, ref: "Bill", default: null, index: true },
    expectedDelivery: { type: Date, default: null },
    notes: { type: String, default: "" },
    destinationPort: { type: String, default: "" },
    shippingCarrier: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    relatedLeadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0, min: 0 },
    clientRequestId: { type: String, sparse: true, unique: true, index: true },
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ billingStatus: 1, createdAt: -1 });
orderSchema.index({ assignedToId: 1, status: 1, createdAt: -1 });
orderSchema.index({ companyId: 1, customerId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
