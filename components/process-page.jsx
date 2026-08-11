/* global React, ReactDOM */
const { useState, useEffect } = React;
const {
  TWEAK_DEFAULTS, mixHex, withAlpha,
  PROCESS_STAGES, navigate, PAGE_URLS,
  Mono, SectionMark, TopNav, Footer,
} = window;

// ============ PROCESS PAGE ============
function ProcessPage() {
  const [open, setOpen] = useState(0);
  const blogCtaCopy = {
    "how-to-start-the-process-opening-your-file": "Need help opening the traffic file? See the explanation",
    "which-driving-school-to-choose-in-abu-dhabi-breakdown": "Not sure which school to choose? Read the comparison",
  };

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
                      <button className="pc-blog-link" onClick={() => navigate("blog", { post: s.blogPostId })}>
                        {blogCtaCopy[s.blogPostId] || "Read the related guide"} <span>→</span>
                      </button>
                    }
                  </div>
                }
              </article>
            )}
          </div>
        </div>
      </div>
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
      <TopNav current="process" />
      <ProcessPage />
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
