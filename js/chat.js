// ── Chat: UI + webhook client + session memory ──────────────────────
// Implements the live n8n contract:
//   POST { sessionId, message, mode, profile? } → envelope
//   { type: "text" | "quiz" | "resources", ... }
// Conversation memory lives server-side, keyed on sessionId — no history
// array is sent. Falls back to MockAgent in mock mode (see config.js).

const Chat = (() => {

  let els = {};
  let busy = false;
  let lastPayload = null;  // kept for the retry button
  let chipsUsed = false;

  // ── session id ────────────────────────────────────────────────────

  function newUuid() {
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : "s-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function sessionId() {
    let id = localStorage.getItem("cu_session_id");
    if (!id) {
      id = newUuid();
      localStorage.setItem("cu_session_id", id);
    }
    return id;
  }

  // Fresh server-side conversation: new UUID, same browser.
  function rotateSession() {
    localStorage.setItem("cu_session_id", newUuid());
  }

  // ── tiny markdown renderer (escape first, then format) ────────────

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function renderInline(text) {
    const tokens = [];
    const stash = html => { tokens.push(html); return "\x00" + (tokens.length - 1) + "\x00"; };

    let out = text;
    // code spans first so their contents are never re-formatted
    out = out.replace(/`([^`]+)`/g, (_, code) => stash("<code>" + code + "</code>"));
    // markdown links (http/https only — input is already entity-escaped)
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, label, url) => stash('<a href="' + url + '" target="_blank" rel="noopener">' + label + "</a>"));
    // bare urls
    out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      (_, pre, url) => pre + stash('<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>"));
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    // restore stashed tokens
    out = out.replace(/\x00(\d+)\x00/g, (_, i) => tokens[+i]);
    return out;
  }

  function renderMarkdown(md) {
    const lines = escapeHtml(md).split(/\r?\n/);
    let html = "", list = null, para = [];

    const flushPara = () => {
      if (para.length) { html += "<p>" + para.map(renderInline).join("<br>") + "</p>"; para = []; }
    };
    const flushList = () => {
      if (list) { html += "<" + list.tag + ">" + list.items.map(i => "<li>" + renderInline(i) + "</li>").join("") + "</" + list.tag + ">"; list = null; }
    };

    lines.forEach(line => {
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (h) {
        flushPara(); flushList();
        const level = Math.min(h[1].length + 3, 5); // #→h4, ##→h5 inside bubbles
        html += "<h" + level + ">" + renderInline(h[2]) + "</h" + level + ">";
      } else if (ul) {
        flushPara();
        if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; }
        list.items.push(ul[1]);
      } else if (ol) {
        flushPara();
        if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; }
        list.items.push(ol[1]);
      } else if (line.trim() === "") {
        flushPara(); flushList();
      } else {
        flushList();
        para.push(line);
      }
    });
    flushPara(); flushList();
    return html;
  }

  // ── message rendering ─────────────────────────────────────────────

  function addBubble(role, node) {
    const wrap = document.createElement("div");
    wrap.className = "msg " + role;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (typeof node === "string") bubble.innerHTML = node;
    else bubble.appendChild(node);
    wrap.appendChild(bubble);
    els.messages.appendChild(wrap);
    scrollDown();
    return bubble;
  }

  function addAssistantMarkdown(md) {
    return addBubble("assistant", renderMarkdown(md));
  }

  function scrollDown() {
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "msg assistant typing-msg";
    el.innerHTML = '<div class="bubble typing" aria-label="მრჩეველი წერს">' +
      "<span></span><span></span><span></span></div>";
    els.messages.appendChild(el);
    scrollDown();
    return el;
  }

  function renderResources(data) {
    const container = document.createElement("div");
    if (data.content) container.innerHTML = renderMarkdown(data.content);
    const list = document.createElement("div");
    list.className = "resource-list";
    (data.resources || []).forEach(r => {
      if (!r || !r.title) return;
      const item = document.createElement("a");
      item.className = "resource-item";
      const url = typeof r.url === "string" && /^https?:\/\//.test(r.url) ? r.url : "#";
      item.href = url;
      item.target = "_blank";
      item.rel = "noopener";
      item.innerHTML =
        '<span class="res-top"><span class="res-title">' + escapeHtml(r.title) + "</span>" +
        '<span class="res-badge ' + (r.free ? "free" : "paid") + '">' + (r.free ? "FREE" : "PAID") + "</span></span>" +
        (r.source ? '<span class="res-source">' + escapeHtml(r.source) + "</span>" : "") +
        (r.note ? '<span class="res-note">' + escapeHtml(r.note) + "</span>" : "");
      list.appendChild(item);
    });
    container.appendChild(list);
    addBubble("assistant", container);
  }

  // Envelope dispatch (§5.2) with graceful fallback to raw text.
  function handleResponse(data) {
    if (data && data.type === "text" && typeof data.content === "string") {
      addAssistantMarkdown(data.content);
    } else if (data && data.type === "quiz" && Quiz.isValid(data.quiz)) {
      const container = document.createElement("div");
      if (data.content) container.innerHTML = renderMarkdown(data.content);
      container.appendChild(Quiz.render(data.quiz));
      addBubble("assistant", container);
    } else if (data && data.type === "resources" && Array.isArray(data.resources)) {
      renderResources(data);
    } else {
      // Unknown/missing fields → show whatever we can as raw text.
      const text = typeof data === "string" ? data
        : (data && (data.content || data.output || data.text)) || JSON.stringify(data);
      addAssistantMarkdown(String(text));
    }
  }

  function showError(message) {
    const container = document.createElement("div");
    container.innerHTML =
      "<p><strong>" + escapeHtml(message) + "</strong></p>" +
      "<p>ამასობაში <em>პროფილი</em> და <em>ანალიზატორი</em> ინტერნეტის გარეშეც მუშაობს.</p>";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn secondary";
    retry.textContent = "სცადე თავიდან";
    retry.addEventListener("click", () => {
      retry.disabled = true;
      resend();
    });
    container.appendChild(retry);
    const bubble = addBubble("assistant", container);
    bubble.classList.add("error-bubble");
  }

  // ── network ───────────────────────────────────────────────────────

  async function callWebhook(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const raw = await res.text();
      try { return JSON.parse(raw); } catch (e) { return raw; }
    } finally {
      clearTimeout(timer);
    }
  }

  async function dispatch(payload) {
    busy = true;
    els.sendBtn.disabled = true;
    const typing = showTyping();
    try {
      const data = MOCK_MODE
        ? await MockAgent.respond(payload)
        : await callWebhook(payload);
      typing.remove();
      handleResponse(data);
    } catch (err) {
      typing.remove();
      showError(err.name === "AbortError"
        ? "მრჩეველმა პასუხს ძალიან დიდი დრო მოანდომა (60 წმ)."
        : "მრჩეველთან დაკავშირება ვერ ხერხდება.");
    } finally {
      busy = false;
      els.sendBtn.disabled = false;
    }
  }

  function buildPayload(message, mode) {
    const payload = { sessionId: sessionId(), message: message, mode: mode };
    const profile = Profile.get();
    if (profile) payload.profile = profile;   // omit entirely when empty
    return payload;
  }

  // Public entry point — used by the form, chips, analyzer and quiz.
  function send(message, opts) {
    if (busy || !message || !message.trim()) return;
    const text = message.trim();
    const mode = (opts && opts.mode) ||
      (/\bquiz\b|test me|ქვიზ|გამომეცად|გამომცად/i.test(text) ? "quiz" : "chat");

    addBubble("user", escapeHtml(text));
    hideChips();

    const payload = buildPayload(text, mode);
    lastPayload = payload;
    dispatch(payload);
  }

  function resend() {
    if (busy || !lastPayload) return;
    dispatch(lastPayload);
  }

  // Backend round-trip that bypasses the chat thread — same payload,
  // same mock/live switch. The Quizzes section uses this to fetch a
  // grounded quiz and render it in its own panel.
  function request(message, opts) {
    const payload = buildPayload(message.trim(), (opts && opts.mode) || "chat");
    return MOCK_MODE ? MockAgent.respond(payload) : callWebhook(payload);
  }

  // ── chips & form ──────────────────────────────────────────────────

  const CHIPS = [
    { icon: "📚", label: "გამომეცადე ამ კვირის ლექციაზე", message: "მომეცი ქვიზი ამ კვირის სალექციო მასალაზე", mode: "quiz" },
    { icon: "📉", label: "კურსში მიჭირს", message: "ერთ-ერთ კურსში მიჭირს" },
    { icon: "🌍", label: "სწავლა საზღვარგარეთ", message: "მინდა ინფორმაცია საზღვარგარეთ სწავლასა და გაცვლით პროგრამებზე" },
    { icon: "🗓", label: "დამიგეგმე სემესტრი", message: "დამეხმარე შემდეგი სემესტრის დაგეგმვაში" }
  ];

  function buildChips() {
    CHIPS.forEach(chip => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.innerHTML = '<span aria-hidden="true">' + chip.icon + "</span> " + escapeHtml(chip.label);
      btn.addEventListener("click", () => send(chip.message, { mode: chip.mode || "chat" }));
      els.chips.appendChild(btn);
    });
  }

  function hideChips() {
    if (chipsUsed) return;
    chipsUsed = true;
    els.chips.classList.add("hidden");
    setTimeout(() => { els.chips.hidden = true; }, 250);
  }

  function showChips() {
    chipsUsed = false;
    els.chips.hidden = false;
    els.chips.classList.remove("hidden");
  }

  // "New chat": fresh sessionId (fresh server-side memory), clean thread.
  function newChat() {
    if (busy) return;
    rotateSession();
    lastPayload = null;
    els.messages.innerHTML = "";
    showChips();
    welcome();
    els.input.focus();
  }

  function welcome() {
    const name = (Profile.get() || {}).name;
    const md =
      "გამარჯობა" + (name ? ", **" + name.split(/\s+/)[0] + "**" : "") + "! 👋 მე ვარ შენი **CU ECE მრჩეველი**. " +
      "მკითხე კურსებზე, წინაპირობებზე, პროფესორებზე, სასწავლო რესურსებსა თუ საზღვარგარეთ სწავლაზე — " +
      "ან აირჩიე სწრაფი მოქმედება ქვემოთ.";
    addAssistantMarkdown(md);
  }

  function init() {
    els = {
      messages: document.getElementById("chatMessages"),
      form: document.getElementById("chatForm"),
      input: document.getElementById("chatInput"),
      sendBtn: document.getElementById("chatSend"),
      chips: document.getElementById("chatChips"),
      modeBadge: document.getElementById("chatModeBadge"),
      newBtn: document.getElementById("chatNewBtn")
    };

    if (MOCK_MODE) els.modeBadge.hidden = false;

    buildChips();
    welcome();

    els.newBtn.addEventListener("click", newChat);

    els.form.addEventListener("submit", e => {
      e.preventDefault();
      const text = els.input.value;
      if (!text.trim()) return;
      els.input.value = "";
      send(text);
      els.input.focus();
    });
  }

  return { init, send, request };
})();
