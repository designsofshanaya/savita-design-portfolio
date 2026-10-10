# Savita Wahade — design portfolio

Static GitHub Pages portfolio for multidisciplinary design internships. Open `index.html` through any local web server. No production build step is required.

## Pages

- `index.html`: introduction, filters, selected work, about and contact.
- `keymitra.html`: research, individual UI/UX contribution, concept, qualitative testing and intended impact.
- `stories-between-the-letters.html`: complete poster compositions and visual rationale.
- `dear-zindagi.html`: student-shot introduction, teacher’s brief, film inspiration and visual description.
- `tomorrow-in-motion.html`: portrait motion study, source context and readable visual summary.
- `resume.html`: readable HTML résumé plus original PDF download.

Shared presentation is in `style.css`; optional menu, filtering, character motion and explicitly started lo-fi music are in `script.js`. Project content is rendered in HTML for no-JavaScript access. `content.json` is a project index; it does not override page text or visitor-local storage.

## Local preview

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765`.

## Verification

```sh
npm ci
npx playwright install chromium
npm test
```

To use an already installed browser, set `TEST_BROWSER_PATH` to its executable path. The test starts its own local server, checks every page at 1440, 768, 390 and 320px, and verifies filters, navigation, keyboard menu dismissal, silent default clicks, explicit audio/motion controls, reduced motion, readable résumé text, PDF download, broken assets and automated accessibility rules. Automated checks do not establish full WCAG conformance.

## Content evidence

KeyMitra’s research findings, two How Might We questions, UI/UX role and qualitative usability testing were supplied by Savita. Numerical outcomes, testing participant counts and specific before/after revisions were not supplied; intended benefits are labelled as goals. The prototype’s public welcome/sign-in screens were captured on 10 October 2026. Its authenticated record and inventory screens require an approved walkthrough or exports to illustrate.

Savita confirmed Dear Zindagi was filmed for an assignment to shoot an introduction for a favourite movie. The film’s influence is credited as inspiration. Tomorrow’s export displays `apswrites` and `imaginary_doodle_`; original-generation/editing attribution remains to be confirmed. Both motion pages include visual text alternatives; verified dialogue/soundtrack transcripts are still needed for complete audio captions. The description track is labelled as visual descriptions, not as verified audio captions.

## Publishing

GitHub Pages serves the repository root on `main`. Review the change branch before merging; merging to `main` publishes the portfolio. All original media and résumé files are retained.
