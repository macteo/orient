# Level 1 — Vision & Scope

**Status:** Signed off 2026-09-05

The brief arrived in one paragraph: something like Orisym, in Italian, built
on the IOF and ISOM references supplied as PDFs; a simple website that
generates quizzes and flash cards and says whether a guess was right; for
family use; online is fine. The six decisions below turn that paragraph into
a spec, and the founder's answers of 2026-09-05 fixed the four details the
proposals had left open. Technology waits for Level 2.

## Decisions

| # | Decision | Status | One-line outcome |
|---|----------|--------|------------------|
| [001](001-problem-statement.md) | Problem Statement | Confirmed | A simple website that drills the Italian control-description and ISOM references as cards and quizzes with a verdict, for one family |
| [002](002-target-users.md) | Target Users | Confirmed | Two personas: the family learner (no login) and the curator (edits files); everyone assumed able to read the source definitions |
| [003](003-success-criteria.md) | Success Criteria | Confirmed | Ten-second start, immediate verdict, complete decks checked against source, actually used, one-file corrections |
| [004](004-scope-boundaries.md) | Scope Boundaries | Confirmed | Two decks (descrizioni dei punti, ISOM), section filter, flash-card and quiz modes, verbatim Italian, attribution page; ISSprOM, accounts, progress, coach views, other content deferred |
| [005](005-constraints.md) | Constraints | Confirmed | Solo, static hosting, website, two sources in v1, CC BY-ND respected, [S3] licence risk accepted (T1), Italian UI and content, no personal data |
| [006](006-prior-art-and-differentiator.md) | Prior Art & Differentiator | Confirmed | Orisym is the reference shape; the differentiator is verbatim Italian, current editions, zero friction |

Sources: [S1] ISOM 2017-2 CH IT, [S2] ISSprOM 2019-2 IT (deferred), [S3]
Descrizioni dei punti IOF — see [registers/SOURCES.md](../registers/SOURCES.md).

## Open Questions

None at this level. The four asked on 2026-09-05 were answered the same day:

- Reading level — definitions verbatim, everyone assumed able to read them
  (002, 004).
- ISSprOM — out of v1, deferred (004).
- [S3] licence — risk accepted for family use (005, T1).
- Language — spec in English, interface and content in Italian (005).

## Level Review

- **Summary of everything decided:** orient is a static, Italian-language
  website for one family. Two decks — the IOF control descriptions
  ([S3], columns C – H and §13) and the ISOM 2017-2 forest symbols
  ([S1], §3.1 – 3.5 and 3.7) — filterable by section, drilled in two modes:
  flash cards with self-grading and a replay of misses, and four-option
  quizzes with an immediate verdict and an end score, in both directions.
  Names and definitions are reproduced verbatim from the sources. No login,
  no persistence, no personal data of any kind. The two map specifications
  are CC BY-ND and are used within that licence; the control descriptions
  document is unlicensed and the founder accepts the risk for family use.
  Success is observed, not measured: a ten-second start, a verdict on every
  answer, decks proven complete by a script, two family members finishing a
  quiz in the first month, corrections that are a file edit.
- **Tensions surfaced between decisions:** one. T1, the public site versus
  the unlicensed [S3] artwork, resolved for v1 by
  [005](005-constraints.md) with the risk accepted and two exits named
  (render from the pictogram font if it is free; redraw otherwise). No
  tension between the six decisions themselves: the verbatim rule in
  [004](004-scope-boundaries.md) is required by the licence in
  [005](005-constraints.md) and by the founder's own instruction, and the
  no-personal-data rule in 005 is what lets 002 admit children without a
  consent flow.
- **Improvements applied to the level as a whole:** the founder's four
  answers were applied across all six files rather than only where asked —
  003's completeness criterion, 005's content list and 006's differentiator
  all named the sprint deck and were corrected the same day. Every decision
  carries a change-log line for it. Two rules now have enforcement
  mechanisms named in advance: deck completeness (a diff script against the
  source inventory) and no personal data (a task done-criterion plus an
  origin-only request check); Level 2 pins the exact tooling.
- **What Level 2 inherits:** a website with no server, no database and no
  auth to design; a content pipeline that must extract artwork from two
  PDFs (Level 3); an Italian interface; and two enforcement mechanisms to
  make concrete. Most of Level 2's ten required decisions will be short.
- **Sign-off:** founder, 2026-09-05 — "vai", together with the Level 2 answers.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S2]: <../sources/ISSprOM_2019-2_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
