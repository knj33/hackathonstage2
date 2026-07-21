// ── Student profile: form + localStorage ────────────────────────────
// Profile shape (matches the §5.1 request payload):
// { name: string, semester: number, gpa: number|null, grades: { "CSCI-1101": "B+" } }

const Profile = (() => {

  const KEY = "cu_profile";
  let els = {};

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // Profile for the chat payload; null when nothing meaningful is saved.
  function get() {
    const p = load();
    if (!p) return null;
    if (!p.name && !Object.keys(p.grades || {}).length) return null;
    return p;
  }

  function save(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }

  // ── grades grid ───────────────────────────────────────────────────

  function buildGradesGrid() {
    const grid = els.gradesGrid;
    grid.innerHTML = "";
    const bySem = {};
    CU_DATA.courses.forEach(c => (bySem[c.semester] = bySem[c.semester] || []).push(c));

    Object.keys(bySem).sort().forEach(sem => {
      const group = document.createElement("div");
      group.className = "grades-group";
      const h = document.createElement("h4");
      h.textContent = "Semester " + sem;
      group.appendChild(h);

      bySem[sem].forEach(course => {
        const row = document.createElement("div");
        row.className = "grade-row";

        const label = document.createElement("label");
        label.setAttribute("for", "grade-" + course.code);
        label.innerHTML = '<span class="grade-course">' + course.name +
          '</span><span class="grade-code">' + course.code + "</span>";

        const select = document.createElement("select");
        select.id = "grade-" + course.code;
        select.dataset.code = course.code;
        select.className = "grade-select";
        const none = document.createElement("option");
        none.value = ""; none.textContent = "—";
        select.appendChild(none);
        CU_DATA.gradeScale.forEach(g => {
          const opt = document.createElement("option");
          opt.value = g.letter; opt.textContent = g.letter;
          select.appendChild(opt);
        });

        row.appendChild(label);
        row.appendChild(select);
        group.appendChild(row);
      });
      grid.appendChild(group);
    });
  }

  function fillForm(profile) {
    els.name.value = profile && profile.name ? profile.name : "";
    els.semester.value = profile && profile.semester ? String(profile.semester) : "1";
    els.gpa.value = profile && profile.gpa != null ? profile.gpa : "";
    const grades = (profile && profile.grades) || {};
    els.gradesGrid.querySelectorAll("select").forEach(sel => {
      sel.value = grades[sel.dataset.code] || "";
    });
  }

  function readForm() {
    const grades = {};
    els.gradesGrid.querySelectorAll("select").forEach(sel => {
      if (sel.value) grades[sel.dataset.code] = sel.value;
    });
    const gpaRaw = els.gpa.value.trim();
    let gpa = gpaRaw === "" ? null : Math.min(4, Math.max(0, parseFloat(gpaRaw)));
    if (gpa !== null && isNaN(gpa)) gpa = null;
    return {
      name: els.name.value.trim(),
      semester: parseInt(els.semester.value, 10) || 1,
      gpa: gpa,
      grades: grades
    };
  }

  function flashStatus(text) {
    els.status.textContent = text;
    els.status.classList.add("visible");
    clearTimeout(flashStatus._t);
    flashStatus._t = setTimeout(() => els.status.classList.remove("visible"), 2200);
  }

  // ── quiz history display ──────────────────────────────────────────

  function renderQuizHistory() {
    const history = Quiz.getHistory();
    els.quizHistoryList.innerHTML = "";
    els.quizHistoryEmpty.hidden = history.length > 0;
    history.slice(-8).reverse().forEach(h => {
      const li = document.createElement("li");
      const pct = h.total ? Math.round((h.score / h.total) * 100) : 0;
      li.innerHTML =
        '<span class="qh-topic">' + escapeText(h.topic) + "</span>" +
        '<span class="qh-score' + (pct >= 60 ? " good" : "") + '">' + h.score + "/" + h.total + "</span>" +
        '<span class="qh-date">' + new Date(h.date).toLocaleDateString() + "</span>";
      els.quizHistoryList.appendChild(li);
    });
  }

  function escapeText(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  // ── init ──────────────────────────────────────────────────────────

  function init() {
    els = {
      form: document.getElementById("profileForm"),
      name: document.getElementById("pfName"),
      semester: document.getElementById("pfSemester"),
      gpa: document.getElementById("pfGpa"),
      gradesGrid: document.getElementById("gradesGrid"),
      status: document.getElementById("pfStatus"),
      clearBtn: document.getElementById("pfClear"),
      quizHistoryList: document.getElementById("quizHistoryList"),
      quizHistoryEmpty: document.getElementById("quizHistoryEmpty")
    };

    buildGradesGrid();
    fillForm(load());
    renderQuizHistory();

    els.form.addEventListener("submit", e => {
      e.preventDefault();
      save(readForm());
      flashStatus("Saved ✓");
      Analyzer.render();
    });

    els.clearBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY);
      fillForm(null);
      flashStatus("Cleared");
      Analyzer.render();
    });
  }

  return { init, get, renderQuizHistory };
})();
