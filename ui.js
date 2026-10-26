/*
   CLARITY, rendering & UI primitives
*/
window.Clarity = window.Clarity || {};

Clarity.ui = (function () {
  const D = Clarity.data;
  const $ = (id) => document.getElementById(id);

  /* tiny helpers */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;      // always textContent, page text is untrusted
    return n;
  }

  // Icons from Lucide (https://lucide.dev), ISC licensed. Line icons on a
  // 24px grid, which matches the global svg stroke styling.
  const ICONS = {
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    cross: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    edit:  '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    swap:  '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    spark: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    bulb:  '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    down:  '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    book:  '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    up:    '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    lock:  '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    doc:   '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    // explain-differently strategies
    link:  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    stairs:'<path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/>',
    grid:  '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    seed:  '<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    speaker:'<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    star:  '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    brain: '<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>',
    bolt:  '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    eye:   '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    puzzle:'<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    search:'<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    calc:  '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    user:  '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    calcheck:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    hand:  '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    gift:  '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>'
  };

  function icon(name, cls) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = ICONS[name] || '';
    return s;
  }

  /* profile identity, a coloured line icon instead of an emoji */
  function profileIconId(p) {
    return p.icon || D.EMOJI_TO_ICON[p.emoji] || 'star';
  }
  function profileColor(p) { return p.color || '#1F8C7D'; }

  function profileGlyph(name, cls) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = D.PROFILE_ICONS[name] || D.PROFILE_ICONS.star;
    return s;
  }

  /** A round coloured badge holding the profile's icon. */
  function profileBadge(p, cls) {
    const color = profileColor(p);
    const badge = el('div', cls || 'pc-emoji');
    badge.style.background = 'color-mix(in srgb, ' + color + ' 16%, transparent)';
    badge.style.color = color;
    const g = profileGlyph(profileIconId(p));
    badge.appendChild(g);
    return badge;
  }

  let toastTimer = null;
  function toast(msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms || 2800);
  }

  function relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* sheet */
  let sheetOnClose = null;

  function openSheet(title, node, onClose) {
    $('sheetTitle').textContent = title;
    const body = $('sheetBody');
    body.replaceChildren(node);
    body.scrollTop = 0;
    $('scrim').hidden = false;
    $('sheet').hidden = false;
    sheetOnClose = onClose || null;
  }

  function closeSheet() {
    $('sheet').hidden = true;
    $('scrim').hidden = true;
    if (sheetOnClose) { const f = sheetOnClose; sheetOnClose = null; f(); }
  }

  /* profile → CSS */
  function applyProfile(prof) {
    const dark = false;  // app is always light
    const tint = D.TINTS[prof.tint] || D.TINTS.none;
    const font = D.FONTS[prof.font] || D.FONTS.lexend;
    const r = document.documentElement.style;

    r.setProperty('--doc-size', prof.size + 'px');
    r.setProperty('--doc-lh', prof.lineHeight);
    r.setProperty('--doc-ls', prof.letterSpacing + 'em');
    r.setProperty('--doc-ws', prof.wordSpacing ? prof.wordSpacing + 'em' : 'normal');
    r.setProperty('--doc-ff', font.stack);
    // custom colours (set in Settings → Appearance) win over the tint preset
    r.setProperty('--doc-bg', prof.customBg || (dark ? tint.dark : tint.light));
    r.setProperty('--doc-fg', prof.customText || (dark ? '#EDF3F2' : '#16302F'));

    const capName = $('capProfileName');
    if (capName) capName.textContent = prof.name;
  }

  /* empty state */
  function emptyState(text) {
    const w = el('div', 'empty');
    w.appendChild(icon('book'));
    w.appendChild(el('p', null, text));
    return w;
  }

  /* doc cards */
  function docCard(doc, onOpen, onDelete) {
    const card = el('div', 'doc-card');

    const badge = el('div', 'dc-badge');
    badge.appendChild(icon('doc'));
    card.appendChild(badge);

    const main = el('div', 'dc-main');
    main.appendChild(el('div', 'dc-title', doc.title));
    const bits = [relTime(doc.updated || doc.created)];
    if (doc.stats) bits.push(`${doc.stats.steps} steps`);
    if (doc.profileName) bits.push(doc.profileName);
    main.appendChild(el('div', 'dc-meta', bits.join(' · ')));
    card.appendChild(main);

    // the whole card opens the page, so there are no dead zones to tap
    card.addEventListener('click', () => onOpen(doc.id));

    const del = el('button', 'dc-del');
    del.setAttribute('aria-label', 'Delete ' + doc.title);
    del.appendChild(icon('trash'));
    del.addEventListener('click', (e) => { e.stopPropagation(); onDelete(doc.id); });
    card.appendChild(del);

    return card;
  }

  function renderDocList(container, docs, onOpen, onDelete, emptyMsg) {
    container.replaceChildren();
    if (!docs.length) { container.appendChild(emptyState(emptyMsg)); return; }
    for (const d of docs) container.appendChild(docCard(d, onOpen, onDelete));
  }

  /* samples */
  function renderSamples(container, onPick) {
    container.replaceChildren();
    for (const s of D.SAMPLES) {
      const card = el('button', 'sample-card');
      const top = el('div', 'sam-top');
      top.appendChild(el('span', 'sam-tag', s.tag));
      top.appendChild(el('span', 'sam-title', s.title));
      card.appendChild(top);
      card.appendChild(el('div', 'sam-prev', s.text.replace(/\n+/g, ' ').slice(0, 130)));
      card.addEventListener('click', () => onPick(s));
      container.appendChild(card);
    }
  }

  /* resources */
  function renderResources(container) {
    container.replaceChildren();
    for (const r of Clarity.data.RESOURCES) {
      const a = el('a', 'res-card');
      a.href = r.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      if (r.logo) {
        const chip = el('span', 'res-logo');
        const limg = el('img', 'res-logo-img');
        limg.src = r.logo + '?v=126'; limg.alt = ''; limg.loading = 'lazy';
        chip.appendChild(limg);
        a.appendChild(chip);
      } else {
        a.appendChild(el('span', 'res-badge', (r.name || '?').trim().charAt(0).toUpperCase()));
      }

      const main = el('div', 'res-main');
      main.appendChild(el('div', 'res-name', r.name));
      main.appendChild(el('div', 'res-desc', r.desc));
      a.appendChild(main);

      a.appendChild(icon('arrow', 'res-go'));
      container.appendChild(a);
    }
  }

  /* learning lessons (in-app) */
  function renderLessons(container) {
    container.replaceChildren();
    for (const lesson of Clarity.data.LESSONS) {
      const card = el('a', 'lesson-card');
      card.href = lesson.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      const cover = el('div', 'lesson-cover');
      const img = el('img', 'lesson-photo');
      img.src = lesson.img + '?v=126'; img.alt = ''; img.loading = 'lazy';
      cover.appendChild(img);
      cover.appendChild(el('span', 'lesson-tag-float', lesson.tag));
      card.appendChild(cover);

      const body = el('div', 'lesson-body');
      body.appendChild(el('div', 'lesson-name', lesson.title));
      const by = el('div', 'lesson-by');
      by.appendChild(icon('arrow'));
      by.appendChild(el('span', null, lesson.by));
      body.appendChild(by);
      card.appendChild(body);

      container.appendChild(card);
    }
  }

  /* gamification badges, earned ones bright, the rest shown dim as goals */
  function renderBadges(container, earned) {
    container.replaceChildren();
    // only show badges actually earned, so the card stays clean and rewarding
    const got = Clarity.game.BADGES.filter(b => earned.indexOf(b.id) !== -1);
    if (!got.length) {
      const hint = el('div', 'badge-hint', 'Earn badges as you read, play, and keep your streak.');
      container.appendChild(hint);
      return;
    }
    for (const b of got) {
      const chip = el('div', 'badge got');
      chip.title = b.name + ' — ' + b.desc;
      chip.appendChild(icon(b.icon));
      chip.appendChild(el('span', null, b.name));
      container.appendChild(chip);
    }
  }

  /* presentations from institutions, with a first-slide preview image */
  function renderPresentations(container) {
    container.replaceChildren();
    for (const p of Clarity.data.PRESENTATIONS) {
      const card = el('a', 'preso-card');
      card.href = p.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      const thumb = el('div', 'preso-thumb');
      const im = el('img');
      im.src = p.img;
      im.alt = 'First slide of ' + p.title;
      im.loading = 'lazy';
      thumb.appendChild(im);
      thumb.appendChild(el('span', 'preso-badge', 'PDF'));
      card.appendChild(thumb);

      const info = el('div', 'preso-info');
      info.appendChild(el('div', 'preso-title', p.title));
      info.appendChild(el('div', 'preso-by', p.by));
      card.appendChild(info);

      container.appendChild(card);
    }
  }

  /* learning-differences explainers (awareness) */
  function renderDiffs(container) {
    container.replaceChildren();
    for (const d of Clarity.data.LEARNING_DIFFS) {
      const card = el('div', 'diff-card');
      card.style.setProperty('--c', d.color || '#CF6B45');
      const badge = el('div', 'diff-badge');
      badge.appendChild(icon(d.icon || 'book'));
      card.appendChild(badge);
      const main = el('div', 'diff-main');
      const top = el('div', 'res-top');
      top.appendChild(el('span', 'diff-name', d.name));
      top.appendChild(el('span', 'diff-what', d.what));
      main.appendChild(top);
      main.appendChild(el('div', 'diff-desc', d.desc));
      card.appendChild(main);
      container.appendChild(card);
    }
  }

  /* profiles list */
  function renderProfiles(container, activeId, onPick, onEdit) {
    container.replaceChildren();
    for (const p of Clarity.store.profiles()) {
      const card = el('div', 'prof-card' + (p.id === activeId ? ' is-on' : ''));

      const emoji = profileBadge(p);
      card.appendChild(emoji);

      const main = el('div', 'pc-main');
      main.appendChild(el('div', 'pc-name', p.name));
      main.appendChild(el('div', 'pc-desc', p.desc || `Grade ${p.level} · ${D.FONTS[p.font]?.name || p.font} · ${p.size}px`));
      card.appendChild(main);

      // the whole card selects the profile (the edit button stops the bubble)
      card.addEventListener('click', () => onPick(p.id));

      if (p.id === activeId) card.appendChild(icon('check', 'pc-check'));

      const edit = el('button', 'pc-edit');
      edit.setAttribute('aria-label', 'Edit ' + p.name);
      edit.appendChild(icon('edit'));
      edit.addEventListener('click', (e) => { e.stopPropagation(); onEdit(p.id); });
      card.appendChild(edit);

      container.appendChild(card);
    }
  }

  /* the reader */
  const GLOSS_RE = /[^A-Za-z']/g;

  /**
   * Build the document body. Returns the word groups the
   * speech engine walks, one group per block.
   */
  function renderDoc(container, doc, mode) {
    container.replaceChildren();
    const groups = [];

    if (mode === 'original') {
      const blk = el('div', 'blk blk-original');
      const known = new Set(doc.glossary.map(g => g.word));
      const words = [];
      for (const tok of doc.source.split(/(\s+)/)) {
        if (!tok) continue;
        if (/^\s+$/.test(tok)) { blk.appendChild(document.createTextNode(tok)); continue; }
        const span = el('span', 'w', tok);
        const bare = tok.toLowerCase().replace(GLOSS_RE, '');
        const hit = doc.glossary.find(g => g.word === bare) ||
                    (known.size && doc.glossary.find(g => bare.startsWith(g.word) && bare.length - g.word.length <= 3));
        if (hit) {
          span.classList.add('glossy');
          span.addEventListener('click', () => showWord(hit));
        } else if (/[A-Za-z]/.test(tok)) {
          span.addEventListener('click', () => {
            if (Clarity.speech.sayWord(tok)) {
              span.classList.add('tapped');
              setTimeout(() => span.classList.remove('tapped'), 650);
            }
          });
        }
        blk.appendChild(span);
        words.push({ el: span, text: tok });
      }
      container.appendChild(blk);
      groups.push(words);
      return groups;
    }

    const paragraph = mode === 'simple';
    let buffer = null;   // accumulates steps into one paragraph block

    const flush = () => {
      if (buffer && buffer.words.length) { container.appendChild(buffer.node); groups.push(buffer.words); }
      buffer = null;
    };

    doc.blocks.forEach((b, i) => {
      if (b.kind === 'heading') {
        flush();
        const h = el('div', 'blk blk-heading', b.text);
        h.style.animationDelay = Math.min(i * 40, 400) + 'ms';
        container.appendChild(h);
        groups.push([{ el: h, text: b.text }]);
        return;
      }

      if (b.kind === 'note') {
        flush();
        const n = el('div', 'blk blk-note');
        n.style.animationDelay = Math.min(i * 40, 400) + 'ms';
        const words = fillWords(n, b.text);
        container.appendChild(n);
        groups.push(words);
        return;
      }

      if (paragraph && b.kind !== 'question') {
        if (!buffer) {
          const node = el('div', 'blk');
          node.style.animationDelay = Math.min(i * 40, 400) + 'ms';
          buffer = { node, words: [] };
        }
        if (buffer.words.length) buffer.node.appendChild(document.createTextNode(' '));
        buffer.words.push(...fillWords(buffer.node, b.text));
        return;
      }

      flush();

      if (b.kind === 'question') {
        const q = el('div', 'blk blk-question');
        q.style.animationDelay = Math.min(i * 40, 400) + 'ms';
        const words = fillWords(q, b.text);
        container.appendChild(q);
        groups.push(words);
        return;
      }

      // step
      const step = el('div', 'blk blk-step');
      step.style.animationDelay = Math.min(i * 40, 400) + 'ms';
      step.appendChild(el('div', 'step-n', b.label || String(b.n)));
      const body = el('div', 'step-body');
      const words = fillWords(body, b.text);
      step.appendChild(body);
      container.appendChild(step);
      groups.push(words);
    });

    flush();
    return groups;
  }

  function fillWords(node, text) {
    const words = [];
    for (const tok of String(text).split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) { node.appendChild(document.createTextNode(tok)); continue; }
      const span = el('span', 'w', tok);
      // tap any word to hear just that word, essential for a non-reader
      if (/[A-Za-z]/.test(tok)) {
        span.addEventListener('click', () => {
          if (Clarity.speech.sayWord(tok)) {
            span.classList.add('tapped');
            setTimeout(() => span.classList.remove('tapped'), 650);
          }
        });
      }
      node.appendChild(span);
      words.push({ el: span, text: tok });
    }
    return words;
  }

  /* reader chips */
  /*  Clarity Report, the impact "wow" card
     Turns the numbers the engine already knows into the emotional
     payoff: how much clearer this page became. */
  function renderReport(container, doc) {
    const s = doc.stats || {};
    if (!s.before || !s.after) { container.hidden = true; container.replaceChildren(); return; }
    container.hidden = false;

    const before = Math.round(s.before), after = Math.round(s.after);
    const drop = before - after;
    const badge = drop >= 1
      ? `<div class="report-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>${drop} grade${drop === 1 ? '' : 's'} easier to read</div>`
      : `<div class="report-badge report-badge-soft">Reorganized into clear steps</div>`;

    const cells = [];
    if (s.hard) cells.push([s.hard, s.hard === 1 ? 'word simplified' : 'words simplified']);
    cells.push([s.steps || 0, s.steps === 1 ? 'clear step' : 'clear steps']);
    cells.push([s.words || 0, 'words made clear']);
    const stats = cells.map(([n, l]) =>
      `<div class="rstat"><span class="rstat-num" data-count="${n}">0</span><span class="rstat-lbl">${l}</span></div>`
    ).join('');

    container.innerHTML =
      `<div class="report-hero">
         <div class="report-grade">
           <span class="rg-num rg-before">${before}</span>
           <svg class="rg-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
           <span class="rg-num rg-after">${after}</span>
         </div>
         <div class="report-caption">Reading grade level</div>
         ${badge}
       </div>
       <div class="report-stats">${stats}</div>`;
  }

  function renderChips(container, doc) {
    container.replaceChildren();
    const s = doc.stats || {};
    // The impact card below already shows the grade drop and step count, so we
    // only repeat them here as a small chip when that card is not showing.
    const hasReport = s.before && s.after;

    if (!hasReport && s.steps) {
      const chip = el('span', 'chip');
      chip.appendChild(el('span', null, `${s.steps} step${s.steps === 1 ? '' : 's'}`));
      container.appendChild(chip);
    }

    const src = el('span', 'chip');
    src.appendChild(icon('lock'));
    src.appendChild(el('span', null, 'On device'));
    container.appendChild(src);

    if (doc.profileName) {
      const chip = el('span', 'chip');
      chip.appendChild(el('span', null, doc.profileName));
      container.appendChild(chip);
    }

    const lang = doc.glossary && doc.glossary.some(g => g.tr) && D.LANGUAGES[doc.glossary.find(g => g.tr).tr.lang];
    if (lang) {
      const chip = el('span', 'chip');
      chip.appendChild(el('span', null, lang.flag + ' ' + lang.native));
      container.appendChild(chip);
    }
  }

  /* explanation card */
  /** @returns {{node:HTMLElement, groups:Array}} groups feed the read-aloud queue */
  function explanationCard(exp) {
    const card = el('div', 'explain-card');
    const groups = [];

    const head = el('div', 'ex-head');
    const ic = el('div', 'ex-icon');
    ic.appendChild(icon(exp.icon || 'bulb'));
    head.appendChild(ic);
    const txt = el('div');
    txt.appendChild(el('div', 'ex-label', 'Another way to see it'));
    txt.appendChild(el('div', 'ex-name', exp.name));
    head.appendChild(txt);
    card.appendChild(head);

    const body = el('div', 'ex-body');
    for (const part of exp.body) {
      if (part.t === 'ol') {
        const ol = el('ol');
        for (const li of part.v) {
          const item = el('li');
          groups.push(fillWords(item, li));
          ol.appendChild(item);
        }
        body.appendChild(ol);
      } else {
        const p = el('p');
        groups.push(fillWords(p, part.v));
        body.appendChild(p);
      }
    }
    card.appendChild(body);

    const src = el('div', 'ex-src');
    src.appendChild(icon('lock'));
    src.appendChild(el('span', null, 'One of the built-in explanations.'));
    card.appendChild(src);

    return { node: card, groups };
  }

  /* comprehension check card */
  function quizCard(quiz, onComplete) {
    const card = el('div', 'quiz');

    const head = el('div', 'quiz-head');
    head.appendChild(icon('check'));
    head.appendChild(el('span', null, 'Quick check'));
    card.appendChild(head);
    card.appendChild(el('p', 'quiz-sub', 'A gentle way to see what stuck. There is no score.'));

    if (quiz.empty || !quiz.questions.length) {
      card.appendChild(el('p', 'quiz-empty', 'This page is short. Read it once more to help it stick.'));
      return card;
    }

    let answeredCount = 0, done = false;
    const checkDone = () => {
      if (done || answeredCount < quiz.questions.length) return;
      done = true;
      if (typeof onComplete === 'function') onComplete();
    };

    quiz.questions.forEach((q, qi) => {
      const qEl = el('div', 'quiz-q');
      qEl.appendChild(el('p', 'quiz-q-text', (qi + 1) + '. ' + q.q));
      const choicesWrap = el('div', 'quiz-choices');
      let answered = false;

      q.choices.forEach((c, ci) => {
        const b = el('button', 'quiz-choice');
        b.appendChild(el('span', 'quiz-choice-txt', c));
        b.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const correct = ci === q.answer;
          const mark = (btn, name) => { const m = el('span', 'quiz-mark'); m.appendChild(icon(name)); btn.appendChild(m); };
          b.classList.add(correct ? 'is-correct' : 'is-wrong');
          mark(b, correct ? 'check' : 'cross');
          // always show a check on the right answer, so it never relies on colour alone
          const right = choicesWrap.children[q.answer];
          if (!correct && right) { right.classList.add('is-correct'); mark(right, 'check'); }
          [...choicesWrap.children].forEach(x => x.classList.add('done'));
          const fb = el('p', 'quiz-fb ' + (correct ? 'ok' : 'no'));
          fb.appendChild(el('span', null, (correct ? 'Yes. ' : 'Not quite. ') + (q.note || '')));
          qEl.appendChild(fb);
          answeredCount++;
          checkDone();
        });
        choicesWrap.appendChild(b);
      });

      qEl.appendChild(choicesWrap);
      card.appendChild(qEl);
    });

    card.appendChild(el('p', 'quiz-foot', 'A quick built-in check'));
    return card;
  }

  /* word definition */
  function glossItem(g) {
    const item = el('div', 'gloss-item');
    item.appendChild(el('div', 'gloss-word', g.word));

    const plain = el('div', 'gloss-plain');
    plain.appendChild(icon('swap'));
    plain.appendChild(el('span', null, g.plain));
    item.appendChild(plain);
    if (g.def) item.appendChild(el('div', 'gloss-def', g.def));

    // home-language translation, when the profile has one
    if (g.tr) {
      const lang = D.LANGUAGES[g.tr.lang];
      const row = el('div', 'gloss-tr');
      const head = el('div', 'gloss-tr-head');
      head.appendChild(el('span', 'gloss-flag', lang ? lang.flag : '🌐'));
      head.appendChild(el('span', 'gloss-tr-word', g.tr.word));
      row.appendChild(head);
      if (g.tr.def) row.appendChild(el('div', 'gloss-tr-def', g.tr.def));
      item.appendChild(row);
    }
    return item;
  }

  function showWord(g) {
    const wrap = el('div');
    wrap.appendChild(glossItem(g));
    openSheet('Word', wrap);
  }

  function glossarySheet(doc) {
    const wrap = el('div');
    if (!doc.glossary.length) {
      wrap.appendChild(emptyState('No tricky words flagged on this page.'));
    } else {
      for (const g of doc.glossary) wrap.appendChild(glossItem(g));
    }
    openSheet('Hard words', wrap);
  }

  /* language switcher */
  function languageSheet(onPick) {
    const i18n = Clarity.i18n;
    const wrap = el('div');
    wrap.appendChild(el('p', 'card-note', i18n.t('lang.sub')));

    const list = el('div', 'opt-list');
    for (const L of i18n.langs()) {
      const opt = el('button', 'opt' + (L.code === i18n.current() ? ' is-on' : ''));
      opt.appendChild(el('span', 'opt-emoji', L.flag));
      const main = el('div', 'opt-main');
      main.appendChild(el('div', 'opt-title', L.name));
      opt.appendChild(main);
      if (L.code === i18n.current()) opt.appendChild(icon('check', 'opt-check'));
      opt.addEventListener('click', () => { closeSheet(); onPick(L.code); });
      list.appendChild(opt);
    }
    wrap.appendChild(list);
    openSheet(i18n.t('lang.title'), wrap);
  }

  /* option lists */
  function profileSheet(activeId, onPick) {
    const list = el('div', 'opt-list');
    for (const p of Clarity.store.profiles()) {
      const opt = el('button', 'opt' + (p.id === activeId ? ' is-on' : ''));
      opt.appendChild(profileBadge(p, 'opt-badge'));
      const main = el('div', 'opt-main');
      main.appendChild(el('div', 'opt-title', p.name));
      main.appendChild(el('div', 'opt-desc', p.desc || `Grade ${p.level}`));
      opt.appendChild(main);
      if (p.id === activeId) opt.appendChild(icon('check', 'opt-check'));
      opt.addEventListener('click', () => { closeSheet(); onPick(p.id); });
      list.appendChild(opt);
    }
    openSheet('Reading profile', list);
  }

  function strategySheet(onPick) {
    const wrap = el('div');
    const note = el('p', 'card-note', 'Still not clicking? Pick a way and read it again.');
    wrap.appendChild(note);

    const grid = el('div', 'strat-grid');
    for (const s of D.STRATEGIES) {
      const b = el('button', 'strat');
      const si = el('div', 'strat-ic');
      si.appendChild(icon(s.icon || 'bulb'));
      b.appendChild(si);
      b.appendChild(el('div', 'strat-name', s.name));
      b.appendChild(el('div', 'strat-desc', s.desc));
      b.addEventListener('click', () => { closeSheet(); onPick(s); });
      grid.appendChild(b);
    }
    wrap.appendChild(grid);
    openSheet('Explain it differently', wrap);
  }

  /* profile editor */
  function profileEditor(profile, onSave, onDelete) {
    const p = { ...profile };
    const wrap = el('div');

    const preview = el('div', 'preview-strip');
    const paint = () => {
      const dark = false;  // app is always light
      const tint = D.TINTS[p.tint] || D.TINTS.none;
      preview.style.background = dark ? tint.dark : tint.light;
      preview.style.color = dark ? '#EDF3F2' : '#16302F';
      preview.style.fontFamily = (D.FONTS[p.font] || D.FONTS.lexend).stack;
      preview.style.fontSize = p.size + 'px';
      preview.style.lineHeight = p.lineHeight;
      preview.style.letterSpacing = p.letterSpacing + 'em';
      preview.style.wordSpacing = p.wordSpacing + 'em';
      preview.textContent = 'Read the first line out loud. Then do only that one thing.';
    };

    /* name + emoji */
    const rowName = el('div', 'row');
    rowName.appendChild(el('label', 'row-label', 'Name'));
    const nameIn = el('input', 'text-input');
    nameIn.type = 'text'; nameIn.value = p.name;
    nameIn.addEventListener('input', () => { p.name = nameIn.value; });
    rowName.appendChild(nameIn);
    wrap.appendChild(rowName);

    // default any legacy emoji profile to a matching icon
    if (!p.icon) p.icon = D.EMOJI_TO_ICON[p.emoji] || 'star';
    if (!p.color) p.color = D.PROFILE_COLORS[0];

    /* icon picker */
    const rowIcon = el('div', 'row');
    rowIcon.appendChild(el('label', 'row-label', 'Icon'));
    const iconSet = el('div', 'icon-grid');
    const paintIcons = () => [...iconSet.children].forEach(c =>
      c.classList.toggle('is-on', c.dataset.icon === p.icon));
    D.ICON_LIST.forEach(id => {
      const b = el('button', 'icon-pick');
      b.dataset.icon = id;
      b.appendChild(profileGlyph(id));
      b.addEventListener('click', () => { p.icon = id; paintIcons(); paintPreviewBadge(); });
      iconSet.appendChild(b);
    });
    rowIcon.appendChild(iconSet);
    paintIcons();
    wrap.appendChild(rowIcon);

    /* colour picker */
    const rowColor = el('div', 'row');
    rowColor.appendChild(el('label', 'row-label', 'Colour'));
    const colorSet = el('div', 'pillset');
    const paintColors = () => [...colorSet.children].forEach(c =>
      c.classList.toggle('is-on', c.dataset.color === p.color));
    D.PROFILE_COLORS.forEach(hex => {
      const b = el('button', 'color-dot');
      b.dataset.color = hex;
      b.style.background = hex;
      b.setAttribute('aria-label', 'colour ' + hex);
      b.addEventListener('click', () => { p.color = hex; paintColors(); paintPreviewBadge(); });
      colorSet.appendChild(b);
    });
    rowColor.appendChild(colorSet);
    paintColors();
    wrap.appendChild(rowColor);

    // live badge preview next to the name
    const badgeHost = el('div', 'editor-badge');
    const paintPreviewBadge = () => badgeHost.replaceChildren(profileBadge(p, 'pc-emoji'));
    paintPreviewBadge();
    rowName.insertBefore(badgeHost, rowName.firstChild);

    /* reading level */
    const rowLevel = el('div', 'row');
    const lvlLabel = el('label', 'row-label', `Reading level, grade ${p.level}`);
    rowLevel.appendChild(lvlLabel);
    const lvl = el('input', 'range');
    lvl.type = 'range'; lvl.min = 2; lvl.max = 10; lvl.step = 1; lvl.value = p.level;
    lvl.addEventListener('input', () => {
      p.level = +lvl.value;
      lvlLabel.textContent = `Reading level, grade ${p.level}`;
    });
    rowLevel.appendChild(lvl);
    wrap.appendChild(rowLevel);

    /* font */
    const rowFont = el('div', 'row');
    rowFont.appendChild(el('label', 'row-label', 'Typeface'));
    const fontSet = el('div', 'pillset');
    Object.entries(D.FONTS).forEach(([k, f]) => {
      const b = el('button', 'pill' + (k === p.font ? ' is-on' : ''), f.name);
      b.style.fontFamily = f.stack;
      b.addEventListener('click', () => {
        p.font = k;
        [...fontSet.children].forEach((c, i) => c.classList.toggle('is-on', Object.keys(D.FONTS)[i] === k));
        paint();
      });
      fontSet.appendChild(b);
    });
    rowFont.appendChild(fontSet);
    wrap.appendChild(rowFont);

    /* colour overlay */
    const rowTint = el('div', 'row');
    rowTint.appendChild(el('label', 'row-label', 'Page colour'));
    const tintSet = el('div', 'pillset');
    Object.entries(D.TINTS).forEach(([k, t]) => {
      const b = el('button', 'pill' + (k === p.tint ? ' is-on' : ''), t.name);
      b.addEventListener('click', () => {
        p.tint = k;
        [...tintSet.children].forEach((c, i) => c.classList.toggle('is-on', Object.keys(D.TINTS)[i] === k));
        paint();
      });
      tintSet.appendChild(b);
    });
    rowTint.appendChild(tintSet);
    wrap.appendChild(rowTint);

    /* sliders */
    const slider = (label, key, min, max, step, fmt) => {
      const row = el('div', 'row');
      const lab = el('label', 'row-label', `${label}: ${fmt(p[key])}`);
      row.appendChild(lab);
      const r = el('input', 'range');
      r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = p[key];
      r.addEventListener('input', () => {
        p[key] = +r.value;
        lab.textContent = `${label}: ${fmt(p[key])}`;
        paint();
      });
      row.appendChild(r);
      wrap.appendChild(row);
    };
    slider('Text size', 'size', 15, 30, 1, v => v + 'px');
    slider('Line spacing', 'lineHeight', 1.4, 2.4, 0.05, v => v.toFixed(2) + '×');
    slider('Letter spacing', 'letterSpacing', 0, 0.12, 0.01, v => v.toFixed(2) + 'em');
    slider('Word spacing', 'wordSpacing', 0, 0.4, 0.02, v => v.toFixed(2) + 'em');
    slider('Reading speed', 'rate', 0.5, 1.5, 0.05, v => v.toFixed(2) + '×');

    /* glossary toggle */
    const rowGloss = el('div', 'row');
    rowGloss.appendChild(el('label', 'row-label', 'Hard-word glossary'));
    const glossSet = el('div', 'pillset');
    [['On', true], ['Off', false]].forEach(([label, val]) => {
      const b = el('button', 'pill' + (p.glossary === val ? ' is-on' : ''), label);
      b.addEventListener('click', () => {
        p.glossary = val;
        [...glossSet.children].forEach((c) => c.classList.toggle('is-on', c.textContent === label));
      });
      glossSet.appendChild(b);
    });
    rowGloss.appendChild(glossSet);
    wrap.appendChild(rowGloss);

    /* home language, the ELL story */
    const rowLang = el('div', 'row');
    rowLang.appendChild(el('label', 'row-label', 'Home language'));
    const langHelp = el('p', 'row-help');
    const langSet = el('div', 'pillset');
    const paintLangHelp = () => {
      const L = D.LANGUAGES[p.language] || D.LANGUAGES.en;
      langHelp.textContent = p.language === 'en'
        ? 'Hard words are explained in plain English.'
        : L.builtin
          ? `Hard words are also shown in ${L.native}. Works offline.`
          : 'Hard words are explained in plain English.';
    };
    Object.entries(D.LANGUAGES).forEach(([k, L]) => {
      const b = el('button', 'pill' + (k === p.language ? ' is-on' : ''), L.flag + ' ' + L.native);
      b.addEventListener('click', () => {
        p.language = k;
        [...langSet.children].forEach((c, i) => c.classList.toggle('is-on', Object.keys(D.LANGUAGES)[i] === k));
        paintLangHelp();
      });
      langSet.appendChild(b);
    });
    rowLang.appendChild(langSet);
    rowLang.appendChild(langHelp);
    paintLangHelp();
    wrap.appendChild(rowLang);

    /* preview */
    const rowPrev = el('div', 'row');
    rowPrev.appendChild(el('label', 'row-label', 'Preview'));
    rowPrev.appendChild(preview);
    wrap.appendChild(rowPrev);
    paint();

    /* actions */
    const save = el('button', 'btn btn-primary btn-block', 'Save profile');
    save.addEventListener('click', () => {
      p.name = (p.name || '').trim() || 'Untitled profile';
      closeSheet();
      onSave(p);
    });
    wrap.appendChild(save);

    if (onDelete && Clarity.store.profiles().length > 1) {
      const del = el('button', 'btn btn-ghost btn-block btn-danger', 'Delete this profile');
      del.style.marginTop = '10px';
      del.addEventListener('click', () => { closeSheet(); onDelete(p.id); });
      wrap.appendChild(del);
    }

    openSheet(profile.name ? 'Edit profile' : 'New profile', wrap);
  }

  return {
    el, icon, toast, relTime,
    openSheet, closeSheet,
    applyProfile, emptyState,
    renderDocList, renderSamples, renderProfiles, renderResources, renderLessons, renderDiffs, renderPresentations, renderBadges,
    renderDoc, renderChips, renderReport, explanationCard, quizCard,
    showWord, glossarySheet, profileSheet, strategySheet, profileEditor, languageSheet,
    profileGlyph, profileBadge, ICONS
  };
})();
