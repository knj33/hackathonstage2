# CU Academic Advisor — ECE

An AI academic advisor for **Caucasus University ECE students**. A pure static
site (no build step, no backend code) that talks to an existing **n8n Cloud**
AI agent through a webhook.

**Features**

- 🤖 **AI Chatbot** — advising, syllabus lookups, foreign-admissions info, and a
  guided "I'm failing a course" flow (course → grade components → targeted resources)
- 👤 **Student Profile** — name, semester, GPA and per-course grades, stored in
  `localStorage` and sent as context with every chat message
- 📊 **Strength Analyzer** — rule-based, offline: maps your grades to ECE
  specialization fields (Embedded, DSP, Software, ML, Power, Telecom, Robotics)
- 🗓 **Semester Planner** — offline prerequisite engine: what you're eligible
  for, what's blocked (and by which prerequisite), plus a suggested ~30-credit schedule
- 📝 **Quiz Mode** — ask for a quiz on this week's lecture; the agent returns
  structured quiz JSON rendered as an interactive card with scoring, explanations
  and per-question "Help me understand this" tutoring

## Connecting the n8n agent

Edit `js/config.js`:

```js
const WEBHOOK_URL = "https://svanetisubanirobotics.app.n8n.cloud/webhook/<your-webhook-path>";
const STAFF_UPLOAD_URL = "https://svanetisubanirobotics.app.n8n.cloud/form/<your-form-path>";
```

While `WEBHOOK_URL` still contains `REPLACE_ME`, the app runs in **mock mode**
(a "demo mode" badge appears in the chat header): canned replies from
`js/mock.js` cover the whole demo — text, quiz, resources, and the multi-turn
failing-course flow — with no network needed.

The webhook contract (request/response JSON) is documented in `js/chat.js` and
must match the n8n "Respond to Webhook" node. The n8n side must send
`Access-Control-Allow-Origin: *` and answer `OPTIONS` preflight.

## Deploying to GitHub Pages

1. Push this repository to GitHub (with `index.html` at the repo root).
2. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**,
   choose branch `main` and folder `/ (root)`, then **Save**.
3. Wait ~1 minute; the site appears at `https://<username>.github.io/<repo-name>/`.

No build step, no `npm install` — all asset paths are relative, and `.nojekyll`
disables Jekyll processing.

## Project structure

```
index.html          single page, 4 tabs (Advisor / Profile / Analyzer / Planner)
css/style.css       design system (white + navy, Sora/Inter)
js/config.js        WEBHOOK_URL + STAFF_UPLOAD_URL
js/data.js          embedded ECE dataset (courses, professors, syllabi,
                    weekly materials, specialization fields)
js/mock.js          offline mock of the n8n agent (active until config is set)
js/chat.js          chat UI, webhook client, session memory, markdown renderer
js/profile.js       profile form + localStorage
js/analyzer.js      strength analyzer (rule-based, client-side)
js/planner.js       prerequisite engine + schedule suggestion
js/quiz.js          interactive quiz renderer + grading + history
js/app.js           tab navigation + init
```
