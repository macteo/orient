# P1-CONTENUTI-TOOL-extract-esempi — Crop the worked examples and the page-3 rows by detected table rules

## Objective

Implement `extract-esempi` in the Swift package: detect the table grid of
pages 17 – 28 of `sources/iof_descrizioni_punti_ital.pdf` by scanning for
drawn rules, crop the *Carta*, *Terreno* and *Descrizione punti* cells of every
data row onto white PNGs, pair each row with its *Descrizione con testo* from
the text layer, and write `content/esempi/esempi.json`, `esempi/sezioni.json`
and a contact sheet. Also crop the nine rows of the page-3 example grid for the
official-rows review. Spec: `akaaso/03-modules/005-pipeline-esempi.md`.

---

## Specification

### Deliverables

- `scripts/extract/Sources/extract-esempi/main.swift` (+ `Grid.swift`).
- `content/artwork/esempi/<codice>-carta.png`, `-terreno.png`, `-riga.png` at 4×.
- `content/esempi/esempi.json` — `{ v: 1, generato, sorgente: "S3", esempi: Esempio[] }`.
- `content/esempi/sezioni.json` — `{ pagine: { "17": "d-morfologici", … } }` —
  page → D-family id, inferred from the description texts (they follow the
  column-D order: morfologici, rocce, idrografia, vegetazione, costruzioni,
  particolari); the agent fills it by reading the texts once and records the
  reasoning in a comment field.
- `content/artwork/esempi/pagina3/riga-<n>.png` — the nine rows of the page-3
  grid, cropped from the left table (columns A – H together).
- `content/_contact/esempi.html` — one strip per example: carta | terreno |
  riga | testo, in page order.

### Grid detection (proven on 2026-09-05)

- Render the page at 4× on white; a horizontal rule is a row whose longest dark
  run (`r+g+b < 360`) exceeds 40 % of the page width; group consecutive ys;
  vertical rules are columns where ≥ 85 % of the pixels between the top and
  bottom rule are dark. Page 24 yields 11 horizontal and 5 vertical rules →
  10 rows (1 header + 9 data), 4 columns.
- Crop each cell with a 3 px inset; save on white.
- Texts: the text layer of each page lists the *Descrizione con testo* strings
  in row order after the header line `Carta Terreno Descrizione punti
  Descrizione con testo`; join wrapped lines; the *n*-th string pairs with the
  *n*-th data row. Verify counts per page; abort the page (and report) if they
  differ.
- `codice`: sequential from 1 at the first data row of page 17 (the printed
  code is not in the text layer).

### Page 3

- Same detector on page 3; the left table's data rows are the ones whose row
  height matches the grid rows (skip header rows and the two route lines);
  crop rows 1 – 9 whole (all columns) to `pagina3/riga-<n>.png`.

---

## Done Criteria

1. `swift run extract-esempi` writes as many `Esempio` entries as description
   strings on pages 17 – 28 (about 100), each with three existing PNGs.
2. Example with `testo` `Cisterna d’acqua, pozzo, parte est` (page 24, second
   data row) has a `terreno` PNG showing the well sketch and a `riga` PNG
   showing code `66`.
3. `pagina3/riga-2.png` shows `2 | 212 | ↖ | ▲ | | 1.0 | ○· |`.
4. Re-running produces no diff; the contact sheet opens and shows every strip.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Header detection: the header row has a gray fill; skip the first data row
  only if its text is the header line.
- Stories served: S-004, S-005, S-008, S-009 (F-007). Module: contenuti.
