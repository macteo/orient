import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Risultato, Serie } from '../mazzi/tipi.ts';
import {
  aggiungiRisultato,
  cancellaTutto,
  disponibile,
  leggiRisultati,
  leggiSerie,
  pulisciSerie,
  scriviSerie,
  ultimoRisultato,
} from './storage.ts';

function serieDiProva(overrides: Partial<Serie> = {}): Serie {
  return {
    v: 1,
    mazzo: 'isom',
    sezioni: ['forme'],
    modo: 'flashcard',
    carte: ['i1', 'i2'],
    i: 0,
    risposte: [],
    coda: [],
    iniziata: '2026-09-05T10:00',
    girata: false,
    ...overrides,
  };
}

function risultatoDiProva(overrides: Partial<Risultato> = {}): Risultato {
  return {
    v: 1,
    mazzo: 'isom',
    sezioni: ['forme'],
    modo: 'flashcard',
    data: '2026-09-05T10:05',
    viste: 2,
    giuste: 2,
    sbagliate: [],
    ...overrides,
  };
}

// In questo ambiente Node/Vitest, `window.localStorage` non arriva
// dall'implementazione di jsdom: Vitest non inoltra `localStorage` fra le
// proprietà proxate dal suo ambiente jsdom, quindi l'accesso ricade sul
// getter sperimentale nativo di Node (`--localstorage-file`), che senza
// quel flag resta inutilizzabile. `storage.ts` continua a chiamare la vera
// `window.localStorage` come farebbe in un browser: qui sostituiamo solo
// l'oggetto dietro quella proprietà con un equivalente in memoria, così i
// test esercitano `storage.ts` in isolamento da questo limite dell'ambiente
// di test, non del codice sotto test.
function nuovoStorageFinto(): Storage {
  const dati = new Map<string, string>();
  const finto: Storage = {
    getItem: (chiave: string) => (dati.has(chiave) ? (dati.get(chiave) as string) : null),
    setItem: (chiave: string, valore: string) => {
      dati.set(chiave, String(valore));
    },
    removeItem: (chiave: string) => {
      dati.delete(chiave);
    },
    clear: () => {
      dati.clear();
    },
    key: (indice: number) => Array.from(dati.keys())[indice] ?? null,
    get length() {
      return dati.size;
    },
  };
  return finto;
}

let storageDiProva: Storage;

beforeEach(() => {
  storageDiProva = nuovoStorageFinto();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => storageDiProva,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('serie: leggi / scrivi / pulisci', () => {
  it('legge undefined quando non c’è nessuna serie', () => {
    expect(leggiSerie()).toBeUndefined();
  });

  it('scrive e rilegge la stessa serie', () => {
    const serie = serieDiProva();
    scriviSerie(serie);
    expect(leggiSerie()).toEqual(serie);
  });

  it('pulisciSerie rimuove la chiave', () => {
    scriviSerie(serieDiProva());
    pulisciSerie();
    expect(leggiSerie()).toBeUndefined();
  });

  it('scarta un JSON non parsabile, trattandolo come assente (F-010 AC-6)', () => {
    window.localStorage.setItem('orient.serie.v1', '{ non è json');
    expect(leggiSerie()).toBeUndefined();
  });

  it('scarta un valore con "v" sbagliata, trattandolo come assente (F-010 AC-6)', () => {
    window.localStorage.setItem('orient.serie.v1', JSON.stringify({ v: 2, mazzo: 'isom' }));
    expect(leggiSerie()).toBeUndefined();
  });
});

describe('risultati: leggi / aggiungi / ultimo / cancella', () => {
  it('legge un array vuoto quando non c’è nessun risultato', () => {
    expect(leggiRisultati()).toEqual([]);
  });

  it('aggiunge e rilegge un risultato', () => {
    const r = risultatoDiProva();
    aggiungiRisultato(r);
    expect(leggiRisultati()).toEqual([r]);
    expect(ultimoRisultato('isom')).toEqual(r);
  });

  it('ultimoRisultato ignora gli altri mazzi e prende il più recente del mazzo richiesto', () => {
    aggiungiRisultato(risultatoDiProva({ mazzo: 'isom', data: '2026-09-05T10:00' }));
    aggiungiRisultato(risultatoDiProva({ mazzo: 'esempi', data: '2026-09-05T10:01' }));
    aggiungiRisultato(risultatoDiProva({ mazzo: 'isom', data: '2026-09-05T10:02' }));
    expect(ultimoRisultato('isom')?.data).toBe('2026-09-05T10:02');
    expect(ultimoRisultato('esempi')?.data).toBe('2026-09-05T10:01');
    expect(ultimoRisultato('descrizioni-simboli')).toBeUndefined();
  });

  it('il 51esimo risultato di un mazzo scarta il più vecchio di quel mazzo (F-010 AC-4)', () => {
    for (let i = 0; i < 50; i += 1) {
      aggiungiRisultato(risultatoDiProva({ mazzo: 'isom', data: `2026-09-05T10:${String(i).padStart(2, '0')}` }));
    }
    let risultati = leggiRisultati();
    expect(risultati).toHaveLength(50);
    expect(risultati[0].data).toBe('2026-09-05T10:00');

    aggiungiRisultato(risultatoDiProva({ mazzo: 'isom', data: '2026-09-05T11:00' }));
    risultati = leggiRisultati();
    expect(risultati).toHaveLength(50);
    expect(risultati.some((r) => r.data === '2026-09-05T10:00')).toBe(false);
    expect(risultati.at(-1)?.data).toBe('2026-09-05T11:00');
  });

  it('il limite di 50 è per mazzo: un altro mazzo non viene toccato', () => {
    for (let i = 0; i < 50; i += 1) {
      aggiungiRisultato(risultatoDiProva({ mazzo: 'isom', data: `d${i}` }));
    }
    aggiungiRisultato(risultatoDiProva({ mazzo: 'esempi', data: 'unico' }));
    aggiungiRisultato(risultatoDiProva({ mazzo: 'isom', data: 'd50' }));
    const risultati = leggiRisultati();
    expect(risultati.filter((r) => r.mazzo === 'esempi')).toHaveLength(1);
    expect(risultati.filter((r) => r.mazzo === 'isom')).toHaveLength(50);
  });

  it('scarta un contenitore con "v" sbagliata o senza array, trattandolo come assente (F-010 AC-6)', () => {
    window.localStorage.setItem('orient.risultati.v1', JSON.stringify({ v: 1, risultati: 'non-un-array' }));
    expect(leggiRisultati()).toEqual([]);
    window.localStorage.setItem('orient.risultati.v1', JSON.stringify({ v: 0, risultati: [risultatoDiProva()] }));
    expect(leggiRisultati()).toEqual([]);
  });

  it('cancellaTutto rimuove entrambe le chiavi', () => {
    scriviSerie(serieDiProva());
    aggiungiRisultato(risultatoDiProva());
    cancellaTutto();
    expect(leggiSerie()).toBeUndefined();
    expect(leggiRisultati()).toEqual([]);
  });
});

describe('disponibile', () => {
  it('è vero quando lo storage funziona', () => {
    expect(disponibile()).toBe(true);
  });

  it('è falso quando l’accessor lancia', () => {
    const spia = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage bloccato');
    });
    expect(disponibile()).toBe(false);
    spia.mockRestore();
  });
});

describe('storage con accessor che lancia — nessuna eccezione propaga (criterio di done #3)', () => {
  it('ogni funzione ritorna il valore vuoto e non lancia', () => {
    const spia = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage bloccato');
    });
    expect(() => leggiSerie()).not.toThrow();
    expect(leggiSerie()).toBeUndefined();
    expect(() => scriviSerie(serieDiProva())).not.toThrow();
    expect(() => pulisciSerie()).not.toThrow();
    expect(() => leggiRisultati()).not.toThrow();
    expect(leggiRisultati()).toEqual([]);
    expect(() => aggiungiRisultato(risultatoDiProva())).not.toThrow();
    expect(() => ultimoRisultato('isom')).not.toThrow();
    expect(ultimoRisultato('isom')).toBeUndefined();
    expect(() => cancellaTutto()).not.toThrow();
    expect(disponibile()).toBe(false);
    spia.mockRestore();
  });

  it('anche se solo getItem lancia, le funzioni di lettura non propagano', () => {
    const spia = vi.spyOn(storageDiProva, 'getItem').mockImplementation(() => {
      throw new Error('getItem bloccato');
    });
    expect(() => leggiSerie()).not.toThrow();
    expect(leggiSerie()).toBeUndefined();
    expect(leggiRisultati()).toEqual([]);
    spia.mockRestore();
  });
});
