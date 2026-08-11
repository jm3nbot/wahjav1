/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;

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
// derive a related shade by mixing with white/black at alpha mix
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
{ id: "blog", label: "Blog" }];


const PARTNERS = [
"TAMM", "YAS DRIVING ACADEMY", "EDC MUSSAFAH", "ADTM", "ABU DHABI POLICE",
"EMIRATES DRIVING COMPANY", "AL AHLIA"];


const PROCESS_STAGES = [
{ n: "01", name: "Eye Test", where: "Any approved optician", cost: "AED 100", time: "15 min", mistake: "Booking the eye test before opening your traffic file. Order matters." },
{ n: "02", name: "Open Traffic File", where: "TAMM app or ADTM", cost: "AED 200", time: "1 day", mistake: "Uploading a passport photo with a non-white background. Auto-rejected.", blogPostId: "how-to-start-the-process-opening-your-file" },
{ n: "03", name: "Choose a Driving School", where: "EDC Mussafah or Yas Driving School", cost: "AED 0", time: "30 min", mistake: "Picking the cheapest package without checking branch distance from home — you'll regret it on lesson day." },
{ n: "04", name: "Register & Pay Package", where: "Your chosen school", cost: "AED 3,800–6,000", time: "1 hour", mistake: "Paying for the regular package when you qualify for the VIP fast-track." },
{ n: "05", name: "Theory Lectures", where: "School branch or online", cost: "Included", time: "8 hours", mistake: "Skipping the Arabic-translated handouts. Some test phrasing comes straight from them." },
{ n: "06", name: "Theory Test", where: "School test centre", cost: "AED 200", time: "45 min", mistake: "Not booking early. Slots fill up months in advance — book the moment you finish lectures." },
{ n: "07", name: "Practical Courses", where: "School yard & branch", cost: "Included", time: "Varies", mistake: "Treating the in-person basics as a formality. Signaling, mirrors, parallel parking and 90-degree parking are exactly what the yard examiner scores." },
{ n: "08", name: "Yard Test", where: "School yard", cost: "AED 200", time: "30 min", mistake: "The yard test covers 90-degree parking, basic maneuvering, and parallel parking. Examiners watch mirrors, shoulders, and control throughout." },
{ n: "09", name: "External Road Hours", where: "Public roads with school instructor", cost: "AED 100 permit + AED 70–100 / hr · 6 hours", time: "5 business days + 6 hours", mistake: "Before external hours, request the training card permit through TAMM. It is around AED 100 and usually arrives in about 5 business days, so do it early before spacing out your six road hours." },
{ n: "10", name: "Final Road Test", where: "Public road with police examiner", cost: "AED 200", time: "5 min", mistake: "Book as soon as possible. Mussafah can be booked for months; there is an AED 300 prepone/postpone option, but finding an earlier slot is rare and securing one early saves many days." }];


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
}];


const SIGNS = [
{ type: "mandatory", label: "Stop", desc: "Full stop required at the line. Proceed when safe." },
{ type: "mandatory", label: "No Entry", desc: "Vehicles prohibited beyond this point." },
{ type: "warning", label: "Sharp Bend", desc: "Curve ahead. Reduce speed before entering." },
{ type: "warning", label: "Pedestrians", desc: "Pedestrian crossing zone. Yield." },
{ type: "informative", label: "Hospital", desc: "Medical facility nearby." },
{ type: "informative", label: "Fuel", desc: "Petrol station within 1 km." }];

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
  { group: "Exam", k: "Observation routine", v: "Mirrors, signal, shoulder check", note: "Examiners watch the head movement as much as the vehicle movement." }];

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
{ k: "AED 0", v: "For the full guide" }];

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
  title: "Which Driving School to Choose in Abu Dhabi Breakdown",
  category: "Guide/Tips",
  type: "Guide",
  read: "6 min read",
  image: "assets/driving-pdf/mandatory-roundabout-mandatory.png",
  excerpt: "A draft comparison shell for choosing between Abu Dhabi driving schools based on location, booking speed, lesson style, packages, and test-day logistics.",
  sections: ["School options in Abu Dhabi", "Location and commute tradeoffs", "Package and booking differences", "How to choose for your schedule"]
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
    {
      name: "TAMM",
      image: "assets/tammlogo.png",
      text: "Start inside TAMM services"
    },
    {
      name: "UAE PASS",
      image: "assets/uaepasslogo.png",
      text: "Use UAE PASS to log in"
    }
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
}];


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
    </div>);

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
  "tamm": 2,
  "emirates id": 1,
  "uae pass": 2,
  "traffic file number": 1,
  "aed 200": 1
};

function ArticleText({ text, tracker }) {
  const terms = [
    ...ARTICLE_TERMS
  ];
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
    </>);
}


// ============ NAV ============
function TopNav({ active, setActive }) {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <button className="brand brand-button" onClick={() => setActive("home")} aria-label="Go to home">
          <img
            src="assets/logo.png"
            alt="Direct Drive Abu Dhabi"
            style={{ height: 44, width: "auto", display: "block" }}
            draggable={false}
          />
        </button>
        <div className="nav-links">
          {NAV.map((n, i) =>
          <button
            key={n.id}
            onClick={() => setActive(n.id)}
            className={`nav-link ${active === n.id ? "is-active" : ""}`}>
            
              <Mono style={{ color: "rgba(247,245,240,0.4)", marginRight: 8, fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</Mono>
              {n.label}
            </button>
          )}
        </div>
        <div className="nav-cta">
          <Mono style={{ color: "rgba(247,245,240,0.5)" }}>AUH · 07:14</Mono>
          <GoldBtn onClick={() => setActive("practice")} arrow={false} className="nav-practice-btn" style={{ padding: "10px 18px", fontSize: 13 }}>Start Practice</GoldBtn>
        </div>
      </div>
    </nav>);

}

// ============ HERO ============
function Hero({ setActive, tweaks, setShowQ }) {
  const videoRef = useRef(null);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dim = tweaks.videoDim;

  return (
    <section id="home" className="hero" data-screen-label="01 Hero">
      <div className="hero-card-wrap">
        <div className="hero-card">
          {/* Video fills the card as background */}
          <video
            ref={videoRef}
            className="hero-card-video"
            src="assets/newherovid.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{ filter: `brightness(${dim})` }} />
          

          {/* Gradient scrim for text legibility */}
          <div className="hero-card-grad" />

          {/* Minimal live-feed chrome */}
          <LiveFeedChrome />

          {/* Hero text — overlaid on top of video */}
          <div className="hc-text">
            <h1 className="hero-h1">
              Get your Abu Dhabi <br />
              driving license. <br />
              <span className="hero-h1-accent">The right way.</span>
            </h1>
            <p className="hero-sub">
              Free step-by-step guide, official cheat sheets, and timed theory practice.
              Ten stages. One source.
            </p>
            <div className="hero-cta-row">
              <GoldBtn onClick={() => setActive("process")}>See the full process</GoldBtn>
              <GhostBtn onClick={() => setShowQ(true)}>Try a free practice question</GhostBtn>
            </div>
          </div>
        </div>
      </div>

      <PartnerStrip />
    </section>);

}

function LiveFeedChrome() {
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState(67);
  useEffect(() => {
    const id = setInterval(() => {
      setT((v) => v + 1);
      setSpeed((s) => {
        // gentle drift between 58–74
        const next = s + (Math.random() * 4 - 2);
        return Math.max(58, Math.min(74, Math.round(next)));
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return (
    <>
      <div className="hc-feed-tl">
        <span className="rec-dot" />
        <Mono>LIVE · CAM 04 · CORNICHE EAST</Mono>
      </div>
      <div className="hc-feed-br">
        <Mono><span className="hc-feed-num">{speed}</span> KM/H · 00:{mm}:{ss}</Mono>
      </div>
    </>);

}

function PartnerStrip() {
  const items = [...PARTNERS, ...PARTNERS, ...PARTNERS];
  return (
    <div className="partners">
      <div className="partners-label">
        <Mono style={{ color: "rgba(247,245,240,0.55)" }}>IN ALIGNMENT WITH</Mono>
      </div>
      <div className="partners-track-wrap">
        <div className="partners-track">
          {items.map((p, i) =>
          <div key={i} className="partner-chip">
              <span className="partner-dot" />
              <Mono style={{ color: "rgba(247,245,240,0.85)", fontSize: 12 }}>{p}</Mono>
            </div>
          )}
        </div>
      </div>
    </div>);

}

// ============ CAR DRIVE SECTION ============
const FUEL_CSS = `
@keyframes fuelA {
  0%   { transform: translate(0,0) scale(1);    opacity: 0.9; }
  100% { transform: translate(-52px, 10px) scale(0.1); opacity: 0; }
}
@keyframes fuelB {
  0%   { transform: translate(0,0) scale(1);    opacity: 0.7; }
  100% { transform: translate(-68px, -8px) scale(0.1); opacity: 0; }
}
@keyframes fuelC {
  0%   { transform: translate(0,0) scale(1);    opacity: 0.8; }
  100% { transform: translate(-40px, 14px) scale(0.15); opacity: 0; }
}
@keyframes fuelD {
  0%   { transform: translate(0,0) scale(1);    opacity: 0.65; }
  100% { transform: translate(-80px, 4px) scale(0.1); opacity: 0; }
}
@keyframes wheelSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

// ox/oy = position relative to the car container's left/bottom — the truck's rear tire area.
// Rear tire center at ~61px from left, ~43px from bottom at rendered 152px height.
const PARTICLES = [
  { anim:"fuelA", dur:0.75, delay:0,    size:7,  ox:60, oy:43 },
  { anim:"fuelB", dur:0.88, delay:0.12, size:5,  ox:58, oy:47 },
  { anim:"fuelC", dur:0.62, delay:0.22, size:6,  ox:63, oy:40 },
  { anim:"fuelD", dur:0.95, delay:0.06, size:8,  ox:57, oy:45 },
  { anim:"fuelA", dur:0.70, delay:0.18, size:4,  ox:65, oy:42 },
  { anim:"fuelB", dur:0.82, delay:0.28, size:5,  ox:61, oy:49 },
  { anim:"fuelC", dur:0.58, delay:0.09, size:4,  ox:59, oy:38 },
  { anim:"fuelD", dur:0.90, delay:0.32, size:7,  ox:62, oy:44 },
  { anim:"fuelA", dur:0.65, delay:0.04, size:3,  ox:67, oy:41 },
  { anim:"fuelC", dur:0.78, delay:0.16, size:6,  ox:56, oy:46 },
];

// ============ VALUE PROPS ============
function ValueProps({ setActive }) {
  const items = [
  { n: "01", t: "The Process", d: "Ten stages, end to end. What to do, where to go, how much, and the mistake everyone makes.", a: () => setActive("process"), tag: "GUIDE", ic: "process" },
  { n: "02", t: "Cheat Sheets", d: "Traffic signs and road rules, one printable PDF each. No email. No paywall.", a: () => setActive("cheatsheets"), tag: "REFERENCE", ic: "sheet" },
  { n: "03", t: "Practice Tests", d: "1,262 questions, 45-minute timed mode, full review on every wrong answer.", a: () => setActive("practice"), tag: "TIMED", ic: "test" }];

  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [containerW, setContainerW] = useState(800);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // Animate while the section header passes through the viewport.
      // Range expanded another 20% — slower traversal.
      const start = vh * 1.00;
      const end = vh * 0.10;
      const p = (start - rect.top) / (start - end);
      const next = Math.max(0, Math.min(1, p));
      setProgress((current) => Math.abs(current - next) < 0.006 ? current : next);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };
    const onResize = () => {
      if (trackRef.current) setContainerW(trackRef.current.offsetWidth);
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    schedule();
    onResize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Car enters fully off-screen left (-22%) and exits fully off-screen right (118%).
  const carLeftPct = -22 + progress * 140;
  const carX = (carLeftPct / 100) * containerW;
  const isMoving = progress > 0.02 && progress < 0.985;

  // Reveal text from behind the car — track the truck's actual rear bumper (its trailing edge).
  // The car PNG has ~15px transparent padding on the left at 152px render height, so add that
  // offset to the car div's left edge to align the reveal boundary with the visible bumper.
  const REAR_BUMPER_OFFSET = 15;
  const carRearPx = (carLeftPct / 100) * containerW + REAR_BUMPER_OFFSET;
  const revealedPct = Math.max(0, Math.min(100, (carRearPx / containerW) * 100));
  const textClip = `inset(0 ${(100 - revealedPct).toFixed(2)}% 0 0)`;

  return (
    <section ref={sectionRef} className="valueprops" data-screen-label="02 Value props" style={{ paddingTop: 5 }}>
      <style>{FUEL_CSS}</style>
      <div className="vp-scanlines" aria-hidden />

      {/* Car drives across, above the section heading, in the same card */}
      <div ref={trackRef} style={{
        position: "relative",
        height: 152,
        marginBottom: 2,
        zIndex: 2,
      }}>
        {/* Header text revealed from behind the car as it sweeps past */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          clipPath: textClip,
          pointerEvents: "none",
          zIndex: 1,
        }}>
          <span style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontWeight: 500,
            fontSize: "clamp(22px, 3.6vw, 46px)",
            color: "var(--cream)",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}>
            Three Simple{" "}
            <span style={{ color: "var(--gold)" }}>Steps</span>
          </span>
        </div>

        <div style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          display: "flex",
          alignItems: "flex-end",
          pointerEvents: "none",
          transform: `translate3d(${carX.toFixed(1)}px, 0, 0)`,
          willChange: "transform",
          zIndex: 2,
        }}>
          {isMoving && PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              width: p.size, height: p.size,
              borderRadius: "50%",
              background: "var(--gold)",
              left: p.ox,
              bottom: p.oy,
              opacity: 0,
              animation: `${p.anim} ${p.dur}s ease-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))}

          <img
            src="assets/carimage.png"
            alt=""
            draggable={false}
            style={{
              height: "152px",
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 10px 32px rgba(0,0,0,0.65))",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ marginBottom: 56 }}>
          <SectionMark index="01" label="WHAT DIRECT DRIVE DOES" kicker="THREE PARTS" />
        </div>
        <div className="vp-grid">
          {items.map((it, i) =>
          <button key={i} className="vp-card" onClick={it.a}>
              <div className="vp-head">
                <span className="vp-tag">
                  <span className="vp-pulse" />
                  <Mono style={{ fontSize: 10, color: "rgba(247,245,240,0.55)" }}>MODULE {it.n} · {it.tag}</Mono>
                </span>
                <span className="vp-icon" aria-hidden>
                  <VPIcon kind={it.ic} />
                </span>
              </div>
              <div className="vp-num">{it.n}</div>
              <h3 className="vp-title" style={{ fontFamily: "\"Plus Jakarta Sans\"" }}>{it.t}</h3>
              <p className="vp-desc">{it.d}</p>
              <div className="vp-arrow">
                <Mono>OPEN MODULE</Mono> <span>→</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>);

}

function VPIcon({ kind }) {
  const s = { width: 28, height: 28, fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "square" };
  if (kind === "process") return (
    <svg viewBox="0 0 28 28" {...s}>
      <circle cx="6" cy="14" r="2.5" /><circle cx="14" cy="14" r="2.5" /><circle cx="22" cy="14" r="2.5" />
      <path d="M8.5 14 L11.5 14 M16.5 14 L19.5 14" />
    </svg>);

  if (kind === "sheet") return (
    <svg viewBox="0 0 28 28" {...s}>
      <rect x="6" y="4" width="16" height="20" />
      <path d="M9 10 L19 10 M9 14 L19 14 M9 18 L15 18" />
    </svg>);

  return (
    <svg viewBox="0 0 28 28" {...s}>
      <circle cx="14" cy="14" r="9" />
      <path d="M14 8 L14 14 L18 16" />
    </svg>);

}

// ============ TIMELINE PREVIEW ============
function TimelinePreview({ setActive }) {
  return (
    <section className="timeline-preview" data-screen-label="03 Timeline preview">
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <SectionMark index="02" label="THE TEN STAGES" kicker="FREE FOREVER" theme="light" />
        </div>
        <div className="tp-head">
        <h2 className="section-h2 dark">From eye test to final road test. <br /><em>Every step, in order.</em></h2>
          <p className="section-sub dark">
            Most people get stuck not because the process is hard, but because it is scattered across four apps and three offices. Here it is in one line.
          </p>
        </div>
        <div className="tp-track">
          {PROCESS_STAGES.map((s, i) =>
          <div key={i} className="tp-card" onClick={() => setActive("process")}>
              <Mono style={{ color: "var(--gold)" }}>STAGE {s.n}</Mono>
              <div className="tp-name">{s.name}</div>
              <div className="tp-meta">
                <Mono style={{ color: "rgba(13,33,23,0.5)" }}>{s.cost}</Mono>
                <span className="tp-dot" />
                <Mono style={{ color: "rgba(13,33,23,0.5)" }}>{s.time}</Mono>
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <GoldBtn onClick={() => setActive("process")}>Open the full process</GoldBtn>
        </div>
      </div>
    </section>);

}

// ============ STATS / SOCIAL PROOF ============
function StatStrip() {
  return (
    <section className="stats" data-screen-label="04 Stats">
      <div className="container">
        <div className="stats-grid">
          {STATS.map((s, i) =>
          <div key={i} className="stat-cell">
              <div className="stat-k">{s.k}</div>
              <Mono style={{ color: "rgba(247,245,240,0.55)" }}>{s.v}</Mono>
            </div>
          )}
        </div>
        <div className="quote">
          <div className="quote-mark">“</div>
          <p>I failed twice with two different apps. Direct Drive was the first thing that explained why my answers were wrong. Passed on the next try.</p>
          <div className="quote-attr">
            <Mono>HAMAD A. · KHALIDIYA · PASSED MAR 2026</Mono>
          </div>
        </div>
      </div>
    </section>);

}

// ============ PRICING ============
function Pricing() {
  const pricingRef = useRef(null);
  const [headlineRevealed, setHeadlineRevealed] = useState(false);
  const tiers = [
  { name: "Free Forever", price: "AED 0", per: "always", features: ["Full 10-stage process guide", "Traffic signs cheat sheet", "Road rules cheat sheet", "5 sample practice questions"], cta: "Start free", featured: false },
  { name: "Practice — 7 Days", price: "AED 15", per: "one-time", features: ["Everything in Free", "All 1,262 questions", "3 timed mock exams", "Wrong-answer reviews"], cta: "Get 7 days", featured: false },
  { name: "Practice — Lifetime", price: "AED 55", per: "one-time", features: ["Everything in 30 Days", "Unlimited mock exams", "Score tracker & graphs", "Category breakdown reports"], cta: "Get lifetime", featured: true }];

  useEffect(() => {
    const node = pricingRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHeadlineRevealed(true);
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -45% 0px", threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={pricingRef} className="pricing" data-screen-label="05 Pricing">
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <SectionMark index="03" label="PRICING" kicker="ONE FAILED TEST COSTS MORE" theme="light" />
        </div>
        <div className="pricing-head">
          <h2 className="section-h2 dark">One failed theory test <br /><em className={`pricing-reveal-em ${headlineRevealed ? "is-visible" : ""}`}>costs more than a lifetime plan.</em></h2>
          <p className="section-sub dark">A retake at the test centre is AED 200. Lifetime here is AED 55. The math does itself.</p>
        </div>
        <div className="price-grid">
          {tiers.map((t, i) =>
          <div key={i} className={`price-card ${t.featured ? "is-featured" : ""}`}>
              {t.featured && <div className="featured-tag"><Mono>RECOMMENDED</Mono></div>}
              <Mono style={{ color: t.featured ? "var(--gold)" : "rgba(13,33,23,0.5)" }}>{t.name}</Mono>
              <div className="price-num">
                <span>{t.price}</span>
                <Mono style={{ color: "rgba(13,33,23,0.45)", marginLeft: 10 }}>/ {t.per}</Mono>
              </div>
              <ul className="price-feats">
                {t.features.map((f, j) =>
              <li key={j}><span className="tick">✓</span>{f}</li>
              )}
              </ul>
              <button className={t.featured ? "price-cta is-gold" : "price-cta"}>
                {t.cta} <span style={{ marginLeft: 8 }}>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// ============ HOME BLOG PROMO ============
function HomeBlogPromo({ setActive }) {
  return (
    <section className="blog-teaser" data-screen-label="06 Blog teaser">
      <div className="container">
        <div className="blog-teaser-head">
          <div>
            <SectionMark index="04" label="READ NEXT" kicker="GUIDES · LESSONS" />
            <h2>Come read the notes <em>behind the license.</em></h2>
          </div>
          <div className="blog-teaser-copy">
            <p>Short guides for the decisions learners actually get stuck on: which school to choose, what the theory test expects, what the license costs, and which Abu Dhabi rules matter most.</p>
            <GoldBtn onClick={() => setActive("blog")}>Open the blog</GoldBtn>
          </div>
        </div>
        <div className="blog-teaser-grid">
          {BLOG_POSTS.map((post) =>
          <button key={post.id} className="blog-teaser-card" onClick={() => setActive("blog")}>
              <span className="blog-teaser-num">{post.n}</span>
              <img src={post.image} alt="" loading="lazy" />
              <Mono style={{ color: "var(--gold)" }}>{post.category} · {post.read}</Mono>
              <h3>{post.title}</h3>
              <span className="blog-teaser-read">Read article →</span>
            </button>
          )}
        </div>
      </div>
    </section>);

}

// ============ PROCESS PAGE ============
function ProcessPage({ openBlogPost }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="process-page" data-screen-label="06 Process page">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <SectionMark index="II" label="THE PROCESS" kicker="FREE · NO LOGIN" />
        </div>
        <h1 className="page-h1">The ten stages, <br /><em style={{ fontFamily: "Caveat" }}>in the order you actually do them.</em></h1>
        <p className="page-sub">If you have already started, jump to your stage. Each card shows what to do, where, how much, how long, and the most common mistake.</p>

        <div className="process-layout">
          <aside className="process-side">
            <Mono style={{ color: "rgba(247,245,240,0.5)", marginBottom: 12, display: "block" }}>STAGES · 10</Mono>
            <div className="process-rail">
              {PROCESS_STAGES.map((s, i) =>
              <button key={i} onClick={() => setOpen(i)} className={`rail-item ${i === open ? "is-active" : ""}`}>
                  <span className="rail-num">{s.n}</span>
                  <span className="rail-name">{s.name}</span>
                  <span className="rail-tick" />
                </button>
              )}
            </div>
          </aside>
          <div className="process-main">
            {PROCESS_STAGES.map((s, i) =>
            <article key={i} className={`process-card ${i === open ? "is-open" : ""}`}>
                <header className="pc-head">
                  <div>
                    <Mono style={{ color: "var(--gold)" }}>STAGE {s.n} OF 10</Mono>
                    <h3 className="pc-title">{s.name}</h3>
                  </div>
                  <button className="pc-toggle" onClick={() => setOpen(i === open ? -1 : i)}>
                    {i === open ? "—" : "+"}
                  </button>
                </header>
                {i === open &&
              <div className="pc-body">
                    <div className="pc-grid">
                      <div className="pc-cell"><Mono style={{ color: "rgba(247,245,240,0.5)" }}>WHERE</Mono><div>{s.where}</div></div>
                      <div className="pc-cell"><Mono style={{ color: "rgba(247,245,240,0.5)" }}>COST</Mono><div>{s.cost}</div></div>
                      <div className="pc-cell"><Mono style={{ color: "rgba(247,245,240,0.5)" }}>TIME</Mono><div>{s.time}</div></div>
                    </div>
                    <div className="mistake-box">
                      <Mono style={{ color: "var(--gold)", marginBottom: 8, display: "block" }}>⚠ COMMON MISTAKE</Mono>
                      <p>{s.mistake}</p>
                    </div>
                    {s.blogPostId &&
                    <button className="pc-blog-link" onClick={() => openBlogPost(s.blogPostId)}>
                        How do I open my traffic file? See the explanation <span>→</span>
                      </button>
                    }
                  </div>
              }
              </article>
            )}
          </div>
        </div>
      </div>
    </section>);

}

// ============ CHEAT SHEETS PAGE ============
function CheatSheetsPage() {
  const [tab, setTab] = useState("signs");
  const [filter, setFilter] = useState("all");
  const [showThanks, setShowThanks] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = "DirectDrive-CheatSheets.pdf";
    a.download = "DirectDrive-CheatSheets.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowThanks(true);
  };
  const filtered = filter === "all" ? CHEAT_SIGNS : CHEAT_SIGNS.filter((s) => s.type === filter);
  const countByType = CHEAT_SIGNS.reduce((acc, sign) => {
    acc[sign.type] = (acc[sign.type] || 0) + 1;
    return acc;
  }, { all: CHEAT_SIGNS.length });
  const signFilters = [
    { id: "all", label: "All signs" },
    { id: "mandatory", label: "Mandatory" },
    { id: "warning", label: "Warning" },
    { id: "informative", label: "Informative" }
  ];
  return (
    <section className="cheat-page" data-screen-label="07 Cheat sheets">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <SectionMark index="III" label="CHEAT SHEETS" kicker="PRINT-READY" theme="light" />
        </div>
        <h1 className="page-h1 dark">Road signs and rules, <br /><em>clean enough to cram.</em></h1>
        <p className="page-sub dark">A sharper cheat sheet built from the attached driving handbook, with official sign images, police hand signals, high-frequency rules, and the numbers candidates keep mixing up.</p>

        <div className="cheat-brief">
          <div>
            <Mono style={{ color: "var(--gold)", display: "block", marginBottom: 12 }}>Driving.pdf reference set</Mono>
            <p>Traffic signs are grouped from the handbook appendix, and police hand meanings are pulled from the traffic-authority signal page. The rules section keeps the key values visible without forcing you through a full mock exam.</p>
          </div>
          <div className="cheat-stat-grid">
            <div className="cheat-stat"><strong>{CHEAT_SIGNS.length}</strong><span>visual sign cards</span></div>
            <div className="cheat-stat"><strong>{POLICE_SIGNALS.length}</strong><span>police signals</span></div>
            <div className="cheat-stat"><strong>{RULE_CHEATS.length}</strong><span>rule reminders</span></div>
          </div>
        </div>

        <div className="cheat-tabs">
          <button onClick={() => setTab("signs")} className={`cheat-tab ${tab === "signs" ? "is-active" : ""}`}>Traffic Signs <span>{CHEAT_SIGNS.length}</span></button>
          <button onClick={() => setTab("rules")} className={`cheat-tab ${tab === "rules" ? "is-active" : ""}`}>Road Rules <span>{RULE_CHEATS.length}</span></button>
          <button onClick={() => setTab("police")} className={`cheat-tab ${tab === "police" ? "is-active" : ""}`}>Police Signals <span>{POLICE_SIGNALS.length}</span></button>
          <div style={{ flex: 1 }} />
          <button className="download-btn" onClick={handleDownload}><span>↓</span> Download PDF</button>
        </div>

        {tab === "signs" &&
        <>
            <div className="filter-row">
              {signFilters.map((f) =>
            <button key={f.id} className={`filter-chip ${filter === f.id ? "is-active" : ""}`} onClick={() => setFilter(f.id)}>
                  {f.label}<span>{countByType[f.id] || 0}</span>
                </button>
            )}
            </div>
            <div className="signs-grid">
              {filtered.map((s, i) =>
            <div key={s.id || i} className="sign-card">
                  <div className="sign-media">
                    {s.image ?
                <img src={s.image} alt={s.label} loading="lazy" /> :
                s.svgIllustrationKey ?
                <RoadSignSvg kind={s.svgIllustrationKey} /> :
                <SignGlyph type={s.type} />}
                  </div>
                  <div className="sign-meta">
                    <Mono style={{ color: "rgba(13,33,23,0.5)" }}>{s.type}</Mono>
                    <h4>{s.label}</h4>
                    {s.desc && <p>{s.desc}</p>}
                    {s.source && <span className="sign-source">{s.source}</span>}
                  </div>
                </div>
            )}
            </div>
          </>
        }

        {tab === "rules" &&
        <div className="rules-grid">
            {RULE_CHEATS.map((r, i) =>
          <div key={i} className="rule-row">
                <Mono style={{ color: "var(--gold)" }}>{r.group}</Mono>
                <div className="rule-k">{r.k}</div>
                <div className="rule-v">{r.v}</div>
                <p>{r.note}</p>
              </div>
          )}
          </div>
        }

        {tab === "police" &&
        <div className="police-grid">
            {POLICE_SIGNALS.map((signal, i) =>
          <div key={i} className="police-card">
                <div className="police-media">
                  <img src={signal.image} alt={signal.label} loading="lazy" />
                </div>
                <div className="police-copy">
                  <Mono style={{ color: "var(--gold)" }}>Traffic authority signal</Mono>
                  <h4>{signal.label}</h4>
                  <p>{signal.desc}</p>
                  <span className="sign-source">{signal.source}</span>
                </div>
              </div>
          )}
          </div>
        }
      </div>
      {showThanks && <ThanksDownloadModal onClose={() => setShowThanks(false)} />}
    </section>);

}

function ThanksDownloadModal({ onClose }) {
  const tiers = [
    { name: "Practice — 7 Days",  price: "AED 15", per: "one-time", features: ["All 1,262 questions", "3 timed mock exams", "Wrong-answer reviews"], cta: "Get 7 days", featured: false },
    { name: "Practice — Lifetime", price: "AED 55", per: "one-time", features: ["Unlimited mock exams", "Score tracker & graphs", "Category breakdown reports"], cta: "Get lifetime", featured: true }
  ];
  return (
    <div className="modal-shade" onClick={onClose}>
      <div className="thanks-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x thanks-x" onClick={onClose} aria-label="Close">×</button>

        <div className="thanks-head">
          <div className="thanks-check" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 12 10 18 20 6" />
            </svg>
          </div>
          <Mono style={{ color: "var(--gold)" }}>DOWNLOAD STARTED</Mono>
          <h3 className="thanks-title">Thank you for trusting in <span style={{ color: "var(--gold)" }}>Direct Drive.</span></h3>
          <p className="thanks-sub">Your free PDF is downloading. If it ever fails to make the test even simpler, consider one of the paid options below.</p>
        </div>

        <div className="thanks-divider"><span>UNLOCK MORE · OPTIONAL</span></div>

        <div className="thanks-tiers">
          {tiers.map((t) => (
            <div key={t.name} className={`thanks-tier ${t.featured ? "is-featured" : ""}`}>
              {t.featured && <div className="thanks-tier-tag"><Mono>RECOMMENDED</Mono></div>}
              <Mono style={{ color: t.featured ? "var(--gold)" : "rgba(247,245,240,0.55)" }}>{t.name}</Mono>
              <div className="thanks-price">
                <span>{t.price}</span>
                <Mono style={{ color: "rgba(247,245,240,0.45)", marginLeft: 8 }}>/ {t.per}</Mono>
              </div>
              <ul className="thanks-feats">
                {t.features.map((f) => <li key={f}><span className="tick">✓</span>{f}</li>)}
              </ul>
              <button className={`thanks-cta ${t.featured ? "is-gold" : ""}`}>{t.cta} →</button>
            </div>
          ))}
        </div>

        <button className="thanks-skip" onClick={onClose}>No thanks — keep my free PDF</button>
      </div>
    </div>
  );
}

function SignGlyph({ type }) {
  const colorMap = {
    mandatory: { bg: "#B23B3B", fg: "#fff" },
    warning: { bg: "#E8B73A", fg: "#0D2117" },
    informative: { bg: "#2C4A6E", fg: "#fff" }
  };
  const c = colorMap[type];
  return (
    <div className="sign-glyph">
      {type === "warning" ?
      <div style={{ width: 0, height: 0, borderLeft: "44px solid transparent", borderRight: "44px solid transparent", borderBottom: `76px solid ${c.bg}`, position: "relative" }}>
          <span style={{ position: "absolute", top: 32, left: -10, color: c.fg, fontWeight: 800, fontSize: 22 }}>!</span>
        </div> :

      <div style={{ width: 76, height: 76, borderRadius: type === "informative" ? 6 : "50%", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>
          {type === "mandatory" ? "STOP" : "i"}
        </div>
      }
    </div>);

}

// ============ PRACTICE PAGE ============
function PracticePage() {
  const totalQ = PRACTICE_MODULES.reduce((a, m) => a + m.count, 0);
  const totalModules = PRACTICE_MODULES.length;
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeModuleSlug, setActiveModuleSlug] = useState(null);
  const [activeMockExamId, setActiveMockExamId] = useState(null);
  const [showMockPicker, setShowMockPicker] = useState(false);
  const [mockResults, setMockResults] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("directDriveMockResults") || "{}");
    } catch {
      return {};
    }
  });
  const seenByModule = PRACTICE_MODULES.map(() => 0);
  const seenTotal = seenByModule.reduce((a, b) => a + b, 0);
  const modulesDone = 0;
  const totalXP = 0;
  const completedResults = Object.values(mockResults || {});
  const quizzesDone = completedResults.length;
  const bestScore = completedResults.length ? Math.max(...completedResults.map((result) => result.percent || 0)) : 0;
  const overallPct = Math.round((modulesDone / totalModules) * 100);
  const activeModule = PRACTICE_MODULES.find((m) => m.slug === activeModuleSlug);
  const activeQuestions = activeModuleSlug ? QUESTIONS_BY_MODULE[activeModuleSlug] || [] : [];
  const activeMockExam = MOCK_EXAMS.find((exam) => exam.id === activeMockExamId);

  const saveMockResult = (exam, result) => {
    setMockResults((prev) => {
      const next = { ...prev, [exam.id]: { ...result, title: exam.title, takenAt: new Date().toISOString() } };
      try {
        window.localStorage.setItem("directDriveMockResults", JSON.stringify(next));
      } catch {
        // Ignore private browsing storage failures.
      }
      return next;
    });
  };

  if (activeModuleSlug && activeModule) {
    return (
      <ModulePractice
        module={activeModule}
        questions={activeQuestions}
        onBack={() => setActiveModuleSlug(null)}
      />
    );
  }

  if (activeMockExam) {
    return (
      <MockExamRunner
        exam={activeMockExam}
        onBack={() => {
          setActiveMockExamId(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onFinish={(result) => saveMockResult(activeMockExam, result)}
      />
    );
  }

  if (showMockPicker) {
    return (
      <MockExamPicker
        exams={MOCK_EXAMS}
        mockResults={mockResults}
        bestScore={bestScore}
        quizzesDone={quizzesDone}
        onBack={() => {
          setShowMockPicker(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onSelect={(examId) => {
          playExamClick("submit");
          setActiveMockExamId(examId);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return (
    <section className="practice-page" data-screen-label="08 Practice tests">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <SectionMark index="IV" label="PRACTICE" kicker="MIRRORS THE RTA EXAM" />
        </div>
        <h1 className="page-h1">Seven modules. <br /><em>{totalQ.toLocaleString()} questions. One pass.</em></h1>
        <p className="page-sub">The full Road Ready UAE light-vehicle bank, broken into seven focused modules. Earn XP per module, track what you've seen, then take a timed mock exam under real conditions.</p>

        <div className="pt-shell">
          {/* LEFT: vehicle banner + module timeline */}
          <div className="pt-main">
            <div className="pt-vehicle">
              <div className="pt-veh-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5" />
                  <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2H7a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4z" />
                  <circle cx="7.5" cy="16.5" r="1.2" />
                  <circle cx="16.5" cy="16.5" r="1.2" />
                </svg>
              </div>
              <div className="pt-veh-title">LIGHT VEHICLE</div>
              <span className="pt-veh-sep" aria-hidden>·</span>
              <div className="pt-veh-sub">{totalModules} modules · {totalQ.toLocaleString()} questions</div>
              <div style={{ marginLeft: "auto" }}>
                <Mono style={{ color: "rgba(247,245,240,0.28)" }}>UAE THEORY BANK</Mono>
              </div>
            </div>

            <div className="pt-timeline">
              {PRACTICE_MODULES.map((m, i) => {
                const seen = seenByModule[i];
                const pct = m.count ? Math.round((seen / m.count) * 100) : 0;
                const isActive = i === activeIdx;
                return (
                  <div key={m.n} className="pt-row" onClick={() => setActiveIdx(i)}>
                    <div className={`pt-num ${isActive ? "is-active" : ""}`}>{m.n}</div>
                    <div className={`pt-card ${isActive ? "is-active" : ""}`}>
                      <div className="pt-card-head">
                        <div>
                          <div className={`pt-tag ${isActive ? "is-up" : ""}`}>
                            {isActive ? "UP NEXT" : `MODULE ${m.n}`}
                          </div>
                          <h3 className="pt-title">{m.name.toUpperCase()}</h3>
                          <p className="pt-desc">{m.desc}</p>
                        </div>
                        {isActive ? (
                          <button type="button" className="pt-start" onClick={() => setActiveModuleSlug(m.slug)}>
                            <span>START MODULE</span>
                            <span className="pt-start-tri">▶</span>
                          </button>
                        ) : (
                          <div className="pt-xp" aria-label={`${m.xp} XP available`}>
                            <span className="pt-xp-icon" aria-hidden>★</span>
                            <span>+{m.xp} XP</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-progress-row">
                        <Mono style={{ color: "rgba(247,245,240,0.55)" }}>
                          {isActive ? `PROGRESS: ${pct}%` : "START"}
                        </Mono>
                        <Mono style={{ color: "rgba(247,245,240,0.55)" }}>
                          {seen}/{m.count} SEEN
                        </Mono>
                      </div>
                      <div className="pt-bar"><div className="pt-bar-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: progress overview + mock exams */}
          <aside className="pt-side">
            <div className="pt-overview">
              <Mono style={{ color: "rgba(247,245,240,0.65)" }}>PROGRESS OVERVIEW</Mono>
              <div className="pt-overview-top">
                <div className="pt-ring" style={{ "--pct": overallPct }}>
                  <div className="pt-ring-inner">
                    <div className="pt-ring-pct">{overallPct}%</div>
                    <div className="pt-ring-sub">{modulesDone} / {totalModules} MODULES</div>
                  </div>
                </div>
                <div className="pt-badges">
                  <div className="pt-badge">
                    <span className="pt-badge-icon pt-badge-icon--gold" aria-hidden>★</span>
                    <div>
                      <div className="pt-badge-n">{totalXP} XP</div>
                      <Mono style={{ color: "rgba(247,245,240,0.55)" }}>VEHICLE XP</Mono>
                    </div>
                  </div>
                  <div className="pt-badge">
                    <span className="pt-badge-icon pt-badge-icon--blue" aria-hidden>?</span>
                    <div>
                      <div className="pt-badge-n">{quizzesDone}</div>
                      <Mono style={{ color: "rgba(247,245,240,0.55)" }}>QUIZZES DONE</Mono>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-questions">
                <div className="pt-questions-head">
                  <Mono style={{ color: "rgba(247,245,240,0.65)" }}>QUESTIONS SEEN</Mono>
                  <Mono style={{ color: "var(--gold)" }}>{seenTotal} / {totalQ}</Mono>
                </div>
                <div className="pt-bar"><div className="pt-bar-fill pt-bar-fill--blue" style={{ width: `${(seenTotal / totalQ) * 100}%` }} /></div>
              </div>
            </div>

            <div className="pt-mock">
              <div className="pt-mock-head">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--gold)", flexShrink: 0 }}>
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
                <span className="pt-mock-title">MOCK EXAMS</span>
              </div>
              <div className="pt-mock-meta">8 tests · 45 questions · 30 minutes each</div>
              <div className="pt-mock-score">
                <div className="pt-mock-score-head">
                  <Mono style={{ color: "rgba(247,245,240,0.45)" }}>BEST SCORE</Mono>
                  <Mono style={{ color: "var(--cream)" }}>{bestScore}%</Mono>
                </div>
                <div className="pt-mock-bar"><div className="pt-mock-bar-fill" style={{ width: `${bestScore}%` }} /></div>
                <Mono style={{ color: "rgba(247,245,240,0.35)", marginTop: 10, display: "block" }}>
                  45 QUESTIONS · 30 MIN · 80% TO PASS
                </Mono>
              </div>
              <div className="pt-mock-launch">
                <div>
                  <strong>Real-time conditions</strong>
                  <span>Start a 30-minute run, flag questions, and submit when ready.</span>
                </div>
                <button type="button" className="pt-mock-btn" onClick={() => { playExamClick("submit"); setShowMockPicker(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  START MOCK TEST →
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>);

}

function MockExamPicker({ exams, mockResults, bestScore, quizzesDone, onBack, onSelect }) {
  return (
    <section className="practice-page mock-picker-page" data-screen-label="10 Mock exam picker">
      <div className="container">
        <div className="mock-picker-top">
          <button className="exam-nav" onClick={onBack}>← Back to practice</button>
          <div>
            <Mono style={{ color: "var(--gold)" }}>REAL-TIME CONDITIONS</Mono>
            <h1 className="mock-picker-title">Choose a mock test.</h1>
          </div>
          <div className="mock-picker-stats">
            <div>
              <Mono style={{ color: "rgba(247,245,240,0.45)" }}>BEST</Mono>
              <strong>{bestScore}%</strong>
            </div>
            <div>
              <Mono style={{ color: "rgba(247,245,240,0.45)" }}>DONE</Mono>
              <strong>{quizzesDone}</strong>
            </div>
          </div>
        </div>

        <div className="mock-picker-brief">
          <div>
            <span>45 questions</span>
            <strong>30 minutes</strong>
          </div>
          <div>
            <span>Pass mark</span>
            <strong>36 / 45</strong>
          </div>
          <div>
            <span>Threshold</span>
            <strong>80%</strong>
          </div>
        </div>

        <div className="mock-picker-grid">
          {exams.map((exam) => {
            const result = mockResults[exam.id];
            return (
              <button key={exam.id} type="button" className="mock-picker-card" onClick={() => onSelect(exam.id)}>
                <span className="mock-picker-n">{exam.number}</span>
                <span className="mock-picker-copy">
                  <strong>{exam.title}</strong>
                  <small>{exam.focus}</small>
                  <em>{exam.questionCount} Qs · {exam.durationMinutes} min · +{exam.xp} XP</em>
                </span>
                <span className={`pt-mock-status ${result ? result.passed ? "is-pass" : "is-fail" : ""}`}>
                  {result ? `${result.percent}%` : exam.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MockExamRunner({ exam, onBack, onFinish }) {
  const questions = useMemo(() => exam.questionIds.map((id) => ROADREADY_QUESTION_BY_ID[id]).filter(Boolean), [exam]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((exam.durationMinutes || 30) * 60);
  const finishSentRef = useRef(false);
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const remainingCount = Math.max(0, questions.length - answeredCount);
  const passScore = exam.passScore || Math.ceil(questions.length * 0.8);
  const score = questions.reduce((total, item) => total + (answers[item.id] === item.correctIndex ? 1 : 0), 0);
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const passed = score >= passScore;
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (submitted) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setSubmitted(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (!submitted || finishSentRef.current) return;
    finishSentRef.current = true;
    onFinish({
      score,
      percent,
      passed,
      answeredCount,
      flaggedCount,
      total: questions.length,
    });
  }, [submitted, score, percent, passed, answeredCount, flaggedCount, questions.length, onFinish]);

  const choose = (choiceIndex) => {
    if (submitted || !question) return;
    playExamClick("tap");
    setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }));
  };

  const goToQuestion = (nextIndex) => {
    playExamClick("tap");
    setIndex(Math.min(Math.max(nextIndex, 0), questions.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFlag = () => {
    if (!question) return;
    playExamClick("flag");
    setFlagged((prev) => ({ ...prev, [question.id]: !prev[question.id] }));
  };

  const submitExam = () => {
    playExamClick("submit");
    setSubmitted(true);
  };

  if (!question) {
    return (
      <section className="mock-exam-page">
        <div className="container">
          <button className="exam-nav" onClick={onBack}>Back to mock exams</button>
          <p className="page-sub">This mock exam has no questions available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mock-exam-page" data-screen-label="10 Mock exam runner">
      <div className="mock-topline">
        <div className="mock-counter">Q{index + 1}/{questions.length}</div>
        <div className="mock-top-progress"><div style={{ width: `${progress}%` }} /></div>
        <div className={`mock-clock ${timeLeft < 180 && !submitted ? "is-low" : ""}`}>TIME {formatExamTime(timeLeft)}</div>
      </div>

      <div className="container mock-container">
        <div className="mock-stage">
          <div className="mock-card">
            <div className="mock-card-accent" />
            <div className="mock-card-head">
              <span className="mock-chip">Q{index + 1} · {question.module.replaceAll("_", " ")}</span>
              <button type="button" className={`mock-flag ${flagged[question.id] ? "is-flagged" : ""}`} onClick={toggleFlag}>
                <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 22V4" />
                  <path d="M5 4h12l-2 5 2 5H5" />
                </svg>
                {flagged[question.id] ? "FLAGGED" : "FLAG FOR REVIEW"}
              </button>
            </div>

            <div className={`mock-question-layout ${question.image || question.svgIllustrationKey ? "" : "no-visual"}`}>
              <QuestionVisual question={question} />
              <div>
                <h1 className="mock-question">{question.question}</h1>
                <div className="mock-options">
                  {question.options.map((option, optionIndex) => {
                    const picked = answers[question.id] === optionIndex;
                    const correct = optionIndex === question.correctIndex;
                    let cls = "mock-option";
                    if (submitted) {
                      if (correct) cls += " is-correct";
                      else if (picked) cls += " is-wrong";
                    } else if (picked) cls += " is-picked";
                    return (
                      <button key={`${question.id}-${optionIndex}`} type="button" className={cls} onClick={() => choose(optionIndex)}>
                        <span className="mock-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        <span className="mock-option-text">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className={`mock-review ${answers[question.id] === question.correctIndex ? "" : "is-wrong"}`}>
                    <Mono style={{ color: answers[question.id] === question.correctIndex ? "var(--gold)" : "#f5a3a3" }}>
                      {answers[question.id] === question.correctIndex ? "CORRECT" : "REVIEW"}
                    </Mono>
                    <p>Correct answer: {String.fromCharCode(65 + question.correctIndex)}. {question.options[question.correctIndex]}</p>
                    {question.explanation && <p>{question.explanation}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mock-actions">
            <button className="mock-nav-btn" onClick={() => goToQuestion(index - 1)} disabled={index === 0}>← Previous</button>
            <button className="mock-nav-btn is-primary" onClick={() => goToQuestion(index + 1)} disabled={index === questions.length - 1}>Next →</button>
          </div>
        </div>

        <aside className="mock-sidebar">
          <div className="mock-side-card">
            <div className="mock-side-title">Questions</div>
            <Mono style={{ color: "rgba(247,245,240,0.45)" }}>EXAM PROGRESS</Mono>
            <div className="mock-grid" aria-label="Question navigation">
              {questions.map((item, itemIndex) => {
                const isAnswered = answers[item.id] != null;
                const isFlagged = flagged[item.id];
                const isCurrent = itemIndex === index;
                const isWrong = submitted && isAnswered && answers[item.id] !== item.correctIndex;
                const isCorrect = submitted && isAnswered && answers[item.id] === item.correctIndex;
                let cls = "mock-grid-btn";
                if (isCurrent) cls += " is-current";
                if (isAnswered) cls += " is-answered";
                if (isFlagged) cls += " is-flagged";
                if (isCorrect) cls += " is-correct";
                if (isWrong) cls += " is-wrong";
                return (
                  <button key={item.id} type="button" className={cls} onClick={() => goToQuestion(itemIndex)}>
                    {itemIndex + 1}
                  </button>
                );
              })}
            </div>

            <div className="mock-legend">
              <div><span className="legend-square is-answered" />{answeredCount} answered</div>
              <div><span className="legend-square is-flagged" />{flaggedCount} flagged</div>
              <div><span className="legend-square" />{remainingCount} remaining</div>
            </div>

            {submitted ? (
              <div className={`mock-result ${passed ? "is-pass" : "is-fail"}`}>
                <Mono style={{ color: passed ? "#79c88d" : "#f5a3a3" }}>{passed ? "PASS" : "KEEP PRACTICING"}</Mono>
                <strong>{score}/{questions.length}</strong>
                <span>{percent}% · pass mark is {passScore}/{questions.length}</span>
                <button type="button" className="mock-submit" onClick={onBack}>Back to exams</button>
              </div>
            ) : (
              <button type="button" className="mock-submit" onClick={submitExam}>Submit exam</button>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ModulePractice({ module, questions, onBack }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answered, setAnswered] = useState({});
  const question = questions[index];
  const currentResult = answered[question?.id];
  const isAnswered = currentResult != null;
  const score = Object.values(answered).filter((result) => result.correct).length;
  const progress = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;

  const choose = (choiceIndex) => {
    if (isAnswered || !question) return;
    setPicked(choiceIndex);
  };

  const check = () => {
    if (picked == null || !question) return;
    setAnswered((prev) => ({ ...prev, [question.id]: { picked, correct: picked === question.correctIndex } }));
  };

  const next = () => {
    setPicked(null);
    setIndex((value) => Math.min(value + 1, questions.length - 1));
  };

  const previous = () => {
    setPicked(null);
    setIndex((value) => Math.max(value - 1, 0));
  };

  if (!question) {
    return (
      <section className="practice-page">
        <div className="container">
          <button className="exam-nav" onClick={onBack}>← Back to modules</button>
          <p className="page-sub">No questions found for this module.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="practice-page module-practice-page" data-screen-label="09 Module practice">
      <div className="container">
        <div className="module-practice-top">
          <button className="exam-nav" onClick={onBack}>← Back</button>
          <div style={{ textAlign: "center" }}>
            <Mono style={{ color: "var(--gold)" }}>MODULE {module.n}</Mono>
            <h1 className="module-practice-title">{module.name}</h1>
          </div>
          <div className="module-score">
            <Mono style={{ color: "rgba(247,245,240,0.45)" }}>SCORE</Mono>
            <div>{score} / {Object.keys(answered).length || "—"}</div>
          </div>
        </div>

        <div className="practice-progress-strip">
          <div className="practice-progress-strip-fill" style={{ width: `${progress}%` }} />
          <span className="practice-progress-label">{index + 1} / {questions.length}</span>
        </div>

        <div className="module-question-shell">
          <QuestionVisual question={question} />
          <div className="module-question-card">
            <div className="module-question-meta">
              {question.isEdcadStyle && <span>EDCAD</span>}
              {question.source === "rta" && <span>RTA</span>}
              <span>{question.module.replaceAll("_", " ")}</span>
            </div>
            <h2>{question.question}</h2>
            <div className="exam-options">
              {question.options.map((option, optionIndex) => {
                const correct = optionIndex === question.correctIndex;
                const chosen = (isAnswered ? currentResult.picked : picked) === optionIndex;
                let cls = "exam-opt";
                if (isAnswered) {
                  if (correct) cls += " is-correct";
                  else if (chosen) cls += " is-wrong";
                } else if (chosen) cls += " is-picked";
                return (
                  <button key={`${question.id}-${optionIndex}`} className={cls} onClick={() => choose(optionIndex)}>
                    <span className="exam-opt-letter">{String.fromCharCode(65 + optionIndex)}</span>
                    <span className="exam-opt-text">{option}</span>
                    {isAnswered && correct && <span className="answer-pill is-correct">✓ CORRECT</span>}
                    {isAnswered && chosen && !correct && <span className="answer-pill is-wrong">YOUR PICK</span>}
                  </button>
                );
              })}
            </div>
            {isAnswered &&
              <div className={`feedback-panel ${currentResult.correct ? "" : "is-wrong"}`}>
                <Mono style={{ color: currentResult.correct ? "var(--gold)" : "#f5a3a3" }}>
                  {currentResult.correct ? "✓ CORRECT" : "✗ INCORRECT"}
                </Mono>
                <p>{currentResult.correct ? "Locked in. Move to the next one." : `Correct answer — ${String.fromCharCode(65 + question.correctIndex)}: ${question.options[question.correctIndex]}`}</p>
                {question.explanation && <>
                  <hr />
                  <Mono style={{ color: "rgba(247,245,240,0.42)" }}>EXPLANATION</Mono>
                  <p>{question.explanation}</p>
                </>}
              </div>
            }
          </div>
        </div>

        <div className="module-practice-actions">
          <button className="exam-nav" onClick={previous} disabled={index === 0}>Previous</button>
          {!isAnswered
            ? <button className="exam-nav is-gold" onClick={check} disabled={picked == null}>Check answer</button>
            : <button className="exam-nav is-gold" onClick={next} disabled={index === questions.length - 1}>Next question</button>
          }
        </div>
      </div>
    </section>
  );
}

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

function ScoreTracker() {
  const sessions = [62, 71, 68, 78, 82, 79, 88, 91, 89, 94];
  const cats = [
  { name: "Traffic signs", score: 92 },
  { name: "Road rules", score: 86 },
  { name: "Road behavior", score: 78 },
  { name: "Parking", score: 71 },
  { name: "Emergencies", score: 84 }];

  const w = 720,h = 220,pad = 24;
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
    </div>);

}

// ============ BLOG ============
function BlogPage({ initialPostId = null }) {
  const [activePost, setActivePost] = useState(initialPostId);
  const post = BLOG_POSTS.find((item) => item.id === activePost);

  useEffect(() => {
    setActivePost(initialPostId);
  }, [initialPostId]);

  if (post) return <BlogArticle post={post} onBack={() => setActivePost(null)} />;

  return (
    <section className="blog-page" data-screen-label="09 Blog page">
      <div className="container">
        <div style={{ marginBottom: 28 }}>
          <SectionMark index="V" label="BLOG" kicker="LONG-FORM GUIDES" theme="light" />
        </div>
        <div className="blog-head">
          <h1 className="blog-title">Abu Dhabi driving guides, <em>built for learners.</em></h1>
          <p className="page-sub dark">In-depth articles on the theory test, costs, rules, and choosing a school. Written for people about to book their first lesson.</p>
        </div>

        <div className="blog-filter-row" aria-label="Blog categories">
          <button className="blog-filter is-active">All <strong>{BLOG_POSTS.length}</strong></button>
          <button className="blog-filter">Guide/Tips <strong>{BLOG_POSTS.filter((item) => item.category === "Guide/Tips").length}</strong></button>
          <button className="blog-filter">Lesson <strong>{BLOG_POSTS.filter((item) => item.category === "Lesson").length}</strong></button>
        </div>

        <div className="blog-list">
          {BLOG_POSTS.map((item) =>
          <article
            key={item.id}
            className="blog-row"
            role="button"
            tabIndex={0}
            onClick={() => setActivePost(item.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActivePost(item.id);
              }
            }}>
              <div className="blog-row-num">{item.n}</div>
              <div className="blog-row-thumb">
                <img src={item.image} alt="" loading="lazy" />
              </div>
              <div className="blog-row-body">
                <div className="blog-row-meta">
                  <Mono style={{ color: "var(--gold)" }}>{item.category}</Mono>
                  <span className="blog-row-dot" aria-hidden>·</span>
                  <Mono style={{ color: "rgba(13,33,23,0.5)" }}>{item.read}</Mono>
                </div>
                <h2 className="blog-row-title">{item.title}</h2>
                <p className="blog-row-excerpt">{item.excerpt}</p>
              </div>
              <div className="blog-row-action">
                <span className="blog-row-arrow" aria-hidden>→</span>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

function BlogArticle({ post, onBack }) {
  const hasContent = Array.isArray(post.content) && post.content.length > 0;
  const highlightTracker = {};
  return (
    <section className="blog-page blog-article-page" data-screen-label="10 Blog article">
      <div className="container">
        <button className="blog-back" onClick={onBack}>← All blog posts</button>
        <article className="blog-article">
          <div className="blog-article-meta">
            <Mono>{post.category}</Mono>
            <Mono>{post.read}</Mono>
          </div>
          <div className="blog-article-head">
            <div>
              <h1 className="blog-article-title">{post.title}</h1>
              <p className="blog-article-intro">
                <ArticleText text={post.intro || "Draft article infrastructure. This page is intentionally light for now, with the content sections ready to fill."} tracker={highlightTracker} />
              </p>
              {post.callouts &&
              <div className="blog-callouts">
                  {post.callouts.map((item) =>
                <div key={item.label} className="blog-callout">
                      <Mono>{item.label}</Mono>
                      <strong>{item.value}</strong>
                    </div>
                )}
                </div>
              }
              {post.apps &&
              <div className="blog-app-strip" aria-label="Apps used in this guide">
                  {post.apps.map((app) =>
                <div key={app.name} className="blog-app-pill">
                      <img src={app.image} alt="" />
                      <span>
                        <strong>{app.name}</strong>
                        <small>{app.text}</small>
                      </span>
                    </div>
                )}
                </div>
              }
            </div>
            <div className={`blog-article-image ${post.articleImage && post.articleImage.includes("open-traffic-file") ? "is-screenshot" : ""}`}>
              <img src={post.articleImage || post.image} alt={post.articleImage && post.articleImage.includes("open-traffic-file") ? "TAMM Open Traffic File service card" : ""} />
            </div>
          </div>
          <div className="blog-article-layout">
            <aside className="blog-outline">
              <Mono>ARTICLE OUTLINE</Mono>
              <ol>
                {post.sections.map((section) =>
                <li key={section}>
                    <a href={`#${sectionSlug(section)}`}>{section}</a>
                  </li>
                )}
              </ol>
            </aside>
            <div className="blog-body-shell">
              {hasContent ? post.content.map((section, i) =>
              <section key={section.title} id={sectionSlug(section.title)} className="blog-draft-section blog-content-section">
                  <Mono>{String(i + 1).padStart(2, "0")}</Mono>
                  <h2>{section.title}</h2>
                  <p><ArticleText text={section.body} tracker={highlightTracker} /></p>
                  {(() => {
                    const visuals = section.visuals || (section.visual ? [section.visual] : []);
                    return visuals.length ?
                    <div className={`blog-visual-grid ${visuals.length > 1 ? "is-multi" : ""}`}>
                        {visuals.map((visual) =>
                      <figure key={visual.title} className={`blog-inline-visual ${
                            visual.wide || visual.image.includes("open-traffic-file") ? "is-screenshot" :
                            visual.image.includes("edc-handbook-rules") ? "is-handbook" :
                            visual.image.includes("rules-") ? "is-diagram" : ""
                          }`}>
                            <img src={visual.image} alt="" loading="lazy" />
                            <figcaption>
                              <strong>{visual.title}</strong>
                              <span>{visual.text}</span>
                            </figcaption>
                          </figure>
                    )}
                      </div> :
                    null;
                  })()}
                  {i === 0 && post.notes &&
                <aside className="blog-note-box">
                      <Mono>IMPORTANT NOTE</Mono>
                      <ul>
                        {post.notes.map((note) => <li key={note}><ArticleText text={note} tracker={highlightTracker} /></li>)}
                      </ul>
                    </aside>
                }
                  {i === post.content.length - 1 && post.steps &&
                <ol className="blog-steps">
                      {post.steps.map((step) =>
                  <li key={step}>
                          <span className="blog-step-text"><ArticleText text={step} tracker={highlightTracker} /></span>
                        </li>
                  )}
                    </ol>
                }
                </section>
              ) : post.sections.map((section, i) =>
              <section key={section} className="blog-draft-section">
                  <Mono>{String(i + 1).padStart(2, "0")}</Mono>
                  <h2>{section}</h2>
                  <p>Draft space reserved for this section.</p>
                </section>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>);

}

// ============ FOOTER ============
function Footer({ setActive }) {
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
          <button className="brand brand-button" onClick={() => setActive("home")} aria-label="Go to home">
            <img
              src="assets/logo.png"
              alt="Direct Drive Abu Dhabi"
              style={{ height: 64, width: "auto", display: "block" }}
              draggable={false}
            />
          </button>
          <Mono style={{ color: "rgba(247,245,240,0.4)" }}>YOUR ABU DHABI DRIVING LICENSE, FINALLY MADE CLEAR.</Mono>
        </div>
        <div className="foot-cols">
          <div>
            <Mono style={{ color: "rgba(247,245,240,0.5)" }}>NAVIGATE</Mono>
            <ul>
              {footerNav.map((item) =>
                <li key={item.id}>
                  <button className="foot-link" onClick={() => setActive(item.id)}>{item.label}</button>
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
    </footer>);

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
              if (correct) cls += " is-correct";else
              if (chosen) cls += " is-wrong";
            } else if (chosen) cls += " is-picked";
            return (
              <button key={i} onClick={() => setPicked(i)} className={cls}>
                <span className="exam-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="exam-opt-text">{o}</span>
              </button>);

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
    </div>);

}

// ============ APP ============
function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useState("home");
  const [showQ, setShowQ] = useState(false);
  const [blogStartPost, setBlogStartPost] = useState(null);

  // accent hue var
  useEffect(() => {
    document.documentElement.style.setProperty("--gold", `oklch(72% 0.13 ${tweaks.accentHue})`);
    document.documentElement.style.setProperty("--gold-soft", `oklch(72% 0.13 ${tweaks.accentHue} / 0.18)`);
  }, [tweaks.accentHue]);

  // forest green + derived shades
  useEffect(() => {
    const fg = tweaks.forestGreen;
    const root = document.documentElement.style;
    root.setProperty("--ink", fg);
    root.setProperty("--ink-2", mixHex(fg, "#ffffff", 0.08)); // hover / mid green
    root.setProperty("--ink-3", mixHex(fg, "#000000", 0.35)); // deeper footer
    root.setProperty("--rule", withAlpha("#F7F5F0", 0.12));
  }, [tweaks.forestGreen]);

  const goTo = (id) => {
    if (id !== "blog") setBlogStartPost(null);
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openBlogPost = (postId) => {
    setBlogStartPost(postId);
    setActive("blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <TopNav active={active} setActive={goTo} />

      {active === "home" &&
      <>
          <Hero setActive={goTo} tweaks={tweaks} setShowQ={setShowQ} />
          <ValueProps setActive={goTo} />
          <TimelinePreview setActive={goTo} />
          <Pricing />
          <HomeBlogPromo setActive={goTo} />
        </>
      }
      {active === "process" && <ProcessPage openBlogPost={openBlogPost} />}
      {active === "cheatsheets" && <CheatSheetsPage />}
      {active === "practice" && <PracticePage />}
      {active === "blog" && <BlogPage initialPostId={blogStartPost} />}

      <Footer setActive={goTo} />

      {showQ && <FreeQuestionModal onClose={() => setShowQ(false)} />}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Hero">
          <window.TweakSlider label="Video brightness" value={tweaks.videoDim} min={0.2} max={1} step={0.05} onChange={(v) => setTweak("videoDim", v)} />
          <window.TweakToggle label="Show grid overlay" value={tweaks.showGrid} onChange={(v) => setTweak("showGrid", v)} />
          <window.TweakToggle label="Scanlines" value={tweaks.scanlines} onChange={(v) => setTweak("scanlines", v)} />
        </window.TweakSection>
        <window.TweakSection title="Accent">
          <window.TweakSlider label="Gold hue" value={tweaks.accentHue} min={40} max={120} step={1} onChange={(v) => setTweak("accentHue", v)} />
        </window.TweakSection>
        <window.TweakSection title="Surface">
          <window.TweakColor label="Forest green" value={tweaks.forestGreen} onChange={(v) => setTweak("forestGreen", v)} />
        </window.TweakSection>
      </window.TweaksPanel>
    </>);

}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
