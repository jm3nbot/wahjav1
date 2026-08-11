/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;
const {
  TWEAK_DEFAULTS, mixHex, withAlpha,
  PARTNERS, PROCESS_STAGES, STATS, BLOG_POSTS,
  navigate, PAGE_URLS,
  Mono, SectionMark, GoldBtn, GhostBtn,
  TopNav, Footer, FreeQuestionModal,
} = window;

// ============ HERO ============
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

function LiveFeedChrome() {
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState(67);
  useEffect(() => {
    const id = setInterval(() => {
      setT((v) => v + 1);
      setSpeed((s) => {
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
    </>
  );
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
    </div>
  );
}

function Hero({ tweaks, setShowQ }) {
  const videoRef = useRef(null);
  const dim = tweaks.videoDim;
  return (
    <section id="home" className="hero" data-screen-label="01 Hero">
      <div className="hero-card-wrap">
        <div className="hero-card">
          <video
            ref={videoRef}
            className="hero-card-video"
            src="assets/newherovid.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{ filter: `brightness(${dim})` }} />
          <div className="hero-card-grad" />
          <LiveFeedChrome />
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
              <GoldBtn onClick={() => navigate("process")}>See the full process</GoldBtn>
              <GhostBtn onClick={() => setShowQ(true)}>Try a free practice question</GhostBtn>
            </div>
          </div>
        </div>
      </div>
      <PartnerStrip />
    </section>
  );
}

// ============ VALUE PROPS ============
function VPIcon({ kind }) {
  const s = { width: 28, height: 28, fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "square" };
  if (kind === "process") return (
    <svg viewBox="0 0 28 28" {...s}>
      <circle cx="6" cy="14" r="2.5" /><circle cx="14" cy="14" r="2.5" /><circle cx="22" cy="14" r="2.5" />
      <path d="M8.5 14 L11.5 14 M16.5 14 L19.5 14" />
    </svg>
  );
  if (kind === "sheet") return (
    <svg viewBox="0 0 28 28" {...s}>
      <rect x="6" y="4" width="16" height="20" />
      <path d="M9 10 L19 10 M9 14 L19 14 M9 18 L15 18" />
    </svg>
  );
  return (
    <svg viewBox="0 0 28 28" {...s}>
      <circle cx="14" cy="14" r="9" />
      <path d="M14 8 L14 14 L18 16" />
    </svg>
  );
}

function ValueProps() {
  const items = [
    { n: "01", t: "The Process", d: "Ten stages, end to end. What to do, where to go, how much, and the mistake everyone makes.", a: () => navigate("process"), tag: "GUIDE", ic: "process" },
    { n: "02", t: "Cheat Sheets", d: "Traffic signs and road rules, one printable PDF each. No email. No paywall.", a: () => navigate("cheatsheets"), tag: "REFERENCE", ic: "sheet" },
    { n: "03", t: "Practice Tests", d: "1,262 questions, 45-minute timed mode, full review on every wrong answer.", a: () => navigate("practice"), tag: "TIMED", ic: "test" }
  ];

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

  const carLeftPct = -22 + progress * 140;
  const carX = (carLeftPct / 100) * containerW;
  const isMoving = progress > 0.02 && progress < 0.985;
  const REAR_BUMPER_OFFSET = 15;
  const carRearPx = (carLeftPct / 100) * containerW + REAR_BUMPER_OFFSET;
  const revealedPct = Math.max(0, Math.min(100, (carRearPx / containerW) * 100));
  const textClip = `inset(0 ${(100 - revealedPct).toFixed(2)}% 0 0)`;

  return (
    <section ref={sectionRef} className="valueprops" data-screen-label="02 Value props" style={{ paddingTop: 5 }}>
      <style>{FUEL_CSS}</style>
      <div className="vp-scanlines" aria-hidden />
      <div ref={trackRef} style={{ position: "relative", height: 152, marginBottom: 2, zIndex: 2 }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          clipPath: textClip, pointerEvents: "none", zIndex: 1,
        }}>
          <span style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontWeight: 500, fontSize: "clamp(22px, 3.6vw, 46px)",
            color: "var(--cream)", letterSpacing: "0.02em", textTransform: "uppercase",
            whiteSpace: "nowrap", userSelect: "none",
          }}>
            Three Simple{" "}
            <span style={{ color: "var(--gold)" }}>Steps</span>
          </span>
        </div>
        <div style={{
          position: "absolute", left: 0, bottom: 0, display: "flex", alignItems: "flex-end",
          pointerEvents: "none", transform: `translate3d(${carX.toFixed(1)}px, 0, 0)`,
          willChange: "transform", zIndex: 2,
        }}>
          {isMoving && PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: "absolute", width: p.size, height: p.size, borderRadius: "50%",
              background: "var(--gold)", left: p.ox, bottom: p.oy, opacity: 0,
              animation: `${p.anim} ${p.dur}s ease-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))}
          <img src="assets/carimage.png" alt="" draggable={false} style={{
            height: "152px", width: "auto", display: "block",
            filter: "drop-shadow(0 10px 32px rgba(0,0,0,0.65))",
            userSelect: "none", pointerEvents: "none",
          }} />
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
              <h3 className="vp-title" style={{ fontFamily: '"Plus Jakarta Sans"' }}>{it.t}</h3>
              <p className="vp-desc">{it.d}</p>
              <div className="vp-arrow">
                <Mono>OPEN MODULE</Mono> <span>→</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============ TIMELINE PREVIEW ============
function TimelinePreview() {
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
            <div key={i} className="tp-card" onClick={() => navigate("process")}>
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
          <GoldBtn onClick={() => navigate("process")}>Open the full process</GoldBtn>
        </div>
      </div>
    </section>
  );
}

// ============ STATS ============
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
          <div className="quote-mark">"</div>
          <p>I failed twice with two different apps. Direct Drive was the first thing that explained why my answers were wrong. Passed on the next try.</p>
          <div className="quote-attr">
            <Mono>HAMAD A. · KHALIDIYA · PASSED MAR 2026</Mono>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ PRICING ============
function Pricing() {
  const pricingRef = useRef(null);
  const [headlineRevealed, setHeadlineRevealed] = useState(false);
  const tiers = [
    { name: "Free Forever", price: "AED 0", per: "always", features: ["Full 10-stage process guide", "Traffic signs cheat sheet", "Road rules cheat sheet", "5 sample practice questions"], cta: "Start free", featured: false },
    { name: "Practice — 7 Days", price: "AED 15", per: "one-time", features: ["Everything in Free", "All 1,262 questions", "3 timed mock exams", "Wrong-answer reviews"], cta: "Get 7 days", featured: false },
    { name: "Practice — Lifetime", price: "AED 55", per: "one-time", features: ["Everything in 30 Days", "Unlimited mock exams", "Score tracker & graphs", "Category breakdown reports"], cta: "Get lifetime", featured: true }
  ];
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
    </section>
  );
}

// ============ HOME BLOG PROMO ============
function HomeBlogPromo() {
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
            <GoldBtn onClick={() => navigate("blog")}>Open the blog</GoldBtn>
          </div>
        </div>
        <div className="blog-teaser-grid">
          {BLOG_POSTS.map((post) =>
            <button key={post.id} className="blog-teaser-card" onClick={() => navigate("blog", { post: post.id })}>
              <span className="blog-teaser-num">{post.n}</span>
              <img src={post.image} alt="" loading="lazy" />
              <Mono style={{ color: "var(--gold)" }}>{post.category} · {post.read}</Mono>
              <h3>{post.title}</h3>
              <span className="blog-teaser-read">Read article →</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============ PAGE APP ============
function PageApp() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [showQ, setShowQ] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--gold", `oklch(72% 0.13 ${tweaks.accentHue})`);
    document.documentElement.style.setProperty("--gold-soft", `oklch(72% 0.13 ${tweaks.accentHue} / 0.18)`);
  }, [tweaks.accentHue]);

  useEffect(() => {
    const fg = tweaks.forestGreen;
    const root = document.documentElement.style;
    root.setProperty("--ink", fg);
    root.setProperty("--ink-2", mixHex(fg, "#ffffff", 0.08));
    root.setProperty("--ink-3", mixHex(fg, "#000000", 0.35));
    root.setProperty("--rule", withAlpha("#F7F5F0", 0.12));
  }, [tweaks.forestGreen]);

  return (
    <>
      <TopNav current="home" />
      <Hero tweaks={tweaks} setShowQ={setShowQ} />
      <ValueProps />
      <TimelinePreview />
      <StatStrip />
      <Pricing />
      <HomeBlogPromo />
      <Footer />
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
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<PageApp />);
