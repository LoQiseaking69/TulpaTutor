import { h, esc } from "../ui/components.js";
import { icon } from "../ui/icons.js";
import { courseMap, ring } from "../ui/widgets.js";
import { modules, SKILLS } from "../course/index.js";
import { moduleUnlocked, moduleDone, moduleProgress, isDone, lessonUnlocked, currentLesson, certUnlocked, state } from "../state.js";
import { openNode } from "./home.js";

export function render(params, { name }) {
  if (name === "module") return renderModule(params[0]);
  const el = h(`<div class="page map-page">
    <div class="page-head"><h2>${icon("map")} Course Map</h2><p>Ten modules and a final certification. Finish a module to unlock the next.</p></div>
    <section class="card"><div class="map-slot"></div></section>
    <div class="module-grid stagger"></div>
  </div>`);
  el.querySelector(".map-slot").append(courseMap({ onOpen: openNode }));
  const grid = el.querySelector(".module-grid");
  for (const m of modules) {
    const unlocked = moduleUnlocked(m), done = moduleDone(m);
    const card = h(`<a class="card module-card tap ${unlocked ? "" : "locked"} ${done ? "done" : ""}" href="#/module/${m.id}">
      <div class="mc-icon" style="--skill:${SKILLS[m.skill].color}">${icon(m.icon)}</div>
      <div class="mc-body"><span class="mc-num">Module ${m.number} · ${SKILLS[m.skill].label}</span><h3>${esc(m.title)}</h3><p>${esc(m.blurb)}</p>
      <div class="bar"><i style="width:${moduleProgress(m) * 100}%"></i></div>
      <span class="mc-meta">${m.lessons.filter((l) => isDone(l.id)).length}/${m.lessons.length} lessons · ${m.lessons.reduce((a, l) => a + l.minutes, 0)} min</span></div>
      <span class="mc-state">${done ? icon("check") : unlocked ? icon("chevron") : icon("lock")}</span></a>`);
    grid.append(card);
  }
  grid.append(h(`<a class="card module-card tap cert-card ${certUnlocked() ? "" : "locked"}" href="#/cert">
    <div class="mc-icon" style="--skill:#e879f9">${icon("star")}</div>
    <div class="mc-body"><span class="mc-num">Final</span><h3>Mastery Certification</h3><p>A 20-question exam plus three capstone programs, checked by the runtime.</p>
    <span class="mc-meta">${state.cert?.passed ? `Passed with ${state.cert.score}%` : certUnlocked() ? "Unlocked" : "Complete every module to unlock"}</span></div>
    <span class="mc-state">${state.cert?.passed ? icon("medal") : certUnlocked() ? icon("chevron") : icon("lock")}</span></a>`));
  return el;
}

function renderModule(id) {
  const m = modules.find((x) => x.id === id) || modules[0];
  const unlocked = moduleUnlocked(m);
  const cur = currentLesson();
  const el = h(`<div class="page module-page">
    <a class="back tap" href="#/map">${icon("back")} Course Map</a>
    <section class="card module-hero" style="--skill:${SKILLS[m.skill].color}">
      <div class="mh-ring"></div>
      <div><span class="mc-num">Module ${m.number} · ${SKILLS[m.skill].label}</span><h2>${esc(m.title)}</h2><p>${esc(m.blurb)}</p>
      ${unlocked ? "" : `<p class="locked-note">${icon("lock")} Finish Module ${m.number - 1} to unlock. (You can unlock everything in Settings.)</p>`}</div>
    </section>
    <ol class="lesson-list stagger"></ol>
  </div>`);
  el.querySelector(".mh-ring").append(ring(moduleProgress(m), { size: 110, stroke: 10 }));
  const list = el.querySelector(".lesson-list");
  for (const l of m.lessons) {
    const open = lessonUnlocked(l), done = isDone(l.id);
    const isCur = cur && cur.id === l.id;
    const counts = {
      snippets: l.blocks.filter((b) => b.type === "snippet").length,
      quiz: l.blocks.filter((b) => b.type === "quiz").reduce((a, b) => a + b.questions.length, 0),
    };
    list.append(h(`<li><a class="lesson-row tap ${done ? "done" : ""} ${open ? "" : "locked"} ${isCur ? "current" : ""}" href="${open ? `#/lesson/${l.id}` : `#/module/${m.id}`}">
      <span class="lr-num">${done ? icon("check") : open ? l.index + 1 : icon("lock")}</span>
      <span class="lr-body"><b>${esc(l.title)}</b><span>${esc(l.summary)}</span>
        <span class="lr-meta">${icon("clock")} ${l.minutes} min · ${icon("code")} ${counts.snippets} snippets · ${icon("brain")} ${counts.quiz} questions · ${icon("target")} exercise</span></span>
      <span class="lr-xp">+${l.xp} XP</span></a></li>`));
  }
  return el;
}
