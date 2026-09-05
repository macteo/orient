// src/pages/risultati.ts — punto d'ingresso di R-004, i risultati di un mazzo
// (F-010): ultimo punteggio, storico, errori, ripasso.
//
// **Stub.** `scripts/build-mazzi.ts` emette la pagina e la aggancia a questo
// modulo; il task di UI ne scrive il contenuto. Per ora monta solo gli stili,
// Preline e il titolo dello schermo, così che la pagina emessa si carichi
// davvero (smoke e2e) prima che la UI esista.
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzo">` → il `MazzoBuild` completo,
//   che serve a rendere le facce (`size: 'lista'`) delle carte sbagliate;
//   `main#app` porta `data-mazzo`. I risultati veri vengono dallo storage
//   (`orient.risultati.v1`), non dal build.

import '../styles.css';
import '../sito/preline.ts';

const app = document.getElementById('app');
if (app) {
  const h1 = document.createElement('h1');
  h1.className = 'text-xl font-semibold tracking-tight';
  h1.style.color = 'var(--gray-800)';
  h1.textContent = app.dataset.titolo ?? 'orient';
  app.prepend(h1);
}
