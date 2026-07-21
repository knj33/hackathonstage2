// ── Semester planner: prerequisite engine, fully client-side ────────
// Tick completed courses → see eligible courses, blocked courses (with
// the missing prerequisites named), and a suggested ~30-credit schedule.

const Planner = (() => {

  const KEY = "cu_planner_completed";
  let els = {};

  function loadCompleted() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveCompleted(codes) {
    localStorage.setItem(KEY, JSON.stringify(codes));
  }

  function getChecked() {
    return Array.from(els.courseList.querySelectorAll("input:checked")).map(cb => cb.value);
  }

  // How many later courses list this one as a direct prerequisite.
  function unlockCount(code) {
    return CU_DATA.courses.filter(c => c.prerequisites.indexOf(code) !== -1).length;
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  // ── course checklist ──────────────────────────────────────────────

  function buildChecklist() {
    els.courseList.innerHTML = "";
    const bySem = {};
    CU_DATA.courses.forEach(c => (bySem[c.semester] = bySem[c.semester] || []).push(c));
    Object.keys(bySem).sort().forEach(sem => {
      const group = document.createElement("fieldset");
      group.className = "planner-group";
      const legend = document.createElement("legend");
      legend.textContent = "Semester " + sem;
      group.appendChild(legend);

      // Per-semester materials tools: upload syllabi/slides through the
      // n8n staff portal (opens in a new tab — never embedded), then ask
      // the advisor for a quiz grounded in what was uploaded.
      const tools = document.createElement("div");
      tools.className = "sem-tools";
      const upload = document.createElement("a");
      upload.className = "sem-tool";
      upload.href = STAFF_UPLOAD_URL;
      upload.target = "_blank";
      upload.rel = "noopener";
      upload.textContent = "📄 Upload syllabi";
      upload.title = "Opens the staff upload portal — the advisor parses the file and can quiz you on the real material";
      const quizBtn = document.createElement("button");
      quizBtn.type = "button";
      quizBtn.className = "sem-tool";
      quizBtn.textContent = "🎯 Quiz from uploads";
      quizBtn.title = "Ask the advisor for a quiz grounded in the uploaded materials for these courses";
      const semCourses = bySem[sem].map(c => c.name + " (" + c.code + ")").join(", ");
      quizBtn.addEventListener("click", () => {
        App.showTab("advisor");
        Chat.send(
          "Give me a quiz based on the uploaded lecture materials for my semester " + sem +
          " courses: " + semCourses + ".",
          { mode: "quiz" }
        );
      });
      tools.appendChild(upload);
      tools.appendChild(quizBtn);
      group.appendChild(tools);

      bySem[sem].forEach(course => {
        const id = "done-" + course.code;
        const row = document.createElement("div");
        row.className = "check-row";
        row.innerHTML =
          '<input type="checkbox" id="' + id + '" value="' + course.code + '">' +
          '<label for="' + id + '"><span class="grade-course">' + esc(course.name) +
          '</span><span class="grade-code">' + course.code + "</span></label>";
        group.appendChild(row);
      });
      els.courseList.appendChild(group);
    });

    els.courseList.addEventListener("change", () => {
      saveCompleted(getChecked());
      render();
    });
  }

  function setChecked(codes) {
    els.courseList.querySelectorAll("input").forEach(cb => {
      cb.checked = codes.indexOf(cb.value) !== -1;
    });
  }

  // ── engine ────────────────────────────────────────────────────────

  function evaluate(completed) {
    const done = new Set(completed);
    const eligible = [], blocked = [];
    CU_DATA.courses.forEach(course => {
      if (done.has(course.code)) return;
      const missing = course.prerequisites.filter(p => !done.has(p));
      if (missing.length === 0) eligible.push(course);
      else blocked.push({ course, missing });
    });
    return { eligible, blocked };
  }

  // Balanced pick: foundational first (semester asc), then courses that
  // unlock the most future courses; cap around 30–31 credits.
  function suggestSchedule(eligible) {
    const sorted = eligible.slice().sort((a, b) =>
      a.semester - b.semester ||
      unlockCount(b.code) - unlockCount(a.code) ||
      b.credits - a.credits
    );
    const picked = [];
    let credits = 0;
    sorted.forEach(course => {
      if (credits + course.credits <= 31 && picked.length < 6) {
        picked.push(course);
        credits += course.credits;
      }
    });
    return { picked, credits };
  }

  // ── rendering ─────────────────────────────────────────────────────

  function courseLine(course, extraHtml) {
    const prof = CU.professorById(course.professorId);
    return (
      '<li class="course-line">' +
      '<div class="cl-main"><strong>' + esc(course.name) + "</strong>" +
      '<span class="grade-code">' + course.code + " · " + course.credits + " ECTS</span></div>" +
      '<div class="cl-sub">' + esc(prof ? prof.name : "") + (extraHtml || "") + "</div>" +
      "</li>"
    );
  }

  function render() {
    const completed = getChecked();
    const { eligible, blocked } = evaluate(completed);
    const { picked, credits } = suggestSchedule(eligible);
    let html = "";

    if (!completed.length) {
      html +=
        '<div class="card empty-card"><h3>Check what you can take next</h3>' +
        "<p>Tick the courses you've already passed — eligibility updates instantly. " +
        "Starting fresh? Every course with no prerequisites is already open to you below.</p></div>";
    }

    html += '<div class="card planner-card"><h3>✅ Eligible next semester <span class="count-badge">' +
      eligible.length + "</span></h3>";
    html += eligible.length
      ? '<ul class="course-list">' + eligible.map(c => {
          const n = unlockCount(c.code);
          return courseLine(c, n ? '<span class="unlock-note">unlocks ' + n + " course" + (n > 1 ? "s" : "") + "</span>" : "");
        }).join("") + "</ul>"
      : '<p class="empty">Nothing left — you\'ve completed the whole catalog. 🎓</p>';
    html += "</div>";

    html += '<div class="card planner-card"><h3>🔒 Still blocked <span class="count-badge">' +
      blocked.length + "</span></h3>";
    html += blocked.length
      ? '<ul class="course-list">' + blocked.map(b =>
          courseLine(b.course,
            '<span class="blocked-note">needs ' +
            b.missing.map(m => esc(CU.courseLabel(m))).join(", ") + "</span>")
        ).join("") + "</ul>"
      : '<p class="empty">Nothing is blocked — every remaining course is open to you.</p>';
    html += "</div>";

    if (picked.length) {
      html += '<div class="card planner-card suggested"><h3>🗓 Suggested schedule <span class="count-badge">' +
        credits + " ECTS</span></h3>" +
        '<p class="hint">Foundational courses and prerequisite-unlockers first, aiming for a ~30-credit load:</p>' +
        '<ul class="course-list">' + picked.map(c => {
          const n = unlockCount(c.code);
          return courseLine(c, n ? '<span class="unlock-note">unlocks ' + n + " course" + (n > 1 ? "s" : "") + "</span>" : "");
        }).join("") + "</ul></div>";
    }

    els.results.innerHTML = html;
  }

  // Mark courses passed in the profile (any grade except F) as completed.
  function importFromProfile() {
    const profile = Profile.get();
    const grades = (profile && profile.grades) || {};
    const passed = Object.keys(grades).filter(code => grades[code] !== "F");
    if (!passed.length) {
      els.importStatus.textContent = "No passed courses in your profile yet.";
    } else {
      setChecked(passed);
      saveCompleted(passed);
      els.importStatus.textContent = "Imported " + passed.length + " passed course" + (passed.length > 1 ? "s" : "") + ".";
      render();
    }
    els.importStatus.classList.add("visible");
    clearTimeout(importFromProfile._t);
    importFromProfile._t = setTimeout(() => els.importStatus.classList.remove("visible"), 2600);
  }

  function init() {
    els = {
      courseList: document.getElementById("plannerCourses"),
      results: document.getElementById("plannerResults"),
      importBtn: document.getElementById("plannerImport"),
      resetBtn: document.getElementById("plannerReset"),
      importStatus: document.getElementById("plannerImportStatus")
    };
    buildChecklist();
    setChecked(loadCompleted());
    els.importBtn.addEventListener("click", importFromProfile);
    els.resetBtn.addEventListener("click", () => {
      setChecked([]);
      saveCompleted([]);
      render();
    });
    render();
  }

  return { init, render };
})();
