// src/allenamento/facce/riga.ts — `riga` card type (descrizioni-complete
// deck), F-004 / RigaDescrizione.prompt.md: eight bordered cells A–H in the
// printed [S3] page-3 proportions; A the row number ("—" if generated), B
// the code, C–H pictograms at the cell's direction (F as text when it is a
// dimension); FacciaCarta.prompt.md: "back = small row, sentence, `generata`
// Badge when generated."

import { badge, cella, superficie, testo } from './cella.ts';
import type { Carta, Cella, RigaDescrizione, Size } from './tipi.ts';

const ORDINE_COLONNE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
type ColonnaSimbolo = 'C' | 'D' | 'E' | 'G' | 'H';

export type Slot = { testo: string } | { simbolo: Cella } | { vuoto: true };

/** A back's grid is always drawn one size step smaller than the face's
 * overall size (see the flashcard artboards: a `carta`-size card's back
 * shows the row at `.riga tile` density, to leave room for the sentence). */
const GRIGLIA_RETRO: Record<Size, Size> = { carta: 'tile', tile: 'lista', lista: 'lista' };

/**
 * The 8 cell slots (A–H) a `RigaDescrizione` maps to, in print order. Pure
 * data (no DOM) — exported so `e2e/riga.pixel.spec.ts` can build the exact
 * same cell content from plain Node, without needing a DOM to call
 * `griglia()` itself.
 */
export function celleRiga(riga: RigaDescrizione): Slot[] {
  return ORDINE_COLONNE.map((colonna): Slot => {
    if (colonna === 'A') return { testo: riga.numero ?? '—' };
    if (colonna === 'B') return { testo: riga.codice };
    const valore = riga.celle[colonna as ColonnaSimbolo | 'F'];
    if (valore === undefined) return { vuoto: true };
    if (typeof valore === 'string') return valore === '' ? { vuoto: true } : { testo: valore };
    return { simbolo: valore };
  });
}

/**
 * Characters the longest unbreakable run of `testo` puts on one line: the
 * whole text, or — when it contains hyphens, where the browser may wrap —
 * the longest hyphen-terminated piece ("gen-0038" → "gen-" / "0038" → 4).
 * facce.css turns it into a font size that keeps that run inside the cell.
 */
export function caratteriPerRiga(testo: string): number {
  const pezzi = testo.split(/(?<=-)/);
  return Math.max(1, ...pezzi.map((pezzo) => pezzo.length));
}

/** Builds the printed `.riga` grid (RigaDescrizione.prompt.md) at `size`. */
export function griglia(riga: RigaDescrizione, size: Size): HTMLDivElement {
  const div = document.createElement('div');
  div.className = `riga ${size}`;
  div.style.width = '100%';
  for (const slot of celleRiga(riga)) {
    const cellaDiv = document.createElement('div');
    if ('simbolo' in slot) {
      cellaDiv.appendChild(cella(slot.simbolo.rif, slot.simbolo.direzione));
    } else if ('testo' in slot) {
      const span = document.createElement('span');
      span.textContent = slot.testo;
      span.style.setProperty('--cpl', String(caratteriPerRiga(slot.testo)));
      cellaDiv.appendChild(span);
    }
    div.appendChild(cellaDiv);
  }
  return div;
}

function richiediRiga(carta: Carta): RigaDescrizione {
  if (!carta.riga) throw new Error(`facce/riga: la carta ${carta.id} non ha il campo riga`);
  return carta.riga;
}

export function fronte(carta: Carta, size: Size): HTMLElement {
  const riga = richiediRiga(carta);
  const griglia_ = griglia(riga, size);
  if (size === 'lista') {
    const testoRiga = testo(riga.testo, { px: 14, peso: 600 });
    testoRiga.style.flex = '1';
    testoRiga.style.minWidth = '0';
    return superficie(size, [griglia_, testoRiga]);
  }
  return superficie(size, [griglia_]);
}

export function retro(carta: Carta, size: Size): HTMLElement {
  const riga = richiediRiga(carta);
  const griglia_ = griglia(riga, GRIGLIA_RETRO[size]);
  const generata = riga.origine === 'generata';
  if (size === 'lista') {
    const testoRiga = testo(riga.testo, { px: 14, peso: 600 });
    testoRiga.style.flex = '1';
    testoRiga.style.minWidth = '0';
    const badges = document.createElement('div');
    badges.style.display = 'flex';
    badges.style.gap = '6px';
    badges.appendChild(badge(riga.codice));
    if (generata) badges.appendChild(badge('generata', { variant: 'outline' }));
    const colonnaTesto = document.createElement('div');
    colonnaTesto.style.display = 'flex';
    colonnaTesto.style.flexDirection = 'column';
    colonnaTesto.style.gap = '4px';
    colonnaTesto.style.flex = '1';
    colonnaTesto.style.minWidth = '0';
    colonnaTesto.append(testoRiga, badges);
    return superficie(size, [griglia_, colonnaTesto]);
  }
  const badges = document.createElement('div');
  badges.style.display = 'flex';
  badges.style.gap = '8px';
  badges.style.alignItems = 'center';
  badges.appendChild(badge(riga.codice));
  if (generata) badges.appendChild(badge('generata', { variant: 'outline' }));
  // A row has no separate "definition": its sentence is the whole answer
  // (F-004's table: "the row again, small, and the sentence"), so this is
  // the only text line — unlike the other three types, which also render a
  // definition/description line beneath the name.
  const frase = testo(riga.testo, { px: size === 'carta' ? 22 : 16, peso: 600, centrato: true });
  return superficie(size, [griglia_, badges, frase]);
}
