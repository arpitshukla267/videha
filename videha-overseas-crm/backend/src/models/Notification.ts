import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: "task_assigned" | "lead_assigned" | "task_due" | "task_overdue" | "order_status" | "system";
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["task_assigned", "lead_assigned", "task_due", "task_overdue", "order_status", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false, index: true },
    linkUrl: { type: String },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
