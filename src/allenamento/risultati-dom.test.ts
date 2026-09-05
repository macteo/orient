// src/allenamento/risultati-dom.test.ts — F-010 / D-004: la costruzione
// della vista (formattazione data, titoli, storico) e il disegno delle sei
// schermate (default, nessun-errore, ripasso, conferma-cancellazione, empty,
// error) su un contenitore jsdom, azioni finte alla mano.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Carta, MazzoBuild, Risultato, Sezione } from '../mazzi/tipi.ts';
import {
  costruisciVista,
  descriviRun,
  elencoSezioni,
  formattaQuando,
  renderizzaRisultati,
  titoloSerie,
  type AzioniRisultati,
  type VistaCompleta,
} from './risultati-dom.ts';

// ------------------------------------------------------------------ fixture

const ARTWORK = { formato: 'svg' as const, origine: 'S4' as const, sha256: '' };

function cartaSimbolo(id: string, rif: string, nome: string, descrizione: string, sezione: string): Carta {
  return {
    id,
    mazzo: 'descrizioni-simboli',
    tipo: 'simbolo',
    sezione,
    simbolo: { rif, nome, descrizione, artwork: { path: `content/artwork/descrizioni-punti/${rif}.svg`, ...ARTWORK } },
  };
}

const CARTA_NASO = cartaSimbolo('ds:1.2', '1.2', 'Naso', 'Piccola sporgenza del terreno su un pendio.', 'Oggetti morfologici');
const CARTA_RIENTRANZA = cartaSimbolo('ds:1.3', '1.3', 'Rientranza', 'Insenatura del terreno su un pendio.', 'Oggetti morfologici');
const CARTA_SASSO = cartaSimbolo('ds:2.4', '2.4', 'Sasso', 'Frammento roccioso isolato.', 'Rocce e sassi');

const MAZZO: MazzoBuild = {
  id: 'descrizioni-simboli',
  nome: 'Descrizioni dei punti',
  tipo: 'simbolo',
  sezioni: [
    { id: 'd-morfologici', etichetta: 'Oggetti morfologici', carte: ['ds:1.2', 'ds:1.3'] },
    { id: 'd-rocce', etichetta: 'Rocce e sassi', carte: ['ds:2.4'] },
  ],
  carte: { 'ds:1.2': CARTA_NASO, 'ds:1.3': CARTA_RIENTRANZA, 'ds:2.4': CARTA_SASSO },
  distrattori: { perSezione: {} },
};

function risultato(overrides: Partial<Risultato> = {}): Risultato {
  return {
    v: 1,
    mazzo: 'descrizioni-simboli',
    sezioni: [],
    modo: 'flashcard',
    data: '2026-09-05T10:00',
    viste: 8,
    giuste: 6,
    sbagliate: [],
    ...overrides,
  };
}

function azioniFinte(): AzioniRisultati {
  return {
    ripassaConLeCarte: vi.fn(),
    ripeti: vi.fn(),
    tornaAiMazzi: vi.fn(),
    apriRipasso: vi.fn(),
    chiudiRipasso: vi.fn(),
    richiediCancellazione: vi.fn(),
    annullaCancellazione: vi.fn(),
    confermaCancellazione: vi.fn(),
  };
}

function vistaBase(overrides: Partial<VistaCompleta> = {}): VistaCompleta {
  return {
    tipo: 'completo',
    titolo: 'Serie completata',
    sottotitolo: 'Descrizioni dei punti · Oggetti morfologici',
    punteggio: '6 / 8',
    percentuale: 75,
    didascalia: 'carte che sapevi',
    errori: [CARTA_NASO, CARTA_RIENTRANZA],
    titoloErrori: '2 simboli da ripassare',
    storico: [{ quando: 'Oggi, 18:00', cosa: 'flash card · Oggetti morfologici · 8 carte', punteggio: '6 / 8' }],
    confermaCancellazione: false,
    ripasso: null,
    ...overrides,
  };
}

function bottoni(radice: HTMLElement): HTMLButtonElement[] {
  return Array.from(radice.querySelectorAll('button'));
}

function clicca(el: Element | null | undefined): void {
  el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

let radice: HTMLDivElement;

beforeEach(() => {
  radice = document.createElement('div');
});

// -------------------------------------------------------- formattazione

describe('formattaQuando', () => {
  const adesso = new Date('2026-09-05T15:00:00Z');

  it('oggi', () => {
    expect(formattaQuando('2026-09-05T08:30', adesso)).toBe('Oggi, 08:30');
  });

  it('ieri', () => {
    expect(formattaQuando('2026-09-04T21:05', adesso)).toBe('Ieri, 21:05');
  });

  it('più vecchio: giorno e mese abbreviato in italiano', () => {
    expect(formattaQuando('2026-09-02T19:30', adesso)).toBe('2 set, 19:30');
  });

  it('confronta i giorni in UTC, non nel fuso locale del test runner', () => {
    // Un istante a cavallo di mezzanotte UTC non deve "slittare" di giorno.
    expect(formattaQuando('2026-09-05T00:05', new Date('2026-09-05T00:10:00Z'))).toBe('Oggi, 00:05');
  });
});

describe('elencoSezioni / titoloSerie', () => {
  const sezioni: Sezione[] = [
    { id: 'a', etichetta: 'Alfa', carte: [] },
    { id: 'b', etichetta: 'Beta', carte: [] },
    { id: 'c', etichetta: 'Gamma', carte: [] },
    { id: 'd', etichetta: 'Delta', carte: [] },
  ];

  it('array vuoto: "tutte le sezioni" (nessun filtro)', () => {
    expect(elencoSezioni([], sezioni)).toBe('tutte le sezioni');
    expect(titoloSerie('Mazzo', [], sezioni)).toBe('Mazzo · tutte le sezioni');
  });

  it('tutte le sezioni del mazzo salvate per esteso: ancora "tutte le sezioni"', () => {
    expect(elencoSezioni(['a', 'b', 'c', 'd'], sezioni)).toBe('tutte le sezioni');
    expect(titoloSerie('Mazzo', ['d', 'c', 'b', 'a'], sezioni)).toBe('Mazzo · tutte le sezioni');
  });

  it('una o due sezioni: elencate per etichetta', () => {
    expect(titoloSerie('Mazzo', ['a'], sezioni)).toBe('Mazzo · Alfa');
    expect(titoloSerie('Mazzo', ['a', 'b'], sezioni)).toBe('Mazzo · Alfa, Beta');
  });

  it('più di due sezioni: solo il conteggio (content rule)', () => {
    expect(titoloSerie('Mazzo', ['a', 'b', 'c'], sezioni)).toBe('3 sezioni');
  });

  it('un id sconosciuto ricade sull’id stesso', () => {
    expect(elencoSezioni(['zzz'], sezioni)).toBe('zzz');
  });
});

describe('descriviRun', () => {
  const sezioni: Sezione[] = [
    { id: 'colonna-g', etichetta: 'Colonna G', carte: [] },
    { id: 'colonna-h', etichetta: 'Colonna H', carte: [] },
  ];

  it('flash card su tutte le sezioni', () => {
    expect(descriviRun(risultato({ modo: 'flashcard', sezioni: [], viste: 12 }), sezioni)).toBe('flash card · tutte le sezioni · 12 carte');
  });

  it('quiz in direzione inversa con una sezione', () => {
    expect(descriviRun(risultato({ modo: 'quiz', direzione: 'inversa', sezioni: ['colonna-g'], viste: 8 }), sezioni)).toBe(
      'quiz · nome → simbolo · Colonna G · 8 carte',
    );
  });

  it('un ripasso ignora modo, sezioni e direzione', () => {
    expect(descriviRun(risultato({ modo: 'flashcard', ripasso: true, sezioni: ['colonna-g'], viste: 3 }), sezioni)).toBe('ripasso · 3 carte');
  });

  it('singolare per una sola carta', () => {
    expect(descriviRun(risultato({ modo: 'quiz', sezioni: [], viste: 1 }), sezioni)).toBe('quiz · tutte le sezioni · 1 carta');
  });
});

// -------------------------------------------------------- costruisciVista

describe('costruisciVista', () => {
  it('nessun run: vuoto', () => {
    expect(costruisciVista(MAZZO, [], { confermaCancellazione: false, ripassoId: null })).toEqual({ tipo: 'vuoto' });
  });

  it('usa l’ultimo run (F-010 AC-1): punteggio, misses nell’ordine di sbagliate, titolo/didascalia per modo', () => {
    const r1 = risultato({ data: '2026-09-04T10:00', modo: 'flashcard', viste: 8, giuste: 6, sbagliate: ['ds:1.3', 'ds:1.2'] });
    const r2 = risultato({ data: '2026-09-05T10:00', modo: 'quiz', viste: 3, giuste: 2, sbagliate: ['ds:2.4'] });
    const vista = costruisciVista(MAZZO, [r1, r2], {
      confermaCancellazione: false,
      ripassoId: null,
      adesso: new Date('2026-09-05T12:00:00Z'),
    });
    if (vista.tipo !== 'completo') throw new Error('atteso completo');
    expect(vista.titolo).toBe('Quiz completato');
    expect(vista.didascalia).toBe('risposte corrette');
    expect(vista.punteggio).toBe('2 / 3');
    expect(vista.percentuale).toBe(67);
    expect(vista.errori.map((c) => c.id)).toEqual(['ds:2.4']);
    expect(vista.titoloErrori).toBe('1 simbolo da ripassare');
    // Storico: tutti i run, dal più recente (F-010 AC-4).
    expect(vista.storico.map((s) => s.punteggio)).toEqual(['2 / 3', '6 / 8']);
  });

  it('più di un errore usa il plurale', () => {
    const vista = costruisciVista(MAZZO, [risultato({ sbagliate: ['ds:1.2', 'ds:1.3'] })], {
      confermaCancellazione: false,
      ripassoId: null,
    });
    if (vista.tipo !== 'completo') throw new Error('atteso completo');
    expect(vista.titoloErrori).toBe('2 simboli da ripassare');
  });

  it('scarta gli id di carte che non esistono più nel mazzo, senza eccezioni', () => {
    const vista = costruisciVista(MAZZO, [risultato({ sbagliate: ['ds:1.2', 'sconosciuta'] })], {
      confermaCancellazione: false,
      ripassoId: null,
    });
    if (vista.tipo !== 'completo') throw new Error('atteso completo');
    expect(vista.errori.map((c) => c.id)).toEqual(['ds:1.2']);
  });

  it('ripasso: null di default, la carta quando ripassoId combacia con una carta del mazzo', () => {
    const risultati = [risultato({ sbagliate: ['ds:1.2'] })];
    const senza = costruisciVista(MAZZO, risultati, { confermaCancellazione: false, ripassoId: null });
    if (senza.tipo !== 'completo') throw new Error('atteso completo');
    expect(senza.ripasso).toBeNull();
    const con = costruisciVista(MAZZO, risultati, { confermaCancellazione: false, ripassoId: 'ds:1.2' });
    if (con.tipo !== 'completo') throw new Error('atteso completo');
    expect(con.ripasso?.id).toBe('ds:1.2');
  });
});

// -------------------------------------------------------- renderizzaRisultati

describe('renderizzaRisultati — empty', () => {
  it('messaggio fisso, nessuna nota, bottone verso la scelta del mazzo', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, { tipo: 'vuoto' }, azioni);
    expect(radice.textContent).toContain('Nessuna serie completata per questo mazzo');
    const scegli = bottoni(radice).find((b) => b.textContent === 'Scegli un mazzo');
    expect(scegli).toBeTruthy();
    clicca(scegli);
    expect(azioni.tornaAiMazzi).toHaveBeenCalledOnce();
  });
});

describe('renderizzaRisultati — error', () => {
  it('stesso layout dell’empty più la nota (screen spec: "empty layout with the one-line note")', () => {
    const azioni = azioniFinte();
    const nota = 'Non riesco a leggere i risultati salvati su questo telefono. Le serie funzionano lo stesso.';
    renderizzaRisultati(radice, { tipo: 'vuoto', nota }, azioni);
    expect(radice.textContent).toContain('Nessuna serie completata per questo mazzo');
    expect(radice.textContent).toContain(nota);
    expect(bottoni(radice).find((b) => b.textContent === 'Scegli un mazzo')).toBeTruthy();
  });
});

describe('renderizzaRisultati — default (con errori)', () => {
  it('punteggio, righe di errore cliccabili con l’id giusto, azioni cablate', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, vistaBase(), azioni);

    expect(radice.textContent).toContain('Serie completata');
    expect(radice.textContent).toContain('6 / 8');
    expect(radice.textContent).toContain('2 simboli da ripassare');

    const rigaNaso = bottoni(radice).find((b) => b.textContent?.includes('Naso'));
    expect(rigaNaso).toBeTruthy();
    clicca(rigaNaso);
    expect(azioni.apriRipasso).toHaveBeenCalledWith('ds:1.2');

    const testi = bottoni(radice).map((b) => b.textContent);
    expect(testi).toContain('Ripassa con le carte');
    expect(testi).toContain('Ripeti');
    expect(testi).toContain('Torna ai mazzi');
    expect(testi).toContain('Cancella i risultati');

    clicca(bottoni(radice).find((b) => b.textContent === 'Ripassa con le carte'));
    expect(azioni.ripassaConLeCarte).toHaveBeenCalledOnce();
    clicca(bottoni(radice).find((b) => b.textContent === 'Ripeti'));
    expect(azioni.ripeti).toHaveBeenCalledOnce();
    clicca(bottoni(radice).find((b) => b.textContent === 'Torna ai mazzi'));
    expect(azioni.tornaAiMazzi).toHaveBeenCalledOnce();
  });

  it('mostra lo storico, dal più recente', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(
      radice,
      vistaBase({
        storico: [
          { quando: 'Oggi, 18:40', cosa: 'quiz · Colonna G · 12 carte', punteggio: '9 / 12' },
          { quando: 'Ieri, 21:05', cosa: 'flash card · Oggetti morfologici · 8 carte', punteggio: '6 / 8' },
        ],
      }),
      azioni,
    );
    expect(radice.textContent).toContain('Storico');
    expect(radice.textContent).toContain('Oggi, 18:40');
    expect(radice.textContent).toContain('Ieri, 21:05');
  });
});

describe('renderizzaRisultati — nessun-errore', () => {
  it('Alert al posto della lista; niente "Ripassa con le carte"', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, vistaBase({ errori: [], titoloErrori: '0 simboli da ripassare' }), azioni);
    expect(radice.textContent).toContain('Nessun errore in questa serie');
    expect(bottoni(radice).map((b) => b.textContent)).not.toContain('Ripassa con le carte');
  });
});

describe('renderizzaRisultati — conferma-cancellazione', () => {
  it('pannello inline con Annulla e Cancella tutto cablati; il link di cancellazione sparisce', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, vistaBase({ confermaCancellazione: true }), azioni);

    expect(bottoni(radice).map((b) => b.textContent)).not.toContain('Cancella i risultati');
    const annulla = bottoni(radice).find((b) => b.textContent === 'Annulla');
    const cancellaTutto = bottoni(radice).find((b) => b.textContent === 'Cancella tutto');
    expect(annulla).toBeTruthy();
    expect(cancellaTutto).toBeTruthy();

    clicca(annulla);
    expect(azioni.annullaCancellazione).toHaveBeenCalledOnce();
    clicca(cancellaTutto);
    expect(azioni.confermaCancellazione).toHaveBeenCalledOnce();
  });

  it('tap su "Cancella i risultati" chiede la conferma (cablaggio del link)', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, vistaBase({ confermaCancellazione: false }), azioni);
    clicca(bottoni(radice).find((b) => b.textContent === 'Cancella i risultati'));
    expect(azioni.richiediCancellazione).toHaveBeenCalledOnce();
  });
});

describe('renderizzaRisultati — ripasso', () => {
  it('foglio con il retro della carta (definizione verbatim) e "Chiudi" cablato', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, vistaBase({ ripasso: CARTA_NASO }), azioni);

    expect(radice.textContent).toContain('Da ripassare');
    expect(radice.textContent).toContain('Piccola sporgenza del terreno su un pendio.');

    const chiudi = bottoni(radice).find((b) => b.textContent === 'Chiudi');
    expect(chiudi).toBeTruthy();
    clicca(chiudi);
    expect(azioni.chiudiRipasso).toHaveBeenCalledOnce();
  });

  it('assente quando nessuna carta è in ripasso', () => {
    const azioni = azioniFinte();
    renderizzaRisultati(radice, vistaBase({ ripasso: null }), azioni);
    expect(radice.textContent).not.toContain('Da ripassare');
  });
});
