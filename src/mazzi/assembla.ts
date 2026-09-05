// Assemblaggio puro dei quattro mazzi (F-006): da `content/` alle carte
// compilate, senza alcun I/O — `scripts/build-mazzi.ts` legge i file, chiama
// `assemblaMazzo` una volta per mazzo e scrive `.generated/`.
//
// Le definizioni dei mazzi e delle loro sezioni (id, etichetta, ordine) NON
// sono ricodificate qui: arrivano da `content/sezioni.json`, che è la sola
// fonte di verità (F-006, tabella dei mazzi). Questo modulo decide soltanto
// *quale carta finisce in quale sezione*, e con quale id stabile.
//
// Id delle carte (`_context.md`, F-006): `ds:<rif>[<DIR>]`, `dc:ufficiale:<n>`,
// `dc:gen:<NNNN>`, `es:<codice>`, `isom:<rif>`. Sono stabili per definizione:
// un risultato salvato nello storage sopravvive a una rigenerazione del
// contenuto.

import type {
  Artwork,
  Carta,
  Direzione8,
  Esempio,
  Geometria,
  MazzoBuild,
  RigaDescrizione,
  Sezione,
  TipoCarta,
} from './tipi.ts';

/** Le colonne C–H di una descrizione punto. */
export type Colonna = 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/** Un simbolo come sta in `content/simboli/{descrizioni-punti,isom}.json`. */
export type SimboloContenuto = {
  rif: string;
  fonte: 'S1' | 'S3';
  sezione: string;
  nome: string;
  descrizione: string;
  colonna?: Colonna;
  famiglia?: string;
  geometria?: Geometria;
  direzioni?: Direzione8[];
  pagina: number;
  artwork: Artwork;
  isom?: string[];
  nascondi?: boolean;
};

/** Una sezione dichiarata in `content/sezioni.json`. */
export type DefinizioneSezione = { id: string; etichetta: string; ordine: number };

/** Un mazzo dichiarato in `content/sezioni.json`. */
export type DefinizioneMazzo = {
  id: string;
  nome: string;
  tipo: TipoCarta;
  fonte?: string;
  ordine: number;
  sezioni: DefinizioneSezione[];
};

/**
 * Tutto il contenuto che i quattro mazzi consumano, già deserializzato.
 * `urlArtwork` traduce un percorso di `content/artwork/…` nell'URL che una
 * faccia può mettere in `img.src`: iniettato (e non calcolato qui) perché
 * dipende dal base path del sito, che è una decisione di build.
 */
export type Contenuti = {
  descrizioni: SimboloContenuto[];
  isom: SimboloContenuto[];
  righeUfficiali: RigaDescrizione[];
  righeGenerate: RigaDescrizione[];
  esempi: Esempio[];
  /** numero di pagina (come stringa) → id della sezione, da `esempi/sezioni.json`. */
  esempiPerPagina: Record<string, string>;
  urlArtwork?: (percorso: string) => string;
};

/** Il riepilogo di un mazzo inlinato nella home (F-006 AC-3). */
export type RiepilogoMazzo = {
  id: string;
  nome: string;
  tipo: TipoCarta;
  carte: number;
  sezioni: { id: string; etichetta: string; carte: number }[];
};

/** `ds:<rif>[<DIR>]` — la direzione fa parte dell'id solo se il simbolo ne ha una. */
export function idSimbolo(rif: string, direzione?: Direzione8): string {
  return `ds:${rif}${direzione ?? ''}`;
}

/** `isom:<rif>`. */
export function idIsom(rif: string): string {
  return `isom:${rif}`;
}

/** `es:<codice>`. */
export function idEsempio(codice: string): string {
  return `es:${codice}`;
}

/**
 * La direzione «rappresentativa» di un simbolo orientabile: quella incisa nel
 * nome del file d'artwork (`0.1N.svg` → `N`), che è anche la chiave con cui
 * lo sprite espone il pittogramma (`#s-0.1N`, vedi `scripts/lib/sprite.ts`).
 * Un simbolo non orientabile (`1.2.svg`) non ne ha.
 */
export function direzioneSimbolo(simbolo: SimboloContenuto): Direzione8 | undefined {
  const nomeFile = simbolo.artwork.path.split('/').pop() ?? '';
  const radice = nomeFile.replace(/\.(svg|png)$/, '');
  if (!radice.startsWith(simbolo.rif)) {
    throw new Error(
      `assembla: l'artwork di ${simbolo.rif} non porta il suo riferimento nel nome (${nomeFile})`,
    );
  }
  const resto = radice.slice(simbolo.rif.length);
  if (resto === '') return undefined;
  const direzioni = simbolo.direzioni ?? [];
  if (!direzioni.includes(resto as Direzione8)) {
    throw new Error(
      `assembla: ${simbolo.rif} ha artwork in direzione ${resto}, non dichiarata fra le sue direzioni`,
    );
  }
  return resto as Direzione8;
}

/** La forma a runtime di un artwork: solo ciò che una faccia usa. */
function artworkRuntime(artwork: Artwork, url: (percorso: string) => string): Artwork {
  return { path: url(artwork.path), formato: artwork.formato };
}

function carteSimboli(
  simboli: SimboloContenuto[],
  mazzo: string,
  url: (percorso: string) => string,
): Carta[] {
  return simboli
    .filter((simbolo) => !simbolo.nascondi)
    .map((simbolo) => {
      const direzione = direzioneSimbolo(simbolo);
      return {
        id: idSimbolo(simbolo.rif, direzione),
        mazzo,
        tipo: 'simbolo' as const,
        sezione: simbolo.sezione,
        simbolo: {
          rif: simbolo.rif,
          nome: simbolo.nome,
          descrizione: simbolo.descrizione,
          artwork: artworkRuntime(simbolo.artwork, url),
          ...(direzione ? { direzione } : {}),
        },
      };
    });
}

function carteIsom(
  simboli: SimboloContenuto[],
  mazzo: string,
  etichette: Map<string, string>,
  url: (percorso: string) => string,
): Carta[] {
  return simboli
    .filter((simbolo) => !simbolo.nascondi)
    .map((simbolo) => {
      if (!simbolo.geometria) {
        throw new Error(`assembla: il simbolo ISOM ${simbolo.rif} non ha geometria`);
      }
      return {
        id: idIsom(simbolo.rif),
        mazzo,
        tipo: 'simbolo-isom' as const,
        sezione: simbolo.sezione,
        isom: {
          rif: simbolo.rif,
          nome: simbolo.nome,
          geometria: simbolo.geometria,
          descrizione: simbolo.descrizione,
          artwork: artworkRuntime(simbolo.artwork, url),
          // La faccia ISOM stampa il nome della sezione sotto il nome del
          // simbolo (F-004): serve l'etichetta, non l'id.
          sezione: etichette.get(simbolo.sezione) ?? simbolo.sezione,
        },
      };
    });
}

/**
 * Le righe del mazzo `descrizioni-complete`: le nove ufficiali nella sezione
 * `ufficiali`, ognuna delle generate nella famiglia D del suo simbolo di
 * colonna D (F-006 AC-4).
 */
function carteRighe(
  contenuti: Contenuti,
  mazzo: string,
): Carta[] {
  const sezionePerRif = new Map(
    contenuti.descrizioni.filter((s) => s.colonna === 'D').map((s) => [s.rif, s.sezione]),
  );
  const carta = (riga: RigaDescrizione, sezione: string): Carta => ({
    id: riga.id,
    mazzo,
    tipo: 'riga',
    sezione,
    riga,
  });
  const ufficiali = contenuti.righeUfficiali.map((riga) => carta(riga, 'ufficiali'));
  const generate = contenuti.righeGenerate.map((riga) => {
    const cellaD = riga.celle.D;
    if (!cellaD) {
      throw new Error(`assembla: la riga generata ${riga.id} non ha una cella D`);
    }
    const sezione = sezionePerRif.get(cellaD.rif);
    if (!sezione) {
      throw new Error(
        `assembla: la riga generata ${riga.id} punta a ${cellaD.rif}, che non è un simbolo di colonna D`,
      );
    }
    return carta(riga, sezione);
  });
  return [...ufficiali, ...generate];
}

function carteEsempi(
  contenuti: Contenuti,
  mazzo: string,
  url: (percorso: string) => string,
): Carta[] {
  return contenuti.esempi
    .filter((esempio) => !esempio.nascondi)
    .map((esempio) => {
      const sezione = contenuti.esempiPerPagina[String(esempio.pagina)];
      if (!sezione) {
        throw new Error(
          `assembla: l'esempio ${esempio.codice} è a pagina ${esempio.pagina}, che esempi/sezioni.json non assegna a nessuna famiglia`,
        );
      }
      return {
        id: idEsempio(esempio.codice),
        mazzo,
        tipo: 'esempio' as const,
        sezione,
        esempio: {
          ...esempio,
          carta: url(esempio.carta),
          terreno: url(esempio.terreno),
          riga: url(esempio.riga),
        },
      };
    });
}

/** Le carte candidate di un mazzo, nell'ordine in cui il contenuto le elenca. */
function carteDelMazzo(contenuti: Contenuti, definizione: DefinizioneMazzo): Carta[] {
  const url = contenuti.urlArtwork ?? ((percorso: string) => percorso);
  switch (definizione.tipo) {
    case 'simbolo':
      return carteSimboli(contenuti.descrizioni, definizione.id, url);
    case 'riga':
      return carteRighe(contenuti, definizione.id);
    case 'esempio':
      return carteEsempi(contenuti, definizione.id, url);
    case 'simbolo-isom': {
      const etichette = new Map(definizione.sezioni.map((s) => [s.id, s.etichetta]));
      return carteIsom(contenuti.isom, definizione.id, etichette, url);
    }
    default: {
      const mai: never = definizione.tipo;
      throw new Error(`assembla: tipo di mazzo sconosciuto: ${String(mai)}`);
    }
  }
}

/** Le sezioni del mazzo nell'ordine dichiarato, senza mutare l'input. */
function sezioniOrdinate(definizione: DefinizioneMazzo): DefinizioneSezione[] {
  return definizione.sezioni.slice().sort((a, b) => a.ordine - b.ordine);
}

/**
 * Assembla un mazzo: le carte non nascoste del suo contenuto, distribuite
 * nelle sezioni che `content/sezioni.json` dichiara per quel mazzo, più i
 * pool di distrattori che `allenamento/quiz.ts` consuma.
 *
 * Ogni voce di contenuto compare **una volta sola** e in **una sola**
 * sezione (F-006 AC-2, AC-4); una sezione dichiarata ma senza carte resta
 * nell'elenco con `carte: []`, perché l'elenco delle sezioni è quello del
 * contenuto, non quello dei dati (`esempi` / `d-particolari`: S3 non dà
 * esempi di oggetti particolari).
 */
export function assemblaMazzo(contenuti: Contenuti, definizione: DefinizioneMazzo): MazzoBuild {
  const sezioni = sezioniOrdinate(definizione);
  const dichiarate = new Set(sezioni.map((s) => s.id));
  const perSezione = new Map<string, string[]>(sezioni.map((s) => [s.id, []]));
  const carteTrovate = new Map<string, Carta>();

  for (const carta of carteDelMazzo(contenuti, definizione)) {
    if (!dichiarate.has(carta.sezione)) {
      throw new Error(
        `assembla: la carta ${carta.id} è nella sezione "${carta.sezione}", che il mazzo ${definizione.id} non dichiara`,
      );
    }
    if (carteTrovate.has(carta.id)) {
      throw new Error(`assembla: id carta duplicato nel mazzo ${definizione.id}: ${carta.id}`);
    }
    carteTrovate.set(carta.id, carta);
    perSezione.get(carta.sezione)?.push(carta.id);
  }

  // Le carte sono indicizzate in ordine di sezione, poi di contenuto: due
  // build dallo stesso contenuto scrivono gli stessi byte (F-006 AC-5).
  const elencoSezioni: Sezione[] = sezioni.map((s) => ({
    id: s.id,
    etichetta: s.etichetta,
    carte: perSezione.get(s.id) ?? [],
  }));
  const carte: Record<string, Carta> = {};
  for (const sezione of elencoSezioni) {
    for (const id of sezione.carte) {
      const carta = carteTrovate.get(id);
      if (carta) carte[id] = carta;
    }
  }

  const distrattori: MazzoBuild['distrattori'] = {
    perSezione: Object.fromEntries(elencoSezioni.map((s) => [s.id, s.carte])),
  };
  const perColonna = poolPerColonna(contenuti, definizione, carteTrovate);
  if (perColonna) distrattori.perColonna = perColonna;

  return {
    id: definizione.id,
    nome: definizione.nome,
    tipo: definizione.tipo,
    sezioni: elencoSezioni,
    carte,
    distrattori,
  };
}

/**
 * I pool per colonna, che esistono solo per le descrizioni dei punti: due
 * simboli della stessa colonna sono distrattori plausibili anche quando la
 * loro sezione è troppo piccola per fornirne tre (F-003 AC-2, `quiz.ts`).
 * I simboli senza colonna (le istruzioni speciali) non entrano in nessun pool.
 */
function poolPerColonna(
  contenuti: Contenuti,
  definizione: DefinizioneMazzo,
  carte: Map<string, Carta>,
): Record<string, string[]> | undefined {
  if (definizione.tipo !== 'simbolo') return undefined;
  const pool: Record<string, string[]> = {};
  for (const simbolo of contenuti.descrizioni) {
    if (simbolo.nascondi || !simbolo.colonna) continue;
    const id = idSimbolo(simbolo.rif, direzioneSimbolo(simbolo));
    if (!carte.has(id)) continue;
    (pool[simbolo.colonna] ??= []).push(id);
  }
  return pool;
}

/** I quattro mazzi nell'ordine dichiarato da `content/sezioni.json`. */
export function assemblaMazzi(contenuti: Contenuti, definizioni: DefinizioneMazzo[]): MazzoBuild[] {
  return definizioni
    .slice()
    .sort((a, b) => a.ordine - b.ordine)
    .map((definizione) => assemblaMazzo(contenuti, definizione));
}

/** Il riepilogo che la home inlina: conteggi, mai le carte (F-006 AC-3). */
export function riepilogo(mazzo: MazzoBuild): RiepilogoMazzo {
  return {
    id: mazzo.id,
    nome: mazzo.nome,
    tipo: mazzo.tipo,
    carte: Object.keys(mazzo.carte).length,
    sezioni: mazzo.sezioni.map((s) => ({ id: s.id, etichetta: s.etichetta, carte: s.carte.length })),
  };
}
