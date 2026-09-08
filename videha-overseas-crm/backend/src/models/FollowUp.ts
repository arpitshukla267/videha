import mongoose, { Schema, Document, Types } from "mongoose";

export const FOLLOWUP_TYPES = ["Call", "WhatsApp", "Email", "Meeting"] as const;
export const FOLLOWUP_STATUSES = ["Pending", "Completed", "Skipped"] as const;

export type FollowUpType = (typeof FOLLOWUP_TYPES)[number];
export type FollowUpStatus = (typeof FOLLOWUP_STATUSES)[number];

export interface IFollowUp extends Document {
  leadId: Types.ObjectId;
  assignedToId: Types.ObjectId;
  dueAt: Date;
  type: FollowUpType;
  status: FollowUpStatus;
  outcome: string;
  notes: string;
  completedAt: Date | null;
  createdById: Types.ObjectId;
  revision: number;
  clientRequestId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dueAt: { type: Date, required: true, index: true },
    type: { type: String, enum: FOLLOWUP_TYPES, required: true, index: true },
    status: { type: String, enum: FOLLOWUP_STATUSES, default: "Pending", index: true },
    outcome: { type: String, default: "" },
    notes: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0, min: 0 },
    clientRequestId: { type: String, sparse: true, unique: true },
  },
  { timestamps: true },
);

followUpSchema.index({ leadId: 1, dueAt: 1, status: 1 });
followUpSchema.index({ assignedToId: 1, status: 1, dueAt: 1 });
followUpSchema.index({ status: 1, dueAt: 1 });

export const FollowUp = mongoose.model<IFollowUp>("FollowUp", followUpSchema);
