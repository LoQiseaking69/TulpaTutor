import { h, esc } from "../ui/components.js";
import { icon, logo } from "../ui/icons.js";
import { confetti, haptic, countUp, motionReduced, pop } from "../ui/fx.js";
import { state, update, pendingAchievements, levelInfo, streak } from "../state.js";
import { mascot, brand, line } from "../ui/tutor.js";

export function modal(inner, { onClose, cls = "" } = {}) {
  const el = h(`<div class="modal-wrap"><div class="modal ${cls}" role="dialog" aria-modal="true"></div></div>`);
  const box = el.querySelector(".modal");
  box.append(inner);
  const close = () => {
    if (motionReduced()) { el.remove(); onClose && onClose(); return; }
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).onfinish = () => { el.remove(); onClose && onClose(); };
  };
  el.addEventListener("click", (e) => { if (e.target === el) close(); });
  const onNav = () => { removeEventListener("hashchange", onNav); el.remove(); };
  addEventListener("hashchange", onNav);
  document.body.appendChild(el);
  if (!motionReduced()) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    box.animate([{ transform: "translateY(24px) scale(.96)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.9,.25,1.15)" });
  }
  return { el, close };
}

export function showOnboarding() {
  const inner = h(`<div class="onboard">
    <div class="ob-hero"><img class="ob-logo-img" src="${brand("logo.webp")}" alt="TulpaTutor"></div>
    <div class="ob-tutor"><span class="ob-mascot"></span><div class="bubble">Hi! I'm your <b>Tutor</b>. I'll cheer you on, nudge you when you're stuck, and keep score.</div></div>
    <h2>Welcome to <span class="grad">TulpaTutor</span></h2>
    <p>Learn Tulpa, the language for robotics and embedded systems, with the real runtime
       running right here. 60 interactive lessons, from your first <code>print</code> to
       autonomous robots.</p>
    <label>What should we call you?<input class="field" maxlength="24" placeholder="Your name" autocomplete="given-name"></label>
    <label>Daily goal
      <div class="seg" role="radiogroup">${[1, 2, 3].map((n) => `<button class="seg-btn ${n === 1 ? "on" : ""}" data-n="${n}">${n} lesson${n > 1 ? "s" : ""}</button>`).join("")}</div>
    </label>
    <button class="primary big start">${icon("play")} Start learning</button>
  </div>`);
  inner.querySelector(".ob-mascot").replaceWith(mascot("wave", { size: 92, anim: "idle" }));
  let goal = 1;
  inner.querySelectorAll(".seg-btn").forEach((b) => (b.onclick = () => {
    inner.querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    goal = +b.dataset.n;
    haptic("select");
  }));
  const m = modal(inner, { cls: "wide" });
  inner.querySelector(".start").onclick = () => {
    const name = inner.querySelector("input").value.trim();
    update((s) => { s.name = name; s.onboarded = true; s.settings.dailyGoal = goal; });
    haptic("success");
    m.close();
    dispatchEvent(new HashChangeEvent("hashchange"));
  };
  setTimeout(() => inner.querySelector("input").focus(), 400);
}

/** Lesson / challenge complete celebration. */
export function celebrate({ title, subtitle, gained, levelUp, level, next, nextLabel = "Next lesson" }) {
  const L = levelInfo();
  const inner = h(`<div class="celebrate">
    <div class="burst"><span class="burst-ring"></span><span class="cele-mascot"></span></div>
    <h2>${esc(title)}</h2>
    <p class="tutor-line">“${esc(line("celebrate"))}”</p>
    <p class="sub">${esc(subtitle || "")}</p>
    <div class="cele-stats">
      <div><b class="xp-count">0</b><span>XP earned</span></div>
      <div><b>${streak()}</b><span>${icon("flame")} day streak</span></div>
      <div><b>${L.level}</b><span>level</span></div>
    </div>
    ${levelUp ? `<div class="levelup">${icon("crown")} Level up! You're now level ${level}.</div>` : ""}
    <div class="bar big"><i style="width:0%"></i></div>
    <div class="cele-actions">
      <button class="ghost close">Stay here</button>
      ${next ? `<button class="primary next">${esc(nextLabel)} ${icon("arrow")}</button>` : ""}
    </div>
  </div>`);
  inner.querySelector(".cele-mascot").replaceWith(mascot("celebrate", { size: 130, anim: "hop" }));
  const m = modal(inner, { cls: "cele" });
  countUp(inner.querySelector(".xp-count"), gained || 0, { ms: 1100, ticks: true });
  requestAnimationFrame(() => {
    const bar = inner.querySelector(".bar i");
    bar.style.transition = "width 1.1s cubic-bezier(.2,.7,.2,1) .2s";
    bar.style.width = `${(L.into / L.need) * 100}%`;
  });
  confetti({ count: levelUp ? 220 : 140 });
  haptic(levelUp ? "heavy" : "success");
  inner.querySelector(".close").onclick = m.close;
  const nb = inner.querySelector(".next");
  if (nb) nb.onclick = () => { m.close(); next(); };
  return m;
}

export function showAchievementToasts() {
  while (pendingAchievements.length) {
    const a = pendingAchievements.shift();
    const t = h(`<div class="toast achievement"><img class="toast-head" src="${brand("head.webp")}" alt=""><div><b>${icon(a.icon)} Achievement unlocked</b><span>${esc(a.title)}: ${esc(a.desc)}</span></div></div>`);
    let stack = document.querySelector(".toast-stack");
    if (!stack) { stack = document.createElement("div"); stack.className = "toast-stack"; document.body.appendChild(stack); }
    stack.appendChild(t);
    haptic("success");
    pop(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, 3800);
  }
  void state;
}
