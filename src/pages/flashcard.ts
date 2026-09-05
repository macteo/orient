// src/pages/flashcard.ts — punto d'ingresso di R-002, una serie di flash card
// (F-002). Una sola copia serve tutti e quattro i mazzi: la pagina emessa dice
// quale, nei dati inlinati.
//
// **Stub.** `scripts/build-mazzi.ts` emette la pagina e la aggancia a questo
// modulo; il task di UI ne scrive il contenuto. Per ora monta solo gli stili,
// Preline e il titolo dello schermo, così che la pagina emessa si carichi
// davvero (smoke e2e) prima che la UI esista.
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzo">` → il `MazzoBuild` completo
//   del mazzo di questa pagina; `main#app` porta `data-mazzo` (l'id del mazzo)
//   e `data-modo="flashcard"`.

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
