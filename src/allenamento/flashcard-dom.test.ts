// src/allenamento/flashcard-dom.test.ts — test jsdom per la mappatura stato →
// DOM di R-002 (F-002/D-002): il fronte mostra il suggerimento di flip e
// nessun bottone di voto; il retro mostra i due bottoni di voto esatti e
// nessun suggerimento di flip; le notice `ripresa`/`invalid-input` compaiono
// solo quando richieste; lo stato `vuota` mostra il messaggio e il link di
// ritorno. Il test pixel del fronte/retro delle facce è già coperto da
// `facce/facce.test.ts` e `e2e/riga.pixel.spec.ts`: qui si verifica solo che
// `flashcard-dom.ts` li componga nello stato giusto e cabli le callback.

import { describe, expect, it, vi } from 'vitest';
import { disegna } from './flashcard-dom.ts';
import type { CallbackFlashcard, VistaFlashcard } from './flashcard-dom.ts';
import type { Carta } from '../mazzi/tipi.ts';

const CARTA_SIMBOLO: Carta = {
  id: 'ds:1.2',
  mazzo: 'descrizioni-simboli',
  tipo: 'simbolo',
  sezione: 'Oggetti morfologici',
  simbolo: {
    rif: '1.2',
    nome: 'Naso',
    descrizione: 'Piccola sporgenza del terreno su un pendio.',
    artwork: { path: 'content/artwork/descrizioni-punti/1.2.svg', formato: 'svg', origine: 'S4', sha256: '' },
  },
};

function callbackFinta(): CallbackFlashcard & { onIndietro: ReturnType<typeof vi.fn>; onGira: ReturnType<typeof vi.fn>; onValuta: ReturnType<typeof vi.fn> } {
  return { onIndietro: vi.fn(), onGira: vi.fn(), onValuta: vi.fn() };
}

const VISTA_FRONTE: VistaFlashcard = {
  stato: 'run',
  carta: CARTA_SIMBOLO,
  girata: false,
  contatore: '1 / 8',
  progresso: 13,
  titoloSerie: 'Descrizioni dei punti · tutte le sezioni',
};

const VISTA_RETRO: VistaFlashcard = { ...VISTA_FRONTE, girata: true };

describe('flashcard-dom: stato default (fronte)', () => {
  it('mostra il suggerimento di flip e nessun bottone di voto', () => {
    const radice = document.createElement('div');
    disegna(radice, VISTA_FRONTE, callbackFinta());

    expect(radice.textContent).toContain('Tocca per girare la carta');
    expect(radice.textContent).toContain('Gira la carta per autovalutarti');
    expect(radice.textContent).not.toContain('Non lo sapevo');
    expect(radice.textContent).not.toContain('Lo sapevo');
  });

  it('mostra il contatore e il titolo di corsa nell\'intestazione', () => {
    const radice = document.createElement('div');
    disegna(radice, VISTA_FRONTE, callbackFinta());

    expect(radice.textContent).toContain('1 / 8');
    expect(radice.textContent).toContain('Descrizioni dei punti · tutte le sezioni');
  });

  it('la Progress porta value/aria coerenti con la vista', () => {
    const radice = document.createElement('div');
    disegna(radice, VISTA_FRONTE, callbackFinta());

    const barra = radice.querySelector('[role="progressbar"]');
    expect(barra).not.toBeNull();
    expect(barra?.getAttribute('aria-valuenow')).toBe('13');
  });

  it('il link "← Mazzi" punta alla home e richiama onIndietro al click', () => {
    const radice = document.createElement('div');
    const callback = callbackFinta();
    disegna(radice, VISTA_FRONTE, callback);

    const link = radice.querySelector('a') as HTMLAnchorElement;
    expect(link.textContent).toBe('← Mazzi');
    expect(link.getAttribute('href')).toBe('../../');
    link.click();
    expect(callback.onIndietro).toHaveBeenCalledOnce();
  });

  it('il tocco sulla carta richiama onGira (click e tastiera)', () => {
    const radice = document.createElement('div');
    const callback = callbackFinta();
    disegna(radice, VISTA_FRONTE, callback);

    const carta = radice.querySelector('[role="button"]') as HTMLElement;
    expect(carta).not.toBeNull();
    carta.click();
    expect(callback.onGira).toHaveBeenCalledOnce();

    carta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(callback.onGira).toHaveBeenCalledTimes(2);
  });
});

describe('flashcard-dom: stato retro', () => {
  it('mostra esattamente i due bottoni di voto e nessun suggerimento di flip', () => {
    const radice = document.createElement('div');
    disegna(radice, VISTA_RETRO, callbackFinta());

    const bottoni = Array.from(radice.querySelectorAll('button')).map((b) => b.textContent);
    expect(bottoni).toContain('Non lo sapevo');
    expect(bottoni).toContain('Lo sapevo');
    expect(radice.textContent).not.toContain('Tocca per girare la carta');
    expect(radice.textContent).not.toContain('Gira la carta per autovalutarti');
  });

  it('"Non lo sapevo" e "Lo sapevo" richiamano onValuta con l\'esito giusto', () => {
    const radice = document.createElement('div');
    const callback = callbackFinta();
    disegna(radice, VISTA_RETRO, callback);

    const bottoni = Array.from(radice.querySelectorAll('button'));
    const nonSapevo = bottoni.find((b) => b.textContent === 'Non lo sapevo')!;
    const sapevo = bottoni.find((b) => b.textContent === 'Lo sapevo')!;

    nonSapevo.click();
    expect(callback.onValuta).toHaveBeenCalledWith('non-sapevo');
    sapevo.click();
    expect(callback.onValuta).toHaveBeenCalledWith('sapevo');
  });
});

describe('flashcard-dom: notice ripresa/invalid-input', () => {
  it('mostra "Serie ripresa" solo quando notice è ripresa', () => {
    const radice = document.createElement('div');
    disegna(radice, { ...VISTA_FRONTE, notice: 'ripresa' }, callbackFinta());
    expect(radice.textContent).toContain('Serie ripresa');
    expect(radice.textContent).toContain('Riprendi da dove eri rimasto.');
    expect(radice.textContent).not.toContain('Sezione non trovata');
  });

  it('mostra "Sezione non trovata" solo quando notice è invalid-input', () => {
    const radice = document.createElement('div');
    disegna(radice, { ...VISTA_FRONTE, notice: 'invalid-input' }, callbackFinta());
    expect(radice.textContent).toContain('Sezione non trovata');
    expect(radice.textContent).toContain('Serie avviata su tutte le sezioni, 8 carte.');
    expect(radice.textContent).not.toContain('Serie ripresa');
  });

  it('nessuna notice senza `notice` impostata', () => {
    const radice = document.createElement('div');
    disegna(radice, VISTA_FRONTE, callbackFinta());
    expect(radice.textContent).not.toContain('Serie ripresa');
    expect(radice.textContent).not.toContain('Sezione non trovata');
  });
});

describe('flashcard-dom: stato vuota', () => {
  it('mostra il messaggio e "Torna ai mazzi", che richiama onIndietro', () => {
    const radice = document.createElement('div');
    const callback = callbackFinta();
    disegna(radice, { stato: 'vuota' }, callback);

    expect(radice.textContent).toContain('Nessuna carta per le sezioni scelte');
    const bottone = Array.from(radice.querySelectorAll('button')).find((b) => b.textContent === 'Torna ai mazzi');
    expect(bottone).toBeDefined();
    bottone?.click();
    expect(callback.onIndietro).toHaveBeenCalledOnce();

    // Anche "← Mazzi" nell'intestazione minima richiama onIndietro.
    const link = radice.querySelector('a') as HTMLAnchorElement;
    link.click();
    expect(callback.onIndietro).toHaveBeenCalledTimes(2);
  });

  it('non mostra contatore, progresso né bottoni di voto', () => {
    const radice = document.createElement('div');
    disegna(radice, { stato: 'vuota' }, callbackFinta());
    expect(radice.querySelector('[role="progressbar"]')).toBeNull();
    expect(radice.textContent).not.toContain('Non lo sapevo');
  });
});

describe('flashcard-dom: ridisegno', () => {
  it('un secondo `disegna()` sostituisce il contenuto, non lo accumula', () => {
    const radice = document.createElement('div');
    disegna(radice, VISTA_FRONTE, callbackFinta());
    const primaConteggio = radice.querySelectorAll('*').length;
    disegna(radice, VISTA_RETRO, callbackFinta());
    disegna(radice, VISTA_FRONTE, callbackFinta());
    const dopoConteggio = radice.querySelectorAll('*').length;
    expect(dopoConteggio).toBe(primaConteggio);
  });
});
