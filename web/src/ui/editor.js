// CodeMirror 6 editor for Tulpa: syntax colouring, live diagnostics and completion from the
// runtime's own analyser (the same one `tulpa lsp` serves), unit-aware highlighting.
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { StreamLanguage, syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput, indentUnit } from "@codemirror/language";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { linter, lintGutter } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";
import { runtime } from "../runtime/client.js";
import { state } from "../state.js";

const KEYWORDS = new Set("let mut fn def return if elif else while for in break continue match use and or not spawn await require ensure invariant assert loop try catch const struct interface impl machine when always import from as state on enter exit after within self".split(" "));
const ATOMS = new Set(["true", "false", "nil", "HIGH", "LOW", "PI", "TAU", "E", "ARGS"]);
const TYPES = new Set(["GPIO", "I2C", "SPI", "UART", "PWM", "Servo", "PID", "CAN", "BLE", "int", "float", "str", "bool", "list", "dict", "num", "any", "quantity", "signal", "range", "task"]);

const tulpaLang = StreamLanguage.define({
  name: "tulpa",
  startState: () => ({ inBlock: false }),
  token(stream, s) {
    if (s.inBlock) {
      if (stream.skipTo("*/")) { stream.match("*/"); s.inBlock = false; } else stream.skipToEnd();
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("/*")) { s.inBlock = true; return "comment"; }
    if (stream.match("#") || stream.match("//")) { stream.skipToEnd(); return "comment"; }
    if (stream.match(/^f?"(?:[^"\\]|\\.)*"?/) || stream.match(/^f?'(?:[^'\\]|\\.)*'?/)) return "string";
    if (stream.match(/^0x[0-9a-fA-F_]+|^0b[01_]+|^\d[\d_]*(\.\d+)?([eE][-+]?\d+)?/)) {
      return "number";
    }
    if (stream.match(/^\[[A-Za-z][\w*/^.\-]*\]/) ) return "unit";
    if (stream.match(/^[A-Za-z_]\w*!/)) return "macroName";
    if (stream.match(/^[A-Za-z_]\w*/)) {
      const w = stream.current();
      if (KEYWORDS.has(w)) return "keyword";
      if (ATOMS.has(w)) return "atom";
      if (TYPES.has(w) || /^[A-Z]/.test(w)) return "typeName";
      if (stream.peek() === "(") return "function";
      if (stream.match(/^::/, false)) return "namespace";
      return "variableName";
    }
    if (stream.match(/^(\|>|=>|->|\.\.=|\.\.|::|[-+*/%=<>!&|^~]+)/)) return "operator";
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: "#" }, closeBrackets: { brackets: ["(", "[", "{", '"', "'"] } },
  tokenTable: { unit: t.unit, macroName: t.macroName, namespace: t.namespace, function: t.function(t.variableName) },
});

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: "#c084fc", fontWeight: "600" },
  { tag: t.comment, color: "#64748b", fontStyle: "italic" },
  { tag: t.string, color: "#86efac" },
  { tag: t.number, color: "#fbbf24" },
  { tag: t.unit, color: "#22d3ee", fontWeight: "600" },
  { tag: t.atom, color: "#f472b6" },
  { tag: t.typeName, color: "#60a5fa" },
  { tag: t.function(t.variableName), color: "#93c5fd" },
  { tag: t.macroName, color: "#f472b6" },
  { tag: t.namespace, color: "#60a5fa" },
  { tag: t.operator, color: "#94a3b8" },
  { tag: t.variableName, color: "#e2e8f0" },
]);

const theme = EditorView.theme({
  "&": { color: "#e2e8f0", backgroundColor: "transparent", fontSize: "var(--code-size, 14px)" },
  ".cm-content": { fontFamily: "var(--mono)", caretColor: "#22d3ee", padding: "10px 0" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.6" },
  ".cm-gutters": { backgroundColor: "transparent", color: "#475569", border: "none" },
  ".cm-activeLine": { backgroundColor: "rgba(59,130,246,.07)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#94a3b8" },
  ".cm-cursor": { borderLeftColor: "#22d3ee", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(59,130,246,.35) !important" },
  ".cm-matchingBracket": { backgroundColor: "rgba(34,211,238,.18)", outline: "1px solid rgba(34,211,238,.4)" },
  ".cm-tooltip": { background: "#0b1530", border: "1px solid rgba(96,165,250,.35)", borderRadius: "10px", color: "#e2e8f0" },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { background: "rgba(59,130,246,.35)" },
  ".cm-diagnostic-error": { borderLeft: "3px solid #f43f5e" },
  ".cm-diagnostic-warning": { borderLeft: "3px solid #f59e0b" },
  ".cm-lintRange-error": { backgroundImage: "none", textDecoration: "underline wavy #f43f5e 1px", textUnderlineOffset: "3px" },
  ".cm-lintRange-warning": { backgroundImage: "none", textDecoration: "underline wavy #f59e0b 1px", textUnderlineOffset: "3px" },
}, { dark: true });

function toPos(doc, p) {
  const line = doc.line(Math.min(doc.lines, Math.max(1, p.line + 1)));
  return Math.min(line.to, line.from + Math.max(0, p.character));
}

const tulpaLinter = linter(async (view) => {
  const src = view.state.doc.toString();
  if (!src.trim()) return [];
  const diags = await runtime.diagnostics(src);
  if (!Array.isArray(diags)) return [];
  return diags.map((d) => {
    const from = toPos(view.state.doc, d.range.start);
    let to = toPos(view.state.doc, d.range.end);
    return { from, to: Math.max(to, from + 1 > view.state.doc.length ? from : from + 1), severity: d.severity === 1 ? "error" : "warning", message: d.message };
  });
}, { delay: 450 });

const KIND = { 1: "text", 2: "method", 3: "function", 5: "property", 6: "variable", 7: "class", 9: "namespace", 14: "keyword", 22: "class" };

async function tulpaComplete(ctx) {
  const word = ctx.matchBefore(/[\w:.]*/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;
  const line = ctx.state.doc.lineAt(ctx.pos);
  const items = await runtime.completion(ctx.state.doc.toString(), line.number - 1, ctx.pos - line.from);
  if (!Array.isArray(items)) return null;
  const tail = word.text.split(/::|\./).pop();
  const from = ctx.pos - tail.length;
  return {
    from,
    options: items.map((i) => ({ label: i.label, type: KIND[i.kind] || "variable", detail: i.detail })),
    validFor: /^\w*$/,
  };
}

/**
 * Creates an editor. Returns { view, get(), set(code), focus(), destroy() }.
 * options: { code, onChange, onRun, minLines, readOnly, lint }
 */
export function createEditor(parent, { code = "", onChange, onRun, readOnly = false, lint = true, lineNums = true } = {}) {
  const fontSize = new Compartment();
  const extensions = [
    lineNums ? [lineNumbers(), highlightActiveLineGutter()] : [],
    history(),
    drawSelection(),
    indentOnInput(),
    indentUnit.of("    "),
    bracketMatching(),
    closeBrackets(),
    highlightActiveLine(),
    tulpaLang,
    syntaxHighlighting(highlight),
    theme,
    fontSize.of(EditorView.theme({ "&": { fontSize: `${state.settings.fontSize}px` } })),
    EditorView.lineWrapping,
    keymap.of([
      { key: "Mod-Enter", run: () => { onRun && onRun(); return true; } },
      { key: "Shift-Enter", run: () => { onRun && onRun(); return true; } },
      ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab,
    ]),
    EditorView.updateListener.of((u) => { if (u.docChanged && onChange) onChange(u.state.doc.toString()); }),
    EditorState.readOnly.of(readOnly),
    EditorView.contentAttributes.of({ autocapitalize: "off", autocorrect: "off", spellcheck: "false", "aria-label": "Tulpa code editor" }),
  ];
  if (lint && !readOnly) extensions.push(tulpaLinter, lintGutter(), autocompletion({ override: [tulpaComplete], activateOnTyping: true }));
  const view = new EditorView({ state: EditorState.create({ doc: code, extensions }), parent });
  return {
    view,
    get: () => view.state.doc.toString(),
    set: (c) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: c } }),
    focus: () => view.focus(),
    insert: (text) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
      view.focus();
    },
    destroy: () => view.destroy(),
  };
}

/** Static, highlighted code (no editor) for listings. */
export function highlightStatic(parent, code) {
  return createEditor(parent, { code, readOnly: true, lint: false, lineNums: false });
}
