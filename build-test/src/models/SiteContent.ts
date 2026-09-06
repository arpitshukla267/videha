import mongoose, { Schema, Document } from "mongoose";

// Process Steps
export interface IProcessStep extends Document {
  num: string;
  label: string;
  heading: string;
  copy: string;
  image: string;
  isActive: boolean;
  order: number;
}

const ProcessStepSchema = new Schema<IProcessStep>(
  {
    num: { type: String, required: true },
    label: { type: String, required: true },
    heading: { type: String, required: true },
    copy: { type: String, required: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProcessStep = mongoose.model<IProcessStep>("ProcessStep", ProcessStepSchema);

// Quality Points
export interface IQualityPoint extends Document {
  title: string;
  copy: string;
  isActive: boolean;
  order: number;
}

const QualityPointSchema = new Schema<IQualityPoint>(
  {
    title: { type: String, required: true },
    copy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const QualityPoint = mongoose.model<IQualityPoint>("QualityPoint", QualityPointSchema);

// Markets
export interface IMarket extends Document {
  marketId: string;
  name: string;
  x: number;
  y: number;
  info: string;
  isActive: boolean;
  order: number;
}

const MarketSchema = new Schema<IMarket>(
  {
    marketId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    info: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Market = mongoose.model<IMarket>("Market", MarketSchema);

// Services
export interface IService extends Document {
  num: string;
  title: string;
  copy: string;
  detail: string;
  isActive: boolean;
  order: number;
}

const ServiceSchema = new Schema<IService>(
  {
    num: { type: String, required: true },
    title: { type: String, required: true },
    copy: { type: String, required: true },
    detail: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", ServiceSchema);

// Buyer Expectations
export interface IBuyerExpectation extends Document {
  title: string;
  copy: string;
  isActive: boolean;
  order: number;
}

const BuyerExpectationSchema = new Schema<IBuyerExpectation>(
  {
    title: { type: String, required: true },
    copy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BuyerExpectation = mongoose.model<IBuyerExpectation>("BuyerExpectation", BuyerExpectationSchema);

// Intro Facts
export interface IIntroFact extends Document {
  value: string;
  label: string;
  isActive: boolean;
  order: number;
}

const IntroFactSchema = new Schema<IIntroFact>(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const IntroFact = mongoose.model<IIntroFact>("IntroFact", IntroFactSchema);

// Site Config (origin point, etc.)
export interface ISiteConfig extends Document {
  key: string;
  value: unknown;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const SiteConfig = mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);
