const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "📦" },
    rentable: { type: Boolean, default: true },
    units: [{ type: String, enum: ["hour", "day", "week", "month", "year"] }],
    price: {
      hour: { type: Number, default: 0, min: 0 },
      day: { type: Number, default: 0, min: 0 },
      week: { type: Number, default: 0, min: 0 },
      month: { type: Number, default: 0, min: 0 },
      year: { type: Number, default: 0, min: 0 },
    },
    // Keep legacy fields so existing MongoDB documents remain readable.
    dailyRate: { type: Number, default: 0, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    totalStock: { type: Number, default: 0, min: 0 },
    availableStock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

ProductSchema.index({ category: 1, dailyRate: 1 });
module.exports = mongoose.model("Product", ProductSchema);
