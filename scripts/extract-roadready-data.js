const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHUNK = path.join(ROOT, "data/roadready/raw/chunks/0g5hpyh9dfamx.js");
const OUT_DIR = path.join(ROOT, "data/roadready/processed");
const IMG_DIR = path.join(ROOT, "data/roadready/images");

const MODULES = [
  { slug: "road-signs", key: "road_signs", n: "01", name: "Traffic Signs", desc: "Learn regulatory, warning, and informational signs", xp: 100 },
  { slug: "traffic-rules", key: "traffic_rules", n: "02", name: "Road Rules", desc: "Speed limits, right of way, lane discipline", xp: 100 },
  { slug: "hazard-perception", key: "hazard_perception", n: "03", name: "Hazard Perception", desc: "Identify and respond to dangerous situations", xp: 120 },
  { slug: "driving-conditions", key: "driving_conditions", n: "04", name: "Driving Conditions", desc: "City, highway, and adverse weather driving", xp: 140 },
  { slug: "critical-situations", key: "critical_situations", n: "05", name: "Critical Situations", desc: "Emergency responses and accident procedures", xp: 160 },
  { slug: "driving-behavior", key: "driving_behavior", n: "06", name: "Safe Driving", desc: "Etiquette, courtesy, and defensive driving", xp: 180 },
  { slug: "vehicle-maintenance", key: "vehicle_maintenance", n: "07", name: "Vehicle Knowledge", desc: "Vehicle systems, maintenance, and safety features", xp: 200 },
];

function extractQuestionArrays(source) {
  const arrays = [];
  const re = /JSON\.parse\('((?:\\'|[^'])*)'\)/g;
  let match;
  while ((match = re.exec(source))) {
    const json = match[1].replace(/\\'/g, "'");
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed[0]?.question_text) arrays.push(parsed);
    } catch {
      // Ignore non-question JSON.parse payloads.
    }
  }
  return arrays.flat();
}

function normalizeQuestion(question) {
  const orderedAnswers = [...question.answers].sort((a, b) => a.display_order - b.display_order);
  const imagePath = question.image_url
    ? `data/roadready/images/${path.basename(question.image_url)}`
    : null;

  return {
    id: question.id,
    module: question.module,
    moduleSlug: MODULES.find((module) => module.key === question.module)?.slug ?? question.module,
    question: question.question_text,
    options: orderedAnswers.map((answer) => answer.answer_text),
    correctIndex: orderedAnswers.findIndex((answer) => answer.is_correct),
    explanation: question.explanation ?? "",
    image: imagePath,
    sourceImageUrl: question.image_url,
    svgIllustrationKey: question.svg_illustration_key,
    difficulty: question.difficulty,
    relevanceRank: question.relevance_rank,
    tags: question.tags ?? [],
    source: question.source ?? "roadreadyuae",
    isEdcadStyle: Boolean(question.is_edcad_style),
    rawAnswers: orderedAnswers,
  };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(IMG_DIR, { recursive: true });

const source = fs.readFileSync(CHUNK, "utf8");
const allQuestions = extractQuestionArrays(source);
const lightVehicle = allQuestions.filter((question) => question.vehicle_types?.includes("B"));
const uniqueQuestions = [...new Map(lightVehicle.map((question) => [question.id, question])).values()];
const normalizedQuestions = uniqueQuestions.map(normalizeQuestion);

const modules = MODULES.map((module) => ({
  ...module,
  count: normalizedQuestions.filter((question) => question.module === module.key).length,
}));

const imageUrls = [...new Set(uniqueQuestions.map((question) => question.image_url).filter(Boolean))].map((url) => ({
  sourceUrl: `https://www.roadreadyuae.com${url}`,
  localPath: `data/roadready/images/${path.basename(url)}`,
  filename: path.basename(url),
}));

const svgKeys = [...new Set(uniqueQuestions.map((question) => question.svg_illustration_key).filter(Boolean))].sort();

const database = {
  source: {
    name: "Road Ready UAE",
    url: "https://www.roadreadyuae.com/en/quiz/B",
    capturedAt: new Date().toISOString(),
    vehicleType: "B",
  },
  modules,
  questions: normalizedQuestions,
  imageUrls,
  svgKeys,
  totals: {
    questions: normalizedQuestions.length,
    images: imageUrls.length,
    svgIllustrations: svgKeys.length,
  },
};

fs.writeFileSync(path.join(OUT_DIR, "questions.json"), JSON.stringify(database, null, 2));
fs.writeFileSync(
  path.join(OUT_DIR, "questions.js"),
  `window.ROADREADY_PRACTICE = ${JSON.stringify(database, null, 2)};\n`
);
fs.writeFileSync(
  path.join(OUT_DIR, "image-urls.txt"),
  imageUrls.map((image) => `${image.sourceUrl} ${path.join(ROOT, image.localPath)}`).join("\n") + "\n"
);

console.log(JSON.stringify(database.totals, null, 2));
console.log(JSON.stringify(Object.fromEntries(modules.map((module) => [module.slug, module.count])), null, 2));
