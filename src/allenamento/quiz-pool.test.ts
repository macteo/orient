// F-003 AC-1/AC-2: four distinct options even when both the section and the
// column pool are too small (wave-5 integration fix reported by the S-002
// journey: `colonna-f` has two cards and its column pool is the same two).
import { describe, expect, it } from 'vitest';
import { opzioni } from './quiz.ts';
import { makeRng } from './rng.ts';
import type { Carta, MazzoBuild } from '../mazzi/tipi.ts';

function simbolo(id: string, sezione: string, nome: string): Carta {
  return { id, tipo: 'simbolo', sezione, simbolo: { rif: id, nome, descrizione: '', artwork: { path: '', formato: 'svg' } } } as unknown as Carta;
}

const mazzo: MazzoBuild = {
  id: 'descrizioni-simboli',
  nome: 'Descrizioni dei punti',
  tipo: 'simbolo',
  sezioni: [
    { id: 'colonna-f', etichetta: 'Colonna F', carte: ['f1', 'f2'] },
    { id: 'colonna-g', etichetta: 'Colonna G', carte: ['g1', 'g2', 'g3', 'g4', 'g5'] },
  ],
  carte: {
    f1: simbolo('f1', 'colonna-f', 'Bivio'),
    f2: simbolo('f2', 'colonna-f', 'Incrocio'),
    g1: simbolo('g1', 'colonna-g', 'Lato'),
    g2: simbolo('g2', 'colonna-g', 'Bordo'),
    g3: simbolo('g3', 'colonna-g', 'Parte'),
    g4: simbolo('g4', 'colonna-g', 'Angolo'),
    g5: simbolo('g5', 'colonna-g', 'Tra'),
  },
  distrattori: { perSezione: { 'colonna-f': ['f1', 'f2'], 'colonna-g': ['g1', 'g2', 'g3', 'g4', 'g5'] }, perColonna: { F: ['f1', 'f2'], G: ['g1', 'g2', 'g3', 'g4', 'g5'] } },
} as unknown as MazzoBuild;

describe('pool dei distrattori: sezione e colonna troppo piccole', () => {
  it('ricade sul mazzo intero e produce sempre quattro opzioni distinte', () => {
    for (let seme = 1; seme <= 20; seme += 1) {
      const d = opzioni(mazzo.carte.f1, mazzo, makeRng(seme));
      expect(d.opzioni).toHaveLength(4);
      expect(new Set(d.opzioni).size).toBe(4);
      expect(d.opzioni).toContain('f1');
      expect(d.opzioni[d.giusta]).toBe('f1');
    }
  });
});
