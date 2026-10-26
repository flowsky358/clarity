/*
   CLARITY, gentle gamification

   Points ("Sparks") are earned only for real learning actions, which is what
   the research says makes rewards meaningful. There is no punishment: you
   never lose Sparks, and a missed day just resets the streak to one, keeping
   your best. Built to motivate dyslexic and ADHD readers, not to stress them.
*/
window.Clarity = window.Clarity || {};

Clarity.game = (function () {
  const store = () => Clarity.store;

  // Sparks are tied to real actions. Coming back and using the read-aloud
  // tool both count, since showing up and using your supports is the habit
  // we actually want to build.
  const SPARKS = { page: 10, check: 15, lesson: 20, listen: 5, daily: 5, challenge: 25, focus: 15, game: 10 };

  const LEVELS = [
    { min: 0,    name: 'Getting started' },
    { min: 60,   name: 'Finding your flow' },
    { min: 150,  name: 'Reading stronger' },
    { min: 300,  name: 'On a roll' },
    { min: 500,  name: 'Reading champion' },
    { min: 800,  name: 'Unstoppable' }
  ];

  const BADGES = [
    { id: 'first_page',  name: 'First page',    desc: 'Made your first page clear',       icon: 'doc',    test: s => s.pages >= 1 },
    { id: 'five_pages',  name: 'Five pages',    desc: 'Made five pages clear',            icon: 'spark',  test: s => s.pages >= 5 },
    { id: 'first_check', name: 'Self-checker',  desc: 'Finished a comprehension check',   icon: 'check',  test: s => s.checks >= 1 },
    { id: 'first_lesson',name: 'Learner',       desc: 'Finished a lesson',                icon: 'book',   test: s => s.lessons >= 1 },
    { id: 'all_lessons', name: 'Scholar',       desc: 'Finished every lesson',            icon: 'seed',   test: s => s.lessons >= 5 },
    { id: 'streak3',     name: 'Three in a row',desc: 'Used Clarity three days running',  icon: 'up',     test: s => s.bestStreak >= 3 },
    { id: 'streak7',     name: 'A full week',   desc: 'Used Clarity seven days running',  icon: 'up',     test: s => s.bestStreak >= 7 },
    { id: 'listener',    name: 'Good listener', desc: 'Had a page read aloud to you',     icon: 'speaker', test: s => s.listens >= 1 },
    { id: 'first_focus', name: 'Focused',       desc: 'Finished a focus session',         icon: 'target', test: s => (s.focusRuns || 0) >= 1 },
    { id: 'first_game',  name: 'Game on',       desc: 'Played a brain-break game',        icon: 'spark',  test: s => (s.gamesPlayed || 0) >= 1 },
    { id: 'ten_games',   name: 'Brain trainer', desc: 'Played ten brain-break games',     icon: 'bolt',   test: s => (s.gamesPlayed || 0) >= 10 },
    { id: 'first_star',  name: 'First star',    desc: 'Won your first daily challenge',   icon: 'star',   test: s => (s.stars || 0) >= 1 },
    { id: 'five_stars',  name: 'Star collector',desc: 'Won five daily challenges',        icon: 'star',   test: s => (s.stars || 0) >= 5 },
    { id: 'level3',      name: 'Level three',   desc: 'Reached level three',              icon: 'stairs', test: s => levelOf(s.sparks).num >= 3 }
  ];

  function levelOf(sparks) {
    let i = 0;
    for (let k = 0; k < LEVELS.length; k++) if (sparks >= LEVELS[k].min) i = k;
    const cur = LEVELS[i], next = LEVELS[i + 1] || null;
    return { num: i + 1, name: cur.name, floor: cur.min, ceil: next ? next.min : cur.min, next };
  }

  const dayStr = (ms) => new Date(ms).toISOString().slice(0, 10);

  function touchDay(s) {
    const today = dayStr(Date.now());
    if (s.lastActive === today) return;
    const yesterday = dayStr(Date.now() - 86400000);
    s.streak = (s.lastActive === yesterday) ? s.streak + 1 : 1;   // reset to 1, never shame
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    s.lastActive = today;
  }

  /** Record a completed action. Returns what was earned for a celebratory cue. */
  function award(action, meta) {
    const s = store().game();
    const before = levelOf(s.sparks).num;
    let gained = 0;

    if (action === 'page')      { s.pages++;  gained = SPARKS.page; }
    else if (action === 'check'){ s.checks++; gained = SPARKS.check; }
    else if (action === 'listen') {
      // one listen reward per day, so it rewards the habit, not spamming play
      const today = dayStr(Date.now());
      if (s.lastListen === today) { gained = 0; }
      else { s.lastListen = today; s.listens = (s.listens || 0) + 1; gained = SPARKS.listen; }
    }
    else if (action === 'lesson') {
      const id = meta && meta.id;
      if (id && s.doneLessons.indexOf(id) !== -1) { gained = 0; }   // only once per lesson
      else { if (id) s.doneLessons.push(id); s.lessons++; gained = SPARKS.lesson; }
    }

    s.sparks += gained;
    touchDay(s);

    const after = levelOf(s.sparks).num;
    const newBadges = BADGES.filter(b => s.badges.indexOf(b.id) === -1 && b.test(s));
    newBadges.forEach(b => s.badges.push(b.id));

    store().saveGame(s);
    return { gained, leveledUp: after > before, level: after, newBadges };
  }

  /** Call once when the app opens. Gives a small bonus the first visit each
      day and keeps the streak alive. Returns a reward cue, or null if already
      counted today. */
  function visit() {
    const s = store().game();
    const today = dayStr(Date.now());
    if (s.lastVisit === today) { touchDay(s); store().saveGame(s); return null; }
    s.lastVisit = today;
    const before = levelOf(s.sparks).num;
    s.sparks += SPARKS.daily;
    touchDay(s);
    const after = levelOf(s.sparks).num;
    const newBadges = BADGES.filter(b => s.badges.indexOf(b.id) === -1 && b.test(s));
    newBadges.forEach(b => s.badges.push(b.id));
    store().saveGame(s);
    return { gained: SPARKS.daily, leveledUp: after > before, level: after, newBadges, daily: true };
  }

  /** Progress toward one badge: current, target, percent, and whether earned.
      Powers the Badges screen's progress bars. */
  function badgeStat(id) {
    const s = store().game();
    const lv = levelOf(s.sparks).num;
    const map = {
      first_page: [s.pages, 1], five_pages: [s.pages, 5], first_check: [s.checks, 1],
      first_lesson: [s.lessons, 1], all_lessons: [s.lessons, 5], streak3: [s.bestStreak, 3],
      streak7: [s.bestStreak, 7], listener: [s.listens, 1], first_focus: [s.focusRuns || 0, 1],
      first_game: [s.gamesPlayed || 0, 1], ten_games: [s.gamesPlayed || 0, 10],
      first_star: [s.stars || 0, 1], five_stars: [s.stars || 0, 5], level3: [lv, 3]
    };
    const pair = map[id] || [0, 1];
    const cur = Math.max(0, pair[0]), max = pair[1];
    const got = s.badges.indexOf(id) !== -1;
    return { cur: Math.min(cur, max), max, pct: got ? 100 : Math.min(100, Math.round(cur / max * 100)), got };
  }

  /** True once the daily challenge is already done for today. */
  function dailyDone() { return store().game().dailyDone === dayStr(Date.now()); }

  /** Win the daily challenge: a batch of Sparks plus a Star, once per day. */
  function completeDaily() {
    const s = store().game();
    if (s.dailyDone === dayStr(Date.now())) return null;   // already done today
    s.dailyDone = dayStr(Date.now());
    s.stars = (s.stars || 0) + 1;
    return finish(s, SPARKS.challenge, { stars: 1 });
  }

  /** Finish a focus session: Sparks for the work, plus minutes banked. */
  function finishFocus(mins) {
    const s = store().game();
    s.focusMins = (s.focusMins || 0) + (mins || 0);
    s.focusRuns = (s.focusRuns || 0) + 1;
    return finish(s, SPARKS.focus, {});
  }

  /** Record a brain-break game: Sparks for playing, plus a per-game best. */
  function playGame(id, score) {
    const s = store().game();
    s.games = s.games || {};
    const rec = s.games[id] || { best: 0, plays: 0 };
    rec.plays++;
    const newBest = score > rec.best;
    if (newBest) rec.best = score;
    s.games[id] = rec;
    s.gamesPlayed = (s.gamesPlayed || 0) + 1;
    return Object.assign(finish(s, SPARKS.game, {}), { best: rec.best, newBest: newBest && score > 0, plays: rec.plays });
  }

  /** Shared tail: add Sparks, keep the streak, unlock badges, save, report. */
  function finish(s, gained, extra) {
    const before = levelOf(s.sparks).num;
    s.sparks += gained;
    touchDay(s);
    const after = levelOf(s.sparks).num;
    const newBadges = BADGES.filter(b => s.badges.indexOf(b.id) === -1 && b.test(s));
    newBadges.forEach(b => s.badges.push(b.id));
    store().saveGame(s);
    return Object.assign({ gained, leveledUp: after > before, level: after, newBadges }, extra || {});
  }

  return { SPARKS, LEVELS, BADGES, levelOf, award, visit, dailyDone, completeDaily, finishFocus, playGame, badgeStat };
})();
