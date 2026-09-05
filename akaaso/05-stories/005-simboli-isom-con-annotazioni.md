---
id: S-005
title: Quiz sui simboli ISOM di rocce e sassi
persona: apprendista
priority: secondary
status: traced
features: [F-001, F-003, F-004, F-006, F-007]
modules: [sito, allenamento, mazzi, contenuti]
apis: []
pages:
  - R-001
  - R-003
  - R-004
data_sources: [content/simboli/isom.json, content/artwork/isom, localStorage.orient.serie.v1, localStorage.orient.risultati.v1]
fixtures: []
---

## Narrative

As an apprendista, I want to recognise the map symbols of one colour
family and read the exact rule for each, so that I stop mistaking a
boulder for a knoll.

Giulia opens *ISOM 2017-2*, keeps *Rocce e sassi*, quiz, symbol to name.
The card shows the IOF drawing of 204 with its red *ø 0.4* label; she picks
*Masso*; the verdict shows the full description down to *Colore: nero*.

## Preconditions

- `simboli/isom.json` and the PNGs from [S5] rendered on white,
  annotations as printed; `check:content` green.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Opens the site, opens *ISOM 2017-2*, keeps *Rocce e sassi*, *Quiz*, chip *8* | R-001 (/) | D-001 | entry point | — | sito | sections *forme, rocce, acqua, vegetazione, opere, tracciato* with counts |
| 2 | Taps *Inizia* | R-003 (/isom/quiz/?sezioni=rocce&carte=8) | D-003 | tap "Inizia" in modalità Quiz | — | allenamento | run of 8; `simbolo-isom` face: PNG on white with annotations; four names from `rocce` |
| 3 | Picks *Masso* | R-003 | D-003 | pick an option | — | allenamento | `verdetto`: *Giusto*, panel with number `204`, geometry *P*, the full description |
| 4 | Finishes, sees the result | R-004 (/isom/risultati/) | D-004 | completion of the run | — | allenamento | `Risultato` for `isom` |

## Expected Outcomes

- Every drawing is the [S5] render, unmodified, scaled proportionally.
- The verdict panel's text equals the source description byte for byte.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `verdetto` | Pick | As above |
| Area symbol | A card whose drawing is a colour swatch (405 *Bosco*) | Front shows the swatch on white with its box; back explains |
| Course symbols | Section *tracciato* | 701 – 715 cards; the shared file for 701-703 shows which of the three |

## E2E Mapping

- **Test name:** journey-quiz-isom-rocce
- **Tier:** standard
- **Seeding:** built site; test-only RNG seed
