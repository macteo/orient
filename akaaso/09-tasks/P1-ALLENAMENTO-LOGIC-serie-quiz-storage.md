# P1-ALLENAMENTO-LOGIC-serie-quiz-storage — Pure run logic, quiz options and storage, with unit tests

## Objective

Implement the framework-free logic modules the run screens use: the run
reducer (`serie.ts`), quiz option building and scoring (`quiz.ts`), the two
versioned `localStorage` keys (`storage.ts`), and a seeded RNG honoured only in
test builds. Everything is pure TypeScript with Vitest tests; no DOM. Specs:
`akaaso/04-features/002-serie-di-flash-card.md`, `003-quiz.md`,
`010-risultati.md`; `akaaso/02-architecture/003-data-and-content.md`.

---

## Specification

### Deliverables

- `src/mazzi/tipi.ts` — the `Carta`, `MazzoBuild`, `Serie`, `Risultato` types
  (from `_context.md` and F-006's `MazzoBuild`).
- `src/allenamento/rng.ts` — `makeRng(seed?: number)`: mulberry32 when a seed is
  given; `Math.random` otherwise. `seedFromQuery(search: string)` returns the
  `seme` param **only if** `import.meta.env.VITE_TEST_SEED === '1'`, else
  `undefined`.
- `src/allenamento/serie.ts` — pure functions over `Serie`:
  `avvia({ mazzo, sezioni, modo, direzione, carte: cardIds, dimensione, rng })`
  (shuffle, take N or all), `gira`, `valuta(esito)` (appends to `risposte`,
  pushes a first-pass miss to `coda`; a second miss is not re-queued),
  `prossima` (serves `coda` after the last card), `completata(serie)`,
  `risultato(serie, adesso): Risultato` (`viste` = first-pass count,
  `giuste` = first-pass hits, `sbagliate` = first-pass misses in order,
  `ripasso` flag carried from the run), `daRipasso(risultato)` builds a run
  from the misses.
- `src/allenamento/quiz.ts` — `opzioni(carta, mazzo, rng)`: 4 distinct ids,
  distractors from the same section (needs ≥ 3 others), else same column
  (control descriptions) or the deck; never the same `nome` twice; the answer
  position uniform. `verdetto(carta, scelta)`.
- `src/allenamento/storage.ts` — `leggiSerie()`, `scriviSerie(s)`, `pulisciSerie()`,
  `leggiRisultati()`, `aggiungiRisultato(r)` (cap 50 per deck, oldest evicted),
  `cancellaTutto()`, `ultimoRisultato(mazzo)`. Keys `orient.serie.v1`,
  `orient.risultati.v1`; every access in try/catch; a value with the wrong `v`
  or unparsable JSON is discarded and treated as absent; `disponibile()`
  reports whether storage works.
- Tests in `src/allenamento/*.test.ts` covering F-002 AC-1, AC-3, AC-4 logic,
  F-003 AC-1, AC-2, AC-5, F-010 AC-4, AC-6, and: seeded runs are reproducible;
  without the env flag the query seed is ignored.

### Business rules

- Timestamps to the minute (`YYYY-MM-DDTHH:mm`), no finer.
- Card order in a run is the shuffle order; replay order is miss order.
- Storage never throws to callers.

---

## Done Criteria

1. `npm test` passes ≥ 25 tests covering the listed criteria; a test proves
   that over 1 000 generated questions the answer index distribution is
   uniform within 5 %.
2. A run of 8 from 20 cards yields 8 distinct ids; `tutte` yields every card
   once before any replay; a replayed card graded wrong again is not re-queued.
3. With a throwing storage (mocked `localStorage` getter), every storage
   function returns the empty value and nothing propagates.
4. `seedFromQuery('?seme=7')` returns 7 only when `VITE_TEST_SEED=1` is set in
   the test env, `undefined` otherwise.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- No DOM here; the UI tasks import these modules.
- Stories served: S-001 … S-006 (F-002, F-003, F-010). Module: allenamento.
