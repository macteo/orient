---
id: S-003
title: Descrizioni complete — leggere una riga e riconoscerla dalla frase
persona: apprendista
priority: spine
status: traced
features: [F-001, F-002, F-003, F-004, F-006, F-008]
modules: [sito, allenamento, mazzi, contenuti]
apis: []
pages:
  - R-001
  - R-002
  - R-003
  - R-004
data_sources: [content/righe/ufficiali.json, content/righe/generate.json, content/simboli/descrizioni-punti.json, localStorage.orient.serie.v1, localStorage.orient.risultati.v1]
fixtures: []
---

## Narrative

As an apprendista, I want to read a whole description row and say what it
means, and the other way round, so that at the start line the row reads
like a sentence.

Giulia opens the *Descrizioni complete* deck, keeps *Ufficiali* and
*Rocce e sassi*, starts flash cards: the front is the printed-style grid
*2 · 212 · ↖ ▲ · 1.0 · ○·*, the back reads *Sasso nord ovest, 1 m
d'altezza, lato est*. Later she switches to quiz, *Nome → simbolo*: the
sentence is shown and she picks the right row among four.

## Preconditions

- `righe/ufficiali.json` has the nine page-3 rows; `righe/generate.json`
  has two hundred generated rows, `check:content` green.
- Storage empty or not; irrelevant.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Opens the site, opens the deck *Descrizioni complete* | R-001 (/) | D-001 | entry point | — | sito | deck shows sections *Ufficiali* (9) and the D families with generated counts |
| 2 | Keeps *Ufficiali* and *Rocce e sassi*, flash card, chip *8* | R-001 | D-001 | change the picker | — | sito | button *Inizia · 8 carte* |
| 3 | Taps *Inizia* | R-002 (/descrizioni-complete/flashcard/?sezioni=ufficiali,d-rocce&carte=8) | D-002 | tap "Inizia" in modalità Flash card | — | allenamento, mazzi | run of 8: official rows first, then generated; front = `riga` face: eight bordered cells, A `2`, B `212`, C `0.2NW`, D `2.4`, F `1.0`, G `11.1E` |
| 4 | Taps to flip | R-002 | D-002 | tap the card | — | allenamento | back: row small, sentence *Sasso nord ovest, 1 m d'altezza, lato est*, no badge |
| 5 | Grades, continues to a generated row, flips | R-002 | D-002 | tap "Lo sapevo" or "Non lo sapevo" | — | allenamento | next card; its back shows the template sentence and the *generata* badge |
| 6 | Finishes the run | R-004 (/descrizioni-complete/risultati/) | D-004 | completion of the run | — | allenamento | `Risultato` for `descrizioni-complete` |
| 7 | Taps *Torna ai mazzi* | R-001 (/) | D-001 | tap "Torna ai mazzi" | — | sito | home with the deck's last score |
| 8 | Same deck, *Quiz*, *Nome → simbolo* | R-001 | D-001 | change the picker | — | sito | direction pills shown; reverse selected |
| 9 | Taps *Inizia* | R-003 (/descrizioni-complete/quiz/?sezioni=ufficiali,d-rocce&carte=8&direzione=inversa) | D-003 | tap "Inizia" in modalità Quiz | — | allenamento | prompt shows the sentence; four row tiles, distractors sharing the D feature or the G position |
| 10 | Picks a tile | R-003 | D-003 | pick an option | — | allenamento | `verdetto`; wrong tile red, right tile teal |
| 11 | Finishes, sees the result | R-004 | D-004 | completion of the run | — | allenamento | second `Risultato`, `direzione: inversa` |

## Expected Outcomes

- The official row's front matches the printed grid (the F-004 pixel test
  guards it); the generated row's back carries the badge.
- Two results for the deck, one per mode.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `retro` | Flip | Sentence and small row; badge only on generated rows |
| `verdetto` | Tile picked | Marks and panel; the panel shows the right sentence |
| Only generated sections | *Ufficiali* unchecked | Run has no official row; all backs carry the badge |
| `empty` | `?sezioni=d-particolari` on a build where no generated row landed there | Empty state, link to R-001 |
| Deck grown | Curator regenerated with count 400 (S-008) | Section counts on the home rise; card ids of the first 200 unchanged; earlier results still resolve |

## E2E Mapping

- **Test name:** journey-righe-complete
- **Tier:** @critical
- **Seeding:** built site with the v1 `generate.json` (count 200, recorded seed); test-only RNG seed for the run
