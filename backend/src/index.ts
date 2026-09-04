import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./db";
import productsRouter from "./routes/products";
import heroRouter from "./routes/hero";
import contentRouter from "./routes/content";
import uploadRouter from "./routes/upload";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3005";

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:3005", "http://localhost:3010"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/products", productsRouter);
app.use("/api/hero", heroRouter);
app.use("/api/content", contentRouter);
app.use("/api/upload", uploadRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Videha Overseas API is running", timestamp: new Date() });
});

// ─── Start ───────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});
