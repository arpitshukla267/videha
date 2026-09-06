"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteConfig = exports.IntroFact = exports.BuyerExpectation = exports.Service = exports.Market = exports.QualityPoint = exports.ProcessStep = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProcessStepSchema = new mongoose_1.Schema({
    num: { type: String, required: true },
    label: { type: String, required: true },
    heading: { type: String, required: true },
    copy: { type: String, required: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
exports.ProcessStep = mongoose_1.default.model("ProcessStep", ProcessStepSchema);
const QualityPointSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    copy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
exports.QualityPoint = mongoose_1.default.model("QualityPoint", QualityPointSchema);
const MarketSchema = new mongoose_1.Schema({
    marketId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    info: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
exports.Market = mongoose_1.default.model("Market", MarketSchema);
const ServiceSchema = new mongoose_1.Schema({
    num: { type: String, required: true },
    title: { type: String, required: true },
    copy: { type: String, required: true },
    detail: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
exports.Service = mongoose_1.default.model("Service", ServiceSchema);
const BuyerExpectationSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    copy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
exports.BuyerExpectation = mongoose_1.default.model("BuyerExpectation", BuyerExpectationSchema);
const IntroFactSchema = new mongoose_1.Schema({
    value: { type: String, required: true },
    label: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
exports.IntroFact = mongoose_1.default.model("IntroFact", IntroFactSchema);
const SiteConfigSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose_1.Schema.Types.Mixed, required: true },
}, { timestamps: true });
exports.SiteConfig = mongoose_1.default.model("SiteConfig", SiteConfigSchema);
