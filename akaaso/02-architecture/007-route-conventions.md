# 007 — Route Conventions

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-hosting-and-deployment.md), [005](005-frontend-strategy.md)
**Enforced by:** Vite's `base` option set from the workflow; a link check in [009](009-cicd-and-releases.md) that resolves every `href` and `src` in the built output against the files in `dist/` and fails on any miss or any absolute path; the route registry at Level 4 is the only place a path is spelled

## The Spec

- **No locale or tenant prefix.** The site is Italian only.
- **Lowercase Italian slugs**, hyphen-separated: `descrizioni-punti`, not
  `descrizioniPunti`, not `control-descriptions`.
- **Trailing slash on every route.** Each route is a folder with an
  `index.html`, which is how GitHub Pages serves clean paths without a
  server. `/isom/quiz/`, never `/isom/quiz` or `/isom/quiz.html`.
- **Dynamic segments** are written `[mazzo]` in the spec (project-wide
  `[id]` notation). At build time they expand to one folder per value —
  two decks, so two folders.
- **Path versus query.** The path says which screen you are on; the query
  carries state within it. The deck and the mode are screens (different
  actions, different empty states) and go in the path. The section filter
  and the quiz direction are state within a screen and go in the query:
  `?sezione=3.1`, `?direzione=inversa`. A page with no query shows the
  whole deck in the default direction.
- **Base path.** Links are relative, or built through Vite's `base`. No
  hand-written absolute path anywhere, because the base is `/orient/` on
  `github.io` and `/` under a custom domain.
- **Provisional route shape**, to be registered at Level 4 in
  `04-features/_routes.md`: `/`, `/[mazzo]/flashcard/`, `/[mazzo]/quiz/`,
  `/[mazzo]/risultati/`, `/fonti/`. The result page exists as a route
  because the run and its results live in the browser's storage
  ([003](003-data-and-content.md), amended 2026-09-05), so a full page load
  can show them; before that amendment result and review had to be states
  of the run page.

## The Reasoning

A static site on Pages has one routing primitive, the folder, and one
place to get it wrong: absolute links under a base path. The conventions
above make the first one the rule and the second one impossible by
construction, with a check to catch what construction misses.

The path/query line follows the skill's own test. Flash card and quiz are
separate screens because they have different affordances (flip and
self-grade versus pick and verdict); the section filter is the same screen
with fewer cards. The quiz direction was the one judgement call: reverse
quiz shows four symbols instead of four names, but the actions, the
verdict and the empty state are identical, so it stays a query parameter
and one screen spec covers both.

### Options Considered

1. **Folder-per-route, trailing slash.** **Chosen.**
2. **Hash routing** (`#/isom/quiz`). One HTML file, no build-time
   expansion, and URLs that look broken to anyone who shares one.
3. **SPA with a 404 redirect trick.** Works on Pages, invisible to the
   user, and one more thing to explain.

### The Challenge

*Italian slugs mean an English-speaking future contributor is lost.* The
future contributor is the founder. And the product's language is a Level 1
constraint; routes are part of the product.

## Change Log

- 2026-09-05 (later) — added `/[mazzo]/risultati/` to the provisional shape, made possible by the results storage amendment; dropped the never-used `/[mazzo]/` deck page, since the home already picks deck and sections.
