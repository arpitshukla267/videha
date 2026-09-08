import mongoose, { Schema, Document, Types } from "mongoose";

export const SHIPMENT_STATUSES = [
  "Planned",
  "Booked",
  "In Transit",
  "Arrived",
  "Delivered",
  "Cancelled",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface IShipment extends Document {
  shipmentCode: string;
  shipmentReference: string;
  containerReference: string;
  orderId: Types.ObjectId | null;
  companyId: Types.ObjectId | null;
  customerId: Types.ObjectId | null;
  product: string;
  quantity: string;
  originPort: string;
  destinationPort: string;
  etd: Date | null;
  eta: Date | null;
  carrier: string;
  shippingLine: string;
  trackingNumber: string;
  status: ShipmentStatus;
  notes: string;
  assignedToId: Types.ObjectId | null;
  createdById: Types.ObjectId;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<IShipment>(
  {
    shipmentCode: { type: String, required: true, unique: true, index: true },
    shipmentReference: { type: String, default: "", trim: true, index: true },
    containerReference: { type: String, default: "", trim: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    product: { type: String, default: "", trim: true },
    quantity: { type: String, default: "" },
    originPort: { type: String, default: "", trim: true },
    destinationPort: { type: String, default: "", trim: true, index: true },
    etd: { type: Date, default: null, index: true },
    eta: { type: Date, default: null, index: true },
    carrier: { type: String, default: "", trim: true },
    shippingLine: { type: String, default: "", trim: true },
    trackingNumber: { type: String, default: "", trim: true, index: true },
    status: { type: String, enum: SHIPMENT_STATUSES, default: "Planned", index: true },
    notes: { type: String, default: "" },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

shipmentSchema.index({ status: 1, eta: 1 });
shipmentSchema.index({ orderId: 1, createdAt: -1 });
shipmentSchema.index({
  shipmentReference: "text",
  containerReference: "text",
  trackingNumber: "text",
  product: "text",
});

export const Shipment = mongoose.model<IShipment>("Shipment", shipmentSchema);
