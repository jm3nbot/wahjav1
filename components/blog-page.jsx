/* global React, ReactDOM */
const { useState, useEffect } = React;
const {
  TWEAK_DEFAULTS, mixHex, withAlpha,
  BLOG_POSTS, sectionSlug,
  Mono, SectionMark, TopNav, Footer,
  ArticleText,
} = window;

// ============ BLOG ARTICLE ============
function BlogArticle({ post, onBack }) {
  const hasContent = Array.isArray(post.content) && post.content.length > 0;
  const highlightTracker = {};
  const articleImageClass = post.articleImage && post.articleImage.includes("open-traffic-file")
    ? "is-screenshot"
    : post.articleImage && post.articleImage.includes("ydaschool")
      ? "is-photo"
      : "";
  const faqItems = post.faq?.length ? post.faq : [
    {
      q: "Is this still useful in 2026?",
      a: "Yes. This guide is written around the current Abu Dhabi learner flow and focuses on the steps, rules, costs, and decisions that affect your next booking."
    },
    {
      q: "What should I read next?",
      a: "Use the related articles below to continue through the process in order, then practise the matching rule or theory questions."
    },
    {
      q: "Should I still confirm details before paying?",
      a: "Yes. Booking slots, school packages, app flows, and fees can change, so confirm inside TAMM, your driving school app, or the relevant official authority app before payment."
    }
  ];
  const relatedIds = post.related?.length
    ? post.related
    : BLOG_POSTS.filter((item) => item.id !== post.id).slice(0, 3).map((item) => item.id);
  const relatedPosts = relatedIds
    .map((id) => BLOG_POSTS.find((item) => item.id === id))
    .filter(Boolean);
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
            <div className={`blog-article-image ${articleImageClass}`}>
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
                  {section.table &&
                    <div className="blog-compare-table">
                      {section.table.map((row) =>
                        <div key={row.label} className="blog-compare-row">
                          <Mono>{row.label}</Mono>
                          <span><strong>EDC</strong>{row.edc}</span>
                          <span><strong>YDA</strong>{row.yda}</span>
                        </div>
                      )}
                    </div>
                  }
                  {(() => {
                    const visuals = section.visuals || (section.visual ? [section.visual] : []);
                    return visuals.length ?
                      <div className={`blog-visual-grid ${visuals.length > 1 ? "is-multi" : ""}`}>
                        {visuals.map((visual) =>
                          <figure key={visual.title} className={`blog-inline-visual ${
                            visual.wide || visual.image.includes("open-traffic-file") ? "is-screenshot" :
                            visual.image.includes("edc-handbook-rules") ? "is-handbook" :
                            visual.image.includes("ydaschool") ? "is-photo" :
                            visual.image.includes("ydalogo") || visual.image.includes("edclogo") ? "is-app" :
                            visual.image.includes("rules-") ? "is-diagram" : ""
                          }`}>
                            <img src={visual.image} alt="" loading="lazy" />
                            <figcaption>
                              <strong>{visual.title}</strong>
                              <span>{visual.text}</span>
                            </figcaption>
                          </figure>
                        )}
                      </div> : null;
                  })()}
                  {section.cta &&
                    <a className="blog-section-cta" href={section.cta.href}>
                      <span>
                        <strong>{section.cta.label}</strong>
                        <small>{section.cta.text}</small>
                      </span>
                      <span aria-hidden>→</span>
                    </a>
                  }
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
              <section id="faq" className="blog-draft-section blog-faq-section">
                <Mono>FAQ</Mono>
                <h2>Short FAQ</h2>
                <div className="blog-faq-list">
                  {faqItems.map((item) =>
                    <details key={item.q} className="blog-faq-item">
                      <summary>{item.q}</summary>
                      <p><ArticleText text={item.a} tracker={highlightTracker} /></p>
                    </details>
                  )}
                </div>
              </section>
              {relatedPosts.length > 0 &&
                <section className="blog-draft-section blog-related-section">
                  <Mono>RELATED ARTICLES</Mono>
                  <h2>Read next</h2>
                  <div className="blog-related-grid">
                    {relatedPosts.map((item) =>
                      <button key={item.id} className="blog-related-card" onClick={() => window.location.href = `blog.html?post=${item.id}`}>
                        <img src={item.image} alt="" loading="lazy" />
                        <span>
                          <Mono>{item.category}</Mono>
                          <strong>{item.title}</strong>
                        </span>
                      </button>
                    )}
                  </div>
                </section>
              }
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

// ============ BLOG PAGE ============
function BlogPage() {
  const initialPostId = new URLSearchParams(window.location.search).get("post");
  const [activePost, setActivePost] = useState(initialPostId);
  const post = BLOG_POSTS.find((item) => item.id === activePost);
  useEffect(() => {
    if (activePost) window.scrollTo({ top: 0, behavior: "auto" });
  }, [activePost]);

  function openPost(id) {
    setActivePost(id);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

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
              onClick={() => openPost(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPost(item.id);
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
      <TopNav current="blog" />
      <BlogPage />
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
