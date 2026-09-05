# 002 — Application Architecture

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.004](../01-vision/004-scope-boundaries.md), [1.005](../01-vision/005-constraints.md), [001](001-hosting-and-deployment.md)
**Enforced by:** the built output is a folder of static files with no server entry point, and the origin-only request check in [009](009-cicd-and-releases.md) fails the build if any page loads a resource from elsewhere

## The Spec

- **A static site.** Every screen is a pre-built HTML page; all behaviour —
  shuffling, flipping, scoring, the verdict — runs in the browser.
- **Content is compiled in at build time** from the JSON deck files
  ([003](003-data-and-content.md)). The browser never fetches content from
  anywhere; the only runtime requests are same-origin assets (the symbol
  images, lazily).
- **No server, no functions, no runtime configuration.** The repository plus
  the build command produce the whole site.
- **One codebase, one build, one deploy.**

## The Reasoning

Everything in Level 1 points here. There is no data to store, no user to
identify, no content that changes between deploys. A server would be a
thing to run for no one; a client-side fetch of the deck JSON would be a
network round-trip that a build step makes unnecessary.

The one architectural choice with a consequence is compiling content in
rather than fetching it. It makes each page self-contained and makes the
"no request to another origin" rule ([1.005](../01-vision/005-constraints.md))
trivially checkable — a page that never fetches cannot fetch the wrong
thing. The cost is that a content correction needs a rebuild, and
[009](009-cicd-and-releases.md) makes that a push.

### Options Considered

1. **Static, content compiled in.** **Chosen.**
2. **Static shell, content fetched as JSON at runtime.** Same hosting, one
   more network request, and a loading state on every screen for nothing.
3. **A single-page application with client-side routing.** On Pages this
   needs the 404-redirect trick for deep links; multi-page static
   ([005](005-frontend-strategy.md)) needs nothing.

### The Challenge

*Compiling content in means the bundle carries every symbol.* The decks are
about a hundred entries each and the artwork is small vector or bitmap files
loaded per card, not inlined. If a deck bundle ever exceeds a few hundred
kilobytes, per-deck pages ([007](007-route-conventions.md)) already split it.
