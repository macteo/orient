// Shared helpers for the content parsers (parse-descrizioni.ts, parse-isom.ts).
// Kept erasable (no enums, no parameter properties) so plain `node` can run
// this file directly via Node's type stripping, without a build step.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/** Reads a converted markdown source file as UTF-8 text. */
export function leggiSorgente(path: string): string {
  return readFileSync(path, 'utf8');
}

export type Pagina = { n: number; testo: string };

const MARCATORE_PAGINA = /<!--\s*pagina\s+(\d+)\s*-->/gi;

/**
 * Splits converted source text on `<!-- pagina N -->` markers into
 * `{ n, testo }` chunks, one per page. Text before the first marker (if any)
 * is discarded, since a converted source always starts with the marker.
 */
export function pagine(text: string): Pagina[] {
  const risultato: Pagina[] = [];
  const marcatori: { n: number; index: number; length: number }[] = [];

  for (const match of text.matchAll(MARCATORE_PAGINA)) {
    marcatori.push({ n: Number(match[1]), index: match.index, length: match[0].length });
  }

  for (let i = 0; i < marcatori.length; i += 1) {
    const inizio = marcatori[i].index + marcatori[i].length;
    const fine = i + 1 < marcatori.length ? marcatori[i + 1].index : text.length;
    risultato.push({ n: marcatori[i].n, testo: text.slice(inizio, fine).trim() });
  }

  return risultato;
}

/**
 * Joins wrapped lines with a single space, trimming each line first and
 * dropping empty lines. Used to reassemble a paragraph/cell that a PDF
 * extraction wrapped across multiple source lines.
 */
export function unisciRighe(lines: string[]): string {
  return lines
    .map((riga) => riga.trim())
    .filter((riga) => riga.length > 0)
    .join(' ');
}

/** Returns the lowercase hex SHA-256 digest of a buffer. */
export function sha256(buffer: Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex');
}
