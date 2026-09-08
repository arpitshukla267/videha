import mongoose, { Schema, Document, Types } from "mongoose";

export const LEAD_ACTIVITY_TYPES = [
  "created",
  "assigned",
  "status_change",
  "followup_scheduled",
  "followup_created",
  "followup_completed",
  "note_added",
  "priority_changed",
  "call_logged",
  "converted",
  "lost",
] as const;

export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

export interface ILeadActivity extends Document {
  leadId: Types.ObjectId;
  type: LeadActivityType;
  title: string;
  description: string;
  performedById: Types.ObjectId;
  performedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadActivitySchema = new Schema<ILeadActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    type: {
      type: String,
      enum: LEAD_ACTIVITY_TYPES,
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    performedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
  },
  { timestamps: true },
);

leadActivitySchema.index({ leadId: 1, createdAt: -1 });

export const LeadActivity = mongoose.model<ILeadActivity>("LeadActivity", leadActivitySchema);
