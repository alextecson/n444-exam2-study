(function () {
  "use strict";

  const data = window.N444_DATA;
  const questions = data.questions;
  const review = data.review;
  const app = document.getElementById("app");
  const progressKey = "n444-study-progress-v1";
  const coachAssetVersion = "clean-bg-20260702";
  const coachAsset = (src) => `${src}?v=${coachAssetVersion}`;

  const rhythmAssets = {
    afib: "assets/afib-DWPwm1fU.png",
    atrial_flutter: "assets/atrial_flutter.svg",
    asystole: "assets/asystole-BRi7O9_O.png",
    first_degree: "assets/first_degree-BlVSAkAU.png",
    pvc: "assets/pvc.svg",
    second_degree: "assets/second_degree.svg",
    sinus_brady: "assets/sinus_brady-EL_mIhe9.png",
    sinus_tach: "assets/sinus_tach-DR4itNh8.png",
    stemi: "assets/stemi.svg",
    svt: "assets/svt-D3HAhPAc.png",
    third_degree: "assets/third_degree-DBIfRvPI.png",
    torsades: "assets/torsades-DdKGwxF7.png",
    vfib: "assets/vfib-Dp0dEGzO.png",
    vtach: "assets/vtach-hhxo-b10.png"
  };

  const coachImages = {
    point: {
      src: coachAsset("assets/generated/coach-point.webp"),
      alt: "Professor Tecson pointing toward the answer explanation"
    },
    celebrate: {
      src: coachAsset("assets/generated/coach-celebrate.webp"),
      alt: "Professor Tecson celebrating a correct answer"
    },
    think: {
      src: coachAsset("assets/generated/coach-think.webp"),
      alt: "Professor Tecson thinking through the answer rationale"
    },
    rhythm: {
      src: coachAsset("assets/generated/coach-rhythm.webp"),
      alt: "Professor Tecson explaining a rhythm concept"
    },
    fist: {
      src: coachAsset("assets/generated/coach-fist.webp"),
      alt: "Professor Tecson giving an encouraging fist pump"
    },
    tablet: {
      src: coachAsset("assets/generated/coach-tablet.webp"),
      alt: "Professor Tecson holding a tablet while explaining"
    },
    handHeart: {
      src: coachAsset("assets/generated/coach-hand-heart.webp"),
      alt: "Professor Tecson with a reassuring hand on his chest"
    },
    armsCrossed: {
      src: coachAsset("assets/generated/coach-arms-crossed.webp"),
      alt: "Professor Tecson smiling with arms crossed"
    },
    wave: {
      src: coachAsset("assets/generated/coach-wave.webp"),
      alt: "Professor Tecson waving hello"
    },
    chin: {
      src: coachAsset("assets/generated/coach-chin.webp"),
      alt: "Professor Tecson thinking through the explanation"
    },
    thumbsUp: {
      src: coachAsset("assets/generated/coach-thumbs-up.webp"),
      alt: "Professor Tecson giving a thumbs up"
    },
    openHands: {
      src: coachAsset("assets/generated/coach-open-hands.webp"),
      alt: "Professor Tecson presenting the explanation with open hands"
    },
    oneFinger: {
      src: coachAsset("assets/generated/coach-one-finger.webp"),
      alt: "Professor Tecson pointing up to an important concept"
    },
    present: {
      src: coachAsset("assets/generated/coach-present.webp"),
      alt: "Professor Tecson presenting the answer explanation"
    }
  };

  const allCoachImages = Object.values(coachImages);

  const coachPools = {
    good: [
      coachImages.celebrate,
      coachImages.fist,
      coachImages.thumbsUp,
      coachImages.wave,
      coachImages.armsCrossed,
      coachImages.handHeart,
      coachImages.rhythm
    ],
    partial: [
      coachImages.think,
      coachImages.chin,
      coachImages.tablet,
      coachImages.openHands,
      coachImages.oneFinger,
      coachImages.present,
      coachImages.point,
      coachImages.rhythm
    ],
    bad: [
      coachImages.think,
      coachImages.chin,
      coachImages.openHands,
      coachImages.tablet,
      coachImages.oneFinger,
      coachImages.present,
      coachImages.handHeart,
      coachImages.point
    ]
  };

  const lastCoachPick = {};

  const domainLabels = {
    Dysrhythmias: "Dysrhythmias",
    Liver: "Liver",
    GI: "GI",
    Hematologic: "Heme/Onc",
    Autoimmune: "Autoimmune",
    "Clinical Judgment": "Clinical Judgment"
  };

  const typeLabels = {
    mc: "Single",
    sata: "SATA",
    cloze: "Cloze",
    matching: "Matching"
  };

  const state = {
    view: "home",
    setupMode: "practice",
    setupDomain: "all",
    setupTypes: new Set(["mc", "sata", "cloze", "matching"]),
    setupLength: 10,
    verifiedOnly: false,
    reviewDomain: null,
    reviewTopic: null,
    search: "",
    quiz: null,
    modalImage: null
  };

  let progress = loadProgress();

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(progressKey)) || { questions: {}, rounds: [] };
    } catch (error) {
      return { questions: {}, rounds: [] };
    }
  }

  function saveProgress() {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toText(html) {
    const template = document.createElement("template");
    template.innerHTML = cleanHtml(html || "");
    return (template.content.textContent || "").replace(/\s+/g, " ").trim();
  }

  function cleanHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    template.content.querySelectorAll("script,style,iframe,object,embed,img").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (attr.name.startsWith("on") || !["class", "aria-label"].includes(attr.name)) {
          node.removeAttribute(attr.name);
        }
      });
    });
    return template.innerHTML;
  }

  function renderHtmlBlocks(root) {
    root.querySelectorAll("[data-html]").forEach((node) => {
      node.innerHTML = cleanHtml(node.getAttribute("data-html"));
    });
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function domains() {
    return review.map((item) => item.id);
  }

  function getDomainCount(domain) {
    return questions.filter((q) => q.domain === domain).length;
  }

  function stats() {
    const entries = Object.entries(progress.questions || {});
    const attempts = entries.reduce((sum, [, item]) => sum + (item.attempts || 0), 0);
    const earned = entries.reduce((sum, [, item]) => sum + (item.earned || 0), 0);
    const max = entries.reduce((sum, [, item]) => sum + (item.max || 0), 0);
    const saved = entries.filter(([, item]) => item.starred).length;
    const missed = entries.filter(([, item]) => item.missed).length;
    return {
      answered: entries.length,
      attempts,
      accuracy: max ? Math.round((earned / max) * 100) : 0,
      saved,
      missed
    };
  }

  function domainStats(domain) {
    const ids = new Set(questions.filter((q) => q.domain === domain).map((q) => q.id));
    const entries = Object.entries(progress.questions || {}).filter(([id]) => ids.has(id));
    const earned = entries.reduce((sum, [, item]) => sum + (item.earned || 0), 0);
    const max = entries.reduce((sum, [, item]) => sum + (item.max || 0), 0);
    return {
      answered: entries.length,
      total: ids.size,
      accuracy: max ? Math.round((earned / max) * 100) : 0
    };
  }

  function availableQuestions() {
    return questions.filter((q) => {
      if (state.setupDomain !== "all" && q.domain !== state.setupDomain) return false;
      if (!state.setupTypes.has(q.type)) return false;
      if (state.verifiedOnly && !q.verified) return false;
      return true;
    });
  }

  function isAnswered(question, response) {
    if (!response) return false;
    if (question.type === "mc" || question.type === "sata") return Array.isArray(response) && response.length > 0;
    if (question.type === "cloze") return question.blanks.every((blank) => response[blank.key]);
    if (question.type === "matching") return question.leftPrompts.every((prompt) => response[prompt.id]);
    return false;
  }

  function evaluate(question, response) {
    if (question.type === "mc") {
      const full = Array.isArray(response) && response.length === 1 && question.correct.includes(response[0]);
      return { earned: full ? question.points : 0, max: question.points, full };
    }
    if (question.type === "sata") {
      const correct = new Set(question.correct);
      const selected = new Set(response || []);
      let hits = 0;
      question.options.forEach((option) => {
        if (correct.has(option.id) === selected.has(option.id)) hits += 1;
      });
      const earned = +(question.points * (hits / question.options.length)).toFixed(3);
      return { earned, max: question.points, full: hits === question.options.length };
    }
    if (question.type === "cloze") {
      let hits = 0;
      question.blanks.forEach((blank) => {
        if (response && response[blank.key] === blank.correct) hits += 1;
      });
      const earned = +(question.points * (hits / question.blanks.length)).toFixed(3);
      return { earned, max: question.points, full: hits === question.blanks.length };
    }
    if (question.type === "matching") {
      let hits = 0;
      question.pairs.forEach(([left, right]) => {
        if (response && response[left] === right) hits += 1;
      });
      const earned = +(question.points * (hits / question.pairs.length)).toFixed(3);
      return { earned, max: question.points, full: hits === question.pairs.length };
    }
    return { earned: 0, max: question.points || 1, full: false };
  }

  function recordQuestion(question, result, response) {
    const current = progress.questions[question.id] || {
      attempts: 0,
      earned: 0,
      max: 0,
      starred: false,
      missed: false
    };
    current.attempts += 1;
    current.earned = +(current.earned + result.earned).toFixed(3);
    current.max = +(current.max + result.max).toFixed(3);
    current.missed = !result.full;
    current.lastFull = result.full;
    current.lastResponse = response;
    current.updatedAt = new Date().toISOString();
    progress.questions[question.id] = current;
  }

  function finishRound() {
    const quiz = state.quiz;
    if (!quiz) return;
    quiz.results = quiz.questions.map((question) => {
      const response = quiz.responses[question.id];
      const result = evaluate(question, response);
      if (!quiz.recordedIds.has(question.id)) {
        recordQuestion(question, result, response);
        quiz.recordedIds.add(question.id);
      }
      return { question, response, result };
    });
    const totalEarned = quiz.results.reduce((sum, item) => sum + item.result.earned, 0);
    const totalMax = quiz.results.reduce((sum, item) => sum + item.result.max, 0);
    progress.rounds = [
      {
        at: new Date().toISOString(),
        mode: quiz.mode,
        title: quiz.title,
        earned: +totalEarned.toFixed(3),
        max: +totalMax.toFixed(3),
        count: quiz.questions.length
      },
      ...(progress.rounds || [])
    ].slice(0, 20);
    saveProgress();
    state.view = "results";
    render();
  }

  function setView(view) {
    state.view = view;
    state.quiz = null;
    state.reviewDomain = null;
    state.reviewTopic = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  }

  function startRound(source) {
    let pool = source && source.pool ? source.pool : availableQuestions();
    pool = shuffle(pool);
    const length = source && source.length ? source.length : state.setupLength;
    if (length !== "all") pool = pool.slice(0, Number(length));
    if (!pool.length) return;

    const domainTitle = state.setupDomain === "all" ? "Mixed review" : domainLabels[state.setupDomain];
    const mode = source && source.mode ? source.mode : state.setupMode;
    state.quiz = {
      mode,
      title: source && source.title ? source.title : domainTitle,
      questions: pool,
      index: 0,
      responses: {},
      checked: false,
      results: [],
      recordedIds: new Set(),
      hideDomain: mode === "exam" || state.setupDomain === "all"
    };
    state.view = "quiz";
    window.scrollTo({ top: 0 });
    render();
  }

  function currentQuestion() {
    return state.quiz.questions[state.quiz.index];
  }

  function currentResponse() {
    const question = currentQuestion();
    return state.quiz.responses[question.id];
  }

  function setResponse(question, response) {
    state.quiz.responses[question.id] = response;
    render();
  }

  function answerText(question, idsOrMap) {
    if (question.type === "mc" || question.type === "sata") {
      const ids = new Set(Array.isArray(idsOrMap) ? idsOrMap : question.correct);
      return question.options
        .filter((option) => ids.has(option.id))
        .map((option) => toText(option.text))
        .join("; ");
    }
    if (question.type === "cloze") {
      return question.blanks
        .map((blank, index) => {
          const id = idsOrMap ? idsOrMap[blank.key] : blank.correct;
          const option = blank.options.find((item) => item.id === id);
          return `Blank ${index + 1}: ${option ? toText(option.text) : ""}`;
        })
        .join("; ");
    }
    if (question.type === "matching") {
      const map = idsOrMap || Object.fromEntries(question.pairs);
      return question.leftPrompts
        .map((prompt) => {
          const id = map[prompt.id];
          const option = question.rightOptions.find((item) => item.id === id);
          return `${toText(prompt.text)} = ${option ? toText(option.text) : ""}`;
        })
        .join("; ");
    }
    return "";
  }

  function getCoachImage(question, tone) {
    const pool = coachPools[tone] || allCoachImages;
    const source = `${question.id || ""}|${question.domain || ""}|${question.topic || ""}|${tone}`;
    let seed = 17;

    for (let index = 0; index < source.length; index += 1) {
      seed = (seed * 31 + source.charCodeAt(index)) >>> 0;
    }

    let coach = pool[seed % pool.length];
    const previous = lastCoachPick[tone];

    if (previous && previous.source === source) {
      return pool.find((item) => item.src === previous.src) || coach;
    }

    if (previous && previous.src === coach.src && pool.length > 1) {
      coach = pool[(seed + 1) % pool.length];
    }

    lastCoachPick[tone] = { source, src: coach.src };
    return coach;
  }

  function htmlHeader(active) {
    return `
      <header class="topbar">
        <div class="brand">
          <div class="eyebrow">N444 Exam 2 prep</div>
          <h1>N444 Lock-In</h1>
        </div>
        <div class="top-actions">
          <button class="plain-btn" data-action="quick-start">Quick 10</button>
        </div>
      </header>
      ${active === "quiz" ? "" : htmlNav(active)}
    `;
  }

  function htmlNav(active) {
    const items = [
      ["home", "Home"],
      ["practice", "Practice"],
      ["review", "Review"],
      ["saved", "Saved"]
    ];
    return `
      <nav class="bottom-nav" aria-label="Primary">
        ${items.map(([view, label]) => `
          <button class="nav-btn ${active === view ? "active" : ""}" data-nav="${view}">${label}</button>
        `).join("")}
      </nav>
    `;
  }

  function renderHome() {
    const s = stats();
    const weakest = domains()
      .map((domain) => ({ domain, ...domainStats(domain) }))
      .filter((item) => item.answered > 0)
      .sort((a, b) => a.accuracy - b.accuracy)[0];

    return `
      ${htmlHeader("home")}
      <main class="screen">
        <section class="cover-page" aria-labelledby="cover-title">
          <div class="cover-head">
            <div>
              <span class="cover-badge">Open this first</span>
              <h2 id="cover-title">N444 Exam 2 Lock-In</h2>
            </div>
            <div class="cover-professor" aria-hidden="true">
              <img src="${coachImages.wave.src}" alt="" />
              <span>Rationale first. Panic never.</span>
            </div>
          </div>
          <div class="cover-copy">
            <div class="professor-bubble">
              <span>Professor Tecson says</span>
              <p>This is your mobile study link for Exam 2 prep. It is not the exam or an answer key. Use it for quick practice, rhythm review, and a mini exam simulation.</p>
            </div>
            <div class="how-grid" aria-label="How to use this study link">
              <div><strong>1</strong><span>Tap Quick 10 for fast mixed reps.</span></div>
              <div><strong>2</strong><span>Read the rationale after each answer.</span></div>
              <div><strong>3</strong><span>Save tough items and come back before exam day.</span></div>
            </div>
            <div class="cover-actions">
              <button class="primary-btn" data-action="quick-start">Start Quick 10</button>
              <button class="secondary-btn" data-nav="review">Review first</button>
              <button class="plain-btn" data-action="exam-start">Exam mode</button>
            </div>
            <p class="cover-note">Practice items are intentionally rewritten for prep. Your progress saves on this phone or tablet only.</p>
          </div>
        </section>

        <section class="hero-grid">
          <div class="lead-panel">
            <div class="eyebrow">Pocket study mode</div>
            <h2 class="view-title">Lock in before Exam 2.</h2>
            <p>Swipe-sized drills, rhythm reps, and NGN-style practice built from course concepts, not exam disclosure. Your progress stays on this device.</p>
            <div class="hero-stickers" aria-hidden="true">
              <span>PRIORITY</span>
              <span>RHYTHMS</span>
              <span>NGN</span>
            </div>
          </div>
          <div class="stats-row">
            <div class="stat"><strong>${s.answered}</strong><span>questions seen</span></div>
            <div class="stat"><strong>${s.accuracy}%</strong><span>accuracy</span></div>
            <div class="stat"><strong>${s.missed}</strong><span>to review</span></div>
            <div class="stat"><strong>${s.saved}</strong><span>saved</span></div>
          </div>
        </section>

        <section>
          <div class="section-head">
            <h2>Pick your lane</h2>
            <span class="tiny">${questions.length} items</span>
          </div>
          <div class="quick-grid">
            <button class="mode-tile primary" data-action="quick-start">
              <strong>Quick 10</strong>
              <span>Fast mixed reps with instant feedback.</span>
            </button>
            <button class="mode-tile" data-action="exam-start">
              <strong>Exam sim</strong>
              <span>20 mixed items. Answers stay hidden until results.</span>
            </button>
            <button class="mode-tile" data-action="review-rhythms">
              <strong>Strip lab</strong>
              <span>Read the rhythm, then choose the next move.</span>
            </button>
            <button class="mode-tile" data-action="weak-start" ${weakest ? "" : "disabled"}>
              <strong>Patch the gap</strong>
              <span>${weakest ? `Drill ${domainLabels[weakest.domain]} at ${weakest.accuracy}%.` : "Unlocks after your first round."}</span>
            </button>
          </div>
        </section>

        <section>
          <div class="section-head">
            <h2>Domains</h2>
            <button class="plain-btn" data-nav="practice">Customize</button>
          </div>
          <div class="domain-grid">
            ${domains().map((domain) => {
              const ds = domainStats(domain);
              const percent = ds.total ? Math.round((ds.answered / ds.total) * 100) : 0;
              return `
                <button class="domain-card" data-action="domain-practice" data-domain="${escapeHtml(domain)}">
                  <span>
                    <h3>${domainLabels[domain]}</h3>
                    <p>${ds.answered} of ${ds.total} seen · ${ds.accuracy}% accuracy</p>
                    <span class="progress-track"><span class="progress-fill" style="--value:${percent}%"></span></span>
                  </span>
                  <span class="domain-meter">${getDomainCount(domain)}</span>
                </button>
              `;
            }).join("")}
          </div>
        </section>
      </main>
    `;
  }

  function renderPractice() {
    const pool = availableQuestions();
    return `
      ${htmlHeader("practice")}
      <main class="screen setup-panel">
        <section>
          <div class="eyebrow">Build a round</div>
          <h2 class="view-title">Build your reps.</h2>
        </section>

        <section class="control-block">
          <h3>Mode</h3>
          <div class="segmented">
            ${["practice", "exam"].map((mode) => `
              <button class="tab-btn ${state.setupMode === mode ? "active" : ""}" data-action="set-mode" data-mode="${mode}">
                ${mode === "practice" ? "Practice" : "Exam"}
              </button>
            `).join("")}
          </div>
        </section>

        <section class="control-block">
          <h3>Domain</h3>
          <div class="chip-row">
            <button class="chip ${state.setupDomain === "all" ? "active" : ""}" data-action="set-domain" data-domain="all">Mixed</button>
            ${domains().map((domain) => `
              <button class="chip ${state.setupDomain === domain ? "active" : ""}" data-action="set-domain" data-domain="${escapeHtml(domain)}">
                ${domainLabels[domain]}
              </button>
            `).join("")}
          </div>
        </section>

        <section class="control-block">
          <h3>Item types</h3>
          <div class="chip-row">
            ${Object.entries(typeLabels).map(([type, label]) => `
              <button class="chip type-chip ${state.setupTypes.has(type) ? "active" : ""}" data-action="toggle-type" data-type="${type}">
                ${label}
              </button>
            `).join("")}
          </div>
        </section>

        <section class="control-block">
          <h3>Round length</h3>
          <div class="length-grid">
            ${[10, 20, "all"].map((length) => `
              <button class="length-btn ${state.setupLength === length ? "active" : ""}" data-action="set-length" data-length="${length}">
                <strong>${length === "all" ? pool.length : length}</strong>
                <span>${length === 10 ? "quick" : length === 20 ? "standard" : "all"}</span>
              </button>
            `).join("")}
          </div>
        </section>

        <label class="toggle-row">
          <span>
            <strong>Core concept items only</strong><br />
            <span class="count-note">Practice variants stay available when this is off.</span>
          </span>
          <span class="switch">
            <input type="checkbox" data-action="verified-only" ${state.verifiedOnly ? "checked" : ""} />
            <span></span>
          </span>
        </label>

        <section>
          <p class="count-note">${pool.length} matching items. ${pool.filter((q) => q.verified).length} core concept items.</p>
          <button class="primary-btn wide" data-action="start-setup" ${pool.length ? "" : "disabled"}>Start round</button>
        </section>
      </main>
    `;
  }

  function renderReview() {
    if (state.reviewDomain) return renderReviewDetail();
    const query = state.search.trim().toLowerCase();
    const filtered = review.filter((domain) => {
      if (!query) return true;
      const text = JSON.stringify(domain).toLowerCase();
      return text.includes(query);
    });
    return `
      ${htmlHeader("review")}
      <main class="screen">
        <section>
          <div class="eyebrow">Review library</div>
          <h2 class="view-title">Study guide, then questions.</h2>
        </section>
        <section style="margin-top:16px">
          <input class="search" type="search" placeholder="Search rhythms, labs, priorities..." value="${escapeHtml(state.search)}" data-action="search-review" />
        </section>
        <section class="topic-grid" style="margin-top:14px">
          ${filtered.map((domain) => `
            <button class="topic-card" data-action="open-review" data-domain="${escapeHtml(domain.id)}">
              <h3>${escapeHtml(domain.title)}</h3>
              <p>${escapeHtml(domain.blurb || `${domain.sections.length} review sections`)}</p>
              <span class="topic-chips">
                ${(domain.topics || []).slice(0, 5).map((topic) => `<span class="mini-chip">${escapeHtml(topic.title)}</span>`).join("")}
                ${domain.topics && domain.topics.length > 5 ? `<span class="mini-chip">${domain.topics.length - 5} more</span>` : ""}
              </span>
            </button>
          `).join("")}
        </section>
      </main>
    `;
  }

  function renderReviewDetail() {
    const domain = review.find((item) => item.id === state.reviewDomain);
    const topic = state.reviewTopic && domain.topics ? domain.topics.find((item) => item.id === state.reviewTopic) : null;
    const item = topic || domain;
    const strip = item.strip ? rhythmAssets[item.strip] : null;
    return `
      ${htmlHeader("review")}
      <main class="screen review-page">
        <button class="plain-btn" data-action="${topic ? "back-review-domain" : "back-review"}">${topic ? "Back to topic list" : "Back to review"}</button>
        <section>
          <div class="eyebrow">${escapeHtml(domain.title)}</div>
          <h2 class="review-title">${escapeHtml(item.title)}</h2>
          ${item.blurb ? `<p class="review-blurb">${escapeHtml(item.blurb)}</p>` : ""}
        </section>
        ${strip ? `
          <div class="strip-wrap">
            <button data-action="zoom-image" data-src="${strip}" aria-label="Open rhythm strip">
              <img src="${strip}" alt="${escapeHtml(item.title)} rhythm strip" loading="lazy" />
            </button>
          </div>
        ` : ""}
        ${(item.sections || []).map((section) => `
          <section class="review-section">
            <h3>${escapeHtml(section.h)}</h3>
            <ul>
              ${section.b.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
            </ul>
          </section>
        `).join("")}
        ${!topic && domain.topics ? `
          <section>
            <div class="section-head"><h3>${escapeHtml(domain.subLabel || "Go deeper")}</h3></div>
            <div class="topic-chips">
              ${domain.topics.map((child) => `
                <button class="chip" data-action="open-review-topic" data-domain="${escapeHtml(domain.id)}" data-topic="${escapeHtml(child.id)}">${escapeHtml(child.title)}</button>
              `).join("")}
            </div>
          </section>
        ` : ""}
        <button class="primary-btn wide" data-action="quiz-review-domain" data-domain="${escapeHtml(domain.quizDomain || domain.id)}">Quiz this area</button>
      </main>
    `;
  }

  function renderSaved() {
    const starred = Object.entries(progress.questions || {}).filter(([, item]) => item.starred);
    const missed = Object.entries(progress.questions || {}).filter(([, item]) => item.missed);
    const ids = [...new Set([...starred.map(([id]) => id), ...missed.map(([id]) => id)])];
    const items = ids.map((id) => questions.find((q) => q.id === id)).filter(Boolean);
    return `
      ${htmlHeader("saved")}
      <main class="screen">
        <section>
          <div class="eyebrow">Saved and missed</div>
          <h2 class="view-title">Your comeback list.</h2>
        </section>
        <section class="saved-list" style="margin-top:16px">
          ${items.length ? items.map((q) => {
            const p = progress.questions[q.id] || {};
            return `
              <button class="saved-row" data-action="single-question" data-id="${escapeHtml(q.id)}">
                <span>
                  <strong>${domainLabels[q.domain]}</strong>
                  <p>${escapeHtml(toText(q.stem).slice(0, 120))}${toText(q.stem).length > 120 ? "..." : ""}</p>
                </span>
                <span class="tag ${p.missed ? "generated" : "verified"}">${p.missed ? "Review" : "Saved"}</span>
              </button>
            `;
          }).join("") : `<div class="empty-state">Save questions during practice or miss a question to build this list.</div>`}
        </section>
        ${items.length ? `<button class="primary-btn wide" style="margin-top:14px" data-action="start-saved">Practice saved and missed</button>` : ""}
      </main>
    `;
  }

  function renderQuiz() {
    const quiz = state.quiz;
    const question = currentQuestion();
    const response = currentResponse();
    const result = quiz.checked ? evaluate(question, response) : null;
    const tone = result ? (result.full ? "good" : result.earned > 0 ? "partial" : "bad") : "";
    const answered = isAnswered(question, response);
    const percent = Math.round(((quiz.index + 1) / quiz.questions.length) * 100);
    const saved = progress.questions[question.id] && progress.questions[question.id].starred;

    return `
      ${htmlHeader("quiz")}
      <main class="screen quiz-shell">
        <section class="quiz-top">
          <div class="quiz-meta">
            <button class="plain-btn" data-action="quit-quiz">Exit</button>
            <div>
              <div class="quiz-title">${escapeHtml(quiz.title)}</div>
              <div class="tiny">Item ${quiz.index + 1} of ${quiz.questions.length}</div>
            </div>
            <button class="icon-btn" data-action="toggle-star" data-id="${escapeHtml(question.id)}" aria-label="Save question">${saved ? "Saved" : "Save"}</button>
          </div>
          <div class="progress-track"><span class="progress-fill" style="--value:${percent}%"></span></div>
        </section>
        <article class="quiz-card ${quiz.checked ? `is-checked is-${tone}` : ""}">
          ${quiz.checked ? `
            <div class="answer-burst" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
          ` : ""}
          <div class="q-tags">
            <span class="tag domain">${quiz.hideDomain && !quiz.checked ? "Domain hidden" : domainLabels[question.domain]}</span>
            <span class="tag type">${typeLabels[question.type]}</span>
            <span class="tag ${question.verified ? "verified" : "generated"}">${question.verified ? "Core concept" : "Practice variant"}</span>
          </div>
          <div class="question-stem" data-html="${escapeHtml(question.stem)}"></div>
          ${question.imageRhythm && rhythmAssets[question.imageRhythm] ? `
            <div class="strip-wrap" style="margin-top:14px">
              <button data-action="zoom-image" data-src="${rhythmAssets[question.imageRhythm]}" aria-label="Open rhythm strip">
                <img src="${rhythmAssets[question.imageRhythm]}" alt="Rhythm strip" loading="lazy" />
              </button>
            </div>
          ` : ""}
          ${renderAnswerControl(question, response, quiz.checked)}
          ${quiz.checked && result ? renderFeedback(question, response, result) : ""}
        </article>
      </main>
      <div class="quiz-actions ${quiz.checked || quiz.mode === "exam" ? "" : "single"}">
        ${quiz.checked ? `<button class="secondary-btn" data-action="review-current">Review notes</button>` : ""}
        ${quiz.mode === "practice" && !quiz.checked ? `<button class="primary-btn" data-action="check-answer" ${answered ? "" : "disabled"}>Check answer</button>` : ""}
        ${quiz.mode === "exam" ? `<button class="primary-btn wide" data-action="next-question" ${answered ? "" : "disabled"}>${quiz.index + 1 === quiz.questions.length ? "Finish round" : "Next item"}</button>` : ""}
        ${quiz.checked ? `<button class="primary-btn" data-action="next-question">${quiz.index + 1 === quiz.questions.length ? "See results" : "Next item"}</button>` : ""}
      </div>
    `;
  }

  function renderAnswerControl(question, response, locked) {
    if (question.type === "mc" || question.type === "sata") {
      const selected = new Set(response || []);
      const correct = new Set(question.correct || []);
      return `
        <div class="options ${question.type === "sata" ? "sata" : ""}">
          ${question.options.map((option) => {
            const isSelected = selected.has(option.id);
            const isCorrect = correct.has(option.id);
            const classes = [
              "option-btn",
              isSelected ? "selected" : "",
              locked && isCorrect ? "correct" : "",
              locked && isSelected && !isCorrect ? "wrong" : ""
            ].filter(Boolean).join(" ");
            return `
              <button class="${classes}" data-action="choose-answer" data-id="${escapeHtml(option.id)}" ${locked ? "disabled" : ""}>
                <span class="mark">${isSelected ? "" : ""}</span>
                <span class="option-text" data-html="${escapeHtml(option.text)}"></span>
              </button>
            `;
          }).join("")}
          ${question.type === "sata" ? `<p class="count-note">Select all that apply. Partial credit is scored by option.</p>` : ""}
        </div>
      `;
    }

    if (question.type === "cloze") {
      const map = response || {};
      return `
        <div class="options">
          ${question.blanks.map((blank, index) => `
            <div class="select-row">
              <label for="${blank.key}">Blank ${index + 1}</label>
              <select id="${blank.key}" data-action="select-cloze" data-key="${escapeHtml(blank.key)}" ${locked ? "disabled" : ""}>
                <option value="">Choose</option>
                ${blank.options.map((option) => `
                  <option value="${escapeHtml(option.id)}" ${map[blank.key] === option.id ? "selected" : ""}>${escapeHtml(toText(option.text))}</option>
                `).join("")}
              </select>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (question.type === "matching") {
      const map = response || {};
      return `
        <div class="options">
          ${question.leftPrompts.map((prompt) => `
            <div class="select-row">
              <label>${escapeHtml(toText(prompt.text))}</label>
              <select data-action="select-match" data-key="${escapeHtml(prompt.id)}" ${locked ? "disabled" : ""}>
                <option value="">Choose match</option>
                ${question.rightOptions.map((option) => `
                  <option value="${escapeHtml(option.id)}" ${map[prompt.id] === option.id ? "selected" : ""}>${escapeHtml(toText(option.text))}</option>
                `).join("")}
              </select>
            </div>
          `).join("")}
        </div>
      `;
    }

    return "";
  }

  function renderFeedback(question, response, result) {
    const tone = result.full ? "good" : result.earned > 0 ? "partial" : "bad";
    const label = result.full ? "Correct" : result.earned > 0 ? "Partially correct" : "Incorrect";
    const coach = getCoachImage(question, tone);
    return `
      <section class="feedback ${tone}">
        <div class="coach-callout">
          <div class="coach-top">
            <img class="coach-img" src="${coach.src}" alt="${coach.alt}" loading="lazy" decoding="async" />
            <div class="coach-copy">
              <span class="coach-kicker">Professor Tecson says</span>
              <h3>${label} · ${result.earned.toFixed(result.earned % 1 ? 1 : 0)} / ${result.max.toFixed(result.max % 1 ? 1 : 0)}</h3>
            </div>
          </div>
          <div class="rationale" data-html="${escapeHtml(question.rationale)}"></div>
        </div>
        <div class="answer-recap">
          <div class="answer-line"><strong>Correct answer:</strong> ${escapeHtml(answerText(question))}</div>
          ${response ? `<div class="answer-line"><strong>Your answer:</strong> ${escapeHtml(answerText(question, response))}</div>` : ""}
          ${question.verified ? "" : `<div class="answer-line">Practice variant. Use the rationale to study the concept; this is not an exam item.</div>`}
        </div>
      </section>
    `;
  }

  function renderResults() {
    const quiz = state.quiz;
    const results = quiz.results || [];
    const earned = results.reduce((sum, item) => sum + item.result.earned, 0);
    const max = results.reduce((sum, item) => sum + item.result.max, 0);
    const pct = max ? Math.round((earned / max) * 100) : 0;
    const byDomain = {};
    results.forEach((item) => {
      const domain = item.question.domain;
      byDomain[domain] = byDomain[domain] || { earned: 0, max: 0, count: 0 };
      byDomain[domain].earned += item.result.earned;
      byDomain[domain].max += item.result.max;
      byDomain[domain].count += 1;
    });
    const weakest = Object.entries(byDomain)
      .map(([domain, item]) => ({ domain, pct: item.max ? Math.round((item.earned / item.max) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct)[0];

    return `
      ${htmlHeader("results")}
      <main class="screen">
        <section class="result-hero">
          <span class="result-score">${pct}%</span>
          <p>${earned.toFixed(earned % 1 ? 1 : 0)} of ${max.toFixed(max % 1 ? 1 : 0)} points · ${results.length} items</p>
        </section>
        <section>
          <div class="section-head">
            <h2>Domain breakdown</h2>
          </div>
          <div class="result-grid">
            ${Object.entries(byDomain).map(([domain, item]) => {
              const domainPct = item.max ? Math.round((item.earned / item.max) * 100) : 0;
              return `
                <button class="domain-card" data-action="domain-practice" data-domain="${escapeHtml(domain)}">
                  <span>
                    <h3>${domainLabels[domain]}</h3>
                    <p>${item.count} items · ${domainPct}%</p>
                    <span class="progress-track"><span class="progress-fill" style="--value:${domainPct}%"></span></span>
                  </span>
                  <span class="domain-meter">${domainPct}%</span>
                </button>
              `;
            }).join("")}
          </div>
        </section>
        <section class="quick-grid" style="margin-top:16px">
          ${weakest ? `<button class="secondary-btn" data-action="domain-practice" data-domain="${escapeHtml(weakest.domain)}">Drill ${domainLabels[weakest.domain]}</button>` : ""}
          <button class="primary-btn" data-action="quick-start">New quick round</button>
        </section>
        <section>
          <div class="section-head"><h2>Review this round</h2></div>
          <div class="saved-list">
            ${results.map((item) => `
              <button class="saved-row" data-action="review-result" data-id="${escapeHtml(item.question.id)}">
                <span>
                  <strong>${item.result.full ? "Correct" : item.result.earned > 0 ? "Partial" : "Missed"} · ${domainLabels[item.question.domain]}</strong>
                  <p>${escapeHtml(toText(item.question.stem).slice(0, 120))}${toText(item.question.stem).length > 120 ? "..." : ""}</p>
                </span>
                <span class="tag ${item.result.full ? "verified" : "generated"}">${Math.round((item.result.earned / item.result.max) * 100)}%</span>
              </button>
            `).join("")}
          </div>
        </section>
      </main>
    `;
  }

  function renderModal() {
    if (!state.modalImage) return "";
    return `
      <div class="modal" data-action="close-modal">
        <img src="${escapeHtml(state.modalImage)}" alt="Enlarged rhythm strip" />
      </div>
    `;
  }

  function render() {
    let html = "";
    if (state.view === "practice") html = renderPractice();
    else if (state.view === "review") html = renderReview();
    else if (state.view === "saved") html = renderSaved();
    else if (state.view === "quiz") html = renderQuiz();
    else if (state.view === "results") html = renderResults();
    else html = renderHome();
    app.innerHTML = html + renderModal();
    renderHtmlBlocks(app);
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action], [data-nav]");
    if (!target) return;
    const action = target.dataset.action;

    if (target.dataset.nav) {
      setView(target.dataset.nav);
      return;
    }

    if (action === "quick-start") {
      state.setupMode = "practice";
      state.setupDomain = "all";
      state.setupTypes = new Set(["mc", "sata", "cloze", "matching"]);
      state.verifiedOnly = false;
      startRound({ length: 10, title: "Quick 10" });
    }

    if (action === "exam-start") {
      state.setupMode = "exam";
      state.setupDomain = "all";
      state.setupTypes = new Set(["mc", "sata", "cloze", "matching"]);
      state.verifiedOnly = false;
      startRound({ length: 20, mode: "exam", title: "Exam mode" });
    }

    if (action === "weak-start") {
      const weakest = domains()
        .map((domain) => ({ domain, ...domainStats(domain) }))
        .filter((item) => item.answered > 0)
        .sort((a, b) => a.accuracy - b.accuracy)[0];
      if (weakest) {
        state.setupDomain = weakest.domain;
        state.setupMode = "practice";
        startRound({ length: 10, title: domainLabels[weakest.domain] });
      }
    }

    if (action === "review-rhythms") {
      state.view = "review";
      state.reviewDomain = "Dysrhythmias";
      render();
    }

    if (action === "domain-practice") {
      state.setupDomain = target.dataset.domain;
      state.setupMode = "practice";
      state.setupTypes = new Set(["mc", "sata", "cloze", "matching"]);
      state.verifiedOnly = false;
      startRound({ length: 10, title: domainLabels[state.setupDomain] });
    }

    if (action === "set-mode") {
      state.setupMode = target.dataset.mode;
      render();
    }

    if (action === "set-domain") {
      state.setupDomain = target.dataset.domain;
      render();
    }

    if (action === "toggle-type") {
      const type = target.dataset.type;
      if (state.setupTypes.has(type) && state.setupTypes.size > 1) state.setupTypes.delete(type);
      else state.setupTypes.add(type);
      render();
    }

    if (action === "set-length") {
      state.setupLength = target.dataset.length === "all" ? "all" : Number(target.dataset.length);
      render();
    }

    if (action === "start-setup") {
      startRound();
    }

    if (action === "open-review") {
      state.reviewDomain = target.dataset.domain;
      state.reviewTopic = null;
      window.scrollTo({ top: 0 });
      render();
    }

    if (action === "open-review-topic") {
      state.reviewDomain = target.dataset.domain;
      state.reviewTopic = target.dataset.topic;
      window.scrollTo({ top: 0 });
      render();
    }

    if (action === "back-review") {
      state.reviewDomain = null;
      state.reviewTopic = null;
      render();
    }

    if (action === "back-review-domain") {
      state.reviewTopic = null;
      render();
    }

    if (action === "quiz-review-domain") {
      state.setupDomain = target.dataset.domain;
      state.setupMode = "practice";
      startRound({ length: 10, title: domainLabels[state.setupDomain] });
    }

    if (action === "choose-answer") {
      const question = currentQuestion();
      if (state.quiz.checked) return;
      const id = target.dataset.id;
      if (question.type === "mc") {
        setResponse(question, [id]);
      } else {
        const selected = new Set(currentResponse() || []);
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        setResponse(question, [...selected]);
      }
    }

    if (action === "check-answer") {
      const question = currentQuestion();
      const response = currentResponse();
      const result = evaluate(question, response);
      if (!state.quiz.recordedIds.has(question.id)) {
        recordQuestion(question, result, response);
        state.quiz.recordedIds.add(question.id);
        saveProgress();
      }
      state.quiz.checked = true;
      render();
    }

    if (action === "next-question") {
      const quiz = state.quiz;
      if (quiz.index + 1 >= quiz.questions.length) {
        finishRound();
      } else {
        quiz.index += 1;
        quiz.checked = false;
        window.scrollTo({ top: 0 });
        render();
      }
    }

    if (action === "quit-quiz") {
      state.quiz = null;
      setView("home");
    }

    if (action === "toggle-star") {
      const id = target.dataset.id;
      progress.questions[id] = progress.questions[id] || { attempts: 0, earned: 0, max: 0, missed: false };
      progress.questions[id].starred = !progress.questions[id].starred;
      saveProgress();
      render();
    }

    if (action === "review-current") {
      const question = currentQuestion();
      state.view = "review";
      state.reviewDomain = question.domain;
      state.reviewTopic = null;
      render();
    }

    if (action === "single-question") {
      const question = questions.find((item) => item.id === target.dataset.id);
      if (question) startRound({ pool: [question], length: "all", title: "Saved question" });
    }

    if (action === "start-saved") {
      const ids = Object.entries(progress.questions || {})
        .filter(([, item]) => item.starred || item.missed)
        .map(([id]) => id);
      const pool = ids.map((id) => questions.find((q) => q.id === id)).filter(Boolean);
      startRound({ pool, length: "all", title: "Saved and missed" });
    }

    if (action === "review-result") {
      const result = state.quiz.results.find((item) => item.question.id === target.dataset.id);
      if (!result) return;
      state.quiz.questions = [result.question];
      state.quiz.index = 0;
      state.quiz.responses = { [result.question.id]: result.response };
      state.quiz.checked = true;
      state.view = "quiz";
      render();
    }

    if (action === "zoom-image") {
      state.modalImage = target.dataset.src;
      render();
    }

    if (action === "close-modal") {
      state.modalImage = null;
      render();
    }
  }

  function handleChange(event) {
    const action = event.target.dataset.action;
    if (action === "verified-only") {
      state.verifiedOnly = event.target.checked;
      render();
    }
    if (action === "select-cloze") {
      const question = currentQuestion();
      const response = { ...(currentResponse() || {}) };
      if (event.target.value) response[event.target.dataset.key] = event.target.value;
      else delete response[event.target.dataset.key];
      setResponse(question, response);
    }
    if (action === "select-match") {
      const question = currentQuestion();
      const response = { ...(currentResponse() || {}) };
      if (event.target.value) response[event.target.dataset.key] = event.target.value;
      else delete response[event.target.dataset.key];
      setResponse(question, response);
    }
  }

  function handleInput(event) {
    if (event.target.dataset.action === "search-review") {
      state.search = event.target.value;
      render();
      const input = app.querySelector("[data-action='search-review']");
      if (input) {
        input.focus();
        input.setSelectionRange(state.search.length, state.search.length);
      }
    }
  }

  app.addEventListener("click", handleClick);
  app.addEventListener("change", handleChange);
  app.addEventListener("input", handleInput);
  render();
})();
