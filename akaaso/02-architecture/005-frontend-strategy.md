# 005 — Frontend Strategy

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.005](../01-vision/005-constraints.md), [001](001-hosting-and-deployment.md), [002](002-application-architecture.md), [006](006-design-direction.md)
**Enforced by:** a done-criterion on every UI task — `package.json` lists no UI framework, and any new dependency needs a one-line justification in the task; the CI build in [009](009-cicd-and-releases.md) runs the unit tests

## The Spec

- **Vite + TypeScript, no framework.** Plain DOM code: small render
  functions that return HTML strings or build elements, event listeners,
  module-level state. No React, Svelte, Vue, Astro, Next.
- **Tailwind CSS 4 + Preline UI 5** for styling and components, because
  the founder chose Preline as the design template
  ([006](006-design-direction.md)). Preline is installed per its
  documentation: the npm package, `@source` for its bundle, its
  `variants.css`, the `@tailwindcss/forms` plugin, and `preline.js`
  loaded at the end of the body.
- **Multi-page build.** One HTML entry per screen, generated at build time
  from a small script for the routes in [007](007-route-conventions.md):
  the deck × mode pages are emitted from one template each, not written by
  hand.
- **Logic separated from DOM.** Shuffling, distractor selection, scoring,
  the flash-card replay queue and the verdict live in pure TypeScript
  modules with Vitest unit tests. The DOM layer is thin and untested beyond
  a smoke test.
- **Language:** every string in the interface is Italian, written in source
  — no i18n layer ([1.005](../01-vision/005-constraints.md)).
- **Light theme only in v1.** Preline's dark mode is available and deferred.

## The Reasoning

The founder asked for the simplest possible frontend and, separately, for
Preline as the design template. The two constrain each other in one
direction: Preline needs Tailwind, and Tailwind needs a build step. So
"simplest possible" is not "no build"; it is "the smallest build that
compiles Tailwind", and that is Vite with nothing else in it.

No framework is a deliberate choice, not an omission. The application has
four screens and two interactive loops. A framework buys component
composition and reactive state, and pays with a dependency, a mental model,
and an upgrade treadmill that a family site will not keep up with. A
hundred lines of DOM code do not need any of that.

Preline's interactive pieces (dropdowns, collapse) are driven by its own
small script and data attributes, which fits a no-framework page exactly —
it is what Preline was built for before its framework wrappers existed.

### Options Considered

1. **Vite + vanilla TypeScript + Tailwind + Preline.** **Chosen.**
2. **Astro, static output.** Content-driven and pleasant; still a framework
   with its own component model for a site with four pages.
3. **Next.js static export.** What the founder's other products use. Heavy
   for this, and its routing model fights a base-path Pages deploy.
4. **No build at all: HTML + CSS + JS files.** The genuinely simplest thing,
   and incompatible with Preline. If Preline is ever dropped, this is the
   next stop.

### The Challenge

*Preline is a large component library for four screens.* True; the site
uses a handful of its patterns (cards, buttons, a segmented control, a
progress bar, an alert). Tailwind's compiler emits only the classes in use,
so the payload stays small regardless of the library's size. The
design-system vendoring at Level 6 names which patterns are in play.

*Vanilla DOM code gets messy as state grows.* State does not grow: a run
of cards, an index, a score. If v1.1's progress storage makes it grow, the
pure-logic modules are already separated and a small framework can be
introduced at the DOM layer without touching them.
