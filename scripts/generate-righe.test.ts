// @vitest-environment node
//
// scripts/generate-righe.test.ts — proves the generator (3.004, F-008) is
// deterministic and prefix-stable, that every generated cell is valid
// against the real content, that no two generated rows (nor a generated and
// an official row) share the same cells, and that the sentence template
// renders exactly for two known rows.
// Spec: akaaso/09-tasks/P1-CONTENUTI-TOOL-generate-righe.md

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { Colonna, Compatibilita, RigaDescrizione, Simbolo } from './lib/righe-regole.ts';
import { firmaCelle, generaRiga, rigeneraTutte } from './lib/righe-regole.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(RADICE, 'content');
const SEED_DEFAULT = 20260905;

function leggiJson<T>(percorso: string): T {
  return JSON.parse(readFileSync(percorso, 'utf8')) as T;
}

const SIMBOLI = leggiJson<{ simboli: Simbolo[] }>(join(CONTENT_DIR, 'simboli', 'descrizioni-punti.json')).simboli;
const COMPAT = leggiJson<Compatibilita>(join(CONTENT_DIR, 'compatibilita.json'));
const UFFICIALI = leggiJson<{ righe: RigaDescrizione[] }>(join(CONTENT_DIR, 'righe', 'ufficiali.json')).righe;

function mappaSimboliPerColonna(simboli: Simbolo[]): Map<Colonna, Set<string>> {
  const mappa = new Map<Colonna, Set<string>>();
  for (const s of simboli) {
    if (!s.colonna) continue;
    if (!mappa.has(s.colonna)) mappa.set(s.colonna, new Set());
    mappa.get(s.colonna)!.add(s.rif);
  }
  return mappa;
}

const PER_COLONNA = mappaSimboliPerColonna(SIMBOLI);

/** Same exception `scripts/check-content.ts` grants: a D-rif is valid in E
 * when G is 11.15 ("tra") or F is a combination symbol (10.1/10.2) — the
 * row's "second D feature placed in E". */
function celleValide(riga: RigaDescrizione): boolean {
  for (const colonna of ['C', 'D', 'E', 'F', 'G', 'H'] as const) {
    const cella = riga.celle[colonna];
    if (cella === undefined || typeof cella === 'string') continue; // F libera (dimensione)
    const validi = PER_COLONNA.get(colonna);
    const secondoOggetto =
      colonna === 'E' &&
      (riga.celle.G?.rif === '11.15' || ['10.1', '10.2'].includes((riga.celle.F as { rif?: string } | undefined)?.rif ?? '')) &&
      (PER_COLONNA.get('D')?.has(cella.rif) ?? false);
    if (secondoOggetto) continue;
    if (!validi || !validi.has(cella.rif)) return false;
  }
  return true;
}

describe('generate-righe: determinismo e stabilità di prefisso', () => {
  it('due rigenerazioni con lo stesso count/seed sono identiche byte per byte', () => {
    const a = JSON.stringify(rigeneraTutte(80, SEED_DEFAULT), null, 2);
    const b = JSON.stringify(rigeneraTutte(80, SEED_DEFAULT), null, 2);
    expect(a).toBe(b);
  });

  it('count 50 è un prefisso identico byte per byte di count 80', () => {
    const cinquanta = rigeneraTutte(50, SEED_DEFAULT);
    const ottanta = rigeneraTutte(80, SEED_DEFAULT);
    expect(cinquanta.righe).toHaveLength(50);
    expect(ottanta.righe).toHaveLength(80);
    for (let i = 0; i < 50; i += 1) {
      expect(JSON.stringify(ottanta.righe[i])).toBe(JSON.stringify(cinquanta.righe[i]));
    }
  });
});

describe('generate-righe: validità delle celle', () => {
  const documento = rigeneraTutte(200, SEED_DEFAULT);

  it('ogni riga generata cita solo rif esistenti nella colonna giusta (o il secondo D ammesso in E)', () => {
    for (const riga of documento.righe) {
      expect(celleValide(riga)).toBe(true);
    }
  });

  it('ogni riga generata ha origine "generata", un id dc:gen:NNNN e un codice gen-NNNN', () => {
    for (const [indice, riga] of documento.righe.entries()) {
      const numero = String(indice + 1).padStart(4, '0');
      expect(riga.origine).toBe('generata');
      expect(riga.id).toBe(`dc:gen:${numero}`);
      expect(riga.codice).toBe(`gen-${numero}`);
      expect(riga.numero).toBeUndefined();
    }
  });
});

describe('generate-righe: nessun duplicato', () => {
  it('nessuna riga generata duplica le celle di un’altra riga generata', () => {
    const documento = rigeneraTutte(200, SEED_DEFAULT);
    const firme = documento.righe.map((r) => firmaCelle(r.celle));
    expect(new Set(firme).size).toBe(firme.length);
  });

  it('nessuna riga generata duplica le celle di una riga ufficiale', () => {
    const documento = rigeneraTutte(200, SEED_DEFAULT);
    const firmeUfficiali = new Set(UFFICIALI.map((r) => firmaCelle(r.celle)));
    for (const riga of documento.righe) {
      expect(firmeUfficiali.has(firmaCelle(riga.celle))).toBe(false);
    }
  });
});

describe('generate-righe: modello di frase (due righe note)', () => {
  it('riga 1 (seed di default): "Terrazzo più a sud"', () => {
    const riga = generaRiga(1, SEED_DEFAULT, SIMBOLI, COMPAT, {
      escludi: new Set(UFFICIALI.map((r) => firmaCelle(r.celle))),
    });
    expect(riga.testo).toBe('Terrazzo più a sud');
    expect(riga.celle.D?.rif).toBe('1.1');
    expect(riga.celle.C).toEqual({ rif: '0.1', direzione: 'S' });
  });

  it('riga 2 (seed di default): "Lago, estremità nord-est"', () => {
    const escludi = new Set(UFFICIALI.map((r) => firmaCelle(r.celle)));
    const riga1 = generaRiga(1, SEED_DEFAULT, SIMBOLI, COMPAT, { escludi });
    escludi.add(firmaCelle(riga1.celle));
    const riga2 = generaRiga(2, SEED_DEFAULT, SIMBOLI, COMPAT, { escludi });
    expect(riga2.testo).toBe('Lago, estremità nord-est');
    expect(riga2.celle.D?.rif).toBe('3.1');
    expect(riga2.celle.G).toEqual({ rif: '11.8', direzione: 'NE' });
  });
});

describe('generate-righe: forme speciali (tra, combinazione)', () => {
  const documento = rigeneraTutte(200, SEED_DEFAULT);

  it('una riga con G=11.15 ("tra") non ha C né H, ed E ripete il rif di D', () => {
    const riga = documento.righe.find((r) => r.celle.G?.rif === '11.15');
    expect(riga).toBeDefined();
    expect(riga!.celle.C).toBeUndefined();
    expect(riga!.celle.F).toBeUndefined();
    expect(riga!.celle.H).toBeUndefined();
    expect(riga!.celle.E?.rif).toBe(riga!.celle.D?.rif);
    expect(riga!.testo.startsWith('Tra ')).toBe(true);
  });

  it('una riga di combinazione (F=10.1/10.2) non ha C né G, ed E ripete il rif di D', () => {
    const riga = documento.righe.find((r) => typeof r.celle.F === 'object' && r.celle.F !== undefined);
    expect(riga).toBeDefined();
    expect(riga!.celle.C).toBeUndefined();
    expect(riga!.celle.G).toBeUndefined();
    expect(riga!.celle.E?.rif).toBe(riga!.celle.D?.rif);
    expect(['10.1', '10.2']).toContain((riga!.celle.F as { rif: string }).rif);
  });
});
