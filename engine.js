/*
   CLARITY, reformatting engine

   Runs entirely on-device. Takes raw text off
   a worksheet and rebuilds it as short, ordered,
   literal steps at a chosen reading level.

   Pipeline:
     clean → structure → split → simplify →
     swap vocabulary → classify → measure
*/
window.Clarity = window.Clarity || {};

Clarity.engine = (function () {
  const D = Clarity.data;

  /* 1. cleanup */
  function clean(raw) {
    const norm = String(raw || '')
      .replace(/\r\n?/g, '\n')
      .replace(/­/g, '')                       // soft hyphen
      .replace(/[‘’‛]/g, "'")        // curly single quotes
      .replace(/[“”]/g, '"')              // curly double quotes
      .replace(/[–—]/g, '—')
      .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      .replace(/([A-Za-z])-\n([A-Za-z])/g, '$1$2')  // join hyphen split across lines
      .replace(/[ \t]+/g, ' ');

    // Reflow. Photos and copied columns wrap one sentence across many short
    // lines, which used to glue words together ("to\nmeasure" -> "tomeasure")
    // and turn each line into its own step. Merge running text back into
    // paragraphs; keep blank lines, list items and headings on their own line.
    const lines = norm.split('\n');
    const out = [];
    let buf = '';
    const flush = () => { if (buf.trim()) out.push(buf.trim()); buf = ''; };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) { flush(); out.push(''); continue; }         // paragraph break
      if (/^\d{1,4}$/.test(line)) { flush(); continue; }      // a lone page number, drop it
      const nextRaw = lines[i + 1] ? lines[i + 1].trim() : '';
      if (LIST_RE.test(line) || isHeadingLine(line, nextRaw)) {
        flush();
        out.push(line);
        continue;
      }
      buf = buf ? buf + ' ' + line : line;                    // continuation
    }
    flush();

    return out.join('\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* 2. syllables & reading level */
  function syllables(word) {
    let w = String(word).toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  /** Flesch-Kincaid grade level. Returns a clamped 1-16. */
  function gradeLevel(text) {
    const sents = splitSentences(text).filter(s => s.trim());
    const words = String(text).match(/[A-Za-z][A-Za-z'-]*/g) || [];
    if (!sents.length || !words.length) return 0;
    const syl = words.reduce((n, w) => n + syllables(w), 0);
    const g = 0.39 * (words.length / sents.length) + 11.8 * (syl / words.length) - 15.59;
    return Math.max(1, Math.min(16, Math.round(g * 10) / 10));
  }

  /* 3. sentence splitting */
  /** Scanner-based so decimals, abbreviations and initials don't split. */
  function splitSentences(text) {
    const s = String(text);
    const out = [];
    let start = 0;

    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c !== '.' && c !== '!' && c !== '?') continue;

      // "3.5", a period between digits is a decimal
      if (c === '.' && /\d/.test(s[i - 1] || '') && /\d/.test(s[i + 1] || '')) continue;

      // consume runs like "?!" or "..."
      let end = i;
      while (end + 1 < s.length && '.!?'.includes(s[end + 1])) end++;

      // closing quote or bracket belongs to this sentence
      while (end + 1 < s.length && '"\')]'.includes(s[end + 1])) end++;

      const after = s[end + 1];
      if (after && !/[\s\n]/.test(after)) continue;      // no break without whitespace after

      const chunk = s.slice(start, end + 1);
      const lastWord = (chunk.match(/([A-Za-z]+)[.!?"')\]]*$/) || [])[1] || '';

      if (c === '.') {
        if (D.ABBREV.has(lastWord.toLowerCase())) continue;   // Dr. Mrs. etc.
        if (lastWord.length === 1 && /[A-Z]/.test(lastWord)) continue; // initial "J."
      }

      if (chunk.trim()) out.push(chunk.trim());
      start = end + 1;
      i = end;
    }

    const tail = s.slice(start).trim();
    if (tail) out.push(tail);
    return out;
  }

  /** Glue stray one- or two-word fragments (OCR noise like "The." or "49).")
      back onto a neighbour so they don't each become their own step. */
  function mergeFragments(sents) {
    const wc = (x) => (x.match(/[A-Za-z0-9]+/g) || []).length;
    const out = [];
    for (const s of sents) {
      if (LIST_RE.test(s)) { out.push(s); continue; }
      if (out.length && wc(s) <= 2 && !LIST_RE.test(out[out.length - 1])) {
        out[out.length - 1] = (out[out.length - 1] + ' ' + s).replace(/\s+/g, ' ').trim();
      } else {
        out.push(s);
      }
    }
    if (out.length >= 2 && wc(out[0]) <= 2 && !LIST_RE.test(out[0])) {
      out[1] = (out[0] + ' ' + out[1]).replace(/\s+/g, ' ').trim();
      out.shift();
    }
    return out;
  }

  /* 4. word-level swaps */
  const cap = (w, like) => /^[A-Z]/.test(like) ? w[0].toUpperCase() + w.slice(1) : w;

  function addS(w) {
    if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
    return w + 's';
  }
  function addEd(w) {
    if (/e$/.test(w)) return w + 'd';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
    return w + 'ed';
  }
  function addIng(w) {
    if (/[^e]e$/.test(w)) return w.slice(0, -1) + 'ing';
    return w + 'ing';
  }

  /** Find the dictionary base for an inflected word. Returns {base, infl} or null. */
  function lookup(word) {
    const w = word.toLowerCase();
    if (D.WORDS[w]) return { base: w, infl: '' };

    const tries = [
      ['s',   w.replace(/(ie)?s$/, m => m === 'ies' ? 'y' : '')],
      ['s',   w.replace(/es$/, '')],
      ['ed',  w.replace(/ed$/, '')],
      ['ed',  w.replace(/ed$/, 'e')],
      ['ed',  w.replace(/ied$/, 'y')],
      ['ing', w.replace(/ing$/, '')],
      ['ing', w.replace(/ing$/, 'e')],
      ['ly',  w.replace(/ly$/, '')],
      ['ly',  w.replace(/ily$/, 'y')]
    ];
    for (const [infl, base] of tries) {
      if (base !== w && D.WORDS[base]) return { base, infl };
    }
    return null;
  }

  /* Verbs that appear as the head of a replacement phrase and do not take the
     regular endings. Without these, "provided" → "give" + "ed" → "gived". */
  const IRREGULAR = {
    give:['gave','giving'],   make:['made','making'],   get:['got','getting'],
    take:['took','taking'],   put:['put','putting'],    find:['found','finding'],
    tell:['told','telling'],  see:['saw','seeing'],     do:['did','doing'],
    build:['built','building'], hold:['held','holding'], write:['wrote','writing'],
    say:['said','saying'],    come:['came','coming'],   go:['went','going'],
    know:['knew','knowing'],  keep:['kept','keeping'],  leave:['left','leaving'],
    stand:['stood','standing'], run:['ran','running'],  cut:['cut','cutting'],
    think:['thought','thinking'], choose:['chose','choosing'], sort:['sorted','sorting'],
    // 'show' matters because "indicated" swaps to "show": its participle is
    // "shown", not "showed", so we skip the -ed form and keep the original word.
    show:['showed','showing']
  };

  /** True when adding -ed/-ing would need a doubled final consonant. */
  const needsDoubling = (w) => /^[a-z]*[aeiou][^aeiouwxy]$/.test(w) && w.length <= 5;

  /**
   * Re-apply the original inflection to a replacement phrase.
   * Returns null when we cannot do it without inventing a non-word,
   * the caller then leaves the original word alone.
   */
  function inflect(phrase, infl) {
    if (!infl) return phrase;
    const parts = phrase.split(' ');
    const head = parts[0].toLowerCase();

    // "fundamentally" → "basic" would be an adjective where an adverb belongs.
    // Building the adverb reliably isn't worth the wrong answers, so skip.
    if (infl === 'ly') return null;

    // A phrase can't be pluralised by its head: "consequence" → "what happens
    // because of it" must not become "whats happens because of it".
    if (infl === 's') {
      if (parts.length > 1) return null;
      parts[0] = addS(head);
      return parts.join(' ');
    }

    const irr = IRREGULAR[head];
    if (irr) {
      // For irregular verbs the past tense and the past participle differ
      // ("gave" vs "given") and we cannot tell which one the sentence needs
      // without parsing it, so we leave -ed forms alone entirely.
      if (infl === 'ed') return null;
      parts[0] = irr[1];
      return parts.join(' ');
    }
    if (needsDoubling(head)) return null;        // don't guess "stoped" / "geting"

    parts[0] = infl === 'ed' ? addEd(head) : addIng(head);
    return parts.join(' ');
  }

  /** Swap academic vocabulary down to `level`. Collects glossary hits. */
  function swapWords(text, level, hits, lang) {
    const tr = lang && lang !== 'en' && D.TRANSLATIONS[lang];
    if (level >= 9) return text;
    const minSyl = level >= 7 ? 3 : 0;

    const out = text.replace(/\b[A-Za-z][A-Za-z'-]*\b/g, (word, offset) => {
      // A capitalised word mid-sentence is almost always part of a name,
      // "the Industrial Revolution" must not become "the Industrial Big change".
      if (offset > 0 && /^[A-Z]/.test(word)) return word;

      const found = lookup(word);
      if (!found) return word;
      if (syllables(found.base) < minSyl) return word;

      const entry = D.WORDS[found.base];
      const swapped = inflect(entry.p, found.infl);
      if (swapped === null) return word;   // can't inflect it cleanly, leave it be

      if (hits && !hits.some(h => h.word === found.base)) {
        const hit = { word: found.base, plain: entry.p, def: entry.d };
        if (tr && tr[found.base]) hit.tr = { lang, word: tr[found.base].w, def: tr[found.base].d };
        hits.push(hit);
      }
      return cap(swapped, word);
    });

    return fixArticles(out);
  }

  /**
   * Fix "a"/"an" after a swap changed the following word's first sound,
   * "an equation" → "an math sentence" must become "a math sentence".
   * Sound-based, not letter-based, so "an hour" and "a university" stay right.
   */
  function fixArticles(text) {
    return text.replace(/\b([Aa]n?)\s+([A-Za-z][A-Za-z'-]*)/g, (m, art, word) => {
      const w = word.toLowerCase();
      let vowelSound = /^[aeiou]/.test(w);
      if (/^(uni|use|user|usu|eu|ewe|one|once)/.test(w)) vowelSound = false; // "you" sound
      if (/^(hour|honest|honor|heir)/.test(w)) vowelSound = true;            // silent h
      const isAn = art.toLowerCase() === 'an';
      if (vowelSound === isAn) return m;
      const upper = /^A/.test(art);
      const fixed = vowelSound ? (upper ? 'An' : 'an') : (upper ? 'A' : 'a');
      return fixed + ' ' + word;
    });
  }

  /* 5. sentence simplification */
  const hasVerb = (s) =>
    /\b(is|are|was|were|be|been|being|has|have|had|do|does|did|can|could|will|would|may|might|must|should)\b/i.test(s) ||
    /\b\w+(s|ed|ing)\b/i.test(s);

  /** Split one long sentence into several short ones. */
  function simplify(sentence, level) {
    const maxWords = level <= 4 ? 12 : level <= 6 ? 16 : level <= 8 ? 22 : 999;
    let notes = [];
    let s = sentence.trim();

    // pull parenthetical asides out into their own note
    s = s.replace(/\s*\(([^()]{12,})\)/g, (_, inner) => { notes.push(inner.trim()); return ''; });

    // phrase-level cleanup
    const startedCapital = /^[A-Z]/.test(s);
    for (const [re, to] of D.PHRASES) s = s.replace(re, to);
    s = s.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
    // a swap at the front ("Prior to" → "before") must not lose the capital
    if (startedCapital && /^[a-z]/.test(s)) s = s[0].toUpperCase() + s.slice(1);

    let parts = [s];

    const wordCount = (x) => (x.match(/\S+/g) || []).length;
    const isLong = (x) => wordCount(x) > maxWords;

    // pass A, semicolons and colons that join full clauses
    parts = parts.flatMap(p => p.split(/;\s+/).map(x => x.trim()).filter(Boolean));

    // pass B, ", and/but/so " joining two independent clauses
    if (level <= 8) {
      parts = parts.flatMap(p => {
        if (!isLong(p)) return [p];
        const m = p.match(/^(.{18,}?),\s+(and|but|so|yet|or)\s+(.{18,})$/i);
        if (!m || !hasVerb(m[1]) || !hasVerb(m[3])) return [p];
        const joiner = m[2].toLowerCase();
        const lead = joiner === 'and' || joiner === 'or' ? '' :
                     joiner === 'but' || joiner === 'yet' ? 'But ' : 'So ';
        return [
          m[1].replace(/[,;]$/, '') + '.',
          lead + m[3][0].toUpperCase() + m[3].slice(1)
        ];
      });
    }

    // pass B2, two actions welded into one instruction. "Put on your goggles
    // and tie your hair back" is two things to do; a reader who takes it
    // literally needs them as two steps. We split at a connector, "and",
    // "then", or a bare comma, only when the next word is itself a command.
    if (level <= 6) {
      const splitOnce = (p) => {
        if (!isLong(p)) return [p];
        // connector (comma+and / and / then) OR a bare comma, followed by a verb
        const re = /(?:,\s+(?:and\s+then|and|then)\s+|,\s+|\s+(?:and\s+then|and|then)\s+)(?=([a-z]+)\b)/gi;
        let m;
        while ((m = re.exec(p)) !== null) {
          const verb = m[1].toLowerCase();
          if (!D.IMPERATIVES.has(verb)) continue;
          const left = p.slice(0, m.index).replace(/[,;]\s*$/, '');
          const right = p.slice(m.index + m[0].length);
          if ((left.match(/\S+/g) || []).length < 3) continue;
          if ((right.match(/\S+/g) || []).length < 3) continue;
          // don't cut a "not X, Y" pair or a "when/until ..." tail into commands
          if (/\b(not|never|do not|don't)\b/i.test(left.slice(-24))) continue;
          // a bare comma split (no and/then) is only safe when the left side is
          // itself a command, otherwise we'd strand a lead-in clause as a step
          const commaOnly = !/\b(and|then)\b/i.test(m[0]);
          if (commaOnly) {
            const lf = (left.match(/^[A-Za-z]+/) || [''])[0].toLowerCase();
            if (!D.IMPERATIVES.has(lf)) continue;
          }
          return [left + '.', ...splitOnce(right[0].toUpperCase() + right.slice(1))];
        }
        return [p];
      };
      parts = parts.flatMap(p => isInstruction(p) ? splitOnce(p) : [p]);
    }

    // pass C, leading subordinate clause: "Because X, Y." → "X. So Y."
    //
    // Only reason/contrast connectors are split. Time connectors (before, after,
    // when, if) are deliberately left alone: "Before beginning the experiment"
    // is not a sentence on its own, and stranding it as step 1 tells a literal
    // reader to do something that has no verb.
    if (level <= 6) {
      parts = parts.flatMap(p => {
        if (!isLong(p)) return [p];
        const m = p.match(/^(Because|Since|Although|Though)\s+(.{15,}?),\s+(.{15,})$/i);
        if (!m || !isClause(m[2]) || !hasVerb(m[3])) return [p];
        const k = m[1].toLowerCase();
        const first = m[2][0].toUpperCase() + m[2].slice(1).replace(/[,;]$/, '');
        const rest  = m[3][0].toUpperCase() + m[3].slice(1);
        return (k === 'because' || k === 'since')
          ? [first + '.', 'So ' + lower(rest)]
          : [first + '.', 'But ' + lower(rest)];
      });
    }

    // pass D, trailing ", which/who ..." becomes its own sentence
    if (level <= 6) {
      parts = parts.flatMap(p => {
        if (!isLong(p)) return [p];
        const m = p.match(/^(.{20,}?),\s+(which|who)\s+(.{12,})$/i);
        if (!m) return [p];
        const subject = m[2].toLowerCase() === 'who' ? 'This person ' : 'This ';
        return [m[1].replace(/[,;]$/, '') + '.', subject + m[3]];
      });
    }

    parts = parts
      .map(p => p.trim().replace(/^[,;:\s]+/, ''))
      .filter(p => /[A-Za-z0-9]/.test(p))
      // every finished piece is its own sentence now, so it opens with a capital
      .map(p => /^[a-z]/.test(p) ? p[0].toUpperCase() + p.slice(1) : p)
      .map(p => /[.!?:]$/.test(p) ? p : p + '.');

    return { parts, notes };
  }

  const lower = (s) => s ? s[0].toLowerCase() + s.slice(1) : s;

  /**
   * True only for a clause that can stand alone as a sentence, it needs a
   * subject and a finite verb. Rejects bare gerund phrases like
   * "beginning the experiment", which would otherwise become a fragment.
   */
  function isClause(s) {
    const t = s.trim();
    if (/^(\w+ing|to)\b/i.test(t)) return false;
    const hasSubject = /^(the|a|an|this|that|these|those|he|she|it|they|we|you|i|there|his|her|their|its|my|your|our|[A-Z]\w+)\b/i.test(t);
    const hasFinite = /\b(is|are|was|were|be|been|has|have|had|do|does|did|can|could|will|would|may|might|must|should|[a-z]+(s|ed))\b/i.test(t);
    return hasSubject && hasFinite;
  }

  /* 6. classification */
  function classify(sentence) {
    const t = sentence.trim();
    if (/\?\s*$/.test(t)) return 'question';
    const first = (t.match(/^[A-Za-z]+/) || [''])[0].toLowerCase();
    if (D.IMPERATIVES.has(first)) return 'instruction';
    if (D.SEQUENCE.test(t)) return 'instruction';
    if (/^(directions?|instructions?|task|goal|objective)\s*:/i.test(t)) return 'heading';
    return 'statement';
  }

  /**
   * Whether a sentence is really a command to the student, including ones that
   * open with a lead-in clause: "Before beginning, put on your goggles."
   * The main verb sits after the first comma, so we look there too.
   */
  function isInstruction(sentence) {
    if (classify(sentence) === 'instruction') return true;
    const m = sentence.trim().match(/^(?:before|after|when|while|once|as soon as|if|to begin|first|next|then|now)\b[^,]*,\s*([a-z]+)/i);
    return !!(m && D.IMPERATIVES.has(m[1].toLowerCase()));
  }

  const LIST_RE = /^\s*(\d{1,2}[.)]|[a-z][.)]|[ivx]{1,4}[.)]|[•▪●\-\*–—])\s+/i;

  function isHeadingLine(line, next) {
    const t = line.trim();
    if (!t || t.length > 62) return false;
    if (LIST_RE.test(t)) return false;
    if (/[.!?,;]$/.test(t)) return /^(directions?|instructions?)\s*:?$/i.test(t);
    if (/:$/.test(t)) return true;
    const words = t.split(/\s+/);
    if (words.length > 9) return false;
    // ALL CAPS or Title Case with a blank line after reads as a heading
    if (t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
    return !next || !next.trim();
  }

  /* 7. main */
  /**
   * @param {string} raw   text off the page
   * @param {object} prof  active profile
   * @returns {object}     doc model consumed by the reader view
   */
  function process(raw, prof) {
    const source = clean(raw);
    const level = prof.level;
    const glossary = [];
    const blocks = [];

    let stepNo = 0;
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      /* headings pass through untouched, they orient the reader */
      if (isHeadingLine(line, lines[i + 1])) {
        blocks.push({ kind: 'heading', text: line.replace(/:$/, '') });
        continue;
      }

      /* keep the worksheet's own numbering when it has some */
      const listMatch = line.match(LIST_RE);
      const marker = listMatch ? listMatch[1].replace(/[.)]$/, '') : null;
      const body = listMatch ? line.slice(listMatch[0].length) : line;

      for (const sentence of mergeFragments(splitSentences(body))) {
        const { parts, notes } = simplify(sentence, level);

        parts.forEach((part, idx) => {
          // always collect swaps so the impact count is honest; the visible
          // glossary list is gated on prof.glossary further down.
          const swapped = swapWords(part, level, glossary, prof.language);
          const kind = classify(swapped);
          if (kind === 'heading') {
            blocks.push({ kind: 'heading', text: swapped.replace(/:$/, '') });
            return;
          }
          stepNo++;
          blocks.push({
            kind: kind === 'question' ? 'question' : 'step',
            // the original marker labels only the first piece it produced
            label: marker && idx === 0 ? marker : String(stepNo),
            n: stepNo,
            text: swapped
          });
        });

        for (const note of notes) {
          blocks.push({ kind: 'note', text: swapWords(note, level, glossary, prof.language) });
        }
      }
    }

    /* re-label sequentially when the page had no numbering of its own */
    let seen = 0;
    for (const b of blocks) {
      if (b.kind === 'step' || b.kind === 'question') { seen++; b.n = seen; }
    }

    const simpleText = blocks
      .filter(b => b.kind !== 'heading')
      .map(b => b.text).join(' ');

    return {
      id: null,
      title: guessTitle(source),
      source,
      blocks,
      glossary: prof.glossary ? glossary.sort((a, b) => a.word.localeCompare(b.word)) : [],
      profileId: prof.id,
      profileName: prof.name,
      ai: false,
      explanations: [],
      stats: {
        before: gradeLevel(source),
        after: gradeLevel(simpleText || source),
        steps: seen,
        words: (source.match(/\S+/g) || []).length,
        hard: glossary.length
      }
    };
  }

  function guessTitle(text) {
    const first = (text.split('\n').find(l => l.trim()) || '').trim();
    if (!first) return 'Untitled page';
    const clipped = first.replace(LIST_RE, '').replace(/[:.]$/, '');
    if (clipped.length <= 46) return clipped;
    const words = clipped.split(/\s+/).slice(0, 7).join(' ');
    return words + '…';
  }

  /**
   * Built-in "explain differently". No network required.
   * Re-derives the material through a chosen lens rather than
   * pretending to be a language model.
   */
  function explainOffline(doc, strategyId, prof) {
    const strat = D.STRATEGIES.find(s => s.id === strategyId) || D.STRATEGIES[0];
    const steps = doc.blocks.filter(b => b.kind === 'step' || b.kind === 'question');
    const facts = steps.filter(b => b.kind === 'step').map(b => b.text);
    const questions = steps.filter(b => b.kind === 'question').map(b => b.text);
    const easy = Math.max(2, Math.min(prof.level, 4));

    const tiny = (t) => {
      const { parts } = simplify(t, easy);
      return parts.map(p => swapWords(p, easy, null)).join(' ');
    };

    const nums = (doc.source.match(/\b\d+(?:\.\d+)?(?:\/\d+)?\b/g) || []).slice(0, 4);
    const topic = doc.title.replace(/[:.].*$/, '');
    let body = [];

    switch (strat.id) {
      case 'steps':
        body.push({ t: 'p', v: `Here is ${topic} again, one move at a time. Do not go to the next line until this one is done.` });
        body.push({ t: 'ol', v: facts.slice(0, 10).map(tiny) });
        break;

      case 'eli5':
        body.push({ t: 'p', v: 'Same idea, smallest words:' });
        facts.slice(0, 8).forEach(f => body.push({ t: 'p', v: tiny(f) }));
        break;

      case 'example':
        body.push({ t: 'p', v: nums.length
          ? `This page uses these numbers: ${nums.join(', ')}. Walk one all the way through.`
          : 'Try it once with your own example before you do the real one.' });
        body.push({ t: 'ol', v: [
          'Read the first line out loud.',
          'Say in your own words what it is asking you to do.',
          'Do only that one thing. Nothing else yet.',
          'Check it against the line you just read.',
          'Move to the next line and repeat.'
        ]});
        break;

      case 'picture':
        body.push({ t: 'p', v: `Close your eyes and picture ${topic}.` });
        facts.slice(0, 5).forEach(f => body.push({ t: 'p', v: 'Picture this: ' + lower(tiny(f)) }));
        break;

      case 'why':
        body.push({ t: 'p', v: `${topic} matters because it shows up again, in the next unit, on the test, and often outside school too.` });
        body.push({ t: 'p', v: 'The part to hold onto:' });
        body.push({ t: 'ol', v: facts.slice(0, 3).map(tiny) });
        break;

      case 'analogy':
      default:
        body.push({ t: 'p', v: `Think of ${topic} like following a recipe. Each line is one instruction. You do them in order, and you do not skip one because it looks small.` });
        body.push({ t: 'p', v: 'Mapped onto this page:' });
        body.push({ t: 'ol', v: facts.slice(0, 5).map((f, i) => `Step ${i + 1} of the recipe: ${lower(tiny(f))}`) });
        break;
    }

    if (questions.length) {
      body.push({ t: 'p', v: 'Then answer these:' });
      body.push({ t: 'ol', v: questions.slice(0, 5).map(tiny) });
    }

    return { strategy: strat.id, name: strat.name, icon: strat.icon, source: 'builtin', body };
  }

  /**
   * Built-in comprehension check. No network needed.
   * Uses the page's own steps to build order questions, so every choice is
   * real and there are never broken or accidentally-correct distractors.
   */
  function quizOffline(doc) {
    const steps = (doc.blocks || [])
      .filter(b => b.kind === 'step' || b.kind === 'question')
      .map(b => b.text);

    if (steps.length < 3) return { questions: [], source: 'offline', empty: true };

    const shorten = (t) => t.length > 78 ? t.slice(0, 74).replace(/\s+\S*$/, '') + '…' : t;
    const sample = (pool, n) => {
      const a = pool.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a.slice(0, n);
    };
    const build = (correct, distractors, q, note) => {
      const items = [{ t: correct, ok: true }, ...distractors.map(d => ({ t: d, ok: false }))];
      for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
      return { q, choices: items.map(x => shorten(x.t)), answer: items.findIndex(x => x.ok), note };
    };

    const questions = [];
    questions.push(build(
      steps[0], sample(steps.slice(1), 2),
      'Which of these came first on the page?', 'That one was right at the start.'
    ));
    if (steps.length >= 4) {
      questions.push(build(
        steps[1], sample(steps.slice(2), 2),
        'Which of these came next?', 'The page moved through these in order.'
      ));
    }
    return { questions, source: 'offline' };
  }

  return {
    clean, syllables, gradeLevel, splitSentences,
    simplify, swapWords, classify, process, explainOffline, quizOffline
  };
})();
