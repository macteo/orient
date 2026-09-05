// e2e/journeys/righe-complete.spec.ts — S-003 "Descrizioni complete: leggere
// una riga e riconoscerla dalla frase", trascritta dai suoi undici Journey
// Steps (akaaso/05-stories/003-righe-complete-in-entrambe-le-direzioni.md)
// più le Variant applicabili. Gira contro il build reale servito da `vite
// preview` (playwright.config.ts), costruito con `VITE_TEST_SEED=1` così
// `?seme=<n>` rende ogni corsa deterministica (`src/allenamento/rng.ts`); in
// produzione lo stesso parametro è ignorato.
//
// Il picker della home (`src/sito/picker.ts`) non porta mai `?seme=` nel suo
// link "Inizia" — non ne ha bisogno in produzione, dove il seme di test non
// esiste. Per restare fedeli all'affordance reale (un vero tap su "Inizia")
// pur ottenendo un run deterministico, `iniziaConSeme` legge l'`href` che
// l'app ha già calcolato e vi aggiunge `&seme=<n>` prima del click, invece
// di ricostruire l'URL a mano: la corsa che ne segue è quella che l'utente
// otterrebbe, solo riproducibile.
//
// Il seme 7 sulle sole sezioni "Ufficiali" + "Rocce e sassi" (39 carte) è
// stato scelto perché con `content/righe/ufficiali.json` e
// `content/righe/generate.json` correnti la prima carta mescolata è
// `dc:ufficiale:2` (la riga ufficiale 2, quella del test a pixel
// `e2e/riga.pixel.spec.ts`) e la seconda è una riga generata
// (`dc:gen:0006`) — esattamente la coppia "ufficiale poi generata" che lo
// step 5 della storia richiede. Non è una proprietà dell'app ("le ufficiali
// vengono prima" vale solo per il pool prima del mescolamento, non per
// l'ordine della corsa): è stato trovato mescolando `content/righe/*.json`
// con lo stesso RNG (mulberry32) fuori da Playwright, poi fissato qui.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { RiepilogoMazzo } from '../../src/mazzi/assembla.ts';
import type { Risultato } from '../../src/mazzi/tipi.ts';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAZZO_ID = 'descrizioni-complete';
const NOME_MAZZO = 'Descrizioni complete';
const CHIAVE_RISULTATI = 'orient.risultati.v1';

// La stessa frase con l'apostrofo tipografico U+2019 di content/righe/ufficiali.json
// (riga 2) e content/righe/generate.json (dc:gen:0006) — verbatim, mai parafrasata.
const FRASE_UFFICIALE_2 = 'Sasso nord ovest, 1 m d’altezza, lato est';
const FRASE_GENERATA_0006 = 'Terreno pietroso/sassoso superiore, estremità ovest';

// ------------------------------------------------------------ contenuto reale

/**
 * Il riepilogo dei mazzi che `index.html` inlina a build (lo stesso
 * `<script id="mazzi">` che `e2e/home.spec.ts` già legge): non riscrive a
 * mano i conteggi di sezione, così una rigenerazione del contenuto non
 * spacca questo test.
 */
function leggiMazzi(): RiepilogoMazzo[] {
  const html = readFileSync(join(RADICE, 'index.html'), 'utf8');
  const corrispondenza = html.match(/<script type="application\/json" id="mazzi">([\s\S]*?)<\/script>/);
  if (!corrispondenza) {
    throw new Error('journeys/righe-complete: #mazzi non trovato in index.html — esegui `npm run build` prima di questo test.');
  }
  return JSON.parse(corrispondenza[1]) as RiepilogoMazzo[];
}

const MAZZI = leggiMazzi();
const MAZZO = MAZZI.find((m) => m.id === MAZZO_ID);
if (!MAZZO) {
  throw new Error(`journeys/righe-complete: mazzo "${MAZZO_ID}" non trovato in #mazzi.`);
}

/** Il conteggio reale di carte generate in "Oggetti particolari" — decide se la Variant `empty` è riproducibile. */
const SEZIONE_D_PARTICOLARI = MAZZO.sezioni.find((s) => s.id === 'd-particolari');
const CARTE_D_PARTICOLARI = SEZIONE_D_PARTICOLARI?.carte ?? 0;

// -------------------------------------------------------------------- helper

function mazzoCard(page: Page): Locator {
  return page.locator('.orient-mazzo').filter({ has: page.locator('.orient-mazzo__nome', { hasText: NOME_MAZZO }) });
}

/** Step 1 / step 8 — "opens/same deck *Descrizioni complete*": apre l'accordion se non è già aperto. */
async function apriMazzo(page: Page): Promise<void> {
  const intestazione = mazzoCard(page).locator('.orient-mazzo__intestazione');
  if ((await intestazione.getAttribute('aria-expanded')) !== 'true') {
    await intestazione.click();
  }
}

/** Step 2 / step 8 — "Keeps *Ufficiali* and *Rocce e sassi*": spunta solo le etichette date, le altre le toglie. */
async function tieniSoloSezioni(page: Page, etichette: string[]): Promise<void> {
  const righe = mazzoCard(page).locator('.orient-riga');
  const n = await righe.count();
  for (let i = 0; i < n; i += 1) {
    const riga = righe.nth(i);
    const testo = (await riga.locator('.orient-riga__etichetta').innerText()).trim();
    const casella = riga.locator('input[type="checkbox"]');
    if (etichette.includes(testo)) {
      await casella.check({ force: true });
    } else {
      await casella.uncheck({ force: true });
    }
  }
}

/** Variant "Only generated sections" — toglie solo *Ufficiali*, lascia le altre come sono (tutte spuntate di default). */
async function scartaSezione(page: Page, etichetta: string): Promise<void> {
  await mazzoCard(page).locator('.orient-riga', { hasText: etichetta }).locator('input[type="checkbox"]').uncheck({ force: true });
}

/**
 * Step 3 / step 9 — "Taps *Inizia*": il link non porta mai `?seme=` (il
 * picker non lo conosce), quindi si aggiunge qui, sull'href già calcolato
 * dall'app, prima di un vero click — non un URL scritto a mano.
 */
async function iniziaConSeme(page: Page, seme: number): Promise<void> {
  const bottone = page.locator('a.orient-inizia');
  await expect(bottone).toBeVisible();
  await bottone.evaluate((el: Element, semeValore: number) => {
    const url = new URL(el.getAttribute('href') ?? '', window.location.href);
    url.searchParams.set('seme', String(semeValore));
    el.setAttribute('href', `${url.pathname}${url.search}`);
  }, seme);
  await bottone.click();
}

/** Il tocco sulla carta corrente (flashcard): `role="button"`, etichetta "Carta, …". */
function cartaCorrente(page: Page): Locator {
  return page.locator('[role="button"][aria-label^="Carta"]');
}

async function giraEVotaSapevo(page: Page): Promise<void> {
  await cartaCorrente(page).click();
  await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
}

async function leggiRisultati(page: Page): Promise<Risultato[]> {
  const grezzo = await page.evaluate((chiave) => window.localStorage.getItem(chiave), CHIAVE_RISULTATI);
  if (!grezzo) return [];
  return (JSON.parse(grezzo) as { v: 1; risultati: Risultato[] }).risultati;
}

/**
 * Variant "verdetto" — dopo una scelta: le quattro opzioni si bloccano, una
 * sola porta "✓", il pannello (`role="status"`) porta un titolo esatto e un
 * corpo che è una delle frasi verbatim del mazzo (mai una definizione
 * inventata dal test).
 */
async function verificaVerdetto(page: Page, opzioni: Locator): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await expect(opzioni.nth(i)).toBeDisabled();
  }
  await expect(page.getByText('✓', { exact: true })).toHaveCount(1);

  const pannello = page.getByRole('status');
  await expect(pannello).toBeVisible();
  const titolo = pannello.locator(':scope > div').nth(0);
  await expect(titolo).toHaveText(/^Giusto$|^Sbagliato — /);

  const mazzoJson = await page.evaluate(() => JSON.parse(document.getElementById('mazzo')!.textContent!)) as {
    carte: Record<string, { riga?: { testo?: string } }>;
  };
  const frasiDelMazzo = new Set(
    Object.values(mazzoJson.carte)
      .map((c) => c.riga?.testo)
      .filter((t): t is string => Boolean(t)),
  );
  const corpo = await pannello.locator(':scope > div').nth(1).innerText();
  expect(frasiDelMazzo.has(corpo)).toBe(true);
}

function osservaErrori(page: Page): string[] {
  const errori: string[] = [];
  page.on('pageerror', (errore) => errori.push(errore.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errori.push(msg.text());
  });
  return errori;
}

// --------------------------------------------------------------- il viaggio

test.describe('S-003 — Descrizioni complete: leggere una riga e riconoscerla dalla frase', () => {
  test('home → flash card → risultati → quiz "Nome → simbolo" → risultati @critical', async ({ page }) => {
    const errori = osservaErrori(page);
    const richieste: string[] = [];
    page.on('request', (richiesta) => richieste.push(richiesta.url()));

    // step 1 — Opens the site, opens the deck "Descrizioni complete"
    await page.goto('./');
    const home = page.url();
    await apriMazzo(page);
    for (const sezione of MAZZO.sezioni) {
      await expect(
        mazzoCard(page).locator('.orient-riga', { hasText: sezione.etichetta }).locator('.orient-riga__conteggio'),
      ).toHaveText(`${sezione.carte} carte`);
    }

    // step 2 — Keeps "Ufficiali" and "Rocce e sassi", flash card, chip "8"
    await tieniSoloSezioni(page, ['Ufficiali (pagina 3)', 'Rocce e sassi']);
    await expect(page.locator('input[name="modo"][value="flashcard"]')).toBeChecked();
    await expect(page.locator('input[name="carte"][value="8"]')).toBeChecked();
    await expect(page.locator('.orient-inizia')).toHaveText('Inizia · 8 carte');

    // step 3 — Taps "Inizia"
    await iniziaConSeme(page, 7);
    await page.waitForURL(/\/descrizioni-complete\/flashcard\//);
    {
      const url = new URL(page.url());
      expect(url.searchParams.get('sezioni')).toBe('ufficiali,d-rocce');
      expect(url.searchParams.get('carte')).toBe('8');
    }
    await expect(page.getByText('1 / 8', { exact: true })).toBeVisible();
    // Il fronte è la griglia stampata (F-004 AC-2, guardata a pixel da
    // e2e/riga.pixel.spec.ts): qui si verifica solo il contenuto delle
    // celle A e B, che identificano la riga ufficiale 2.
    await expect(page.locator('.riga.carta > div').nth(0)).toHaveText('2');
    await expect(page.locator('.riga.carta > div').nth(1)).toHaveText('212');

    // step 4 — Taps to flip
    await cartaCorrente(page).click();
    await expect(page.getByText(FRASE_UFFICIALE_2, { exact: true })).toBeVisible();
    await expect(page.getByText('generata')).toHaveCount(0);

    // step 5 — Grades, continues to a generated row, flips
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    await expect(page.getByText('2 / 8', { exact: true })).toBeVisible();
    await cartaCorrente(page).click();
    await expect(page.getByText(FRASE_GENERATA_0006, { exact: true })).toBeVisible();
    await expect(page.getByText('generata')).toBeVisible();
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();

    // step 6 — Finishes the run
    for (let i = 3; i <= 8; i += 1) {
      await expect(page.getByText(`${i} / 8`, { exact: true })).toBeVisible();
      await giraEVotaSapevo(page);
    }
    await page.waitForURL(/\/descrizioni-complete\/risultati\//);
    await expect(page.getByRole('heading', { name: 'Serie completata' })).toBeVisible();
    await expect(page.locator('[data-riga="punteggio"]')).toHaveText('8 / 8');

    const dopoFlashcard = (await leggiRisultati(page)).filter((r) => r.mazzo === MAZZO_ID);
    expect(dopoFlashcard).toHaveLength(1);
    expect(dopoFlashcard[0].modo).toBe('flashcard');
    expect(dopoFlashcard[0].viste).toBe(8);
    expect(dopoFlashcard[0].giuste).toBe(8);

    // step 7 — Taps "Torna ai mazzi"
    await page.getByRole('button', { name: 'Torna ai mazzi' }).click();
    await expect(page).toHaveURL(home);
    await expect(mazzoCard(page).locator('.orient-mazzo__ultimo')).toContainText('Ultima serie 8 / 8 · flash card');

    // step 8 — Same deck, Quiz, "Nome → simbolo"
    await apriMazzo(page);
    await tieniSoloSezioni(page, ['Ufficiali (pagina 3)', 'Rocce e sassi']);
    await page.locator('input[name="modo"][value="quiz"]').check({ force: true });
    await expect(page.locator('.orient-pillole')).toBeVisible();
    await page.locator('input[name="direzione"][value="inversa"]').check({ force: true });

    // step 9 — Taps "Inizia"
    await iniziaConSeme(page, 3);
    await page.waitForURL(/\/descrizioni-complete\/quiz\//);
    {
      const url = new URL(page.url());
      expect(url.searchParams.get('sezioni')).toBe('ufficiali,d-rocce');
      expect(url.searchParams.get('carte')).toBe('8');
      expect(url.searchParams.get('direzione')).toBe('inversa');
    }
    await expect(page.getByText('Quale simbolo?')).toBeVisible();
    await expect(page.locator('.riga.tile')).toHaveCount(4);

    // step 10 / step 11 — Picks a tile … Finishes, sees the result
    for (let i = 0; i < 8; i += 1) {
      const opzioni = page.locator('main#app button');
      await expect(opzioni).toHaveCount(4);
      await opzioni.first().click();
      if (i === 0) {
        await verificaVerdetto(page, opzioni);
      }
      const prosegui = page.getByRole('button', { name: /^(Avanti|Vedi il risultato)$/ });
      await expect(prosegui).toBeVisible();
      await prosegui.click();
    }
    await page.waitForURL(/\/descrizioni-complete\/risultati\//);
    await expect(page.getByRole('heading', { name: 'Quiz completato' })).toBeVisible();

    const finali = (await leggiRisultati(page)).filter((r) => r.mazzo === MAZZO_ID);
    expect(finali).toHaveLength(2);
    expect(finali[0].modo).toBe('flashcard');
    expect(finali[1].modo).toBe('quiz');
    expect(finali[1].direzione).toBe('inversa');

    // Expected Outcomes — nessuna richiesta fuori dall'origine della pagina.
    const origine = new URL(page.url()).origin;
    for (const url of richieste) {
      expect(new URL(url).origin, `richiesta fuori origine: ${url}`).toBe(origine);
    }
    expect(errori).toEqual([]);
  });
});

// ------------------------------------------------------------------ variant

test.describe('S-003 — Variant: retro', () => {
  test('flip: sentence and small row; badge only on generated rows', async ({ page }) => {
    const errori = osservaErrori(page);
    await page.goto('descrizioni-complete/flashcard/?sezioni=ufficiali,d-rocce&carte=8&seme=7');

    // Prima carta (seme 7): ufficiale — nessun badge, riga piccola sul retro.
    await cartaCorrente(page).click();
    await expect(page.locator('.riga.tile')).toBeVisible();
    await expect(page.getByText(FRASE_UFFICIALE_2, { exact: true })).toBeVisible();
    await expect(page.getByText('generata')).toHaveCount(0);

    // Seconda carta (dopo un voto): generata — stesso layout, badge in più.
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    await cartaCorrente(page).click();
    await expect(page.getByText(FRASE_GENERATA_0006, { exact: true })).toBeVisible();
    await expect(page.getByText('generata')).toBeVisible();

    expect(errori).toEqual([]);
  });
});

test.describe('S-003 — Variant: verdetto', () => {
  test('tile picked: marks and panel; panel shows the right sentence', async ({ page }) => {
    const errori = osservaErrori(page);
    await page.goto('descrizioni-complete/quiz/?sezioni=ufficiali,d-rocce&carte=8&direzione=inversa&seme=3');

    await expect(page.getByText('Quale simbolo?')).toBeVisible();
    const opzioni = page.locator('main#app button');
    await expect(opzioni).toHaveCount(4);
    await opzioni.first().click();

    await verificaVerdetto(page, opzioni);

    expect(errori).toEqual([]);
  });
});

test.describe('S-003 — Variant: Only generated sections', () => {
  test('unchecking "Ufficiali": run has no official row, every back carries the badge', async ({ page }) => {
    const errori = osservaErrori(page);
    await page.goto('./');
    await apriMazzo(page);
    await scartaSezione(page, 'Ufficiali (pagina 3)');
    await expect(page.locator('.orient-inizia')).toHaveText('Inizia · 8 carte');

    await iniziaConSeme(page, 11);
    await page.waitForURL(/\/descrizioni-complete\/flashcard\//);

    for (let i = 1; i <= 8; i += 1) {
      await expect(page.getByText(`${i} / 8`, { exact: true })).toBeVisible();
      // Nessuna sezione "ufficiali" nel pool: ogni carta pescata è per
      // costruzione `origine: 'generata'` (assembla.ts la mette solo lì).
      await cartaCorrente(page).click();
      await expect(page.getByText('generata')).toBeVisible();
      await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    }

    expect(errori).toEqual([]);
  });
});

test.describe('S-003 — Variant: empty', () => {
  test('?sezioni=d-particolari: empty state and link to R-001', async ({ page }) => {
    test.skip(
      CARTE_D_PARTICOLARI > 0,
      `"Oggetti particolari" ha ${CARTE_D_PARTICOLARI} carte generate in questa build ` +
        '(.generated/mazzi/descrizioni-complete.json, da content/righe/generate.json): ' +
        'la sezione non è vuota, quindi la variante "empty" della storia non è ' +
        'riproducibile su questo contenuto senza rigenerarlo con un seme diverso.',
    );
    await page.goto('descrizioni-complete/flashcard/?sezioni=d-particolari&carte=8');
    await expect(page.getByText('Nessuna carta per le sezioni scelte')).toBeVisible();
    await page.getByRole('link', { name: '← Mazzi' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('S-003 — Variant: Deck grown', () => {
  test('curator regenerates with count 400 (S-008): counts rise, ids stable, old results resolve', async () => {
    test.skip(
      true,
      'Richiede rigenerare content/righe/generate.json con --count 400 (S-008), un file di ' +
        'contenuto diverso da quello committato (200 righe) — fuori dai deliverable di questo ' +
        "task (solo e2e/journeys/righe-complete.spec.ts, e2e/README.md); non riproducibile qui.",
    );
  });
});
