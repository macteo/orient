// e2e/smoke.spec.ts — ogni pagina emessa dal build (F-006 AC-1) si carica su
// `vite preview` senza errori in console e mostra il titolo del suo schermo.
//
// L'elenco delle pagine non è scritto a mano: viene da `content/sezioni.json`,
// la stessa fonte da cui `scripts/build-mazzi.ts` le emette, così una quinta
// modalità o un quinto mazzo non possono sfuggire allo smoke. Sono quattordici
// pagine: le tredici sotto `.generated/pages/` (4 mazzi × flash card, quiz,
// risultati, più `fonti/`) e la home alla radice.
//
// I percorsi sono relativi: Playwright li risolve contro `baseURL`, che
// `playwright.config.ts` costruisce dal `VITE_BASE` con cui il sito è stato
// costruito — così lo smoke vale identico sotto `/` e sotto `/orient/`.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');

type Mazzo = { id: string; nome: string; ordine: number };

const MAZZI: Mazzo[] = (
  JSON.parse(readFileSync(join(RADICE, 'content/sezioni.json'), 'utf8')) as { mazzi: Mazzo[] }
).mazzi
  .slice()
  .sort((a, b) => a.ordine - b.ordine);

const MODALITA = [
  { cartella: 'flashcard', titolo: 'Flash card' },
  { cartella: 'quiz', titolo: 'Quiz' },
  { cartella: 'risultati', titolo: 'Risultati' },
] as const;

const PAGINE: { percorso: string; titolo: string }[] = [
  { percorso: './', titolo: 'Scegli un mazzo' },
  ...MAZZI.flatMap((mazzo) =>
    MODALITA.map((modalita) => ({
      percorso: `${mazzo.id}/${modalita.cartella}/`,
      titolo: `${modalita.titolo} · ${mazzo.nome}`,
    })),
  ),
  { percorso: 'fonti/', titolo: 'Fonti e licenze' },
];

test('il build emette quattordici pagine: le tredici di .generated più la home @smoke', () => {
  expect(PAGINE).toHaveLength(14);
});

for (const pagina of PAGINE) {
  test(`${pagina.percorso} si carica senza errori e mostra il suo titolo @smoke`, async ({ page }) => {
    const errori: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errori.push(msg.text());
    });
    page.on('pageerror', (error) => {
      errori.push(error.message);
    });
    page.on('requestfailed', (request) => {
      errori.push(`richiesta fallita: ${request.url()}`);
    });

    const risposta = await page.goto(pagina.percorso);
    expect(risposta?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    // Il titolo è reso dal modulo della pagina, non dall'HTML emesso: se lo
    // vediamo, l'entry JS è stato caricato ed è girato davvero.
    await expect(page.locator('main#app h1')).toHaveText(pagina.titolo);
    expect(errori).toEqual([]);
  });
}
