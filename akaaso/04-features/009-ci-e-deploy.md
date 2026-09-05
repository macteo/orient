# 009 — CI e deploy

**Feature ID:** F-009
**Status:** Confirmed — 2026-09-05
**Date:** 2026-09-05
**Owner:** sito ([3.001](../03-modules/001-module-map.md)) — infrastructure feature, serves every story
**Delivers:** [2.001](../02-architecture/001-hosting-and-deployment.md), [2.009](../02-architecture/009-cicd-and-releases.md), the enforcement mechanisms of [1.005](../01-vision/005-constraints.md), [2.006](../02-architecture/006-design-direction.md), [2.007](../02-architecture/007-route-conventions.md)
**Route:** none
**Enforced by:** itself — deploy depends on every check job; each check has a fixture that fails it

## Behaviour

`.github/workflows/deploy.yml`, on push to `main` and on pull requests:
`npm ci` → `check:content` → `test` → `build` (with `VITE_BASE` from a
repository variable, `/orient/` by default) → `check:dist` → deploy to
Pages on `main` only. `check:dist` runs three scans over `dist/`:

1. **Links** — every `href` and `src` resolves to a file in `dist/` or is
   `mailto:` or an anchor on the attribution page; no absolute `/…` path.
2. **Origin** — no `<script src>`, `<link href>`, `<img src>`, `@import`,
   `url()`, `fetch(`, `XMLHttpRequest`, `WebSocket` or `navigator.sendBeacon`
   pointing off-origin, in HTML, CSS or JS.
3. **Tokens** — no hex colour, no `font-family` outside Inter / JetBrains
   Mono, in the CSS emitted from `src/` (the vendored token files are
   exempt by path).

Fonts are self-hosted under `public/fonts/` with their OFL licence files.
The first deploy resolves the repository-visibility question of
[2.001](../02-architecture/001-hosting-and-deployment.md).

## Components

- `.github/workflows/deploy.yml`; `scripts/check-dist.ts`; `.nvmrc`;
  `vite.config.ts` reading `VITE_BASE`; `public/fonts/`.
- Fixtures under `scripts/fixtures/dist-*` (a page with an external
  script, a page with an absolute link, a stylesheet with a hex colour).

## Acceptance criteria

- AC-1 A pull request runs install, content check, tests, build and dist
  check and does not deploy; a push to `main` with all green deploys and
  the site answers at the Pages URL with the base path.
- AC-2 Each of the three fixtures fails `check:dist` with a message naming
  the file and line; the real build passes.
- AC-3 A failing `check:content` blocks the build job; a failing test blocks
  the build; a failing dist check blocks the deploy.
- AC-4 The built site loads no font, script or style from any host but
  its own, verified by the origin scan and by a Playwright request log in
  the spine journey.
- AC-5 Reverting the last commit and pushing restores the previous site
  within one workflow run.

## Change Log

- 2026-09-05 — first deploy: workflow run on `main` green (jobs *Verifica* and *Deploy*); the site answers at https://macteo.github.io/orient/ with the base path, nested pages and artwork included (AC-1 verified from outside).
