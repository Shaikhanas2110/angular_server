const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Connect to MongoDB Atlas (Vercel will execute this during function invocation)
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

// ONLY run app.listen locally. Vercel handles routing on its own.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

// CRITICAL FOR VERCEL: Export the Express app instance
module.exports = app;
