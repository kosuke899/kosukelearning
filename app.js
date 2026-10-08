(() => {
  "use strict";

  const STORAGE = {
    progress: "learn.progress.v1",
    notes: "learn.notes.v1",
    chat: "learn.chat.v1",
    users: "learn.local-users.v1",
    session: "learn.local-session.v1",
  };
  const emojiOptions = ["🌱", "🦊", "🐼", "🐸", "🐱", "🐶", "🦋", "🐧", "🐻", "🐯", "🐨", "🦉", "🐙", "🌻", "⭐", "🚀"];
  const subjects = {
    Maths: {
      emoji: "🔢", color: "#edf3ff", description: "From number sense to the beautiful ideas behind calculus.",
      tracks: {
        basics: ["Counting & number sense", "Addition and subtraction", "Multiplication patterns", "Division in everyday life", "Fractions as parts", "Decimals & place value", "Shapes & geometry", "Measuring the world", "Patterns & early algebra", "Graphs and simple data"],
        medium: ["Number systems & estimation", "Fractions, ratios & rates", "Expressions & equations", "Linear relationships", "Geometry & proof", "Statistics & distributions", "Probability & counting", "Quadratics & polynomials", "Trigonometry & functions", "Sequences & mathematical models"],
        advanced: ["Logic, sets & proof", "Linear algebra & vectors", "Real analysis foundations", "Multivariable calculus", "Differential equations", "Abstract algebra", "Probability theory", "Numerical methods", "Topology & structure", "Optimization & applications"],
      },
    },
    "Computer Science": {
      emoji: "💻", color: "#eaf4f2", description: "Learn how software, algorithms, and the internet really work.",
      tracks: {
        basics: ["What computers do", "Files & the internet", "Algorithms in daily life", "Your first code concepts", "Variables & simple values", "Decisions in a program", "Loops & repetition", "Functions & reusable steps", "Debugging with care", "Make a tiny project"],
        medium: ["Data & computational thinking", "Programming fundamentals", "Functions & modular code", "Lists & collections", "Algorithms & efficiency", "Web foundations", "Databases & queries", "Networks & protocols", "Testing & debugging", "Build a complete project"],
        advanced: ["Discrete math & logic", "Algorithm design & analysis", "Data structures", "Operating systems", "Computer architecture", "Databases & distributed systems", "Networks & security principles", "Programming language theory", "Machine learning foundations", "Research & capstone project"],
      },
    },
    English: {
      emoji: "📚", color: "#f6edfa", description: "Build confidence in reading, writing, grammar, and great ideas.",
      tracks: {
        basics: ["Sounds, letters & words", "Build clear sentences", "Everyday punctuation", "Nouns & naming words", "Verbs & action words", "Adjectives & description", "Read for the main idea", "Write a short paragraph", "Tell a simple story", "Share your ideas clearly"],
        medium: ["Parts of speech in context", "Sentence structure & variety", "Grammar & agreement", "Vocabulary from context", "Reading between the lines", "Paragraphs that flow", "Persuasive writing", "Stories & character", "Research & reliable sources", "Edit with confidence"],
        advanced: ["Close reading & textual analysis", "Rhetoric & argument", "Advanced grammar & style", "Poetry & form", "Literary theory", "Academic research methods", "Critical essays", "Comparative literature", "Language & linguistics", "Independent scholarly project"],
      },
    },
    Science: {
      emoji: "🔬", color: "#fbf1e6", description: "Explore life, matter, forces, our planet, and the universe.",
      tracks: {
        basics: ["Ask a scientific question", "Observe & measure", "Matter all around us", "Living things & habitats", "Forces that move us", "Our changing planet", "The Sun, Moon & stars", "Simple experiments", "Patterns in nature", "Share what you discovered"],
        medium: ["Cells & living systems", "Atoms, elements & reactions", "Motion, forces & energy", "Earth systems & climate", "Space & the solar system", "Experiments & variables", "Genetics & inheritance", "Waves, light & sound", "Ecosystems & biodiversity", "Evidence-based explanations"],
        advanced: ["Cell & molecular biology", "Chemical bonds & kinetics", "Classical mechanics", "Electricity & magnetism", "Evolution & population genetics", "Earth, climate & geophysics", "Quantum & modern physics", "Research design & statistics", "Scientific papers & peer review", "Interdisciplinary capstone"],
      },
    },
  };
  const levels = {
    basics: { label: "Super basics", subtitle: "Start right at the beginning", suffix: "Step by step, with no experience needed." },
    medium: { label: "Medium", subtitle: "Build on what you know", suffix: "Strengthen your understanding with guided practice." },
    advanced: { label: "University or higher", subtitle: "Go deeper and think critically", suffix: "Work through advanced ideas, examples, and applications." },
  };
  const navItems = [
    ["home", "⌂", "Home"], ["learn", "▦", "Learn"], ["learnGPT", "✳", "learnGPT"],
    ["notes", "▤", "Notes"], ["league", "♛", "Weekly league"], ["people", "⌕", "Find people"], ["shop", "◇", "Shop"],
  ];
  const defaultState = {
    page: "home", profile: null, progress: {}, notes: { title: "", text: "", image: "" },
    chat: [], league: { week: "", points: 0, quizDone: false, answers: [], lessons: [], claimedChallenges: [], pendingBonusPoints: 0 }, owned: ["theme-garden"],
    subject: "", level: "basics", day: null, noteTool: "pen", modal: "", modalMode: "signup",
    selectedEmoji: emojiOptions[0], selectedAnswer: null, quizActive: false,
    quizQuestionIndex: 0, quizScore: 0, quizAnswer: null,
    spinningPrize: false, prizeResult: null, toast: "",
  };
  let state = { ...defaultState };
  let toastTimer;
  const root = document.getElementById("app");

  function getItem(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      notify("Could not save on this device. Check your browser storage settings.");
      return false;
    }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }
  function weekKey() {
    const now = new Date();
    const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }
  function loadState() {
    state.users = getItem(STORAGE.users, []);
    state.progress = getItem(STORAGE.progress, {});
    state.notes = getItem(STORAGE.notes, { title: "", text: "", image: "" });
    state.chat = getItem(STORAGE.chat, []);
    const username = getItem(STORAGE.session, "");
    state.profile = state.users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null;
    if (state.profile) {
      settleExpiredWeeks();
      state.progress = getItem(`${STORAGE.progress}.${state.profile.id}`, {});
      state.profile = state.users.find((user) => user.id === state.profile.id);
      state.league = state.profile.weekly;
      state.owned = ["theme-garden", ...(state.profile.inventory || [])];
    }
    applyTheme();
  }
  function persistUsers() { return saveItem(STORAGE.users, state.users); }
  function tierName(tier) { return leagueTiers[tier - 1] || "Bronze"; }
  function settleExpiredWeeks() {
    const currentWeek = weekKey();
    const oldWeeks = [...new Set(state.users.map((user) => user.weekly?.week).filter((week) => week && week < currentWeek))].sort();
    for (const week of oldWeeks) {
      const playersByTier = leagueTiers.map((_name, index) => state.users
        .filter((user) => user.weekly?.week === week && user.tier === index + 1)
        .sort((a, b) => (b.weekly.points || 0) - (a.weekly.points || 0) || a.username.localeCompare(b.username)));
      for (let tier = 1; tier <= 5; tier++) {
        const players = playersByTier[tier - 1];
        players.forEach((player, index) => {
          const rank = index + 1;
          const promoted = rank <= 5 && tier < 5;
          if (promoted) player.tier = tier + 1;
          player.weekly.lastResult = { rank, promoted };
          if (rank === 1) {
            const type = ["kuids", "skip_league", "bonus_points"][Math.floor(Math.random() * 3)];
            player.weekly.pendingPrize = { type, value: type === "kuids" ? 500 : type === "skip_league" ? 1 : 100 };
            if (type === "skip_league") player.tier = Math.min(5, tier + 2);
          }
        });
      }
    }
    state.users.forEach((user) => {
      if (user.weekly?.week !== currentWeek) {
        const pendingBonusPoints = user.weekly?.nextWeekBonusPoints || user.weekly?.pendingBonusPoints || 0;
        user.weekly = {
          week: currentWeek, points: pendingBonusPoints, quizDone: false, answers: [],
          lessons: [], claimedChallenges: [], pendingBonusPoints: 0, nextWeekBonusPoints: 0,
          pendingPrize: user.weekly?.pendingPrize || null, lastResult: user.weekly?.lastResult || null,
        };
      }
      user.tier = Math.max(1, Math.min(5, user.tier || 1));
      user.level = Math.max(1, user.level || 1);
      user.kuids = Math.max(0, user.kuids || 0);
      user.inventory ||= [];
      user.weekly.points ||= 0;
      user.weekly.answers ||= [];
      user.weekly.lessons ||= [];
      user.weekly.claimedChallenges ||= [];
      user.weekly.nextWeekBonusPoints ||= 0;
    });
    persistUsers();
  }
  function switchToProfile(profile) {
    state.profile = profile;
    state.league = profile.weekly;
    state.owned = ["theme-garden", ...(profile.inventory || [])];
    state.progress = getItem(`${STORAGE.progress}.${profile.id}`, {});
    const sessionSaved = saveItem(STORAGE.session, profile.username);
    applyTheme();
    return sessionSaved;
  }
  function updateProfile(change) {
    if (!state.profile) return false;
    const snapshot = JSON.parse(JSON.stringify(state.profile));
    change(state.profile, state.league);
    state.profile.weekly = state.league;
    if (persistUsers()) return true;
    Object.assign(state.profile, snapshot);
    state.league = state.profile.weekly;
    state.owned = ["theme-garden", ...(state.profile.inventory || [])];
    applyTheme();
    return false;
  }
  function persistProgress() {
    return state.profile ? saveItem(`${STORAGE.progress}.${state.profile.id}`, state.progress) : false;
  }
  function leagueBoard(tier = state.profile?.tier || 1) {
    return state.users
      .filter((user) => user.tier === tier)
      .map((user) => ({ username: user.username, emoji: user.emoji, points: user.weekly?.points || 0, level: user.level || 1, tier: user.tier, isYou: user.id === state.profile?.id }))
      .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));
  }
  function weeklyChallengeCards() {
    const weekly = state.league;
    const lessonCount = weekly.lessons.length;
    const subjectCount = new Set(weekly.lessons.map((lesson) => lesson.subject)).size;
    const correct = weekly.answers.filter((answer) => answer.correct).length;
    return [
      { id: "three-lessons", icon: "📖", title: "Three little lessons", detail: `${Math.min(lessonCount, 3)} of 3 new lessons completed`, current: lessonCount >= 3, reward: 20 },
      { id: "two-subjects", icon: "🌈", title: "Curious in two subjects", detail: `${Math.min(subjectCount, 2)} of 2 subjects explored`, current: subjectCount >= 2, reward: 20 },
      { id: "quiz-four", icon: "🧠", title: "A quiz to be proud of", detail: `${Math.min(correct, 4)} of 4 correct weekly quiz answers`, current: correct >= 4, reward: 25 },
    ].map((challenge) => ({ ...challenge, claimed: weekly.claimedChallenges.includes(challenge.id) }));
  }
  function makeId() {
    return globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  function createSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  async function hashPassword(password, salt) {
    if (!globalThis.crypto?.subtle) throw new Error("Secure sign-in needs a modern browser on HTTPS or localhost.");
    const bytes = new TextEncoder().encode(password);
    const saltBytes = new Uint8Array(salt.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
    const key = await crypto.subtle.importKey("raw", bytes, "PBKDF2", false, ["deriveBits"]);
    const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: 150000, hash: "SHA-256" }, key, 256);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function profileSearchHTML() {
    const query = state.profileSearch || "";
    const matches = state.users
      .filter((user) => user.id !== state.profile?.id)
      .filter((user) => !query || user.username.toLowerCase().includes(query.toLowerCase()) || String(user.level || 1) === query || tierName(user.tier).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (b.level || 1) - (a.level || 1) || a.username.localeCompare(b.username));
    return `<span class="eyebrow">Find a learner</span><h1 class="page-title">Search profiles.</h1><p class="page-subtitle">Look up usernames, learning levels, and leagues saved on this device.</p>
      <input id="profile-search" class="notes-title" type="search" value="${escapeAttr(query)}" placeholder="Search a username, level, or league…" aria-label="Search local profiles">
      <div class="empty-state" style="margin-top:12px">These are profiles created on this browser only. Without an online service, you can't search for people using other devices.</div>
      <div class="leaderboard" id="profile-search-results" style="margin-top:15px">${profileSearchRows(matches)}</div>`;
  }
  function profileSearchRows(matches) {
    return matches.length ? matches.map((user) => `<div class="leader-row"><span>${escapeHTML(user.emoji)}</span><span>${escapeHTML(user.username)} <small style="display:block;color:#88918b;margin-top:3px">Level ${user.level || 1} · ${tierName(user.tier)}</small></span><span class="leader-score">Level ${user.level || 1}</span></div>`).join("") : `<div class="empty-state">${state.users.length <= 1 ? "No other local profiles yet. Create another account in this browser to try profile search." : "No profiles match that search."}</div>`;
  }
  function updateProfileSearch(query) {
    state.profileSearch = query;
    const matches = state.users
      .filter((user) => user.id !== state.profile?.id)
      .filter((user) => !query || user.username.toLowerCase().includes(query.toLowerCase()) || String(user.level || 1) === query || tierName(user.tier).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (b.level || 1) - (a.level || 1) || a.username.localeCompare(b.username));
    const results = document.getElementById("profile-search-results");
    if (results) results.innerHTML = profileSearchRows(matches);
  }
  function notify(message) {
    state.toast = message;
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.append(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 3000);
  }
  function applyTheme() {
    const theme = state.profile?.theme || "garden";
    document.body.dataset.theme = theme === "garden" ? "" : theme;
  }
  function escapeAttr(value) { return escapeHTML(value); }
  function navHTML(mobile = false) {
    return `<nav class="${mobile ? "mobile-nav" : "nav-list"}" aria-label="${mobile ? "Mobile navigation" : "Main navigation"}">
      ${navItems.map(([id, icon, label]) => `<button class="nav-item ${state.page === id ? "active" : ""}" data-page="${id}" aria-current="${state.page === id ? "page" : "false"}"><span class="nav-icon">${icon}</span><span class="nav-text">${label}</span></button>`).join("")}
    </nav>`;
  }
  function sidebarHTML() {
    const profile = state.profile;
    return `<aside class="sidebar">
      <div class="brand"><span class="brand-mark">l</span><span class="brand-word">learn<span class="brand-period">.</span></span></div>
      <p class="nav-label">Your space</p>${navHTML()}
      <div class="sidebar-bottom"><div class="profile-mini">
        <button class="avatar" data-action="profile-or-signin" aria-label="Open profile">${profile ? escapeHTML(profile.emoji) : "👋"}</button>
        <div class="profile-mini-copy"><strong>${profile ? escapeHTML(profile.username) : "Your account"}</strong><small>${profile ? `${profile.kuids} Kuids` : "Sign in to save progress"}</small></div>
      </div></div>
    </aside>`;
  }
  function topbarHTML() {
    const profile = state.profile;
    return `<header class="topbar">
      <span class="streak-pill" title="Lessons completed">✨ ${totalDone()} day${totalDone() === 1 ? "" : "s"} learned</span>
      <span class="currency-pill"><span>●</span> ${profile ? profile.kuids : 0} Kuids</span>
      <button class="avatar top-avatar" data-action="profile-or-signin" aria-label="Open profile">${profile ? escapeHTML(profile.emoji) : "👋"}</button>
    </header>`;
  }
  function footerHTML() { return `<footer class="footer-credit">Made for curious minds <span aria-label="with love">✳</span> <span>by Kosuke</span></footer>`; }
  function shellHTML(content) {
    return `<div class="app-shell">${sidebarHTML()}<main class="main-area">${topbarHTML()}<section class="content">${content}${footerHTML()}</section></main>${navHTML(true)}${state.modal ? modalHTML() : ""}${state.prizeResult ? prizeModalHTML() : ""}</div>`;
  }
  function currentUser() { return state.profile; }
  function totalDone() { return Object.values(state.progress).filter((value) => value === true).length; }
  function lessonKey(subject = state.subject, level = state.level, day = state.day) {
    return `${subject}|${level}|${day}`;
  }
  function subjectTiles(featured = false) {
    return Object.entries(subjects).map(([name, item]) => `<article class="subject-card ${featured ? "clickable" : ""}" style="--subject-bg:${item.color}">
      ${featured ? `<button class="card-hit" data-action="open-subject" data-subject="${escapeAttr(name)}" aria-label="Explore ${escapeAttr(name)}"></button>` : ""}
      <div class="subject-card-content"><span class="subject-emoji">${item.emoji}</span><h3>${escapeHTML(name)}</h3><p>${item.description}</p>${featured ? `<span class="subject-arrow" aria-hidden="true">↗</span>` : ""}</div>
    </article>`).join("");
  }
  function homeHTML() {
    const profile = currentUser();
    const name = profile ? escapeHTML(profile.username) : "curious learner";
    const last = state.progress.lastLesson;
    const lastData = last ? makeLesson(last.subject, last.level, last.day) : null;
    return `<div class="welcome-banner"><div class="welcome-copy">
      <span class="eyebrow">A little better every day</span>
      <h1>${profile ? `Good to see you, ${name}.` : "Make today a day you learn something."}</h1>
      <p>A calmer corner of the internet to explore ideas, build skills, and follow your curiosity.</p>
      <div class="banner-actions"><button class="primary-btn" data-action="open-learn">Find your next lesson <span>↗</span></button>
      ${profile ? "" : `<button class="secondary-btn" data-action="open-auth">Get started — it's free</button>`}</div>
    </div></div>
    <div class="stat-grid">
      <article class="stat-card"><span class="stat-icon">📖</span><div><strong>${totalDone()}</strong><small>Lessons completed</small></div></article>
      <article class="stat-card"><span class="stat-icon">🪙</span><div><strong>${profile ? profile.kuids : 0}</strong><small>Kuids earned</small></div></article>
      <article class="stat-card"><span class="stat-icon">🏅</span><div><strong>${profile ? tierName(profile.tier) : "—"}</strong><small>${profile ? "Current league" : "Your league"}</small></div></article>
    </div>
    <div class="section-heading"><div><h2>${lastData ? "Pick up where you left off" : "Choose what sparks your curiosity"}</h2><p>${lastData ? "Your learning journey is ready whenever you are." : "Every subject has a whole world to explore."}</p></div></div>
    ${lastData ? `<div class="card continue-card"><div><span class="eyebrow">Your latest course · Day ${last.day}</span><h3>${escapeHTML(last.subject)}: ${escapeHTML(lastData.title)}</h3><span style="font-size:11px;color:#879087">${levels[last.level].label}</span></div><button class="soft-btn button-small" data-action="resume-lesson">Continue →</button></div>
      <div class="section-heading"><div><h2>Explore more</h2><p>Four subjects. Three levels. 100 days of discovery.</p></div><button class="text-link" data-action="open-learn">See all courses →</button></div>${subjectTiles(true)}`
      : `<div class="subject-grid">${subjectTiles(true)}</div>
      <div class="section-heading"><div><h2>Your learning toolkit</h2><p>Everything you need to make learning your own.</p></div></div>
      <div class="card-grid">
        <button class="card secondary-btn" data-page="learnGPT" style="justify-content:flex-start;height:76px;text-align:left"><span style="font-size:20px">✳</span><span><strong style="display:block;font-size:13px">Ask learnGPT</strong><small style="color:#89928a;font-size:10px">Explore a question together</small></span></button>
        <button class="card secondary-btn" data-page="notes" style="justify-content:flex-start;height:76px;text-align:left"><span style="font-size:20px">✏️</span><span><strong style="display:block;font-size:13px">Open your notes</strong><small style="color:#89928a;font-size:10px">Sketch it, write it, save it</small></span></button>
        <button class="card secondary-btn" data-page="league" style="justify-content:flex-start;height:76px;text-align:left"><span style="font-size:20px">🏆</span><span><strong style="display:block;font-size:13px">Weekly league</strong><small style="color:#89928a;font-size:10px">Take a quick weekly challenge</small></span></button>
      </div>`}`;
  }
  function learnHTML() {
    const selected = state.subject && subjects[state.subject];
    if (!selected) return `<span class="eyebrow">Learn by doing</span><h1 class="page-title">A world of ideas, one day at a time.</h1><p class="page-subtitle">Choose a subject to explore. Each self-paced course gives you 100 bite-sized lessons and a clear path to follow.</p><div class="subject-grid">${subjectTiles(true)}</div>`;
    const track = selected.tracks[state.level];
    const completed = Array.from({ length: 100 }, (_, i) => state.progress[lessonKey(state.subject, state.level, i + 1)]).filter(Boolean).length;
    return `<button class="back-link" data-action="back-subjects">← All subjects</button><span class="eyebrow">${selected.emoji} ${escapeHTML(state.subject)}</span><h1 class="page-title">${escapeHTML(levels[state.level].label)}</h1><p class="page-subtitle">${escapeHTML(levels[state.level].subtitle)}. ${escapeHTML(levels[state.level].suffix)}</p>
    <div class="level-tabs" role="tablist" aria-label="Course level">${Object.entries(levels).map(([id, level]) => `<button role="tab" aria-selected="${id === state.level}" class="level-tab ${id === state.level ? "selected" : ""}" data-action="set-level" data-level="${id}">${level.label}</button>`).join("")}</div>
    <div class="course-summary"><div><strong>100 days of ${escapeHTML(state.subject)}</strong><br><span>${completed} of 100 lessons completed · Complete any day at your own pace</span></div><div style="min-width:105px"><div class="progress-track"><span style="width:${completed}%"></span></div></div></div>
    <div class="day-grid">${Array.from({ length: 100 }, (_, i) => i + 1).map((day) => {
      const done = state.progress[lessonKey(state.subject, state.level, day)];
      return `<button class="day-card ${done ? "done" : ""}" data-action="open-day" data-day="${day}" aria-label="Day ${day}: ${escapeAttr(makeLesson(state.subject, state.level, day).title)}${done ? ", completed" : ""}"><span class="day-number">DAY ${String(day).padStart(2, "0")}</span><span class="day-name">${escapeHTML(makeLesson(state.subject, state.level, day).title)}</span><span class="day-status">${done ? "✓ Done" : "Start →"}</span></button>`;
    }).join("")}</div>`;
  }
  function makeLesson(subject, level, day) {
    const track = subjects[subject].tracks[level];
    const unitIndex = Math.floor((day - 1) / 10);
    const topic = track[unitIndex];
    const session = ((day - 1) % 10) + 1;
    const activity = [
      "meet the main idea", "notice a useful pattern", "try a worked example", "learn the key vocabulary", "make a prediction",
      "compare two approaches", "practice a new skill", "connect ideas together", "check your understanding", "put it all to use",
    ][session - 1];
    return {
      title: session === 1 ? topic : `${topic}: ${["the next step", "spot the pattern", "a closer look", "try it yourself", "think it through", "put it in context", "practice and reflect", "connect the dots", "check your progress"][session - 2]}`,
      topic, session, unit: unitIndex + 1,
      teaching: topicExplanation(subject, topic, level),
      practice: practiceActivity(subject, topic, session),
      question: lessonQuestion(subject, topic, session, level),
    };
  }
  function topicExplanation(subject, topic, level) {
    const explanations = {
      Maths: [
        [/fraction|decimal|ratio|rate/, "A ratio compares quantities, and a fraction shows one quantity divided by another. Keep units and equal-sized parts in mind, then check whether your answer makes sense."],
        [/equation|algebra|variable|polynomial/, "An equation says two expressions have the same value. You can keep that equality true by doing the same operation to both sides; substitute your result back to check it."],
        [/geometry|shape|trigonometry|vector|topology/, "Geometry studies shapes and how their parts relate. A sketch with clear labels often reveals which lengths, angles, or relationships you know and which you are trying to find."],
        [/probability|statistics|data/, "Statistics describes data; probability models how likely an outcome is. Look at how the data was gathered before deciding what it can tell you."],
        [/calculus|analysis|differential|optimization/, "Calculus studies change. A derivative describes an instantaneous rate of change; an integral can add up many small contributions. Start by naming the quantity that is changing."],
        [/graph|function|linear|model/, "A graph makes relationships visible. Read the axis labels and scale first; then look for how the output changes as the input changes."],
        [/logic|set|proof/, "A proof is a careful chain of reasons that establishes a claim. State what you know, name the rule you use, and make sure each step follows from the previous one."],
        [/sequence|pattern/, "A sequence follows a rule. Compare neighboring terms, describe how the sequence changes, and test your proposed rule on another term."],
        [/number|count|arithmetic|integer|real/, "Place value helps us make sense of numbers: each position represents a different power of ten. Estimation is a quick way to catch answers that are far too large or small."],
      ],
      "Computer Science": [
        [/algorithm|computational thinking/, "An algorithm is a precise set of steps for a task. Break the task into smaller actions, follow them on a tiny example, and check that every case is covered."],
        [/variable|programming|code|function|debug/, "Programs work with values and instructions. Give one input a name, follow how it changes, and test one small example before scaling up."],
        [/network|internet|protocol|web/, "Networks move information between devices in agreed formats. A request travels through layers of rules; each layer adds or reads information needed for delivery."],
        [/database|data|query|collection/, "A database organizes information so it can be found and updated. Choose fields that describe each record, and make your questions precise before retrieving data."],
        [/operating|architecture|computer/, "A computer combines hardware that stores and processes information with software that gives it instructions. Following one input from start to finish helps reveal each part's role."],
        [/test|debug|quality/, "A useful test checks one expected behavior and one important edge case. When something fails, make the example small enough that you can trace the exact step where the result changes."],
        [/efficiency|analysis|optimization|numerical/, "Algorithm efficiency describes how the resources used grow as input grows. Count the main repeated steps, then compare how that count changes when the input doubles."],
        [/security/, "Good security begins with reducing unnecessary access and checking inputs at trust boundaries. Explain what you are protecting and what could go wrong before selecting a defense."],
        [/machine learning|learning foundations/, "A learning system finds patterns in examples. Keep training examples separate from evaluation examples so you can tell whether the model learned a useful pattern or merely memorized."],
      ],
      English: [
        [/grammar|sentence|punctuation|parts of speech/, "A sentence expresses a complete thought. Find its subject and main verb first, then check that punctuation makes the relationships between ideas clear."],
        [/vocabulary|word/, "Use surrounding words to make a first guess about an unfamiliar word. Then check its parts and confirm that the meaning fits the full sentence."],
        [/read|textual analysis|literature|interpretation/, "Close reading means noticing the choices a writer makes and supporting your interpretation with details from the text. Separate what the text says from what you infer."],
        [/writing|essay|paragraph|argument|rhetoric|edit/, "Strong writing starts with a clear claim and evidence that supports it. Arrange one idea per paragraph, then revise for clarity before polishing individual words."],
        [/story|character|poetry|form/, "Writers use structure, voice, and imagery to shape what a reader notices. Point to a specific word or moment and explain the effect it creates."],
        [/research|source|scholarly|academic/, "Reliable research begins with a focused question and sources that show their evidence. Record where each idea came from and distinguish a source's claim from your own."],
        [/language|linguistics/, "Language has patterns that people use to communicate. Notice how meaning changes with word choice and context; describe the pattern before deciding what it means."],
      ],
      Science: [
        [/cell|living|biology|genetic|inheritance|evolution/, "Living things are made of organized systems that interact with their surroundings. In biology, explain a pattern by linking observations to a process rather than just naming it."],
        [/matter|atom|chemical|bond|reaction/, "Matter is made of atoms, and chemical changes rearrange them into different combinations. Keep track of the atoms before and after a change to see what has happened."],
        [/force|motion|mechanic|energy|electric|magnet|wave|light|quantum|physics/, "Physics connects measurements to patterns in motion, energy, and matter. Identify the objects, quantities, and units first; then decide which relationship fits the evidence."],
        [/earth|climate|geophysics|planet/, "Earth's systems interact over different timescales. Compare observations and measurements, and be careful to distinguish a short-term change from a long-term pattern."],
        [/space|solar system|astronomy|universe/, "Space science uses observations such as light and motion to investigate distant objects. Compare evidence from repeated observations before drawing a conclusion."],
        [/experiment|research|statistics|evidence/, "A fair investigation changes one factor at a time, measures a clear outcome, and records the method. Repeated observations help show whether a pattern is reliable."],
        [/ecosystem|habitat|biodiversity|ecology/, "An ecosystem includes living things and their environment. Trace how matter or energy moves between organisms, and notice how changing one part can affect others."],
      ],
    };
    const matched = explanations[subject].find(([pattern]) => pattern.test(topic));
    if (matched) return matched[1];
    return level === "advanced"
      ? `Start with a precise definition of ${topic.toLowerCase()}, state the assumptions you are making, and test the idea against a concrete example. Clear reasoning is more useful than memorizing a label.`
      : `Start with one clear example of ${topic.toLowerCase()}. Describe what you notice, connect it to the main idea, and explain it in your own words.`;
  }
  function practiceActivity(subject, topic, session) {
    const ideas = {
      Maths: ["Draw a small example and label every quantity.", "Estimate the answer first, then check by working it out.", "Change one number and predict what should happen.", "Explain the rule to a friend without using a formula."],
      "Computer Science": ["Trace the idea on paper with one small example.", "Write down the input, the steps, and the result.", "Try an unusual input and predict how it should behave.", "Describe one mistake a beginner might make and how to test for it."],
      English: ["Write a one-sentence explanation in your own words.", "Find an example in something you have read recently.", "Try a short version first, then make it clearer.", "Read your example aloud and notice what you would change."],
      Science: ["Write down one observation you could measure.", "Make a prediction, then name the evidence you would look for.", "Change one condition and predict what might happen.", "Explain the idea using something you have seen in everyday life."],
    };
    const activity = ideas[subject][(session - 1) % ideas[subject].length];
    return `${activity} Focus on ${topic.toLowerCase()}.`;
  }
  function lessonQuestion(subject, topic, session, level) {
    if (subject === "Maths") {
      if (level === "advanced") return {
        prompt: "Quick check: if f(x) = x², what is f′(x)?",
        options: ["2x", "x²", "x", "2"],
        correct: 0,
        why: "The power rule says d(xⁿ)/dx = n·xⁿ⁻¹. For x², that gives 2x.",
      };
      if (level === "medium") {
        const result = session + 2;
        const total = 3 * result + 2;
        return { prompt: `Quick check: solve 3x + 2 = ${total}.`, options: [`x = ${result}`, `x = ${result + 1}`, `x = ${result - 1}`, `x = ${total}`], correct: 0, why: `Subtract 2 from both sides and divide by 3: x = (${total} − 2) ÷ 3 = ${result}.` };
      }
      const a = session + 1;
      const b = session + 2;
      return { prompt: `Quick check: what is ${a} + ${b}?`, options: [`${a + b}`, `${a + b + 1}`, `${Math.abs(a - b)}`, `${a * b}`], correct: 0, why: `Add the two numbers: ${a} + ${b} = ${a + b}. Try drawing ${a} objects, then ${b} more.` };
    }
    if (subject === "Computer Science") return {
      prompt: `When you see “${topic},” what is the best first habit for a learner?`,
      options: ["Break the task into small steps and test an example", "Guess the final answer without checking", "Skip reading what the program is meant to do", "Change many things at once"],
      correct: 0, why: "Small steps and a tiny test case make it easier to understand what a computer is doing and spot mistakes.",
    };
    if (subject === "English") return {
      prompt: `When working on “${topic},” which approach will usually help you improve most?`,
      options: ["Read carefully, try it yourself, then revise", "Use complicated words wherever possible", "Skip the example and write without checking", "Assume the first draft needs no changes"],
      correct: 0, why: "Good reading and writing grows through careful examples, practice, and revision—not just making sentences longer.",
    };
    return {
      prompt: `A scientist exploring “${topic}” wants a trustworthy result. What should they do?`,
      options: ["Observe carefully and record evidence", "Pick only results that support a guess", "Change several variables without noting them", "Draw a conclusion before testing"],
      correct: 0, why: "Reliable science starts with careful observations, recorded evidence, and conclusions that fit the results.",
    };
  }
  function lessonHTML() {
    const lesson = makeLesson(state.subject, state.level, state.day);
    const questions = lesson.question;
    const done = state.progress[lessonKey()];
    return `<button class="back-link" data-action="back-course">← Back to ${escapeHTML(state.subject)} course</button>
      <span class="eyebrow">${subjects[state.subject].emoji} ${escapeHTML(state.subject)} · ${escapeHTML(levels[state.level].label)} · Day ${state.day} of 100</span>
      <article class="lesson-card"><h2>${escapeHTML(lesson.title)}</h2>
      <p>Today, we are looking at <strong>${escapeHTML(lesson.topic.toLowerCase())}</strong>—one small part of your learning journey. There is no rush. Start with what you know, look for one new idea, and give yourself space to be curious.</p>
      <div class="lesson-callout"><strong>Today's idea · Step ${lesson.session} of this topic</strong><p>${escapeHTML(lesson.teaching)} ${escapeHTML(levels[state.level].suffix)}</p></div>
      <p><strong>Try it:</strong> ${escapeHTML(lesson.practice)} Mistakes are a useful part of figuring things out.</p>
      <div class="lesson-question"><strong style="font-size:13px">${escapeHTML(questions.prompt)}</strong><div class="answer-options">${questions.options.map((answer, i) => `<button class="answer-option ${state.selectedAnswer === i ? (i === questions.correct ? "chosen-correct" : "chosen-wrong") : ""}" data-action="answer" data-answer="${i}" ${state.selectedAnswer !== null ? "disabled" : ""}>${escapeHTML(answer)}</button>`).join("")}</div>
      ${state.selectedAnswer === null ? "" : `<p class="feedback ${state.selectedAnswer === questions.correct ? "correct" : "incorrect"}" role="status">${state.selectedAnswer === questions.correct ? "Exactly right!" : "Not quite—here's a helpful hint."} ${escapeHTML(questions.why)}</p>`}</div>
      <div class="banner-actions"><button class="primary-btn" data-action="complete-day" ${done ? "disabled" : ""}>${done ? "✓ Lesson completed" : "Finish today's lesson · earn 10 Kuids"}</button><button class="secondary-btn" data-action="next-day" ${state.day >= 100 ? "disabled" : ""}>Next day →</button></div></article>`;
  }
  function chatHTML() {
    const seed = state.chat.length ? "" : `<div class="message">Hey${state.profile ? `, ${escapeHTML(state.profile.username)}` : ""}! I'm learnGPT, your study companion. Ask me a question, ask for an explanation, or tell me what you're learning. We'll work through it one step at a time. ✳</div>`;
    return `<span class="eyebrow">Your curious mind, meet your study buddy</span><h1 class="page-title">Ask away.</h1><p class="page-subtitle">Big question, tiny question, or “I don't get it yet”—let's figure it out together.</p>
    <div class="chat-layout"><section class="chat-panel" aria-label="learnGPT conversation"><div class="chat-top"><span class="chat-orb">✳</span><div><strong>learnGPT</strong><small>Your personal learning companion</small></div></div>
    <div class="chat-messages" id="chat-messages">${seed}${state.chat.map((item) => `<div class="message ${item.role === "user" ? "user" : ""}">${escapeHTML(item.text)}</div>`).join("")}</div>
    <form id="chat-form" class="chat-form"><input id="chat-input" autocomplete="off" maxlength="500" placeholder="Ask anything you're curious about…" aria-label="Your question" required><button aria-label="Send question" type="submit">↑</button></form></section>
    <aside class="chat-side"><h3>Not sure where to start?</h3><div class="suggestions-list">${[
      "Can you explain fractions simply?",
      "How does the internet work?",
      "What makes a good story?",
      "Why do we have seasons?",
    ].map((text) => `<button class="suggestion" data-action="suggest-question" data-question="${escapeAttr(text)}">${escapeHTML(text)} ↗</button>`).join("")}</div>
    <p class="chat-disclaimer">This prototype answers using built-in study guides; no live AI model is connected. Double-check important facts with a trusted source.</p></aside></div>`;
  }
  function localTutor(question) {
    const q = question.toLowerCase();
    let concept = "that question";
    let detail = "";
    if (/photosynth|plant|chlorophyll/.test(q)) {
      concept = "photosynthesis";
      detail = "Plants use light energy, water, and carbon dioxide to make sugars they can use for energy. Oxygen is released along the way. A simple version is: carbon dioxide + water + light → sugar + oxygen.";
    } else if (/fraction|numerator|denominator/.test(q)) {
      concept = "fractions";
      detail = "A fraction describes equal parts of a whole. The bottom number (denominator) tells you how many equal parts there are; the top number (numerator) tells you how many parts you mean. For example, 3/4 means three of four equal parts.";
    } else if (/gravity|fall|orbit/.test(q)) {
      concept = "gravity";
      detail = "Gravity is the attraction between objects with mass. Earth's gravity pulls objects toward its centre and keeps us on the ground; the same attraction helps keep the Moon in orbit.";
    } else if (/variable|program|code|python|algorithm/.test(q)) {
      concept = "computer science";
      detail = "A helpful way to understand a program is to break it into input, steps, and output. Trace one small example by hand: note the starting values, follow each instruction in order, and see what changes.";
    } else if (/grammar|verb|noun|sentence|writing|essay/.test(q)) {
      concept = "English";
      detail = "Start by identifying the main idea you want to communicate. Then make one clear sentence, check that its subject and verb agree, and read it aloud. Good writing values clarity before fancy vocabulary.";
    } else if (/equation|algebra|solve|math|calculate|percent|percentage/.test(q)) {
      concept = "maths";
      detail = "Take the problem one step at a time. Identify what you know, write down the operation or relationship connecting it to what you want to find, and check your answer by substituting it back in.";
    } else if (/atom|molecule|matter|chemical/.test(q)) {
      concept = "atoms and matter";
      detail = "Matter is made of tiny particles. An atom is the smallest unit of an element; atoms can join in specific combinations to form molecules. Chemical changes rearrange atoms into new substances.";
    } else if (/energy|force|motion|physics/.test(q)) {
      concept = "energy and motion";
      detail = "A good first step is to identify the objects involved and what changes. Forces can change an object's motion, and energy can move between forms or objects. Describe what you observe before choosing a formula.";
    } else if (/why|how|what|explain|teach|meaning/.test(q)) {
      concept = "your question";
      detail = "Begin by identifying the key idea or unfamiliar word. Try explaining it in one simple sentence, connect it to something familiar, and then test the explanation with a concrete example. Breaking a big question into smaller ones often makes it easier.";
    } else {
      detail = "Start by describing the idea in your own words. Then look for a small, concrete example, check what changes and what stays the same, and explain why it matters. That gives us a solid foundation to build on.";
    }
    return `Great question about ${concept}! ✨\n\n${detail}\n\nA useful next step: try explaining ${concept} in one sentence, as if you were teaching a friend. What part would you like to explore a little further?`;
  }
  function notesHTML() {
    const toolNames = [["pen", "✏️ Pen"], ["highlight", "🖍 Highlight"], ["ruler", "📏 Ruler"], ["text", "T Text"], ["eraser", "⌫ Eraser"]];
    return `<span class="eyebrow">A space to think out loud</span><h1 class="page-title">Your notebook.</h1><p class="page-subtitle">Sketch a thought, mark up an idea, or write a few words. Your notes are saved on this device.</p>
      <div class="notes-toolbar" role="toolbar" aria-label="Notebook tools">${toolNames.map(([id, label]) => `<button class="tool-btn ${state.noteTool === id ? "active" : ""}" data-action="note-tool" data-tool="${id}" aria-pressed="${state.noteTool === id}">${label}</button>`).join("")}
      <input type="color" id="note-color" value="#477a58" aria-label="Choose pen color"><button class="tool-btn" data-action="canvas-clear">Clear drawing</button></div>
      <input class="notes-title" id="notes-title" maxlength="100" placeholder="Untitled note" value="${escapeAttr(state.notes.title)}" aria-label="Note title">
      <div class="canvas-wrap"><canvas id="note-canvas" aria-label="Drawing area. Choose a tool and draw with your pointer."></canvas></div>
      <label class="form-label" for="notes-text">Type your thoughts</label><textarea class="notes-text" id="notes-text" maxlength="10000" placeholder="Jot down a question, a definition, or anything you want to remember…">${escapeHTML(state.notes.text)}</textarea>
      <div class="notes-actions"><small>One saved notebook on this device</small><div class="banner-actions" style="margin:0"><button class="secondary-btn" data-action="clear-note">New blank note</button><button class="primary-btn" data-action="save-note">Save my notes ✓</button></div></div>`;
  }
  const leagueTiers = ["Bronze", "Silver", "Gold", "Master", "Legend"];
  const prizeLabels = {
    kuids: (value) => `${value} bonus Kuids`,
    skip_league: () => "Skip ahead one extra league",
    bonus_points: (value) => `${value} bonus points next week`,
  };
  function leagueHTML() {
    const profile = state.profile;
    if (!profile) {
      return `<span class="eyebrow">A fresh challenge every week</span><h1 class="page-title">Your weekly league.</h1><p class="page-subtitle">Create or sign in to a profile to earn points and keep track of your league level.</p><div class="empty-state" style="margin-top:20px"><button class="primary-btn" data-action="open-auth">Create a profile →</button><p style="margin-bottom:0">This device-only league has no bots or sample players. Each person needs their own local profile.</p></div>`;
    }
    const competitors = leagueBoard();
    const userPosition = competitors.findIndex((person) => person.isYou) + 1;
    const tier = profile.tier || 1;
    const quiz = state.quizActive ? quizQuestions[state.quizQuestionIndex] : null;
    const challengeContent = quiz ? `<div class="card" style="margin-top:21px"><span class="eyebrow">Weekly challenge · Question ${state.quizQuestionIndex + 1} of ${quizQuestions.length}</span><h2 style="margin:10px 0 14px;font-size:19px">${escapeHTML(quiz.q)}</h2>
      <div class="answer-options">${quiz.options.map((option, index) => `<button class="answer-option ${state.quizAnswer === index ? (index === quiz.correct ? "chosen-correct" : "chosen-wrong") : ""}" data-action="quiz-answer" data-answer="${index}" ${state.quizAnswer !== null ? "disabled" : ""}>${escapeHTML(option)}</button>`).join("")}</div>
      ${state.quizAnswer === null ? "" : `<p class="feedback ${state.quizAnswer === quiz.correct ? "correct" : "incorrect"}" role="status">${state.quizAnswer === quiz.correct ? "That's right!" : "Not quite this time."} ${state.quizAnswer === quiz.correct ? "Keep that momentum going!" : `The answer is ${escapeHTML(quiz.options[quiz.correct])}. You'll learn something either way!`}</p>`}
      <div class="banner-actions"><button class="primary-btn button-small" data-action="quiz-next" ${state.quizAnswer === null ? "disabled" : ""}>${state.quizQuestionIndex === quizQuestions.length - 1 ? "Finish challenge ✓" : "Next question →"}</button></div></div>`
      : `<div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><strong style="font-size:13px">${state.league.quizDone ? "You've played this week's challenge!" : "Ready for a tiny brain workout?"}</strong><p style="margin:5px 0 0;color:#89928a;font-size:11px">${state.league.quizDone ? "Come back next week for a fresh quiz." : "Earn league points by learning and by answering correctly."}</p></div>
      <button class="primary-btn button-small" data-action="play-league" ${state.league.quizDone ? "disabled" : ""}>${state.league.quizDone ? "Completed ✓" : state.league.answers.length ? "Continue →" : "Play now →"}</button></div>`;
    const boardHTML = competitors.length ? competitors.map((person, index) => `<div class="leader-row ${person.isYou ? "you" : ""}"><span class="leader-rank">${index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`}</span><span>${escapeHTML(person.emoji)} &nbsp;${escapeHTML(person.username)}${person.isYou ? " · You" : ""}</span><span class="leader-score">${person.points} pts</span></div>`).join("") : `<div class="empty-state">No players in this league yet. Create another profile on this browser to compare progress.</div>`;
    const promotionMessage = tier < 5
      ? `Top 5 move up to ${leagueTiers[tier]}. The #1 player spins for a bonus prize.`
      : "You're in the highest league. The top 5 stay, and #1 spins for a bonus prize.";
    const pendingPrize = state.league.pendingPrize;
    const challengeCards = weeklyChallengeCards();
    return `<span class="eyebrow">Your ${tierName(tier)} league · week of ${escapeHTML(state.league.week)}</span><h1 class="page-title">Your weekly league.</h1><p class="page-subtitle">Take this week's challenge to earn points. No bots or pretend people; profiles here are only the people who have signed up in this browser.</p>
      <div class="league-hero"><div class="league-tier"><span class="tier-badge">${["🥉", "🥈", "🥇", "👑", "💎"][tier - 1]}</span><div><h2>${tierName(tier)} league</h2><p>${competitors.length} local profile${competitors.length === 1 ? "" : "s"} · Top 5 advance next week</p></div></div>
      <div class="league-stats"><div class="league-stat"><strong>${state.league.points}</strong><small>This week's points</small></div><div class="league-stat"><strong>#${userPosition || "—"}</strong><small>Your place</small></div></div></div>
      <div class="empty-state" style="margin-top:12px">${promotionMessage}</div>
      ${pendingPrize ? `<div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px"><div><strong style="font-size:13px">You won last week's league! 🎉</strong><p style="margin:5px 0 0;color:#89928a;font-size:11px">Spin for your extra winner's prize.</p></div><button class="primary-btn button-small" data-action="spin-prize">Spin the prize wheel →</button></div>` : ""}
      <div class="section-heading"><div><h2>This week's bonus challenges</h2><p>Complete these for extra league points.</p></div></div>
      <div class="card-grid">${challengeCards.map((challenge) => `<article class="card"><span class="subject-emoji">${challenge.icon}</span><h3 style="margin:10px 0 5px;font-size:14px">${challenge.title}</h3><p style="margin:0;color:#89928a;font-size:11px">${challenge.detail}</p><div class="notes-actions"><small>+${challenge.reward} points</small>${challenge.claimed ? `<span class="day-status">✓ Claimed</span>` : `<button class="${challenge.current ? "primary-btn" : "secondary-btn"} button-small" data-action="claim-challenge" data-challenge="${challenge.id}" ${challenge.current ? "" : "disabled"}>${challenge.current ? "Claim" : "Keep going"}</button>`}</div></article>`).join("")}</div>
      <div class="section-heading"><div><h2>Your weekly challenge</h2><p>Five quick questions. Get one point for every correct answer.</p></div></div>
      ${challengeContent}
      <div class="section-heading"><div><h2>Profiles in ${tierName(tier)}</h2><p>People with profiles saved in this browser, sorted by points.</p></div><button class="text-link" data-page="people">Search profiles →</button></div>
      <div class="leaderboard">${boardHTML}</div>
      <div class="section-heading"><div><h2>League promotions</h2><p>The top 5 advance when the week closes. Other players stay in their league for next week.</p></div></div>
      <div class="card" style="display:flex;flex-wrap:wrap;gap:13px;justify-content:space-between;color:#68736a;font-size:11px"><span>🥉 Bronze</span><span>🥈 Silver</span><span>🥇 Gold</span><span>👑 Master</span><span>💎 Legend</span></div>
      <p class="chat-disclaimer">This is a local league. Search and standings only include profiles saved on this browser.</p>`;
  }
  const shopItems = [
    { id: "emoji-star", name: "Little star", detail: "A new profile friend", icon: "🌟", cost: 120, kind: "emoji", value: "🌟" },
    { id: "emoji-fox", name: "Clever fox", detail: "A new profile friend", icon: "🦊", cost: 180, kind: "emoji", value: "🦊" },
    { id: "emoji-planet", name: "Cosmic pal", detail: "A new profile friend", icon: "🪐", cost: 260, kind: "emoji", value: "🪐" },
    { id: "theme-ocean", name: "Quiet ocean", detail: "A softer shade of blue", icon: "🌊", cost: 220, kind: "theme", value: "ocean" },
    { id: "theme-sunset", name: "Golden hour", detail: "Warm up your space", icon: "🌅", cost: 220, kind: "theme", value: "sunset" },
    { id: "theme-lavender", name: "Lavender day", detail: "A calmer purple palette", icon: "🪻", cost: 300, kind: "theme", value: "lavender" },
    { id: "theme-midnight", name: "Blue hour", detail: "A fresh, cool palette", icon: "🌌", cost: 350, kind: "theme", value: "midnight" },
  ];
  function shopHTML() {
    return `<span class="eyebrow">A little something for your journey</span><h1 class="page-title">The Kuids shop.</h1><p class="page-subtitle">Make your space yours. Earn 10 Kuids every time you finish a fresh lesson, then spend them here.</p>
      <div class="league-hero" style="margin-top:21px;background:linear-gradient(110deg,#f7f0df,#fcf8ed)"><div class="league-tier"><span class="tier-badge">🪙</span><div><h2>${state.profile ? state.profile.kuids : 0} Kuids to spend</h2><p>Your wallet is saved with this browser profile.</p></div></div><button class="secondary-btn button-small" data-action="open-learn">Earn more Kuids →</button></div>
      <div class="shop-grid">${shopItems.map((item) => {
        const owned = state.owned.includes(item.id);
        const active = item.kind === "theme" && state.profile?.theme === item.value;
        const affordable = state.profile && state.profile.kuids >= item.cost;
        return `<article class="shop-card"><span class="shop-item-icon ${item.kind === "theme" ? "theme-icon" : ""}" ${item.kind === "theme" ? `style="--theme:${item.value === "ocean" ? "#e2eef3" : item.value === "sunset" ? "#f4e8df" : item.value === "lavender" ? "#eee8f4" : "#e5e8f0"}"` : ""}>${item.icon}</span><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.detail)}</p><span class="shop-price">● ${item.cost} Kuids</span>
          <button class="${owned || active ? "soft-btn" : "primary-btn"}" data-action="buy-item" data-item="${item.id}" ${owned || active || !profileCanBuy() ? "disabled" : ""}>${active ? "In use ✓" : owned ? "Owned ✓" : profileCanBuy() ? (affordable ? "Get it" : "Keep learning") : "Sign in first"}</button>
        </article>`;
      }).join("")}</div>`;
  }
  function profileCanBuy() { return Boolean(state.profile); }
  function profileHTML() {
    const profile = state.profile;
    return `<span class="eyebrow">Your little corner</span><h1 class="page-title">Your profile.</h1><p class="page-subtitle">Your account, your progress, your personal learning space.</p>
      <div class="profile-panel"><button class="avatar" data-action="change-avatar" aria-label="Change your emoji">${profile ? escapeHTML(profile.emoji) : "👋"}</button><div><strong>${profile ? escapeHTML(profile.username) : "You're not signed in yet"}</strong><p>${profile ? `Level ${profile.level || 1} · ${tierName(profile.tier)} league · ${profile.kuids} Kuids` : "Create a local profile to save your progress."}</p></div>
      <button class="primary-btn button-small" data-action="${profile ? "sign-out" : "open-signin"}">${profile ? "Sign out" : "Sign in"}</button></div>
      ${profile ? `<div class="section-heading"><div><h2>Your learning at a glance</h2><p>Your profile, course progress, and league are saved in this browser.</p></div></div><div class="stat-grid"><article class="stat-card"><span class="stat-icon">📖</span><div><strong>${totalDone()}</strong><small>Lessons completed here</small></div></article><article class="stat-card"><span class="stat-icon">🪙</span><div><strong>${profile.kuids}</strong><small>Kuids in your wallet</small></div></article><article class="stat-card"><span class="stat-icon">🏅</span><div><strong>${tierName(profile.tier)}</strong><small>Weekly league tier</small></div></article></div>` : `<div class="empty-state" style="margin-top:22px">Create a profile to save progress, Kuids, and weekly league points in this browser.</div>`}
      <div class="section-heading"><div><h2>About your account</h2><p>A few things to know before you get started.</p></div></div>
      <div class="empty-state">Profiles are stored only in this browser and are not protected by a server. Other devices cannot see these profiles or your progress. Passwords are hashed locally, but this prototype is not suitable for sensitive information.</div>`;
  }
  function modalHTML() {
    if (state.modalMode === "avatar") {
      return `<div class="modal-backdrop" data-action="close-modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
        <span class="eyebrow">A little profile update</span><h2 id="auth-title">Pick a new emoji.</h2><p>Choose a friendly face for your profile.</p>
        <div class="emoji-picker">${emojiOptions.concat(shopItems.filter((item) => item.kind === "emoji" && state.owned.includes(item.id)).map((item) => item.value)).map((emoji) => `<button type="button" class="emoji-pick ${state.selectedEmoji === emoji ? "selected" : ""}" data-action="pick-emoji" data-emoji="${emoji}" aria-label="Choose ${emoji}" aria-pressed="${state.selectedEmoji === emoji}">${emoji}</button>`).join("")}</div>
        <button class="primary-btn modal-submit" style="margin-top:18px" data-action="save-avatar">Save profile emoji ✓</button></section></div>`;
    }
    const signup = state.modalMode !== "signin";
    const formTitle = signup ? "Make yourself at home." : "Welcome back.";
    return `<div class="modal-backdrop" data-action="close-modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
      <span class="eyebrow">${signup ? "Start your learning journey" : "Your space is waiting"}</span><h2 id="auth-title">${formTitle}</h2><p>${signup ? "Create a profile saved on this browser. Choose a username, emoji, and password." : "Sign in to a profile saved on this browser."}</p>
      <form id="auth-form">
        ${signup ? `<label class="form-label">Choose your emoji</label><div class="emoji-picker">${emojiOptions.map((emoji) => `<button type="button" class="emoji-pick ${state.selectedEmoji === emoji ? "selected" : ""}" data-action="pick-emoji" data-emoji="${emoji}" aria-label="Choose ${emoji}" aria-pressed="${state.selectedEmoji === emoji}">${emoji}</button>`).join("")}</div>` : ""}
        <label class="form-label" for="auth-username">Username</label><input class="form-input" id="auth-username" name="username" autocomplete="username" minlength="2" maxlength="20" required placeholder="Your username">
        <label class="form-label" for="auth-password">Password</label><input class="form-input" id="auth-password" name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" minlength="8" maxlength="128" required placeholder="At least 8 characters">
        <p class="form-error" id="auth-error" role="alert"></p>
        <button type="submit" class="primary-btn modal-submit">${signup ? "Create my profile →" : "Sign in →"}</button>
      </form>
      <p class="chat-disclaimer">Profiles are local to this browser. Use a password you do not use anywhere else.</p>
      <button class="modal-switch" data-action="switch-auth">${signup ? "Already have an account? Sign in" : "New here? Create an account"}</button></section></div>`;
  }
  function prizeModalHTML() {
    const prize = state.prizeResult;
    return `<div class="modal-backdrop"><section class="modal prize-modal" role="dialog" aria-modal="true" aria-labelledby="prize-title">
      <span class="eyebrow">Weekly league winner</span><h2 id="prize-title">${state.spinningPrize ? "The winner's wheel is spinning…" : "Your bonus prize!"}</h2>
      <div class="prize-wheel ${state.spinningPrize ? "spinning" : ""}"><span>🪙</span><span>⬆️</span><span>✨</span></div>
      <p>${state.spinningPrize ? "You came first in your league. Here comes your extra reward!" : escapeHTML(prizeLabels[prize.type]?.(prize.value) || "A surprise prize")}</p>
      ${state.spinningPrize ? "" : `<button class="primary-btn modal-submit" data-action="close-prize">Lovely, thank you ✓</button>`}
    </section></div>`;
  }
  function render() {
    let content;
    if (state.page === "home") content = homeHTML();
    else if (state.page === "learn") content = state.day ? lessonHTML() : learnHTML();
    else if (state.page === "learnGPT") content = chatHTML();
    else if (state.page === "notes") content = notesHTML();
    else if (state.page === "league") content = leagueHTML();
    else if (state.page === "people") content = profileSearchHTML();
    else if (state.page === "shop") content = shopHTML();
    else content = profileHTML();
    root.innerHTML = shellHTML(content);
    if (state.page === "notes") setupCanvas();
    if (state.page === "learnGPT") {
      const messages = document.getElementById("chat-messages");
      messages.scrollTop = messages.scrollHeight;
    }
    if (state.modal) {
      const username = document.getElementById("auth-username");
      if (state.modalMode === "signup") document.querySelector(".modal")?.querySelector(".emoji-pick.selected")?.focus();
      else username?.focus();
    }
  }
  function setPage(page) {
    if (state.profile && ["league", "people", "profile"].includes(page)) {
      const activeId = state.profile.id;
      settleExpiredWeeks();
      state.profile = state.users.find((user) => user.id === activeId) || null;
      state.league = state.profile?.weekly || defaultState.league;
      state.owned = ["theme-garden", ...(state.profile?.inventory || [])];
    }
    state.page = page;
    if (page !== "learn") state.day = null;
    state.modal = "";
    state.selectedAnswer = null;
    render();
  }
  function setupCanvas() {
    const canvas = document.getElementById("note-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const drawBackground = () => {
      ctx.save();
      ctx.strokeStyle = "#e8ece5";
      ctx.lineWidth = 0.7;
      for (let y = 28; y < rect.height; y += 28) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke();
      }
      ctx.restore();
    };
    drawBackground();
    if (state.notes.image) {
      const image = new Image();
      image.onload = () => {
        drawBackground();
        ctx.drawImage(image, 0, 0, rect.width, rect.height);
      };
      image.src = state.notes.image;
    }
    let drawing = false;
    let start = null;
    function coords(event) {
      const box = canvas.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    }
    function pointerDown(event) {
      const point = coords(event);
      canvas.setPointerCapture(event.pointerId);
      if (state.noteTool === "text") {
        const text = window.prompt("What would you like to add to the page?");
        if (text) {
          ctx.save(); ctx.fillStyle = document.getElementById("note-color").value;
          ctx.font = "16px DM Sans, sans-serif"; ctx.fillText(text.slice(0, 120), point.x, point.y); ctx.restore();
          captureCanvas();
        }
        return;
      }
      drawing = true;
      start = point;
      if (state.noteTool !== "ruler") {
        ctx.beginPath(); ctx.moveTo(point.x, point.y);
        ctx.strokeStyle = state.noteTool === "eraser" ? "#fff" : document.getElementById("note-color").value;
        ctx.lineWidth = state.noteTool === "highlight" ? 15 : state.noteTool === "eraser" ? 22 : 2.4;
        ctx.globalAlpha = state.noteTool === "highlight" ? .28 : 1;
      }
    }
    function pointerMove(event) {
      if (!drawing) return;
      const point = coords(event);
      if (state.noteTool === "ruler") {
        ctx.save(); drawBackground();
        if (state.notes.image) {
          const image = new Image(); image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height); image.src = state.notes.image;
        }
        ctx.strokeStyle = "#638f6d"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(point.x, point.y); ctx.stroke(); ctx.restore();
      } else {
        ctx.lineTo(point.x, point.y); ctx.stroke();
      }
    }
    function pointerUp() {
      if (!drawing) return;
      drawing = false;
      ctx.globalAlpha = 1;
      if (state.noteTool === "ruler") {
        const image = new Image();
        image.onload = () => {
          drawBackground(); ctx.drawImage(image, 0, 0, rect.width, rect.height);
          ctx.save(); ctx.strokeStyle = "#638f6d"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(lastPoint.x, lastPoint.y); ctx.stroke(); ctx.restore();
          captureCanvas();
        };
        image.src = state.notes.image || canvas.toDataURL();
      } else captureCanvas();
    }
    let lastPoint = { x: 0, y: 0 };
    canvas.addEventListener("pointermove", (event) => { lastPoint = coords(event); pointerMove(event); });
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
  }
  function captureCanvas() {
    const canvas = document.getElementById("note-canvas");
    if (canvas) state.notes.image = canvas.toDataURL("image/png");
  }
  function drawStoredImage(imageData) {
    const canvas = document.getElementById("note-canvas");
    if (!canvas) return;
    state.notes.image = imageData;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      state.notes.image = canvas.toDataURL("image/png");
    };
    image.src = imageData;
  }
  async function buyItem(id) {
    if (!state.profile) { notify("Create your free profile before shopping."); state.modal = "auth"; state.modalMode = "signup"; render(); return; }
    const item = shopItems.find((entry) => entry.id === id);
    if (!item || state.owned.includes(id)) return;
    if (state.profile.kuids < item.cost) { notify(`You're ${item.cost - state.profile.kuids} Kuids away. Finish a fresh lesson to earn more!`); return; }
    if (!updateProfile((profile) => {
      profile.kuids -= item.cost;
      profile.inventory ||= [];
      profile.inventory.push(id);
      if (item.kind === "theme") profile.theme = item.value;
    })) return;
    state.owned.push(id);
    applyTheme();
    render();
    notify(`${item.name} is yours!`);
  }
  const quizQuestions = [
    { q: "What is 6 × 7?", options: ["42", "36", "48"], correct: 0 },
    { q: "What does a variable do in a program?", options: ["Stores a value", "Prints a book", "Turns off the screen"], correct: 0 },
    { q: "Which word is a verb?", options: ["Quickly", "Explore", "Beautiful"], correct: 1 },
    { q: "Which gas do plants take in during photosynthesis?", options: ["Oxygen", "Carbon dioxide", "Helium"], correct: 1 },
    { q: "How many equal sides does an equilateral triangle have?", options: ["Two", "Three", "Four"], correct: 1 },
  ];
  function playQuiz() {
    if (!state.profile) { notify("Sign in to save your weekly game score."); state.modal = "auth"; state.modalMode = "signup"; render(); return; }
    if (state.league.quizDone) return;
    state.quizActive = true;
    const answers = state.league.answers || [];
    state.quizScore = answers.filter((answer) => answer.correct).length;
    const answered = new Set(answers.map((answer) => answer.question));
    state.quizQuestionIndex = quizQuestions.findIndex((_question, index) => !answered.has(index + 1));
    if (state.quizQuestionIndex < 0) {
      state.quizActive = false;
      if (!updateProfile((_profile, weekly) => { weekly.quizDone = true; })) state.quizActive = false;
      render();
      return;
    }
    state.quizAnswer = null;
    render();
  }
  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-page], [data-action]");
    if (!button) return;
    if (button.dataset.page) { setPage(button.dataset.page); return; }
    const action = button.dataset.action;
    if (action === "close-modal-backdrop" && event.target !== button) return;
    switch (action) {
      case "open-learn": state.subject = ""; state.day = null; setPage("learn"); break;
      case "open-auth": state.modal = "auth"; state.modalMode = "signup"; render(); break;
      case "open-signin": state.modal = "auth"; state.modalMode = "signin"; render(); break;
      case "close-modal": state.modal = ""; render(); break;
      case "close-modal-backdrop": state.modal = ""; render(); break;
      case "switch-auth": state.modalMode = state.modalMode === "signin" ? "signup" : "signin"; state.selectedEmoji = emojiOptions[0]; render(); break;
      case "pick-emoji": state.selectedEmoji = button.dataset.emoji; render(); break;
      case "profile-or-signin": setPage("profile"); break;
      case "sign-out":
        localStorage.removeItem(STORAGE.session);
        state.profile = null; state.league = defaultState.league; state.owned = ["theme-garden"];
        state.progress = getItem(STORAGE.progress, {});
        applyTheme(); notify("You're signed out. Your local profile is still saved on this browser."); render(); break;
      case "change-avatar":
        if (!state.profile) { state.modal = "auth"; state.modalMode = "signup"; }
        else { state.modal = "auth"; state.modalMode = "avatar"; state.selectedEmoji = state.profile.emoji; }
        render(); break;
      case "save-avatar":
        if (!updateProfile((profile) => { profile.emoji = state.selectedEmoji; })) break;
        state.modal = ""; applyTheme(); render(); notify("Profile emoji updated.");
        break;
      case "open-subject": state.subject = button.dataset.subject; state.level = "basics"; state.day = null; setPage("learn"); break;
      case "back-subjects": state.subject = ""; state.day = null; render(); break;
      case "back-course": state.day = null; state.selectedAnswer = null; render(); break;
      case "set-level": state.level = button.dataset.level; state.day = null; render(); break;
      case "open-day": state.day = Number(button.dataset.day); state.selectedAnswer = null; render(); break;
      case "answer": state.selectedAnswer = Number(button.dataset.answer); render(); break;
      case "quiz-answer":
        if (state.quizAnswer !== null) break;
        {
          const answer = Number(button.dataset.answer);
          const correct = answer === quizQuestions[state.quizQuestionIndex].correct;
          if (!updateProfile((profile, weekly) => {
            weekly.answers.push({ question: state.quizQuestionIndex + 1, correct });
            if (correct) {
              weekly.points += 1;
            }
          })) { render(); break; }
          state.quizAnswer = answer;
          if (correct) state.quizScore++;
          render();
        }
        break;
      case "quiz-next":
        if (!state.quizActive || state.quizAnswer === null) break;
        if (state.quizQuestionIndex < quizQuestions.length - 1) {
          state.quizQuestionIndex++; state.quizAnswer = null; render();
        } else {
          if (!updateProfile((_profile, weekly) => { weekly.quizDone = true; })) break;
          state.quizActive = false;
          render();
          notify(`Weekly challenge complete! You scored ${state.quizScore}/5. Correct answers added points to your league.`);
        }
        break;
      case "claim-challenge": {
        const challenge = weeklyChallengeCards().find((entry) => entry.id === button.dataset.challenge);
        if (!challenge || !challenge.current || challenge.claimed) break;
        if (!updateProfile((profile, weekly) => {
          weekly.claimedChallenges.push(challenge.id);
          weekly.points += challenge.reward;
          profile.level = Math.min(330, (profile.level || 1) + Math.floor(challenge.reward / 10));
        })) break;
        render();
        notify(`${challenge.reward} weekly league points claimed!`);
        break;
      }
      case "complete-day": {
        if (!state.profile) { state.modal = "auth"; state.modalMode = "signup"; render(); notify("Sign in to save your lesson and collect Kuids."); break; }
        const key = lessonKey();
        if (!state.progress[key]) {
          const previousLastLesson = state.progress.lastLesson;
          state.progress[key] = true;
          state.progress.lastLesson = { subject: state.subject, level: state.level, day: state.day };
          if (!persistProgress()) {
            delete state.progress[key];
            if (previousLastLesson) state.progress.lastLesson = previousLastLesson;
            else delete state.progress.lastLesson;
            break;
          }
          if (!updateProfile((profile, weekly) => {
            profile.kuids += 10;
            weekly.lessons.push({ subject: state.subject, key });
            weekly.points += 10;
            profile.level = Math.min(330, (profile.level || 1) + 1);
          })) {
            delete state.progress[key];
            if (previousLastLesson) state.progress.lastLesson = previousLastLesson;
            else delete state.progress.lastLesson;
            persistProgress();
            render();
            break;
          }
          notify("Lesson complete! 10 Kuids and 10 league points are yours. ✨");
        }
        render(); break;
      }
      case "next-day": state.day = Math.min(100, state.day + 1); state.selectedAnswer = null; render(); break;
      case "suggest-question": {
        const input = document.getElementById("chat-input");
        input.value = button.dataset.question;
        input.focus(); break;
      }
      case "note-tool": state.noteTool = button.dataset.tool; render(); break;
      case "canvas-clear": {
        const canvas = document.getElementById("note-canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.notes.image = "";
        state.notes.saved = false;
        notify("Drawing cleared.");
        break;
      }
      case "save-note": {
        state.notes.title = document.getElementById("notes-title").value;
        state.notes.text = document.getElementById("notes-text").value;
        captureCanvas();
        if (saveItem(STORAGE.notes, state.notes)) notify("Your notes are saved on this device. ✓");
        break;
      }
      case "clear-note":
        if (window.confirm("Start a new note? Your current unsaved note will be cleared.")) {
          state.notes = { title: "", text: "", image: "" }; saveItem(STORAGE.notes, state.notes); render(); notify("Ready for a fresh page.");
        }
        break;
      case "buy-item": buyItem(button.dataset.item); break;
      case "play-league": playQuiz(); break;
      case "spin-prize":
        if (!state.league.pendingPrize) break;
        {
          const prize = state.league.pendingPrize;
          if (!updateProfile((profile, weekly) => {
            if (prize.type === "kuids") profile.kuids += prize.value;
            if (prize.type === "bonus_points") weekly.nextWeekBonusPoints = prize.value;
            weekly.pendingPrize = null;
          })) break;
          state.prizeResult = prize;
        }
        state.spinningPrize = true;
        render();
        window.setTimeout(() => { state.spinningPrize = false; render(); }, 1800);
        break;
      case "close-prize": state.prizeResult = null; render(); break;
      default: break;
    }
  });
  root.addEventListener("input", (event) => {
    if (event.target.id === "profile-search") updateProfileSearch(event.target.value);
  });
  root.addEventListener("submit", async (event) => {
    if (event.target.id === "chat-form") {
      event.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if (!text) return;
      state.chat.push({ role: "user", text });
      state.chat.push({ role: "assistant", text: localTutor(text) });
      state.chat = state.chat.slice(-40);
      saveItem(STORAGE.chat, state.chat);
      render();
      return;
    }
    if (event.target.id !== "auth-form") return;
    event.preventDefault();
    const form = new FormData(event.target);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const error = document.getElementById("auth-error");
    try {
      if (state.modalMode === "signin") {
        const profile = state.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
        if (!profile || !profile.passwordSalt || !profile.passwordHash) throw new Error("That username or password is incorrect.");
        if (await hashPassword(password, profile.passwordSalt) !== profile.passwordHash) throw new Error("That username or password is incorrect.");
        settleExpiredWeeks();
        const sessionSaved = switchToProfile(state.users.find((user) => user.id === profile.id));
        state.modal = "";
        notify(sessionSaved ? `Welcome back, ${profile.username}!` : "Signed in for this tab, but browser storage could not save the session.");
      } else {
        if (!/^[\p{L}\p{N}_ -]{2,20}$/u.test(username)) { error.textContent = "Choose a 2–20 character name using letters, numbers, spaces, _ or -."; return; }
        if (password.length < 8) { error.textContent = "Choose a password with at least 8 characters."; return; }
        if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
          error.textContent = "That username is already saved in this browser.";
          return;
        }
        const passwordSalt = createSalt();
        const passwordHash = await hashPassword(password, passwordSalt);
        const profile = {
          id: makeId(), username, emoji: state.selectedEmoji, passwordSalt, passwordHash,
          kuids: 0, level: 1, tier: 1, theme: "garden", inventory: [],
          weekly: {
            week: weekKey(), points: 0, quizDone: false, answers: [], lessons: [],
            claimedChallenges: [], pendingBonusPoints: 0, nextWeekBonusPoints: 0,
            pendingPrize: null, lastResult: null,
          },
        };
        state.users.push(profile);
        if (!persistUsers()) {
          state.users = state.users.filter((user) => user.id !== profile.id);
          throw new Error("Couldn't save the new profile in browser storage.");
        }
        settleExpiredWeeks();
        const sessionSaved = switchToProfile(state.users.find((user) => user.id === profile.id));
        state.modal = "";
        notify(sessionSaved ? `Welcome, ${username}! Your local profile is ready.` : "Your profile was saved, but browser storage could not keep you signed in.");
      }
      render();
    } catch (err) {
      error.textContent = err.message || "Couldn't save your profile. Please try again.";
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.modal) { state.modal = ""; render(); }
  });
  loadState();
  render();
})();
