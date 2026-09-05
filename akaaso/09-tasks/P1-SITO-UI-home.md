# P1-SITO-UI-home — Home: deck and section picker, mode, size, start, last score

## Objective

Implement the home page entry `src/pages/home.ts` (+ `src/sito/home.ts`
helpers) against the D-001 design: four deck cards with disclosure and section
checkboxes, the flash card / quiz segmented control, direction pills, size chips,
the start button with the live count, the last score per deck from storage with
a link to its results, and the *Fonti e licenze* link. Spec:
`akaaso/04-features/001-scelta-mazzo-e-sezioni.md`; screen `akaaso/06-design/index.md`.

---

## Specification

### Deliverables

- `src/pages/home.ts` — reads the inlined deck summaries, renders the picker,
  keeps picker state in memory (resets on load), builds the run URL:
  `<base><deck>/flashcard/` or `<deck>/quiz/` with `?sezioni=` (omitted when
  all), `?carte=`, `?direzione=inversa`.
- `src/sito/picker.ts` — pure helpers: `urlSerie(state)`, `etichettaInizia(state, summaries)`.
- Preline markup for cards, the segmented control (two buttons, `aria-pressed`),
  pills, chips; custom 22 px checkbox inside a 44 px row as the artboard.
- Last score line from `storage.ultimoRisultato(deck)`: `Ultima serie 6 / 8 · flash card`
  and a *Risultati* link to `<deck>/risultati/`.
- Tests: `picker.test.ts` (URL building, label with min(size, available),
  disabled state), a jsdom test that toggling sections changes the label.

### Behaviour (F-001)

Deck order fixed: descrizioni-simboli, descrizioni-complete, esempi, isom.
First deck open, all sections checked, *Flash card*, size 8. Button
*Inizia · N carte* / *Scegli almeno una sezione* (disabled). Direction pills
only in quiz mode. Chips 8 · 12 · 23 · tutte. Nothing persisted about the
picker.

---

Route:      R-001 (/)
Design:     akaaso/06-design/index.md   (D-001, approved v1)
Artboards:  akaaso/06-design/_artboards/index.dc.html
Components: Card     → design-system/components/data-display/Card.prompt.md
            Checkbox → design-system/components/forms/Checkbox.prompt.md
            Button   → design-system/components/buttons/Button.prompt.md
Tokens:     design-system/tokens/colors.css, spacing.css, typography.css, shadows.css
States:     default

## Done Criteria

1. F-001 AC-1 … AC-6 hold on `vite preview` (Playwright: default state, disable
   on no section, label count, quiz URL with `direzione=inversa`, last score
   from a seeded `orient.risultati.v1`, no off-origin request).
2. Tap targets: every section row and control ≥ 44 px tall (assert computed
   height in the test).
3. No hex colour / foreign font in `src/pages/home.ts` or its CSS.
4. Every state in `States:` is implemented; structure matches the artboard
   (header, scrolling deck list, fixed bottom bar).
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Read the three `.prompt.md` contracts first. Stories: S-001 … S-006, S-008
  (F-001) and S-001, S-002, S-006 (F-010 last score). Module: sito.
