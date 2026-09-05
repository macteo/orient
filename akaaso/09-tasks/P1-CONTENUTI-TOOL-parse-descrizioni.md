# P1-CONTENUTI-TOOL-parse-descrizioni — Parse the control-description tables and vendor the pictogram SVGs

## Objective

Write `scripts/parse/parse-descrizioni.ts`, which turns the converted Italian
IOF control-descriptions text (`akaaso/sources/iof_descrizioni_punti_ital.md`,
pages 7 – 16 and §13 – 14) into `content/simboli/descrizioni-punti.json`, copies
each symbol's SVG from `sources/svg-control-descriptions/symbols/` into
`content/artwork/descrizioni-punti/`, records checksums, lists exclusions, and
reports Italian-name mismatches against `lang.json`. Spec:
`akaaso/03-modules/003-pipeline-descrizioni-simboli.md`.

---

## Specification

### Deliverables

- `scripts/parse/parse-descrizioni.ts` (run with `node`; deterministic; writes
  to a temp dir then moves into `content/`).
- `content/simboli/descrizioni-punti.json` — `{ v: 1, generato: <date>, sorgente: "S3", simboli: Simbolo[] }`
  sorted by numeric `rif`.
- `content/artwork/descrizioni-punti/<rif>.svg` and `<rif><DIR>.svg` for the
  eight-direction pictograms, byte-identical copies of the S4 files.
- `content/esclusi/descrizioni.json` — `{ v: 1, esclusi: [{ rif, motivo, fonte: "S3" }] }`
  with column B, 9.1 – 9.4 (dimensions are numbers), and any ref with no artwork.
- `content/_contact/descrizioni-nomi.md` (git-ignored) — the name cross-check
  report: `rif | nome S3 | nome lang.json it | uguale?`.
- Uses `scripts/parse/_text.ts` from the scaffold (do not recreate it; extend
  only by adding exported functions if you must, never changing existing ones).

### Parsing rules (S3 text layer)

- Tables start at `Colonna C – …` (page 7) and run to the end of column H and
  §13 special instructions / §14 route to finish. A row begins with a
  reference `^\d{1,2}\.\d{1,2}\s` at line start; the glyph character from the
  symbol font that may follow (`C`, `D`, `@`, `Â` …) is discarded; the
  *Definizione* cell is the short name; *Descrizione* continues over wrapped
  lines until the next row or heading; an optional trailing ISOM cross-ref
  (`106`, `107\n108`) goes to `isom[]`.
- `colonna` from the nearest `Colonna X` heading; `famiglia` (column D only)
  from the nearest bold sub-heading: `Oggetti morfologici`, `Rocce e sassi`,
  `Idrografia`, `Vegetazione`, `Costruzioni`, `Oggetti particolari`
  (map their exact wording as printed; keep the printed label as `etichetta`).
- Section ids for `sezione`: `colonna-c`, `d-morfologici`, `d-rocce`,
  `d-idrografia`, `d-vegetazione`, `d-costruzioni`, `d-particolari`,
  `colonna-e`, `colonna-f`, `colonna-g`, `colonna-h`, `istruzioni` (13.x, 14.x).
- `direzioni`: for refs whose S4 files exist as `<rif><DIR>.svg` (0.1, 0.2,
  11.1 – 11.6, 11.8, 11.14), list the suffixes found; the card face is `N`
  where present, else `NE`.
- Fallback artwork: a ref with no S4 file (expected: 12.3) gets
  `artwork.origine: "S3"` and a placeholder path; log it in `esclusi.json`
  in `content/esclusi/descrizioni.json` under `motivo: "artwork mancante in S4 — ritaglio da S3 richiesto"` (the
  crop itself is done by the extract task's cropper later).
- `sha256` of each copied SVG recorded in `artwork.sha256`.

### Interface produced

```ts
Simbolo (see _context.md); pagina = source page number of the row.
```

---

## Done Criteria

1. `npm run parse:descrizioni` writes the JSON with one entry per reference in
   the source tables; the count is printed and equals a hand count the agent
   records in the script's header comment after checking pages 7 – 16 once
   (expected on the order of 120 including §13 – 14).
2. Every entry's `nome` and `descrizione` are byte-identical to the source text
   after wrapped-line joining (spot-check `1.2 Naso — Piccola sporgenza del
   terreno su un pendio.` and `0.1 Più a nord`).
3. Every entry except the fallback has an SVG file whose sha256 matches the
   S4 file; direction variants are listed and present.
4. Running the script twice produces no git diff in `content/`.
5. The cross-check report lists every ref; mismatches are reported, not fatal.
6. Every criterion names an observable effect, not a file that exists.

## Interfaces Consumed

- `akaaso/sources/iof_descrizioni_punti_ital.md` (S3 text), `sources/svg-control-descriptions/symbols/*.svg` and `symbols/lang.json` (S4).

## Notes for Agent

- Wrapped lines: a row's description continues until a line starting with a
  reference, a `Colonna` heading, a bold family heading, or a page marker.
- Stories served: S-004, S-005, S-008, S-009 (F-007). Module: contenuti.
