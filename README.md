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
- 📝 **Quizzes tab** — lists only the subjects with uploaded lecture material /
  syllabi; picking one renders a grounded 4-option quiz in-page, and after
  grading a button sends the missed questions to the advisor for resources
  and focus recommendations
- 💬 **Quiz Mode in chat** — asking for a quiz in the conversation returns
  structured quiz JSON rendered as an interactive card with scoring,
  explanations and per-question tutoring

## The n8n backend

`js/config.js` points at the live n8n Cloud endpoints:

```js
const WEBHOOK_URL = "https://svanetisubanirobotics.app.n8n.cloud/webhook/cu-advisor-chat";
const STAFF_UPLOAD_URL = "https://svanetisubanirobotics.app.n8n.cloud/form/cu-upload-materials";
```

Both workflows must be **published** in n8n; until then the chat shows a
friendly offline error (the rest of the app works without network).

**Mock mode** (canned replies from `js/mock.js`, zero network — covers text,
quiz, resources and the multi-turn failing-course flow) activates when
`WEBHOOK_URL` contains `REPLACE_ME`, or on demand with **`?mock=1`** in the
URL — handy insurance for offline demos. A "demo mode" badge shows in the
chat header when it's active.

The webhook contract (request/response JSON) is documented in `js/chat.js`
and `DEPLOYMENT.md`. Conversation memory is server-side, keyed on
`sessionId` — the "＋ New chat" button rotates the ID for a fresh thread.

## Deploying to GitHub Pages

1. Push this repository to GitHub (with `index.html` at the repo root).
2. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**,
   choose branch `main` and folder `/ (root)`, then **Save**.
3. Wait ~1 minute; the site appears at `https://<username>.github.io/<repo-name>/`.

No build step, no `npm install` — all asset paths are relative, and `.nojekyll`
disables Jekyll processing.

## Project structure

```
index.html          single page, 4 tabs (Advisor / Profile / Analyzer / Quizzes)
css/style.css       design system (white + navy, Sora/Inter)
js/config.js        WEBHOOK_URL + STAFF_UPLOAD_URL
js/data.js          embedded ECE dataset (courses, professors, syllabi,
                    weekly materials, specialization fields)
js/mock.js          offline mock of the n8n agent (active until config is set)
js/chat.js          chat UI, webhook client, session memory, markdown renderer
js/profile.js       profile form + localStorage
js/analyzer.js      strength analyzer (rule-based, client-side)
js/quizzes.js       quizzes tab: uploaded-subject list + grounded quiz flow
js/quiz.js          interactive quiz renderer + grading + history
js/app.js           tab navigation + init
```
