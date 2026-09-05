// src/allenamento/facce/simbolo.ts — `simbolo` card type (descrizioni-simboli
// deck), F-004 / FacciaCarta.prompt.md: "front = pictogram SVG, black,
// centred on a white surface with a hairline border; back = small
// pictogram, reference Badge, name, definition."

import { badge, blocchettoLista, cella, superficie, testo } from './cella.ts';
import type { Carta, Size } from './tipi.ts';

/** Pictogram pixel size per size variant: back is always smaller than front
 * (it must leave room for the badge/name/definition below it) — see the
 * approved artboards' front (148px) vs back (64px) pictogram, and the quiz
 * tile artboard's 72px tile pictogram. */
const PITTOGRAMMA_PX: Record<Size, { fronte: number; retro: number }> = {
  carta: { fronte: 148, retro: 64 },
  tile: { fronte: 72, retro: 32 },
  lista: { fronte: 40, retro: 40 },
};

function richiediSimbolo(carta: Carta): NonNullable<Carta['simbolo']> {
  if (!carta.simbolo) throw new Error(`facce/simbolo: la carta ${carta.id} non ha il campo simbolo`);
  return carta.simbolo;
}

function pittogramma(simbolo: NonNullable<Carta['simbolo']>, px: number): SVGSVGElement {
  const svg = cella(simbolo.rif, simbolo.direzione);
  svg.style.width = `${px}px`;
  svg.style.height = `${px}px`;
  svg.style.color = 'var(--gray-800)';
  svg.style.flexShrink = '0';
  return svg;
}

export function fronte(carta: Carta, size: Size): HTMLElement {
  const simbolo = richiediSimbolo(carta);
  const svg = pittogramma(simbolo, PITTOGRAMMA_PX[size].fronte);
  if (size === 'lista') {
    return superficie(size, [svg, blocchettoLista(simbolo.nome, carta.sezione)]);
  }
  return superficie(size, [svg]);
}

export function retro(carta: Carta, size: Size): HTMLElement {
  const simbolo = richiediSimbolo(carta);
  const svg = pittogramma(simbolo, PITTOGRAMMA_PX[size].retro);
  if (size === 'lista') {
    return superficie(size, [svg, blocchettoLista(simbolo.nome, simbolo.descrizione)]);
  }
  const riferimento = badge(simbolo.rif);
  const nome = testo(simbolo.nome, { px: size === 'carta' ? 22 : 16, peso: 600, colore: 'var(--gray-800)', centrato: true });
  const def = testo(simbolo.descrizione, { px: size === 'carta' ? 14 : 12, colore: 'var(--gray-500)', centrato: true });
  return superficie(size, [svg, riferimento, nome, def]);
}
