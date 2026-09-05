// src/allenamento/facce/cella.ts — shared low-level DOM primitives for the
// facce module:
//   - `cella(rif, direzione?)` — one pictogram (RigaDescrizione.prompt.md's
//     grid cell C–H, and the "the pictogram SVG" used directly by simbolo.ts).
//   - `badge(...)` — the reference/`generata` Badge every back carries
//     (design-system/components/feedback/Badge.prompt.md: Preline `hs-badge`
//     markup, soft/gray/pill by default).
//   - `superficie(...)` — the plain white bordered surface every face sits
//     on (FacciaCarta.prompt.md: "centred on a white surface with a
//     hairline border"), and the borderless row layout for `lista` size.
//   - `testo(...)` / `blocchettoLista(...)` — small text-node builders
//     shared by every per-type module, so name/definition/caption styling
//     stays identical across simbolo.ts, riga.ts, esempio.ts, isom.ts.
// No file for a standalone "Badge" component exists in this task's
// deliverable list, so its markup lives here rather than inventing a file.

import { SPRITE_MARKUP } from './sprite.generated.ts';
import type { Direzione, Size } from './tipi.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

let spriteMontata: Document | null = null;

/**
 * Mounts the pictogram sprite's hidden `<symbol>` defs once per document,
 * so a later `<use href="#s-...">` resolves. Parsed as real SVG (not
 * `innerHTML`/`insertAdjacentHTML`) since the markup is a single `<svg>`
 * root produced entirely by scripts/lib/sprite.ts from vendored artwork,
 * never from user input.
 */
function garantisciSprite(doc: Document): void {
  if (spriteMontata === doc) return;
  const analizzatore = new DOMParser();
  const spriteDoc = analizzatore.parseFromString(SPRITE_MARKUP, 'image/svg+xml');
  const radice = spriteDoc.documentElement;
  doc.body.appendChild(doc.importNode(radice, true));
  spriteMontata = doc;
}

/**
 * One pictogram: an inline `<svg viewBox="0 0 200 200">` referencing the
 * sprite's `<symbol id="s-<rif>[<direzione>]">` via `<use>` — the outer
 * `viewBox="0 0 200 200"` + `<use>` trick (see scripts/lib/sprite.ts's
 * header) re-centres the symbol's own -100..100 space with no clipping.
 * Callers size it with `style.width`/`style.height`/`style.color`.
 */
export function cella(rif: string, direzione?: Direzione): SVGSVGElement {
  garantisciSprite(document);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#s-${rif}${direzione ?? ''}`);
  svg.appendChild(use);
  return svg;
}

export type BadgeVariant = 'soft' | 'solid' | 'outline' | 'white';
export type BadgeColor = 'gray' | 'dark' | 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'purple';

/**
 * A compact pill label (Badge.prompt.md). Only the soft/gray/pill (the
 * reference badge) and outline/gray/pill (`generata`) combinations this
 * module needs are styled; extend the two branches below if a face ever
 * needs another variant/colour.
 */
export function badge(
  testoBadge: string,
  opzioni: { variant?: BadgeVariant; color?: BadgeColor; pill?: boolean } = {},
): HTMLSpanElement {
  const { variant = 'soft', color = 'gray', pill = true } = opzioni;
  const span = document.createElement('span');
  span.className = 'hs-badge';
  span.dataset.variant = variant;
  span.dataset.color = color;
  span.textContent = testoBadge;
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.padding = '3px 10px';
  span.style.fontSize = '12px';
  span.style.fontWeight = '600';
  span.style.lineHeight = '1.4';
  span.style.borderRadius = pill ? 'var(--radius-full)' : 'var(--radius-md)';
  if (variant === 'outline') {
    span.style.background = 'transparent';
    span.style.color = 'var(--gray-500)';
    span.style.border = '1px solid var(--gray-300)';
  } else {
    span.style.background = 'var(--gray-100)';
    span.style.color = 'var(--gray-700)';
  }
  return span;
}

/** Per-size padding/gap/max-width for the self-contained `carta`/`tile` surface. */
const SUPERFICIE: Record<'carta' | 'tile', { padding: string; gap: string; maxWidth: string }> = {
  carta: { padding: '40px 24px', gap: '24px', maxWidth: '360px' },
  tile: { padding: '14px 10px', gap: '10px', maxWidth: '168px' },
};

/**
 * The surface every face sits on: for `carta`/`tile`, a self-contained
 * white bordered/rounded/shadowed card (a column of children — pictogram
 * or grid or images, then badge/name/definition on the back); for `lista`,
 * a borderless horizontal row (an icon-ish first child, then a text block
 * — see `blocchettoLista`), since a `lista`-size face is one row inside an
 * existing list container (akaaso/06-design/_artboards/[mazzo].risultati.dc.html's
 * "errori" rows already provide the list's own border/shadow).
 */
export function superficie(size: Size, children: Node[]): HTMLDivElement {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.boxSizing = 'border-box';
  div.style.width = '100%';
  if (size === 'lista') {
    div.style.flexDirection = 'row';
    div.style.gap = '14px';
    div.style.padding = '8px 0';
  } else {
    const { padding, gap, maxWidth } = SUPERFICIE[size];
    div.style.flexDirection = 'column';
    div.style.background = 'var(--white)';
    div.style.border = '1px solid var(--gray-200)';
    div.style.borderRadius = 'var(--radius-2xl)';
    div.style.boxShadow = 'var(--shadow-sm)';
    div.style.padding = padding;
    div.style.gap = gap;
    div.style.maxWidth = maxWidth;
  }
  for (const child of children) div.appendChild(child);
  return div;
}

/** A single styled text node (name/definition/caption), centred text optional. */
export function testo(
  contenuto: string,
  stile: { px: number; peso?: number; colore?: string; centrato?: boolean },
): HTMLDivElement {
  const div = document.createElement('div');
  div.textContent = contenuto;
  div.style.fontSize = `${stile.px}px`;
  div.style.fontWeight = String(stile.peso ?? 400);
  div.style.color = stile.colore ?? 'var(--gray-800)';
  div.style.lineHeight = '1.5';
  if (stile.centrato) div.style.textAlign = 'center';
  return div;
}

/** The title+caption text block next to a `lista`-size icon/thumbnail. */
export function blocchettoLista(titolo: string, sottotitolo: string): HTMLDivElement {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.gap = '2px';
  div.style.minWidth = '0';
  div.style.flex = '1';
  div.appendChild(testo(titolo, { px: 14, peso: 600 }));
  div.appendChild(testo(sottotitolo, { px: 12, colore: 'var(--gray-400)' }));
  return div;
}
