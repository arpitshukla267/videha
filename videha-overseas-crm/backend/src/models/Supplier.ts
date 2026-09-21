import mongoose, { Schema, Document, Types } from "mongoose";

export const SUPPLIER_STATUSES = ["active", "inactive"] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export interface ISupplier extends Document {
  supplierCode: string;
  supplierName: string;
  companyName: string;
  contactPerson: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  normalizedPhone: string;
  address: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  currency: string;
  productsSupplied: string;
  status: SupplierStatus;
  notes: string;
  normalizedSupplierName: string;
  normalizedCompanyName: string;
  createdById: Types.ObjectId;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    supplierCode: { type: String, required: true, unique: true, index: true },
    supplierName: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, default: "", trim: true, index: true },
    contactPerson: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    normalizedEmail: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    normalizedPhone: { type: String, default: "", trim: true },
    address: { type: String, default: "" },
    country: { type: String, default: "", trim: true, index: true },
    taxId: { type: String, default: "", trim: true },
    paymentTerms: { type: String, default: "" },
    currency: { type: String, default: "USD", trim: true },
    productsSupplied: { type: String, default: "" },
    status: { type: String, enum: SUPPLIER_STATUSES, default: "active", index: true },
    notes: { type: String, default: "" },
    normalizedSupplierName: { type: String, default: "", index: true },
    normalizedCompanyName: { type: String, default: "", index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

supplierSchema.index({
  supplierName: "text",
  companyName: "text",
  contactPerson: "text",
  email: "text",
  phone: "text",
  supplierCode: "text",
  productsSupplied: "text",
});
supplierSchema.index({ status: 1, country: 1, createdAt: -1 });
supplierSchema.index(
  { normalizedEmail: 1 },
  { unique: true, partialFilterExpression: { normalizedEmail: { $gt: "" } } },
);
supplierSchema.index({ normalizedCompanyName: 1, normalizedSupplierName: 1 });

export const Supplier = mongoose.model<ISupplier>("Supplier", supplierSchema);
