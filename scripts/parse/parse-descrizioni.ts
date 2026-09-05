// parse-descrizioni.ts — S3 (akaaso/sources/iof_descrizioni_punti_ital.md, pages
// 7-16 + §13-14) -> content/simboli/descrizioni-punti.json, plus vendored S4
// pictogram SVGs, an exclusion log and a name cross-check report.
// Spec: akaaso/09-tasks/P1-CONTENUTI-TOOL-parse-descrizioni.md
// Design: akaaso/03-modules/003-pipeline-descrizioni-simboli.md
//
// Hand count (checked once against the source, pages 7-16, before trusting the
// parser — see the design doc's own warning about this): 115 simboli =
//   5 colonna-c (0.1-0.5) + 16 d-morfologici (1.1-1.16) + 9 d-rocce (2.1-2.9)
//   + 11 d-idrografia (3.1-3.11) + 10 d-vegetazione (4.1-4.10)
//   + 22 d-costruzioni (5.1-5.20, 5.23-5.24) + 2 d-particolari (6.1-6.2)
//   + 11 colonna-e (8.1-8.11) + 2 colonna-f (10.1-10.2)
//   + 15 colonna-g (11.1-11.15) + 4 colonna-h (12.1-12.4, 12.3 = fallback)
//   + 8 istruzioni (13.1-13.5, 14.1-14.3).
// Excluded (content/esclusi/descrizioni.json): 9.1-9.4 (colonna F, righe di
// dimensioni d'esempio, non simboli), 12.3 (nessun file S4: artwork di
// ripiego, vedi sotto), 2.10/5.25/5.26/13.6/15.6 (file S4 presente ma nessuna
// riga di testo trovata in S3), 13.5control.svg e start.svg (file S4 che non
// rispettano il pattern <rif>[<DIR>].svg, non copiati). "7.n" ("Oggetti
// specifici di una nazione") è una riga modello, non un simbolo concreto: non
// produce né un Simbolo né una voce di esclusione (non ha un rif numerico).
//
// The text layer of this PDF conversion loses the original two-column table
// layout: "Definizione" (the short name) and "Descrizione" (the long text)
// run together with no delimiter, and a handful of rows have their ISOM
// cross-reference numbers or their neighbour's text visibly reshuffled (see
// FIXUP_* below). Splitting rows is done generically (a whitelist of valid
// `rif` values, derived from the vendored S4 filenames, anchors every row
// boundary); splitting each row into nome/descrizione needs the short "nome"
// half to be known, since it cannot be recovered from position alone — NOMI
// below is that curated half, and the script SELF-VALIDATES it against the
// live source text on every run (throws if a curated nome is not found where
// expected), so a future source change or a transcription mistake fails loud
// instead of silently producing wrong content.

import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leggiSorgente, pagine, unisciRighe, sha256 } from './_text.ts';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..', '..');
const FONTE_TESTO = join(RADICE, 'akaaso/sources/iof_descrizioni_punti_ital.md');
const CARTELLA_S4 = join(RADICE, 'sources/svg-control-descriptions/symbols');
const LANG_JSON = join(CARTELLA_S4, 'lang.json');

const OUT_SIMBOLI = join(RADICE, 'content/simboli/descrizioni-punti.json');
const OUT_ESCLUSI = join(RADICE, 'content/esclusi/descrizioni.json');
const OUT_ARTWORK_DIR = join(RADICE, 'content/artwork/descrizioni-punti');
const OUT_CONTATTO = join(RADICE, 'content/_contact/descrizioni-nomi.md');

// ---------------------------------------------------------------------------
// Types (Simbolo mirrors akaaso/09-tasks/_context.md's content model).
// ---------------------------------------------------------------------------

type Colonna = 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

type Simbolo = {
  rif: string;
  fonte: 'S3';
  sezione: string;
  nome: string;
  descrizione: string;
  colonna?: Colonna;
  famiglia?: string;
  direzioni?: string[];
  pagina: number;
  artwork: { path: string; formato: 'svg'; origine: 'S4' | 'S3'; sha256: string };
  isom?: string[];
};

type Escluso = { rif: string; motivo: string; fonte: 'S3' };

const DIREZIONI_ORDINE = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// ---------------------------------------------------------------------------
// 1. Inventario S4: sources/svg-control-descriptions/symbols/*.svg
// ---------------------------------------------------------------------------

type VoceS4 = { base: string; direzioni: Map<string, string>; piatto?: string };

function leggiInventarioS4(): { voci: Map<string, VoceS4>; nonConformi: string[] } {
  const nomiFile = readdirSync(CARTELLA_S4).filter((f) => f.endsWith('.svg'));
  const voci = new Map<string, VoceS4>();
  const nonConformi: string[] = [];
  const re = /^(\d{1,2}\.\d{1,2})(N|NE|NW|SE|SW|S|E|W)?\.svg$/;
  for (const nomeFile of nomiFile) {
    const m = nomeFile.match(re);
    if (!m) {
      nonConformi.push(nomeFile);
      continue;
    }
    const base = m[1];
    const dir = m[2];
    let voce = voci.get(base);
    if (!voce) {
      voce = { base, direzioni: new Map() };
      voci.set(base, voce);
    }
    if (dir) voce.direzioni.set(dir, nomeFile);
    else voce.piatto = nomeFile;
  }
  return { voci, nonConformi };
}

// ---------------------------------------------------------------------------
// 2. Confini delle righe nel testo S3 (pagine 7-16).
//
// Il testo estratto perde l'impaginazione a colonne: un'intestazione di
// sezione, un piè di pagina o l'inizio della riga successiva sono gli unici
// segnali rimasti per capire dove finisce la Descrizione di una riga. Questo
// scanner cerca tutti questi segnali (marcatori) in ordine di posizione nel
// testo di una pagina e assegna a ciascuna riga tutto il testo fino al
// marcatore successivo.
// ---------------------------------------------------------------------------

type Stato = { colonna: Colonna | undefined; famiglia: string | undefined; sezione: string };

const INTESTAZIONI: { ago: string; azione: (s: Stato) => void }[] = [
  { ago: 'Colonna C', azione: (s) => { s.colonna = 'C'; s.famiglia = undefined; s.sezione = 'colonna-c'; } },
  { ago: 'Colonna D', azione: (s) => { s.colonna = 'D'; s.famiglia = undefined; s.sezione = 'colonna-d'; } },
  { ago: 'Oggetti morfologici', azione: (s) => { s.famiglia = 'Oggetti morfologici'; s.sezione = 'd-morfologici'; } },
  { ago: 'Rocce e sassi', azione: (s) => { s.famiglia = 'Rocce e sassi'; s.sezione = 'd-rocce'; } },
  { ago: 'Idrografia (ISOM', azione: (s) => { s.famiglia = 'Idrografia'; s.sezione = 'd-idrografia'; } },
  { ago: 'Vegetazione (ISOM', azione: (s) => { s.famiglia = 'Vegetazione'; s.sezione = 'd-vegetazione'; } },
  { ago: 'Costruzioni (ISOM', azione: (s) => { s.famiglia = 'Costruzioni'; s.sezione = 'd-costruzioni'; } },
  { ago: 'Simboli particolari', azione: (s) => { s.famiglia = 'Simboli particolari'; s.sezione = 'd-particolari'; } },
  { ago: 'Colonna E', azione: (s) => { s.colonna = 'E'; s.famiglia = undefined; s.sezione = 'colonna-e'; } },
  { ago: 'Colonna F', azione: (s) => { s.colonna = 'F'; s.famiglia = undefined; s.sezione = 'colonna-f'; } },
  { ago: 'Colonna G', azione: (s) => { s.colonna = 'G'; s.famiglia = undefined; s.sezione = 'colonna-g'; } },
  { ago: 'Colonna H', azione: (s) => { s.colonna = 'H'; s.famiglia = undefined; s.sezione = 'colonna-h'; } },
  { ago: 'Informazioni particolari', azione: (s) => { s.colonna = undefined; s.famiglia = undefined; s.sezione = 'istruzioni'; } },
];

// Sotto-intestazioni di "Colonna F" che delimitano il blocco "Dimensioni"
// (9.1-9.4: non simboli, vedi sopra). All'interno di questo intervallo, un
// numero che coincide per caso con un rif valido (es. "2.5" o "0.5" mostrati
// come valore d'esempio nella colonna Simbolo) non deve aprire una nuova riga.
const INIZIO_DIMENSIONI = 'Dimensioni';
const FINE_DIMENSIONI = 'Combinazioni';

// Frasi introduttive che compaiono a metà di una sotto-sezione, tra la fine
// del testo di una riga e l'intestazione tabellare della riga successiva.
// Senza questi marcatori il testo finirebbe attaccato alla Descrizione della
// riga precedente. Ognuna è citata con la riga che protegge.
const TERMINATORI_EXTRA = [
  'Tipi di percorso dall’ultimo punto all’arrivo', // prima di 14.1
  'Se uno di questi simboli è utilizzato nella colonna F', // dopo 10.2
  'Se il simbolo 11.15', // dopo 11.15
  'Se ci sono punti di passaggio o percorsi obbligatori tra due lanterne', // dopo 13.2
  'Al cambio carta, o se si deve seguire un percorso obbligato fino al cambio carta', // dopo 13.4
];

const FOOTER_RE = /\d{1,2}\s+Descrizioni dei punti IOF/g;

type Marcatore =
  | { tipo: 'intestazione'; inizio: number; fine: number; azione: (s: Stato) => void }
  | { tipo: 'span-inizio' | 'span-fine' | 'terminatore'; inizio: number; fine: number }
  | { tipo: 'riga'; inizio: number; fine: number; rif: string };

function trovaTutte(testo: string, ago: string): number[] {
  const indici: number[] = [];
  let i = testo.indexOf(ago);
  while (i !== -1) {
    indici.push(i);
    i = testo.indexOf(ago, i + 1);
  }
  return indici;
}

function costruisciMarcatori(testoPagina: string, whitelist: Set<string>): Marcatore[] {
  const marcatori: Marcatore[] = [];

  for (const { ago, azione } of INTESTAZIONI) {
    for (const i of trovaTutte(testoPagina, ago)) {
      marcatori.push({ tipo: 'intestazione', inizio: i, fine: i + ago.length, azione });
    }
  }
  for (const i of trovaTutte(testoPagina, INIZIO_DIMENSIONI)) {
    marcatori.push({ tipo: 'span-inizio', inizio: i, fine: i + INIZIO_DIMENSIONI.length });
  }
  for (const i of trovaTutte(testoPagina, FINE_DIMENSIONI)) {
    marcatori.push({ tipo: 'span-fine', inizio: i, fine: i + FINE_DIMENSIONI.length });
  }
  for (const ago of TERMINATORI_EXTRA) {
    for (const i of trovaTutte(testoPagina, ago)) {
      marcatori.push({ tipo: 'terminatore', inizio: i, fine: i + ago.length });
    }
  }
  for (const m of testoPagina.matchAll(FOOTER_RE)) {
    marcatori.push({ tipo: 'terminatore', inizio: m.index, fine: m.index + m[0].length });
  }

  const gettoni = [...whitelist].sort((a, b) => b.length - a.length).map((t) => t.replace('.', '\\.'));
  const reRiga = new RegExp('\\b(' + gettoni.join('|') + ')\\b', 'g');
  for (const m of testoPagina.matchAll(reRiga)) {
    const inizio = m.index;
    const fine = inizio + m[0].length;
    const prima = testoPagina.slice(Math.max(0, inizio - 30), inizio).trimEnd().toLowerCase();
    const dopo = testoPagina.slice(fine, fine + 1);
    if (prima.endsWith('simbolo')) continue; // "usato con il simbolo 8.11" — non è una riga
    if (dopo === ')') continue; // "(ISOM sezione 4.1)" — intestazione, non una riga
    marcatori.push({ tipo: 'riga', inizio, fine, rif: m[1] });
  }

  marcatori.sort((a, b) => a.inizio - b.inizio);

  // Dentro "Dimensioni" ... "Combinazioni", scarta i falsi candidati riga che
  // non sono uno dei quattro rif reali di quel blocco.
  const filtrati: Marcatore[] = [];
  let dentroDimensioni = false;
  for (const marc of marcatori) {
    if (marc.tipo === 'span-inizio') { dentroDimensioni = true; filtrati.push(marc); continue; }
    if (marc.tipo === 'span-fine') { dentroDimensioni = false; filtrati.push(marc); continue; }
    if (marc.tipo === 'riga' && dentroDimensioni && !['9.1', '9.2', '9.3', '9.4'].includes(marc.rif)) continue;
    filtrati.push(marc);
  }
  return filtrati;
}

type RigaGrezza = {
  rif: string;
  pagina: number;
  colonna?: Colonna;
  famiglia?: string;
  sezione: string;
  grezzo: string;
};

function estraiRigheGrezze(whitelist: Set<string>): RigaGrezza[] {
  const testoCompleto = leggiSorgente(FONTE_TESTO);
  const tutte = pagine(testoCompleto).filter((p) => p.n >= 7 && p.n <= 16);
  const righe: RigaGrezza[] = [];
  const stato: Stato = { colonna: undefined, famiglia: undefined, sezione: '' };

  for (const pagina of tutte) {
    const testoPagina = pagina.testo.replace(/^---$/gm, '').trim();
    const marcatori = costruisciMarcatori(testoPagina, whitelist);
    for (let i = 0; i < marcatori.length; i += 1) {
      const marc = marcatori[i];
      if (marc.tipo === 'intestazione') {
        marc.azione(stato);
        continue;
      }
      if (marc.tipo === 'riga') {
        const finePagina = i + 1 < marcatori.length ? marcatori[i + 1].inizio : testoPagina.length;
        const grezzo = testoPagina.slice(marc.fine, finePagina);
        righe.push({
          rif: marc.rif,
          pagina: pagina.n,
          colonna: stato.colonna,
          famiglia: stato.famiglia,
          sezione: stato.sezione,
          grezzo,
        });
      }
    }
  }
  return righe;
}

// ---------------------------------------------------------------------------
// 3. Nomi curati (la metà "Definizione" di ogni riga — vedi la nota in testa
//    al file sul perché non è ricavabile dalla sola posizione del testo).
//    Ogni valore è la forma esatta che unisciRighe() produce dal sorgente
//    (compresi gli artefatti "parola- spezzata" degli a capo a metà parola:
//    unisciRighe unisce le righe con uno spazio, senza togliere il trattino).
// ---------------------------------------------------------------------------

const NOMI: Record<string, string> = {
  '0.1': 'Più a nord', '0.2': 'Più a sud-est', '0.3': 'superiore', '0.4': 'inferiore', '0.5': 'centrale',
  '1.1': 'Terrazzo', '1.2': 'Naso', '1.3': 'Rientranza', '1.4': 'Scarpata ripida', '1.5': 'Cava',
  '1.6': 'Muro di terra', '1.7': 'Fossa', '1.8': 'Piccola fossa', '1.9': 'Collina', '1.10': 'Collinetta',
  '1.11': 'Sella', '1.12': 'Depressione', '1.13': 'Buca', '1.14': 'Buca profonda',
  '1.15': 'Terreno acciden- tato', '1.16': 'Formicaio (termitaio)',
  '2.1': 'Roccia, parete rocciosa', '2.2': 'Torre di roccia, spuntone', '2.3': 'Caverna', '2.4': 'Sasso',
  '2.5': 'Sassaia', '2.6': 'Gruppo di sassi', '2.7': 'Terreno pietro- so/sassoso', '2.8': 'Roccia nuda',
  '2.9': 'Passaggio stretto',
  '3.1': 'Lago', '3.2': 'Stagno', '3.3': 'Buca profonda con acqua',
  '3.4': 'Fiume, ruscello, corso d’acqua', '3.5': 'Piccolo canale, rigagnolo',
  '3.6': 'Striscia di palude', '3.7': 'Palude', '3.8': 'Isola in una palude', '3.9': 'Fontana',
  '3.10': 'Sorgente', '3.11': 'Cisterna d’acqua, pozzo, abbeveratoio',
  '4.1': 'Terreno aperto, campo', '4.2': 'Terreno semi-aperto', '4.3': 'Angolo di bosco', '4.4': 'Radura',
  '4.5': 'Boschetto fitto', '4.6': 'Boschetto fitto, lineare', '4.7': 'Limite di vege- tazione',
  '4.8': 'Gruppo d’alberi', '4.9': 'Albero parti- colare', '4.10': 'Ceppo, radice',
  '5.1': 'Strada', '5.2': 'Sentiero, pista', '5.3': 'Taglio di bosco', '5.4': 'Ponte',
  '5.5': 'Linea elettrica', '5.6': 'Pilone di linea elettrica', '5.7': 'Galleria', '5.8': 'Muro in pietra',
  '5.9': 'Recinto', '5.10': 'Punto di passaggio', '5.11': 'Edificio', '5.12': 'Area pavimen- tata',
  '5.13': 'Rovina, rudere', '5.14': 'Condotta', '5.15': 'Torre', '5.16': 'Posta del cac- ciatore',
  '5.17': 'Cippo di con- fine, tumulo di pietre', '5.18': 'Mangiatoia', '5.19': 'Carbonaia',
  '5.20': 'Monumento o statua', '5.23': 'Sottopassaggio', '5.24': 'Scala',
  '6.1': 'Oggetto parti- colare', '6.2': 'Oggetto parti- colare',
  '8.1': 'Basso', '8.2': 'Piatto, poco profondo', '8.3': 'Profondo',
  '8.4': 'Ricoperto di sterpi, «verde»', '8.5': 'Aperto', '8.6': 'Roccioso, sassoso',
  '8.7': 'Paludoso', '8.8': 'Sabbioso', '8.9': 'Conifera', '8.10': 'Latifoglia',
  '8.11': 'Rovinato, distrutto',
  '10.1': 'Incrocio', '10.2': 'Bivio, biforcazione',
  '11.1': 'Parte (esterna) nord-est', '11.2': 'Bordo sud-est', '11.3': 'Parte (interna) ovest',
  '11.4': 'Angolo est (interno)', '11.5': 'Angolo sud (esterno)', '11.6': 'Punta sud-ovest',
  '11.7': 'Curva', '11.8': 'Estremità nord-ovest', '11.9': 'Parte superiore',
  '11.10': 'Parte inferiore', '11.11': 'In cima a, sopra', '11.12': 'Sotto, al di sotto di',
  '11.13': 'Al piede (direzione non specificata)', '11.14': 'Piede nord-est',
  '11.15': 'Tra, fra, in mezzo',
  '12.1': 'Pronto soccorso', '12.2': 'Punti con rifornimento', '12.3': 'Punto radio o TV',
  '12.4': 'Controllo',
};

const RIGHE_ISTRUZIONI = new Set(['13.1', '13.2', '13.3', '13.4', '13.5', '14.1', '14.2', '14.3']);
const RIGHE_DIMENSIONI = new Set(['9.1', '9.2', '9.3', '9.4']);

// ISOM cross-refs: solo le righe di colonna D a pagina 7 (1.1-1.10) hanno i
// numeri ISOM ancora attaccati alla propria riga nel testo estratto; da
// pagina 8 in poi finiscono spostati in un blocco a fondo pagina, nell'ordine
// sbagliato (verificato a mano), quindi non vengono attribuiti a nessuna
// riga: è una lacuna nota, non un errore silenzioso.
function estraiIsom(grezzo: string): { corpo: string; isom?: string[] } {
  const m = grezzo.match(/((?:\s*\d{3})+)\s*$/);
  if (!m || m.index === undefined) return { corpo: grezzo };
  const numeri = m[1].trim().split(/\s+/);
  return { corpo: grezzo.slice(0, m.index), isom: numeri };
}

// ---------------------------------------------------------------------------
// 4. Assemblaggio dei Simbolo.
// ---------------------------------------------------------------------------

function confrontaRif(a: string, b: string): number {
  const [am, an] = a.split('.').map(Number);
  const [bm, bn] = b.split('.').map(Number);
  return am - bm || an - bn;
}

function scegliVolto(voce: VoceS4): { dir: string; file: string } {
  if (voce.direzioni.has('N')) return { dir: 'N', file: voce.direzioni.get('N')! };
  if (voce.direzioni.has('NE')) return { dir: 'NE', file: voce.direzioni.get('NE')! };
  throw new Error(`${voce.base}: nessuna direzione N o NE tra le varianti trovate`);
}

function main(): void {
  const { voci: s4, nonConformi } = leggiInventarioS4();
  const whitelist = new Set<string>([...s4.keys(), '9.1', '9.2', '9.3', '9.4', '12.3']);
  const righe = estraiRigheGrezze(whitelist);

  const simboli = new Map<string, Simbolo>();
  const esclusi: Escluso[] = [];
  const daCopiare: { da: string; a: string }[] = [];

  for (const riga of righe) {
    if (RIGHE_DIMENSIONI.has(riga.rif)) {
      esclusi.push({
        rif: riga.rif,
        motivo: 'Colonna F – Dimensioni: valore numerico d’esempio, non un simbolo cartografico',
        fonte: 'S3',
      });
      continue;
    }

    let nome: string;
    let descrizione: string;
    let isom: string[] | undefined;

    if (RIGHE_ISTRUZIONI.has(riga.rif)) {
      // §13-14: l'intestazione di sorgente è "Definizione/Descrizione" unica,
      // non ci sono due colonne distinte da separare.
      const testo = unisciRighe(riga.grezzo.split('\n'));
      nome = testo;
      descrizione = testo;
    } else {
      let corpo = riga.grezzo;
      if (riga.colonna === 'D' && riga.pagina === 7) {
        const estratto = estraiIsom(riga.grezzo);
        corpo = estratto.corpo;
        isom = estratto.isom;
      }
      const nomeCurato = NOMI[riga.rif];
      if (!nomeCurato) throw new Error(`${riga.rif}: nessun nome curato in NOMI`);
      const piatto = unisciRighe(corpo.split('\n'));
      const idx = piatto.indexOf(nomeCurato);
      if (idx === -1 || idx > 40) {
        throw new Error(
          `${riga.rif}: nome curato ${JSON.stringify(nomeCurato)} non trovato (o troppo lontano, idx=${idx}) ` +
            `nel testo della riga: ${JSON.stringify(piatto.slice(0, 160))}`,
        );
      }
      nome = nomeCurato;
      descrizione = piatto.slice(idx + nomeCurato.length).trim();
    }

    let colonna: Colonna | undefined = riga.colonna;
    let famiglia: string | undefined = riga.famiglia;
    if (colonna !== 'D') famiglia = undefined;

    let artwork: Simbolo['artwork'];
    let direzioni: string[] | undefined;
    const voceS4 = s4.get(riga.rif);

    if (!voceS4) {
      // Fallback: nessun file S4 (atteso: 12.3). Ritaglio da S3 rimandato a
      // un task successivo (l'estrattore con il cropper). Segnalato anche in
      // esclusi.json come richiesto dalla spec, pur avendo un Simbolo qui.
      artwork = {
        path: `content/artwork/descrizioni-punti/${riga.rif}.svg`,
        formato: 'svg',
        origine: 'S3',
        sha256: '',
      };
      esclusi.push({
        rif: riga.rif,
        motivo: 'artwork mancante in S4 — ritaglio da S3 richiesto',
        fonte: 'S3',
      });
    } else if (voceS4.direzioni.size > 0) {
      direzioni = DIREZIONI_ORDINE.filter((d) => voceS4.direzioni.has(d));
      for (const [dir, file] of voceS4.direzioni) {
        daCopiare.push({ da: join(CARTELLA_S4, file), a: join(OUT_ARTWORK_DIR, file) });
      }
      const volto = scegliVolto(voceS4);
      const percorsoAssoluto = join(CARTELLA_S4, volto.file);
      artwork = {
        path: `content/artwork/descrizioni-punti/${volto.file}`,
        formato: 'svg',
        origine: 'S4',
        sha256: sha256(readFileSync(percorsoAssoluto)),
      };
    } else if (voceS4.piatto) {
      daCopiare.push({ da: join(CARTELLA_S4, voceS4.piatto), a: join(OUT_ARTWORK_DIR, voceS4.piatto) });
      const percorsoAssoluto = join(CARTELLA_S4, voceS4.piatto);
      artwork = {
        path: `content/artwork/descrizioni-punti/${voceS4.piatto}`,
        formato: 'svg',
        origine: 'S4',
        sha256: sha256(readFileSync(percorsoAssoluto)),
      };
    } else {
      throw new Error(`${riga.rif}: voce S4 senza file piatto né direzioni`);
    }

    simboli.set(riga.rif, {
      rif: riga.rif,
      fonte: 'S3',
      sezione: riga.sezione,
      nome,
      descrizione,
      colonna,
      famiglia,
      direzioni,
      pagina: riga.pagina,
      artwork,
      isom,
    });
  }

  // Fixup 1: 11.4 e 11.5 condividono un'unica spiegazione a valle di 11.5 nel
  // sorgente (vedi pagina 14): la riga 11.4 resta senza testo proprio.
  const s114 = simboli.get('11.4');
  const s115 = simboli.get('11.5');
  if (s114 && s115 && s114.descrizione === '') {
    s114.descrizione = s115.descrizione;
  } else if (!s114 || !s115 || s114.descrizione !== '') {
    throw new Error('fixup 11.4/11.5: la forma del sorgente atteso è cambiata, controllare a mano');
  }

  // Fixup 2: 3.11 termina con una nota a piè di pagina incollata alla stessa
  // riga ("*diverso da descrizione punti secondo IOF"), non parte del testo
  // della riga.
  const s311 = simboli.get('3.11');
  if (s311) {
    const marcatore = ' *diverso da descrizione punti secondo IOF';
    if (s311.descrizione.includes(marcatore)) {
      s311.descrizione = s311.descrizione.split(marcatore)[0];
    } else {
      throw new Error('fixup 3.11: nota a piè di pagina non trovata, controllare a mano');
    }
  }

  // Fixup 3: 14.2 e 14.3 sono scambiate nel testo estratto (il testo di 14.2
  // segue quello di 14.3 invece di precederlo): vedi pagina 16.
  const s142 = simboli.get('14.2');
  const s143 = simboli.get('14.3');
  if (s142 && s143) {
    const marcatore = '380 m dall’ultimo punto';
    const idx = s143.descrizione.indexOf(marcatore);
    if (idx === -1) throw new Error('fixup 14.2/14.3: marcatore di riordino non trovato, controllare a mano');
    const coda = s143.descrizione.slice(idx).trim();
    const testa = s143.descrizione.slice(0, idx).trim();
    s143.nome = testa;
    s143.descrizione = testa;
    s142.nome = coda;
    s142.descrizione = coda;
  }

  // Riconciliazione S4: ogni file base di S4 non reclamato da un Simbolo (e
  // non già escluso come riga di dimensioni) non ha testo in S3.
  for (const base of s4.keys()) {
    if (!simboli.has(base)) {
      esclusi.push({
        rif: base,
        motivo: 'artwork presente in S4 ma nessuna riga di testo trovata nelle tabelle S3 (pagine 7–16)',
        fonte: 'S3',
      });
    }
  }
  // File S4 fuori dal pattern <rif>[<DIR>].svg (varianti extra non richieste).
  for (const file of nonConformi) {
    esclusi.push({
      rif: basename(file, '.svg'),
      motivo: `file S4 «${file}» fuori dal pattern <rif>[<DIR>].svg; non copiato`,
      fonte: 'S3',
    });
  }

  const elencoSimboli = [...simboli.values()].sort((a, b) => confrontaRif(a.rif, b.rif));
  const elencoEsclusi = esclusi.sort((a, b) => {
    const na = /^\d{1,2}\.\d{1,2}$/.test(a.rif);
    const nb = /^\d{1,2}\.\d{1,2}$/.test(b.rif);
    if (na && nb) return confrontaRif(a.rif, b.rif);
    if (na !== nb) return na ? -1 : 1;
    return a.rif.localeCompare(b.rif);
  });

  if (elencoSimboli.length !== 115) {
    throw new Error(`atteso 115 simboli (vedi commento in testa al file), trovati ${elencoSimboli.length}`);
  }

  // ---------------------------------------------------------------------
  // 5. Cross-check dei nomi contro lang.json (S4).
  // ---------------------------------------------------------------------
  const lang = JSON.parse(readFileSync(LANG_JSON, 'utf8')) as Record<string, { names?: { it?: string } }>;

  function normalizza(s: string): string {
    return s
      .toLowerCase()
      .replace(/[«»"“”‘’.,;:!?()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function chiaveLang(sim: Simbolo): string {
    if (sim.direzioni && sim.direzioni.length > 0) {
      const dir = sim.direzioni.includes('N') ? 'N' : 'NE';
      return `${sim.rif}${dir}`;
    }
    return sim.rif;
  }

  const righeContatto: string[] = ['| rif | nome S3 | nome lang.json it | uguale? |', '| --- | --- | --- | --- |'];
  for (const sim of elencoSimboli) {
    const chiave = chiaveLang(sim);
    const nomeLang = lang[chiave]?.names?.it;
    const uguale = nomeLang === undefined ? 'n/d' : normalizza(nomeLang) === normalizza(sim.nome) ? 'sì' : 'no';
    righeContatto.push(`| ${sim.rif} | ${sim.nome} | ${nomeLang ?? '—'} | ${uguale} |`);
  }

  // ---------------------------------------------------------------------
  // 6. Scrittura deterministica: prima in una cartella temporanea, poi nel
  //    posto definitivo sotto content/.
  // ---------------------------------------------------------------------
  const tempDir = mkdtempSync(join(tmpdir(), 'parse-descrizioni-'));
  try {
    const generato = new Date().toISOString().slice(0, 10);
    const docSimboli = { v: 1, generato, sorgente: 'S3', simboli: elencoSimboli };
    const docEsclusi = { v: 1, esclusi: elencoEsclusi };

    const pSimboli = join(tempDir, 'descrizioni-punti.json');
    const pEsclusi = join(tempDir, 'descrizioni.json');
    const pContatto = join(tempDir, 'descrizioni-nomi.md');
    writeFileSync(pSimboli, JSON.stringify(docSimboli, null, 2) + '\n', 'utf8');
    writeFileSync(pEsclusi, JSON.stringify(docEsclusi, null, 2) + '\n', 'utf8');
    writeFileSync(pContatto, righeContatto.join('\n') + '\n', 'utf8');

    const artworkTempDir = join(tempDir, 'artwork');
    mkdirSync(artworkTempDir, { recursive: true });
    const copieTemp: { da: string; nomeFile: string }[] = [];
    for (const { da } of daCopiare) {
      const nomeFile = basename(da);
      copyFileSync(da, join(artworkTempDir, nomeFile));
      copieTemp.push({ da, nomeFile });
    }

    // Sposta tutto nella destinazione finale sotto content/.
    mkdirSync(dirname(OUT_SIMBOLI), { recursive: true });
    mkdirSync(dirname(OUT_ESCLUSI), { recursive: true });
    mkdirSync(dirname(OUT_CONTATTO), { recursive: true });
    mkdirSync(OUT_ARTWORK_DIR, { recursive: true });

    // Ripulisce gli .svg generati da una corsa precedente (non i .gitkeep).
    for (const f of readdirSync(OUT_ARTWORK_DIR)) {
      if (f.endsWith('.svg')) unlinkSync(join(OUT_ARTWORK_DIR, f));
    }

    copyFileSync(pSimboli, OUT_SIMBOLI);
    copyFileSync(pEsclusi, OUT_ESCLUSI);
    copyFileSync(pContatto, OUT_CONTATTO);
    for (const { nomeFile } of copieTemp) {
      copyFileSync(join(artworkTempDir, nomeFile), join(OUT_ARTWORK_DIR, nomeFile));
    }

    console.log(`descrizioni-punti.json: ${elencoSimboli.length} simboli`);
    console.log(`esclusi/descrizioni.json: ${elencoEsclusi.length} voci`);
    console.log(`artwork copiato: ${copieTemp.length} file .svg`);
    console.log(`cross-check nomi: ${OUT_CONTATTO}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
