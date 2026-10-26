/*
   CLARITY, app controller
   Routing, flows, and everything wired together.
*/
(function () {
  const store = Clarity.store;
  const ui = Clarity.ui;
  const engine = Clarity.engine;
  const speech = Clarity.speech;
  const i18n = Clarity.i18n;
  const D = Clarity.data;
  const $ = (id) => document.getElementById(id);
  const t = (k) => i18n.t(k);

  const TITLES = { home:'Clarity', capture:'Add a page', loading:'Working…',
                   reader:'Reading', library:'Library', profiles:'Profiles', settings:'Profile',
                   resources:'Find real help', focus:'Focus', badges:'Badges' };

  let view = 'home';
  let stack = [];
  let current = null;      // doc open in the reader
  let mode = 'steps';
  let wordGroups = [];
  let speeds = [0.6, 0.8, 1.0, 1.25, 1.5];

  /* routing */
  function go(next, push) {
    if (next === view) return;
    if (push !== false && view !== 'loading') stack.push(view);

    if (view === 'reader' && next !== 'reader') speech.stop();
    if (view === 'focus' && next !== 'focus') stopSound();

    view = next;
    paintChrome();
    $('views').scrollTop = 0;
    $('topbar').classList.remove('scrolled');

    if (next === 'home') renderHome();
    if (next === 'focus') renderFocus();
    if (next === 'capture') renderCaptureProfiles();
    if (next === 'badges') renderBadgesScreen();
    if (next === 'library') renderLibrary();
    if (next === 'profiles') renderProfileList();
    if (next === 'settings') syncAppearance();
    if (next === 'resources') { ui.renderPresentations($('presoList')); ui.renderResources($('resourceList')); ui.renderLessons($('lessonList'), openLesson); }
    if (next === 'reader') requestAnimationFrame(moveThumb);
  }

  function back() {
    const prev = stack.pop() || 'home';
    go(prev, false);
  }

  const TITLE_KEY = { capture:'capture.title', library:'nav.library', profiles:'nav.profiles',
                      resources:'nav.support' };

  /** Header, playbar and tab state for whatever view is currently showing. */
  function paintChrome() {
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
    $('tbTitle').textContent = view === 'reader' && current ? current.title
      : TITLE_KEY[view] ? t(TITLE_KEY[view]) : TITLES[view];
    // profiles now lives inside Settings, so it gets a back button
    $('btnBack').hidden = !['capture', 'reader', 'loading', 'profiles', 'badges'].includes(view);
    $('tbLogo').hidden = !$('btnBack').hidden;   // brand mark on top-level screens
    $('playbar').hidden = view !== 'reader';
    // Profile tab stays lit on its sub-screens (reading profiles, badges)
    const sub = (view === 'profiles' || view === 'badges');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-on',
      t.dataset.goto === view || (sub && t.dataset.goto === 'settings')));
    syncPoints();
  }

  /* home */
  function renderHome() {
    renderHomeHeader();
    const docs = store.docs();
    const cnt = $('pagesCount'); if (cnt) cnt.textContent = docs.length;
    ui.renderDocList($('recentList'), docs.slice(0, 6), openDoc, confirmDeleteDoc, '');
    renderProgress();
  }

  /* Tiimo-style day header + week strip */
  function renderHomeHeader() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dEl = $('homeDay'); if (dEl) dEl.textContent = days[now.getDay()];
    const mEl = $('homeMonth'); if (mEl) mEl.textContent = months[now.getMonth()] + ' ' + now.getFullYear();
    const wk = $('homeWeek'); if (!wk) return;
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay()); sunday.setHours(0, 0, 0, 0);
    const todayMid = new Date(now); todayMid.setHours(0, 0, 0, 0);
    wk.innerHTML = labels.map((lab, i) => {
      const d = new Date(sunday); d.setDate(sunday.getDate() + i);
      const key = dateKey(d);
      const isToday = Math.round((todayMid - d) / 86400000) === 0;
      const hasGoal = !!store.getGoal(key);
      return '<button class="wd-cell' + (isToday ? ' today' : '') + (hasGoal ? ' has-goal' : '') + '" data-key="' + key + '">'
        + '<div class="wd-lab">' + lab + '</div><div class="wd-num">' + d.getDate() + '</div>'
        + '<span class="wd-dot"></span></button>';
    }).join('');
  }

  // local YYYY-MM-DD (never UTC, so days don't drift across timezones)
  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* tap a day in the week strip → set or edit a goal for that day */
  function openDaySheet(key) {
    const parts = key.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    const when = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday'
      : (diff > 0 ? 'In ' + diff + ' days' : Math.abs(diff) + ' days ago');

    const wrap = ui.el('div');
    wrap.appendChild(ui.el('p', 'card-note', when + ' · ' + dayNames[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate()));
    const ta = ui.el('textarea', 'text-input day-goal-input');
    ta.rows = 3;
    ta.placeholder = diff > 0 ? 'What do you want to get done this day?' : 'Set a goal for this day…';
    ta.value = store.getGoal(key);
    wrap.appendChild(ta);

    const save = ui.el('button', 'btn btn-primary btn-block', 'Save goal');
    save.style.marginTop = '12px';
    save.addEventListener('click', () => {
      store.setGoal(key, ta.value);
      ui.closeSheet();
      renderHomeHeader();
      ui.toast(ta.value.trim() ? 'Goal saved' : 'Goal cleared');
    });
    wrap.appendChild(save);

    if (store.getGoal(key)) {
      const clr = ui.el('button', 'btn btn-ghost btn-block', 'Clear goal');
      clr.style.marginTop = '8px';
      clr.addEventListener('click', () => {
        store.setGoal(key, '');
        ui.closeSheet();
        renderHomeHeader();
        ui.toast('Goal cleared');
      });
      wrap.appendChild(clr);
    }

    ui.openSheet(dayNames[d.getDay()], wrap);
    setTimeout(() => ta.focus(), 300);
  }

  /* always-visible points in the top bar */
  function syncPoints() {
    const g = store.game();
    $('ptsSparks').textContent = g.sparks || 0;
    $('ptsStars').textContent = Clarity.game.levelOf(g.sparks || 0).num;   // star shows the level
  }

  /* gamified progress card (level, Sparks, streak, badges) */
  function renderProgress() {
    const g = store.game();
    const card = $('progCard');
    if (!g.sparks && !g.pages) { card.hidden = true; return; }
    card.hidden = false;

    const lv = Clarity.game.levelOf(g.sparks);
    $('progLevel').textContent = lv.num;
    $('progLevelName').textContent = lv.name;
    $('progLevelSub').textContent = lv.next
      ? (lv.next.min - g.sparks) + ' Sparks to level ' + (lv.num + 1)
      : 'Top level reached';

    const span = lv.ceil - lv.floor;
    const pct = lv.next ? Math.max(5, Math.min(100, Math.round(((g.sparks - lv.floor) / span) * 100))) : 100;
    $('progBar').style.width = pct + '%';

    const st = $('progStreak');
    if (g.streak >= 2) { st.hidden = false; $('progStreakN').textContent = g.streak; } else st.hidden = true;

    countUp($('progSparks'), g.sparks);
    countUp($('progStars'), g.stars || 0);
    countUp($('progPages'), g.pages);
  }

  /* celebratory, never-punishing feedback when Sparks are earned */
  function reward(res) {
    if (!res) return;
    if (res.stars) rewardPop('★ +' + res.stars + ' Star' + (res.stars > 1 ? 's' : ''));
    else if (res.gained > 0) rewardPop('+' + res.gained + ' Sparks');
    if (res.stars && res.gained > 0) setTimeout(() => ui.toast('+' + res.gained + ' Sparks', 2400), 700);
    if (res.leveledUp) setTimeout(() => ui.toast('Level ' + res.level + '. Keep going!', 3000), 900);
    res.newBadges.forEach((b, i) => setTimeout(() => ui.toast('Badge unlocked: ' + b.name, 3200), 1500 + i * 900));
    renderProgress();
    syncPoints();
  }

  let rewardTimer = null;
  function rewardPop(text) {
    const el = $('rewardPop');
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;            // restart the animation
    el.classList.add('show');
    clearTimeout(rewardTimer);
    rewardTimer = setTimeout(() => el.classList.remove('show'), 1400);
  }

  function countUp(el, to) {
    const fmt = (v) => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : String(v);
    // no animation when hidden or reduced-motion, just show the number
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = fmt(to); return;
    }
    const start = performance.now(), dur = 700;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // backstop: guarantee the final value even if rAF was throttled
    setTimeout(() => { el.textContent = fmt(to); }, dur + 120);
  }

  /* ═══ FOCUS HUB ═══ */
  const RING_C = 2 * Math.PI * 100;          // circumference of the timer ring
  const dayNum = (ms) => Math.floor((ms == null ? Date.now() : ms) / 86400000);

  let timerSel = 1;                          // default: Steady 15
  const T = { phase: 'idle', total: 0, left: 0, running: false, tick: null, breath: null };

  function renderFocus() {
    renderCalendar();
    renderWorkout();
    renderTodos();
    renderDailyCard();
    renderTodayPlan();
    renderTimerOpts();
    renderGameList();
    if (T.phase === 'idle') resetTimer(true);  // don't clobber a session in progress
    renderProgress();
  }

  /* brain-break games */
  function renderGameList() {
    const box = $('gameList');
    const bests = store.game().games || {};
    box.innerHTML = '';
    Clarity.games.LIST.forEach((g) => {
      const best = bests[g.id] && bests[g.id].best ? bests[g.id].best : 0;
      const card = document.createElement('button');
      card.className = 'game-card';
      card.dataset.id = g.id;
      card.innerHTML =
        '<span class="gc-art" style="background:' + g.tint + '">'
        + '<span class="gc-ico">' + (g.img ? '<img class="gc-img" src="' + g.img + '?v=126" alt="">' : '<svg viewBox="0 0 24 24">' + (ui.ICONS[g.icon] || '') + '</svg>') + '</span>'
        + '<span class="gc-cat">' + g.cat + '</span></span>'
        + '<span class="gc-body"><span class="gc-name">' + g.name + '</span>'
        + '<span class="gc-sub">' + (best ? 'Best ' + best : 'Tap to play') + '</span></span>';
      box.appendChild(card);
    });
  }

  let gameCtl = null, curGameId = null, dailyGameActive = false;
  function gameOfDay() {
    const list = Clarity.games.LIST;
    return list[dayNum() % list.length].id;
  }
  function openGame(id) {
    dailyGameActive = false;   // a plain game open; the daily entry re-sets this
    curGameId = id;
    if (gameCtl && gameCtl.destroy) { gameCtl.destroy(); gameCtl = null; }
    $('gameOv').hidden = false;
    showGameIntro(id);
  }
  function showGameIntro(id) {
    const g = Clarity.games.LIST.find((x) => x.id === id);
    const rec = (store.game().games || {})[id];
    $('gameOv').classList.add('intro');
    $('gameResult').hidden = true; $('gamePrompt').hidden = true; $('gameArea').hidden = true;
    $('gameMeta').textContent = ''; $('gameScore').textContent = '0';
    $('giArt').innerHTML = g.img ? '<img class="gi-img" src="' + g.img + '?v=126" alt="">' : g.art;
    $('giName').textContent = g.name;
    $('giCat').textContent = g.cat;
    $('giBest').textContent = (rec && rec.best) ? rec.best : '—';
    $('giScience').textContent = g.science;
    $('giHelp').innerHTML = g.help.map((h) =>
      '<div class="gi-item"><span class="gi-item-txt"><strong>' + h.title + '</strong><span>' + h.desc + '</span></span></div>').join('');
    $('gameIntro').hidden = false;
    $('gameIntro').scrollTop = 0;
  }
  function startGamePlay() {
    const id = curGameId;
    $('gameOv').classList.remove('intro');
    $('gameIntro').hidden = true;
    $('gameResult').hidden = true;
    $('gameArea').hidden = false; $('gamePrompt').hidden = false;
    $('gameMeta').textContent = ''; $('gameScore').textContent = '0'; $('gamePrompt').textContent = ''; $('gameArea').innerHTML = '';
    if (gameCtl && gameCtl.destroy) { gameCtl.destroy(); gameCtl = null; }
    const ctx = {
      area: $('gameArea'),
      setMeta: (h) => { $('gameMeta').innerHTML = h; },
      setPrompt: (h) => { $('gamePrompt').innerHTML = h; },
      setScore: (n) => { $('gameScore').textContent = n; },
      finish: (res) => finishGame(res)
    };
    gameCtl = Clarity.games.play(id, ctx);
  }
  function finishGame(res) {
    if (gameCtl && gameCtl.destroy) { gameCtl.destroy(); gameCtl = null; }
    const wasDaily = dailyGameActive;
    const rr = Clarity.game.playGame(curGameId, res.score);
    showGameResult(res, rr);
    reward(rr);
    // if this game was today's Daily Challenge, count it as done
    if (wasDaily) {
      const dr = Clarity.game.completeDaily();
      if (dr) { setTimeout(() => reward(dr), 900); renderDailyCard(); renderCalendar(); }
      dailyGameActive = false;
    }
  }
  function showGameResult(res, rr) {
    $('gameArea').hidden = true; $('gamePrompt').hidden = true;
    $('gameMeta').textContent = 'Done';
    const g = Clarity.games.LIST.find((x) => x.id === curGameId);
    const box = $('gameResult');
    box.innerHTML =
      '<div class="gr-score">' + res.score + '</div>'
      + '<div class="gr-tag' + (rr.newBest ? ' best' : '') + '">' + (rr.newBest ? 'New personal best!' : 'Nice work. Keep practicing!') + '</div>'
      + '<div class="gr-stats">'
      + '<div class="gr-stat"><b>' + res.correct + '</b><span>correct</span></div>'
      + '<div class="gr-stat"><b>' + res.accuracy + '%</b><span>accuracy</span></div>'
      + '<div class="gr-stat"><b>' + rr.best + '</b><span>your best</span></div>'
      + '</div>'
      + '<div class="gr-actions">'
      + '<button class="btn btn-ghost" id="gRetry">Play again</button>'
      + '<button class="btn btn-primary" id="gDone">Done</button>'
      + '</div>';
    box.hidden = false;
    $('gRetry').addEventListener('click', startGamePlay);
    $('gDone').addEventListener('click', closeGame);
  }
  function closeGame() {
    if (gameCtl && gameCtl.destroy) { gameCtl.destroy(); gameCtl = null; }
    $('gameOv').classList.remove('intro');
    $('gameOv').hidden = true;
    renderFocus();
  }

  /* badges program screen: every badge with progress toward it */
  function renderBadgesScreen() {
    const g = store.game();
    const earned = g.badges.length;
    const total = Clarity.game.BADGES.length;
    $('badgesCount').textContent = earned + ' of ' + total + ' unlocked';
    const box = $('badgesList');
    box.innerHTML = '';
    Clarity.game.BADGES.forEach((b, i) => {
      const st = Clarity.game.badgeStat(b.id);
      const card = document.createElement('div');
      card.className = 'bsc-card' + (st.got ? '' : ' locked');
      const check = st.got ? '<span class="bsc-check"><svg viewBox="0 0 24 24"><path d="M5 13l4 4 10-10"/></svg></span>' : '';
      const right = st.got
        ? '<span class="bsc-pct" style="color:var(--green-dk)">Done</span>'
        : '<span class="bsc-pct">' + st.pct + '%</span>';
      card.innerHTML =
        '<span class="bsc-ic' + (st.got ? ' got' : '') + '"><img class="bsc-img" src="img/badge-' + ((i % 4) + 1) + '.png?v=126" alt=""></span>'
        + '<span class="bsc-body"><span class="bsc-top"><span class="bsc-name">' + b.name + '</span>' + check + '</span>'
        + '<span class="bsc-desc">' + b.desc + '</span>'
        + '<span class="bsc-bar"><span class="bsc-fill" style="width:' + st.pct + '%"></span></span></span>'
        + right;
      box.appendChild(card);
    });
  }

  function shareClarity() {
    const msg = 'Clarity turns any worksheet into clear, calm steps you can read and hear. It is free and made for readers with dyslexia and ADHD.';
    const data = { title: 'Clarity', text: msg, url: location.origin };
    if (navigator.share) { navigator.share(data).catch(() => {}); return; }
    const copy = msg + ' ' + location.origin;
    if (navigator.clipboard) navigator.clipboard.writeText(copy).then(
      () => ui.toast('Message copied. Paste it to a friend or teacher.', 3200),
      () => ui.toast('Tell a friend or teacher about Clarity.', 3000));
    else ui.toast('Tell a friend or teacher about Clarity.', 3000);
  }

  /* ═══ FOCUS PLAN (brain dump → schedule) ═══ */
  // our own friendly mascot, a calm little blob
  const BLOB = '<svg viewBox="0 0 120 120" aria-hidden="true">'
    + '<defs><radialGradient id="blobG" cx="38%" cy="30%" r="82%"><stop offset="0%" stop-color="#A78BEE"/><stop offset="100%" stop-color="#6E4FD0"/></radialGradient></defs>'
    + '<path d="M60 11c27 0 47 18 47 45 0 32-21 53-47 53S13 88 13 56C13 29 33 11 60 11z" fill="url(#blobG)"/>'
    + '<ellipse cx="47" cy="55" rx="7.5" ry="10.5" fill="#fff"/><ellipse cx="73" cy="55" rx="7.5" ry="10.5" fill="#fff"/>'
    + '<circle cx="48.6" cy="58" r="3.7" fill="#2A2342"/><circle cx="74.6" cy="58" r="3.7" fill="#2A2342"/>'
    + '<circle cx="46" cy="55" r="1.4" fill="#fff"/><circle cx="72" cy="55" r="1.4" fill="#fff"/>'
    + '<path d="M51 74c5 5 13 5 18 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    + '<circle cx="35" cy="69" r="4" fill="#fff" opacity=".3"/><circle cx="85" cy="69" r="4" fill="#fff" opacity=".3"/></svg>';

  let planTime = 60;
  const dayKey = () => new Date().toISOString().slice(0, 10);

  function openPlan() {
    $('planResult').hidden = true; $('planQ').hidden = false;
    $('planQ').innerHTML =
      '<div class="plan-intro"><div class="plan-blob">' + BLOB + '</div>'
      + '<div class="plan-ask">Tell me everything you need to do. I’ll turn it into a plan.</div></div>'
      + '<textarea id="planDump" class="plan-dump" rows="5" placeholder="One thing per line, like:&#10;Read history chapter 4&#10;Math worksheet&#10;Study for Friday quiz"></textarea>'
      + '<div class="plan-tlabel">How much time do you have?</div>'
      + '<div class="plan-times" id="planTimes">'
      + [['30', '30 min'], ['60', '1 hour'], ['90', '1.5 hours']].map((o, i) =>
        '<button class="plan-time' + (o[0] === '60' ? ' on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('')
      + '</div>'
      + '<button class="btn btn-primary btn-block" id="btnMakePlan">Build my plan</button>';
    planTime = 60;
    $('btnMakePlan').addEventListener('click', buildPlan);
    $('planOv').hidden = false;
    $('planOv').querySelector('.plan-scroll').scrollTop = 0;
    setTimeout(() => $('planDump').focus(), 250);
  }
  function closePlan() { $('planOv').hidden = true; }
  function onPlanPick(e) {
    const t = e.target.closest('.plan-time');
    if (!t) return;
    $('planTimes').querySelectorAll('.plan-time').forEach((x) => x.classList.remove('on'));
    t.classList.add('on'); planTime = +t.dataset.v;
  }
  function buildPlan() {
    const tasks = $('planDump').value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6);
    if (!tasks.length) { ui.toast('Type at least one thing you need to do.', 2800); return; }
    const total = planTime, n = tasks.length;
    const blockPer = Math.max(10, Math.min(25, Math.floor((total - (n - 1) * 5) / n)));
    const steps = [];
    let used = 0;
    tasks.forEach((task, i) => {
      const block = Math.min(blockPer, total - used);
      if (block < 5) return;
      steps.push({ type: 'task', title: task, min: block, done: false });
      used += block;
      if (i < n - 1 && total - used >= 3) {
        const bm = Math.min(5, total - used);
        steps.push({ type: 'break', kind: i % 2 === 0 ? 'breathe' : 'game', title: i % 2 === 0 ? 'Breathe and reset' : 'Quick brain game', min: bm, done: false });
        used += bm;
      }
    });
    const g = store.game();
    g.plan = { date: dayKey(), steps };
    store.saveGame(g);
    renderPlanResult(steps);
  }
  function renderPlanResult(steps) {
    const taskCount = steps.filter((s) => s.type === 'task').length;
    $('planQ').hidden = true;
    $('planResult').hidden = false;
    $('planResult').innerHTML =
      '<div class="plan-lead">Here is your plan</div>'
      + '<div class="plan-sub">' + taskCount + ' thing' + (taskCount > 1 ? 's' : '') + ' to do, with breaks in between. It is now on your Focus tab so you can check things off.</div>'
      + planStepsHTML(steps)
      + '<div class="plan-actions"><button class="btn btn-primary btn-block" id="btnStartPlan">Start the first block</button></div>';
    $('btnStartPlan').addEventListener('click', startPlan);
  }
  const PS_ICON = {
    task: '<path d="M9 11l3 3L20 6"/><path d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h9"/>',
    breathe: '<path d="M12 3c1.6 3 4.5 4.6 4.5 8.5a4.5 4.5 0 11-9 0c0-1.4.5-2.5 1.3-3.4.2 1.7 1.3 2.2 2.1 1.4.9-.9.1-2.5-.9-3.6C11 3.6 11.3 2.8 12 2z"/>',
    game: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/>'
  };
  function planStepsHTML(steps) {
    return '<div class="plan-steps">' + steps.map((s, i) => {
      const last = i === steps.length - 1;
      const key = s.type === 'task' ? 'task' : s.kind;
      const kind = s.type === 'task' ? 'study' : 'break';
      return '<div class="plan-step">'
        + '<div class="ps-rail"><div class="ps-dot ' + kind + '"><svg viewBox="0 0 24 24">' + PS_ICON[key] + '</svg></div>' + (last ? '' : '<div class="ps-line"></div>') + '</div>'
        + '<div class="ps-body"><div class="ps-ttl' + (s.done ? ' done' : '') + '">' + escapeHtml(s.title) + '</div><div class="ps-meta">' + s.min + ' minutes</div></div>'
        + '<button class="ps-check' + (s.done ? ' on' : '') + '" data-i="' + i + '" aria-label="Mark done"><svg viewBox="0 0 24 24"><path d="M5 13l4 4 10-10"/></svg></button>'
        + '</div>';
    }).join('') + '</div>';
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function startPlan() {
    closePlan();
    const g = store.game();
    const first = g.plan && g.plan.steps.find((s) => s.type === 'task');
    const block = first ? first.min : 15;
    let idx = D.TIMERS.findIndex((t) => t.study === block);
    if (idx < 0) idx = D.TIMERS.reduce((best, t, i) => Math.abs(t.study - block) < Math.abs(D.TIMERS[best].study - block) ? i : best, 0);
    timerSel = idx;
    go('focus');
    openFocusFull();
    startStudy();
    ui.toast('Plan started. Work through it on your Focus tab.', 3600);
  }

  /* today's plan card on the Focus tab */
  function renderTodayPlan() {
    const g = store.game();
    const has = g.plan && g.plan.date === dayKey() && g.plan.steps && g.plan.steps.length;
    $('todayPlan').hidden = !has;
    $('planCard').hidden = !!has;
    if (!has) return;
    const steps = g.plan.steps;
    const doneN = steps.filter((s) => s.done).length;
    $('todayPlan').innerHTML =
      '<div class="tp-head"><h2 class="fcard-h">Today’s plan</h2>'
      + '<span class="tp-count">' + doneN + ' / ' + steps.length + '</span></div>'
      + planStepsHTML(steps)
      + '<button class="tp-clear" id="tpClear">Clear plan</button>';
    $('tpClear').addEventListener('click', clearPlan);
  }
  function togglePlanStep(i) {
    const g = store.game();
    if (!g.plan || !g.plan.steps[i]) return;
    g.plan.steps[i].done = !g.plan.steps[i].done;
    store.saveGame(g);
    renderTodayPlan();
    if (!$('planOv').hidden && !$('planResult').hidden) renderPlanResult(g.plan.steps);
  }
  function clearPlan() {
    const g = store.game();
    g.plan = null; store.saveGame(g);
    renderTodayPlan();
  }

  /* ═══ TO-DO LIST (priority groups) ═══ */
  let todoPrioSel = 'high';
  const PRIO = { high: 'High', med: 'Medium', low: 'Low' };
  function renderTodos() {
    const g = store.game();
    const todos = g.todos || [];
    const left = todos.filter((t) => !t.done).length;
    $('todoLeft').textContent = left ? left + ' left' : (todos.length ? 'all done' : '');
    const box = $('todoGroups');
    if (!todos.length) { box.innerHTML = '<div class="todo-empty">Nothing yet. Add what you need to do above.</div>'; return; }
    box.innerHTML = ['high', 'med', 'low'].map((prio) => {
      const items = todos.filter((t) => t.prio === prio);
      if (!items.length) return '';
      return '<div class="todo-group"><div class="tg-head ' + prio + '"><span class="tg-dot"></span>' + PRIO[prio].toUpperCase() + '</div>'
        + items.map((t) =>
          '<div class="todo-item' + (t.done ? ' done' : '') + '">'
          + '<button class="todo-check' + (t.done ? ' on' : '') + '" data-act="toggle" data-id="' + t.id + '"><svg viewBox="0 0 24 24"><path d="M5 13l4 4 10-10"/></svg></button>'
          + '<span class="todo-text">' + escapeHtml(t.text) + '</span>'
          + '<button class="todo-del" data-act="del" data-id="' + t.id + '" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
          + '</div>').join('')
        + '</div>';
    }).join('');
  }
  function addTodo() {
    const input = $('todoInput');
    const text = input.value.trim();
    if (!text) return;
    const g = store.game();
    g.todos = g.todos || [];
    g.todos.push({ id: 'td' + Date.now(), text, prio: todoPrioSel, done: false });
    store.saveGame(g);
    input.value = '';
    renderTodos();
  }
  function onTodoClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const g = store.game();
    const i = (g.todos || []).findIndex((t) => t.id === b.dataset.id);
    if (i < 0) return;
    if (b.dataset.act === 'toggle') g.todos[i].done = !g.todos[i].done;
    else if (b.dataset.act === 'del') g.todos.splice(i, 1);
    store.saveGame(g);
    renderTodos();
  }
  function onTodoPrio(e) {
    const p = e.target.closest('.tp-pill');
    if (!p) return;
    todoPrioSel = p.dataset.v;
    $('todoPrio').querySelectorAll('.tp-pill').forEach((x) => x.classList.remove('on'));
    p.classList.add('on');
  }

  /* ═══ FULL-SCREEN FOCUS ═══ */
  function openFocusFull() {
    resetTimer(true);                 // ready state
    $('focusFull').hidden = false;
    $('ffMusic').hidden = true;
  }
  function closeFocusFull() {
    resetTimer(true);
    stopSound();
    $('focusFull').hidden = true;
  }

  /* ═══ CALM FOCUS SOUNDS (generated on-device, no audio files) ═══ */
  const SOUNDS = [
    { id: 'calm', name: 'Calm noise', emoji: '🌫️' },
    { id: 'rain', name: 'Soft rain', emoji: '🌧️' },
    { id: 'hum', name: 'Gentle hum', emoji: '🎐' }
  ];
  let audioCtx = null, noiseNode = null, currentSound = null;
  function renderMusic() {
    $('ffmOpts').innerHTML =
      '<button class="ffm-opt' + (!currentSound ? ' on' : '') + '" data-s="">\u{1F507} <span>Off</span></button>'
      + SOUNDS.map((s) => '<button class="ffm-opt' + (currentSound === s.id ? ' on' : '') + '" data-s="' + s.id + '">' + s.emoji + ' <span>' + s.name + '</span></button>').join('');
  }
  function playSound(id) {
    stopSound();
    if (!id) { renderMusic(); updateTuneBtn(); return; }
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const ctx = audioCtx, size = 2 * ctx.sampleRate;
      const buf = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < size; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const filt = ctx.createBiquadFilter();
      const gain = ctx.createGain(); gain.gain.value = 0;
      let osc = null, vol = 0.13;
      if (id === 'calm') { filt.type = 'lowpass'; filt.frequency.value = 500; }
      else if (id === 'rain') { filt.type = 'bandpass'; filt.frequency.value = 1500; filt.Q.value = 0.6; vol = 0.1; }
      else { filt.type = 'lowpass'; filt.frequency.value = 240; osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 110; const og = ctx.createGain(); og.gain.value = 0.04; osc.connect(og); og.connect(ctx.destination); osc.start(); }
      src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      src.start();
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);
      noiseNode = { src, gain, osc };
      currentSound = id;
      renderMusic(); updateTuneBtn();
    } catch (e) { ui.toast('Sound is not available on this device.', 2800); }
  }
  function stopSound() {
    if (noiseNode && audioCtx) {
      const n = noiseNode;
      try { n.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25); } catch (e) {}
      setTimeout(() => { try { n.src.stop(); } catch (e) {} try { if (n.osc) n.osc.stop(); } catch (e) {} }, 300);
      noiseNode = null;
    }
    currentSound = null;
    renderMusic(); updateTuneBtn();
  }
  function updateTuneBtn() {
    const b = $('btnTune'); if (!b) return;
    b.classList.toggle('on', !!currentSound);
    const s = SOUNDS.find((x) => x.id === currentSound);
    b.querySelector('span').textContent = s ? s.name : 'Tune in';
  }

  function renderCalendar() {
    const g = store.game();
    const now = new Date();
    const names = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    // a rolling 7-day window with today in the middle, like a daily-streak tracker
    const start = new Date(now); start.setDate(now.getDate() - 3); start.setHours(0, 0, 0, 0);
    const todayMid = new Date(now); todayMid.setHours(0, 0, 0, 0);
    const sN = $('streakN'); if (sN) sN.textContent = g.streak || 0;
    $('calWeek').innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const diff = Math.round((todayMid - d) / 86400000);        // 0 = today, >0 = past
      const isToday = diff === 0;
      const done = g.streak > 0 && diff > 0 && diff <= g.streak - 1;   // past days in the streak
      const cls = 'cw-cell' + (isToday ? ' today' : '') + (done ? ' done' : '');
      return '<div class="' + cls + '">'
        + '<div class="cw-lab">' + names[d.getDay()] + '</div>'
        + '<span class="cw-dot"></span></div>';
    }).join('');
  }

  /* "Today" workout — three games picked for the day, shown as a stepper list */
  let workoutQueue = [];
  function todaysGames() {
    const L = Clarity.games.LIST;
    const seed = new Date().getDate() % L.length;   // stable within a day, rotates daily
    return [0, 1, 2].map((k) => L[(seed + k) % L.length]);
  }
  function renderWorkout() {
    const box = $('workoutList'); if (!box) return;
    const games = todaysGames();
    workoutQueue = games.map((g) => g.id);
    box.innerHTML = games.map((g, i) =>
      '<button class="wk-game" data-id="' + g.id + '">'
      + '<span class="wk-art" style="background:' + g.tint + '">' + (g.img ? '<img class="wk-img" src="' + g.img + '?v=126" alt="">' : '<svg viewBox="0 0 24 24">' + (ui.ICONS[g.icon] || '') + '</svg>') + '</span>'
      + '<span class="wk-name">' + g.name + '</span>'
      + '<span class="wk-step' + (i === 0 ? ' active' : '') + '"></span></button>').join('');
  }

  function msToReset() {
    const n = new Date(); const mid = new Date(n); mid.setHours(24, 0, 0, 0);
    const m = Math.max(0, Math.round((mid - n) / 60000));
    return 'Resets in ' + Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }

  function renderDailyCard() {
    const done = Clarity.game.dailyDone();
    $('dailyQuiz').hidden = true;
    const tiles = $('focusTiles'); if (tiles) tiles.hidden = false;
    $('dailyReset').textContent = done ? 'Done today' : 'Play today’s game';
    const btn = $('btnDaily');
    btn.classList.toggle('done', done);
    btn.disabled = done;
  }

  /* daily challenge quiz */
  let dq = { items: [], i: 0, answered: false };
  function startDaily() {
    if (Clarity.game.dailyDone()) return;
    openGame(gameOfDay());     // today's challenge is one brain game
    dailyGameActive = true;    // set after openGame, which clears it
  }
  function renderDQ() {
    const q = dq.items[dq.i];
    dq.answered = false;
    $('dqBar').style.width = ((dq.i / 5) * 100) + '%';
    $('dqCount').textContent = 'Question ' + (dq.i + 1) + ' of 5';
    $('dqQ').textContent = q.q;
    $('dqTip').hidden = true;
    $('btnDqNext').hidden = true;
    $('btnDqNext').textContent = dq.i === 4 ? 'Finish' : 'Next';
    const box = $('dqOpts');
    box.innerHTML = '';
    q.opts.forEach((opt, idx) => {
      const b = document.createElement('button');
      b.className = 'dq-opt'; b.textContent = opt; b.dataset.idx = idx;
      box.appendChild(b);
    });
  }
  function answerDQ(idx) {
    if (dq.answered) return;
    dq.answered = true;
    const q = dq.items[dq.i];
    $('dqOpts').querySelectorAll('.dq-opt').forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add('right');
      else if (i === idx) b.classList.add('wrong');
    });
    const tip = $('dqTip');
    tip.textContent = (idx === q.a ? 'Correct. ' : 'The answer: ' + q.opts[q.a] + '. ') + q.tip;
    tip.hidden = false;
    $('dqBar').style.width = (((dq.i + 1) / 5) * 100) + '%';
    $('btnDqNext').hidden = false;
  }
  function nextDQ() {
    if (dq.i < 4) { dq.i++; renderDQ(); return; }
    reward(Clarity.game.completeDaily());     // Sparks + a Star
    renderDailyCard();
    renderCalendar();
  }

  /* focus timer */
  function renderTimerOpts() {
    const box = $('timerOpts');
    box.innerHTML = '';
    D.TIMERS.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'timer-opt' + (i === timerSel ? ' on' : '');
      b.dataset.idx = i;
      b.innerHTML = '<strong>' + t.study + 'm</strong><span>' + t.label + '</span>';
      box.appendChild(b);
    });
  }
  function fmtClock(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function paintRing() {
    const el = $('ringProg');
    el.style.strokeDasharray = RING_C;
    const elapsed = T.total ? (T.total - T.left) / T.total : 0;
    el.style.strokeDashoffset = (RING_C * elapsed).toFixed(1);
  }
  function selectTimer(i) {
    if (T.phase !== 'idle') return;
    timerSel = i; renderTimerOpts(); resetTimer(true);
  }
  function resetTimer(soft) {
    if (!soft) { /* hard reset from a running state */ }
    clearInterval(T.tick); clearTimeout(T.breath);
    T.phase = 'idle'; T.running = false;
    const t = D.TIMERS[timerSel];
    T.total = t.study * 60; T.left = T.total;
    $('breathWrap').hidden = true;
    $('btnBreakGame').hidden = true;
    $('ringWrap').classList.remove('brk');
    $('timerPhase').textContent = 'Ready';
    $('timerTime').textContent = fmtClock(T.left);
    $('timerTime').hidden = false;
    { const th = $('timerHint'); if (th) th.textContent = 'Pick a length. Study, then take a real break.'; }
    $('btnTimer').textContent = 'Start';
    $('btnTimer').disabled = false;
    $('btnTimerReset').hidden = true;
    paintRing();
  }
  function startStudy() {
    const t = D.TIMERS[timerSel];
    T.phase = 'study'; T.total = t.study * 60; T.left = T.total; T.running = true;
    $('timerPhase').textContent = 'Studying';
    { const th = $('timerHint'); if (th) th.textContent = 'Eyes on one thing. You have got this.'; }
    $('btnTimer').textContent = 'Pause';
    $('btnTimerReset').hidden = false;
    runTick();
  }
  function startBreak() {
    const t = D.TIMERS[timerSel];
    T.phase = 'break'; T.total = t.brk * 60; T.left = T.total; T.running = true;
    $('ringWrap').classList.add('brk');
    $('timerPhase').textContent = 'Break';
    $('timerTime').hidden = true;
    { const th = $('timerHint'); if (th) th.textContent = 'Follow the circle. In, hold, out, hold.'; }
    $('btnTimer').textContent = 'End break';
    $('btnBreakGame').hidden = false;
    $('breathWrap').hidden = false;
    paintRing();
    runBreath(0);
    runTick();
  }
  function runBreath(i) {
    const steps = D.BREATH, step = steps[i % steps.length];
    $('breathLabel').textContent = step.label;
    $('breathCircle').classList.toggle('big', step.scale === 1);
    T.breath = setTimeout(() => { if (T.phase === 'break') runBreath(i + 1); }, step.secs * 1000);
  }
  function runTick() {
    clearInterval(T.tick);
    T.tick = setInterval(() => {
      if (!T.running) return;
      T.left--;
      if (T.phase === 'study') $('timerTime').textContent = fmtClock(Math.max(0, T.left));
      paintRing();
      if (T.left <= 0) phaseDone();
    }, 1000);
  }
  function phaseDone() {
    clearInterval(T.tick);
    if (T.phase === 'study') {
      reward(Clarity.game.finishFocus(D.TIMERS[timerSel].study));
      startBreak();
    } else {
      clearTimeout(T.breath);
      ui.toast('Break over. Ready for another round?', 3000);
      resetTimer(true);
    }
  }
  function timerPrimary() {
    if (T.phase === 'idle') { startStudy(); return; }
    if (T.phase === 'break') { clearTimeout(T.breath); ui.toast('Nice. Break skipped.', 2000); resetTimer(true); return; }
    // study: pause / resume
    T.running = !T.running;
    $('btnTimer').textContent = T.running ? 'Pause' : 'Resume';
    $('timerPhase').textContent = T.running ? 'Studying' : 'Paused';
  }

  function renderLibrary() {
    ui.renderDocList($('libraryList'), store.docs(), openDoc, confirmDeleteDoc,
      'Every page you make clear will live here, waiting for you.');
  }

  function renderProfileList() {
    ui.renderProfiles($('profileList'), store.activeProfile().id, pickProfile, editProfile);
  }

  /* loader */
  let stages = [];
  function setStages(labels) {
    stages = labels;
    const c = $('loaderSteps');
    c.replaceChildren();
    labels.forEach(l => {
      const row = ui.el('div', 'ls');
      row.appendChild(ui.el('div', 'ls-dot'));
      row.appendChild(ui.el('span', null, l));
      c.appendChild(row);
    });
  }
  function stage(i, msg) {
    [...$('loaderSteps').children].forEach((n, k) => {
      n.classList.toggle('done', k < i);
      n.classList.toggle('on', k === i);
    });
    if (msg) $('loaderMsg').textContent = msg;
    else if (stages[i]) $('loaderMsg').textContent = stages[i] + '…';
  }

  /* the pipeline */
  /* live camera */
  const camera = Clarity.camera;

  let camOpening = false;
  async function openCamera() {
    if (camOpening) return;          // guard against a double-fire re-entering us
    camOpening = true;
    // No live camera (old browser, or plain-http phone) → OS camera picker.
    if (!camera.supported) { camOpening = false; $('fileCamera').click(); return; }
    try {
      $('camera').hidden = false;
      $('camShutter').classList.remove('busy');
      // Race against a timeout: if the stream never starts (blocked, no device),
      // don't leave the user staring at a black screen, fall back.
      await Promise.race([
        camera.start($('camVideo')),
        new Promise((_, rej) => setTimeout(() => rej(new Error('camera-timeout')), 9000))
      ]);
      camOpening = false;
    } catch (e) {
      console.warn('Clarity: live camera unavailable, using the file picker.', e);
      camera.stop();
      $('camera').hidden = true;
      camOpening = false;
      const denied = /NotAllowed|Permission/i.test((e && e.name) || '');
      ui.toast(denied ? 'Camera permission was blocked. Opening the photo picker.'
                      : 'Live camera not available. Opening the photo picker.', 3600);
      $('fileCamera').click();
    }
  }

  function closeCamera() {
    camOpening = false;
    camera.stop();
    $('camera').hidden = true;
  }

  async function shootCamera() {
    const shutter = $('camShutter');
    shutter.classList.add('busy');
    const file = await camera.capture();
    closeCamera();
    if (file) makeDoc({ file });
    else ui.toast('Could not capture the photo. Try again.');
  }

  /* scan-reveal animation */
  const SR = {
    show() {
      $('srImg').removeAttribute('src');
      $('srBoxes').getContext('2d').clearRect(0, 0, 9999, 9999);
      $('srLaser').classList.remove('sweeping');
      $('srSpinner').classList.remove('done');
      $('srCount').textContent = '';
      $('srMsg').textContent = 'Opening the photo…';
      $('scanReveal').hidden = false;
    },
    setImage(url, w, h) {
      const img = $('srImg');
      img.onload = () => {
        const box = $('srBoxes');
        box.width = img.clientWidth; box.height = img.clientHeight;
        $('srLaser').classList.add('sweeping');
      };
      img.src = url;
      SR._w = w; SR._h = h;
    },
    msg(text, pct) {
      $('srMsg').textContent = pct != null ? `${text} ${Math.round(pct * 100)}%` : text;
    },
    /** Draw the detected word boxes, staggered, so you watch them appear. */
    async revealWords(words) {
      const box = $('srBoxes');
      const ctx = box.getContext('2d');
      const W = box.width, H = box.height;
      if (!words.length || !W) return;
      const total = Math.min(words.length, 160);
      const per = Math.max(6, Math.floor(900 / total));   // spread over ~0.9s
      let shown = 0;
      for (let i = 0; i < total; i++) {
        const w = words[i];
        ctx.fillStyle = 'rgba(31,140,125,0.18)';
        ctx.strokeStyle = 'rgba(93,224,205,0.95)';
        ctx.lineWidth = 1.5;
        const x = w.x * W, y = w.y * H, ww = w.w * W, hh = w.h * H;
        ctx.fillRect(x, y, ww, hh);
        ctx.strokeRect(x, y, ww, hh);
        shown++;
        if (i % 4 === 0) {
          $('srCount').textContent = shown + ' words found';
          await wait(per * 4);
        }
      }
      $('srCount').textContent = words.length + ' words found';
    },
    finish() {
      $('srLaser').classList.remove('sweeping');
      $('srSpinner').classList.add('done');
    },
    hide() { $('scanReveal').hidden = true; }
  };

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  async function makeDoc({ file, text, title }) {
    const prof = store.activeProfile();
    let thumb = null, source = text || '';

    try {
      if (file) {
        /* photo path, the scan-reveal "wow" moment */
        SR.show();
        const t0 = performance.now();
        const res = await Clarity.ocr.read(file, {
          onImage: (url, w, h) => SR.setImage(url, w, h),
          onStage: (msg, pct) => SR.msg(msg, pct)
        });
        source = res.text;
        thumb = res.thumb;

        // let the laser sweep for a beat even when OCR was instant (warm cache)
        const swept = performance.now() - t0;
        if (swept < 1500) await wait(1500 - swept);

        SR.msg('Reading complete');
        await SR.revealWords(res.words || []);
        SR.finish();
        await wait(650);
        SR.msg('Rebuilding it for ' + prof.name + '…');

        const doc = await buildDoc(source, prof, thumb, title);
        current = store.saveDoc(doc);
        reward(Clarity.game.award('page'));
        mode = prof.mode || 'steps';
        openReader();
        SR.hide();
        return;
      }

      /* text / paste / sample path, the step loader */
      go('loading');
      setStages(['Breaking it into steps', 'Matching your profile']);
      if (!source.trim()) throw new Error('There was no text to work with.');
      stage(0, 'Breaking it into steps…');
      await frame();
      const doc = await buildDoc(source, prof, null, title);
      stage(1, 'Almost there…');
      await frame();
      current = store.saveDoc(doc);
      reward(Clarity.game.award('page'));
      mode = prof.mode || 'steps';
      openReader();
    } catch (e) {
      console.error(e);
      SR.hide();
      ui.toast(e.message || 'Something went wrong reading that page.', 5000);
      go('capture', false);
    }
  }

  /** Reformat `source` for `prof` with the built-in engine. */
  async function buildDoc(source, prof, thumb, title) {
    if (!source.trim()) throw new Error('There was no text to work with.');
    let doc = engine.process(source, prof);
    doc.thumb = thumb;
    if (title) doc.title = title;
    return doc;
  }

  const frame = () => new Promise(r => setTimeout(r, 260));

  /* reader */
  function openDoc(id) {
    const doc = store.getDoc(id);
    if (!doc) return;
    current = doc;
    const prof = store.profiles().find(p => p.id === doc.profileId) || store.activeProfile();
    mode = prof.mode || 'steps';
    openReader();
  }

  function openReader() {
    if (!current) return;
    focusOn = false;
    $('btnFocus').setAttribute('aria-pressed', 'false');
    $('docTitle').textContent = current.title;
    ui.renderChips($('levelChips'), current);
    ui.renderReport($('clarityReport'), current);
    $('btnGlossary').hidden = !(current.glossary && current.glossary.length);
    setMode(mode, true);
    go('reader');
    animateReport();
  }

  /** Count the impact numbers up once the reader is on screen.
     countUp handles reduced-motion / hidden tabs by snapping to the final
     value, so the numbers are never left at 0. */
  function animateReport() {
    document.querySelectorAll('#clarityReport .rstat-num').forEach(node =>
      countUp(node, parseInt(node.dataset.count, 10) || 0));
  }

  function paintReader() {
    wordGroups = ui.renderDoc($('docBody'), current, mode);
    const host = $('docBody');
    for (const exp of (current.explanations || [])) {
      const { node, groups } = ui.explanationCard(exp);
      host.parentNode.insertBefore(node, host.nextSibling);
      wordGroups.push(...groups);
    }
  }

  /* focus mode (reading ruler) */
  let focusOn = false;

  function focusBlock(blk) {
    if (!blk) return;
    document.querySelectorAll('#docBody .blk.focused').forEach(n => n.classList.remove('focused'));
    blk.classList.add('focused');
  }

  function toggleFocus() {
    focusOn = !focusOn;
    $('btnFocus').setAttribute('aria-pressed', focusOn ? 'true' : 'false');
    $('docBody').classList.toggle('focus-on', focusOn);
    if (focusOn) {
      focusBlock(document.querySelector('#docBody .blk'));
      ui.toast('Focus mode on. Tap a step to light it up.');
    }
  }

  /* save the clear page as an image */
  function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function saveImage() {
    if (!current) return;
    ui.toast('Making your image…', 1500);
    await frame();

    const W = 1080, pad = 70, contentW = W - pad * 2;
    const scale = 2;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const body = 34, lh = 50, gap = 26, stepPad = 24;

    // measure height first
    ctx.font = `600 ${body}px Lexend, sans-serif`;
    const items = current.blocks.filter(b => b.kind === 'step' || b.kind === 'question' || b.kind === 'heading');

    // header: title + a one-line impact summary, measured so nothing overlaps
    ctx.font = '700 44px Fraunces, Georgia, serif';
    const titleLines = wrapText(ctx, current.title, contentW).slice(0, 2);
    const st = current.stats || {};
    const impactParts = [];
    const gBefore = Math.round(st.before || 0), gAfter = Math.round(st.after || 0);
    if (st.before && st.after && gBefore > gAfter) impactParts.push(`Grade ${gBefore} → ${gAfter}`);
    if (st.hard) impactParts.push(`${st.hard} words simplified`);
    if (st.steps) impactParts.push(`${st.steps} clear steps`);
    const impactLine = impactParts.join('   •   ');
    const titleTop = 96, titleLH = 54;
    const lastTitleBase = titleTop + (titleLines.length - 1) * titleLH;
    const impactBase = lastTitleBase + 46;
    const contentTop = (impactLine ? impactBase : lastTitleBase) + 54;
    let h = contentTop;
    const laid = items.map(b => {
      const isHead = b.kind === 'heading';
      ctx.font = `${isHead ? 700 : 500} ${isHead ? 26 : body}px Lexend, sans-serif`;
      const lines = wrapText(ctx, b.text, contentW - (isHead ? 0 : 64));
      const bh = isHead ? 60 : lines.length * lh + stepPad * 2;
      h += bh + gap;
      return { b, isHead, lines, bh };
    });
    h += 90;

    c.width = W * scale; c.height = h * scale;
    ctx.scale(scale, scale);

    // background
    ctx.fillStyle = '#F5F1EA'; ctx.fillRect(0, 0, W, h);
    // header
    ctx.fillStyle = '#16302F';
    ctx.font = '700 44px Fraunces, Georgia, serif';
    titleLines.forEach((ln, i) => ctx.fillText(ln, pad, titleTop + i * titleLH));
    if (impactLine) {
      ctx.fillStyle = '#1F8C7D';
      ctx.font = '600 27px Lexend, sans-serif';
      ctx.fillText(impactLine, pad, impactBase);
    }

    let n = 0, y = contentTop;
    for (const it of laid) {
      if (it.isHead) {
        ctx.fillStyle = '#1F8C7D';
        ctx.font = '700 24px Lexend, sans-serif';
        ctx.fillText(it.b.text.toUpperCase(), pad, y + 30);
        y += it.bh + gap;
        continue;
      }
      n++;
      // step card
      roundRect(ctx, pad, y, contentW, it.bh, 20);
      ctx.fillStyle = '#EAF3F0'; ctx.fill();
      // number
      roundRect(ctx, pad + stepPad, y + stepPad, 44, 44, 12);
      ctx.fillStyle = '#1F8C7D'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 24px Lexend, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(String(n), pad + stepPad + 22, y + stepPad + 31);
      ctx.textAlign = 'left';
      // text
      ctx.fillStyle = '#16302F'; ctx.font = `500 ${body}px Lexend, sans-serif`;
      it.lines.forEach((ln, i) => ctx.fillText(ln, pad + stepPad + 64, y + stepPad + 34 + i * lh));
      y += it.bh + gap;
    }
    // footer
    ctx.fillStyle = '#7A9694'; ctx.font = '500 26px Lexend, sans-serif';
    ctx.fillText('Made clear with Clarity', pad, h - 45);

    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    if (!blob) { ui.toast('Could not make the image.'); return; }
    const file = new File([blob], (current.title || 'clarity').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png', { type: 'image/png' });

    // share on mobile if possible, otherwise download
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: current.title }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    ui.toast('Saved the clear version');
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* quick text size */
  function bumpSize(delta) {
    const prof = store.activeProfile();
    prof.size = Math.max(15, Math.min(30, (prof.size || 19) + delta));
    store.saveProfile(prof);
    ui.applyProfile(prof);
    ui.toast('Text size ' + prof.size + 'px', 1200);
  }

  function setMode(next, silent) {
    mode = next;
    document.querySelectorAll('#segMode .seg-btn').forEach(b => b.classList.toggle('is-on', b.dataset.mode === next));
    // drop any previously inserted explanation cards before repainting
    document.querySelectorAll('.explain-card').forEach(n => n.remove());
    document.querySelectorAll('#view-reader .quiz').forEach(n => n.remove());
    speech.stop();
    setPlayIcon(false);
    paintReader();
    // restore focus mode across a repaint
    $('docBody').classList.toggle('focus-on', focusOn);
    if (focusOn) focusBlock(document.querySelector('#docBody .blk'));
    requestAnimationFrame(moveThumb);
    if (!silent) $('views').scrollTo({ top: 0, behavior: 'smooth' });
  }

  function moveThumb() {
    const on = document.querySelector('#segMode .seg-btn.is-on');
    if (!on) return;
    const thumb = $('segThumb');
    thumb.style.left = on.offsetLeft + 'px';
    thumb.style.width = on.offsetWidth + 'px';
  }

  /* read aloud */
  function setPlayIcon(playing) {
    $('btnPlay').querySelector('.ic-play').hidden = playing;
    $('btnPlay').querySelector('.ic-pause').hidden = !playing;
    $('btnPlay').setAttribute('aria-label', playing ? 'Pause' : 'Read aloud');
  }

  function togglePlay() {
    if (!speech.supported) { ui.toast('This browser cannot read text aloud.', 3200); return; }
    if (speech.playing && !speech.paused) { speech.pause(); setPlayIcon(false); return; }
    if (speech.playing && speech.paused) { speech.resume(); setPlayIcon(true); return; }

    const prof = store.activeProfile();
    speech.setRate(prof.rate || 1);
    $('btnSpeed').textContent = (prof.rate || 1).toFixed(2).replace(/0$/, '') + '×';

    const ok = speech.play(wordGroups, {
      onWord: (elm) => {
        if (focusOn) focusBlock(elm.closest('.blk'));
        const box = elm.getBoundingClientRect();
        const host = $('views').getBoundingClientRect();
        if (box.top < host.top + 90 || box.bottom > host.bottom - 130) {
          elm.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      },
      onProgress: (p) => { $('pbFill').style.width = (p * 100).toFixed(1) + '%'; },
      onEnd: () => { setPlayIcon(false); $('pbFill').style.width = '0%'; }
    });
    setPlayIcon(ok);
    if (ok) reward(Clarity.game.award('listen'));
    else ui.toast('Nothing to read on this page yet.');
  }

  function cycleSpeed() {
    const prof = store.activeProfile();
    const i = speeds.indexOf(nearestSpeed(prof.rate || 1));
    const next = speeds[(i + 1) % speeds.length];
    prof.rate = next;
    store.saveProfile(prof);
    speech.setRate(next);
    $('btnSpeed').textContent = next.toFixed(2).replace(/0$/, '') + '×';
    ui.toast('Reading speed ' + next + '×', 1400);
  }
  const nearestSpeed = (r) => speeds.reduce((a, b) => Math.abs(b - r) < Math.abs(a - r) ? b : a, speeds[0]);

  /* explain differently */
  function askExplain() {
    if (!current) return;
    ui.strategySheet(async (strat) => {
      const btn = $('btnExplain');
      btn.classList.add('busy');
      const prof = store.activeProfile();
      const exp = engine.explainOffline(current, strat.id, prof);
      btn.classList.remove('busy');

      current.explanations = current.explanations || [];
      current.explanations.push(exp);
      store.saveDoc(current);

      setMode(mode, true);
      requestAnimationFrame(() => {
        const cards = document.querySelectorAll('.explain-card');
        const last = cards[cards.length - 1];
        if (last) last.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* comprehension check */
  async function askCheck() {
    if (!current) return;
    document.querySelectorAll('#view-reader .quiz').forEach(n => n.remove());
    const btn = $('btnCheck');
    btn.classList.add('busy');
    const prof = store.activeProfile();
    const quiz = engine.quizOffline(current);
    btn.classList.remove('busy');

    const card = ui.quizCard(quiz, () => reward(Clarity.game.award('check')));
    const spacer = document.querySelector('#view-reader .reader-spacer');
    spacer.parentNode.insertBefore(card, spacer);
    requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  /* in-app lessons (slideshow) */
  let lesson = null, lessonIx = 0;

  function openLesson(l) {
    lesson = l; lessonIx = 0;
    paintLesson();
    $('lesson').hidden = false;
  }
  function closeLesson() { $('lesson').hidden = true; lesson = null; }

  function paintLesson() {
    if (!lesson) return;
    const s = lesson.slides[lessonIx];
    $('lessonTag').textContent = lesson.tag + ' · ' + lesson.title;
    $('lessonH').textContent = s.h;
    $('lessonP').textContent = s.b;
    const dots = $('lessonDots');
    dots.replaceChildren();
    lesson.slides.forEach((_, i) => dots.appendChild(ui.el('span', 'ldot' + (i === lessonIx ? ' on' : ''))));
    const last = lessonIx === lesson.slides.length - 1;
    // show the research source as a citation on the final slide
    const src = $('lessonSource');
    if (lesson.source && last) { src.textContent = 'Source: ' + lesson.source; src.hidden = false; }
    else { src.hidden = true; }
    $('lessonBack').hidden = lessonIx === 0;
    $('lessonNext').textContent = last ? 'Done' : 'Next';
  }
  function lessonNext() {
    if (!lesson) return;
    if (lessonIx >= lesson.slides.length - 1) {
      // only the real research lessons (they carry a source) earn Sparks
      if (lesson.source) reward(Clarity.game.award('lesson', { id: lesson.id }));
      closeLesson();
      return;
    }
    lessonIx++; paintLesson();
  }
  function lessonBack() {
    if (lessonIx > 0) { lessonIx--; paintLesson(); }
  }

  /* language */
  function applyLanguage() {
    i18n.apply();                                    // translate every data-i18n element
    const m = i18n.meta();
    $('langCode').textContent = (m ? m.code : 'en').toUpperCase();
    // dynamic strings the DOM walker can't reach
    if (view === 'home') renderHomeHeader();
    if (view === 'reader') requestAnimationFrame(moveThumb);   // widths changed
  }

  function setLanguage(code) {
    i18n.setLang(code);
    store.setSetting('lang', i18n.current());
    applyLanguage();
    const m = i18n.meta();
    if (m) ui.toast(m.flag + '  ' + m.name);
  }

  /* sign-in (local account) */
  let siChoice = { icon: 'user', color: D.PROFILE_COLORS[0] };

  function buildSignIn() {
    siChoice = { icon: 'user', color: D.PROFILE_COLORS[0] };

    const name = $('siName');
    const go = $('siGo');
    name.addEventListener('input', () => { go.disabled = name.value.trim().length < 1; });
    const submit = () => {
      const n = name.value.trim();
      if (!n) return;
      store.signIn({ name: n, icon: siChoice.icon, color: siChoice.color });
      store.setSetting('seenIntro', true);
      $('signin').hidden = true;
      renderHome();
      syncAccount();
    };
    go.addEventListener('click', submit);
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  function syncAccount() {
    const u = store.user();
    const g = store.game();
    const lv = Clarity.game.levelOf(g.sparks);
    $('phName').textContent = u ? u.name : 'Guest';
    const days = g.streak || 0;
    const lvlName = lv.num >= 4 ? 'Clarity Pro' : lv.name;
    $('phSub').textContent = lvlName + ' · ' + (days === 1 ? '1 day' : days + ' days');
    // the avatar is a soft marble "planet" orb — the inner node stays empty
    $('phAvatar').replaceChildren();
    $('btnSignOut').hidden = !u;

    // Tiimo-style stat cards
    const streak = g.streak || 0;
    const pages = g.pages || 0;
    $('stStreak').textContent = streak;
    $('stStreakSub').textContent = Math.min(streak, 3) + '/3 days';
    $('stStreakBar').style.width = Math.min(100, (streak / 3) * 100) + '%';
    $('stPages').textContent = pages;
    $('stPagesSub').textContent = pages === 1 ? '1 page' : pages + ' pages';
    const pageGoal = Math.max(5, Math.ceil((pages + 1) / 5) * 5);
    $('stPagesBar').style.width = Math.min(100, (pages / pageGoal) * 100) + '%';
  }

  function greetText() {
    const h = new Date().getHours();
    const g = t(h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening');
    const u = store.user();
    return u ? g + ', ' + u.name + ' 👋' : g;
  }

  /* profiles */
  /* profile chips on the Add-a-page screen */
  function renderCaptureProfiles() {
    const box = $('capProfiles'); if (!box) return;
    const activeId = store.activeProfile().id;
    box.replaceChildren();
    for (const p of store.profiles()) {
      const chip = ui.el('button', 'cap-pp' + (p.id === activeId ? ' is-on' : ''));
      chip.dataset.id = p.id;
      chip.appendChild(ui.profileBadge(p, 'cap-pp-badge'));
      chip.appendChild(ui.el('span', 'cap-pp-name', p.name));
      box.appendChild(chip);
    }
  }

  function pickProfile(id) {
    store.setActiveProfile(id);
    const prof = store.activeProfile();
    ui.applyProfile(prof);
    renderProfileList();
    renderCaptureProfiles();
    ui.toast(prof.emoji + '  ' + prof.name);

    // Same page, re-made for a different reader, the whole point of profiles.
    if (view === 'reader' && current) {
      speech.stop();
      const fresh = engine.process(current.source, prof);
      current.blocks = fresh.blocks;
      current.glossary = fresh.glossary;
      current.stats = fresh.stats;
      current.profileId = prof.id;
      current.profileName = prof.name;
      current.ai = false;
      store.saveDoc(current);
      ui.renderChips($('levelChips'), current);
      $('btnGlossary').hidden = !current.glossary.length;
      setMode(prof.mode || mode, true);
    }
  }

  function editProfile(id) {
    const p = store.profiles().find(x => x.id === id);
    if (!p) return;
    ui.profileEditor(p, (saved) => {
      store.saveProfile(saved);
      if (saved.id === store.activeProfile().id) ui.applyProfile(saved);
      renderProfileList();
      ui.toast('Profile saved');
    }, (delId) => {
      if (store.deleteProfile(delId)) {
        ui.applyProfile(store.activeProfile());
        renderProfileList();
        ui.toast('Profile deleted');
      } else {
        ui.toast('You need at least one profile.');
      }
    });
  }

  /* confirm sheet */
  function confirm(title, message, danger, onYes) {
    const wrap = ui.el('div');
    wrap.appendChild(ui.el('p', 'card-note', message));
    const yes = ui.el('button', 'btn btn-primary btn-block', danger || 'Yes, do it');
    yes.addEventListener('click', () => { ui.closeSheet(); onYes(); });
    const no = ui.el('button', 'btn btn-ghost btn-block', 'Cancel');
    no.style.marginTop = '10px';
    no.addEventListener('click', ui.closeSheet);
    wrap.appendChild(yes); wrap.appendChild(no);
    ui.openSheet(title, wrap);
  }

  function confirmDeleteDoc(id) {
    const doc = store.getDoc(id);
    if (!doc) return;
    confirm('Delete this page?', `"${doc.title}" will be removed from this device. This cannot be undone.`,
      'Delete', () => {
        store.deleteDoc(id);
        if (current && current.id === id) { current = null; go('home', false); }
        renderHome(); renderLibrary();
        ui.toast('Deleted');
      });
  }

  /* settings */
  function syncSettings() {
    syncAppearance();
    syncAccount();
  }

  /* appearance (Settings) */
  let appBuilt = false;

  function effectiveColors(prof) {
    const tint = D.TINTS[prof.tint] || D.TINTS.none;
    return {
      bg: prof.customBg || tint.light,
      text: prof.customText || '#16302F'
    };
  }

  function paintAppPreview() {
    const prof = store.activeProfile();
    const c = effectiveColors(prof);
    const box = $('appPreview');
    box.style.background = c.bg;
    box.style.color = c.text;
    box.style.fontFamily = (D.FONTS[prof.font] || D.FONTS.lexend).stack;
    box.style.fontSize = prof.size + 'px';
    box.style.lineHeight = prof.lineHeight;
    $('appTextSw').style.background = c.text;
    $('appTextSw').textContent = c.text.toUpperCase();
    $('appBgSw').style.background = c.bg;
    $('appBgSw').style.color = '#333';
    $('appBgSw').style.textShadow = 'none';
    $('appBgSw').textContent = c.bg.toUpperCase();
    document.querySelectorAll('#appBgPresets .bg-sw').forEach(sw =>
      sw.classList.toggle('is-on', !prof.customBg && sw.dataset.tint === prof.tint));
  }

  function updateProfileAppearance(patch) {
    const prof = store.activeProfile();
    Object.assign(prof, patch);
    store.saveProfile(prof);
    ui.applyProfile(prof);
    paintAppPreview();
    if (view === 'reader' && current) refreshReaderForProfile();
  }

  function buildAppearance() {
    // font pills
    const fonts = $('appFonts');
    fonts.replaceChildren();
    Object.entries(D.FONTS).forEach(([k, f]) => {
      const b = ui.el('button', 'pill', f.name);
      b.style.fontFamily = f.stack;
      b.dataset.font = k;
      b.addEventListener('click', () => {
        updateProfileAppearance({ font: k });
        [...fonts.children].forEach(c => c.classList.toggle('is-on', c.dataset.font === k));
      });
      fonts.appendChild(b);
    });

    // background presets
    const presets = $('appBgPresets');
    presets.replaceChildren();
    Object.entries(D.TINTS).forEach(([k, tint]) => {
      const sw = ui.el('button', 'bg-sw');
      sw.dataset.tint = k;
      sw.style.background = tint.light;
      sw.setAttribute('aria-label', tint.name + ' background');
      sw.addEventListener('click', () => {
        updateProfileAppearance({ tint: k, customBg: null });
        $('appBg').value = tint.light;
      });
      presets.appendChild(sw);
    });

    $('appSize').addEventListener('input', (e) => {
      $('appSizeLabel').textContent = 'Text size: ' + e.target.value + 'px';
      updateProfileAppearance({ size: +e.target.value });
    });
    $('appLh').addEventListener('input', (e) => {
      $('appLhLabel').textContent = 'Line spacing: ' + (+e.target.value).toFixed(2) + '×';
      updateProfileAppearance({ lineHeight: +e.target.value });
    });
    $('appText').addEventListener('input', (e) => updateProfileAppearance({ customText: e.target.value }));
    $('appBg').addEventListener('input', (e) => updateProfileAppearance({ customBg: e.target.value }));
    $('appReset').addEventListener('click', () => {
      updateProfileAppearance({ customText: null, customBg: null });
      syncAppearance();
      ui.toast('Reset to profile colours');
    });

    appBuilt = true;
  }

  function syncAppearance() {
    if (!appBuilt) buildAppearance();
    const prof = store.activeProfile();
    const c = effectiveColors(prof);
    $('appProfileName').textContent = prof.name;
    $('appSize').value = prof.size;
    $('appSizeLabel').textContent = 'Text size: ' + prof.size + 'px';
    $('appLh').value = prof.lineHeight;
    $('appLhLabel').textContent = 'Line spacing: ' + (+prof.lineHeight).toFixed(2) + '×';
    $('appText').value = c.text;
    $('appBg').value = c.bg;
    document.querySelectorAll('#appFonts .pill').forEach(p =>
      p.classList.toggle('is-on', p.dataset.font === prof.font));
    paintAppPreview();
  }

  /** Re-run the open page through the (now-restyled) active profile. */
  function refreshReaderForProfile() {
    const prof = store.activeProfile();
    ui.renderChips($('levelChips'), current);
    // typography already applied via applyProfile; text content unchanged
  }

  /* wiring */
  function wire() {
    $('btnBack').addEventListener('click', back);
    document.querySelectorAll('.tab').forEach(t =>
      t.addEventListener('click', () => { stack = []; go(t.dataset.goto); }));

    $('btnScanBig').addEventListener('click', () => go('capture'));
    $('btnScanFab').addEventListener('click', () => { stack = []; go('capture'); });
    $('jtLesson').addEventListener('click', () => { stack = ['home']; go('resources'); });
    $('jtGame').addEventListener('click', () => {
      stack = ['home']; go('focus');
      openGame(Clarity.games.LIST[Math.floor(Math.random() * Clarity.games.LIST.length)].id);
    });
    $('jtDaily').addEventListener('click', () => {
      stack = ['home']; go('focus');
      if (!Clarity.game.dailyDone()) setTimeout(startDaily, 60);
    });
    $('btnAddPage').addEventListener('click', () => go('capture'));
    $('homeWeek').addEventListener('click', (e) => {
      const cell = e.target.closest('.wd-cell'); if (cell) openDaySheet(cell.dataset.key);
    });
    $('btnOpenBadges').addEventListener('click', () => go('badges'));
    $('btnAllBadges').addEventListener('click', () => { stack = ['home']; go('badges'); });
    $('pointsPill').addEventListener('click', () => { stack = [view]; go('badges'); });
    $('btnShare').addEventListener('click', shareClarity);

    /* focus hub */
    $('btnDaily').addEventListener('click', startDaily);
    $('dqOpts').addEventListener('click', (e) => {
      const b = e.target.closest('.dq-opt'); if (b) answerDQ(+b.dataset.idx);
    });
    $('btnDqNext').addEventListener('click', nextDQ);
    $('timerOpts').addEventListener('click', (e) => {
      const b = e.target.closest('.timer-opt'); if (b) selectTimer(+b.dataset.idx);
    });
    $('btnTimer').addEventListener('click', timerPrimary);
    $('btnTimerReset').addEventListener('click', () => resetTimer(true));
    $('btnFocusLearn').addEventListener('click', () => { stack = ['focus']; go('resources'); });
    $('gameList').addEventListener('click', (e) => {
      const c = e.target.closest('.game-card'); if (c) openGame(c.dataset.id);
    });
    $('gameClose').addEventListener('click', closeGame);
    $('btnGameStart').addEventListener('click', startGamePlay);
    $('btnPlan').addEventListener('click', openPlan);
    $('planClose').addEventListener('click', closePlan);
    $('planQ').addEventListener('click', onPlanPick);
    $('todoAddBtn').addEventListener('click', addTodo);
    $('todoInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
    $('todoGroups').addEventListener('click', onTodoClick);
    $('todoPrio').addEventListener('click', onTodoPrio);
    const onPlanCheck = (e) => { const b = e.target.closest('.ps-check'); if (b) togglePlanStep(+b.dataset.i); };
    $('planResult').addEventListener('click', onPlanCheck);
    $('todayPlan').addEventListener('click', onPlanCheck);
    $('btnOpenFocus').addEventListener('click', () => { openFocusFull(); });
    $('focusClose').addEventListener('click', closeFocusFull);
    $('btnTune').addEventListener('click', () => {
      const m = $('ffMusic'); m.hidden = !m.hidden;
      $('btnTune').classList.toggle('on', !m.hidden);
      if (!m.hidden) renderMusic();
    });
    { const grab = document.querySelector('.ffm-grab');
      if (grab) grab.addEventListener('click', () => { $('ffMusic').hidden = true; $('btnTune').classList.remove('on'); }); }
    $('ffmOpts').addEventListener('click', (e) => {
      const b = e.target.closest('.ffm-opt'); if (b) playSound(b.dataset.s);
    });
    const randomGame = () => openGame(Clarity.games.LIST[Math.floor(Math.random() * Clarity.games.LIST.length)].id);
    $('btnBreakGame').addEventListener('click', randomGame);
    $('btnRandGame').addEventListener('click', randomGame);

    /* language */
    $('btnLang').addEventListener('click', () => {
      ui.languageSheet((code) => setLanguage(code));
    });

    /* sign-in */
    buildSignIn();
    $('btnSignOut').addEventListener('click', () => {
      confirm('Sign out?', 'Your pages and profiles stay saved on this device. You can sign back in any time.',
        'Sign out', () => { store.signOut(); location.reload(); });
    });

    /* welcome */
    const dismissWelcome = () => {
      store.setSetting('seenIntro', true);
      $('welcome').hidden = true;
    };
    $('wlSkip').addEventListener('click', dismissWelcome);
    $('wlDemo').addEventListener('click', () => {
      dismissWelcome();
      const s = D.SAMPLES[0];
      makeDoc({ text: s.text, title: s.title });
    });

    /* capture */
    const onFile = (input) => {
      const file = input.files && input.files[0];
      input.value = '';
      if (file) makeDoc({ file });
    };
    $('fileCamera').addEventListener('change', (e) => onFile(e.target));
    $('filePick').addEventListener('change', (e) => onFile(e.target));

    /* live camera */
    $('btnCameraLive').addEventListener('click', openCamera);
    $('camClose').addEventListener('click', closeCamera);
    $('camSwitch').addEventListener('click', () => Clarity.camera.flip());
    $('camShutter').addEventListener('click', shootCamera);

    const area = $('pasteArea');
    area.addEventListener('input', () => {
      const n = area.value.trim().length;
      $('charCount').textContent = n + (n === 1 ? ' character' : ' characters');
      $('btnRunPaste').disabled = n < 12;
    });
    $('btnRunPaste').addEventListener('click', () => {
      const text = area.value.trim();
      if (text.length < 12) return;
      area.value = ''; area.dispatchEvent(new Event('input'));
      makeDoc({ text });
    });

    if ($('sampleList')) ui.renderSamples($('sampleList'), (s) => makeDoc({ text: s.text, title: s.title }));

    /* reader */
    document.querySelectorAll('#segMode .seg-btn').forEach(b =>
      b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('btnPlay').addEventListener('click', togglePlay);
    $('btnFocus').addEventListener('click', toggleFocus);
    $('btnSave').addEventListener('click', saveImage);
    $('docBody').addEventListener('click', (e) => {
      if (!focusOn) return;
      const blk = e.target.closest('.blk');
      if (blk) focusBlock(blk);
    });
    $('btnSpeed').addEventListener('click', cycleSpeed);
    $('btnExplain').addEventListener('click', askExplain);
    $('btnCheck').addEventListener('click', askCheck);
    $('btnHowTour').addEventListener('click', () => openLesson(D.FEATURES_TOUR));
    $('lessonClose').addEventListener('click', closeLesson);
    $('lessonNext').addEventListener('click', lessonNext);
    $('lessonBack').addEventListener('click', lessonBack);
    $('btnGlossary').addEventListener('click', () => current && ui.glossarySheet(current));

    /* profile */
    $('btnNewProfile').addEventListener('click', () => {
      const p = store.newProfile();
      ui.profileEditor(p, (saved) => {
        store.saveProfile(saved);
        store.setActiveProfile(saved.id);
        ui.applyProfile(saved);
        renderProfileList();
        ui.toast('Profile created');
      });
    });

    /* sheet */
    $('sheetClose').addEventListener('click', ui.closeSheet);
    $('sheetGrab').addEventListener('click', ui.closeSheet);
    $('scrim').addEventListener('click', ui.closeSheet);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('camera').hidden) closeCamera();
      else if (!$('sheet').hidden) ui.closeSheet();
      else if (view === 'reader') back();
    });

    /* chrome */
    $('views').addEventListener('scroll', () => {
      $('topbar').classList.toggle('scrolled', $('views').scrollTop > 6);
    }, { passive: true });

    addEventListener('resize', moveThumb);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      ui.applyProfile(store.activeProfile());
    });
    addEventListener('pagehide', () => { speech.stop(); camera.stop(); });
  }

  /* boot */
  function boot() {
    i18n.setLang(store.settings().lang || 'en');
    ui.applyProfile(store.activeProfile());
    syncSettings();
    wire();
    applyLanguage();
    paintChrome();
    renderHome();

    // first run: local sign-in, then straight into the app
    if (!store.user()) $('signin').hidden = false;

    setTimeout(() => $('splash').classList.add('gone'), 1750);

    // small welcome-back bonus, once a day, after the splash clears
    setTimeout(() => reward(Clarity.game.visit()), 1700);

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
