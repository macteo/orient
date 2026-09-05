import { describe, expect, it } from 'vitest';
import type { Carta, MazzoBuild } from '../mazzi/tipi.ts';
import { makeRng } from './rng.ts';
import { opzioni, verdetto } from './quiz.ts';

function simbolo(id: string, sezione: string, nome: string): Carta {
  return {
    id,
    mazzo: 'descrizioni-simboli',
    tipo: 'simbolo',
    sezione,
    simbolo: { rif: id, nome, descrizione: `Definizione di ${nome}`, artwork: { path: `x/${id}.svg`, formato: 'svg' } },
  };
}

// Sezione 'colonna-c': 6 carte con nomi distinti -> pool di sezione sempre
// sufficiente (>= 3 altre). Sezione 'd-particolari': solo 2 carte -> deve
// ricadere sulla colonna 'D', che ne contiene altre. Colonna 'C' coincide
// con la sezione (per completezza). Nessuna carta di un altro mazzo.
const mazzo: MazzoBuild = {
  id: 'descrizioni-simboli',
  nome: 'Descrizioni dei simboli',
  tipo: 'simbolo',
  sezioni: [
    { id: 'colonna-c', etichetta: 'Punti di controllo', carte: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] },
    { id: 'd-particolari', etichetta: 'Particolari', carte: ['p1', 'p2'] },
  ],
  carte: {
    c1: simbolo('c1', 'colonna-c', 'Punto di controllo'),
    c2: simbolo('c2', 'colonna-c', 'Recinzione'),
    c3: simbolo('c3', 'colonna-c', 'Muro'),
    c4: simbolo('c4', 'colonna-c', 'Fossato'),
    c5: simbolo('c5', 'colonna-c', 'Torre'),
    c6: simbolo('c6', 'colonna-c', 'Rovina'),
    p1: simbolo('p1', 'd-particolari', 'Masso'),
    p2: simbolo('p2', 'd-particolari', 'Cumulo di pietre'),
    d3: simbolo('d3', 'd-idrografia', 'Pozzo'),
    d4: simbolo('d4', 'd-idrografia', 'Sorgente'),
    d5: simbolo('d5', 'd-idrografia', 'Palude'),
  },
  distrattori: {
    perSezione: {
      'colonna-c': ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
      'd-particolari': ['p1', 'p2'],
    },
    perColonna: {
      C: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
      D: ['p1', 'p2', 'd3', 'd4', 'd5'],
    },
  },
};

// Un secondo mazzo, senza colonne definite: il fallback deve ricadere
// sull'intero mazzo, mai su un mazzo diverso.
const mazzoSenzaColonne: MazzoBuild = {
  id: 'isom',
  nome: 'Simboli ISOM',
  tipo: 'simbolo-isom',
  sezioni: [{ id: 'forme', etichetta: 'Forme del terreno', carte: ['i1', 'i2'] }],
  carte: {
    i1: {
      id: 'i1', mazzo: 'isom', tipo: 'simbolo-isom', sezione: 'forme',
      isom: { rif: '101', nome: 'Curva di livello', geometria: 'L', descrizione: 'd', artwork: { path: 'x', formato: 'png' }, sezione: 'Forme del terreno' },
    },
    i2: {
      id: 'i2', mazzo: 'isom', tipo: 'simbolo-isom', sezione: 'forme',
      isom: { rif: '102', nome: 'Curva direttrice', geometria: 'L', descrizione: 'd', artwork: { path: 'x', formato: 'png' }, sezione: 'Forme del terreno' },
    },
    i3: {
      id: 'i3', mazzo: 'isom', tipo: 'simbolo-isom', sezione: 'rocce',
      isom: { rif: '201', nome: 'Roccia', geometria: 'A', descrizione: 'd', artwork: { path: 'x', formato: 'png' }, sezione: 'Rocce e sassi' },
    },
    i4: {
      id: 'i4', mazzo: 'isom', tipo: 'simbolo-isom', sezione: 'rocce',
      isom: { rif: '202', nome: 'Masso', geometria: 'P', descrizione: 'd', artwork: { path: 'x', formato: 'png' }, sezione: 'Rocce e sassi' },
    },
  },
  distrattori: {
    perSezione: { forme: ['i1', 'i2'], rocce: ['i3', 'i4'] },
  },
};

function nomeDi(mazzoUsato: MazzoBuild, id: string): string {
  const carta = mazzoUsato.carte[id];
  return carta.simbolo?.nome ?? carta.isom?.nome ?? id;
}

describe('opzioni (F-003 AC-1)', () => {
  it('ritorna 4 opzioni distinte, comprendenti la carta interrogata', () => {
    const domanda = opzioni(mazzo.carte.c1, mazzo, makeRng(1));
    expect(domanda.opzioni).toHaveLength(4);
    expect(new Set(domanda.opzioni).size).toBe(4);
    expect(domanda.opzioni).toContain('c1');
    expect(domanda.opzioni[domanda.giusta]).toBe('c1');
  });

  it('non ripete mai lo stesso nome fra le opzioni', () => {
    for (let seme = 0; seme < 50; seme += 1) {
      const domanda = opzioni(mazzo.carte.c1, mazzo, makeRng(seme));
      const nomi = domanda.opzioni.map((id) => nomeDi(mazzo, id));
      expect(new Set(nomi).size).toBe(nomi.length);
    }
  });

  it('la posizione della risposta è uniforme entro il 5% su 1000 domande generate', () => {
    const conteggi = [0, 0, 0, 0];
    const rng = makeRng(12345);
    const totale = 4000;
    for (let i = 0; i < totale; i += 1) {
      const domanda = opzioni(mazzo.carte.c1, mazzo, rng);
      conteggi[domanda.giusta] += 1;
    }
    for (const conteggio of conteggi) {
      const proporzione = conteggio / totale;
      expect(proporzione).toBeGreaterThan(0.2);
      expect(proporzione).toBeLessThan(0.3);
    }
  });
});

describe('opzioni: regole dei distrattori (F-003 AC-2)', () => {
  it('pesca dalla sezione quando questa ha almeno 3 altre carte', () => {
    const sezionePossibili = new Set(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
    for (let seme = 0; seme < 20; seme += 1) {
      const domanda = opzioni(mazzo.carte.c1, mazzo, makeRng(seme));
      for (const id of domanda.opzioni) {
        expect(sezionePossibili.has(id)).toBe(true);
      }
    }
  });

  it('ricade sulla colonna quando la sezione ha meno di 3 altre carte', () => {
    const colonnaPossibili = new Set(['p1', 'p2', 'd3', 'd4', 'd5']);
    for (let seme = 0; seme < 20; seme += 1) {
      const domanda = opzioni(mazzo.carte.p1, mazzo, makeRng(seme));
      expect(domanda.opzioni).toContain('p1');
      for (const id of domanda.opzioni) {
        expect(colonnaPossibili.has(id)).toBe(true);
      }
      // deve usare almeno un distrattore che non è nella sezione originale,
      // a riprova che è ricaduta sulla colonna e non si è fermata alla sezione
      const fuoriSezione = domanda.opzioni.some((id) => id === 'd3' || id === 'd4' || id === 'd5');
      expect(fuoriSezione).toBe(true);
    }
  });

  it('senza colonne definite ricade sull’intero mazzo, mai su un altro mazzo', () => {
    const idDelMazzo = new Set(Object.keys(mazzoSenzaColonne.carte));
    for (let seme = 0; seme < 20; seme += 1) {
      const domanda = opzioni(mazzoSenzaColonne.carte.i1, mazzoSenzaColonne, makeRng(seme));
      expect(domanda.opzioni).toContain('i1');
      for (const id of domanda.opzioni) {
        expect(idDelMazzo.has(id)).toBe(true);
        expect(mazzo.carte[id]).toBeUndefined();
      }
    }
  });
});

describe('verdetto', () => {
  it('è "giusta" quando la scelta è l’id della carta interrogata', () => {
    expect(verdetto(mazzo.carte.c1, 'c1')).toBe('giusta');
  });

  it('è "sbagliata" per qualunque altra scelta', () => {
    expect(verdetto(mazzo.carte.c1, 'c2')).toBe('sbagliata');
  });
});
