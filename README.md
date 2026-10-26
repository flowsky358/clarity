# Clarity

**Read anything, your way.**

Clarity takes a photo of a worksheet or textbook page and rebuilds it as short,
numbered, literal steps at the reader's own reading level — then reads it aloud,
highlighting each word as it's spoken, and explains it a different way when the
first way doesn't land.

Built for the Congressional App Challenge.

---

## The problem

Plenty of students can do the thinking. What stops them is the page: a dense
paragraph that packs four instructions into one sentence, vocabulary chosen for
precision rather than clarity, and no one nearby with the patience to say it
again a different way.

That's three different students with the same blocker — a student who reads
literally and needs one instruction per line, a student with dyslexia who needs
different type and spacing, and a student still learning English who needs the
words swapped but not the meaning lost. Clarity serves all three from one scan,
because the difference between them is just a profile.

---

## The four features

**1 · Scan & reformat.** Camera → text → rebuilt page. Long sentences are split
at the joints, academic vocabulary is swapped for plain words, and dense
paragraphs become numbered steps you can follow one at a time. Font, spacing,
letter spacing and colour overlay all come from the active profile.

**2 · Read aloud with word-by-word highlighting.** Each word lights up as it's
spoken. Uses the browser's speech boundary events where they exist and falls
back to a timed estimate where they don't, so the highlight works either way.

**3 · Explain this differently.** Six angles — analogy, smallest steps, worked
example, simplest words, mental picture, why it matters. Press it again and get
another one. This is the button that does what a patient sibling does.

**4 · Saved profiles.** Set it up once. Switching profiles inside an open page
re-renders that same page for a different reader on the spot — which is the
whole demo in one tap.

---

## It works with no account and no server

Everything runs entirely in the browser. Reading level, sentence splitting,
vocabulary, glossary, the explanations and the comprehension checks are all
local, and photos are read on-device with Tesseract. The app works offline and
no page a student scans ever leaves their device.

---

## Running it

No build step, no dependencies to install.

```bash
python3 -m http.server 4599
```

Then open `http://localhost:4599`. It's a PWA, so on a phone you can use
**Add to Home Screen** and it runs full-screen and offline.

---

## How the engine works

`js/engine.js` is the part that does the actual work:

1. **Clean** — repairs the artifacts OCR leaves behind: hyphens split across
   line breaks, soft-wrapped lines, ligatures, curly quotes.
2. **Structure** — finds headings, keeps the worksheet's own numbering when it
   has some, detects questions and instructions.
3. **Split** — a scanner-based sentence splitter that doesn't break on `3.5`,
   `Dr.` or initials, then four passes that split long sentences at semicolons,
   at `, and` / `, but` joining two full clauses, at reason connectors, and at
   bare `and` joining two imperative verbs.
4. **Swap** — phrase-level rewrites first (`in order to` → `to`), then
   vocabulary with inflection carried across (`utilized` → `used`).
5. **Measure** — Flesch–Kincaid before and after, shown on every page.

The vocabulary swapper deliberately refuses to guess. It won't touch
capitalised words mid-sentence (so *the Industrial Revolution* stays intact),
won't pluralise a multi-word replacement, won't build an adverb from an
adjective, and won't inflect an irregular verb into the past — because past
tense and past participle differ there and it can't tell which one the sentence
needs. In each case it leaves the original word alone. A word left slightly hard
is recoverable; a confidently wrong word teaches something false.

`solution` is deliberately not in the dictionary at all: in a science passage it
means a liquid, not an answer.

---

## Files

```
index.html              app shell — all views
css/app.css             design system, profile-driven typography, dark mode
js/data.js              vocabulary, phrase rules, profile presets, samples
js/engine.js            the reformatting engine
js/ocr.js               photo → text (Tesseract, on-device)
js/speech.js            read-aloud + word highlighting with timing fallback
js/store.js             local persistence
js/ui.js                rendering, sheets, profile editor
js/app.js               routing and flows
sw.js                   offline service worker
```

---

## Accessibility

An accessibility app has to be accessible itself: full keyboard navigation,
visible focus rings, `prefers-reduced-motion` honoured throughout, real ARIA
labelling on every icon button, dark mode across the whole interface including
the colour overlays, and text that respects the reader's size settings rather
than fighting them.
