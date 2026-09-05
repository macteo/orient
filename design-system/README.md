# orient — design system (vendored)

Imported on 2026-09-05 from the Claude Design project **Orient site base
scaffold** (`c9a24f16-5b6a-4e90-a8d8-8cd508302a1b`), which mounts the design
system **Braisor - Preline** (`095ff135-97b7-4430-ba48-8c6b4874b775`) under
`_ds/`. Recorded as decision [2.006](../akaaso/02-architecture/006-design-direction.md).

**Do not hand-edit these files.** Re-import from the design project so the
local copy and the canvas stay in step (every file carries the banner).

## What is here

- `styles.css` — the entry stylesheet; the app imports this one file.
- `tokens/colors.css`, `typography.css`, `spacing.css`, `shadows.css` — the
  authorable tokens: Tailwind palette with the configurable `--tint` accent,
  Inter / JetBrains Mono, 4 px grid, radius scale, shadow scale, focus ring.
- `tokens/fonts.css` — as shipped it `@import`s Google Fonts. **The app must
  not use it as-is**: [1.005](../akaaso/01-vision/005-constraints.md) forbids
  requests to other origins, so the implementation self-hosts Inter and
  JetBrains Mono under `assets/fonts/` and provides local `@font-face` rules,
  exactly as the design system's own readme suggests. The vendored file stays
  verbatim as the reference.
- `tokens/fig-tokens.css` — a **placeholder**: the original Figma variable
  dump exceeds what the sync tool reads in one file (256 KiB) and was not
  copied. orient does not use it; the file exists so the entry stylesheet's
  import resolves.

## What is deliberately not here

- `_ds_bundle.js` and the React component sources. The app has no framework
  ([2.005](../akaaso/02-architecture/005-frontend-strategy.md)); it uses
  Preline UI's own Tailwind markup for the same components. The design-system
  components are the review vocabulary in the canvas, not a runtime.
- Lucide icons from a CDN, which the design system's `Icon` component uses.
  The app bundles the two or three icons it needs as inline SVG.
- `_ds_manifest.json` (the component index, `PrelineUIDesignSystem_3ff5dc.*`)
  and `_adherence.oxlintrc.json` (the adherence lint rules: no raw hex, no raw
  px, only Inter / JetBrains Mono, declared component props). Both exceed the
  sync tool's per-file read cap; both are read in the design project when
  needed. The adherence rules target JSX; the project restates the three
  regex rules that apply to it (hex, px, font-family) in its own CSS check.
- The design system's `readme.md`; read it in the design project.

## Foundations, as read from the tokens

Palette: Tailwind ramp; brand accent `--tint` (default `#f5771e`); neutrals
`gray-50…950` with `gray-800` titles, `gray-500` secondary, `gray-200` borders;
teal-500 success, red-500 danger, yellow-500 warning, blue info.
Type: Inter, 14 px / 500 as the workhorse, headings 600–700 at `-0.02em`.
Spacing: 4 px grid. Radius: 8 px buttons and inputs, 12 px cards, 16 px large
cards, full for pills. Elevation: 1 px `gray-200` borders and `shadow-sm` on
cards. Motion: `.15s ease` colour transitions, no scaling on press.
