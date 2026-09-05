// Il reducer puro di una serie (F-002 flash card, F-003 quiz): avviare un
// run, girare una carta, valutarla, avanzare, completare, e produrre il
// `Risultato` finale. Nessun DOM: le pagine di allenamento chiamano queste
// funzioni e mirrorano il valore ritornato su `storage.ts`.
//
// Meccanica della coda di ripasso: `carte` è l'ordine di mescolamento della
// prima passata. Finché `i < carte.length` si è nella prima passata; una
// volta esaurita, la carta corrente è `coda[0]` (le carte con esito
// negativo, in ordine di errore). `valuta` accoda un errore solo durante la
// prima passata e solo in modalità flash card: il quiz non ripassa gli
// errori (F-003), li elenca soltanto nel risultato.

import type { Esito, Modo, Risposta, Risultato, Serie } from '../mazzi/tipi.ts';
import type { Rng } from './rng.ts';

/** `Date` -> stringa ISO troncata al minuto (`YYYY-MM-DDTHH:mm`), mai più fine. */
export function isoAlMinuto(data: Date): string {
  return data.toISOString().slice(0, 16);
}

/** Fisher–Yates con un RNG iniettato: non muta l'array ricevuto. */
export function mescola<T>(elementi: readonly T[], rng: Rng): T[] {
  const copia = elementi.slice();
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export type AvviaInput = {
  mazzo: string;
  sezioni: string[];
  modo: Modo;
  direzione?: 'inversa';
  /** Il pool di id carta candidati (già filtrato per sezione a monte). */
  carte: string[];
  /** Quante pescarne, o `'tutte'` per l'intero pool mescolato. */
  dimensione: number | 'tutte';
  rng: Rng;
  /** Iniettabile per i test; di default l'istante corrente. */
  adesso?: Date;
};

/**
 * Avvia una serie: mescola il pool ricevuto e ne prende `dimensione` carte
 * (o tutte). L'ordine di mescolamento è l'ordine del run (AC-1 F-002).
 */
export function avvia(input: AvviaInput): Serie {
  const mescolate = mescola(input.carte, input.rng);
  const quante = input.dimensione === 'tutte'
    ? mescolate.length
    : Math.max(0, Math.min(input.dimensione, mescolate.length));
  return {
    v: 1,
    mazzo: input.mazzo,
    sezioni: input.sezioni,
    modo: input.modo,
    direzione: input.direzione,
    carte: mescolate.slice(0, quante),
    i: 0,
    risposte: [],
    coda: [],
    iniziata: isoAlMinuto(input.adesso ?? new Date()),
    girata: false,
  };
}

/** Vero mentre la serie sta ancora servendo la prima passata (non il ripasso della coda). */
function primaPassata(serie: Serie): boolean {
  return serie.i < serie.carte.length;
}

/** L'id della carta mostrata ora, o `undefined` se la serie è completata. */
export function cartaAttuale(serie: Serie): string | undefined {
  if (primaPassata(serie)) {
    return serie.carte[serie.i];
  }
  return serie.coda[0];
}

/** Gira la carta corrente (fronte ↔ retro). Non tocca nient'altro. */
export function gira(serie: Serie): Serie {
  return { ...serie, girata: !serie.girata };
}

/**
 * Valuta la carta corrente: accoda la risposta e, solo alla prima passata di
 * una serie flash card con esito `non-sapevo`, mette la carta in coda per il
 * ripasso. Un secondo errore (durante il ripasso) non viene ri-accodato; il
 * quiz non accoda mai (F-003: gli errori non vengono ripassati).
 */
export function valuta(serie: Serie, esito: Esito, scelta?: string): Serie {
  const carta = cartaAttuale(serie);
  if (carta === undefined) {
    return serie;
  }
  const risposta: Risposta = scelta === undefined ? { carta, esito } : { carta, esito, scelta };
  const primaVolta = primaPassata(serie);
  const errore = esito === 'non-sapevo' || esito === 'sbagliata';
  const daAccodare = primaVolta && serie.modo === 'flashcard' && errore;
  return {
    ...serie,
    risposte: [...serie.risposte, risposta],
    coda: daAccodare ? [...serie.coda, carta] : serie.coda,
  };
}

/**
 * Avanza alla carta successiva: nella prima passata incrementa l'indice;
 * durante il ripasso consuma la testa della coda. Torna sempre a fronte
 * (`girata: false`).
 */
export function prossima(serie: Serie): Serie {
  if (primaPassata(serie)) {
    return { ...serie, i: serie.i + 1, girata: false };
  }
  return { ...serie, coda: serie.coda.slice(1), girata: false };
}

/** Vero quando non resta nessuna carta da mostrare (prima passata finita, coda vuota). */
export function completata(serie: Serie): boolean {
  return !primaPassata(serie) && serie.coda.length === 0;
}

/**
 * Costruisce il `Risultato` di una serie completata. `viste`/`giuste`/
 * `sbagliate` contano solo la prima passata (F-002, F-003): un ripasso
 * riuscito alla coda non trasforma un errore in un successo del risultato.
 */
export function risultato(serie: Serie, adesso: Date): Risultato {
  const primaPassataRisposte = serie.risposte.slice(0, serie.carte.length);
  const giuste = primaPassataRisposte.filter(
    (r) => r.esito === 'sapevo' || r.esito === 'giusta',
  ).length;
  const sbagliate = primaPassataRisposte
    .filter((r) => r.esito === 'non-sapevo' || r.esito === 'sbagliata')
    .map((r) => r.carta);
  const base: Risultato = {
    v: 1,
    mazzo: serie.mazzo,
    sezioni: serie.sezioni,
    modo: serie.modo,
    direzione: serie.direzione,
    data: isoAlMinuto(adesso),
    viste: serie.carte.length,
    giuste,
    sbagliate,
  };
  return serie.ripasso ? { ...base, ripasso: true } : base;
}

/**
 * Costruisce una nuova serie flash card dagli errori di un risultato
 * (F-010 AC-2, "Ripassa con le carte"): le carte sono esattamente
 * `risultato.sbagliate`, **nello stesso ordine** — non rimescolate — perché
 * quell'ordine è l'ordine in cui sono stati commessi.
 */
export function daRipasso(risultato: Risultato, adesso: Date = new Date()): Serie {
  return {
    v: 1,
    mazzo: risultato.mazzo,
    sezioni: risultato.sezioni,
    modo: 'flashcard',
    direzione: risultato.direzione,
    carte: [...risultato.sbagliate],
    i: 0,
    risposte: [],
    coda: [],
    iniziata: isoAlMinuto(adesso),
    girata: false,
    ripasso: true,
  };
}
