# 001 — Scelta del mazzo e delle sezioni

**Feature ID:** F-001
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** sito ([3.001](../03-modules/001-module-map.md))
**Delivers:** [1.004](../01-vision/004-scope-boundaries.md) "deck filter by section", "two modes", "runs of N cards"; [1.003](../01-vision/003-success-criteria.md) criterion 1 (ten-second start); [2.006](../02-architecture/006-design-direction.md) Level 4 inputs
**Route:** R-001
**Enforced by:** acceptance criteria below, each a Vitest or a Playwright step; the ten-second criterion by the E2E journey of the spine story that starts here

## Behaviour

The home is the only place a run is configured. It lists the four decks;
opening one shows its sections with a card count each and a checkbox, all
selected by default. Below the list a segmented control chooses *Flash
card* or *Quiz*; in quiz mode two pills choose the direction, *Simbolo →
nome* (default) or *Nome → simbolo*. A row of chips chooses the cards per
run: 8 (default), 12, 23, *tutte*. The primary button reads *Inizia · N
carte* with N the smaller of the chosen size and the cards available, and
is disabled with the label *Scegli almeno una sezione* when nothing is
selected. Pressing it navigates to R-002 or R-003 for that deck with the
selection in the query.

Each deck row shows its last score from the results storage when there is
one (*ultima serie 6 / 8 · quiz*), and a link *Risultati* to R-004.
Nothing is remembered about the picker itself between visits: sections,
mode and size reset to their defaults on every load.

## Components

- Page: `index.html` at R-001, built by Vite from `src/sito/home.ts` and the
  deck summaries `mazzi` emits at build (deck id, name, card count,
  sections with counts).
- Components (Preline markup, [2.006](../02-architecture/006-design-direction.md)): deck card
  with disclosure, section row with checkbox, segmented control, pill
  group, chip group, primary Button.
- Storage read: `orient.risultati.v1`, latest entry per deck.
- Navigation: `<a>` built from the base path and the deck slug, query
  `sezioni=<ids>` (omitted when all), `carte=<8|12|23|tutte>`,
  `direzione=inversa` (quiz, reverse only).

## Interfaces

```text
DeckSummary { id, nome, fonte, carte: number,
              sezioni: [{ id, etichetta, carte: number }] }
RunQuery    { sezioni?: string[], carte: 8|12|23|"tutte", direzione?: "inversa" }
UltimoRisultato { mazzo, modo, punteggio, totale, data }     // from storage
```

## States

`default`; `empty` never (decks are compiled in); `invalid-input` never
(nothing is typed). The disabled start button is content, not a state.

## Acceptance criteria

- AC-1 Opening R-001 on a phone viewport shows all four decks with their
  card counts, one deck open, all its sections checked, *Flash card*
  selected, size 8, and the button enabled — no tap needed before *Inizia*.
- AC-2 Unchecking every section disables the button and changes its label;
  re-checking one restores it with the right count.
- AC-3 The button's N equals min(size, cards in the checked sections);
  *tutte* shows the exact total.
- AC-4 Pressing *Inizia* in quiz mode with *Nome → simbolo* lands on R-003
  for that deck with `direzione=inversa` and the checked section ids in the
  query; with every section checked the `sezioni` parameter is absent.
- AC-5 With a result stored for a deck, its row shows the last score and a
  working *Risultati* link to R-004; with none, neither appears.
- AC-6 The page performs no request other than its own assets and reads
  only the one storage key.
