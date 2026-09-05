// src/pages/quiz.ts — punto d'ingresso di R-003, una serie di quiz (F-003),
// nelle due direzioni (`?direzione=inversa`). Una sola copia serve tutti e
// quattro i mazzi: la pagina emessa dice quale, nei dati inlinati.
//
// Stato e cablaggio soltanto: avvia o riprende una `Serie` in modalità quiz
// (serie.ts, storage.ts), costruisce la `Domanda` una volta per carta
// (quiz.ts, memoizzata per indice) e la mostra con
// `allenamento/quiz-dom.ts`. Nessun auto-avanzamento: solo "Avanti" muove
// la serie.
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzo">` → il `MazzoBuild` completo
//   del mazzo di questa pagina, distrattori compresi (`distrattori.perSezione`,
//   `distrattori.perColonna`); `main#app` porta `data-titolo`, `data-mazzo`
//   e `data-modo="quiz"`.

import '../styles.css';
import '../sito/preline.ts';

import type { MazzoBuild, Serie } from '../mazzi/tipi.ts';
import { opzioni, verdetto, type Domanda } from '../allenamento/quiz.ts';
import { avvia, cartaAttuale, completata, prossima, risultato, valuta } from '../allenamento/serie.ts';
import { makeRng, seedFromQuery } from '../allenamento/rng.ts';
import { aggiungiRisultato, leggiSerie, pulisciSerie, scriviSerie } from '../allenamento/storage.ts';
import { renderizza, type GestoriQuiz, type VistaQuiz } from '../allenamento/quiz-dom.ts';

const DIMENSIONE_DEFAULT = 8;

function leggiMazzo(): MazzoBuild | undefined {
  const script = document.getElementById('mazzo');
  if (!script?.textContent) return undefined;
  try {
    return JSON.parse(script.textContent) as MazzoBuild;
  } catch {
    return undefined;
  }
}

type QueryRisolta = {
  sezioni: string[];
  dimensione: number | 'tutte';
  direzione?: 'inversa';
  invalido: boolean;
};

/**
 * Risolve `?sezioni=`, `?carte=` e `?direzione=` (F-003, come F-002 AC-7):
 * un id di sezione sconosciuto o una dimensione non valida fanno ricadere
 * **entrambi** su tutte le sezioni / 8 carte / direzione diretta (D-003:
 * "invalid-input … forward direction, all sections"), con la notifica.
 */
function risolviQuery(search: string, mazzo: MazzoBuild): QueryRisolta {
  const parametri = new URLSearchParams(search);
  const idValidi = new Set(mazzo.sezioni.map((s) => s.id));
  const tutteLeSezioni = mazzo.sezioni.map((s) => s.id);

  let sezioniValide = true;
  let sezioni = tutteLeSezioni;
  const grezzoSezioni = parametri.get('sezioni');
  if (grezzoSezioni) {
    const richieste = grezzoSezioni
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const valide = richieste.filter((id) => idValidi.has(id));
    if (richieste.length > 0 && valide.length === richieste.length) {
      sezioni = valide;
    } else {
      sezioniValide = false;
    }
  }

  let carteValide = true;
  let dimensione: number | 'tutte' = DIMENSIONE_DEFAULT;
  const grezzoCarte = parametri.get('carte');
  if (grezzoCarte === 'tutte') {
    dimensione = 'tutte';
  } else if (grezzoCarte) {
    const numero = Number(grezzoCarte);
    if (Number.isInteger(numero) && numero > 0) {
      dimensione = numero;
    } else {
      carteValide = false;
    }
  }

  const invalido = !sezioniValide || !carteValide;
  const direzione = !invalido && parametri.get('direzione') === 'inversa' ? 'inversa' : undefined;

  return {
    sezioni: invalido ? tutteLeSezioni : sezioni,
    dimensione: invalido ? DIMENSIONE_DEFAULT : dimensione,
    direzione,
    invalido,
  };
}

/** Gli id carta delle sezioni risolte, senza duplicati. */
function poolCarte(mazzo: MazzoBuild, sezioniIds: string[]): string[] {
  const insieme = new Set<string>();
  for (const id of sezioniIds) {
    const sezione = mazzo.sezioni.find((s) => s.id === id);
    if (!sezione) continue;
    for (const cartaId of sezione.carte) insieme.add(cartaId);
  }
  return [...insieme];
}

/** Il titolo del run (F-002): "<mazzo> · <sezione>[, <sezione>]", o "N sezioni" oltre le due. */
function titoloSerieDi(mazzo: MazzoBuild, sezioniIds: string[]): string {
  if (sezioniIds.length > 2) {
    return `${sezioniIds.length} sezioni`;
  }
  const etichette = sezioniIds
    .map((id) => mazzo.sezioni.find((s) => s.id === id)?.etichetta)
    .filter((etichetta): etichetta is string => Boolean(etichetta));
  return etichette.length > 0 ? `${mazzo.nome} · ${etichette.join(', ')}` : mazzo.nome;
}

function main(): void {
  const app = document.getElementById('app');
  const datiMazzo = leggiMazzo();
  if (!app || !datiMazzo) return;
  // Tipizzato esplicitamente (non `MazzoBuild | undefined`): le funzioni
  // annidate sotto catturano `mazzo` in chiusura, dove il narrowing del
  // controllo sopra non si propaga.
  const mazzo: MazzoBuild = datiMazzo;

  // L'h1 (fuori dalla vista del quiz vera e propria: il design non ne ha
  // uno visibile) porta il titolo di pagina per l'a11y e per lo smoke F-006
  // AC-1, che cerca `main#app h1`.
  const h1 = document.createElement('h1');
  h1.className = 'sr-only';
  h1.textContent = app.dataset.titolo ?? 'orient';
  app.appendChild(h1);

  const contenitore = document.createElement('div');
  contenitore.style.display = 'flex';
  contenitore.style.flexDirection = 'column';
  contenitore.style.flex = '1';
  app.appendChild(contenitore);

  const rng = makeRng(seedFromQuery(location.search));

  let serie: Serie;
  let notificaIniziale: 'ripresa' | 'invalid-input' | undefined;

  const esistente = leggiSerie();
  if (esistente && esistente.mazzo === mazzo.id && esistente.modo === 'quiz') {
    // F-002 AC-5/D-003 "ripresa": una serie in corso per questo stesso mazzo
    // e modalità riprende alla stessa carta, nella direzione con cui era
    // stata avviata — la query viene ignorata.
    serie = esistente;
    notificaIniziale = 'ripresa';
  } else {
    const query = risolviQuery(location.search, mazzo);
    const pool = poolCarte(mazzo, query.sezioni);
    if (pool.length === 0) {
      renderizza(
        contenitore,
        { stato: 'vuoto' },
        { onScegli: () => {}, onAvanti: () => {}, onTornaAiMazzi: () => pulisciSerie() },
      );
      return;
    }
    serie = avvia({
      mazzo: mazzo.id,
      sezioni: query.sezioni,
      modo: 'quiz',
      direzione: query.direzione,
      carte: pool,
      dimensione: query.dimensione,
      rng,
    });
    scriviSerie(serie);
    notificaIniziale = query.invalido ? 'invalid-input' : undefined;
  }

  // Le opzioni di una domanda si costruiscono una sola volta per indice del
  // run (memoizzate): un nuovo giro di render (dopo una scelta, o "Avanti")
  // non deve ripescare nuovi distrattori per la stessa carta.
  const domandeCache = new Map<number, Domanda>();
  let notificaMostrata = notificaIniziale;
  let sceltaCorrente: string | undefined;

  function domandaCorrente(): Domanda {
    const indice = serie.i;
    const inCache = domandeCache.get(indice);
    if (inCache) return inCache;
    const idCarta = cartaAttuale(serie);
    if (idCarta === undefined) {
      throw new Error('quiz: nessuna carta corrente nella serie');
    }
    const carta = mazzo.carte[idCarta];
    const direzione = serie.direzione === 'inversa' ? 'inversa' : 'diretta';
    const domanda = opzioni(carta, mazzo, rng, direzione);
    domandeCache.set(indice, domanda);
    return domanda;
  }

  function renderizzaStato(): void {
    const domanda = domandaCorrente();
    const vista: VistaQuiz = {
      stato: 'domanda',
      mazzo,
      domanda,
      scelta: sceltaCorrente,
      contatore: `${serie.i + 1} / ${serie.carte.length}`,
      progresso: serie.carte.length === 0 ? 0 : Math.round((serie.i / serie.carte.length) * 100),
      titoloSerie: titoloSerieDi(mazzo, serie.sezioni),
      notifica: notificaMostrata,
      ultima: serie.i === serie.carte.length - 1,
    };
    renderizza(contenitore, vista, gestori);
    // La notifica di ripresa / input non valido si mostra una sola volta.
    notificaMostrata = undefined;
  }

  const gestori: GestoriQuiz = {
    onScegli(idCarta) {
      // F-003 AC-3: un secondo tocco su un'opzione non fa nulla — la scelta
      // è già registrata, quindi ogni chiamata successiva è un no-op.
      if (sceltaCorrente !== undefined) return;
      const domanda = domandaCorrente();
      const cartaInterrogata = mazzo.carte[domanda.carta];
      const esito = verdetto(cartaInterrogata, idCarta);
      sceltaCorrente = idCarta;
      serie = valuta(serie, esito, idCarta);
      scriviSerie(serie);
      renderizzaStato();
    },
    onAvanti() {
      serie = prossima(serie);
      sceltaCorrente = undefined;
      if (completata(serie)) {
        aggiungiRisultato(risultato(serie, new Date()));
        pulisciSerie();
        location.href = '../risultati/';
        return;
      }
      scriviSerie(serie);
      renderizzaStato();
    },
    onTornaAiMazzi() {
      pulisciSerie();
    },
  };

  renderizzaStato();
}

main();
