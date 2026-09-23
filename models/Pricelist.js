const mongoose = require("mongoose");

const TierDiscountSchema = new mongoose.Schema({
  minDays: { type: Number },
  discountPercentage: { type: Number, min: 0, max: 100 },
}, { _id: false });

const PricelistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    targetAudience: {
      type: String,
      enum: ["standard", "corporate", "wholesale", "seasonal"],
      default: "standard",
    },
    // Frontend pricing fields.
    segment: { type: String, enum: ["Standard", "VIP", "Corporate", null], default: null },
    scope: { type: String, default: "all" },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, min: 0, default: 0 },
    validFrom: { type: String, default: "" },
    validTo: { type: String, default: "" },
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 1 },
    durationDiscounts: [TierDiscountSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Pricelist", PricelistSchema);
