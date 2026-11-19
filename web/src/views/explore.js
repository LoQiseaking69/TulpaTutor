import { h, esc, md, Console, machineDiagram } from "../ui/components.js";
import { createEditor } from "../ui/editor.js";
import { icon } from "../ui/icons.js";
import { haptic, shake } from "../ui/fx.js";
import { runtime } from "../runtime/client.js";
import { state, save, unlock } from "../state.js";
import { EXAMPLES } from "./examples.js";
import { REFERENCE } from "./reference.js";

const STARTER = `# Playground: write any Tulpa here. Ctrl/Cmd+Enter runs it.
machine Rover {
    state Idle { on go => Driving }
    state Driving {
        on obstacle => Avoiding
        on stop => Idle
    }
    state Avoiding { on clear => Driving }
}

let r = Rover()
let speed = 0.4[m/s]
r.go()
print(r.state, "at", speed.to("km/h"))
for t in 0..20 {
    tlm::plot("speed", speed.in("m/s") * (1 - exp(-t / 5.0)), t * 0.1)
}
`;

const KEYS = ["[", "]", "{", "}", "(", ")", "=>", "|>", "..", ":", "\"", "#", "[m]", "[s]", "[deg]", "[m/s]"];

export function render(params) {
  const tab = params[0] || "playground";
  const el = h(`<div class="page explore">
    <div class="page-head"><h2>${icon("cube")} Explore</h2><p>A full Tulpa workspace: editor, REPL, state-machine inspector and contract verifier, all on the real runtime.</p></div>
    <div class="tabs" role="tablist">
      <a class="tab ${tab === "playground" ? "on" : ""}" href="#/explore/playground">${icon("terminal")} Playground</a>
      <a class="tab ${tab === "examples" ? "on" : ""}" href="#/explore/examples">${icon("robot")} Examples</a>
      <a class="tab ${tab === "reference" ? "on" : ""}" href="#/explore/reference">${icon("book")} Reference</a>
    </div>
    <div class="tab-body"></div>
  </div>`);
  const body = el.querySelector(".tab-body");
  if (tab === "examples") body.append(examples());
  else if (tab === "reference") body.append(reference());
  else body.append(playground(params[1]));
  return el;
}

function playground(exampleId) {
  const ex = exampleId && EXAMPLES.find((e) => e.id === exampleId);
  const el = h(`<div class="playground">
    <div class="pg-editor card">
      <div class="snippet-bar"><span class="snippet-tag">${icon("code")} ${ex ? esc(ex.title) : "playground.rav"}</span>
        <span class="snippet-actions">
          <label class="toggle sm" title="Virtual clock: sleeps are instant"><input type="checkbox" class="vt" checked><span>virtual time</span></label>
          <button class="ghost sm clear" title="New file">${icon("reset")}</button>
          <button class="run sm runbtn">${icon("play")}<span>Run</span></button>
        </span></div>
      <div class="snippet-code"></div>
      <div class="keybar">${KEYS.map((k) => `<button class="key" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div>
    </div>
    <div class="pg-side card">
      <div class="tabs small">
        <button class="tab on" data-p="output">${icon("terminal")} Output</button>
        <button class="tab" data-p="repl">${icon("arrow")} REPL</button>
        <button class="tab" data-p="machines">${icon("graph")} Machines</button>
        <button class="tab" data-p="verify">${icon("shield")} Verify</button>
      </div>
      <div class="pane output"><div class="console"><div class="out-empty">Press Run (or Ctrl/Cmd+Enter).</div></div></div>
      <div class="pane repl" hidden>
        <div class="repl-log"><div class="out-empty">Tulpa REPL: definitions persist between lines. Try <code>let x = 3[m]</code>, then <code>x * 2</code>.</div></div>
        <form class="repl-form"><span class="prompt">›</span><input class="field mono" placeholder="Tulpa expression…" autocapitalize="off" autocomplete="off" spellcheck="false"><button class="ghost sm" type="button">${icon("reset")}</button></form>
      </div>
      <div class="pane machines" hidden><div class="mlist"></div></div>
      <div class="pane verify" hidden>
        <p class="muted">Fuzzes every function that has an <code>ensure</code> or a return annotation with hundreds of generated inputs, and runs <code>define_test!</code> blocks.</p>
        <button class="primary sm do-verify">${icon("shield")} Verify contracts</button> <button class="ghost sm do-tests">${icon("check")} Run tests</button>
        <div class="vres"></div>
      </div>
    </div>
  </div>`);
  const ed = createEditor(el.querySelector(".snippet-code"), {
    code: ex ? ex.code : state.drafts.playground ?? STARTER,
    onRun: () => run(),
    onChange: (c) => { if (!ex) { state.drafts.playground = c; save(); } },
  });
  const out = new Console(el.querySelector(".output .console"));
  const runBtn = el.querySelector(".runbtn");
  let running = false;

  const show = (p) => {
    el.querySelectorAll(".pg-side .tab").forEach((t) => t.classList.toggle("on", t.dataset.p === p));
    el.querySelectorAll(".pane").forEach((x) => (x.hidden = !x.classList.contains(p)));
    if (p === "machines") refreshMachines();
  };
  el.querySelectorAll(".pg-side .tab").forEach((t) => (t.onclick = () => show(t.dataset.p)));

  async function run() {
    if (running) return runtime.stop();
    show("output");
    running = true;
    runBtn.innerHTML = `${icon("stop")}<span>Stop</span>`;
    out.clear();
    out.el.innerHTML = `<div class="out-empty pulse">Running…</div>`;
    let first = true;
    const res = await runtime.run(ed.get(), {
      virtualTime: el.querySelector(".vt").checked,
      timeoutMs: 30000,
      onOutput: (t) => { if (first) { out.el.innerHTML = ""; first = false; } out.write(t); },
    });
    running = false;
    runBtn.innerHTML = `${icon("play")}<span>Run</span>`;
    if (first) out.el.innerHTML = "";
    if (res.ok) { out.done(res.ms); haptic("select"); } else { out.fail(res.error); haptic("error"); shake(out.el); }
    unlock("first-run") && save();
  }
  runBtn.onclick = run;
  el.querySelector(".clear").onclick = () => { ed.set("# new file\n"); ed.focus(); };
  el.querySelectorAll(".key").forEach((k) => (k.onclick = () => ed.insert(k.dataset.k)));

  async function refreshMachines() {
    const box = el.querySelector(".mlist");
    const ms = await runtime.machines(ed.get());
    box.innerHTML = "";
    if (!Array.isArray(ms) || !ms.length) { box.innerHTML = `<div class="out-empty">No <code>machine</code> definitions in this file.</div>`; return; }
    for (const m of ms) {
      box.append(machineDiagram(m));
      const det = h(`<details class="mermaid-src"><summary>Mermaid source</summary><pre>${esc(m.mermaid)}</pre></details>`);
      box.append(det);
    }
  }

  // REPL
  const log = el.querySelector(".repl-log");
  const input = el.querySelector(".repl-form input");
  let started = false, hist = [], hi = 0;
  el.querySelector(".repl-form").onsubmit = async (e) => {
    e.preventDefault();
    const line = input.value;
    if (!started) { log.innerHTML = ""; await runtime.repl.reset(); started = true; }
    hist.push(line); hi = hist.length;
    input.value = "";
    let printed = "";
    const r = await runtime.repl.feed(line, (t) => (printed += t));
    log.insertAdjacentHTML("beforeend", `<div class="repl-in ${r.status === "more" ? "more" : ""}"><span>${r.status === "more" ? "…" : "›"}</span> ${esc(line)}</div>`
      + (printed ? `<pre class="out-text">${esc(printed.replace(/\n$/, ""))}</pre>` : "")
      + (r.status === "value" && r.text ? `<div class="repl-val">${esc(r.text)}</div>` : "")
      + (r.status === "error" ? `<pre class="out-error">${esc(r.text)}</pre>` : ""));
    log.scrollTop = log.scrollHeight;
    haptic(r.status === "error" ? "error" : "select");
  };
  input.onkeydown = (e) => {
    if (e.key === "ArrowUp" && hi > 0) { input.value = hist[--hi]; e.preventDefault(); }
    if (e.key === "ArrowDown" && hi < hist.length) { input.value = hist[++hi] || ""; e.preventDefault(); }
  };
  el.querySelector(".repl-form button").onclick = async () => { await runtime.repl.reset(); log.innerHTML = `<div class="out-empty">Session reset.</div>`; started = true; };

  // Verify
  el.querySelector(".do-verify").onclick = async () => {
    const box = el.querySelector(".vres");
    box.innerHTML = `<div class="out-empty pulse">Fuzzing contracts…</div>`;
    const r = await runtime.verify(ed.get(), 300);
    if (!r.ok) { box.innerHTML = `<pre class="out-error">${esc(r.error)}</pre>`; return; }
    if (!r.results.length) { box.innerHTML = `<div class="out-empty">No functions with <code>ensure</code> or a return annotation.</div>`; return; }
    box.innerHTML = r.results.map((f) => `<div class="vrow ${f.ok ? "ok" : "bad"}">${icon(f.ok ? "check" : "x")}<div><b>${esc(f.name)}</b>
      <span>${f.passed} passed${f.discarded ? `, ${f.discarded} discarded by require` : ""}</span>
      ${f.ok ? "" : `<pre>${esc(f.error || "")}${f.counterexample.length ? `\ncounterexample: ${esc(f.name)}(${esc(f.counterexample.join(", "))})` : ""}</pre>`}</div></div>`).join("");
    haptic(r.results.every((f) => f.ok) ? "success" : "error");
  };
  el.querySelector(".do-tests").onclick = async () => {
    const box = el.querySelector(".vres");
    box.innerHTML = `<div class="out-empty pulse">Running tests…</div>`;
    const r = await runtime.tests(ed.get());
    if (!r.ok) { box.innerHTML = `<pre class="out-error">${esc(r.error)}</pre>`; return; }
    box.innerHTML = `<div class="vrow ${r.failed.length ? "bad" : "ok"}">${icon(r.failed.length ? "x" : "check")}<div><b>${r.passed} passed, ${r.failed.length} failed</b>
      ${r.failed.map((f) => `<pre>${esc(f.name)}: ${esc(f.error)}</pre>`).join("")}${r.passed + r.failed.length === 0 ? `<span>No <code>define_test!</code> blocks found.</span>` : ""}</div></div>`;
  };
  return el;
}

function examples() {
  const el = h(`<div class="examples stagger">${EXAMPLES.map((e) => `<a class="card example tap" href="#/explore/playground/${e.id}">
    <div class="ex-icon">${icon(e.icon)}</div><div><h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p><span class="tags">${e.tags.map((t) => `<em>${esc(t)}</em>`).join("")}</span></div>${icon("chevron")}</a>`).join("")}</div>`);
  return el;
}

function reference() {
  const el = h(`<div class="reference">
    <input class="field search" placeholder="Search the reference (e.g. match, signal, I2C)…">
    <div class="ref-list">${REFERENCE.map((s) => `<section class="card ref" data-text="${esc((s.title + " " + s.body).toLowerCase())}"><h3>${esc(s.title)}</h3><div class="prose">${md(s.body)}</div></section>`).join("")}</div>
  </div>`);
  el.querySelector(".search").oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    el.querySelectorAll(".ref").forEach((s) => (s.hidden = q && !s.dataset.text.includes(q)));
  };
  return el;
}
