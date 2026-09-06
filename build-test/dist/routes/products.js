"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Product_1 = require("../models/Product");
const router = (0, express_1.Router)();
// GET /api/products — list all active products (for listing page & components)
router.get("/", async (req, res) => {
    try {
        const products = await Product_1.Product.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, data: products });
    }
    catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
});
// GET /api/products/all — list all products including inactive (for CMS)
router.get("/all", async (req, res) => {
    try {
        const products = await Product_1.Product.find().sort({ order: 1 });
        res.json({ success: true, data: products });
    }
    catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
});
// GET /api/products/:slug — get single product by slug
router.get("/:slug", async (req, res) => {
    try {
        const product = await Product_1.Product.findOne({ slug: req.params.slug });
        if (!product) {
            res.status(404).json({ success: false, error: "Product not found" });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch product" });
    }
});
// POST /api/products — create product
router.post("/", async (req, res) => {
    try {
        const product = new Product_1.Product(req.body);
        await product.save();
        res.status(201).json({ success: true, data: product });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// PUT /api/products/:id — update product by MongoDB _id
router.put("/:id", async (req, res) => {
    try {
        const product = await Product_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) {
            res.status(404).json({ success: false, error: "Product not found" });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// PATCH /api/products/:id/toggle — toggle active status
router.patch("/:id/toggle", async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, error: "Product not found" });
            return;
        }
        product.isActive = !product.isActive;
        await product.save();
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// DELETE /api/products/:id — delete product
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product_1.Product.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, error: "Product not found" });
            return;
        }
        res.json({ success: true, message: "Product deleted" });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
