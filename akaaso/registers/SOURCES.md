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
| [S4] | *svg-control-descriptions* — 183 SVG pictograms of the IOF control descriptions, plus `lang.json` with names in 15 languages, Italian included | Per Liedman's extraction of Purple Pen's `symbols.xml` (Peter Golde) [F4], [F5] | Repository commit of 2024-12-28 | BSD 3-clause (Purple Pen); the extraction repository declares none of its own | **The pictogram artwork for the control-descriptions deck.** Vendored verbatim under `sources/svg-control-descriptions/` with the licence text |
| [S5] | *IOF_ISOM_2017-2_Revision_6/Links* — one vector PDF per ISOM 2017-2 symbol, plus definition and minimum-dimension figures | IOF Map Commission's translation package for national commissions, linked from [F6] | Files dated 2023-11 to 2024-02 | CC BY-ND 4.0 [F1] (the badge ships in the folder) | **The symbol artwork for the ISOM deck.** Vendored under `sources/iof-isom-2017-2-revision-6-links/`; annotations to be cropped or masked at Level 3, never redrawn |
| [S6] | *Orient site base scaffold* — the founder's Claude Design project (`c9a24f16-5b6a-4e90-a8d8-8cd508302a1b`), file `Orient.dc.html`: the whole flow drafted in one phone frame, copy verbatim from [S3], pictograms as provisional sketches | Matteo Gavagnin, 2026-09-05 | 2026-09-05 | Project-owned | The seed for Level 6 screens and the source of the design foundations in [2.006](../02-architecture/006-design-direction.md); read through the claude_design MCP / DesignSync, not copied into the repository |
| [F1] | Creative Commons Attribution-NoDerivatives 4.0 International | Creative Commons | — | — | The licence [S1] and [S2] are published under |
| [F2] | Orisym — Orienteering Symbols, iOS app | App Store listing | — | — | The reference product named in the brief: "something like Orisym, but in Italian" |
| [F3] | iknow-O | iknow-o.com | — | — | Web-based prior art for symbol quizzes |
| [F4] | perliedman/svg-control-descriptions on GitHub | Per Liedman | — | — | Where [S4] comes from |
| [F5] | petergolde/PurplePen on GitHub | Peter Golde | — | BSD 3-clause | The origin of the pictogram vectors in [S4] |
| [F6] | IOF Mapping page | International Orienteering Federation | — | — | Links the Map Commission package that [S5] was taken from; the IOF publishes no symbol images elsewhere, only the specification PDFs |

## Conversion

- Converted 2026-09-05 with `scripts/convert-sources.swift` (PDFKit text
  extraction, one file per PDF, page breaks kept as HTML comments). The
  Homebrew poppler on this Mac is broken (missing libtiff), which is why the
  converter is Swift.
- **Text only.** Symbol drawings, tables and colours did not survive. Anyone
  needing the artwork reads the PDF; the content pipeline that extracts it is
  a Level 3 decision.
- [S4] and [S5] are artwork, not text, so they are vendored as-is at the
  repository root under `sources/` with a `PROVENANCE.md` each, and are not
  mirrored under `akaaso/sources/`. Found on 2026-09-05 when the founder asked
  where the real pictograms could be taken from.
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
[S4]: <../../sources/svg-control-descriptions/PROVENANCE.md>
[S5]: <../../sources/iof-isom-2017-2-revision-6-links/PROVENANCE.md>
[F4]: <https://github.com/perliedman/svg-control-descriptions>
[F5]: <https://github.com/petergolde/PurplePen>
[F6]: <https://orienteering.sport/iof/mapping/>
[S6]: <https://claude.ai/design/p/c9a24f16-5b6a-4e90-a8d8-8cd508302a1b?file=Orient.dc.html>
