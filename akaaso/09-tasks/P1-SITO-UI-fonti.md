# P1-SITO-UI-fonti — Attribution page generated from the licence register

## Objective

Implement `src/pages/fonti.ts` (+ the `fonti.html` template's content) so the
attribution page renders every source in `content/fonti.json` as a card with its
licence badge, authors, *Cosa usiamo* and attribution sentence, the note on
generated rows, the full Purple Pen BSD text, and the `mailto:` contact button,
with a back link to the home. Spec: `akaaso/04-features/005-pagina-fonti.md`;
screen `akaaso/06-design/fonti.md`.

---

## Specification

### Deliverables

- `src/pages/fonti.ts` — renders from the inlined `fonti.json` (build-mazzi
  inlines it into the fonti page; if not yet, import the JSON at build time).
- Licence texts inlined from `content/licenze/*` at build (import as `?raw`).
- `mailto:` link with subject `orient` (address: the curator's, from
  `content/fonti.json` `contatto` field — add it to the register if missing:
  `matteo@gavagnin.com`).
- Test: jsdom test that every register entry renders; Playwright smoke that the
  page has no off-origin resource load and external links are anchors only.

---

Route:      R-005 (/fonti/)
Design:     akaaso/06-design/fonti.md   (D-005, approved v1)
Artboards:  akaaso/06-design/_artboards/fonti.dc.html
Components: Card   → design-system/components/data-display/Card.prompt.md
            Badge  → design-system/components/feedback/Badge.prompt.md
            Button → design-system/components/buttons/Button.prompt.md
Tokens:     design-system/tokens/colors.css, spacing.css, typography.css, shadows.css
States:     default

## Done Criteria

1. F-005 AC-1 … AC-4 hold: six sections, BSD text verbatim, CC link resolves,
   no external resource load, `mailto:` with subject *orient*.
2. Adding a seventh entry to `fonti.json` renders a seventh card with no code
   change (test with a fixture register).
3. Matches the artboard's structure; no hex colour / foreign font.
4. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on the deck build (page emission) and the fonti data. Stories: S-007
  (F-005). Module: sito.
