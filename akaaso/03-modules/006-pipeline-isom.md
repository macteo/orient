# 006 — Content Pipeline: ISOM 2017-2 Map Symbols

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [002](002-data-model.md), [1.004](../01-vision/004-scope-boundaries.md), [1.005](../01-vision/005-constraints.md)
**Sources:** [S1] §3.1 – 3.7, [S5]
**Enforced by:** `check:content` — every symbol number parsed from [S1] §3.1 – 3.5 and 3.7 has one `Simbolo` and one PNG whose checksum matches a deterministic render of the corresponding [S5] file; every [S5] symbol file is claimed or listed in `esclusi.json`

## The Spec

Produces `content/simboli/isom.json` and `content/artwork/isom/`.

1. **Inventory and text** from `akaaso/sources/ISOM_2017-2_CH_IT.md`:
   every line matching `^(\d{3}(?:\.\d)?) (.+) \((L|P|A|T)\)$` inside
   §3.1 – 3.7 starts a symbol; `rif` is the number, `nome` the name,
   `geometria` the letter (linea, punto, area, testo), `sezione` the
   nearest §3.x heading. `descrizione` is the text that follows, up to and
   including the *Colore:* line, wrapped lines joined, the blue Swiss
   additions kept (they are part of the Italian edition). §3.6 *Simboli
   tecnici* is excluded by [1.004](../01-vision/004-scope-boundaries.md).
2. **Artwork** from [S5]: the file `ISOM <rif> <name>.pdf` is rendered at
   8× on a white canvas to `content/artwork/isom/<rif>.png`. Where a symbol
   has two files (`101 Contour-1/-2`, `103 Form line-1/-2`) both are
   rendered and the first is the card face; where one file covers several
   (`701-703`, `704-706`) the file is rendered once and shared, and the
   card says which of the three it shows. The `Def_*` and `min_dim_*`
   figures are not used.
3. **Annotations stay.** The [S5] drawings carry the printed red dimension
   labels and blue *min.* boxes, as in the specification page the founder
   pointed at. They are kept — **option A, chosen by the founder on
   2026-09-05** after the two options were explained: they are part of the
   licensed illustration, and a card that shows "0.5 (CC)" beside the
   symbol teaches the size too.
   Masking them is an option recorded for v1.1, executed as a crop of the
   drawing's bounding box with the red and blue paths dropped — a
   reproduction of a part, still not a redraw.
4. **Card face rule.** The PNG on a white surface, scaled proportionally,
   never recoloured; the section's name in text beside it.

## The Reasoning

Level 1 accepted that the ISOM deck may be cut if extraction is expensive.
It is not, any more: the IOF's own package hands over one vector file per
symbol, so the pipeline is a render loop and a text parser, and the
symbol table in the Italian edition has a regular enough shape
(`109 Cocuzzolo (P)`) that the parser is a regular expression.

Keeping the annotations was decided by the founder's screenshot: the card
they want looks like the specification page — drawing, dimensions, name,
full description. A cleaned drawing would be prettier and would lose the
"min. 0.8" that a competitor actually needs to know about a marsh. And
the licence is simpler this way: verbatim.

### Options Considered

1. **[S5] rendered on white, annotations kept, text from [S1].** **Chosen.**
2. **Crop from [S1]'s pages.** The founder's literal instruction. The same
   drawings, but on a page where locating each one is guesswork (the probe
   on 2026-09-05 cut through a symbol); [S5] is the same artwork already
   cut out.
3. **Vector SVG via a PDF converter.** No working converter on this Mac
   without installing one; a PNG at 8× is sharp on any phone; revisit only
   for the masking option.
4. **OpenOrienteering Mapper symbol sets.** Vector definitions, GPL-3, no
   images, would need a renderer. Answered in full in the Level 2 notes.

### The Challenge

*Some symbols are meaningless alone.* An area symbol is a colour swatch
(405 *Bosco* is white with a box). True, and the card back carries the
description that says so; the section filter lets a learner skip §3.4 if
the swatches bore them. Level 4 may mark a handful as `nascondi`.

*The Swiss edition adds blue text the IOF original lacks.* It is the
Italian the family reads and races under (FISO adopted the translation),
so it stays; the card does not distinguish it.

## Change Log

- 2026-09-05 — confirmed by the founder: option A, annotations kept as printed. Masking stays a v1.1 option.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S5]: <../../sources/iof-isom-2017-2-revision-6-links/PROVENANCE.md>
