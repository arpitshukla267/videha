import mongoose, { Schema, Document, Types } from "mongoose";
import type { ImportEntityType } from "../constants/importFields";

export interface ImportCustomerMatch {
  type: "existing" | "new" | "ambiguous";
  matchedBy?: string;
  customerCode?: string;
  customerName?: string;
  companyName?: string;
  details?: string;
}

export interface ImportSupplierMatch {
  type: "existing" | "new" | "ambiguous" | "duplicate_in_csv";
  matchedBy?: string;
  supplierCode?: string;
  supplierName?: string;
  companyName?: string;
  details?: string;
}

export interface ImportSessionRow {
  rowNumber: number;
  raw: Record<string, string>;
  mapped: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  valid: boolean;
  customerMatch?: ImportCustomerMatch;
  supplierMatch?: ImportSupplierMatch;
}

export interface IImportSession extends Document {
  userId: Types.ObjectId;
  entityType: ImportEntityType;
  fileName: string;
  mapping: Record<string, string | null>;
  headers: string[];
  rows: ImportSessionRow[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importSessionRowSchema = new Schema<ImportSessionRow>(
  {
    rowNumber: { type: Number, required: true },
    raw: { type: Schema.Types.Mixed, default: {} },
    mapped: { type: Schema.Types.Mixed, default: {} },
    errors: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    isDuplicate: { type: Boolean, default: false },
    valid: { type: Boolean, default: false },
    customerMatch: { type: Schema.Types.Mixed, default: null },
    supplierMatch: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const importSessionSchema = new Schema<IImportSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entityType: { type: String, required: true, index: true },
    fileName: { type: String, default: "" },
    mapping: { type: Schema.Types.Mixed, default: {} },
    headers: { type: [String], default: [] },
    rows: { type: [importSessionRowSchema], default: [] },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

importSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ImportSession = mongoose.model<IImportSession>("ImportSession", importSessionSchema);
