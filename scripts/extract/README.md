# scripts/extract

Swift + PDFKit tools that render the source PDFs into the artwork committed
under `content/artwork/`. Run on the curator's Mac only; CI never runs these,
it only checks their output (`npm run check:content`).

## extract-isom

Renders page 1 of every IOF ISOM 2017-2 per-symbol PDF in
`sources/iof-isom-2017-2-revision-6-links/` onto an opaque white canvas and
writes `content/artwork/isom/<rif>.png`, plus a contact sheet at
`content/_contact/isom.html` (git-ignored — open it in a browser to eyeball
every symbol at once).

```sh
cd scripts/extract
swift run extract-isom
```

What it does:

- Scale: 8x by default; a few of the smallest point symbols (e.g. "110 Small
  elongated knoll", whose PDF media box is ~27pt wide) are rendered at a
  higher scale so every PNG still clears the 300px width floor — always
  proportional on both axes, never a crop.
- Naming: the symbol number in the filename becomes the ref, e.g.
  `ISOM 204 Boulder.pdf` -> `204.png`. A number with a decimal, e.g.
  `ISOM 105.1 Earth wall.pdf`, is its own distinct symbol -> `105.1.png`. A
  dash-range file that covers several symbols on one drawing, e.g.
  `ISOM 701-703.pdf`, is rendered once and shared -> `701-703.png`. Where a
  symbol has two drawings, `<name>-1`/`<name>-2` (currently only 101 and
  103), the first is the card face (`101.png`) and the second gets a `b`
  suffix (`101b.png`).
- Skipped: `Def_*`, `min_dim_*`, `Screens`, `Running speed`, and `by-nd.eps`
  — none of these are per-symbol artwork.
- Annotations stay as printed (the red dimension labels, the blue *min.*
  boxes): they are part of the licensed illustration, per
  `akaaso/03-modules/006-pipeline-isom.md`. The drawing itself is never
  cropped or recoloured.
- Determinism: PNGs are written via `CGImageDestination` with no properties,
  so no timestamp or other metadata is embedded — the same source PDFs
  produce byte-identical PNGs on every run. Verify with:

  ```sh
  git status   # after a prior commit of content/artwork/isom/, should be clean
  ```

- Safety: every symbol is rendered into a scratch directory first; only once
  every file has succeeded does the tool replace `content/artwork/isom/` (a
  failed run leaves the previously committed artwork untouched).

## extract-esempi

See its own target under `Sources/extract-esempi/` (owned by a separate
task).
