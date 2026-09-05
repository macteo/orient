# 003 — Quiz

**Feature ID:** F-003
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** allenamento ([3.001](../03-modules/001-module-map.md))
**Delivers:** [1.004](../01-vision/004-scope-boundaries.md) quiz mode in both directions, immediate verdict, score at the end; [1.003](../01-vision/003-success-criteria.md) criterion 2
**Route:** R-003
**Enforced by:** unit tests on option building (distractor rules, no duplicates, answer position uniform), on the verdict and on scoring; the spine E2E journey

## Behaviour

Same run mechanics as [F-002](002-serie-di-flash-card.md) — N cards from
the chosen sections, header with counter and progress, persistence and
resume — with a question instead of a flip. In the forward direction the
card's front is shown with the prompt *Quale oggetto?* and four options,
each the name of a card; in the reverse direction the name is shown with
*Quale simbolo?* and four tiles, each a card front. Exactly one option is
the card; the three distractors come from the same section, then the same
column or deck when the section is too small, never the same name twice.

Choosing an option gives the verdict at once: the right option turns
teal with ✓, a wrong pick turns red with ✕, the others fade; a panel
below reads *Giusto* or *Sbagliato — <nome>* with the definition. A
primary button *Avanti* (or *Vedi il risultato* on the last card)
continues; nothing advances automatically. Misses are not replayed in
quiz mode; they are listed on the result. Completion writes the
`Risultato` and navigates to R-004.

## Components

- Pages: `[mazzo]/quiz/index.html` × 4, generated at build.
- Modules: `src/allenamento/quiz.ts` (options, verdict, scoring),
  `serie.ts` and `storage.ts` shared with F-002, `src/allenamento/quiz-dom.ts`.
- Components: card face from [F-004](004-facce-delle-carte.md); option row
  (forward) and option tile (reverse); verdict panel (Alert pattern);
  Progress; Button.

## Interfaces

```text
Domanda { carta, direzione: "diretta"|"inversa", opzioni: [cardId ×4], giusta: index }
Serie.modo = "quiz"; Serie.risposte[].esito = "giusta"|"sbagliata"; Serie.risposte[].scelta = cardId
```

## States

`default` (question, no pick), `verdetto` (picked, panel shown, next
button), `ripresa`, `empty`, `invalid-input` — as in F-002.

## Acceptance criteria

- AC-1 Every question has four options, all distinct by card and by name,
  the answer among them; over 1 000 generated questions the answer's
  position is uniform within 5 %.
- AC-2 Distractors are drawn from the same section when it has at least
  three other cards; otherwise from the deck; never from another deck.
- AC-3 Picking any option disables the others, marks right and wrong as
  specified, shows the panel with the definition, and shows *Avanti*; a
  second tap on an option does nothing.
- AC-4 In reverse direction the four tiles render the card fronts at tile
  size ([F-004](004-facce-delle-carte.md)) and the prompt shows the name.
- AC-5 Completing a run of N writes a `Risultato` with `viste = N`,
  `giuste` the count of right first picks and `sbagliate` the missed card
  ids in order, then lands on R-004.
- AC-6 A run started with `?direzione=inversa` resumes in reverse after a
  reload.
