// e2e/journeys/quiz-con-ripasso.spec.ts — S-002 "Quiz sulla colonna G e
// ripasso degli errori con le carte" (akaaso/05-stories/002-quiz-con-ripasso-degli-errori.md),
// contro il sito costruito servito da `vite preview` (F-001, F-003, F-004,
// F-010, F-002, F-006). La corsa principale segue gli undici Journey Steps
// della storia, nell'ordine, ognuno marcato con un commento
// `// step N — <affordance>` che riprende letteralmente la colonna
// "Transition in" della tabella; le sette Variants applicabili seguono, una
// per test.
//
// Nessuna scelta è cablata: la carta corrente e il suo nome corretto si
// leggono sempre a runtime da `#mazzo` (il `MazzoBuild` inlinato) e da
// `orient.serie.v1` (`localStorage`), esattamente come farebbe un umano che
// guarda lo schermo — la corsa principale non usa `?seme=`, perché il suo
// percorso (Home → "Inizia · 12 carte") deve riprodurre esattamente l'URL
// del passo 3 della storia, senza query aggiuntive.
//
// Difformità applicazione/storia trovate mentre si scriveva questo file
// (mai corrette qui — "never change application code"):
//
//   1. Sezione piccola "colonna-f" (2 carte): `poolDistrattori`
//      (src/allenamento/quiz.ts) ricade sulla colonna quando la sezione ha
//      meno di 3 alternative, ma si ferma lì anche quando quel pool resta
//      insufficiente (`colonna.length > 0` non richiede `>= 3`) invece di
//      ricadere sull'intero mazzo: un quiz su "colonna-f" mostra due sole
//      opzioni, non quattro. La Variant "Small section" del test usa invece
//      "d-particolari" (2 carte, stesso nome ripetuto), che passa dalla
//      colonna D e trova lì abbastanza nomi distinti — comportamento
//      corretto, verificato qui.
//   2. Variant `invalid-input` della storia: "`?direzione=sideways` →
//      Notice; forward direction used". Risolto in wave 5: `risolviQuery`
//      tratta una `direzione` sconosciuta come input non valido, con la
//      stessa notice e gli stessi default di sezioni/carte non validi.

import { expect, test, type Page } from '@playwright/test';
import type { MazzoBuild, Risultato, Serie } from '../../src/mazzi/tipi.ts';

const MAZZO = 'descrizioni-simboli';
const SEZIONE_G = 'Colonna G – Posizione della lanterna';
const CHIAVE_SERIE = 'orient.serie.v1';
const CHIAVE_RISULTATI = 'orient.risultati.v1';

// ---------------------------------------------------------------- helper

function osservaErrori(page: Page): string[] {
  const errori: string[] = [];
  page.on('pageerror', (errore) => errori.push(errore.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errori.push(msg.text());
  });
  return errori;
}

/** Ogni richiesta della pagina, per l'asserzione "nessuna richiesta fuori origine". */
function tracciaRichieste(page: Page): string[] {
  const richieste: string[] = [];
  page.on('request', (richiesta) => richieste.push(richiesta.url()));
  return richieste;
}

function assertNessunaRichiestaFuoriOrigine(page: Page, richieste: string[]): void {
  const origine = new URL(page.url()).origin;
  for (const url of richieste) {
    expect(new URL(url).origin, `richiesta fuori origine: ${url}`).toBe(origine);
  }
}

/**
 * Verifica che il percorso corrente finisca con `suffisso`, indipendentemente
 * dal `VITE_BASE` con cui il sito è stato costruito (`/` o `/orient/`): il
 * confronto è sul suffisso, non sul percorso assoluto.
 */
function assertPercorsoFinisceCon(page: Page, suffisso: string): void {
  const pathname = new URL(page.url()).pathname;
  expect(pathname.endsWith(suffisso), `percorso "${pathname}" non finisce con "${suffisso}"`).toBe(true);
}

/** Le quattro opzioni della domanda corrente (righe in avanti, tessere in inversa). */
function opzioniBottoni(page: Page) {
  return page.locator('main#app button');
}

/** Il `MazzoBuild` inlinato in `<script id="mazzo">` — stessa fonte che legge la pagina. */
async function leggiMazzoDalDom(page: Page): Promise<MazzoBuild> {
  return page.evaluate(() => JSON.parse(document.getElementById('mazzo')!.textContent!) as MazzoBuild);
}

async function leggiSerieDalloStorage(page: Page): Promise<Serie | null> {
  return page.evaluate(
    (chiave) => {
      const grezzo = window.localStorage.getItem(chiave);
      return grezzo ? (JSON.parse(grezzo) as Serie) : null;
    },
    CHIAVE_SERIE,
  );
}

async function leggiRisultatiDalMazzo(page: Page, mazzo = MAZZO): Promise<Risultato[]> {
  return page.evaluate(
    ([chiave, idMazzo]) => {
      const grezzo = window.localStorage.getItem(chiave);
      if (!grezzo) return [];
      const contenitore = JSON.parse(grezzo) as { risultati?: Risultato[] };
      return (contenitore.risultati ?? []).filter((r) => r.mazzo === idMazzo);
    },
    [CHIAVE_RISULTATI, mazzo] as const,
  );
}

/** La carta interrogata ora: id e nome corretto, letti da `#mazzo` + `orient.serie.v1`. */
async function cartaCorrente(page: Page): Promise<{ id: string; nome: string }> {
  return page.evaluate(() => {
    const mazzo = JSON.parse(document.getElementById('mazzo')!.textContent!) as MazzoBuild;
    const serie = JSON.parse(window.localStorage.getItem('orient.serie.v1')!) as Serie;
    const id = serie.carte[serie.i];
    const carta = mazzo.carte[id];
    return { id, nome: carta.simbolo!.nome };
  });
}

/** Il tocco che gira la carta corrente in una serie flash card (flashcard-dom.ts). */
function cartaFlashcard(page: Page) {
  return page.locator('[role="button"][aria-label^="Carta"]');
}

// ============================================================= la corsa

test.describe('S-002 — Quiz sulla colonna G e ripasso degli errori con le carte @critical', () => {
  test('la corsa completa: quiz su Colonna G, 9/12, ripasso dei tre errori con le carte, risultati e home @critical', async ({
    page,
  }) => {
    const errori = osservaErrori(page);
    const richieste = tracciaRichieste(page);

    // step 1 — entry point
    await page.goto('./');
    await expect(page.locator('.orient-mazzo__nome').first()).toBeVisible();

    // step 2 — change the picker
    const caselle = page.locator('.orient-mazzo').first().locator('.orient-checkbox input');
    const nCaselle = await caselle.count();
    for (let i = 0; i < nCaselle; i += 1) await caselle.nth(i).uncheck({ force: true });
    await page
      .locator('.orient-riga', { hasText: SEZIONE_G })
      .locator('input')
      .check({ force: true });
    await page.locator('input[name="modo"][value="quiz"]').check({ force: true });
    // "Simbolo → nome" è la direzione diretta, già selezionata di default.
    await expect(page.locator('input[name="direzione"][value="diretta"]')).toBeChecked();
    await page.locator('input[name="carte"][value="12"]').check({ force: true });
    const bottoneInizia = page.locator('.orient-inizia');
    await expect(bottoneInizia).toHaveText('Inizia · 12 carte');

    // step 3 — tap "Inizia" in modalità Quiz
    await bottoneInizia.click();
    await page.waitForURL('**/descrizioni-simboli/quiz/**');
    const urlQuiz = new URL(page.url());
    expect(urlQuiz.pathname.endsWith('/descrizioni-simboli/quiz/')).toBe(true);
    expect(urlQuiz.searchParams.get('sezioni')).toBe('colonna-g');
    expect(urlQuiz.searchParams.get('carte')).toBe('12');
    expect(urlQuiz.searchParams.has('direzione')).toBe(false);
    await expect(page.getByText('Quale oggetto?')).toBeVisible();

    const TOTALE = 12;
    const indiciSbagliati = new Set([0, 1, 2]); // esattamente tre errori forzati, su dodici

    /** Legge la domanda corrente: quattro nomi distinti, uno la carta interrogata. */
    async function leggiDomanda(): Promise<{ testi: string[]; info: { id: string; nome: string } }> {
      const opzioni = opzioniBottoni(page);
      await expect(opzioni).toHaveCount(4);
      const testi = await opzioni.allTextContents();
      expect(new Set(testi).size, `nomi non distinti: ${testi.join(', ')}`).toBe(4);
      const info = await cartaCorrente(page);
      expect(testi).toContain(info.nome);
      return { testi, info };
    }

    /** Sceglie giusta o sbagliata, verifica il verdetto al primo tocco, nessun avanzamento automatico. */
    async function rispondi(indiceDomanda: number): Promise<void> {
      const { testi, info } = await leggiDomanda();
      const sbagliare = indiciSbagliati.has(indiceDomanda);
      const opzioni = opzioniBottoni(page);
      const indiceScelta = sbagliare ? testi.findIndex((t) => t !== info.nome) : testi.indexOf(info.nome);
      expect(indiceScelta).toBeGreaterThanOrEqual(0);

      await opzioni.nth(indiceScelta).click();

      // Il verdetto appare al primo tocco, senza un secondo giro.
      if (sbagliare) {
        await expect(page.getByText(`Sbagliato — ${info.nome}`)).toBeVisible();
      } else {
        await expect(page.getByText('Giusto', { exact: true })).toBeVisible();
      }
      for (let i = 0; i < 4; i += 1) {
        await expect(opzioni.nth(i)).toBeDisabled();
      }
      // Nessun avanzamento automatico: si resta sulla pagina del quiz finché non si tocca il bottone.
      assertPercorsoFinisceCon(page, '/descrizioni-simboli/quiz/');
    }

    async function avanti(ultima: boolean): Promise<void> {
      const bottone = page.getByRole('button', { name: ultima ? 'Vedi il risultato' : 'Avanti' });
      await expect(bottone).toBeVisible();
      await bottone.click();
    }

    // step 4 — pick an option (prima domanda)
    await rispondi(0);

    // step 5 — tap "Avanti" (undici volte, una per ognuna delle domande 1..11: ogni tap
    // lascia la domanda appena risposta e ne mostra una nuova da rispondere; il dodicesimo
    // e ultimo tap, dopo la dodicesima domanda, legge "Vedi il risultato" e chiude la serie)
    for (let indiceDomanda = 0; indiceDomanda < TOTALE; indiceDomanda += 1) {
      const ultima = indiceDomanda === TOTALE - 1;
      await avanti(ultima); // lascia `indiceDomanda`, già risposta
      if (!ultima) {
        await rispondi(indiceDomanda + 1);
      }
    }

    // step 6 — completion of the run
    await page.waitForURL('**/descrizioni-simboli/risultati/**');
    assertPercorsoFinisceCon(page, '/descrizioni-simboli/risultati/');
    await expect(page.getByRole('heading', { name: 'Quiz completato' })).toBeVisible();
    await expect(page.locator('[data-riga="punteggio"]')).toHaveText('9 / 12');
    await expect(page.getByText('risposte corrette')).toBeVisible();
    const righeErrore = page.locator('[data-riga="errore"]');
    await expect(righeErrore).toHaveCount(3);

    const risultatiDopoQuiz = await leggiRisultatiDalMazzo(page);
    expect(risultatiDopoQuiz).toHaveLength(1);
    const risultatoQuiz = risultatiDopoQuiz[0];
    expect(risultatoQuiz.modo).toBe('quiz');
    expect(risultatoQuiz.giuste).toBe(9);
    expect(risultatoQuiz.viste).toBe(12);
    expect(risultatoQuiz.sbagliate).toHaveLength(3);
    expect(risultatoQuiz.ripasso).toBeFalsy();
    const idErrori = risultatoQuiz.sbagliate;

    // step 7 — tap a miss row
    await righeErrore.first().click();
    const foglio = page.getByRole('dialog', { name: 'Da ripassare' });
    await expect(foglio).toBeVisible();
    await expect(foglio.getByRole('button', { name: 'Chiudi' })).toBeVisible();

    // step 8 — tap "Chiudi"
    await foglio.getByRole('button', { name: 'Chiudi' }).click();
    await expect(foglio).toHaveCount(0);

    // step 9 — tap "Ripassa con le carte"
    await page.getByRole('button', { name: 'Ripassa con le carte' }).click();
    await page.waitForURL('**/descrizioni-simboli/flashcard/?ripasso=1');
    assertPercorsoFinisceCon(page, '/descrizioni-simboli/flashcard/');

    const serieRipasso = await leggiSerieDalloStorage(page);
    expect(serieRipasso).not.toBeNull();
    expect(serieRipasso!.mazzo).toBe(MAZZO);
    expect(serieRipasso!.modo).toBe('flashcard');
    expect(serieRipasso!.ripasso).toBe(true);
    expect(serieRipasso!.carte).toEqual(idErrori);

    await expect(page.getByText('Ripasso · 3 carte')).toBeVisible();

    // step 10 — tap the card (gira e vota le tre carte)
    for (let i = 0; i < 3; i += 1) {
      await expect(cartaFlashcard(page)).toBeVisible();
      await cartaFlashcard(page).click();
      await page.getByRole('button', { name: 'Lo sapevo', exact: true }).click();
    }

    // step 11 — completion of the run
    await page.waitForURL('**/descrizioni-simboli/risultati/**');
    assertPercorsoFinisceCon(page, '/descrizioni-simboli/risultati/');

    const risultatiFinali = await leggiRisultatiDalMazzo(page);
    expect(risultatiFinali).toHaveLength(2);
    expect(risultatiFinali[0].ripasso).toBeFalsy();
    expect(risultatiFinali[1].ripasso).toBe(true);
    expect(risultatiFinali[1].giuste).toBe(3);
    expect(risultatiFinali[1].viste).toBe(3);
    expect(risultatiFinali[1].sbagliate).toEqual([]);

    // Lo storico elenca entrambi i run, il più recente (il ripasso) per primo.
    await expect(page.locator('[data-riga="storico"]')).toHaveCount(2);
    await expect(page.locator('[data-riga="storico"]').first()).toContainText('ripasso');

    // Expected Outcomes: la riga del mazzo in home mostra il punteggio del ripasso, l'ultimo run.
    await page.goto('./');
    const rigaUltimo = page.locator('.orient-mazzo').first().locator('.orient-mazzo__ultimo');
    await expect(rigaUltimo).toContainText('Ultima serie 3 / 3 · flash card');

    assertNessunaRichiestaFuoriOrigine(page, richieste);
    expect(errori).toEqual([]);
  });
});

// ============================================================= variants

test.describe('S-002 — Variants', () => {
  test('verdetto: una scelta blocca le opzioni, mostra le marche e il pannello con la definizione, poi "Avanti" @critical', async ({
    page,
  }) => {
    const errori = osservaErrori(page);
    await page.goto(`${MAZZO}/quiz/?sezioni=colonna-g&carte=2`);

    const info = await cartaCorrente(page);
    const mazzo = await leggiMazzoDalDom(page);
    const definizione = mazzo.carte[info.id].simbolo!.descrizione;

    const opzioni = opzioniBottoni(page);
    await expect(opzioni).toHaveCount(4);
    const testi = await opzioni.allTextContents();
    await opzioni.nth(testi.indexOf(info.nome)).click();

    await expect(page.getByText('Giusto', { exact: true })).toBeVisible();
    await expect(page.getByText(definizione)).toBeVisible();
    for (let i = 0; i < 4; i += 1) {
      await expect(opzioni.nth(i)).toBeDisabled();
    }
    await expect(page.getByRole('button', { name: 'Avanti' })).toBeVisible();
    expect(errori).toEqual([]);
  });

  test('nessun-errore: tutte le risposte giuste mostrano la notice teal e nessun "Ripassa con le carte" @critical', async ({
    page,
  }) => {
    const errori = osservaErrori(page);
    await page.goto(`${MAZZO}/quiz/?sezioni=colonna-g&carte=4`);

    for (let indice = 0; indice < 4; indice += 1) {
      const opzioni = opzioniBottoni(page);
      await expect(opzioni).toHaveCount(4);
      const testi = await opzioni.allTextContents();
      const info = await cartaCorrente(page);
      await opzioni.nth(testi.indexOf(info.nome)).click();
      await expect(page.getByText('Giusto', { exact: true })).toBeVisible();
      const ultima = indice === 3;
      await page.getByRole('button', { name: ultima ? 'Vedi il risultato' : 'Avanti' }).click();
    }

    await page.waitForURL('**/descrizioni-simboli/risultati/**');
    await expect(page.getByText('Nessun errore in questa serie')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ripassa con le carte' })).toHaveCount(0);
    expect(errori).toEqual([]);
  });

  test('Reverse direction: prompt col nome, quattro tessere, direzione=inversa nell’URL e nel Risultato @critical', async ({
    page,
  }) => {
    const errori = osservaErrori(page);
    await page.goto(`${MAZZO}/quiz/?sezioni=colonna-g&carte=3&direzione=inversa`);

    expect(new URL(page.url()).searchParams.get('direzione')).toBe('inversa');
    await expect(page.getByText('Quale simbolo?')).toBeVisible();
    const info = await cartaCorrente(page);
    await expect(page.getByText(info.nome, { exact: true })).toBeVisible();

    const tessere = opzioniBottoni(page);
    await expect(tessere).toHaveCount(4);
    await expect(page.locator('main#app button svg')).toHaveCount(4);

    for (let indice = 0; indice < 3; indice += 1) {
      await opzioniBottoni(page).nth(0).click();
      const ultima = indice === 2;
      await page.getByRole('button', { name: ultima ? 'Vedi il risultato' : 'Avanti' }).click();
    }

    await page.waitForURL('**/descrizioni-simboli/risultati/**');
    const risultati = await leggiRisultatiDalMazzo(page);
    expect(risultati.at(-1)?.direzione).toBe('inversa');
    expect(errori).toEqual([]);
  });

  test('ripresa: un reload dopo il tap su "Avanti" mostra la domanda 2 non risposta, direzione preservata @critical', async ({
    page,
  }) => {
    const errori = osservaErrori(page);
    await page.goto(`${MAZZO}/quiz/?sezioni=colonna-g&carte=3&direzione=inversa`);

    await expect(page.getByText('Quale simbolo?')).toBeVisible();
    await opzioniBottoni(page).nth(0).click();
    await page.getByRole('button', { name: 'Avanti' }).click();

    // Ora sulla domanda 2 (indice 1), non ancora risposta.
    const infoPrima = await cartaCorrente(page);
    await expect(opzioniBottoni(page)).toHaveCount(4);

    await page.reload();

    await expect(page.getByText('Serie ripresa')).toBeVisible();
    await expect(page.getByText('Quale simbolo?')).toBeVisible(); // direzione preservata
    const infoDopo = await cartaCorrente(page);
    expect(infoDopo.id).toBe(infoPrima.id); // stessa domanda 2, non la 3

    const opzioniDopo = opzioniBottoni(page);
    await expect(opzioniDopo).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      await expect(opzioniDopo.nth(i)).toBeEnabled(); // non risposta
    }
    expect(errori).toEqual([]);
  });

  test('invalid-input: un valore di direzione sconosciuto usa la direzione diretta, sezioni/carte richieste restano valide @critical', async ({
    page,
  }) => {
    // D-003 `invalid-input`: una `direzione` sconosciuta è input non valido
    // come una sezione o una dimensione sconosciuta — Alert, tutte le
    // sezioni, 8 carte, direzione diretta (fix di integrazione wave 5).
    const errori = osservaErrori(page);
    await page.goto(`${MAZZO}/quiz/?direzione=sideways&sezioni=colonna-g&carte=12`);

    await expect(page.getByText('Sezione non trovata')).toBeVisible();
    await expect(page.getByText('Quale oggetto?')).toBeVisible(); // direzione diretta (forward)
    await expect(page.getByText('1 / 8', { exact: true })).toBeVisible(); // ricade su 8 carte
    await expect(page.getByText('tutte le sezioni')).toBeVisible(); // ricade su tutte le sezioni
    expect(errori).toEqual([]);
  });

  test('Small section: una sezione con meno di quattro carte (d-particolari) offre comunque quattro distrattori distinti, mai da un altro mazzo @critical', async ({
    page,
  }) => {
    const errori = osservaErrori(page);
    await page.goto(`${MAZZO}/quiz/?sezioni=d-particolari&carte=2`);

    const mazzo = await leggiMazzoDalDom(page);
    const nomiDelMazzo = new Set(
      Object.values(mazzo.carte)
        .map((c) => c.simbolo?.nome)
        .filter((n): n is string => Boolean(n)),
    );

    const opzioni = opzioniBottoni(page);
    await expect(opzioni).toHaveCount(4);
    const testi = await opzioni.allTextContents();
    expect(new Set(testi).size, `nomi non distinti: ${testi.join(', ')}`).toBe(4);
    for (const nome of testi) {
      expect(nomiDelMazzo.has(nome), `"${nome}" non appartiene al mazzo ${MAZZO}`).toBe(true);
    }
    const info = await cartaCorrente(page);
    expect(testi).toContain(info.nome);
    expect(errori).toEqual([]);
  });
});
