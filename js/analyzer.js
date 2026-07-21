// ── Strength analyzer: rule-based, fully client-side ───────────────
// Grades → 0–4 average per category → weight-dot-product per ECE field
// (only over categories that have data) → normalized % match → top 3.

const Analyzer = (() => {

  let mount = null;

  // { programming: 3.5, math: 2.0, ... } — only categories with grades.
  function categoryAverages(grades) {
    const sums = {}, counts = {};
    Object.keys(grades).forEach(code => {
      const course = CU.courseByCode(code);
      const pts = CU.gradePoints(grades[code]);
      if (!course || pts === null || course.category === "general") return;
      sums[course.category] = (sums[course.category] || 0) + pts;
      counts[course.category] = (counts[course.category] || 0) + 1;
    });
    const avgs = {};
    Object.keys(sums).forEach(cat => { avgs[cat] = sums[cat] / counts[cat]; });
    return avgs;
  }

  function scoreFields(avgs) {
    const cats = Object.keys(avgs);
    return CU_DATA.eceFields.map(field => {
      let dot = 0, weightSum = 0, totalWeight = 0;
      Object.keys(field.weights).forEach(cat => { totalWeight += field.weights[cat]; });
      cats.forEach(cat => {
        const w = field.weights[cat] || 0;
        dot += w * avgs[cat];
        weightSum += w;
      });
      // Normalize over the categories we have data for, then shrink by how
      // much of the field's weight profile that data actually covers —
      // otherwise a field whose main interest is unmeasured free-rides on
      // one good grade in a minor category.
      const coverage = totalWeight > 0 ? weightSum / totalWeight : 0;
      const raw = weightSum > 0 ? dot / (weightSum * 4) : 0;
      const match = Math.round(raw * (0.6 + 0.4 * coverage) * 100);
      return { field, match };
    }).sort((a, b) => b.match - a.match);
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s == null ? "" : s);
    return d.innerHTML;
  }

  function render() {
    if (!mount) return;
    const profile = Profile.get();
    const grades = (profile && profile.grades) || {};

    if (!Object.keys(grades).length) {
      mount.innerHTML =
        '<div class="card empty-card">' +
        "<h3>ჯერ შეფასებები არ არის</h3>" +
        "<p>დაამატე რამდენიმე შეფასება <strong>პროფილში</strong> და ძლიერ მხარეებს გიპოვი.</p>" +
        '<button class="btn primary" type="button" data-goto="profile">დაამატე შეფასებები</button>' +
        "</div>";
      mount.querySelector("[data-goto]").addEventListener("click", () => App.showTab("profile"));
      return;
    }

    const avgs = categoryAverages(grades);
    const scoredCats = Object.keys(avgs);
    const allCats = ["programming", "math", "circuits", "signals", "systems"];
    const missing = allCats.filter(c => scoredCats.indexOf(c) === -1);

    if (!scoredCats.length) {
      mount.innerHTML =
        '<div class="card empty-card"><h3>საკმარისი მონაცემები არ არის</h3>' +
        "<p>შენი შეფასებული კურსები მხოლოდ ზოგადი მიმართულებისაა — დაამატე ტექნიკური კურსის შეფასება (მათემატიკა, პროგრამირება, წრედები…), რომ თანხვედრა დაითვალოს.</p></div>";
      return;
    }

    const ranked = scoreFields(avgs);
    const top3 = ranked.slice(0, 3);

    let html = '<div class="card analyzer-summary"><h3>შენი კატეგორიების პროფილი</h3><div class="cat-bars">';
    allCats.forEach(cat => {
      const has = avgs[cat] !== undefined;
      const pct = has ? Math.round((avgs[cat] / 4) * 100) : 0;
      html +=
        '<div class="cat-bar' + (has ? "" : " nodata") + '">' +
        '<span class="cat-name">' + CU_DATA.categoryLabels[cat] + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:0%" data-width="' + pct + '"></span></span>' +
        '<span class="cat-val">' + (has ? avgs[cat].toFixed(1) + " / 4" : "არ არის") + "</span>" +
        "</div>";
    });
    html += "</div>";
    if (missing.length) {
      html += '<p class="hint">აკლია მონაცემები კატეგორიებში: <strong>' +
        missing.map(c => CU_DATA.categoryLabels[c]).join(", ") +
        "</strong> — თანხვედრა მხოლოდ არსებულ შეფასებებზეა დათვლილი. დაამატე ეს შეფასებები უფრო ზუსტი შედეგისთვის.</p>";
    }
    html += "</div>";

    html += '<h3 class="analyzer-heading">შენი ტოპ მიმართულებები</h3><div class="field-cards">';
    top3.forEach((r, i) => {
      const taken = Object.keys(grades);
      const nextCourses = r.field.recommendedCourses
        .filter(code => taken.indexOf(code) === -1)
        .slice(0, 3)
        .map(code => esc(CU.courseLabel(code)));
      html +=
        '<div class="card field-card">' +
        '<div class="field-rank">#' + (i + 1) + "</div>" +
        "<h4>" + esc(r.field.name) + "</h4>" +
        '<div class="match-line"><span class="bar-track"><span class="bar-fill" style="width:0%" data-width="' +
          r.match + '"></span></span><span class="match-pct">' + r.match + "% თანხვედრა</span></div>" +
        '<p class="field-desc">' + esc(r.field.description) + "</p>" +
        '<div class="field-meta"><span class="meta-label">კარიერა</span><div class="chip-row">' +
        r.field.careers.map(c => '<span class="mini-chip">' + esc(c) + "</span>").join("") +
        "</div></div>" +
        (nextCourses.length
          ? '<div class="field-meta"><span class="meta-label">აიღე შემდეგ</span><ul class="next-courses"><li>' +
            nextCourses.join("</li><li>") + "</li></ul></div>"
          : "") +
        "</div>";
    });
    html += "</div>";

    html +=
      '<div class="analyzer-actions">' +
      '<button class="btn secondary" type="button" id="askAdvisorExplain">💬 სთხოვე მრჩეველს ახსნა</button>' +
      "</div>";

    mount.innerHTML = html;

    // Animate bars in after layout.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mount.querySelectorAll(".bar-fill").forEach(el => {
          el.style.width = el.dataset.width + "%";
        });
      });
    });

    document.getElementById("askAdvisorExplain").addEventListener("click", () => {
      const summary = top3.map(r => r.field.name + " (" + r.match + "%)").join(", ");
      const catText = scoredCats
        .map(c => CU_DATA.categoryLabels[c] + " " + avgs[c].toFixed(1) + "/4")
        .join(", ");
      App.showTab("advisor");
      Chat.send(
        "ჩემი ძლიერი მხარეების ანალიზის შედეგი: ტოპ მიმართულებებია " + summary +
        ". კატეგორიების საშუალო ქულებია: " + catText +
        ". ამიხსენი, რატომ მერგება ეს მიმართულებები და რას მირჩევ შემდეგი სემესტრისთვის?"
      );
    });
  }

  function init() {
    mount = document.getElementById("analyzerContent");
    render();
  }

  return { init, render };
})();
