// Loads the course at build time: module.json + lesson Markdown, challenges and the exam.
import { parseLesson } from "./parse.js";
import challengesData from "./challenges.json";
import examData from "./exam.json";

const metas = import.meta.glob("./*/module.json", { eager: true, import: "default" });
const sources = import.meta.glob("./*/*.md", { eager: true, query: "?raw", import: "default" });

export const SKILLS = {
  syntax: { label: "Syntax", color: "#3b82f6" },
  programming: { label: "Programming", color: "#a855f7" },
  systems: { label: "Systems", color: "#22d3ee" },
  robotics: { label: "Robotics", color: "#22c55e" },
};

export const modules = Object.keys(metas)
  .sort()
  .map((path, index) => {
    const dir = path.split("/")[1];
    const lessons = Object.keys(sources)
      .filter((p) => p.startsWith(`./${dir}/`))
      .sort()
      .map((p, i) => {
        const id = `${dir}/${p.split("/")[2].replace(/\.md$/, "")}`;
        return { ...parseLesson(sources[p], id), index: i, moduleId: dir };
      });
    return { id: dir, index, number: index + 1, ...metas[path], lessons };
  });

export const lessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
export const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));
export const challenges = challengesData.challenges;
export const exam = examData;

export function nextLesson(id) {
  const i = lessons.findIndex((l) => l.id === id);
  return i >= 0 ? lessons[i + 1] || null : null;
}

/** Every quiz question in the course, tagged with its lesson (for Practice review). */
export const questionBank = lessons.flatMap((l) =>
  l.blocks
    .filter((b) => b.type === "quiz")
    .flatMap((b) => b.questions)
    .map((q, i) => ({ ...q, id: `${l.id}#q${i}`, lessonId: l.id, skill: l.skill }))
);

/** Every exercise in the course (for Practice drills). */
export const drillBank = lessons.flatMap((l) =>
  l.blocks.filter((b) => b.type === "exercise").map((ex, i) => ({ ...ex, id: `${l.id}#ex${i}`, lessonId: l.id, skill: l.skill }))
);
