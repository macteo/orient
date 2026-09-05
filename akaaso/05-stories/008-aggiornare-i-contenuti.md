---
id: S-008
title: Il curatore genera altre righe e ripubblica
persona: curatore
priority: secondary
status: confirmed
features: [F-008, F-007, F-006, F-009, F-001]
modules: [contenuti, mazzi, sito]
apis: []
pages:
  - R-001
data_sources: [content/righe/generate.json, content/compatibilita.json, content/_contact/righe.html, .github/workflows/deploy.yml]
fixtures: []
---

## Narrative

As the curatore, I want to add more generated rows and see them on the
site without touching code, so that the deck grows as the family wears it
out.

Matteo runs the generator with count 400, scans the contact sheet of the
new rows, runs the check, commits, pushes; the workflow deploys; the home
shows the higher counts; Giulia's earlier results still open.

## Preconditions

- Clean checkout; `content/righe/generate.json` at count 200 with its
  recorded seed; Node LTS per `.nvmrc`.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Runs `npm run generate:righe -- --count 400` | — (terminal) | | entry point | — | contenuti | rows 1–200 byte-identical, 201–400 appended; `content/_contact/righe.html` written |
| 2 | Opens the contact sheet, scans the new rows | — (local file) | | | — | contenuti | eye check; a bad row → edit `compatibilita.json` and re-run |
| 3 | Runs `npm run check:content` | — (terminal) | | | — | contenuti | regeneration diff clean; schemas valid; exit 0 |
| 4 | Commits and pushes to `main` | — (git) | | | — | — | workflow triggered |
| 5 | Watches the workflow | — (GitHub) | | | — | sito | install → check:content → test → build → check:dist → deploy, all green |
| 6 | Opens the site on the phone | R-001 (/) | | | — | sito | *Descrizioni complete* counts risen; earlier results still shown (stable ids) |

## Expected Outcomes

- `generate.json` header reads `count: 400`; the first 200 rows unchanged.
- The deployed home reflects the new counts; no card id changed.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `error` | A hand edit to `generate.json` before the check | `check:content` reports the drift with the row index; exit 1; the curator regenerates |
| New source revision | A new [S3] PDF dropped into `sources/` and converted | `parse:descrizioni` re-run; inventory diff reported; `versioneRegole` unchanged so rows stay |
| Seed change | `--seed` changed | Every row changes; the curator records it in 3.004's change log first |

## E2E Mapping

- **Test name:** journey-aggiornare-i-contenuti
- **Tier:** standard
- **Seeding:** repository checkout; runs as an integration test of the scripts (no browser), plus the S-003 "deck grown" variant in the browser
