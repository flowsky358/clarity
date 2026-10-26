/*
   CLARITY, read aloud with word highlighting

   Uses the Web Speech API's word boundary events
   where they exist. Several browsers (notably older
   iOS Safari) never fire them, so if nothing arrives
   shortly after speech starts we switch to a timed
   estimate, the highlight keeps working either way.
*/
window.Clarity = window.Clarity || {};

Clarity.speech = (function () {
  const synth = window.speechSynthesis;
  const supported = !!synth && typeof SpeechSynthesisUtterance !== 'undefined';

  let queue = [];        // [{ words:[{el,text}], text, offsets:[] }]
  let qi = 0;            // current utterance
  let wi = -1;           // current word inside it
  let spokenBefore = 0;  // words completed in earlier utterances
  let totalWords = 0;
  let playing = false;
  let paused = false;
  let rate = 1;
  let utter = null;
  let raf = null;
  let boundarySeen = false;
  let fallbackTimer = null;
  let keepAlive = null;
  let cb = {};

  /* voice */
  let voice = null;
  function pickVoice() {
    if (!supported) return;
    const all = synth.getVoices();
    if (!all.length) return;
    const en = all.filter(v => /^en(-|_|$)/i.test(v.lang));
    voice =
      en.find(v => v.localService && /natural|enhanced|premium/i.test(v.name)) ||
      en.find(v => v.localService) ||
      en[0] || all[0];
  }
  if (supported) {
    pickVoice();
    synth.addEventListener('voiceschanged', pickVoice);
  }

  /* helpers */
  function highlight(index) {
    const item = queue[qi];
    if (!item) return;
    if (wi >= 0 && item.words[wi]) item.words[wi].el.classList.remove('spoken');
    wi = index;
    const w = item.words[wi];
    if (!w) return;
    w.el.classList.add('spoken');
    if (cb.onWord) cb.onWord(w.el);
    if (cb.onProgress && totalWords) cb.onProgress((spokenBefore + wi + 1) / totalWords);
  }

  function clearHighlight() {
    for (const item of queue) for (const w of item.words) w.el.classList.remove('spoken');
    wi = -1;
  }

  function wordAtChar(item, charIndex) {
    // last word whose start offset is <= charIndex
    let lo = 0, hi = item.offsets.length - 1, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (item.offsets[mid] <= charIndex) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  }

  /* timed fallback */
  function startFallback() {
    const item = queue[qi];
    if (!item || !item.words.length) return;

    // ~15 characters per second of speech at rate 1.0
    const chars = item.text.length;
    const totalMs = Math.max(400, (chars / 15) * 1000 / rate);
    const weights = item.words.map(w => w.text.length + 1);
    const sum = weights.reduce((a, b) => a + b, 0);

    let acc = 0;
    const marks = weights.map(w => (acc += w / sum * totalMs));
    const t0 = performance.now();

    cancelAnimationFrame(raf);
    const tick = () => {
      if (!playing || paused) { raf = requestAnimationFrame(tick); return; }
      const t = performance.now() - t0;
      let idx = marks.findIndex(m => t < m);
      if (idx === -1) idx = item.words.length - 1;
      if (idx !== wi) highlight(idx);
      if (t < totalMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  /* playback */
  function speakCurrent() {
    const item = queue[qi];
    if (!item) return finish();

    utter = new SpeechSynthesisUtterance(item.text);
    utter.rate = rate;
    utter.pitch = 1;
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }

    boundarySeen = false;
    wi = -1;

    utter.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      if (!boundarySeen) {
        boundarySeen = true;
        clearTimeout(fallbackTimer);
        cancelAnimationFrame(raf);
      }
      highlight(wordAtChar(item, e.charIndex));
    };

    utter.onend = () => {
      clearTimeout(fallbackTimer);
      cancelAnimationFrame(raf);
      if (!playing) return;
      if (wi >= 0 && item.words[wi]) item.words[wi].el.classList.remove('spoken');
      spokenBefore += item.words.length;
      qi++;
      if (qi < queue.length) speakCurrent(); else finish();
    };

    utter.onerror = (e) => {
      // "interrupted" is what we get from our own stop(), not worth surfacing
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('Clarity: speech error', e.error);
      finish();
    };

    synth.speak(utter);

    // if no boundary event lands quickly, drive the highlight ourselves
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => { if (!boundarySeen && playing) startFallback(); }, 700);
  }

  function finish() {
    playing = false; paused = false;
    clearTimeout(fallbackTimer);
    cancelAnimationFrame(raf);
    clearInterval(keepAlive); keepAlive = null;
    clearHighlight();
    if (cb.onProgress) cb.onProgress(0);
    if (cb.onEnd) cb.onEnd();
  }

  /* public */
  /**
   * @param {Array<{el:HTMLElement,text:string}[]>} groups  words per block
   * @param {object} handlers  { onWord, onProgress, onEnd }
   */
  function play(groups, handlers) {
    if (!supported) {
      if (handlers && handlers.onEnd) handlers.onEnd();
      return false;
    }
    stop();
    cb = handlers || {};

    queue = groups
      .filter(words => words && words.length)
      .map(words => {
        const offsets = [];
        let text = '';
        words.forEach((w, i) => {
          if (i) text += ' ';
          offsets.push(text.length);
          text += w.text;
        });
        return { words, text, offsets };
      });

    if (!queue.length) return false;

    totalWords = queue.reduce((n, q) => n + q.words.length, 0);
    qi = 0; wi = -1; spokenBefore = 0;
    playing = true; paused = false;

    // Chrome silently stalls long queues; a periodic resume keeps it moving.
    clearInterval(keepAlive);
    keepAlive = setInterval(() => {
      if (playing && !paused && synth.speaking) { synth.pause(); synth.resume(); }
    }, 9000);

    speakCurrent();
    return true;
  }

  function pause() {
    if (!playing || paused) return;
    paused = true;
    try { synth.pause(); } catch (_) {}
  }

  function resume() {
    if (!playing || !paused) return;
    paused = false;
    try { synth.resume(); } catch (_) {}
  }

  function stop() {
    if (!supported) return;
    const wasPlaying = playing;
    playing = false; paused = false;
    clearTimeout(fallbackTimer);
    cancelAnimationFrame(raf);
    clearInterval(keepAlive); keepAlive = null;
    try { synth.cancel(); } catch (_) {}
    clearHighlight();
    queue = []; qi = 0; wi = -1; spokenBefore = 0; totalWords = 0;
    if (wasPlaying && cb.onProgress) cb.onProgress(0);
  }

  function setRate(r) {
    rate = Math.max(0.5, Math.min(2, r));
    if (playing) {
      // restart the current block at the new rate, the API can't retune mid-utterance
      const resumeAt = qi;
      const groups = queue.map(q => q.words);
      const handlers = cb;
      stop();
      const rest = groups.slice(resumeAt);
      if (rest.length) play(rest, handlers);
    }
  }

  /** Speak a single word on tap, without disturbing a running read-aloud. */
  function sayWord(word) {
    if (!supported || playing) return false;   // don't fight the main read-aloud
    try { synth.cancel(); } catch (_) {}
    const u = new SpeechSynthesisUtterance(String(word).replace(/[^A-Za-z'-]/g, ''));
    if (!u.text) return false;
    u.rate = Math.max(0.6, rate - 0.15);        // a touch slower, this is "what is this word?"
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    synth.speak(u);
    return true;
  }

  return {
    supported, play, pause, resume, stop, setRate, sayWord,
    get playing() { return playing; },
    get paused() { return paused; },
    get rate() { return rate; }
  };
})();
