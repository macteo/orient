# Sources Register

Provenance map for every `[S#]` and `[F#]` citation in this spec. `[S#]` codes
are documents the project was given; `[F#]` codes are external references.
Converted copies live in `sources/` beside the levels, text only, with a banner
naming the original. The originals are the PDFs at the repository root, in
`sources/`.

| Code | Document | Publisher / author | Date | Licence | Role in the spec |
|------|----------|--------------------|------|---------|------------------|
| [S1] | *Specifiche Internazionali per le Carte d'Orientamento — ISOM 2017-2 CH*, Italian edition, 41 pages | Swiss Orienteering, Commissione Carte; translation C. Tarabocchia (FISO Commissione Carte) and T. Pezzati; 2022 update C. Moreni. Literal translation of IOF ISOM 2017-2 | Version 2022-04-08 | CC BY-ND 4.0 [F1], stated on page 2 | Authoritative list and Italian names of forest map symbols, sections 3.1 – 3.7 |
| [S2] | *Specifiche Internazionali per le Carte d'Orientamento Sprint — ISSprOM 2019-2*, Italian edition, 32 pages | Same as [S1]. Literal translation of IOF ISSprOM 2019-2 | Version 2022-04-02 | CC BY-ND 4.0 [F1], stated on page 2 | Authoritative list and Italian names of sprint map symbols. **Deferred from v1** by [1.004](../01-vision/004-scope-boundaries.md); kept converted for the sprint deck later |
| [S3] | *Descrizioni dei punti IOF*, Italian edition, 32 pages | IOF Rules Commission (D. Rosen, V. Frey, U. Strand-Karlsen), editor B. Elkington; adapted for Switzerland by Swiss Orienteering; translation Bea Arn | Undated; content matches the IOF 2018 revision (fork and crossing moved to column F) | **No licence stated.** IOF copyright presumed. Risk accepted for family use by the founder, 2026-09-05 — [1.005](../01-vision/005-constraints.md), tension T1 | Authoritative list and Italian names of control-description pictograms, columns C – H |
| [F1] | Creative Commons Attribution-NoDerivatives 4.0 International | Creative Commons | — | — | The licence [S1] and [S2] are published under |
| [F2] | Orisym — Orienteering Symbols, iOS app | App Store listing | — | — | The reference product named in the brief: "something like Orisym, but in Italian" |
| [F3] | iknow-O | iknow-o.com | — | — | Web-based prior art for symbol quizzes |

## Conversion

- Converted 2026-09-05 with `scripts/convert-sources.swift` (PDFKit text
  extraction, one file per PDF, page breaks kept as HTML comments). The
  Homebrew poppler on this Mac is broken (missing libtiff), which is why the
  converter is Swift.
- **Text only.** Symbol drawings, tables and colours did not survive. Anyone
  needing the artwork reads the PDF; the content pipeline that extracts it is
  a Level 3 decision.
- All three PDFs are public documents distributed by Swiss Orienteering, so
  `sources/` at both levels is committed. [S1] and [S2] permit verbatim
  redistribution with attribution; [S3] is redistributed inside this private
  repository only, pending the licence question above.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S2]: <../sources/ISSprOM_2019-2_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
[F1]: <https://creativecommons.org/licenses/by-nd/4.0/>
[F2]: <https://apps.apple.com/us/app/orisym-orienteering-symbols/id6553980733>
[F3]: <https://www.iknow-o.com/>
