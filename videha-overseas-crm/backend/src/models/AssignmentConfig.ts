import mongoose, { Schema, Document, Types } from "mongoose";

export type AssignmentMode = "round_robin" | "country" | "product" | "rules";

export interface ICountryRule {
  country: string;
  userId: Types.ObjectId;
}

export interface IProductRule {
  product: string;
  userId: Types.ObjectId;
}

export interface IAssignmentConfig extends Document {
  enabled: boolean;
  defaultMode: AssignmentMode;
  roundRobinUserIds: Types.ObjectId[];
  roundRobinLastIndex: number;
  countryRules: ICountryRule[];
  productRules: IProductRule[];
  fallbackUserId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentConfigSchema = new Schema<IAssignmentConfig>(
  {
    enabled: { type: Boolean, default: true },
    defaultMode: {
      type: String,
      enum: ["round_robin", "country", "product", "rules"],
      default: "rules",
    },
    roundRobinUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    roundRobinLastIndex: { type: Number, default: -1 },
    countryRules: [
      {
        country: { type: String, required: true, trim: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    productRules: [
      {
        product: { type: String, required: true, trim: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    fallbackUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const AssignmentConfig = mongoose.model<IAssignmentConfig>(
  "AssignmentConfig",
  assignmentConfigSchema,
);
