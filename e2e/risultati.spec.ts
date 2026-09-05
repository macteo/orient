// e2e/risultati.spec.ts — F-010 (R-004): AC-1 (l'ultimo run), AC-4 (storico
// pieno, il 51esimo evince il più vecchio), AC-5 (cancellazione in due tap,
// per tutti i mazzi), AC-6 (valore malformato → empty, storage che lancia →
// error). Segue S-006: la stessa fixture di cinquanta run su
// `descrizioni-simboli` più tre su `isom` viene seminata in
// `orient.risultati.v1` con `page.addInitScript`, prima che la pagina
// carichi il suo modulo.
//
// La forma di `Risultato`/`MazzoBuild` non è riscritta a mano qui: la
// fixture viene letta da disco (come fa già `e2e/smoke.spec.ts` con
// `content/sezioni.json`), e il mazzo con cui confrontare gli id di
// `sbagliate` viene letto dal DOM stesso (`#mazzo`, lo stesso JSON che il
// modulo della pagina usa) — così il test non assume nulla sull'output di
// build che la pagina non stia già usando.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHIAVE_RISULTATI = 'orient.risultati.v1';
const CHIAVE_SERIE = 'orient.serie.v1';

type Risultato = {
  v: 1;
  mazzo: string;
  sezioni: string[];
  modo: 'flashcard' | 'quiz';
  direzione?: 'inversa';
  data: string;
  viste: number;
  giuste: number;
  sbagliate: string[];
  ripasso?: boolean;
};

type MazzoBuild = { id: string; nome: string; carte: Record<string, unknown> };

const FIXTURE: { v: 1; risultati: Risultato[] } = JSON.parse(
  readFileSync(join(RADICE, 'akaaso/05-stories/fixtures/S-006/risultati-50.json'), 'utf8'),
);

const RISULTATI_DS = FIXTURE.risultati.filter((r) => r.mazzo === 'descrizioni-simboli');
const RISULTATI_ISOM = FIXTURE.risultati.filter((r) => r.mazzo === 'isom');

async function seminaRisultati(page: Page, contenitore: { v: 1; risultati: Risultato[] } | null): Promise<void> {
  await page.addInitScript(
    ([chiave, valore]) => {
      if (valore === null) {
        window.localStorage.removeItem(chiave as string);
      } else {
        window.localStorage.setItem(chiave as string, valore as string);
      }
    },
    [CHIAVE_RISULTATI, contenitore ? JSON.stringify(contenitore) : null] as const,
  );
}

async function leggiMazzoBuild(page: Page): Promise<MazzoBuild> {
  return page.evaluate(() => JSON.parse(document.getElementById('mazzo')!.textContent!));
}

function osservaErrori(page: Page): string[] {
  const errori: string[] = [];
  page.on('pageerror', (errore) => errori.push(errore.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errori.push(msg.text());
  });
  return errori;
}

test.describe('F-010 risultati — AC-1: l’ultimo run del mazzo', () => {
  test('punteggio e titolo dell’ultimo run sono quelli seminati @critical', async ({ page }) => {
    const errori = osservaErrori(page);
    await seminaRisultati(page, FIXTURE);
    await page.goto('descrizioni-simboli/risultati/');

    const ultimo = RISULTATI_DS.at(-1)!;
    await expect(page.getByRole('heading', { name: 'Quiz completato' })).toBeVisible();
    await expect(page.locator('[data-riga="punteggio"]')).toHaveText(`${ultimo.giuste} / ${ultimo.viste}`);

    const mazzo = await leggiMazzoBuild(page);
    const attese = ultimo.sbagliate.filter((id) => id in mazzo.carte);
    await expect(page.locator('[data-riga="errore"]')).toHaveCount(attese.length);

    expect(errori).toEqual([]);
  });
});

test.describe('F-010 risultati — AC-4: storico e limite di 50 per mazzo', () => {
  test('lo storico mostra i cinquanta run del mazzo, il terzo mazzo (isom) resta a parte @critical', async ({ page }) => {
    await seminaRisultati(page, FIXTURE);
    await page.goto('descrizioni-simboli/risultati/');
    await expect(page.locator('[data-riga="storico"]')).toHaveCount(RISULTATI_DS.length);

    await page.goto('isom/risultati/');
    await expect(page.locator('[data-riga="storico"]')).toHaveCount(RISULTATI_ISOM.length);
  });

  test('il 51esimo run di un mazzo fa sparire il più vecchio dallo storico @critical', async ({ page }) => {
    // Punteggi costruiti apposta perché ognuno sia un'etichetta unica
    // ("N / 100+N"), così il test non dipende dalla data reale in cui gira
    // (niente "Oggi"/"Ieri" da confrontare) né da punteggi che potrebbero
    // ripetersi nella fixture vera. `piuVecchio` (i=0, "0 / 100") è quello
    // che deve sparire; `nuovo` ("999 / 999") è il 51esimo, il più recente.
    const anchoraUtc = Date.UTC(2026, 7, 1, 0, 0); // 1° agosto 2026, ben prima di "oggi" in qualunque esecuzione reale.
    const cinquanta: Risultato[] = Array.from({ length: 50 }, (_, i) => ({
      v: 1,
      mazzo: 'descrizioni-simboli',
      sezioni: [],
      modo: 'flashcard',
      data: new Date(anchoraUtc + i * 3_600_000).toISOString().slice(0, 16),
      viste: 100 + i,
      giuste: i,
      sbagliate: [],
    }));
    const nuovo: Risultato = {
      v: 1,
      mazzo: 'descrizioni-simboli',
      sezioni: [],
      modo: 'flashcard',
      data: new Date(anchoraUtc + 50 * 3_600_000).toISOString().slice(0, 16),
      viste: 999,
      giuste: 999,
      sbagliate: [],
    };
    // Simula ciò che `storage.aggiungiRisultato` produce al 51esimo run di un
    // mazzo già a quota 50 (storage.test.ts copre l'algoritmo stesso): il
    // più vecchio del mazzo sparisce, gli altri mazzi restano intatti.
    const dopoIlLimite: Risultato[] = [...RISULTATI_ISOM, ...cinquanta, nuovo];
    await seminaRisultati(page, { v: 1, risultati: dopoIlLimite });

    await page.goto('descrizioni-simboli/risultati/');
    await expect(page.locator('[data-riga="storico"]')).toHaveCount(50);
    await expect(page.getByText('999 / 999', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('0 / 100', { exact: true })).toHaveCount(0);
    await expect(page.getByText('1 / 101', { exact: true })).toBeVisible();

    // isom, non toccato dal limite del mazzo descrizioni-simboli.
    await page.goto('isom/risultati/');
    await expect(page.locator('[data-riga="storico"]')).toHaveCount(RISULTATI_ISOM.length);
  });
});

test.describe('F-010 risultati — AC-5: cancellazione in due tap, per tutti i mazzi', () => {
  test('Annulla torna al link; Cancella tutto svuota lo storage e mostra empty per ogni mazzo @critical', async ({ page }) => {
    await seminaRisultati(page, FIXTURE);
    await page.goto('descrizioni-simboli/risultati/');

    const link = page.getByRole('button', { name: 'Cancella i risultati' });
    await expect(link).toBeVisible();
    await link.click();

    const annulla = page.getByRole('button', { name: 'Annulla' });
    const cancellaTutto = page.getByRole('button', { name: 'Cancella tutto' });
    await expect(annulla).toBeVisible();
    await expect(cancellaTutto).toBeVisible();
    await expect(link).toHaveCount(0);

    // Un solo tap non basta: annullando si torna al link, niente cancellato.
    await annulla.click();
    await expect(link).toBeVisible();
    await expect(page.locator('[data-riga="storico"]')).toHaveCount(RISULTATI_DS.length);

    await link.click();
    await page.getByRole('button', { name: 'Cancella tutto' }).click();

    await expect(page.getByText('Nessuna serie completata per questo mazzo')).toBeVisible();
    expect(await page.evaluate((k) => window.localStorage.getItem(k), CHIAVE_RISULTATI)).toBeNull();
    expect(await page.evaluate((k) => window.localStorage.getItem(k), CHIAVE_SERIE)).toBeNull();

    // "per tutti i mazzi": isom, mai toccato in questa pagina, è vuoto anche
    // lui. Una pagina nuova nello stesso contesto (stessa origine, stesso
    // storage) evita che l'`addInitScript` di `page` — registrato per ogni
    // navigazione futura, non solo la prima — riseminasse la fixture appena
    // cancellata.
    const paginaIsom = await page.context().newPage();
    await paginaIsom.goto('isom/risultati/');
    await expect(paginaIsom.getByText('Nessuna serie completata per questo mazzo')).toBeVisible();
    await paginaIsom.close();
  });
});

test.describe('F-010 risultati — AC-6: valore malformato o storage che lancia', () => {
  test('un valore non-JSON in orient.risultati.v1 è trattato come assente (empty, senza eccezioni) @critical', async ({ page }) => {
    const errori = osservaErrori(page);
    await page.addInitScript(
      (chiave) => window.localStorage.setItem(chiave, '{ questo non è json'),
      CHIAVE_RISULTATI,
    );
    await page.goto('descrizioni-simboli/risultati/');

    await expect(page.getByText('Nessuna serie completata per questo mazzo')).toBeVisible();
    // Empty, non error: nessuna nota di storage illeggibile.
    await expect(page.getByText('Non riesco a leggere')).toHaveCount(0);
    expect(errori).toEqual([]);
  });

  test('un contenitore di versione sbagliata è trattato come assente (empty)', async ({ page }) => {
    await page.addInitScript(
      ([chiave, valore]) => window.localStorage.setItem(chiave as string, valore as string),
      [CHIAVE_RISULTATI, JSON.stringify({ v: 0, risultati: RISULTATI_DS })] as const,
    );
    await page.goto('descrizioni-simboli/risultati/');
    await expect(page.getByText('Nessuna serie completata per questo mazzo')).toBeVisible();
  });

  test('uno storage che lancia mostra la nota di errore, senza eccezioni non gestite @critical', async ({ page }) => {
    const errori = osservaErrori(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('storage bloccato');
        },
      });
    });
    await page.goto('descrizioni-simboli/risultati/');

    await expect(page.getByText('Nessuna serie completata per questo mazzo')).toBeVisible();
    await expect(
      page.getByText('Non riesco a leggere i risultati salvati su questo telefono. Le serie funzionano lo stesso.'),
    ).toBeVisible();
    expect(errori).toEqual([]);
  });
});

test.describe('F-010 risultati — Ripassa con le carte / Ripeti (Done Criteria #3, AC-3)', () => {
  test('"Ripassa con le carte" scrive una Serie di ripasso con esattamente gli errori, in ordine, e naviga alla flash card @critical', async ({
    page,
  }) => {
    const risultato: Risultato = {
      v: 1,
      mazzo: 'descrizioni-simboli',
      sezioni: ['d-morfologici'],
      modo: 'flashcard',
      data: '2026-09-05T10:00',
      viste: 4,
      giuste: 2,
      sbagliate: ['ds:1.3', 'ds:1.2'],
    };
    await seminaRisultati(page, { v: 1, risultati: [risultato] });
    await page.goto('descrizioni-simboli/risultati/');

    await page.getByRole('button', { name: 'Ripassa con le carte' }).click();
    await expect(page).toHaveURL(/\/descrizioni-simboli\/flashcard\/\?ripasso=1$/);

    const serie = await page.evaluate((k) => window.localStorage.getItem(k), CHIAVE_SERIE);
    expect(serie).not.toBeNull();
    const serieAnalizzata = JSON.parse(serie ?? '{}');
    expect(serieAnalizzata.mazzo).toBe('descrizioni-simboli');
    expect(serieAnalizzata.modo).toBe('flashcard');
    expect(serieAnalizzata.ripasso).toBe(true);
    expect(serieAnalizzata.carte).toEqual(['ds:1.3', 'ds:1.2']);
  });

  test('"Ripeti" ricostruisce la query del run (mazzo, sezioni, dimensione, direzione) @critical', async ({ page }) => {
    const risultato: Risultato = {
      v: 1,
      mazzo: 'descrizioni-simboli',
      sezioni: ['colonna-g'],
      modo: 'quiz',
      direzione: 'inversa',
      data: '2026-09-05T11:00',
      viste: 8,
      giuste: 4,
      sbagliate: [],
    };
    await seminaRisultati(page, { v: 1, risultati: [risultato] });
    await page.goto('descrizioni-simboli/risultati/');

    await page.getByRole('button', { name: 'Ripeti' }).click();
    await expect(page).toHaveURL(/\/descrizioni-simboli\/quiz\/\?sezioni=colonna-g&carte=8&direzione=inversa$/);
  });
});
