# 007 — Estrazione contenuti

**Feature ID:** F-007
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** contenuti ([3.001](../03-modules/001-module-map.md))
**Delivers:** [3.003](../03-modules/003-pipeline-descrizioni-simboli.md), [3.005](../03-modules/005-pipeline-esempi.md), [3.006](../03-modules/006-pipeline-isom.md), [3.007](../03-modules/007-tooling-and-data-flows.md); [1.003](../01-vision/003-success-criteria.md) criterion 3 (complete decks)
**Route:** none (curator's Mac)
**Enforced by:** `npm run check:content` in CI ([F-010](010-ci-e-deploy.md)); the deterministic re-run diff

## Behaviour

Four commands, one per pipeline, plus the check. Each reads only
`sources/` and `akaaso/sources/`, writes to a temporary folder and moves
into `content/` on success, and prints a one-line summary with counts.

- `swift run extract-esempi` — grid-detects pages 17 – 28 (and page 3) of
  the control-descriptions PDF, crops *carta*, *terreno*, *riga* per row
  onto white at 4×, pairs with the text layer, numbers sequentially,
  writes `esempi/esempi.json` and `artwork/esempi/`, and a contact sheet
  `content/_contact/esempi.html`.
- `swift run extract-isom` — renders each `ISOM <rif> …pdf` of [S5] at 8×
  on white to `artwork/isom/<rif>.png`; writes a contact sheet.
- `npm run parse:descrizioni` — parses [S3]'s tables from the converted
  text into `simboli/descrizioni-punti.json`, copies the [S4] SVGs into
  `artwork/descrizioni-punti/`, records checksums, reports Italian-name
  mismatches against `lang.json`, and lists what it excluded in
  `esclusi.json`.
- `npm run parse:isom` — parses [S1] §3.1 – 3.7 into `simboli/isom.json`
  with number, name, geometry, section and the description up to *Colore*.
- `npm run check:content` — validates every JSON against its schema;
  diffs deck inventories against the source text; verifies every artwork
  file exists and its checksum matches the recorded one; regenerates the
  rows file and diffs ([F-008](008-generatore-di-righe.md)); exits 1 on
  any finding, printing each with the source page.

Each script has a fixture that deliberately breaks its rule (a missing
symbol, a wrong checksum, a row citing an unknown reference) and a test
that asserts the check reports it.

## Components

- `scripts/extract/` (Swift package: `Extract.swift`, `Grid.swift`,
  `Render.swift`), `scripts/parse/` (TypeScript), `scripts/check-content.ts`,
  `content/_contact/*.html` (git-ignored).
- Schemas: `content/schema/*.json` (one per file kind).

## Interfaces

Output shapes are the entities of [3.002](../03-modules/002-data-model.md);
each JSON file carries `{ v: 1, generato: ISO-date, sorgente: [S-id], ... }`.

## Acceptance criteria

- AC-1 `parse:descrizioni` yields one `Simbolo` for every reference in
  [S3]'s tables (columns C – H, §13 – 14), with column and family set; the
  count matches a hand count recorded in the test on first run.
- AC-2 `extract-esempi` yields as many examples as *Descrizione con testo*
  strings on pages 17 – 28, each with three PNGs on white; the contact
  sheet shows them in page order.
- AC-3 `extract-isom` yields one PNG per symbol number parsed by
  `parse:isom` for §3.1 – 3.5 and 3.7; `esclusi.json` lists §3.6 and the
  `Def_`/`min_dim_` figures.
- AC-4 Re-running every command in a clean checkout produces no git diff.
- AC-5 Each fixture breaks its rule and `check:content` reports it with the
  page; the clean tree passes.
