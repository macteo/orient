import { describe, expect, it } from 'vitest';
import type { Risultato, Serie } from '../mazzi/tipi.ts';
import { makeRng } from './rng.ts';
import {
  avvia,
  cartaAttuale,
  completata,
  daRipasso,
  gira,
  isoAlMinuto,
  mescola,
  prossima,
  risultato,
  valuta,
} from './serie.ts';

function serieVuota(overrides: Partial<Serie> = {}): Serie {
  return {
    v: 1,
    mazzo: 'descrizioni-simboli',
    sezioni: ['colonna-c'],
    modo: 'flashcard',
    carte: ['a', 'b', 'c'],
    i: 0,
    risposte: [],
    coda: [],
    iniziata: '2026-09-05T10:00',
    girata: false,
    ...overrides,
  };
}

describe('avvia', () => {
  it('un run di 8 da un pool di 20 mostra 8 carte distinte (F-002 AC-1)', () => {
    const pool = Array.from({ length: 20 }, (_, i) => `c${i}`);
    const serie = avvia({
      mazzo: 'descrizioni-simboli',
      sezioni: ['s'],
      modo: 'flashcard',
      carte: pool,
      dimensione: 8,
      rng: makeRng(1),
    });
    expect(serie.carte).toHaveLength(8);
    expect(new Set(serie.carte).size).toBe(8);
    for (const id of serie.carte) {
      expect(pool).toContain(id);
    }
  });

  it("'tutte' mostra ogni carta della sezione esattamente una volta prima di qualunque ripasso", () => {
    const pool = Array.from({ length: 12 }, (_, i) => `c${i}`);
    const serie = avvia({
      mazzo: 'isom',
      sezioni: ['forme'],
      modo: 'flashcard',
      carte: pool,
      dimensione: 'tutte',
      rng: makeRng(2),
    });
    expect(serie.carte).toHaveLength(pool.length);
    expect(new Set(serie.carte)).toEqual(new Set(pool));
    expect(serie.coda).toEqual([]);
  });

  it('con lo stesso seme produce lo stesso ordine di mescolamento (run riproducibile)', () => {
    const pool = Array.from({ length: 15 }, (_, i) => `c${i}`);
    const a = avvia({ mazzo: 'm', sezioni: ['s'], modo: 'flashcard', carte: pool, dimensione: 'tutte', rng: makeRng(99) });
    const b = avvia({ mazzo: 'm', sezioni: ['s'], modo: 'flashcard', carte: pool, dimensione: 'tutte', rng: makeRng(99) });
    expect(a.carte).toEqual(b.carte);
  });

  it('tronca il timestamp di inizio al minuto', () => {
    const serie = avvia({
      mazzo: 'm',
      sezioni: ['s'],
      modo: 'flashcard',
      carte: ['a'],
      dimensione: 1,
      rng: makeRng(1),
      adesso: new Date('2026-09-05T10:42:37.123Z'),
    });
    expect(serie.iniziata).toBe('2026-09-05T10:42');
  });
});

describe('mescola', () => {
  it('non muta l’array ricevuto', () => {
    const originale = [1, 2, 3, 4, 5];
    const copia = [...originale];
    mescola(originale, makeRng(3));
    expect(originale).toEqual(copia);
  });
});

describe('ciclo flash card: valuta, prossima, completata (F-002 AC-3)', () => {
  it('una carta segnata "non lo sapevo" ricompare dopo l’ultima, una sola volta', () => {
    let serie = serieVuota({ carte: ['a', 'b', 'c'] });

    serie = valuta(serie, 'sapevo');
    serie = prossima(serie);
    serie = valuta(serie, 'non-sapevo');
    serie = prossima(serie);
    serie = valuta(serie, 'sapevo');
    serie = prossima(serie);

    expect(completata(serie)).toBe(false);
    expect(cartaAttuale(serie)).toBe('b');

    serie = valuta(serie, 'non-sapevo');
    expect(serie.coda).toEqual(['b']);
    serie = prossima(serie);

    expect(completata(serie)).toBe(true);
    expect(cartaAttuale(serie)).toBeUndefined();
  });

  it('completa un run senza errori dopo l’ultima carta', () => {
    let serie = serieVuota({ carte: ['a', 'b'] });
    serie = valuta(serie, 'sapevo');
    serie = prossima(serie);
    expect(completata(serie)).toBe(false);
    serie = valuta(serie, 'sapevo');
    serie = prossima(serie);
    expect(completata(serie)).toBe(true);
  });

  it('il contatore di risposte conta anche i ripassi', () => {
    let serie = serieVuota({ carte: ['a'] });
    serie = valuta(serie, 'non-sapevo');
    serie = prossima(serie);
    serie = valuta(serie, 'sapevo');
    serie = prossima(serie);
    expect(serie.risposte).toHaveLength(2);
    expect(completata(serie)).toBe(true);
  });
});

describe('quiz: gli errori non vengono ripassati (F-003)', () => {
  it('un esito "sbagliata" non finisce mai in coda', () => {
    let serie = serieVuota({ carte: ['a', 'b'], modo: 'quiz' });
    serie = valuta(serie, 'sbagliata', 'x');
    expect(serie.coda).toEqual([]);
    serie = prossima(serie);
    serie = valuta(serie, 'giusta', 'b');
    serie = prossima(serie);
    expect(serie.coda).toEqual([]);
    expect(completata(serie)).toBe(true);
  });
});

describe('risultato (F-002 AC-4, F-003 AC-5)', () => {
  it('conta solo la prima passata: giuste, sbagliate nell’ordine dell’errore', () => {
    let serie = serieVuota({ carte: ['a', 'b', 'c'] });
    serie = valuta(serie, 'non-sapevo'); // a: errore
    serie = prossima(serie);
    serie = valuta(serie, 'sapevo'); // b: giusta
    serie = prossima(serie);
    serie = valuta(serie, 'non-sapevo'); // c: errore
    serie = prossima(serie);
    // ripasso: a giusta stavolta, c di nuovo sbagliata — non deve alterare il conteggio
    serie = valuta(serie, 'sapevo');
    serie = prossima(serie);
    serie = valuta(serie, 'non-sapevo');
    serie = prossima(serie);

    expect(completata(serie)).toBe(true);
    const r = risultato(serie, new Date('2026-09-05T11:00:00Z'));
    expect(r).toMatchObject({
      v: 1,
      mazzo: 'descrizioni-simboli',
      viste: 3,
      giuste: 1,
      sbagliate: ['a', 'c'],
    });
    expect(r.data).toBe('2026-09-05T11:00');
    expect(r.ripasso).toBeUndefined();
  });

  it('un run di quiz completo scrive viste, giuste e sbagliate corretti', () => {
    let serie = serieVuota({ carte: ['a', 'b'], modo: 'quiz' });
    serie = valuta(serie, 'sbagliata', 'x');
    serie = prossima(serie);
    serie = valuta(serie, 'giusta', 'b');
    serie = prossima(serie);
    const r = risultato(serie, new Date('2026-09-05T12:00:00Z'));
    expect(r).toMatchObject({ viste: 2, giuste: 1, sbagliate: ['a'] });
  });

  it('marca il risultato come ripasso quando la serie lo è', () => {
    const serie = serieVuota({ carte: [], ripasso: true });
    const r = risultato(serie, new Date('2026-09-05T12:00:00Z'));
    expect(r.ripasso).toBe(true);
  });

  it('non marca il risultato come ripasso quando la serie non lo è', () => {
    const serie = serieVuota({ carte: [] });
    const r = risultato(serie, new Date('2026-09-05T12:00:00Z'));
    expect('ripasso' in r).toBe(false);
  });
});

describe('daRipasso (F-010 AC-2)', () => {
  it('costruisce una serie flash card dagli errori, nello stesso ordine, senza rimescolare', () => {
    const risultatoPrecedente: Risultato = {
      v: 1,
      mazzo: 'isom',
      sezioni: ['forme'],
      modo: 'quiz',
      data: '2026-09-05T10:00',
      viste: 5,
      giuste: 2,
      sbagliate: ['isom:3', 'isom:1', 'isom:9'],
    };
    const serie = daRipasso(risultatoPrecedente, new Date('2026-09-05T13:15:00Z'));
    expect(serie.modo).toBe('flashcard');
    expect(serie.carte).toEqual(['isom:3', 'isom:1', 'isom:9']);
    expect(serie.ripasso).toBe(true);
    expect(serie.mazzo).toBe('isom');
    expect(serie.sezioni).toEqual(['forme']);
    expect(serie.iniziata).toBe('2026-09-05T13:15');
    expect(serie.coda).toEqual([]);
    expect(serie.risposte).toEqual([]);
  });
});

describe('gira', () => {
  it('inverte lo stato fronte/retro senza toccare altro', () => {
    const serie = serieVuota();
    expect(serie.girata).toBe(false);
    const girata = gira(serie);
    expect(girata.girata).toBe(true);
    expect(girata.carte).toEqual(serie.carte);
    expect(gira(girata).girata).toBe(false);
  });

  it('prossima riporta sempre a fronte', () => {
    const serie = gira(serieVuota());
    const successiva = prossima(serie);
    expect(successiva.girata).toBe(false);
  });
});

describe('isoAlMinuto', () => {
  it('tronca al minuto, senza secondi', () => {
    expect(isoAlMinuto(new Date('2026-01-02T03:04:05.678Z'))).toBe('2026-01-02T03:04');
  });
});
