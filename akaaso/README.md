# orient

A simple Italian website that turns the IOF control-description and ISOM
references into flash cards and quizzes with a verdict, for one family to
memorise orienteering symbols.

**Current focus:** All six levels signed off 2026-09-05; trace pass done. Task unpacking and build next.
**Next step:** `/akaaso-tasks` to unpack tasks, `/akaaso-build` to build in
waves, deploy to GitHub Pages.

## Progress

- [x] Level 1 — Vision & Scope — signed off 2026-09-05
- [x] Level 2 — Architecture & Stack — signed off 2026-09-05
- [x] Level 3 — Modules — signed off 2026-09-05
- [x] Level 4 — Features — signed off 2026-09-05
- [x] Level 5 — Stories & Journeys — first sign-off 2026-09-05 (trace pass after Level 6)
- [x] Level 6 — Screen Design — signed off 2026-09-05
- [x] Level 5 trace pass — S-001…S-007 traced 2026-09-05 (S-008, S-009 have no screens)
- [ ] Tasks unpacked

## Decision Registry

### Level 1 — Vision & Scope

| # | Decision | Status |
|---|----------|--------|
| [001](01-vision/001-problem-statement.md) | Problem Statement | Confirmed |
| [002](01-vision/002-target-users.md) | Target Users | Confirmed |
| [003](01-vision/003-success-criteria.md) | Success Criteria | Confirmed |
| [004](01-vision/004-scope-boundaries.md) | Scope Boundaries | Confirmed |
| [005](01-vision/005-constraints.md) | Constraints | Confirmed |
| [006](01-vision/006-prior-art-and-differentiator.md) | Prior Art & Differentiator | Confirmed |

Sources: [registers/SOURCES.md](registers/SOURCES.md) — three PDFs supplied
with the brief, converted to text in `sources/`; two used in v1, the sprint
specification deferred.

### Level 2 — Architecture & Stack

| # | Decision | Status |
|---|----------|--------|
| [001](02-architecture/001-hosting-and-deployment.md) | Hosting and deployment | Confirmed |
| [002](02-architecture/002-application-architecture.md) | Application architecture | Confirmed |
| [003](02-architecture/003-data-and-content.md) | Data and content | Confirmed |
| [004](02-architecture/004-api-design.md) | API design | Confirmed |
| [005](02-architecture/005-frontend-strategy.md) | Frontend strategy | Confirmed |
| [006](02-architecture/006-design-direction.md) | Design direction | Confirmed |
| [007](02-architecture/007-route-conventions.md) | Route conventions | Confirmed |
| [008](02-architecture/008-authentication-and-authorization.md) | Authentication and authorization | Confirmed |
| [009](02-architecture/009-cicd-and-releases.md) | CI/CD and releases | Confirmed |
| [010](02-architecture/010-observability-and-recovery.md) | Observability and recovery | Confirmed |

### Level 3 — Modules

| # | Decision | Status |
|---|----------|--------|
| [001](03-modules/001-module-map.md) | Module map | Confirmed |
| [002](03-modules/002-data-model.md) | Data model | Confirmed |
| [003](03-modules/003-pipeline-descrizioni-simboli.md) | Pipeline: control-description pictograms | Confirmed |
| [004](03-modules/004-pipeline-descrizioni-righe.md) | Pipeline: full description rows | Confirmed |
| [005](03-modules/005-pipeline-esempi.md) | Pipeline: worked examples | Confirmed |
| [006](03-modules/006-pipeline-isom.md) | Pipeline: ISOM symbols | Confirmed |
| [007](03-modules/007-tooling-and-data-flows.md) | Tooling, data flows, events | Confirmed |
| [008](03-modules/008-security-compliance-and-recovery.md) | Security, compliance, recovery | Confirmed |

### Level 4 — Features

| F-ID | Feature | Module | Status |
|------|---------|--------|--------|
| [F-001](04-features/001-scelta-mazzo-e-sezioni.md) | Scelta del mazzo e delle sezioni | sito | Confirmed |
| [F-002](04-features/002-serie-di-flash-card.md) | Serie di flash card | allenamento | Confirmed |
| [F-003](04-features/003-quiz.md) | Quiz | allenamento | Confirmed |
| [F-004](04-features/004-facce-delle-carte.md) | Facce delle carte | allenamento | Confirmed |
| [F-005](04-features/005-pagina-fonti.md) | Pagina fonti | sito | Confirmed |
| [F-006](04-features/006-mazzi-a-build.md) | Mazzi a build | mazzi | Confirmed |
| [F-007](04-features/007-estrazione-contenuti.md) | Estrazione contenuti | contenuti | Confirmed |
| [F-008](04-features/008-generatore-di-righe.md) | Generatore di righe | contenuti | Confirmed |
| [F-009](04-features/009-ci-e-deploy.md) | CI e deploy | sito | Confirmed |
| [F-010](04-features/010-risultati.md) | Risultati | allenamento | Confirmed |

Routes: [04-features/_routes.md](04-features/_routes.md).

### Level 5 — Stories & Journeys

| ID | Story | Persona | Priority | Status |
|----|-------|---------|----------|--------|
| [S-001](05-stories/001-prima-serie-di-flash-card.md) | Prima serie di flash card sulle descrizioni dei punti | apprendista | spine | traced |
| [S-002](05-stories/002-quiz-con-ripasso-degli-errori.md) | Quiz sulla colonna G e ripasso degli errori con le carte | apprendista | spine | traced |
| [S-003](05-stories/003-righe-complete-in-entrambe-le-direzioni.md) | Descrizioni complete — leggere una riga e riconoscerla dalla frase | apprendista | spine | traced |
| [S-004](05-stories/004-esempi-sul-terreno.md) | Dal terreno alla descrizione — flash card degli esempi | apprendista | secondary | traced |
| [S-005](05-stories/005-simboli-isom-con-annotazioni.md) | Quiz sui simboli ISOM di rocce e sassi | apprendista | secondary | traced |
| [S-006](05-stories/006-storico-e-cancellazione.md) | Storico delle serie e cancellazione dei risultati | apprendista | secondary | traced |
| [S-007](05-stories/007-fonti-e-licenze.md) | Leggere da dove vengono i simboli | apprendista | secondary | traced |
| [S-008](05-stories/008-aggiornare-i-contenuti.md) | Il curatore genera altre righe e ripubblica | curatore | secondary | confirmed |
| [S-009](05-stories/009-deploy-bloccato-da-un-contenuto-rotto.md) | Un contenuto rotto blocca il deploy | curatore | secondary | confirmed |

Coverage: see [05-stories/_coverage.md](05-stories/_coverage.md).

### Level 6 — Screen Design

**Enforcement mode:** strict (read from `06-design/_index.md`).

| D-ID | Screen | Route | Status | artboard_version |
|------|--------|-------|--------|------------------|
| [D-001](<06-design/index.md>) | Home — scelta del mazzo e delle sezioni | `R-001` | approved | v1 |
| [D-002](<06-design/[mazzo].flashcard.md>) | Serie di flash card | `R-002` | approved | v1 |
| [D-003](<06-design/[mazzo].quiz.md>) | Quiz | `R-003` | approved | v1 |
| [D-004](<06-design/[mazzo].risultati.md>) | Risultati | `R-004` | approved | v1 |
| [D-005](<06-design/fonti.md>) | Fonti e licenze | `R-005` | approved | v1 |

This table mirrors the approval table in
[06-design/_index.md](06-design/_index.md), which stays authoritative.
Coverage: see [06-design/_coverage.md](06-design/_coverage.md).

## Open Questions

- [ ] Repository visibility — Pages on a private repo needs a paid plan;
      resolved by the first deploy (Level 2, 001)
- [ ] Custom domain — optional; decides the base path (Level 2, 001 / 007)

## Tensions

- **T2** — the founder asked for results kept in the learner's browser,
  reversing Level 1's "no browser storage". Resolved 2026-09-05 by amending
  1.004 and five dependent decisions; anonymous, on-device, clearable.
- **T1** — a public site reproducing control-description pictograms from a
  source with no licence line, while the two map specs are CC BY-ND.
  Resolved for v1 on 2026-09-05: the founder accepted the risk for family
  use ([005](01-vision/005-constraints.md)); reopens only if the audience
  widens.

Full register: [registers/TENSIONS.md](registers/TENSIONS.md), one row per
tension with what each one blocks. This section is the roll-up; keep the two in
step.
