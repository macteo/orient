# 005 — Constraints

**Level:** 1 — Vision & Scope
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-problem-statement.md), [002](002-target-users.md), [004](004-scope-boundaries.md)
**Sources:** [S1] p. 2, [S2] p. 2, [S3] p. 30 (impressum), [F1]
**Enforced by:** the no-personal-data rule by a done-criterion on every task and by an automated check that a page load makes no request to any host but the site's own origin — Level 2 names the exact mechanism; the licence rule by the attribution page being a Level 4 feature with its own acceptance criteria

## The Spec

- **Team and time.** One person, spare time. v1 must be buildable in days.
- **Money.** Static hosting only. No paid service, no server to run.
- **Form.** A website with a public URL that works in a phone browser. Fixed
  by the brief. The stack is a Level 2 decision.
- **Content.** Text (names, definitions, sections) from [S3] and [S1]
  only; [S2] stays converted and unused ([004](004-scope-boundaries.md)).
  Artwork from [S4] for the control descriptions and [S5] for ISOM, both
  found on 2026-09-05. No other source. The extraction pipeline is a
  Level 3 decision.
- **Language.** Interface and content in Italian. Names and definitions are
  reproduced verbatim from the sources — the founder's instruction and the
  NoDerivatives licence say the same thing. The specification itself stays
  in English, like the sibling projects.
- **Licences.**
  - [S1] and [S2] are CC BY-ND 4.0 [F1]: their symbol drawings may be
    reproduced verbatim, with attribution, and not modified.
  - [S3] states no licence. IOF copyright is presumed. **The founder
    accepted this risk on 2026-09-05** for family use, which resolved
    tension T1 for v1. Later the same day the risk shrank: the pictogram
    artwork now comes from [S4], Purple Pen's vectors under a BSD licence,
    so nothing drawn is taken from [S3] any more — only its Italian names
    and one-line definitions, which [S4]'s `lang.json` also carries in
    Italian as a cross-check.
  - [S5], the IOF Map Commission's own per-symbol illustrations for ISOM
    2017-2, is CC BY-ND 4.0 like [S1] and supplies the ISOM deck's artwork.
    Cropping or masking the printed annotations is reproduction of a part,
    not adaptation; redrawing would be, and is not done.
- **No personal data.** The site collects nothing: no accounts, no analytics,
  no cookies, no third-party requests. Children use it. This is the one rule
  in Level 1 that code can break, and it is the one with an enforcement
  mechanism. Results stored in the learner's own browser
  ([004](004-scope-boundaries.md), since 2026-09-05) do not breach it: they
  never leave the device, carry no name or identifier, and the site cannot
  read them from anywhere else.

## The Reasoning

Most of these are the brief restated. Two needed thought.

**The licences.** We expected the IOF copyright to be the awkward part and
found the opposite: the two map specifications are Creative Commons, with
FISO's map commission credited for the Italian, and only the control
descriptions are silent. NoDerivatives permits reproducing a part of the work
unmodified — cropping a symbol out of the page and showing it as-is, with
attribution, is that. It does not permit redrawing, recolouring or
simplifying the symbol, which we have no reason to do.

The control descriptions are the deck that matters most and the one with no
licence line. Three ways through:

1. **Reproduce verbatim with attribution**, as for the other two, and accept
   the risk while the audience is one family. Cheapest. **Chosen for v1.**
2. **Redraw the pictograms** as SVG. About a hundred small black shapes —
   days of work, after which the artwork is ours. The fallback if option 1
   ever has to stop.
3. **Render from the pictogram font.** The extracted text of [S3] shows the
   symbol column as glyphs (`C`, `D`, `@`, `Â`): the pictograms are set in a
   symbol font. If that font is embedded in the PDF and freely licensed,
   rendering from it is both faithful and clean. Worth an hour at Level 3
   before committing to option 1's extraction pipeline.

**No personal data.** A family site with children on it that collects
nothing has no GDPR surface, no consent banner, no analytics vendor, and no
reason to ever ask a child for a name. That is a smaller product and a safer
one, and it costs nothing to promise now. It is the one constraint here that
an agent could violate by habit — "just add analytics" — which is why it is
the one with an enforcement mechanism rather than a sentence.

### Options Considered

For the form, the brief left one door open and we closed it:

1. **Website** — public URL, phone browser. **Fixed by the brief.**
2. **Native iOS app** — the builder's home ground, but an install step for
   every family member and an App Store review for a family tool.
3. **PWA** — a website that installs. Deferred: nothing prevents it later,
   and offline use was not asked for.

### The Challenge

*"Family use" is not a licence category; the site is public.* Correct, and
the founder accepted it as a stated risk rather than a hidden one. The
mitigations are the attribution page, strict no-modification of the source
material, and a bounded fallback (redraw). If the site is ever promoted,
option 2 or 3 is executed first.

## Change Log

- 2026-09-05 (later) — clarified that on-device results storage (1.004 amendment) is compatible with the no-personal-data rule; the rule itself is unchanged.
- 2026-09-05 (later) — artwork sources named: [S4] Purple Pen SVGs (BSD) for the pictograms, [S5] the IOF Map Commission's per-symbol PDFs (CC BY-ND) for ISOM. The [S3] licence risk now covers text only. 2.003 updated the same day.
- 2026-09-05 — confirmed by the founder, who accepted the [S3] licence risk (T1 resolved for v1). Content narrowed to [S3] and [S1]; a language constraint added: Italian interface and verbatim content, English spec.

[S4]: <../../sources/svg-control-descriptions/PROVENANCE.md>
[S5]: <../../sources/iof-isom-2017-2-revision-6-links/PROVENANCE.md>
