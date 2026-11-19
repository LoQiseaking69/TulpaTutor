import { h, esc } from "../ui/components.js";
import { icon } from "../ui/icons.js";
import { donut, skillLegend, ring } from "../ui/widgets.js";
import { countUp } from "../ui/fx.js";
import { modules, lessons, lessonById, SKILLS } from "../course/index.js";
import { tutorSay } from "../ui/tutor.js";
import { state, levelInfo, streak, studyHours, lessonsDone, skillBreakdown, moduleProgress, ACHIEVEMENTS, today, courseProgress } from "../state.js";

export function render(params) {
  const tab = params[0] || "overview";
  const L = levelInfo();
  const el = h(`<div class="page progress">
    <section class="card profile">
      <div class="pf-avatar">${state.name ? esc(state.name[0].toUpperCase()) : icon("user")}</div>
      <div class="pf-body"><h2>${esc(state.name || "Builder")}</h2><p>Level ${L.level} · ${L.into.toLocaleString()} / ${L.need.toLocaleString()} XP to level ${L.level + 1}</p>
        <div class="bar big"><i style="width:${(L.into / L.need) * 100}%"></i></div></div>
      <div class="pf-ring"></div>
    </section>
    <div class="tabs">
      <a class="tab ${tab === "overview" ? "on" : ""}" href="#/progress">${icon("chart")} Overview</a>
      <a class="tab ${tab === "badges" ? "on" : ""}" href="#/progress/badges">${icon("medal")} Achievements</a>
      <a class="tab ${tab === "notes" ? "on" : ""}" href="#/progress/notes">${icon("book")} Notes</a>
    </div>
    <div class="tab-body"></div>
  </div>`);
  el.querySelector(".pf-ring").append(ring(courseProgress(), { size: 96, stroke: 9 }));
  const body = el.querySelector(".tab-body");
  if (tab === "badges") body.append(badges());
  else if (tab === "notes") body.append(notes());
  else body.append(overview());
  return el;
}

function overview() {
  const skills = skillBreakdown();
  const days = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push([today(d), d]); }
  const maxXp = Math.max(50, ...days.map(([k]) => state.days[k]?.xp || 0));
  const el = h(`<div class="overview stagger">
    <div class="kpis">
      <div class="card kpi">${icon("star", "c-yellow")}<b data-count="${state.xp}">0</b><span>Total XP</span></div>
      <div class="card kpi">${icon("flame", "c-orange")}<b>${streak()}</b><span>Day streak</span></div>
      <div class="card kpi">${icon("check", "c-green")}<b>${lessonsDone()}/${lessons.length}</b><span>Lessons</span></div>
      <div class="card kpi">${icon("clock", "c-blue")}<b>${studyHours().toFixed(1)}</b><span>Hours studied</span></div>
    </div>
    <section class="card activity"><div class="card-head">${icon("chart")}<h3>XP, last 14 days</h3></div>
      <div class="bars">${days.map(([k, d], i) => {
        const xp = state.days[k]?.xp || 0;
        return `<div class="bcol" title="${k}: ${xp} XP"><div class="b" style="--h:${(xp / maxXp) * 100}%;--i:${i}"></div><span>${"SMTWTFS"[d.getDay()]}</span></div>`;
      }).join("")}</div></section>
    <div class="two">
      <section class="card"><div class="card-head"><h3><span class="grad">Skill</span> Breakdown</h3></div><div class="skills-body"><div class="ds"></div></div></section>
      <section class="card"><div class="card-head">${icon("map")}<h3>Modules</h3></div>
        <ul class="mod-progress">${modules.map((m) => `<li><span>${m.number}. ${esc(m.title)}</span><div class="bar"><i style="width:${moduleProgress(m) * 100}%;background:${SKILLS[m.skill].color}"></i></div><b>${Math.round(moduleProgress(m) * 100)}%</b></li>`).join("")}</ul></section>
    </div>
  </div>`);
  el.querySelector(".ds").append(donut(skills), skillLegend(skills));
  el.querySelectorAll("[data-count]").forEach((b) => countUp(b, +b.dataset.count));
  return el;
}

function badges() {
  return h(`<div class="badges stagger">${ACHIEVEMENTS.map((a) => {
    const at = state.achievements[a.id];
    return `<div class="card badge-card ${at ? "got" : ""}">${icon(a.icon)}<b>${esc(a.title)}</b><span>${esc(a.desc)}</span>${at ? `<time>${new Date(at).toLocaleDateString()}</time>` : `<em>${icon("lock")}</em>`}</div>`;
  }).join("")}</div>`);
}

function notes() {
  const done = lessons.filter((l) => state.lessons[l.id]?.done || state.notes[l.id]);
  if (!done.length) {
    const e = h(`<div class="card empty-state"><a class="primary" href="#/home">Start learning</a></div>`);
    e.prepend(tutorSay("wave", "Your notes and each finished lesson's key takeaways will collect here.", { size: 80 }));
    return e;
  }
  return h(`<div class="notes-list stagger">${done.map((l) => `<section class="card note-card">
    <a class="nc-head tap" href="#/lesson/${l.id}"><span>${l.module.number}.${l.index + 1}</span><b>${esc(l.title)}</b>${icon("chevron")}</a>
    ${state.notes[l.id] ? `<div class="my-note">${icon("note")}<p>${esc(state.notes[l.id])}</p></div>` : ""}
    ${l.takeaways.length ? `<ul class="takeaways">${l.takeaways.map((t) => `<li>${esc(t).replace(/`([^`]+)`/g, "<code>$1</code>")}</li>`).join("")}</ul>` : ""}
  </section>`).join("")}</div>`);
}
void lessonById;
