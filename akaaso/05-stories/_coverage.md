# Level 5 Coverage

**Stories:** 9 (spine: 3, secondary: 6)
**Features covered:** 10/10 · **Modules covered:** 4/4
**Gate:** ✅ full coverage — pending sign-off

## Features × Stories

| F-ID | Feature | Stories | In a spine story? |
|------|---------|---------|-------------------|
| F-001 | Scelta del mazzo e delle sezioni | S-001, S-002, S-003, S-004, S-005, S-006, S-008 | yes |
| F-002 | Serie di flash card | S-001, S-002, S-003, S-004 | yes |
| F-003 | Quiz | S-002, S-003, S-005 | yes |
| F-004 | Facce delle carte | S-001, S-002, S-003, S-004, S-005 | yes |
| F-005 | Pagina fonti | S-007 | no — secondary by nature |
| F-006 | Mazzi a build | S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008 | yes |
| F-007 | Estrazione contenuti | S-004, S-005, S-008, S-009 | no — curator-side; its outputs are exercised by every spine story |
| F-008 | Generatore di righe | S-003, S-008 | yes (S-003 consumes its output) |
| F-009 | CI e deploy | S-007, S-008, S-009 | no — infrastructure; every spine E2E runs inside it |
| F-010 | Risultati | S-001, S-002, S-006 | yes |

## Modules × Stories

| Module | Stories |
|--------|---------|
| sito | S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009 |
| allenamento | S-001, S-002, S-003, S-004, S-005, S-006 |
| mazzi | S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008 |
| contenuti | S-003, S-004, S-005, S-008, S-009 |

## APIs & Pages

| Endpoint / page | Stories | Note |
|-----------------|---------|------|
| (no API) | — | not user-facing: the product has no endpoints ([2.004](../02-architecture/004-api-design.md)) |
| R-001 `/` | S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008 | |
| R-002 `/[mazzo]/flashcard/` | S-001, S-002, S-003, S-004 | |
| R-003 `/[mazzo]/quiz/` | S-002, S-003, S-005 | |
| R-004 `/[mazzo]/risultati/` | S-001, S-002, S-003, S-004, S-005, S-006 | |
| R-005 `/fonti/` | S-007 | |
| `localStorage.orient.serie.v1` | S-001, S-002, S-003, S-006 | data source |
| `localStorage.orient.risultati.v1` | S-001, S-002, S-003, S-004, S-005, S-006 | data source |

## Story variants × states declared (input to Level 6)

| Screen (route) | States declared by stories |
|---|---|
| R-001 | `default` |
| R-002 | `default`, `retro`, `ripresa`, `empty`, `invalid-input` (S-001, S-003, S-004) |
| R-003 | `default`, `inversa`, `verdetto`, `ripresa`, `invalid-input`, `empty` (S-002, S-003, S-005) |
| R-004 | `default`, `nessun-errore`, `ripasso`, `conferma-cancellazione`, `empty`, `error` (S-001, S-002, S-006) |
| R-005 | `default` (S-007) |

`loading` and `permission-denied` are declared not applicable by S-001
and inherit to every screen: content is compiled in and no permission
exists.

## Orphans

| Item | Type | Resolution |
|------|------|------------|
| — | — | none |
