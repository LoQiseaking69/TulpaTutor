#!/usr/bin/env node
// Validates the whole course against the real runtime (web/public/tulpa/tulpa.wasm):
//  * every runnable snippet runs (and every `error` snippet really fails)
//  * every exercise solution produces its `expect` output and passes its hidden `check`
//  * every exercise starter does NOT already pass (so there is something to do)
//  * every quiz question has exactly one marked answer
//  * challenges and the certification exam follow the same rules
//
//   node scripts/check-course.mjs [filter]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { instantiate } from "../web/src/runtime/core.js";
import { parseLesson, normalizeOutput } from "../web/src/course/parse.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(here, "../web");
const pub = path.join(web, "public/tulpa");
const filter = process.argv[2] || "";
const wasm = fs.readFileSync(path.join(pub, "tulpa.wasm"));
const stdlib = JSON.parse(fs.readFileSync(path.join(pub, "stdlib.json"), "utf8"));

// A fresh instance per program, as the app's worker does (no state leaks between runs).
async function run(src, { realtime = false, inputs = [] } = {}) {
  let out = "";
  const t = await instantiate(wasm, { onOutput: (s) => (out += s), sleep: () => {} });
  for (const [k, v] of Object.entries(stdlib)) t.putFile(k, v);
  for (const l of inputs) t.pushInput(l);
  let r;
  try { r = t.run(src, !realtime); } catch (e) { r = { ok: false, error: "engine: " + e.message }; }
  return { ...r, out };
}

let fails = 0, snippets = 0, exercises = 0, quizzes = 0;
const fail = (where, msg) => { fails++; console.log(`✗ ${where}\n    ${String(msg).split("\n").slice(0, 6).join("\n    ")}`); };

async function checkExercise(where, ex) {
  exercises++;
  if (!ex.solution) return fail(where, "exercise has no solution");
  if (ex.expect == null && !ex.check) return fail(where, "exercise has neither expect nor check");
  const sol = await run(ex.solution + (ex.check ? "\n" + ex.check : ""));
  if (!sol.ok) return fail(where, "solution errors: " + sol.error);
  if (ex.expect != null && normalizeOutput(sol.out) !== normalizeOutput(ex.expect))
    return fail(where, `solution output differs\n--- got\n${normalizeOutput(sol.out)}\n--- expected\n${normalizeOutput(ex.expect)}`);
  const st = await run((ex.starter || "") + (ex.check ? "\n" + ex.check : ""));
  const passes = st.ok && (ex.expect == null || normalizeOutput(st.out) === normalizeOutput(ex.expect));
  if (passes) fail(where, "starter already passes the exercise");
}

function checkQuiz(where, qs) {
  for (const q of qs) {
    quizzes++;
    if (q.answer < 0 || q.options.length < 2) fail(where, `quiz "${q.q.slice(0, 50)}" needs options and one + answer`);
    if (q.options.filter((o) => o.startsWith("+ ")).length) fail(where, "malformed quiz option");
  }
}

const courseDir = path.join(web, "src/course");
const modules = fs.readdirSync(courseDir).filter((d) => /^\d\d-/.test(d)).sort();
let lessonCount = 0;
for (const m of modules) {
  const files = fs.readdirSync(path.join(courseDir, m)).filter((f) => f.endsWith(".md")).sort();
  for (const f of files) {
    const id = `${m}/${f}`;
    if (filter && !id.includes(filter)) continue;
    lessonCount++;
    const lesson = parseLesson(fs.readFileSync(path.join(courseDir, m, f), "utf8"), id);
    for (const k of ["title", "minutes", "xp", "skill", "summary"]) if (lesson[k] == null) fail(id, `missing frontmatter ${k}`);
    let n = 0;
    for (const b of lesson.blocks) {
      n++;
      const where = `${id} #${n}`;
      if (b.type === "snippet" && (b.mode === "run" || b.mode === "realtime" || b.mode === "error")) {
        snippets++;
        const r = await run(b.code, { realtime: b.mode === "realtime" });
        if (b.mode === "error" && r.ok) fail(where, "snippet marked `error` ran without an error");
        if (b.mode !== "error" && !r.ok) fail(where, r.error + "\n" + b.code.split("\n").slice(0, 3).join("\n"));
      } else if (b.type === "snippet" && b.mode === "repl") {
        snippets++;
      } else if (b.type === "exercise") await checkExercise(`${where} exercise "${b.title}"`, b);
      else if (b.type === "quiz") checkQuiz(where, b.questions);
    }
    if (!lesson.blocks.some((b) => b.type === "exercise")) fail(id, "lesson has no exercise");
    if (!lesson.blocks.some((b) => b.type === "quiz")) fail(id, "lesson has no quiz");
    if (lesson.blocks.filter((b) => b.type === "snippet").length < 3) fail(id, "lesson has fewer than 3 snippets");
  }
}

// Challenges and the exam
for (const extra of ["challenges.json", "exam.json"]) {
  const p = path.join(courseDir, extra);
  if (!fs.existsSync(p) || (filter && !extra.includes(filter))) continue;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const c of data.challenges || data.capstones || []) await checkExercise(`${extra} "${c.title}"`, c);
  if (data.questions) checkQuiz(extra, data.questions);
}

// Explore → Examples must run cleanly
if (!filter || "examples".includes(filter)) {
  const { EXAMPLES } = await import("../web/src/views/examples.js");
  for (const ex of EXAMPLES) {
    snippets++;
    const r = await run(ex.code);
    if (!r.ok) fail(`example "${ex.id}"`, r.error);
  }
}

// assert!(x) is parsed as `assert !(x)` in Tulpa 3.5; keep it out of teaching material
for (const m of modules) for (const f of fs.readdirSync(path.join(courseDir, m)).filter((f) => f.endsWith(".md"))) {
  const src = fs.readFileSync(path.join(courseDir, m, f), "utf8");
  if (/\bassert!\(/.test(src.replace(/`assert!\([^`]*`/g, ""))) fail(`${m}/${f}`, "uses assert!(...) in code; use `assert cond` instead");
}

console.log(`\n${lessonCount} lessons · ${snippets} snippets · ${exercises} exercises · ${quizzes} quiz questions · ${fails ? fails + " FAILED" : "all passing"}`);
process.exit(fails ? 1 : 0);
