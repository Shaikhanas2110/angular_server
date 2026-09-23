const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");

function normalize(p) {
  const price = {
    hour: p.price?.hour ?? 0,
    day: p.price?.day ?? p.dailyRate ?? 0,
    week: p.price?.week ?? 0,
    month: p.price?.month ?? 0,
    year: p.price?.year ?? 0,
  };
  const units = (p.units?.length ? p.units : Object.keys(price).filter((u) => price[u] > 0));
  return {
    id: p._id, name: p.name, sku: p.sku, category: p.category, description: p.description || "",
    icon: p.icon || "📦", rentable: p.rentable ?? p.isActive ?? true, units, price,
    stockQty: p.totalStock ?? 0, availableQty: p.availableStock ?? p.totalStock ?? 0,
    depositAmount: p.depositAmount ?? 0, isActive: p.isActive ?? true,
  };
}

router.get("/", async (req, res) => {
  try {
    const filter = req.query.includeInactive === "true" ? {} : { isActive: true };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products.map(normalize));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const b = req.body;
    const price = b.price || {};
    const p = await Product.create({
      name: b.name, sku: b.sku || undefined, category: b.category, description: b.description || "",
      icon: b.icon || "📦", rentable: b.rentable !== false, units: b.units || ["day"], price,
      dailyRate: price.day || 0, totalStock: b.stockQty ?? 0, availableStock: b.stockQty ?? 0,
      depositAmount: b.depositAmount ?? 0, isActive: b.isActive !== false,
    });
    res.status(201).json(normalize(p));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const update = { ...b };
    if (b.stockQty !== undefined) {
      const current = await Product.findById(req.params.id);
      const reserved = Math.max(0, (current?.totalStock || 0) - (current?.availableStock || 0));
      update.totalStock = b.stockQty;
      update.availableStock = Math.max(0, b.stockQty - reserved);
    }
    if (b.price?.day !== undefined) update.dailyRate = b.price.day;
    delete update.id; delete update.availableQty;
    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(normalize(p));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
