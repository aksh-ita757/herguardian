// ============================================
// HerGuardian — Safety Map Routes
// Base URL: /api/map
// ============================================

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Safety zone data model (inline for simplicity)
const mongoose = require('mongoose');
const safetyZoneSchema = new mongoose.Schema({
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
  safetyScore:   { type: Number, min: 1, max: 10 },
  lightingScore: { type: Number, min: 1, max: 10 },
  crowdDensity:  { type: String, enum: ['low', 'medium', 'high'] },
  reportedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address:       String,
}, { timestamps: true });

safetyZoneSchema.index({ location: '2dsphere' }); // Enables geospatial queries
const SafetyZone = mongoose.model('SafetyZone', safetyZoneSchema);

// GET nearby safety zones — ?lat=28.6&lng=77.2&radius=2000
router.get('/zones', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    // Clamp radius: 100 m – 20 km
    const radius = Math.min(Math.max(parseInt(req.query.radius, 10) || 2000, 100), 20000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
    }
    const zones = await SafetyZone.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius, // meters
        }
      }
    }).select('-reportedBy').limit(20);
    res.json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch safety zones' });
  }
});

// POST report a safety zone
router.post('/report', protect, async (req, res) => {
  try {
    const { safetyScore, lightingScore, crowdDensity, address } = req.body;
    const latitude  = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }
    const zone = await SafetyZone.create({
      location:     { type: 'Point', coordinates: [longitude, latitude] },
      safetyScore, lightingScore, crowdDensity,
      address:      typeof address === 'string' ? address.slice(0, 200) : undefined,
      reportedBy:   req.user._id,
    });
    const safeZone = zone.toObject();
    delete safeZone.reportedBy;
    res.status(201).json({ success: true, zone: safeZone });
  } catch (error) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'Scores must be between 1 and 10.' : 'Could not submit report' });
  }
});

module.exports = router;
