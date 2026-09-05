// src/pages/home.ts — punto d'ingresso di R-001, la home: scelta del mazzo e
// delle sezioni (F-001), ultimo punteggio per mazzo (F-010). Vedi
// akaaso/09-tasks/P1-SITO-UI-home.md e lo screen D-001
// (akaaso/06-design/index.md, artboard _artboards/index.dc.html).
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzi">` → `RiepilogoMazzo[]`, un
//   elemento per mazzo nell'ordine di `content/sezioni.json`:
//   `{ id, nome, tipo, carte, sezioni: [{ id, etichetta, carte }] }`.
//
// Stato del picker: tenuto solo in memoria (mai persistito — F-001, "nothing
// remembered about the picker itself between visits"). Un mazzo alla volta è
// aperto (fisarmonica: il primo di default; toccare l'intestazione di un
// mazzo chiuso lo apre e chiude gli altri); le sezioni scelte sono per
// mazzo, tutte selezionate all'inizio; modalità, direzione e carte per serie
// sono i controlli condivisi della barra inferiore e si applicano al mazzo
// aperto. Ogni cambiamento ridisegna `#app` da zero: quattro mazzi, poche
// sezioni ciascuno — non serve un motore di patch.

import '../styles.css';
import '../sito/preline.ts';
import '../sito/home.css';
import type { RiepilogoMazzo } from '../mazzi/assembla.ts';
import type { Modo } from '../mazzi/tipi.ts';
import { ultimoRisultato } from '../allenamento/storage.ts';
import { etichettaInizia, urlSerie, type CarteScelte, type ModalitaPicker, type StatoPicker } from '../sito/picker.ts';

const BASE = import.meta.env.BASE_URL;

const ETICHETTA_TIPO: Record<RiepilogoMazzo['tipo'], string> = {
  simbolo: 'Simboli',
  riga: 'Righe',
  esempio: 'Esempi',
  'simbolo-isom': 'Simboli ISOM',
};

const ETICHETTA_MODO: Record<Modo, string> = {
  flashcard: 'flash card',
  quiz: 'quiz',
};

type Stato = {
  aperto: string;
  sezioniScelte: Map<string, Set<string>>;
  modo: ModalitaPicker;
  direzione?: 'inversa';
  carte: CarteScelte;
};

function statoIniziale(mazzi: RiepilogoMazzo[]): Stato {
  const sezioniScelte = new Map<string, Set<string>>();
  for (const mazzo of mazzi) {
    sezioniScelte.set(mazzo.id, new Set(mazzo.sezioni.map((s) => s.id)));
  }
  return {
    aperto: mazzi[0]?.id ?? '',
    sezioniScelte,
    modo: 'flashcard',
    carte: '8',
  };
}

/** La vista `StatoPicker` (picker.ts) del mazzo aperto, per `urlSerie`/`etichettaInizia`. */
function statoPickerPer(stato: Stato, mazzo: RiepilogoMazzo): StatoPicker {
  const scelte = stato.sezioniScelte.get(mazzo.id) ?? new Set<string>();
  return {
    mazzo: mazzo.id,
    sezioniTotali: mazzo.sezioni.map((s) => s.id),
    sezioniScelte: mazzo.sezioni.filter((s) => scelte.has(s.id)).map((s) => s.id),
    modo: stato.modo,
    direzione: stato.direzione,
    carte: stato.carte,
  };
}

// -------------------------------------------------------------- costruttori DOM

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opzioni: { classe?: string; testo?: string; attrs?: Record<string, string> } = {},
): HTMLElementTagNameMap[K] {
  const nodo = document.createElement(tag);
  if (opzioni.classe) nodo.className = opzioni.classe;
  if (opzioni.testo !== undefined) nodo.textContent = opzioni.testo;
  if (opzioni.attrs) {
    for (const [chiave, valore] of Object.entries(opzioni.attrs)) nodo.setAttribute(chiave, valore);
  }
  return nodo;
}

/** Il segno di spunta bianco dentro la casella piena (Checkbox.prompt.md). */
function svgSpunta(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg') as unknown as SVGSVGElement;
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '3.4');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const polilinea = document.createElementNS(ns, 'polyline');
  polilinea.setAttribute('points', '20 6 9 17 4 12');
  svg.append(polilinea);
  return svg;
}

/** Una riga di sezione: casella 22 px dentro una riga ≥ 44 px, tutta cliccabile. */
function costruisciRigaSezione(
  sezione: RiepilogoMazzo['sezioni'][number],
  scelta: boolean,
  onCambia: (scelta: boolean) => void,
): HTMLLabelElement {
  const riga = el('label', { classe: 'orient-riga' });

  const casella = el('span', { classe: 'orient-checkbox' });
  const input = el('input', { attrs: { type: 'checkbox' } });
  input.checked = scelta;
  input.addEventListener('change', () => onCambia(input.checked));
  const vista = el('span', { classe: 'orient-checkbox__vista', attrs: { 'aria-hidden': 'true' } });
  vista.append(svgSpunta());
  casella.append(input, vista);

  const etichetta = el('span', { classe: 'orient-riga__etichetta', testo: sezione.etichetta });
  const conteggio = el('span', { classe: 'orient-riga__conteggio', testo: `${sezione.carte} carte` });

  riga.append(casella, etichetta, conteggio);
  return riga;
}

/** Una card di mazzo: intestazione (tocca per aprire) + sezioni se aperto. */
function costruisciMazzo(mazzo: RiepilogoMazzo, stato: Stato, ridisegna: () => void): HTMLElement {
  const aperto = stato.aperto === mazzo.id;
  const card = el('div', { classe: 'orient-mazzo' });

  const intestazione = el('div', {
    classe: 'orient-mazzo__intestazione',
    attrs: { role: 'button', tabindex: '0', 'aria-expanded': String(aperto) },
  });
  intestazione.addEventListener('click', () => {
    if (stato.aperto !== mazzo.id) {
      stato.aperto = mazzo.id;
      ridisegna();
    }
  });
  intestazione.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      if (stato.aperto !== mazzo.id) {
        stato.aperto = mazzo.id;
        ridisegna();
      }
    }
  });

  const info = el('div', { classe: 'orient-mazzo__info' });
  info.append(
    el('div', { classe: 'orient-mazzo__nome', testo: mazzo.nome }),
    el('div', { classe: 'orient-mazzo__meta', testo: `${ETICHETTA_TIPO[mazzo.tipo]} · ${mazzo.carte} carte` }),
  );

  const risultato = ultimoRisultato(mazzo.id);
  if (risultato) {
    const rigaUltimo = el('div', { classe: 'orient-mazzo__ultimo' });
    rigaUltimo.append(
      document.createTextNode(`Ultima serie ${risultato.giuste} / ${risultato.viste} · ${ETICHETTA_MODO[risultato.modo]}`),
    );
    const link = el('a', {
      testo: 'Risultati',
      attrs: { href: `${BASE}${mazzo.id}/risultati/` },
    });
    // La riga d'intestazione apre/chiude il mazzo: il link non deve
    // propagare il click (o Invio/Spazio) a quel gestore.
    link.addEventListener('click', (evento) => evento.stopPropagation());
    link.addEventListener('keydown', (evento) => evento.stopPropagation());
    rigaUltimo.append(link);
    info.append(rigaUltimo);
  }

  const caret = el('div', { classe: 'orient-mazzo__caret', testo: aperto ? 'CHIUDI' : 'APRI' });
  intestazione.append(info, caret);
  card.append(intestazione);

  if (aperto) {
    const scelte = stato.sezioniScelte.get(mazzo.id) ?? new Set<string>();
    const sezioni = el('div', { classe: 'orient-mazzo__sezioni' });
    for (const sezione of mazzo.sezioni) {
      sezioni.append(
        costruisciRigaSezione(sezione, scelte.has(sezione.id), (scelta) => {
          if (scelta) scelte.add(sezione.id);
          else scelte.delete(sezione.id);
          ridisegna();
        }),
      );
    }
    card.append(sezioni);
  }

  return card;
}

/** Un gruppo di radio a bottone (segmento, pillola o chip), un `<input>` + la sua vista. */
function costruisciOpzione(
  classeOpzione: string,
  classeVista: string,
  nome: string,
  valore: string,
  scelto: boolean,
  testo: string,
  onScelta: () => void,
): HTMLLabelElement {
  const opzione = el('label', { classe: classeOpzione });
  const input = el('input', { attrs: { type: 'radio', name: nome, value: valore } });
  input.checked = scelto;
  input.addEventListener('change', () => {
    if (input.checked) onScelta();
  });
  const vista = el('span', { classe: classeVista, testo });
  opzione.append(input, vista);
  return opzione;
}

/** La barra fissa in fondo: segmento modalità, pillole direzione (solo quiz), chip carte, bottone Inizia. */
function costruisciBarra(stato: Stato, mazzi: RiepilogoMazzo[], ridisegna: () => void): HTMLElement {
  const barra = el('div', { classe: 'orient-barra' });

  const segmento = el('div', { classe: 'orient-segmento', attrs: { role: 'radiogroup', 'aria-label': 'Modalità' } });
  segmento.append(
    costruisciOpzione('orient-opzione', 'orient-opzione__vista', 'modo', 'flashcard', stato.modo === 'flashcard', 'Flash card', () => {
      stato.modo = 'flashcard';
      ridisegna();
    }),
    costruisciOpzione('orient-opzione', 'orient-opzione__vista', 'modo', 'quiz', stato.modo === 'quiz', 'Quiz', () => {
      stato.modo = 'quiz';
      ridisegna();
    }),
  );
  barra.append(segmento);

  if (stato.modo === 'quiz') {
    const pillole = el('div', { classe: 'orient-pillole', attrs: { role: 'radiogroup', 'aria-label': 'Direzione' } });
    pillole.append(
      costruisciOpzione('orient-pillola', 'orient-pillola__vista', 'direzione', 'diretta', stato.direzione !== 'inversa', 'Simbolo → nome', () => {
        stato.direzione = undefined;
        ridisegna();
      }),
      costruisciOpzione('orient-pillola', 'orient-pillola__vista', 'direzione', 'inversa', stato.direzione === 'inversa', 'Nome → simbolo', () => {
        stato.direzione = 'inversa';
        ridisegna();
      }),
    );
    barra.append(pillole);
  }

  const righeCarte = el('div', { classe: 'orient-carte' });
  righeCarte.append(el('span', { classe: 'orient-carte__etichetta', testo: 'Carte' }));
  const gruppoCarte = el('div', {
    classe: 'orient-carte',
    attrs: { role: 'radiogroup', 'aria-label': 'Carte per serie' },
  });
  for (const valore of ['8', '12', '23', 'tutte'] as const) {
    gruppoCarte.append(
      costruisciOpzione('orient-chip', 'orient-chip__vista', 'carte', valore, stato.carte === valore, valore, () => {
        stato.carte = valore;
        ridisegna();
      }),
    );
  }
  righeCarte.append(gruppoCarte);
  barra.append(righeCarte);

  const mazzoAperto = mazzi.find((m) => m.id === stato.aperto);
  if (mazzoAperto) {
    const pickerStato = statoPickerPer(stato, mazzoAperto);
    const { etichetta, disabilitato } = etichettaInizia(pickerStato, mazzi);
    if (disabilitato) {
      const bottone = el('button', { classe: 'orient-inizia', testo: etichetta, attrs: { type: 'button' } });
      bottone.disabled = true;
      barra.append(bottone);
    } else {
      const href = `${BASE}${urlSerie(pickerStato)}`;
      const link = el('a', { classe: 'orient-inizia', testo: etichetta, attrs: { href } });
      barra.append(link);
    }
  }

  return barra;
}

/** Ridisegna `#app` per intero dallo stato corrente (testabile: vedi picker.test.ts). */
export function renderHome(app: HTMLElement, mazzi: RiepilogoMazzo[]): void {
  // Titolo per lettori di schermo e per lo smoke test (`main#app h1`); il
  // wordmark visibile e la riga d'aiuto vivono già nell'header del template
  // (src/sito/templates/home.html), che l'artboard rispecchia.
  const titolo = el('h1', { classe: 'sr-only', testo: app.dataset.titolo ?? 'orient' });

  if (mazzi.length === 0) {
    app.replaceChildren(titolo);
    return;
  }

  const stato = statoIniziale(mazzi);

  function ridisegna(): void {
    const contenitore = el('div', { classe: 'orient-home' });
    const lista = el('div', { classe: 'orient-home__lista' });
    for (const mazzo of mazzi) {
      lista.append(costruisciMazzo(mazzo, stato, ridisegna));
    }
    contenitore.append(lista, costruisciBarra(stato, mazzi, ridisegna));
    app.replaceChildren(titolo, contenitore);
  }

  ridisegna();
}

const app = document.getElementById('app');
if (app) {
  const script = document.getElementById('mazzi');
  const mazzi: RiepilogoMazzo[] = script?.textContent ? (JSON.parse(script.textContent) as RiepilogoMazzo[]) : [];
  renderHome(app, mazzi);
}
