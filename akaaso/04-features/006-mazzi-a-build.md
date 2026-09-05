# 006 — Mazzi a build

**Feature ID:** F-006
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** mazzi ([3.001](../03-modules/001-module-map.md))
**Delivers:** [3.002](../03-modules/002-data-model.md) Mazzo and Carta; [2.002](../02-architecture/002-application-architecture.md) content compiled in; [2.005](../02-architecture/005-frontend-strategy.md) multi-page build
**Route:** none (build)
**Enforced by:** `check:content` validates the inputs; a build test asserts each deck's card count equals its content count minus `nascondi`; the deploy runs only after the build

## Behaviour

At build, before Vite, a script reads `content/` and produces one JSON per
deck with its cards (ids, type, section, the fields the faces need,
artwork paths), its sections with counts, and per-deck distractor pools
(card ids grouped by section and by column). It then emits the page
inputs: `index.html`, four `[mazzo]/flashcard/`, four `[mazzo]/quiz/`,
four `[mazzo]/risultati/`, one `fonti/`, each from its template with the
deck JSON inlined as a `<script type="application/json">`. Vite builds
those thirteen pages with the base path from the environment.

Deck definitions:

| Deck id | Card type | Sections (ids) | Source of cards |
|---|---|---|---|
| `descrizioni-simboli` | simbolo | `colonna-c`, `d-morfologici`, `d-rocce`, `d-idrografia`, `d-vegetazione`, `d-costruzioni`, `d-particolari`, `colonna-e`, `colonna-f`, `colonna-g`, `colonna-h`, `istruzioni` | `simboli/descrizioni-punti.json` |
| `descrizioni-complete` | riga | `ufficiali`, then the D families of the row's D symbol | `righe/ufficiali.json` + `righe/generate.json` |
| `esempi` | esempio | the D families, assigned per page range in `esempi/sezioni.json` | `esempi/esempi.json` |
| `isom` | simbolo-isom | `forme`, `rocce`, `acqua`, `vegetazione`, `opere`, `tracciato` | `simboli/isom.json` |

Cards with `nascondi: true` in content are excluded everywhere. Card ids
are stable strings (`ds:1.2`, `dc:ufficiale:2`, `dc:gen:0137`, `es:066`,
`isom:307`) so results survive a content update.

## Components

- Script: `scripts/build-mazzi.ts`, run by `npm run build` before `vite build`.
- Output: `.generated/mazzi/<deck>.json`, `.generated/pages/**/index.html`
  (git-ignored).
- Templates: `src/sito/templates/{home,run,risultati,fonti}.html`.

## Interfaces

```text
MazzoBuild { id, nome, tipo, sezioni: [{ id, etichetta, carte: string[] }],
             carte: Record<cardId, Carta>,
             distrattori: { perSezione: Record<sezioneId, cardId[]>, perColonna?: Record<col, cardId[]> } }
```

## Acceptance criteria

- AC-1 The build emits exactly thirteen pages at the registry's paths
  ([_routes.md](_routes.md)) under the configured base.
- AC-2 Each deck JSON contains every non-hidden content entry once; a
  content entry with `nascondi` appears in no deck.
- AC-3 Section counts on the home equal the deck JSON counts.
- AC-4 The `descrizioni-complete` deck lists the nine official rows first
  in `ufficiali` and every generated row under exactly one D family.
- AC-5 Running the build twice from the same content produces identical
  page output.
