// ── App shell: tab navigation + module init ─────────────────────────

const App = (() => {

  const TABS = ["advisor", "profile", "analyzer", "planner"];

  function showTab(name) {
    if (TABS.indexOf(name) === -1) name = "advisor";
    TABS.forEach(t => {
      const tab = document.getElementById("tab-" + t);
      const panel = document.getElementById("panel-" + t);
      const active = t === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
    // Re-render data-driven tabs so they always reflect the latest profile.
    if (name === "analyzer") Analyzer.render();
    if (name === "planner") Planner.render();
  }

  function initTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    TABS.forEach(t => {
      document.getElementById("tab-" + t)
        .addEventListener("click", () => showTab(t));
    });
    // Left/right arrow keys move between tabs (a11y).
    tablist.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const current = TABS.findIndex(t =>
        document.getElementById("tab-" + t).classList.contains("active"));
      const next = (current + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
      showTab(TABS[next]);
      document.getElementById("tab-" + TABS[next]).focus();
    });
  }

  function init() {
    initTabs();
    Profile.init();
    Quiz.getHistory();
    Chat.init();
    Analyzer.init();
    Planner.init();
    document.getElementById("staffPortalLink").href = STAFF_UPLOAD_URL;
    showTab("advisor");
  }

  document.addEventListener("DOMContentLoaded", init);

  return { showTab };
})();
