# 010 — Risultati

**Feature ID:** F-010
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** allenamento ([3.001](../03-modules/001-module-map.md))
**Delivers:** [1.004](../01-vision/004-scope-boundaries.md) "results kept in the learner's browser" (amended 2026-09-05); [2.003](../02-architecture/003-data-and-content.md) storage keys; [3.002](../03-modules/002-data-model.md) Risultato
**Route:** R-004
**Enforced by:** unit tests on the storage module (versioning, cap, clear, throwing accessor); the E2E journey from completion to review; the storage done-criterion

## Behaviour

The results page of a deck opens on the last completed run for that deck:
title *Serie completata* or *Quiz completato*, the run title, the score as
*giuste / viste* with a progress bar, and the caption *carte che sapevi* or
*risposte corrette*. Below, the misses of that run as list rows (card
front at *lista* size, name, reference); with none, a teal notice *Nessun
errore in questa serie*. Two actions: *Ripassa con le carte* starts a
flash-card run on R-002 for the deck with `?ripasso=1`, having written a
`Serie` whose cards are the misses; *Ripeti* starts the same configuration
again on the run route. A *Storico* section lists earlier runs of the deck,
newest first: date, mode and direction, sections, score. The page keeps
the last 50 runs per deck and drops older ones. A last row, *Cancella i
risultati*, asks for confirmation inline (no dialog) and clears both
storage keys for every deck.

Tapping a miss opens it inline as a *review* state: the card's back at
*carta* size, with *Chiudi*; the review is a state of this screen, not a
route.

With no run stored for the deck the page shows the empty state — *Nessuna
serie completata per questo mazzo* — and a button to R-001.

## Components

- Pages: `[mazzo]/risultati/index.html` × 4, generated at build with the
  deck's cards embedded (for names and faces).
- Modules: `src/allenamento/storage.ts` (shared), `src/allenamento/risultati.ts`.
- Components: score card with Progress; list rows from
  [F-004](004-facce-delle-carte.md) at *lista* size; Buttons; the review
  panel.

## Interfaces

```text
orient.risultati.v1  { v: 1, risultati: Risultato[] }      // all decks, newest last, ≤ 50 per deck
orient.serie.v1      Serie                                   // written by "Ripassa con le carte" before navigating
```

## States

`default` (last run with misses), `nessun-errore` (last run, no misses),
`ripasso` (a miss opened), `conferma-cancellazione`, `empty` (no run for
the deck), `error` (storage unreadable: the page shows the empty state
with a one-line note that results could not be read).

## Acceptance criteria

- AC-1 After completing a run, R-004 shows that run's score and misses in
  the order they were missed; the home's deck row shows the same score.
- AC-2 *Ripassa con le carte* lands on R-002 with a run whose cards are
  exactly the misses, in order, and whose completion writes a new
  `Risultato` flagged `ripasso: true`.
- AC-3 *Ripeti* starts a run with the same deck, sections, mode, direction
  and size.
- AC-4 The history lists runs newest first with date to the minute; the
  51st run of a deck evicts the oldest.
- AC-5 *Cancella i risultati* requires a second tap; afterwards both keys
  are absent and R-004 shows the empty state for every deck.
- AC-6 A malformed or older-version value in either key is discarded
  without error and treated as empty.
