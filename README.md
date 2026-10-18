# 🌸 HerGuardian — Women Safety, Health & Empowerment Platform

A full-stack MERN web application with **10 feature modules** across 5 pillars.

## ✨ What's New in v2
| Feature | Status |
|---|---|
| AI Legal Chatbot (Claude-powered, multi-turn) | ✅ NEW |
| Smart Health Insights (AI phase-specific wellness tips) | ✅ NEW |
| Email via Brevo API or Gmail SMTP | ✅ UPGRADED |
| Evidence Photo in SOS email (camera capture) | ✅ NEW |
| Voice-Activated SOS (keyword detection) | ✅ WIRED UP |
| Full Dashboard — all 8 tabs functional | ✅ REBUILT |
| Auto JWT injection on all API calls | ✅ NEW |

## 🌐 Deploying to production
**→ Read [`DEPLOYMENT.md`](DEPLOYMENT.md)** — complete step-by-step guide (GitHub → MongoDB Atlas → Brevo → Twilio → Render → Vercel),
smoke-test checklist, troubleshooting table and a "before real users" checklist.
Config files: `render.yaml` (backend blueprint), `frontend/vercel.json`, `backend/.env.example`, `frontend/.env.example`.

## 🚀 Quick Start (local)
```bash
# Terminal 1 — Backend
cd herguardian_updated/backend
cp .env.example .env    # then fill in MONGO_URI + JWT_SECRET (see comments in the file)
npm install
npm run dev             # → http://localhost:5000  (health check: /healthz)

# Terminal 2 — Frontend  
cd herguardian_updated/frontend
npm install
npm run dev         # → http://localhost:5173
```

See **SETUP_GUIDE.txt** for full configuration of MongoDB, Gmail, Twilio, and Anthropic API keys.

## 🏗️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router v6 + Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| SMS | Twilio |
| Email | Brevo HTTPS API (cloud) or Gmail SMTP (local/VPS) |
| AI | Anthropic Claude API (`claude-sonnet-5-5`, configurable) |
| Voice | Web Speech API |
| Camera | MediaDevices.getUserMedia |
| Maps | Geolocation API + Google Maps links |

## 📦 10 Feature Modules
1. **One-Tap SOS** — SMS + email with GPS, evidence photo, delivery status
2. **Voice-Activated SOS** — Hands-free keyword trigger ("help me", "emergency")
3. **Auto Evidence Capture** — Camera snapshot attached to SOS email
4. **AI Legal Chatbot** — POSH/POCSO/IPC/DV Act-aware, Claude-powered
5. **Health Hub** — Cycle tracker (5 phases) + Mood journal
6. **Smart Health Insights** — AI personalised wellness recommendations
7. **Legal Awareness** — Plain-language law summaries + helpline directory
8. **Mental Wellness + Forum** — Resources + moderated peer support
9. **Safety Map** — Crowd-sourced safe/unsafe zone reporting
10. **Smart Safety Routing** — Zone-aware navigation (see mapRoutes.js)

## 📁 Key Files Changed in v2
- `backend/controllers/aiController.js` — **NEW** (AI chatbot + health insights)
- `backend/routes/aiRoutes.js` — **NEW** (/api/ai/*)
- `backend/controllers/sosController.js` — **UPGRADED** (Gmail, evidence photo)
- `backend/server.js` — **UPGRADED** (registers AI routes, 10MB body limit)
- `backend/.env` — **UPGRADED** (Gmail + Anthropic keys added)
- `backend/package.json` — **UPGRADED** (axios added)
- `frontend/src/pages/Dashboard.jsx` — **FULLY REBUILT** (all 8 tabs wired)
- `frontend/src/pages/Dashboard.module.css` — **NEW** (complete CSS)
- `frontend/src/services/api.js` — **UPGRADED** (AI endpoints + JWT interceptor)

## 🔑 Environment variables
See `backend/.env.example` (fully commented). Summary:
| Key | Where to Get | Required? |
|---|---|---|
| `MONGO_URI` | cloud.mongodb.com (free M0) | ✅ Yes |
| `JWT_SECRET` | generate locally (command in `.env.example`) | ✅ Yes (≥32 chars in production) |
| `CLIENT_URL` | your frontend URL | ✅ In production |
| `BREVO_API_KEY` + `EMAIL_FROM` *(or* `GMAIL_USER` + `GMAIL_APP_PASSWORD` *with* `EMAIL_PROVIDER=smtp`*)* | brevo.com / Google App Passwords | ✅ For verification + SOS email |
| `TWILIO_*` | twilio.com (trial = verified numbers only) | For SMS SOS |
| `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`) | console.anthropic.com | For AI features only |

Frontend: `VITE_API_URL` (your deployed backend origin) — see `frontend/.env.example`.

## 🛠️ v2.1 — deployment hardening (what changed)
**Would have broken in production**
- `Dashboard.jsx` / `Modules.jsx`: unescaped apostrophes made the frontend **fail to build**.
- Frontend used relative `/api` URLs that only work through Vite's dev proxy → now driven by `VITE_API_URL` (`src/config.js`).
- AI calls sent **no `x-api-key`** and used model `claude-sonnet-4-20250514`, **retired 15 Jun 2026** → fixed; model is configurable; replies parsed from text blocks.
- Gmail SMTP is blocked on Render's free tier → new `utils/mailer.js` (Brevo HTTPS API or SMTP).
- Missing `trust proxy` → all users would share one rate-limit bucket behind Render/Vercel proxies.
- SPA routes (`/dashboard`, `/verify-email`) would 404 on refresh → `vercel.json` + `_redirects`.

**Security**
- `GET /verify-email?token[$ne]=x` (NoSQL injection) could verify and log in as another user → type-checked + `express-mongo-sanitize`.
- `GET /profile` returned the email-verification token (verification could be bypassed) → hidden from queries.
- User text is now HTML-escaped in emails; helmet; CORS allow-list; 100 KB body limit (8 MB only on `/api/sos`); per-user limits on SOS and AI; stricter login/register limits; JWT algorithm pinned.
- Anonymous forum posts no longer expose the author's user id.
- `nodemailer` upgraded 6 → 10 (0 known vulnerabilities in backend prod dependencies).

**Emergency reliability**
- SOS contacts + channels are now notified **in parallel**; the API no longer says "SOS sent" if nothing was delivered; Indian numbers are normalised to `+91…`; SOS needs a verified email (anti-abuse; toggle `SOS_REQUIRE_VERIFIED_EMAIL`).

**Ops**
- Env validation with clear errors, `/healthz` probe, graceful shutdown, `.env.example` files, `render.yaml`.
- Legal facts in the AI system prompt corrected (IPC 498A is now **BNS Section 85**); exact section/penalty claims removed — please still get it reviewed.

## Team
**The Techies** — Aryan Tomar, Akshita Bhardwaj
