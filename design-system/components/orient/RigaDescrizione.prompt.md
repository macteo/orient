# RigaDescrizione

orient composite. Renders one control-description row as the printed grid of
[S3] page 3: eight bordered cells A – H in a single line, equal height,
A and B slightly narrower, hairline `gray-800` borders on white.

- **Input:** `RigaDescrizione` (3.002): `codice`, `celle.C…H` each a symbol
  `rif` with optional `direzione`, or a dimension text for `F`, or empty;
  `origine`.
- **Cells:** A shows the row number (or `—` on a generated row), B the code,
  C – H the pictogram SVG at the cell's direction, F as text (`1.0`, `5x5`)
  when it is a dimension. Empty cells stay empty; the grid never collapses.
- **Sizes:** `carta` (full width of the card, cell ≈ 40 px), `tile` (≈ 26 px),
  `lista` (≈ 20 px).
- **The rule it carries:** the grid matches the printed proportions closely
  enough that a learner cannot tell (F-004 AC-2 pixel test against the page-3
  crop). Nothing in a screen may draw a row any other way.
- **Generated rows** get the `generata` Badge (soft, gray, sm) on the card
  back, never on the front.
