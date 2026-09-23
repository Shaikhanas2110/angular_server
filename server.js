const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Connect to MongoDB Atlas
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/operations", require("./routes/operations"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/pricelists", require("./routes/pricelists"));
app.use("/api/notifications", require("./routes/notifications"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});
