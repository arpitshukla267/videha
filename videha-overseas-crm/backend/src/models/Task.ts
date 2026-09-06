import mongoose, { Schema, Document, Types } from "mongoose";
import type { Priority } from "./Lead";

export const TASK_STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_TYPES = [
  "follow_up_call",
  "email",
  "whatsapp",
  "meeting",
  "sample_dispatch",
  "documentation",
  "pricing_quote",
  "logistics",
  "internal",
  "other",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_CHANNELS = ["phone", "whatsapp", "email", "video", "in_person", "none"] as const;
export type TaskChannel = (typeof TASK_CHANNELS)[number];

export interface ITask extends Document {
  taskCode: string;
  title: string;
  description: string;
  assignedToId: Types.ObjectId;
  relatedLeadId: Types.ObjectId | null;
  taskType: TaskType;
  channel: TaskChannel;
  pickedUp: boolean | null;
  outcome: string;
  completionNotes: string;
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
    taskType: {
      type: String,
      enum: TASK_TYPES,
      default: "follow_up_call",
      index: true,
    },
    channel: {
      type: String,
      enum: TASK_CHANNELS,
      default: "phone",
    },
    pickedUp: { type: Boolean, default: null },
    outcome: { type: String, default: "" },
    completionNotes: { type: String, default: "" },
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
