import mongoose, { Schema, Document, Types } from "mongoose";

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Follow-up",
  "Not Interested",
  "Converted",
  "Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface ILead extends Document {
  leadCode: string;
  name: string;
  company: string;
  phoneNumber: string;
  whatsAppNumber: string;
  email: string;
  country: string;
  source: string;
  productInterest: string;
  status: LeadStatus;
  priority: Priority;
  assignedToId: Types.ObjectId | null;
  departmentId: Types.ObjectId | null;
  nextFollowUp: Date | null;
  notes: string;
  createdById: Types.ObjectId;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    leadCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true, index: true },
    whatsAppNumber: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    country: { type: String, required: true, trim: true, index: true },
    source: { type: String, default: "Direct Inquiry", index: true },
    productInterest: { type: String, default: "" },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "New",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    nextFollowUp: { type: Date, default: null, index: true },
    notes: { type: String, default: "" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: "text", company: "text", email: "text", phoneNumber: "text" });

export const Lead = mongoose.model<ILead>("Lead", leadSchema);
