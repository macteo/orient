// src/sito/picker.ts — helpers for the home picker (F-001, D-001): the run
// URL "Inizia" navigates to, and the primary button's label/disabled state.
// Pure: no DOM, no storage, no `import.meta.env` — trivial to unit test, and
// `src/pages/home.ts` is the only caller.

import type { RiepilogoMazzo } from '../mazzi/assembla.ts';

/** The two run modes (F-002, F-003). */
export type ModalitaPicker = 'flashcard' | 'quiz';

/** The four sizes the chips offer; `'tutte'` means every card available. */
export type CarteScelte = '8' | '12' | '23' | 'tutte';

/**
 * The picker's state as it applies to the one deck currently open (D-001:
 * the mode, direction, size and start button are shared controls that act
 * on whichever deck's disclosure is expanded).
 */
export type StatoPicker = {
  /** The open deck's id. */
  mazzo: string;
  /** Every section id the open deck has, in its declared order. */
  sezioniTotali: string[];
  /** The subset of `sezioniTotali` that is checked. Empty means "none". */
  sezioniScelte: string[];
  modo: ModalitaPicker;
  /** Absent means the default (forward) direction; only meaningful in quiz mode. */
  direzione?: 'inversa';
  carte: CarteScelte;
};

/**
 * The path "Inizia" navigates to, relative to the site's base (no leading
 * slash): `<mazzo>/flashcard/?…` or `<mazzo>/quiz/?…`. `sezioni` is present
 * only when a strict, non-empty subset of the deck's sections is checked
 * (F-001 AC-4: every section checked → the parameter is absent); `carte` is
 * always present; `direzione=inversa` appears only in quiz mode with the
 * reverse direction chosen.
 *
 * Precondition: `stato.sezioniScelte` is non-empty (the caller never invokes
 * this while the start button is disabled).
 */
export function urlSerie(stato: StatoPicker): string {
  const cartella = stato.modo === 'quiz' ? 'quiz' : 'flashcard';
  const parametri = new URLSearchParams();
  const tutteScelte = stato.sezioniTotali.length > 0 && stato.sezioniScelte.length === stato.sezioniTotali.length;
  if (stato.sezioniScelte.length > 0 && !tutteScelte) {
    parametri.set('sezioni', stato.sezioniScelte.join(','));
  }
  parametri.set('carte', stato.carte);
  if (stato.modo === 'quiz' && stato.direzione === 'inversa') {
    parametri.set('direzione', 'inversa');
  }
  return `${stato.mazzo}/${cartella}/?${parametri.toString()}`;
}

/**
 * The primary button's label and disabled state (F-001 AC-2, AC-3):
 * disabled with *Scegli almeno una sezione* when nothing is checked;
 * otherwise *Inizia · N carte* with N = min(chosen size, cards in the
 * checked sections) — the exact total when the chip is *tutte*.
 */
export function etichettaInizia(
  stato: StatoPicker,
  mazzi: RiepilogoMazzo[],
): { etichetta: string; disabilitato: boolean } {
  if (stato.sezioniScelte.length === 0) {
    return { etichetta: 'Scegli almeno una sezione', disabilitato: true };
  }
  const mazzo = mazzi.find((m) => m.id === stato.mazzo);
  const scelte = new Set(stato.sezioniScelte);
  const disponibili = mazzo
    ? mazzo.sezioni.filter((s) => scelte.has(s.id)).reduce((totale, s) => totale + s.carte, 0)
    : 0;
  const n = stato.carte === 'tutte' ? disponibili : Math.min(Number(stato.carte), disponibili);
  return { etichetta: `Inizia · ${n} carte`, disabilitato: false };
}
