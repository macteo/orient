# P1-ALLENAMENTO-UI-flashcard — Flash-card run page

## Objective

Implement `src/pages/flashcard.ts` and `src/allenamento/flashcard-dom.ts`: the
run header, the card face with flip, the grade buttons, misses replayed once,
persistence and resume, the empty and invalid-input states, and completion to
the results page. Spec: `akaaso/04-features/002-serie-di-flash-card.md`; screen
`akaaso/06-design/[mazzo].flashcard.md`.

---

## Specification

### Deliverables

- `src/pages/flashcard.ts` — parses query (`sezioni`, `carte`, `ripasso`,
  test seed), resolves cards from the inlined deck, resumes `orient.serie.v1`
  for the same deck (notice *Serie ripresa* once), builds the run with
  `serie.avvia`, renders through `flashcard-dom.ts`, mirrors storage after
  every grade, on completion `aggiungiRisultato` + `pulisciSerie` + navigate
  to `../risultati/`.
- `src/allenamento/flashcard-dom.ts` — header (← Mazzi, counter, Preline
  progress bar, run title), Alert notices (`ripresa`, `invalid-input`), the
  card region (front/back via `facce`), the bottom bar (hint / two grade
  buttons), the `empty` state.
- Tests: jsdom test for state → DOM mapping (front shows hint, back shows the
  two buttons), Playwright covered by the journey tasks.

### Behaviour (F-002)

`?ripasso=1` takes cards from the stored `Serie` written by the results page.
Unknown section or size → notice, all sections, size 8. No cards → `empty`.
Back link abandons the run (storage cleared). Reload mid-run resumes at the
same card, un-flipped.

---

Route:      R-002 (/[mazzo]/flashcard/)
Design:     akaaso/06-design/[mazzo].flashcard.md   (D-002, approved v1)
Artboards:  akaaso/06-design/_artboards/[mazzo].flashcard.dc.html
            akaaso/06-design/_artboards/[mazzo].flashcard.retro.dc.html
            akaaso/06-design/_artboards/[mazzo].flashcard.ripresa.dc.html
            akaaso/06-design/_artboards/[mazzo].flashcard.empty.dc.html
            akaaso/06-design/_artboards/[mazzo].flashcard.invalid-input.dc.html
Components: Progress        → design-system/components/feedback/Progress.prompt.md
            Alert           → design-system/components/feedback/Alert.prompt.md
            Button          → design-system/components/buttons/Button.prompt.md
            FacciaCarta     → design-system/components/orient/FacciaCarta.prompt.md
            RigaDescrizione → design-system/components/orient/RigaDescrizione.prompt.md
            Badge           → design-system/components/feedback/Badge.prompt.md
Tokens:     design-system/tokens/colors.css, spacing.css, typography.css, shadows.css
States:     default | retro | ripresa | empty | invalid-input

## Done Criteria

1. F-002 AC-1 … AC-7 hold on `vite preview` with the test seed (Playwright
   in the journey task S-001 covers AC-1 – AC-5; this task adds a Playwright
   spec for AC-6 storage-throwing and AC-7 invalid query).
2. Every state in `States:` is reachable and matches its artboard's structure.
3. Grade labels exactly *Non lo sapevo* and *Lo sapevo*; counter counts replays.
4. No hex colour / foreign font in the page's CSS; no request off-origin.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on the deck build, the logic modules and the faces. Stories:
  S-001 … S-004 (F-002, F-004). Module: allenamento.
