// src/pages/fonti.ts — punto d'ingresso di R-005, fonti, attribuzioni e
// licenze (F-005).
//
// **Stub.** `scripts/build-mazzi.ts` emette la pagina e la aggancia a questo
// modulo; il task di UI ne scrive il contenuto. Per ora monta solo gli stili,
// Preline e il titolo dello schermo, così che la pagina emessa si carichi
// davvero (smoke e2e) prima che la UI esista.
//
// Dati inlinati a build:
//   `<script type="application/json" id="fonti">` → il registro
//   `content/fonti.json` per intero: `{ v, contatto, fonti: Fonte[] }`.
//   I testi delle licenze restano file: importali da `content/licenze/*`
//   con `?raw`.

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
