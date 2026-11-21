import { h, esc } from "../ui/components.js";
import { icon } from "../ui/icons.js";
import { haptic, confetti } from "../ui/fx.js";
import { runtime } from "../runtime/client.js";
import { state, update, resetProgress, exportProgress, importProgress } from "../state.js";
import { modal } from "./modals.js";

export async function render() {
  const s = state.settings;
  const el = h(`<div class="page settings">
    <div class="page-head"><h2>${icon("gear")} Settings</h2></div>
    <section class="card set-group stagger">
      <h3>Profile</h3>
      <label class="row"><span>Name</span><input class="field name" value="${esc(state.name)}" maxlength="24"></label>
      <label class="row"><span>Daily goal</span><div class="seg goal">${[1, 2, 3, 5].map((n) => `<button class="seg-btn ${s.dailyGoal === n ? "on" : ""}" data-n="${n}">${n}</button>`).join("")}</div></label>
    </section>
    <section class="card set-group">
      <h3>Experience</h3>
      <label class="row switch"><span>${icon("bolt")} Haptic feedback<small>Vibration on taps, right/wrong answers and celebrations</small></span><input type="checkbox" data-k="haptics" ${s.haptics ? "checked" : ""}><i></i></label>
      <label class="row switch"><span>${icon("sparkle")} Animations<small>Transitions, confetti and progress effects</small></span><input type="checkbox" data-k="motion" ${s.motion ? "checked" : ""}><i></i></label>
      <label class="row"><span>${icon("code")} Code size</span><div class="seg font">${[12, 13, 14, 16, 18].map((n) => `<button class="seg-btn ${s.fontSize === n ? "on" : ""}" data-n="${n}">${n}</button>`).join("")}</div></label>
      <label class="row switch"><span>${icon("lock")} Unlock all modules<small>For experienced programmers who want to jump around</small></span><input type="checkbox" data-k="unlockAll" ${s.unlockAll ? "checked" : ""}><i></i></label>
      <div class="row"><span>Test effects</span><button class="ghost sm test-fx">${icon("sparkle")} Try it</button></div>
    </section>
    <section class="card set-group">
      <h3>Your data</h3>
      <p class="muted">Progress is stored on this device only. Export it to move between devices.</p>
      <div class="btn-row"><button class="ghost export">${icon("download")} Export progress</button><button class="ghost import">${icon("upload")} Import</button><button class="danger reset">${icon("reset")} Reset progress</button></div>
      <input type="file" class="file" accept="application/json" hidden>
    </section>
    <section class="card set-group about">
      <h3>About</h3>
      <p><b>TulpaTutor</b> runs the real Tulpa runtime <b class="ver">…</b> compiled to WebAssembly, on the web, Android and iOS.
      Tulpa and TulpaTutor are made by HermiTech LLC and licensed under the Business Source License 1.1.</p>
      <p class="muted">Language source: <a href="https://github.com/LoQiseaking69/Tulpa" target="_blank" rel="noopener">github.com/LoQiseaking69/Tulpa</a></p>
    </section>
  </div>`);
  runtime.version().then((v) => (el.querySelector(".ver").textContent = typeof v === "string" ? v : ""));
  el.querySelector(".name").oninput = (e) => update((st) => (st.name = e.target.value.trim()));
  el.querySelectorAll("[data-k]").forEach((c) => (c.onchange = () => { update((st) => (st.settings[c.dataset.k] = c.checked)); haptic("select"); }));
  const seg = (sel, key) => el.querySelectorAll(`${sel} .seg-btn`).forEach((b) => (b.onclick = () => {
    el.querySelectorAll(`${sel} .seg-btn`).forEach((x) => x.classList.toggle("on", x === b));
    update((st) => (st.settings[key] = +b.dataset.n));
    haptic("select");
  }));
  seg(".goal", "dailyGoal");
  seg(".font", "fontSize");
  el.querySelector(".test-fx").onclick = () => { haptic("heavy"); confetti(); };
  el.querySelector(".export").onclick = () => {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tulpatutor-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const file = el.querySelector(".file");
  el.querySelector(".import").onclick = () => file.click();
  file.onchange = async () => {
    try { importProgress(await file.files[0].text()); haptic("success"); location.hash = "#/home"; }
    catch (e) { alert(e.message); }
  };
  el.querySelector(".reset").onclick = () => {
    const box = h(`<div class="confirm"><h3>Reset all progress?</h3><p>XP, lessons, streaks, notes and achievements will be erased. This cannot be undone.</p>
      <div class="btn-row"><button class="ghost no">Cancel</button><button class="danger yes">Reset</button></div></div>`);
    const m = modal(box);
    box.querySelector(".no").onclick = m.close;
    box.querySelector(".yes").onclick = () => { resetProgress(); haptic("heavy"); m.close(); location.hash = "#/home"; };
  };
  return el;
}
