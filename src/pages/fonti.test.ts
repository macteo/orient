// src/pages/fonti.test.ts — F-005 AC-1: every entry in the real licence
// register (`content/fonti.json`) renders as a Card, and adding a source to
// the register adds it to the page with no code change (tested with a
// seventh, fixture-only entry `renderFonti` has never seen). Also covers
// AC-2 (Purple Pen BSD text verbatim) and AC-4 (`mailto:` with subject
// "orient").

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderFonti, type Fonte, type Registro } from './fonti.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '../..');

const REGISTRO_REALE = JSON.parse(readFileSync(join(RADICE, 'content/fonti.json'), 'utf8')) as Registro;

const TESTO_BSD = readFileSync(join(RADICE, 'content/licenze/purple-pen-bsd.txt'), 'utf8');

const SETTIMA_FONTE: Fonte = {
  id: 'settima-fonte-di-prova',
  titolo: 'Settima fonte di prova',
  autori: 'Autore di prova',
  editore: 'Editore di prova',
  edizione: 'Edizione di prova',
  data: '2026',
  licenza: { nome: 'Licenza di prova mai vista prima', url: 'https://example.org/licenza-di-prova' },
  cosaUsiamo: 'un caso di prova per verificare che il render sia generico.',
  attribuzione: 'Attribuzione di prova.',
  url: 'https://example.org/fonte-di-prova',
};

function nuovoApp(): HTMLElement {
  return document.createElement('main');
}

describe('renderFonti (F-005, D-005)', () => {
  it('renders one card per source in the real register, in the register order', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    const carte = app.querySelectorAll('[data-fonte-id]');
    expect(carte).toHaveLength(REGISTRO_REALE.fonti.length);
    expect([...carte].map((carta) => (carta as HTMLElement).dataset.fonteId)).toEqual(
      REGISTRO_REALE.fonti.map((fonte) => fonte.id),
    );
  });

  it('renders every field of every real source: title, licence, authors, cosa usiamo, attribution', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    for (const fonte of REGISTRO_REALE.fonti) {
      const carta = app.querySelector(`[data-fonte-id="${fonte.id}"]`);
      expect(carta, `manca la carta per ${fonte.id}`).not.toBeNull();
      const testo = carta!.textContent ?? '';
      expect(testo).toContain(fonte.titolo);
      expect(testo).toContain(fonte.licenza.nome);
      expect(testo).toContain(fonte.autori);
      expect(testo).toContain(fonte.cosaUsiamo);
      expect(testo).toContain(fonte.attribuzione);
      if (fonte.editore) expect(testo).toContain(fonte.editore);
      if (fonte.edizione) expect(testo).toContain(fonte.edizione);
      if (fonte.data) expect(testo).toContain(fonte.data);
      if (fonte.licenza.url) {
        const link = carta!.querySelector(`a[href="${fonte.licenza.url}"]`);
        expect(link).not.toBeNull();
      }
      if (fonte.url) {
        const link = carta!.querySelector(`a[href="${fonte.url}"]`);
        expect(link).not.toBeNull();
      }
    }
  });

  it('adds a seventh card for a fixture entry the register never had, with no code change', () => {
    const registroEsteso: Registro = { ...REGISTRO_REALE, fonti: [...REGISTRO_REALE.fonti, SETTIMA_FONTE] };
    const app = nuovoApp();
    renderFonti(app, registroEsteso, 'Fonti e licenze');

    const carte = app.querySelectorAll('[data-fonte-id]');
    expect(carte).toHaveLength(REGISTRO_REALE.fonti.length + 1);
    const settima = app.querySelector('[data-fonte-id="settima-fonte-di-prova"]');
    expect(settima).not.toBeNull();
    expect(settima!.textContent).toContain(SETTIMA_FONTE.titolo);
    expect(settima!.textContent).toContain(SETTIMA_FONTE.licenza.nome);
  });

  it('reproduces the Purple Pen BSD licence text verbatim', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    const blocco = app.querySelector('pre');
    expect(blocco).not.toBeNull();
    expect(blocco!.textContent).toBe(TESTO_BSD);
  });

  it('builds the mailto: link to the register contact with subject "orient"', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    const link = app.querySelector('a[href^="mailto:"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe(`mailto:${REGISTRO_REALE.contatto}?subject=orient`);
    expect(link!.textContent).toBe('Scrivi a chi cura il sito');
  });

  it('renders the back link to the home ("← Mazzi" → ../) and the page title as the only h1', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    const indietro = app.querySelector('a[href="../"]');
    expect(indietro?.textContent).toBe('← Mazzi');

    const titoli = app.querySelectorAll('h1');
    expect(titoli).toHaveLength(1);
    expect(titoli[0]?.textContent).toBe('Fonti e licenze');
  });

  it('gives the licence Badge a colour by licence family, gray for an unrecognised one', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    const bsd = app.querySelector<HTMLElement>('[data-fonte-id="s4-purple-pen"] span');
    expect(bsd?.style.background).toBe('var(--green-100)');
    const isom = app.querySelector<HTMLElement>('[data-fonte-id="s1-isom"] span');
    expect(isom?.style.background).toBe('var(--blue-100)');
    const iof = app.querySelector<HTMLElement>('[data-fonte-id="s3-descrizioni"] span');
    expect(iof?.style.background).toBe('var(--gray-100)');

    const registroEsteso: Registro = { ...REGISTRO_REALE, fonti: [SETTIMA_FONTE] };
    const app2 = nuovoApp();
    renderFonti(app2, registroEsteso, 'Fonti e licenze');
    const sconosciuta = app2.querySelector<HTMLElement>('[data-fonte-id="settima-fonte-di-prova"] span');
    expect(sconosciuta?.style.background).toBe('var(--gray-100)');
  });

  it('does not use any literal hex colour or a non-token font-family', () => {
    const app = nuovoApp();
    renderFonti(app, REGISTRO_REALE, 'Fonti e licenze');

    expect(app.outerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    const pre = app.querySelector('pre')!;
    expect(pre.style.fontFamily).toBe('var(--font-mono)');
  });
});
