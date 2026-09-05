// src/allenamento/facce/isom.ts — `simbolo-isom` card type (isom deck),
// F-004 / FacciaCarta.prompt.md: "front = the IOF drawing PNG on white,
// annotations as printed; back = small drawing, number Badge, name,
// geometry, section, full description."
// Task spec (P1-ALLENAMENTO-UI-facce.md): "ISOM back adds number ·
// geometry badge and section" — the reference badge reads "<rif> ·
// <geometria>" (e.g. "307 · L", confirmed by the approved flashcard
// artboard's own mock data), and a section line is added beneath the name.

import { badge, blocchettoLista, superficie, testo } from './cella.ts';
import type { Carta, Size } from './tipi.ts';

// Placeholder natural size matching the approved artboards — see
// esempio.ts's identical note; the ISOM `Simbolo` type (3.002) carries no
// pixel dimensions yet.
const ISOM_WH = { larghezza: 360, altezza: 268 };

const FRONTE_PX: Record<Size, number> = { carta: 220, tile: 120, lista: 40 };
const RETRO_PX: Record<Size, number> = { carta: 120, tile: 64, lista: 40 };

function immagineIsom(src: string, alt: string, px: number): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'img-bianco';
  img.src = src;
  img.width = ISOM_WH.larghezza;
  img.height = ISOM_WH.altezza;
  img.alt = alt;
  img.setAttribute('loading', 'lazy');
  img.style.width = `${px}px`;
  img.style.height = 'auto';
  img.style.border = '0';
  return img;
}

function richiediIsom(carta: Carta): NonNullable<Carta['isom']> {
  if (!carta.isom) throw new Error(`facce/isom: la carta ${carta.id} non ha il campo isom`);
  return carta.isom;
}

export function fronte(carta: Carta, size: Size): HTMLElement {
  const isom = richiediIsom(carta);
  const img = immagineIsom(isom.artwork.path, `Simbolo ISOM ${isom.rif}: ${isom.nome}`, FRONTE_PX[size]);
  if (size === 'lista') {
    return superficie(size, [img, blocchettoLista(isom.nome, isom.sezione)]);
  }
  return superficie(size, [img]);
}

export function retro(carta: Carta, size: Size): HTMLElement {
  const isom = richiediIsom(carta);
  const img = immagineIsom(isom.artwork.path, `Simbolo ISOM ${isom.rif}: ${isom.nome}`, RETRO_PX[size]);
  const riferimento = `${isom.rif} · ${isom.geometria}`;
  if (size === 'lista') {
    return superficie(size, [img, blocchettoLista(isom.nome, riferimento)]);
  }
  const rif = badge(riferimento);
  const nome = testo(isom.nome, { px: size === 'carta' ? 22 : 16, peso: 600, centrato: true });
  const sezione = testo(isom.sezione, { px: 12, colore: 'var(--gray-400)', centrato: true });
  const def = testo(isom.descrizione, { px: size === 'carta' ? 14 : 12, colore: 'var(--gray-500)', centrato: true });
  return superficie(size, [img, rif, nome, sezione, def]);
}
