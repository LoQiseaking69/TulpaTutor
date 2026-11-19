import { h, esc } from "../ui/components.js";
import { icon } from "../ui/icons.js";
import { ring, donut, skillLegend, courseMap } from "../ui/widgets.js";
import { countUp } from "../ui/fx.js";
import { lessons } from "../course/index.js";
import { state, courseProgress, currentLesson, goalProgress, lessonsDone, streak, studyHours, skillBreakdown, dueReviews, certUnlocked } from "../state.js";
import { TIPS } from "./tips.js";
import { mascot } from "../ui/tutor.js";

export function render() {
  const cur = currentLesson();
  const goal = goalProgress();
  const skills = skillBreakdown();
  const tip = TIPS[Math.floor(Date.now() / 86400e3) % TIPS.length];
  const due = dueReviews().length;
  const name = state.name || "Builder";

  const el = h(`<div class="home">
    <div class="home-main stagger">
      <section class="card hero">
        <div class="hero-ring"></div>
        <div class="hero-text">
          <h2>Welcome back, <span class="grad-name">${esc(name)}!</span></h2>
          <p>${cur ? "Continue your journey to master TULPA." : certUnlocked() && !state.cert?.passed ? "Every lesson done. The Mastery Certification awaits." : "You've completed the course. Keep your skills sharp with challenges."}</p>
          <button class="primary big continue">${icon("play")}<span>${cur ? (lessonsDone() ? "Continue Lesson" : "Start First Lesson") : certUnlocked() && !state.cert?.passed ? "Take the Certification" : "Take a Challenge"}</span>${icon("chevron")}</button>
          ${cur ? `<div class="up-next">Up next: <b>${esc(cur.module.number + "." + (cur.index + 1) + " " + cur.title)}</b> · ${cur.minutes} min</div>` : ""}
        </div>
        <div class="hero-goal">
          <div class="goal-head">${icon("target")}<b>Today's Goal</b></div>
          <p>${goal.done >= goal.goal ? "Goal complete. Nice work!" : `Complete ${goal.goal - goal.done} more lesson${goal.goal - goal.done > 1 ? "s" : ""}`}</p>
          <div class="bar"><i style="width:${(goal.done / goal.goal) * 100}%"></i></div>
          <span class="goal-count">${goal.done} / ${goal.goal}</span>
        </div>
      </section>

      <section class="card map-card">
        <div class="card-head">${icon("map")}<div><h3>Course Map</h3><p>Your structured path to TULPA mastery</p></div>
          <a class="pill" href="#/map">Full map ${icon("chevron")}</a></div>
        <div class="map-slot"></div>
      </section>

      <section class="card tip-card">
        <div class="tip-icon"><span class="tip-mascot"></span></div>
        <div class="tip-body"><h4>Learning Tip</h4><p>${esc(tip.text)}</p></div>
        <a class="pill" href="${tip.href}">View tip ${icon("arrow")}</a>
      </section>
    </div>

    <aside class="home-side stagger">
      <section class="card stats">
        <div class="card-head">${icon("chart")}<h3>Your Stats</h3></div>
        <ul class="stat-list">
          <li>${icon("star", "c-yellow")}<span>XP</span><b data-count="${state.xp}">0</b></li>
          <li>${icon("flame", "c-orange flame")}<span>Streak</span><b>${streak()} Day${streak() === 1 ? "" : "s"}</b></li>
          <li>${icon("check", "c-green")}<span>Lessons</span><b>${lessonsDone()} / ${lessons.length}</b></li>
          <li>${icon("clock", "c-blue")}<span>Study Time</span><b>${studyHours().toFixed(1)} hrs</b></li>
        </ul>
      </section>
      <section class="card skills">
        <div class="card-head"><h3><span class="grad">Skill</span> Breakdown</h3></div>
        <div class="skills-body"><div class="donut-slot"></div></div>
      </section>
      <section class="card quick">
        <div class="card-head">${icon("bolt", "c-yellow")}<h3>Quick Actions</h3></div>
        <a class="qa tap" href="#/practice">${icon("play", "c-blue")}<span>Practice Concepts</span>${due ? `<em class="count">${due}</em>` : ""}${icon("chevron")}</a>
        <a class="qa tap" href="#/challenges">${icon("trophy", "c-yellow")}<span>Take a Challenge</span>${icon("chevron")}</a>
        <a class="qa tap" href="#/progress/notes">${icon("book", "c-blue")}<span>Review Notes</span>${icon("chevron")}</a>
        <a class="qa tap" href="#/explore">${icon("terminal", "c-cyan")}<span>Open Playground</span>${icon("chevron")}</a>
      </section>
    </aside>
  </div>`);

  el.querySelector(".tip-mascot").replaceWith(mascot("think", { size: 64, anim: "idle" }));
  el.querySelector(".hero-ring").append(ring(courseProgress(), { size: 150, label: "Course Progress" }));
  el.querySelector(".map-slot").append(courseMap({ compact: true, onOpen: openNode }));
  el.querySelector(".donut-slot").append(donut(skills), skillLegend(skills));
  el.querySelector(".continue").onclick = () => {
    if (cur) location.hash = `#/lesson/${cur.id}`;
    else location.hash = certUnlocked() && !state.cert?.passed ? "#/cert" : "#/challenges";
  };
  el.querySelectorAll("[data-count]").forEach((b) => countUp(b, +b.dataset.count));
  return el;
}

export function openNode(it) {
  if (it.kind === "cert") location.hash = "#/cert";
  else location.hash = `#/module/${it.m.id}`;
}
