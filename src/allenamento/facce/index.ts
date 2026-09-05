// src/allenamento/facce/index.ts — public entry point for the facce module
// (F-004 / FacciaCarta.prompt.md): dispatches `fronte(carta, size)` and
// `retro(carta, size)` to the right per-type module by `carta.tipo`.

import * as esempio from './esempio.ts';
import * as isom from './isom.ts';
import * as riga from './riga.ts';
import * as simbolo from './simbolo.ts';
import type { Carta, Size } from './tipi.ts';

export type { Artwork, Carta, Cella, Direzione, Esempio, Geometria, RigaDescrizione, Size, TipoCarta } from './tipi.ts';
export { cella } from './cella.ts';

type Modulo = { fronte(carta: Carta, size: Size): HTMLElement; retro(carta: Carta, size: Size): HTMLElement };

function moduloPer(carta: Carta): Modulo {
  switch (carta.tipo) {
    case 'simbolo':
      return simbolo;
    case 'riga':
      return riga;
    case 'esempio':
      return esempio;
    case 'simbolo-isom':
      return isom;
    default: {
      const mai: never = carta.tipo;
      throw new Error(`facce: tipo di carta sconosciuto: ${String(mai)}`);
    }
  }
}

/** The front of a card at the given size (FacciaCarta.prompt.md). */
export function fronte(carta: Carta, size: Size): HTMLElement {
  return moduloPer(carta).fronte(carta, size);
}

/** The back of a card at the given size (FacciaCarta.prompt.md). */
export function retro(carta: Carta, size: Size): HTMLElement {
  return moduloPer(carta).retro(carta, size);
}
