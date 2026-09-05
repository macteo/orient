# P1-E2E-journey-prima-serie-di-flash-card — @critical journey test for S-001

## Objective

Transcribe story S-001 (`akaaso/05-stories/001-prima-serie-di-flash-card.md`) — its Journey Steps,
Variants and Expected Outcomes — into a Playwright journey spec that runs
against `vite preview` with the test seed, and make it green. The story is
`traced`: every step names the screen (D-###) and the affordance; use those
affordances as selectors (button text, link text, ARIA labels), never invented
ones.

---

## Specification

### Deliverables

- `e2e/journeys/prima-serie-di-flash-card.spec.ts` tagged `@critical`, one `test` per
  journey plus one per applicable Variant (the story's table), with step
  comments `// step N — <affordance>` mirroring the Journey Steps rows.
- Seeding: empty storage unless the story says otherwise; the run seed via
  `?seme=<n>` (build with `VITE_TEST_SEED=1` in the Playwright web server
  command, or a `preview:test` npm script); fixtures from
  `akaaso/05-stories/fixtures/S-001/` copied to `e2e/fixtures/` when the
  folder exists.
- Assertions on the observable outcomes listed in the story: texts (Italian,
  verbatim), counts, the two storage keys' contents (read via
  `page.evaluate`), the URL after each transition, and a request log
  asserting no off-origin request.
- Register the test name **journey-prima-serie-di-flash-card** in `e2e/README.md` (create if absent)
  with its story id.

### Pages crossed

home, flashcard, risultati. Features exercised: F-001, F-002, F-004, F-006, F-010.

---

## Done Criteria

1. `npm run e2e -- --grep @critical` runs this journey green on the built
   site under `VITE_BASE=/orient/` and under `/`.
2. Every Journey Step of S-001 corresponds to a step in the spec, in order,
   using the affordance text as the selector; every applicable Variant has a
   test.
3. The Expected Outcomes hold (storage contents, texts, URLs) and the request
   log shows only same-origin requests.
4. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Selectors: prefer `getByRole('button', { name: 'Lo sapevo' })` and
  `getByText` with the exact Italian strings from the screen specs' Content
  rules. Do not change application code to make a test pass; report a
  mismatch as a finding instead.
- Depends on every impl task of the features above. Story: S-001 (spine).
  Module: Cross-cutting.
