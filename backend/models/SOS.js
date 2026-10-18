// ============================================
// HerGuardian v2 — SOS Model
// ============================================
const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    latitude:  Number,
    longitude: Number,
    address:   String,
  },
  alertsSent: [{
    name:       String,
    phone:      String,
    email:      String,
    smsSent:    { type: Boolean, default: false },
    emailSent:  { type: Boolean, default: false },
  }],
  message:      { type: String, default: 'Emergency! I need help.' },
  responseTime: { type: Number },                                      // ms
  status:       { type: String, enum: ['sent','failed','partial'], default: 'sent' },
  triggeredBy:  { type: String, enum: ['manual','voice','timer'], default: 'manual' },
  hasEvidence:  { type: Boolean, default: false },                     // photo attached to email?
}, { timestamps: true });

module.exports = mongoose.model('SOS', sosSchema);
