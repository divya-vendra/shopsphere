const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas.
 * Called once at server startup. Mongoose handles reconnects internally.
 * We disable buffering so operations fail fast instead of queuing silently
 * if the DB connection drops mid-request.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    console.error(
      'MongoDB connection error: MONGODB_URI is not set. Create a .env file (see .env.example) and set MONGODB_URI to your MongoDB connection string.'
    );
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      // These options are defaults in Mongoose 7+ but explicit for clarity
      serverSelectionTimeoutMS: 5000, // fail fast in dev if Atlas is unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // hard exit — app cannot run without DB
  }
};

module.exports = connectDB;
