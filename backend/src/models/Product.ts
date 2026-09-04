import mongoose, { Schema, Document } from "mongoose";

export interface IQualityParameter {
  label: string;
  value: string;
}

export interface IProduct extends Document {
  index: string;
  slug: string;
  name: string;
  image: string;
  copy: string;
  meta: string[];
  grade: string;
  format: string;
  application: string;
  packaging: string;
  // Detail fields (for product detail page)
  tagline: string;
  description: string;
  origin: string;
  gradeSize: string;
  appearance: string;
  moisture: string;
  qualityParameters: IQualityParameter[];
  packagingOptions: string;
  moq: string;
  shelfLife: string;
  privateLabel: string;
  bulkSupply: string;
  exportMarkets: string;
  sampleAvailability: string;
  processingSteps: string[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const QualityParameterSchema = new Schema<IQualityParameter>({
  label: { type: String, required: true },
  value: { type: String, required: true },
});

const ProductSchema = new Schema<IProduct>(
  {
    index: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    copy: { type: String, required: true },
    meta: [{ type: String }],
    grade: { type: String, default: "" },
    format: { type: String, default: "" },
    application: { type: String, default: "" },
    packaging: { type: String, default: "" },
    // Detail fields
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    origin: { type: String, default: "" },
    gradeSize: { type: String, default: "" },
    appearance: { type: String, default: "" },
    moisture: { type: String, default: "" },
    qualityParameters: [QualityParameterSchema],
    packagingOptions: { type: String, default: "" },
    moq: { type: String, default: "" },
    shelfLife: { type: String, default: "" },
    privateLabel: { type: String, default: "" },
    bulkSupply: { type: String, default: "" },
    exportMarkets: { type: String, default: "" },
    sampleAvailability: { type: String, default: "" },
    processingSteps: [{ type: String }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
