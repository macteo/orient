// @vitest-environment node
//
// scripts/check-content.test.ts — proves check-content.ts reports each
// deliberately broken fixture under scripts/fixtures/content-broken/, and
// that the real, committed content/ passes cleanly (both locally and with
// CI=1, which must never write).
// Spec: akaaso/09-tasks/P1-CONTENUTI-TOOL-check-content.md

import { describe, expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkArtwork,
  checkInventarioDescrizioni,
  checkRighe,
  checkSchema,
  runChecks,
} from './check-content.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_REALE = join(RADICE, 'content');
const FIXTURES_DIR = join(RADICE, 'scripts', 'fixtures', 'content-broken');

/** Copia una fixture in una cartella temporanea, così un test che scrive (es. artwork) non tocca il file sotto git. */
function copiaFixture(nome: string): string {
  const dest = mkdtempSync(join(tmpdir(), `check-content-${nome}-`));
  cpSync(join(FIXTURES_DIR, nome, 'content'), join(dest, 'content'), { recursive: true });
  return join(dest, 'content');
}

describe('content/ reale', () => {
  it('npm run check:content non trova nulla di rotto (in locale)', async () => {
    const { broken } = await runChecks(CONTENT_REALE, { ci: false });
    expect(broken).toEqual([]);
  });

  it('non trova nulla di rotto neanche con CI=1 (dopo il fill locale degli sha256 isom)', async () => {
    const { broken } = await runChecks(CONTENT_REALE, { ci: true });
    expect(broken).toEqual([]);
  });

  it('valida gli schemi simboli, esempi ed esclusi oltre a fonti e sezioni', () => {
    const { ok, broken } = checkSchema(CONTENT_REALE);
    expect(broken).toEqual([]);
    expect(ok[0]).toMatch(/^OK schema: \d+ file validati contro \d+ schemi$/);
  });
});

describe('fixture: simbolo mancante', () => {
  it('segnala il rif tolto da descrizioni-punti.json con nome e pagina S3', () => {
    const contentDir = copiaFixture('simbolo-mancante');
    const { broken } = checkInventarioDescrizioni(contentDir);
    expect(broken).toEqual(['BROKEN inventario descrizioni: manca 1.1 (Terrazzo), S3 p. 7']);
  });
});

describe('fixture: checksum errato', () => {
  it('segnala lo sha256 registrato diverso da quello del file reale', () => {
    const contentDir = copiaFixture('checksum-errato');
    const { broken } = checkArtwork(contentDir, false);
    expect(broken).toHaveLength(1);
    expect(broken[0]).toMatch(/^BROKEN artwork: checksum non corrispondente per 0\.3 /);
    expect(broken[0]).toContain('S3 p. 7');
  });
});

describe('fixture: riga ufficiale che cita un rif sconosciuto', () => {
  it('segnala la cella con un rif che non esiste in descrizioni-punti.json', async () => {
    const contentDir = copiaFixture('riga-ref-sconosciuto');
    const { broken } = await checkRighe(contentDir);
    expect(broken.some((b) => b.includes('cita 99.9 in colonna D') && b.includes('S3 p. 3'))).toBe(true);
  });
});

describe('fixture: riga generata modificata a mano', () => {
  it('segnala la cella corrotta di una riga origine "generata"', async () => {
    const contentDir = copiaFixture('riga-generata-modificata');
    const { broken } = await checkRighe(contentDir);
    expect(broken.some((b) => b.startsWith('BROKEN righe generate: riga dc:gen:0001 cita 0.1 in colonna D'))).toBe(true);
    // Ora che scripts/lib/righe-regole.ts esiste (P1-CONTENUTI-TOOL-generate-righe),
    // il confronto byte-per-byte non viene più saltato: rigenera la riga 1 con lo
    // stesso count/seed dell'intestazione della fixture dal content/ reale (questa
    // funzione non prende un contentDir) e la trova diversa dalla cella corrotta.
    expect(broken.some((b) => b.includes('generate.json diverso dalla rigenerazione'))).toBe(true);
  });
});

describe('artwork: fill locale degli sha256 vuoti, mai in CI', () => {
  function scriviFixtureIsomMinima(sha256: string): string {
    const dest = mkdtempSync(join(tmpdir(), 'check-content-isom-fill-'));
    const contentDir = join(dest, 'content');
    mkdirSync(join(contentDir, 'simboli'), { recursive: true });
    mkdirSync(join(contentDir, 'artwork', 'isom'), { recursive: true });
    cpSync(join(CONTENT_REALE, 'artwork', 'isom', '101.png'), join(contentDir, 'artwork', 'isom', '101.png'));
    writeFileSync(
      join(contentDir, 'simboli', 'isom.json'),
      `${JSON.stringify(
        {
          v: 1,
          generato: '2026-09-05',
          sorgente: 'S1',
          simboli: [
            {
              rif: '101',
              fonte: 'S1',
              sezione: 'forme',
              nome: 'Curva di livello',
              descrizione: 'x',
              geometria: 'L',
              pagina: 13,
              artwork: { path: 'content/artwork/isom/101.png', formato: 'png', origine: 'S5', sha256 },
            },
          ],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    return contentDir;
  }

  it('con CI=1 fallisce e non scrive', () => {
    const contentDir = scriviFixtureIsomMinima('');
    const percorso = join(contentDir, 'simboli', 'isom.json');
    const prima = readFileSync(percorso, 'utf8');
    const { broken } = checkArtwork(contentDir, true);
    expect(broken).toHaveLength(1);
    expect(broken[0]).toMatch(/checksum non calcolato per 101/);
    expect(readFileSync(percorso, 'utf8')).toBe(prima);
    rmSync(dirname(contentDir), { recursive: true, force: true });
  });

  it('senza CI calcola e salva lo sha256, poi è idempotente', () => {
    const contentDir = scriviFixtureIsomMinima('');
    const percorso = join(contentDir, 'simboli', 'isom.json');

    const primoGiro = checkArtwork(contentDir, false);
    expect(primoGiro.broken).toEqual([]);
    const dopoIlFill = JSON.parse(readFileSync(percorso, 'utf8'));
    expect(dopoIlFill.simboli[0].artwork.sha256).toMatch(/^[a-f0-9]{64}$/);

    const secondoGiro = checkArtwork(contentDir, false);
    expect(secondoGiro.broken).toEqual([]);
    expect(readFileSync(percorso, 'utf8')).toBe(JSON.stringify(dopoIlFill, null, 2) + '\n');
    rmSync(dirname(contentDir), { recursive: true, force: true });
  });
});
