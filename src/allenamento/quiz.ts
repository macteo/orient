// Costruzione delle opzioni del quiz e verdetto (F-003). Nessun DOM: la
// pagina quiz chiama `opzioni` per ogni domanda e `verdetto` alla scelta.

import type { Carta, MazzoBuild } from '../mazzi/tipi.ts';
import type { Rng } from './rng.ts';
import { mescola } from './serie.ts';

/** Una domanda pronta per essere renderizzata: 4 id carta, l'indice del giusto. */
export type Domanda = {
  carta: string;
  direzione: 'diretta' | 'inversa';
  opzioni: string[];
  giusta: number;
};

/** Il nome mostrato di una carta, per tipo — mai lo stesso due volte tra le opzioni. */
function nomeCarta(carta: Carta): string {
  switch (carta.tipo) {
    case 'simbolo':
      return carta.simbolo?.nome ?? carta.id;
    case 'simbolo-isom':
      return carta.isom?.nome ?? carta.id;
    case 'riga':
      return carta.riga?.codice ?? carta.id;
    case 'esempio':
      return carta.esempio?.codice ?? carta.id;
    default:
      return carta.id;
  }
}

/** Le altre carte della stessa sezione (senza la carta stessa). */
function poolSezione(carta: Carta, mazzo: MazzoBuild): string[] {
  const sezione = mazzo.distrattori.perSezione[carta.sezione] ?? [];
  return sezione.filter((id) => id !== carta.id);
}

/** Le altre carte della stessa colonna (solo `descrizioni-simboli`), se il mazzo ne tiene traccia. */
function poolColonna(carta: Carta, mazzo: MazzoBuild): string[] {
  const perColonna = mazzo.distrattori.perColonna;
  if (!perColonna) {
    return [];
  }
  for (const ids of Object.values(perColonna)) {
    if (ids.includes(carta.id)) {
      const altri = ids.filter((id) => id !== carta.id);
      if (altri.length > 0) {
        return altri;
      }
    }
  }
  return [];
}

/** L'intero mazzo (senza la carta stessa) — mai un altro mazzo. */
function poolMazzo(carta: Carta, mazzo: MazzoBuild): string[] {
  return Object.keys(mazzo.carte).filter((id) => id !== carta.id);
}

/**
 * Il pool da cui pescare i distrattori (F-003 AC-2): la sezione se ha almeno
 * 3 altre carte, altrimenti la colonna quando il mazzo ne definisce una per
 * questa carta, altrimenti l'intero mazzo. Mai da un altro mazzo.
 */
function poolDistrattori(carta: Carta, mazzo: MazzoBuild): string[] {
  const sezione = poolSezione(carta, mazzo);
  if (sezione.length >= 3) {
    return sezione;
  }
  const colonna = poolColonna(carta, mazzo);
  if (colonna.length >= 3) {
    return colonna;
  }
  // Section and column too small (e.g. colonna-f has two cards): the deck.
  return poolMazzo(carta, mazzo);
}

/** Sceglie fino a 3 distrattori dal pool, mai con lo stesso nome tra loro o della carta giusta. */
function scegliDistrattori(carta: Carta, mazzo: MazzoBuild, pool: string[], rng: Rng): string[] {
  const nomiUsati = new Set([nomeCarta(carta)]);
  const scelti: string[] = [];
  for (const id of mescola(pool, rng)) {
    if (scelti.length === 3) {
      break;
    }
    const altra = mazzo.carte[id];
    if (!altra) {
      continue;
    }
    const nome = nomeCarta(altra);
    if (nomiUsati.has(nome)) {
      continue;
    }
    nomiUsati.add(nome);
    scelti.push(id);
  }
  return scelti;
}

/**
 * Costruisce una domanda: 4 id distinti (la carta + fino a 3 distrattori),
 * mai lo stesso nome due volte, posizione della risposta uniforme
 * (F-003 AC-1).
 */
export function opzioni(
  carta: Carta,
  mazzo: MazzoBuild,
  rng: Rng,
  direzione: 'diretta' | 'inversa' = 'diretta',
): Domanda {
  const distrattori = scegliDistrattori(carta, mazzo, poolDistrattori(carta, mazzo), rng);
  const posizione = Math.floor(rng() * (distrattori.length + 1));
  const opzioniCarte = distrattori.slice();
  opzioniCarte.splice(posizione, 0, carta.id);
  return { carta: carta.id, direzione, opzioni: opzioniCarte, giusta: posizione };
}

/** Il verdetto di una scelta: giusta solo se coincide con l'id della carta interrogata. */
export function verdetto(carta: Carta, scelta: string): 'giusta' | 'sbagliata' {
  return scelta === carta.id ? 'giusta' : 'sbagliata';
}
