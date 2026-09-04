import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILeadActivity extends Document {
  leadId: Types.ObjectId;
  type: "created" | "assigned" | "status_change" | "followup_scheduled" | "note_added" | "priority_changed";
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
      enum: ["created", "assigned", "status_change", "followup_scheduled", "note_added", "priority_changed"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    performedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
  },
  { timestamps: true },
);

export const LeadActivity = mongoose.model<ILeadActivity>("LeadActivity", leadActivitySchema);
