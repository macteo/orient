# P1-ALLENAMENTO-UI-quiz — Quiz run page, both directions

## Objective

Implement `src/pages/quiz.ts` and `src/allenamento/quiz-dom.ts`: question card,
four options (rows forward, face tiles reverse — rows full width for the
description-row deck), the verdict with marks and panel, *Avanti*, persistence
and resume, empty and invalid-input states, completion to results. Spec:
`akaaso/04-features/003-quiz.md`; screen `akaaso/06-design/[mazzo].quiz.md`.

---

## Specification

### Deliverables

- `src/pages/quiz.ts` — as the flash-card page, plus `direzione` from the
  query; builds options with `quiz.opzioni` once per card (memoised by run +
  index); verdict via `quiz.verdetto`; no auto-advance.
- `src/allenamento/quiz-dom.ts` — header, notices, question card (prompt
  *Quale oggetto?* / *Quale simbolo?* / *Cosa dice questa riga?*), options
  (56 px rows; 2×2 tiles, or 1-column full-width tiles for rows), the
  `Verdetto` treatment (teal ✓ / red ✕ / faded, Alert panel *Giusto* or
  *Sbagliato — <nome>* with the definition), bottom bar (*Avanti* / *Vedi il
  risultato* / hint).
- Tests: jsdom test that a pick locks options and shows marks + panel;
  Playwright in the journey tasks.

---

Route:      R-003 (/[mazzo]/quiz/)
Design:     akaaso/06-design/[mazzo].quiz.md   (D-003, approved v1)
Artboards:  akaaso/06-design/_artboards/[mazzo].quiz.dc.html
            akaaso/06-design/_artboards/[mazzo].quiz.inversa.dc.html
            akaaso/06-design/_artboards/[mazzo].quiz.verdetto.dc.html
            akaaso/06-design/_artboards/[mazzo].quiz.ripresa.dc.html
            akaaso/06-design/_artboards/[mazzo].quiz.empty.dc.html
            akaaso/06-design/_artboards/[mazzo].quiz.invalid-input.dc.html
Components: Progress        → design-system/components/feedback/Progress.prompt.md
            Alert           → design-system/components/feedback/Alert.prompt.md
            Button          → design-system/components/buttons/Button.prompt.md
            FacciaCarta     → design-system/components/orient/FacciaCarta.prompt.md
            RigaDescrizione → design-system/components/orient/RigaDescrizione.prompt.md
            Verdetto        → design-system/components/orient/Verdetto.prompt.md
Tokens:     design-system/tokens/colors.css, spacing.css, typography.css, shadows.css
States:     default | inversa | verdetto | ripresa | empty | invalid-input

## Done Criteria

1. F-003 AC-1 … AC-6 hold (Playwright with the test seed; the journey S-002
   and S-003 tasks cover most; this task adds AC-3 second-tap-does-nothing
   and AC-6 resume in reverse).
2. Every state in `States:` is reachable and matches its artboard.
3. Right/wrong always carry a mark and a text title (Verdetto contract).
4. No hex colour / foreign font; no request off-origin.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on the deck build, the logic modules and the faces. Stories:
  S-002, S-003, S-005 (F-003, F-004). Module: allenamento.
