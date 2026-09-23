const mongoose = require("mongoose");

const RentalItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: String,
    unit: { type: String, enum: ["hour", "day", "week", "month", "year"], default: "day" },
    dailyRate: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationDays: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
      default: () => "ORD-" + Math.random().toString(36).slice(2, 11).toUpperCase(),
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [RentalItemSchema], default: [] },

    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalRentalCost: { type: Number, default: 0, min: 0 },
    totalDeposit: { type: Number, default: 0, min: 0 },
    pricelist: { type: mongoose.Schema.Types.ObjectId, ref: "Pricelist", default: null },

    status: {
      type: String,
      enum: [
        "quotation", "reserved", "picked_up", "returned", "completed", "cancelled",
        "confirmed", "out-for-delivery", "delivered", "return-pending",
      ],
      default: "quotation",
      index: true,
    },

    paymentType: { type: String, enum: ["full", "partial"], default: "full" },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "deposit_paid", "paid"], default: "unpaid" },
    paymentReference: { type: String, default: "" },

    reservedAt: Date,
    pickupScheduled: Date,
    pickedUpAt: Date,
    returnScheduled: Date,
    returnedAt: Date,
    lateFee: { type: Number, default: 0, min: 0 },

    contractGenerated: { type: Boolean, default: false },
    condition: {
      pickupScore: { type: Number, default: null },
      pickupNote: { type: String, default: "" },
      returnScore: { type: Number, default: null },
      returnNote: { type: String, default: "" },
      deduction: { type: Number, default: 0 },
    },

    deliveryDetails: {
      address: { type: String, default: "" },
      scheduledDeliveryDate: Date,
      actualDeliveryDate: Date,
      trackingNumber: String,
      notes: String,
    },
    returnDetails: {
      scheduledReturnDate: Date,
      actualReturnDate: Date,
      returnedCondition: String,
      lateFeesApplied: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

OrderSchema.index({ customer: 1, status: 1 });
OrderSchema.index({ returnScheduled: 1 });
module.exports = mongoose.model("Order", OrderSchema);
