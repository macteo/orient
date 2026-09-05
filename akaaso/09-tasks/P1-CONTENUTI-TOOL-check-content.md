# P1-CONTENUTI-TOOL-check-content — The content check: schemas, inventories, checksums, determinism

## Objective

Replace the `scripts/check-content.ts` stub with the real check that CI and the
curator run: validate every `content/*.json` against its schema, diff each
deck's inventory against the source text, verify artwork files exist and match
their recorded checksums, and (when the rows file exists) regenerate the rows
with the recorded count and seed and diff. Exit 1 on any finding, naming the
source page. Ship fixtures that break each rule and a test that proves the check
reports them. Spec: `akaaso/04-features/007-estrazione-contenuti.md`,
`akaaso/01-vision/003-success-criteria.md` criterion 3.

---

## Specification

### Deliverables

- `scripts/check-content.ts` (node, no deps beyond `node:*`): a structural JSON
  Schema validator good enough for the project's schemas (types, required,
  enum, additionalProperties, items, pattern), or vendor a tiny one.
- Checks, each printing `OK <name>` or `BROKEN <name>: <detail> (S3 p. N)`:
  1. **schema** — every file under `content/**.json` has a matching
     `content/schema/<kind>.schema.json` and validates.
  2. **inventario descrizioni** — refs parsed from
     `akaaso/sources/iof_descrizioni_punti_ital.md` (same regex as the parser,
     import it from `scripts/parse/_text.ts`) minus `esclusi.json` ==
     refs in `descrizioni-punti.json`; report missing/extra with the page.
  3. **inventario isom** — same for §3.1 – 3.5, 3.7 of the ISOM text.
  4. **artwork** — every `artwork.path` exists; sha256 matches; for isom fill
     the sha into the JSON if it is `""` (the parser leaves it empty) — this is
     the one write the check performs, and only locally (skip write in CI when
     `CI=1`, fail instead).
  5. **esempi** — count equals the number of description strings on pages
     17 – 28 of the text; three PNGs per entry exist.
  6. **righe** — every cell ref exists in the right column; official rows: 9,
     sentences equal the page-3 strings; generated: regenerate with the
     header's `count`/`seed` into a temp file and diff byte-for-byte (skip with
     `- skipped: generate.json absent` before the generator task lands).
  7. **compatibilita** — every ref exists.
- `scripts/check-content.test.ts` (Vitest, node environment) with fixtures under
  `scripts/fixtures/content-broken/`: a symbol missing, a wrong checksum, a row
  citing an unknown ref, a hand-edited generated row; each fixture must make the
  check exit 1 with a message naming the case; the real `content/` must pass.
- Update `package.json` test config so this test runs in `npm test`.

---

## Done Criteria

1. `npm run check:content` on the committed content prints only `OK` lines and
   exits 0; with `CI=1` it never writes.
2. Each fixture under `scripts/fixtures/content-broken/` makes the check exit 1
   with a message that names the broken item and the source page; `npm test`
   asserts all four.
3. Deleting one entry from `descrizioni-punti.json` locally makes the check
   fail with `manca <rif> (<nome>), S3 p. <n>`.
4. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on both parsers, both extractors and the fonti/sezioni data (their
  files must exist to be checked). The generated-rows regeneration check is
  wired now and activates when `generate.json` appears.
- Stories served: S-004, S-005, S-008, S-009 (F-007). Module: contenuti.
