# 001 — Hosting and Deployment

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.005](../01-vision/005-constraints.md)
**Enforced by:** the deploy workflow in [009](009-cicd-and-releases.md) is the only path to production; there is no other credential that can publish the site

## The Spec

- **GitHub Pages**, served from the existing repository `macteo/orient`.
- **Deployed by GitHub Actions** (`actions/configure-pages`,
  `actions/upload-pages-artifact`, `actions/deploy-pages`) on every push to
  `main`. Pages source is set to "GitHub Actions", not a branch.
- **URL:** `https://macteo.github.io/orient/` at launch, so the site is built
  with base path `/orient/`. A custom domain is optional and later; when
  chosen it follows the pattern of the founder's other Pages sites (a
  `CNAME` file, HTTPS enforced) and the base path becomes `/`.
- **One environment:** production. Local development is the Vite dev server.
- **Repository visibility:** GitHub Pages on a private repository requires a
  paid GitHub plan. If the account is on the free plan, the repository is
  made public before the first deploy. Nothing in it is secret: the sources
  are public documents, and the site is public by definition.

## The Reasoning

The founder chose GitHub Pages "using the configurations already in place".
What is already in place: the repository exists at `macteo/orient` with
`main` as its default branch, the `gh` CLI is authenticated as `macteo`, and
four of the founder's other repositories already publish through Pages, one
of them under a custom domain with HTTPS enforced. We reuse the account, the
repository and the custom-domain pattern; we do not reuse the deploy mode.

Those older sites use Pages' legacy mode — static files committed to a
branch. That works when there is no build step. orient has one, because
Preline needs Tailwind's compiler ([005](005-frontend-strategy.md)), and
committing build output is the habit that rots first: the built files drift
from the source, and the next person to touch the site rebuilds by hand and
forgets. The Actions mode builds from source on every push and keeps the
repository free of generated files.

### Options Considered

1. **GitHub Pages, Actions deploy** — free, no server, builds from source,
   one workflow file. **Chosen.**
2. **GitHub Pages, legacy branch deploy** — what the founder's other sites
   use. Needs committed build output, or no build at all. Rejected for the
   drift above; it would also mean giving up Preline.
3. **A folder on the founder's VPS behind Caddy** — the company's
   infrastructure. Works, but ties a family toy to a server that has other
   obligations, and needs an rsync credential in CI.
4. **Cloudflare Pages** — equally free and simple; rejected only because the
   founder named GitHub Pages and has the account habits for it.

### The Challenge

*The repository is private today.* Pages on a private repository is a paid
feature, and the API does not show the account's plan from this session. So
the first deploy either succeeds because the plan allows it, or fails with a
clear message, and the fix is a visibility toggle — nothing in the repository
needs to stay private. Recorded as an open question, not a risk.

*A base path of `/orient/` breaks absolute links.* It does, which is why
[007](007-route-conventions.md) forbids absolute paths and
[009](009-cicd-and-releases.md) checks every link in the built output.

## Change Log

- 2026-09-05 — the first attempt to enable Pages on the private repository returned "Your current plan does not support GitHub Pages for this repository"; the repository was made public (as this decision provides) and Pages enabled with build type *workflow*. URL: https://macteo.github.io/orient/ — HTTPS enforced. The open question is closed.
