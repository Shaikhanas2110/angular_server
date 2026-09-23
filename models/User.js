const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
    },
    segment: {
      type: String,
      enum: ["Standard", "VIP", "Corporate"],
      default: "Standard",
      index: true,
    },
    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

module.exports = mongoose.model("User", UserSchema);
