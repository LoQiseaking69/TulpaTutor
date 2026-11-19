// Interactive lesson building blocks: runnable snippets, output consoles with live plots,
// quizzes, checked exercises and state-machine diagrams.
import { marked } from "marked";
import { createEditor, highlightStatic } from "./editor.js";
import { runtime, splitTelemetry } from "../runtime/client.js";
import { icon } from "./icons.js";
import { haptic, shake, pop, xpFloat } from "./fx.js";
import { normalizeOutput } from "../course/parse.js";
import { state, save, unlock } from "../state.js";

marked.setOptions({ gfm: true, breaks: false });
export const md = (text) => marked.parse(text || "");
export const mdInline = (text) => marked.parseInline(text || "");
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ------------------------------------------------------------------ output console

export class Console {
  constructor(el) {
    this.el = el;
    this.text = "";
    this.series = {};
    this.events = [];
  }
  clear() {
    this.text = "";
    this.series = {};
    this.events = [];
    this.el.innerHTML = "";
    this.el.classList.remove("has-error", "ok");
  }
  write(chunk) {
    const { text, tlm } = splitTelemetry(chunk);
    this.text += text;
    for (const r of tlm) {
      if (r.k === "plot") (this.series[r.name] ||= { unit: r.unit, pts: [] }).pts.push([r.t, r.v]);
      else if (r.k === "event") this.events.push(r);
    }
    this.render();
  }
  render(error) {
    const lines = esc(this.text.replace(/\n+$/, ""));
    let html = lines ? `<pre class="out-text">${lines}</pre>` : "";
    if (error) html += `<pre class="out-error">${esc(trimTrace(error))}</pre>`;
    this.el.innerHTML = html;
    if (Object.keys(this.series).length) this.el.appendChild(plot(this.series));
    this.el.scrollTop = this.el.scrollHeight;
  }
  fail(error) { this.el.classList.add("has-error"); this.render(error); }
  done(ms) {
    this.el.classList.add("ok");
    if (!this.text.trim() && !Object.keys(this.series).length) this.el.innerHTML = `<div class="out-empty">Finished with no output${ms != null ? ` · ${ms.toFixed(0)} ms` : ""}</div>`;
  }
}

/** Keeps the start of a long recursion trace readable. */
function trimTrace(err) {
  const lines = String(err).split("\n");
  if (lines.length <= 14) return err;
  return [...lines.slice(0, 8), `    … ${lines.length - 11} more frames …`, ...lines.slice(-3)].join("\n");
}

const PALETTE = ["#22d3ee", "#a855f7", "#22c55e", "#f59e0b", "#f472b6", "#3b82f6"];

/** Small line chart for tlm::plot series. */
export function plot(series) {
  const W = 560, H = 180, P = 46;
  const all = Object.values(series).flatMap((s) => s.pts);
  let [x0, x1] = [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
  let [y0, y1] = [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
  if (x1 === x0) x1 = x0 + 1;
  if (y1 === y0) { y1 += 1; y0 -= 1; }
  const pad = (y1 - y0) * 0.08; y0 -= pad; y1 += pad;
  const X = (x) => P + ((x - x0) / (x1 - x0)) * (W - P - 8);
  const Y = (y) => H - 18 - ((y - y0) / (y1 - y0)) * (H - 30);
  const names = Object.keys(series);
  const paths = names.map((n, i) => {
    const d = series[n].pts.map((p, j) => `${j ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
    return `<path d="${d}" fill="none" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="2" stroke-linejoin="round" class="plot-line"/>`;
  }).join("");
  const grid = [0, 0.5, 1].map((k) => {
    const y = y0 + (y1 - y0) * k;
    return `<line x1="${P}" x2="${W - 8}" y1="${Y(y)}" y2="${Y(y)}" class="plot-grid"/><text x="${P - 4}" y="${Y(y) + 3}" class="plot-tick" text-anchor="end">${+y.toPrecision(3)}</text>`;
  }).join("");
  const legend = names.map((n, i) => `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${esc(n)}${series[n].unit ? ` [${esc(series[n].unit)}]` : ""}</span>`).join("");
  return h(`<div class="plot"><div class="plot-legend">${icon("wave")}${legend}</div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${paths}
    <text x="${W - 8}" y="${H - 4}" class="plot-tick" text-anchor="end">t = ${+x1.toPrecision(3)} s</text></svg></div>`);
}

// ------------------------------------------------------------------ runnable snippet

const MODE_LABEL = { run: "", realtime: "real time", error: "shows an error", repl: "REPL" };

export function snippet(block, { key, onRun } = {}) {
  if (block.mode === "static") {
    const el = h(`<div class="snippet static"><div class="snippet-code"></div></div>`);
    highlightStatic(el.querySelector(".snippet-code"), block.code);
    return el;
  }
  const el = h(`<div class="snippet mode-${block.mode}">
    <div class="snippet-bar">
      <span class="snippet-tag">${icon("code")} Tulpa${MODE_LABEL[block.mode] ? ` · <em>${MODE_LABEL[block.mode]}</em>` : ""}</span>
      <span class="snippet-actions">
        <button class="ghost sm copy" title="Copy">${icon("copy")}</button>
        <button class="ghost sm reset" title="Reset">${icon("reset")}</button>
        <button class="run sm">${icon("play")}<span>Run</span></button>
      </span>
    </div>
    <div class="snippet-code"></div>
    <div class="console" hidden></div>
  </div>`);
  const draft = key && state.drafts[key];
  const ed = createEditor(el.querySelector(".snippet-code"), {
    code: draft ?? block.code,
    onRun: () => run(),
    onChange: (c) => { if (key) { if (c === block.code) delete state.drafts[key]; else state.drafts[key] = c; save(); } },
  });
  const out = new Console(el.querySelector(".console"));
  const runBtn = el.querySelector(".run");
  let running = false;

  async function run() {
    if (running) { runtime.stop(); return; }
    if (block.mode === "repl") return runRepl();
    running = true;
    el.classList.add("running");
    runBtn.innerHTML = `${icon("stop")}<span>Stop</span>`;
    out.el.hidden = false;
    out.clear();
    out.el.innerHTML = `<div class="out-empty pulse">Running…</div>`;
    let first = true;
    const res = await runtime.run(ed.get(), {
      virtualTime: block.mode !== "realtime",
      onOutput: (t) => { if (first) { out.el.innerHTML = ""; first = false; } out.write(t); },
    });
    running = false;
    el.classList.remove("running");
    runBtn.innerHTML = `${icon("play")}<span>Run</span>`;
    if (first) out.el.innerHTML = "";
    if (res.ok) { out.done(res.ms); haptic("select"); }
    else { out.fail(res.error); haptic(block.mode === "error" ? "warning" : "error"); if (block.mode !== "error") shake(el); }
    unlock("first-run") && save();
    onRun && onRun(res);
  }

  async function runRepl() {
    out.el.hidden = false;
    out.clear();
    await runtime.repl.reset();
    let html = "";
    for (const line of ed.get().split("\n")) {
      if (!line.trim()) continue;
      let printed = "";
      const r = await runtime.repl.feed(line, (t) => (printed += t));
      html += `<div class="repl-in"><span>›</span> ${esc(line)}</div>`;
      if (printed) html += `<pre class="out-text">${esc(printed.replace(/\n$/, ""))}</pre>`;
      if (r.status === "value" && r.text) html += `<div class="repl-val">${esc(r.text)}</div>`;
      if (r.status === "error") html += `<pre class="out-error">${esc(r.text)}</pre>`;
    }
    out.el.innerHTML = html;
    haptic("select");
    unlock("first-run") && save();
  }

  runBtn.onclick = run;
  el.querySelector(".reset").onclick = () => { ed.set(block.code); out.el.hidden = true; out.clear(); };
  el.querySelector(".copy").onclick = async (e) => {
    try { await navigator.clipboard.writeText(ed.get()); pop(e.currentTarget); } catch { /* clipboard blocked */ }
  };
  el._editor = ed;
  return el;
}

// ------------------------------------------------------------------ quiz

/** Renders a list of questions; onAnswer(q, correct) fires once per question. */
export function quiz(questions, { onAnswer, title = "Check your understanding" } = {}) {
  const el = h(`<div class="card quiz"><div class="quiz-head">${icon("brain")}<span>${title}</span><span class="quiz-score"></span></div></div>`);
  let correct = 0, answered = 0;
  questions.forEach((q, qi) => {
    const qEl = h(`<div class="question"><div class="q-text">${md(q.q)}</div><div class="options"></div><div class="explain" hidden></div></div>`);
    const opts = qEl.querySelector(".options");
    const order = q.options.map((_, i) => i);
    q.options.forEach((o, i) => {
      const b = h(`<button class="option tap"><span class="opt-key">${String.fromCharCode(65 + i)}</span><span class="opt-text">${mdInline(o)}</span></button>`);
      b.onclick = () => {
        if (qEl.classList.contains("answered")) return;
        qEl.classList.add("answered");
        const right = i === q.answer;
        answered++;
        if (right) correct++;
        b.classList.add(right ? "right" : "wrong");
        opts.children[q.answer].classList.add("right");
        if (right) { pop(b); haptic("success"); } else { shake(b); haptic("error"); }
        const ex = qEl.querySelector(".explain");
        ex.innerHTML = `<strong>${right ? "Correct!" : "Not quite."}</strong> ${mdInline(q.explain || "")}`;
        ex.hidden = false;
        el.querySelector(".quiz-score").textContent = `${correct}/${answered}`;
        onAnswer && onAnswer(q, right, { correct, answered, total: questions.length });
      };
      opts.appendChild(b);
    });
    void order;
    el.appendChild(qEl);
  });
  return el;
}

// ------------------------------------------------------------------ exercise

/**
 * Checked exercise. onPass({attempts, hintsUsed, firstTry}) fires the first time it passes.
 */
export function exercise(ex, { key, onPass, done = false, label = "Exercise" } = {}) {
  const el = h(`<div class="card exercise ${done ? "passed" : ""}">
    <div class="ex-head">${icon("target")}<span class="ex-label">${label}</span><h3>${esc(ex.title)}</h3>${done ? `<span class="badge ok">${icon("check")} Passed</span>` : ""}</div>
    <div class="ex-prompt prose">${md(ex.prompt)}</div>
    <div class="snippet exercise-editor">
      <div class="snippet-bar"><span class="snippet-tag">${icon("code")} Your code</span>
        <span class="snippet-actions">
          <button class="ghost sm reset" title="Reset to starter">${icon("reset")}</button>
          <button class="ghost sm run-only">${icon("play")}<span>Run</span></button>
          <button class="run sm check">${icon("check")}<span>Check</span></button>
        </span></div>
      <div class="snippet-code"></div>
      <div class="console" hidden></div>
    </div>
    <div class="ex-feedback" hidden></div>
    <div class="ex-tools">
      ${ex.hints?.length ? `<button class="ghost hint-btn">${icon("hint")} Hint <span class="count"></span></button>` : ""}
      <button class="ghost solution-btn" hidden>${icon("eye")} Show solution</button>
    </div>
    <div class="hints"></div>
  </div>`);
  const ed = createEditor(el.querySelector(".snippet-code"), {
    code: (key && state.drafts[key]) ?? ex.starter ?? "",
    onRun: () => check(),
    onChange: (c) => { if (key) { state.drafts[key] = c; save(); } },
  });
  const out = new Console(el.querySelector(".console"));
  const fb = el.querySelector(".ex-feedback");
  let attempts = 0, hintsUsed = 0, passed = done;

  async function execute(src) {
    out.el.hidden = false;
    out.clear();
    out.el.innerHTML = `<div class="out-empty pulse">Running…</div>`;
    let first = true;
    const res = await runtime.run(src, { onOutput: (t) => { if (first) { out.el.innerHTML = ""; first = false; } out.write(t); } });
    if (first) out.el.innerHTML = "";
    if (!res.ok) out.fail(res.error); else out.done(res.ms);
    return res;
  }

  async function check() {
    const btn = el.querySelector(".check");
    btn.disabled = true;
    attempts++;
    const code = ed.get();
    // the learner sees their own program's output; hidden checks run separately
    const res = await execute(code);
    let ok = res.ok, why = res.ok ? "" : "Your program stopped with an error. Read the message above.";
    if (ok && ex.expect != null && normalizeOutput(out.text) !== normalizeOutput(ex.expect)) {
      ok = false;
      why = `Output doesn't match yet.<div class="diff"><div><b>Expected</b><pre>${esc(normalizeOutput(ex.expect))}</pre></div><div><b>Yours</b><pre>${esc(normalizeOutput(out.text)) || "(nothing)"}</pre></div></div>`;
    }
    if (ok && ex.check) {
      const r2 = await runtime.run(code + "\n" + ex.check, { onOutput: () => {} });
      if (!r2.ok) { ok = false; why = `The output looks right, but a hidden test failed:<pre>${esc(String(r2.error).split("\n")[0])}</pre>`; }
    }
    btn.disabled = false;
    fb.hidden = false;
    if (ok) {
      fb.className = "ex-feedback good";
      fb.innerHTML = `${icon("check")} <div><strong>${pickPraise()}</strong> ${attempts === 1 ? "First try!" : `Solved in ${attempts} attempts.`}</div>`;
      el.classList.add("passed");
      pop(fb);
      haptic("success");
      if (!passed) {
        passed = true;
        const r = onPass && onPass({ attempts, hintsUsed, firstTry: attempts === 1 });
        if (r && r.gained) xpFloat(btn, r.gained);
      }
    } else {
      fb.className = "ex-feedback bad";
      fb.innerHTML = `${icon("x")} <div>${why}</div>`;
      shake(fb);
      haptic("error");
      if (attempts >= 2) el.querySelector(".solution-btn").hidden = false;
    }
  }

  el.querySelector(".check").onclick = check;
  el.querySelector(".run-only").onclick = async () => { const r = await execute(ed.get()); haptic(r.ok ? "select" : "error"); };
  el.querySelector(".reset").onclick = () => { ed.set(ex.starter || ""); out.el.hidden = true; fb.hidden = true; };
  const hb = el.querySelector(".hint-btn");
  if (hb) {
    const upd = () => (hb.querySelector(".count").textContent = `${hintsUsed}/${ex.hints.length}`);
    upd();
    hb.onclick = () => {
      if (hintsUsed >= ex.hints.length) return;
      const hint = h(`<div class="hint">${icon("bulb")}<div>${md(ex.hints[hintsUsed])}</div></div>`);
      el.querySelector(".hints").appendChild(hint);
      pop(hint);
      hintsUsed++;
      upd();
      if (hintsUsed >= ex.hints.length) el.querySelector(".solution-btn").hidden = false;
    };
  }
  el.querySelector(".solution-btn").onclick = (e) => {
    const box = h(`<div class="solution"><div class="sol-head">${icon("eye")} Solution <button class="ghost sm use">Use this code</button></div><div class="snippet-code"></div></div>`);
    highlightStatic(box.querySelector(".snippet-code"), ex.solution);
    box.querySelector(".use").onclick = () => ed.set(ex.solution);
    e.currentTarget.replaceWith(box);
    hintsUsed = Math.max(hintsUsed, 99);
  };
  el._editor = ed;
  return el;
}

const PRAISE = ["Nailed it!", "Excellent!", "Clean solution!", "That's it!", "Perfect!", "Great work!"];
const pickPraise = () => PRAISE[(Math.random() * PRAISE.length) | 0];

// ------------------------------------------------------------------ callouts

const CALLOUT = { note: ["note", "Note"], tip: ["bulb", "Tip"], warn: ["shield", "Watch out"], deep: ["sparkle", "Deep dive"], takeaways: ["book", "Key takeaways"] };

export function callout(b) {
  const [ic, label] = CALLOUT[b.kind] || ["note", b.kind];
  return h(`<div class="callout ${b.kind}"><div class="callout-head">${icon(ic)}<span>${esc(b.title || label)}</span></div><div class="prose">${md(b.text)}</div></div>`);
}

// ------------------------------------------------------------------ state machine diagram

/** SVG diagram of a machine graph from runtime.machines(). */
export function machineDiagram(m, current) {
  const states = m.states.map((s) => s.name);
  const n = states.length;
  const W = 520, H = Math.max(260, 120 + n * 26);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 60;
  const pos = Object.fromEntries(states.map((s, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [s, n === 1 ? [cx, cy] : [cx + R * Math.cos(a) * 1.25, cy + R * Math.sin(a)]];
  }));
  const pairCount = {};
  const edges = m.transitions.flatMap((t) => {
    const froms = t.global ? states.filter((s) => s !== t.to) : [t.from];
    return froms.map((f) => ({ ...t, from: f }));
  }).map((t) => {
    const k = [t.from, t.to].sort().join("|");
    const idx = (pairCount[k] = (pairCount[k] || 0) + 1);
    const [x1, y1] = pos[t.from], [x2, y2] = pos[t.to] || pos[t.from];
    const label = esc(t.event + (t.params?.length ? `(${t.params.join(", ")})` : "") + (t.guard ? " [?]" : ""));
    if (t.from === t.to || t.internal) {
      return `<path d="M${x1 - 14},${y1 - 22} C${x1 - 40},${y1 - 80} ${x1 + 40},${y1 - 80} ${x1 + 14},${y1 - 22}" class="m-edge ${t.global ? "global" : ""}" marker-end="url(#arr)"/><text x="${x1}" y="${y1 - 70}" class="m-label">${label}</text>`;
    }
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const bend = (idx % 2 ? 1 : -1) * (22 + 14 * Math.floor((idx - 1) / 2)) * (t.from < t.to ? 1 : -1);
    const sx = x1 + ux * 34, sy = y1 + uy * 22, ex = x2 - ux * 38, ey = y2 - uy * 25;
    const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
    return `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" class="m-edge ${t.global ? "global" : ""}" marker-end="url(#arr)"/><text x="${mx}" y="${my - 4}" class="m-label">${label}</text>`;
  }).join("");
  const nodes = states.map((s) => {
    const [x, y] = pos[s];
    const cls = `m-state ${s === (current || m.initial) ? "current" : ""}`;
    return `<g class="${cls}"><rect x="${x - 46}" y="${y - 20}" width="92" height="40" rx="12"/><text x="${x}" y="${y + 5}">${esc(s)}</text></g>`;
  }).join("");
  const [ix, iy] = pos[m.initial];
  return h(`<div class="machine"><div class="machine-title">${icon("graph")} machine <b>${esc(m.name)}</b></div>
    <svg viewBox="0 0 ${W} ${H}"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#60a5fa"/></marker></defs>
    <circle cx="${ix - 70}" cy="${iy}" r="6" class="m-init"/><path d="M${ix - 64},${iy} L${ix - 50},${iy}" class="m-edge" marker-end="url(#arr)"/>
    ${edges}${nodes}</svg></div>`);
}
