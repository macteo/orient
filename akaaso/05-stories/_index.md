# Level 5 — Stories & Journeys

**Status:** Signed off 2026-09-05; trace pass done 2026-09-05 after Level 6 sign-off — S-001…S-007 `traced`; S-008 and S-009 stay `confirmed` because their journeys cross no screen (CLI and CI)

The horizontal pass. Levels 3 and 4 cut the product by module and feature;
these stories cut across them the way the family will: a first session on
the sofa, a quiz on one column followed by a review of the misses, the
description rows in both directions, the terrain examples, the ISOM
quiz, the history and the clear button, the sources page, and two
curator journeys — growing the deck and being stopped by a broken
content file. Three are spine and become @critical journeys.

## Stories

| ID | Story | Persona | Priority | Status |
|----|-------|---------|----------|--------|
| [S-001](001-prima-serie-di-flash-card.md) | Prima serie di flash card sulle descrizioni dei punti | apprendista | spine | traced |
| [S-002](002-quiz-con-ripasso-degli-errori.md) | Quiz sulla colonna G e ripasso degli errori con le carte | apprendista | spine | traced |
| [S-003](003-righe-complete-in-entrambe-le-direzioni.md) | Descrizioni complete — leggere una riga e riconoscerla dalla frase | apprendista | spine | traced |
| [S-004](004-esempi-sul-terreno.md) | Dal terreno alla descrizione — flash card degli esempi | apprendista | secondary | traced |
| [S-005](005-simboli-isom-con-annotazioni.md) | Quiz sui simboli ISOM di rocce e sassi | apprendista | secondary | traced |
| [S-006](006-storico-e-cancellazione.md) | Storico delle serie e cancellazione dei risultati | apprendista | secondary | traced |
| [S-007](007-fonti-e-licenze.md) | Leggere da dove vengono i simboli | apprendista | secondary | traced |
| [S-008](008-aggiornare-i-contenuti.md) | Il curatore genera altre righe e ripubblica | curatore | secondary | confirmed |
| [S-009](009-deploy-bloccato-da-un-contenuto-rotto.md) | Un contenuto rotto blocca il deploy | curatore | secondary | confirmed |

Personas: [000-personas.md](000-personas.md) — `apprendista`, `curatore`.
Coverage: [_coverage.md](_coverage.md) — every feature, module and route in
at least one story; no orphans. Fixture: `fixtures/S-006/risultati-50.json`.

The trace pass filled `Screen` and `Transition in` on 2026-09-05: every
transition is an affordance listed verbatim in the source screen's
`transitions`; in-screen steps (a flip, a pick, a grade) cite the screen's
self-transitions. The two curator stories have no screen and stay
`confirmed`; their tests are script-level.

## Open Questions

None. Both technical choices were confirmed on 2026-09-05: the RNG seed
parameter exists in test builds only and never on the public site
("non serve far apparire le card sul sito pubblico in modo deterministico");
S-008 and S-009 are verified as script integration tests.

## Level Review

- **Summary of everything decided:** nine stories from two personas
  chain the ten features across the four modules: three spine journeys
  (first flash-card run, quiz with review of misses, description rows in
  both directions) and six secondary ones (terrain examples, ISOM quiz,
  history and clear, sources page, growing the deck, a blocked deploy).
  Every route, feature and module is covered; storage keys are traced as
  data sources; a fifty-run fixture seeds the history story.
- **Tensions surfaced between decisions:** none. The stories confirmed
  that result and review belong to one screen, and that the run must
  survive a reload — both already decided.
- **Improvements applied to the level as a whole:** the states each
  screen needs were collected from the variants into one table in
  `_coverage.md`, so Level 6 derives its artboards from it; `loading` and
  `permission-denied` were declared not applicable once, in S-001, rather
  than omitted silently.
- **Sign-off (first):** founder, 2026-09-05 — "benissimo". The trace
  pass follows Level 6.
