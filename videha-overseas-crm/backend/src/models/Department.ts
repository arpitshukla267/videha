import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description: string;
  status: "active" | "inactive";
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    revision: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const Department = mongoose.model<IDepartment>("Department", departmentSchema);
