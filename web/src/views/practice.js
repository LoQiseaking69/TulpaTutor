import { h, esc, quiz, exercise } from "../ui/components.js";
import { icon } from "../ui/icons.js";
import { haptic } from "../ui/fx.js";
import { questionBank, drillBank, lessonById } from "../course/index.js";
import { state, save, isDone, dueReviews, gradeReview, grantXP, checkAchievements } from "../state.js";

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

export function render() {
  const done = (q) => isDone(q.lessonId);
  const due = dueReviews().map((id) => questionBank.find((q) => q.id === id)).filter(Boolean);
  const pool = questionBank.filter(done);
  const drills = drillBank.filter(done);

  const el = h(`<div class="page practice">
    <div class="page-head"><h2>${icon("target")} Practice</h2><p>Short sessions, often. Review questions come back on a spaced schedule (1, 2, 4, 8… days) so they stick.</p></div>
    <div class="practice-grid stagger">
      <button class="card mode tap review" ${due.length || pool.length ? "" : "disabled"}>
        ${icon("brain")}<h3>Daily Review</h3><p>${due.length ? `${due.length} question${due.length > 1 ? "s" : ""} due today` : pool.length ? "Nothing due. Practise anyway with a random set." : "Complete a lesson to unlock review."}</p></button>
      <button class="card mode tap drill" ${drills.length ? "" : "disabled"}>
        ${icon("code")}<h3>Code Drill</h3><p>${drills.length ? "Re-solve a random exercise from lessons you've finished." : "Complete a lesson to unlock drills."}</p></button>
      <button class="card mode tap mixed" ${pool.length ? "" : "disabled"}>
        ${icon("bolt")}<h3>Lightning Round</h3><p>10 random questions from everything you've learned. Speed bonus!</p></button>
    </div>
    <div class="session"></div>
  </div>`);
  const session = el.querySelector(".session");

  const startQuiz = (qs, title, { spaced = false, timed = false } = {}) => {
    session.innerHTML = "";
    const t0 = Date.now();
    const box = quiz(qs, {
      title,
      onAnswer: (q, right, s) => {
        if (spaced || state.review[q.id]) gradeReview(q.id, right);
        state.reviewed = (state.reviewed || 0) + 1;
        if (right) grantXP(timed ? 3 : 2, "practice");
        if (s.answered === s.total) {
          const secs = (Date.now() - t0) / 1000;
          const bonus = timed && s.correct === s.total && secs < s.total * 8 ? 20 : 0;
          if (bonus) grantXP(bonus, "speed");
          checkAchievements();
          save();
          session.append(h(`<div class="card session-end">${icon(s.correct === s.total ? "crown" : "check")}<div><b>${s.correct}/${s.total} correct</b>
            <span>${timed ? `${secs.toFixed(0)} s${bonus ? " · speed bonus +20 XP" : ""}` : "Nice work. Come back tomorrow for the next review."}</span></div></div>`));
          haptic(s.correct === s.total ? "success" : "select");
        }
      },
    });
    qs.forEach((q, i) => {
      const src = lessonById[q.lessonId];
      if (src) box.querySelectorAll(".question")[i].insertAdjacentHTML("afterbegin", `<a class="q-src" href="#/lesson/${src.id}">${icon("book")} ${esc(src.title)}</a>`);
    });
    session.append(box);
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  el.querySelector(".review").onclick = () => startQuiz(due.length ? due.slice(0, 12) : shuffle(pool).slice(0, 8), due.length ? "Daily review" : "Random review", { spaced: true });
  el.querySelector(".mixed").onclick = () => startQuiz(shuffle(pool).slice(0, 10), "Lightning round", { timed: true });
  el.querySelector(".drill").onclick = () => {
    const d = shuffle(drills)[0];
    session.innerHTML = "";
    const src = lessonById[d.lessonId];
    session.append(h(`<a class="q-src" href="#/lesson/${src.id}">${icon("book")} From: ${esc(src.title)}</a>`));
    session.append(exercise({ ...d, starter: d.starter }, { label: "Drill", onPass: (info) => grantXP(info.firstTry ? 15 : 8, "drill") }));
    session.scrollIntoView({ behavior: "smooth" });
  };
  return el;
}
