import mongoose, { Schema, Document, Types } from "mongoose";

export const COMPANY_STATUSES = ["active", "inactive"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export interface ICompany extends Document {
  companyCode: string;
  name: string;
  legalName: string;
  country: string;
  city: string;
  address: string;
  website: string;
  industry: string;
  taxId: string;
  notes: string;
  status: CompanyStatus;
  assignedToId: Types.ObjectId | null;
  createdById: Types.ObjectId;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    companyCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    legalName: { type: String, default: "", trim: true },
    country: { type: String, required: true, trim: true, index: true },
    city: { type: String, default: "", trim: true },
    address: { type: String, default: "" },
    website: { type: String, default: "" },
    industry: { type: String, default: "", index: true },
    taxId: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, enum: COMPANY_STATUSES, default: "active", index: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

companySchema.index({ name: "text", legalName: "text", country: "text", industry: "text" });
companySchema.index({ status: 1, country: 1, createdAt: -1 });

export const Company = mongoose.model<ICompany>("Company", companySchema);
