/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;

// ============ NAVIGATION ============
const PAGE_URLS = {
  home: "Wajha.html",
  process: "process.html",
  cheatsheets: "cheatsheets.html",
  practice: "practice.html",
  blog: "blog.html"
};

function navigate(id, params = {}) {
  let url = PAGE_URLS[id] || "Wajha.html";
  const qs = new URLSearchParams(params).toString();
  if (qs) url += "?" + qs;
  window.location.href = url;
}

// ============ TWEAK DEFAULTS ============
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 78,
  "videoDim": 0.55,
  "videoSide": "right",
  "showGrid": true,
  "scanlines": true,
  "forestGreen": "#0D2117"
} /*EDITMODE-END*/;

// hex -> {r,g,b} in 0..1
function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return { r, g, b };
}
function mixHex(hex, target, mix) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const r = Math.round((a.r * (1 - mix) + b.r * mix) * 255);
  const g = Math.round((a.g * (1 - mix) + b.g * mix) * 255);
  const bl = Math.round((a.b * (1 - mix) + b.b * mix) * 255);
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

// ============ DATA ============
const NAV = [
  { id: "home", label: "Home" },
  { id: "process", label: "The Process" },
  { id: "cheatsheets", label: "Cheat Sheets" },
  { id: "practice", label: "Practice Tests" },
  { id: "blog", label: "Blog" }
];

const PARTNERS = [
  "TAMM", "YAS DRIVING ACADEMY", "EDC MUSSAFAH", "ADTM", "ABU DHABI POLICE",
  "EMIRATES DRIVING COMPANY", "AL AHLIA"
];

const PROCESS_STAGES = [
  { n: "01", name: "Eye Test", where: "Any approved optician", cost: "AED 100", time: "15 min", mistake: "Booking the eye test before opening your traffic file. Order matters." },
  { n: "02", name: "Open Traffic File", where: "TAMM app or ADTM", cost: "AED 200", time: "1 day", mistake: "Uploading a passport photo with a non-white background. Auto-rejected.", blogPostId: "how-to-start-the-process-opening-your-file" },
  { n: "03", name: "Choose a Driving School", where: "EDC Mussafah or Yas Driving School", cost: "AED 0", time: "30 min", mistake: "Picking the cheapest package without checking branch distance from home — you'll regret it on lesson day.", blogPostId: "which-driving-school-to-choose-in-abu-dhabi-breakdown" },
  { n: "04", name: "Register & Pay Package", where: "Your chosen school", cost: "AED 3,800–6,000", time: "1 hour", mistake: "Paying for the regular package when you qualify for the VIP fast-track." },
  { n: "05", name: "Theory Lectures", where: "School branch or online", cost: "Included", time: "8 hours", mistake: "Skipping the Arabic-translated handouts. Some test phrasing comes straight from them." },
  { n: "06", name: "Theory Test", where: "School test centre", cost: "AED 200", time: "45 min", mistake: "Not booking early. Slots fill up months in advance — book the moment you finish lectures." },
  { n: "07", name: "Practical Courses", where: "School yard & branch", cost: "Included", time: "Varies", mistake: "Treating the in-person basics as a formality. Signaling, mirrors, parallel parking and 90-degree parking are exactly what the yard examiner scores." },
  { n: "08", name: "Yard Test", where: "School yard", cost: "AED 200", time: "30 min", mistake: "The yard test covers 90-degree parking, basic maneuvering, and parallel parking. Examiners watch mirrors, shoulders, and control throughout." },
  { n: "09", name: "External Road Hours", where: "Public roads with school instructor", cost: "AED 100 permit + AED 70–100 / hr · 6 hours", time: "5 business days + 6 hours", mistake: "Before external hours, request the training card permit through TAMM. It is around AED 100 and usually arrives in about 5 business days, so do it early before spacing out your six road hours." },
  { n: "10", name: "Final Road Test", where: "Public road with police examiner", cost: "AED 200", time: "5 min", mistake: "Book as soon as possible. Mussafah can be booked for months; there is an AED 300 prepone/postpone option, but finding an earlier slot is rare and securing one early saves many days." }
];

const ROADREADY_DB = window.ROADREADY_PRACTICE || null;
const ROADREADY_MOCK_EXAMS_DB = window.ROADREADY_MOCK_EXAMS || null;
const OFFICIAL_DRIVING_SIGNS = window.OFFICIAL_DRIVING_SIGNS || null;

const FALLBACK_PRACTICE_MODULES = [
  { n: "01", name: "Traffic Signs",        desc: "Learn regulatory, warning, and informational signs",         count: 219, xp: 100 },
  { n: "02", name: "Road Rules",           desc: "Speed limits, right of way, lane discipline",                count: 435, xp: 100 },
  { n: "03", name: "Hazard Perception",    desc: "Identify and respond to dangerous situations",               count: 167, xp: 120 },
  { n: "04", name: "Driving Conditions",   desc: "City, highway, and adverse weather driving",                 count: 111, xp: 140 },
  { n: "05", name: "Critical Situations",  desc: "Emergency responses and accident procedures",                count: 80,  xp: 160 },
  { n: "06", name: "Safe Driving",         desc: "Etiquette, courtesy, and defensive driving",                 count: 166, xp: 180 },
  { n: "07", name: "Vehicle Knowledge",    desc: "Vehicle systems, maintenance, and safety features",          count: 84,  xp: 200 },
];

const PRACTICE_MODULES = ROADREADY_DB
  ? ROADREADY_DB.modules.map((m) => ({ n: m.n, name: m.name, desc: m.desc, count: m.count, xp: m.xp, slug: m.slug, key: m.key }))
  : FALLBACK_PRACTICE_MODULES;

const ROADREADY_QUESTIONS = ROADREADY_DB?.questions || [];
const ROADREADY_QUESTION_BY_ID = ROADREADY_QUESTIONS.reduce((acc, question) => {
  acc[question.id] = question;
  return acc;
}, {});
const QUESTIONS_BY_MODULE = ROADREADY_QUESTIONS.reduce((acc, question) => {
  const slug = question.moduleSlug;
  if (!acc[slug]) acc[slug] = [];
  acc[slug].push(question);
  return acc;
}, {});

const FALLBACK_MOCK_EXAMS = ROADREADY_QUESTIONS.length ? Array.from({ length: 8 }, (_, index) => ({
  id: `mock-${index + 1}`,
  number: index + 1,
  title: `Mock Test ${index + 1}`,
  status: "NEW",
  focus: index === 0 ? "Balanced coverage across all topics" : "Comprehensive UAE theory practice",
  questionCount: 45,
  durationMinutes: 30,
  passScore: 36,
  passPercent: 80,
  xp: 200,
  questionIds: ROADREADY_QUESTIONS.slice(index * 45, index * 45 + 45).map((question) => question.id),
})) : [];

const MOCK_EXAMS = ROADREADY_MOCK_EXAMS_DB?.exams?.length
  ? ROADREADY_MOCK_EXAMS_DB.exams
  : FALLBACK_MOCK_EXAMS;

const PRACTICE_QUESTIONS = ROADREADY_QUESTIONS.length ? ROADREADY_QUESTIONS.slice(0, 3) : [
  {
    question: "On a single carriageway in Abu Dhabi with no posted speed limit, the default maximum speed for light vehicles is:",
    options: ["60 km/h", "80 km/h", "100 km/h", "120 km/h"],
    correctIndex: 1,
    explanation: "On undivided single carriageways without a posted limit, the default ceiling for light vehicles is 80 km/h."
  },
  {
    question: "A solid white line down the centre of the road means:",
    options: ["You may overtake with caution", "Overtaking is prohibited", "Lane is for buses only", "Slow vehicles only"],
    correctIndex: 1,
    explanation: "A solid white centre line prohibits crossing or overtaking in either direction."
  },
  {
    question: "The legal blood alcohol limit for drivers in the UAE is:",
    options: ["0.05%", "0.02%", "0.00% — zero tolerance", "0.08%"],
    correctIndex: 2,
    explanation: "The UAE operates a strict zero-tolerance policy. Any detectable alcohol is an offence."
  }
];

const SIGNS = [
  { type: "mandatory", label: "Stop", desc: "Full stop required at the line. Proceed when safe." },
  { type: "mandatory", label: "No Entry", desc: "Vehicles prohibited beyond this point." },
  { type: "warning", label: "Sharp Bend", desc: "Curve ahead. Reduce speed before entering." },
  { type: "warning", label: "Pedestrians", desc: "Pedestrian crossing zone. Yield." },
  { type: "informative", label: "Hospital", desc: "Medical facility nearby." },
  { type: "informative", label: "Fuel", desc: "Petrol station within 1 km." }
];

const SIGN_TYPE_RULES = {
  mandatory: ["stop", "entry", "parking", "horn", "passing", "u_turn", "give_way", "roundabout", "minimum", "mandatory"],
  warning: ["sharp", "curve", "pedestrian", "school", "construction", "narrows", "slippery", "merge", "bump", "steep", "traffic_light", "warning"],
  informative: ["hospital", "fuel", "one_way", "parking", "informative", "information"]
};

const RULE_CHEATS = [
  { group: "Speed", k: "Single carriageway", v: "80 km/h", note: "Use this when there is no posted limit on an undivided road." },
  { group: "Speed", k: "Dual carriageway", v: "100 km/h", note: "Look for posted signs first; the sign always wins over the default." },
  { group: "Speed", k: "Highway corridors", v: "120-140 km/h", note: "Major routes such as E11 and E10 commonly sit in this range." },
  { group: "Speed", k: "Residential streets", v: "40 km/h", note: "Expect pedestrians, parked cars, and frequent side-road hazards." },
  { group: "Safety", k: "Stopping distance at 100 km/h", v: "Around 100 m", note: "Double your following gap in rain, fog, sand, or poor visibility." },
  { group: "Safety", k: "Blood alcohol limit", v: "0.00%", note: "The UAE driving rule is zero tolerance." },
  { group: "Fines", k: "Mobile phone use", v: "AED 800 + 4 black points", note: "Includes holding the phone at lights or in slow traffic." },
  { group: "Fines", k: "Seatbelt offence", v: "AED 400", note: "Every passenger must be belted, including rear-seat passengers." },
  { group: "Fines", k: "Tailgating", v: "AED 400 + 4 black points", note: "Keep a visible buffer before lane changes and braking zones." },
  { group: "Fines", k: "Red-light violation", v: "AED 1,000 + 12 black points", note: "Treat amber as a stop signal unless stopping would be unsafe." },
  { group: "Priority", k: "Roundabouts", v: "Give way to traffic inside", note: "Signal right before your exit and stay in the correct lane." },
  { group: "Priority", k: "Pedestrian crossings", v: "Stop and yield", note: "Slow early, scan both sides, and do not overtake near crossings." },
  { group: "Parking", k: "No parking zones", v: "Do not stop or wait", note: "Watch especially near intersections, crossings, bus stops, and entrances." },
  { group: "Exam", k: "Observation routine", v: "Mirrors, signal, shoulder check", note: "Examiners watch the head movement as much as the vehicle movement." }
];

function classifySign(question) {
  const raw = `${question.svgIllustrationKey || ""} ${question.tags?.join(" ") || ""} ${question.question || ""} ${question.options?.[question.correctIndex] || ""}`.toLowerCase();
  if (SIGN_TYPE_RULES.warning.some((token) => raw.includes(token))) return "warning";
  if (SIGN_TYPE_RULES.informative.some((token) => raw.includes(token))) return "informative";
  return "mandatory";
}

function cleanText(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").replace(/[?.!]+$/, "").trim();
}

function signTitle(question) {
  const answer = cleanText(question.options?.[question.correctIndex]);
  const prompt = cleanText(question.question, "Road sign");
  if (answer && /sign|mark|mean|indicate|show/i.test(prompt)) return answer;
  return prompt.replace(/^What does\s+/i, "").replace(/^This sign\s+/i, "This sign ");
}

let examAudioContext = null;
function playExamClick(kind = "tap") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    examAudioContext = examAudioContext || new AudioContext();
    const ctx = examAudioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const high = kind === "submit" ? 760 : kind === "flag" ? 560 : 420;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(high, now);
    oscillator.frequency.exponentialRampToValueAtTime(high * 0.72, now + 0.07);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "submit" ? 0.065 : 0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  } catch {
    // Audio is purely tactile; the exam works without it.
  }
}

function formatExamTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const CHEAT_SIGNS_FROM_BANK = ROADREADY_QUESTIONS
  .filter((question) => question.moduleSlug === "road-signs" && (question.image || question.svgIllustrationKey))
  .map((question) => ({
    id: question.id,
    type: classifySign(question),
    label: signTitle(question),
    desc: cleanText(question.explanation || question.question, "Road Ready UAE practice item"),
    image: question.image,
    svgIllustrationKey: question.svgIllustrationKey,
    source: question.moduleName || "Road Ready UAE",
    hasImage: Boolean(question.image)
  }))
  .filter((sign, index, all) => index === all.findIndex((item) => item.label === sign.label && item.image === sign.image && item.svgIllustrationKey === sign.svgIllustrationKey))
  .sort((a, b) => Number(b.hasImage) - Number(a.hasImage))
  .slice(0, 48);

const CHEAT_SIGNS = OFFICIAL_DRIVING_SIGNS?.signs?.length ? OFFICIAL_DRIVING_SIGNS.signs : CHEAT_SIGNS_FROM_BANK.length ? CHEAT_SIGNS_FROM_BANK : SIGNS;
const POLICE_SIGNALS = OFFICIAL_DRIVING_SIGNS?.policeSignals || [];

const STATS = [
  { k: "10", v: "Stages explained" },
  { k: "1,262", v: "Practice questions" },
  { k: "94%", v: "First-time pass rate" },
  { k: "AED 0", v: "For the full guide" }
];

const BLOG_POSTS = [
  {
    id: "abu-dhabi-driving-theory-test-2026-guide",
    n: "01",
    title: "Abu Dhabi Driving Theory Test: The Complete 2026 Guide",
    category: "Guide/Tips",
    type: "Guide",
    read: "8 min read",
    image: "assets/driving-pdf/mandatory-maximum-speed.png",
    excerpt: "A draft guide shell for the theory test flow, question format, pass mark, prep plan, and what to review before booking.",
    sections: ["Theory test overview", "How the question bank is structured", "What to study first", "Mock exam checklist"]
  },
  {
    id: "abu-dhabi-driving-license-cost-breakdown-2026",
    n: "02",
    title: "Abu Dhabi Driving License Cost Breakdown 2026",
    category: "Guide/Tips",
    type: "Guide",
    read: "7 min read",
    image: "assets/driving-pdf/informative-police-station.png",
    excerpt: "A draft cost article shell for file opening, lectures, tests, school packages, extra classes, retakes, and final license fees.",
    sections: ["Core government fees", "Driving school package ranges", "Retake and extra-class costs", "Budget planning table"]
  },
  {
    id: "must-know-abu-dhabi-driving-rules",
    n: "03",
    title: "Must-Know Abu Dhabi Driving Rules",
    category: "Lesson",
    type: "Lesson",
    read: "10 min read",
    image: "assets/edc-handbook-rules/left-hand-rule.jpg",
    excerpt: "The handbook rules that decide who moves first: left-hand priority, main-road priority, exiting, obstruction, buses, and zipper merging.",
    sections: ["Left-hand rule", "Main road and exiting rule", "Turning, obstacles, and obstruction", "Zipper and bus priority", "Exam-ready checklist"],
    intro: "These are the priority rules learners mix up most often. This lesson turns the handbook's junction rules into one practical guide for Abu Dhabi driving: who goes first, when you must wait, and when you must not enter at all.",
    articleImage: "assets/edc-handbook-rules/left-hand-rule.jpg",
    callouts: [
      { label: "Source area", value: "EDC Official Handbook" },
      { label: "Focus", value: "Priority" },
      { label: "Use it for", value: "Theory + road test" }
    ],
    notes: [
      "If a traffic light, police officer, Give Way sign, Stop sign, or road marking controls the junction, follow that instruction first.",
      "The left-hand rule is for uncontrolled junctions. It is not a shortcut to ignore signs or road markings.",
      "On the road test, examiners notice hesitation, but they mark unsafe priority mistakes much harder."
    ],
    steps: [
      "Check for police, lights, signs, and road markings first.",
      "If there is no control, check traffic from the left.",
      "If you are entering or exiting a place, give way before joining the road.",
      "Never move into a junction, crossing, or walkway unless your exit is clear.",
      "When two streams are slow and merging, alternate one-by-one."
    ],
    content: [
      {
        title: "Left-hand rule",
        body: "At junctions and intersections that are not controlled by traffic lights, signs, or road markings, priority is given to vehicles approaching from the left. The handbook says this also applies in parking lots and public areas, which is why it matters even at low speed. The exam trap is simple: the Left Hand Rule does not apply when a Give Way sign or Stop sign is present. In that case, the sign wins.",
        visual: {
          image: "assets/edc-handbook-rules/left-hand-rule.jpg",
          title: "Left-hand rule",
          text: "No light, no sign, no road marking: priority comes from the left."
        }
      },
      {
        title: "Main road and exiting rule",
        body: "When you enter a primary road, priority road, main road, or asphalt road from a gravel road, you must give way or stop for traffic from both directions. The same idea applies when exiting a parking lot, petrol station, residential area, pedestrian way, hard shoulder, or off-road area. You are joining the flow, so the road you are entering comes first. Do not treat the exit lane as a right to push in; wait until the gap is real.",
        visuals: [
          {
            image: "assets/edc-handbook-rules/main-priority-road-rule.jpg",
            title: "Main road rule",
            text: "When joining a main or priority road, give way to traffic from both directions."
          },
          {
            image: "assets/edc-handbook-rules/exit-entering-rule.jpg",
            title: "Exit and entering rule",
            text: "Leaving parking, petrol stations, residential areas, hard shoulders, or off-road areas means you give way first."
          }
        ]
      },
      {
        title: "Turning, obstacles, and obstruction",
        body: "Before turning left, give way to oncoming traffic and only turn when you can do it safely without forcing anyone to brake or change direction. If an obstacle is on your side of a narrow road, you give way to vehicles coming from the opposite direction. In traffic jams, the obstruction rule becomes just as important: do not enter a crossroads, pedestrian crossing, or walkway if you might block it. If your exit is not clear, wait before the line even if the space in front looks tempting.",
        visuals: [
          {
            image: "assets/edc-handbook-rules/turning-rule.jpg",
            title: "Turning rule",
            text: "Turning left means giving way to oncoming traffic and pedestrians crossing your path."
          },
          {
            image: "assets/edc-handbook-rules/obstruction-rule.jpg",
            title: "Obstruction rule",
            text: "Do not enter the yellow box or walkway if you may block the crossing."
          }
        ]
      },
      {
        title: "Zipper and bus priority",
        body: "When two roads meet in slow traffic, road works, or a rush-hour bottleneck, use the zipper principle: one vehicle from each stream moves ahead alternately. It is acceptable even where one side would normally have priority, because the point is to keep blocked traffic moving fairly. The handbook also notes the bus rule: inside city limits, public transport buses leaving a bus stop have priority. The clean behaviour is calm, predictable, and one-by-one.",
        visuals: [
          {
            image: "assets/edc-handbook-rules/zipper-principle.jpg",
            title: "Zipper principle",
            text: "At low speed, let one vehicle from each stream move alternately."
          },
          {
            image: "assets/edc-handbook-rules/bus-rule.jpg",
            title: "Bus rule",
            text: "Inside city limits, a bus leaving a bus stop has priority."
          }
        ]
      },
      {
        title: "Exam-ready checklist",
        body: "The order is simple: police or traffic authority signals first, then traffic lights, then signs and road markings, then the general road rules. In a roundabout, a broken give-way line means traffic already inside has priority, so slow early and choose your gap instead of rolling in late. These small priority decisions are exactly the kind of questions that appear in theory practice and the kind of judgement examiners look for in real driving.",
        visual: {
          image: "assets/driving-pdf/warning-roundabout-ahead.png",
          title: "Roundabout priority",
          text: "At roundabouts, traffic already circulating has priority when the give-way line is present."
        }
      }
    ]
  },
  {
    id: "which-driving-school-to-choose-in-abu-dhabi-breakdown",
    n: "04",
    title: "EDC Mussafah vs Yas Driving Academy: Why I'd Pick Yas Every Time",
    category: "Guide/Tips",
    type: "Guide",
    read: "8 min read",
    image: "assets/ydaschool.jpeg",
    excerpt: "A practical EDC vs YDA breakdown across price, speed, apps, theory, practical lessons, and the final road-test bottleneck.",
    sections: ["The real choice in 2026", "Price comparison", "Scheduling and road test bottleneck", "Apps, lessons, and exam experience", "My recommendation"],
    intro: "For years, Abu Dhabi learners mostly had one realistic path: EDC in Mussafah. With Yas Driving Academy now operating, the choice is no longer automatic. If your priority is finishing faster with a smoother booking experience, I would pick Yas.",
    articleImage: "assets/ydaschool.jpeg",
    apps: [
      { name: "Yas Driving Academy", image: "assets/ydalogo.jpeg", text: "Modern booking and training flow" },
      { name: "EDC Learning", image: "assets/edclogo-cropped.png", text: "Mussafah legacy app, UAE PASS login" },
      { name: "UAE PASS", image: "assets/uaepasslogo.png", text: "Used for identity login" }
    ],
    callouts: [
      { label: "Best for speed", value: "YDA" },
      { label: "Theory edge", value: "EDC" },
      { label: "Final test", value: "Mussafah now" }
    ],
    notes: [
      "As of May 2026, the official final road test is still centred around Mussafah. YDA is looking to implement final road-test access on Yas around mid-2026, but learners should confirm before choosing a package.",
      "EDC has the longer track record and stronger theory-lesson setup. YDA has the smoother booking experience and, in practice, often feels faster.",
      "YDA theory tests tend to feel easier for many learners, but you still need to study properly because the official knowledge standard is the same."
    ],
    content: [
      {
        title: "The real choice in 2026",
        body: "For about 25 years, Abu Dhabi learners had one dominant option: Emirates Driving Company in Mussafah. That changed in 2026 when Yas Driving Academy became a real alternative. Both schools work inside the same Abu Dhabi licensing journey, so the government steps do not disappear: eye test, traffic file, training permit, theory, practical training, yard or practical assessment, external road hours, and final road test. The difference is the school experience around those steps.",
        visuals: [
          {
            image: "assets/ydaschool.jpeg",
            title: "Yas Driving Academy",
            text: "The newer option, built around Yas Island facilities and a more app-driven experience."
          },
          {
            image: "assets/edclogo-cropped.png",
            title: "EDC Mussafah",
            text: "The legacy Abu Dhabi driving school route, with the longer track record and heavier demand."
          }
        ]
      },
      {
        title: "Price comparison",
        body: "The government fees stay mostly the same whichever school you choose: eye test, traffic file, training permit, road test, and licence issuance. The school package is where the gap appears. Use the comparison below as the practical learner estimate, then check the full cost guide if you want the detailed fee-by-fee version.",
        table: [
          { label: "Theory package", edc: "Around AED 871.50 excl. VAT", yda: "Around AED 819, exam separate" },
          { label: "Beginner practical", edc: "Around AED 2,705-2,982 / 19 sessions", yda: "From around AED 1,774.50 / 13 sessions" },
          { label: "Realistic total", edc: "Around AED 4,500-7,500", yda: "Around AED 3,675-5,500" },
          { label: "Premium options", edc: "Available", yda: "Available" }
        ],
        cta: {
          label: "See the full cost breakdown",
          text: "Open the cost blog for the full license fee stack, retakes, and package context.",
          href: "blog.html?post=abu-dhabi-driving-license-cost-breakdown-2026"
        }
      },
      {
        title: "Scheduling and road test bottleneck",
        body: "The biggest reason I would pick YDA is speed. EDC Mussafah is busy, and even paid priority packages can hit scheduling walls. Practical sessions can stretch across weeks because you are waiting for slots, not necessarily because you need that long to learn. This matters because the final road test is the real bottleneck. You can only join that queue after finishing the required school steps, so every week lost in practical scheduling is a week you are not waiting for the final test. YDA can often move practicals much faster because it is newer, app-based, and has a smaller backlog.",
        cta: {
          label: "Open the process timeline",
          text: "See where the final road-test queue fits into the full Abu Dhabi license path.",
          href: "process.html"
        }
      },
      {
        title: "Apps, lessons, and exam experience",
        body: "YDA feels more modern: app-based booking, Yas Marina Circuit training facilities, Al Wahda Mall registration, simulator-supported training, and newer vehicle tech in parts of the curriculum. EDC is more traditional and more Mussafah-centred, but its theory lessons are generally stronger and more established. The EDC Learning app is logged in through UAE PASS. Comparatively, many learners find the YDA theory test easier, while EDC theory preparation can feel more thorough. That makes the tradeoff simple: EDC may be better for theory comfort; YDA is usually better for speed and day-to-day convenience.",
        visuals: [
          {
            image: "assets/ydalogo.jpeg",
            title: "YDA app flow",
            text: "Better fit if you care about fast booking and a cleaner learner experience."
          },
          {
            image: "assets/edclogo-cropped.png",
            title: "EDC Learning",
            text: "Use UAE PASS to log in. Theory lessons are one of EDC's stronger points."
          }
        ]
      },
      {
        title: "My recommendation",
        body: "If you live close enough to Yas and want the cleanest route, I would pick YDA. It is usually cheaper, faster, and smoother. EDC still makes sense if Mussafah is more convenient, if you want the older and more established theory-learning setup, or if you prefer the school everyone already knows. But for most beginners starting now, the time saved at YDA is not just lesson time. It can mean joining the final road-test queue earlier, and that is the part that decides when you actually get licensed.",
        cta: {
          label: "Start with the school decision",
          text: "Once you choose the school, jump back to the full process and follow the steps in order.",
          href: "process.html"
        }
      }
    ],
    faq: [
      {
        q: "Is Yas Driving Academy cheaper than EDC?",
        a: "Usually, yes. YDA's beginner practical package starts lower, though the final total depends on retakes, extra sessions, VAT, and package choice."
      },
      {
        q: "Is the final road test at Yas?",
        a: "As of May 2026, learners should assume the final official road test is still in Mussafah. YDA is looking to implement it on Yas around mid-2026, but confirm directly before relying on it."
      },
      {
        q: "Which school has better theory lessons?",
        a: "EDC Mussafah is generally stronger for theory lessons and has a more established learning setup. YDA theory testing tends to feel easier for some learners."
      },
      {
        q: "Which one should a beginner choose?",
        a: "If distance works for you and speed matters, choose YDA. If you prefer the longest-running provider and stronger theory preparation, EDC is still a valid choice."
      }
    ],
    related: [
      "how-to-start-the-process-opening-your-file",
      "must-know-abu-dhabi-driving-rules",
      "abu-dhabi-driving-license-cost-breakdown-2026"
    ]
  },
  {
    id: "how-to-start-the-process-opening-your-file",
    n: "05",
    title: "How to start the process: Opening Your File",
    category: "Guide/Tips",
    type: "Guide",
    read: "5 min read",
    image: "assets/tammlogo.png",
    excerpt: "Start with TAMM, UAE PASS, the eye exam journey, and the Open Traffic File service so you receive your traffic file number.",
    sections: ["Before opening the traffic file", "Open Traffic File on TAMM", "Documents, cost, and timing", "What happens after payment"],
    intro: "Everything starts with TAMM. Install the TAMM app, install UAE PASS, and log in using your Emirates ID before you begin the Abu Dhabi driving license journey.",
    articleImage: "assets/blog/open-traffic-file-tamm.png",
    apps: [
      { name: "TAMM", image: "assets/tammlogo.png", text: "Start inside TAMM services" },
      { name: "UAE PASS", image: "assets/uaepasslogo.png", text: "Use UAE PASS to log in" }
    ],
    callouts: [
      { label: "Service", value: "Open Traffic File" },
      { label: "Time", value: "6 minutes" },
      { label: "Cost", value: "AED 200" }
    ],
    notes: [
      "Light vehicle applicants are eligible to open a driving licence file at 17 years and 6 months.",
      "Foreign nationals from 44 eligible countries who live in Abu Dhabi may be able to replace their foreign driving licence with a UAE driving licence directly, with theoretical and/or practical training exemptions depending on the country agreement.",
      "GCC licence holders can exchange their licence for the same category in Abu Dhabi. They may apply immediately for the driving test and are exempted from theoretical and practical training."
    ],
    steps: [
      "Log in using UAE PASS, or visit the service centre.",
      "Submit the application and the required documents.",
      "Pay the applicable fees.",
      "Receive an SMS with the traffic file number."
    ],
    content: [
      {
        title: "Before opening the traffic file",
        body: "Go to the Get a Driving License service first. In the Get Started stage, complete the Select Request Type questionnaire, then conduct an eye exam at an officially recognised optician centre. This makes sure you are eligible and ready to continue into booking training later.",
        visual: {
          image: "assets/uaepasslogo.png",
          title: "UAE PASS ready",
          text: "Set up UAE PASS before you start, because TAMM will use it for secure login."
        }
      },
      {
        title: "Open Traffic File on TAMM",
        body: "In TAMM, go to Services, then the Obtain a Driving License heading. Choose the Open Traffic File service. The service card should look like the screenshot shown here, with Emirati, Expat, and Abu Dhabi Police tags.",
        visual: {
          image: "assets/blog/open-traffic-file-tamm.png",
          title: "Open Traffic File card",
          text: "This is the card to choose when you are ready to create the traffic file."
        }
      },
      {
        title: "Documents, cost, and timing",
        body: "The required document is your Emirates ID. TAMM may already have one required document available under My TAMM, so check My TAMM for any actions before submitting. The registration fee is AED 200, and the service is listed as taking around 6 minutes."
      },
      {
        title: "What happens after payment",
        body: "After you submit the application and pay, you receive an SMS with your traffic file number. Keep that number handy because it links the rest of your driving license journey."
      }
    ]
  },
  {
    id: "uae-traffic-fines-black-points-2026-explained",
    n: "06",
    title: "UAE Traffic Fines & Black Points 2026 Explained",
    category: "Guide/Tips",
    type: "Guide",
    read: "9 min read",
    image: "assets/moilogo.png",
    excerpt: "A learner-friendly breakdown of UAE traffic fines, black points, impoundment, checking fines through MOI, and the violations most likely to appear in the theory test.",
    sections: [
      "How the fine system works",
      "Speeding, parking, and daily violations",
      "Serious offences and black points",
      "Checking and paying fines",
      "Impoundment, prevention, and test tips"
    ],
    intro: "Traffic fines in the UAE are not just about paying a number. The system can add black points, impound your vehicle, block renewal, or suspend your license. This guide condenses the 2026 fine categories into the parts learners actually need to remember.",
    articleImage: "assets/moilogo.png",
    apps: [
      { name: "MOI UAE", image: "assets/moilogo.png", text: "Check and pay fines across emirates" },
      { name: "TAMM", image: "assets/tammlogo.png", text: "Useful for Abu Dhabi traffic services" }
    ],
    callouts: [
      { label: "Fine range", value: "AED 200-50,000" },
      { label: "Point limit", value: "24 black points" },
      { label: "Most tested", value: "Speed, phones, red lights" }
    ],
    notes: [
      "Fine amounts and local campaigns can change, so always confirm the final payable amount in the official police, TAMM, RTA, or MOI app before paying.",
      "Paying a fine usually does not remove black points. Points normally expire separately after 12 months.",
      "If you think a fine is wrong, dispute it before paying because payment can be treated as acceptance."
    ],
    steps: [
      "Check your traffic file, Emirates ID, license number, or plate number in the relevant police app, TAMM, RTA, or MOI app.",
      "Open the fine details and review the date, location, fine amount, black points, impoundment status, and payment status.",
      "If black points must be assigned to a driver, complete that step before trying to pay.",
      "Pay through the official app, website, bank app, kiosk, or traffic department.",
      "Keep the receipt and check again before vehicle registration or license renewal."
    ],
    content: [
      {
        title: "How the fine system works",
        body: "The UAE traffic system combines money fines, black points, vehicle impoundment, and sometimes license confiscation. The core rules are federal, while enforcement and payment channels are handled by each emirate. For learners, the important pattern is severity: small mistakes may be AED 200-500, but dangerous driving, red lights, drink driving, and extreme speeding can bring heavy points, impoundment, court referral, or suspension.",
        cta: {
          label: "Practice fines and black points",
          text: "Use the practice tests to drill the consequences until the numbers feel automatic.",
          href: "practice.html"
        },
        visual: {
          image: "assets/moilogo.png",
          title: "MOI app",
          text: "Use the MOI app or official emirate police apps to check what is actually on your file."
        }
      },
      {
        title: "Speeding, parking, and daily violations",
        body: "Speeding fines rise as the speed over the limit increases. Up to 20 km/h over can be around AED 300 with no points, while 31-40 km/h over is commonly AED 700 with 4 black points. At 41-50 km/h over, expect AED 1,000, 6 points, and 15 days of impoundment. At 51-60 km/h over, it can become AED 1,500, 12 points, and 30 days. More than 60 km/h over can mean AED 2,000, 12 points, 60 days, and suspension; extreme 80 km/h over can reach AED 3,000 and 23 points. Daily violations matter too: disabled-space parking is around AED 1,000 and 4 points, sidewalk parking is around AED 400, double parking is around AED 500, and paid parking overstay is usually AED 100-200 depending on the emirate.",
        cta: {
          label: "Check the Cheat Sheets",
          text: "Jump to the rules sheet when you want the fine anchors without reading the whole article.",
          href: "cheatsheets.html"
        },
        visuals: [
          {
            image: "assets/driving-pdf/mandatory-maximum-speed.png",
            title: "Speed limits",
            text: "Higher speed gaps quickly add black points and impoundment."
          },
          {
            image: "assets/driving-pdf/mandatory-no-parking.png",
            title: "Parking rules",
            text: "Parking questions usually test where parking is prohibited, not just the fine amount."
          }
        ]
      },
      {
        title: "Serious offences and black points",
        body: "Seatbelts and phone use are common exam topics: not wearing a seatbelt is typically AED 400 and 4 black points for the driver, while holding a mobile phone or using a distracting device is AED 800 and 4 points. Red-light violations are much heavier: AED 1,000, 12 points, and 30 days of impoundment. Tailgating is usually AED 400 and 4 points. Overtaking from the hard shoulder or crossing a solid line to overtake can carry AED 600 and 6 points. The most serious offences include drink or drug driving, reckless driving, racing, driving without a valid license, driving against traffic, blocking emergency vehicles, and leaving an accident scene. Drink driving is zero tolerance in the UAE and can lead to arrest, court action, license suspension, impoundment, and possible imprisonment.",
        visual: {
          image: "assets/driving-pdf/mandatory-stop-and-give-way.png",
          title: "Serious violations",
          text: "Red lights, reckless driving, and unsafe overtaking are where fines become points and impoundment."
        }
      },
      {
        title: "Checking and paying fines",
        body: "You can check fines without visiting a police station. In Abu Dhabi, use Abu Dhabi Police or TAMM. In Dubai, use Dubai Police or RTA channels. Sharjah and other emirates have their own police apps and websites. For a cross-emirate view, the MOI app and MOI website are the most useful because they cover federal traffic services. You usually need a traffic file number, Emirates ID, license number, or vehicle plate details. The fine page should show the violation type, date, location, amount, black points, impoundment status, and payment status. Payment is usually available through official police apps, MOI services, bank apps, smart kiosks, traffic departments, customer happiness centres, and some authorised typing centres. Some emirates occasionally offer discount campaigns or installment plans for large balances, but those are time-limited and should be checked through official channels.",
        visual: {
          image: "assets/moilogo.png",
          title: "MOI fine check",
          text: "The MOI app is the cleanest place to start when a fine involves another emirate."
        }
      },
      {
        title: "Impoundment, prevention, and test tips",
        body: "Vehicle impoundment commonly appears as 7, 15, 30, or 60 days depending on the offence. Running a red light, driving the wrong way, and high speeding can bring 30 days; reckless driving, racing, and extreme speeding can bring 60 days. To retrieve a vehicle, you normally clear fines, wait out the period, pay storage or release fees, and provide valid registration and insurance. Unpaid fines can block vehicle registration renewal and license renewal, and very large unpaid balances can become a bigger administrative problem. To avoid fines, stay under posted limits, do not rely on speed buffers, keep seatbelts on, avoid handheld phones, leave a safe following distance, park only where allowed, maintain lights and tyres, and keep insurance and registration current. For the theory test, memorize the big anchors: mobile phone is AED 800 and 4 points, seatbelt is AED 400, red light is AED 1,000 and 12 points, tailgating is AED 400 and 4 points, and 24 black points is the danger threshold.",
        visual: {
          image: "assets/driving-pdf/warning-traffic-lights-ahead.png",
          title: "Exam memory anchors",
          text: "Questions often ask consequences: black points, impoundment, and suspension."
        }
      }
    ],
    faq: [
      {
        q: "How do I check UAE traffic fines?",
        a: "Use the relevant police app or website for the emirate, TAMM for Abu Dhabi services, RTA or Dubai Police for Dubai, or the MOI app for a wider cross-emirate check."
      },
      {
        q: "Do black points expire?",
        a: "Black points usually stay on the driving record for 12 months from the violation date. Paying the fine does not normally remove them immediately."
      },
      {
        q: "What happens at 24 black points?",
        a: "Twenty-four black points is the major danger threshold. It can lead to license withdrawal or suspension and may require retraining or retesting depending on the case."
      },
      {
        q: "What is the fine for using a phone while driving?",
        a: "Handheld phone use is commonly AED 800 and 4 black points. Any device use that distracts the driver can be treated seriously."
      },
      {
        q: "What is the fine for running a red light?",
        a: "Running a red light is commonly AED 1,000, 12 black points, and 30 days of vehicle impoundment."
      },
      {
        q: "Can I get a discount on fines?",
        a: "Some emirates announce temporary discount campaigns or installment options. Check official police channels because timing and eligibility change."
      },
      {
        q: "What happens if I do not pay traffic fines?",
        a: "Unpaid fines must usually be cleared before vehicle registration or license renewal. Very large unpaid balances can also create administrative restrictions."
      },
      {
        q: "Is there a grace period for paying fines?",
        a: "There is no reliable universal grace period. Treat fines as payable immediately unless the official authority page says otherwise."
      }
    ],
    related: [
      "must-know-abu-dhabi-driving-rules",
      "abu-dhabi-driving-theory-test-2026-guide",
      "how-to-start-the-process-opening-your-file"
    ]
  }
];

// ============ ATOMS ============
const Mono = ({ children, style }) =>
  <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace', letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11, ...style }}>{children}</span>;

const SectionMark = ({ index, label, kicker, theme = "dark" }) => {
  const fg = theme === "dark" ? "rgba(247,245,240,0.55)" : "rgba(13,33,23,0.55)";
  const line = theme === "dark" ? "rgba(247,245,240,0.18)" : "rgba(13,33,23,0.18)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, color: fg }}>
      <Mono>{`§ ${index} / ${label}`}</Mono>
      <span style={{ flex: 1, height: 1, background: line }} />
      {kicker && <Mono style={{ color: "var(--gold)" }}>{kicker}</Mono>}
    </div>
  );
};

const GoldBtn = ({ children, onClick, arrow = true, style, className = "" }) =>
  <button onClick={onClick} className={`gold-btn ${className}`.trim()} style={style}>
    <span>{children}</span>
    {arrow && <span className="gold-btn-arrow">→</span>}
  </button>;

const GhostBtn = ({ children, onClick, style }) =>
  <button onClick={onClick} className="ghost-btn" style={style}>
    {children}
  </button>;

function sectionSlug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ARTICLE_TERMS = [
  "MOI app",
  "MOI website",
  "black points",
  "vehicle impoundment",
  "license suspension",
  "traffic fines",
  "Get a Driving License",
  "Select Request Type",
  "Conduct an Eye Exam",
  "Open Traffic File",
  "Obtain a Driving License",
  "Left Hand Rule",
  "Give Way",
  "Stop",
  "obstruction rule",
  "zipper principle",
  "bus rule",
  "priority road",
  "main road",
  "roundabout",
  "obstacle",
  "UAE PASS",
  "Emirates ID",
  "My TAMM",
  "TAMM",
  "AED 200",
  "traffic file number"
];

const ARTICLE_TERM_LIMITS = {
  "moi app": 2,
  "black points": 2,
  "vehicle impoundment": 1,
  "license suspension": 1,
  "traffic fines": 1,
  "tamm": 2,
  "emirates id": 1,
  "uae pass": 2,
  "traffic file number": 1,
  "aed 200": 1
};

function ArticleText({ text, tracker }) {
  const terms = [...ARTICLE_TERMS];
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {String(text).split(pattern).map((part, i) => {
        const match = terms.find((term) => term.toLowerCase() === part.toLowerCase());
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
        const key = match.toLowerCase();
        const limit = ARTICLE_TERM_LIMITS[key] || 1;
        const seen = tracker ? tracker[key] || 0 : 0;
        if (tracker) tracker[key] = seen + 1;
        return seen < limit
          ? <strong key={i} className="article-term">{part}</strong>
          : <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// ============ NAV ============
function TopNav({ current }) {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <a className="brand" href="Wajha.html" aria-label="Go to home">
          <img
            src="assets/logo.png"
            alt="Direct Drive Abu Dhabi"
            style={{ height: 44, width: "auto", display: "block" }}
            draggable={false}
          />
        </a>
        <div className="nav-links">
          {NAV.map((n, i) =>
            <a
              key={n.id}
              href={PAGE_URLS[n.id]}
              className={`nav-link ${current === n.id ? "is-active" : ""}`}>
              <Mono style={{ color: "rgba(247,245,240,0.4)", marginRight: 8, fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</Mono>
              {n.label}
            </a>
          )}
        </div>
        <div className="nav-cta">
          <Mono style={{ color: "rgba(247,245,240,0.5)" }}>AUH · 07:14</Mono>
          <a href={PAGE_URLS.practice} className="gold-btn nav-practice-btn" style={{ padding: "10px 18px", fontSize: 13 }}>
            <span>Start Practice</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

// ============ FOOTER ============
function Footer() {
  const footerNav = [
    { id: "home", label: "Home" },
    { id: "process", label: "The Process" },
    { id: "cheatsheets", label: "Cheat Sheets" },
    { id: "practice", label: "Practice" },
    { id: "blog", label: "Blog" },
  ];

  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-top">
          <a className="brand" href="Wajha.html" aria-label="Go to home">
            <img
              src="assets/logo.png"
              alt="Direct Drive Abu Dhabi"
              style={{ height: 64, width: "auto", display: "block" }}
              draggable={false}
            />
          </a>
          <Mono style={{ color: "rgba(247,245,240,0.4)" }}>YOUR ABU DHABI DRIVING LICENSE, FINALLY MADE CLEAR.</Mono>
        </div>
        <div className="foot-cols">
          <div>
            <Mono style={{ color: "rgba(247,245,240,0.5)" }}>NAVIGATE</Mono>
            <ul>
              {footerNav.map((item) =>
                <li key={item.id}>
                  <a className="foot-link" href={PAGE_URLS[item.id]}>{item.label}</a>
                </li>
              )}
            </ul>
          </div>
          <div><Mono style={{ color: "rgba(247,245,240,0.5)" }}>RESOURCES</Mono><ul><li>Traffic signs PDF</li><li>Road rules PDF</li><li>Sample questions</li></ul></div>
          <div><Mono style={{ color: "rgba(247,245,240,0.5)" }}>LEGAL</Mono><ul><li>Sources & corrections</li><li>Privacy</li><li>Terms</li></ul></div>
          <div><Mono style={{ color: "rgba(247,245,240,0.5)" }}>CONTACT</Mono><ul><li>hello@directdrive.ae</li><li>Abu Dhabi, UAE</li></ul></div>
        </div>
        <div className="foot-bot">
          <Mono style={{ color: "rgba(247,245,240,0.4)" }}>© 2026 DIRECT DRIVE · INDEPENDENT · NOT AFFILIATED WITH ADTM OR TAMM</Mono>
          <Mono style={{ color: "rgba(247,245,240,0.4)" }}>BUILT IN ABU DHABI</Mono>
        </div>
      </div>
    </footer>
  );
}

// ============ SIGN GLYPH ============
function SignGlyph({ type }) {
  if (type === "warning") return (
    <svg viewBox="0 0 100 100" className="sign-glyph">
      <polygon points="50,8 92,85 8,85" fill="#FFC107" stroke="#111" strokeWidth="4" />
      <line x1="50" y1="38" x2="50" y2="62" stroke="#111" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="72" r="4" fill="#111" />
    </svg>
  );
  if (type === "informative") return (
    <svg viewBox="0 0 100 100" className="sign-glyph">
      <rect x="8" y="8" width="84" height="84" fill="#0066CC" stroke="#fff" strokeWidth="4" />
      <circle cx="50" cy="32" r="6" fill="#fff" />
      <line x1="50" y1="46" x2="50" y2="76" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 100" className="sign-glyph">
      <circle cx="50" cy="50" r="42" fill="#fff" stroke="#CC0000" strokeWidth="8" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#CC0000" strokeWidth="8" />
    </svg>
  );
}

// ============ QUESTION VISUAL ============
function QuestionVisual({ question }) {
  if (question.image) {
    return (
      <div className="question-visual">
        <img src={question.image} alt="Question illustration" />
      </div>
    );
  }
  if (question.svgIllustrationKey) {
    return (
      <div className="question-visual">
        <RoadSignSvg kind={question.svgIllustrationKey} />
      </div>
    );
  }
  return null;
}

function RoadSignSvg({ kind }) {
  const alias = {
    speed_limit_40: "sign_speed_limit_40",
    speed_limit_60: "sign_speed_limit_60",
    speed_limit_120: "sign_speed_limit_120",
    minimum_speed_100: "sign_minimum_speed_100",
    no_parking: "sign_no_parking",
    pedestrian_crossing: "sign_pedestrian_crossing",
    school_zone: "sign_school_zone",
    construction_zone: "sign_construction_zone",
    roundabout: "sign_roundabout",
  };
  const k = alias[kind] || kind;
  const speed = k.match(/speed_limit_(\d+)/)?.[1];
  const isMinimum = k === "sign_minimum_speed_100";

  if (speed || isMinimum) {
    const value = isMinimum ? "100" : speed;
    return (
      <svg viewBox="0 0 200 200" className="road-sign-svg">
        <circle cx="100" cy="100" r="88" fill={isMinimum ? "#0066CC" : "#FFFFFF"} stroke={isMinimum ? "#FFFFFF" : "#CC0000"} strokeWidth="12" />
        <text x="100" y="120" textAnchor="middle" fill={isMinimum ? "#FFFFFF" : "#000000"} fontSize={value.length > 2 ? 62 : 72} fontWeight="bold" fontFamily="Arial">{value}</text>
      </svg>
    );
  }

  const warning = (children) => (
    <svg viewBox="0 0 200 200" className="road-sign-svg">
      <polygon points="100,12 188,180 12,180" fill="#FFC107" stroke="#111111" strokeWidth="5" />
      {children}
    </svg>
  );

  switch (k) {
    case "sign_stop":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><polygon points="100,10 170,40 190,110 160,175 100,195 40,175 10,110 30,40" fill="#CC0000" stroke="#FFFFFF" strokeWidth="6" /><text x="100" y="116" textAnchor="middle" fill="#FFFFFF" fontSize="52" fontWeight="bold" fontFamily="Arial">STOP</text></svg>;
    case "sign_no_entry":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="90" fill="#CC0000" stroke="#FFFFFF" strokeWidth="6" /><rect x="30" y="85" width="140" height="30" rx="4" fill="#FFFFFF" /></svg>;
    case "sign_no_parking":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="88" fill="#FFFFFF" stroke="#CC0000" strokeWidth="12" /><text x="100" y="125" textAnchor="middle" fill="#0066CC" fontSize="72" fontWeight="bold" fontFamily="Arial">P</text><line x1="35" y1="165" x2="165" y2="35" stroke="#CC0000" strokeWidth="12" /></svg>;
    case "sign_no_u_turn":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="88" fill="#FFFFFF" stroke="#CC0000" strokeWidth="12" /><path d="M80 150 L80 82 A30 30 0 0 1 140 82 L140 100 L155 85 L140 70 L140 82" fill="none" stroke="#000" strokeWidth="8" /><line x1="35" y1="165" x2="165" y2="35" stroke="#CC0000" strokeWidth="12" /></svg>;
    case "sign_no_horn":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="88" fill="#FFFFFF" stroke="#CC0000" strokeWidth="12" /><path d="M60 90 L85 90 L130 60 L130 140 L85 110 L60 110 Z" fill="#000" /><line x1="35" y1="165" x2="165" y2="35" stroke="#CC0000" strokeWidth="12" /></svg>;
    case "sign_no_passing":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="88" fill="#FFFFFF" stroke="#CC0000" strokeWidth="12" /><ellipse cx="75" cy="110" rx="28" ry="35" fill="#000" /><ellipse cx="125" cy="110" rx="28" ry="35" fill="#CC0000" /><line x1="35" y1="165" x2="165" y2="35" stroke="#CC0000" strokeWidth="12" /></svg>;
    case "sign_give_way":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><polygon points="100,180 15,30 185,30" fill="#FFFFFF" stroke="#CC0000" strokeWidth="10" /></svg>;
    case "sign_roundabout":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="90" fill="#0066CC" stroke="#FFFFFF" strokeWidth="6" /><circle cx="100" cy="95" r="30" fill="none" stroke="#FFFFFF" strokeWidth="6" /><polygon points="125,80 143,70 131,96" fill="#FFFFFF" /><polygon points="100,150 90,130 110,130" fill="#FFFFFF" /></svg>;
    case "sign_parking":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><rect x="15" y="15" width="170" height="170" fill="#0066CC" stroke="#FFFFFF" strokeWidth="6" /><text x="100" y="130" textAnchor="middle" fill="#FFFFFF" fontSize="100" fontWeight="bold" fontFamily="Arial">P</text></svg>;
    case "sign_hospital":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><rect x="15" y="15" width="170" height="170" fill="#0066CC" stroke="#FFFFFF" strokeWidth="6" /><rect x="85" y="45" width="30" height="110" fill="#FFFFFF" /><rect x="45" y="85" width="110" height="30" fill="#FFFFFF" /></svg>;
    case "sign_fuel_station":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><rect x="15" y="15" width="170" height="170" fill="#0066CC" stroke="#FFFFFF" strokeWidth="6" /><rect x="55" y="55" width="55" height="80" rx="4" fill="#FFFFFF" /><rect x="65" y="65" width="35" height="25" fill="#0066CC" /><path d="M120 70 L140 55 L140 120 L130 120 L130 85 L120 80 Z" fill="#FFFFFF" /></svg>;
    case "sign_one_way":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><rect x="10" y="70" width="180" height="60" fill="#0066CC" stroke="#FFFFFF" strokeWidth="4" /><polygon points="150,75 185,100 150,125" fill="#FFFFFF" /><text x="85" y="108" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="bold" fontFamily="Arial">ONE WAY</text></svg>;
    case "sign_pedestrian_crossing":
      return warning(<><circle cx="100" cy="65" r="10" fill="#000" /><line x1="100" y1="75" x2="100" y2="120" stroke="#000" strokeWidth="5" /><line x1="85" y1="95" x2="115" y2="90" stroke="#000" strokeWidth="4" /><line x1="100" y1="120" x2="85" y2="155" stroke="#000" strokeWidth="4" /><line x1="100" y1="120" x2="115" y2="155" stroke="#000" strokeWidth="4" /></>);
    case "sign_school_zone":
      return warning(<><circle cx="85" cy="80" r="8" fill="#000" /><circle cx="115" cy="80" r="8" fill="#000" /><line x1="85" y1="88" x2="85" y2="120" stroke="#000" strokeWidth="4" /><line x1="115" y1="88" x2="115" y2="120" stroke="#000" strokeWidth="4" /><line x1="85" y1="120" x2="75" y2="150" stroke="#000" strokeWidth="3" /><line x1="115" y1="120" x2="125" y2="150" stroke="#000" strokeWidth="3" /></>);
    case "sign_construction_zone":
      return warning(<><rect x="72" y="82" width="56" height="36" fill="#000" /><circle cx="84" cy="132" r="10" fill="#000" /><circle cx="122" cy="132" r="10" fill="#000" /><path d="M55 150 H145" stroke="#000" strokeWidth="8" /></>);
    case "sign_road_narrows":
      return warning(<><path d="M70 150 L90 60 L96 60 L76 150 Z" fill="#000" /><path d="M130 150 L110 60 L104 60 L124 150 Z" fill="#000" /></>);
    case "sign_sharp_curve_right":
      return warning(<><path d="M80 150 L80 90 Q80 60 110 60 L130 60" fill="none" stroke="#000" strokeWidth="10" /><polygon points="125,45 145,60 125,75" fill="#000" /></>);
    case "sign_sharp_curve_left":
      return warning(<><path d="M120 150 L120 90 Q120 60 90 60 L70 60" fill="none" stroke="#000" strokeWidth="10" /><polygon points="75,45 55,60 75,75" fill="#000" /></>);
    case "sign_slippery_road":
      return warning(<><path d="M70 140 Q85 120 100 130 Q115 140 130 120" fill="none" stroke="#000" strokeWidth="6" /><rect x="85" y="75" width="30" height="15" rx="3" fill="#000" /><line x1="85" y1="90" x2="75" y2="130" stroke="#000" strokeWidth="4" /><line x1="115" y1="90" x2="125" y2="130" stroke="#000" strokeWidth="4" /></>);
    case "sign_merge_lanes":
      return warning(<><path d="M80 150 L100 60" stroke="#000" strokeWidth="8" strokeLinecap="round" /><path d="M120 150 L100 60" stroke="#000" strokeWidth="8" strokeLinecap="round" /></>);
    case "sign_speed_bump":
      return warning(<path d="M50 130 Q100 70 150 130" fill="none" stroke="#000" strokeWidth="10" strokeLinecap="round" />);
    case "sign_steep_hill":
      return warning(<><path d="M55 145 L145 65" stroke="#000" strokeWidth="10" strokeLinecap="round" /><text x="130" y="60" textAnchor="middle" fill="#000" fontSize="24" fontWeight="bold" fontFamily="Arial">%</text></>);
    case "sign_traffic_light":
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><rect x="65" y="15" width="70" height="170" rx="8" fill="#333" stroke="#000" strokeWidth="3" /><circle cx="100" cy="55" r="22" fill="#CC0000" /><circle cx="100" cy="105" r="22" fill="#FFC107" /><circle cx="100" cy="155" r="22" fill="#00AA00" /></svg>;
    default:
      return <svg viewBox="0 0 200 200" className="road-sign-svg"><circle cx="100" cy="100" r="88" fill="#FFFFFF" stroke="#CC0000" strokeWidth="12" /><text x="100" y="112" textAnchor="middle" fill="#111111" fontSize="22" fontWeight="bold" fontFamily="Arial">SIGN</text></svg>;
  }
}

// ============ SCORE TRACKER ============
function ScoreTracker() {
  const sessions = [62, 71, 68, 78, 82, 79, 88, 91, 89, 94];
  const cats = [
    { name: "Traffic signs", score: 92 },
    { name: "Road rules", score: 86 },
    { name: "Road behavior", score: 78 },
    { name: "Parking", score: 71 },
    { name: "Emergencies", score: 84 }
  ];
  const w = 720, h = 220, pad = 24;
  const max = 100;
  const points = sessions.map((s, i) => {
    const x = pad + i / (sessions.length - 1) * (w - pad * 2);
    const y = h - pad - s / max * (h - pad * 2);
    return { x, y, s };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <div className="tracker">
      <div className="tracker-head">
        <div>
          <Mono style={{ color: "rgba(247,245,240,0.5)" }}>TREND · LAST 10 SESSIONS</Mono>
          <div className="tracker-big">94%<span style={{ color: "var(--gold)", fontSize: 16, marginLeft: 12 }}>↑ 32</span></div>
        </div>
        <div className="tracker-meta">
          <div><Mono style={{ color: "rgba(247,245,240,0.5)" }}>SESSIONS</Mono><div>10</div></div>
          <div><Mono style={{ color: "rgba(247,245,240,0.5)" }}>AVG</Mono><div>80%</div></div>
          <div><Mono style={{ color: "rgba(247,245,240,0.5)" }}>BEST</Mono><div>94%</div></div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="tracker-chart">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = pad + i / 4 * (h - pad * 2);
          return <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="rgba(247,245,240,0.08)" />;
        })}
        <line x1={pad} x2={w - pad} y1={h - pad - 0.7 * (h - pad * 2)} y2={h - pad - 0.7 * (h - pad * 2)} stroke="rgba(201,168,76,0.4)" strokeDasharray="4 4" />
        <text x={w - pad - 70} y={h - pad - 0.7 * (h - pad * 2) - 6} fill="rgba(201,168,76,0.7)" fontSize="10" fontFamily="JetBrains Mono">PASS · 70%</text>
        <path d={path} fill="none" stroke="var(--gold)" strokeWidth="2" />
        <path d={`${path} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`} fill="rgba(201,168,76,0.08)" />
        {points.map((p, i) =>
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? "var(--gold)" : "#F7F5F0"} stroke="#0D2117" strokeWidth="1.5" />
        )}
      </svg>
      <div className="cat-grid">
        {cats.map((c, i) =>
          <div key={i} className="cat-row">
            <div className="cat-name">{c.name}</div>
            <div className="cat-bar"><div className="cat-fill" style={{ width: `${c.score}%` }} /></div>
            <Mono style={{ color: "var(--gold)", minWidth: 36, textAlign: "right" }}>{c.score}%</Mono>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ FREE QUESTION MODAL ============
function FreeQuestionModal({ onClose }) {
  const [picked, setPicked] = useState(null);
  const q = PRACTICE_QUESTIONS[0];
  return (
    <div className="modal-shade" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <Mono style={{ color: "var(--gold)" }}>FREE SAMPLE · QUESTION 1 OF {PRACTICE_QUESTIONS.length ? ROADREADY_QUESTIONS.length || 3 : 3}</Mono>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <QuestionVisual question={q} />
        <h3>{q.question}</h3>
        <div className="exam-options">
          {q.options.map((o, i) => {
            const correct = i === q.correctIndex;
            const chosen = picked === i;
            let cls = "exam-opt";
            if (picked != null) {
              if (correct) cls += " is-correct";
              else if (chosen) cls += " is-wrong";
            } else if (chosen) cls += " is-picked";
            return (
              <button key={i} onClick={() => setPicked(i)} className={cls}>
                <span className="exam-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="exam-opt-text">{o}</span>
              </button>
            );
          })}
        </div>
        {picked != null &&
          <div className={`feedback-panel ${picked === q.correctIndex ? "" : "is-wrong"}`}>
            <Mono style={{ color: picked === q.correctIndex ? "var(--gold)" : "#f5a3a3" }}>
              {picked === q.correctIndex ? "✓ CORRECT" : "✗ INCORRECT"}
            </Mono>
            {picked !== q.correctIndex && <p>Correct answer — {String.fromCharCode(65 + q.correctIndex)}: {q.options[q.correctIndex]}</p>}
            {q.explanation && <>
              <hr />
              <Mono style={{ color: "rgba(247,245,240,0.42)" }}>EXPLANATION</Mono>
              <p>{q.explanation}</p>
            </>}
          </div>
        }
      </div>
    </div>
  );
}

// ============ EXPOSE TO PAGE FILES ============
Object.assign(window, {
  navigate,
  PAGE_URLS,
  TWEAK_DEFAULTS,
  hexToRgb,
  mixHex,
  withAlpha,
  NAV,
  PARTNERS,
  PROCESS_STAGES,
  ROADREADY_QUESTIONS,
  ROADREADY_QUESTION_BY_ID,
  QUESTIONS_BY_MODULE,
  FALLBACK_PRACTICE_MODULES,
  PRACTICE_MODULES,
  MOCK_EXAMS,
  FALLBACK_MOCK_EXAMS,
  PRACTICE_QUESTIONS,
  SIGNS,
  SIGN_TYPE_RULES,
  RULE_CHEATS,
  CHEAT_SIGNS,
  POLICE_SIGNALS,
  STATS,
  BLOG_POSTS,
  classifySign,
  cleanText,
  signTitle,
  playExamClick,
  formatExamTime,
  sectionSlug,
  ARTICLE_TERMS,
  ARTICLE_TERM_LIMITS,
  ArticleText,
  Mono,
  SectionMark,
  GoldBtn,
  GhostBtn,
  TopNav,
  Footer,
  SignGlyph,
  QuestionVisual,
  RoadSignSvg,
  ScoreTracker,
  FreeQuestionModal,
});
