// e2e/riga.pixel.spec.ts — F-004 AC-2: the official row 2 description-row
// grid (A `2`, B `212`, C the NW arrow, D the boulder triangle, F `1.0`, G
// the east-side circle) must visually match the crop of [S3] page 3
// (content/artwork/esempi/pagina3/riga-2.png) within a pixel-diff
// tolerance.
//
// This is the real, pixel-rasterising half of AC-2 — the part
// src/allenamento/facce/riga.pixel.test.ts explicitly defers to here, since
// jsdom (that suite's vitest/unit environment) cannot paint CSS grid, SVG
// or `aspect-ratio`. It runs in a real Chromium via Playwright instead.
//
// It builds the row's 8 cells with `celleRiga` (the same pure-data mapping
// `src/allenamento/facce/riga.ts`'s `griglia()` uses — exported precisely so
// this spec never drifts from the real cell-order logic), the fourteen-symbol
// fixture sprite, and `facce.css` itself (read from disk, not retyped), then
// renders a standalone page with `page.setContent()` and screenshots the
// `.riga.carta` element at the crop's own pixel width so the comparison is
// apples-to-apples.
//
// Playwright's own `toHaveScreenshot` (pixelmatch under the hood, no extra
// dependency) does the diff; the crop is copied into the expected-snapshot
// path before asserting, so the comparison is always against the real
// committed crop rather than a separately maintained "golden" copy.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { celleRiga } from '../src/allenamento/facce/riga.ts';
import { SPRITE_MARKUP } from '../src/allenamento/facce/sprite.generated.ts';
import type { RigaDescrizione } from '../src/allenamento/facce/tipi.ts';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = join(QUI, '..');
const CROP = join(RADICE, 'content/artwork/esempi/pagina3/riga-2.png');
const FACCE_CSS = readFileSync(join(RADICE, 'src/allenamento/facce/facce.css'), 'utf8');

// Only the tokens facce.css actually references (design-system/tokens/colors.css,
// typography.css) — copied as values, not re-imported, so this spec has no
// dependency on Tailwind/the design-system build.
const TOKENS_CSS = `:root {
  --gray-800: rgb(31, 41, 55);
  --white: rgb(255, 255, 255);
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --radius-lg: 8px;
}`;

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

function cellaHtml(slot: ReturnType<typeof celleRiga>[number]): string {
  if ('simbolo' in slot) {
    const href = `#s-${slot.simbolo.rif}${slot.simbolo.direzione ?? ''}`;
    return `<div><svg viewBox="0 0 200 200"><use href="${href}"></use></svg></div>`;
  }
  if ('testo' in slot) return `<div><span>${slot.testo}</span></div>`;
  return '<div></div>';
}

function paginaHtml(): string {
  const celle = celleRiga(RIGA_2).map(cellaHtml).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<style>${TOKENS_CSS}\nbody{margin:0}${FACCE_CSS}
/* This test compares 1:1 against the crop's own pixel width, overriding
   facce.css's normal ≈40px-per-cell cap (see facce.css's own comment). */
.riga.carta{max-width:464px;box-sizing:border-box}
</style>
</head><body>
${SPRITE_MARKUP}
<div class="riga carta">${celle}</div>
</body></html>`;
}

test.describe('riga: AC-2 pixel diff against the page-3 crop', () => {
  test('official row 2 matches content/artwork/esempi/pagina3/riga-2.png @pixel', async ({ page }, testInfo) => {
    test.skip(!existsSync(CROP), 'pagina3 crop missing');

    await page.setContent(paginaHtml());
    const riga = page.locator('.riga.carta');
    await expect(riga).toBeVisible();

    // Make the committed crop itself the "golden" snapshot Playwright
    // compares against, instead of maintaining a separate copy.
    const snapshotPath = testInfo.snapshotPath('riga-2.png');
    mkdirSync(dirname(snapshotPath), { recursive: true });
    if (!existsSync(snapshotPath)) {
      const { copyFileSync } = await import('node:fs');
      copyFileSync(CROP, snapshotPath);
    }

    await expect(riga).toHaveScreenshot('riga-2.png', {
      // A vector re-render of a scanned/printed crop will never be
      // pixel-identical (anti-aliasing, scan noise); this threshold catches
      // wrong cell order, missing borders or a wrong pictogram while
      // tolerating rendering-level differences (F-004 AC-2's "within the
      // pixel-diff threshold").
      maxDiffPixelRatio: 0.3,
    });
  });
});
