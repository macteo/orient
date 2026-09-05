// src/allenamento/flashcard-dom.ts — la resa DOM di R-002 (F-002 / D-002):
// header di corsa (← Mazzi, contatore, Progress, titolo), le notice
// (`ripresa`, `invalid-input`), la carta corrente (fronte/retro via
// `facce/`), la barra inferiore (suggerimento sul fronte, i due bottoni di
// voto sul retro), e lo stato vuoto.
//
// Nessuna logica di dominio qui: `src/pages/flashcard.ts` calcola la
// `VistaFlashcard` da una `Serie` (F-002) e questo modulo si limita a
// disegnarla e a richiamare le callback sui tocchi dell'utente. Ogni
// `disegna()` ricostruisce da zero il contenuto di `radice` — la vista è
// piccola, ridisegnarla è più semplice ed è comunque a costo trascurabile
// (F-004: nessun framework, "small render functions").
//
// Contratti seguiti (akaaso/09-tasks/P1-ALLENAMENTO-UI-flashcard.md):
//   Progress        design-system/components/feedback/Progress.prompt.md
//   Alert           design-system/components/feedback/Alert.prompt.md
//   Button          design-system/components/buttons/Button.prompt.md
// (FacciaCarta, RigaDescrizione, Badge sono già la resa di `facce/index.ts`,
// che questo modulo chiama soltanto.) Ogni colore/spaziatura viene dai
// token (`design-system/tokens/*.css`), mai un hex o un font a mano.

import { fronte, retro } from './facce/index.ts';
import type { Carta } from '../mazzi/tipi.ts';

/** Le due notice one-shot di D-002 (F-002: "shown once", poi si torna a `default`). */
export type NoticeFlashcard = 'ripresa' | 'invalid-input';

/**
 * Ciò che `disegna()` disegna. `vuota` è lo stato F-002 "nessuna carta per
 * le sezioni scelte"; `run` copre `default`/`retro` (per `girata`) e porta
 * la notice opzionale per `ripresa`/`invalid-input`.
 */
export type VistaFlashcard =
  | { stato: 'vuota' }
  | {
      stato: 'run';
      carta: Carta;
      girata: boolean;
      /** "i / N" — N cresce quando un ripasso viene messo in coda (F-002 AC-3). */
      contatore: string;
      /** 0-100, per la Progress. */
      progresso: number;
      /** "<mazzo> · <sezioni>", "<mazzo> · N sezioni" o "<mazzo> · tutte le sezioni". */
      titoloSerie: string;
      notice?: NoticeFlashcard;
    };

/** Le uniche interazioni che questo modulo non decide da solo. */
export type CallbackFlashcard = {
  /** "← Mazzi" e, nello stato vuoto, "Torna ai mazzi": abbandona e torna a R-001. */
  onIndietro: () => void;
  /** Tocco sulla carta: gira fronte ↔ retro. */
  onGira: () => void;
  /** Uno dei due bottoni di voto, visibili solo sul retro. */
  onValuta: (esito: 'sapevo' | 'non-sapevo') => void;
};

/** R-002 sta sempre a `<mazzo>/flashcard/`: la home è due livelli sopra. */
const RADICE_MAZZI = '../../';

type StileParziale = Partial<CSSStyleDeclaration>;

function elemento<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  stile: StileParziale = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  Object.assign(el.style, stile);
  return el;
}

function testo(contenuto: string, stile: StileParziale = {}): HTMLDivElement {
  const div = elemento('div', stile);
  div.textContent = contenuto;
  return div;
}

function linkIndietro(callback: CallbackFlashcard): HTMLAnchorElement {
  const a = elemento('a', {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-500)',
    textDecoration: 'none',
    padding: '6px 2px',
    flexShrink: '0',
  });
  a.href = RADICE_MAZZI;
  a.textContent = '← Mazzi';
  a.addEventListener('click', () => callback.onIndietro());
  return a;
}

/** Progress.prompt.md: lineare, `sm`, `blue`. Un `<div role="progressbar">` di due livelli. */
function barraProgresso(valore: number): HTMLDivElement {
  const percentuale = Math.max(0, Math.min(100, Math.round(valore)));
  const traccia = elemento('div', {
    width: '100%',
    height: '6px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--gray-200)',
    overflow: 'hidden',
    flexShrink: '0',
  });
  traccia.setAttribute('role', 'progressbar');
  traccia.setAttribute('aria-valuemin', '0');
  traccia.setAttribute('aria-valuemax', '100');
  traccia.setAttribute('aria-valuenow', String(percentuale));
  const riempimento = elemento('div', {
    width: `${percentuale}%`,
    height: '100%',
    background: 'var(--blue-600)',
    borderRadius: 'var(--radius-full)',
  });
  traccia.appendChild(riempimento);
  return traccia;
}

function intestazione(vista: Extract<VistaFlashcard, { stato: 'run' }>, callback: CallbackFlashcard): HTMLDivElement {
  const riga = elemento('div', { display: 'flex', alignItems: 'center', gap: '12px' });
  const spaziatore = elemento('div', { flex: '1' });
  const contatore = testo(vista.contatore, { fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' });
  riga.append(linkIndietro(callback), spaziatore, contatore);

  const titolo = testo(vista.titoloSerie, { fontSize: '12px', color: 'var(--gray-500)' });

  const header = elemento('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--gray-200)',
  });
  header.append(riga, barraProgresso(vista.progresso), titolo);
  return header;
}

/** Alert.prompt.md: `variant="soft"`, colore `blue` o `yellow`, titolo + corpo. */
function alert(colore: 'blue' | 'yellow', titolo: string, corpo: string): HTMLDivElement {
  const palette =
    colore === 'blue'
      ? { sfondo: 'var(--blue-50)', titolo: 'var(--blue-800)', corpo: 'var(--blue-700)' }
      : { sfondo: 'var(--yellow-50)', titolo: 'var(--yellow-800)', corpo: 'var(--yellow-700)' };
  const box = elemento('div', {
    background: palette.sfondo,
    borderRadius: 'var(--radius-xl)',
    padding: '10px 14px',
    margin: '10px 16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  });
  box.setAttribute('role', 'status');
  box.append(
    testo(titolo, { fontSize: '13px', fontWeight: '600', color: palette.titolo }),
    testo(corpo, { fontSize: '13px', color: palette.corpo, lineHeight: '1.4' }),
  );
  return box;
}

/** Button.prompt.md: `lg` (60px), `outline`/`dark` o solido `blue`. */
function bottoneVoto(variante: 'outline-dark' | 'solid-blue', etichetta: string, onClick: () => void): HTMLButtonElement {
  const base: StileParziale = {
    height: '60px',
    width: '100%',
    borderRadius: 'var(--radius-button)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  };
  const b = elemento(
    'button',
    variante === 'outline-dark'
      ? { ...base, background: 'var(--white)', color: 'var(--gray-800)', border: '1px solid var(--gray-300)' }
      : { ...base, background: 'var(--blue-600)', color: 'var(--white)', border: 'none' },
  );
  b.type = 'button';
  b.textContent = etichetta;
  b.addEventListener('click', onClick);
  return b;
}

/** Button.prompt.md: `outline`/`dark`, `md` (44px) — usato dallo stato vuoto. */
function bottoneSecondario(etichetta: string, onClick: () => void): HTMLButtonElement {
  const b = elemento('button', {
    height: '44px',
    padding: '0 20px',
    borderRadius: 'var(--radius-button)',
    fontSize: '14px',
    fontWeight: '600',
    background: 'var(--white)',
    color: 'var(--gray-800)',
    border: '1px solid var(--gray-300)',
    cursor: 'pointer',
  });
  b.type = 'button';
  b.textContent = etichetta;
  b.addEventListener('click', onClick);
  return b;
}

/**
 * La carta corrente come tocco di flip: `role="button"` (non un vero
 * `<button>`, perché il figlio — la faccia di `facce/` — è flow content,
 * non ammesso nel content model di `<button>`) con supporto da tastiera.
 * Il fronte porta anche il suggerimento *Tocca per girare la carta*, che
 * `facce/` non include (non è testo della carta, è un'affordance di
 * schermata: F-002/D-002).
 */
function areaCarta(vista: Extract<VistaFlashcard, { stato: 'run' }>, callback: CallbackFlashcard): HTMLDivElement {
  const contenitore = elemento('div', {
    flex: '1',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '24px 16px',
    background: 'var(--gray-50)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  });
  contenitore.setAttribute('role', 'button');
  contenitore.tabIndex = 0;
  contenitore.setAttribute('aria-label', vista.girata ? 'Carta, retro' : 'Carta, fronte. Tocca per girare la carta.');

  const faccia = vista.girata ? retro(vista.carta, 'carta') : fronte(vista.carta, 'carta');
  if (!vista.girata) {
    faccia.appendChild(testo('Tocca per girare la carta', { fontSize: '13px', color: 'var(--gray-400)' }));
  }
  contenitore.appendChild(faccia);

  contenitore.addEventListener('click', () => callback.onGira());
  contenitore.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      callback.onGira();
    }
  });
  return contenitore;
}

/** Sul fronte, il suggerimento a valutarsi; sul retro, i due bottoni di voto. */
function barraInferiore(vista: Extract<VistaFlashcard, { stato: 'run' }>, callback: CallbackFlashcard): HTMLDivElement {
  const barra = elemento('div', {
    borderTop: '1px solid var(--gray-200)',
    padding: '14px 16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  });
  if (vista.girata) {
    const griglia = elemento('div', { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' });
    griglia.append(
      bottoneVoto('outline-dark', 'Non lo sapevo', () => callback.onValuta('non-sapevo')),
      bottoneVoto('solid-blue', 'Lo sapevo', () => callback.onValuta('sapevo')),
    );
    barra.appendChild(griglia);
  } else {
    barra.appendChild(
      testo('Gira la carta per autovalutarti', {
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--gray-400)',
        padding: '19px 0',
      }),
    );
  }
  return barra;
}

function areaVuota(callback: CallbackFlashcard): HTMLDivElement {
  const div = elemento('div', {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    padding: '56px 32px',
    textAlign: 'center',
  });
  div.append(
    testo('Nessuna carta per le sezioni scelte', { fontSize: '17px', fontWeight: '600', color: 'var(--gray-800)' }),
    testo('Torna ai mazzi e scegli almeno una sezione con delle carte.', {
      fontSize: '13px',
      color: 'var(--gray-500)',
      lineHeight: '1.5',
      maxWidth: '320px',
    }),
    bottoneSecondario('Torna ai mazzi', () => callback.onIndietro()),
  );
  return div;
}

/**
 * Disegna `vista` dentro `radice`, sostituendo tutto il contenuto
 * precedente. Lo stato `vuota` mostra solo "← Mazzi" e il messaggio (F-002:
 * "nothing written to storage" — niente contatore/progresso, perché nessuna
 * corsa è in atto). Lo stato `run` mostra sempre l'intestazione completa;
 * la notice, se c'è, sta subito sotto.
 */
export function disegna(radice: HTMLElement, vista: VistaFlashcard, callback: CallbackFlashcard): void {
  radice.replaceChildren();

  if (vista.stato === 'vuota') {
    const headerMinimo = elemento('div', { padding: '16px 16px 12px', borderBottom: '1px solid var(--gray-200)' });
    headerMinimo.appendChild(linkIndietro(callback));
    radice.append(headerMinimo, areaVuota(callback));
    return;
  }

  const blocchi: HTMLElement[] = [intestazione(vista, callback)];
  if (vista.notice === 'ripresa') {
    blocchi.push(alert('blue', 'Serie ripresa', 'Riprendi da dove eri rimasto.'));
  }
  if (vista.notice === 'invalid-input') {
    blocchi.push(alert('yellow', 'Sezione non trovata', 'Serie avviata su tutte le sezioni, 8 carte.'));
  }
  blocchi.push(areaCarta(vista, callback), barraInferiore(vista, callback));
  radice.append(...blocchi);
}
