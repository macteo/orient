# P1-CONTENUTI-TOOL-generate-righe — Prefix-stable generator for full description rows

## Objective

Replace the `scripts/generate-righe.ts` stub with the seeded, prefix-stable
generator that writes `content/righe/generate.json` from the pictogram content
and the compatibility table, composes the Italian sentence by template, marks
every row `origine: "generata"`, writes a contact sheet, and generate the v1
file with `--count 200`. Extend `check:content` so it regenerates and diffs.
Spec: `akaaso/03-modules/004-pipeline-descrizioni-righe.md`,
`akaaso/04-features/008-generatore-di-righe.md`.

---

## Specification

### Deliverables

- `scripts/generate-righe.ts --count N --seed S` (defaults: 200, 20260905).
- `content/righe/generate.json` — `{ v: 1, count, seed, versioneRegole: 1, sorgente: "S3", righe: RigaDescrizione[] }`,
  ids `dc:gen:0001`…
- `content/_contact/righe.html` — every generated row rendered as text cells +
  sentence, newest appended at the end (for review after growth).
- `scripts/lib/righe-regole.ts` — the rules as pure functions (testable):
  `generaRiga(i, seed, simboli, compat)`.
- `scripts/generate-righe.test.ts` — prefix stability (count 50 ⊂ count 80,
  byte-identical rows), validity of every cell, no duplicates, no official
  duplicate, template output for two known rows.
- Wire the regeneration diff into `scripts/check-content.ts` (remove its skip).

### Rules (from 3.004)

- Row *i* uses `rng = mulberry32(hash(seed, i))`; draw D uniformly over
  column-D features; C with p ¼ (direction from the 8 when the qualifier has
  directions, else none); E with p ⅓ from `compatibilita.E[D]`; F with p ½
  where `compatibilita.F[D]` exists (a random value from its list); G with
  p ¾ (uniform over column-G positions, direction where the symbol has
  directions; `11.15 tra` only with a second D placed in E; the two
  combination symbols `10.1/10.2` only with a second D in E); H with p ⅒.
- Re-roll a row (next sub-seed) if its cells duplicate an earlier generated row
  or an official row.
- Sentence template: `<D nome>[ <C nome minuscolo>][, <E nome minuscolo>][, <F frase>][, <G nome minuscolo>][, <H nome minuscolo>]`;
  F phrase: `altezza` → `<v> m d'altezza`, `dimensioni` → `<a> x <b> m`,
  `profondita` → `<v> m di profondità`; `tra` → `tra <D> e <E>`.
  Names verbatim from `descrizioni-punti.json`.

---

## Done Criteria

1. `npm run generate:righe -- --count 200` writes 200 valid rows; running it
   again produces a byte-identical file; `--count 250` keeps the first 200
   rows byte-identical and appends 50.
2. `npm run check:content` passes on the committed file and fails after a
   hand edit of any row (`generate.json drift at row <i>`).
3. Two sample rows in the test render the expected sentence
   (`Sasso, 1 m d'altezza, lato est` shape).
4. No generated row equals an official one; no duplicate cells.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on `P1-CONTENUTI-DATA-righe-ufficiali`, `P1-CONTENUTI-DATA-compatibilita`,
  `P1-CONTENUTI-TOOL-check-content`.
- Stories served: S-003, S-008 (F-008). Module: contenuti.
