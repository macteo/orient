# 003 — Data and Content

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.003](../01-vision/003-success-criteria.md), [1.004](../01-vision/004-scope-boundaries.md), [002](002-application-architecture.md)
**Sources:** [S1], [S3], [S4], [S5]
**Enforced by:** `check:content` in [009](009-cicd-and-releases.md) — a script that diffs each deck file against the inventory extracted from its source and fails the build on any missing or extra entry

## The Spec

- **No database.** The repository is the only store.
- **Content lives in `content/`** at the product root:
  - `content/decks/<deck>.json` — one file per deck, `descrizioni-punti`
    and `isom`. The entry schema (reference number, Italian name, verbatim
    definition, section, artwork path, source page) is a Level 3 decision.
  - `content/symbols/<deck>/<ref>.<ext>` — one artwork file per symbol,
    reproduced without modification from [S4] (Purple Pen SVGs, BSD) for
    the control descriptions and from [S5] (the IOF Map Commission's
    per-symbol PDFs, CC BY-ND) for ISOM. Output format and the
    crop-or-mask step for [S5]'s printed annotations are a Level 3
    decision.
- **The sources stay authoritative.** `akaaso/sources/*.md` is the converted
  text of each PDF; the content check reads the inventory from there, never
  from the deck file.
- **Browser storage: `localStorage`, results only.** Amended 2026-09-05.
  Two keys, versioned: `orient.serie.v1` (the run in progress, so a reload
  or a navigation to the result page does not lose it) and
  `orient.risultati.v1` (completed runs: deck, sections, mode, direction,
  ISO date, score, missed card ids). No cookies, no IndexedDB, no other
  key. Reads are wrapped so a blocked or absent storage degrades to the
  v1 behaviour (nothing remembered). The shape is a Level 4 interface with
  a schema version, and a "cancella i risultati" action clears both keys.

## The Reasoning

A database for a hundred rows that change twice a year is a server, a
credential and a backup for nothing. JSON in git is versioned, diffable,
reviewable, and rebuilds the site from nothing.

The one rule that earns its enforcement is completeness. Level 1's third
success criterion says a deck is not done until it matches its source, and
"matches" is a diff between two lists: the reference numbers in the deck
file and the reference numbers in the converted source text. The script is
small, runs in seconds, and is the only thing standing between the family
and a deck that quietly lacks a symbol.

### Options Considered

1. **JSON per deck in the repository.** **Chosen.**
2. **A headless CMS.** An account, a token, and a fetch, so that a curator
   who already edits files in a repository can edit them in a browser.
3. **A spreadsheet exported at build.** Friendlier for a non-technical
   curator, but the curator is the founder ([1.002](../01-vision/002-target-users.md)).

### The Challenge

*Deck JSON edited by hand drifts from the source.* Which is exactly what the
content check catches — in both directions. An entry the source does not
have fails the build as loudly as a missing one.

## Change Log

- 2026-09-05 (later) — browser storage allowed for results and the run in progress, at the founder's request (1.004 amendment). Two versioned localStorage keys; no cookies.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
[S4]: <../../sources/svg-control-descriptions/PROVENANCE.md>
[S5]: <../../sources/iof-isom-2017-2-revision-6-links/PROVENANCE.md>
