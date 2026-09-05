// e2e/quiz.spec.ts — F-003: due criteri di accettazione che non sono
// esercitabili in jsdom perché richiedono un vero reload di pagina e un vero
// storage di dominio:
//
//   AC-3 "un secondo tap su un'opzione non fa nulla" — una volta scelta,
//   l'opzione è disabilitata: un secondo tap (anche forzato) non deve
//   cambiare né il verdetto mostrato né la scelta registrata.
//   AC-6 "una serie avviata con `?direzione=inversa` riprende in inversa
//   dopo il reload" — anche quando l'URL del reload non porta più la query,
//   perché a governare è la `Serie` salvata (`orient.serie.v1`), non la
//   query letta di nuovo.
//
// Richiede una build con seme di test attivo (`VITE_TEST_SEED=1 npm run
// build`), così `?seme=<n>` rende ogni run deterministico.

import { expect, test } from '@playwright/test';

test.describe('Quiz — F-003', () => {
  test('AC-3: un secondo tap su un’opzione non fa nulla', async ({ page }) => {
    const erroriConsole: string[] = [];
    page.on('pageerror', (errore) => erroriConsole.push(errore.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroriConsole.push(msg.text());
    });

    await page.goto('descrizioni-simboli/quiz/?sezioni=d-particolari&carte=2&seme=1');

    const bottoniOpzione = page.locator('main#app button');
    await expect(bottoniOpzione).toHaveCount(4);

    // Prima scelta: il verdetto appare, le opzioni si bloccano.
    await bottoniOpzione.nth(0).click();
    await expect(page.getByRole('button', { name: /^(Avanti|Vedi il risultato)$/ })).toBeVisible();
    for (let i = 0; i < 4; i += 1) {
      await expect(bottoniOpzione.nth(i)).toBeDisabled();
    }
    const contenutoDopoPrimaScelta = await page.locator('main#app').innerText();

    // Un secondo tap, su un'opzione diversa, forzato oltre il controllo di
    // "abilitato" di Playwright: un bottone `disabled` non genera comunque
    // un evento click nel browser, quindi lo stato deve restare identico.
    await bottoniOpzione.nth(1).click({ force: true });
    await bottoniOpzione.nth(0).click({ force: true });
    const contenutoDopoSecondoTap = await page.locator('main#app').innerText();

    expect(contenutoDopoSecondoTap).toBe(contenutoDopoPrimaScelta);
    expect(erroriConsole).toEqual([]);
  });

  test('AC-6: una serie avviata con ?direzione=inversa riprende in inversa dopo il reload', async ({ page }) => {
    await page.goto('isom/quiz/?direzione=inversa&sezioni=forme&carte=3&seme=7');

    // In inversa il prompt è "Quale simbolo?" e le opzioni sono tessere con
    // un'immagine ciascuna, non righe di solo testo.
    await expect(page.getByText('Quale simbolo?')).toBeVisible();
    await expect(page.locator('main#app img')).toHaveCount(4);

    // Si torna alla stessa pagina senza query: la ripresa deve venire dalla
    // `Serie` salvata, non da un `?direzione=inversa` riletto dall'URL.
    await page.goto('isom/quiz/');

    await expect(page.getByText('Serie ripresa')).toBeVisible();
    await expect(page.getByText('Quale simbolo?')).toBeVisible();
    await expect(page.locator('main#app img')).toHaveCount(4);
  });
});
