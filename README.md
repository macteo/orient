# orient

Orienteering flash cards and support.

The product specification lives in [akaaso/](akaaso/README.md) and is being
designed level by level with the akaaso-design skill. Start there.

## Sviluppo

Requisiti: Node come da [`.nvmrc`](.nvmrc) (`nvm use`), npm.

```sh
npm ci
npm run dev               # server di sviluppo Vite
npm run build             # scripts/build-mazzi.ts poi vite build
npm run preview           # serve dist/ già costruito
npm test                  # Vitest (logica pura, componenti DOM)
npm run check:content     # schemi, inventari, checksum, diff di rigenerazione
npm run check:dist        # link/origin/token del build (dopo npm run build)
npm run e2e:smoke         # Playwright: ogni pagina emessa carica senza errori
npm run e2e               # tutte le journey Playwright
npm run generate:righe    # righe generate, seme stabile per prefisso
npm run parse:descrizioni # analizza content/sources/... → simboli descrizioni
npm run parse:isom        # analizza content/sources/... → simboli ISOM
```

### Base path

Il sito si costruisce con la variabile `VITE_BASE`:

- non impostata (default `/`) — sviluppo locale e `vite preview` senza sorprese.
- `/orient/` — build di produzione, per `https://macteo.github.io/orient/`.

`vite.config.ts` legge `VITE_BASE` sia in fase di build (riscrive i percorsi
assoluti degli asset) sia in fase di `vite preview` (sotto quale percorso
servire `dist/`); `playwright.config.ts` la rilegge per costruire `baseURL`.
Va tenuta **identica** per ogni comando dello stesso job/terminale: una build
fatta con `/orient/` ma servita o testata con `VITE_BASE` diversa (o assente)
rompe la navigazione delle pagine annidate, perché `vite preview` smette di
risolverle e ricade sempre sulla home — vedi i commenti in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Estrattori

- `scripts/extract/` (Swift + PDFKit, [dettagli](scripts/extract/README.md))
  — rendono i PDF sorgenti nell'artwork committato sotto `content/artwork/`.
  Si eseguono a mano sul Mac del curatore (`cd scripts/extract && swift run
  extract-isom`, `swift run extract-esempi`); CI non li esegue mai, controlla
  solo il loro output con `npm run check:content`.
- `scripts/parse/` (TypeScript, `node scripts/parse/*.ts`) — analizzano il
  testo delle fonti convertite sotto `content/`; girano anche in CI, dentro
  `check:content` e `build-mazzi`.

### Come funziona il deploy

Un solo workflow, [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. Su ogni push a `main` e su ogni pull request, il job `checks` installa ed
   esegue, in ordine, `check:content` → i test → la build → `check:dist` →
   lo smoke Playwright. Un fallimento blocca gli step successivi e non c'è
   deploy.
2. Solo su push a `main`, e solo se `checks` è verde, il job `deploy`
   ricostruisce il sito e pubblica `dist/` su GitHub Pages
   (`actions/configure-pages`, `actions/upload-pages-artifact`,
   `actions/deploy-pages`), nell'ambiente `github-pages`.

Non c'è staging: i controlli verdi di una pull request sono l'anteprima;
`vite preview` in locale è quella visiva. Il rollback è un `git revert`
seguito dal push.
