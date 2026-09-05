# 009 — CI/CD and Releases

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-hosting-and-deployment.md), [003](003-data-and-content.md), [005](005-frontend-strategy.md), [007](007-route-conventions.md)
**Enforced by:** the workflow itself — deploy is a job that depends on every check job, so nothing reaches Pages with a failing check

## The Spec

One workflow, `.github/workflows/deploy.yml`, triggered on push to `main`
and on pull requests. Jobs in order:

1. **Install** — `npm ci` on the Node LTS in `.nvmrc`.
2. **`check:content`** — every deck file matches its source inventory
   (missing or extra reference numbers fail); every artwork file referenced
   exists and its checksum matches the extracted original
   ([003](003-data-and-content.md), [006](006-design-direction.md)).
3. **`test`** — Vitest unit tests on the pure logic modules
   ([005](005-frontend-strategy.md)).
4. **`build`** — `vite build` with `base` from the workflow
   (`/orient/` until a custom domain exists).
5. **`check:dist`** — over the built output: every `href` and `src`
   resolves to a file in `dist/` or is a `mailto:` or an external link on
   the attribution page; no absolute path; and **no resource load from
   another origin** — no `<script src>`, `<link href>`, `<img src>`,
   `@import`, `url()`, `fetch(` or `XMLHttpRequest` that points off-site
   ([1.005](../01-vision/005-constraints.md)).
6. **Deploy** — only on `main`, only if 2 – 5 passed:
   `actions/upload-pages-artifact` then `actions/deploy-pages`.

Pull requests run 1 – 5 and stop. There is no staging: a pull request's
green checks are the preview, and `vite preview` locally is the visual one.

**Releases** are pushes to `main`. No tags, no version numbers, no
changelog beyond git. **Rollback** is `git revert` and push.

## The Reasoning

Every enforcement mechanism named in Levels 1 and 2 lands here, which is
the point of writing them down before the workflow exists: deck
completeness (Level 1 criterion 3), the artwork checksum (the licence
rule), the origin-only rule (no personal data), and the link check (base
path). Four small scripts, one workflow, and every rule that code could
break has a gate.

The scripts are the deliverable, not the workflow. A workflow that runs
`npm test` proves nothing about content; the content script is what makes
"complete deck" a fact rather than a claim. They are written before the
first deck is called done, and each is given a fixture that deliberately
breaks its rule, so it has been seen failing at least once.

### Options Considered

1. **One workflow with gated deploy.** **Chosen.**
2. **Deploy on push, checks as a separate workflow.** Faster to a broken
   site.
3. **Manual deploy from a laptop.** The legacy Pages mode, and how a family
   site ends up six months behind its repository.

### The Challenge

*Four custom check scripts is a lot of tooling for four screens.* Each is
under a hundred lines, runs in seconds, and replaces a rule someone would
otherwise have to remember. The alternative is the rule being broken by
the first agent that finds analytics convenient.

*The attribution page links off-site, so "no other origin" needs an
exception.* A navigation link is not a resource load. The check
distinguishes `<a href>` from `src`, `@import` and `fetch`; only the latter
group is forbidden.
