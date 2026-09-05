# P1-ALLENAMENTO-UI-risultati — Results page: last run, misses with review, history, clear

## Objective

Implement `src/pages/risultati.ts` and `src/allenamento/risultati-dom.ts`: the
last run's score card, the misses list with inline review sheet, *Ripassa con le
carte* (writes a review `Serie` and navigates), *Ripeti*, *Torna ai mazzi*, the
history, the two-step clear, and the empty and error states. Spec:
`akaaso/04-features/010-risultati.md`; screen `akaaso/06-design/[mazzo].risultati.md`.

---

## Specification

### Deliverables

- `src/pages/risultati.ts` — reads `storage.leggiRisultati()` for the deck;
  latest run → score, misses (faces at `lista`), history newest first (cap 50
  is in storage); `Ripassa con le carte` → `storage.scriviSerie(serie.daRipasso(r))`
  then navigate `../flashcard/?ripasso=1`; `Ripeti` → the run route with the
  same query; `Cancella i risultati` → inline confirmation → `cancellaTutto()`
  → `empty`.
- `src/allenamento/risultati-dom.ts` — the layout of the artboard: header,
  score Card with Preline progress, misses Card (header band, rows, chevron) or
  teal Alert *Nessun errore in questa serie*, action buttons, history Card,
  clear link / red confirmation panel, review bottom sheet with the card back
  and *Chiudi*, `empty` and `error` layouts with their texts.
- Tests: jsdom tests for each state's DOM; Playwright in the journey tasks and
  S-006's spec (add `e2e/risultati.spec.ts` for the cap, clear and error).

---

Route:      R-004 (/[mazzo]/risultati/)
Design:     akaaso/06-design/[mazzo].risultati.md   (D-004, approved v1)
Artboards:  akaaso/06-design/_artboards/[mazzo].risultati.dc.html
            akaaso/06-design/_artboards/[mazzo].risultati.nessun-errore.dc.html
            akaaso/06-design/_artboards/[mazzo].risultati.ripasso.dc.html
            akaaso/06-design/_artboards/[mazzo].risultati.conferma-cancellazione.dc.html
            akaaso/06-design/_artboards/[mazzo].risultati.empty.dc.html
            akaaso/06-design/_artboards/[mazzo].risultati.error.dc.html
Components: Progress    → design-system/components/feedback/Progress.prompt.md
            Alert       → design-system/components/feedback/Alert.prompt.md
            Button      → design-system/components/buttons/Button.prompt.md
            Card        → design-system/components/data-display/Card.prompt.md
            ListGroup   → design-system/components/data-display/ListGroup.prompt.md
            FacciaCarta → design-system/components/orient/FacciaCarta.prompt.md
            Badge       → design-system/components/feedback/Badge.prompt.md
Tokens:     design-system/tokens/colors.css, spacing.css, typography.css, shadows.css
States:     default | nessun-errore | ripasso | conferma-cancellazione | empty | error

## Done Criteria

1. F-010 AC-1 … AC-6 hold on `vite preview` (Playwright: seeded storage from
   `akaaso/05-stories/fixtures/S-006/risultati-50.json`, cap at 50, two-step
   clear, malformed value → empty, throwing storage → error note).
2. Every state in `States:` is reachable and matches its artboard.
3. *Ripassa con le carte* lands on the flash-card route with a run of exactly
   the misses in order.
4. No hex colour / foreign font; no request off-origin.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on the deck build, the logic modules and the faces. Stories:
  S-001, S-002, S-006 (F-010) and S-001 … S-005 (F-004). Module: allenamento.
