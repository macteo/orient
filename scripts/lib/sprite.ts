// scripts/lib/sprite.ts — builds a hidden SVG "sprite" of <symbol> defs from
// the individual pictogram SVGs under content/artwork/descrizioni-punti/, so
// a card face can draw a pictogram with a plain
//   <svg viewBox="0 0 200 200"><use href="#s-<rif>[<direzione>]"></use></svg>
// (RigaDescrizione.prompt.md; src/allenamento/facce/cella.ts's `cella()`).
//
// The source SVGs use `viewBox="-100 -100 200 200"` (centred on the origin).
// Wrapping their contents in a <symbol viewBox="-100 -100 200 200"> and
// referencing it from an outer `<svg viewBox="0 0 200 200">` via `<use>`
// re-centres the symbol's own coordinate space into 0..200 with no clipping
// — the symbol's own viewBox governs the nested viewport `<use>` creates,
// independent of the consuming svg's viewBox (the "outer svg + <use>" trick
// named in akaaso/09-tasks/P1-ALLENAMENTO-UI-facce.md).
//
// `build-mazzi` (a later task) calls this with every symbol a deck actually
// references, to emit the real sprite. `src/allenamento/facce/sprite.generated.ts`
// is a fixture built with this same function for the fourteen pictograms the
// approved artboards use.
//
// Recolours the source SVGs' literal `black` stroke/fill to `currentColor`
// so the design tokens (`color: var(--gray-800)`) apply — the artwork's
// shapes, paths and proportions are never touched (1.005 licence rule,
// 2.006 design direction): this is the same technique the approved
// artboards use for their inlined <symbol> defs (see
// akaaso/06-design/_artboards/[mazzo].flashcard.dc.html).

const VIEWBOX = /viewBox="([^"]*)"/;
const INNER_MARKUP = /<svg[^>]*>([\s\S]*)<\/svg>/;
const BLACK_STROKE_OR_FILL = /(stroke|fill)="black"/g;

export type SimboloSprite = { rif: string; svg: string };

/** Extracts the viewBox and inner markup of one source SVG file's content. */
export function scomponiSvg(sorgente: string): { viewBox: string; inner: string } {
  const viewBoxMatch = sorgente.match(VIEWBOX);
  const innerMatch = sorgente.match(INNER_MARKUP);
  if (!viewBoxMatch || !innerMatch) {
    throw new Error('sprite: SVG sorgente senza viewBox o senza contenuto <svg>...</svg>');
  }
  return { viewBox: viewBoxMatch[1], inner: innerMatch[1] };
}

/**
 * Recolours literal black stroke/fill to `currentColor`. Every other
 * attribute (the path data, the geometry) is left exactly as vendored —
 * artwork is never recoloured beyond swapping literal black for the
 * currentColor token hook, never redrawn, cropped or stretched.
 */
export function ricolora(markup: string): string {
  return markup.replace(BLACK_STROKE_OR_FILL, '$1="currentColor"');
}

/** Builds one `<symbol id="s-<rif>">` element from a source SVG's raw text. */
export function generaSimbolo({ rif, svg }: SimboloSprite): string {
  const { viewBox, inner } = scomponiSvg(svg);
  return `<symbol id="s-${rif}" viewBox="${viewBox}">${ricolora(inner)}</symbol>`;
}

/**
 * Builds the hidden sprite `<svg>` holding one `<symbol>` per entry, ready
 * to be inserted once into a document (e.g. `body.insertAdjacentHTML(...)`).
 */
export function generaSprite(simboli: SimboloSprite[]): string {
  const simboliMarkup = simboli.map(generaSimbolo).join('');
  return `<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">${simboliMarkup}</svg>`;
}
