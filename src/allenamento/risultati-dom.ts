// src/allenamento/risultati-dom.ts — the layout of R-004 (F-010, D-004):
// pure helpers that turn a deck's stored `Risultato[]` into a view-model
// (`costruisciVista`), and a DOM renderer (`renderizzaRisultati`) that draws
// the six states from `[mazzo].risultati.md` — default, nessun-errore,
// ripasso, conferma-cancellazione, empty, error — over the artboard's
// layout (`akaaso/06-design/_artboards/[mazzo].risultati*.dc.html`).
//
// No storage access and no navigation here: `src/pages/risultati.ts` reads
// `storage.ts`, decides what changed, and calls `renderizzaRisultati` again
// with a fresh view-model — this module only knows how to draw one.
//
// Components (`design-system/components/*.prompt.md`) are hand-built with
// inline styles reading design tokens, the same approach `facce/cella.ts`
// already takes for Badge: there is no compiled component library to import
// here, only Tailwind/Preline markup conventions and CSS custom properties.

import { fronte, retro } from './facce/index.ts';
import type { Carta, MazzoBuild, Risultato, Sezione } from '../mazzi/tipi.ts';

// ------------------------------------------------------------------ tipi

/** Una riga già pronta per la sezione Storico. */
export type RigaStorico = { quando: string; cosa: string; punteggio: string };

/** Nessun run per il mazzo (`empty`), o storage illeggibile (`error`, con `nota`). */
export type VistaVuota = { tipo: 'vuoto'; nota?: string };

/**
 * L'ultimo run del mazzo con tutto ciò che la schermata mostra: punteggio,
 * errori (nell'ordine in cui sono avvenuti), storico (tutti i run, dal più
 * recente), e i due overlay di stato (`ripasso`, `confermaCancellazione`)
 * che si sovrappongono allo stesso contenuto invece di sostituirlo.
 */
export type VistaCompleta = {
  tipo: 'completo';
  titolo: string;
  sottotitolo: string;
  punteggio: string;
  percentuale: number;
  didascalia: string;
  errori: Carta[];
  titoloErrori: string;
  storico: RigaStorico[];
  confermaCancellazione: boolean;
  ripasso: Carta | null;
};

export type VistaRisultati = VistaVuota | VistaCompleta;

/** Le azioni che la pagina cablerà allo storage e alla navigazione. */
export type AzioniRisultati = {
  ripassaConLeCarte(): void;
  ripeti(): void;
  tornaAiMazzi(): void;
  apriRipasso(idCarta: string): void;
  chiudiRipasso(): void;
  richiediCancellazione(): void;
  annullaCancellazione(): void;
  confermaCancellazione(): void;
};

// ------------------------------------------------------------- formattazione

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/**
 * `Risultato.data` è `isoAlMinuto` (serie.ts): `YYYY-MM-DDTHH:mm` in UTC,
 * senza il suffisso `Z`. Aggiungerlo prima di `new Date(...)` è l'unico modo
 * di rileggerlo come lo stesso istante ovunque giri il test, a prescindere
 * dal fuso dell'ambiente.
 */
function analizzaDataUtc(iso: string): Date {
  return new Date(`${iso}:00Z`);
}

function differenzaGiorniUtc(a: Date, b: Date): number {
  const giornoA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const giornoB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((giornoA - giornoB) / 86_400_000);
}

/** `Oggi, 18:40` / `Ieri, 21:05` / `2 set, 19:30` — data allo storico, al minuto. */
export function formattaQuando(iso: string, adesso: Date = new Date()): string {
  const data = analizzaDataUtc(iso);
  const ora = `${String(data.getUTCHours()).padStart(2, '0')}:${String(data.getUTCMinutes()).padStart(2, '0')}`;
  const giorni = differenzaGiorniUtc(adesso, data);
  if (giorni === 0) return `Oggi, ${ora}`;
  if (giorni === 1) return `Ieri, ${ora}`;
  return `${data.getUTCDate()} ${MESI[data.getUTCMonth()]}, ${ora}`;
}

function etichettaSezione(id: string, sezioni: Sezione[]): string {
  return sezioni.find((s) => s.id === id)?.etichetta ?? id;
}

/** `sezioni: []` in un `Risultato` vuol dire "nessun filtro": tutto il mazzo. */
export function elencoSezioni(ids: string[], sezioni: Sezione[]): string {
  if (ids.length === 0) return 'tutte le sezioni';
  return ids.map((id) => etichettaSezione(id, sezioni)).join(', ');
}

/** Il titolo del run in testa alla schermata: `<mazzo> · <sezioni>`, o `N sezioni` oltre due. */
export function titoloSerie(nomeMazzo: string, ids: string[], sezioni: Sezione[]): string {
  if (ids.length === 0) return `${nomeMazzo} · tutte le sezioni`;
  if (ids.length > 2) return `${ids.length} sezioni`;
  return `${nomeMazzo} · ${elencoSezioni(ids, sezioni)}`;
}

function contaCarte(n: number): string {
  return n === 1 ? '1 carta' : `${n} carte`;
}

/** La riga "cosa" di una voce di storico: `quiz · nome → simbolo · Colonna G · 12 carte`. */
export function descriviRun(r: Risultato, sezioni: Sezione[]): string {
  const carte = contaCarte(r.viste);
  if (r.ripasso) return `ripasso · ${carte}`;
  const modo = r.modo === 'quiz' ? 'quiz' : 'flash card';
  const direzione = r.modo === 'quiz' && r.direzione === 'inversa' ? 'nome → simbolo' : undefined;
  return [modo, direzione, elencoSezioni(r.sezioni, sezioni), carte].filter((p): p is string => p !== undefined).join(' · ');
}

function titoloEDidascalia(modo: Risultato['modo']): { titolo: string; didascalia: string } {
  return modo === 'quiz'
    ? { titolo: 'Quiz completato', didascalia: 'risposte corrette' }
    : { titolo: 'Serie completata', didascalia: 'carte che sapevi' };
}

// -------------------------------------------------------------- vista

export type OpzioniVista = {
  confermaCancellazione: boolean;
  ripassoId: string | null;
  adesso?: Date;
};

/**
 * Costruisce la vista dall'elenco dei run del mazzo (`storage.leggiRisultati()`
 * già filtrato su un solo mazzo, dal più vecchio al più recente — lo stesso
 * ordine con cui `storage.ts` li scrive). `[]` è lo stato `vuoto` (empty,
 * senza `nota`); l'errore di storage è deciso dal chiamante, che passa una
 * `VistaVuota` con `nota` propria invece di chiamare questa funzione.
 */
export function costruisciVista(mazzo: MazzoBuild, risultatiMazzo: Risultato[], opzioni: OpzioniVista): VistaRisultati {
  if (risultatiMazzo.length === 0) {
    return { tipo: 'vuoto' };
  }
  const adesso = opzioni.adesso ?? new Date();
  const ultimo = risultatiMazzo[risultatiMazzo.length - 1];
  const { titolo, didascalia } = titoloEDidascalia(ultimo.modo);
  const percentuale = ultimo.viste === 0 ? 0 : Math.round((ultimo.giuste / ultimo.viste) * 100);
  const errori = ultimo.sbagliate.map((id) => mazzo.carte[id]).filter((carta): carta is Carta => carta !== undefined);
  const storico: RigaStorico[] = risultatiMazzo
    .slice()
    .reverse()
    .map((r) => ({
      quando: formattaQuando(r.data, adesso),
      cosa: descriviRun(r, mazzo.sezioni),
      punteggio: `${r.giuste} / ${r.viste}`,
    }));
  return {
    tipo: 'completo',
    titolo,
    sottotitolo: titoloSerie(mazzo.nome, ultimo.sezioni, mazzo.sezioni),
    punteggio: `${ultimo.giuste} / ${ultimo.viste}`,
    percentuale,
    didascalia,
    errori,
    titoloErrori: errori.length === 1 ? '1 simbolo da ripassare' : `${errori.length} simboli da ripassare`,
    storico,
    confermaCancellazione: opzioni.confermaCancellazione,
    ripasso: opzioni.ripassoId ? (mazzo.carte[opzioni.ripassoId] ?? null) : null,
  };
}

// -------------------------------------------------------------- DOM: primitive

type BottoneVariante = 'solid' | 'outline' | 'ghost';
type BottoneColore = 'blue' | 'dark' | 'red';
type BottoneMisura = 'sm' | 'md' | 'lg';

const ALTEZZA_BOTTONE: Record<BottoneMisura, number> = { sm: 36, md: 44, lg: 60 };
const COLORE_BASE: Record<BottoneColore, string> = { blue: 'var(--blue-600)', dark: 'var(--gray-800)', red: 'var(--red-600)' };

/** Button.prompt.md: variant solid/outline/ghost, color blue/dark/red, size sm/md/lg (36/44/60px), radius 8px. */
function bottone(
  testo: string,
  opzioni: {
    variante?: BottoneVariante;
    colore?: BottoneColore;
    misura?: BottoneMisura;
    larghezzaIntera?: boolean;
    onClick: () => void;
  },
): HTMLButtonElement {
  const { variante = 'solid', colore = 'blue', misura = 'md', larghezzaIntera = false, onClick } = opzioni;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = testo;
  btn.style.height = `${ALTEZZA_BOTTONE[misura]}px`;
  btn.style.borderRadius = 'var(--radius-button)';
  btn.style.fontFamily = 'var(--font-sans)';
  btn.style.fontSize = misura === 'lg' ? '16px' : '14px';
  btn.style.fontWeight = '600';
  btn.style.cursor = 'pointer';
  btn.style.border = '1px solid transparent';
  btn.style.padding = '0 18px';
  btn.style.boxSizing = 'border-box';
  if (larghezzaIntera) btn.style.width = '100%';
  const base = COLORE_BASE[colore];
  if (variante === 'solid') {
    btn.style.background = base;
    btn.style.color = 'var(--white)';
  } else if (variante === 'outline') {
    btn.style.background = 'var(--white)';
    btn.style.borderColor = colore === 'dark' ? 'var(--gray-300)' : base;
    btn.style.color = colore === 'dark' ? 'var(--gray-800)' : base;
  } else {
    btn.style.background = 'transparent';
    btn.style.color = colore === 'dark' ? 'var(--gray-600)' : base;
  }
  btn.addEventListener('click', onClick);
  return btn;
}

/** Card.prompt.md: bordo gray-200, radius 12px, ombra leggera. */
function schedaContenitore(): HTMLDivElement {
  const div = document.createElement('div');
  div.style.background = 'var(--white)';
  div.style.border = '1px solid var(--gray-200)';
  div.style.borderRadius = 'var(--radius-card)';
  div.style.boxShadow = 'var(--shadow-sm)';
  div.style.overflow = 'hidden';
  return div;
}

function intestazioneScheda(testo: string): HTMLDivElement {
  const div = document.createElement('div');
  div.style.padding = '12px 16px';
  div.style.background = 'var(--gray-50)';
  div.style.borderBottom = '1px solid var(--gray-200)';
  div.style.fontSize = '13px';
  div.style.fontWeight = '600';
  div.style.color = 'var(--gray-800)';
  div.textContent = testo;
  return div;
}

/** ListGroup.prompt.md: lista verticale con divisori, senza bordo esterno proprio (lo dà la Card). */
function elencoDiviso(elementi: HTMLElement[]): HTMLDivElement {
  const contenitore = document.createElement('div');
  elementi.forEach((el, i) => {
    if (i > 0) el.style.borderTop = '1px solid var(--gray-100)';
    contenitore.appendChild(el);
  });
  return contenitore;
}

/** Progress.prompt.md: size md, color blue. */
function barraProgresso(percentuale: number): HTMLDivElement {
  const traccia = document.createElement('div');
  traccia.setAttribute('role', 'progressbar');
  traccia.setAttribute('aria-valuenow', String(percentuale));
  traccia.setAttribute('aria-valuemin', '0');
  traccia.setAttribute('aria-valuemax', '100');
  traccia.style.width = '100%';
  traccia.style.height = '10px';
  traccia.style.borderRadius = 'var(--radius-full)';
  traccia.style.background = 'var(--gray-200)';
  traccia.style.overflow = 'hidden';
  const riempimento = document.createElement('div');
  riempimento.style.height = '100%';
  riempimento.style.width = `${Math.max(0, Math.min(100, percentuale))}%`;
  riempimento.style.background = 'var(--blue-600)';
  riempimento.style.borderRadius = 'var(--radius-full)';
  traccia.appendChild(riempimento);
  return traccia;
}

/** Alert.prompt.md: variant soft, color green — "Nessun errore in questa serie". */
function alertSuccesso(titolo: string, corpo: string): HTMLDivElement {
  const div = document.createElement('div');
  div.setAttribute('role', 'status');
  div.style.background = 'var(--green-50)';
  div.style.border = '1px solid var(--green-200)';
  div.style.borderRadius = 'var(--radius-xl)';
  div.style.padding = '14px 16px';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.gap = '4px';
  const t = document.createElement('div');
  t.style.fontSize = '14px';
  t.style.fontWeight = '600';
  t.style.color = 'var(--green-800)';
  t.textContent = titolo;
  const b = document.createElement('div');
  b.style.fontSize = '13px';
  b.style.color = 'var(--green-700)';
  b.textContent = corpo;
  div.append(t, b);
  return div;
}

/** Una riga della lista errori: FacciaCarta `lista` + chevron, l'intera riga è il bersaglio del tap. */
function rigaErrore(carta: Carta, onClick: () => void): HTMLButtonElement {
  const riga = document.createElement('button');
  riga.type = 'button';
  riga.dataset.riga = 'errore';
  riga.style.display = 'flex';
  riga.style.alignItems = 'center';
  riga.style.gap = '8px';
  riga.style.width = '100%';
  riga.style.boxSizing = 'border-box';
  riga.style.padding = '8px 16px';
  riga.style.background = 'var(--white)';
  riga.style.border = 'none';
  riga.style.textAlign = 'left';
  riga.style.cursor = 'pointer';
  riga.style.font = 'inherit';
  riga.style.color = 'inherit';
  const volto = fronte(carta, 'lista');
  volto.style.flex = '1';
  volto.style.minWidth = '0';
  const chevron = document.createElement('span');
  chevron.textContent = '›';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.style.color = 'var(--gray-400)';
  chevron.style.fontSize = '16px';
  chevron.style.flexShrink = '0';
  riga.append(volto, chevron);
  riga.addEventListener('click', onClick);
  return riga;
}

/** Una riga di storico: data, cosa, punteggio. Non tappabile (accessibility notes). */
function rigaStorico(riga: RigaStorico): HTMLDivElement {
  const div = document.createElement('div');
  div.dataset.riga = 'storico';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.gap = '12px';
  div.style.padding = '11px 16px';
  const testo = document.createElement('div');
  testo.style.display = 'flex';
  testo.style.flexDirection = 'column';
  testo.style.gap = '2px';
  testo.style.flex = '1';
  testo.style.minWidth = '0';
  const quando = document.createElement('div');
  quando.style.fontSize = '13px';
  quando.style.fontWeight = '500';
  quando.style.color = 'var(--gray-800)';
  quando.textContent = riga.quando;
  const cosa = document.createElement('div');
  cosa.style.fontSize = '12px';
  cosa.style.color = 'var(--gray-400)';
  cosa.textContent = riga.cosa;
  testo.append(quando, cosa);
  const punteggio = document.createElement('div');
  punteggio.style.fontSize = '14px';
  punteggio.style.fontWeight = '600';
  punteggio.style.color = 'var(--gray-800)';
  punteggio.textContent = riga.punteggio;
  div.append(testo, punteggio);
  return div;
}

/** Il pannello rosso inline della `conferma-cancellazione` (niente dialog). */
function pannelloConferma(azioni: AzioniRisultati): HTMLDivElement {
  const div = document.createElement('div');
  div.setAttribute('role', 'alertdialog');
  div.style.border = '1px solid var(--red-200)';
  div.style.background = 'var(--red-50)';
  div.style.borderRadius = 'var(--radius-xl)';
  div.style.padding = '14px 16px';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.gap = '10px';
  const messaggio = document.createElement('div');
  messaggio.style.fontSize = '14px';
  messaggio.style.fontWeight = '600';
  messaggio.style.color = 'var(--red-800)';
  messaggio.textContent = 'Sicuro? Cancella tutti i risultati su questo telefono, per tutti i mazzi.';
  const riga = document.createElement('div');
  riga.style.display = 'grid';
  riga.style.gridTemplateColumns = '1fr 1fr';
  riga.style.gap = '10px';
  riga.append(
    bottone('Annulla', { variante: 'outline', colore: 'dark', misura: 'md', larghezzaIntera: true, onClick: azioni.annullaCancellazione }),
    bottone('Cancella tutto', { variante: 'solid', colore: 'red', misura: 'md', larghezzaIntera: true, onClick: azioni.confermaCancellazione }),
  );
  div.append(messaggio, riga);
  return div;
}

/** Il bottom sheet della `ripasso`: scrim + retro della carta a size `carta`, con focus trap minimo e chiusura su Esc. */
function foglioRipasso(carta: Carta, onChiudi: () => void): HTMLDivElement {
  const scrim = document.createElement('div');
  scrim.setAttribute('role', 'dialog');
  scrim.setAttribute('aria-modal', 'true');
  scrim.setAttribute('aria-label', 'Da ripassare');
  scrim.style.position = 'fixed';
  scrim.style.inset = '0';
  scrim.style.background = 'rgba(31,41,55,.5)';
  scrim.style.display = 'flex';
  scrim.style.alignItems = 'flex-end';
  scrim.style.justifyContent = 'center';
  scrim.style.zIndex = '50';
  scrim.addEventListener('mousedown', (evento) => {
    if (evento.target === scrim) onChiudi();
  });

  const foglio = document.createElement('div');
  foglio.style.width = '100%';
  foglio.style.maxWidth = '520px';
  foglio.style.boxSizing = 'border-box';
  foglio.style.background = 'var(--white)';
  foglio.style.borderRadius = 'var(--radius-2xl) var(--radius-2xl) 0 0';
  foglio.style.padding = '16px 16px 28px';
  foglio.style.display = 'flex';
  foglio.style.flexDirection = 'column';
  foglio.style.gap = '14px';

  const testata = document.createElement('div');
  testata.style.display = 'flex';
  testata.style.alignItems = 'center';
  const etichetta = document.createElement('div');
  etichetta.style.fontSize = '13px';
  etichetta.style.fontWeight = '600';
  etichetta.style.color = 'var(--gray-800)';
  etichetta.style.flex = '1';
  etichetta.textContent = 'Da ripassare';
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.textContent = 'Chiudi';
  chiudi.style.fontSize = '13px';
  chiudi.style.color = 'var(--gray-500)';
  chiudi.style.background = 'none';
  chiudi.style.border = 'none';
  chiudi.style.cursor = 'pointer';
  chiudi.style.padding = '6px 2px';
  chiudi.addEventListener('click', onChiudi);
  testata.append(etichetta, chiudi);

  foglio.append(testata, retro(carta, 'carta'));
  scrim.appendChild(foglio);

  // Focus trap minimo (accessibility notes: "the review sheet traps focus
  // and closes on Chiudi"): l'unico elemento davvero interattivo del
  // contenuto è "Chiudi" (il retro della carta è testo/immagini), quindi
  // Tab/Shift+Tab vi torna sempre; Esc chiude come "Chiudi".
  scrim.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      onChiudi();
    } else if (evento.key === 'Tab') {
      evento.preventDefault();
      chiudi.focus();
    }
  });
  queueMicrotask(() => chiudi.focus());

  return scrim;
}

// -------------------------------------------------------------- render

function vistaVuota(vista: VistaVuota, azioni: AzioniRisultati): HTMLDivElement {
  const contenitore = document.createElement('div');
  contenitore.style.display = 'flex';
  contenitore.style.flexDirection = 'column';
  contenitore.style.alignItems = 'center';
  contenitore.style.textAlign = 'center';
  contenitore.style.gap = '14px';
  contenitore.style.padding = '48px 16px';
  const messaggio = document.createElement('div');
  messaggio.style.fontSize = '17px';
  messaggio.style.fontWeight = '600';
  messaggio.style.color = 'var(--gray-800)';
  messaggio.textContent = 'Nessuna serie completata per questo mazzo';
  contenitore.appendChild(messaggio);
  if (vista.nota) {
    const nota = document.createElement('div');
    nota.style.fontSize = '13px';
    nota.style.color = 'var(--gray-500)';
    nota.style.lineHeight = '1.5';
    nota.style.maxWidth = '360px';
    nota.textContent = vista.nota;
    contenitore.appendChild(nota);
  }
  contenitore.appendChild(bottone('Scegli un mazzo', { variante: 'solid', colore: 'blue', misura: 'md', onClick: azioni.tornaAiMazzi }));
  return contenitore;
}

function vistaCompleta(vista: VistaCompleta, azioni: AzioniRisultati): HTMLDivElement {
  const contenitore = document.createElement('div');
  contenitore.style.display = 'flex';
  contenitore.style.flexDirection = 'column';
  contenitore.style.gap = '14px';

  const testata = document.createElement('div');
  testata.style.display = 'flex';
  testata.style.flexDirection = 'column';
  testata.style.gap = '2px';
  const h2 = document.createElement('h2');
  h2.style.margin = '0';
  h2.style.fontSize = '20px';
  h2.style.fontWeight = '700';
  h2.style.letterSpacing = '-0.02em';
  h2.style.color = 'var(--gray-800)';
  h2.textContent = vista.titolo;
  const sottotitolo = document.createElement('p');
  sottotitolo.style.margin = '0';
  sottotitolo.style.fontSize = '13px';
  sottotitolo.style.color = 'var(--gray-500)';
  sottotitolo.textContent = vista.sottotitolo;
  testata.append(h2, sottotitolo);
  contenitore.appendChild(testata);

  const cardPunteggio = schedaContenitore();
  cardPunteggio.style.padding = '24px';
  cardPunteggio.style.display = 'flex';
  cardPunteggio.style.flexDirection = 'column';
  cardPunteggio.style.alignItems = 'center';
  cardPunteggio.style.gap = '14px';
  const numero = document.createElement('div');
  numero.dataset.riga = 'punteggio';
  numero.style.fontSize = '44px';
  numero.style.fontWeight = '700';
  numero.style.letterSpacing = '-0.03em';
  numero.style.color = 'var(--gray-800)';
  numero.style.lineHeight = '1';
  numero.textContent = vista.punteggio;
  const didascalia = document.createElement('div');
  didascalia.style.fontSize = '13px';
  didascalia.style.color = 'var(--gray-500)';
  didascalia.textContent = vista.didascalia;
  cardPunteggio.append(numero, didascalia, barraProgresso(vista.percentuale));
  contenitore.appendChild(cardPunteggio);

  if (vista.errori.length > 0) {
    const cardErrori = schedaContenitore();
    cardErrori.appendChild(intestazioneScheda(vista.titoloErrori));
    cardErrori.appendChild(elencoDiviso(vista.errori.map((carta) => rigaErrore(carta, () => azioni.apriRipasso(carta.id)))));
    contenitore.appendChild(cardErrori);
    contenitore.appendChild(
      bottone('Ripassa con le carte', { variante: 'solid', colore: 'blue', misura: 'lg', larghezzaIntera: true, onClick: azioni.ripassaConLeCarte }),
    );
  } else {
    contenitore.appendChild(alertSuccesso('Nessun errore in questa serie', 'Tutte le carte erano giuste.'));
  }

  const rigaAzioni = document.createElement('div');
  rigaAzioni.style.display = 'grid';
  rigaAzioni.style.gridTemplateColumns = '1fr 1fr';
  rigaAzioni.style.gap = '10px';
  rigaAzioni.append(
    bottone('Ripeti', { variante: 'outline', colore: 'dark', misura: 'md', larghezzaIntera: true, onClick: azioni.ripeti }),
    bottone('Torna ai mazzi', { variante: 'ghost', colore: 'dark', misura: 'md', larghezzaIntera: true, onClick: azioni.tornaAiMazzi }),
  );
  contenitore.appendChild(rigaAzioni);

  const cardStorico = schedaContenitore();
  cardStorico.appendChild(intestazioneScheda('Storico'));
  cardStorico.appendChild(elencoDiviso(vista.storico.map(rigaStorico)));
  contenitore.appendChild(cardStorico);

  if (vista.confermaCancellazione) {
    contenitore.appendChild(pannelloConferma(azioni));
  } else {
    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = 'Cancella i risultati';
    link.style.display = 'block';
    link.style.margin = '6px auto 10px';
    link.style.background = 'none';
    link.style.border = 'none';
    link.style.color = 'var(--red-600)';
    link.style.fontSize = '13px';
    link.style.fontWeight = '500';
    link.style.cursor = 'pointer';
    link.addEventListener('click', azioni.richiediCancellazione);
    contenitore.appendChild(link);
  }

  return contenitore;
}

/**
 * Disegna la vista dentro `radice`, sostituendo tutto il suo contenuto. La
 * `ripasso` (se presente) è un overlay in più, non uno stato a sé: il
 * contenuto sottostante resta montato.
 */
export function renderizzaRisultati(radice: HTMLElement, vista: VistaRisultati, azioni: AzioniRisultati): void {
  radice.replaceChildren();
  if (vista.tipo === 'vuoto') {
    radice.appendChild(vistaVuota(vista, azioni));
    return;
  }
  radice.appendChild(vistaCompleta(vista, azioni));
  if (vista.ripasso) {
    radice.appendChild(foglioRipasso(vista.ripasso, azioni.chiudiRipasso));
  }
}
