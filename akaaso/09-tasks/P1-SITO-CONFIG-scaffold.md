# P1-SITO-CONFIG-scaffold — Project scaffold: Vite + TypeScript + Tailwind 4 + Preline 5

## Objective

Create the runnable static-site project at the repository root: npm project,
Vite multi-page build with a base path, TypeScript strict, Tailwind CSS 4 with
Preline UI 5, the vendored design-system tokens imported without any external
request, self-hosted fonts, Vitest and Playwright configured, and the script
names every later task relies on (stubs where the real script does not exist
yet). After this task `npm ci && npm run build && npm test` succeed on a fresh
clone and produce a styled placeholder home.

---

## Specification

### Deliverables

- `package.json` — name `orient`, `"private": true`, `"type": "module"`, scripts:
  - `dev`: `vite`
  - `build`: `node scripts/build-mazzi.ts && vite build`
  - `preview`: `vite preview --port 4173`
  - `test`: `vitest run`
  - `check:content`: `node scripts/check-content.ts`
  - `check:dist`: `node scripts/check-dist.ts`
  - `generate:righe`: `node scripts/generate-righe.ts`
  - `parse:descrizioni`: `node scripts/parse/parse-descrizioni.ts`
  - `parse:isom`: `node scripts/parse/parse-isom.ts`
  - `e2e:smoke`: `playwright test --grep @smoke`
  - `e2e`: `playwright test`
  - dependencies: `preline@^5`, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`;
    devDependencies: `vite@^6`, `typescript@^5`, `tailwindcss@^4`, `@tailwindcss/vite`,
    `@tailwindcss/forms`, `vitest`, `@playwright/test`, `jsdom` (for DOM unit tests).
- `.nvmrc` — `24` (Node LTS with native TypeScript type stripping, so
  `node scripts/*.ts` runs without a build step). `engines.node >= 24`.
- `tsconfig.json` — strict, `"module": "ESNext"`, `"moduleResolution": "bundler"`,
  `"noEmit": true`, `"allowImportingTsExtensions": true`, `"erasableSyntaxOnly": true`
  (scripts must stay erasable: no enums, no parameter properties).
- `vite.config.ts` — `base: process.env.VITE_BASE ?? '/'`; `@tailwindcss/vite`
  plugin; `build.rollupOptions.input` collects `index.html` plus every
  `.generated/pages/**/index.html` if the folder exists (glob at config time);
  `publicDir: 'public'`; define `import.meta.env.VITE_TEST_SEED` passthrough.
- `src/styles.css` — in this order: `@import "tailwindcss";`
  `@source "../node_modules/preline/dist/*.js";` `@import "../node_modules/preline/variants.css";`
  `@plugin "@tailwindcss/forms";` then `@import "../design-system/tokens/colors.css";`
  `typography.css`, `spacing.css`, `shadows.css` (NOT `styles.css`, NOT `fonts.css`);
  `@import "@fontsource-variable/inter";` `@import "@fontsource/jetbrains-mono/400.css";`
  `@import "@fontsource/jetbrains-mono/500.css";` and a `:root { --tint: var(--blue-600); }`
  override plus `body { margin:0; background: var(--gray-50); font-family: var(--font-sans); }`.
- `index.html` — placeholder home (title *orient*, one Preline card that says
  *orient — in costruzione*, `<script type="module" src="/src/sito/home.ts">`),
  `<script src="/node_modules/preline/dist/preline.js">` replaced by an import
  of `preline` in `src/sito/preline.ts` (Vite bundles it) — no CDN.
- `src/sito/home.ts` — stub that imports `../styles.css` and `./preline.ts`.
- `src/sito/preline.ts` — `import 'preline';` plus `window.HSStaticMethods?.autoInit()`
  after DOM ready.
- `scripts/build-mazzi.ts`, `scripts/check-content.ts`, `scripts/check-dist.ts`,
  `scripts/generate-righe.ts`, `scripts/parse/parse-descrizioni.ts`,
  `scripts/parse/parse-isom.ts` — **stubs** that print `not implemented: <name>`
  and exit 0, so every npm script resolves. Later tasks replace them.
- `vitest.config.ts` (`environment: 'jsdom'`, include `src/**/*.test.ts`),
  `src/sanity.test.ts` (one passing test).
- `playwright.config.ts` — `webServer: { command: 'npm run preview', port: 4173 }`,
  `baseURL: 'http://127.0.0.1:4173' + (process.env.VITE_BASE ?? '/')`, chromium only,
  `testDir: 'e2e'`; `e2e/smoke.spec.ts` with one `@smoke` test that loads `/`
  and asserts no console error.
- `.gitignore` additions: `node_modules/`, `dist/`, `.generated/`, `content/_contact/`,
  `test-results/`, `playwright-report/`.
- `content/` skeleton folders with `.gitkeep`: `simboli/`, `righe/`, `esempi/`,
  `artwork/descrizioni-punti/`, `artwork/isom/`, `artwork/esempi/`, `schema/`.
- `src/mazzi/.gitkeep`, `src/allenamento/.gitkeep`.

### Business rules

- No request may leave the origin at runtime: no Google Fonts, no CDN scripts.
  Fonts come from the fontsource packages; Preline from node_modules.
- Base path: never write `/…` absolute URLs in HTML or TS; use relative paths
  or `import.meta.env.BASE_URL`.
- Do not import `design-system/styles.css` (it imports Google Fonts).

---

## Done Criteria

1. On a fresh clone with Node 24: `npm ci` then `VITE_BASE=/orient/ npm run build`
   succeeds and `dist/index.html` references its assets under `/orient/`.
2. `npm test` runs Vitest and passes the sanity test.
3. `npx playwright install chromium && npm run e2e:smoke` passes: `/` loads on
   `vite preview`, no console errors.
4. The built CSS contains Preline component classes (e.g. `.hs-` prefixed
   rules or Preline's button utilities) and the design-system variables
   (`--gray-800`, `--tint`), and `grep -r "fonts.googleapis" dist/` finds nothing.
5. Every npm script listed above runs (stubs print their name and exit 0).
6. Every criterion names an observable effect, not a file that exists.

---

## Interfaces Produced

- npm scripts and config every later task extends.
- `src/styles.css` as the single stylesheet entry.
- `src/sito/preline.ts` as the Preline runtime entry.

## Notes for Agent

- Preline 5 with Tailwind 4 install steps: `npm i preline`, `npm i -D @tailwindcss/forms`;
  CSS lines above are from Preline's docs. If `preline/variants.css` does not
  exist in the installed version, use the path the package ships and note it.
- Keep `scripts/*.ts` runnable by plain `node` (Node 24 strips types; use
  `import … from 'node:fs'` etc., no `tsx`).
- Module: `sito`. Infrastructure task — serves every story.
