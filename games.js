/*
   CLARITY, brain-break games

   Short, playable focus games for a study break. Each one targets a skill
   that reading and school lean on: sustained attention, working memory, and
   processing speed. They are our own designs, grounded in the kinds of
   cognitive-training tasks the research describes, written to feel light and
   encouraging, never punishing.

   A game is a function (ctx) => { destroy }. It renders into ctx.area and
   reports its result through ctx.finish(result). The controller object it
   returns must clean up every timer in destroy(), so closing mid-game leaks
   nothing.
*/
window.Clarity = window.Clarity || {};

Clarity.games = (function () {

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const randOf = (a) => a[Math.floor(Math.random() * a.length)];

  const LETTERS = 'ABCDEFGHJKLMNPRTUVWY';
  // look-alikes, so the hunt actually tests careful attention
  const SIMILAR = {
    A: ['R', 'H', 'V'], B: ['R', 'P', 'E'], C: ['G', 'O', 'U'], D: ['O', 'P', 'B'],
    E: ['F', 'B', 'L'], F: ['E', 'P', 'T'], G: ['C', 'O', 'Q'], H: ['N', 'M', 'A'],
    J: ['L', 'I', 'U'], K: ['R', 'X', 'H'], L: ['I', 'J', 'T'], M: ['N', 'H', 'W'],
    N: ['M', 'H', 'U'], P: ['R', 'B', 'F'], R: ['P', 'B', 'K'], T: ['F', 'L', 'I'],
    U: ['V', 'J', 'N'], V: ['U', 'Y', 'W'], W: ['V', 'M', 'N'], Y: ['V', 'X', 'T']
  };
  const SYMBOLS = ['🍎', '⭐', '🌙', '🔑', '🎵', '🔔', '🌲', '⚽', '🌸', '🍀', '☀️', '🎈'];

  /* ── Letter Hunt: attention + visual search ── */
  function letterHunt(ctx) {
    const ROUNDS = 5, TOTAL = 16, timers = [];
    let round = 0, correct = 0, incorrect = 0, score = 0, remaining = 0;
    const started = performance.now();

    function newRound() {
      round++;
      if (round > ROUNDS) return done();
      ctx.setMeta('Round ' + round + ' / ' + ROUNDS);
      const target = randOf(LETTERS.split(''));
      const nTarget = 3 + Math.floor(Math.random() * 4);     // 3 to 6
      remaining = nTarget;
      ctx.setPrompt('Tap every <b>' + target + '</b> &middot; <span id="lhLeft">' + nTarget + '</span> left');
      const tiles = [];
      for (let i = 0; i < nTarget; i++) tiles.push(target);
      const sim = SIMILAR[target] || [];
      while (tiles.length < TOTAL) {
        const c = (sim.length && Math.random() < 0.45) ? randOf(sim) : randOf(LETTERS.split(''));
        if (c !== target) tiles.push(c);
      }
      shuffle(tiles);
      ctx.area.className = 'game-grid gg-4';
      ctx.area.innerHTML = tiles.map((c) =>
        '<button class="g-tile" data-t="' + (c === target ? 1 : 0) + '">' + c + '</button>').join('');
    }
    function onClick(e) {
      const b = e.target.closest('.g-tile');
      if (!b || b.disabled) return;
      if (b.dataset.t === '1') {
        b.classList.add('ok'); b.disabled = true; correct++; score += 10; remaining--;
        ctx.setScore(score);
        const left = document.getElementById('lhLeft'); if (left) left.textContent = remaining;
        if (remaining <= 0) timers.push(setTimeout(newRound, 360));
      } else {
        b.classList.add('bad'); incorrect++; score = Math.max(0, score - 5); ctx.setScore(score);
        timers.push(setTimeout(() => b.classList.remove('bad'), 320));
      }
    }
    function done() {
      const acc = (correct + incorrect) ? Math.round(correct / (correct + incorrect) * 100) : 100;
      ctx.finish({ score, correct, incorrect, accuracy: acc, durationMs: performance.now() - started });
    }
    ctx.area.addEventListener('click', onClick);
    ctx.setScore(0); newRound();
    return { destroy() { timers.forEach(clearTimeout); ctx.area.removeEventListener('click', onClick); } };
  }

  /* ── Make Ten: processing speed + light math ── */
  function makeTen(ctx) {
    const timers = [];
    let correct = 0, incorrect = 0, score = 0, left = 45, sel = null;
    const target = 10;
    const started = performance.now();
    let iv = null;

    function showPrompt() {
      ctx.setPrompt('Tap two that add to <b>' + target + '</b> &middot; <span>' + left + 's</span>');
    }
    function deal() {
      const nums = [];
      const a = 1 + Math.floor(Math.random() * (target - 1));
      nums.push(a, target - a);                              // guarantee one valid pair
      while (nums.length < 6) nums.push(1 + Math.floor(Math.random() * 9));
      shuffle(nums);
      ctx.area.className = 'game-grid gg-3';
      ctx.area.innerHTML = nums.map((n) => '<button class="g-tile num" data-n="' + n + '">' + n + '</button>').join('');
      sel = null;
    }
    function onClick(e) {
      const b = e.target.closest('.g-tile');
      if (!b || b.disabled) return;
      if (sel === b) { b.classList.remove('sel'); sel = null; return; }
      if (!sel) { sel = b; b.classList.add('sel'); return; }
      const sum = (+sel.dataset.n) + (+b.dataset.n);
      if (sum === target) {
        correct++; score += 15; ctx.setScore(score);
        sel.classList.add('ok'); b.classList.add('ok');
        sel = null; timers.push(setTimeout(deal, 300));
      } else {
        incorrect++; score = Math.max(0, score - 5); ctx.setScore(score);
        b.classList.add('bad'); sel.classList.remove('sel');
        const prev = sel; sel = null;
        timers.push(setTimeout(() => { b.classList.remove('bad'); }, 320));
      }
    }
    function tick() { left--; showPrompt(); if (left <= 0) done(); }
    function done() {
      if (iv) clearInterval(iv);
      const acc = (correct + incorrect) ? Math.round(correct / (correct + incorrect) * 100) : 100;
      ctx.finish({ score, correct, incorrect, accuracy: acc, durationMs: performance.now() - started });
    }
    ctx.area.addEventListener('click', onClick);
    ctx.setMeta('45 second sprint');
    ctx.setScore(0); showPrompt(); deal();
    iv = setInterval(tick, 1000);
    return { destroy() { if (iv) clearInterval(iv); timers.forEach(clearTimeout); ctx.area.removeEventListener('click', onClick); } };
  }

  /* ── Match Back: working memory ── */
  function matchBack(ctx) {
    const ROUNDS = 3, timers = [];
    let round = 0, correct = 0, incorrect = 0, score = 0, seq = [], pos = 0, locked = true;
    const started = performance.now();

    function newRound() {
      round++;
      if (round > ROUNDS) return done();
      ctx.setMeta('Round ' + round + ' / ' + ROUNDS);
      const len = 2 + round;                                 // 3, 4, 5
      const pool = shuffle(SYMBOLS.slice()).slice(0, Math.max(len + 2, 6));
      seq = []; for (let i = 0; i < len; i++) seq.push(randOf(pool));
      playSeq(pool);
    }
    function playSeq(pool) {
      locked = true; pos = 0;
      ctx.setPrompt('Watch the order…');
      ctx.area.className = 'game-seq';
      let i = 0;
      function step() {
        if (i >= seq.length) { timers.push(setTimeout(() => ask(pool), 350)); return; }
        ctx.area.innerHTML = '<div class="seq-big">' + seq[i] + '</div>';
        i++;
        timers.push(setTimeout(() => { ctx.area.innerHTML = ''; timers.push(setTimeout(step, 180)); }, 720));
      }
      timers.push(setTimeout(step, 450));
    }
    function ask(pool) {
      locked = false; pos = 0;
      ctx.setPrompt('Now tap them in order');
      ctx.area.className = 'game-grid gg-3';
      ctx.area.innerHTML = shuffle(pool.slice()).map((s) => '<button class="g-tile sym" data-s="' + s + '">' + s + '</button>').join('');
    }
    function onClick(e) {
      if (locked) return;
      const b = e.target.closest('.g-tile');
      if (!b || b.disabled) return;
      if (b.dataset.s === seq[pos]) {
        b.classList.add('ok'); pos++; score += 10; ctx.setScore(score);
        if (pos >= seq.length) { correct++; locked = true; timers.push(setTimeout(newRound, 480)); }
      } else {
        incorrect++; score = Math.max(0, score - 5); ctx.setScore(score);
        b.classList.add('bad'); locked = true;
        ctx.area.querySelectorAll('.g-tile').forEach((x) => { x.disabled = true; });
        timers.push(setTimeout(newRound, 650));
      }
    }
    function done() {
      const acc = (correct + incorrect) ? Math.round(correct / (correct + incorrect) * 100) : 100;
      ctx.finish({ score, correct, incorrect, accuracy: acc, durationMs: performance.now() - started });
    }
    ctx.area.addEventListener('click', onClick);
    ctx.setScore(0); newRound();
    return { destroy() { timers.forEach(clearTimeout); ctx.area.removeEventListener('click', onClick); } };
  }

  /* ── Odd One Out: attention to detail + inhibition ── */
  function oddOne(ctx) {
    const PAIRS = [['🟦', '🟪'], ['🔺', '🔻'], ['🐱', '🐭'], ['🍊', '🍋'], ['🌕', '🌑'], ['🙂', '🙃'], ['🔶', '🔷'], ['🟢', '🟡'], ['⬛', '⬜']];
    const SIZES = [4, 6, 9, 12, 16, 20];
    const ROUNDS = SIZES.length, timers = [];
    let round = 0, correct = 0, incorrect = 0, score = 0;
    const started = performance.now();
    function newRound() {
      round++;
      if (round > ROUNDS) return done();
      ctx.setMeta('Round ' + round + ' / ' + ROUNDS);
      ctx.setPrompt('Tap the one that is different');
      const n = SIZES[round - 1];
      const pair = randOf(PAIRS);
      const odd = Math.floor(Math.random() * n);
      const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
      ctx.area.className = 'game-grid gg-' + cols;
      let html = '';
      for (let i = 0; i < n; i++) html += '<button class="g-tile sym" data-odd="' + (i === odd ? 1 : 0) + '">' + (i === odd ? pair[1] : pair[0]) + '</button>';
      ctx.area.innerHTML = html;
    }
    function onClick(e) {
      const b = e.target.closest('.g-tile');
      if (!b || b.disabled) return;
      if (b.dataset.odd === '1') {
        b.classList.add('ok'); b.disabled = true; correct++; score += 12; ctx.setScore(score);
        timers.push(setTimeout(newRound, 320));
      } else {
        b.classList.add('bad'); incorrect++; score = Math.max(0, score - 4); ctx.setScore(score);
        timers.push(setTimeout(() => b.classList.remove('bad'), 300));
      }
    }
    function done() {
      const acc = (correct + incorrect) ? Math.round(correct / (correct + incorrect) * 100) : 100;
      ctx.finish({ score, correct, incorrect, accuracy: acc, durationMs: performance.now() - started });
    }
    ctx.area.addEventListener('click', onClick);
    ctx.setScore(0); newRound();
    return { destroy() { timers.forEach(clearTimeout); ctx.area.removeEventListener('click', onClick); } };
  }

  /* ── Signal Tap: impulse control (go / no-go) ── */
  function signalTap(ctx) {
    const TRIALS = 16, timers = [];
    let trial = 0, correct = 0, incorrect = 0, score = 0, awaiting = false, isGo = false, token = 0;
    const started = performance.now();
    function next() {
      trial++;
      if (trial > TRIALS) return done();
      ctx.setMeta('Signal ' + trial + ' / ' + TRIALS);
      awaiting = false;
      ctx.setPrompt('Watch for the signal');
      ctx.area.className = 'game-signal';
      ctx.area.innerHTML = '<div class="sig-wait">Get ready…</div>';
      timers.push(setTimeout(show, 500 + Math.random() * 800));
    }
    function show() {
      isGo = Math.random() < 0.68; awaiting = true;
      const my = ++token;
      ctx.setPrompt(isGo ? 'TAP it, quick' : 'WAIT, do not tap');
      ctx.area.innerHTML = isGo ? '<div class="sig-go">GO</div>' : '<div class="sig-stop">WAIT</div>';
      timers.push(setTimeout(() => { if (token === my && awaiting) resolve(!isGo); }, 920));
    }
    function resolve(good) {
      if (!awaiting) return;
      awaiting = false;
      if (good) { correct++; score += 15; } else { incorrect++; score = Math.max(0, score - 5); }
      ctx.setScore(score);
      timers.push(setTimeout(next, 360));
    }
    function onClick() { if (awaiting) resolve(isGo); }
    ctx.area.addEventListener('click', onClick);
    function done() {
      const acc = (correct + incorrect) ? Math.round(correct / (correct + incorrect) * 100) : 100;
      ctx.finish({ score, correct, incorrect, accuracy: acc, durationMs: performance.now() - started });
    }
    ctx.setScore(0); next();
    return { destroy() { timers.forEach(clearTimeout); ctx.area.removeEventListener('click', onClick); } };
  }

  /* ── Pair Up: visual memory (concentration) ── */
  function pairUp(ctx) {
    const SYMS = ['🍎', '⭐', '🌙', '🔑', '🎵', '🔔', '🌲', '⚽', '🌸', '🍀'];
    const PAIRS = 6, timers = [];
    let first = null, lock = false, matched = 0, moves = 0, incorrect = 0, score = 0;
    const started = performance.now();
    ctx.setMeta('Find all pairs');
    ctx.setPrompt('Flip two tiles to find a match');
    const pool = shuffle(SYMS.slice()).slice(0, PAIRS);
    const deck = shuffle(pool.concat(pool));
    ctx.area.className = 'game-grid gg-4';
    ctx.area.innerHTML = deck.map((s) => '<button class="g-tile card" data-s="' + s + '"><span class="card-face">' + s + '</span></button>').join('');
    function onClick(e) {
      if (lock) return;
      const b = e.target.closest('.g-tile');
      if (!b || b.classList.contains('open') || b.classList.contains('done')) return;
      b.classList.add('open');
      if (!first) { first = b; return; }
      moves++;
      if (first.dataset.s === b.dataset.s && first !== b) {
        first.classList.add('done'); b.classList.add('done'); first = null; matched++; score += 20; ctx.setScore(score);
        if (matched >= PAIRS) timers.push(setTimeout(done, 360));
      } else {
        incorrect++; lock = true; const a = first; first = null;
        timers.push(setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); lock = false; }, 720));
      }
    }
    function done() {
      const acc = moves ? Math.round(matched / moves * 100) : 100;
      ctx.finish({ score, correct: matched, incorrect, accuracy: acc, durationMs: performance.now() - started });
    }
    ctx.area.addEventListener('click', onClick);
    ctx.setScore(0);
    return { destroy() { timers.forEach(clearTimeout); ctx.area.removeEventListener('click', onClick); } };
  }

  const IMPL = { letterhunt: letterHunt, maketen: makeTen, matchback: matchBack,
                 oddone: oddOne, signaltap: signalTap, pairup: pairUp };

  // Original, colourful card artwork (inline SVG), plus a tint for the card top.
  const ART = {
    letterhunt:
      '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="16" y="12" width="42" height="42" rx="11" fill="#CDE4D6"/>' +
      '<rect x="63" y="12" width="42" height="42" rx="11" fill="#22A65E"/>' +
      '<rect x="39" y="50" width="42" height="42" rx="11" fill="#F2A33F"/>' +
      '<text x="37" y="43" font-family="Poppins,system-ui,sans-serif" font-size="27" font-weight="800" fill="#2C4A3E" text-anchor="middle">A</text>' +
      '<text x="84" y="43" font-family="Poppins,system-ui,sans-serif" font-size="27" font-weight="800" fill="#fff" text-anchor="middle">G</text>' +
      '<text x="60" y="81" font-family="Poppins,system-ui,sans-serif" font-size="27" font-weight="800" fill="#fff" text-anchor="middle">G</text></svg>',
    maketen:
      '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="32" cy="36" r="22" fill="#F2A33F"/><circle cx="88" cy="36" r="22" fill="#F8C476"/>' +
      '<text x="32" y="45" font-family="Poppins,system-ui,sans-serif" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">6</text>' +
      '<text x="88" y="45" font-family="Poppins,system-ui,sans-serif" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">4</text>' +
      '<text x="60" y="44" font-family="Poppins,system-ui,sans-serif" font-size="22" font-weight="800" fill="#7A6033" text-anchor="middle">+</text>' +
      '<rect x="34" y="66" width="52" height="28" rx="9" fill="#22A65E"/>' +
      '<text x="60" y="86" font-family="Poppins,system-ui,sans-serif" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">=10</text></svg>',
    matchback:
      '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="12" y="28" width="30" height="44" rx="9" fill="#5B76B8"/>' +
      '<rect x="45" y="28" width="30" height="44" rx="9" fill="#8A9BDC"/>' +
      '<rect x="78" y="28" width="30" height="44" rx="9" fill="#B9C4EC"/>' +
      '<path d="M27 40l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L27 59.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" fill="#fff"/>' +
      '<circle cx="60" cy="50" r="8.5" fill="#fff"/>' +
      '<path d="M93 41l8.7 17.5H84.3z" fill="#fff"/></svg>',
    oddone:
      '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="22" y="18" width="28" height="28" rx="8" fill="#5B76B8"/>' +
      '<rect x="56" y="18" width="28" height="28" rx="8" fill="#5B76B8"/>' +
      '<rect x="22" y="52" width="28" height="28" rx="8" fill="#5B76B8"/>' +
      '<rect x="56" y="52" width="28" height="28" rx="8" fill="#F2A33F"/>' +
      '<circle cx="70" cy="66" r="4.5" fill="#fff"/></svg>',
    signaltap:
      '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="40" cy="50" r="24" fill="#22A65E"/>' +
      '<text x="40" y="56" font-family="Poppins,system-ui,sans-serif" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">GO</text>' +
      '<rect x="70" y="27" width="46" height="46" rx="11" fill="#CBD1D9"/>' +
      '<rect x="86" y="43" width="14" height="14" rx="3" fill="#8A93A0"/></svg>',
    pairup:
      '<svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="22" y="24" width="34" height="48" rx="9" fill="#8A5AD6"/>' +
      '<rect x="64" y="30" width="34" height="48" rx="9" fill="#AC86E3"/>' +
      '<path d="M39 44l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fff"/>' +
      '<path d="M81 50l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fff"/></svg>'
  };
  // `icon` keys into data.PROFILE_ICONS (used for the small badge icons elsewhere).
  const LIST = [
    { id: 'letterhunt', name: 'Letter Hunt', cat: 'Focus',  icon: 'search', img:'img/g-letters.png', color: '#7C5CE6', tint: '#ECE7FB', art: ART.letterhunt,
      trains: 'Attention and visual search', diff: 'Easy',
      desc: 'Find every target letter hidden among look-alikes. Trains you to focus and ignore distractions.',
      help: [
        { icon: 'target', title: 'Sharpen your focus', desc: 'Searching for one letter while ignoring look-alikes trains you to lock onto what matters and tune out the rest.' },
        { icon: 'eye', title: 'Catch small details', desc: 'Spotting the difference between similar letters builds the habit of reading carefully instead of rushing past.' },
        { icon: 'brain', title: 'Steady your attention', desc: 'Holding a target in mind across a full grid strengthens the kind of focus that reading a page needs.' }
      ], science: 'Built on visual-search and selective-attention training.' },
    { id: 'maketen',    name: 'Make Ten',    cat: 'Speed',  icon: 'calc', img:'img/g-circles.png',   color: '#F2A33F', tint: '#FCEEDA', art: ART.maketen,
      trains: 'Quick thinking and processing speed', diff: 'Medium',
      desc: 'Tap two numbers that add up to ten, as fast as you can before the clock runs out.',
      help: [
        { icon: 'bolt', title: 'Think on your feet', desc: 'Finding pairs fast builds quick mental math and processing speed.' },
        { icon: 'brain', title: 'Hold more in mind', desc: 'Scanning numbers while keeping the target in your head works your working memory.' },
        { icon: 'target', title: 'Stay in the moment', desc: 'A ticking clock keeps you engaged, a gentle way to practice focus under a little pressure.' }
      ], science: 'Built on timed arithmetic-fluency practice.' },
    { id: 'matchback',  name: 'Match Back',  cat: 'Memory', icon: 'brain',  img:'img/g-brain.png',  color: '#5B76B8', tint: '#EBEEFA', art: ART.matchback,
      trains: 'Working memory', diff: 'Medium',
      desc: 'Watch a short sequence, then tap it back in the right order. The sequence grows each round.',
      help: [
        { icon: 'brain', title: 'Strengthen memory', desc: 'Holding a growing sequence in mind and recalling it in order is direct working-memory practice.' },
        { icon: 'eye', title: 'Notice the order', desc: 'Paying attention to each step as it appears builds careful, sequenced attention.' },
        { icon: 'target', title: 'Resist the rush', desc: 'Waiting for the full sequence before you answer trains patience over impulse.' }
      ], science: 'Built on sequence-recall working-memory tasks.' },
    { id: 'oddone',     name: 'Odd One Out', cat: 'Focus',  icon: 'eye',    img:'img/g-eye.png',    color: '#3D6EE0', tint: '#E8EEFB', art: ART.oddone,
      trains: 'Attention to detail', diff: 'Easy',
      desc: 'Every tile looks the same except one. Find the odd one out before moving on. It gets harder each round.',
      help: [
        { icon: 'eye', title: 'Catch small details', desc: 'Finding the one tile that is different trains your eye to notice subtle differences.' },
        { icon: 'target', title: 'Slow down to look', desc: 'Checking before you tap builds the pause that keeps you from rushing.' },
        { icon: 'brain', title: 'Scan with purpose', desc: 'Sweeping a grid for the odd one out strengthens focused visual search.' }
      ], science: 'Built on odd-one-out visual-discrimination tasks.' },
    { id: 'signaltap',  name: 'Signal Tap',  cat: 'Impulse', icon: 'hand',  img:'img/g-hand.png',  color: '#D76A9C', tint: '#FAE8F1', art: ART.signaltap,
      trains: 'Impulse control and reaction', diff: 'Medium',
      desc: 'Tap fast when you see GO, but hold back when you see WAIT. A game of quick reactions and self-control.',
      help: [
        { icon: 'bolt', title: 'Quicken your reactions', desc: 'Tapping the go signal quickly sharpens your reaction time.' },
        { icon: 'brain', title: 'Think before you act', desc: 'Holding back on the wait signal is real practice at impulse control.' },
        { icon: 'target', title: 'Stay alert', desc: 'Watching for the right signal keeps your attention switched on.' }
      ], science: 'Built on go / no-go impulse-control tasks.' },
    { id: 'pairup',     name: 'Pair Up',     cat: 'Memory', icon: 'puzzle', img:'img/g-puzzle.png', color: '#8A5AD6', tint: '#EFE8FB', art: ART.pairup,
      trains: 'Visual memory', diff: 'Easy',
      desc: 'Flip the tiles two at a time and remember where each one is to match all the pairs.',
      help: [
        { icon: 'brain', title: 'Build your memory', desc: 'Remembering where each tile is and matching pairs is classic memory training.' },
        { icon: 'eye', title: 'Track what you have seen', desc: 'Keeping a mental map of the board strengthens visual memory.' },
        { icon: 'target', title: 'Plan your moves', desc: 'Thinking before you flip builds patience and focus.' }
      ], science: 'Built on concentration and pairs memory games.' }
  ];

  function play(id, ctx) {
    const fn = IMPL[id];
    if (!fn) { ctx.finish({ score: 0, correct: 0, incorrect: 0, accuracy: 0, durationMs: 0 }); return { destroy() {} }; }
    return fn(ctx);
  }

  return { LIST, play };
})();
