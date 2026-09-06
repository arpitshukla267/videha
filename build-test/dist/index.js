"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
const products_1 = __importDefault(require("./routes/products"));
const hero_1 = __importDefault(require("./routes/hero"));
const content_1 = __importDefault(require("./routes/content"));
const upload_1 = __importDefault(require("./routes/upload"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3005";
// ─── Middleware ──────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:3005", "http://localhost:3010", "https://videha-cms.vercel.app"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded images statically
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/products", products_1.default);
app.use("/api/hero", hero_1.default);
app.use("/api/content", content_1.default);
app.use("/api/upload", upload_1.default);
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "Videha Overseas API is running", timestamp: new Date() });
});
// ─── Start ───────────────────────────────────────────────────────────────────
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Backend running at http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});
