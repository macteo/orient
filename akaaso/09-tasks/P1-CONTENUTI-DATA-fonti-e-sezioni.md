# P1-CONTENUTI-DATA-fonti-e-sezioni — Licence register, deck sections and licence texts

## Objective

Write the hand-kept content files that need no extraction: the licence register
`content/fonti.json` (six sources), the deck/section registry
`content/sezioni.json`, the licence texts under `content/licenze/`, and the
JSON schemas for both files. Specs: `akaaso/03-modules/008-security-compliance-and-recovery.md`
(table), `akaaso/04-features/006-mazzi-a-build.md` (deck table),
`akaaso/04-features/005-pagina-fonti.md`.

---

## Specification

### Deliverables

- `content/fonti.json` — `{ v: 1, fonti: Fonte[] }` with exactly these ids in
  order: `s3-descrizioni`, `s4-purple-pen`, `s1-isom`, `s5-isom-illustrazioni`,
  `preline`, `fonts`. Fields per `_context.md`; `attribuzione` sentences and
  `cosaUsiamo` in Italian, as drafted in the D-005 artboard
  (`akaaso/06-design/_artboards/fonti.dc.html`, `FN_JS` data) — copy them.
- `content/licenze/purple-pen-bsd.txt` (copy of `sources/svg-control-descriptions/PURPLE-PEN-LICENSE.txt`),
  `content/licenze/preline-mit.txt` (from `node_modules/preline/LICENSE` if
  present, else the MIT text with "Preline Labs"), `content/licenze/ofl-1.1.txt`
  (from the fontsource package or the SIL OFL text), `content/licenze/cc-by-nd-4.0.md`
  (a short pointer to the licence URL, not the full deed).
- `content/sezioni.json` — `{ v: 1, mazzi: [{ id, nome, tipo, fonte, ordine, sezioni: [{ id, etichetta, ordine }] }] }`
  for the four decks and their sections exactly as F-006's table lists them
  (`descrizioni-simboli`: colonna-c, d-morfologici, d-rocce, d-idrografia,
  d-vegetazione, d-costruzioni, d-particolari, colonna-e, colonna-f, colonna-g,
  colonna-h, istruzioni; `descrizioni-complete`: ufficiali + the six D
  families; `esempi`: the six D families; `isom`: forme, rocce, acqua,
  vegetazione, opere, tracciato). Italian labels: `Colonna C – Quale degli
  oggetti simili`, `Oggetti morfologici`, `Rocce e sassi`, `Idrografia`,
  `Vegetazione`, `Costruzioni`, `Oggetti particolari`, `Colonna E – Informazioni
  complementari`, `Colonna F – Combinazioni`, `Colonna G – Posizione della
  lanterna`, `Colonna H – Altre informazioni`, `Istruzioni speciali`,
  `Ufficiali (pagina 3)`, `3.1 Forme del terreno`, `3.2 Rocce e sassi`,
  `3.3 Acqua e paludi`, `3.4 Vegetazione`, `3.5 Opere dell'uomo`,
  `3.7 Simboli di tracciamento percorsi`.
- `content/schema/fonti.schema.json`, `content/schema/sezioni.schema.json`
  (JSON Schema draft 2020-12, `additionalProperties: false`).

---

## Done Criteria

1. Both JSON files validate against their schemas with a one-line Node check
   the agent runs (`ajv` is not a dependency — write a 20-line structural
   validator or use `node --test` assertions) and print 6 sources / 4 decks.
2. Every source in the register has a licence text file or URL that resolves.
3. Section ids match the parsers' `sezione` ids character for character (the
   set above is the contract).
4. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Stories served: S-007 (F-005) and S-001 … S-008 (F-006). Module: contenuti.
