# P1-ALLENAMENTO-UI-facce — Card faces: the four card types at three sizes, and the description row grid

## Objective

Implement `src/allenamento/facce/` — DOM render functions for the front and back
of every card type (`simbolo`, `riga`, `esempio`, `simbolo-isom`) at sizes
`carta`, `tile`, `lista` — including the description-row grid that must match
the printed page-3 grid, with snapshot tests and a pixel test against the
page-3 crop. Spec: `akaaso/04-features/004-facce-delle-carte.md`; contracts
`design-system/components/orient/FacciaCarta.prompt.md`,
`RigaDescrizione.prompt.md`.

---

## Specification

### Deliverables

- `src/allenamento/facce/index.ts` exporting `fronte(carta, size): HTMLElement`,
  `retro(carta, size): HTMLElement`; `facce/simbolo.ts`, `riga.ts`,
  `esempio.ts`, `isom.ts`; `facce/cella.ts` (`cella(rif, direzione?)` → inline
  `<svg>` using the SVG's inner markup from `content/artwork/…` **inlined at
  build** via a generated sprite `src/allenamento/facce/sprite.generated.ts`
  that `build-mazzi` will emit — for this task, create the sprite generator
  function `scripts/lib/sprite.ts` and a fixture sprite with the fourteen
  pictograms used by the artboards).
- `src/allenamento/facce/facce.css` — the `.riga` grid (8 columns, A/B
  narrower, hairline `var(--gray-800)` borders, white cells, square cells,
  sizes `carta` ≈ 40 px, `tile` ≈ 26 px, `lista` ≈ 20 px), `.img-bianco`
  (white background, `var(--gray-200)` border, `var(--radius-lg)`), all
  colours via tokens; imported from `src/styles.css`.
- Backs: reference Badge (Preline `hs-badge` markup, soft gray, pill), name at
  22 px/600, definition 14 px `var(--gray-500)`; `generata` outline badge on
  generated rows; ISOM back adds number · geometry badge and section.
- Images: `<img>` with `width`/`height` attributes, `alt` in Italian, lazy.
- Tests: `facce.test.ts` (jsdom snapshots for each type × size, verbatim text
  from a content fixture), `riga.pixel.test.ts` — renders the official row 2
  grid with Playwright (or `@vitest/browser` if configured) and compares with
  `content/artwork/esempi/pagina3/riga-2.png` at 40 px cells using a
  tolerance; if the crop is not yet on disk the test skips with a printed
  `- skipped: pagina3 crop missing`.

### Layout of the artboards to match

`akaaso/06-design/_artboards/[mazzo].flashcard.dc.html` (front/back per deck,
prop `mazzo`), `[mazzo].flashcard.retro.dc.html` (row back with badge).

---

Route:      none (component family; used by D-002, D-003, D-004)
Design:     akaaso/06-design/[mazzo].flashcard.md (D-002, approved v1), [mazzo].quiz.md (D-003, approved v1)
Artboards:  akaaso/06-design/_artboards/[mazzo].flashcard.dc.html
            akaaso/06-design/_artboards/[mazzo].flashcard.retro.dc.html
            akaaso/06-design/_artboards/[mazzo].quiz.inversa.dc.html
Components: FacciaCarta     → design-system/components/orient/FacciaCarta.prompt.md
            RigaDescrizione → design-system/components/orient/RigaDescrizione.prompt.md
            Badge           → design-system/components/feedback/Badge.prompt.md
Tokens:     design-system/tokens/colors.css, spacing.css, typography.css, shadows.css
States:     n/a (component) — front | back per card type

## Done Criteria

1. Each of the four card types renders front and back at the three sizes in
   jsdom without overflow warnings; snapshots stored and stable.
2. The official row 2 grid renders A `2`, B `212`, C the NW arrow, D the
   boulder triangle, F `1.0`, G the east-side circle, in that order, and the
   pixel test against the page-3 crop passes within the tolerance (or skips
   with the printed reason when the crop is absent).
3. A generated row's back shows the `generata` badge; an official row's does
   not (snapshot).
4. `grep -E '#[0-9a-fA-F]{3,8}|font-family' src/allenamento/facce/*.css` finds
   no hex colour and no font-family outside `var(--font-…)`.
5. Text rendered equals the fixture content byte for byte (snapshot).
6. Every state in `States:` above is implemented and reachable.
7. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Read the three `.prompt.md` contracts first. Do not add a component that
  does not exist in `design-system/`; report blocked instead.
- Depends on `P1-SITO-CONFIG-scaffold`. Stories served: S-001 … S-005 (F-004).
  Module: allenamento.
