# P1-CONTENUTI-DATA-compatibilita — Compatibility table for generated rows

## Objective

Write `content/compatibilita.json`, the hand-kept rules the row generator uses:
which column-E appearances the source allows for each column-D feature, which
features carry a dimension and of what kind, which column-G positions need one
or two features, and the two combination symbols' requirements. Every entry
cites the source line it comes from. Spec:
`akaaso/03-modules/004-pipeline-descrizioni-righe.md` items 2 – 6.

---

## Specification

### Deliverables

- `content/compatibilita.json`:
  ```json
  { "v": 1, "sorgente": "S3",
    "E": { "<D rif>": ["<E rif>", ...] },          // allowed appearances per feature
    "F": { "<D rif>": { "tipo": "altezza"|"dimensioni"|"profondita", "valori": ["1.0","1.5","2.0"] } },
    "Gdue": ["11.15"],                            // positions needing two features
    "combinazioni": ["10.1", "10.2"],            // column F symbols needing a second D in E
    "Gsolo": ["11.1", "11.2", ...],
    "C": { "direzioni": ["0.1", "0.2"], "senza": ["0.3", "0.4", "0.5"] },
    "note": { "<D rif>": "usato con 8.6 per indicare una collinetta rocciosa (S3 p. 7)" } }
  ```
- `content/schema/compatibilita.schema.json`.

### Rules for filling it

- Read every `descrizione` in `content/simboli/descrizioni-punti.json` for
  "Usato con il simbolo 8.x" / "insieme a" and the column E and F intro text
  (S3 pages 4 – 5, 11 – 12). Where the source is silent, allow the *generic*
  appearances (`8.1 basso`, `8.2 poco profondo`, `8.3 profondo`, `8.4 ricoperto
  di vegetazione`, `8.5 aperto`, `8.6 roccioso`, `8.7 paludoso`, `8.8 sabbioso`,
  `8.9 di aghi`, `8.10 di latifoglie`, `8.11 rovinato` — use the refs as parsed)
  only for features where they make physical sense (a boulder can be *rocky*
  is redundant → exclude; a pit can be *deep*; a ruin can be *ruined*? no).
  Keep the table conservative: fewer, sensible combinations.
- Dimensions: `altezza` for boulder, cliff, tower, wall, fence, tree,
  building, cairn… (values `0.5`–`3.0` in 0.5 steps as the source examples use,
  e.g. `1.0`, `2.0`); `dimensioni` for pits, thickets, clearings, buildings
  (`5x5`, `8x4`, `10x6`); `profondita` for depressions/pits where the source
  says so.
- Every `note` cites page and, where possible, the quoted words.

---

## Done Criteria

1. The file validates; every `rif` in it exists in `descrizioni-punti.json` in
   the right column.
2. `E` covers every column-D feature (an empty array is a valid, deliberate
   "no appearance").
3. A reviewer reading `note` can find each cited line in the source text.
4. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on `P1-CONTENUTI-TOOL-parse-descrizioni`.
- Stories served: S-003, S-008 (F-008). Module: contenuti.
