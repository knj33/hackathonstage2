// ── CU Academic Advisor — configuration ─────────────────────────────
// Paste the live n8n webhook URL here when the workflow is published.
// While the URL still contains "REPLACE_ME" the app runs in mock mode:
// chat replies come from js/mock.js so the whole UI is demoable offline.

const WEBHOOK_URL = "https://svanetisubanirobotics.app.n8n.cloud/webhook/REPLACE_ME";

// n8n-hosted upload form for professors (lecture slides / syllabi).
// Paste the form URL when available; linked from the site footer.
const STAFF_UPLOAD_URL = "https://svanetisubanirobotics.app.n8n.cloud/form/REPLACE_ME";

const REQUEST_TIMEOUT_MS = 30000;

const MOCK_MODE = WEBHOOK_URL.indexOf("REPLACE_ME") !== -1;
