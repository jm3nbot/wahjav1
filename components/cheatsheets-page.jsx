/* global React, ReactDOM */
const { useState, useEffect } = React;
const {
  TWEAK_DEFAULTS, mixHex, withAlpha,
  CHEAT_SIGNS, POLICE_SIGNALS, RULE_CHEATS,
  Mono, SectionMark, TopNav, Footer,
  SignGlyph, RoadSignSvg,
} = window;

// ============ THANKS DOWNLOAD MODAL ============
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h2 className="thanks-title">Thank you for trusting Direct Drive.</h2>
            <p className="thanks-sub">Your free PDF is downloading now.</p>
          </div>
        </div>

        <div className="thanks-divider" />

        <div className="thanks-upsell-head">
          <Mono style={{ color: "var(--gold)" }}>CONSIDER PAID OPTIONS</Mono>
          <p>The PDF covers the signs and rules. The practice bank covers 1,262 questions — including every pattern the theory test repeats.</p>
        </div>

        <div className="thanks-tiers">
          {tiers.map((t) => (
            <div key={t.name} className={`thanks-tier ${t.featured ? "is-featured" : ""}`}>
              {t.featured && <div className="thanks-tier-badge"><Mono>BEST VALUE</Mono></div>}
              <Mono style={{ color: t.featured ? "var(--gold)" : "rgba(247,245,240,0.5)" }}>{t.name}</Mono>
              <div className="thanks-tier-price">
                {t.price} <Mono style={{ color: "rgba(247,245,240,0.4)" }}>/ {t.per}</Mono>
              </div>
              <ul className="thanks-tier-feats">
                {t.features.map((f) => <li key={f}><span className="tick">✓</span>{f}</li>)}
              </ul>
              <button className={`thanks-tier-cta ${t.featured ? "is-gold" : ""}`}>
                {t.cta} →
              </button>
            </div>
          ))}
        </div>

        <button className="thanks-skip" onClick={onClose}>No thanks, I'll stick with the free PDF</button>
      </div>
    </div>
  );
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
    </section>
  );
}

// ============ PAGE APP ============
function PageApp() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

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
      <TopNav current="cheatsheets" />
      <CheatSheetsPage />
      <Footer />
      <window.TweaksPanel title="Tweaks">
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
