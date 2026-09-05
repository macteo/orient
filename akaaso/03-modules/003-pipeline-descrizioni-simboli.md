# 003 — Content Pipeline: Control-Description Pictograms

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [002](002-data-model.md), [1.005](../01-vision/005-constraints.md)
**Sources:** [S3] pp. 7 – 16, [S4]
**Enforced by:** `check:content` — every `rif` parsed from [S3]'s tables has exactly one `Simbolo` with an artwork file whose checksum matches the vendored [S4] file; every [S4] file that is not a direction variant is claimed by a `Simbolo` or listed in `content/esclusi.json` with a reason

## The Spec

Produces `content/simboli/descrizioni-punti.json` and
`content/artwork/descrizioni-punti/`.

1. **Text.** A parser reads `akaaso/sources/iof_descrizioni_punti_ital.md`
   pages 7 – 16 and, per table row, yields `rif`, `nome` (the *Definizione*
   cell), `descrizione` (the *Descrizione* cell, joined across wrapped
   lines), the column (from the nearest "Colonna X" heading) and the
   feature family (from the nearest bold sub-heading in column D). The glyph
   character the PDF's symbol font leaves in the text layer is discarded.
   Column F's size rows (9.1 – 9.4) and column B are not symbols and are
   listed in `esclusi.json`.
2. **Artwork.** For each `rif`, the matching [S4] file `<rif>.svg` is copied
   unmodified into `content/artwork/descrizioni-punti/`. For the
   eight-direction pictograms (0.1, 0.2 in column C; 11.1 – 11.6, 11.8, 11.14
   in column G) all variants `<rif><DIR>.svg` are copied and listed under
   `direzioni`; the north or north-east variant is the card face.
3. **Cross-check.** [S4]'s `lang.json` carries an Italian name per symbol.
   The check script reports any `rif` whose [S3] name and [S4] Italian name
   differ beyond case and punctuation. Differences are expected (two
   translators) and are **not** errors; the [S3] name is always the one
   shown. The report exists so a mismatch is seen once, not discovered by a
   child.
4. **Fallback artwork.** If a `rif` has no [S4] file (the probe found
   12.3 *Punto radio o TV* missing), the pictogram is cropped from [S3]'s
   own table with the grid-detection cropper of
   [005](005-pipeline-esempi.md), rendered on white, and its `artwork.origin`
   says `S3`.
5. **Card face rule.** The SVG is shown on a white surface at a fixed size,
   black strokes, no recolouring ([2.006](../02-architecture/006-design-direction.md)).

## The Reasoning

The founder's second wish — "single symbol cards with their description,
like the table rows" — is the simplest deck and the one the whole product
was first imagined around. The only decision is where the drawing comes
from, and it was made when [S4] was found: Purple Pen's vectors are the
same pictograms, clean, scalable, and BSD-licensed, whereas a crop from
the PDF is a bitmap of a font glyph with a table border to fight. The PDF
crop survives as the fallback for the handful of symbols [S4] lacks.

The text has to come from [S3] because that is the Italian the family will
meet at Italian events, and Level 1 made it verbatim. The parser is the
delicate part: the text layer of a two-column table wraps unpredictably,
so the parser is anchored on the `rif` pattern at line start and the check
script diffs its inventory against a hand-counted list once, at first
run, before anyone trusts it.

### Options Considered

1. **[S4] SVG for artwork, [S3] for text.** **Chosen.**
2. **Crop everything from [S3].** Faithful to the founder's "extract from
   the PDF" instruction, but the pictograms are font glyphs: a crop is a
   bitmap where a vector exists, and the licence is worse.
3. **Render from the embedded "Orienteering" font.** Elegant, unknown
   licence, and unnecessary once [S4] exists.

### The Challenge

*Two Italian names for one symbol.* [S3] is Swiss Orienteering's
translation, [S4]'s `lang.json` is Purple Pen's community one. Only [S3]
is shown; the cross-check is a report, not a gate, so the two never fight.

*Eight directions multiply the deck.* They do not: a symbol is one card
with one face; the directions matter in rows
([004](004-pipeline-descrizioni-righe.md)), where they are the point.

## Change Log

- 2026-09-05 — confirmed by the founder with the Level 3 answers.

[S3]: <../sources/iof_descrizioni_punti_ital.md>
[S4]: <../../sources/svg-control-descriptions/PROVENANCE.md>
