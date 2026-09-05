// Le due chiavi di `localStorage` (architettura 003, F-002, F-010):
// `orient.serie.v1` (la serie in corso) e `orient.risultati.v1` (i risultati
// completati, ≤ 50 per mazzo). Ogni accesso è in try/catch: uno storage
// assente, bloccato o che lancia non deve mai propagare un errore al
// chiamante, e degrada silenziosamente al comportamento "niente di
// memorizzato". Un valore con `v` sbagliata o JSON non parsabile è scartato
// e trattato come assente.

import type { Risultato, Serie } from '../mazzi/tipi.ts';

const CHIAVE_SERIE = 'orient.serie.v1';
const CHIAVE_RISULTATI = 'orient.risultati.v1';
const MASSIMO_PER_MAZZO = 50;

type ContenitoreRisultati = { v: 1; risultati: Risultato[] };

/**
 * Ritorna `window.localStorage`, o lancia se non è accessibile (niente
 * `window`, storage negato dal browser, o un mock che lancia sull'accesso).
 * Ogni chiamante la usa dentro un try/catch, così l'eccezione non esce mai
 * da questo modulo.
 */
function storage(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage non disponibile');
  }
  return window.localStorage;
}

/** Vero se lo storage è leggibile e scrivibile in questo momento. */
export function disponibile(): boolean {
  try {
    const s = storage();
    const chiaveProva = '__orient_prova__';
    s.setItem(chiaveProva, '1');
    s.removeItem(chiaveProva);
    return true;
  } catch {
    return false;
  }
}

/** Legge la serie in corso, o `undefined` se assente, corrotta o di un'altra versione. */
export function leggiSerie(): Serie | undefined {
  try {
    const grezzo = storage().getItem(CHIAVE_SERIE);
    if (grezzo === null) {
      return undefined;
    }
    const valore = JSON.parse(grezzo) as Partial<Serie> | null;
    if (!valore || typeof valore !== 'object' || valore.v !== 1) {
      return undefined;
    }
    return valore as Serie;
  } catch {
    return undefined;
  }
}

/** Sovrascrive la serie in corso. Non fa nulla se lo storage non è disponibile. */
export function scriviSerie(serie: Serie): void {
  try {
    storage().setItem(CHIAVE_SERIE, JSON.stringify(serie));
  } catch {
    // Storage non disponibile: la serie resta solo in memoria.
  }
}

/** Rimuove la serie in corso (fine run, o abbandono da "← Mazzi"). */
export function pulisciSerie(): void {
  try {
    storage().removeItem(CHIAVE_SERIE);
  } catch {
    // Niente da pulire se lo storage non risponde.
  }
}

/** Legge tutti i risultati salvati (di ogni mazzo), o `[]` se assenti, corrotti o di un'altra versione. */
export function leggiRisultati(): Risultato[] {
  try {
    const grezzo = storage().getItem(CHIAVE_RISULTATI);
    if (grezzo === null) {
      return [];
    }
    const valore = JSON.parse(grezzo) as Partial<ContenitoreRisultati> | null;
    if (!valore || typeof valore !== 'object' || valore.v !== 1 || !Array.isArray(valore.risultati)) {
      return [];
    }
    return valore.risultati;
  } catch {
    return [];
  }
}

/**
 * Accoda un risultato. L'ordine complessivo resta "più vecchio prima" (i
 * risultati di ogni mazzo si intercalano nell'ordine in cui sono avvenuti);
 * quando il mazzo del nuovo risultato supera i 50, i suoi risultati più
 * vecchi vengono scartati, uno per uno, finché non rientra nel limite.
 */
export function aggiungiRisultato(risultato: Risultato): void {
  try {
    const attuali = leggiRisultati();
    const aggiornati = [...attuali, risultato];
    const totaleMazzo = aggiornati.reduce(
      (n, r) => (r.mazzo === risultato.mazzo ? n + 1 : n),
      0,
    );
    let daScartare = Math.max(0, totaleMazzo - MASSIMO_PER_MAZZO);
    const risultati = daScartare === 0
      ? aggiornati
      : aggiornati.filter((r) => {
        if (daScartare > 0 && r.mazzo === risultato.mazzo) {
          daScartare -= 1;
          return false;
        }
        return true;
      });
    storage().setItem(CHIAVE_RISULTATI, JSON.stringify({ v: 1, risultati } satisfies ContenitoreRisultati));
  } catch {
    // Il risultato non viene salvato, ma la corsa non fallisce per questo.
  }
}

/** L'ultimo risultato salvato per un mazzo, o `undefined` se non ce n'è nessuno. */
export function ultimoRisultato(mazzo: string): Risultato | undefined {
  const risultati = leggiRisultati();
  for (let i = risultati.length - 1; i >= 0; i -= 1) {
    if (risultati[i].mazzo === mazzo) {
      return risultati[i];
    }
  }
  return undefined;
}

/** Cancella entrambe le chiavi, per ogni mazzo ("Cancella i risultati"). */
export function cancellaTutto(): void {
  try {
    const s = storage();
    s.removeItem(CHIAVE_SERIE);
    s.removeItem(CHIAVE_RISULTATI);
  } catch {
    // Niente da cancellare se lo storage non risponde.
  }
}
