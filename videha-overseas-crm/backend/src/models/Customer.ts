import mongoose, { Schema, Document, Types } from "mongoose";

export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface ICustomer extends Document {
  customerCode: string;
  companyId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  whatsAppNumber: string;
  designation: string;
  isPrimaryContact: boolean;
  notes: string;
  status: CustomerStatus;
  relatedLeadId: Types.ObjectId | null;
  createdById: Types.ObjectId;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, required: true, unique: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true, index: true },
    whatsAppNumber: { type: String, default: "" },
    designation: { type: String, default: "" },
    isPrimaryContact: { type: Boolean, default: false, index: true },
    notes: { type: String, default: "" },
    status: { type: String, enum: CUSTOMER_STATUSES, default: "active", index: true },
    relatedLeadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

customerSchema.index({ companyId: 1, status: 1, isPrimaryContact: -1 });
customerSchema.index({ name: "text", email: "text", phone: "text" });

export const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
