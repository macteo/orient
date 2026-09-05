/// <reference types="vite/client" />
// src/pages/fonti.ts — entry point for R-005, fonti, attribuzioni e licenze
// (F-005 / D-005).
//
// Renders the whole screen from the inlined licence register
// (`<script type="application/json" id="fonti">`, verbatim `content/fonti.json`:
// `{ v, contatto, fonti: Fonte[] }`) with no framework, following the same
// plain-DOM style as `src/allenamento/facce/cella.ts`: elements built with
// `document.createElement`, coloured and sized with the design-system's CSS
// custom properties (`design-system/tokens/*.css`), never a literal hex or a
// foreign `font-family`.
//
// `renderFonti` is exported and pure with respect to the rest of the
// document (it only touches the `app` element it is given), so a jsdom test
// can call it directly on a detached container with a fixture register —
// see `fonti.test.ts` — without needing the emitted page's own script tags.

import '../styles.css';
import '../sito/preline.ts';
import testoBsd from '../../content/licenze/purple-pen-bsd.txt?raw';

export type Licenza = { nome: string; url?: string; testoFile?: string };

export type Fonte = {
  id: string;
  titolo: string;
  autori: string;
  editore?: string;
  edizione?: string;
  data?: string;
  licenza: Licenza;
  cosaUsiamo: string;
  attribuzione: string;
  url?: string;
};

export type Registro = { v: number; contatto: string; fonti: Fonte[] };

type ColoreBadge = 'gray' | 'green' | 'blue';

/**
 * Colore della Badge per famiglia di licenza (screen D-005: "licence Badge,
 * soft, colour by licence family as the artboard" — `_artboards/fonti.dc.html`
 * usa gray per IOF, green per BSD/MIT/OFL, blue per CC BY-ND). Riconosciuto
 * per parole chiave nel nome così che una fonte non ancora vista (la settima
 * fonte di prova del test, o una futura voce del registro) ricada su gray
 * invece di far fallire il render.
 */
function coloreLicenza(nome: string): ColoreBadge {
  if (/\bBSD\b/i.test(nome) || /\bMIT\b/i.test(nome) || /open font license|\bOFL\b/i.test(nome)) return 'green';
  if (/CC BY|Creative Commons/i.test(nome)) return 'blue';
  return 'gray';
}

const SFONDO_BADGE: Record<ColoreBadge, { sfondo: string; testo: string }> = {
  gray: { sfondo: 'var(--gray-100)', testo: 'var(--gray-700)' },
  green: { sfondo: 'var(--green-100)', testo: 'var(--green-700)' },
  blue: { sfondo: 'var(--blue-100)', testo: 'var(--blue-700)' },
};

/** Badge.prompt.md — variant soft, pill. */
function badge(etichetta: string, colore: ColoreBadge): HTMLSpanElement {
  const span = document.createElement('span');
  const { sfondo, testo } = SFONDO_BADGE[colore];
  span.textContent = etichetta;
  span.className = 'inline-flex shrink-0 items-center text-xs font-semibold';
  span.style.padding = '3px 10px';
  span.style.borderRadius = 'var(--radius-full)';
  span.style.background = sfondo;
  span.style.color = testo;
  return span;
}

/** Button.prompt.md — variant outline, color dark, size md; reso come `<a>` (href → mailto). */
function bottoneOutlineDark(etichetta: string, href: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = etichetta;
  a.className = 'flex w-full items-center justify-center text-sm font-semibold no-underline';
  a.style.height = '44px';
  a.style.boxSizing = 'border-box';
  a.style.borderRadius = 'var(--radius-button)';
  a.style.border = '1px solid var(--gray-800)';
  a.style.color = 'var(--gray-800)';
  return a;
}

/** Un link esterno "anchor only" (nessuna richiesta: solo un `<a>` con testo visibile). */
function linkEsterno(etichetta: string, href: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = etichetta;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'text-xs font-medium no-underline';
  a.style.color = 'var(--tint-600)';
  return a;
}

function testo(
  contenuto: string,
  opzioni: { classe?: string; colore?: string; corsivo?: boolean } = {},
): HTMLParagraphElement {
  const p = document.createElement('p');
  p.textContent = contenuto;
  if (opzioni.classe) p.className = opzioni.classe;
  if (opzioni.colore) p.style.color = opzioni.colore;
  if (opzioni.corsivo) p.style.fontStyle = 'italic';
  return p;
}

/**
 * Card.prompt.md — variant default (bordo gray-200 + ombra soft), una per
 * fonte: titolo e Badge della licenza, autori, metadati opzionali (editore,
 * edizione, data), "Cosa usiamo:", l'attribuzione in corsivo, e i link (alla
 * licenza e/o alla fonte) quando il registro li fornisce.
 */
function cardFonte(fonte: Fonte): HTMLElement {
  const card = document.createElement('article');
  card.dataset.fonteId = fonte.id;
  card.className = 'flex flex-col gap-2';
  card.style.background = 'var(--white)';
  card.style.border = '1px solid var(--gray-200)';
  card.style.borderRadius = 'var(--radius-card)';
  card.style.boxShadow = 'var(--shadow-sm)';
  card.style.padding = '14px 16px';

  const testata = document.createElement('div');
  testata.className = 'flex items-start gap-2.5';
  const titolo = document.createElement('h2');
  titolo.textContent = fonte.titolo;
  titolo.className = 'flex-1 text-sm font-semibold';
  titolo.style.color = 'var(--gray-800)';
  testata.append(titolo, badge(fonte.licenza.nome, coloreLicenza(fonte.licenza.nome)));
  card.append(testata);

  card.append(testo(fonte.autori, { classe: 'text-xs', colore: 'var(--gray-500)' }));

  const meta = [fonte.editore, fonte.edizione, fonte.data].filter((valore): valore is string => Boolean(valore));
  if (meta.length > 0) card.append(testo(meta.join(' · '), { classe: 'text-xs', colore: 'var(--gray-400)' }));

  const uso = document.createElement('p');
  uso.className = 'text-sm';
  uso.style.color = 'var(--gray-600)';
  const etichettaUso = document.createElement('span');
  etichettaUso.textContent = 'Cosa usiamo: ';
  etichettaUso.className = 'font-semibold';
  etichettaUso.style.color = 'var(--gray-800)';
  uso.append(etichettaUso, document.createTextNode(fonte.cosaUsiamo));
  card.append(uso);

  card.append(testo(fonte.attribuzione, { classe: 'text-xs', colore: 'var(--gray-500)', corsivo: true }));

  const collegamenti: HTMLAnchorElement[] = [];
  if (fonte.licenza.url) collegamenti.push(linkEsterno('Testo della licenza', fonte.licenza.url));
  if (fonte.url) collegamenti.push(linkEsterno('Pagina della fonte', fonte.url));
  if (collegamenti.length > 0) {
    const rigaLink = document.createElement('div');
    rigaLink.className = 'flex flex-wrap gap-3';
    rigaLink.append(...collegamenti);
    card.append(rigaLink);
  }

  return card;
}

/**
 * Renderizza l'intera pagina fonti dentro `app` (F-005, D-005): intestazione
 * con link "← Mazzi", un Card per fonte nell'ordine del registro (AC-1: una
 * nuova voce in `content/fonti.json` compare senza modifiche al codice), la
 * nota sulle righe `generata`, la barra inferiore con il Button di contatto
 * (`mailto:` con oggetto "orient") e la dichiarazione sulla privacy, e infine
 * il testo integrale della licenza BSD di Purple Pen (AC-2).
 */
export function renderFonti(app: HTMLElement, registro: Registro, titolo: string): void {
  app.textContent = '';
  app.className = 'mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-5';

  const intestazione = document.createElement('div');
  intestazione.className = 'flex flex-col gap-1.5';
  const indietro = document.createElement('a');
  indietro.href = '../';
  indietro.textContent = '← Mazzi';
  indietro.className = 'self-start text-xs font-medium no-underline';
  indietro.style.color = 'var(--gray-500)';
  const h1 = document.createElement('h1');
  h1.textContent = titolo;
  h1.className = 'text-xl font-bold tracking-tight';
  h1.style.color = 'var(--gray-800)';
  intestazione.append(
    indietro,
    h1,
    testo('Da dove vengono i simboli e i testi di orient, e a quali condizioni.', {
      classe: 'text-sm',
      colore: 'var(--gray-500)',
    }),
  );
  app.append(intestazione);

  const elenco = document.createElement('div');
  elenco.className = 'flex flex-col gap-3';
  for (const fonte of registro.fonti) elenco.append(cardFonte(fonte));
  app.append(elenco);

  const nota = document.createElement('p');
  nota.className = 'text-xs';
  nota.style.color = 'var(--gray-500)';
  const generata = document.createElement('strong');
  generata.textContent = 'generata';
  nota.append(
    'Le righe segnate ',
    generata,
    ' sono composte da orient con i nomi ufficiali dei simboli; non compaiono nelle fonti.',
  );
  app.append(nota);

  const barra = document.createElement('div');
  barra.className = 'flex flex-col gap-2 border-t pt-4';
  barra.style.borderColor = 'var(--gray-200)';
  const oggetto = encodeURIComponent('orient');
  barra.append(bottoneOutlineDark('Scrivi a chi cura il sito', `mailto:${registro.contatto}?subject=${oggetto}`));
  barra.append(
    testo('Un sito di famiglia per imparare i simboli. Nessun dato lascia il tuo telefono.', {
      classe: 'text-center text-xs',
      colore: 'var(--gray-400)',
    }),
  );
  app.append(barra);

  const bsd = document.createElement('section');
  bsd.className = 'flex flex-col gap-2 border-t pt-4';
  bsd.style.borderColor = 'var(--gray-200)';
  const bsdTitolo = document.createElement('h2');
  bsdTitolo.textContent = 'Licenza BSD a tre clausole — pittogrammi Purple Pen';
  bsdTitolo.className = 'text-sm font-semibold';
  bsdTitolo.style.color = 'var(--gray-800)';
  const pre = document.createElement('pre');
  pre.className = 'whitespace-pre-wrap text-xs';
  pre.style.color = 'var(--gray-600)';
  pre.style.fontFamily = 'var(--font-mono)';
  pre.textContent = testoBsd;
  bsd.append(bsdTitolo, pre);
  app.append(bsd);
}

const app = document.getElementById('app');
const scriptFonti = document.getElementById('fonti');
if (app && scriptFonti?.textContent) {
  const registro = JSON.parse(scriptFonti.textContent) as Registro;
  renderFonti(app, registro, app.dataset.titolo ?? 'Fonti e licenze');
}
