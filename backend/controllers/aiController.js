// ============================================
// HerGuardian v2 — AI Controller
// Handles ALL AI modules: legal, health, safety,
// emotional support — one unified assistant
//
// Fixes vs. the previous version:
//  • Sends the required `x-api-key` header (calls previously always returned 401).
//  • Model is configurable (ANTHROPIC_MODEL). The old hard-coded
//    `claude-sonnet-4-20250514` was RETIRED by Anthropic on 15 June 2026.
//  • Reads *text* blocks from the response (Sonnet 5.x can return a `thinking`
//    block first, so content[0].text may be undefined).
//  • Validates/limits the chat history sent by the browser.
// ============================================
const axios = require('axios');
const { Cycle, Mood } = require('../models/Health');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const getModel = () => process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5-5';

const EMERGENCY_NOTE = 'For emergencies call 112 or Mahila Helpline: 181.';

const SYSTEM_PROMPT = `You are HerGuardian's AI Assistant — a compassionate, knowledgeable companion helping women in India with legal rights, health, safety, and emotional wellbeing.

YOU CAN HELP WITH:

1. LEGAL RIGHTS (India):
- POSH Act 2013: Workplace sexual harassment. Internal Committee (ICC) mandatory in organisations with 10+ employees. Complain within 3 months.
- POCSO Act 2012: Child protection under 18. Mandatory reporting by all citizens.
- Domestic Violence Act 2005: Physical/verbal/economic abuse. No FIR required for Protection Orders (apply to a Magistrate).
- Criminal law is now the Bharatiya Nyaya Sanhita (BNS) 2023, which replaced the IPC from 1 July 2024. It covers rape, assault/outraging modesty, sexual harassment, stalking, voyeurism and cruelty by a husband or his relatives.
- Cruelty by husband/relatives (formerly IPC 498A) is now BNS Section 85: a cognizable, non-bailable offence.
- Zero FIR: Can be filed at ANY police station regardless of jurisdiction.
- Dowry Prohibition Act also applies to dowry demands.
- Do NOT quote exact section numbers or punishment lengths unless you are fully certain. If unsure, describe the law in plain words and tell the user to confirm the exact provision with a lawyer, a legal aid clinic, or the official text.
- Always mention: Mahila Helpline 181, Police 100, NCW 7827170170, Cyber Crime 1930.

2. WOMEN'S HEALTH:
- Menstrual cycle phases: Menstrual (1-5d), Follicular (6-13d), Ovulation (14-15d), Luteal (16-26d), Pre-menstrual (27-28d).
- Period pain, PCOS symptoms and management, endometriosis, iron deficiency anaemia.
- Nutrition: iron-rich foods (spinach, lentils, jaggery), calcium, omega-3 for cramps.
- Exercise: yoga, walking during menstrual phase; HIIT during follicular/ovulation phase.
- When to see a doctor: cycles shorter than 21d or longer than 35d, extremely heavy bleeding, severe pain.

3. SAFETY TIPS:
- What to do if being followed, how to escape unsafe situations.
- Legal rights when approached by police or strangers.
- Online safety: cyber harassment, stalking, deepfakes — report to cybercrime.gov.in or call 1930.
- Safe travel tips, night safety, public transport safety.

4. EMOTIONAL SUPPORT:
- Active listening, validation, and coping strategies.
- Breathing techniques: 4-7-8 breathing, box breathing.
- Grounding: 5-4-3-2-1 technique.
- Refer to iCall (9152987821) or Vandrevala Foundation (1860-2662-345) for crisis support.
- Signs of abuse to watch for, how to safely leave abusive relationships.

RESPONSE RULES:
- Always warm, non-judgmental, and empathetic.
- Keep responses mobile-friendly: 3-5 concise points max.
- For ANY immediate danger: put emergency helplines FIRST before any other response.
- Respond in the same language the user uses (Hindi/English/mixed).
- End legal/medical responses with: "This is for awareness. Please consult a lawyer/doctor for your specific situation."
- Never make the user feel ashamed or judged for their situation.`;

// ── Low-level Claude call ─────────────────────
const callClaude = async ({ system, messages, maxTokens }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is not set');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const body = { model: getModel(), max_tokens: maxTokens, messages };
  if (system) body.system = system;

  const response = await axios.post(ANTHROPIC_URL, body, {
    headers: {
      'content-type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    timeout: 60000,
  });

  // Join all `text` blocks; ignore `thinking` blocks.
  return (response.data.content || [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
};

// Map any failure to a safe, user-facing message (details stay in server logs).
const handleAIError = (res, error, context, userMessage) => {
  if (error.code === 'NO_API_KEY') {
    console.error(`${context}: ANTHROPIC_API_KEY is not configured`);
    return res.status(503).json({ error: `AI features are not enabled on this server. ${EMERGENCY_NOTE}` });
  }
  const status = error.response?.status;
  console.error(`${context} error:`, status || '', JSON.stringify(error.response?.data) || error.message);
  if (status === 401) console.error('→ Anthropic rejected the key. Check ANTHROPIC_API_KEY.');
  if (status === 404 || (status === 400 && /model/i.test(JSON.stringify(error.response?.data)))) {
    console.error(`→ Model "${getModel()}" was rejected. Set ANTHROPIC_MODEL to a current model ID (see docs.claude.com).`);
  }
  if (status === 429 || status === 529) {
    return res.status(503).json({ error: `The AI assistant is busy right now. Please try again shortly. ${EMERGENCY_NOTE}` });
  }
  return res.status(500).json({ error: userMessage });
};

// Only accept {role: 'user'|'assistant', content: string}; cap size; must start with a user turn.
const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  const clean = history
    .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string' && h.content.trim())
    .slice(-10)
    .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }));
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
};

// ── CHAT ──────────────────────────────────────
// POST /api/ai/chat
const chatLegal = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const messages = [
      ...sanitizeHistory(history),
      { role: 'user', content: message.trim().slice(0, 2000) },
    ];

    // max_tokens leaves headroom: adaptive "thinking" tokens count toward this limit.
    const text = await callClaude({ system: SYSTEM_PROMPT, messages, maxTokens: 4000 });
    const reply = text || 'Sorry, I could not process that. Please try again.';

    res.json({ success: true, reply, history: [...messages, { role: 'assistant', content: reply }] });
  } catch (error) {
    handleAIError(res, error, 'AI Chat', `AI assistant temporarily unavailable. ${EMERGENCY_NOTE}`);
  }
};

// ── HEALTH INSIGHTS ───────────────────────────
// POST /api/ai/health-insights
const getHealthInsights = async (req, res) => {
  try {
    const [cycles, moods] = await Promise.all([
      Cycle.find({ user: req.user._id }).sort({ periodStart: -1 }).limit(6),
      Mood.find({ user: req.user._id }).sort({ date: -1 }).limit(30),
    ]);

    if (!cycles.length) return res.json({ success: true, insights: null, message: 'Log at least one cycle to get insights.' });

    const today = new Date();
    const daysSince = Math.floor((today - new Date(cycles[0].periodStart)) / 86400000);
    const currentPhase = daysSince <= 5 ? 'Menstrual' : daysSince <= 13 ? 'Follicular' : daysSince <= 15 ? 'Ovulation' : daysSince <= 26 ? 'Luteal' : 'Pre-Menstrual';

    const avgCycle = cycles.length > 1
      ? Math.round(cycles.slice(0, -1).reduce((s, c) => s + (c.cycleLength || 28), 0) / (cycles.length - 1))
      : (cycles[0].cycleLength || 28);
    const lengths   = cycles.map((c) => c.cycleLength || 28);
    const irregular = (Math.max(...lengths) - Math.min(...lengths)) > 7;
    const recentMoods = moods.slice(0, 7).map((m) => m.mood);
    const lowMood = recentMoods.filter((m) => ['sad', 'anxious', 'tired'].includes(m)).length >= 4;

    const prompt = `You are a women's health wellness advisor. Based on this user's data, generate personalised health insights in JSON format ONLY (no markdown, no preamble):

Cycle Phase: ${currentPhase} (Day ${daysSince})
Avg Cycle: ${avgCycle} days
Irregular: ${irregular}
Recent moods (7 days): ${recentMoods.join(', ') || 'not logged'}
Sustained low mood: ${lowMood}

Return ONLY this JSON structure:
{
  "currentPhase": "...",
  "phaseDescription": "2 sentences about what's happening in her body",
  "nutritionTips": ["tip1","tip2","tip3"],
  "exerciseTips": ["tip1","tip2"],
  "sleepTips": ["tip1","tip2"],
  "moodTips": ["tip1","tip2"],
  "warning": null or "brief alert if irregular cycle or sustained low mood",
  "disclaimer": "This is wellness guidance only. Consult a doctor for medical concerns."
}`;

    const text = await callClaude({ messages: [{ role: 'user', content: prompt }], maxTokens: 4000 });

    // Tolerant JSON extraction: take everything between the first "{" and the last "}"
    let insights;
    try {
      const start = text.indexOf('{');
      const end   = text.lastIndexOf('}');
      insights = JSON.parse(text.slice(start, end + 1));
    } catch {
      insights = { currentPhase, phaseDescription: text || 'Insights are unavailable right now.', disclaimer: 'For wellness guidance only.' };
    }

    res.json({ success: true, insights, cycleData: { currentPhase, daysSince, avgCycle, irregular } });
  } catch (error) {
    handleAIError(res, error, 'Health Insights', 'Could not generate insights. Please try again.');
  }
};

module.exports = { chatLegal, getHealthInsights };
