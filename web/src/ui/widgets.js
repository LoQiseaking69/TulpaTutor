// Visual widgets from the TulpaTutor design: progress ring, skill donut, hex course map.
import { icon } from "./icons.js";
import { h, esc } from "./components.js";
import { modules, SKILLS } from "../course/index.js";
import { moduleDone, moduleUnlocked, moduleProgress, certUnlocked, state, currentLesson } from "../state.js";
import { motionReduced } from "./fx.js";

export function ring(pct, { size = 150, stroke = 12, label = "" } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const id = "rg" + Math.random().toString(36).slice(2, 7);
  const el = h(`<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22c55e"/><stop offset=".5" stop-color="#22d3ee"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-track" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bar" stroke="url(#${id})" stroke-width="${stroke}"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>
    <div class="ring-center"><b class="ring-pct">0%</b>${label ? `<span>${esc(label)}</span>` : ""}</div></div>`);
  const bar = el.querySelector(".ring-bar"), txt = el.querySelector(".ring-pct");
  const target = Math.max(0, Math.min(1, pct));
  requestAnimationFrame(() => {
    if (motionReduced()) { bar.style.strokeDashoffset = c * (1 - target); txt.textContent = Math.round(target * 100) + "%"; return; }
    bar.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)";
    bar.style.strokeDashoffset = c * (1 - target);
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
      txt.textContent = Math.round(target * 100 * e) + "%";
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return el;
}

export function donut(values, { size = 120, stroke = 16 } = {}) {
  const keys = Object.keys(SKILLS);
  const total = keys.reduce((a, k) => a + Math.max(values[k], 0.0001), 0);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let off = 0;
  const arcs = keys.map((k) => {
    const frac = Math.max(values[k], 0.0001) / total;
    const len = Math.max(0, frac * c - 3);
    const a = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${SKILLS[k].color}" stroke-width="${stroke}"
      stroke-dasharray="0 ${c}" data-len="${len}" data-c="${c}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})" class="donut-arc"/>`;
    off += frac * c;
    return a;
  }).join("");
  const el = h(`<div class="donut"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" class="ring-track" stroke-width="${stroke}"/>${arcs}</svg></div>`);
  requestAnimationFrame(() => el.querySelectorAll(".donut-arc").forEach((a, i) => {
    a.style.transition = motionReduced() ? "none" : `stroke-dasharray 1s ${i * 0.12}s cubic-bezier(.2,.7,.2,1)`;
    a.setAttribute("stroke-dasharray", `${a.dataset.len} ${a.dataset.c}`);
  }));
  return el;
}

export function skillLegend(values) {
  return h(`<ul class="skill-legend">${Object.entries(SKILLS).map(([k, s]) =>
    `<li><i style="background:${s.color}"></i><span>${s.label}</span><b>${values[k]}%</b></li>`).join("")}</ul>`);
}

const hexPath = (r) => {
  const p = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; p.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`); }
  return `M${p.join("L")}Z`;
};

/** Hex-node course map: rows left to right, joined by a glowing path through every node. */
export function courseMap({ compact = false, onOpen } = {}) {
  const items = [...modules.map((m) => ({ kind: "module", m })), { kind: "cert" }];
  const cur = currentLesson();
  const el = h(`<div class="course-map ${compact ? "compact" : ""}"><svg class="map-path" aria-hidden="true"></svg></div>`);
  const narrow = innerWidth < 640;
  // compact (home): 5 + 6 like the design; full map: by width
  const sizes = narrow ? [2, 2, 2, 2, 2, 1] : compact ? [5, 6] : innerWidth < 1100 ? [4, 4, 3] : [5, 6];
  const rows = [];
  let at = 0;
  for (const n of sizes) { if (at < items.length) rows.push(items.slice(at, at + n)); at += n; }
  if (at < items.length) rows.push(items.slice(at));
  let doneUpTo = -1, idx = 0;
  rows.forEach((row) => {
    const rowEl = h(`<div class="map-row"></div>`);
    row.forEach((it) => {
      let state_, title, iconName, num, prog = 0;
      if (it.kind === "module") {
        const m = it.m;
        state_ = moduleDone(m) ? "done" : moduleUnlocked(m) ? (cur && cur.moduleId === m.id ? "current" : "open") : "locked";
        title = m.title; iconName = m.icon; num = m.number; prog = moduleProgress(m);
        if (moduleDone(m)) doneUpTo = idx;
      } else {
        state_ = state.cert?.passed ? "done cert" : certUnlocked() ? "open cert" : "locked cert";
        title = "Mastery Certification"; iconName = "star"; num = "";
      }
      const node = h(`<button class="node ${state_}" style="--i:${idx}">
        <span class="hex"><svg viewBox="-40 -40 80 80"><path d="${hexPath(34)}" class="hex-bg"/><path d="${hexPath(34)}" class="hex-prog" pathLength="100" style="stroke-dasharray:${prog * 100} 100"/></svg>
          <span class="hex-icon">${icon(iconName)}</span>
          ${state_.startsWith("done") ? `<span class="hex-badge ok">${icon("check")}</span>` : state_.startsWith("locked") ? `<span class="hex-badge lock">${icon("lock")}</span>` : ""}
          ${it.kind === "cert" ? `<span class="hex-crown">${icon("crown")}</span>` : ""}
        </span>
        <span class="node-title">${num ? `${num}. ` : ""}${esc(title)}</span></button>`);
      node.onclick = () => onOpen && onOpen(it);
      rowEl.appendChild(node);
      idx++;
    });
    el.appendChild(rowEl);
  });

  const draw = () => {
    const svg = el.querySelector(".map-path");
    const box = el.getBoundingClientRect();
    if (!box.width) return;
    const hexes = [...el.querySelectorAll(".hex")];
    const pts = hexes.map((x) => { const r = x.getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top, x.closest(".map-row")]; });
    const R = 18, margin = 14;
    let d = "", dDone = "";
    const seg = (i) => {
      const [x1, y1, r1] = pts[i], [x2, y2, r2] = pts[i + 1];
      if (r1 === r2) return `L${x2},${y2}`;
      // row change: out to the right edge, down, back across to the left edge, down into the next row
      const right = box.width - margin, left = margin, mid = (y1 + y2) / 2;
      return `L${right - R},${y1} Q${right},${y1} ${right},${y1 + R} L${right},${mid - R} Q${right},${mid} ${right - R},${mid}`
        + ` L${left + R},${mid} Q${left},${mid} ${left},${mid + R} L${left},${y2 - R} Q${left},${y2} ${left + R},${y2} L${x2},${y2}`;
    };
    pts.forEach((p, i) => {
      if (i === 0) { d = `M${p[0]},${p[1]}`; dDone = d; return; }
      const s = seg(i - 1);
      d += s;
      if (i <= doneUpTo + 1 && doneUpTo >= 0) dDone += s;
    });
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = `<defs><linearGradient id="mpg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      <path d="${d}" class="mp-base"/>${doneUpTo >= 0 ? `<path d="${dDone}" class="mp-done" pathLength="1"/>` : ""}`;
  };
  const ro = new ResizeObserver(() => requestAnimationFrame(draw));
  ro.observe(el);
  return el;
}
