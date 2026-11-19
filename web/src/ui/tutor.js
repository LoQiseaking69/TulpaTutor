// The Tutor: TulpaTutor's robotic-raven mascot. Poses react to what the learner does,
// each with its own animation and haptic.
import { haptic, motionReduced } from "./fx.js";

const BASE = new URL("brand/", new URL(import.meta.env.BASE_URL, location.href)).href;
export const POSES = ["wave", "think", "celebrate", "oops"];
export const brand = (file) => BASE + file;

const LINES = {
  celebrate: ["Nailed it!", "Clean code. Beautiful.", "That's how it's done!", "Your robot would be proud.", "Flawless execution!"],
  oops: ["Close! Read the message, it tells you exactly where.", "Not yet. Compare your output with the expected one.", "Bugs happen to everyone. Try again!", "Almost there, check the details."],
  think: ["Here's a nudge…", "Think about it this way…", "Let's break it down…"],
  wave: ["Hi! I'm your Tutor.", "Welcome back!", "Ready to build?"],
};
export const line = (pose) => LINES[pose][(Math.random() * LINES[pose].length) | 0];

/** <img> of a pose. size in CSS px; anim: "idle" | "hop" | "wobble" | "pop" | "" */
export function mascot(pose = "wave", { size = 96, anim = "idle", cls = "" } = {}) {
  const img = document.createElement("img");
  img.src = brand(`mascot-${pose}.webp`);
  img.alt = `Tutor (${pose})`;
  img.width = size;
  img.height = size;
  img.decoding = "async";
  img.className = `mascot ${anim ? "m-" + anim : ""} ${cls}`.trim();
  return img;
}

/** Inline speech bubble with a pose: used in feedback, hints, empty states. */
export function tutorSay(pose, html, { size = 64, anim } = {}) {
  const el = document.createElement("div");
  el.className = `tutor-say pose-${pose}`;
  el.append(mascot(pose, { size, anim: anim ?? (pose === "celebrate" ? "hop" : pose === "oops" ? "wobble" : "pop") }));
  const b = document.createElement("div");
  b.className = "bubble";
  b.innerHTML = html;
  el.append(b);
  return el;
}

let current = null;
/** Floating corner reaction: the Tutor pops in, says a line, and leaves. */
export function react(pose, text = line(pose), { ms = 2600, buzz = true } = {}) {
  if (current) current.remove();
  const el = document.createElement("div");
  el.className = `tutor-pop pose-${pose}`;
  el.setAttribute("role", "status");
  el.append(mascot(pose, { size: 84, anim: pose === "celebrate" ? "hop" : pose === "oops" ? "wobble" : "pop" }));
  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;
  el.append(b);
  document.body.append(el);
  current = el;
  if (buzz) haptic(pose === "celebrate" ? "success" : pose === "oops" ? "warning" : "select");
  if (motionReduced()) { setTimeout(() => el.remove(), ms); return el; }
  el.animate([{ transform: "translateY(40px) scale(.8)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.4)" });
  setTimeout(() => {
    el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(24px) scale(.9)" }], { duration: 300, easing: "ease-in" }).onfinish = () => el.remove();
  }, ms);
  return el;
}
