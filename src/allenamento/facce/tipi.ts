// src/allenamento/facce/tipi.ts — minimal local `Carta` type for the facce
// module (3.002, F-004). The real `Carta` type will land in
// `src/mazzi/tipi.ts` from another task; every field name here matches
// `akaaso/09-tasks/_context.md`'s content model and F-004's Interfaces
// block, so the two can be unified later without renaming.

/** The eight compass points a symbol or a description-row cell can carry. */
export type Direzione = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/** ISOM area/line/point/text geometry letter (content model, 3.002). */
export type Geometria = 'L' | 'P' | 'A' | 'T';

export type Artwork = {
  path: string;
  formato: 'svg' | 'png';
  origine: 'S4' | 'S5' | 'S3';
  sha256: string;
};

/** One RigaDescrizione cell (C, D, E, G, H): a symbol reference. */
export type Cella = { rif: string; direzione?: Direzione };

export type RigaDescrizione = {
  id: string;
  codice: string;
  /** The printed row number; absent ("—" on the front) for generated rows. */
  numero?: string;
  celle: {
    C?: Cella;
    D?: Cella;
    E?: Cella;
    /** F is a symbol, a literal dimension ("1.0", "5x5"), or empty. */
    F?: Cella | string;
    G?: Cella;
    H?: Cella;
  };
  testo: string;
  origine: 'ufficiale' | 'generata';
};

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

export type Size = 'carta' | 'tile' | 'lista';
export type TipoCarta = 'simbolo' | 'riga' | 'esempio' | 'simbolo-isom';

export type Carta = {
  id: string;
  mazzo: string;
  tipo: TipoCarta;
  sezione: string;
  // Exactly one of these is set, matching `tipo`.
  simbolo?: { rif: string; nome: string; descrizione: string; artwork: Artwork; direzione?: Direzione };
  riga?: RigaDescrizione;
  esempio?: Esempio;
  isom?: {
    rif: string;
    nome: string;
    geometria: Geometria;
    descrizione: string;
    artwork: Artwork;
    /** Section label (e.g. "Rocce e sassi") — the ISOM back's "section" line. */
    sezione: string;
  };
};
