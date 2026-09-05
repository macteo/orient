# P1-SITO-CONFIG-ci-deploy — GitHub Actions workflow, dist checks, Pages deploy

## Objective

Add the one workflow that gates and deploys the site, and the `check:dist`
script it runs: links resolve, no absolute paths, no off-origin resource loads,
no hex colour or foreign font-family in emitted CSS from `src/`. Deploy to
GitHub Pages on `main` only. Spec: `akaaso/04-features/009-ci-e-deploy.md`,
`akaaso/02-architecture/001-hosting-and-deployment.md`, `009-cicd-and-releases.md`.

---

## Specification

### Deliverables

- `.github/workflows/deploy.yml` — on `push` to `main` and `pull_request`:
  `actions/checkout`, `actions/setup-node` with `.nvmrc` + npm cache, `npm ci`,
  `npx playwright install --with-deps chromium`, `npm run check:content`
  (`CI=1`), `npm test`, `VITE_BASE=${{ vars.VITE_BASE || '/orient/' }} npm run build`,
  `npm run check:dist`, `npm run e2e:smoke`, then on `main` only:
  `actions/configure-pages`, `actions/upload-pages-artifact` (`dist/`),
  `actions/deploy-pages` (environment `github-pages`, permissions
  `pages: write`, `id-token: write`). Concurrency group `pages`.
- `scripts/check-dist.ts` (replaces the stub): scans `dist/**/*.html|css|js`:
  1. every `href`/`src` resolves to a file in `dist/` after stripping the base,
     or is `mailto:` / `#…` / an external `<a href>`; no `href="/…"` absolute
     path that does not start with the base;
  2. no off-origin **resource load**: `<script src>`, `<link href>`, `<img src>`,
     `@import`, `url(`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`
     with `http(s)://` to another host (anchors excluded);
  3. no `#[0-9a-f]{3,8}` colour and no `font-family` outside Inter / JetBrains
     Mono / `var(--font-` in CSS emitted from `src/` (design-system token
     files and fontsource CSS are exempt by an allowlist of substrings).
- Fixtures `scripts/fixtures/dist-broken/{external-script,absolute-link,hex-colour}/`
  and `scripts/check-dist.test.ts` asserting each fails with file and line.
- `README.md` at repo root gains a *Sviluppo* section: commands, base path,
  how to run the extractors.

---

## Done Criteria

1. On a pull request the workflow runs install → check:content → test → build →
   check:dist → e2e:smoke and does not deploy; on `main` all green deploys and
   `https://macteo.github.io/orient/` answers with the home under the base
   path. (The orchestrator enables Pages with source *GitHub Actions* and
   handles repository visibility; the task reports if the deploy job cannot
   run for a plan reason.)
2. Each dist fixture fails `check:dist` naming file and line; the real build
   passes.
3. A failing check blocks the following jobs (verified by reading the workflow
   graph or by a deliberately failing test on a branch).
4. `grep -r "googleapis\|cdn" dist/` finds nothing.
5. Every criterion names an observable effect, not a file that exists.

## Notes for Agent

- Depends on scaffold, check-content, deck build and the five UI pages.
  Stories: S-007, S-008, S-009 (F-009). Module: sito (infrastructure).
