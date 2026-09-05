# P1-CONTENUTI-TOOL-parse-isom — Parse the ISOM 2017-2 symbol list and descriptions

## Objective

Write `scripts/parse/parse-isom.ts`, which reads
`akaaso/sources/ISOM_2017-2_CH_IT.md` §3.1 – 3.7 and writes
`content/simboli/isom.json`: one entry per symbol with number, name, geometry,
section and the verbatim description up to and including the *Colore:* line.
Spec: `akaaso/03-modules/006-pipeline-isom.md`.

---

## Specification

### Deliverables

- `scripts/parse/parse-isom.ts` (imports the shared `scripts/parse/_text.ts` from the scaffold).
- `content/simboli/isom.json` — `{ v: 1, generato, sorgente: "S1", simboli: Simbolo[] }`.
- `content/esclusi/isom.json` — §3.6 symbols (601 – 603) and the `Def_` /
  `min_dim_` figures, with reasons.

### Parsing rules

- A symbol starts at a line matching `^(\d{3}(?:\.\d)?) (.+?) \((L|P|A|T)\)$`
  inside §3.1 – 3.7 (headings `3.1 Forme del terreno` … `3.7 Simboli di
  tracciamento percorsi`). Ignore the two summary lines on page 12 – 13 that
  repeat `113 Terreno accidentato 113 …` (they are not inside §3).
- `descrizione` = following lines joined with spaces, up to and including the
  line starting with `Colore:`; blue Swiss additions after *Colore:* that
  belong to the same symbol (until the next symbol line) are appended as a
  final sentence.
- `sezione` ids: `forme` (3.1), `rocce` (3.2), `acqua` (3.3), `vegetazione`
  (3.4), `opere` (3.5), `tracciato` (3.7). §3.6 excluded.
- `artwork.path` = `content/artwork/isom/<rif>.png`, `origine: "S5"`; the
  sha256 is filled by `check:content` once the render exists (write `""` now).
- Shared files: `701-703` and `704-706` map three symbols to one render each;
  record `artwork.condiviso: "701-703"`.

---

## Done Criteria

1. `npm run parse:isom` writes one entry per symbol line in §3.1 – 3.5 and 3.7;
   the printed count matches a hand count recorded in the script header.
2. `204 Masso (P)` has `geometria: "P"`, `sezione: "rocce"`, and a description
   ending at its *Colore:* line, byte-identical to the source.
3. Section headings are not entries; §3.6 numbers appear in `content/esclusi/isom.json`.
4. Two runs produce no diff.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Stories served: S-004, S-005, S-008, S-009 (F-007). Module: contenuti.
