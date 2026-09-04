import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILeadNote extends Document {
  leadId: Types.ObjectId;
  content: string;
  authorId: Types.ObjectId;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadNoteSchema = new Schema<ILeadNote>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
  },
  { timestamps: true },
);

export const LeadNote = mongoose.model<ILeadNote>("LeadNote", leadNoteSchema);
