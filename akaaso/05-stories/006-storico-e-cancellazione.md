---
id: S-006
title: Storico delle serie e cancellazione dei risultati
persona: apprendista
priority: secondary
status: traced
features: [F-010, F-001, F-006]
modules: [allenamento, sito, mazzi]
apis: []
pages:
  - R-001
  - R-004
data_sources: [localStorage.orient.risultati.v1, localStorage.orient.serie.v1]
fixtures:
  - fixtures/S-006/risultati-50.json
---

## Narrative

As an apprendista, I want to see how my last sessions went and to wipe
everything when I hand the phone to my brother, so that the results are
mine and only mine.

Marco has used the site for two weeks. He opens *Risultati* for the
descriptions deck, sees fifty runs, the oldest gone, and taps *Cancella i
risultati*, then confirms.

## Preconditions

- `orient.risultati.v1` seeded from `fixtures/S-006/risultati-50.json`:
  fifty runs for `descrizioni-simboli`, dated over two weeks, plus three
  for `isom`.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Opens the site | R-001 (/) | D-001 | entry point | — | sito | deck rows show the latest score for both decks |
| 2 | Taps *Risultati* on the descriptions deck | R-004 (/descrizioni-simboli/risultati/) | D-004 | tap "Risultati" on a deck row | — | allenamento | latest run shown; *Storico* lists 50 rows newest first with date, mode, sections, score |
| 3 | Taps *Ripeti* | R-002 (/descrizioni-simboli/flashcard/) | D-002 | tap "Ripeti" | — | allenamento | a run with the last run's configuration |
| 4 | Completes the run | R-004 | D-004 | completion of the run | — | allenamento | 51st run appended; the oldest evicted; list still 50 |
| 5 | Taps *Cancella i risultati* | R-004 | D-004 | tap "Cancella i risultati" | — | allenamento | `conferma-cancellazione`: inline *Sicuro? …* with *Annulla* and *Cancella tutto* |
| 6 | Taps *Cancella tutto* | R-004 | D-004 | tap "Cancella tutto" | — | allenamento | both keys removed → `empty` state for the deck |
| 7 | Taps *Scegli un mazzo* | R-001 (/) | D-001 | tap "Scegli un mazzo" | — | sito | no score on any deck row; no *Risultati* links |

## Expected Outcomes

- History capped at fifty per deck; the `isom` results untouched by the
  cap and removed by the clear.
- After clearing, R-004 for every deck shows the empty state.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `empty` | R-004 for a deck with no run | *Nessuna serie completata per questo mazzo*, button to R-001 |
| `conferma-cancellazione` | First tap on clear | Inline confirmation; *Annulla* returns to `default` |
| `error` | Storage unreadable or malformed JSON in the key | `empty` state with the one-line note; malformed value discarded |
| Older schema | Key holds `{ v: 0, ... }` | Treated as empty; no crash |

## E2E Mapping

- **Test name:** journey-storico-e-cancellazione
- **Tier:** standard
- **Seeding:** built site; `localStorage` pre-loaded from the fixture before the first navigation
