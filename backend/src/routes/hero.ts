import { Router, Request, Response } from "express";
import { HeroStory } from "../models/HeroStory";

const router = Router();

// GET /api/hero — all active stories (for frontend)
router.get("/", async (req: Request, res: Response) => {
  try {
    const stories = await HeroStory.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch hero stories" });
  }
});

// GET /api/hero/all — all stories including inactive (for CMS)
router.get("/all", async (req: Request, res: Response) => {
  try {
    const stories = await HeroStory.find().sort({ order: 1 });
    res.json({ success: true, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch hero stories" });
  }
});

// GET /api/hero/:id — single story by story id (not MongoDB _id)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const story = await HeroStory.findOne({ id: req.params.id });
    if (!story) {
      res.status(404).json({ success: false, error: "Story not found" });
      return;
    }
    res.json({ success: true, data: story });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch story" });
  }
});

// POST /api/hero — create story
router.post("/", async (req: Request, res: Response) => {
  try {
    const story = new HeroStory(req.body);
    await story.save();
    res.status(201).json({ success: true, data: story });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/hero/:mongoId — update by MongoDB _id
router.put("/:mongoId", async (req: Request, res: Response) => {
  try {
    const story = await HeroStory.findByIdAndUpdate(
      req.params.mongoId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!story) {
      res.status(404).json({ success: false, error: "Story not found" });
      return;
    }
    res.json({ success: true, data: story });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/hero/:mongoId/toggle
router.patch("/:mongoId/toggle", async (req: Request, res: Response) => {
  try {
    const story = await HeroStory.findById(req.params.mongoId);
    if (!story) {
      res.status(404).json({ success: false, error: "Story not found" });
      return;
    }
    story.isActive = !story.isActive;
    await story.save();
    res.json({ success: true, data: story });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/hero/:mongoId
router.delete("/:mongoId", async (req: Request, res: Response) => {
  try {
    const story = await HeroStory.findByIdAndDelete(req.params.mongoId);
    if (!story) {
      res.status(404).json({ success: false, error: "Story not found" });
      return;
    }
    res.json({ success: true, message: "Story deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
