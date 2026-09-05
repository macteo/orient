# Level 4 — Features

**Status:** Signed off 2026-09-05

Level 3 fixed what the content is and where code runs; this level says
what each piece does, precisely enough for stories to trace through and
tasks to be cut. Ten features, five routes. The founder's draft in Claude
Design ([S6]) was read as the reference for behaviour wherever Level 1
was silent — cards per run, the segmented control, the verdict panel, the
review list — and each such reading is an acceptance criterion here, not a
default left to an agent.

## Features

| F-ID | File | Feature | Module | Status |
|------|------|---------|--------|--------|
| F-001 | [001](001-scelta-mazzo-e-sezioni.md) | Scelta del mazzo e delle sezioni | sito | Confirmed |
| F-002 | [002](002-serie-di-flash-card.md) | Serie di flash card | allenamento | Confirmed |
| F-003 | [003](003-quiz.md) | Quiz | allenamento | Confirmed |
| F-004 | [004](004-facce-delle-carte.md) | Facce delle carte | allenamento | Confirmed |
| F-005 | [005](005-pagina-fonti.md) | Pagina fonti | sito | Confirmed |
| F-006 | [006](006-mazzi-a-build.md) | Mazzi a build | mazzi | Confirmed |
| F-007 | [007](007-estrazione-contenuti.md) | Estrazione contenuti | contenuti | Confirmed |
| F-008 | [008](008-generatore-di-righe.md) | Generatore di righe | contenuti | Confirmed |
| F-009 | [009](009-ci-e-deploy.md) | CI e deploy | sito (infrastructure) | Confirmed |
| F-010 | [010](010-risultati.md) | Risultati | allenamento | Confirmed |

Routes: [_routes.md](_routes.md) — R-001 `/`, R-002 `/[mazzo]/flashcard/`,
R-003 `/[mazzo]/quiz/`, R-004 `/[mazzo]/risultati/`, R-005 `/fonti/`.

**Path versus query, applied.** A run is one screen per mode; result and
history are one screen per deck; the review of a miss is a state of the
results screen. Sections, size, direction and the *ripasso* flag are query.
Every state a Level 6 artboard will need is named in the feature's
*States* section, including the ones outside the six canonical tokens
(`retro`, `verdetto`, `ripresa`, `nessun-errore`, `ripasso`,
`conferma-cancellazione`), each with the story variant that will declare it.

## Open Questions

None. The four details asked on 2026-09-05 were confirmed the same day:
cards-per-run chips 8 · 12 · 23 · tutte (F-001); a miss replays once and a
second miss does not re-queue (F-002); fifty runs kept per deck (F-010);
deck order descrizioni-simboli, descrizioni-complete, esempi, isom (F-001).

## Level Review

- **Summary of everything decided:** ten features on five routes. The
  home configures a run (deck, sections, mode, direction, size) and shows
  the last score per deck; two run screens share a persisted, resumable
  run engine and differ in the exercise (flip and self-grade versus four
  options and a verdict); one component family renders the four card
  types at three sizes, with the description row drawn in HTML and pinned
  to the printed grid by a pixel test; a results screen per deck holds the
  last run, the misses with inline review and replay, the history and the
  clear action; an attribution page is generated from the licence
  register. Three build-time or curator-side features carry the content
  work: deck assembly and page generation, the four extraction commands
  with their check and contact sheets, and the prefix-stable row
  generator. One infrastructure feature holds the workflow and the three
  scans over the built output.
- **Tensions surfaced between decisions:** none new. The path-versus-query
  line was drawn once, in the index, and every feature follows it; the
  results storage amendment (T2) is what lets R-004 exist.
- **Improvements applied to the level as a whole:** every screen's states
  are named in the feature, including six beyond the canonical vocabulary,
  so Level 6 derives its artboards rather than inventing them; every
  acceptance criterion names the test that proves it; the four readings
  taken from the founder's draft (size chips, replay policy, history cap,
  deck order) were put to the founder in plain words and confirmed rather
  than left as defaults.
- **Sign-off:** founder, 2026-09-05 — "ok, signoff su livello 3 e feature",
  then the four details confirmed one by one.

[S6]: <https://claude.ai/design/p/c9a24f16-5b6a-4e90-a8d8-8cd508302a1b?file=Orient.dc.html>
