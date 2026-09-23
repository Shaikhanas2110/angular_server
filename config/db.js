const mongoose = require("mongoose");

let isConnected = false; // Tracks connection status

const connectDB = async () => {
  if (isConnected) {
    console.log("=> Using existing database connection");
    return;
  }

  console.log("=> Creating new database connection");
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      // Your custom options here (if any)
    });

    isConnected = db.connections[0].readyState;
    console.log("MongoDB Atlas Connected Successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    // Do not use process.exit(1) in serverless environments as it crashes the container instance
  }
};

module.exports = connectDB;
