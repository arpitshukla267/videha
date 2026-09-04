import mongoose, { Schema, Document, Types } from "mongoose";
import type { OrderStatus } from "./Order";

export interface IOrderStatusHistory extends Document {
  orderId: Types.ObjectId;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedById: Types.ObjectId;
  changedByName: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, required: true },
    changedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedByName: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export const OrderStatusHistory = mongoose.model<IOrderStatusHistory>(
  "OrderStatusHistory",
  orderStatusHistorySchema,
);
