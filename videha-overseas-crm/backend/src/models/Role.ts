import mongoose, { Schema, Document } from "mongoose";

/** Built-in role slugs — custom roles use any unique UPPER_SNAKE_CASE name. */
export type SystemRoleName =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "SALES_MEMBER"
  | "OPERATIONS";

export type RoleName = SystemRoleName | (string & {});

export type VisibilityScope = "own" | "team" | "department" | "all";

export const SYSTEM_ROLE_NAMES: SystemRoleName[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SALES_MEMBER",
  "OPERATIONS",
];

export interface IRole extends Document {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  visibilityScope: VisibilityScope;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, uppercase: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
    visibilityScope: {
      type: String,
      enum: ["own", "team", "department", "all"],
      default: "own",
    },
  },
  { timestamps: true },
);

export const Role = mongoose.model<IRole>("Role", roleSchema);
