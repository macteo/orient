// src/allenamento/facce/riga.pixel.test.ts — F-004 AC-2: the official row 2
// grid (A `2`, B `212`, C the NW arrow, D the boulder triangle, F `1.0`, G
// the east-side circle) must match the crop of [S3] page 3
// (content/artwork/esempi/pagina3/riga-2.png) within a pixel-diff
// tolerance.
//
// A real pixel comparison needs an actual browser rasterising CSS grid,
// `aspect-ratio` and inline SVG — jsdom (this suite's environment) does not
// lay out or paint, so it cannot produce pixels to diff. That comparison
// lives in `e2e/riga.pixel.spec.ts` instead (Playwright, real Chromium),
// which is the "Playwright spec under e2e/ ... instead" the task spec
// allows. This file does the two things a unit test *can* check: that the
// reference crop exists (skip with a printed reason otherwise, as required)
// and that our grid's structure/geometry — cell order, aspect ratio, border
// — matches what the crop shows, i.e. everything about AC-2 that does not
// require rasterising pixels.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { griglia } from './riga.ts';
import type { RigaDescrizione } from './tipi.ts';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..', '..', '..');
const CROP = join(RADICE, 'content/artwork/esempi/pagina3/riga-2.png');

const RIGA_2: RigaDescrizione = {
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
};

/** Reads a PNG's `IHDR` width/height without a PNG-decoding dependency. */
function dimensioniPng(path: string): { larghezza: number; altezza: number } {
  const buf = readFileSync(path);
  return { larghezza: buf.readUInt32BE(16), altezza: buf.readUInt32BE(20) };
}

describe('riga: AC-2, la griglia della riga 2 corrisponde alla pagina 3', () => {
  if (!existsSync(CROP)) {
    it.skip('confronto pixel contro il crop di pagina 3', () => {});
    console.log('- skipped: pagina3 crop missing');
  } else {
    console.log(
      '- skipped: pixel-level comparison needs a real browser to rasterise CSS/SVG; ' +
        'jsdom cannot paint. See e2e/riga.pixel.spec.ts for the Playwright image diff ' +
        `against ${CROP}.`,
    );
    it.skip('confronto pixel contro il crop di pagina 3 (vedi e2e/riga.pixel.spec.ts)', () => {});

    it('il crop esiste ed è largo/alto quanto atteso (8 colonne, ~7.5:1)', () => {
      const { larghezza, altezza } = dimensioniPng(CROP);
      expect(larghezza).toBeGreaterThan(0);
      expect(altezza).toBeGreaterThan(0);
      // The printed row is 8 cells wide (A narrower) and 1 tall: a wide,
      // short strip, not a square or a tall strip.
      expect(larghezza / altezza).toBeGreaterThan(5);
    });

    it('la griglia ha lo stesso ordine di colonne e lo stesso schema A più stretta', () => {
      const div = griglia(RIGA_2, 'carta');
      expect(div.style.gridTemplateColumns).toBe('');
      // grid-template-columns lives in facce.css (`.riga`), not inline —
      // assert the class that carries it and the 8-cell / A-narrower shape
      // the printed crop shows.
      expect(div.className).toBe('riga carta');
      expect(div.children).toHaveLength(8);
      const css = readFileSync(join(QUI, 'facce.css'), 'utf8');
      expect(css).toMatch(/\.riga\s*\{[^}]*grid-template-columns:\s*0\.8fr repeat\(7,\s*1fr\)/);
      expect(css).toMatch(/\.riga\s*>\s*div\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/);
    });
  }
});
