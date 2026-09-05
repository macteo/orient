# 006 — Design Direction

**Level:** 2 — Architecture & Stack
**Status:** Confirmed — foundations pinned from the founder's draft and the design system's tokens, 2026-09-05
**Date:** 2026-09-05
**Depends on:** [1.002](../01-vision/002-target-users.md), [1.005](../01-vision/005-constraints.md), [005](005-frontend-strategy.md)
**Enforced by:** the Level 6 component-contract and artboard coverage gates; a CSS check in [009](009-cicd-and-releases.md) that fails the build on a raw hex colour, a raw px length outside the token files, or a `font-family` other than Inter / JetBrains Mono in application styles (the three rules restated from the design system's own `_adherence.oxlintrc.json`); the symbol-artwork rule additionally by the content check, which compares each artwork file's checksum to the extracted original

## The Spec

**Design system:** Preline UI, as the Claude Design design system
*Braisor - Preline* (`095ff135-97b7-4430-ba48-8c6b4874b775`), mounted under
`_ds/` in orient's own design project.
**Claude Design project id:** `c9a24f16-5b6a-4e90-a8d8-8cd508302a1b` —
*Orient site base scaffold*, owned by the founder. Its `Orient.dc.html`
([S6]) is the founder's draft of the whole flow in one phone frame: home
with deck and section picker, flash card front and back, quiz in both
directions with verdict, result, review. Level 6 splits it into one screen
per route and designs the states; it is the seed, not the spec.
**MCP scope:** project — `.mcp.json` at the product root, committed: yes.

**Foundations** — read from the design system's tokens and readme, and
from the draft; a row changes only by re-import.

| | Value |
|---|---|
| Palette | Tailwind ramp as shipped in `tokens/colors.css`. Neutrals: `gray-800` titles, `gray-500` secondary, `gray-400` hints, `gray-200` borders, `gray-50` canvas, white cards. Accent: the design system's configurable `--tint` (the draft uses `--tint-*` for selection and links and Preline's `blue` for primary buttons; **Level 6 picks one accent** and sets `--tint` once). Verdicts: `teal-*` right, `red-*` wrong, never colour alone — the draft pairs each with ✓ / ✕ and a text title. No per-section colour in the draft; the ISOM colour-family accents proposed earlier are dropped unless Level 6 finds a use |
| Typography | Inter, with JetBrains Mono for reference codes; 14 px / 500 as the workhorse, 22 px / 600 at `-0.02em` for the card name, 44 px / 700 for the score, 12 – 13 px for captions |
| Spacing scale | 4 px grid (`--space-*`); 16 px page gutters, 12 px card gaps |
| Density | Comfortable: phone frame 392 px, rows and options at least 44 px (56 px quiz options, 60 px primary buttons), section checkboxes 22 px inside a 44 px row |
| Elevation | 1 px `gray-200` borders with `shadow-sm` on every card; no other level in the draft |
| Motion | `.15s ease` colour transitions on segmented controls and options; the card flip is a state swap in the draft — a flip animation is optional, and off under `prefers-reduced-motion` |
| Radius | 8 px controls, 10 px segmented control, 12 px list cards, 16 px the card and quiz panels |
| Theme | Light only; `body` on `gray-50` |

**Usage rules that are constraints, not suggestions**

- **Symbol artwork is never modified.** Not recoloured, not redrawn, not
  simplified, not stretched. It is scaled proportionally and placed. This
  is the licence in [1.005](../01-vision/005-constraints.md) as a design
  rule.
- **Section colour is an accent, never the only carrier of meaning.** A
  brown chip says "forme del terreno" in text as well. Children and
  colour-blind readers get the same information.
- **Italian copy is verbatim from the sources** where it is a name or a
  definition. Interface chrome (buttons, labels) is the project's own
  Italian and is short.
- **Light theme only in v1.** No dark-mode tokens are exercised until a
  decision adds them.
- **No request leaves the origin for the look either.** The design system's
  `fonts.css` imports Google Fonts and its `Icon` component loads Lucide from
  a CDN. The app self-hosts Inter and JetBrains Mono and inlines the two or
  three icons it needs ([1.005](../01-vision/005-constraints.md)).
- **Components are the design vocabulary, not a runtime.** The design
  system's components are React and render in the canvas; the app has no
  framework ([005](005-frontend-strategy.md)) and builds the same Button,
  Progress, Badge and Device patterns with Preline UI's own Tailwind markup.
  Level 6 screen specs cite the component contracts; tasks implement them
  in markup.

**Vendoring:** done on 2026-09-05 into `design-system/` at the product root
(`styles.css`, `tokens/`, a README naming what was left out and why). Every
file carries the import banner; changes come by re-import, never by hand.
The Figma variable dump, the component manifest and the adherence lint file
exceed the sync tool's per-file read cap and stay in the design project.
The app imports `design-system/styles.css`; no hex literal appears in
application CSS.

**Inputs the draft hands to Level 4** (recorded here so they are not lost):
runs of *N* cards rather than the whole deck, default 8, adjustable 4 – 23;
quiz advance manual by default, automatic as an option; the definition shown
in the verdict by default; a *review* screen listing the misses with the
option to replay them as cards; a per-run title naming the deck and the
sections chosen. Each is a Level 4 acceptance criterion or an explicit
deferral, not a silent default.

## The Reasoning

The design-direction template's first question is "is there an existing
design system?", and the answer here is unusually clear: the founder keeps
Preline-based design systems as Claude Design projects, one base and one per
product, and asked for orient to follow the same pattern. That fixes the
component library, the tooling and the vendoring shape in one stroke. The
look arrived the same morning: the founder drafted the whole flow as one
artboard, reading the Level 1 spec first — the copy is verbatim from the
converted sources, the modes and the review loop match
[1.004](../01-vision/004-scope-boundaries.md), and the pictograms are marked
as provisional sketches to be replaced by the extracted artwork, which
[1.005](../01-vision/005-constraints.md) has since sourced. So the
foundations above are read, not invented: from the tokens for the values,
from the draft for how they are used.

Two things in the design system collide with Level 1 and are resolved here
rather than discovered by an agent: the webfont import and the icon CDN both
leave the origin, so both are replaced by self-hosted copies. And the
section-colour idea from the first proposal is dropped, because the draft
does not use it and it was never a Level 1 requirement.

The rules are the part worth writing now, because they come from Level 1
rather than from taste. The artwork rule is the licence. The accent rule is
the audience. The verbatim rule is both.

### Options Considered

1. **Preline via a Claude Design project, as the founder's other products.**
   **Chosen.**
2. **Preline used directly from its documentation, no design project.**
   Less ceremony, but no artboards to approve at Level 6, and the founder
   asked for the screens to be drafted.
3. **A hand-rolled minimal stylesheet.** The simplest thing for a
   no-framework site; abandoned the moment the founder chose Preline.

### The Challenge

*A full design system for four screens is heavy.* The design system is the
founder's existing tooling, not new work; orient's Level 6 export takes only
the components its screens use. The heavy part, the base library, already
exists.

*Two accents in one draft.* Selection uses `--tint`, primary buttons use
Preline's blue; on a phone that reads as two brands. Level 6 sets `--tint`
once and uses it for both, which the design system was built for — override
one variable and every derived shade follows.

## Change Log

- 2026-09-05 (Level 6) — accent resolved: `--tint` set once to Preline blue (`--blue-600`) so selection, links and the blue Buttons share one colour; applied in the artboards' helmet and to be applied in the app stylesheet.
- 2026-09-05 (later) — the founder shared the Claude Design project; project id recorded, foundations pinned from the tokens and the draft, `design-system/` vendored, webfont and icon origin rule added, section-colour proposal dropped, Level 4 inputs listed.

[S6]: <https://claude.ai/design/p/c9a24f16-5b6a-4e90-a8d8-8cd508302a1b?file=Orient.dc.html>
