# 003 — Success Criteria

**Level:** 1 — Vision & Scope
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-problem-statement.md), [002](002-target-users.md)
**Enforced by:** criterion 3 by a content check that diffs each deck against the inventory extracted from its source; the others by observation

## The Spec

v1 has worked when all five hold:

1. **Zero-friction start.** From opening the URL on a phone to answering the
   first card takes under ten seconds, with no login and no setup.
2. **Immediate verdict.** Every quiz answer gets a right / wrong verdict at
   once, and a wrong guess shows the right answer.
3. **Complete decks.** Every pictogram in columns C – H of [S3], and every
   symbol in the memorisable sections of [S1], is a card. A deck is not done
   until a script confirms it matches the source inventory.
4. **It gets used.** Within a month of launch at least two family members
   have completed a quiz — observed by asking them, because the site tracks
   nothing.
5. **One-file corrections.** Fixing a symbol's name or adding a symbol is an
   edit to a content file and a redeploy. No code change.

## The Reasoning

The obvious criterion — "a learner scores 90 % after four weeks" — needs
stored progress to measure, and stored progress is out of scope
([004](004-scope-boundaries.md)). We chose criteria we can observe without
building measurement infrastructure. The family can see the score at the end
of every quiz anyway; whether it goes up over the weeks is something they
will notice before any dashboard would.

Criterion 3 is the one that bites. A deck with a missing symbol is worse
than no deck, because the learner trusts it to be complete. The source
inventories are extractable from the converted text in `sources/`, so the
check is cheap to write and is written before the first deck is called done.

Criterion 5 is the curator's criterion. It is what keeps the product alive
after the first month: if a correction costs a code change, corrections stop
happening.

### Options Considered

1. **Learning-outcome criteria** — score over time, symbols mastered. Right
   in principle, unmeasurable without progress storage. Deferred with it.
2. **Observable-behaviour criteria** — frictionless, complete, used,
   maintainable. Measurable now. **Chosen.**
3. **No criteria** — "we'll know". The brief is small enough that this is
   tempting, and it is how small products quietly stop being used.

### The Challenge

*Criterion 4 is weak: "used" is not "learned".* Accepted. v1's job is to
exist and be frictionless; whether it teaches is v2's question, and v2 gets
the progress storage that makes it answerable. If after a month nobody has
finished a quiz, no learning criterion would have helped.

## Change Log

- 2026-09-05 — confirmed by the founder. Criterion 3 no longer names [S2], deferred by 004.
