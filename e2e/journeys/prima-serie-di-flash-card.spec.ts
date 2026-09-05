// e2e/journeys/prima-serie-di-flash-card.spec.ts — @critical journey for
// S-001 (akaaso/05-stories/001-prima-serie-di-flash-card.md): its seven
// Journey Steps transcribed in order against the real build served by
// `vite preview` (built with `VITE_TEST_SEED=1`), plus one test per
// applicable Variant from the story's table (`loading` and
// `permission-denied` are marked "Not applicable" there and have no test
// here). Pages crossed: home (R-001/D-001), flashcard (R-002/D-002),
// risultati (R-004/D-004). Features: F-001, F-002, F-004, F-006, F-010.
//
// Card identity is pinned with the test-only `?seme=<n>` (src/allenamento/
// rng.ts, active only in a `VITE_TEST_SEED=1` build). The home picker has
// no seed control, so `conSeme` edits the "Inizia" link's `href` right
// before the tap — the same link a person would follow, with one query
// parameter added, exactly as if they had typed it into the address bar.
// This never changes application code: outside a test-seed build `rng.ts`
// ignores the parameter outright.
//
// Which two of the eight cards miss (step 4) is chosen by *position*
// (index 2 and 5, zero-based — the third and sixth card), not by card
// identity: the Expected Outcomes only require two misses and the right
// counts, never which symbols they are. `orient.serie.v1` already holds
// the shuffled `carte` order once the run starts (the page writes it
// synchronously before the first render), so the test reads that array to
// learn which ids ended up at those two positions, then checks the same
// ids resurface in `Risultato.sbagliate` and as the two miss rows on
// D-004 — no need to reimplement the mulberry32 shuffle here.

import { expect, test } from '@playwright/test';
import type { ConsoleMessage, Locator, Page } from '@playwright/test';
import type { Risultato, Serie } from '../../src/mazzi/tipi.ts';

const MAZZO = 'descrizioni-simboli';
const CHIAVE_SERIE = 'orient.serie.v1';
const CHIAVE_RISULTATI = 'orient.risultati.v1';

function tracciaErrori(page: Page): string[] {
  const errori: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errori.push(msg.text());
  });
  page.on('pageerror', (error) => errori.push(error.message));
  return errori;
}

/** Registra ogni richiesta della pagina, per l'asserzione "nessuna richiesta fuori origine". */
function tracciaRichieste(page: Page): string[] {
  const richieste: string[] = [];
  page.on('request', (richiesta) => richieste.push(richiesta.url()));
  return richieste;
}

function assertSoloStessaOrigine(richieste: string[], origine: string): void {
  for (const url of richieste) {
    expect(new URL(url).origin, `richiesta fuori origine: ${url}`).toBe(origine);
  }
}

/** Il tocco sulla carta corrente: `role="button"`, etichetta "Carta, …" (flashcard-dom.ts). */
function cartaCorrente(page: Page) {
  return page.locator('[role="button"][aria-label^="Carta"]');
}

async function leggiChiave<T>(page: Page, chiave: string): Promise<T | null> {
  const grezzo = await page.evaluate((k) => window.localStorage.getItem(k), chiave);
  return grezzo === null ? null : (JSON.parse(grezzo) as T);
}

/**
 * Aggiunge `?seme=<n>` all'`href` del link "Inizia" prima del tap: il
 * picker (D-001) non ha alcun controllo per il seme di test, quindi il
 * test lo aggiunge come farebbe chi modifica l'indirizzo a mano — non
 * tocca il codice applicativo, e fuori da una build `VITE_TEST_SEED=1`
 * `rng.ts` lo ignorerebbe comunque.
 */
async function conSeme(link: Locator, seme: number): Promise<void> {
  await link.evaluate((elemento, valore) => {
    const a = elemento as HTMLAnchorElement;
    const url = new URL(a.href);
    url.searchParams.set('seme', String(valore));
    a.setAttribute('href', `${url.pathname}${url.search}`);
  }, seme);
}

test.describe('journey-prima-serie-di-flash-card (S-001)', () => {
  test('dalla home a otto carte di flash card, al risultato, e ritorno ai mazzi @critical', async ({
    page,
    context,
  }) => {
    const errori = tracciaErrori(page);
    const richieste = tracciaRichieste(page);

    // step 1 — apre l'URL del sito (R-001/D-001), storage vuoto (prima visita)
    await page.goto('./');
    const origine = new URL(page.url()).origin;

    expect(await leggiChiave(page, CHIAVE_SERIE)).toBeNull();
    expect(await leggiChiave(page, CHIAVE_RISULTATI)).toBeNull();

    await expect(page.locator('.orient-mazzo__nome')).toHaveCount(4);
    const caselle = page.locator('.orient-mazzo').first().locator('.orient-checkbox input');
    const numeroCaselle = await caselle.count();
    expect(numeroCaselle).toBeGreaterThan(0);
    for (let i = 0; i < numeroCaselle; i += 1) {
      await expect(caselle.nth(i)).toBeChecked();
    }
    await expect(page.locator('input[name="modo"][value="flashcard"]')).toBeChecked();
    await expect(page.locator('input[name="carte"][value="8"]')).toBeChecked();

    const inizia = page.getByRole('link', { name: 'Inizia · 8 carte' });
    await expect(inizia).toBeVisible();
    await expect(inizia).toBeEnabled();

    // step 2 — tocca "Inizia · 8 carte" in modalità Flash card
    await conSeme(inizia, 42);
    await inizia.click();
    await page.waitForURL(new RegExp(`${MAZZO}/flashcard/\\?carte=8&seme=42$`));
    await expect(page.getByText('Descrizioni dei punti · tutte le sezioni')).toBeVisible();

    const serieIniziale = await leggiChiave<Serie>(page, CHIAVE_SERIE);
    if (!serieIniziale) {
      throw new Error('journey: orient.serie.v1 non è stato scritto all’avvio della corsa (F-002 AC-2)');
    }
    expect(serieIniziale.mazzo).toBe(MAZZO);
    expect(serieIniziale.carte).toHaveLength(8);
    const idPerIndice = serieIniziale.carte;

    // step 3 — tocca la carta: fronte → retro (pittogramma piccolo, badge di riferimento, nome, definizione)
    await expect(page.getByText('1 / 8', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lo sapevo', exact: true })).toHaveCount(0);
    await expect(page.getByText('Gira la carta per autovalutarti')).toBeVisible();
    await cartaCorrente(page).click();
    await expect(page.getByRole('button', { name: 'Lo sapevo', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Non lo sapevo', exact: true })).toBeVisible();
    await expect(page.locator('.hs-badge')).toBeVisible();

    // step 4 — vota "Lo sapevo" sei volte e "Non lo sapevo" due volte, sulle otto carte
    // (le carte mancate sono scelte per posizione: la terza e la sesta, indici 2 e 5)
    const indiciErrore = new Set([2, 5]);
    for (let i = 0; i < 8; i += 1) {
      if (i > 0) {
        await expect(page.getByText(`${i + 1} / `, { exact: false })).toBeVisible();
        await cartaCorrente(page).click();
      }
      const esito = indiciErrore.has(i) ? 'Non lo sapevo' : 'Lo sapevo';
      await page.getByRole('button', { name: esito, exact: true }).click();
    }
    const idAttesiErrati = [...indiciErrore].sort((a, b) => a - b).map((i) => idPerIndice[i]);

    // step 5 — le due carte mancate tornano dopo l'ottava, vengono votate (contatore 9/10, 10/10)
    await expect(page.getByText('9 / 10', { exact: true })).toBeVisible();
    await cartaCorrente(page).click();
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();

    await expect(page.getByText('10 / 10', { exact: true })).toBeVisible();
    await cartaCorrente(page).click();
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();

    // step 6 — atterra sul risultato (R-004/D-004): 6 / 8, "carte che sapevi", due errori
    await page.waitForURL(new RegExp(`${MAZZO}/risultati/?$`));
    await expect(page.getByRole('heading', { name: 'Serie completata' })).toBeVisible();
    await expect(page.locator('[data-riga="punteggio"]')).toHaveText('6 / 8');
    await expect(page.getByText('carte che sapevi')).toBeVisible();
    await expect(page.locator('[data-riga="errore"]')).toHaveCount(2);

    const risultati = await leggiChiave<{ v: 1; risultati: Risultato[] }>(page, CHIAVE_RISULTATI);
    expect(risultati?.risultati).toHaveLength(1);
    const risultato = risultati!.risultati[0];
    expect(risultato.mazzo).toBe(MAZZO);
    expect(risultato.modo).toBe('flashcard');
    expect(risultato.viste).toBe(8);
    expect(risultato.giuste).toBe(6);
    expect(risultato.sbagliate).toEqual(idAttesiErrati);
    expect(await leggiChiave(page, CHIAVE_SERIE)).toBeNull();

    // step 7 — tocca "Torna ai mazzi": la riga del mazzo mostra l'ultima serie e un link ai risultati
    await page.getByRole('button', { name: 'Torna ai mazzi' }).click();
    await page.waitForURL(/\/$/);
    const rigaMazzo = page.locator('.orient-mazzo').first();
    await expect(rigaMazzo.locator('.orient-mazzo__ultimo')).toContainText('Ultima serie 6 / 8 · flash card');
    const linkRisultati = rigaMazzo.getByRole('link', { name: 'Risultati' });
    await expect(linkRisultati).toBeVisible();
    await expect(linkRisultati).toHaveAttribute('href', new RegExp(`${MAZZO}/risultati/$`));

    // Expected Outcomes: nessuna richiesta fuori origine, nessun cookie, nessun errore console.
    assertSoloStessaOrigine(richieste, origine);
    expect(await context.cookies()).toEqual([]);
    expect(errori).toEqual([]);
  });
});

test.describe('Variante `retro` — qualunque carta toccata mostra il retro coi bottoni di voto', () => {
  test('il fronte non ha bottoni di voto; il retro sì, e il fronte sparisce @critical', async ({ page }) => {
    const errori = tracciaErrori(page);
    await page.goto(`${MAZZO}/flashcard/?carte=8&seme=1`);

    await expect(page.getByText('Gira la carta per autovalutarti')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lo sapevo', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Non lo sapevo', exact: true })).toHaveCount(0);

    await cartaCorrente(page).click();

    await expect(page.getByText('Gira la carta per autovalutarti')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Lo sapevo', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Non lo sapevo', exact: true })).toBeVisible();
    await expect(page.locator('.hs-badge')).toBeVisible();

    expect(errori).toEqual([]);
  });
});

test.describe('Variante `ripresa` — reload a metà corsa', () => {
  test('la corsa riprende sulla stessa carta, non girata, con la notice "Serie ripresa" una sola volta @critical', async ({
    page,
  }) => {
    const errori = tracciaErrori(page);
    await page.goto(`${MAZZO}/flashcard/?carte=8&seme=42`);

    // Le otto carte della prima passata (step 4 del journey), stessi due indici in errore:
    // dopo l'ottava la corsa è ferma sul primo ripasso, non ancora votato — "il telefono si blocca".
    const indiciErrore = new Set([2, 5]);
    for (let i = 0; i < 8; i += 1) {
      await cartaCorrente(page).click();
      const esito = indiciErrore.has(i) ? 'Non lo sapevo' : 'Lo sapevo';
      await page.getByRole('button', { name: esito, exact: true }).click();
    }
    await expect(page.getByText('9 / 10', { exact: true })).toBeVisible();
    const serieAttesa = await leggiChiave<Serie>(page, CHIAVE_SERIE);

    await page.reload();

    await expect(page.getByText('Serie ripresa')).toBeVisible();
    await expect(page.getByText('9 / 10', { exact: true })).toBeVisible();
    // "non girata": l'indizio del fronte è visibile, nessun bottone di voto.
    await expect(page.getByText('Gira la carta per autovalutarti')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lo sapevo', exact: true })).toHaveCount(0);

    const serieDopoReload = await leggiChiave<Serie>(page, CHIAVE_SERIE);
    expect(serieDopoReload).toEqual(serieAttesa);

    // "shown once": dopo un'interazione la notice sparisce e non ricompare.
    await cartaCorrente(page).click();
    await expect(page.getByText('Serie ripresa')).toHaveCount(0);
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    await expect(page.getByText('Serie ripresa')).toHaveCount(0);

    expect(errori).toEqual([]);
  });
});

test.describe('Variante `empty` — sezione scelta senza carte', () => {
  // `content/sezioni.json` dichiara "d-particolari" per ogni mazzo su cui esiste una famiglia
  // di quel nome, ma S3 non dà esempi di oggetti particolari: il mazzo "esempi" la porta con
  // `carte: []` (assembla.ts, commento su `assemblaMazzo`) — l'unica combinazione mazzo/sezione
  // reale, sintatticamente valida, che produce zero carte. Verificato al build corrente:
  // `esempi 107 carte (… d-particolari 0)`.
  test('messaggio "Nessuna carta per le sezioni scelte", link ai mazzi, niente scritto in storage @critical', async ({
    page,
  }) => {
    const errori = tracciaErrori(page);
    await page.goto('esempi/flashcard/?sezioni=d-particolari');

    await expect(page.getByText('Nessuna carta per le sezioni scelte')).toBeVisible();
    const tornaAiMazzi = page.getByRole('button', { name: 'Torna ai mazzi' });
    await expect(tornaAiMazzi).toBeVisible();

    expect(await leggiChiave(page, CHIAVE_SERIE)).toBeNull();
    expect(await leggiChiave(page, CHIAVE_RISULTATI)).toBeNull();

    await tornaAiMazzi.click();
    await page.waitForURL(/\/$/);

    expect(errori).toEqual([]);
  });
});

test.describe('Variante `invalid-input` — sezione sconosciuta e dimensione fuori scala', () => {
  test('notice "Sezione non trovata", una riga; la corsa parte su tutte le sezioni, 8 carte @critical', async ({
    page,
  }) => {
    const errori = tracciaErrori(page);
    await page.goto(`${MAZZO}/flashcard/?sezioni=xyz&carte=99&seme=2`);

    await expect(page.getByText('Sezione non trovata')).toBeVisible();
    await expect(page.getByText('Serie avviata su tutte le sezioni, 8 carte.')).toBeVisible();
    await expect(page.getByText('1 / 8', { exact: true })).toBeVisible();

    const serie = await leggiChiave<Serie>(page, CHIAVE_SERIE);
    expect(serie?.sezioni).toHaveLength(12); // tutte le sezioni del mazzo, non "xyz"
    expect(serie?.carte).toHaveLength(8);

    // "shown once": la notice sparisce dopo la prima interazione.
    await cartaCorrente(page).click();
    await expect(page.getByText('Sezione non trovata')).toHaveCount(0);

    expect(errori).toEqual([]);
  });
});

test.describe('Variante `error` — storage bloccato (es. navigazione privata)', () => {
  test('la corsa funziona fino in fondo; il risultato mostra la nota di errore @critical', async ({ page }) => {
    const errori = tracciaErrori(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get(): never {
          throw new Error('SecurityError: localStorage non disponibile');
        },
      });
    });

    await page.goto(`${MAZZO}/flashcard/?carte=8&seme=3`);
    for (let i = 0; i < 8; i += 1) {
      await cartaCorrente(page).click();
      await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    }

    await page.waitForURL(new RegExp(`${MAZZO}/risultati/?$`));
    await expect(page.getByText('Nessuna serie completata per questo mazzo')).toBeVisible();
    await expect(
      page.getByText('Non riesco a leggere i risultati salvati su questo telefono. Le serie funzionano lo stesso.'),
    ).toBeVisible();

    expect(errori).toEqual([]);
  });
});

test.describe('Variante "Second miss" — una carta ripassata e sbagliata di nuovo non torna in coda', () => {
  test('non viene riaccodata: compare una sola volta nel risultato @critical', async ({ page }) => {
    const errori = tracciaErrori(page);
    await page.goto(`${MAZZO}/flashcard/?carte=8&seme=42`);

    // Un solo errore nella prima passata (indice 0), poi sbagliato di nuovo al ripasso.
    await cartaCorrente(page).click();
    await page.getByRole('button', { name: 'Non lo sapevo', exact: true }).click();
    for (let i = 1; i < 8; i += 1) {
      await cartaCorrente(page).click();
      await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    }

    await expect(page.getByText('9 / 9', { exact: true })).toBeVisible();
    await cartaCorrente(page).click();
    await page.getByRole('button', { name: 'Non lo sapevo', exact: true }).click();

    // Non riaccodata: la corsa è completa subito dopo (niente "10 / 10"), si atterra sul risultato.
    await page.waitForURL(new RegExp(`${MAZZO}/risultati/?$`));
    await expect(page.locator('[data-riga="punteggio"]')).toHaveText('7 / 8');
    await expect(page.locator('[data-riga="errore"]')).toHaveCount(1);
    await expect(page.getByText('1 simbolo da ripassare')).toBeVisible();

    const risultati = await leggiChiave<{ v: 1; risultati: Risultato[] }>(page, CHIAVE_RISULTATI);
    expect(risultati?.risultati.at(-1)?.sbagliate).toHaveLength(1);

    expect(errori).toEqual([]);
  });
});
