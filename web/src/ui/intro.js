// Animated startup: the wings-spread TulpaTutor logo powers up out of the dark.
//
//   0.00s  circuits charge outward from the centre, sparks fly
//   0.35s  the Tutor rises in and flaps its wings            (light haptic)
//   1.00s  red lightning strikes and the wordmark ignites    (heavy haptic)
//   1.55s  everything settles into the full logo, eyes glint
//   2.60s+ zooms through into the app once the app is ready  (success haptic)
//
// The native launch screen (iOS LaunchScreen + Capacitor splash) is plain black, as is the
// first frame here, so the handoff is invisible. Tap anywhere to skip. Reduced motion gets
// a short fade instead. Everything is transform/opacity/clip-path on the compositor.
import { brand } from "./tutor.js";
import { haptic } from "./fx.js";

const MIN_MS = 2600;   // full sequence before the exit may start
const MAX_MS = 7000;   // never hold the learner longer than this
const EASE = "cubic-bezier(.2,.7,.2,1)";
const BACK = "cubic-bezier(.34,1.56,.64,1)";

function bolt(x0, y0, x1, y1, jag = 3.2, steps = 9) {
  let d = `M${x0} ${y0}`;
  for (let i = 1; i < steps; i++) {
    const k = i / steps;
    d += ` L${(x0 + (x1 - x0) * k + (Math.random() - 0.5) * jag * 2).toFixed(1)} ${(y0 + (y1 - y0) * k + (Math.random() - 0.5) * jag * 2).toFixed(1)}`;
  }
  return d + ` L${x1} ${y1}`;
}

function lightning() {
  // viewBox matches the logo (688 x 500); bolts crackle around the wordmark band (y 250-360)
  const paths = [
    bolt(20, 230, 150, 300, 9), bolt(668, 220, 540, 300, 9), bolt(120, 390, 300, 350, 8),
    bolt(600, 400, 420, 350, 8), bolt(250, 250, 330, 300, 6, 6), bolt(470, 245, 400, 300, 6, 6),
  ];
  return `<svg class="intro-bolts" viewBox="0 0 688 500" preserveAspectRatio="none" aria-hidden="true">
    <defs><filter id="ib-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${paths.map((d) => `<path d="${d}" pathLength="1"/>`).join("")}
  </svg>`;
}

export function startIntro({ reduced = false } = {}) {
  const root = document.getElementById("intro") || Object.assign(document.createElement("div"), { id: "intro" });
  root.className = "intro";
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", "TulpaTutor");
  const src = brand("startup.webp");
  root.innerHTML = `
    <div class="intro-stage">
      <img class="il l-power" src="${src}" alt="" draggable="false">
      <div class="il l-raven"><img src="${src}" alt="" draggable="false"></div>
      <div class="il l-word"><img src="${src}" alt="" draggable="false"></div>
      <img class="il l-full" src="${src}" alt="" draggable="false">
      ${lightning()}
      <i class="intro-glint g1"></i><i class="intro-glint g2"></i>
      <i class="intro-flash"></i>
      <div class="intro-sparks"></div>
    </div>
    <div class="intro-foot">
      <p class="intro-tag">THINK <b>·</b> CODE <b>·</b> BUILD</p>
      <div class="intro-bar"><i></i></div>
    </div>
    <button class="intro-skip" aria-label="Skip intro">Tap to skip</button>`;
  if (!root.isConnected) document.body.prepend(root);

  const $ = (s) => root.querySelector(s);
  const anims = [];
  const A = (el, kf, opt) => { if (el) { const a = el.animate(kf, { fill: "both", ...opt }); anims.push(a); return a; } };
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  let appReady = false, minDone = false, leaving = false, resolveDone;
  const done = new Promise((r) => (resolveDone = r));
  const t0 = performance.now();

  const img = $(".l-full");
  const decoded = (img.decode ? img.decode() : Promise.resolve()).catch(() => {});

  function play() {
    root.classList.add("live");
    if (reduced) {
      A($(".intro-stage"), [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: "ease-out" });
      A($(".l-full"), [{ opacity: 1 }, { opacity: 1 }], { duration: 1 });
      A($(".intro-foot"), [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
      at(700, () => { minDone = true; maybeLeave(); });
      return;
    }

    // 1. power: circuits charge outward
    A($(".l-power"), [
      { clipPath: "circle(0% at 50% 48%)", opacity: 0.2, filter: "brightness(1.8) saturate(1.4)" },
      { clipPath: "circle(18% at 50% 48%)", opacity: 1, offset: 0.25 },
      { clipPath: "circle(80% at 50% 48%)", opacity: 1, filter: "brightness(.55) saturate(1.2)" },
    ], { duration: 950, easing: "cubic-bezier(.5,0,.3,1)" });
    A($(".intro-stage"), [{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 2400, easing: EASE });

    // sparks
    const sparks = $(".intro-sparks");
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("i");
      const ang = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 34 + Math.random() * 30;
      s.style.setProperty("--h", Math.random() < 0.7 ? "190" : "275");
      sparks.append(s);
      A(s, [
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}vmin), calc(-50% + ${Math.sin(ang) * dist * 0.75}vmin)) scale(1)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 500, delay: 120 + Math.random() * 260, easing: "cubic-bezier(.1,.8,.3,1)" });
    }

    // 2. the Tutor rises in, then flaps
    A($(".l-raven img"), [
      { opacity: 0, transform: "translateY(16%) scale(.5)", filter: "brightness(2.6) blur(8px)" },
      { opacity: 1, transform: "translateY(-2%) scale(1.06)", filter: "brightness(1.4) blur(0)", offset: 0.7 },
      { opacity: 1, transform: "translateY(0) scale(1)", filter: "brightness(1) blur(0)" },
    ], { duration: 720, delay: 350, easing: BACK });
    at(420, () => haptic("tap"));
    A($(".l-raven"), [
      { transform: "scale(1,1)" }, { transform: "scale(1.07,.96)" }, { transform: "scale(.98,1.02)" },
      { transform: "scale(1.05,.97)" }, { transform: "scale(1,1)" },
    ], { duration: 620, delay: 1080, easing: "ease-in-out" });

    // 3. lightning + wordmark ignition
    $(".intro-bolts").querySelectorAll("path").forEach((p, i) => {
      A(p, [
        { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, offset: 0.25 },
        { opacity: 0.15, offset: 0.4 }, { opacity: 1, offset: 0.5 }, { strokeDashoffset: 0, opacity: 0 },
      ], { duration: 560, delay: 960 + i * 55, easing: "linear" });
    });
    A($(".intro-flash"), [{ opacity: 0 }, { opacity: 0.85, offset: 0.12 }, { opacity: 0.1, offset: 0.3 }, { opacity: 0.45, offset: 0.42 }, { opacity: 0 }], { duration: 520, delay: 1000 });
    at(1010, () => haptic("heavy"));
    A($(".l-word"), [{ clipPath: "inset(44% 100% 22% 0)" }, { clipPath: "inset(44% 0% 22% 0)" }], { duration: 420, delay: 1020, easing: "cubic-bezier(.6,0,.2,1)" });
    A($(".l-word img"), [
      { opacity: 0, filter: "brightness(2.5)" }, { opacity: 1, offset: 0.15 }, { opacity: 0.25, offset: 0.3 },
      { opacity: 1, offset: 0.45 }, { opacity: 0.55, offset: 0.6 }, { opacity: 1, filter: "brightness(1.15)" },
    ], { duration: 640, delay: 1020, easing: "linear" });
    for (let i = 0; i < 4; i++) at(1080 + i * 90, () => haptic("select"));

    // 4. settle into the full logo, eyes glint, breathe
    A($(".l-full"), [{ opacity: 0 }, { opacity: 1 }], { duration: 480, delay: 1550, easing: "ease-out" });
    A($(".l-full"), [
      { filter: "brightness(1) saturate(1)" }, { filter: "brightness(1.18) saturate(1.15)" }, { filter: "brightness(1) saturate(1)" },
    ], { duration: 1800, delay: 2030, iterations: Infinity, easing: "ease-in-out", fill: "none" });
    root.querySelectorAll(".intro-glint").forEach((g, i) =>
      A(g, [{ opacity: 0, transform: "translate(-50%,-50%) scale(0) rotate(0)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1) rotate(45deg)", offset: 0.4 }, { opacity: 0, transform: "translate(-50%,-50%) scale(.2) rotate(90deg)" }],
        { duration: 600, delay: 1720 + i * 110, easing: "ease-out" }));
    A($(".intro-foot"), [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 1650, easing: EASE });
    A($(".intro-bar i"), [{ transform: "scaleX(0)" }, { transform: "scaleX(.85)" }], { duration: MIN_MS - 1650, delay: 1650, easing: "cubic-bezier(.3,.6,.4,1)" });
    A($(".intro-skip"), [{ opacity: 0 }, { opacity: 0.55 }], { duration: 400, delay: 900 });

    at(MIN_MS, () => { minDone = true; maybeLeave(); });
  }

  function maybeLeave(force = false) {
    if (leaving || (!force && !(minDone && appReady))) return;
    leaving = true;
    timers.forEach(clearTimeout);
    const fast = force && !minDone;
    if (!reduced && !fast) haptic("success");
    const bar = $(".intro-bar i");
    A(bar, [{ transform: getComputedStyle(bar).transform === "none" ? "scaleX(0)" : getComputedStyle(bar).transform }, { transform: "scaleX(1)" }], { duration: 180, easing: "ease-out" });
    const dur = reduced || fast ? 280 : 520;
    if (!reduced) A($(".intro-stage"), [{ transform: "scale(1)", opacity: 1, filter: "blur(0)" }, { transform: "scale(1.35)", opacity: 0, filter: "blur(6px)" }], { duration: dur, delay: 120, easing: "cubic-bezier(.6,0,.8,.4)" });
    A($(".intro-foot"), [{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.6, delay: 80 });
    const out = A(root, [{ opacity: 1 }, { opacity: 0 }], { duration: dur, delay: reduced || fast ? 0 : 260, easing: "ease-in" });
    out.onfinish = () => { anims.forEach((a) => a.cancel()); root.remove(); document.documentElement.classList.remove("intro-on"); resolveDone(); };
  }

  root.addEventListener("pointerdown", () => maybeLeave(true), { once: true });
  setTimeout(() => maybeLeave(true), MAX_MS);

  // wait (briefly) for the logo to decode so the first visible frame is complete
  const started = Promise.race([decoded, new Promise((r) => setTimeout(r, 900))]).then(play);

  return {
    started,
    done,
    /** The app behind is rendered; the intro may leave once its sequence has played. */
    ready() { appReady = true; if (performance.now() - t0 > MIN_MS) minDone = true; maybeLeave(); },
    /** Learner turned motion off: get out of the way now. */
    skip() { maybeLeave(true); },
  };
}
