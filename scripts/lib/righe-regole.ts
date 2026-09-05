// scripts/lib/righe-regole.ts — pure rules for the generated rows of the
// *Descrizioni complete* deck (3.004, F-008). `generaRiga(i, seed, simboli,
// compat)` builds one row as a pure function of its index and the seed;
// `rigeneraTutte(count, seed)` loads the real content, drives the loop and
// returns the exact document `scripts/generate-righe.ts` writes to
// `content/righe/generate.json` and `scripts/check-content.ts` diffs against
// it byte for byte — the two must stay perfectly in sync, which is why the
// script never re-derives the document shape itself: it only calls this.
//
// Design (3.004, akaaso/09-tasks/P1-CONTENUTI-TOOL-generate-righe.md):
//   1. D: uniform over every colonna-D symbol.
//   2. C: p=1/4; uniform over the five colonna-C symbols; a direction, if the
//      symbol has `direzioni`, uniform over its own set (0.1: N/E/S/W, 0.2:
//      NE/SE/SW/NW — together the eight, split per symbol).
//   3. G: p=3/4; uniform over the fifteen colonna-G symbols. Landing on
//      11.15 ("tra, fra, in mezzo") turns the row into the *tra* shape: C is
//      dropped, F is never rolled, and E is forced to a second D — the same
//      D already drawn, mirroring the source's own example ("Tra due
//      boschetti fitti", D=E=4.5) and satisfying check-content's rule that a
//      D-rif is only valid in E when G is 11.15 or F is a combination.
//   4. F: p=1/2, only for rows that are not already the *tra* shape.
//      `compatibilita.F[D]` existing wins first (a value from its list — F
//      is the dimension as a plain string, e.g. "1.0", "5x5"). Failing that,
//      a small hand-kept allowlist of D features that are genuinely linear
//      objects (road, path, power line, stream, channel — the two symbols
//      10.1/10.2 are defined on S3 p. 13 as "the point where two linear
//      objects intersect/meet", so only linear D's are plausible here; none
//      of the five is already in `compatibilita.F`) turns the row into the
//      *combo* shape: F becomes a reference to 10.1 or 10.2, G is dropped,
//      and E is forced to the same D, exactly as in the source's own example
//      ("Incrocio sentieri", D=E=5.2, F=10.1).
//   5. E: p=1/3 from `compatibilita.E[D]`, only for a *normale* row (skipped,
//      not merely empty, when that list is empty — the row simply has no E).
//   6. H: p=1/10 uniform over the four colonna-H symbols, only for a
//      *normale* row.
//   A row whose cells duplicate an earlier generated row or an official one
//   is re-rolled: the next attempt reseeds with `hash(seed, i, tentativo)`,
//   so the sequence stays fully deterministic and prefix-stable (row i never
//   depends on rows after it, or on the total count).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..', '..');
const CONTENT_DIR = join(RADICE, 'content');

// ===========================================================================
// Tipi
// ===========================================================================

export type Direzione8 = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type Colonna = 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type Cella = { rif: string; direzione?: Direzione8 };
export type Celle = Partial<{ C: Cella; D: Cella; E: Cella; F: Cella | string; G: Cella; H: Cella }>;

export type RigaDescrizione = {
  id: string;
  numero?: string;
  codice: string;
  celle: Celle;
  testo: string;
  origine: 'ufficiale' | 'generata';
};

/** The slice of `Simbolo` (content model, `_context.md`) this module reads. */
export type Simbolo = {
  rif: string;
  nome: string;
  colonna?: Colonna;
  direzioni?: string[];
};

export type RegolaDimensione = { tipo: 'altezza' | 'dimensioni' | 'profondita'; valori: string[] };

export type Compatibilita = {
  E: Record<string, string[]>;
  F: Record<string, RegolaDimensione>;
  Gdue: string[];
  combinazioni: string[];
  Gsolo: string[];
  C: { direzioni: string[]; senza: string[] };
};

export type Rng = () => number;

// ===========================================================================
// RNG — mulberry32 (stessa formula di src/allenamento/rng.ts, copiata qui
// perché quel file porta `import.meta.env` di Vite e questo script deve
// restare eseguibile da `node` puro) seminato da un hash di (seed, i,
// tentativo), così ogni riga — e ogni suo ri-tiro — ha un flusso proprio.
// ===========================================================================

function mulberry32(seme: number): Rng {
  let a = seme >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a a 32 bit su una sequenza di interi: combina (seed, i, tentativo) in un unico seme. */
function hash32(...parti: number[]): number {
  let h = 0x811c9dc5 >>> 0;
  for (const p of parti) {
    h ^= p >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function pickIndex(rng: Rng, n: number): number {
  return Math.min(n - 1, Math.floor(rng() * n));
}

function pick<T>(rng: Rng, lista: readonly T[]): T {
  return lista[pickIndex(rng, lista.length)];
}

function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

// ===========================================================================
// Parole di direzione e categorie — il nome memorizzato di un simbolo con
// direzione ("Parte (esterna) nord-est", "Piede nord-est"…) porta una sola
// direzione di riferimento; per una riga generata con una direzione diversa
// da quella di riferimento il nome verbatim sarebbe sbagliato (mostrerebbe
// "nord-est" per una cella disegnata a sud-ovest). CATEGORIA_DIREZIONALE
// isola la parte non direzionale del nome (lasciando cadere l'eventuale
// «(interno)»/«(esterno)», come fa già src/allenamento/facce nel suo dato di
// prova per 11.4+NE → «angolo nord-est»); PAROLA_DIREZIONE è la sola
// convenzione italiana per gli otto punti cardinali.
// ===========================================================================

const PAROLA_DIREZIONE: Record<Direzione8, string> = {
  N: 'nord',
  NE: 'nord-est',
  E: 'est',
  SE: 'sud-est',
  S: 'sud',
  SW: 'sud-ovest',
  W: 'ovest',
  NW: 'nord-ovest',
};

const CATEGORIA_DIREZIONALE: Record<string, string> = {
  '0.1': 'più a',
  '0.2': 'più a',
  '11.1': 'parte',
  '11.2': 'bordo',
  '11.3': 'parte',
  '11.4': 'angolo',
  '11.5': 'angolo',
  '11.6': 'punta',
  '11.8': 'estremità',
  '11.14': 'piede',
};

/** D features that are genuinely linear objects (S3 p. 13, 10.1/10.2: "il
 * punto in cui due oggetti lineari si intersecano/incontrano") and are not
 * already in `compatibilita.F` — the set eligible for the *combo* shape. */
const COMBINAZIONE_D = new Set(['3.4', '3.5', '5.1', '5.2', '5.5']);

const MAX_TENTATIVI = 500;

function fraseDirezionale(s: Simbolo, direzione?: Direzione8): string {
  const categoria = CATEGORIA_DIREZIONALE[s.rif];
  if (direzione && categoria) return `${categoria} ${PAROLA_DIREZIONE[direzione]}`;
  return s.nome.toLowerCase();
}

function capitalizza(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fraseDimensione(regola: RegolaDimensione, valore: string): string {
  if (regola.tipo === 'altezza') return `${valore} m d’altezza`;
  if (regola.tipo === 'profondita') return `${valore} m di profondità`;
  const [a, b] = valore.split('x');
  return `${a} x ${b} m`;
}

// ===========================================================================
// Generazione di una riga
// ===========================================================================

type Forma = 'normale' | 'tra' | 'combo';

type ValoreF = { tipo: 'dimensione'; regola: RegolaDimensione; valore: string } | { tipo: 'combinazione'; simbolo: Simbolo };

function raggruppaPerColonna(simboli: Simbolo[]): Map<Colonna, Simbolo[]> {
  const mappa = new Map<Colonna, Simbolo[]>();
  for (const s of simboli) {
    if (!s.colonna) continue;
    if (!mappa.has(s.colonna)) mappa.set(s.colonna, []);
    mappa.get(s.colonna)!.push(s);
  }
  return mappa;
}

/** Canonical signature of a row's cells (column order C,D,E,F,G,H, independent of object key order) — used to detect a duplicate against earlier generated rows or an official one. */
export function firmaCelle(celle: Celle): string {
  const parti: string[] = [];
  for (const colonna of ['C', 'D', 'E', 'F', 'G', 'H'] as const) {
    const v = celle[colonna];
    if (v === undefined) continue;
    parti.push(typeof v === 'string' ? `${colonna}=${v}` : `${colonna}=${v.rif}${v.direzione ?? ''}`);
  }
  return parti.join('|');
}

function componiTesto(
  forma: Forma,
  ctx: {
    d: Simbolo;
    c?: Simbolo;
    cDirezione?: Direzione8;
    e?: Simbolo;
    f?: ValoreF;
    g?: Simbolo;
    gDirezione?: Direzione8;
    h?: Simbolo;
  },
): string {
  const { d, c, cDirezione, e, f, g, gDirezione, h } = ctx;
  if (forma === 'tra') {
    // e === d by construction (a second D placed in E).
    return capitalizza(`tra ${d.nome.toLowerCase()} e ${(e ?? d).nome.toLowerCase()}`);
  }
  if (forma === 'combo' && f?.tipo === 'combinazione') {
    return `${d.nome}, ${f.simbolo.nome.toLowerCase()}`;
  }
  let testo = d.nome;
  if (c) testo += ` ${fraseDirezionale(c, cDirezione)}`;
  if (e) testo += `, ${e.nome.toLowerCase()}`;
  if (f) testo += `, ${f.tipo === 'dimensione' ? fraseDimensione(f.regola, f.valore) : f.simbolo.nome.toLowerCase()}`;
  if (g) testo += `, ${fraseDirezionale(g, gDirezione)}`;
  if (h) testo += `, ${h.nome.toLowerCase()}`;
  return testo;
}

function costruisciCandidato(
  rng: Rng,
  liste: { D: Simbolo[]; C: Simbolo[]; G: Simbolo[]; H: Simbolo[] },
  perRif: Map<string, Simbolo>,
  compat: Compatibilita,
): { celle: Celle; testo: string } {
  const d = pick(rng, liste.D);

  let c: Simbolo | undefined;
  let cDirezione: Direzione8 | undefined;
  if (chance(rng, 1 / 4)) {
    c = pick(rng, liste.C);
    if (c.direzioni && c.direzioni.length > 0) cDirezione = pick(rng, c.direzioni as Direzione8[]);
  }

  let forma: Forma = 'normale';
  let g: Simbolo | undefined;
  let gDirezione: Direzione8 | undefined;
  if (chance(rng, 3 / 4)) {
    g = pick(rng, liste.G);
    if (g.rif === '11.15') {
      forma = 'tra';
    } else if (g.direzioni && g.direzioni.length > 0) {
      gDirezione = pick(rng, g.direzioni as Direzione8[]);
    }
  }

  let f: ValoreF | undefined;
  if (forma !== 'tra' && chance(rng, 1 / 2)) {
    const regola = compat.F[d.rif];
    if (regola) {
      f = { tipo: 'dimensione', regola, valore: pick(rng, regola.valori) };
    } else if (COMBINAZIONE_D.has(d.rif)) {
      const rifCombinazione = pick(rng, compat.combinazioni);
      const simboloCombinazione = perRif.get(rifCombinazione);
      if (simboloCombinazione) {
        f = { tipo: 'combinazione', simbolo: simboloCombinazione };
        forma = 'combo';
      }
    }
  }

  if (forma === 'combo') {
    c = undefined;
    cDirezione = undefined;
    g = undefined;
    gDirezione = undefined;
  }
  if (forma === 'tra') {
    c = undefined;
    cDirezione = undefined;
    f = undefined;
  }

  let e: Simbolo | undefined;
  if (forma === 'tra' || forma === 'combo') {
    e = d;
  } else if (chance(rng, 1 / 3)) {
    const opzioni = compat.E[d.rif] ?? [];
    if (opzioni.length > 0) e = perRif.get(pick(rng, opzioni));
  }

  let h: Simbolo | undefined;
  if (forma === 'normale' && chance(rng, 1 / 10)) {
    h = pick(rng, liste.H);
  }

  const celle: Celle = {};
  if (c) celle.C = cDirezione ? { rif: c.rif, direzione: cDirezione } : { rif: c.rif };
  celle.D = { rif: d.rif };
  if (e) celle.E = { rif: e.rif };
  if (f) celle.F = f.tipo === 'dimensione' ? f.valore : { rif: f.simbolo.rif };
  if (g) celle.G = gDirezione ? { rif: g.rif, direzione: gDirezione } : { rif: g.rif };
  if (h) celle.H = { rif: h.rif };

  const testo = componiTesto(forma, { d, c, cDirezione, e, f, g, gDirezione, h });
  return { celle, testo };
}

/**
 * Row `i` (1-based) as a pure function of `(seed, i)`: same inputs, same
 * output, forever — the seed and the row index are the only things that
 * matter, never `count` or which rows exist elsewhere, which is what makes
 * the generator prefix-stable. `escludi` carries the canonical signatures
 * (see `firmaCelle`) of every row that must not be repeated — the nine
 * official ones, plus every generated row already accepted before `i` —
 * and a collision re-rolls with the next sub-seed `hash(seed, i, tentativo)`.
 */
export function generaRiga(
  i: number,
  seed: number,
  simboli: Simbolo[],
  compat: Compatibilita,
  opts: { escludi?: Set<string> } = {},
): RigaDescrizione {
  const escludi = opts.escludi ?? new Set<string>();
  const perColonna = raggruppaPerColonna(simboli);
  const perRif = new Map(simboli.map((s) => [s.rif, s] as const));
  const liste = {
    D: perColonna.get('D') ?? [],
    C: perColonna.get('C') ?? [],
    G: perColonna.get('G') ?? [],
    H: perColonna.get('H') ?? [],
  };

  for (let tentativo = 0; tentativo < MAX_TENTATIVI; tentativo += 1) {
    const rng = mulberry32(hash32(seed, i, tentativo));
    const candidato = costruisciCandidato(rng, liste, perRif, compat);
    if (escludi.has(firmaCelle(candidato.celle))) continue;
    const numero = String(i).padStart(4, '0');
    return {
      id: `dc:gen:${numero}`,
      codice: `gen-${numero}`,
      celle: candidato.celle,
      testo: candidato.testo,
      origine: 'generata',
    };
  }
  throw new Error(`generaRiga: nessuna riga valida dopo ${MAX_TENTATIVI} tentativi (i=${i}, seed=${seed})`);
}

// ===========================================================================
// Rigenerazione completa — legge il content/ reale (percorsi relativi a
// questo modulo, non alla cartella corrente) e produce l'intero documento
// che scripts/generate-righe.ts scrive e scripts/check-content.ts confronta
// byte per byte.
// ===========================================================================

function caricaContenuto(): { simboli: Simbolo[]; compat: Compatibilita; ufficiali: RigaDescrizione[] } {
  const simboli = (
    JSON.parse(readFileSync(join(CONTENT_DIR, 'simboli', 'descrizioni-punti.json'), 'utf8')) as { simboli: Simbolo[] }
  ).simboli;
  const compat = JSON.parse(readFileSync(join(CONTENT_DIR, 'compatibilita.json'), 'utf8')) as Compatibilita;
  const ufficiali = (
    JSON.parse(readFileSync(join(CONTENT_DIR, 'righe', 'ufficiali.json'), 'utf8')) as { righe: RigaDescrizione[] }
  ).righe;
  return { simboli, compat, ufficiali };
}

export type DocumentoGenerate = {
  v: 1;
  count: number;
  seed: number;
  versioneRegole: 1;
  sorgente: 'S3';
  righe: RigaDescrizione[];
};

/**
 * The full `content/righe/generate.json` document for `(count, seed)`: no
 * `contentDir` parameter — it always reads the committed `content/` next to
 * this module, which is what lets `scripts/check-content.ts` call it with
 * just the header's own `count`/`seed` and diff the result byte for byte
 * against the file on disk.
 */
export function rigeneraTutte(count: number, seed: number): DocumentoGenerate {
  const { simboli, compat, ufficiali } = caricaContenuto();
  const escludi = new Set<string>(ufficiali.map((r) => firmaCelle(r.celle)));
  const righe: RigaDescrizione[] = [];
  for (let i = 1; i <= count; i += 1) {
    const riga = generaRiga(i, seed, simboli, compat, { escludi });
    escludi.add(firmaCelle(riga.celle));
    righe.push(riga);
  }
  return { v: 1, count, seed, versioneRegole: 1, sorgente: 'S3', righe };
}
