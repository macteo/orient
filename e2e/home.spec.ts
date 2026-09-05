// e2e/home.spec.ts — F-001 AC-1…AC-6, contro il sito costruito servito da
// `vite preview` (webServer di playwright.config.ts). Il conteggio delle
// sezioni/carte non è scritto a mano: viene dallo stesso `<script
// id="mazzi">` che `index.html` inlina a build (build-mazzi.ts), così un
// cambio di contenuto non spacca il test.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import type { RiepilogoMazzo } from '../src/mazzi/assembla.ts';
import type { Risultato } from '../src/mazzi/tipi.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');

function leggiMazzi(): RiepilogoMazzo[] {
  const html = readFileSync(join(RADICE, 'index.html'), 'utf8');
  const corrispondenza = html.match(/<script type="application\/json" id="mazzi">([\s\S]*?)<\/script>/);
  if (!corrispondenza) {
    throw new Error('home.spec: #mazzi non trovato in index.html — esegui `npm run build` prima di questo test.');
  }
  return JSON.parse(corrispondenza[1]) as RiepilogoMazzo[];
}

const MAZZI = leggiMazzi();
const PRIMO = MAZZI[0];

function bottoneInizia(page: Page) {
  return page.locator('.orient-inizia');
}

function caselleDelMazzoAperto(page: Page) {
  return page.locator('.orient-mazzo').first().locator('.orient-checkbox input');
}

async function spuntaSoloUnaSezione(page: Page, sezioneId: string): Promise<RiepilogoMazzo['sezioni'][number]> {
  const caselle = caselleDelMazzoAperto(page);
  const n = await caselle.count();
  for (let i = 0; i < n; i += 1) await caselle.nth(i).uncheck({ force: true });
  const sezione = PRIMO.sezioni.find((s) => s.id === sezioneId);
  if (!sezione) throw new Error(`home.spec: sezione "${sezioneId}" non trovata nel primo mazzo`);
  await page
    .locator('.orient-riga', { hasText: sezione.etichetta })
    .locator('input')
    .check({ force: true });
  return sezione;
}

test.describe('F-001 — home: scelta del mazzo e delle sezioni', () => {
  test('AC-1 stato di default: quattro mazzi, il primo aperto, tutte le sezioni scelte, Flash card, taglia 8 @home', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // viewport da telefono
    const richieste: string[] = [];
    page.on('request', (richiesta) => richieste.push(richiesta.url()));

    await page.goto('./');

    for (const mazzo of MAZZI) {
      await expect(page.locator('.orient-mazzo__nome', { hasText: mazzo.nome })).toBeVisible();
    }

    const caselle = caselleDelMazzoAperto(page);
    await expect(caselle).toHaveCount(PRIMO.sezioni.length);
    for (let i = 0; i < (await caselle.count()); i += 1) {
      await expect(caselle.nth(i)).toBeChecked();
    }

    await expect(page.locator('input[name="modo"][value="flashcard"]')).toBeChecked();
    await expect(page.locator('input[name="carte"][value="8"]')).toBeChecked();
    // In modalità flash card le pillole di direzione non compaiono.
    await expect(page.locator('.orient-pillole')).toHaveCount(0);

    const bottone = bottoneInizia(page);
    await expect(bottone).toHaveText(`Inizia · ${Math.min(8, PRIMO.carte)} carte`);
    await expect(bottone).toBeEnabled();

    // AC-6, parte 1: nessuna richiesta fuori dall'origine della pagina.
    const origine = new URL(page.url()).origin;
    for (const url of richieste) {
      expect(new URL(url).origin, `richiesta fuori origine: ${url}`).toBe(origine);
    }
  });

  test('AC-2 nessuna sezione scelta disabilita il bottone; una sola lo riabilita con il conteggio giusto @home', async ({
    page,
  }) => {
    await page.goto('./');
    const caselle = caselleDelMazzoAperto(page);
    const n = await caselle.count();
    for (let i = 0; i < n; i += 1) await caselle.nth(i).uncheck({ force: true });

    const bottone = bottoneInizia(page);
    await expect(bottone).toHaveText('Scegli almeno una sezione');
    await expect(bottone).toBeDisabled();
    expect(await bottone.evaluate((nodo) => nodo.tagName)).toBe('BUTTON');

    const sezione = await spuntaSoloUnaSezione(page, 'd-costruzioni');
    await expect(bottone).toBeEnabled();
    await expect(bottone).toHaveText(`Inizia · ${Math.min(8, sezione.carte)} carte`);
    expect(await bottone.evaluate((nodo) => nodo.tagName)).toBe('A');
  });

  test('AC-3 N = min(taglia, carte nelle sezioni scelte); il chip "tutte" mostra il totale esatto @home', async ({
    page,
  }) => {
    await page.goto('./');
    const sezione = await spuntaSoloUnaSezione(page, 'd-costruzioni'); // più di 8 carte nel contenuto reale
    expect(sezione.carte).toBeGreaterThan(8);

    const bottone = bottoneInizia(page);
    await expect(bottone).toHaveText(`Inizia · 8 carte`);

    await page.locator('input[name="carte"][value="tutte"]').check({ force: true });
    await expect(bottone).toHaveText(`Inizia · ${sezione.carte} carte`);
  });

  test('AC-4 "Inizia" in quiz invertito porta a R-003 con direzione=inversa e senza "sezioni" quando tutte sono scelte @home', async ({
    page,
  }) => {
    await page.goto('./');
    await page.locator('input[name="modo"][value="quiz"]').check({ force: true });
    await expect(page.locator('.orient-pillole')).toBeVisible();
    await page.locator('input[name="direzione"][value="inversa"]').check({ force: true });

    await bottoneInizia(page).click();
    await page.waitForURL(`**/${PRIMO.id}/quiz/**`);

    const url = new URL(page.url());
    expect(url.pathname).toBe(`/${PRIMO.id}/quiz/`);
    expect(url.searchParams.get('carte')).toBe('8');
    expect(url.searchParams.get('direzione')).toBe('inversa');
    expect(url.searchParams.has('sezioni')).toBe(false);
  });

  test('AC-4 (bis) con un sottoinsieme di sezioni scelte, "sezioni" compare nella query @home', async ({ page }) => {
    await page.goto('./');
    const sezione = await spuntaSoloUnaSezione(page, 'd-costruzioni');

    await bottoneInizia(page).click();
    await page.waitForURL(`**/${PRIMO.id}/flashcard/**`);

    const url = new URL(page.url());
    expect(url.searchParams.get('sezioni')).toBe(sezione.id);
    expect(url.searchParams.has('direzione')).toBe(false);
  });

  test('AC-5 un risultato salvato mostra l’ultima serie e un link "Risultati" funzionante @home', async ({ page }) => {
    const risultato: Risultato = {
      v: 1,
      mazzo: PRIMO.id,
      sezioni: PRIMO.sezioni.map((s) => s.id),
      modo: 'flashcard',
      data: '2026-09-01T10:00:00.000Z',
      viste: 8,
      giuste: 6,
      sbagliate: [],
    };
    await page.addInitScript(
      ([chiave, valore]) => window.localStorage.setItem(chiave, valore),
      ['orient.risultati.v1', JSON.stringify({ v: 1, risultati: [risultato] })],
    );

    await page.goto('./');
    const riga = page.locator('.orient-mazzo').first();
    await expect(riga.locator('.orient-mazzo__ultimo')).toContainText('Ultima serie 6 / 8 · flash card');

    const link = riga.getByRole('link', { name: 'Risultati' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', new RegExp(`${PRIMO.id}/risultati/$`));
    await link.click();
    await page.waitForURL(`**/${PRIMO.id}/risultati/`);
  });

  test('AC-5 (bis) senza risultati salvati, nessun mazzo mostra un’ultima serie o un link "Risultati" @home', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(page.locator('.orient-mazzo__ultimo')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Risultati' })).toHaveCount(0);
  });

  test('AC-6 nessuna richiesta fuori origine e nessuna chiave di storage oltre a quella dei risultati @home', async ({
    page,
  }) => {
    const richieste: string[] = [];
    page.on('request', (richiesta) => richieste.push(richiesta.url()));

    await page.goto('./');
    await spuntaSoloUnaSezione(page, 'd-costruzioni');
    await page.locator('input[name="modo"][value="quiz"]').check({ force: true });
    await page.locator('input[name="carte"][value="tutte"]').check({ force: true });

    const origine = new URL(page.url()).origin;
    for (const url of richieste) {
      expect(new URL(url).origin, `richiesta fuori origine: ${url}`).toBe(origine);
    }

    const chiavi = await page.evaluate(() => Object.keys(window.localStorage));
    for (const chiave of chiavi) {
      expect(chiave).toBe('orient.risultati.v1');
    }
  });

  test('bersagli d’appoggio: intestazioni di mazzo e righe di sezione sono alte almeno 44 px @home', async ({
    page,
  }) => {
    await page.goto('./');
    const intestazioni = page.locator('.orient-mazzo__intestazione');
    for (let i = 0; i < (await intestazioni.count()); i += 1) {
      const misura = await intestazioni.nth(i).boundingBox();
      expect(misura?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    const righe = caselleDelMazzoAperto(page).locator('xpath=ancestor::label[contains(@class, "orient-riga")]');
    for (let i = 0; i < (await righe.count()); i += 1) {
      const misura = await righe.nth(i).boundingBox();
      expect(misura?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});
