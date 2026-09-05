// src/allenamento/facce/facce.test.ts — snapshot tests for every card type
// at every size (F-004 AC-1, AC-3, AC-5). Fixture text is copied verbatim
// from `content/simboli/descrizioni-punti.json` (rif 1.2, 204 in
// `content/simboli/isom.json`) and `content/esempi/esempi.json` (codice
// 66), so the "text is rendered verbatim" assertions below are checked
// against real content, not invented strings. The `riga` fixture (row 2)
// mirrors the approved artboards' own mock data
// (akaaso/06-design/_artboards/[mazzo].flashcard.dc.html's `RIGHE[0]`),
// built from the real symbols it names (0.2NW, 2.4, 11.1E).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fronte, retro } from './index.ts';
import type { Carta, Size, TipoCarta } from './tipi.ts';

const QUI = dirname(fileURLToPath(import.meta.url));

const ARTWORK = { formato: 'svg' as const, origine: 'S4' as const, sha256: '' };

const CARTA_SIMBOLO: Carta = {
  id: 'ds:1.2',
  mazzo: 'descrizioni-simboli',
  tipo: 'simbolo',
  sezione: 'Oggetti morfologici',
  simbolo: {
    rif: '1.2',
    nome: 'Naso',
    descrizione: 'Piccola sporgenza del terreno su un pendio.',
    artwork: { path: 'content/artwork/descrizioni-punti/1.2.svg', ...ARTWORK },
  },
};

const CARTA_RIGA_UFFICIALE: Carta = {
  id: 'dc:ufficiale:2',
  mazzo: 'descrizioni-complete',
  tipo: 'riga',
  sezione: 'Ufficiali',
  riga: {
    id: 'dc:ufficiale:2',
    codice: '212',
    numero: '2',
    celle: {
      C: { rif: '0.2', direzione: 'NW' },
      D: { rif: '2.4' },
      F: '1.0',
      G: { rif: '11.1', direzione: 'E' },
    },
    testo: 'Sasso nord ovest, 1 m d’altezza, lato est',
    origine: 'ufficiale',
  },
};

const CARTA_RIGA_GENERATA: Carta = {
  id: 'dc:gen:0137',
  mazzo: 'descrizioni-complete',
  tipo: 'riga',
  sezione: 'Generate',
  riga: {
    id: 'dc:gen:0137',
    codice: 'gen-0137',
    celle: {
      D: { rif: '1.3' },
      G: { rif: '11.4', direzione: 'NE' },
    },
    testo: 'Rientranza, angolo nord-est',
    origine: 'generata',
  },
};

const CARTA_ESEMPIO: Carta = {
  id: 'es:066',
  mazzo: 'esempi',
  tipo: 'esempio',
  sezione: 'd-vegetazione',
  esempio: {
    codice: '66',
    pagina: 24,
    famiglia: 'd-vegetazione',
    testo: 'Cisterna d’acqua, pozzo, parte est',
    carta: 'content/artwork/esempi/66-carta.png',
    terreno: 'content/artwork/esempi/66-terreno.png',
    riga: 'content/artwork/esempi/66-riga.png',
  },
};

const CARTA_ISOM: Carta = {
  id: 'isom:204',
  mazzo: 'isom',
  tipo: 'simbolo-isom',
  sezione: 'rocce',
  isom: {
    rif: '204',
    nome: 'Masso',
    geometria: 'P',
    sezione: 'rocce',
    descrizione:
      'Un masso distinto (dovrebbe essere più alto di 1 m), che sia immediatamente riconoscibile sul terreno. Gruppi di massi sono rappresentati con il simbolo gruppo di massi (207) o con un simbolo per massi sparsi (208, 209). Per permettere la distinzione tra massi vicini (distanti meno di 30 m) palesemente diversi per dimensione, è consentito ingrandire di 0,5 mm il simbolo di alcuni di essi. Sul terreno: 6 m di diametro (7,5 m di diametro). Colore: nero.',
    artwork: { path: 'content/artwork/isom/204.png', formato: 'png', origine: 'S5', sha256: '' },
  },
};

const SIZES: Size[] = ['carta', 'tile', 'lista'];
const TIPI: { tipo: TipoCarta; carta: Carta }[] = [
  { tipo: 'simbolo', carta: CARTA_SIMBOLO },
  { tipo: 'riga', carta: CARTA_RIGA_UFFICIALE },
  { tipo: 'esempio', carta: CARTA_ESEMPIO },
  { tipo: 'simbolo-isom', carta: CARTA_ISOM },
];

describe('facce: fronte/retro per tipo × size', () => {
  for (const { tipo, carta } of TIPI) {
    for (const size of SIZES) {
      it(`${tipo} @ ${size} — fronte e retro senza eccezioni, snapshot stabile`, () => {
        const f = fronte(carta, size);
        const r = retro(carta, size);
        expect(f).toBeInstanceOf(HTMLElement);
        expect(r).toBeInstanceOf(HTMLElement);
        expect(f.outerHTML).toMatchSnapshot('fronte');
        expect(r.outerHTML).toMatchSnapshot('retro');
      });
    }
  }
});

describe('facce: AC-1 nessun overflow strutturale a 360px', () => {
  // jsdom does not lay out or paint, so a real overflow measurement is not
  // possible here; this checks the structural guard every face relies on
  // instead — a bounded width (100%/max-width) and, for every <img>, both
  // width and height attributes set (so nothing shifts while it loads).
  for (const { tipo, carta } of TIPI) {
    for (const size of SIZES) {
      it(`${tipo} @ ${size} — larghezza vincolata, immagini con width/height`, () => {
        for (const el of [fronte(carta, size), retro(carta, size)]) {
          expect(el.style.width === '100%' || el.style.maxWidth !== '').toBe(true);
          for (const img of Array.from(el.querySelectorAll('img'))) {
            expect(img.getAttribute('width')).toBeTruthy();
            expect(img.getAttribute('height')).toBeTruthy();
            expect(img.getAttribute('alt')).toBeTruthy();
            expect(img.getAttribute('loading')).toBe('lazy');
          }
        }
      });
    }
  }
});

describe('facce: AC-5 testo verbatim (byte per byte contro content/)', () => {
  it('simbolo: nome e descrizione sono esattamente quelli di content/simboli/descrizioni-punti.json (1.2)', () => {
    const back = retro(CARTA_SIMBOLO, 'carta');
    expect(back.textContent).toContain('Naso');
    expect(back.textContent).toContain('Piccola sporgenza del terreno su un pendio.');
  });

  it('riga: la frase è esattamente quella della carta (row 2)', () => {
    const back = retro(CARTA_RIGA_UFFICIALE, 'carta');
    expect(back.textContent).toContain('Sasso nord ovest, 1 m d’altezza, lato est');
  });

  it('esempio: la frase è esattamente quella di content/esempi/esempi.json (66)', () => {
    const back = retro(CARTA_ESEMPIO, 'carta');
    expect(back.textContent).toContain('Cisterna d’acqua, pozzo, parte est');
  });

  it('isom: nome e descrizione sono esattamente quelli di content/simboli/isom.json (204)', () => {
    const back = retro(CARTA_ISOM, 'carta');
    expect(back.textContent).toContain('Masso');
    expect(back.textContent).toContain('Un masso distinto (dovrebbe essere più alto di 1 m)');
    expect(back.textContent).toContain('rocce');
  });
});

describe('facce: AC-3 badge "generata"', () => {
  it('una riga generata mostra il badge "generata" sul retro', () => {
    const back = retro(CARTA_RIGA_GENERATA, 'carta');
    const badgeGenerata = Array.from(back.querySelectorAll('.hs-badge')).find((b) => b.textContent === 'generata');
    expect(badgeGenerata).toBeTruthy();
  });

  it('una riga ufficiale non mostra il badge "generata" sul retro', () => {
    const back = retro(CARTA_RIGA_UFFICIALE, 'carta');
    const badgeGenerata = Array.from(back.querySelectorAll('.hs-badge')).find((b) => b.textContent === 'generata');
    expect(badgeGenerata).toBeUndefined();
  });

  it('il fronte di una riga non mostra mai il badge "generata"', () => {
    const front = fronte(CARTA_RIGA_GENERATA, 'carta');
    expect(front.querySelector('.hs-badge')).toBeNull();
  });
});

describe('facce: la griglia ufficiale della riga 2 corrisponde alla pagina 3', () => {
  it('otto celle, A–H nell’ordine stampato: 2, 212, NW, sasso, vuota, 1.0, est, vuota', () => {
    const front = fronte(CARTA_RIGA_UFFICIALE, 'carta');
    const griglia = front.querySelector('.riga');
    expect(griglia).toBeTruthy();
    const celle = Array.from(griglia!.children);
    expect(celle).toHaveLength(8);
    expect(celle[0].textContent).toBe('2'); // A: numero
    expect(celle[1].textContent).toBe('212'); // B: codice
    expect(celle[2].querySelector('use')?.getAttribute('href')).toBe('#s-0.2NW'); // C
    expect(celle[3].querySelector('use')?.getAttribute('href')).toBe('#s-2.4'); // D
    expect(celle[4].textContent).toBe(''); // E: vuota
    expect(celle[5].textContent).toBe('1.0'); // F: dimensione testuale
    expect(celle[6].querySelector('use')?.getAttribute('href')).toBe('#s-11.1E'); // G
    expect(celle[7].textContent).toBe(''); // H: vuota
  });

  it('una riga generata senza numero mostra "—" in A', () => {
    const front = fronte(CARTA_RIGA_GENERATA, 'carta');
    const griglia = front.querySelector('.riga');
    expect(griglia!.children[0].textContent).toBe('—');
  });
});

describe('facce.css: nessun colore esadecimale, nessun font-family fuori dai token', () => {
  it('grep-equivalente su facce.css', () => {
    const css = readFileSync(join(QUI, 'facce.css'), 'utf8');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    // font-family is allowed only via the var(--font-...) tokens.
    const dichiarazioni = css.match(/font-family:[^;]+;/g) ?? [];
    for (const dichiarazione of dichiarazioni) {
      expect(dichiarazione).toMatch(/var\(--font-/);
    }
  });
});
