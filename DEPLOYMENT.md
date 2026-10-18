# 🚀 HerGuardian — Deployment Guide

Follow the steps **in order**. Total time: about 60–90 minutes the first time.
Screens and button labels on these services change occasionally, so treat the click-paths as a guide.

## The setup

```
 Browser ──► Vercel (React frontend) ──► Render (Express API) ──► MongoDB Atlas
                                              │
                                              ├──► Brevo   (emails: verification + SOS)
                                              ├──► Twilio  (SMS: SOS)
                                              └──► Anthropic (AI assistant)
```

| Piece | Service | Cost to start |
|---|---|---|
| Database | MongoDB Atlas **M0** | Free |
| Backend API | Render **Web Service** | Free (sleeps when idle — read Step 9) |
| Frontend | Vercel | Free |
| Email | Brevo HTTPS API | Free: 300 emails/day |
| SMS | Twilio | Trial credit (verified numbers only) |
| AI | Anthropic API | Pay-per-use (optional) |
| Keep-alive | UptimeRobot (or similar) | Free |

> **Why Brevo and not Gmail?** Render's free tier **blocks outbound SMTP** (ports 25/465/587) since Sept 2025,
> so Gmail SMTP silently times out there — which would break both verification emails *and* SOS emails.
> Brevo's API uses normal HTTPS, so it works everywhere. (Gmail SMTP still works locally or on a paid host:
> set `EMAIL_PROVIDER=smtp`.)

---

## Step 0 — Before you start (5 min)

1. Install [Node.js 18+](https://nodejs.org) and [Git](https://git-scm.com), and make a free [GitHub](https://github.com) account.
2. **Generate your JWT secret** and keep it handy (Render can also generate one for you):
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Test locally first** (optional but smart):
   ```bash
   cd backend  && cp .env.example .env     # fill in MONGO_URI + JWT_SECRET at minimum
   npm install && npm run dev              # → http://localhost:5000/healthz
   # new terminal
   cd frontend && npm install && npm run dev   # → http://localhost:5173
   ```

---

## Step 1 — Push the code to GitHub (5 min)

```bash
cd herguardian_updated
git init
git add .
git status          # ⚠ CHECK: there must be NO ".env" and NO "node_modules" in this list
git commit -m "HerGuardian v2.1 - deployment ready"
git branch -M main
# create an EMPTY repo on github.com first (no README), then:
git remote add origin https://github.com/<your-username>/herguardian.git
git push -u origin main
```
Make the repo **Private** if you can — the project contains your team's code and it is safer by default.

---

## Step 2 — MongoDB Atlas (10 min)

1. Sign up at **cloud.mongodb.com** → create a Project → **Build a Database** → choose **M0 (Free)**.
2. Provider **AWS**; pick the closest region (e.g. **Mumbai** if offered) → **Create**.
3. **Database user:** create a username + a strong password. Prefer letters/numbers only
   (special characters must be URL-encoded inside the connection string).
4. **Network Access → Add IP Address → "Allow access from anywhere" (`0.0.0.0/0`)**.
   Render's free tier has no fixed outbound IP, so this is required. Your strong DB password is what protects the data.
5. **Database → Connect → Drivers → Node.js** → copy the connection string. It looks like:
   `mongodb+srv://myuser:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
6. Edit it: replace `<password>` with your real password, and put the database name before the `?`:
   ```
   mongodb+srv://myuser:MyPass123@cluster0.abcde.mongodb.net/herguardian?retryWrites=true&w=majority
   ```
   → this is your **`MONGO_URI`**. Collections are created automatically on first use — nothing to import.

---

## Step 3 — Brevo for email (10 min)

1. Sign up at **brevo.com** (free plan). New accounts may go through a short review before sending is enabled.
2. **Settings → Senders, Domains & Dedicated IPs → Senders → Add a sender.**
   Use an email you can open (e.g. your project Gmail). Click the **verification link** Brevo emails you.
   This address is your **`EMAIL_FROM`**.
3. **SMTP & API → API Keys → Generate a new API key** (starts with `xkeysib-`) → this is **`BREVO_API_KEY`**.

> **Deliverability tip:** with a `@gmail.com` sender, some messages may land in spam. For a real launch, buy a domain
> and authenticate it in Brevo (SPF/DKIM/DMARC) so mail comes from e.g. `alerts@herguardian.in`.
> Always test with real inboxes (Gmail, Outlook, a phone number's linked email).

---

## Step 4 — Twilio for SMS (10 min) *(optional — SOS still works by email without it)*

1. Sign up at **twilio.com**, verify your phone, and create a trial **phone number** → copy the
   **Account SID**, **Auth Token** (Console home) and your number in `+1415…` format.
2. **Trial accounts can only text numbers you have verified** (Console → Phone Numbers → *Verified Caller IDs*).
   Add every phone you will use for testing. Trial SMS also carry a "Sent from your Twilio trial account" prefix.
3. Env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
4. Twilio can't text **landline** numbers — trusted contacts must be mobile numbers.
5. India: Twilio offers an *international* route (no DLT registration needed) and a *domestic* route (needs an
   India-registered business + DLT registration). Test delivery to real Indian phones before you rely on it.

---

## Step 5 — Anthropic API key (5 min) *(optional — only the AI Assistant + Health Insights need it)*

1. **console.anthropic.com → API Keys → Create key** → `ANTHROPIC_API_KEY`.
2. Add a few dollars of credit under Billing and **set a monthly spend limit**.
3. Model: defaults to `claude-sonnet-5-5`. For lower cost/faster replies set `ANTHROPIC_MODEL=claude-haiku-5-5`.
   ⚠ The old `claude-sonnet-4-20250514` used by the previous code was **retired on 15 June 2026** and returns errors.

---

## Step 6 — Deploy the backend on Render (10 min)

**Option A — Blueprint (fastest):** Render dashboard → **New + → Blueprint** → select your repo.
Render reads `render.yaml` and asks for the secret values. Skip to the table below.

**Option B — Manual:** **New + → Web Service** → connect the repo, then:

| Field | Value |
|---|---|
| Name | `herguardian-api` |
| Region | Singapore |
| Branch | `main` |
| **Root Directory** | `backend` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path (Advanced) | `/healthz` |

**Environment variables** (Environment tab):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | the 96-character string from Step 0 |
| `MONGO_URI` | from Step 2 |
| `CLIENT_URL` | **temporary** `https://placeholder.vercel.app` — you'll fix it in Step 8 |
| `EMAIL_PROVIDER` | `brevo` |
| `BREVO_API_KEY` | from Step 3 |
| `EMAIL_FROM` | your verified Brevo sender |
| `EMAIL_FROM_NAME` | `HerGuardian` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | from Step 4 (or leave out) |
| `ANTHROPIC_API_KEY` | from Step 5 (or leave out) |

Don't set `PORT` — Render provides it.

Click **Create / Deploy**. Watch the logs; you should see `✅ MongoDB Connected` then `🌸 HerGuardian v2 listening`.
Copy your service URL (e.g. `https://herguardian-api.onrender.com`) and check it:
```bash
curl https://herguardian-api.onrender.com/healthz
# → {"status":"ok","db":"connected","uptime":12}
```
The server **refuses to start with a clear message** if `MONGO_URI`, `JWT_SECRET` or `CLIENT_URL` are missing or
the secret is a placeholder — read the log if the deploy fails.

---

## Step 7 — Deploy the frontend on Vercel (5 min)

1. **vercel.com → Add New → Project →** import the same GitHub repo.
2. **Root Directory:** `frontend` (click *Edit*). Framework preset auto-detects **Vite**.
3. **Environment Variables:** `VITE_API_URL` = your Render URL — **no `/api`, no trailing slash**
   (e.g. `https://herguardian-api.onrender.com`).
4. **Deploy.** Copy your Vercel URL (e.g. `https://herguardian.vercel.app`).

> Vite bakes `VITE_API_URL` into the build. If you ever change it, **Redeploy** the frontend.

---

## Step 8 — Connect the two (2 min) ⚠ don't skip

Back in **Render → your service → Environment**: change **`CLIENT_URL`** to your real Vercel URL
(no trailing slash). Saving redeploys the service. This value controls:
* **CORS** — without it the browser blocks every API call ("CORS error" in the console);
* the **link inside verification emails**.

Several allowed origins (e.g. a custom domain too)? Comma-separate them: `https://a.vercel.app,https://herguardian.in`.

---

## Step 9 — Keep the free backend awake (5 min) — important for an SOS app

Render's free web service **spins down after 15 minutes without traffic**; the next request then waits for a cold
start (typically 10–60 s). A panic button that takes a minute to respond is not acceptable.

* **Free fix:** create a monitor at [uptimerobot.com](https://uptimerobot.com) (or similar) → *HTTP(s)* →
  URL `https://herguardian-api.onrender.com/healthz` → interval **5 minutes**.
  Keeping one service awake all month uses ~744 of your 750 free hours, so run only **one** free service on that Render account.
* **Better fix before real users:** upgrade the service to a paid instance type (no sleeping).

---

## Step 10 — Smoke test (10 min)

Open your Vercel URL **on your phone** (camera, microphone and GPS only work over HTTPS — Vercel provides it).

- [ ] Home page loads; refresh on `/auth` doesn't 404.
- [ ] **Register** → "check your email" screen. Email arrives (check spam) → click the link → "verified" → lands on the dashboard.
- [ ] **My Profile → add 1–2 trusted contacts** (use numbers you verified in Twilio, and your own email). `98765 43210` is auto-converted to `+919876543210`.
- [ ] **SOS test:** tap SOS (a real alert goes to those contacts!). Confirm the SMS, the email, the map link and the camera photo.
- [ ] **Health Hub:** log a period + mood → **AI Assistant** replies; Smart Insights loads.
- [ ] **Forum:** post anonymously; **Safety Map** loads zones; allow location when asked.
- [ ] Render → Logs shows no red errors.

---

## Updating the app later
`git push` to `main` → Render and Vercel redeploy automatically. Rollback: Render *Events → Rollback*, Vercel *Deployments → Promote previous*.

---

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| Browser console: **CORS error** / "blocked by CORS policy" | `CLIENT_URL` on Render doesn't exactly match your Vercel URL (check `https`, spelling, no trailing slash). Fix it, wait for the redeploy. |
| Frontend calls `…vercel.app/api/…` and gets **404** | `VITE_API_URL` missing/wrong on Vercel → set it and **redeploy** the frontend. |
| Render deploy fails with "Cannot start — configuration problems" | Read the listed variables; add/fix them in Render → Environment. |
| Log: `MongoDB Connection Error` | Wrong password/URI, or Atlas **Network Access** lacks `0.0.0.0/0`. Special characters in the password must be URL-encoded. |
| Verification email never arrives | Brevo sender not **verified**, `EMAIL_FROM` ≠ that sender, API key wrong (Render log shows `Brevo API error: …`), or it's in spam. Use "Resend". |
| Verification link opens `localhost` | `CLIENT_URL` still set to localhost → fix on Render. |
| Using Gmail SMTP and mail times out on Render | Free tier blocks SMTP → use `EMAIL_PROVIDER=brevo`, or a paid instance. |
| SOS: `smsSent: false`, email OK | Twilio trial: recipient number not verified, bad number format, or a landline. Check the Twilio Console → Monitor → Logs. |
| SOS returns **403** "verify your email" | By design (anti-abuse). Verify the account — or set `SOS_REQUIRE_VERIFIED_EMAIL=false`. |
| AI Assistant says "AI features are not enabled" / unavailable | `ANTHROPIC_API_KEY` missing, no billing credit, or invalid `ANTHROPIC_MODEL` — Render logs say which. |
| First action after idle takes ~30–60 s | Free-tier cold start → Step 9. |
| Camera / voice SOS / location don't work | Must use the `https://` URL; allow the browser permission prompts. |
| Every user gets "Too many requests" | Only possible if `trust proxy` is lost; the code sets it (`server.js`). Don't remove that line. |

---

## ⚠ Before real users (not just your team)

This app handles emergencies, health data and location. Please go through this list:

1. **SOS reliability.** Test end-to-end on real phones, on the mobile carriers your users actually use. Don't rely on Twilio trial. Decide between Twilio's international route (works without DLT) and a domestic route (needs an India-registered business + DLT), or an India-focused SMS provider. Show clearly in the UI that HerGuardian **does not replace calling 112 / 100 / 181**.
2. **Free tier limits.** Sleeping backend (Step 9), Atlas M0 has **no automated backups** (upgrade, or schedule `mongodump` exports), Brevo 300 emails/day, Twilio trial.
3. **Privacy & law.** Cycle, mood and location are sensitive personal data. Publish a **Privacy Policy** and Terms, collect consent, and review obligations under India's **Digital Personal Data Protection Act, 2023**. Decide a data-deletion process. (Not legal advice — ask someone qualified.)
4. **Legal content review.** The AI assistant gives legal information. The prompt was corrected for known errors (e.g. IPC 498A → **BNS 85**), but have a lawyer or legal-aid volunteer review its prompt and the static Legal Awareness text, and keep the "for awareness only" disclaimer.
5. **Third-party map services.** The Safety Map calls OpenStreetMap's Nominatim and the Overpass API directly from users' browsers. Their usage policies limit heavy use — fine for a pilot, not for scale.
6. **Monitoring.** Add error tracking (e.g. Sentry) and uptime alerts. Watch Render logs after launch.
7. **Secrets hygiene.** If a key was ever pasted in chat, a screenshot or committed to Git, **rotate it** (Atlas password, Twilio token, Brevo/Anthropic keys, JWT secret — rotating `JWT_SECRET` logs everyone out).
8. **Known low-risk item.** `npm audit` reports `react-router` 6.x advisories (open redirect for *user-controlled* link targets; SSR hydration). This app only navigates to fixed internal paths and has no SSR, so it isn't exploitable here; plan a v7 upgrade with a full UI test.
