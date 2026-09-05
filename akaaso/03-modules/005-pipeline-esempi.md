# 005 — Content Pipeline: Worked Examples from the Terrain

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [002](002-data-model.md), [1.005](../01-vision/005-constraints.md)
**Sources:** [S3] pp. 17 – 28 (§Esempi), p. 3
**Enforced by:** `check:content` — the number of `Esempio` entries equals the number of *Descrizione con testo* strings the text layer yields for pages 17 – 28, each has three image files, and every image is re-derivable: the extraction script is deterministic and a re-run must produce byte-identical files

## The Spec

Produces `content/esempi/esempi.json` and `content/artwork/esempi/`.

The source's §Esempi is a four-column table — *Carta* (a map clip with the
control circle), *Terreno* (a terrain sketch), *Descrizione punti* (the
description row as printed, with its code), *Descrizione con testo* — nine
rows a page over twelve pages, about a hundred examples, codes numbered in
sequence.

1. **Grid detection.** The page is rendered at 4× with PDFKit on a white
   canvas; horizontal and vertical table rules are found by scanning for
   dark runs longer than 40 % of the page width (rows) and 85 % of the
   table height (columns). Proven on 2026-09-05 on page 24: eleven rules,
   ten rows, four columns, every cell cropped cleanly.
2. **Cells.** For each data row: *carta*, *terreno* and *riga* are cropped
   with a three-pixel inset and saved as PNG on white — never transparent,
   never recoloured ([2.006](../02-architecture/006-design-direction.md)).
   The *riga* crop is kept as an image; it is not decoded into cells.
3. **Text.** The text layer of the same page lists the *Descrizione con
   testo* strings in row order; the script joins wrapped lines and pairs the
   *n*-th string with the *n*-th data row. The pairing is verified by
   count per page, and by eye once on the contact sheet the script writes.
4. **Code.** The printed code in the *riga* cell is not in the text layer;
   the script numbers examples sequentially from the first row of page 17
   and records `codice` as that sequence. If the printed code is ever
   needed it is read by a person from the contact sheet.
5. **Page 3.** The same cropper, run on page 3, gives the nine official
   rows as images for the review step in
   [004](004-pipeline-descrizioni-righe.md).

**Card shape.** Front: the map clip and the terrain sketch side by side.
Back: the printed row and the sentence. Level 4 may add the reverse
(row first, guess the terrain) if the family wants it; it costs nothing.

## The Reasoning

The founder pointed at this table with "single symbol cards like [image
5]" — a map clip, a sketch, a row, a sentence — and it is the best content
in the document: it is the only place a learner sees the whole chain from
terrain to symbol, and it comes with its own fluent Italian. It is also
the one deck that can only be images, since the map and the sketch have no
text form.

Cropping by detected rules rather than by fixed coordinates is the
decision that makes this safe: the table is the same on every page but the
rows are not the same height everywhere, and a hard-coded grid would drift
by a few pixels a page until a sketch loses its treetops. Detecting the
rules costs one loop over pixels and made the probe work first time.

### Options Considered

1. **Crop the three image cells per row by detected grid; text from the
   text layer.** **Chosen.**
2. **Extract the embedded images from the PDF's object stream.** Cleaner in
   principle; the tool that does it on this Mac is broken, the sketches may
   be vector, and a crop of a page rendered at 4× is indistinguishable on
   a phone.
3. **Skip the examples.** The founder asked for them, and they are the deck
   a coach would pick first.

### The Challenge

*A hundred crops nobody looks at will hide one bad one.* The script writes
a contact sheet — every example as a strip of its four cells — and the
curator scans it once per extraction. Ten seconds a page.

*The sketches are hand-drawn and some are faint.* They are rendered at 4×
on white and shown at phone width; the probe's sketch of the well read
fine. If one does not, the Level 4 spec allows a per-example `nascondi`
flag rather than a redraw.

## Change Log

- 2026-09-05 — confirmed by the founder: map and sketch on the front, printed row and sentence on the back.

[S3]: <../sources/iof_descrizioni_punti_ital.md>
