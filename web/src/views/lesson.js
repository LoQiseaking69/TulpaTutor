import { h, esc, md, snippet, quiz, exercise, callout } from "../ui/components.js";
import { highlightStatic } from "../ui/editor.js";
import { icon } from "../ui/icons.js";
import { haptic, xpFloat, pop } from "../ui/fx.js";
import { lessonById, nextLesson, SKILLS } from "../course/index.js";
import { state, update, save, isDone, lessonUnlocked, completeLesson, recordLessonPart, grantXP } from "../state.js";
import { celebrate } from "./modals.js";

export function render([moduleId, file]) {
  const id = `${moduleId}/${file}`;
  const lesson = lessonById[id];
  if (!lesson) return h(`<div class="page"><p>Lesson not found.</p><a href="#/map">Back to the map</a></div>`);
  if (!lessonUnlocked(lesson)) {
    return h(`<div class="page locked-page card">${icon("lock")}<h2>This lesson is locked</h2>
      <p>Finish the previous lessons first, or unlock everything in Settings.</p><a class="primary" href="#/module/${moduleId}">Back to the module</a></div>`);
  }
  update((s) => { if (!isDone(id)) s.lastLesson = id; });
  const m = lesson.module;
  const next = nextLesson(id);
  const rec = state.lessons[id] || {};
  let exercisePassed = !!rec.done, hintsUsed = 0, firstTry = false;

  const el = h(`<article class="lesson">
    <div class="lesson-top">
      <a class="back tap" href="#/module/${m.id}">${icon("back")} ${esc(m.title)}</a>
      <div class="read-progress"><i></i></div>
    </div>
    <header class="lesson-head" style="--skill:${SKILLS[lesson.skill].color}">
      <span class="lh-kicker">Module ${m.number} · Lesson ${lesson.index + 1} of ${m.lessons.length}</span>
      <h1>${esc(lesson.title)}</h1>
      <p>${esc(lesson.summary)}</p>
      <div class="lh-meta"><span>${icon("clock")} ${lesson.minutes} min</span><span>${icon("star")} ${lesson.xp} XP</span><span class="skill-chip">${SKILLS[lesson.skill].label}</span>${rec.done ? `<span class="badge ok">${icon("check")} Completed</span>` : ""}</div>
    </header>
    <div class="lesson-body"></div>
    <section class="card notes">
      <div class="card-head">${icon("note")}<h3>My notes</h3><span class="saved" hidden>Saved</span></div>
      <textarea class="field" rows="4" placeholder="Jot down what you want to remember. Notes appear in Progress → Notes."></textarea>
    </section>
    <footer class="lesson-foot">
      <button class="primary big complete" ${exercisePassed ? "" : "disabled"}>${rec.done ? `${icon("check")} Completed` : `${icon("lock")} Pass the exercise to complete`}</button>
      ${next ? `<a class="ghost next-link" href="#/lesson/${next.id}">Next: ${esc(next.title)} ${icon("arrow")}</a>` : `<a class="ghost next-link" href="#/cert">Mastery Certification ${icon("arrow")}</a>`}
    </footer>
  </article>`);

  const body = el.querySelector(".lesson-body");
  let sn = 0, ex = 0;
  for (const b of lesson.blocks) {
    if (b.type === "md") body.append(h(`<div class="prose">${md(b.text)}</div>`));
    else if (b.type === "snippet") body.append(snippet(b, { key: `${id}#s${sn++}` }));
    else if (b.type === "listing") {
      const box = h(`<div class="snippet static listing"><div class="snippet-bar"><span class="snippet-tag">${esc(b.lang)}</span></div><div class="snippet-code"></div></div>`);
      if (b.lang === "tulpa") highlightStatic(box.querySelector(".snippet-code"), b.code);
      else box.querySelector(".snippet-code").innerHTML = `<pre class="plain">${esc(b.code)}</pre>`;
      body.append(box);
    } else if (b.type === "callout") body.append(callout(b));
    else if (b.type === "quiz") {
      body.append(quiz(b.questions, {
        onAnswer: (q, right, s) => {
          if (s.answered === s.total) recordLessonPart(id, "quiz", { correct: s.correct, total: s.total });
          if (right && !rec.done) { const r = grantXP(2, "quiz"); void r; }
        },
      }));
    } else if (b.type === "exercise") {
      const exKey = `${id}#ex${ex++}`;
      body.append(exercise(b, {
        key: exKey,
        done: !!rec.done,
        onPass: (info) => {
          exercisePassed = true;
          hintsUsed = info.hintsUsed;
          firstTry = info.firstTry;
          recordLessonPart(id, "exercise", { passed: true, attempts: info.attempts });
          const btn = el.querySelector(".complete");
          btn.disabled = false;
          btn.innerHTML = `${icon("check")} Complete lesson`;
          btn.classList.add("ready");
          pop(btn);
          return null;
        },
      }));
    }
  }

  const notes = el.querySelector(".notes textarea");
  notes.value = state.notes[id] || "";
  let t;
  notes.oninput = () => {
    clearTimeout(t);
    t = setTimeout(() => { state.notes[id] = notes.value; save(); const s = el.querySelector(".saved"); s.hidden = false; pop(s); }, 500);
  };

  el.querySelector(".complete").onclick = (e) => {
    if (isDone(id)) { if (next) location.hash = `#/lesson/${next.id}`; return; }
    if (!exercisePassed) return;
    const r = completeLesson(id, { hintsUsed, firstTry });
    xpFloat(e.currentTarget, r.gained);
    e.currentTarget.innerHTML = `${icon("check")} Completed`;
    celebrate({
      title: "Lesson complete!",
      subtitle: lesson.title,
      gained: r.gained,
      levelUp: r.levelUp,
      level: r.level,
      next: next ? () => (location.hash = `#/lesson/${next.id}`) : () => (location.hash = "#/cert"),
      nextLabel: next ? (next.moduleId !== lesson.moduleId ? `Start Module ${next.module.number}` : "Next lesson") : "Certification",
    });
  };

  // reading progress bar
  const bar = el.querySelector(".read-progress i");
  const onScroll = () => {
    const r = body.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    bar.style.width = `${k * 100}%`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  document.getElementById("view").addEventListener("scroll", onScroll, { passive: true });
  void haptic;
  return { node: el, cleanup: () => removeEventListener("scroll", onScroll) };
}
