// ── Student profile: form + localStorage ────────────────────────────
// Profile shape (matches the webhook request payload):
// { name: string, semester: number, gpa: number|null, grades: { "CSCI-1101": "B+" } }
// GPA is never entered by hand — it's the credit-weighted average of the
// grades below, recomputed live and stored read-only.

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
    p.gpa = computeGpa(p.grades || {});   // always derived, never stale
    return p;
  }

  // Credit-weighted GPA over graded courses; null when nothing is graded.
  function computeGpa(grades) {
    let points = 0, credits = 0;
    Object.keys(grades).forEach(code => {
      const course = CU.courseByCode(code);
      const pts = CU.gradePoints(grades[code]);
      if (!course || pts === null) return;
      points += pts * course.credits;
      credits += course.credits;
    });
    return credits > 0 ? Math.round((points / credits) * 100) / 100 : null;
  }

  function readGridGrades() {
    const grades = {};
    els.gradesGrid.querySelectorAll("select").forEach(sel => {
      if (sel.value) grades[sel.dataset.code] = sel.value;
    });
    return grades;
  }

  function updateGpaDisplay() {
    const gpa = computeGpa(readGridGrades());
    els.gpa.value = gpa === null ? "—" : gpa.toFixed(2);
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
    const grades = (profile && profile.grades) || {};
    els.gradesGrid.querySelectorAll("select").forEach(sel => {
      sel.value = grades[sel.dataset.code] || "";
    });
    updateGpaDisplay();
  }

  function readForm() {
    const grades = readGridGrades();
    return {
      name: els.name.value.trim(),
      semester: parseInt(els.semester.value, 10) || 1,
      gpa: computeGpa(grades),
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

    // GPA reacts to every grade change, before saving.
    els.gradesGrid.addEventListener("change", updateGpaDisplay);

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
