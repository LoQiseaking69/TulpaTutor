// Page-side handle to the Tulpa runtime. Two workers: `exec` runs programs (and can be
// killed with stop()), `lang` answers editor queries so typing never waits behind a run.
import WorkerURL from "./worker.js?worker&url";

const BASE = new URL("tulpa/", new URL(import.meta.env.BASE_URL, location.href)).href;

class Lane {
  constructor(name) {
    this.name = name;
    this.seq = 0;
    this.pending = new Map();
    this.onOutput = null;
    this.spawn();
  }
  spawn() {
    this.worker = new Worker(WorkerURL, { type: "module", name: `tulpa-${this.name}` });
    this.worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "out") return this.onOutput && this.onOutput(m.text);
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      if (m.type === "crash") {
        p.resolve({ ok: false, error: m.error, crashed: true });
        this.restart(); // linear memory may be poisoned after a trap
      } else p.resolve(m.result);
    };
    this.booted = this.call("boot", { base: BASE });
  }
  call(op, args) {
    const id = ++this.seq;
    return new Promise((resolve) => {
      this.pending.set(id, { resolve });
      this.worker.postMessage({ id, op, args });
    });
  }
  restart(reason) {
    this.worker.terminate();
    for (const p of this.pending.values()) p.resolve({ ok: false, error: reason || "stopped", stopped: true });
    this.pending.clear();
    this.spawn();
  }
}

let exec, lang;
function lanes() {
  if (!exec) { exec = new Lane("exec"); lang = new Lane("lang"); }
  return { exec, lang };
}

let busy = Promise.resolve();

export const runtime = {
  ready: () => lanes().exec.booted,
  version: async () => { await lanes().lang.booted; return lang.call("version"); },

  /** Runs a program. `onOutput(text)` receives output as it is printed. */
  run(src, { onOutput, virtualTime = true, inputs = [], files = {}, timeoutMs = 15000 } = {}) {
    const job = busy.then(async () => {
      const { exec } = lanes();
      await exec.booted;
      exec.onOutput = onOutput;
      let timer;
      const timeout = new Promise((r) => {
        timer = setTimeout(() => {
          exec.restart("time limit reached: the program ran for more than " + timeoutMs / 1000 + " s (an endless loop?)");
          r(null);
        }, timeoutMs);
      });
      const t0 = performance.now();
      const res = await Promise.race([exec.call("run", { src, virtualTime, inputs, files }), timeout]);
      clearTimeout(timer);
      exec.onOutput = null;
      return { ...(res || { ok: false, error: "time limit reached", stopped: true }), ms: performance.now() - t0 };
    });
    busy = job.catch(() => {});
    return job;
  },
  stop() { if (exec) exec.restart("stopped by you"); },

  async tests(src) { const { exec } = lanes(); await exec.booted; return exec.call("tests", { src }); },
  async verify(src, trials = 200) { const { exec } = lanes(); await exec.booted; return exec.call("verify", { src, trials }); },

  async diagnostics(src) { const { lang } = lanes(); await lang.booted; return lang.call("diagnostics", { src }); },
  async machines(src) { const { lang } = lanes(); await lang.booted; return lang.call("machines", { src }); },
  async symbols(src) { const { lang } = lanes(); await lang.booted; return lang.call("symbols", { src }); },
  async completion(src, line, col) { const { lang } = lanes(); await lang.booted; return lang.call("completion", { src, line, col }); },
  async hover(src, line, col) { const { lang } = lanes(); await lang.booted; return lang.call("hover", { src, line, col }); },
  async bytecode(src) { const { lang } = lanes(); await lang.booted; return lang.call("bytecode", { src }); },

  repl: {
    async reset() { const { exec } = lanes(); await exec.booted; return exec.call("replReset"); },
    async feed(line, onOutput) {
      const { exec } = lanes();
      await exec.booted;
      exec.onOutput = onOutput;
      const r = await exec.call("replFeed", { line });
      exec.onOutput = null;
      return r;
    },
  },
};

/** Splits program output into plain text and `@@tlm` telemetry records. */
export function splitTelemetry(text) {
  const lines = [];
  const tlm = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("@@tlm ")) {
      try { tlm.push(JSON.parse(line.slice(6))); } catch { lines.push(line); }
    } else lines.push(line);
  }
  return { text: lines.join("\n"), tlm };
}
