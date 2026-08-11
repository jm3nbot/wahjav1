/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;
const {
  TWEAK_DEFAULTS, mixHex, withAlpha,
  PRACTICE_MODULES, QUESTIONS_BY_MODULE, MOCK_EXAMS, ROADREADY_QUESTION_BY_ID,
  playExamClick, formatExamTime,
  Mono, SectionMark, TopNav, Footer,
  QuestionVisual,
} = window;

// ============ MOCK EXAM PICKER ============
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
          <div><span>45 questions</span><strong>30 minutes</strong></div>
          <div><span>Pass mark</span><strong>36 / 45</strong></div>
          <div><span>Threshold</span><strong>80%</strong></div>
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

// ============ MOCK EXAM RUNNER ============
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
        if (value <= 1) { setSubmitted(true); return 0; }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (!submitted || finishSentRef.current) return;
    finishSentRef.current = true;
    onFinish({ score, percent, passed, answeredCount, flaggedCount, total: questions.length });
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
                  <path d="M5 22V4" /><path d="M5 4h12l-2 5 2 5H5" />
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

// ============ MODULE PRACTICE ============
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

// ============ PRACTICE PAGE ============
function PracticePage() {
  const totalQ = PRACTICE_MODULES.reduce((a, m) => a + m.count, 0);
  const totalModules = PRACTICE_MODULES.length;
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeModuleSlug, setActiveModuleSlug] = useState(null);
  const [activeMockExamId, setActiveMockExamId] = useState(null);
  const [showMockPicker, setShowMockPicker] = useState(false);
  const [mockResults, setMockResults] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("directDriveMockResults") || "{}"); }
    catch { return {}; }
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
      try { window.localStorage.setItem("directDriveMockResults", JSON.stringify(next)); }
      catch { /* Ignore private browsing storage failures. */ }
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
        onBack={() => { setActiveMockExamId(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
        onBack={() => { setShowMockPicker(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onSelect={(examId) => { playExamClick("submit"); setActiveMockExamId(examId); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
      <TopNav current="practice" />
      <PracticePage />
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
