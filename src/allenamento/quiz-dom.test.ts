// src/allenamento/quiz-dom.test.ts — F-003 AC-3: scegliere un'opzione blocca
// le altre, marca la giusta e la sbagliata, mostra il pannello del verdetto
// e il bottone "Avanti"; un secondo tocco su un'opzione non fa nulla. Test
// jsdom puro sul DOM prodotto da `renderizza`, senza `src/pages/quiz.ts`.

import { describe, expect, it, vi } from 'vitest';
import type { Carta, MazzoBuild } from '../mazzi/tipi.ts';
import type { Domanda } from './quiz.ts';
import { renderizza, type GestoriQuiz, type VistaQuiz } from './quiz-dom.ts';

function simbolo(id: string, nome: string, descrizione: string): Carta {
  return {
    id,
    mazzo: 'descrizioni-simboli',
    tipo: 'simbolo',
    sezione: 'rocce',
    simbolo: { rif: id, nome, descrizione, artwork: { path: `x/${id}.svg`, formato: 'svg' } },
  };
}

function riga(id: string, testo: string): Carta {
  return {
    id,
    mazzo: 'descrizioni-complete',
    tipo: 'riga',
    sezione: 'ufficiali',
    riga: { id, codice: '212', numero: '2', celle: {}, testo, origine: 'ufficiale' },
  };
}

const MAZZO: MazzoBuild = {
  id: 'descrizioni-simboli',
  nome: 'Descrizioni dei punti',
  tipo: 'simbolo',
  sezioni: [{ id: 'rocce', etichetta: 'Rocce e sassi', carte: ['c1', 'c2', 'c3', 'c4'] }],
  carte: {
    c1: simbolo('c1', 'Sasso', 'Frammento roccioso isolato.'),
    c2: simbolo('c2', 'Sassaia', 'Area ricoperta da svariati sassi.'),
    c3: simbolo('c3', 'Naso', 'Piccola sporgenza del terreno su un pendio.'),
    c4: simbolo('c4', 'Collina', 'Rilievo del terreno.'),
  },
  distrattori: { perSezione: { rocce: ['c1', 'c2', 'c3', 'c4'] } },
};

const MAZZO_RIGHE: MazzoBuild = {
  id: 'descrizioni-complete',
  nome: 'Descrizioni complete',
  tipo: 'riga',
  sezioni: [{ id: 'ufficiali', etichetta: 'Ufficiali', carte: ['r1', 'r2', 'r3', 'r4'] }],
  carte: {
    r1: riga('r1', 'Sasso nord ovest, 1 m d’altezza, lato est'),
    r2: riga('r2', 'Rientranza, angolo nord-est'),
    r3: riga('r3', 'Sassaia centrale'),
    r4: riga('r4', 'Collina, rocciosa, tra'),
  },
  distrattori: { perSezione: { ufficiali: ['r1', 'r2', 'r3', 'r4'] } },
};

// c1 (Sasso) è la carta giusta, in posizione 2.
const DOMANDA_DIRETTA: Domanda = { carta: 'c1', direzione: 'diretta', opzioni: ['c2', 'c3', 'c1', 'c4'], giusta: 2 };
const DOMANDA_INVERSA: Domanda = { ...DOMANDA_DIRETTA, direzione: 'inversa' };
const DOMANDA_RIGHE: Domanda = { carta: 'r1', direzione: 'inversa', opzioni: ['r2', 'r3', 'r1', 'r4'], giusta: 2 };

function vistaBase(
  overrides: Partial<Extract<VistaQuiz, { stato: 'domanda' }>> = {},
): Extract<VistaQuiz, { stato: 'domanda' }> {
  return {
    stato: 'domanda',
    mazzo: MAZZO,
    domanda: DOMANDA_DIRETTA,
    contatore: '1 / 4',
    progresso: 0,
    titoloSerie: 'Descrizioni dei punti · Rocce e sassi',
    ultima: false,
    ...overrides,
  };
}

function gestoriSpia(): GestoriQuiz & { onScegli: ReturnType<typeof vi.fn>; onAvanti: ReturnType<typeof vi.fn>; onTornaAiMazzi: ReturnType<typeof vi.fn> } {
  return { onScegli: vi.fn(), onAvanti: vi.fn(), onTornaAiMazzi: vi.fn() };
}

describe('renderizza — stato default (nessuna scelta)', () => {
  it('mostra il prompt, quattro opzioni abilitate e il suggerimento, senza pannello né Avanti', () => {
    const radice = document.createElement('div');
    const gestori = gestoriSpia();
    renderizza(radice, vistaBase(), gestori);

    expect(radice.textContent).toContain('Quale oggetto?');
    const bottoni = Array.from(radice.querySelectorAll('button')).filter((b) => !b.disabled);
    // 4 opzioni, tutte abilitate (nessun bottone "Avanti" ancora).
    expect(bottoni).toHaveLength(4);
    for (const b of bottoni) expect(b.disabled).toBe(false);
    expect(radice.textContent).toContain('Scegli una risposta');
    expect(radice.textContent).not.toContain('Avanti');
    expect(radice.querySelector('[role="status"]')).toBeNull();
  });

  it('un tap su un’opzione chiama onScegli con l’id di quella carta', () => {
    const radice = document.createElement('div');
    const gestori = gestoriSpia();
    renderizza(radice, vistaBase(), gestori);

    const bottoni = radice.querySelectorAll('button');
    // La prima opzione della domanda è 'c2' (Sassaia).
    expect(bottoni[0].textContent).toContain('Sassaia');
    bottoni[0].click();
    expect(gestori.onScegli).toHaveBeenCalledTimes(1);
    expect(gestori.onScegli).toHaveBeenCalledWith('c2');
  });
});

describe('renderizza — stato verdetto (scelta sbagliata)', () => {
  const radice = document.createElement('div');
  const gestori = gestoriSpia();
  renderizza(radice, vistaBase({ scelta: 'c2' }), gestori);

  it('blocca tutte le opzioni (F-003 AC-3)', () => {
    const bottoniOpzione = Array.from(radice.querySelectorAll('button')).filter((b) => !b.textContent?.includes('Avanti'));
    for (const b of bottoniOpzione) expect(b.disabled).toBe(true);
  });

  it('un secondo tap su un’opzione già bloccata non richiama onScegli', () => {
    const bottoni = radice.querySelectorAll('button');
    bottoni[0].click();
    bottoni[1].click();
    expect(gestori.onScegli).not.toHaveBeenCalled();
  });

  it('marca ✓ la giusta e ✕ la scelta, e mostra il pannello "Sbagliato — <nome>" con la definizione', () => {
    expect(radice.textContent).toContain('✓');
    expect(radice.textContent).toContain('✕');
    expect(radice.textContent).toContain('Sbagliato — Sasso');
    expect(radice.textContent).toContain('Frammento roccioso isolato.');
  });

  it('mostra "Avanti" (non ultima carta)', () => {
    const avanti = Array.from(radice.querySelectorAll('button')).find((b) => b.textContent === 'Avanti');
    expect(avanti).toBeDefined();
    avanti?.click();
    expect(gestori.onAvanti).toHaveBeenCalledTimes(1);
  });
});

describe('renderizza — stato verdetto (scelta giusta, ultima carta)', () => {
  it('titolo "Giusto" e bottone "Vedi il risultato"', () => {
    const radice = document.createElement('div');
    const gestori = gestoriSpia();
    renderizza(radice, vistaBase({ scelta: 'c1', ultima: true }), gestori);

    expect(radice.textContent).toContain('Giusto');
    expect(radice.textContent).not.toContain('Sbagliato');
    const bottone = Array.from(radice.querySelectorAll('button')).find((b) => b.textContent === 'Vedi il risultato');
    expect(bottone).toBeDefined();
  });
});

describe('renderizza — direzione inversa', () => {
  it('mostra il nome come domanda e quattro tessere (2×2) con le facce delle carte', () => {
    const radice = document.createElement('div');
    const gestori = gestoriSpia();
    renderizza(radice, vistaBase({ domanda: DOMANDA_INVERSA }), gestori);

    expect(radice.textContent).toContain('Quale simbolo?');
    expect(radice.textContent).toContain('Sasso'); // il nome della carta interrogata, come domanda
    const griglia = radice.querySelector('div[style*="grid"]');
    expect(griglia).not.toBeNull();
    expect(griglia?.getAttribute('style')).toContain('1fr 1fr');
    expect(radice.querySelectorAll('svg use').length).toBeGreaterThanOrEqual(4);
  });

  it('per il mazzo a righe usa una sola colonna a piena larghezza', () => {
    const radice = document.createElement('div');
    const gestori = gestoriSpia();
    renderizza(
      radice,
      { ...vistaBase({ domanda: DOMANDA_RIGHE }), mazzo: MAZZO_RIGHE, titoloSerie: 'Descrizioni complete · Ufficiali' },
      gestori,
    );
    // In inversa il prompt resta "Quale simbolo?" per ogni mazzo (D-003);
    // "Cosa dice questa riga?" è solo il prompt in avanti per il mazzo a righe.
    expect(radice.textContent).toContain('Quale simbolo?');
    const griglia = radice.querySelector('div[style*="grid-template-columns"]');
    expect(griglia?.getAttribute('style')).toContain('grid-template-columns: 1fr;');
  });
});

describe('renderizza — notifiche', () => {
  it('mostra "Serie ripresa" quando notifica è ripresa', () => {
    const radice = document.createElement('div');
    renderizza(radice, vistaBase({ notifica: 'ripresa' }), gestoriSpia());
    expect(radice.textContent).toContain('Serie ripresa');
    expect(radice.querySelector('[role="status"]')).not.toBeNull();
  });

  it('mostra la notifica di input non valido', () => {
    const radice = document.createElement('div');
    renderizza(radice, vistaBase({ notifica: 'invalid-input' }), gestoriSpia());
    expect(radice.textContent).toContain('Sezione non trovata');
    expect(radice.textContent).toContain('Serie avviata su tutte le sezioni, 8 carte.');
  });
});

describe('renderizza — stato vuoto', () => {
  it('mostra il messaggio e un link "Torna ai mazzi" che pulisce lo storage', () => {
    const radice = document.createElement('div');
    const gestori = gestoriSpia();
    renderizza(radice, { stato: 'vuoto' }, gestori);

    expect(radice.textContent).toContain('Nessuna carta per le sezioni scelte');
    const link = radice.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('../../');
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(gestori.onTornaAiMazzi).toHaveBeenCalledTimes(1);
  });
});
