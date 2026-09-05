# Level 2 — Architecture & Stack

**Status:** Signed off 2026-09-05

Level 1 left almost nothing for a stack to do: no server, no database, no
identity, no data. The founder answered the three real questions — GitHub
Pages, the simplest possible frontend, Preline as the design template with
screens drafted at Level 6 — and the ten decisions below follow from those
answers. Most of them are short because the right answer is "none", and
they are written anyway so nobody adds the thing by habit.

## Decisions

| # | Decision | Status | One-line outcome |
|---|----------|--------|------------------|
| [001](001-hosting-and-deployment.md) | Hosting and deployment | Confirmed | GitHub Pages from `macteo/orient`, deployed by Actions on push to `main`; base path `/orient/` until a custom domain |
| [002](002-application-architecture.md) | Application architecture | Confirmed | Static site, content compiled in at build, all behaviour in the browser, no server |
| [003](003-data-and-content.md) | Data and content | Confirmed | No database; JSON per deck and one artwork file per symbol in `content/`; completeness checked against the sources |
| [004](004-api-design.md) | API design | Confirmed | None |
| [005](005-frontend-strategy.md) | Frontend strategy | Confirmed | Vite + TypeScript, no framework; Tailwind 4 + Preline 5; multi-page build; pure logic modules with unit tests |
| [006](006-design-direction.md) | Design direction | Confirmed | Braisor - Preline design system in the founder's Claude Design project `c9a24f16…`; foundations pinned from tokens and the `Orient.dc.html` draft; `design-system/` vendored; self-hosted fonts and icons; artwork never modified |
| [007](007-route-conventions.md) | Route conventions | Confirmed | Italian lowercase slugs, trailing slash, `[mazzo]` segments expanded at build, query only for section and direction, relative links |
| [008](008-authentication-and-authorization.md) | Authentication and authorization | Confirmed | None |
| [009](009-cicd-and-releases.md) | CI/CD and releases | Confirmed | One workflow: content check, tests, build, dist check, gated deploy to Pages |
| [010](010-observability-and-recovery.md) | Observability and recovery | Confirmed | Nothing at runtime; workflow failure emails; git is the backup; revert is the rollback |

## Open Questions

- [ ] **Repository visibility** (001). Pages on a private repository needs a
      paid plan; the API does not show the plan from this session. Resolved
      by the first deploy: it works, or the repository goes public.
- [ ] **Custom domain** (001, 007). Optional; if wanted, decides the base
      path before launch rather than after.

- [ ] **One accent** (006, for Level 6). The draft uses `--tint` for
      selection and Preline blue for buttons; Level 6 sets `--tint` once.

## Level Review

- **Summary of everything decided:** a static site on GitHub Pages, built
  by Vite from vanilla TypeScript with Tailwind 4 and Preline 5, deployed by
  one GitHub Actions workflow that gates on a content check, unit tests and
  an origin-only check of the built output. No server, no database, no API,
  no auth, no runtime observability. Content is JSON and artwork in the
  repository. Routes are Italian folder paths with a trailing slash;
  in-screen state is query. The design system is Braisor - Preline through
  the founder's Claude Design project, vendored into `design-system/`, with
  fonts and icons self-hosted.
- **Tensions surfaced between decisions:** the design system's webfont
  import and icon CDN versus the no-third-party-request rule — resolved in
  006 by self-hosting. Two accent colours in the draft — left to Level 6
  as an open question, not a tension.
- **Improvements applied to the level as a whole:** every rule that code
  could break has a named check in 009; the four checks are the deliverable
  of that decision, not the workflow file.
- **Sign-off:** founder, 2026-09-05 — "ok, level 2 accepted".
