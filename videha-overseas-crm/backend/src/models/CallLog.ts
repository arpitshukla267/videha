import mongoose, { Schema, Document, Types } from "mongoose";

export const CALL_CHANNELS = ["phone", "whatsapp", "email", "video", "in_person"] as const;
export const CALL_DIRECTIONS = ["outbound", "inbound"] as const;
export const CALL_OUTCOMES = [
  "picked_up",
  "not_picked_up",
  "busy",
  "voicemail",
  "wrong_number",
  "switched_off",
  "callback_requested",
  "no_answer",
] as const;
export const INTEREST_LEVELS = ["hot", "warm", "cold", "none"] as const;

export type CallChannel = (typeof CALL_CHANNELS)[number];
export type CallDirection = (typeof CALL_DIRECTIONS)[number];
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export interface ICallLog extends Document {
  leadId: Types.ObjectId;
  performedById: Types.ObjectId;
  performedByName: string;
  channel: CallChannel;
  direction: CallDirection;
  pickedUp: boolean;
  outcome: CallOutcome;
  durationMinutes: number;
  spokeWith: string;
  interestLevel: InterestLevel;
  disposition: string;
  notes: string;
  nextFollowUp: Date | null;
  followUpRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const callLogSchema = new Schema<ICallLog>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    performedById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    performedByName: { type: String, required: true },
    channel: { type: String, enum: CALL_CHANNELS, default: "phone", index: true },
    direction: { type: String, enum: CALL_DIRECTIONS, default: "outbound" },
    pickedUp: { type: Boolean, required: true, index: true },
    outcome: { type: String, enum: CALL_OUTCOMES, required: true, index: true },
    durationMinutes: { type: Number, default: 0, min: 0 },
    spokeWith: { type: String, default: "" },
    interestLevel: { type: String, enum: INTEREST_LEVELS, default: "none" },
    disposition: { type: String, default: "" },
    notes: { type: String, default: "" },
    nextFollowUp: { type: Date, default: null },
    followUpRequired: { type: Boolean, default: false },
  },
  { timestamps: true },
);

callLogSchema.index({ leadId: 1, createdAt: -1 });

export const CallLog = mongoose.model<ICallLog>("CallLog", callLogSchema);
