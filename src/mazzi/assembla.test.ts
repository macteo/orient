// Test di `assembla.ts` (F-006 AC-2, AC-3, AC-4, AC-5) su una fixture di
// contenuto minima ma della stessa forma dei file veri: due colonne di
// simboli, due righe ufficiali e due generate, due esempi, due simboli ISOM.
// Le asserzioni sono sui *conteggi* e sull'*appartenenza*, cioè su ciò che i
// criteri di accettazione osservano.

import { describe, expect, it } from 'vitest';
import {
  assemblaMazzi,
  assemblaMazzo,
  direzioneSimbolo,
  riepilogo,
  type Contenuti,
  type DefinizioneMazzo,
  type SimboloContenuto,
} from './assembla.ts';

const artwork = (nome: string, formato: 'svg' | 'png' = 'svg') => ({
  path: `content/artwork/descrizioni-punti/${nome}.${formato}`,
  formato,
  origine: 'S4' as const,
  sha256: '',
});

const simbolo = (
  rif: string,
  sezione: string,
  colonna: SimboloContenuto['colonna'],
  extra: Partial<SimboloContenuto> = {},
): SimboloContenuto => ({
  rif,
  fonte: 'S3',
  sezione,
  nome: `nome ${rif}`,
  descrizione: `descrizione ${rif}`,
  colonna,
  pagina: 7,
  artwork: artwork(rif),
  ...extra,
});

const DESCRIZIONI: SimboloContenuto[] = [
  simbolo('0.1', 'colonna-c', 'C', {
    direzioni: ['N', 'E', 'S', 'W'],
    artwork: artwork('0.1N'),
  }),
  simbolo('0.3', 'colonna-c', 'C'),
  simbolo('1.1', 'd-morfologici', 'D', { famiglia: 'Oggetti morfologici' }),
  simbolo('1.2', 'd-morfologici', 'D', { famiglia: 'Oggetti morfologici' }),
  simbolo('2.4', 'd-rocce', 'D', { famiglia: 'Rocce e sassi' }),
  simbolo('9.9', 'd-rocce', 'D', { famiglia: 'Rocce e sassi', nascondi: true }),
  simbolo('13.1', 'istruzioni', undefined),
];

const ISOM: SimboloContenuto[] = [
  {
    rif: '101',
    fonte: 'S1',
    sezione: 'forme',
    nome: 'Curva di livello',
    descrizione: 'una linea',
    geometria: 'L',
    pagina: 13,
    artwork: { path: 'content/artwork/isom/101.png', formato: 'png' },
  },
  {
    rif: '204',
    fonte: 'S1',
    sezione: 'rocce',
    nome: 'Masso',
    descrizione: 'un masso',
    geometria: 'P',
    pagina: 20,
    artwork: { path: 'content/artwork/isom/204.png', formato: 'png' },
  },
];

const CONTENUTI: Contenuti = {
  descrizioni: DESCRIZIONI,
  isom: ISOM,
  righeUfficiali: [
    {
      id: 'dc:ufficiale:1',
      codice: '101',
      numero: '1',
      celle: { D: { rif: '1.1' } },
      testo: 'prima riga',
      origine: 'ufficiale',
    },
    {
      id: 'dc:ufficiale:2',
      codice: '212',
      numero: '2',
      celle: { C: { rif: '0.1', direzione: 'N' }, D: { rif: '2.4' } },
      testo: 'seconda riga',
      origine: 'ufficiale',
    },
  ],
  righeGenerate: [
    { id: 'dc:gen:0001', codice: 'gen-0001', celle: { D: { rif: '1.2' } }, testo: 'g1', origine: 'generata' },
    { id: 'dc:gen:0002', codice: 'gen-0002', celle: { D: { rif: '2.4' } }, testo: 'g2', origine: 'generata' },
    { id: 'dc:gen:0003', codice: 'gen-0003', celle: { D: { rif: '1.1' } }, testo: 'g3', origine: 'generata' },
  ],
  esempi: [
    { codice: '1', pagina: 17, famiglia: 'd-morfologici', testo: 'e1', carta: 'content/artwork/esempi/1-carta.png', terreno: 'content/artwork/esempi/1-terreno.png', riga: 'content/artwork/esempi/1-riga.png' },
    { codice: '2', pagina: 21, famiglia: 'd-rocce', testo: 'e2', carta: 'content/artwork/esempi/2-carta.png', terreno: 'content/artwork/esempi/2-terreno.png', riga: 'content/artwork/esempi/2-riga.png' },
    { codice: '3', pagina: 21, famiglia: 'd-rocce', testo: 'e3', carta: 'c', terreno: 't', riga: 'r', nascondi: true },
  ],
  esempiPerPagina: { '17': 'd-morfologici', '21': 'd-rocce' },
};

const SIMBOLI: DefinizioneMazzo = {
  id: 'descrizioni-simboli',
  nome: 'Descrizioni dei punti',
  tipo: 'simbolo',
  ordine: 1,
  sezioni: [
    { id: 'colonna-c', etichetta: 'Colonna C', ordine: 1 },
    { id: 'd-morfologici', etichetta: 'Oggetti morfologici', ordine: 2 },
    { id: 'd-rocce', etichetta: 'Rocce e sassi', ordine: 3 },
    { id: 'istruzioni', etichetta: 'Istruzioni speciali', ordine: 4 },
  ],
};

const COMPLETE: DefinizioneMazzo = {
  id: 'descrizioni-complete',
  nome: 'Descrizioni complete',
  tipo: 'riga',
  ordine: 2,
  sezioni: [
    { id: 'ufficiali', etichetta: 'Ufficiali', ordine: 1 },
    { id: 'd-morfologici', etichetta: 'Oggetti morfologici', ordine: 2 },
    { id: 'd-rocce', etichetta: 'Rocce e sassi', ordine: 3 },
    { id: 'd-particolari', etichetta: 'Oggetti particolari', ordine: 4 },
  ],
};

const ESEMPI: DefinizioneMazzo = {
  id: 'esempi',
  nome: 'Esempi sul terreno',
  tipo: 'esempio',
  ordine: 3,
  sezioni: [
    { id: 'd-morfologici', etichetta: 'Oggetti morfologici', ordine: 1 },
    { id: 'd-rocce', etichetta: 'Rocce e sassi', ordine: 2 },
    { id: 'd-particolari', etichetta: 'Oggetti particolari', ordine: 3 },
  ],
};

const ISOM_MAZZO: DefinizioneMazzo = {
  id: 'isom',
  nome: 'ISOM 2017-2',
  tipo: 'simbolo-isom',
  ordine: 4,
  sezioni: [
    { id: 'forme', etichetta: '3.1 Forme del terreno', ordine: 1 },
    { id: 'rocce', etichetta: '3.2 Rocce e sassi', ordine: 2 },
  ],
};

const TUTTI = [SIMBOLI, COMPLETE, ESEMPI, ISOM_MAZZO];

describe('direzioneSimbolo', () => {
  it('legge la direzione dal nome del file d’artwork, quando c’è', () => {
    expect(direzioneSimbolo(DESCRIZIONI[0])).toBe('N');
    expect(direzioneSimbolo(DESCRIZIONI[1])).toBeUndefined();
  });

  it('rifiuta un artwork la cui direzione non è dichiarata dal simbolo', () => {
    const rotto = simbolo('0.1', 'colonna-c', 'C', { direzioni: ['E'], artwork: artwork('0.1N') });
    expect(() => direzioneSimbolo(rotto)).toThrow(/direzione N/);
  });
});

describe('assemblaMazzo: totali e sezioni (AC-2, AC-3)', () => {
  it('il totale di ogni mazzo è la somma dei conteggi delle sue sezioni', () => {
    for (const mazzo of assemblaMazzi(CONTENUTI, TUTTI)) {
      const somma = mazzo.sezioni.reduce((n, s) => n + s.carte.length, 0);
      expect(Object.keys(mazzo.carte)).toHaveLength(somma);
      expect(riepilogo(mazzo).carte).toBe(somma);
    }
  });

  it('ogni voce di contenuto non nascosta compare una volta sola, in una sola sezione', () => {
    const mazzo = assemblaMazzo(CONTENUTI, SIMBOLI);
    const tutti = mazzo.sezioni.flatMap((s) => s.carte);
    expect(new Set(tutti).size).toBe(tutti.length);
    // 7 simboli meno l'unico `nascondi: true`.
    expect(tutti).toHaveLength(6);
  });

  it('una voce con `nascondi` non compare in nessuna sezione né fra le carte', () => {
    const simboli = assemblaMazzo(CONTENUTI, SIMBOLI);
    expect(simboli.carte['ds:9.9']).toBeUndefined();
    expect(simboli.sezioni.flatMap((s) => s.carte)).not.toContain('ds:9.9');
    const esempi = assemblaMazzo(CONTENUTI, ESEMPI);
    expect(esempi.carte['es:3']).toBeUndefined();
    expect(Object.keys(esempi.carte)).toHaveLength(2);
  });

  it('una sezione dichiarata ma senza carte resta nell’elenco, vuota', () => {
    const esempi = assemblaMazzo(CONTENUTI, ESEMPI);
    const particolari = esempi.sezioni.find((s) => s.id === 'd-particolari');
    expect(particolari).toBeDefined();
    expect(particolari?.carte).toEqual([]);
    expect(riepilogo(esempi).sezioni).toContainEqual({
      id: 'd-particolari',
      etichetta: 'Oggetti particolari',
      carte: 0,
    });
  });

  it('le sezioni escono nell’ordine dichiarato, non in quello del contenuto', () => {
    const mazzo = assemblaMazzo(CONTENUTI, SIMBOLI);
    expect(mazzo.sezioni.map((s) => s.id)).toEqual([
      'colonna-c',
      'd-morfologici',
      'd-rocce',
      'istruzioni',
    ]);
  });
});

describe('id delle carte', () => {
  it('un simbolo orientabile porta la direzione nell’id, gli altri no', () => {
    const mazzo = assemblaMazzo(CONTENUTI, SIMBOLI);
    expect(mazzo.carte['ds:0.1N']?.simbolo?.direzione).toBe('N');
    expect(mazzo.carte['ds:0.3']?.simbolo?.direzione).toBeUndefined();
  });

  it('gli id di righe, esempi e ISOM seguono lo schema di F-006', () => {
    const complete = assemblaMazzo(CONTENUTI, COMPLETE);
    expect(Object.keys(complete.carte)).toContain('dc:ufficiale:1');
    expect(Object.keys(complete.carte)).toContain('dc:gen:0001');
    expect(Object.keys(assemblaMazzo(CONTENUTI, ESEMPI).carte)).toEqual(['es:1', 'es:2']);
    expect(Object.keys(assemblaMazzo(CONTENUTI, ISOM_MAZZO).carte)).toEqual(['isom:101', 'isom:204']);
  });
});

describe('descrizioni-complete (AC-4)', () => {
  it('elenca le righe ufficiali per prime, sotto `ufficiali`', () => {
    const mazzo = assemblaMazzo(CONTENUTI, COMPLETE);
    expect(mazzo.sezioni[0].id).toBe('ufficiali');
    expect(mazzo.sezioni[0].carte).toEqual(['dc:ufficiale:1', 'dc:ufficiale:2']);
    expect(Object.keys(mazzo.carte).slice(0, 2)).toEqual(['dc:ufficiale:1', 'dc:ufficiale:2']);
  });

  it('mette ogni riga generata sotto la famiglia D del suo simbolo di colonna D, una volta sola', () => {
    const mazzo = assemblaMazzo(CONTENUTI, COMPLETE);
    const perSezione = Object.fromEntries(mazzo.sezioni.map((s) => [s.id, s.carte]));
    expect(perSezione['d-morfologici']).toEqual(['dc:gen:0001', 'dc:gen:0003']);
    expect(perSezione['d-rocce']).toEqual(['dc:gen:0002']);
    const generate = mazzo.sezioni.flatMap((s) => s.carte).filter((id) => id.startsWith('dc:gen:'));
    expect(new Set(generate).size).toBe(3);
  });

  it('rifiuta una riga generata senza cella D', () => {
    const rotto: Contenuti = {
      ...CONTENUTI,
      righeGenerate: [{ id: 'dc:gen:0009', codice: 'gen-0009', celle: {}, testo: 'x', origine: 'generata' }],
    };
    expect(() => assemblaMazzo(rotto, COMPLETE)).toThrow(/cella D/);
  });
});

describe('distrattori', () => {
  it('perSezione ripete esattamente le carte della sezione', () => {
    const mazzo = assemblaMazzo(CONTENUTI, SIMBOLI);
    for (const sezione of mazzo.sezioni) {
      expect(mazzo.distrattori.perSezione[sezione.id]).toEqual(sezione.carte);
    }
  });

  it('perColonna esiste solo per le descrizioni dei punti e ignora i simboli senza colonna', () => {
    const simboli = assemblaMazzo(CONTENUTI, SIMBOLI);
    expect(simboli.distrattori.perColonna).toEqual({
      C: ['ds:0.1N', 'ds:0.3'],
      D: ['ds:1.1', 'ds:1.2', 'ds:2.4'],
    });
    expect(assemblaMazzo(CONTENUTI, COMPLETE).distrattori.perColonna).toBeUndefined();
    expect(assemblaMazzo(CONTENUTI, ISOM_MAZZO).distrattori.perColonna).toBeUndefined();
  });
});

describe('artwork e sezione ISOM', () => {
  it('applica `urlArtwork` a ogni percorso d’immagine che una faccia mette in `src`', () => {
    const conBase: Contenuti = { ...CONTENUTI, urlArtwork: (p) => `/orient/${p}` };
    const esempi = assemblaMazzo(conBase, ESEMPI);
    expect(esempi.carte['es:1'].esempio?.carta).toBe('/orient/content/artwork/esempi/1-carta.png');
    expect(esempi.carte['es:1'].esempio?.riga).toBe('/orient/content/artwork/esempi/1-riga.png');
    const isom = assemblaMazzo(conBase, ISOM_MAZZO);
    expect(isom.carte['isom:101'].isom?.artwork.path).toBe('/orient/content/artwork/isom/101.png');
  });

  it('non porta i campi di sola build (`origine`, `sha256`) nel JSON del mazzo', () => {
    const mazzo = assemblaMazzo(CONTENUTI, SIMBOLI);
    expect(mazzo.carte['ds:0.3'].simbolo?.artwork).toEqual({
      path: 'content/artwork/descrizioni-punti/0.3.svg',
      formato: 'svg',
    });
  });

  it('la carta ISOM porta l’etichetta della sua sezione, non l’id', () => {
    const mazzo = assemblaMazzo(CONTENUTI, ISOM_MAZZO);
    expect(mazzo.carte['isom:204'].sezione).toBe('rocce');
    expect(mazzo.carte['isom:204'].isom?.sezione).toBe('3.2 Rocce e sassi');
  });
});

describe('determinismo (AC-5)', () => {
  it('due assemblaggi dallo stesso contenuto danno gli stessi byte', () => {
    const uno = JSON.stringify(assemblaMazzi(CONTENUTI, TUTTI));
    const due = JSON.stringify(assemblaMazzi(CONTENUTI, TUTTI));
    expect(due).toBe(uno);
  });

  it('rifiuta una carta la cui sezione non è dichiarata dal mazzo', () => {
    const rotto: Contenuti = {
      ...CONTENUTI,
      descrizioni: [...DESCRIZIONI, simbolo('7.7', 'sezione-inventata', 'E')],
    };
    expect(() => assemblaMazzo(rotto, SIMBOLI)).toThrow(/non dichiara/);
  });
});
