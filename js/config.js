// ── CU Academic Advisor — configuration ─────────────────────────────
// Live n8n Cloud endpoints ("CU Academic Advisor (Web)" workflow for chat,
// "CU Materials Ingestion" form for staff uploads). Both must be published
// in n8n for the URLs to respond; until then the chat shows a friendly
// offline error.

const WEBHOOK_URL = "https://svanetisubanirobotics.app.n8n.cloud/webhook/cu-advisor-chat";

// n8n-hosted upload form for professors (lecture slides / syllabi).
// Plain link, opened in a new tab — never embedded or POSTed to.
const STAFF_UPLOAD_URL = "https://svanetisubanirobotics.app.n8n.cloud/form/cu-upload-materials";

// The agent may call tools + web search; typical replies take 5–15 s.
const REQUEST_TIMEOUT_MS = 60000;

// Mock mode (canned replies from js/mock.js, no network):
// active while WEBHOOK_URL is a placeholder, or forced with ?mock=1 —
// cheap insurance for offline demos.
const MOCK_MODE = WEBHOOK_URL.indexOf("REPLACE_ME") !== -1 ||
  new URLSearchParams(window.location.search).get("mock") === "1";
