# 004 — Content Pipeline: Full Description Rows

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [002](002-data-model.md), [003](003-pipeline-descrizioni-simboli.md)
**Sources:** [S3] p. 3 (IOF Event Example), pp. 7 – 16 (the "usato con" notes and the column G rules)
**Enforced by:** `check:content` validates every row: each cell cites an existing `rif` in the right column, generated rows obey the compatibility table, the nine official rows carry their verbatim text; the generation uses a fixed seed so `righe/generate.json` is reproducible and any drift fails the build

## The Spec

Produces `content/righe/ufficiali.json` and `content/righe/generate.json`.
The deck *Descrizioni complete* shows a whole description row — the C to H
cells rendered as the printed grid — and asks for the sentence.

**Official rows (9).** The IOF Event Example on [S3] page 3, transcribed by
hand once into `ufficiali.json`: for each row the code (101, 212, 135,
246, 164, 185, 178, 147, 149), the symbol in each cell, and the verbatim
Italian text (*Sasso nord ovest, 1 m d'altezza, lato est*). The grid on
page 3 is a graphic, so this is the one place a human reads pictograms and
types references; the check script cannot verify it against the page, so
the transcription is reviewed against a crop of the row rendered beside it
(the cropper of [005](005-pipeline-esempi.md) on page 3).

**Generated rows.** Built at extraction time by a rule and committed, so
the deck is static and identical on every build:

1. **D** — one feature from column D, every feature in turn.
2. **C** — one of the five *quale degli oggetti simili* qualifiers, added
   with probability ¼; direction from the eight where the qualifier has
   directions.
3. **E** — one appearance from column E, only from the set the source
   allows for that feature (the "usato con" notes and a small hand-kept
   compatibility table `content/compatibilita.json`), with probability ⅓.
4. **F** — a dimension, only for features that have one (height for
   boulders, cliffs, towers; width × depth for pits, thickets, buildings),
   from a short list of realistic values per feature; probability ½ where
   allowed. The two *combinazioni* symbols (bivio, incrocio) are generated
   only with a second D feature in E, as the source requires.
5. **G** — one *posizione della lanterna*, with direction, probability ¾;
   *tra* (11.15) only with two D features.
6. **H** — one of column H with probability ⅒.
7. **Text** — composed by template from the verbatim names:
   `<D>[ <C>][, <E>][, <F>][, <G>][, <H>]`, qualifiers lowercased, the F
   value phrased as the source does (*1 m d'altezza*, *5 x 5 m*). The text
   of a generated row is marked `origine: generata` and the interface shows
   a small *generata* badge on the back.
8. **Volume, and growing it.** Two hundred rows for v1, confirmed by the
   founder. The generator is a script with two inputs, `--count` and
   `--seed`, and is **prefix-stable**: row *i* depends only on the seed and
   *i*, so running it again with a larger count leaves the first two
   hundred rows byte-identical and appends new ones. Growing the deck is
   therefore `npm run generate:righe -- --count 400`, a look at the new
   rows, and a commit; the cards update on the next build because
   `mazzi` reads the file. The file header records the count and seed
   used, and `check:content` regenerates with them and diffs, so a
   hand-edited or stale file fails the build.

**Rendering.** A row is drawn in the browser as eight cells in a bordered
grid, the printed proportions of page 3: A holds the row number, B the
code, C – H the pictograms from [003](003-pipeline-descrizioni-simboli.md)
at the variant direction, F as text where it is a dimension. This is the
one component of the product that has to be exactly right, because it is
what a learner will meet at the start line; Level 6 designs it against a
crop of page 3.

**Modes.** Flash card: row on the front, sentence on the back. Quiz
forward: row, four sentences. Quiz reverse: sentence, four rows. Distractor
rows share the D feature or the G position with the answer, so the
difference is in the cell the learner must actually read.

## The Reasoning

This is the founder's first wish and the deck with the most learning value
per card: at an event nobody is shown a pictogram alone, they are shown a
row, and the skill is reading the whole row as one sentence. Nine official
rows are not enough to drill, so the deck is mostly generated — and the
whole design question is how to generate rows that are *plausible*, not
merely valid. A random pick per column produces "cliff, ruined, 3 m,
between" nonsense the source would never print. Hence the compatibility
table and the per-column probabilities: the rows should look like the
example on page 3, most cells empty, one or two qualifiers, a position.

The template sentence is the concession. The official texts are fluent
Italian ("Muro di sassi, rovinato, angolo esterno sud-est"); a template
will be stiffer. It is acceptable because the card's job is to teach the
*reading*, the sentence is the check, and the row is marked as generated.
If the family finds the sentences grating, the fix is a better template or
a hand-written text on the rows that get used most, not a different deck.

### Options Considered

1. **Nine official rows plus seeded generation with a compatibility
   table.** **Chosen.**
2. **Only the ~100 worked-example rows from §Esempi**, cropped as images
   ([005](005-pipeline-esempi.md)). Real and fluent, but the cells cannot
   be varied or read back, and they belong to the examples deck anyway.
3. **Random generation without constraints.** Ten times cheaper, and it
   would teach rows that do not exist.
4. **Generation at runtime in the browser.** Endless variety, but the deck
   would differ on every visit, a bug report could never be reproduced,
   and "molto semplice" prefers a file.

### The Challenge

*The compatibility table is hand-kept content that can be wrong.* It is
small — column E has twelve entries, the dimension rule covers a dozen
features — and every entry cites the source line it comes from. A wrong
entry produces a row that looks off, which is exactly what a reviewer
scanning `generate.json` beside the source will catch.

*Two hundred generated rows against nine real ones will drown the real
ones.* The nine are always in a run's first cards when the deck is
started fresh, and the generated ones fill from there. Level 4 pins the
order.

## Change Log

- 2026-09-05 — confirmed by the founder: two hundred generated rows for now, with the explicit requirement that more can be generated later by script and the cards updated — item 8 rewritten as a prefix-stable generator with count and seed.

[S3]: <../sources/iof_descrizioni_punti_ital.md>
