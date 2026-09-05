// src/allenamento/quiz-dom.ts — il DOM del quiz (F-003, R-003): la domanda,
// le quattro opzioni (righe da 56 px in avanti; tessere 2×2 in inversa, una
// sola colonna a piena larghezza per il mazzo a righe), il trattamento
// Verdetto (design-system/components/orient/Verdetto.prompt.md) e la barra
// inferiore. Nessuno stato qui: `src/pages/quiz.ts` tiene la `Serie`, calcola
// la `VistaQuiz` a ogni cambiamento e richiama `renderizza`.

import type { Carta, MazzoBuild } from '../mazzi/tipi.ts';
import { fronte } from './facce/index.ts';
import type { Domanda } from './quiz.ts';

// -------------------------------------------------------------- contenuto

/**
 * Il nome mostrato per un'opzione (e per il titolo del pannello): per le
 * righe e gli esempi non c'è un nome separato dalla frase — è l'intera
 * risposta (facce/riga.ts, facce/esempio.ts) — quindi si usa `testo`.
 */
function nomeOpzione(carta: Carta): string {
  switch (carta.tipo) {
    case 'simbolo':
      return carta.simbolo?.nome ?? carta.id;
    case 'simbolo-isom':
      return carta.isom?.nome ?? carta.id;
    case 'riga':
      return carta.riga?.testo ?? carta.id;
    case 'esempio':
      return carta.esempio?.testo ?? carta.id;
    default:
      return carta.id;
  }
}

/** La definizione verbatim mostrata nel pannello del verdetto. */
function definizione(carta: Carta): string {
  switch (carta.tipo) {
    case 'simbolo':
      return carta.simbolo?.descrizione ?? '';
    case 'simbolo-isom':
      return carta.isom?.descrizione ?? '';
    case 'riga':
      return carta.riga?.testo ?? '';
    case 'esempio':
      return carta.esempio?.testo ?? '';
    default:
      return '';
  }
}

/** Prompts (D-003 content rules): *Quale oggetto?* / *Quale simbolo?* / *Cosa dice questa riga?*. */
function testoPrompt(carta: Carta, direzione: 'diretta' | 'inversa'): string {
  if (direzione === 'inversa') return 'Quale simbolo?';
  return carta.tipo === 'riga' ? 'Cosa dice questa riga?' : 'Quale oggetto?';
}

// ------------------------------------------------------------------ tipi

export type VistaQuiz =
  | { stato: 'vuoto' }
  | {
      stato: 'domanda';
      mazzo: MazzoBuild;
      domanda: Domanda;
      /** L'id della carta scelta, una volta risposto; assente prima. */
      scelta?: string;
      contatore: string;
      progresso: number;
      titoloSerie: string;
      notifica?: 'ripresa' | 'invalid-input';
      /** Vero sull'ultima carta della serie: il bottone legge "Vedi il risultato". */
      ultima: boolean;
    };

export type GestoriQuiz = {
  onScegli(idCarta: string): void;
  onAvanti(): void;
  onTornaAiMazzi(): void;
};

// -------------------------------------------------------------- helper DOM

function elemento<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  stile: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const stileEl = el.style as unknown as Record<string, string>;
  for (const [proprieta, valore] of Object.entries(stile)) {
    stileEl[proprieta] = valore;
  }
  return el;
}

/** "← Mazzi" e "Torna ai mazzi": tornano a R-001, abbandonando la serie (storage pulito). */
function linkMazzi(gestori: GestoriQuiz, testo: string, stile: Record<string, string>): HTMLAnchorElement {
  const a = elemento('a', { textDecoration: 'none', cursor: 'pointer', ...stile });
  a.href = '../../';
  a.textContent = testo;
  a.addEventListener('click', () => gestori.onTornaAiMazzi());
  return a;
}

// ------------------------------------------------------------------ header

function barraIntestazione(vista: Extract<VistaQuiz, { stato: 'domanda' }>, gestori: GestoriQuiz): HTMLElement {
  const contenitore = elemento('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '0 0 12px',
  });

  const riga = elemento('div', { display: 'flex', alignItems: 'center', gap: '12px' });
  const indietro = linkMazzi(gestori, '← Mazzi', {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-500)',
  });
  const spaziatore = elemento('div', { flex: '1' });
  const contatore = elemento('div', { fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' });
  contatore.textContent = vista.contatore;
  riga.append(indietro, spaziatore, contatore);

  const progressoEsterno = elemento('div', {
    width: '100%',
    height: '6px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--gray-200)',
    overflow: 'hidden',
  });
  progressoEsterno.setAttribute('role', 'progressbar');
  progressoEsterno.setAttribute('aria-valuenow', String(Math.round(vista.progresso)));
  progressoEsterno.setAttribute('aria-valuemin', '0');
  progressoEsterno.setAttribute('aria-valuemax', '100');
  const progressoInterno = elemento('div', {
    height: '100%',
    borderRadius: 'var(--radius-full)',
    background: 'var(--tint-600)',
    width: `${Math.max(0, Math.min(100, vista.progresso))}%`,
  });
  progressoEsterno.appendChild(progressoInterno);

  const titolo = elemento('div', { fontSize: '12px', color: 'var(--gray-500)' });
  titolo.textContent = vista.titoloSerie;

  contenitore.append(riga, progressoEsterno, titolo);
  return contenitore;
}

const COPIA_NOTIFICA: Record<'ripresa' | 'invalid-input', { colore: string; titolo: string; testo: string }> = {
  ripresa: { colore: 'blue', titolo: 'Serie ripresa', testo: 'Riprendi da dove eri rimasto.' },
  'invalid-input': {
    colore: 'yellow',
    titolo: 'Sezione non trovata',
    testo: 'Serie avviata su tutte le sezioni, 8 carte.',
  },
};

/** L'Alert (soft) di ripresa o di query non valida (D-003: mostrato una sola volta). */
function bannerNotifica(notifica: 'ripresa' | 'invalid-input'): HTMLElement {
  const { colore, titolo, testo } = COPIA_NOTIFICA[notifica];
  const div = elemento('div', {
    margin: '0 0 12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-xl)',
    background: `var(--${colore}-50)`,
    color: `var(--${colore}-800)`,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  });
  div.setAttribute('role', 'status');
  const titoloEl = elemento('div', { fontSize: '13px', fontWeight: '600' });
  titoloEl.textContent = titolo;
  const testoEl = elemento('div', { fontSize: '12px', lineHeight: '1.5' });
  testoEl.textContent = testo;
  div.append(titoloEl, testoEl);
  return div;
}

// ------------------------------------------------------------- domanda

/** La carta domandata: FacciaCarta a `carta` in avanti, il nome/frase in inversa. */
function cartaDomanda(vista: Extract<VistaQuiz, { stato: 'domanda' }>): HTMLElement {
  const carta = vista.mazzo.carte[vista.domanda.carta];
  const direzione = vista.domanda.direzione;
  const etichetta = elemento('div', {
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: 'var(--gray-400)',
  });
  etichetta.textContent = testoPrompt(carta, direzione);

  if (direzione === 'diretta') {
    // FacciaCarta.prompt.md: "the question face at `carta`" — la superficie
    // che `fronte()` ritorna è già la carta bordata; l'etichetta del prompt
    // ne diventa il primo figlio, senza annidare un secondo riquadro.
    const faccia = fronte(carta, 'carta');
    faccia.prepend(etichetta);
    faccia.style.margin = '0 auto';
    return faccia;
  }

  const box = elemento('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px 24px',
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-sm)',
    boxSizing: 'border-box',
    width: '100%',
  });
  const nome = elemento('div', {
    fontSize: '22px',
    fontWeight: '600',
    letterSpacing: '-.02em',
    color: 'var(--gray-800)',
    textAlign: 'center',
  });
  nome.textContent = nomeOpzione(carta);
  box.append(etichetta, nome);
  return box;
}

// ------------------------------------------------------------------- opzioni

type StatoOpzione = 'nessuno' | 'giusta' | 'sbagliata' | 'sfumata';

function statoDi(idOpzione: string, domanda: Domanda, scelta: string | undefined): StatoOpzione {
  if (scelta === undefined) return 'nessuno';
  const idGiusta = domanda.opzioni[domanda.giusta];
  if (idOpzione === idGiusta) return 'giusta';
  if (idOpzione === scelta) return 'sbagliata';
  return 'sfumata';
}

function marcaDi(stato: StatoOpzione): string {
  if (stato === 'giusta') return '✓';
  if (stato === 'sbagliata') return '✕';
  return '';
}

/** Verdetto.prompt.md: teal/✓ la giusta, red/✕ la scelta sbagliata, le altre sfumate al 50%. */
function stileStatoOpzione(stato: StatoOpzione): Record<string, string> {
  switch (stato) {
    case 'giusta':
      return { borderColor: 'var(--teal-500)', background: 'var(--teal-50)' };
    case 'sbagliata':
      return { borderColor: 'var(--red-500)', background: 'var(--red-50)' };
    case 'sfumata':
      return { opacity: '.5' };
    default:
      return {};
  }
}

/** Una riga opzione (56 px, avanti): nome della carta + marca. */
function rigaOpzione(idOpzione: string, carta: Carta, stato: StatoOpzione, gestori: GestoriQuiz): HTMLButtonElement {
  const bottone = elemento('button', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '56px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--gray-200)',
    background: 'var(--white)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    boxSizing: 'border-box',
    textAlign: 'left',
    ...stileStatoOpzione(stato),
  });
  bottone.type = 'button';
  const nome = elemento('div', { flex: '1', fontSize: '15px', fontWeight: '500', color: 'var(--gray-800)' });
  nome.textContent = nomeOpzione(carta);
  const marca = elemento('div', { fontSize: '15px', fontWeight: '600', color: 'var(--gray-800)' });
  marca.textContent = marcaDi(stato);
  bottone.append(nome, marca);
  bottone.disabled = stato !== 'nessuno';
  bottone.addEventListener('click', () => gestori.onScegli(idOpzione));
  return bottone;
}

/** Una tessera opzione (116 px, inversa): FacciaCarta a `tile` + marca, dentro un bottone. */
function tesseraOpzione(idOpzione: string, carta: Carta, stato: StatoOpzione, gestori: GestoriQuiz): HTMLButtonElement {
  const superficie = fronte(carta, 'tile');
  superficie.style.maxWidth = '100%';
  superficie.style.width = '100%';
  superficie.style.boxSizing = 'border-box';
  superficie.style.cursor = 'pointer';
  const stile = stileStatoOpzione(stato);
  for (const [proprieta, valore] of Object.entries(stile)) {
    (superficie.style as unknown as Record<string, string>)[proprieta] = valore;
  }
  const marca = elemento('div', { fontSize: '14px', fontWeight: '600', textAlign: 'center', color: 'var(--gray-800)' });
  marca.textContent = marcaDi(stato);
  superficie.appendChild(marca);

  const bottone = elemento('button', {
    display: 'block',
    width: '100%',
    padding: '0',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
  });
  bottone.type = 'button';
  bottone.disabled = stato !== 'nessuno';
  bottone.appendChild(superficie);
  bottone.addEventListener('click', () => gestori.onScegli(idOpzione));
  return bottone;
}

/** Righe (avanti) o tessere (inversa, 2×2 — 1 colonna a piena larghezza per il mazzo a righe). */
function elencoOpzioni(vista: Extract<VistaQuiz, { stato: 'domanda' }>, gestori: GestoriQuiz): HTMLElement {
  const { domanda, mazzo, scelta } = vista;

  if (domanda.direzione === 'diretta') {
    const lista = elemento('div', { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' });
    for (const idOpzione of domanda.opzioni) {
      const carta = mazzo.carte[idOpzione];
      lista.appendChild(rigaOpzione(idOpzione, carta, statoDi(idOpzione, domanda, scelta), gestori));
    }
    return lista;
  }

  const cartaInterrogata = mazzo.carte[domanda.carta];
  const unaColonna = cartaInterrogata.tipo === 'riga';
  const griglia = elemento('div', {
    display: 'grid',
    gap: '10px',
    width: '100%',
    gridTemplateColumns: unaColonna ? '1fr' : '1fr 1fr',
  });
  for (const idOpzione of domanda.opzioni) {
    const carta = mazzo.carte[idOpzione];
    griglia.appendChild(tesseraOpzione(idOpzione, carta, statoDi(idOpzione, domanda, scelta), gestori));
  }
  return griglia;
}

// ------------------------------------------------------------------ verdetto

/** Il pannello Alert sotto le opzioni: titolo esatto e definizione verbatim della carta corretta. */
function pannelloVerdetto(vista: Extract<VistaQuiz, { stato: 'domanda' }>): HTMLElement | null {
  if (vista.scelta === undefined) return null;
  const { domanda, mazzo } = vista;
  const idCorretta = domanda.opzioni[domanda.giusta];
  const cartaCorretta = mazzo.carte[idCorretta];
  const giusta = vista.scelta === idCorretta;
  const colore = giusta ? 'teal' : 'red';

  const div = elemento('div', {
    borderRadius: 'var(--radius-xl)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: `1px solid var(--${colore}-200)`,
    background: `var(--${colore}-50)`,
    color: `var(--${colore}-800)`,
  });
  div.setAttribute('role', 'status');
  div.setAttribute('aria-live', 'polite');
  const titolo = elemento('div', { fontSize: '14px', fontWeight: '600' });
  titolo.textContent = giusta ? 'Giusto' : `Sbagliato — ${nomeOpzione(cartaCorretta)}`;
  const corpo = elemento('div', { fontSize: '13px', lineHeight: '1.5' });
  corpo.textContent = definizione(cartaCorretta);
  div.append(titolo, corpo);
  return div;
}

// --------------------------------------------------------------- barra/vuoto

function barraInferiore(vista: Extract<VistaQuiz, { stato: 'domanda' }>, gestori: GestoriQuiz): HTMLElement {
  const contenitore = elemento('div', {
    borderTop: '1px solid var(--gray-200)',
    padding: '14px 0 4px',
  });
  if (vista.scelta === undefined) {
    const suggerimento = elemento('div', {
      textAlign: 'center',
      fontSize: '13px',
      color: 'var(--gray-400)',
      padding: '19px 0',
    });
    suggerimento.textContent = 'Scegli una risposta';
    contenitore.appendChild(suggerimento);
    return contenitore;
  }
  const bottone = elemento('button', {
    display: 'block',
    width: '100%',
    minHeight: '60px',
    borderRadius: 'var(--radius-button)',
    border: 'none',
    background: 'var(--tint-600)',
    color: 'var(--white)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  });
  bottone.type = 'button';
  bottone.textContent = vista.ultima ? 'Vedi il risultato' : 'Avanti';
  bottone.addEventListener('click', () => gestori.onAvanti());
  contenitore.appendChild(bottone);
  return contenitore;
}

function statoVuoto(gestori: GestoriQuiz): HTMLElement {
  const box = elemento('div', {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    padding: '48px 16px',
    textAlign: 'center',
    minHeight: '320px',
  });
  const titolo = elemento('div', { fontSize: '17px', fontWeight: '600', color: 'var(--gray-800)' });
  titolo.textContent = 'Nessuna carta per le sezioni scelte';
  const corpo = elemento('div', { fontSize: '13px', color: 'var(--gray-500)', lineHeight: '1.5' });
  corpo.textContent = 'Torna ai mazzi e scegli almeno una sezione con delle carte.';
  const bottone = linkMazzi(gestori, 'Torna ai mazzi', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0 20px',
    borderRadius: 'var(--radius-button)',
    border: '1px solid var(--gray-800)',
    color: 'var(--gray-800)',
    fontSize: '14px',
    fontWeight: '600',
  });
  box.append(titolo, corpo, bottone);
  return box;
}

// -------------------------------------------------------------------- render

/**
 * Disegna lo stato del quiz dentro `radice` (svuotata e ricostruita a ogni
 * chiamata). `radice` non è `#app`: `src/pages/quiz.ts` vi monta un
 * contenitore dedicato, cosicché l'`<h1>` del titolo di pagina (per lo smoke
 * F-006 AC-1) resti fuori da questa sostituzione.
 */
export function renderizza(radice: HTMLElement, vista: VistaQuiz, gestori: GestoriQuiz): void {
  radice.innerHTML = '';
  radice.style.display = 'flex';
  radice.style.flexDirection = 'column';
  radice.style.flex = '1';

  if (vista.stato === 'vuoto') {
    radice.appendChild(statoVuoto(gestori));
    return;
  }

  radice.appendChild(barraIntestazione(vista, gestori));
  if (vista.notifica) {
    radice.appendChild(bannerNotifica(vista.notifica));
  }

  const corpo = elemento('div', {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 0',
  });
  corpo.appendChild(cartaDomanda(vista));
  corpo.appendChild(elencoOpzioni(vista, gestori));
  const verdetto = pannelloVerdetto(vista);
  if (verdetto) corpo.appendChild(verdetto);
  radice.appendChild(corpo);

  radice.appendChild(barraInferiore(vista, gestori));
}
