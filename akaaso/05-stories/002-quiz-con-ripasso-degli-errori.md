---
id: S-002
title: Quiz sulla colonna G e ripasso degli errori con le carte
persona: apprendista
priority: spine
status: traced
features: [F-001, F-003, F-004, F-010, F-002, F-006]
modules: [sito, allenamento, mazzi]
apis: []
pages:
  - R-001
  - R-003
  - R-004
  - R-002
data_sources: [content/simboli/descrizioni-punti.json, localStorage.orient.serie.v1, localStorage.orient.risultati.v1]
fixtures: []
---

## Narrative

As an apprendista, I want to test myself on one section with a quiz and
then go over exactly what I got wrong, so that the misses become the next
thing I study.

Marco keeps confusing *lato* and *parte*. He picks only *Colonna G –
Posizione della lanterna*, quiz, 12 cards, symbol to name. He answers,
sees each verdict with the definition, ends with *9 / 12*, taps *Ripassa
con le carte* and flips through the three he missed.

## Preconditions

- Built site; storage may hold earlier results (they are untouched).
- Section `colonna-g` has at least 16 cards, so distractors come from the
  section.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Opens the site | R-001 (/) | D-001 | entry point | — | sito | defaults |
| 2 | Unchecks every section but *Colonna G*, taps *Quiz*, keeps *Simbolo → nome*, taps chip *12* | R-001 | D-001 | change the picker | — | sito | selection → button reads *Inizia · 12 carte* |
| 3 | Taps *Inizia · 12 carte* | R-003 (/descrizioni-simboli/quiz/?sezioni=colonna-g&carte=12) | D-003 | tap "Inizia" in modalità Quiz | — | allenamento | query → run of 12 from `colonna-g`; first question with four names |
| 4 | Picks an option | R-003 | D-003 | pick an option | — | allenamento | pick → `verdetto`: right option teal ✓, wrong pick red ✕, panel *Giusto* or *Sbagliato — Lato*, definition; *Avanti* |
| 5 | Taps *Avanti* eleven times, answering each; the last button reads *Vedi il risultato* | R-003 | D-003 | tap "Avanti" | — | allenamento | answers appended; storage mirrored after each |
| 6 | Lands on the result | R-004 (/descrizioni-simboli/risultati/) | D-004 | completion of the run | — | allenamento | `Risultato` (`modo: quiz, viste: 12, giuste: 9, sbagliate: [ds:11.1E, ds:11.2NE, ds:11.6S]`) → score *9 / 12*, *risposte corrette*, three miss rows |
| 7 | Taps a miss row | R-004 | D-004 | tap a miss row | — | allenamento | `ripasso` state: the card's back at *carta* size, *Chiudi* |
| 8 | Taps *Chiudi* | R-004 | D-004 | tap "Chiudi" | — | allenamento | back to `default` |
| 9 | Taps *Ripassa con le carte* | R-002 (/descrizioni-simboli/flashcard/?ripasso=1) | D-002 | tap "Ripassa con le carte" | — | allenamento | `orient.serie.v1` written with the three miss ids → flash-card run of 3, title *Ripasso · 3 simboli* |
| 10 | Flips and grades the three | R-002 | D-002 | tap the card | — | allenamento | three flips and grades; completion → `Risultato` with `ripasso: true` |
| 11 | Lands on the result | R-004 | D-004 | completion of the run | — | allenamento | new last run shown; history lists both runs newest first |

## Expected Outcomes

- Every question showed four distinct names from `colonna-g`, one of them
  the card; the verdict appeared on the first tap and nothing advanced by
  itself.
- Two `Risultato` entries for the deck, the second flagged `ripasso`.
- The home's deck row shows the ripasso run's score as the latest.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `verdetto` | Any option picked | Options locked, marks shown, panel with definition, *Avanti* |
| `nessun-errore` | All 12 right | R-004 shows the teal notice *Nessun errore in questa serie*; *Ripassa con le carte* absent |
| Reverse direction | Step 2 picks *Nome → simbolo* | Prompt shows the name; four pictogram tiles; same verdict rules; `direzione=inversa` in the query and in the `Risultato` |
| `ripresa` | Reload after step 4 | Question 2 shown un-answered; direction preserved |
| `invalid-input` | `?direzione=sideways` | Notice; forward direction used |
| Small section | A section with fewer than four cards | Distractors drawn from the deck; never from another deck |

## E2E Mapping

- **Test name:** journey-quiz-con-ripasso
- **Tier:** @critical
- **Seeding:** built site; test-only RNG seed; three answers forced wrong by picking a non-answer option
