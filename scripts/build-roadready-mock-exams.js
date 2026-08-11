const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "data/roadready/processed/questions.json");
const OUT_DIR = path.join(ROOT, "data/roadready/processed");

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
const modules = [
  "road-signs",
  "traffic-rules",
  "hazard-perception",
  "driving-conditions",
  "critical-situations",
  "driving-behavior",
  "vehicle-maintenance",
];

const byModule = Object.fromEntries(modules.map((slug) => [slug, []]));
for (const question of db.questions) {
  if (byModule[question.moduleSlug]) byModule[question.moduleSlug].push(question);
}

function scorePreference(question, tokens) {
  if (!tokens?.length) return 0;
  const haystack = [
    question.question,
    question.explanation,
    ...(question.options || []),
    ...(question.tags || []),
  ].join(" ").toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function takeQuestions({ used, cursors, slug, count, prefer = [] }) {
  const source = byModule[slug] || [];
  const preferred = source
    .filter((question) => !used.has(question.id))
    .map((question) => ({ question, score: scorePreference(question, prefer) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))
    .map((entry) => entry.question);

  const selected = [];
  for (const question of preferred) {
    if (selected.length >= count) break;
    selected.push(question);
    used.add(question.id);
  }

  let cursor = cursors[slug] || 0;
  while (selected.length < count && source.length) {
    const question = source[cursor % source.length];
    cursor += 1;
    if (used.has(question.id)) continue;
    selected.push(question);
    used.add(question.id);
  }
  cursors[slug] = cursor;
  return selected;
}

const examPlans = [
  {
    id: "mock-1",
    n: 1,
    title: "Mock Test 1",
    focus: "Balanced coverage across all topics",
    distribution: { "road-signs": 8, "traffic-rules": 16, "hazard-perception": 6, "driving-conditions": 4, "critical-situations": 3, "driving-behavior": 6, "vehicle-maintenance": 2 },
  },
  {
    id: "mock-2",
    n: 2,
    title: "Mock Test 2",
    focus: "Extra focus on signs and hazards",
    distribution: { "road-signs": 15, "traffic-rules": 8, "hazard-perception": 10, "driving-conditions": 3, "critical-situations": 3, "driving-behavior": 4, "vehicle-maintenance": 2 },
  },
  {
    id: "mock-3",
    n: 3,
    title: "Mock Test 3",
    focus: "Emphasis on rules and critical situations",
    distribution: { "road-signs": 6, "traffic-rules": 18, "hazard-perception": 4, "driving-conditions": 4, "critical-situations": 7, "driving-behavior": 4, "vehicle-maintenance": 2 },
  },
  {
    id: "mock-4",
    n: 4,
    title: "Mock Test 4",
    focus: "Comprehensive final practice",
    distribution: { "road-signs": 7, "traffic-rules": 15, "hazard-perception": 6, "driving-conditions": 4, "critical-situations": 4, "driving-behavior": 6, "vehicle-maintenance": 3 },
  },
  {
    id: "mock-5",
    n: 5,
    title: "Mock Test 5",
    focus: "Heavy on penalties, fines and black points",
    prefer: ["fine", "black point", "penalty", "alcohol", "speed", "seatbelt", "mobile", "red light"],
    distribution: { "road-signs": 8, "traffic-rules": 17, "hazard-perception": 4, "driving-conditions": 4, "critical-situations": 4, "driving-behavior": 5, "vehicle-maintenance": 3 },
  },
  {
    id: "mock-6",
    n: 6,
    title: "Mock Test 6",
    focus: "Focus on driving conditions and vehicle knowledge",
    distribution: { "road-signs": 5, "traffic-rules": 8, "hazard-perception": 4, "driving-conditions": 12, "critical-situations": 4, "driving-behavior": 4, "vehicle-maintenance": 8 },
  },
  {
    id: "mock-7",
    n: 7,
    title: "Mock Test 7",
    focus: "Scenario-heavy hazards and safe driving",
    prefer: ["hazard", "safe", "distance", "mirror", "brake", "pedestrian", "overtake", "emergency"],
    distribution: { "road-signs": 5, "traffic-rules": 7, "hazard-perception": 12, "driving-conditions": 5, "critical-situations": 5, "driving-behavior": 9, "vehicle-maintenance": 2 },
  },
  {
    id: "mock-8",
    n: 8,
    title: "Mock Test 8",
    focus: "Comprehensive even spread across all topics",
    distribution: { "road-signs": 7, "traffic-rules": 7, "hazard-perception": 7, "driving-conditions": 6, "critical-situations": 6, "driving-behavior": 6, "vehicle-maintenance": 6 },
  },
];

const cursors = Object.fromEntries(modules.map((slug) => [slug, 0]));
const globallyUsed = new Set();
const exams = examPlans.map((plan) => {
  const examUsed = new Set();
  const picked = [];

  for (const slug of modules) {
    const count = plan.distribution[slug] || 0;
    const used = new Set([...globallyUsed, ...examUsed]);
    const questions = takeQuestions({ used, cursors, slug, count, prefer: plan.prefer || [] });
    questions.forEach((question) => {
      picked.push(question.id);
      examUsed.add(question.id);
      globallyUsed.add(question.id);
    });
  }

  if (picked.length !== 45) {
    throw new Error(`${plan.title} has ${picked.length} questions instead of 45`);
  }

  return {
    id: plan.id,
    number: plan.n,
    title: plan.title,
    status: "NEW",
    focus: plan.focus,
    questionCount: 45,
    durationMinutes: 30,
    passScore: 36,
    passPercent: 80,
    xp: 200,
    distribution: plan.distribution,
    questionIds: picked,
  };
});

const database = {
  source: {
    name: "Direct Drive Abu Dhabi mock exam set",
    url: "https://www.roadreadyuae.com/en/quiz/B/mock-exam",
    inspectedAt: new Date().toISOString(),
    note: "Exam structure mirrors the public mock-exam flow: 8 tests, 45 questions, 30 minutes, 80% pass threshold.",
  },
  totals: {
    exams: exams.length,
    questionsPerExam: 45,
    totalQuestionSlots: exams.length * 45,
    uniqueQuestions: globallyUsed.size,
  },
  exams,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "mock-exams.json"), JSON.stringify(database, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "mock-exams.js"), `window.ROADREADY_MOCK_EXAMS = ${JSON.stringify(database, null, 2)};\n`);
console.log(JSON.stringify(database.totals, null, 2));
