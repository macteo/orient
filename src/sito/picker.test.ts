// src/sito/picker.test.ts — F-001 AC-2, AC-3, AC-4: la costruzione dell'URL
// di "Inizia" e l'etichetta/stato del bottone, dai soli helper puri di
// picker.ts. L'ultimo test monta davvero la home (renderHome, home.ts) in
// jsdom e verifica che togliere la spunta a una sezione cambi l'etichetta,
// esercitando il collegamento fra la UI e questi helper.

import { describe, expect, it } from 'vitest';
import type { RiepilogoMazzo } from '../mazzi/assembla.ts';
import { renderHome } from '../pages/home.ts';
import { etichettaInizia, urlSerie, type StatoPicker } from './picker.ts';

function statoDiProva(overrides: Partial<StatoPicker> = {}): StatoPicker {
  return {
    mazzo: 'descrizioni-simboli',
    sezioniTotali: ['colonna-c', 'd-morfologici', 'd-rocce'],
    sezioniScelte: ['colonna-c', 'd-morfologici', 'd-rocce'],
    modo: 'flashcard',
    carte: '8',
    ...overrides,
  };
}

const MAZZI: RiepilogoMazzo[] = [
  {
    id: 'descrizioni-simboli',
    nome: 'Descrizioni dei punti',
    tipo: 'simbolo',
    carte: 40,
    sezioni: [
      { id: 'colonna-c', etichetta: 'Colonna C', carte: 5 },
      { id: 'd-morfologici', etichetta: 'Oggetti morfologici', carte: 15 },
      { id: 'd-rocce', etichetta: 'Rocce e sassi', carte: 20 },
    ],
  },
  {
    id: 'isom',
    nome: 'ISOM 2017-2',
    tipo: 'simbolo-isom',
    carte: 10,
    sezioni: [{ id: 'rocce', etichetta: 'Rocce e sassi', carte: 10 }],
  },
];

describe('urlSerie', () => {
  it('omette "sezioni" quando tutte le sezioni del mazzo sono scelte', () => {
    expect(urlSerie(statoDiProva())).toBe('descrizioni-simboli/flashcard/?carte=8');
  });

  it('include "sezioni" (uniti da virgola) quando è scelto un sottoinsieme', () => {
    const url = urlSerie(statoDiProva({ sezioniScelte: ['colonna-c', 'd-rocce'] }));
    expect(url).toBe('descrizioni-simboli/flashcard/?sezioni=colonna-c%2Cd-rocce&carte=8');
  });

  it('usa la cartella "quiz" e include "direzione=inversa" in modalità quiz invertita', () => {
    const url = urlSerie(statoDiProva({ modo: 'quiz', direzione: 'inversa', carte: 'tutte' }));
    expect(url).toBe('descrizioni-simboli/quiz/?carte=tutte&direzione=inversa');
  });

  it('non include "direzione" in quiz quando la direzione è quella diretta (assente)', () => {
    const url = urlSerie(statoDiProva({ modo: 'quiz' }));
    expect(url).not.toContain('direzione');
  });

  it('ignora una "direzione" impostata quando la modalità non è quiz', () => {
    // Precondizione difensiva: home.ts non passa mai `direzione` fuori dal
    // quiz, ma la funzione resta corretta anche se qualcuno lo facesse.
    const url = urlSerie(statoDiProva({ modo: 'flashcard', direzione: 'inversa' }));
    expect(url).not.toContain('direzione');
  });
});

describe('etichettaInizia', () => {
  it('è disabilitato con "Scegli almeno una sezione" quando nessuna sezione è scelta', () => {
    const { etichetta, disabilitato } = etichettaInizia(statoDiProva({ sezioniScelte: [] }), MAZZI);
    expect(disabilitato).toBe(true);
    expect(etichetta).toBe('Scegli almeno una sezione');
  });

  it('N = min(carte scelte, carte disponibili nelle sezioni scelte)', () => {
    // colonna-c (5) + d-morfologici (15) + d-rocce (20) = 40 disponibili, chip 8.
    const { etichetta, disabilitato } = etichettaInizia(statoDiProva(), MAZZI);
    expect(disabilitato).toBe(false);
    expect(etichetta).toBe('Inizia · 8 carte');
  });

  it('N è il totale esatto quando la sola sezione scelta ha meno carte del chip', () => {
    const stato = statoDiProva({ sezioniScelte: ['colonna-c'], carte: '12' });
    expect(etichettaInizia(stato, MAZZI).etichetta).toBe('Inizia · 5 carte');
  });

  it('il chip "tutte" mostra il totale esatto delle sezioni scelte', () => {
    const stato = statoDiProva({ sezioniScelte: ['colonna-c', 'd-rocce'], carte: 'tutte' });
    expect(etichettaInizia(stato, MAZZI).etichetta).toBe('Inizia · 25 carte');
  });
});

describe('renderHome (jsdom)', () => {
  function monta(): HTMLElement {
    const app = document.createElement('main');
    document.body.append(app);
    renderHome(app, MAZZI);
    return app;
  }

  function bottoneInizia(app: HTMLElement): HTMLButtonElement | HTMLAnchorElement {
    const bottone = app.querySelector<HTMLButtonElement | HTMLAnchorElement>('.orient-inizia');
    if (!bottone) throw new Error('bottone "Inizia" non trovato');
    return bottone;
  }

  it('mostra di default il primo mazzo aperto, tutte le sezioni scelte, taglia 8', () => {
    const app = monta();
    const caselle = app.querySelectorAll<HTMLInputElement>('.orient-checkbox input');
    expect(caselle).toHaveLength(3);
    expect([...caselle].every((c) => c.checked)).toBe(true);
    expect(bottoneInizia(app).textContent).toBe('Inizia · 8 carte');
  });

  it('togliere la spunta a tutte le sezioni disabilita il bottone e ne cambia l’etichetta', () => {
    const app = monta();
    // Ogni click ridisegna l'intero albero (nuovi nodi): si riquery a ogni
    // giro invece di riusare un NodeList statico, che rimarrebbe legato ai
    // nodi scollegati dell'albero precedente.
    for (let i = 0; i < 3; i += 1) {
      app.querySelector<HTMLInputElement>('.orient-checkbox input:checked')?.click();
    }

    const bottone = bottoneInizia(app);
    expect(bottone.tagName).toBe('BUTTON');
    expect((bottone as HTMLButtonElement).disabled).toBe(true);
    expect(bottone.textContent).toBe('Scegli almeno una sezione');
  });

  it('rispuntare una sola sezione ripristina il bottone con il conteggio giusto', () => {
    const app = monta();
    for (let i = 0; i < 3; i += 1) {
      app.querySelector<HTMLInputElement>('.orient-checkbox input:checked')?.click();
    }
    // Solo "Colonna C" (5 carte, la prima riga) riaccesa.
    app.querySelectorAll<HTMLInputElement>('.orient-checkbox input')[0].click();

    const bottone = bottoneInizia(app);
    expect(bottone.tagName).toBe('A');
    expect(bottone.textContent).toBe('Inizia · 5 carte');
  });
});
