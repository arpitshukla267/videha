import mongoose, { Schema, Document, Types } from "mongoose";
import type { RoleName } from "./Role";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  roleId: Types.ObjectId;
  roleName: RoleName;
  departmentId?: Types.ObjectId | null;
  status: "active" | "inactive";
  phone?: string;
  designation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    roleName: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES_MEMBER", "OPERATIONS"],
      required: true,
      index: true,
    },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    phone: { type: String, default: "" },
    designation: { type: String, default: "" },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
