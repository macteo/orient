# P1-CONTENUTI-DATA-righe-ufficiali — Transcribe the nine official description rows of page 3

## Objective

Write `content/righe/ufficiali.json`: the nine rows of the IOF Event Example on
page 3 of the control-descriptions booklet, each as the symbol reference in
every cell C – H plus the verbatim Italian sentence, reviewed against the
cropped row images. Spec: `akaaso/03-modules/004-pipeline-descrizioni-righe.md`.

---

## Specification

### Deliverables

- `content/righe/ufficiali.json` — `{ v: 1, sorgente: "S3", pagina: 3, righe: RigaDescrizione[9] }`,
  ids `dc:ufficiale:1` … `dc:ufficiale:9`, `origine: "ufficiale"`, `numero`
  `"1"`…`"9"`, `codice` `101, 212, 135, 246, 164, 185, 178, 147, 149`.
- `content/schema/righe.schema.json` (shared by generated rows).
- `content/_contact/righe-ufficiali.html` — each row: the crop
  `content/artwork/esempi/pagina3/riga-<n>.png` beside the transcribed cells
  rendered as text (`C: 0.2NW · D: 2.4 · F: 1.0 · G: 11.1E`) and the sentence,
  for the curator's eye check.

### How to transcribe

- Open each `pagina3/riga-<n>.png`; identify each cell's pictogram by matching
  it visually against `content/artwork/descrizioni-punti/<rif>.svg` and the
  names in `content/simboli/descrizioni-punti.json`. The sentences (verbatim,
  from the source text layer, page 3) are:
  1 *Curva striscia di palude* · 2 *Sasso nord ovest, 1 m d'altezza, lato est* ·
  3 *Tra due boschetti fitti* · 4 *Depressione centrale, parte est* ·
  5 *Rovina più a est, parte ovest* · 6 *Muro di sassi, rovinato, angolo esterno
  sud-est* · 7 *Naso, piede nord-ovest* · 8 *Roccia superiore, 2 m d'altezza* ·
  9 *Incrocio sentieri*.
- The sentence tells you the cells: e.g. row 2 → C `0.2` NW (più a nord-ovest),
  D `2.4` (sasso), F `"1.0"`, G `11.1` E (lato est). Row 3 → D the thicket
  (boschetto fitto) twice? No: *Tra* is G `11.15` with two D features — put the
  first in D and the second in E as the source requires. Row 9 → D `5.x`
  sentiero, E `5.x` sentiero, F `10.2` incrocio.
- Every `rif` you write must exist in `descrizioni-punti.json` in that column.

---

## Done Criteria

1. The file validates against `righe.schema.json`; nine rows; every cell ref
   exists in `descrizioni-punti.json` with the matching `colonna`.
2. The contact sheet shows crop and transcription side by side for all nine,
   and a reviewer can confirm each cell in under a minute per row.
3. The nine sentences are byte-identical to the page-3 text layer.
4. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on `P1-CONTENUTI-TOOL-parse-descrizioni` (refs) and
  `P1-CONTENUTI-TOOL-extract-esempi` (page-3 crops).
- Stories served: S-003, S-008 (F-008). Module: contenuti.
