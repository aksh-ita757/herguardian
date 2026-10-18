// ============================================
// HerGuardian — Health Model
// Stores cycle tracking and mood journal entries
// Technology: Mongoose Schema
// ============================================

const mongoose = require('mongoose');

// ── CYCLE ENTRY ──────────────────────────────
const cycleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Period start and end dates
  periodStart: { type: Date, required: true },
  periodEnd:   { type: Date },

  // Average cycle length in days (default: 28)
  cycleLength: { type: Number, default: 28 },

  // Predicted dates (calculated by backend)
  nextPeriodDate: { type: Date },
  ovulationDate:  { type: Date },
  fertileStart:   { type: Date },
  fertileEnd:     { type: Date },

  // Daily symptoms
  symptoms: [{
    date:     Date,
    symptoms: [String], // e.g. ['cramps', 'headache', 'bloating']
    flow:     { type: String, enum: ['light', 'medium', 'heavy'] },
    notes:    String,
  }],

}, { timestamps: true });

// ── MOOD JOURNAL ENTRY ───────────────────────
const moodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: { type: Date, default: Date.now },

  // Emoji mood selection
  mood: {
    type: String,
    enum: ['happy', 'tired', 'anxious', 'sad', 'energized', 'calm'],
    required: true,
  },
  moodEmoji: { type: String }, // e.g. "😊"

  // Written journal note
  note: { type: String, maxlength: 1000 },

  // Energy level 1-10
  energyLevel: { type: Number, min: 1, max: 10 },

}, { timestamps: true });

const Cycle = mongoose.model('Cycle', cycleSchema);
const Mood  = mongoose.model('Mood',  moodSchema);

module.exports = { Cycle, Mood };
