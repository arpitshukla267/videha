import mongoose, { Schema, Document } from "mongoose";

export interface IHeroStory extends Document {
  id: string;
  number: string;
  label: string;
  heading: [string, string];
  description: string;
  image: string;
  mobileImage?: string;
  alt: string;
  ctaLabel?: string;
  ctaHref?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroStorySchema = new Schema<IHeroStory>(
  {
    id: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    label: { type: String, required: true },
    heading: { type: [String], required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    mobileImage: { type: String },
    alt: { type: String, required: true },
    ctaLabel: { type: String },
    ctaHref: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const HeroStory = mongoose.model<IHeroStory>("HeroStory", HeroStorySchema);
