// @vitest-environment node
//
// scripts/check-dist.test.ts — proves check-dist.ts segnala ogni fixture
// deliberatamente rotta sotto scripts/fixtures/dist-broken/, nominando file
// e riga, e che la vera dist/ costruita passa pulita. Nella pipeline CI
// `npm test` gira prima di `npm run build` (akaaso/09-tasks/_context.md), per
// cui dist/ potrebbe non esistere ancora: se manca la si costruisce qui una
// sola volta (prima di ogni describe/it, così un `it.skipIf` può decidere se
// saltare, dato che valuta la condizione alla raccolta, non dentro un hook);
// se la build fallisce in questo ambiente, il test viene saltato con un
// motivo stampato invece di fallire la suite.
//
// Spec: akaaso/09-tasks/P1-SITO-CONFIG-ci-deploy.md

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkLinks, checkOrigin, checkTokens, rilevaBase, runChecks } from './check-dist.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_REALE = join(RADICE, 'dist');
const DIST_REALE_INDEX = join(DIST_REALE, 'index.html');
const FIXTURES_DIR = join(RADICE, 'scripts', 'fixtures', 'dist-broken');

let distDisponibile = existsSync(DIST_REALE_INDEX);
if (!distDisponibile) {
  try {
    execSync('npm run build', {
      cwd: RADICE,
      env: { ...process.env, VITE_BASE: '/orient/' },
      stdio: 'pipe',
    });
    distDisponibile = existsSync(DIST_REALE_INDEX);
    if (!distDisponibile) {
      console.log('- skipped: dist/ ancora assente dopo il tentativo di build (nessun errore riportato)');
    }
  } catch (e) {
    console.log(`- skipped: build di dist/ non riuscita in questo ambiente (${(e as Error).message.split('\n')[0]})`);
  }
}

describe('dist/ reale', () => {
  it.skipIf(!distDisponibile)('npm run check:dist non trova nulla di rotto', () => {
    const { broken } = runChecks(DIST_REALE, { base: rilevaBase(DIST_REALE) });
    expect(broken).toEqual([]);
  });
});

// Ogni fixture è la sua stessa "dist/": niente sottocartella `dist/`
// annidata, perché `.gitignore` esclude `dist/` a qualunque profondità e la
// fixture non si potrebbe committare.

describe('fixture: script esterno', () => {
  it('segnala il caricamento di risorsa da altra origine con file e riga', () => {
    const dist = join(FIXTURES_DIR, 'external-script');
    const { broken } = checkOrigin(dist);
    expect(broken).toEqual([
      'BROKEN origin index.html:4: caricamento di risorsa da altra origine "https://cdn.example.com/evil.js" (<script src>)',
    ]);
  });

  it('non tocca il controllo dei link né dei token per questa fixture', () => {
    const dist = join(FIXTURES_DIR, 'external-script');
    expect(checkLinks(dist, '/').broken).toEqual([]);
    expect(checkTokens(dist).broken).toEqual([]);
  });
});

describe('fixture: link assoluto fuori dalla base', () => {
  it('segnala il percorso assoluto fuori base con file e riga', () => {
    const dist = join(FIXTURES_DIR, 'absolute-link');
    const { broken } = checkLinks(dist, '/orient/');
    expect(broken).toEqual([
      'BROKEN link index.html:4: percorso assoluto "/altro/percorso" fuori dalla base "/orient/" (<a href>)',
    ]);
  });

  it('un <a> esterno resta comunque consentito (non è questa la violazione)', () => {
    const dist = join(FIXTURES_DIR, 'absolute-link');
    expect(checkOrigin(dist).broken).toEqual([]);
  });
});

describe('fixture: colore esadecimale', () => {
  it('segnala il colore esadecimale non consentito con file e riga', () => {
    const dist = join(FIXTURES_DIR, 'hex-colour');
    const { broken } = checkTokens(dist);
    expect(broken).toEqual([
      'BROKEN token assets/app.css:2: colore esadecimale non consentito "#ff00aa" (usa i design token)',
    ]);
  });

  it('la pagina html della fixture non ha link o risorse da controllare', () => {
    const dist = join(FIXTURES_DIR, 'hex-colour');
    expect(checkLinks(dist, '/').broken).toEqual([]);
    expect(checkOrigin(dist).broken).toEqual([]);
  });
});
