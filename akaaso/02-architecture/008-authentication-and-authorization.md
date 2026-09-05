# 008 — Authentication and Authorization

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.002](../01-vision/002-target-users.md), [1.005](../01-vision/005-constraints.md)
**Enforced by:** the origin-only request check in [009](009-cicd-and-releases.md), which also catches any identity SDK a task might add; a done-criterion on every task that no cookie is written and no storage key other than the two documented in [003](003-data-and-content.md) is touched

## The Spec

- **None.** No accounts, no sessions, no cookies, no identity of any kind.
- Every visitor sees the same site and can do everything the site does.
- Authorization is therefore also none: there is nothing to protect and no
  one to protect it from.

## The Reasoning

Level 1 fixed this twice — the family trusts itself
([1.002](../01-vision/002-target-users.md)) and the site collects no
personal data ([1.005](../01-vision/005-constraints.md)). The decision is
written down so that the first feature request that needs a user ("save my
progress across phones") is recognised as a Level 2 revisit with a hosting
consequence, not a small addition.

### Options Considered

1. **None.** **Chosen.**
2. **A shared family password.** Protects nothing worth protecting and
   adds a screen a child has to get past.

### The Challenge

*The site is public; anyone can use it.* Yes. That is the intended
side-effect of "online su un sito", and there is nothing on it that is
not already public.

## Change Log

- 2026-09-05 (later) — done-criterion amended: the two results keys in localStorage are allowed, nothing else; no cookies remains absolute.
