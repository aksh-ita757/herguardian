// ============================================
// HerGuardian — Legal Content Model
// Stores legal articles, laws, and helplines
// Technology: Mongoose Schema
// ============================================

const mongoose = require('mongoose');

// ── LEGAL ARTICLE ────────────────────────────
const legalSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  category: {
    type: String,
    enum: ['POSH', 'POCSO', 'IPC', 'Domestic Violence', 'Cyber Crime', 'Other'],
    required: true,
  },
  summary:     { type: String, required: true }, // Plain language summary
  fullContent: { type: String },                 // Detailed explanation
  tags:        [String],                         // For filtering
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// ── HELPLINE ─────────────────────────────────
const helplineSchema = new mongoose.Schema({
  name:        { type: String, required: true }, // e.g. "Women Helpline"
  number:      { type: String, required: true }, // e.g. "1091"
  description: { type: String },
  category:    { type: String },                 // e.g. "Emergency", "Legal"
  available:   { type: String, default: '24/7' },
  icon:        { type: String },                 // emoji icon
  isActive:    { type: Boolean, default: true },
});

const Legal    = mongoose.model('Legal',    legalSchema);
const Helpline = mongoose.model('Helpline', helplineSchema);

module.exports = { Legal, Helpline };
