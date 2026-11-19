// Learner progress: XP, levels, streaks, lesson/challenge completion, spaced review,
// notes, achievements, notifications and settings. Persisted to localStorage, and on
// Android/iOS mirrored to native Preferences (WebView storage can be cleared by the OS).
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { lessons, modules, challenges, SKILLS, lessonById } from "./course/index.js";

const KEY = "tulpatutor.v1";
const listeners = new Set();

const defaults = () => ({
  version: 1,
  name: "",
  onboarded: false,
  xp: 0,
  lessons: {},
  lastLesson: null,
  days: {},
  challenges: {},
  review: {},
  notes: {},
  drafts: {},
  achievements: {},
  notifications: [],
  cert: null,
  settings: { haptics: true, motion: true, dailyGoal: 1, fontSize: 14, unlockAll: false, sound: false },
});

export let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.version === 1) return { ...defaults(), ...s, settings: { ...defaults().settings, ...s.settings } };
  } catch { /* fresh start */ }
  return defaults();
}

/** On native, prefer the Preferences copy if it is newer than the WebView's. */
export async function hydrate() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return;
    const s = JSON.parse(value);
    if (s && s.version === 1 && (s.savedAt || 0) > (state.savedAt || 0)) {
      state = { ...defaults(), ...s, settings: { ...defaults().settings, ...s.settings } };
      emit();
    }
  } catch { /* ignore */ }
}

let saveTimer;
export function save() {
  state.savedAt = Date.now();
  const json = JSON.stringify(state);
  try { localStorage.setItem(KEY, json); } catch { /* quota */ }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (Capacitor.isNativePlatform()) Preferences.set({ key: KEY, value: json }).catch(() => {});
  }, 300);
  emit();
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { for (const fn of listeners) fn(state); }

export function update(fn) { fn(state); save(); }
export function resetProgress() { const settings = state.settings; const name = state.name; state = { ...defaults(), name, settings, onboarded: true }; save(); }
export function exportProgress() { return JSON.stringify(state, null, 2); }
export function importProgress(json) {
  const s = JSON.parse(json);
  if (!s || s.version !== 1) throw new Error("not a TulpaTutor progress file");
  state = { ...defaults(), ...s };
  save();
}

// ------------------------------------------------------------------ time & streaks

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function day(key = today()) { return (state.days[key] ||= { xp: 0, lessons: 0, seconds: 0 }); }

export function streak() {
  let n = 0;
  const d = new Date();
  if (!state.days[today(d)]) d.setDate(d.getDate() - 1); // today not started yet: count from yesterday
  while (state.days[today(d)] && (state.days[today(d)].xp > 0 || state.days[today(d)].lessons > 0)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function addStudyTime(seconds) {
  if (seconds <= 0) return;
  day().seconds += seconds;
  save();
}

export function studyHours() {
  return Object.values(state.days).reduce((a, d) => a + (d.seconds || 0), 0) / 3600;
}

// ------------------------------------------------------------------ XP & levels

export function levelInfo(xp = state.xp) {
  let level = 1, need = 250, base = 0;
  while (xp >= base + need) { base += need; level++; need = 250 + (level - 1) * 75; }
  return { level, into: xp - base, need, total: xp };
}

/** Grants XP; returns {gained, levelUp, level}. */
export function grantXP(amount, reason) {
  const before = levelInfo().level;
  state.xp += amount;
  day().xp += amount;
  const after = levelInfo().level;
  if (after > before) notify(`Level up! You reached level ${after}.`, "level");
  checkAchievements();
  save();
  return { gained: amount, levelUp: after > before, level: after, reason };
}

// ------------------------------------------------------------------ lessons & unlocking

export const isDone = (lessonId) => !!state.lessons[lessonId]?.done;
export const lessonsDone = () => lessons.filter((l) => isDone(l.id)).length;
export const courseProgress = () => lessonsDone() / lessons.length;
export const moduleDone = (m) => m.lessons.length > 0 && m.lessons.every((l) => isDone(l.id));
export const moduleProgress = (m) => (m.lessons.length ? m.lessons.filter((l) => isDone(l.id)).length / m.lessons.length : 0);

export function moduleUnlocked(m) {
  if (state.settings.unlockAll || m.index === 0) return true;
  return moduleDone(modules[m.index - 1]);
}
export function lessonUnlocked(l) {
  const m = modules.find((x) => x.id === l.moduleId);
  if (!moduleUnlocked(m)) return false;
  if (state.settings.unlockAll || l.index === 0) return true;
  return isDone(m.lessons[l.index - 1].id) || isDone(l.id);
}
export const certUnlocked = () => state.settings.unlockAll || modules.every(moduleDone);

/** The lesson "Continue Lesson" should open. */
export function currentLesson() {
  if (state.lastLesson && !isDone(state.lastLesson) && lessonById[state.lastLesson]) return lessonById[state.lastLesson];
  return lessons.find((l) => !isDone(l.id) && lessonUnlocked(l)) || null;
}

export function recordLessonPart(lessonId, part, value) {
  const rec = (state.lessons[lessonId] ||= {});
  rec[part] = value;
  save();
}

export function completeLesson(lessonId, { hintsUsed = 0, firstTry = false } = {}) {
  const lesson = lessonById[lessonId];
  const rec = (state.lessons[lessonId] ||= {});
  if (rec.done) return { gained: 0, already: true };
  rec.done = true;
  rec.at = Date.now();
  let gained = lesson.xp;
  if (firstTry) gained += 10;
  if (!hintsUsed) gained += 5;
  rec.xp = gained;
  day().lessons += 1;
  // seed spaced review with this lesson's questions
  const now = Date.now();
  lesson.blocks.filter((b) => b.type === "quiz").flatMap((b) => b.questions).forEach((q, i) => {
    state.review[`${lessonId}#q${i}`] ||= { box: 1, due: now + 86400e3 };
  });
  const m = modules.find((x) => x.id === lesson.moduleId);
  const res = grantXP(gained, "lesson");
  if (moduleDone(m)) notify(`Module ${m.number} complete: ${m.title}!`, "module");
  return { ...res, firstTry, hintsUsed };
}

// ------------------------------------------------------------------ skills

export function skillBreakdown() {
  const out = {};
  for (const key of Object.keys(SKILLS)) {
    const ls = lessons.filter((l) => l.skill === key);
    const cs = challenges.filter((c) => c.skill === key);
    const total = ls.length + cs.length * 0.5;
    const got = ls.filter((l) => isDone(l.id)).length + cs.filter((c) => state.challenges[c.id]?.done).length * 0.5;
    out[key] = total ? Math.round((got / total) * 100) : 0;
  }
  return out;
}

// ------------------------------------------------------------------ spaced review (Leitner)

const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32];
export function dueReviews(now = Date.now()) {
  return Object.entries(state.review).filter(([, r]) => r.due <= now).map(([id]) => id);
}
export function gradeReview(id, correct) {
  const r = (state.review[id] ||= { box: 1, due: 0 });
  r.box = correct ? Math.min(r.box + 1, BOX_DAYS.length - 1) : 1;
  r.due = Date.now() + BOX_DAYS[r.box] * 86400e3;
  save();
}

// ------------------------------------------------------------------ challenges

export function completeChallenge(id) {
  const c = challenges.find((x) => x.id === id);
  const rec = (state.challenges[id] ||= {});
  if (rec.done) return { gained: 0, already: true };
  rec.done = true;
  rec.at = Date.now();
  return grantXP(c.xp, "challenge");
}

// ------------------------------------------------------------------ notifications

export function notify(text, kind = "info") {
  state.notifications.unshift({ id: Date.now() + Math.random(), text, kind, at: Date.now(), read: false });
  state.notifications = state.notifications.slice(0, 40);
}
export const unread = () => state.notifications.filter((n) => !n.read).length;
export function markAllRead() { state.notifications.forEach((n) => (n.read = true)); save(); }

// ------------------------------------------------------------------ achievements

export const ACHIEVEMENTS = [
  { id: "first-run", title: "Hello, World", desc: "Run your first Tulpa program", icon: "play" },
  { id: "first-lesson", title: "First Steps", desc: "Complete a lesson", icon: "check" },
  { id: "module-1", title: "Grounded", desc: "Finish Getting Started", icon: "flag" },
  { id: "half", title: "Halfway There", desc: "Complete 30 lessons", icon: "map" },
  { id: "all-lessons", title: "Course Complete", desc: "Complete all 60 lessons", icon: "crown" },
  { id: "streak-3", title: "Warming Up", desc: "Reach a 3-day streak", icon: "flame" },
  { id: "streak-7", title: "On Fire", desc: "Reach a 7-day streak", icon: "flame" },
  { id: "streak-30", title: "Unstoppable", desc: "Reach a 30-day streak", icon: "flame" },
  { id: "xp-1000", title: "Kilo-XP", desc: "Earn 1,000 XP", icon: "star" },
  { id: "xp-5000", title: "Mega-XP", desc: "Earn 5,000 XP", icon: "star" },
  { id: "challenger", title: "Challenger", desc: "Solve a challenge", icon: "trophy" },
  { id: "challenge-all", title: "Gauntlet", desc: "Solve every challenge", icon: "trophy" },
  { id: "reviewer", title: "Sharp Memory", desc: "Answer 25 review questions", icon: "brain" },
  { id: "certified", title: "Tulpa Certified", desc: "Pass the Mastery Certification", icon: "medal" },
];

export function unlock(id) {
  if (state.achievements[id]) return false;
  state.achievements[id] = Date.now();
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  notify(`Achievement unlocked: ${a.title}`, "achievement");
  pendingAchievements.push(a);
  return true;
}
export const pendingAchievements = [];

export function checkAchievements() {
  const done = lessonsDone();
  if (done >= 1) unlock("first-lesson");
  if (moduleDone(modules[0])) unlock("module-1");
  if (done >= 30) unlock("half");
  if (lessons.length && done >= lessons.length) unlock("all-lessons");
  const s = streak();
  if (s >= 3) unlock("streak-3");
  if (s >= 7) unlock("streak-7");
  if (s >= 30) unlock("streak-30");
  if (state.xp >= 1000) unlock("xp-1000");
  if (state.xp >= 5000) unlock("xp-5000");
  const solved = challenges.filter((c) => state.challenges[c.id]?.done).length;
  if (solved >= 1) unlock("challenger");
  if (challenges.length && solved >= challenges.length) unlock("challenge-all");
  if ((state.reviewed || 0) >= 25) unlock("reviewer");
  if (state.cert?.passed) unlock("certified");
}

export function goalProgress() {
  const d = state.days[today()];
  return { done: Math.min(d?.lessons || 0, state.settings.dailyGoal), goal: state.settings.dailyGoal };
}
