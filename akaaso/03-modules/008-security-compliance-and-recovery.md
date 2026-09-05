# 008 — Security, Compliance and Recovery

**Level:** 3 — Modules
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [1.005](../01-vision/005-constraints.md), [2.008](../02-architecture/008-authentication-and-authorization.md), [2.010](../02-architecture/010-observability-and-recovery.md)
**Sources:** [S1], [S3], [S4], [S5]
**Enforced by:** `content/fonti.json` is the single licence register and the attribution page is generated from it, so an asset without a registered source cannot ship; the origin-only request check from [2.009](../02-architecture/009-cicd-and-releases.md)

## The Spec

**Data classification.** Two classes. Public content, which is all the
site serves. And **on-device results** (amended 2026-09-05): the learner's
runs and scores in their own browser's `localStorage`, anonymous, never
transmitted, cleared by a button on the results page. The site holds no
personal data and no secrets; there is nothing to encrypt beyond HTTPS,
which GitHub Pages provides. A shared family phone shares its results, and
that is fine.

**Licences per asset**, recorded in `content/fonti.json` and rendered on
the attribution page (`/fonti/`):

| Asset | Source | Licence | Obligation met by |
|---|---|---|---|
| ISOM names and descriptions | [S1] | CC BY-ND 4.0 | Verbatim text; attribution to Swiss Orienteering, FISO Commissione Carte and the IOF, with the licence link |
| ISOM symbol drawings | [S5] | CC BY-ND 4.0 | Rendered unmodified on white; same attribution |
| Control-description names, descriptions, example texts and images | [S3] | none stated; IOF copyright presumed; risk accepted by the founder for family use ([1.005](../01-vision/005-constraints.md), T1) | Verbatim reproduction, attribution to the IOF Rules Commission and Swiss Orienteering, the note that the site is a private family study aid |
| Control-description pictograms | [S4] | BSD 3-clause (Purple Pen, © Peter Golde) | The licence text and copyright notice reproduced on the attribution page |
| Generated description rows | this project | — | Marked *generata*; composed from the names above |
| Preline UI | preline.co | MIT | Licence notice on the attribution page |
| Inter, JetBrains Mono | self-hosted | SIL OFL 1.1 | Licence files shipped beside the fonts |

**Regulatory.** No GDPR surface (no personal data, no cookies, no
tracking). No age-gating is needed because nothing is collected.

**Backup and recovery.** The repository is the backup; the published site
is a pure function of it. Recovery from any failure is a revert and a push,
one workflow run. The three source PDFs are committed, so even the sources'
websites disappearing changes nothing.

## The Reasoning

Most of this level's security section is "none", and it is written so a
future task cannot add a cookie or an analytics tag by default. The part
with content is the licence table: four sources, four different terms, and
a single page that discharges all of them. Generating that page from the
same file the content check reads is what turns "we credit our sources"
from an intention into a build step.

### Options Considered

1. **One licence register, attribution page generated from it.** **Chosen.**
2. **A hand-written attribution page.** Drifts the first time a source is
   added.

### The Challenge

*The [S3] risk is now a page-3 grid, a hundred sketches and a hundred
sentences, not a few pictograms.* It is larger than when the founder
accepted it. It is the same kind of use — a private family study aid
reproducing extracts of a document Swiss Orienteering distributes freely —
and the attribution page says so plainly. The founder was told this with
the Level 3 proposals and **re-confirmed the risk on 2026-09-05** for the
wider scope: page-3 rows, worked examples and sentences included.

## Change Log

- 2026-09-05 (later) — on-device results added as a data class; still no personal data.
- 2026-09-05 — confirmed by the founder, who re-confirmed the [S3] reproduction risk for the wider scope (rows, examples, sentences).

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
[S4]: <../../sources/svg-control-descriptions/PROVENANCE.md>
[S5]: <../../sources/iof-isom-2017-2-revision-6-links/PROVENANCE.md>
