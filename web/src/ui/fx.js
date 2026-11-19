// Haptics and animation effects. Native haptics through Capacitor on Android/iOS,
// navigator.vibrate on the web; every effect respects the learner's settings and the
// system's reduced-motion preference.
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { state } from "../state.js";

const native = Capacitor.isNativePlatform();
const reduced = () => !state.settings.motion || matchMedia("(prefers-reduced-motion: reduce)").matches;

const PATTERNS = { tap: 8, select: 5, success: [12, 60, 18], error: [30, 40, 30], heavy: [20, 40, 20, 40, 60], warning: 25 };

export function haptic(kind = "tap") {
  if (!state.settings.haptics) return;
  try {
    if (native) {
      if (kind === "tap") Haptics.impact({ style: ImpactStyle.Light });
      else if (kind === "select") Haptics.selectionChanged();
      else if (kind === "success") Haptics.notification({ type: NotificationType.Success });
      else if (kind === "error") Haptics.notification({ type: NotificationType.Error });
      else if (kind === "warning") Haptics.notification({ type: NotificationType.Warning });
      else if (kind === "heavy") Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (navigator.vibrate && (navigator.userActivation?.hasBeenActive ?? true)) navigator.vibrate(PATTERNS[kind] || 8);
  } catch { /* haptics are a bonus */ }
}

/** Light haptic on every button press, app-wide. */
export function installTapHaptics(root) {
  root.addEventListener("pointerdown", (e) => {
    const t = e.target.closest("button, .tap, a.nav-item, .node, .option");
    if (t && !t.disabled) haptic("tap");
  }, { passive: true });
}

// ------------------------------------------------------------------ animations

export function animateClass(el, cls, ms = 600) {
  if (!el || reduced()) return;
  el.classList.remove(cls);
  void el.offsetWidth; // restart the animation
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

export const shake = (el) => animateClass(el, "fx-shake", 500);
export const pop = (el) => animateClass(el, "fx-pop", 450);

/** "+40 XP" floating up from an element. */
export function xpFloat(anchor, amount, label = "XP") {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "xp-float";
  el.textContent = `+${amount} ${label}`;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  if (reduced()) { setTimeout(() => el.remove(), 900); return; }
  el.animate(
    [{ transform: "translate(-50%, 0) scale(.8)", opacity: 0 }, { transform: "translate(-50%, -18px) scale(1.1)", opacity: 1, offset: 0.25 }, { transform: "translate(-50%, -70px) scale(1)", opacity: 0 }],
    { duration: 1300, easing: "cubic-bezier(.2,.7,.2,1)" }
  ).onfinish = () => el.remove();
}

/** Counts a number up inside an element. */
export function countUp(el, to, { from = 0, ms = 900, format = (v) => Math.round(v).toLocaleString() } = {}) {
  if (!el) return;
  if (reduced()) { el.textContent = format(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = format(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Confetti burst on a full-screen canvas. */
export function confetti({ count = 140, spread = 1, colors = ["#22d3ee", "#3b82f6", "#a855f7", "#22c55e", "#facc15", "#f472b6"] } = {}) {
  if (reduced()) return;
  const c = document.createElement("canvas");
  c.className = "confetti";
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 14 * spread,
    vy: -Math.random() * 15 - 5,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 6,
    color: colors[(Math.random() * colors.length) | 0],
    shape: Math.random() < 0.3 ? "circle" : "rect",
  }));
  const t0 = performance.now();
  const frame = (t) => {
    const age = t - t0;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.42;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, 1 - age / 2600);
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.color;
      if (p.shape === "circle") { g.beginPath(); g.arc(0, 0, p.w / 2.4, 0, 7); g.fill(); }
      else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    }
    if (age < 2700) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}

/** Staggered entrance for a list of elements. */
export function stagger(els, { delay = 40, from = 12 } = {}) {
  if (reduced()) return;
  [...els].forEach((el, i) => {
    el.animate(
      [{ opacity: 0, transform: `translateY(${from}px)` }, { opacity: 1, transform: "none" }],
      { duration: 420, delay: i * delay, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }
    );
  });
}

export { reduced as motionReduced };
