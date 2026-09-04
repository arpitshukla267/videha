import mongoose, { Schema, Document, Types } from "mongoose";

export const ORDER_STATUSES = [
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
  assignedToId: Types.ObjectId | null;
  status: OrderStatus;
  expectedDelivery: Date | null;
  notes: string;
  destinationPort: string;
  shippingCarrier: string;
  trackingNumber: string;
  relatedLeadId: Types.ObjectId | null;
  createdById: Types.ObjectId;
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
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: { type: String, enum: ORDER_STATUSES, default: "Order Confirmed", index: true },
    expectedDelivery: { type: Date, default: null },
    notes: { type: String, default: "" },
    destinationPort: { type: String, default: "" },
    shippingCarrier: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    relatedLeadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
