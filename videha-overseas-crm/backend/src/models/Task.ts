import mongoose, { Schema, Document, Types } from "mongoose";
import type { Priority } from "./Lead";

export const TASK_STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface ITask extends Document {
  taskCode: string;
  title: string;
  description: string;
  assignedToId: Types.ObjectId;
  relatedLeadId: Types.ObjectId | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date;
  createdById: Types.ObjectId;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    taskCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignedToId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    relatedLeadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "Pending",
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Task = mongoose.model<ITask>("Task", taskSchema);
