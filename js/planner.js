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
      legend.textContent = "სემესტრი " + sem;
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
      upload.textContent = "📄 ატვირთე სილაბუსები";
      upload.title = "იხსნება პერსონალის ატვირთვის პორტალი — მრჩეველი ფაილს გაარჩევს და რეალურ მასალაზე გამოგცდის";
      const quizBtn = document.createElement("button");
      quizBtn.type = "button";
      quizBtn.className = "sem-tool";
      quizBtn.textContent = "🎯 ქვიზი ატვირთულიდან";
      quizBtn.title = "სთხოვე მრჩეველს ქვიზი ამ კურსების ატვირთულ მასალებზე დაყრდნობით";
      const semCourses = bySem[sem].map(c => CU.displayName(c) + " (" + c.code + ")").join(", ");
      quizBtn.addEventListener("click", () => {
        App.showTab("advisor");
        Chat.send(
          "მომეცი ქვიზი ატვირთული სალექციო მასალის მიხედვით სემესტრ " + sem +
          "-ის კურსებზე: " + semCourses + ".",
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
          '<label for="' + id + '"><span class="grade-course">' + esc(CU.displayName(course)) +
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
      '<div class="cl-main"><strong>' + esc(CU.displayName(course)) + "</strong>" +
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
        '<div class="card empty-card"><h3>მონიშნე ჩაბარებული კურსები</h3>' +
        "<p>მონიშნე მარცხნივ ის კურსები, რაც უკვე ჩააბარე — შედეგები მყისიერად განახლდება. " +
        "ახლა იწყებ? ყველა უწინაპირობო კურსი უკვე ღიაა ქვემოთ.</p></div>";
    }

    html += '<div class="card planner-card"><h3>✅ ხელმისაწვდომი შემდეგ სემესტრში <span class="count-badge">' +
      eligible.length + "</span></h3>";
    html += eligible.length
      ? '<ul class="course-list">' + eligible.map(c => {
          const n = unlockCount(c.code);
          return courseLine(c, n ? '<span class="unlock-note">ხსნის ' + n + ' კურსს</span>' : "");
        }).join("") + "</ul>"
      : '<p class="empty">აღარაფერი დარჩა — მთელი კატალოგი ჩაბარებული გაქვს. 🎓</p>';
    html += "</div>";

    html += '<div class="card planner-card"><h3>🔒 ჯერ დაბლოკილია <span class="count-badge">' +
      blocked.length + "</span></h3>";
    html += blocked.length
      ? '<ul class="course-list">' + blocked.map(b =>
          courseLine(b.course,
            '<span class="blocked-note">სჭირდება: ' +
            b.missing.map(m => esc(CU.courseLabel(m))).join(", ") + "</span>")
        ).join("") + "</ul>"
      : '<p class="empty">დაბლოკილი აღარაფერია — ყველა დარჩენილი კურსი ღიაა.</p>';
    html += "</div>";

    if (picked.length) {
      html += '<div class="card planner-card suggested"><h3>🗓 შემოთავაზებული განრიგი <span class="count-badge">' +
        credits + " ECTS</span></h3>" +
        '<p class="hint">ჯერ ფუნდამენტური და წინაპირობების გამხსნელი კურსები — სამიზნე დატვირთვა ~30 კრედიტი:</p>' +
        '<ul class="course-list">' + picked.map(c => {
          const n = unlockCount(c.code);
          return courseLine(c, n ? '<span class="unlock-note">ხსნის ' + n + ' კურსს</span>' : "");
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
      els.importStatus.textContent = "პროფილში ჩაბარებული კურსები ჯერ არ არის.";
    } else {
      setChecked(passed);
      saveCompleted(passed);
      els.importStatus.textContent = "ჩაიტვირთა " + passed.length + " ჩაბარებული კურსი.";
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
