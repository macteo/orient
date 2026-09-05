# 008 — Generatore di righe

**Feature ID:** F-008
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** contenuti ([3.001](../03-modules/001-module-map.md))
**Delivers:** [3.004](../03-modules/004-pipeline-descrizioni-righe.md) generated rows, prefix-stable; [1.004](../01-vision/004-scope-boundaries.md) *Descrizioni complete*
**Route:** none (script)
**Enforced by:** `check:content` regenerates with the file's recorded count and seed and diffs; unit tests on the compatibility rules and on prefix stability

## Behaviour

`npm run generate:righe -- --count N --seed S` writes
`content/righe/generate.json` with N rows. Row *i* is a pure function of
`(S, i)`: the script seeds a PRNG per row (`hash(S, i)`) and applies the
rules of [3.004](../03-modules/004-pipeline-descrizioni-righe.md) — D
always; C with p = ¼; E with p = ⅓ from the compatibility table; F with
p = ½ where the feature has dimensions; G with p = ¾; H with p = ⅒;
*tra* and the two combination symbols only with a second D — and
composes the sentence from the template. Rows that would duplicate an
earlier row's cells are re-rolled with the next sub-seed. The file header
records `count`, `seed`, `versioneRegole` and the source revision; the
nine official rows are never generated (a generated row equal to one is
dropped).

Growing the deck: run again with a larger `--count`, review the appended
rows on the contact sheet the script writes, commit. The first N rows do
not change. Changing `versioneRegole` or the seed changes every row and
is a deliberate act with a change-log line in 3.004.

## Components

- `scripts/generate-righe.ts`, `content/compatibilita.json` (hand-kept;
  every entry cites its source line), `content/righe/generate.json`,
  `content/_contact/righe.html`.

## Interfaces

```text
generate.json { v: 1, count, seed, versioneRegole: 1, sorgente: "S3",
                righe: RigaDescrizione[] }        // origine: "generata", id "dc:gen:NNNN"
compatibilita.json { E: Record<D-rif, E-rif[]>, F: Record<D-rif, { tipo: "altezza"|"dimensioni", valori: string[] }>,
                     Gsolo: G-rif[] /* positions that need one feature */, Gdue: G-rif[] /* need two */ }
```

## Acceptance criteria

- AC-1 Two runs with the same count and seed produce byte-identical files;
  a run with a larger count keeps the first rows byte-identical and
  appends.
- AC-2 Every generated row validates: each cell cites an existing symbol in
  the right column, E is allowed for D by the table, F is present only
  where allowed, *tra* and combinations carry two features.
- AC-3 No two generated rows have identical cells; no generated row equals
  an official one.
- AC-4 The sentence follows the template exactly and uses verbatim names;
  the F value is phrased as *1 m d'altezza* or *5 x 5 m*.
- AC-5 The v1 file is generated with count 200, seed recorded, and
  `check:content` passes on it.
