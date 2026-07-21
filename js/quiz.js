// ── Quiz renderer: interactive quiz cards inside the chat stream ────
// Renders §5.3 quiz JSON: radio options → submit → score badge,
// green/red highlighting, explanations, and a "Help me understand this"
// button per wrong answer that round-trips back into the chat.

const Quiz = (() => {

  const HISTORY_KEY = "cu_quiz_history";
  let counter = 0;

  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveResult(topic, score, total) {
    const history = getHistory();
    history.push({ topic, score, total, date: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30)));
    if (typeof Profile !== "undefined") Profile.renderQuizHistory();
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  // Validate just enough of the §5.3 contract to render safely.
  function isValid(quiz) {
    return quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0 &&
      quiz.questions.every(q =>
        q && typeof q.question === "string" &&
        Array.isArray(q.options) && q.options.length >= 2 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 && q.correctIndex < q.options.length
      );
  }

  // Builds and returns the quiz card element (chat.js appends it).
  function render(quiz) {
    const uid = "quiz-" + (++counter);
    const card = document.createElement("div");
    card.className = "quiz-card";

    const head = document.createElement("div");
    head.className = "quiz-head";
    head.innerHTML =
      '<span class="quiz-title">📝 ' + esc(quiz.topic || "Quiz") + "</span>" +
      '<span class="quiz-score" hidden></span>';
    card.appendChild(head);

    const form = document.createElement("form");
    form.className = "quiz-form";
    form.noValidate = true;

    quiz.questions.forEach((q, qi) => {
      const fs = document.createElement("fieldset");
      fs.className = "quiz-question";
      fs.dataset.qi = qi;

      const legend = document.createElement("legend");
      legend.textContent = (qi + 1) + ". " + q.question;
      fs.appendChild(legend);

      q.options.forEach((opt, oi) => {
        const id = uid + "-q" + qi + "-o" + oi;
        const row = document.createElement("div");
        row.className = "quiz-option";
        row.innerHTML =
          '<input type="radio" name="' + uid + "-q" + qi + '" id="' + id + '" value="' + oi + '">' +
          '<label for="' + id + '">' + esc(opt) + "</label>";
        fs.appendChild(row);
      });

      const expl = document.createElement("p");
      expl.className = "quiz-explanation";
      expl.hidden = true;
      expl.textContent = q.explanation || "";
      fs.appendChild(expl);

      form.appendChild(fs);
    });

    const actions = document.createElement("div");
    actions.className = "quiz-actions";
    const note = document.createElement("span");
    note.className = "quiz-note";
    note.setAttribute("role", "status");
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn primary";
    submit.textContent = "Submit answers";
    actions.appendChild(submit);
    actions.appendChild(note);
    form.appendChild(actions);
    card.appendChild(form);

    form.addEventListener("submit", e => {
      e.preventDefault();
      grade(card, form, quiz, uid, note);
    });

    return card;
  }

  function grade(card, form, quiz, uid, note) {
    // Require every question answered (keeps scoring honest).
    const answers = quiz.questions.map((q, qi) => {
      const checked = form.querySelector('input[name="' + uid + "-q" + qi + '"]:checked');
      return checked ? parseInt(checked.value, 10) : null;
    });
    const firstUnanswered = answers.indexOf(null);
    if (firstUnanswered !== -1) {
      note.textContent = "Answer question " + (firstUnanswered + 1) + " first — all questions need an answer.";
      form.querySelectorAll(".quiz-question")[firstUnanswered]
        .scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    let score = 0;
    form.querySelectorAll(".quiz-question").forEach((fs, qi) => {
      const q = quiz.questions[qi];
      const chosen = answers[qi];
      const correct = chosen === q.correctIndex;
      if (correct) score++;

      fs.classList.add(correct ? "correct" : "incorrect");
      fs.querySelectorAll("input").forEach(inp => { inp.disabled = true; });
      const options = fs.querySelectorAll(".quiz-option");
      options[q.correctIndex].classList.add("is-correct");
      if (!correct) options[chosen].classList.add("is-wrong");

      const expl = fs.querySelector(".quiz-explanation");
      expl.hidden = false;

      if (!correct) {
        const help = document.createElement("button");
        help.type = "button";
        help.className = "btn secondary quiz-help";
        help.textContent = "Help me understand this";
        help.addEventListener("click", () => {
          // Explicit chat mode: the word "quiz" in this message must not
          // trigger quiz-mode detection and spawn another quiz.
          Chat.send(
            "I got this quiz question wrong: " + q.question +
            " I answered '" + q.options[chosen] + "'. Explain it to me.",
            { mode: "chat" }
          );
        });
        fs.appendChild(help);
      }
    });

    const scoreEl = card.querySelector(".quiz-score");
    scoreEl.textContent = score + "/" + quiz.questions.length;
    scoreEl.hidden = false;
    scoreEl.classList.add(score >= quiz.questions.length * 0.6 ? "pass" : "fail");

    note.textContent = score === quiz.questions.length
      ? "Perfect score — nice work! 🎉"
      : "Review the explanations below, or tap “Help me understand this” on any missed question.";

    form.querySelector('button[type="submit"]').hidden = true;
    saveResult(quiz.topic || "Quiz", score, quiz.questions.length);
  }

  return { render, isValid, getHistory };
})();
