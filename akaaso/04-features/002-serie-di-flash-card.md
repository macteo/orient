# 002 — Serie di flash card

**Feature ID:** F-002
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** allenamento ([3.001](../03-modules/001-module-map.md))
**Delivers:** [1.004](../01-vision/004-scope-boundaries.md) flash-card mode, "cards graded wrong come back at the end of the run"; [1.003](../01-vision/003-success-criteria.md) criterion 2; [2.003](../02-architecture/003-data-and-content.md) run persistence
**Route:** R-002
**Enforced by:** pure-logic unit tests on the run reducer (shuffle, grading, replay queue, completion); the spine E2E journey; the storage done-criterion of [2.008](../02-architecture/008-authentication-and-authorization.md)

## Behaviour

The page resolves deck and query, draws N cards at random from the chosen
sections and starts a run. Each card shows its front (see
[F-004](004-facce-delle-carte.md)); a tap anywhere on the card flips it
to the back; two buttons then grade it, *Non lo sapevo* and *Lo sapevo*.
A header shows *i / N*, a progress bar and the run title (*Descrizioni dei
punti · Rocce e sassi*, or *N sezioni* when more than two). Cards graded
*non lo sapevo* are queued and shown again after the last card, once; a
second miss does not re-queue. When the queue is empty the run is complete:
a `Risultato` is appended to storage, the in-progress key is cleared, and
the page navigates to R-004 for the deck.

After every grade the run is mirrored to `orient.serie.v1`. Loading R-002
with a run in storage for the same deck resumes it at the same card,
un-flipped, and shows a one-line notice *Serie ripresa*; a run for another
deck is discarded. A run started from the results page (`?ripasso=1`)
takes its cards from the stored miss list instead of the query.

A *← Mazzi* link returns to R-001 and abandons the run (storage cleared).

## Components

- Pages: `[mazzo]/flashcard/index.html` × 4, generated at build from one
  template with the deck's cards embedded ([F-006](006-mazzi-a-build.md)).
- Modules: `src/allenamento/serie.ts` (reducer: start, flip, grade, next,
  complete), `src/allenamento/storage.ts` (the two keys, versioned,
  try/catch on every access), `src/allenamento/flashcard.ts` (DOM).
- Components: card face and back from [F-004](004-facce-delle-carte.md);
  Progress; two Buttons; back link.
- Storage: writes `orient.serie.v1`, appends `orient.risultati.v1`.

## Interfaces

```text
Serie { v: 1, mazzo, sezioni: string[], modo: "flashcard", carte: string[],
        i: number, risposte: [{ carta, esito: "sapevo"|"non-sapevo" }],
        coda: string[], iniziata: ISO-minute }
Risultato { v: 1, mazzo, sezioni, modo, direzione?: "inversa",
            data: ISO-minute, viste: number, giuste: number,
            sbagliate: string[] }          // card ids, in order missed
```

## States

`default` (front), `retro` (back with grade buttons), `ripresa` (resumed
notice, then default), `empty` (the query's sections yield no card: a
message and a link to R-001), `invalid-input` (unknown section id or size:
the run starts with all sections / size 8 and a one-line notice).

## Acceptance criteria

- AC-1 A run of 8 from a section with 20 cards shows 8 distinct cards; a
  run of *tutte* shows every card of the chosen sections exactly once
  before any replay.
- AC-2 Tapping the front shows the back with name, definition and the
  reference; the grade buttons appear only on the back.
- AC-3 A card graded *non lo sapevo* reappears after the last card; graded
  wrong again it does not reappear; the counter counts replays.
- AC-4 Completing a run writes one `Risultato` with `giuste` equal to the
  first-pass *lo sapevo* count and `sbagliate` listing the first-pass
  misses, clears `orient.serie.v1`, and lands on R-004.
- AC-5 Reloading mid-run resumes at the same index with the same card
  order; the notice shows once.
- AC-6 With storage unavailable (throwing accessor) the run works
  end-to-end and nothing is thrown to the console; completion lands on
  R-004 showing its empty state.
- AC-7 `?sezioni=` with an unknown id shows the notice and runs on all
  sections; a deck with zero matching cards shows the `empty` state.
