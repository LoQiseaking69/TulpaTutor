// Runs tulpa.wasm off the UI thread. One request at a time; output streams back as it is
// printed. The page stops a runaway program by terminating this worker and starting another.
import { instantiate } from "./core.js";

let tulpa = null;
let ready = null;

function boot(base) {
  ready = (async () => {
    const [wasm, stdlib] = await Promise.all([
      fetch(new URL("tulpa.wasm", base)).then((r) => r.arrayBuffer()),
      fetch(new URL("stdlib.json", base)).then((r) => r.json()),
    ]);
    tulpa = await instantiate(wasm, {
      onOutput: (text) => postMessage({ type: "out", text }),
      sleep: (ms) => {
        // Blocks this worker for real-time programs (the page is unaffected).
        const end = performance.now() + Math.min(ms, 30_000);
        while (performance.now() < end) { /* busy wait */ }
      },
    });
    for (const [path, src] of Object.entries(stdlib)) tulpa.putFile(path, src);
    return tulpa.version();
  })();
  return ready;
}

const OPS = {
  version: () => tulpa.version(),
  modules: () => tulpa.modules(),
  run: ({ src, virtualTime = true, inputs = [], files = {} }) => {
    tulpa.clearWork();
    for (const [p, s] of Object.entries(files)) tulpa.putFile(p, s);
    for (const line of inputs) tulpa.pushInput(line);
    return tulpa.run(src, virtualTime);
  },
  tests: ({ src }) => tulpa.tests(src, true),
  verify: ({ src, trials }) => tulpa.verify(src, trials),
  diagnostics: ({ src }) => tulpa.diagnostics(src),
  symbols: ({ src }) => tulpa.symbols(src),
  machines: ({ src }) => tulpa.machines(src),
  completion: ({ src, line, col }) => tulpa.completion(src, line, col),
  hover: ({ src, line, col }) => tulpa.hover(src, line, col),
  bytecode: ({ src }) => tulpa.bytecode(src),
  replReset: () => tulpa.replReset(),
  replFeed: ({ line }) => tulpa.replFeed(line),
};

onmessage = async (e) => {
  const { id, op, args } = e.data;
  try {
    if (op === "boot") return postMessage({ id, type: "done", result: await boot(args.base) });
    await ready;
    const result = OPS[op](args || {});
    postMessage({ id, type: "done", result });
  } catch (err) {
    const msg = String(err && err.message || err);
    const friendly = /call stack|too much recursion/i.test(msg)
      ? "recursion went deeper than the browser allows; use a loop or reduce the depth"
      : /unreachable/i.test(msg) ? "the runtime stopped unexpectedly (internal panic); see the output above"
      : msg;
    postMessage({ id, type: "crash", error: friendly });
  }
};
