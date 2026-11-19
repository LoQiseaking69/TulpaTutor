// Shared loader for tulpa.wasm: used by the browser worker and by the Node test harness.
// The module exports a plain C ABI (see runtime/src/lib.rs); strings travel as UTF-8.
const enc = new TextEncoder();
const dec = new TextDecoder();

export async function instantiate(bytes, { onOutput, sleep } = {}) {
  let mem;
  const read = (p, l) => dec.decode(new Uint8Array(mem.buffer, p, l));
  const env = {
    tt_out: (p, l) => onOutput && onOutput(read(p, l)),
    tt_now_ms: () => performance.now(),
    tt_wall_ms: () => Date.now(),
    tt_sleep_ms: (ms) => (sleep ? sleep(ms) : busyWait(ms)),
  };
  const { instance } = await WebAssembly.instantiate(bytes, { env });
  const x = instance.exports;
  mem = x.memory;
  x.tt_init();

  const put = (s) => {
    const b = enc.encode(s);
    const p = x.tt_alloc(b.length);
    new Uint8Array(mem.buffer, p, b.length).set(b);
    return [p, b.length];
  };
  const withStr = (s, f) => {
    const [p, l] = put(s);
    try { return f(p, l); } finally { x.tt_free(p, l); }
  };
  const ret = () => read(x.tt_ret_ptr(), x.tt_ret_len());

  return {
    exports: x,
    version: () => (x.tt_version(), ret()),
    modules: () => (x.tt_modules(), JSON.parse(ret())),
    putFile: (path, data) => withStr(path, (pp, pl) => withStr(data, (dp, dl) => x.tt_vfs_put(pp, pl, dp, dl))),
    clearWork: () => x.tt_vfs_clear_work(),
    pushInput: (line) => withStr(line, (p, l) => x.tt_input_push(p, l)),
    run: (src, virtualTime = false) => {
      const code = withStr(src, (p, l) => x.tt_run(p, l, virtualTime ? 1 : 0));
      return { ok: code === 0, error: code === 0 ? null : ret() };
    },
    tests: (src, virtualTime = true) => {
      const code = withStr(src, (p, l) => x.tt_tests(p, l, virtualTime ? 1 : 0));
      return code === 0 ? { ok: true, ...JSON.parse(ret()) } : { ok: false, error: ret() };
    },
    verify: (src, trials = 200) => {
      const code = withStr(src, (p, l) => x.tt_verify(p, l, trials));
      return code === 0 ? { ok: true, results: JSON.parse(ret()) } : { ok: false, error: ret() };
    },
    diagnostics: (src) => withStr(src, (p, l) => (x.tt_diagnostics(p, l), JSON.parse(ret() || "[]"))),
    symbols: (src) => withStr(src, (p, l) => (x.tt_symbols(p, l), JSON.parse(ret() || "[]"))),
    machines: (src) => withStr(src, (p, l) => (x.tt_machines(p, l), JSON.parse(ret() || "[]"))),
    completion: (src, line, col) => withStr(src, (p, l) => (x.tt_completion(p, l, line, col), JSON.parse(ret() || "[]"))),
    hover: (src, line, col) => withStr(src, (p, l) => (x.tt_hover(p, l, line, col), ret())),
    bytecode: (src) => withStr(src, (p, l) => { const c = x.tt_bytecode(p, l); return { ok: c === 0, text: ret() }; }),
    replReset: () => x.tt_repl_reset(),
    replFeed: (line) => {
      const code = withStr(line, (p, l) => x.tt_repl_feed(p, l));
      return { status: ["value", "more", "error"][code], text: ret() };
    },
  };
}

function busyWait(ms) {
  const end = performance.now() + Math.min(ms, 10_000);
  while (performance.now() < end) { /* the worker owns this thread */ }
}
