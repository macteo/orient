// scripts/parse/parse-isom.ts
//
// Parses `akaaso/sources/ISOM_2017-2_CH_IT.md` §3.1 – 3.7 into
// `content/simboli/isom.json` (one Simbolo per included symbol) and
// `content/esclusi/isom.json` (§3.6 symbols, symbols with no S5 render, and
// the S5 Def_/min_dim_ figures). Spec: akaaso/03-modules/006-pipeline-isom.md.
// Task: P1-CONTENUTI-TOOL-parse-isom.
//
// --- Hand count (Done Criteria #1) --------------------------------------
// A symbol starts at a line matching `^(\d{3}(?:\.\d)?) (.+?) \((L|P|A|T)\)$`
// (see CONFINE_SIMBOLO below for the two tolerated real-world variants).
// Counting these lines inside §3.1 – 3.7 by leading hundred-digit:
//
//   100  forme         15  (101–115)
//   200  rocce         15  (201–215)
//   300  acqua         13  (301–313)
//   400  vegetazione   18  (401–410, 412–419 — 411 does not exist in ISOM 2017-2 CH)
//   500  opere         34  (501–532 incl. the 513.1/513.2 split of 513, plus 550)
//   600  §3.6 esclusa   3  (601–603)
//   700  tracciato     13  (701–713)
//   ---------------------------
//   totale righe-simbolo        111
//   esclusi per §3.6              3  (601–603)
//   esclusi per artwork mancante  1  (550 — nessun file S5, vedi punto 6 sotto)
//   scritti in content/simboli/isom.json   107
//
// --- Parsing edges handled -----------------------------------------------
// 1. Two real deviations from the "NNN Nome (X)" shape exist in the converted
//    text: symbol 206 has no space before its geometry letter
//    ("...roccia(A)"), and six symbols — 102, 510, 511, 512, 550, 603 — carry
//    a *compound* geometry such as "(L, T)" or "(L, P)". Both are accepted by
//    CONFINE_SIMBOLO below (optional space, one-or-more comma-separated
//    letters), so none of these lines corrupt a neighbour's description by
//    going unrecognised. The Simbolo type carries one geometry letter, not a
//    list, so a compound value is reduced to its first letter (documented on
//    `geometriaDi`); this is a judgement call, flagged here for check-content.
// 2. §3.6 "Simboli tecnici" is misplaced by the PDF extraction: its heading
//    text lands *after* symbols 601–603, immediately before the "3.7"
//    heading, instead of before them (verified against the source: line 1727
//    vs the symbols at lines 1702–1719). Nearest-preceding-heading text would
//    therefore misclassify 601–603 as "opere" (§3.5). Section is derived
//    instead from the symbol number's leading hundred-digit
//    (SEZIONE_PER_CENTINAIO), which is unambiguous and matches ISOM's own
//    numbering convention.
// 3. The running page header ("Swiss Orienteering • ISOM 2017-2 CH IT",
//    alone, or with a leading page number on the same or the previous line)
//    and the "---" page-separator rule are stripped per page before the
//    line-by-line scan, so a page break never leaks into a description.
// 4. Hyphenated line-wraps (e.g. "palese-" / "mente" split across two lines)
//    are joined with a single space, not de-hyphenated — this matches
//    `unisciRighe()` from the shared `_text.ts` and keeps descriptions a
//    faithful, mechanical join of the source lines rather than a rewrite.
// 5. The page-12/13 summary lines ("113 Terreno accidentato 113 …") sit
//    before the §3.1 heading and never end in "(L|P|A|T)" anyway (they don't
//    end in a parenthesis at all), so the section-range restriction already
//    keeps them out without extra handling.
// 6. `artwork.path` is not always the naive `content/artwork/isom/<rif>.png`:
//    it is resolved against the real S5 filenames (read once from
//    `sources/iof-isom-2017-2-revision-6-links/`), because the Italian text
//    and the international S5 package disagree in three concrete ways,
//    discovered by cross-checking the two after `extract-isom` (a sibling
//    task) had already rendered the real PNGs:
//      - 701–703 and 704–706 each share ONE S5 file per group
//        ("ISOM 701-703.pdf"); their path points at that shared name (see
//        CONDIVISI), not at a non-existent per-symbol file.
//      - 105 and 203 each have TWO S5 files, numbered "<rif>.1"/"<rif>.2"
//        directly in the filename (e.g. "ISOM 105.1 Earth wall.pdf",
//        "ISOM 105.2 Retained earth wall.pdf") — there is no plain
//        "105.pdf"/"203.pdf". The Italian paragraph for "105"/"203" only
//        ever describes the first variant ("Muro di terra" = "Earth wall";
//        "Buca rocciosa o caverna" = "Rocky pit or cave"), so the symbol's
//        artwork path falls back to the ".1" render — the card face, same
//        rule as the already-known 101/103 two-file cases. The unclaimed
//        ".2" renders (105.2, 203.2) are logged in esclusi.json as
//        `tipo: "variante"`, since they describe a real ISOM sub-symbol the
//        Swiss/Italian edition never gives its own paragraph.
//      - 550 "Poligono di tiro" has no S5 file at all (no "ISOM 550 …pdf"
//        anywhere in the package) — resolution returns no render, and the
//        symbol is excluded (`tipo: "simbolo"`, esclusi.json) rather than
//        written with a path that can never resolve.
//    Separately, "ISOM 715 Continuing point after map exchange.pdf" exists
//    in S5 with no matching text anywhere in [S1]; logged as `tipo:
//    "variante"` too, for the same reconciliation reason.
//
// Symbols 701–703 and 704–706 share one S5 render each; recorded via
// `artwork.condiviso` (see CONDIVISI below), per the module spec.

import { mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leggiSorgente, pagine, unisciRighe } from './_text.ts';

export type Geometria = 'L' | 'P' | 'A' | 'T';

export type Simbolo = {
  rif: string;
  fonte: 'S1';
  sezione: string;
  nome: string;
  descrizione: string;
  geometria: Geometria;
  pagina: number;
  artwork: {
    path: string;
    formato: 'png';
    origine: 'S5';
    sha256: string;
    condiviso?: string;
  };
};

type VoceEsclusa = {
  tipo: 'simbolo' | 'figura' | 'variante';
  rif?: string;
  nome?: string;
  file?: string;
  motivo: string;
};

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..', '..');
// Exported: scripts/check-content.ts reads the same source file and S5
// directory to rebuild the same §3.1-3.7 inventory the parser produces,
// instead of duplicating these paths.
export const SORGENTE_MD = join(RADICE, 'akaaso', 'sources', 'ISOM_2017-2_CH_IT.md');
export const CARTELLA_S5 = join(RADICE, 'sources', 'iof-isom-2017-2-revision-6-links');
const OUT_SIMBOLI = join(RADICE, 'content', 'simboli', 'isom.json');
const OUT_ESCLUSI = join(RADICE, 'content', 'esclusi', 'isom.json');

const INTESTAZIONE_PAGINA = 'Swiss Orienteering • ISOM 2017-2 CH IT';

const INIZIO_CAPITOLO = '3.1 Forme del terreno';
const FINE_CAPITOLO = '3.8 Definizione grafica precisa dei simboli';

// Le sette intestazioni di sezione dentro il capitolo 3 (una, "3.6", compare
// nel testo estratto DOPO i simboli 601–603 invece che prima: vedi nota 2
// sopra). Servono solo a non farle finire nel testo di una descrizione; la
// sezione di un simbolo si calcola dal numero, non da questo elenco.
const INTESTAZIONI_SEZIONE = new Set([
  INIZIO_CAPITOLO,
  '3.2 Rocce e sassi',
  '3.3 Acqua e paludi',
  '3.4 Vegetazione',
  '3.5 Opere dell’uomo',
  '3.6 Simboli tecnici',
  '3.7 Simboli di tracciamento percorsi',
]);

// "NNN Nome (X)" con: spazio prima della parentesi facoltativo (206 non ne ha
// uno) e geometria di una o più lettere maiuscole separate da virgola (alcuni
// simboli, es. 102 "(L, T)", ne hanno più di una).
const CONFINE_SIMBOLO = /^(\d{3}(?:\.\d)?)\s+(.+?)\s*\(([A-Z](?:,\s*[A-Z])*)\)$/;

const SEZIONE_PER_CENTINAIO: Record<number, string> = {
  100: 'forme',
  200: 'rocce',
  300: 'acqua',
  400: 'vegetazione',
  500: 'opere',
  600: 'esclusa', // §3.6 Simboli tecnici — fuori perimetro (01-vision/004-scope-boundaries.md)
  700: 'tracciato',
};

// 701-703 e 704-706 condividono un solo render S5 a testa (006-pipeline-isom.md §2).
const CONDIVISI: Record<string, string> = {
  '701': '701-703',
  '702': '701-703',
  '703': '701-703',
  '704': '704-706',
  '705': '704-706',
  '706': '704-706',
};

// Varianti S5 orfane note (nessun testo proprio in [S1]) e simboli senza
// alcun render S5: vedi il punto 6 in testa al file per come sono scoperte.
const VARIANTI_S5_SENZA_TESTO: { file: string; motivo: string }[] = [
  {
    file: 'content/artwork/isom/105.2.png',
    motivo:
      'ISOM 105.2 "Retained earth wall": variante S5 del simbolo 105, priva di testo proprio in [S1] (il paragrafo "105 Muro di terra" descrive solo 105.1 "Earth wall"); il simbolo 105 in isom.json punta a 105.1.png',
  },
  {
    file: 'content/artwork/isom/203.2.png',
    motivo:
      'ISOM 203.2 "Dangerous pit": variante S5 del simbolo 203, priva di testo proprio in [S1] (il paragrafo "203 Buca rocciosa o caverna" descrive solo 203.1 "Rocky pit or cave"); il simbolo 203 in isom.json punta a 203.1.png',
  },
  {
    file: 'content/artwork/isom/715.png',
    motivo:
      'ISOM 715 "Continuing point after map exchange": presente nel pacchetto artwork S5 ma assente dal testo [S1] (ISOM_2017-2_CH_IT.md non elenca il simbolo 715)',
  },
];

const ATTESO_RIGHE_SIMBOLO = 111;
const ATTESO_SIMBOLI_ESCLUSI_SEZIONE = 3; // 601–603
const ATTESO_SIMBOLI_ESCLUSI_ARTWORK = 1; // 550
const ATTESO_SIMBOLI_INCLUSI = 107; // 111 - 3 - 1

export type RigaConPagina = { pagina: number; testo: string };

function escapeRegExp(testo: string): string {
  return testo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const RE_INTESTAZIONE_UNA_RIGA = new RegExp(`^\\d+\\s+${escapeRegExp(INTESTAZIONE_PAGINA)}\\s*$`);

/**
 * Appiattisce il sorgente in una sequenza di righe non vuote, ciascuna
 * etichettata con il numero di pagina d'origine, scartando l'intestazione
 * ripetuta a inizio pagina (con o senza numero di pagina, su una o due righe)
 * e i separatori "---" tra una pagina e l'altra.
 */
export function righeConPagina(testoSorgente: string): RigaConPagina[] {
  const risultato: RigaConPagina[] = [];

  for (const p of pagine(testoSorgente)) {
    const righe = p.testo.split('\n');
    let i = 0;
    while (i < righe.length && righe[i].trim() === '') i += 1;

    if (i < righe.length) {
      const prima = righe[i].trim();
      if (RE_INTESTAZIONE_UNA_RIGA.test(prima)) {
        i += 1;
      } else if (/^\d+$/.test(prima)) {
        let j = i + 1;
        while (j < righe.length && righe[j].trim() === '') j += 1;
        if (j < righe.length && righe[j].trim() === INTESTAZIONE_PAGINA) i = j + 1;
      } else if (prima === INTESTAZIONE_PAGINA) {
        i += 1;
      }
    }

    for (; i < righe.length; i += 1) {
      const t = righe[i].trim();
      if (t === '' || t === '---') continue;
      risultato.push({ pagina: p.n, testo: t });
    }
  }

  return risultato;
}

export type SimboloGrezzo = {
  rif: string;
  nome: string;
  geometriaGrezza: string;
  pagina: number;
  righeDescrizione: string[];
};

/** Scansiona §3.1 – 3.7 (fino all'inizio del capitolo 3.8 escluso) individuando un simbolo per riga-confine. */
export function analizza(righe: RigaConPagina[]): SimboloGrezzo[] {
  const iniziale = righe.findIndex((r) => r.testo === INIZIO_CAPITOLO);
  const finale = righe.findIndex((r) => r.testo === FINE_CAPITOLO);
  if (iniziale === -1 || finale === -1 || finale <= iniziale) {
    throw new Error('Intestazioni di capitolo "3.1" / "3.8" non trovate nella sorgente: struttura cambiata?');
  }

  const trovati: SimboloGrezzo[] = [];
  let corrente: SimboloGrezzo | null = null;

  const chiudi = () => {
    if (corrente) trovati.push(corrente);
    corrente = null;
  };

  for (let i = iniziale + 1; i < finale; i += 1) {
    const { pagina, testo } = righe[i];

    if (INTESTAZIONI_SEZIONE.has(testo)) {
      chiudi();
      continue;
    }

    const m = testo.match(CONFINE_SIMBOLO);
    if (m) {
      chiudi();
      corrente = { rif: m[1], nome: m[2].trim(), geometriaGrezza: m[3], pagina, righeDescrizione: [] };
      continue;
    }

    if (corrente) corrente.righeDescrizione.push(testo);
  }
  chiudi();

  return trovati;
}

function sezioneDi(rif: string): string {
  const centinaio = Math.floor(parseFloat(rif) / 100) * 100;
  const sezione = SEZIONE_PER_CENTINAIO[centinaio];
  if (!sezione) throw new Error(`Numero di simbolo fuori dagli intervalli noti (§3.1–3.7): ${rif}`);
  return sezione;
}

/** Riduce una geometria composta (es. "L, T") alla sua prima lettera: lo schema Simbolo porta un solo valore. */
function geometriaDi(grezza: string): Geometria {
  const prima = grezza.split(',')[0].trim();
  if (prima === 'L' || prima === 'P' || prima === 'A' || prima === 'T') return prima;
  throw new Error(`Geometria non riconosciuta: "${grezza}"`);
}

/** True se un file "ISOM <ref> …pdf" o "ISOM <ref>.pdf" esiste per il ref dato (stesso schema di nomi di extract-isom). */
function esisteRenderS5(ref: string, elencoFileS5: string[]): boolean {
  const re = new RegExp(`^ISOM ${escapeRegExp(ref)}(\\s|\\.pdf$)`);
  return elencoFileS5.some((f) => re.test(f));
}

/**
 * Risolve il "ref" di artwork da usare nel path per un rif di testo: il ref
 * condiviso per 701-706, il ref esatto quando esiste un file S5 per quel
 * numero, la variante ".1" quando il pacchetto S5 numera due varianti
 * direttamente nel nome (105, 203; vedi punto 6 in testa al file), oppure
 * `null` se non esiste alcun render S5 (550).
 */
function risolviRefArtwork(rif: string, elencoFileS5: string[]): string | null {
  const atteso = CONDIVISI[rif] ?? rif;
  if (esisteRenderS5(atteso, elencoFileS5)) return atteso;
  if (!atteso.includes('-')) {
    const prima = `${atteso}.1`;
    if (esisteRenderS5(prima, elencoFileS5)) return prima;
  }
  return null;
}

export function costruisciSimboli(
  grezzi: SimboloGrezzo[],
  elencoFileS5: string[],
): { inclusi: Simbolo[]; esclusiSezione: SimboloGrezzo[]; esclusiArtwork: SimboloGrezzo[] } {
  const inclusi: Simbolo[] = [];
  const esclusiSezione: SimboloGrezzo[] = [];
  const esclusiArtwork: SimboloGrezzo[] = [];

  for (const g of grezzi) {
    const sezione = sezioneDi(g.rif);
    if (sezione === 'esclusa') {
      esclusiSezione.push(g);
      continue;
    }

    const refArtwork = risolviRefArtwork(g.rif, elencoFileS5);
    if (refArtwork === null) {
      esclusiArtwork.push(g);
      continue;
    }

    const condiviso = CONDIVISI[g.rif];
    inclusi.push({
      rif: g.rif,
      fonte: 'S1',
      sezione,
      nome: g.nome,
      descrizione: unisciRighe(g.righeDescrizione),
      geometria: geometriaDi(g.geometriaGrezza),
      pagina: g.pagina,
      artwork: {
        path: `content/artwork/isom/${refArtwork}.png`,
        formato: 'png',
        origine: 'S5',
        sha256: '',
        ...(condiviso ? { condiviso } : {}),
      },
    });
  }

  inclusi.sort((a, b) => parseFloat(a.rif) - parseFloat(b.rif));

  return { inclusi, esclusiSezione, esclusiArtwork };
}

/** I file "ISOM Def_*.pdf" (§3.8) e "ISOM min_dim_*.pdf" del pacchetto S5 non sono usati per il rendering. */
function elencaFigureEscluse(elencoFileS5: string[]): VoceEsclusa[] {
  const nomiFile = elencoFileS5.filter((f) => f.startsWith('ISOM Def_') || f.startsWith('ISOM min_dim_'));
  nomiFile.sort();

  return nomiFile.map((file) => ({
    tipo: 'figura',
    file,
    motivo: file.startsWith('ISOM Def_')
      ? 'figura di definizione grafica precisa (§3.8), non usata per il rendering delle carte (akaaso/03-modules/006-pipeline-isom.md)'
      : 'figura di dimensione minima (§3.8), non usata per il rendering delle carte (akaaso/03-modules/006-pipeline-isom.md)',
  }));
}

/** Scrive JSON in modo deterministico: file temporaneo nella stessa cartella, poi spostato sopra la destinazione. */
function scriviJsonAtomico(percorso: string, dati: unknown): void {
  const cartella = dirname(percorso);
  const cartellaTemp = mkdtempSync(join(cartella, '.tmp-isom-'));
  const fileTemp = join(cartellaTemp, 'output.json');
  writeFileSync(fileTemp, `${JSON.stringify(dati, null, 2)}\n`, 'utf8');
  renameSync(fileTemp, percorso);
  rmSync(cartellaTemp, { recursive: true, force: true });
}

function main(): void {
  const testoSorgente = leggiSorgente(SORGENTE_MD);
  const righe = righeConPagina(testoSorgente);
  const grezzi = analizza(righe);

  if (grezzi.length !== ATTESO_RIGHE_SIMBOLO) {
    throw new Error(
      `Trovate ${grezzi.length} righe-simbolo in §3.1–3.7, attese ${ATTESO_RIGHE_SIMBOLO} (vedi conteggio a mano in testa al file). Sorgente cambiata?`,
    );
  }

  const elencoFileS5 = readdirSync(CARTELLA_S5);
  const { inclusi, esclusiSezione, esclusiArtwork } = costruisciSimboli(grezzi, elencoFileS5);

  if (
    inclusi.length !== ATTESO_SIMBOLI_INCLUSI ||
    esclusiSezione.length !== ATTESO_SIMBOLI_ESCLUSI_SEZIONE ||
    esclusiArtwork.length !== ATTESO_SIMBOLI_ESCLUSI_ARTWORK
  ) {
    throw new Error(
      `Ripartizione inattesa: ${inclusi.length} inclusi / ${esclusiSezione.length} esclusi §3.6 / ${esclusiArtwork.length} esclusi per artwork mancante ` +
        `(attesi ${ATTESO_SIMBOLI_INCLUSI} / ${ATTESO_SIMBOLI_ESCLUSI_SEZIONE} / ${ATTESO_SIMBOLI_ESCLUSI_ARTWORK}).`,
    );
  }

  const figureEscluse = elencaFigureEscluse(elencoFileS5);
  const generato = new Date().toISOString().slice(0, 10);

  scriviJsonAtomico(OUT_SIMBOLI, {
    v: 1,
    generato,
    sorgente: 'S1',
    simboli: inclusi,
  });

  const esclusi: VoceEsclusa[] = [
    ...esclusiSezione.map(
      (g): VoceEsclusa => ({
        tipo: 'simbolo',
        rif: g.rif,
        nome: g.nome,
        motivo:
          'sezione 3.6 Simboli tecnici, fuori dal perimetro del deck ISOM (akaaso/01-vision/004-scope-boundaries.md; akaaso/03-modules/006-pipeline-isom.md)',
      }),
    ),
    ...esclusiArtwork.map(
      (g): VoceEsclusa => ({
        tipo: 'simbolo',
        rif: g.rif,
        nome: g.nome,
        motivo: `nessun render S5 disponibile (nessun file "ISOM ${g.rif} …pdf" in sources/iof-isom-2017-2-revision-6-links/); descritto in [S1] ma assente dal pacchetto artwork`,
      }),
    ),
    ...VARIANTI_S5_SENZA_TESTO.map((v): VoceEsclusa => ({ tipo: 'variante', file: v.file, motivo: v.motivo })),
    ...figureEscluse,
  ];

  scriviJsonAtomico(OUT_ESCLUSI, {
    v: 1,
    generato,
    sorgente: 'S1',
    esclusi,
  });

  console.log(
    `parse-isom: ${inclusi.length} simboli scritti in content/simboli/isom.json (atteso ${ATTESO_SIMBOLI_INCLUSI}); ` +
      `${esclusiSezione.length} esclusi per §3.6, ${esclusiArtwork.length} esclusi per artwork mancante, ` +
      `${VARIANTI_S5_SENZA_TESTO.length} varianti S5 orfane, ${figureEscluse.length} figure S5 escluse in content/esclusi/isom.json.`,
  );
}

// Guarded so scripts/check-content.ts can import this module's exported
// helpers (righeConPagina, analizza, costruisciSimboli, SORGENTE_MD,
// CARTELLA_S5) to rebuild the same §3.1-3.7 inventory without re-running the
// parse and its writes as a side effect of the import. Direct execution
// (`node scripts/parse/parse-isom.ts`) is unaffected: import.meta.main is
// true there.
if (import.meta.main) {
  main();
}
