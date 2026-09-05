# 001 — Module Map

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.004](../01-vision/004-scope-boundaries.md), [2.002](../02-architecture/002-application-architecture.md), [2.005](../02-architecture/005-frontend-strategy.md)
**Enforced by:** the repository layout — one top-level folder per module (`scripts/`, `content/`, `src/mazzi/`, `src/allenamento/`, `src/sito/`); a task touches one module, and a done-criterion says which

## The Spec

Four modules. All are built, none bought; there is nothing to integrate.

| Module | What it does | Runs | Owns |
|---|---|---|---|
| **contenuti** | Turns the source documents into content files: extracts artwork from the PDFs and the SVG set, parses the Italian text, writes `content/`. The Level 1 completeness check lives here. | On the curator's Mac, by hand, before a commit. Never in CI. | `scripts/extract-*.swift`, `scripts/check-content.*`, everything under `content/` |
| **mazzi** | Reads `content/` at build time and produces the decks: the card list per deck and section, the generated description rows, the distractor pools. Pure data, no DOM. | At build, in Node | `src/mazzi/`, the deck JSON the pages embed |
| **allenamento** | The player: flash-card run, quiz run in both directions, verdict, score, review of misses. Pure logic modules plus a thin DOM layer. | In the browser | `src/allenamento/` |
| **sito** | The shell: home with deck and section picker, the per-deck pages, the attribution page, the base-path-aware links, the Preline layout. | In the browser, built by Vite | `src/sito/`, `index.html` and the page templates |

Dependencies point one way: `sito` → `allenamento` → `mazzi` → `contenuti`.
Nothing points back. `contenuti` has no runtime at all.

**Every capability from Level 1 lands in exactly one module:**

| Level 1 scope item | Module |
|---|---|
| Decks from the sources, complete and verbatim | contenuti |
| Section filter, both quiz directions, runs of *N* cards | mazzi |
| Flip and self-grade, verdict, score, misses come back | allenamento |
| Ten-second start, phone-first, attribution page, no login | sito |

## The Reasoning

The natural cut is by *when code runs*: on the curator's Mac (extraction),
at build (deck assembly), in the browser (playing and navigating). That cut
also separates what is hard from what is not. Extraction is the only
genuinely difficult work in the product — locating cells in a PDF, pairing
images with text, proving completeness — and it is isolated in a module
that runs once per source revision and commits its output. Everything
downstream reads clean JSON and small images and never touches a PDF.

The **spine** question ("cut half the modules — which half survives?")
answers itself: `contenuti` and `allenamento` are the product; `mazzi` is
the glue between them and `sito` is the chrome. Without `contenuti` there is
nothing to learn; without `allenamento` there is nothing to do with it.

### Options Considered

1. **Four modules by runtime.** **Chosen.**
2. **Two modules, content and app.** Simpler on paper, but "app" would hold
   both the pure quiz logic and the page shell, and the Level 2 rule that
   logic is tested and the DOM is thin needs a boundary to hold on to.
3. **One module per deck.** The decks differ in content, not in behaviour;
   the player does not know which deck it is running.

### The Challenge

*Extraction on one person's Mac is a bus factor.* It is, and it is the
right trade for a family site: the extraction scripts are committed, the
outputs are committed, and the check script proves the outputs match the
sources on every push. Anyone with a Mac can re-run it; nobody has to.

## Change Log

- 2026-09-05 — confirmed by the founder with the Level 3 answers.
