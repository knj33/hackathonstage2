# Deployment Guide — CU Academic Advisor

This site is **pure static files** — no build step, no `npm install`, no server
code. Anything that can serve (or open) HTML can run it.

---

## 1. Running it locally

### Option A — just open the file

Double-click `index.html` (or drag it into a browser). Everything works from
`file://` — chat talks to the live n8n backend (needs internet); add
`?mock=1` to the URL for fully offline canned replies.

### Option B — a local server (closer to how GitHub Pages serves it)

```bash
cd hackathonstage2
python3 -m http.server 8000
# open http://localhost:8000
```

Any static server works (`npx serve`, VS Code Live Server, …) — the app
doesn't care which.

### What to expect

- `js/config.js` already points at the **live n8n endpoints**. Chat replies
  come from the real agent — typical latency is 5–15 s (it may call tools
  and web search); the frontend waits up to 60 s with a typing indicator.
- Append **`?mock=1`** to the URL to force **mock mode** (canned replies
  from `js/mock.js`, zero network) — useful for offline demos. A
  **"demo mode"** badge in the chat header confirms the mock is active.
- Try the signature flow: *"I'm failing CompSci Basics 1"* → *"the labs"*,
  then *"Quiz me on this week's lecture"*.
- The **Profile** and **Analyzer** tabs are always fully client-side;
  the **Quizzes** tab needs the backend (or mock mode) to generate quizzes.

---

## 2. Deploying to GitHub Pages

### Step 1 — get the code onto `main`

If the site currently lives on a feature branch, merge it (via a PR on
GitHub, or locally):

```bash
git checkout main            # or: git checkout -b main if main doesn't exist yet
git merge <feature-branch>
git push -u origin main
```

### Step 2 — turn on Pages

On GitHub: **Settings → Pages → Build and deployment**

- Source: **Deploy from a branch**
- Branch: **`main`**, folder **`/ (root)`**
- Click **Save**

### Step 3 — open the site

Wait about a minute, then visit:

```
https://<your-username>.github.io/<repo-name>/
```

That's the whole deployment. Why it works with zero configuration:

- `index.html` sits at the repo **root**
- all asset paths are **relative**, so the `/<repo-name>/` subpath is fine
- `.nojekyll` stops GitHub from running Jekyll on the files

Every future push to `main` redeploys automatically in ~1 minute.

---

## 3. The n8n backend

`js/config.js` is already wired to the live endpoints:

```js
const WEBHOOK_URL = "https://svanetisubanirobotics.app.n8n.cloud/webhook/cu-advisor-chat";
const STAFF_UPLOAD_URL = "https://svanetisubanirobotics.app.n8n.cloud/form/cu-upload-materials";
```

Both workflows must be **published (active) in n8n**. A 404 body saying
*"webhook not registered"* means the workflow isn't published — flip the
Active toggle in the n8n editor; nothing needs to change on the frontend.

The staff upload URL is a plain link opened in a new tab from the footer and
the Quizzes tab — it is never embedded in the page or POSTed to.

Two things must be true on the n8n side, or the browser will block the calls:

1. **CORS** — the *Respond to Webhook* node must send the header
   `Access-Control-Allow-Origin: *`, and the workflow must answer `OPTIONS`
   preflight requests.
2. **Response format** — replies must be JSON in the agreed envelope:

   ```json
   { "type": "text",      "content": "markdown string" }
   { "type": "quiz",      "content": "intro", "quiz": { "topic": "…", "questions": [ … ] } }
   { "type": "resources", "content": "intro", "resources": [ { "title": "", "url": "", "source": "", "free": true, "note": "" } ] }
   ```

   If the agent sends something malformed, the frontend falls back to showing
   it as raw text rather than breaking.

The request the frontend sends (for reference when testing the workflow):

```json
{
  "sessionId": "uuid-v4, generated once per browser; rotated by the New chat button",
  "message": "the user's message (always non-empty — empty sends are blocked client-side)",
  "mode": "chat | quiz",
  "profile": { "name": "…", "semester": 3, "gpa": 3.1, "grades": { "CSCI-1101": "C" } }
}
```

`profile` is omitted entirely when the user hasn't filled anything in, and
`gpa` is auto-calculated from the grades (credit-weighted). No `history`
array is sent — conversation memory lives server-side, keyed on `sessionId`.

---

## 4. Verifying the deployment

1. Open the Pages URL with the DevTools console open — there should be **no
   errors**.
2. Send a chat message. If the webhook is unreachable you'll get a friendly
   error bubble with a **Try again** button (and the offline tabs keep
   working) — that's the intended failure mode. Check that the n8n workflow
   is active and the CORS headers are set.
3. Quick end-to-end pass:
   - save a profile → refresh → it's still there
   - Analyzer ranks three fields with match bars
   - Quizzes: pick an uploaded subject → a 4-option quiz renders in-page;
     miss a question → the "resources & recommendations" button sends the
     mistakes to the advisor
   - chat: the failing-course flow, a quiz (submit → score → explanations →
     "Help me understand this"), and a resources reply
4. Check once at phone width (DevTools device mode, 360px) — the demo may be
   shown on a phone; the chat input sticks to the bottom there.

---

## 5. Troubleshooting

| Symptom | Likely cause & fix |
|---|---|
| 404 at the Pages URL | Pages not enabled yet, or wrong branch/folder selected — recheck Step 2; wait a minute after saving. |
| Site loads but looks unstyled | Asset paths were changed to absolute (`/css/…`). Keep them relative (`css/…`). |
| Chat shows "demo mode" in production | `?mock=1` left in the URL, or `WEBHOOK_URL` reverted to a placeholder. |
| 404 "webhook not registered" | Workflow not published in n8n — activate it; use the `/webhook/` production path, not `/webhook-test/`. |
| Chat error bubble on every message | Webhook URL wrong, workflow not active, or missing CORS headers on the n8n response. Test the webhook with `curl` first. |
| Quiz arrives as plain text | The agent returned the quiz as a string instead of the `type:"quiz"` envelope with valid quiz JSON — fix the agent's system prompt / Respond node. |
| Old version still showing after a push | GitHub Pages cache — hard-refresh (Ctrl/Cmd+Shift+R); deploys take ~1 minute. |
