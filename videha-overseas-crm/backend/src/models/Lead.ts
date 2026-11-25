import mongoose, { Schema, Document, Types } from "mongoose";
import { LEAD_STATUSES, type LeadStatus } from "../constants/leadPipeline";

export { LEAD_STATUSES, type LeadStatus };
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type ContainerType = "20ft FCL" | "40ft FCL" | "LCL" | string;

export interface IAssignmentDetails {
  assignedAt?: Date | null;
  assignedBy?: "round_robin" | "country" | "product" | "manual" | string;
  assignedRule?: string;
  assignedById?: Types.ObjectId | null;
  reassignedAt?: Date | null;
  reassignedById?: Types.ObjectId | null;
  previousAssigneeId?: Types.ObjectId | null;
}

export interface ILead extends Document {
  leadCode: string;
  rfqId?: string;
  name: string;
  company: string;
  phoneNumber: string;
  whatsAppNumber: string;
  email: string;
  country: string;
  source: string;
  productInterest: string;
  // Extended RFQ Fields (CRM Phase 1)
  product?: string;
  grade?: string;
  quantity?: string;
  packaging?: string;
  port?: string;
  incoterm?: string;
  sampleRequired?: boolean | string;
  containerType?: ContainerType;
  assignmentDetails?: IAssignmentDetails;
  status: LeadStatus;
  priority: Priority;
  assignedToId: Types.ObjectId | null;
  departmentId: Types.ObjectId | null;
  companyId: Types.ObjectId | null;
  customerId: Types.ObjectId | null;
  nextFollowUp: Date | null;
  notes: string;
  lostReason: string;
  convertedAt: Date | null;
  lastCallAt: Date | null;
  lastCallOutcome: string | null;
  lastCallChannel: string | null;
  lastCallPickedUp: boolean | null;
  totalCallsCount: number;
  createdById?: Types.ObjectId | null;
  archived: boolean;
  revision: number;
  clientRequestId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentDetailsSchema = new Schema(
  {
    assignedAt: { type: Date, default: null },
    assignedBy: { type: String, default: "manual" },
    assignedRule: { type: String, default: "" },
    assignedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reassignedAt: { type: Date, default: null },
    reassignedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    previousAssigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false },
);

const leadSchema = new Schema<ILead>(
  {
    leadCode: { type: String, required: true, unique: true, index: true },
    rfqId: { type: String, sparse: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true, index: true },
    whatsAppNumber: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    country: { type: String, required: true, trim: true, index: true },
    source: { type: String, default: "Website RFQ", index: true },
    productInterest: { type: String, default: "" },
    // Phase 1 RFQ fields
    product: { type: String, default: "" },
    grade: { type: String, default: "" },
    quantity: { type: String, default: "" },
    packaging: { type: String, default: "" },
    port: { type: String, default: "" },
    incoterm: { type: String, default: "" },
    sampleRequired: { type: Schema.Types.Mixed, default: false },
    containerType: { type: String, default: "20ft FCL" },
    assignmentDetails: { type: assignmentDetailsSchema, default: () => ({}) },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "New Lead",
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
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    nextFollowUp: { type: Date, default: null, index: true },
    notes: { type: String, default: "" },
    lostReason: { type: String, default: "" },
    convertedAt: { type: Date, default: null, index: true },
    lastCallAt: { type: Date, default: null, index: true },
    lastCallOutcome: { type: String, default: null },
    lastCallChannel: { type: String, default: null },
    lastCallPickedUp: { type: Boolean, default: null },
    totalCallsCount: { type: Number, default: 0 },
    createdById: { type: Schema.Types.ObjectId, ref: "User", default: null, required: false },
    archived: { type: Boolean, default: false, index: true },
    revision: { type: Number, default: 0, min: 0 },
    clientRequestId: { type: String, sparse: true, unique: true, index: true },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, archived: 1, createdAt: -1 });
leadSchema.index({ assignedToId: 1, status: 1, archived: 1 });
leadSchema.index({ companyId: 1, customerId: 1 });
leadSchema.index({ name: "text", company: "text", email: "text", phoneNumber: "text", rfqId: "text" });

export const Lead = mongoose.model<ILead>("Lead", leadSchema);
