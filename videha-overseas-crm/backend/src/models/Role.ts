import mongoose, { Schema, Document, Types } from "mongoose";

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SALES_MEMBER" | "OPERATIONS";

export interface IRole extends Document {
  name: RoleName;
  displayName: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES_MEMBER", "OPERATIONS"],
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true },
    description: { type: String, default: "" },
    permissions: [{ type: String }],
  },
  { timestamps: true },
);

export const Role = mongoose.model<IRole>("Role", roleSchema);
