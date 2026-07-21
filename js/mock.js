// ── Mock advisor brain ──────────────────────────────────────────────
// Active only while WEBHOOK_URL contains "REPLACE_ME" (see config.js).
// Fakes the n8n webhook so the full UI — including the multi-turn
// "I'm failing a course" flow, quiz cards and resource cards — is
// demoable with no network at all. Same response envelope as §5.2.

const MockAgent = (() => {

  // Multi-turn state for the failing-course flow.
  // awaiting: null | "course" | "component";  course: course object
  const state = { awaiting: null, course: null };

  const COMPONENT_WORDS = [
    { re: /\blabs?\b|laborator/i, key: "Labs" },
    { re: /\bquiz(zes)?\b/i, key: "Quizzes" },
    { re: /\bmid[- ]?terms?\b|\bexams?\b/i, key: "Midterm" },
    { re: /\bfinals?\b/i, key: "Final" },
    { re: /\bhome ?works?\b|problem sets?/i, key: "Homework" },
    { re: /\bprojects?\b/i, key: "Project" },
    { re: /\bessays?\b|writing/i, key: "Essays" },
    { re: /\bparticipation\b/i, key: "Participation" },
    { re: /matlab/i, key: "MATLAB labs" },
    { re: /presentation/i, key: "Presentation" }
  ];

  function findCourse(msg) {
    const m = msg.toLowerCase();
    return CU_DATA.courses.find(c =>
      m.includes(c.name.toLowerCase()) ||
      m.includes(c.code.toLowerCase()) ||
      m.includes(c.code.toLowerCase().replace("-", " "))
    ) || null;
  }

  function firstName(profile) {
    if (profile && profile.name) return profile.name.trim().split(/\s+/)[0];
    return null;
  }

  // ── canned replies ────────────────────────────────────────────────

  function componentsReply(course, profile) {
    const syl = CU_DATA.syllabi[course.code];
    const prof = CU.professorById(course.professorId);
    const name = firstName(profile);
    const lines = syl.components.map(c =>
      "- **" + c.name + " — " + c.weightPercent + "%**: " + c.description
    ).join("\n");
    const compNames = syl.components.map(c => c.name.toLowerCase()).join(", ");
    return {
      type: "text",
      content:
        (name ? "Sorry to hear that, " + name + ". " : "Sorry to hear that. ") +
        "Let's turn **" + course.name + "** around. Here's how the grade breaks down:\n\n" +
        lines + "\n\n" +
        "The passing threshold is **" + syl.passingThreshold + "/100**, and " +
        prof.name + " holds consultation hours " + prof.consultationHours + " (" + prof.office + ").\n\n" +
        "Which part is giving you the most trouble — " + compNames + "?"
    };
  }

  function componentResources(course, componentKey) {
    const weekEntry = CU_DATA.weeklyMaterials.find(w => w.courseCode === course.code);
    const resources = [];
    if (weekEntry) {
      weekEntry.materials.forEach(m => resources.push({
        title: m.title, url: m.url, source: m.source, free: m.free,
        note: m.free ? "Free — matches this week's topic (" + weekEntry.topic + ")"
                     : "Paid option if you want a structured, certificate-backed course"
      }));
    } else {
      resources.push(
        { title: "Khan Academy", url: "https://www.khanacademy.org/", source: "Khan Academy", free: true, note: "Free video lessons with practice" },
        { title: "MIT OpenCourseWare", url: "https://ocw.mit.edu/", source: "MIT OCW", free: true, note: "Full university courses, free" },
        { title: "Coursera", url: "https://www.coursera.org/", source: "Coursera", free: false, note: "Structured paid courses with certificates" }
      );
    }
    const syl = CU_DATA.syllabi[course.code];
    const comp = syl.components.find(c => c.name === componentKey);
    const weight = comp ? comp.weightPercent + "% of your grade" : "a big share of your grade";
    return {
      type: "resources",
      content:
        "Got it — **" + componentKey + "** (" + weight + ") is exactly where focused effort pays off fastest. My 3-step plan:\n\n" +
        "1. **Redo, don't reread** — re-attempt past " + componentKey.toLowerCase() + " from scratch before looking at solutions.\n" +
        "2. **20 minutes daily** beats one long weekend session — small, consistent practice.\n" +
        "3. **Go to consultation hours** with your 3 most confusing problems written down.\n\n" +
        "Here are resources matched to the course:",
      resources: resources
    };
  }

  function weeklyQuiz() {
    return {
      type: "quiz",
      content: "Here's a 5-question quiz on this week's Digital Logic lecture (week " + CU_DATA.currentWeek + "). Good luck! 🎯",
      quiz: {
        topic: "Digital Logic — Karnaugh Maps & Combinational Design (Week 10)",
        questions: [
          {
            id: 1,
            question: "What is the primary purpose of a Karnaugh map?",
            options: [
              "Converting binary numbers to decimal",
              "Simplifying Boolean expressions graphically",
              "Designing flip-flop timing diagrams",
              "Measuring gate propagation delay"
            ],
            correctIndex: 1,
            explanation: "A K-map arranges minterms so adjacent cells differ by one variable, letting you spot groupings that cancel variables and yield a minimal Boolean expression."
          },
          {
            id: 2,
            question: "How many cells does a 4-variable Karnaugh map contain?",
            options: ["4", "8", "16", "32"],
            correctIndex: 2,
            explanation: "A K-map has 2ⁿ cells for n variables — one per minterm. For 4 variables that's 2⁴ = 16 cells."
          },
          {
            id: 3,
            question: "Two adjacent cells in a K-map always differ in how many variable values?",
            options: ["Exactly one", "Exactly two", "At least two", "It depends on the map size"],
            correctIndex: 0,
            explanation: "K-maps use Gray code ordering, so neighboring cells differ in exactly one bit — that's what makes the variable cancel when you group them."
          },
          {
            id: 4,
            question: "Which group sizes are valid when circling 1s in a K-map?",
            options: [
              "Any even number of cells",
              "Only powers of two (1, 2, 4, 8, …)",
              "Any rectangle of cells",
              "Multiples of the variable count"
            ],
            correctIndex: 1,
            explanation: "Groups must be rectangles containing a power-of-two number of cells. A group of 2ᵏ cells eliminates k variables from the term."
          },
          {
            id: 5,
            question: "A group of 8 ones in a 4-variable K-map produces a term with how many literals?",
            options: ["4", "3", "2", "1"],
            correctIndex: 3,
            explanation: "8 = 2³, so the group eliminates 3 of the 4 variables — the resulting product term keeps only 4 − 3 = 1 literal."
          }
        ]
      }
    };
  }

  function weeklyResources() {
    const items = [];
    CU_DATA.weeklyMaterials.forEach(w => {
      const course = CU.courseByCode(w.courseCode);
      w.materials.slice(0, 2).forEach(m => items.push({
        title: m.title, url: m.url, source: m.source, free: m.free,
        note: course.name + " — " + w.topic
      }));
    });
    return {
      type: "resources",
      content: "Here's where to study **this week's lecture topics** (week " + CU_DATA.currentWeek + "). Ask me for more on any single course, or say *\"quiz me\"* to test yourself:",
      resources: items
    };
  }

  function foreignAdmissions(profile) {
    const name = firstName(profile);
    return {
      type: "text",
      content:
        (name ? name + ", great" : "Great") + " that you're thinking ahead! For ECE students the main routes abroad are:\n\n" +
        "- **Erasmus+ exchange** — CU has partner universities in the EU; one funded semester abroad. Applications usually open in **March and October** at the International Relations Office.\n" +
        "- **Master's abroad** — strong options for ECE: Germany (often tuition-free, [DAAD database](https://www.daad.de/en/)), plus Erasmus Mundus joint programs.\n" +
        "- **What you'll need**: transcript (GPA ≥ 3.0 is competitive), **IELTS 6.5+ / TOEFL 90+**, motivation letter, and 2 recommendation letters — professors you visit at consultation hours are the ones who write the good ones. 😉\n\n" +
        "Want me to suggest a semester-by-semester preparation timeline?"
    };
  }

  function plannerHint(profile) {
    const name = firstName(profile);
    return {
      type: "text",
      content:
        (name ? "Sure, " + name + "! " : "Sure! ") +
        "The fastest way: open the **Planner** tab, tick the courses you've already passed, and it will instantly show what you're eligible for next semester, what's still blocked (and by which prerequisite), plus a suggested ~30-credit schedule.\n\n" +
        "A good CU ECE semester balances:\n" +
        "- 2 **core technical** courses (they chain into later prerequisites — don't delay these)\n" +
        "- 1–2 **math** courses\n" +
        "- 1 lighter **general** course\n\n" +
        "Tell me which courses you've completed and I can reason about it with you here, too."
    };
  }

  function defaultReply(profile) {
    const name = firstName(profile);
    return {
      type: "text",
      content:
        (name ? "Hi " + name + "! " : "") +
        "I can help you with:\n\n" +
        "- **Courses & syllabi** — components, weights, textbooks, passing thresholds\n" +
        "- **Struggling in a course?** Tell me which one (e.g. *\"I'm failing CompSci Basics 1\"*) and we'll make a plan\n" +
        "- **This week's lecture materials** — ask *\"what should I study this week?\"*\n" +
        "- **Quizzes** — say *\"quiz me on this week's lecture\"*\n" +
        "- **Professors** — offices, emails, consultation hours\n" +
        "- **Foreign admissions** — exchanges and master's abroad\n\n" +
        "What would you like to look at?"
    };
  }

  function professorReply(msg) {
    const m = msg.toLowerCase();
    const prof = CU_DATA.professors.find(p => m.includes(p.name.toLowerCase().split(" ")[1]));
    const course = findCourse(msg);
    const target = prof || (course ? CU.professorById(course.professorId) : null);
    if (!target) return null;
    const courses = target.courses.map(c => CU.courseLabel(c)).join(", ");
    return {
      type: "text",
      content:
        "**" + target.name + "** — " + target.title + "\n\n" +
        "- Teaches: " + courses + "\n" +
        "- Office: " + target.office + "\n" +
        "- Consultation hours: **" + target.consultationHours + "**\n" +
        "- Email: " + target.email + "\n\n" +
        "Consultation hours are underused — going with prepared questions is the single highest-impact study habit."
    };
  }

  // ── main dispatcher ───────────────────────────────────────────────

  function reply(payload) {
    const msg = (payload.message || "").trim();
    const profile = payload.profile;
    // The frontend always sends an explicit mode (it detects "quiz me" in
    // free text itself), so the mode field alone decides here.
    const isQuizIntent = payload.mode === "quiz";

    if (/quiz question wrong/i.test(msg)) {
      return {
        type: "text",
        content:
          "Good instinct to dig into it! The key idea: **groups in a K-map must be power-of-two rectangles**, " +
          "because each doubling of the group removes exactly one variable from the term.\n\n" +
          "- A group of 2 cells → 1 variable eliminated\n" +
          "- 4 cells → 2 eliminated\n" +
          "- 8 cells → 3 eliminated\n\n" +
          "Re-read the question with that rule in mind — and try re-taking the quiz to lock it in. 💪"
      };
    }

    // Continue the failing-course flow (unless the user pivots to a quiz).
    if (!(payload.mode === "quiz") && state.awaiting === "component" && state.course) {
      const hit = COMPONENT_WORDS.find(cw => cw.re.test(msg));
      if (hit) {
        const course = state.course;
        state.awaiting = null; state.course = null;
        return componentResources(course, hit.key);
      }
    }
    if (state.awaiting === "course") {
      const course = findCourse(msg);
      if (course) {
        state.course = course;
        state.awaiting = "component";
        return componentsReply(course, profile);
      }
    }

    if (isQuizIntent) {
      state.awaiting = null; state.course = null;
      return weeklyQuiz();
    }

    if (/fail(ing)?|struggl|hard time|behind in|losing|bad grade|might not pass/i.test(msg)) {
      const course = findCourse(msg);
      if (course) {
        state.course = course;
        state.awaiting = "component";
        return componentsReply(course, profile);
      }
      state.awaiting = "course";
      return {
        type: "text",
        content:
          "I can definitely help with that. **Which course** is giving you trouble?\n\n" +
          "You can say the name or the code — e.g. *\"CompSci Basics 1\"* or *\"MATH-1101\"*."
      };
    }

    if (/professor|consultation|office hour|email of/i.test(msg)) {
      const r = professorReply(msg);
      if (r) return r;
    }

    if (/this week|week'?s (topic|lecture|material)|week 10|resources|materials|what should i study/i.test(msg)) {
      return weeklyResources();
    }

    if (/foreign|abroad|exchange|erasmus|master'?s|admission/i.test(msg)) {
      return foreignAdmissions(profile);
    }

    if (/plan (my|the|next)|semester plan|which courses (can|should)|eligible/i.test(msg)) {
      return plannerHint(profile);
    }

    // Course info question ("tell me about Digital Logic")
    const course = findCourse(msg);
    if (course) {
      state.course = course;
      state.awaiting = "component";
      return componentsReply(course, profile);
    }

    return defaultReply(profile);
  }

  // Public API mirrors fetch: resolves after a short "thinking" delay.
  function respond(payload) {
    return new Promise(resolve => {
      const delay = 700 + Math.random() * 700;
      setTimeout(() => resolve(reply(payload)), delay);
    });
  }

  return { respond };
})();
