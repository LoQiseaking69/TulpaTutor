// Lesson format (shared by the app and scripts/check-course.mjs).
//
//   ---
//   title: Hello, Tulpa
//   minutes: 8
//   xp: 40
//   skill: syntax | programming | systems | robotics
//   summary: one line for cards
//   ---
//   Markdown prose …
//
//   ```tulpa                      runnable, editable snippet (virtual clock)
//   ```tulpa realtime             runs on the wall clock
//   ```tulpa error                expected to stop with an error (teaching errors)
//   ```tulpa static               shown, not runnable (pseudo-code, CLI, other files)
//   ```tulpa repl                 opens in the REPL, one line at a time
//   ```text / ```sh               plain listing
//
//   ```quiz
//   ? Question (markdown)
//   - wrong answer
//   + right answer
//   > explanation
//   ```
//
//   :::exercise Title
//   Prompt (markdown) …
//   ```tulpa starter
//   ```tulpa solution
//   ```expect                     exact expected output (trimmed, per-line right-trimmed)
//   ```check                      hidden Tulpa appended to the learner's code; must not fail
//   ```hint                       one or more hints, separated by lines with ---
//   :::
//
//   :::note | :::tip | :::warn | :::deep Title      callouts (markdown inside)
//   :::takeaways                                    bullet list collected into Review Notes

export function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    meta[k] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

function parseFences(lines) {
  // -> [{type:'md', text}] | [{type:'code', lang, flags, code}]
  const out = [];
  let md = [];
  const flush = () => {
    if (md.join("").trim()) out.push({ type: "md", text: md.join("\n") });
    md = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const f = lines[i].match(/^```(\w+)?\s*(.*)$/);
    if (!f) { md.push(lines[i]); continue; }
    flush();
    const body = [];
    i++;
    while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
    out.push({ type: "code", lang: f[1] || "text", flags: (f[2] || "").split(/\s+/).filter(Boolean), code: body.join("\n") });
  }
  flush();
  return out;
}

function parseQuiz(code) {
  const qs = [];
  let q = null;
  for (const raw of code.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("? ")) { q = { q: line.slice(2), options: [], answer: -1, explain: "" }; qs.push(q); }
    else if (!q) continue;
    else if (line.startsWith("- ")) q.options.push(line.slice(2));
    else if (line.startsWith("+ ")) { q.answer = q.options.length; q.options.push(line.slice(2)); }
    else if (line.startsWith("> ")) q.explain += (q.explain ? " " : "") + line.slice(2);
    else if (line.trim() && q.options.length === 0) q.q += "\n" + line;
  }
  return qs;
}

export function parseBlocks(body) {
  const lines = body.split("\n");
  const blocks = [];
  let buf = [];
  const flushBuf = () => {
    for (const b of parseFences(buf)) {
      if (b.type === "code" && b.lang === "quiz") blocks.push({ type: "quiz", questions: parseQuiz(b.code) });
      else if (b.type === "code" && b.lang === "tulpa") {
        const mode = ["realtime", "error", "static", "repl"].find((f) => b.flags.includes(f)) || "run";
        blocks.push({ type: "snippet", mode, code: b.code });
      } else if (b.type === "code") blocks.push({ type: "listing", lang: b.lang, code: b.code });
      else blocks.push(b);
    }
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const d = lines[i].match(/^:::(\w+)\s*(.*)$/);
    if (!d) { buf.push(lines[i]); continue; }
    flushBuf();
    const inner = [];
    i++;
    let depth = 0;
    while (i < lines.length && !(lines[i].trim() === ":::" && depth === 0)) {
      if (/^```\w/.test(lines[i])) depth++;
      else if (/^```\s*$/.test(lines[i])) depth = Math.max(0, depth - 1);
      inner.push(lines[i++]);
    }
    const kind = d[1];
    const title = d[2].trim();
    if (kind === "exercise") {
      const ex = { type: "exercise", title, prompt: "", starter: "", solution: "", expect: null, check: "", hints: [] };
      const md = [];
      for (const b of parseFences(inner)) {
        if (b.type === "md") md.push(b.text);
        else if (b.lang === "tulpa" && b.flags.includes("starter")) ex.starter = b.code;
        else if (b.lang === "tulpa" && b.flags.includes("solution")) ex.solution = b.code;
        else if (b.lang === "expect") ex.expect = b.code;
        else if (b.lang === "check") ex.check = b.code;
        else if (b.lang === "hint") ex.hints = b.code.split(/^---$/m).map((s) => s.trim()).filter(Boolean);
        else if (b.lang === "tulpa") md.push("```tulpa\n" + b.code + "\n```");
      }
      ex.prompt = md.join("\n\n");
      blocks.push(ex);
    } else {
      blocks.push({ type: "callout", kind, title, text: inner.join("\n") });
    }
  }
  flushBuf();
  return blocks;
}

export function parseLesson(src, id) {
  const { meta, body } = parseFrontmatter(src);
  const blocks = parseBlocks(body);
  const takeaways = blocks
    .filter((b) => b.type === "callout" && b.kind === "takeaways")
    .flatMap((b) => b.text.split("\n").filter((l) => /^\s*[-*] /.test(l)).map((l) => l.replace(/^\s*[-*] /, "")));
  return { id, ...meta, blocks, takeaways };
}

/** Normalises program output for comparison with an `expect` block. */
export function normalizeOutput(s) {
  return String(s).replace(/\r/g, "").split("\n").map((l) => l.trimEnd()).join("\n").trim();
}
