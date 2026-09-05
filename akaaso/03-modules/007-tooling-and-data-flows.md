# 007 — Tooling, Data Flows and Events

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-module-map.md), [2.009](../02-architecture/009-cicd-and-releases.md)
**Enforced by:** CI never runs an extraction (there is no such step in the workflow) and fails if `content/` does not validate; the extraction scripts are deterministic and a re-run in a clean checkout must produce no diff, which is the curator's pre-commit check

## The Spec

**External APIs and providers:** none at runtime, none at build. The only
network activity in the whole lifecycle is `npm ci` in CI and the founder
downloading a source document by hand.

**Tooling, by module:**

| Module | Tool | Why |
|---|---|---|
| contenuti — extraction | Swift scripts using PDFKit and CoreGraphics, compiled with `swiftc`, run on the curator's Mac (`scripts/extract-*.swift`) | The only PDF renderer on this Mac that works without installing anything; already proven on all three sources |
| contenuti — parsing and checks | TypeScript run with Node (`scripts/parse-*.ts`, `scripts/check-content.ts`) | Same toolchain as the site; runs in CI on Linux |
| mazzi, allenamento, sito | Vite, TypeScript, Tailwind 4, Preline 5, Vitest ([2.005](../02-architecture/005-frontend-strategy.md)) | — |

**Data flows:**

1. *Source → content* (manual, on a Mac): `sources/*.pdf` and the vendored
   [S4] / [S5] folders → `swift run` of each extractor → `content/artwork/`;
   `akaaso/sources/*.md` → the parsers → `content/simboli/`, `esempi/`,
   `righe/ufficiali.json` (hand-transcribed, then validated); the row
   generator → `righe/generate.json`. The curator runs `npm run
   check:content`, looks at the contact sheets, commits.
2. *Content → site* (CI, every push): `check:content` → `test` → `vite
   build` embeds each deck's JSON into its pages and copies the artwork →
   `check:dist` → deploy ([2.009](../02-architecture/009-cicd-and-releases.md)).
3. *Site → learner* (browser): a page loads with its deck inline; artwork
   files load lazily as cards are shown; nothing is sent anywhere.

Failure handling: a failed extraction leaves `content/` untouched (scripts
write to a temporary folder and move on success); a failed check blocks the
commit locally and the deploy in CI; a failed deploy leaves the previous
site up.

**Webhooks and events:** none. The system reacts to nothing and emits
nothing. A source revision (a new IOF edition) is a manual re-extraction
and a commit.

## The Reasoning

The unusual choice here is running extraction by hand on a Mac and
committing the output rather than extracting in CI. It follows from the
tool: PDFKit is what works on this machine today, CI runs on Linux, and a
macOS runner to render a hundred crops that change twice a year would be
ceremony for its own sake. Committing the output also makes every artwork
file reviewable in a pull request and every checksum stable, which is what
the licence rule and the completeness rule need.

Determinism is the property that makes the by-hand step safe: the scripts
take no options, seed their randomness, and write the same bytes from the
same sources. "Re-run and diff" is therefore the whole verification, and a
future Mac can prove the committed content honest in a minute.

### Options Considered

1. **Extraction on the Mac, output committed, CI checks.** **Chosen.**
2. **Extraction in CI on a macOS runner.** Reproducible by construction,
   slower, a paid runner minute for every push, and it moves the one step
   that needs a human eye (the contact sheet) to where no eye is.
3. **Python with a PDF library.** Would run anywhere, but installing
   dependencies on this Mac is what is broken, and Swift is the founder's
   language.

### The Challenge

*Committed binary artwork bloats the repository.* About 300 small PNGs and
SVGs, a few megabytes in total, changing only with a source revision. Git
is fine with that; the 30 MB of source PDFs already committed dwarf it.

## Change Log

- 2026-09-05 — confirmed by the founder with the Level 3 answers.
