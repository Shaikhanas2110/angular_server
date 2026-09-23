const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, segment: user.segment, phone: user.phone, address: user.address };
}

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "customer", segment = "Standard", phone, address } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (!["customer", "staff", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role." });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword, role, segment, phone, address });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
      return res.status(400).json({ message: "Invalid email or password" });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(publicUser(user));
});

router.get("/customers", auth, async (req, res) => {
  const users = await User.find({ role: "customer" }).select("-password").sort({ name: 1 });
  res.json(users.map(publicUser));
});

module.exports = router;
