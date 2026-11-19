import { h, esc, quiz, exercise } from "../ui/components.js";
import { icon, logo } from "../ui/icons.js";
import { confetti, haptic } from "../ui/fx.js";
import { exam } from "../course/index.js";
import { state, update, certUnlocked, grantXP, checkAchievements, save } from "../state.js";
import { mascot, tutorSay, brand } from "../ui/tutor.js";

const PASS = 80;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

export function render() {
  if (state.cert?.passed) return certificate();
  if (!certUnlocked()) {
    return h(`<div class="page locked-page card">${icon("lock")}<h2>Mastery Certification</h2>
      <p>Complete all ten modules to unlock the final exam: 20 questions and three capstone programs. Score ${PASS}% or more to earn your certificate.</p>
      <a class="primary" href="#/map">Back to the map</a></div>`);
  }
  const el = h(`<div class="page cert">
    <section class="card cert-intro">${icon("star")}<div><h2>Mastery Certification</h2>
      <p>Part 1: 20 questions drawn from the whole course. Part 2: three capstone programs checked by the runtime.
      Each question is worth 3 points and each capstone 10 (90 total). You need ${PASS}% to pass. You can retake it any time.</p>
      <button class="primary big begin">${icon("play")} Begin exam</button></div></section>
    <div class="exam"></div>
  </div>`);
  el.querySelector(".begin").onclick = () => start(el.querySelector(".exam"), el.querySelector(".cert-intro"));
  return el;
}

function start(box, intro) {
  intro.hidden = true;
  const qs = shuffle(exam.questions).slice(0, 20);
  let qScore = 0, qDone = 0;
  const passed = new Set();
  box.append(h(`<h3 class="exam-part">Part 1 · Questions</h3>`));
  box.append(quiz(qs, { title: "Exam questions", onAnswer: (q, right) => { qDone++; if (right) qScore++; refresh(); } }));
  box.append(h(`<h3 class="exam-part">Part 2 · Capstones</h3>`));
  exam.capstones.forEach((c, i) => box.append(exercise(c, { key: `cert:${i}`, label: `Capstone ${i + 1}`, onPass: () => { passed.add(i); refresh(); return null; } })));
  const bar = h(`<div class="card exam-bar"><div class="eb-score"></div><button class="primary submit" disabled>Submit exam</button></div>`);
  box.append(bar);
  function refresh() {
    const pts = qScore * 3 + passed.size * 10;
    bar.querySelector(".eb-score").innerHTML = `<b>${pts}</b> / 90 points · ${qDone}/20 answered · ${passed.size}/3 capstones`;
    bar.querySelector(".submit").disabled = qDone < 20;
  }
  refresh();
  bar.querySelector(".submit").onclick = () => {
    const pts = qScore * 3 + passed.size * 10;
    const score = Math.round((pts / 90) * 100);
    if (score >= PASS) {
      update((s) => (s.cert = { passed: true, score, at: Date.now(), name: s.name || "Tulpa Builder" }));
      grantXP(500, "certification");
      checkAchievements();
      save();
      confetti({ count: 280, spread: 1.4 });
      haptic("heavy");
      location.hash = "#/cert";
      dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
      haptic("error");
      bar.innerHTML = `<a class="primary" href="#/cert">Retake</a>`;
      bar.prepend(tutorSay("oops", `<b>${score}%</b>: not quite (${PASS}% needed). Review the lessons behind the questions you missed and try again. You've got this.`));
    }
  };
}

function certificate() {
  const c = state.cert;
  const el = h(`<div class="page cert-done">
    <div class="certificate" id="certificate">
      <div class="cert-border">
        <img class="cert-logo" src="${brand("logo.webp")}" alt="TulpaTutor">
        <span class="cert-kicker">TulpaTutor · HermiTech</span>
        <h1>Certificate of Mastery</h1>
        <p>This certifies that</p>
        <h2 class="cert-name">${esc(c.name)}</h2>
        <p>has completed all ten modules of the Tulpa curriculum and passed the Mastery Certification with a score of <b>${c.score}%</b>.</p>
        <div class="cert-foot"><span>${new Date(c.at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span><span>Tulpa 3.5 · Robotics &amp; Embedded Systems</span></div>
      </div>
    </div>
    <div class="btn-row center"><button class="primary save">${icon("download")} Save as image</button><a class="ghost" href="#/challenges">${icon("trophy")} Keep practising</a></div>
  </div>`);
  el.querySelector(".certificate").after(mascot("celebrate", { size: 140, anim: "hop", cls: "cert-mascot" }));
  el.querySelector(".save").onclick = () => saveImage(c);
  return el;
}

async function saveImage(c) {
  const logoImg = new Image();
  logoImg.src = brand("logo.webp");
  await logoImg.decode().catch(() => {});
  const W = 1600, H = 1100, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#050b1f"); bg.addColorStop(1, "#1e1b4b");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const br = g.createLinearGradient(0, 0, W, 0);
  br.addColorStop(0, "#22d3ee"); br.addColorStop(0.5, "#3b82f6"); br.addColorStop(1, "#a855f7");
  g.strokeStyle = br; g.lineWidth = 10; g.strokeRect(50, 50, W - 100, H - 100);
  if (logoImg.naturalWidth) g.drawImage(logoImg, W / 2 - 170, 70, 340, 340 * logoImg.naturalHeight / logoImg.naturalWidth);
  g.textAlign = "center"; g.fillStyle = "#93c5fd"; g.font = "600 30px system-ui";
  g.fillText("TULPATUTOR · HERMITECH", W / 2, 290);
  g.fillStyle = "#fff"; g.font = "700 84px system-ui"; g.fillText("Certificate of Mastery", W / 2, 380);
  g.fillStyle = "#cbd5e1"; g.font = "32px system-ui"; g.fillText("This certifies that", W / 2, 460);
  g.fillStyle = br; g.font = "700 96px system-ui"; g.fillText(c.name, W / 2, 570);
  g.fillStyle = "#cbd5e1"; g.font = "32px system-ui";
  g.fillText("has completed the Tulpa curriculum and passed the", W / 2, 680);
  g.fillText(`Mastery Certification with a score of ${c.score}%.`, W / 2, 730);
  g.fillStyle = "#94a3b8"; g.font = "28px system-ui";
  g.fillText(new Date(c.at).toLocaleDateString(), W / 2, 900);
  const a = document.createElement("a");
  a.href = cv.toDataURL("image/png");
  a.download = "tulpa-certificate.png";
  a.click();
}
