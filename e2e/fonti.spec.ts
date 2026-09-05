// e2e/fonti.spec.ts — F-005 AC-1…AC-4 against the real built page (R-005,
// D-005): six sources rendered from `content/fonti.json`, the Purple Pen BSD
// licence text reproduced verbatim, every external reference on the page
// being an inert anchor (no off-origin request the page itself makes), and
// the `mailto:` contact link carrying the subject "orient".
//
// The register is read from disk (the same file `scripts/build-mazzi.ts`
// inlines into `#fonti`) rather than hand-copied, so a future edit to
// `content/fonti.json` can't silently drift from what this spec checks.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');

type Fonte = { id: string; licenza: { nome: string; url?: string }; url?: string };
type Registro = { v: number; contatto: string; fonti: Fonte[] };

const REGISTRO = JSON.parse(readFileSync(join(RADICE, 'content/fonti.json'), 'utf8')) as Registro;
const TESTO_BSD = readFileSync(join(RADICE, 'content/licenze/purple-pen-bsd.txt'), 'utf8');

test.describe('fonti/ (R-005, F-005)', () => {
  test('renders exactly six sections, one per source of the register, in order @critical', async ({ page }) => {
    await page.goto('fonti/');

    const carte = page.locator('[data-fonte-id]');
    await expect(carte).toHaveCount(6);
    await expect(carte).toHaveCount(REGISTRO.fonti.length);

    const id = await carte.evaluateAll((nodi) => nodi.map((nodo) => (nodo as HTMLElement).dataset.fonteId));
    expect(id).toEqual(REGISTRO.fonti.map((fonte) => fonte.id));
  });

  test('reproduces the Purple Pen BSD licence text verbatim @critical', async ({ page }) => {
    await page.goto('fonti/');

    const blocco = page.locator('pre');
    await expect(blocco).toHaveText(TESTO_BSD);
  });

  test('the CC BY-ND licence link resolves to the real licence page @critical', async ({ page }) => {
    await page.goto('fonti/');

    const isom = REGISTRO.fonti.find((fonte) => fonte.id === 's1-isom');
    expect(isom?.licenza.url).toBeTruthy();
    const link = page.locator(`[data-fonte-id="s1-isom"] a[href="${isom!.licenza.url}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('every external reference on the page is an anchor with visible text, nothing else @critical', async ({
    page,
  }) => {
    await page.goto('fonti/');

    // Ogni fonte con un url (licenza o pagina) diventa un link visibile.
    const href = REGISTRO.fonti.flatMap((fonte) => [fonte.licenza.url, fonte.url]).filter((v): v is string => !!v);
    expect(href.length).toBeGreaterThan(0);
    for (const url of new Set(href)) {
      const link = page.locator(`a[href="${url}"]`).first();
      await expect(link).toBeVisible();
      await expect(link).not.toHaveText('');
    }

    // Nessun altro elemento della pagina referenzia un URL esterno: solo gli
    // `<a>` — niente `<img>`, `<link>`, `<script>` o `<iframe>` fuori dal
    // proprio origin (i soli asset esterni ammessi sarebbero questi tag, e
    // non ce ne devono essere).
    const esterni = await page.evaluate(() => {
      const origine = window.location.origin;
      const fuoriOrigine = (valore: string | null): boolean => {
        if (!valore) return false;
        try {
          return new URL(valore, document.baseURI).origin !== origine;
        } catch {
          return false;
        }
      };
      const elementi = [
        ...document.querySelectorAll('img[src], link[href], script[src], iframe[src]'),
      ] as (HTMLImageElement | HTMLLinkElement | HTMLScriptElement | HTMLIFrameElement)[];
      return elementi
        .map((el) => el.getAttribute('src') ?? el.getAttribute('href'))
        .filter(fuoriOrigine);
    });
    expect(esterni).toEqual([]);
  });

  test('the page makes no off-origin request, even with every external anchor present @critical', async ({
    page,
    baseURL,
  }) => {
    const origine = new URL(baseURL ?? 'http://127.0.0.1:4173/').origin;
    const richiesteFuoriOrigine: string[] = [];
    page.on('request', (richiesta) => {
      const url = new URL(richiesta.url());
      if (url.origin !== origine && url.protocol !== 'data:') {
        richiesteFuoriOrigine.push(richiesta.url());
      }
    });

    const risposta = await page.goto('fonti/');
    expect(risposta?.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');

    // Il listener è stato registrato prima della navigazione: qualunque
    // richiesta fuori origine (favicon di terzi, webfont da CDN, richieste
    // agli URL delle licenze) sarebbe stata catturata qui.
    expect(richiesteFuoriOrigine).toEqual([]);
  });

  test('the mailto: link addresses the register contact with subject "orient" @critical', async ({ page }) => {
    await page.goto('fonti/');

    const link = page.locator('a[href^="mailto:"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', `mailto:${REGISTRO.contatto}?subject=orient`);
    await expect(link).toHaveText('Scrivi a chi cura il sito');
  });

  test('the mail button is the last focusable element on the page @critical', async ({ page }) => {
    await page.goto('fonti/');

    const focusabili = page.locator('a[href], button, [tabindex]:not([tabindex="-1"])');
    const ultimo = focusabili.last();
    await expect(ultimo).toHaveAttribute('href', /^mailto:/);
  });

  test('the back link goes to the home, one level up @critical', async ({ page }) => {
    await page.goto('fonti/');

    const indietro = page.getByRole('link', { name: '← Mazzi' });
    await expect(indietro).toHaveAttribute('href', '../');
  });
});
