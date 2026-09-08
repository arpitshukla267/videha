import { Schema, model, type InferSchemaType } from "mongoose";

export const DOCUMENT_CATEGORIES = [
  "KYC",
  "Quotation",
  "Invoice",
  "Contract",
  "Shipping",
  "Other",
] as const;

export const DOCUMENT_ENTITY_TYPES = [
  "Lead",
  "Company",
  "Customer",
  "Quotation",
  "Order",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

const documentSchema = new Schema(
  {
    documentCode: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: DOCUMENT_CATEGORIES },
    entityType: { type: String, required: true, enum: DOCUMENT_ENTITY_TYPES },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityLabel: { type: String, default: "" },
    entityCode: { type: String, default: "" },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    publicId: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, enum: ["image", "raw"] },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);

documentSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
documentSchema.index({ category: 1, createdAt: -1 });
documentSchema.index({ title: "text", fileName: "text", documentCode: "text" });

export type DocumentDoc = InferSchemaType<typeof documentSchema>;
export const Document = model("Document", documentSchema);
