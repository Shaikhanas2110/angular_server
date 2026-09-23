// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true, // Builds indexes on startup
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if Atlas is unreachable
    });
    console.log(` MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB Atlas Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;