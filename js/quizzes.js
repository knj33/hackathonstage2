// ── Quizzes section: grounded quizzes per uploaded subject ──────────
// Lists ONLY the courses that have lecture material / syllabi uploaded
// (the weeklyMaterials dataset mirrors the backend's lecture_content
// uploads). Picking a subject asks the agent for a grounded quiz and
// renders it in this panel; after grading, missed questions can be sent
// to the advisor to look up resources and recommend what to focus on.

const Quizzes = (() => {

  let els = {};
  let busy = false;

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  function subjects() {
    return CU_DATA.weeklyMaterials
      .map(w => ({ week: w, course: CU.courseByCode(w.courseCode) }))
      .filter(s => s.course);
  }

  // ── subject list (uploaded-material courses only) ─────────────────

  function buildSubjectList() {
    els.subjects.innerHTML = "";
    subjects().forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subject-card";
      btn.innerHTML =
        '<span class="subject-name">' + esc(CU.displayName(s.course)) + "</span>" +
        '<span class="grade-code">' + s.course.code + "</span>" +
        '<span class="subject-topic">კვირა ' + s.week.week + " · " + esc(s.week.topic) + "</span>" +
        '<span class="subject-cta">▶ დაიწყე ქვიზი</span>';
      btn.addEventListener("click", () => start(s, btn));
      els.subjects.appendChild(btn);
    });
  }

  function setActive(btn) {
    els.subjects.querySelectorAll(".subject-card").forEach(b =>
      b.classList.toggle("active", b === btn));
  }

  // ── stage states ──────────────────────────────────────────────────

  function emptyStage() {
    els.stage.innerHTML =
      '<div class="card empty-card"><h3>აირჩიე საგანი</h3>' +
      "<p>ქვიზები დგება მხოლოდ იმ საგნებზე, რომლებზეც ლექციის მასალა ან სილაბუსია ატვირთული. " +
      'ვერ ხედავ შენს საგანს? მასალის ატვირთვა ხდება <a href="' + STAFF_UPLOAD_URL +
      '" target="_blank" rel="noopener">პერსონალის პორტალიდან</a>.</p></div>';
  }

  function showLoading(course) {
    els.stage.innerHTML =
      '<div class="card quiz-loading">' +
      '<div class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></div>' +
      "<p>მრჩეველი ადგენს ქვიზს კურსზე „" + esc(CU.displayName(course)) + "“…</p></div>";
  }

  function showError(message, entry, btn) {
    els.stage.innerHTML =
      '<div class="card stage-error"><p><strong>' + esc(message) + "</strong></p></div>";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn secondary";
    retry.textContent = "სცადე თავიდან";
    retry.addEventListener("click", () => start(entry, btn));
    els.stage.querySelector(".stage-error").appendChild(retry);
  }

  // ── quiz round-trip ───────────────────────────────────────────────

  async function start(entry, btn) {
    if (busy) return;
    busy = true;
    setActive(btn);
    showLoading(entry.course);
    const msg =
      "მომეცი ქვიზი კურსზე " + CU.displayName(entry.course) + " (" + entry.course.code +
      ") ატვირთული სალექციო მასალის მიხედვით. თემა: " + entry.week.topic +
      " (კვირა " + entry.week.week + ").";
    try {
      const data = await Chat.request(msg, { mode: "quiz" });
      busy = false;
      if (data && data.type === "quiz" && Quiz.isValid(data.quiz)) {
        renderQuiz(data);
      } else if (data && typeof data.content === "string") {
        // Agent fell back to text (e.g. explaining nothing is uploaded).
        els.stage.innerHTML = '<div class="card"><p>' + esc(data.content) + "</p></div>";
      } else {
        showError("ქვიზი ვერ შედგა — სცადე თავიდან.", entry, btn);
      }
    } catch (err) {
      busy = false;
      showError(err.name === "AbortError"
        ? "მრჩეველმა პასუხს ძალიან დიდი დრო მოანდომა (60 წმ)."
        : "მრჩეველთან დაკავშირება ვერ ხერხდება — ქვიზის შედგენას ინტერნეტი სჭირდება.",
        entry, btn);
    }
  }

  function renderQuiz(data) {
    els.stage.innerHTML = "";
    if (data.content) {
      const intro = document.createElement("p");
      intro.className = "quiz-intro";
      intro.textContent = data.content;
      els.stage.appendChild(intro);
    }
    const card = Quiz.render(data.quiz, {
      onGraded: result => afterGrade(data.quiz, result)
    });
    els.stage.appendChild(card);
    els.stage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // After grading: send the mistakes to the advisor for resources and
  // focus recommendations (the "what should I work on" round-trip).
  function afterGrade(quiz, result) {
    const wrap = document.createElement("div");
    wrap.className = "quiz-followup";

    if (result.wrong.length) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn primary";
      btn.id = "quizRecsBtn";
      btn.textContent = "🔍 რესურსები და რჩევები ჩემს შეცდომებზე";
      btn.addEventListener("click", () => {
        const mistakes = result.wrong.map((w, i) =>
          (i + 1) + ") „" + w.question + "“ — ჩემი პასუხი: „" + w.chosen +
          "“, სწორი: „" + w.correct + "“").join("; ");
        App.showTab("advisor");
        Chat.send(
          "ახლახან გავიარე ქვიზი თემაზე „" + (quiz.topic || "") + "“ — შედეგი " +
          result.score + "/" + result.total + ". შემეშალა: " + mistakes +
          ". მოძებნე სასწავლო რესურსები ამ თემებზე და მირჩიე, რაზე გავამახვილო ყურადღება მეტად.",
          { mode: "chat" }
        );
      });
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "მრჩეველი მოძებნის მასალებს შენს შეცდომებზე და გირჩევს, რაზე იმუშაო.";
      wrap.appendChild(btn);
      wrap.appendChild(hint);
    } else {
      const p = document.createElement("p");
      p.className = "quiz-perfect";
      p.textContent = "ყველა პასუხი სწორია! 🎉 სცადე სხვა საგანიც.";
      wrap.appendChild(p);
    }

    els.stage.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function init() {
    els = {
      subjects: document.getElementById("quizSubjects"),
      stage: document.getElementById("quizStage")
    };
    buildSubjectList();
    emptyStage();
  }

  return { init };
})();
