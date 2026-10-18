// ============================================
// HerGuardian — Health Controller
// Handles: Cycle Tracking + Mood Journal
// Technology: Mongoose, date calculations
// ============================================

const { Cycle, Mood } = require('../models/Health');

// ── CALCULATE CYCLE DATES ────────────────────
// Helper: Given period start + cycle length, predict future dates
const calculateCycleDates = (periodStart, cycleLength = 28) => {
  const start = new Date(periodStart);
  const nextPeriod  = new Date(start);
  nextPeriod.setDate(start.getDate() + cycleLength);

  // Ovulation typically happens 14 days before next period
  const ovulation = new Date(nextPeriod);
  ovulation.setDate(nextPeriod.getDate() - 14);

  // Fertile window: 5 days before ovulation + day of ovulation
  const fertileStart = new Date(ovulation);
  fertileStart.setDate(ovulation.getDate() - 5);
  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 1);

  return { nextPeriodDate: nextPeriod, ovulationDate: ovulation, fertileStart, fertileEnd };
};

// ── LOG PERIOD ───────────────────────────────
// POST /api/health/cycle
const logPeriod = async (req, res) => {
  try {
    const { periodStart, periodEnd } = req.body;
    if (!periodStart || Number.isNaN(new Date(periodStart).getTime())) {
      return res.status(400).json({ error: 'A valid period start date is required.' });
    }
    if (periodEnd && Number.isNaN(new Date(periodEnd).getTime())) {
      return res.status(400).json({ error: 'Period end date is not valid.' });
    }
    // Clamp to a physiologically plausible range
    const parsedLength = parseInt(req.body.cycleLength, 10);
    const cycleLength  = Number.isFinite(parsedLength) ? Math.min(Math.max(parsedLength, 15), 60) : 28;
    const calculated = calculateCycleDates(periodStart, cycleLength);

    const cycle = await Cycle.create({
      user: req.user._id,
      periodStart,
      periodEnd,
      cycleLength,
      ...calculated,
    });

    res.status(201).json({ success: true, cycle });
  } catch (error) {
    res.status(500).json({ error: 'Could not log cycle' });
  }
};

// ── GET CYCLE DATA ───────────────────────────
// GET /api/health/cycle
const getCycleData = async (req, res) => {
  try {
    const cycles = await Cycle.find({ user: req.user._id }).sort({ periodStart: -1 }).limit(6);
    res.json({ success: true, cycles });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch cycle data' });
  }
};

// ── LOG MOOD ─────────────────────────────────
// POST /api/health/mood
const logMood = async (req, res) => {
  try {
    const { mood, moodEmoji, note, energyLevel } = req.body;

    // Only one mood entry per day per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existing = await Mood.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    let moodEntry;
    if (existing) {
      // Update today's entry
      moodEntry = await Mood.findByIdAndUpdate(
        existing._id,
        { mood, moodEmoji, note, energyLevel },
        { new: true }
      );
    } else {
      moodEntry = await Mood.create({ user: req.user._id, mood, moodEmoji, note, energyLevel });
    }

    res.status(201).json({ success: true, mood: moodEntry });
  } catch (error) {
    res.status(500).json({ error: 'Could not log mood' });
  }
};

// ── GET MOOD HISTORY ─────────────────────────
// GET /api/health/mood
const getMoodHistory = async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(30); // Last 30 days
    res.json({ success: true, moods });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch mood history' });
  }
};

module.exports = { logPeriod, getCycleData, logMood, getMoodHistory };
