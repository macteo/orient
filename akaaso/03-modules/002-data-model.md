# 002 — Data Model

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-module-map.md), [2.003](../02-architecture/003-data-and-content.md)
**Sources:** [S1], [S3], [S4], [S5]
**Enforced by:** a JSON schema per content file, validated by `check:content`; the deck builder refuses a file that does not validate

## The Spec

Conceptual entities. Owner in parentheses; every entity is a JSON file or an
array inside one, plus image files where noted.

- **Fonte** (contenuti) — a source document: `id`, `titolo`, `edizione`,
  `licenza`, `attribuzione`. Four in v1: S1, S3, S4, S5.
- **Sezione** (contenuti) — a grouping a learner can filter by: `id`,
  `etichetta`, `fonte`, `ordine`. For the control descriptions, one per
  column and, inside column D, one per feature family (morfologici, rocce,
  idrografia, vegetazione, costruzioni, particolari); for ISOM, one per
  §3.1 – 3.5 and 3.7.
- **Simbolo** (contenuti) — one pictogram or map symbol:
  `rif` (the source reference: `1.2`, `11.4`, `109`), `fonte`, `sezione`,
  `nome` (verbatim), `descrizione` (verbatim), `colonna` (C – H, control
  descriptions only), `direzioni` (for the eight-direction pictograms: which
  variants exist), `artwork` (path, format, origin, checksum), `pagina`
  (source page). Optional `isom` cross-references as printed in [S3].
- **RigaDescrizione** (mazzi) — one full description row: `codice` (the B
  column number), `celle` — an object with keys `C`, `D`, `E`, `F`, `G`, `H`
  each holding a symbol `rif` with optional `direzione`, or for `F` a
  dimension text such as `1.0` or `5x5`, or empty — and `testo` (the
  Italian sentence), `origine`: `ufficiale` (the nine rows of [S3] page 3,
  text verbatim) or `generata` (composed by rule, see
  [004](004-pipeline-descrizioni-righe.md)).
- **Esempio** (contenuti) — one worked example from [S3] §Esempi:
  `codice`, `carta` (image: the map clip with the control circle),
  `terreno` (image: the terrain sketch), `riga` (image: the description row
  as printed), `testo` (verbatim), `pagina`.
- **Mazzo** (mazzi) — a deck: `id`, `nome`, `fonte`, `sezioni`, `tipoCarta`
  (`simbolo` | `riga` | `esempio`), and the ordered list of card ids.
- **Carta** (mazzi) — derived at build from the entities above; not stored.
  A card has a front, a back, a section, and for quizzes a distractor pool
  (same section first, then the same column or deck).
- **Serie** (allenamento) — the state of one run: deck, sections, mode,
  direction, card ids in order, index, answers so far. Held in memory and
  mirrored to `localStorage` under `orient.serie.v1` after every answer, so
  a reload resumes (amended 2026-09-05).
- **Risultato** (allenamento) — one completed run, appended to
  `orient.risultati.v1`: deck, sections, mode, direction, ISO date, cards
  seen, score, missed card ids. Read by the home (last score per deck) and
  by the results page (history and misses to review). No name, no device
  id, no timestamp finer than the minute.

**Files** (all under `content/`, all committed):

```
content/
  fonti.json
  sezioni.json
  simboli/descrizioni-punti.json      Simbolo[] from S3 + S4
  simboli/isom.json                   Simbolo[] from S1 + S5
  righe/ufficiali.json                RigaDescrizione[] (9)
  righe/generate.json                 RigaDescrizione[] (built, seeded)
  esempi/esempi.json                  Esempio[] (~100)
  artwork/descrizioni-punti/<rif>[.<dir>].svg
  artwork/isom/<rif>.png
  artwork/esempi/<codice>-{carta,terreno,riga}.png
```

**Access patterns:** content is read once at build; the pages embed the
deck they need. In the browser the only reads are array filters over the
embedded deck and the two storage keys; the only writes are those two keys.

## The Reasoning

The model is shaped by the four kinds of card the founder asked for, and by
one distinction that matters more than it looks: **what is verbatim and
what is composed**. A `Simbolo` and an `Esempio` are verbatim — text and
artwork lifted from a source, checksum and page recorded. A generated
`RigaDescrizione` is composed from verbatim parts by a rule, and carries
`origine: generata` so the interface can say so and the completeness check
can ignore it. Mixing the two silently would be the first thing a learner
catches when a generated sentence reads oddly.

Directions are modelled on the symbol, not as separate symbols: the source
has one entry "11.1 Lato" and eight drawings. A card for 11.1 shows one
direction; a row cell names which.

### Options Considered

1. **Entities per source, cards derived at build.** **Chosen.**
2. **One flat `cards.json` with everything pre-rendered.** Easiest to
   consume, impossible to check against the sources, and the generated rows
   would be indistinguishable from the official ones.
3. **A database.** Level 2 said no ([2.003](../02-architecture/003-data-and-content.md)).

### The Challenge

*A hundred JSON entries typed by hand will have errors.* Nothing is typed by
hand except the nine official rows (which symbol sits in which cell, read
off page 3) and the small compatibility tables for generation. Symbols,
descriptions, examples and artwork are extracted by script and checked
against the source inventory by script.

## Change Log

- 2026-09-05 (later) — Serie now persisted to localStorage; Risultato entity added, per the 1.004 amendment.
- 2026-09-05 — confirmed by the founder with the Level 3 answers.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
[S4]: <../../sources/svg-control-descriptions/PROVENANCE.md>
[S5]: <../../sources/iof-isom-2017-2-revision-6-links/PROVENANCE.md>
