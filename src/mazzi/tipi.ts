// Tipi condivisi del dominio "mazzi": le carte compilate a build
// (`MazzoBuild`, F-006), e i tipi di sessione (`Serie`, `Risultato`) usati
// dal modulo allenamento (F-002, F-003, F-010; architettura 003).
//
// I sotto-tipi di contenuto (RigaDescrizione, Esempio, Cella) vengono dal
// modello di contenuto descritto in `_context.md`; sono ridichiarati qui,
// nella loro forma "a runtime" (senza i campi solo di build come sha256),
// perché `Carta` li referenzia direttamente (F-004).

/** Le otto direzioni cardinali/intercardinali usate dalle celle e dai simboli orientabili. */
export type Direzione8 = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/** Le quattro geometrie ISOM (punto, linea, area, testo). */
export type Geometria = 'L' | 'P' | 'A' | 'T';

/**
 * Un'immagine di corredo di una carta: percorso e formato, mai ricolorata o
 * ritagliata. `origine` e `sha256` esistono solo nel contenuto sorgente
 * (`content/simboli/*.json`) e sono opzionali qui, perché il JSON del mazzo
 * emesso a build porta soltanto ciò che una faccia usa (F-006).
 */
export type Artwork = {
  path: string;
  formato: 'svg' | 'png';
  origine?: 'S1' | 'S3' | 'S4' | 'S5';
  sha256?: string;
};

/** Una cella della riga di descrizione (colonne C–H). */
export type Cella = { rif: string; direzione?: Direzione8 };

/** Una riga di descrizione completa (le 9 ufficiali + le generate). */
export type RigaDescrizione = {
  id: string;
  codice: string;
  numero?: string;
  celle: { C?: Cella; D?: Cella; E?: Cella; F?: Cella | string; G?: Cella; H?: Cella };
  testo: string;
  origine: 'ufficiale' | 'generata';
};

/** Un esempio (mappa + terreno + riga) del mazzo `esempi`. */
export type Esempio = {
  codice: string;
  pagina: number;
  famiglia: string;
  testo: string;
  carta: string;
  terreno: string;
  riga: string;
  nascondi?: boolean;
};

/** Il tipo di carta, che determina quale sotto-campo di `Carta` è popolato. */
export type TipoCarta = 'simbolo' | 'riga' | 'esempio' | 'simbolo-isom';

/**
 * Una carta compilata a build (F-004, F-006): l'unione discriminata dei
 * quattro tipi di mazzo. Solo il sotto-campo corrispondente a `tipo` è
 * popolato.
 */
export type Carta = {
  id: string;
  mazzo: string;
  tipo: TipoCarta;
  sezione: string;
  simbolo?: {
    rif: string;
    nome: string;
    descrizione: string;
    artwork: Artwork;
    direzione?: Direzione8;
  };
  riga?: RigaDescrizione;
  esempio?: Esempio;
  isom?: {
    rif: string;
    nome: string;
    geometria: Geometria;
    descrizione: string;
    artwork: Artwork;
    /** L'etichetta della sezione ISOM (es. «3.2 Rocce e sassi»), stampata sul retro. */
    sezione: string;
  };
};

/** Una sezione di un mazzo: id stabile, etichetta italiana, id delle carte che contiene. */
export type Sezione = { id: string; etichetta: string; carte: string[] };

/**
 * Il JSON di un mazzo emesso da `scripts/build-mazzi.ts` (F-006):
 * carte, sezioni con conteggi impliciti (`carte.length`) e le liste di
 * distrattori usate da `quiz.ts`.
 */
export type MazzoBuild = {
  id: string;
  nome: string;
  tipo: TipoCarta;
  sezioni: Sezione[];
  carte: Record<string, Carta>;
  distrattori: {
    perSezione: Record<string, string[]>;
    perColonna?: Record<string, string[]>;
  };
};

/** Modalità di allenamento. */
export type Modo = 'flashcard' | 'quiz';

/** L'unica direzione non di default; assente = diretta. */
export type Direzione = 'inversa';

/** Esito di una carta in modalità flash card. */
export type EsitoFlashcard = 'sapevo' | 'non-sapevo';

/** Esito di una domanda in modalità quiz. */
export type EsitoQuiz = 'giusta' | 'sbagliata';

/** Esito di una carta valutata, in una modalità o nell'altra. */
export type Esito = EsitoFlashcard | EsitoQuiz;

/** Una risposta registrata in una `Serie`; `scelta` è popolato solo dal quiz. */
export type Risposta = {
  carta: string;
  esito: Esito;
  scelta?: string;
};

/**
 * Una serie in corso (F-002, F-003), persistita in `orient.serie.v1`.
 *
 * `carte` è l'ordine di mescolamento della prima passata; `i` indicizza
 * `carte` finché `i < carte.length` (prima passata), poi la carta corrente è
 * `coda[0]` (ripasso degli errori, in ordine di errore). `girata` non viene
 * mai persistita "a true": la serie è mirrorata sullo storage solo dopo una
 * valutazione, quando è già tornata a `false`.
 */
export type Serie = {
  v: 1;
  mazzo: string;
  sezioni: string[];
  modo: Modo;
  direzione?: Direzione;
  carte: string[];
  i: number;
  risposte: Risposta[];
  coda: string[];
  iniziata: string;
  girata: boolean;
  ripasso?: boolean;
};

/**
 * Un risultato completato (F-002, F-003, F-010), accodato in
 * `orient.risultati.v1`. `viste`/`giuste`/`sbagliate` contano solo la prima
 * passata; `sbagliate` è nell'ordine in cui gli errori sono avvenuti.
 */
export type Risultato = {
  v: 1;
  mazzo: string;
  sezioni: string[];
  modo: Modo;
  direzione?: Direzione;
  data: string;
  viste: number;
  giuste: number;
  sbagliate: string[];
  ripasso?: boolean;
};
