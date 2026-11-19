#!/usr/bin/env node
// Runs a .rav file (or stdin) on the WebAssembly runtime, exactly as the app does.
//   node scripts/tulpa-run.mjs file.rav [--real-time] [--tests] [--verify]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { instantiate } from "../web/src/runtime/core.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "../web/public/tulpa");
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const src = file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
const t = await instantiate(fs.readFileSync(path.join(pub, "tulpa.wasm")), { onOutput: (s) => process.stdout.write(s) });
for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(pub, "stdlib.json"), "utf8")))) t.putFile(k, v);
let r;
if (args.includes("--tests")) r = t.tests(src);
else if (args.includes("--verify")) r = t.verify(src);
else r = t.run(src, !args.includes("--real-time"));
if (!r.ok) { console.error("ERROR:", r.error); process.exit(70); }
if (args.includes("--tests") || args.includes("--verify")) console.log(JSON.stringify(r));
