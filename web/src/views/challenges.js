import { h, esc, exercise } from "../ui/components.js";
import { icon } from "../ui/icons.js";
import { challenges, SKILLS } from "../course/index.js";
import { state, completeChallenge } from "../state.js";
import { celebrate } from "./modals.js";

const DIFF = { 1: "Easy", 2: "Medium", 3: "Hard" };

export function render(params, { name }) {
  if (name === "challenge") return one(params[0]);
  const solved = challenges.filter((c) => state.challenges[c.id]?.done).length;
  const el = h(`<div class="page challenges">
    <div class="page-head"><h2>${icon("trophy")} Challenges</h2><p>Standalone problems that combine everything you know. Each is checked by the runtime against hidden tests. ${solved}/${challenges.length} solved.</p></div>
    <div class="filter seg">${["All", "Easy", "Medium", "Hard"].map((f, i) => `<button class="seg-btn ${i ? "" : "on"}" data-f="${f}">${f}</button>`).join("")}</div>
    <div class="challenge-grid stagger">${challenges.map((c) => {
      const done = state.challenges[c.id]?.done;
      return `<a class="card challenge tap ${done ? "done" : ""}" data-d="${DIFF[c.difficulty]}" href="#/challenge/${c.id}">
        <div class="ch-top"><span class="diff d${c.difficulty}">${DIFF[c.difficulty]}</span><span class="skill-chip" style="--c:${SKILLS[c.skill].color}">${SKILLS[c.skill].label}</span>${done ? `<span class="badge ok">${icon("check")}</span>` : ""}</div>
        <h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="ch-xp">${icon("star")} ${c.xp} XP</span></a>`;
    }).join("")}</div>
  </div>`);
  el.querySelectorAll(".seg-btn").forEach((b) => (b.onclick = () => {
    el.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("on", x === b));
    el.querySelectorAll(".challenge").forEach((c) => (c.hidden = b.dataset.f !== "All" && c.dataset.d !== b.dataset.f));
  }));
  return el;
}

function one(id) {
  const c = challenges.find((x) => x.id === id);
  if (!c) return h(`<div class="page"><a href="#/challenges">Back</a></div>`);
  const idx = challenges.indexOf(c);
  const next = challenges[idx + 1];
  const el = h(`<div class="page challenge-page">
    <a class="back tap" href="#/challenges">${icon("back")} Challenges</a>
    <div class="ch-top"><span class="diff d${c.difficulty}">${DIFF[c.difficulty]}</span><span class="skill-chip">${SKILLS[c.skill].label}</span><span class="ch-xp">${icon("star")} ${c.xp} XP</span></div>
  </div>`);
  el.append(exercise(c, {
    key: `challenge:${c.id}`,
    label: "Challenge",
    done: !!state.challenges[c.id]?.done,
    onPass: () => {
      const r = completeChallenge(c.id);
      if (r.already) return null;
      celebrate({ title: "Challenge solved!", subtitle: c.title, gained: r.gained, levelUp: r.levelUp, level: r.level,
        next: next ? () => (location.hash = `#/challenge/${next.id}`) : null, nextLabel: "Next challenge" });
      return null;
    },
  }));
  return el;
}
