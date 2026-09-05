// src/pages/home.ts — punto d'ingresso di R-001, la home: scelta del mazzo e
// delle sezioni (F-001), ultimo punteggio per mazzo (F-010).
//
// **Stub.** `scripts/build-mazzi.ts` emette la pagina e la aggancia a questo
// modulo; il task di UI ne scrive il contenuto. Per ora monta solo gli stili,
// Preline e il titolo dello schermo, così che la pagina emessa si carichi
// davvero (smoke e2e) prima che la UI esista.
//
// Dati inlinati a build:
//   `<script type="application/json" id="mazzi">` → `RiepilogoMazzo[]`, un
//   elemento per mazzo nell'ordine di `content/sezioni.json`:
//   `{ id, nome, tipo, carte, sezioni: [{ id, etichetta, carte }] }`.

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
