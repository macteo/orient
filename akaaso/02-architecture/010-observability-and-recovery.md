# 010 — Observability and Recovery

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.005](../01-vision/005-constraints.md), [001](001-hosting-and-deployment.md), [009](009-cicd-and-releases.md)
**Enforced by:** the origin-only request check in [009](009-cicd-and-releases.md) — any analytics or error-reporting script fails the build

## The Spec

- **No analytics, no error reporting, no uptime monitor.** The
  no-personal-data rule forbids the first two; the third would watch a
  site that GitHub already watches.
- **Signals that exist:** a failed workflow run emails the founder; the
  Pages deployment status is on the repository; a broken page is noticed
  by a family member and reported in person.
- **Backup:** the repository is the backup. The whole site rebuilds from a
  clone with one command.
- **Recovery:** `git revert` of the offending commit and a push. Time to
  recover is one workflow run.
- **Logging:** none at runtime. Build logs live with the workflow run.

## The Reasoning

The 3 am question has an unusual answer here: nothing happens at 3 am. There
is no server to fall over, no database to fill, no queue to back up. The
only failure modes are a bad build, which the workflow refuses to deploy,
and a bad deploy of a good build, which is a revert.

The temptation is a "harmless" analytics snippet to see whether the family
uses it. Level 1 already answered that: ask them
([1.003](../01-vision/003-success-criteria.md)).

### Options Considered

1. **Nothing.** **Chosen.**
2. **Privacy-preserving analytics** (a cookieless counter). Still a
   third-party request from a page children use, and still a number nobody
   needs.
3. **A synthetic uptime check.** Free tiers exist; the site's uptime is
   GitHub's, and GitHub publishes it.

### The Challenge

*Without error reporting, a JavaScript error on one phone model goes
unnoticed.* It does, until a family member says so. For a family, that
report arrives faster than any dashboard.
