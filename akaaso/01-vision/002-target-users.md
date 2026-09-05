# 002 — Target Users

**Level:** 1 — Vision & Scope
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-problem-statement.md)
**Enforced by:** —

## The Spec

Two personas, no more.

- **P1 — Learner.** A member of the family, adult or child, Italian-speaking,
  who practises orienteering and wants to recognise symbols. Opens the site
  on a phone, sometimes a laptop, for a few minutes at a time. No account, no
  login, nothing to set up.
- **P2 — Curator.** Matteo, who maintains the site and its content. Edits
  content files in the repository; there is no admin interface.

Nobody else: no coach, no club, no public audience — even though the URL is
public.

**Reading level:** every learner is assumed able to read the source
definitions as written. The card back shows them verbatim; there is no
simplified wording and no child mode. Settled by the founder on 2026-09-05.

## The Reasoning

"In famiglia" is unusually precise for a brief: it fixes the number of users
to a handful, the language to one, and the trust model to complete — nobody
needs protecting from anybody else, so there is nothing to authenticate.

A family is also mixed-age. Children as users push in two directions we
accept now rather than discover later: the interface needs big targets and
few words, and the site must collect nothing about who uses it
([005](005-constraints.md)). We asked whether the youngest would need the
definitions simplified; the answer was no — show them as the source writes
them and assume everyone can follow. That closes the reading-level question
and, with it, any second difficulty level ([004](004-scope-boundaries.md)).
It also happens to be what the licence requires ([005](005-constraints.md)).

### Options Considered

1. **Family only** — a handful of known people. Everything stays small.
   **Chosen.**
2. **The club** — the family's orienteering club as the audience. Brings
   categories, groups, a coach who wants to see progress: exactly the
   features the brief refuses.
3. **Italian orienteers at large** — a public product. Brings support,
   feedback, App Store or SEO work, and a licence question that can no longer
   be waved at.

Options 2 and 3 are deferred, not rejected. Nothing in v1 prevents them — a
URL is a URL — but nothing is designed for them either.

### The Challenge

*If the site is public anyway, why not design for the club from the start?*
Because the club brings requests, and every request is a feature, and the
brief's "molto semplice" is the thing we would lose first. The URL being
public is a side-effect of "online su un sito", not a promise to anyone.
Family-first keeps v1 the size of a weekend.

## Change Log

- 2026-09-05 — confirmed by the founder. The open question on ages closed: definitions shown verbatim, all learners assumed able to read them.
