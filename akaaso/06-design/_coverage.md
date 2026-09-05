# Level 6 Coverage

**Screens:** 5 · **Routes designed:** 5/5 · **Story variants with a designed state:** all · **Components with a contract:** 10/10 · **Composites exercised:** 3 of 3
**Gate:** ✅ no orphans — approval pending

## Screens × Stories

| D-ID | Screen | Route | Stories | Features |
|------|--------|-------|---------|----------|
| D-001 | Home — scelta del mazzo e delle sezioni | R-001 | S-001, S-002, S-003, S-004, S-005, S-006, S-008 | F-001, F-010 |
| D-002 | Serie di flash card | R-002 | S-001, S-002, S-003, S-004 | F-002, F-004 |
| D-003 | Quiz | R-003 | S-002, S-003, S-005 | F-003, F-004 |
| D-004 | Risultati | R-004 | S-001, S-002, S-003, S-004, S-005, S-006 | F-010, F-004 |
| D-005 | Fonti e licenze | R-005 | S-007 | F-005 |

## Routes × Screens

| Route | Named in | Screen |
|-------|----------|--------|
| R-001 `/` | F-001, S-001…S-006, S-008 | D-001 |
| R-002 `/[mazzo]/flashcard/` | F-002, S-001…S-004, S-007 | D-002 |
| R-003 `/[mazzo]/quiz/` | F-003, S-002, S-003, S-005 | D-003 |
| R-004 `/[mazzo]/risultati/` | F-010, S-001…S-006 | D-004 |
| R-005 `/fonti/` | F-005, S-007 | D-005 |

## Story variants × designed states

| Story | Variant declared | Screen | State | Artboard |
|-------|------------------|--------|-------|----------|
| S-001 | retro | D-002 | retro | ✅ `[mazzo].flashcard.retro.dc.html` |
| S-001 | ripresa | D-002 | ripresa | ✅ `[mazzo].flashcard.ripresa.dc.html` |
| S-001 | empty | D-002 | empty | ✅ `[mazzo].flashcard.empty.dc.html` |
| S-001 | invalid-input | D-002 | invalid-input | ✅ `[mazzo].flashcard.invalid-input.dc.html` |
| S-001 | error | D-004 | error | ✅ `[mazzo].risultati.error.dc.html` |
| S-002 | verdetto | D-003 | verdetto | ✅ `[mazzo].quiz.verdetto.dc.html` |
| S-002 | nessun-errore | D-004 | nessun-errore | ✅ `[mazzo].risultati.nessun-errore.dc.html` |
| S-002 | Reverse direction | D-003 | inversa | ✅ `[mazzo].quiz.inversa.dc.html` |
| S-002 | ripresa | D-003 | ripresa | ✅ `[mazzo].quiz.ripresa.dc.html` |
| S-002 | invalid-input | D-003 | invalid-input | ✅ `[mazzo].quiz.invalid-input.dc.html` |
| S-002 | ripasso (step 7) | D-004 | ripasso | ✅ `[mazzo].risultati.ripasso.dc.html` |
| S-003 | empty | D-002 | empty | ✅ shared with S-001 |
| S-003 | inversa (step 7) | D-003 | inversa | ✅ shared |
| S-006 | empty | D-004 | empty | ✅ `[mazzo].risultati.empty.dc.html` |
| S-006 | conferma-cancellazione | D-004 | conferma-cancellazione | ✅ `[mazzo].risultati.conferma-cancellazione.dc.html` |
| S-006 | error | D-004 | error | ✅ shared |
| all | loading, permission-denied | — | — | not applicable (S-001: content compiled in, no permissions) |

## Components × Screens

| Component | Contract present | Screens |
|-----------|------------------|---------|
| Button | ✅ | D-001, D-002, D-003, D-004, D-005 |
| Progress | ✅ | D-002, D-003, D-004 |
| Badge | ✅ | D-002, D-004, D-005 |
| Alert | ✅ | D-002, D-003, D-004 |
| Card | ✅ | D-001, D-004, D-005 |
| ListGroup | ✅ | D-004 |
| Checkbox | ✅ | D-001 |
| FacciaCarta (orient composite) | ✅ | D-002, D-003, D-004 |
| RigaDescrizione (orient composite) | ✅ | D-002, D-003 |
| Verdetto (orient composite) | ✅ | D-003 |

Composite coverage: 3 of 3 exercised (FacciaCarta on three screens,
RigaDescrizione on two, Verdetto on one).

## Orphans

| Item | Type | Resolution |
|------|------|------------|
| — | — | none |
