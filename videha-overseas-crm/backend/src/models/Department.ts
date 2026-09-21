import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description: string;
  status: "active" | "inactive";
  defaultRoleId: Types.ObjectId | null;
  allowedRoleIds: Types.ObjectId[];
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    defaultRoleId: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    allowedRoleIds: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    revision: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const Department = mongoose.model<IDepartment>("Department", departmentSchema);
