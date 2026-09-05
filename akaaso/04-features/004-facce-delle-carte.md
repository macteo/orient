# 004 — Facce delle carte

**Feature ID:** F-004
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** allenamento ([3.001](../03-modules/001-module-map.md)); content from contenuti
**Delivers:** [3.003](../03-modules/003-pipeline-descrizioni-simboli.md) – [3.006](../03-modules/006-pipeline-isom.md) card shapes; [2.006](../02-architecture/006-design-direction.md) artwork rules; [1.004](../01-vision/004-scope-boundaries.md) "the card back carries name and definition"
**Route:** none (component)
**Enforced by:** a visual regression test of the description row against the crop of [S3] page 3 (a pixel-diff threshold on the eight-cell grid); the artwork checksum check; the CSS token check

## Behaviour

One component family renders the front and back of every card type, at
three sizes: *carta* (the run), *tile* (quiz reverse option, four on a
screen), *lista* (results and review rows).

| Card type (deck) | Front | Back |
|---|---|---|
| `simbolo` (descrizioni-simboli) | the pictogram SVG, black on white, centred | pictogram small, reference badge (`1.2`), name, definition |
| `riga` (descrizioni-complete) | the **description row**: eight bordered cells A – H in the printed proportions, A the row number, B the code, C – H pictograms at the cell's direction, F as text when a dimension | the row again, small, and the sentence; a *generata* badge when `origine` is generated |
| `esempio` (esempi) | the map clip and the terrain sketch side by side, each on white | the printed row image and the sentence |
| `simbolo-isom` (isom) | the ISOM drawing PNG on white, annotations as printed, scaled proportionally | drawing small, number badge (`307`), name, geometry letter, section, the full description |

Every image sits on a white surface with a hairline border; artwork is
never recoloured, cropped or stretched. The description row is drawn as
HTML and SVG, not as an image, so that generated rows and the reverse quiz
can compose it; the nine official rows must match the printed grid
closely enough that a learner cannot tell.

## Components

- `src/allenamento/facce/` — `simbolo.ts`, `riga.ts`, `esempio.ts`,
  `isom.ts`, each exporting `fronte(card, size)` and `retro(card, size)`
  returning DOM; `riga.ts` also exports `cella(rif, direzione)`.
- Assets: `content/artwork/**` copied by Vite; SVG inlined for the
  pictograms so `currentColor` and crisp scaling apply; PNG for ISOM and
  examples with `width`/`height` attributes to avoid layout shift.
- Preline patterns: Card, Badge.

## Interfaces

```text
Carta { id, mazzo, tipo: "simbolo"|"riga"|"esempio"|"simbolo-isom", sezione,
        // per tipo:
        simbolo?: { rif, nome, descrizione, artwork, direzione? }
        riga?:    RigaDescrizione            // 3.002
        esempio?: Esempio                    // 3.002
        isom?:    { rif, nome, geometria, descrizione, artwork } }
Size = "carta" | "tile" | "lista"
```

## States

Not a screen; no states. A missing artwork file is a build failure, not a
runtime state.

## Acceptance criteria

- AC-1 Each of the four card types renders front and back at the three
  sizes without overflow on a 360 px viewport; images keep their aspect
  ratio.
- AC-2 The description row for official row 2 (*212 · Sasso nord ovest, 1 m
  d'altezza, lato est*) matches the page-3 crop within the pixel-diff
  threshold set in the test; cell borders, proportions and the order of
  columns A – H are as printed.
- AC-3 A generated row's back shows the *generata* badge; an official
  row's back does not.
- AC-4 No stylesheet in `src/` contains a hex colour or a `font-family`
  outside the design system's tokens.
- AC-5 Text is verbatim: a snapshot test compares every rendered name and
  definition with `content/` byte for byte.
