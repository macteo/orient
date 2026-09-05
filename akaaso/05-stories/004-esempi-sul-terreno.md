---
id: S-004
title: Dal terreno alla descrizione — flash card degli esempi
persona: apprendista
priority: secondary
status: traced
features: [F-001, F-002, F-004, F-006, F-007]
modules: [sito, allenamento, mazzi, contenuti]
apis: []
pages:
  - R-001
  - R-002
  - R-004
data_sources: [content/esempi/esempi.json, content/artwork/esempi, localStorage.orient.serie.v1, localStorage.orient.risultati.v1]
fixtures: []
---

## Narrative

As an apprendista, I want to see a piece of map and a sketch of the
terrain and guess the description, so that I connect what I see in the
forest with the row on the sheet.

Marco opens *Esempi sul terreno*, keeps *Vegetazione*, starts 12 cards.
The front shows the map clip with the pink circle and the sketch of a
clearing; he thinks *radura*, flips, sees the printed row *71 · ⬚* and
*Radura*.

## Preconditions

- `esempi/esempi.json` with ~100 entries and their three PNGs, contact
  sheet reviewed, `check:content` green.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Opens the site, opens *Esempi sul terreno*, keeps *Vegetazione*, chip *12* | R-001 (/) | D-001 | entry point | — | sito | sections are the D families from `esempi/sezioni.json`; button *Inizia · 12 carte* |
| 2 | Taps *Inizia* | R-002 (/esempi/flashcard/?sezioni=d-vegetazione&carte=12) | D-002 | tap "Inizia" in modalità Flash card | — | allenamento | run of 12 examples; front = `esempio` face: `carta` and `terreno` PNGs side by side on white, hairline borders |
| 3 | Flips | R-002 | D-002 | tap the card | — | allenamento | back: `riga` PNG and the sentence *Radura* |
| 4 | Grades through the run | R-004 (/esempi/risultati/) | D-004 | completion of the run | — | allenamento | misses listed with the map clip as the list face |

## Expected Outcomes

- Images keep their aspect ratio at every size; no layout shift as they
  load (width and height attributes).
- A `Risultato` for `esempi`.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `retro` | Flip | Row image and sentence |
| Hidden example | An entry with `nascondi: true` | Never appears; section count excludes it |
| Slow image | Artwork still loading on a slow connection | Reserved box, no shift; no spinner state is designed — the browser's own progressive load is enough |

## E2E Mapping

- **Test name:** journey-esempi-sul-terreno
- **Tier:** standard
- **Seeding:** built site
