# Route Registry

**Level:** 4 — Features
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Depends on:** [2.007](../02-architecture/007-route-conventions.md), [2.001](../02-architecture/001-hosting-and-deployment.md)
**Enforced by:** `akaaso-health.py` reports `route-spelling-drift` when two cited paths normalise to one route and `undeclared-route` when a story or screen cites an `R-###` this file does not declare; the link check in [F-010](010-ci-e-deploy.md) verifies every built page sits at one of these paths

This is the single place a route's path is spelled out. Every Level 5
Journey Step, every `pages:` entry and every Level 6 screen `route:` key
cites the `R-###` id, never the path.

Paths follow [2.007](../02-architecture/007-route-conventions.md): Italian
lowercase slugs, a trailing slash on every route, `[mazzo]` as the one
dynamic segment, expanded at build into one folder per deck —
`descrizioni-simboli`, `descrizioni-complete`, `esempi`, `isom`. Query
parameters are state within a screen and never appear in a row:
`?sezioni=` and `?carte=` on the run routes, `?direzione=inversa` on the
quiz, `?ripasso=1` on a run started from the results page.

All paths are relative to the site base (`/orient/` on `github.io`, `/`
under a custom domain); no page writes an absolute path.

## The table

| R-ID  | Route                    | Feature | Notes |
|-------|--------------------------|---------|-------|
| R-001 | /                        | F-001   | home: deck and section picker, mode, last score per deck |
| R-002 | /[mazzo]/flashcard/      | F-002   | a flash-card run; result and review are not here |
| R-003 | /[mazzo]/quiz/           | F-003   | a quiz run, both directions by query |
| R-004 | /[mazzo]/risultati/      | F-010   | last result, history, misses; review is a state of this screen |
| R-005 | /fonti/                  | F-005   | attribution and licences, contact |

Ids are permanent: a route that is removed keeps its id retired rather than
freeing it for reuse. A deck slug that is not one of the four is not a
route; Pages serves its 404 page, which is the platform's own.
