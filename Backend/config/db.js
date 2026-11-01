const mongoose = require('mongoose');

// Cache the connection across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anime-site';

  if (!uri) {
    throw new Error('MONGO_URI is not defined. Please set it in your environment variables.');
  }

  // If already connected, return cached connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // In serverless, fail fast instead of hanging on buffer
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 6000, // Timeout fast instead of exceeding Vercel limits
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null; // Reset so subsequent requests can retry
      console.error(`❌ MongoDB Connection Error: ${err.message}`);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

module.exports = connectDB;
