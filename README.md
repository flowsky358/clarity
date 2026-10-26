# Clarity

**Read anything, your way.**

Clarity is an app I built to make reading and following instructions a little easier. You can take a picture of a worksheet or textbook page, and it turns the text into short, numbered steps based on the reader's needs. It can also read the text aloud, highlight each word as it's spoken, and explain something in a different way if the first explanation doesn't make sense.

## Why I built it

Sometimes, the hardest part of an assignment isn't understanding the subject. It's figuring out what the instructions are actually asking you to do.

A paragraph might contain several instructions at once, or use vocabulary that makes a simple idea harder to understand. For students with dyslexia, ADHD, or language barriers, this can make schoolwork more difficult than it needs to be.

I wanted to build something that could help with that without making students feel like they have to use a completely different tool from everyone else. Clarity lets readers adjust the way information is presented to suit their needs, all within the same app.

## What it does

### 1. Scan and simplify text

Take a picture of a worksheet or textbook page, and Clarity extracts the text and reformats it into smaller, numbered steps. It can split up long sentences, replace certain academic words with simpler alternatives, and adjust the font, spacing, letter spacing, and color overlay based on the selected profile.

### 2. Read aloud and follow along

Clarity can read the text aloud while highlighting each word as it's spoken. It uses the browser's speech boundary events when available and falls back to estimated timing when they aren't, so word highlighting can still work across different browsers.

### 3. Explain it another way

Sometimes, hearing the same explanation again doesn't help much. Clarity offers six different ways to explain something: an analogy, smaller steps, a worked example, simpler wording, a mental picture, or an explanation of why it matters.

You can request another explanation if the first one still doesn't click.

### 4. Switch between reading profiles

Readers can save profiles with their own settings. Switching profiles updates the current page without requiring another scan, so the same material can be presented differently for different people.

## Built to work offline

Clarity runs in the browser and doesn't require an account or a backend server. OCR is handled locally using Tesseract.js, and the app stores its settings and saved data on the device.

The text processing, vocabulary replacements, glossary, explanations, and comprehension checks are designed to run locally. Scanned pages aren't uploaded to a remote server.

Clarity is also a progressive web app (PWA), so it can be installed on a phone and used offline after the necessary files have been cached.

## A note about a known issue

**Image loading is currently not working as expected.** Some image files may fail to load, so parts of the app that rely on those images might not display correctly. I'm aware of the issue, and it still needs to be investigated.

The rest of the app can be explored locally using the instructions below.

## Running Clarity locally

You don't need to install any packages or run a build process. Python 3 is enough to start a local server.

```bash
python3 -m http.server 4599
```

Then open [http://localhost:4599](http://localhost:4599) in your browser.

On a phone, you can also add Clarity to your home screen to use it like an app.

## How the text processing works

Most of the text processing happens in `js/engine.js`. I wanted the app to do more than just shorten paragraphs, so the engine works through several steps before displaying the result.

1. **Clean up the OCR text.** Fixes common issues from text recognition, including broken words across line breaks, soft-wrapped lines, ligatures, and curly quotation marks.

2. **Identify the structure.** Looks for headings, questions, instructions, and existing numbering so the original organization of a worksheet can be preserved where possible.

3. **Split long sentences.** Uses a scanner-based sentence splitter that avoids breaking at things like decimal numbers, titles, and initials. Additional passes split sentences at semicolons, clause-joining phrases, reason connectors, and certain uses of "and" that combine instructions.

4. **Simplify the wording.** Applies phrase replacements first, such as changing "in order to" to "to," and then handles individual vocabulary replacements while preserving supported word forms.

5. **Measure readability.** Calculates the Flesch-Kincaid reading grade level before and after the changes so the difference can be displayed on the page.

The vocabulary replacement system is intentionally cautious. It avoids changing capitalized words in the middle of sentences, making unsupported plural forms, creating adverbs from adjectives, or guessing irregular verb forms when the correct tense isn't clear.

I'd rather leave a difficult word unchanged than replace it with something incorrect. Making a sentence easier to read doesn't help if it changes what the sentence means.

One example is the word `solution`. I deliberately left it out of the vocabulary replacement dictionary because, in science, it can refer to a mixture rather than an answer to a problem.

## Project structure

```text
index.html       Main app shell and views
css/app.css      Styling, typography, profiles, and dark mode
js/data.js      Vocabulary, phrase rules, profiles, and sample text
js/engine.js    Text cleaning, restructuring, and simplification
js/ocr.js       Image-to-text processing with Tesseract.js
js/speech.js    Text-to-speech and word highlighting
js/store.js     Local data persistence
js/ui.js        Rendering, dialogs, and profile editing
js/app.js       App navigation and main flows
sw.js           Service worker for offline support
```

## Accessibility

Since Clarity is meant to make reading more accessible, I also wanted the interface itself to be usable in different ways.

It includes keyboard navigation, visible focus indicators, support for reduced-motion preferences, ARIA labels for icon buttons, and dark mode. Typography and spacing can also change with the selected reading profile.

Clarity is still a work in progress, and there's more to improve. The goal is to make everyday reading and schoolwork easier to approach, while giving readers more control over how information is presented.
