// src/pages/flashcard.ts — punto d'ingresso di R-002, una serie di flash card
// (F-002). Una sola copia serve tutti e quattro i mazzi: la pagina emessa dice
// quale, nei dati inlinati.
//
// Legge la query (`sezioni`, `carte`, `ripasso`, il seme di test), risolve le
// carte dal mazzo inlinato, riprende `orient.serie.v1` se è dello stesso
// mazzo (notice *Serie ripresa*, una volta sola — poi si torna a `default`),
// avvia la corsa con `serie.avvia`, la disegna con `flashcard-dom.ts`, la
// rispecchia sullo storage dopo ogni voto e, a completamento, accoda il
// `Risultato`, pulisce `orient.serie.v1` e naviga a `../risultati/`.
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzo">` → il `MazzoBuild` completo
//   del mazzo di questa pagina; `main#app` porta `data-titolo`, `data-mazzo`
//   (l'id del mazzo) e `data-modo="flashcard"`.

import '../styles.css';
import '../sito/preline.ts';

import { avvia, cartaAttuale, completata, gira, prossima, risultato, valuta } from '../allenamento/serie.ts';
import { makeRng, seedFromQuery } from '../allenamento/rng.ts';
import { aggiungiRisultato, leggiSerie, pulisciSerie, scriviSerie } from '../allenamento/storage.ts';
import { disegna } from '../allenamento/flashcard-dom.ts';
import type { CallbackFlashcard, NoticeFlashcard, VistaFlashcard } from '../allenamento/flashcard-dom.ts';
import type { Carta, EsitoFlashcard, MazzoBuild, Serie } from '../mazzi/tipi.ts';

/** R-002 sta sempre a `<mazzo>/flashcard/`: la home è due livelli sopra, i risultati uno sopra. */
const RADICE_MAZZI = '../../';
const RISULTATI = '../risultati/';

const app = document.getElementById('app');

/** Il `MazzoBuild` inlinato dal template (`scripts/build-mazzi.ts`), o `undefined` se mancante/corrotto. */
function leggiMazzo(): MazzoBuild | undefined {
  const script = document.getElementById('mazzo');
  if (!script?.textContent) return undefined;
  try {
    return JSON.parse(script.textContent) as MazzoBuild;
  } catch {
    return undefined;
  }
}

type QueryRisolta = { sezioni: string[]; dimensione: number | 'tutte'; invalida: boolean };

/**
 * Risolve `?sezioni=` e `?carte=` contro il mazzo: un id di sezione
 * sconosciuto o una dimensione che non è 8|12|23|tutte fa scattare
 * `invalida` e riporta **entrambi** i parametri ai default — tutte le
 * sezioni, dimensione 8 (F-002 stato `invalid-input`).
 */
function analizzaQuery(search: string, mazzo: MazzoBuild): QueryRisolta {
  const parametri = new URLSearchParams(search);
  const tutteLeSezioni = mazzo.sezioni.map((s) => s.id);
  const idsValidi = new Set(tutteLeSezioni);

  let sezioniValide = true;
  let sezioni = tutteLeSezioni;
  const grezzoSezioni = parametri.get('sezioni');
  if (grezzoSezioni) {
    const richieste = grezzoSezioni
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    sezioniValide = richieste.length > 0 && richieste.every((id) => idsValidi.has(id));
    if (sezioniValide) sezioni = richieste;
  }

  let dimensioneValida = true;
  let dimensione: number | 'tutte' = 8;
  const grezzoCarte = parametri.get('carte');
  if (grezzoCarte) {
    if (grezzoCarte === 'tutte') {
      dimensione = 'tutte';
    } else {
      const numero = Number(grezzoCarte);
      if (numero === 8 || numero === 12 || numero === 23) {
        dimensione = numero;
      } else {
        dimensioneValida = false;
      }
    }
  }

  const invalida = !sezioniValide || !dimensioneValida;
  return { sezioni: invalida ? tutteLeSezioni : sezioni, dimensione: invalida ? 8 : dimensione, invalida };
}

/** L'id di ogni carta nelle sezioni date, nell'ordine del mazzo. */
function carteDiSezioni(mazzo: MazzoBuild, sezioni: string[]): string[] {
  const scelte = new Set(sezioni);
  return mazzo.sezioni.filter((s) => scelte.has(s.id)).flatMap((s) => s.carte);
}

/**
 * Il titolo di corsa (D-002 "Content rules"): per un ripasso, *Ripasso · N
 * carte*; altrimenti *<mazzo> · tutte le sezioni* quando la selezione è
 * l'intero mazzo, *<mazzo> · <sezione>* per una sola, *<mazzo> · <a> e <b>*
 * per due, *<mazzo> · N sezioni* oltre le due.
 */
function titoloDi(mazzo: MazzoBuild, serie: Serie): string {
  if (serie.ripasso) {
    return `Ripasso · ${serie.carte.length} carte`;
  }
  const tutteLeSezioni = mazzo.sezioni.map((s) => s.id);
  const sonoTutte = tutteLeSezioni.length === serie.sezioni.length && tutteLeSezioni.every((id) => serie.sezioni.includes(id));
  if (sonoTutte) {
    return `${mazzo.nome} · tutte le sezioni`;
  }
  const etichette = serie.sezioni
    .map((id) => mazzo.sezioni.find((s) => s.id === id)?.etichetta)
    .filter((etichetta): etichetta is string => Boolean(etichetta));
  if (etichette.length === 1) return `${mazzo.nome} · ${etichette[0]}`;
  if (etichette.length === 2) return `${mazzo.nome} · ${etichette[0]} e ${etichette[1]}`;
  return `${mazzo.nome} · ${etichette.length} sezioni`;
}

/**
 * "i / N": N cresce quando un ripasso viene messo in coda (F-002 AC-3, "the
 * counter counts replays"). Le risposte della prima passata sono sempre i
 * primi `carte.length` elementi di `risposte`; `slice` su un array più
 * corto (prima passata ancora in corso) ritorna semplicemente ciò che c'è
 * finora, quindi la formula vale in ogni momento della corsa.
 */
function contatoreDi(serie: Serie): { numero: number; totale: number } {
  const persePrimaPassata = serie.risposte.slice(0, serie.carte.length).filter((r) => r.esito === 'non-sapevo').length;
  return { numero: serie.risposte.length + 1, totale: serie.carte.length + persePrimaPassata };
}

function avviaPagina(): void {
  if (!app) return;

  // sr-only: `main#app h1` con il titolo dello schermo è un contratto dello
  // smoke test (e2e/smoke.spec.ts), non un elemento del design D-002 — la
  // schermata ha già il proprio titolo di corsa nell'intestazione.
  const h1 = document.createElement('h1');
  h1.className = 'sr-only';
  h1.textContent = app.dataset.titolo ?? 'orient';
  app.appendChild(h1);

  const radice = document.createElement('div');
  app.appendChild(radice);

  const mazzo = leggiMazzo();
  const mazzoId = app.dataset.mazzo ?? mazzo?.id ?? '';

  const vaiAiMazzi = (): void => {
    pulisciSerie();
    window.location.assign(RADICE_MAZZI);
  };

  const callbackVuoto: CallbackFlashcard = { onIndietro: vaiAiMazzi, onGira: () => {}, onValuta: () => {} };

  if (!mazzo) {
    disegna(radice, { stato: 'vuota' }, callbackVuoto);
    return;
  }

  const ricerca = window.location.search;
  const vuoleRipasso = new URLSearchParams(ricerca).get('ripasso') === '1';
  const salvata = leggiSerie();
  const salvataStessoMazzo =
    salvata !== undefined && salvata.mazzo === mazzoId && salvata.modo === 'flashcard' && !completata(salvata);

  let serieCorrente: Serie;
  let noticeAttiva: NoticeFlashcard | undefined;

  if (vuoleRipasso && salvataStessoMazzo && salvata.ripasso) {
    // Scritta dalla pagina dei risultati (`daRipasso`, S-002 step 9): si usa
    // così com'è, senza notice — non è una ripresa, è l'ingresso previsto.
    serieCorrente = salvata;
  } else if (salvataStessoMazzo) {
    serieCorrente = salvata;
    noticeAttiva = 'ripresa';
  } else {
    const { sezioni, dimensione, invalida } = analizzaQuery(ricerca, mazzo);
    const pool = carteDiSezioni(mazzo, sezioni);
    if (pool.length === 0) {
      // F-002 stato `empty`: niente viene scritto in storage.
      disegna(radice, { stato: 'vuota' }, callbackVuoto);
      return;
    }
    serieCorrente = avvia({
      mazzo: mazzoId,
      sezioni,
      modo: 'flashcard',
      carte: pool,
      dimensione,
      rng: makeRng(seedFromQuery(ricerca)),
    });
    scriviSerie(serieCorrente);
    if (invalida) noticeAttiva = 'invalid-input';
  }

  function vistaCorrente(): VistaFlashcard {
    if (completata(serieCorrente)) return { stato: 'vuota' };
    const id = cartaAttuale(serieCorrente);
    const carta: Carta | undefined = id ? mazzo!.carte[id] : undefined;
    if (!carta) return { stato: 'vuota' };
    const { numero, totale } = contatoreDi(serieCorrente);
    return {
      stato: 'run',
      carta,
      girata: serieCorrente.girata,
      contatore: `${numero} / ${totale}`,
      progresso: Math.round((numero / totale) * 100),
      titoloSerie: titoloDi(mazzo!, serieCorrente),
      notice: noticeAttiva,
    };
  }

  function ridisegna(): void {
    disegna(radice, vistaCorrente(), callback);
  }

  const callback: CallbackFlashcard = {
    onIndietro: vaiAiMazzi,
    onGira(): void {
      noticeAttiva = undefined;
      serieCorrente = gira(serieCorrente);
      ridisegna();
    },
    onValuta(esito: EsitoFlashcard): void {
      noticeAttiva = undefined;
      const valutata = valuta(serieCorrente, esito);
      const avanzata = prossima(valutata);
      if (completata(avanzata)) {
        aggiungiRisultato(risultato(avanzata, new Date()));
        pulisciSerie();
        window.location.assign(RISULTATI);
        return;
      }
      serieCorrente = avanzata;
      scriviSerie(serieCorrente);
      ridisegna();
    },
  };

  ridisegna();
}

avviaPagina();
