import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEmailReminderLog extends Document {
  to: string;
  userName: string;
  itemType: "Task" | "Follow-up";
  title: string;
  leadOrCustomerName: string;
  dueDate: string;
  subject: string;
  text: string;
  html: string;
  entityId?: Types.ObjectId;
  sentAt: Date;
}

const emailReminderLogSchema = new Schema<IEmailReminderLog>(
  {
    to: { type: String, required: true, lowercase: true, trim: true, index: true },
    userName: { type: String, required: true },
    itemType: { type: String, enum: ["Task", "Follow-up"], required: true, index: true },
    title: { type: String, required: true },
    leadOrCustomerName: { type: String, required: true },
    dueDate: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    html: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const EmailReminderLog = mongoose.model<IEmailReminderLog>(
  "EmailReminderLog",
  emailReminderLogSchema,
);
