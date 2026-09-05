# orient — Agent Context Brief

> A simple Italian website that turns the IOF control-description and ISOM
> references into flash cards and quizzes with a verdict, for one family.

Read this once before your task. Your task file is your complete spec; this
brief says what kind of codebase you are in. **Profile: `web-ts`, adapted to a
static site** — there is no database, no API, no auth, no server. Anything a
rule says about migrations, permissions, tRPC or fixtures for a DB does not
apply here and must not be invented.

## Tech stack (Level 2, all decided)

- **Runtime / package manager:** Node LTS (`.nvmrc`), npm. Bun is used only by
  the task tooling under `scripts/tasks/`.
- **Language:** TypeScript, strict. Plain DOM code — **no UI framework**
  (no React, Svelte, Vue, Astro). Small render functions, event listeners,
  module state.
- **Build:** Vite, **multi-page**: one HTML per screen, generated at build by
  `scripts/build-mazzi.ts` from templates, then `vite build`. Base path from
  `VITE_BASE` (`/orient/` on github.io, `/` on a custom domain). No absolute
  paths in links — relative or via `import.meta.env.BASE_URL`.
- **Styling:** Tailwind CSS 4 + **Preline UI 5** (Tailwind markup and data
  attributes; Preline's `preline.js` at the end of the body). Design tokens
  from `design-system/tokens/*.css` (vendored from the Claude Design project;
  never hand-edit; import the token files directly, **not** `styles.css`,
  because `tokens/fonts.css` pulls Google Fonts). Accent: `--tint` set once to
  `var(--blue-600)`. Fonts self-hosted via `@fontsource-variable/inter` and
  `@fontsource/jetbrains-mono`.
- **Tests:** Vitest for pure logic; Playwright (chromium) for journeys against
  `vite preview`. A test-only seed `?seme=<n>` makes a run deterministic **only
  when** `import.meta.env.VITE_TEST_SEED === '1'`; production ignores it.
- **Content extraction:** Swift + PDFKit scripts in `scripts/extract/` (run on
  the curator's Mac, output committed); TypeScript parsers in `scripts/parse/`
  run with `node` (type stripping) and in CI.
- **Hosting:** GitHub Pages, deployed by `.github/workflows/deploy.yml` on push
  to `main` after `check:content` → `test` → `build` → `check:dist`.

## Repository layout

```
orient/
├── akaaso/                 spec (read-only for agents; cite, do not edit)
│   ├── 04-features/        F-001…F-010, _routes.md (R-001…R-005)
│   ├── 05-stories/         S-001…S-009 (journey steps = E2E transcription)
│   ├── 06-design/          D-001…D-005 screen specs + _artboards/*.dc.html
│   ├── sources/            converted text of the source PDFs (S1, S3)
│   └── 09-tasks/           this brief, task files, _index.json (canonical)
├── sources/                the PDFs; svg-control-descriptions/ (S4 SVGs);
│                           iof-isom-2017-2-revision-6-links/ (S5 PDFs)
├── design-system/          vendored tokens + component contracts (.prompt.md)
├── content/                GENERATED, COMMITTED content (see below)
├── scripts/
│   ├── extract/            Swift: extract-esempi, extract-isom (+ Package.swift)
│   ├── parse/              TS: parse-descrizioni.ts, parse-isom.ts
│   ├── generate-righe.ts   prefix-stable row generator (--count, --seed)
│   ├── check-content.ts    schemas + inventories + checksums + regen diff
│   ├── check-dist.ts       links, origin-only, tokens over dist/
│   ├── build-mazzi.ts      decks JSON + page emission into .generated/
│   └── tasks/              Bun task tooling (validate, regenerate-views, status)
├── src/
│   ├── mazzi/              deck types + card assembly helpers (pure)
│   ├── allenamento/        serie.ts, quiz.ts, storage.ts (pure) + facce/ + *-dom.ts
│   ├── sito/               home.ts, fonti.ts, shell helpers, templates/
│   └── styles.css          tailwind + preline + design-system tokens
├── public/fonts/           (only if fontsource is not used) OFL licences
├── e2e/                    Playwright journeys + smoke
├── .github/workflows/deploy.yml
└── index.html + .generated/pages/**/index.html (git-ignored)
```

## Content model (Level 3 decision 002) — files under `content/`

```
content/fonti.json                    Fonte[]   licence register → /fonti/ page
content/sezioni.json                  Sezione[] per deck: id, etichetta, fonte, ordine
content/simboli/descrizioni-punti.json Simbolo[] from S3 text + S4 svg
content/simboli/isom.json              Simbolo[] from S1 text + S5 png
content/righe/ufficiali.json           RigaDescrizione[] (9, page 3, verbatim text)
content/righe/generate.json            RigaDescrizione[] (200, origine: generata)
content/esempi/esempi.json             Esempio[] (~100) ; esempi/sezioni.json page→family
content/compatibilita.json             E per D, F per D, G rules (hand-kept, cites lines)
content/esclusi.json                   what a parser deliberately left out, with reason
content/artwork/descrizioni-punti/<rif>[<DIR>].svg
content/artwork/isom/<rif>.png
content/artwork/esempi/<codice>-{carta,terreno,riga}.png
content/schema/*.json                  JSON schemas, one per file kind
content/_contact/*.html                contact sheets (git-ignored)
```

```ts
type Simbolo = { rif: string; fonte: 'S1'|'S3'; sezione: string; nome: string;
  descrizione: string; colonna?: 'C'|'D'|'E'|'F'|'G'|'H'; famiglia?: string;
  geometria?: 'L'|'P'|'A'|'T'; direzioni?: string[]; pagina: number;
  artwork: { path: string; formato: 'svg'|'png'; origine: 'S4'|'S5'|'S3'; sha256: string };
  isom?: string[] };
type RigaDescrizione = { id: string; codice: string; numero?: string;
  celle: { C?: Cella; D?: Cella; E?: Cella; F?: Cella|string; G?: Cella; H?: Cella };
  testo: string; origine: 'ufficiale'|'generata' };
type Cella = { rif: string; direzione?: 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW' };
type Esempio = { codice: string; pagina: number; famiglia: string; testo: string;
  carta: string; terreno: string; riga: string; nascondi?: boolean };
type Fonte = { id: string; titolo: string; autori: string; editore?: string; edizione?: string;
  data?: string; licenza: { nome: string; url?: string; testoFile?: string };
  cosaUsiamo: string; attribuzione: string; url?: string };
```

Card ids are stable strings: `ds:<rif>[<DIR>]`, `dc:ufficiale:<n>`,
`dc:gen:<NNNN>`, `es:<codice>`, `isom:<rif>`.

## Runtime model (Levels 4 – 5)

- Routes (registry `akaaso/04-features/_routes.md`): R-001 `/`, R-002
  `/[mazzo]/flashcard/`, R-003 `/[mazzo]/quiz/`, R-004 `/[mazzo]/risultati/`,
  R-005 `/fonti/`. Deck slugs: `descrizioni-simboli`, `descrizioni-complete`,
  `esempi`, `isom`. Query: `?sezioni=a,b`, `?carte=8|12|23|tutte`,
  `?direzione=inversa`, `?ripasso=1`. Trailing slash everywhere.
- Storage (only two keys, both versioned, every access in try/catch):
  `orient.serie.v1` (run in progress) and `orient.risultati.v1` (completed
  runs, ≤ 50 per deck). No cookies, no other key, no network but own assets.
- A run: N cards drawn from the chosen sections; flash card = flip + self-grade
  with misses replayed once; quiz = 4 options (distractors same section, then
  deck), verdict at once, manual *Avanti*. Completion appends a `Risultato`
  and navigates to R-004.

## Conventions every task follows

- **Italian UI, verbatim content.** Interface strings are Italian, sentence
  case. Names and definitions come from `content/` byte for byte; never
  paraphrase.
- **Artwork never modified**: scaled proportionally on white, never recoloured.
- **Colour never the only signal**: every verdict carries a mark and a title.
- **No third-party requests at runtime**: no CDN, no webfont import, no
  analytics. `check:dist` fails the build otherwise.
- **No hex colours or foreign `font-family` in `src/`**: use tokens.
- **Design conformance (UI tasks):** read every `.prompt.md` in your
  `Components:` list first; implement every state in `States:`; if a
  component you need is missing from `design-system/`, stop and report
  blocked. Do not invent a visual language.
- **Determinism:** every generator/extractor writes the same bytes from the
  same inputs (seeded RNG, sorted keys, no timestamps in content files except
  the header `generato` date which the check ignores).
- **Git:** branch `task/<task-id>` (lowercase), one commit,
  `feat(<module>): …` / `chore(<module>): …` / `test(<module>): …`.
- **Do not** edit `akaaso/` (spec), `design-system/` (vendored), or files
  outside your deliverables. Do not add dependencies beyond your task's list.

## Verification commands (the wave gate runs these on `develop`)

```bash
npm ci
npm run check:content     # once content exists; schemas, inventories, checksums, regen diff
npm test                  # vitest
npm run build             # build-mazzi + vite build (VITE_BASE=/orient/)
npm run check:dist        # links, origin-only, tokens
npm run e2e:smoke         # playwright: every emitted page loads without console errors
npm run e2e               # journeys (@critical) once UI waves are merged
grep -rn '^<<<<<<<\|^>>>>>>>' src scripts content akaaso/09-tasks || true   # conflict markers
```

## Spec pointers (cite, do not copy)

- Features: `akaaso/04-features/00N-*.md` (acceptance criteria are the tests)
- Stories: `akaaso/05-stories/00N-*.md` (journey steps → Playwright)
- Screens: `akaaso/06-design/*.md` + `_artboards/*.dc.html` (open the artboard
  file for structure; it is a Claude Design artboard, not a page)
- Pipelines: `akaaso/03-modules/003…006-*.md`
- Storage / routes / CI: `akaaso/02-architecture/003, 007, 009`
