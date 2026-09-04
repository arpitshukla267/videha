import { Router, Request, Response } from "express";
import {
  ProcessStep,
  QualityPoint,
  Market,
  Service,
  BuyerExpectation,
  IntroFact,
  SiteConfig,
} from "../models/SiteContent";
import mongoose from "mongoose";

const router = Router();

// ─── Helper to build CRUD for any model ─────────────────────────────────────
function crudRoutes(Model: mongoose.Model<any>) {
  const r = Router();

  // GET all (active only)
  r.get("/", async (_req: Request, res: Response) => {
    try {
      const items = await Model.find({ isActive: true }).sort({ order: 1 });
      res.json({ success: true, data: items });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch" });
    }
  });

  // GET all including inactive (for CMS)
  r.get("/all", async (_req: Request, res: Response) => {
    try {
      const items = await Model.find().sort({ order: 1 });
      res.json({ success: true, data: items });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch" });
    }
  });

  // GET single
  r.get("/:id", async (req: Request, res: Response) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) { res.status(404).json({ success: false, error: "Not found" }); return; }
      res.json({ success: true, data: item });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch" });
    }
  });

  // POST create
  r.post("/", async (req: Request, res: Response) => {
    try {
      const item = new Model(req.body);
      await item.save();
      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PUT update
  r.put("/:id", async (req: Request, res: Response) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) { res.status(404).json({ success: false, error: "Not found" }); return; }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PATCH toggle active
  r.patch("/:id/toggle", async (req: Request, res: Response) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) { res.status(404).json({ success: false, error: "Not found" }); return; }
      item.isActive = !item.isActive;
      await item.save();
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // DELETE
  r.delete("/:id", async (req: Request, res: Response) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) { res.status(404).json({ success: false, error: "Not found" }); return; }
      res.json({ success: true, message: "Deleted" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return r;
}

// ─── Mount CRUD routes ───────────────────────────────────────────────────────
router.use("/process-steps", crudRoutes(ProcessStep));
router.use("/quality-points", crudRoutes(QualityPoint));
router.use("/markets", crudRoutes(Market));
router.use("/services", crudRoutes(Service));
router.use("/buyer-expectations", crudRoutes(BuyerExpectation));
router.use("/intro-facts", crudRoutes(IntroFact));

// ─── Site Config (key-value store) ──────────────────────────────────────────
router.get("/config", async (_req: Request, res: Response) => {
  try {
    const configs = await SiteConfig.find();
    // Return as object { key: value }
    const obj: Record<string, any> = {};
    configs.forEach((c) => { obj[c.key] = c.value; });
    res.json({ success: true, data: obj });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch config" });
  }
});

router.put("/config/:key", async (req: Request, res: Response) => {
  try {
    const key = String(req.params.key);
    const value = req.body?.value;

    if (value === undefined) {
      res.status(400).json({ success: false, error: "Missing value in request body" });
      return;
    }

    // $set replaces the whole Mixed value (nested objects/arrays) reliably
    const config = await SiteConfig.findOneAndUpdate(
      { key },
      { $set: { key, value } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: config });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── Bulk endpoint: GET /api/content/all — returns everything at once ────────
router.get("/bulk/all", async (_req: Request, res: Response) => {
  try {
    const [
      processSteps,
      qualityPoints,
      markets,
      services,
      buyerExpectations,
      introFacts,
      configs,
    ] = await Promise.all([
      ProcessStep.find({ isActive: true }).sort({ order: 1 }),
      QualityPoint.find({ isActive: true }).sort({ order: 1 }),
      Market.find({ isActive: true }).sort({ order: 1 }),
      Service.find({ isActive: true }).sort({ order: 1 }),
      BuyerExpectation.find({ isActive: true }).sort({ order: 1 }),
      IntroFact.find({ isActive: true }).sort({ order: 1 }),
      SiteConfig.find(),
    ]);

    const configObj: Record<string, any> = {};
    configs.forEach((c) => { configObj[c.key] = c.value; });

    res.json({
      success: true,
      data: {
        processSteps,
        qualityPoints,
        markets,
        services,
        buyerExpectations,
        introFacts,
        config: configObj,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch content" });
  }
});

export default router;
