// ============================================
// HerGuardian — User Model
// Technology: Mongoose Schema
// This defines what a "User" looks like in MongoDB
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const trustedContactSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 80,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,   // No two users can have same email
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  // bcrypt hashes the password — we never store plain text passwords!
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false, // Never return password in queries by default
  },

  // SOS trusted contacts — max 5
  trustedContacts: {
    type: [trustedContactSchema],
    validate: {
      validator: (v) => v.length <= 5,
      message: 'Maximum 5 trusted contacts allowed',
    },
    default: [],
  },

  // Email Verification
  isEmailVerified: { type: Boolean, default: false },
  // select:false → these are NEVER returned by normal queries / GET /profile.
  // (Previously /profile exposed the token, so anyone could "verify" a fake email.)
  emailVerifyToken:   { type: String, select: false },
  emailVerifyExpires: { type: Date,   select: false },

  // Profile
  profilePicture: { type: String, default: '' },
  isActive:       { type: Boolean, default: true },

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// ── PASSWORD HASHING HOOK ────────────────────
// Runs automatically BEFORE saving a user to DB
// bcrypt turns "mypassword123" → "$2a$10$xyz..." (unreadable hash)
userSchema.pre('save', async function (next) {
  // Only hash if password was changed
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10); // 10 = complexity level
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── PASSWORD COMPARISON METHOD ───────────────
// Used during login to check if entered password matches stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
