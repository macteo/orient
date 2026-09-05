// scripts/build-mazzi.ts — il passo che precede `vite build` (F-006).
//
// Legge `content/`, assembla i quattro mazzi con `src/mazzi/assembla.ts` (che
// è puro e testato a parte), e scrive tutto ciò che Vite poi impacchetta:
//
//   .generated/mazzi/<mazzo>.json                        un `MazzoBuild` per mazzo
//   .generated/pages/<mazzo>/{flashcard,quiz,risultati}/index.html   (4 × 3)
//   .generated/pages/fonti/index.html
//   index.html                                            la home, alla radice
//   src/allenamento/facce/sprite.generated.ts             lo sprite dei pittogrammi
//   public/content/artwork/**                             le immagini che le facce caricano
//
// Tredici pagine in tutto (`akaaso/04-features/_routes.md`), ognuna dal suo
// template in `src/sito/templates/` con i dati inlinati in uno
// `<script type="application/json">`.
//
// Determinismo (F-006 AC-5): nessuna data, nessun percorso assoluto della
// macchina, elenchi di file ordinati, chiavi in ordine di mazzo → due build
// dallo stesso contenuto scrivono gli stessi byte.

import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assemblaMazzi,
  riepilogo,
  type Contenuti,
  type DefinizioneMazzo,
  type SimboloContenuto,
} from '../src/mazzi/assembla.ts';
import type { Esempio, MazzoBuild, RigaDescrizione } from '../src/mazzi/tipi.ts';
import { generaSprite, type SimboloSprite } from './lib/sprite.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATO = join(RADICE, '.generated');
const TEMPLATE = join(RADICE, 'src/sito/templates');
const ARTWORK_PUBBLICO = join(RADICE, 'public/content');

/** Il base path del sito, sempre con lo slash davanti e dietro (`/`, `/orient/`). */
function basePath(): string {
  const grezzo = process.env.VITE_BASE ?? '/';
  const conIniziale = grezzo.startsWith('/') ? grezzo : `/${grezzo}`;
  return conIniziale.endsWith('/') ? conIniziale : `${conIniziale}/`;
}

function leggiJson<T>(percorso: string): T {
  return JSON.parse(readFileSync(join(RADICE, percorso), 'utf8')) as T;
}

function scrivi(percorso: string, contenuto: string): void {
  mkdirSync(dirname(percorso), { recursive: true });
  writeFileSync(percorso, contenuto);
}

/**
 * Serializza per l'inlining in `<script type="application/json">`: il solo
 * carattere pericoloso è `<` (chiuderebbe il tag), e `<` è un escape
 * JSON valido che `JSON.parse` riporta com'era.
 */
function jsonInlinato(valore: unknown): string {
  return JSON.stringify(valore).replaceAll('<', '\\u003c');
}

/** Sostituisce i segnaposto `{{CHIAVE}}`; se ne resta uno, il template è fuori sincrono. */
function rendi(template: string, valori: Record<string, string>): string {
  const reso = template.replace(/\{\{([A-Z_]+)\}\}/g, (_intero, chiave: string) => {
    if (!(chiave in valori)) {
      throw new Error(`build-mazzi: il template usa {{${chiave}}}, che non è fra i valori forniti`);
    }
    return valori[chiave];
  });
  const rimasto = reso.match(/\{\{[A-Z_]+\}\}/);
  if (rimasto) throw new Error(`build-mazzi: segnaposto non sostituito: ${rimasto[0]}`);
  return reso;
}

// ---------------------------------------------------------------- contenuto

type FileSezioni = { v: number; mazzi: DefinizioneMazzo[] };
type FileSimboli = { simboli: SimboloContenuto[] };
type FileRighe = { righe: RigaDescrizione[] };
type FileEsempi = { esempi: Esempio[] };
type FileEsempiSezioni = { pagine: Record<string, string> };
type FileEsclusi = { esclusi: { rif?: string }[] };

/**
 * I `rif` che `content/esclusi/*.json` documenta come lacune note: per questi
 * il file d'artwork può mancare (es. 12.3, «Punto radio o TV», che S4 non
 * disegna). La carta resta nel mazzo — ha nome e definizione — e il suo
 * pittogramma semplicemente non c'è, come già accetta `check:content`.
 */
function rifEsclusi(): Set<string> {
  const rif = new Set<string>();
  for (const file of ['content/esclusi/descrizioni.json', 'content/esclusi/isom.json']) {
    if (!existsSync(join(RADICE, file))) continue;
    for (const escluso of leggiJson<FileEsclusi>(file).esclusi) {
      if (escluso.rif) rif.add(escluso.rif);
    }
  }
  return rif;
}

function leggiContenuti(base: string): { contenuti: Contenuti; mazzi: DefinizioneMazzo[]; artwork: string[] } {
  const sezioni = leggiJson<FileSezioni>('content/sezioni.json');
  const descrizioni = leggiJson<FileSimboli>('content/simboli/descrizioni-punti.json').simboli;
  const isom = leggiJson<FileSimboli>('content/simboli/isom.json').simboli;
  const esempi = leggiJson<FileEsempi>('content/esempi/esempi.json').esempi;

  const contenuti: Contenuti = {
    descrizioni,
    isom,
    righeUfficiali: leggiJson<FileRighe>('content/righe/ufficiali.json').righe,
    righeGenerate: leggiJson<FileRighe>('content/righe/generate.json').righe,
    esempi,
    esempiPerPagina: leggiJson<FileEsempiSezioni>('content/esempi/sezioni.json').pagine,
    // Le facce mettono questo percorso direttamente in `img.src`: deve essere
    // un URL risolvibile da qualunque profondità di pagina, quindi assoluto
    // rispetto al base del sito (2.007: mai un percorso assoluto scritto a
    // mano, sempre il base).
    urlArtwork: (percorso) => `${base}${percorso}`,
  };

  // Le immagini che finiscono davvero in una carta, e che quindi devono
  // esistere in `dist/` (il link check di F-009 le risolve). Le lacune
  // documentate in `content/esclusi/` restano fuori.
  const lacune = rifEsclusi();
  const conArtwork = (s: SimboloContenuto) => !s.nascondi && !lacune.has(s.rif);
  const artwork = [
    ...descrizioni.filter(conArtwork).map((s) => s.artwork.path),
    ...isom.filter(conArtwork).map((s) => s.artwork.path),
    ...esempi.filter((e) => !e.nascondi).flatMap((e) => [e.carta, e.terreno, e.riga]),
  ];
  return { contenuti, mazzi: sezioni.mazzi, artwork };
}

// ------------------------------------------------------------------ sprite

/**
 * Riscrive `src/allenamento/facce/sprite.generated.ts` con **ogni** pittogramma
 * di `content/artwork/descrizioni-punti/`, con la chiave `<rif>[<DIR>]` che è
 * il nome del file: `cella(rif, direzione)` costruisce `#s-<rif><direzione>`
 * e lo trova. La forma dell'export (`SPRITE_MARKUP`) è quella che il modulo
 * facce già consuma.
 */
function emettiSprite(): number {
  const cartella = join(RADICE, 'content/artwork/descrizioni-punti');
  const nomi = readdirSync(cartella)
    .filter((nome) => nome.endsWith('.svg'))
    .sort();
  const simboli: SimboloSprite[] = nomi.map((nome) => ({
    rif: nome.slice(0, -'.svg'.length),
    svg: readFileSync(join(cartella, nome), 'utf8'),
  }));
  const intestazione = [
    '// src/allenamento/facce/sprite.generated.ts — GENERATO da scripts/build-mazzi.ts',
    '// (via scripts/lib/sprite.ts). Non modificare a mano: rigenera con `npm run build`.',
    '//',
    `// Uno <symbol id="s-<rif>[<DIR>]"> per ognuno dei ${simboli.length} pittogrammi in`,
    '// content/artwork/descrizioni-punti/ (SVG Purple Pen vendorizzati, S4, BSD a tre',
    '// clausole). Il nero letterale è sostituito da `currentColor`; forme, tracciati e',
    '// proporzioni restano quelli d’origine (1.005).',
    '',
  ].join('\n');
  scrivi(
    join(RADICE, 'src/allenamento/facce/sprite.generated.ts'),
    `${intestazione}export const SPRITE_MARKUP = ${JSON.stringify(generaSprite(simboli))};\n`,
  );
  return simboli.length;
}

// ----------------------------------------------------------------- artwork

/**
 * Mette le immagini referenziate sotto `public/`, l'unica cartella che Vite
 * copia in `dist/` senza passare dal grafo dei moduli: così
 * `<base>content/artwork/…` risolve sia in `vite preview` sia su Pages.
 * Hard link dove il filesystem lo permette, copia altrimenti — i file
 * d'origine non vengono mai modificati.
 */
function copiaArtwork(percorsi: string[]): number {
  rmSync(ARTWORK_PUBBLICO, { recursive: true, force: true });
  const unici = [...new Set(percorsi)].sort();
  for (const percorso of unici) {
    if (!percorso.startsWith('content/artwork/')) {
      throw new Error(`build-mazzi: percorso d'artwork fuori da content/artwork/: ${percorso}`);
    }
    const sorgente = join(RADICE, percorso);
    if (!existsSync(sorgente)) {
      throw new Error(`build-mazzi: artwork mancante: ${percorso}`);
    }
    const destinazione = join(RADICE, 'public', percorso);
    mkdirSync(dirname(destinazione), { recursive: true });
    try {
      linkSync(sorgente, destinazione);
    } catch {
      copyFileSync(sorgente, destinazione);
    }
  }
  return unici.length;
}

// ------------------------------------------------------------------ pagine

type Pagina = { percorso: string; template: string; valori: Record<string, string> };

/** `../../` per `<mazzo>/<modo>/index.html`, `../` per `fonti/`, `./` per la home. */
function radiceRelativa(percorso: string): string {
  const profondita = percorso.split('/').length - 1;
  return profondita === 0 ? './' : '../'.repeat(profondita);
}

function paginaMazzo(
  mazzo: MazzoBuild,
  cartella: 'flashcard' | 'quiz' | 'risultati',
  titolo: string,
): Pagina {
  const percorso = `${mazzo.id}/${cartella}/index.html`;
  return {
    percorso,
    template: cartella === 'risultati' ? 'risultati.html' : 'run.html',
    valori: {
      TITOLO_DOCUMENTO: `${titolo} · ${mazzo.nome} · orient`,
      TITOLO: `${titolo} · ${mazzo.nome}`,
      RADICE: radiceRelativa(percorso),
      MAZZO_ID: mazzo.id,
      MAZZO_NOME: mazzo.nome,
      MODO: cartella === 'quiz' ? 'quiz' : 'flashcard',
      ENTRY: cartella === 'risultati' ? 'risultati' : cartella,
      MAZZO: jsonInlinato(mazzo),
    },
  };
}

function pagine(mazzi: MazzoBuild[]): Pagina[] {
  const elenco: Pagina[] = [
    {
      percorso: 'index.html',
      template: 'home.html',
      valori: {
        TITOLO_DOCUMENTO: 'orient',
        TITOLO: 'Scegli un mazzo',
        RADICE: radiceRelativa('index.html'),
        MAZZI: jsonInlinato(mazzi.map(riepilogo)),
      },
    },
  ];
  for (const mazzo of mazzi) {
    elenco.push(paginaMazzo(mazzo, 'flashcard', 'Flash card'));
    elenco.push(paginaMazzo(mazzo, 'quiz', 'Quiz'));
    elenco.push(paginaMazzo(mazzo, 'risultati', 'Risultati'));
  }
  elenco.push({
    percorso: 'fonti/index.html',
    template: 'fonti.html',
    valori: {
      TITOLO_DOCUMENTO: 'Fonti e licenze · orient',
      TITOLO: 'Fonti e licenze',
      RADICE: radiceRelativa('fonti/index.html'),
      FONTI: jsonInlinato(leggiJson<unknown>('content/fonti.json')),
    },
  });
  return elenco;
}

function emettiPagine(elenco: Pagina[]): void {
  const templateLetti = new Map<string, string>();
  for (const pagina of elenco) {
    let template = templateLetti.get(pagina.template);
    if (template === undefined) {
      template = readFileSync(join(TEMPLATE, pagina.template), 'utf8');
      templateLetti.set(pagina.template, template);
    }
    // La home è l'entry alla radice del progetto (Vite la emette come
    // `dist/index.html`); le altre dodici stanno sotto `.generated/pages/`,
    // da dove `vite.config.ts` le raccoglie.
    const destinazione =
      pagina.percorso === 'index.html'
        ? join(RADICE, 'index.html')
        : join(GENERATO, 'pages', pagina.percorso);
    scrivi(destinazione, rendi(template, pagina.valori));
  }
}

// -------------------------------------------------------------------- main

function main(): void {
  if (!existsSync(join(RADICE, 'content/sezioni.json'))) {
    throw new Error(
      'build-mazzi: manca content/sezioni.json — il contenuto non è stato generato (npm run check:content)',
    );
  }
  const base = basePath();
  const { contenuti, mazzi: definizioni, artwork } = leggiContenuti(base);

  // `.generated/` è interamente derivato: ripartire da zero evita che una
  // pagina di un contenuto vecchio sopravviva alla glob di `vite.config.ts`.
  rmSync(GENERATO, { recursive: true, force: true });

  const mazzi = assemblaMazzi(contenuti, definizioni);
  for (const mazzo of mazzi) {
    scrivi(join(GENERATO, 'mazzi', `${mazzo.id}.json`), `${JSON.stringify(mazzo, null, 2)}\n`);
  }

  const pittogrammi = emettiSprite();
  const immagini = copiaArtwork(artwork);
  const elenco = pagine(mazzi);
  emettiPagine(elenco);

  const righe = mazzi.map((mazzo) => {
    const sezioni = mazzo.sezioni.map((s) => `${s.id} ${s.carte.length}`).join(', ');
    return `  ${mazzo.id.padEnd(21)} ${String(Object.keys(mazzo.carte).length).padStart(4)} carte  (${sezioni})`;
  });
  console.log(
    [
      `build-mazzi: base ${base}`,
      ...righe,
      `  ${elenco.length - 1} pagine in .generated/pages + la home in index.html`,
      `  ${pittogrammi} pittogrammi nello sprite, ${immagini} immagini in public/content/artwork`,
    ].join('\n'),
  );
}

main();
