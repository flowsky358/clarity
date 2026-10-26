/*
   CLARITY, local storage
   Everything lives in this browser. Nothing leaves the device.
*/
window.Clarity = window.Clarity || {};

Clarity.store = (function () {
  const KEY = 'clarity.v1';
  const D = Clarity.data;

  const blankGame = () => ({
    sparks: 0, stars: 0, pages: 0, checks: 0, lessons: 0, listens: 0,
    focusMins: 0, focusRuns: 0, gamesPlayed: 0,
    streak: 0, bestStreak: 0, lastActive: '', lastVisit: '', lastListen: '', dailyDone: '',
    badges: [], doneLessons: [], games: {}, plan: null, todos: []
  });

  const blank = () => ({
    profiles: D.PRESETS.map(p => ({ ...p })),
    activeProfile: 'p_steps',
    docs: [],
    goals: {},                 // { 'YYYY-MM-DD': 'goal text' }
    settings: { rate: 1.0, seenIntro: false },
    game: blankGame()
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const s = JSON.parse(raw);
      const base = blank();

      // Clarity now uses a single default reading profile. Collapse any
      // older multi-profile save down to that one so everyone sees the same
      // simple setup.
      const profiles = base.profiles;
      const activeProfile = base.activeProfile;

      // shallow-merge so a new field in a later version doesn't break an old save
      return {
        profiles,
        activeProfile,
        docs: Array.isArray(s.docs) ? s.docs : [],
        goals: (s.goals && typeof s.goals === 'object') ? s.goals : {},
        settings: { ...base.settings, ...(s.settings || {}) },
        game: { ...base.game, ...(s.game || {}) }
      };
    } catch (e) {
      console.warn('Clarity: could not read saved data, starting fresh.', e);
      return blank();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // Quota is the realistic failure here, drop the oldest docs and retry once.
      if (state.docs.length > 4) {
        state.docs = state.docs.slice(0, Math.floor(state.docs.length / 2));
        try { localStorage.setItem(KEY, JSON.stringify(state)); return; } catch (_) {}
      }
      console.warn('Clarity: could not save.', e);
    }
  }

  const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* profiles */
  function profiles() { return state.profiles; }

  function activeProfile() {
    return state.profiles.find(p => p.id === state.activeProfile) || state.profiles[0];
  }

  function setActiveProfile(id) {
    if (state.profiles.some(p => p.id === id)) { state.activeProfile = id; save(); }
  }

  function saveProfile(p) {
    const i = state.profiles.findIndex(x => x.id === p.id);
    if (i >= 0) state.profiles[i] = p;
    else { p.id = p.id || uid('pr'); state.profiles.push(p); }
    save();
    return p;
  }

  function deleteProfile(id) {
    if (state.profiles.length <= 1) return false;
    state.profiles = state.profiles.filter(p => p.id !== id);
    if (state.activeProfile === id) state.activeProfile = state.profiles[0].id;
    save();
    return true;
  }

  function newProfile() {
    return {
      id: uid('pr'), emoji: '⭐', icon: 'user', color: '#8A5AD6', name: 'New profile',
      desc: '', level: 5, mode: 'steps', font: 'lexend', size: 19,
      lineHeight: 1.85, letterSpacing: 0.03, wordSpacing: 0.12,
      tint: 'none', rate: 0.9, glossary: true, language: 'en'
    };
  }

  /* documents */
  function docs() { return state.docs; }
  function getDoc(id) { return state.docs.find(d => d.id === id); }

  /* per-day goals, keyed by local YYYY-MM-DD */
  function goals() { return state.goals || (state.goals = {}); }
  function getGoal(key) { return goals()[key] || ''; }
  function setGoal(key, text) {
    const g = goals();
    const t = (text || '').trim();
    if (t) g[key] = t; else delete g[key];
    save();
  }

  function saveDoc(doc) {
    if (!doc.id) { doc.id = uid('doc'); doc.created = Date.now(); }
    doc.updated = Date.now();
    const i = state.docs.findIndex(d => d.id === doc.id);
    if (i >= 0) state.docs[i] = doc; else state.docs.unshift(doc);
    if (state.docs.length > 60) state.docs.length = 60;
    save();
    return doc;
  }

  function deleteDoc(id) {
    state.docs = state.docs.filter(d => d.id !== id);
    save();
  }

  /* settings */
  function settings() { return state.settings; }
  function setSetting(k, v) { state.settings[k] = v; save(); }

  /* gamification progress */
  function game() { if (!state.game) state.game = blankGame(); return state.game; }
  function saveGame(g) { state.game = g; save(); }

  /* local sign-in (on-device only, no password) */
  function user() { return state.settings.user || null; }
  function signIn(u) { state.settings.user = u; save(); }
  function signOut() { delete state.settings.user; save(); }

  function wipe() {
    try { localStorage.removeItem(KEY); } catch (_) {}
    state = blank();
  }

  return {
    profiles, activeProfile, setActiveProfile, saveProfile, deleteProfile, newProfile,
    docs, getDoc, saveDoc, deleteDoc,
    goals, getGoal, setGoal,
    user, signIn, signOut,
    settings, setSetting, game, saveGame, wipe, uid
  };
})();
