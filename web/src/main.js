import "./styles/base.css";
import "./styles/app.css";
import { Capacitor } from "@capacitor/core";
import { icon, logo } from "./ui/icons.js";
import { h, esc } from "./ui/components.js";
import { installTapHaptics, installRipples, haptic, stagger, motionReduced } from "./ui/fx.js";
import { brand } from "./ui/tutor.js";
import { state, subscribe, levelInfo, unread, hydrate, checkAchievements, save, addStudyTime, markAllRead } from "./state.js";
import { runtime } from "./runtime/client.js";
import { showOnboarding, showAchievementToasts } from "./views/modals.js";

const views = {
  home: () => import("./views/home.js"),
  map: () => import("./views/map.js"),
  module: () => import("./views/map.js"),
  lesson: () => import("./views/lesson.js"),
  practice: () => import("./views/practice.js"),
  explore: () => import("./views/explore.js"),
  challenges: () => import("./views/challenges.js"),
  challenge: () => import("./views/challenges.js"),
  progress: () => import("./views/progress.js"),
  settings: () => import("./views/settings.js"),
  cert: () => import("./views/cert.js"),
};

const NAV = [
  ["home", "Home", "home"],
  ["map", "Course Map", "map"],
  ["practice", "Practice", "target"],
  ["explore", "Explore", "cube"],
  ["challenges", "Challenges", "trophy"],
  ["progress", "Progress", "chart"],
  ["settings", "Settings", "gear"],
];
const TABS = [["home", "Home", "home"], ["map", "Course", "map"], ["practice", "Practice", "target"], ["explore", "Explore", "cube"], ["progress", "Me", "user"]];

const app = document.getElementById("app");
app.innerHTML = `
  <div class="space-bg" aria-hidden="true"><div class="stars s1"></div><div class="stars s2"></div><div class="planet"></div><div class="grid-floor"></div></div>
  <aside class="sidebar">
    <a class="brand tap" href="#/home"><img class="brand-logo" src="${brand("logo.webp")}" alt="TulpaTutor"></a>
    <nav class="nav">${NAV.map(([r, label, ic]) => `<a class="nav-item" data-route="${r}" href="#/${r}">${icon(ic)}<span>${label}</span></a>`).join("")}</nav>
    <div class="level-card tap" data-go="progress"></div>
    <div class="motto">Build. Automate. Secure.<br>with <b>TULPA</b></div>
  </aside>
  <div class="main">
    <header class="topbar">
      <a class="mini-brand tap" href="#/home"><img src="${brand("head.webp")}" alt="TulpaTutor"></a><div class="title-block"><h1 class="app-title">Learn <span class="grad">TULPA</span></h1><p class="tagline">Think. Code. Build.</p></div>
      <div class="top-actions">
        <button class="icon-btn bell" aria-label="Notifications">${icon("bell")}<span class="dot"></span></button>
        <span class="sep"></span>
        <button class="avatar" aria-label="Profile">${icon("user")}</button>
      </div>
    </header>
    <main class="view" id="view" tabindex="-1"></main>
  </div>
  <nav class="tabbar">${TABS.map(([r, label, ic]) => `<a class="nav-item" data-route="${r}" href="#/${r}">${icon(ic)}<span>${label}</span></a>`).join("")}</nav>
  <div class="notif-panel" hidden></div>
`;

const viewEl = document.getElementById("view");
let cleanup = null;
let renderSeq = 0;

function parseRoute() {
  const [, name = "home", ...rest] = (location.hash || "#/home").split("/");
  return { name: views[name] ? name : "home", params: rest.map(decodeURIComponent) };
}

async function route() {
  const seq = ++renderSeq;
  const { name, params } = parseRoute();
  const nav = name === "module" || name === "lesson" ? "map" : name === "challenge" ? "challenges" : name === "cert" ? "map" : name;
  document.querySelectorAll(".nav-item").forEach((a) => a.classList.toggle("active", a.dataset.route === nav));
  document.body.dataset.route = name;
  const mod = await views[name]();
  if (seq !== renderSeq) return;
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const out = (mod.render || mod[`render_${name}`])?.(params, { name }) ?? mod.default?.(params, { name });
  const el = out instanceof Promise ? await out : out;
  if (seq !== renderSeq) return;
  viewEl.replaceChildren(el.node || el);
  cleanup = el.cleanup || null;
  viewEl.scrollTop = 0;
  window.scrollTo(0, 0);
  if (!motionReduced()) {
    viewEl.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" });
    stagger(viewEl.querySelectorAll(".stagger > *"));
  }
  showAchievementToasts();
}

function renderChrome() {
  const L = levelInfo();
  const lc = app.querySelector(".level-card");
  lc.innerHTML = `<div class="lc-top">${icon("crown")}<span>${L.level >= 10 ? "Pro Learner" : L.level >= 5 ? "Rising Builder" : "New Builder"}</span></div>
    <div class="lc-level">Level ${L.level}</div>
    <div class="bar"><i style="width:${(L.into / L.need) * 100}%"></i></div>
    <div class="lc-xp">${L.into.toLocaleString()} / ${L.need.toLocaleString()} XP</div>`;
  const n = unread();
  const dot = app.querySelector(".bell .dot");
  dot.textContent = n > 9 ? "9+" : n || "";
  dot.hidden = !n;
  const av = app.querySelector(".avatar");
  av.innerHTML = state.name ? `<span class="initials">${esc(state.name.trim()[0].toUpperCase())}</span>` : `<img class="av-head" src="${brand("head.webp")}" alt="">`;
  document.documentElement.style.setProperty("--code-size", state.settings.fontSize + "px");
  document.body.classList.toggle("no-motion", !state.settings.motion);
}

function toggleNotifications(force) {
  const p = app.querySelector(".notif-panel");
  const open = force ?? p.hidden;
  if (!open) { p.hidden = true; return; }
  p.innerHTML = `<div class="np-head"><b>Notifications</b><button class="ghost sm">Mark all read</button></div>
    <div class="np-list">${state.notifications.length ? state.notifications.map((n) => `<div class="np-item ${n.read ? "" : "unread"} ${n.kind}">
      ${icon({ achievement: "medal", level: "star", module: "flag", streak: "flame" }[n.kind] || "bell")}
      <div><p>${esc(n.text)}</p><time>${new Date(n.at).toLocaleString()}</time></div></div>`).join("") : `<div class="empty">You're all caught up.</div>`}</div>`;
  p.querySelector("button").onclick = () => { markAllRead(); toggleNotifications(true); };
  p.hidden = false;
  if (!motionReduced()) p.animate([{ opacity: 0, transform: "translateY(-8px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
}

app.querySelector(".bell").onclick = (e) => { e.stopPropagation(); toggleNotifications(); };
app.querySelector(".avatar").onclick = () => (location.hash = "#/progress");
app.querySelector(".level-card").onclick = () => (location.hash = "#/progress");
document.addEventListener("click", (e) => { if (!e.target.closest(".notif-panel")) toggleNotifications(false); });
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) location.hash = "#/" + go.dataset.go;
});

installTapHaptics(document.body);
installRipples(document.body);
subscribe(renderChrome);
window.addEventListener("hashchange", route);

// Study time: count seconds while the app is visible and the learner is active.
let lastActive = Date.now(), acc = 0;
["pointerdown", "keydown", "scroll"].forEach((ev) => addEventListener(ev, () => (lastActive = Date.now()), { passive: true, capture: true }));
setInterval(() => {
  if (document.visibilityState === "visible" && Date.now() - lastActive < 90_000) acc += 15;
  if (acc >= 60) { addStudyTime(acc); acc = 0; }
}, 15_000);

async function nativeSetup() {
  if (!Capacitor.isNativePlatform()) return;
  document.body.classList.add("native", `platform-${Capacitor.getPlatform()}`);
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") await StatusBar.setBackgroundColor({ color: "#050b1f" });
  } catch { /* optional */ }
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (location.hash && location.hash !== "#/home") history.back();
      else if (!canGoBack) App.exitApp();
    });
  } catch { /* optional */ }
  try { const { SplashScreen } = await import("@capacitor/splash-screen"); await SplashScreen.hide({ fadeOutDuration: 300 }); } catch { /* optional */ }
}

(async () => {
  await hydrate();
  checkAchievements();
  save();
  renderChrome();
  await route();
  nativeSetup();
  runtime.ready(); // warm the runtime in the background
  if (!state.onboarded) showOnboarding();
  void haptic;
})();
