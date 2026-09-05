# P1-CONTENUTI-TOOL-extract-isom — Render the IOF per-symbol ISOM PDFs to PNG on white

## Objective

Create the Swift package `scripts/extract/` with an `extract-isom` executable
that renders every `sources/iof-isom-2017-2-revision-6-links/ISOM <rif> …pdf`
at 8× on a white canvas to `content/artwork/isom/<rif>.png`, annotations kept
as printed, and writes a contact sheet. Spec:
`akaaso/03-modules/006-pipeline-isom.md`.

---

## Specification

### Deliverables

- `scripts/extract/Sources/extract-isom/main.swift` (the package and the stub
  exist from the scaffold; replace only this file, plus helper files inside
  this target's folder) — PDFKit + CoreGraphics:
  for each file matching `ISOM (\d{3}(?:\.\d)?|\d{3}-\d{3}) .*\.pdf`, render
  page 1 into a bitmap context filled white at scale 8, save PNG named by the
  ref (`204.png`, `701-703.png`; `101 Contour-1` → `101.png`, `-2` → `101b.png`).
  Skip `Def_`, `min_dim_`, `Screens`, `Running speed`, `by-nd.eps`.
- `content/artwork/isom/*.png` (committed) and `content/_contact/isom.html`
  (git-ignored): a grid of `<img>` with the ref under each.
- `scripts/extract/README.md` — how to run: `cd scripts/extract && swift run extract-isom`.

### Rules

- Deterministic output: same bytes on re-run (PNG without timestamps; use
  `NSBitmapImageRep` PNG with no metadata).
- Write to a temp folder, then replace `content/artwork/isom/` atomically.
- Never modify the drawing: no cropping, no recolouring; white background only.

---

## Done Criteria

1. `swift run extract-isom` produces one PNG per symbol file (about 120), each
   fully opaque white background, width ≥ 300 px.
2. `content/artwork/isom/204.png` shows the boulder drawing with its red
   `ø 0.4` label (open the contact sheet to confirm).
3. Re-running produces no git diff.
4. The contact sheet lists every PNG with its ref.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- A working reference implementation of the render step exists in the spec
  history: `page.thumbnail(of:for:)` at 8× onto a white `CGContext`.
- Runs on macOS only (curator's Mac). CI never runs it; it only checks outputs.
- Stories served: S-004, S-005, S-008, S-009 (F-007). Module: contenuti.
