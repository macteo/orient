// src/pages/risultati.ts — punto d'ingresso di R-004, i risultati di un mazzo
// (F-010): ultimo punteggio, storico, errori, ripasso.
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzo">` → il `MazzoBuild` completo,
//   che serve a rendere le facce (`size: 'lista'`) delle carte sbagliate;
//   `main#app` porta `data-mazzo`. I risultati veri vengono dallo storage
//   (`orient.risultati.v1`), non dal build.
//
// Questo modulo è solo cablaggio: legge `storage.ts`, tiene i due
// interruttori di stato locali alla schermata (quale carta è aperta nel
// foglio di ripasso, se il pannello di conferma-cancellazione è aperto),
// costruisce una `VistaRisultati` con `risultati-dom.ts` e la ridisegna a
// ogni cambiamento. Nessuna logica di formattazione qui: vive tutta in
// `risultati-dom.ts`, dove un test jsdom può verificarla senza `location`.

import '../styles.css';
import '../sito/preline.ts';

import type { MazzoBuild, Risultato } from '../mazzi/tipi.ts';
import { daRipasso } from '../allenamento/serie.ts';
import { cancellaTutto, disponibile, leggiRisultati, scriviSerie } from '../allenamento/storage.ts';
import { costruisciVista, renderizzaRisultati, type AzioniRisultati } from '../allenamento/risultati-dom.ts';

const NOTA_ERRORE = 'Non riesco a leggere i risultati salvati su questo telefono. Le serie funzionano lo stesso.';
const NOTA_VUOTA = 'Completa una serie o un quiz e la troverai qui.';
/** F-010 AC-4: la pagina non mostra mai più di 50 run per mazzo (già garantito in scrittura da `storage.ts`; qui solo una rete di sicurezza in lettura). */
const MASSIMO_STORICO = 50;

const app = document.getElementById('app');
const scriptMazzo = document.getElementById('mazzo');

if (app && scriptMazzo) {
  const mazzo = JSON.parse(scriptMazzo.textContent ?? '{}') as MazzoBuild;

  const h1 = document.createElement('h1');
  h1.className = 'text-xl font-semibold tracking-tight';
  h1.style.color = 'var(--gray-800)';
  h1.textContent = app.dataset.titolo ?? 'orient';
  app.appendChild(h1);

  const contenitore = document.createElement('div');
  contenitore.style.marginTop = '20px';
  app.appendChild(contenitore);

  let mostraConferma = false;
  let ripassoId: string | null = null;

  function risultatiDelMazzo(): Risultato[] {
    return leggiRisultati()
      .filter((r) => r.mazzo === mazzo.id)
      .slice(-MASSIMO_STORICO);
  }

  /** *Ripeti*: ricostruisce la query del run (mazzo implicito nel percorso relativo). */
  function percorsoRipeti(r: Risultato): string {
    const parametri = new URLSearchParams();
    if (r.sezioni.length > 0) parametri.set('sezioni', r.sezioni.join(','));
    parametri.set('carte', String(r.viste));
    if (r.direzione) parametri.set('direzione', r.direzione);
    const percorso = r.modo === 'quiz' ? '../quiz/' : '../flashcard/';
    const query = parametri.toString();
    return query ? `${percorso}?${query}` : percorso;
  }

  function aggiorna(): void {
    if (!disponibile()) {
      renderizzaRisultati(contenitore, { tipo: 'vuoto', nota: NOTA_ERRORE }, azioni);
      return;
    }
    const risultati = risultatiDelMazzo();
    if (risultati.length === 0) {
      renderizzaRisultati(contenitore, { tipo: 'vuoto', nota: NOTA_VUOTA }, azioni);
      return;
    }
    const vista = costruisciVista(mazzo, risultati, { confermaCancellazione: mostraConferma, ripassoId });
    renderizzaRisultati(contenitore, vista, azioni);
  }

  const azioni: AzioniRisultati = {
    ripassaConLeCarte(): void {
      const risultati = risultatiDelMazzo();
      const ultimo = risultati[risultati.length - 1];
      if (!ultimo) return;
      scriviSerie(daRipasso(ultimo));
      window.location.href = '../flashcard/?ripasso=1';
    },
    ripeti(): void {
      const risultati = risultatiDelMazzo();
      const ultimo = risultati[risultati.length - 1];
      if (!ultimo) return;
      window.location.href = percorsoRipeti(ultimo);
    },
    tornaAiMazzi(): void {
      window.location.href = '../../';
    },
    apriRipasso(idCarta: string): void {
      ripassoId = idCarta;
      aggiorna();
    },
    chiudiRipasso(): void {
      ripassoId = null;
      aggiorna();
    },
    richiediCancellazione(): void {
      mostraConferma = true;
      aggiorna();
    },
    annullaCancellazione(): void {
      mostraConferma = false;
      aggiorna();
    },
    confermaCancellazione(): void {
      cancellaTutto();
      mostraConferma = false;
      ripassoId = null;
      aggiorna();
    },
  };

  aggiorna();
}
