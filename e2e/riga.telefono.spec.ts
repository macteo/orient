// e2e/riga.telefono.spec.ts — F-004 / RigaDescrizione: on a phone the
// description-row grid must fit its card. Regression reported by the
// founder on an iPhone: a generated row's long code ("gen-0038") wrapped
// onto two lines, the aspect-ratio turned that height into a width, and the
// 8 cells grew wider than the card — borders overlapping at the right edge
// and the whole page scrolling sideways. The fix lives in
// src/allenamento/facce/facce.css (minmax(0, …fr) tracks, size containment,
// text scaled with container-query units) and riga.ts (`--cpl`).

import { expect, test, type Page } from '@playwright/test';

const LARGHEZZA = 390;

function carta(page: Page) {
  return page.locator('[role="button"][aria-label^="Carta"]');
}

/** Advances through the run until the front shows a generated row (code
 * starting with "gen-"), so the assertion covers the long-code case
 * whatever the shuffle. */
async function vaiAUnaRigaGenerata(page: Page): Promise<void> {
  for (let i = 0; i < 8; i += 1) {
    const codice = (await page.locator('.riga.carta > div').nth(1).innerText()).trim();
    if (codice.startsWith('gen-')) return;
    await carta(page).click();
    await page.getByRole('button', { name: 'Lo sapevo' }).click();
  }
  throw new Error('riga.telefono: nessuna riga generata nelle prime 8 carte');
}

async function misuraGriglia(page: Page, selettore: string) {
  return page.locator(selettore).first().evaluate((griglia) => {
    const contenitore = griglia.parentElement as HTMLElement;
    const g = griglia.getBoundingClientRect();
    const c = contenitore.getBoundingClientRect();
    const celle = [...griglia.querySelectorAll(':scope > div')].map((cella) => {
      const r = cella.getBoundingClientRect();
      return { w: r.width, h: r.height, right: r.right };
    });
    return {
      paginaScorreInOrizzontale: document.documentElement.scrollWidth > window.innerWidth,
      grigliaDentro: g.left >= c.left - 0.5 && g.right <= c.right + 0.5,
      contenutoTagliato: griglia.scrollWidth > griglia.clientWidth + 1,
      ultimaCellaDentro: celle[celle.length - 1].right <= g.right + 0.5,
      celle,
    };
  });
}

test.describe('RigaDescrizione — telefono', () => {
  test('la riga di una carta generata resta dentro la carta, celle quadrate e uguali @flashcard', async ({ page }) => {
    await page.setViewportSize({ width: LARGHEZZA, height: 844 });
    await page.goto('./descrizioni-complete/flashcard/?seme=1&carte=8');
    await expect(page.locator('.riga.carta')).toBeVisible();
    await vaiAUnaRigaGenerata(page);

    for (const lato of ['fronte', 'retro'] as const) {
      const misure = await misuraGriglia(page, lato === 'fronte' ? '.riga.carta' : '.riga.tile');
      expect(misure.paginaScorreInOrizzontale, `${lato}: la pagina scorre in orizzontale`).toBe(false);
      expect(misure.grigliaDentro, `${lato}: la griglia sborda dalla carta`).toBe(true);
      expect(misure.contenutoTagliato, `${lato}: celle tagliate a destra`).toBe(false);
      expect(misure.ultimaCellaDentro, `${lato}: la cella H esce dalla griglia`).toBe(true);
      expect(misure.celle).toHaveLength(8);
      for (const [i, cella] of misure.celle.entries()) {
        expect(Math.abs(cella.w - cella.h), `${lato}: la cella ${i} non è quadrata`).toBeLessThanOrEqual(1.5);
      }
      const larghezzeBH = misure.celle.slice(1).map((cella) => cella.w);
      expect(Math.max(...larghezzeBH) - Math.min(...larghezzeBH), `${lato}: celle B–H di larghezza diversa`).toBeLessThanOrEqual(1.5);
      if (lato === 'fronte') {
        await carta(page).click();
        await expect(page.locator('.riga.tile')).toBeVisible();
      }
    }
  });

  test('anche il quiz sulle righe complete non sborda a destra @quiz', async ({ page }) => {
    await page.setViewportSize({ width: LARGHEZZA, height: 844 });
    await page.goto('./descrizioni-complete/quiz/?seme=1&carte=8');
    await expect(page.locator('.riga')).toBeVisible();
    const misure = await misuraGriglia(page, '.riga');
    expect(misure.paginaScorreInOrizzontale).toBe(false);
    expect(misure.grigliaDentro).toBe(true);
    expect(misure.contenutoTagliato).toBe(false);
    expect(misure.ultimaCellaDentro).toBe(true);
  });
});
