// ============================================
// HerGuardian — MongoDB Connection
// ============================================
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // fail fast (and loudly) if Atlas is unreachable
      maxPoolSize: 10,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('→ Check MONGO_URI, the database user/password, and that Atlas');
    console.error('  Network Access allows your host (add 0.0.0.0/0 for Render/Railway).');
    process.exit(1);
  }
};

module.exports = connectDB;
