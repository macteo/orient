// e2e/flashcard.spec.ts — F-002 AC-6 (storage unavailable) e AC-7 (query non
// valida) su R-002, contro il build reale (`vite preview`), non uno stub.
//
// Le altre AC di F-002 (AC-1 … AC-5: mescolamento, flip, ripasso degli
// errori, risultato, ripresa dopo reload) sono coperte dal journey @critical
// di S-001 (task separato); questo file copre solo le due che questo task
// possiede per intero: lo storage che lancia e l'input non valido. Costruito
// con `VITE_TEST_SEED=1` così `?seme=<n>` rende ogni run deterministico
// (`src/allenamento/rng.ts`); in produzione lo stesso parametro è ignorato.
//
// La pagina dei risultati (R-004) è di un altro task: qui si verifica solo
// che la navigazione ci arrivi e che carichi senza errori, non il suo
// contenuto (il suo stato vuoto/errore è responsabilità di quel task).

import { expect, test } from '@playwright/test';
import type { ConsoleMessage, Page } from '@playwright/test';

const MAZZO = 'descrizioni-simboli';

function tracciaErrori(page: Page): string[] {
  const errori: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errori.push(msg.text());
  });
  page.on('pageerror', (error) => errori.push(error.message));
  return errori;
}

/** Il tocco sulla carta corrente: `role="button"`, etichetta "Carta, …". */
function cartaCorrente(page: Page) {
  return page.locator('[role="button"][aria-label^="Carta"]');
}

/** Gira la carta e la vota "Lo sapevo" (mai un errore, mai un ripasso). */
async function giraEVotaSapevo(page: Page): Promise<void> {
  await cartaCorrente(page).click();
  await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
}

test.describe('F-002 AC-7: query non valida', () => {
  test('sezione sconosciuta e dimensione fuori scala: notice, tutte le sezioni, 8 carte @critical', async ({ page }) => {
    const errori = tracciaErrori(page);

    await page.goto(`${MAZZO}/flashcard/?sezioni=non-esiste&carte=99&seme=42`);

    // La notice F-002 `invalid-input`.
    await expect(page.getByText('Sezione non trovata')).toBeVisible();
    await expect(page.getByText('Serie avviata su tutte le sezioni, 8 carte.')).toBeVisible();

    // Il contatore parte da "1 / 8": la dimensione è stata riportata a 8.
    await expect(page.getByText('1 / 8', { exact: true })).toBeVisible();

    // La notice sparisce dopo la prima interazione ("shown once", poi si
    // torna a `default`/`retro`).
    await cartaCorrente(page).click();
    await expect(page.getByText('Sezione non trovata')).toHaveCount(0);
    await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();

    // Le altre 7 carte, votate tutte "Lo sapevo": esattamente 8 in totale,
    // nessun ripasso, poi la navigazione a R-004.
    for (let i = 2; i <= 8; i += 1) {
      await expect(page.getByText(`${i} / 8`, { exact: true })).toBeVisible();
      await giraEVotaSapevo(page);
    }

    await page.waitForURL(new RegExp(`${MAZZO}/risultati/?$`));
    expect(errori).toEqual([]);
  });
});

test.describe('F-002 AC-6: storage non disponibile', () => {
  test('con un accessor che lancia, la corsa funziona fino in fondo e arriva a R-004 @critical', async ({ page }) => {
    const errori = tracciaErrori(page);

    // Simula uno storage bloccato (es. Safari in navigazione privata): ogni
    // accesso a `window.localStorage` lancia, come farebbe l'accessor vero.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get(): never {
          throw new Error('SecurityError: localStorage non disponibile');
        },
      });
    });

    await page.goto(`${MAZZO}/flashcard/?carte=8&seme=7`);

    // Query valida: nessuna notice, si parte da 1/8 come sempre.
    await expect(page.getByText('Sezione non trovata')).toHaveCount(0);
    await expect(page.getByText('Serie ripresa')).toHaveCount(0);
    await expect(page.getByText('1 / 8', { exact: true })).toBeVisible();

    // Le otto carte, tutte "Lo sapevo": lo storage che lancia non deve mai
    // emergere come eccezione (ogni accesso in `storage.ts` è in try/catch).
    for (let i = 0; i < 8; i += 1) {
      await giraEVotaSapevo(page);
    }

    // Completamento → R-004, nonostante lo storage indisponibile.
    await page.waitForURL(new RegExp(`${MAZZO}/risultati/?$`));
    await expect(page.locator('body')).toBeVisible();

    expect(errori).toEqual([]);
  });

  test('"← Mazzi" abbandona la corsa senza lanciare, con lo storage che lancia @critical', async ({ page }) => {
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
    await page.getByRole('link', { name: '← Mazzi' }).click();

    await page.waitForURL(/\/$/);
    expect(errori).toEqual([]);
  });
});
