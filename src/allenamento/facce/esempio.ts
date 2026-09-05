// src/allenamento/facce/esempio.ts — `esempio` card type (esempi deck),
// F-004 / FacciaCarta.prompt.md: "front = the map clip and the terrain
// sketch side by side, each on white; back = the printed row image and the
// sentence."

import { badge, blocchettoLista, superficie, testo } from './cella.ts';
import type { Carta, Size } from './tipi.ts';

// Placeholder natural sizes matching the approved artboards
// (akaaso/06-design/_artboards/[mazzo].flashcard(.retro).dc.html); the
// asset pipeline does not carry real per-file pixel dimensions yet (3.002's
// `Esempio` type has none) — a later task (build-mazzi or the pipeline
// that emits `content/esempi/esempi.json`) can measure the real files and
// inject exact width/height without changing this module's shape.
const CARTA_WH = { larghezza: 240, altezza: 360 };
const TERRENO_WH = { larghezza: 360, altezza: 176 };
const RIGA_WH = { larghezza: 480, altezza: 140 };

function immagine(
  src: string,
  wh: { larghezza: number; altezza: number },
  alt: string,
  larghezzaResa: string,
): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'img-bianco';
  img.src = src;
  img.width = wh.larghezza;
  img.height = wh.altezza;
  img.alt = alt;
  img.setAttribute('loading', 'lazy');
  img.style.width = larghezzaResa;
  img.style.height = 'auto';
  return img;
}

function richiediEsempio(carta: Carta): NonNullable<Carta['esempio']> {
  if (!carta.esempio) throw new Error(`facce/esempio: la carta ${carta.id} non ha il campo esempio`);
  return carta.esempio;
}

export function fronte(carta: Carta, size: Size): HTMLElement {
  const esempio = richiediEsempio(carta);
  const imgCarta = immagine(esempio.carta, CARTA_WH, `Esempio ${esempio.codice}, carta`, size === 'lista' ? '40px' : '100%');
  if (size === 'lista') {
    imgCarta.style.flexShrink = '0';
    return superficie(size, [imgCarta, blocchettoLista(esempio.testo, esempio.famiglia)]);
  }
  const imgTerreno = immagine(esempio.terreno, TERRENO_WH, `Esempio ${esempio.codice}, terreno`, '100%');
  const griglia = document.createElement('div');
  griglia.style.display = 'grid';
  griglia.style.gridTemplateColumns = '1fr 2.2fr';
  griglia.style.gap = size === 'carta' ? '10px' : '6px';
  griglia.style.width = '100%';
  griglia.style.alignItems = 'center';
  griglia.append(imgCarta, imgTerreno);
  return superficie(size, [griglia]);
}

export function retro(carta: Carta, size: Size): HTMLElement {
  const esempio = richiediEsempio(carta);
  if (size === 'lista') {
    const imgCarta = immagine(esempio.carta, CARTA_WH, `Esempio ${esempio.codice}, carta`, '40px');
    imgCarta.style.flexShrink = '0';
    return superficie(size, [imgCarta, blocchettoLista(esempio.testo, `esempio ${esempio.codice}`)]);
  }
  const imgRiga = immagine(esempio.riga, RIGA_WH, `Esempio ${esempio.codice}, descrizione stampata`, '100%');
  const riferimento = badge(`esempio ${esempio.codice}`);
  // Like `riga`, an `esempio` has no separate definition beyond its
  // sentence (F-004's table: "the printed row image and the sentence").
  const frase = testo(esempio.testo, { px: size === 'carta' ? 22 : 16, peso: 600, centrato: true });
  return superficie(size, [imgRiga, riferimento, frase]);
}
