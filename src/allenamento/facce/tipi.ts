// src/allenamento/facce/tipi.ts — i tipi delle facce (F-004) sono ora quelli
// del dominio mazzi: questo file è un semplice ri-export di
// `src/mazzi/tipi.ts`, che è la sola dichiarazione di `Carta` e dei suoi
// sotto-tipi (3.002). Fino al build dei mazzi le due copie convivevano; ora
// non c'è più nulla da tenere allineato a mano.
//
// Due sole note sul ri-export:
//   - `Direzione` qui sono gli otto punti cardinali di una cella o di un
//     simbolo orientabile (`Cella.direzione`, `_context.md`); in
//     `src/mazzi/tipi.ts` quel tipo si chiama `Direzione8`, perché lì
//     `Direzione` è già la direzione di una *serie* (`'inversa'`). Il
//     rinominamento tiene stabile l'API pubblica di `facce/index.ts`.
//   - `Size` resta dichiarato qui: è una scelta di resa delle facce
//     (FacciaCarta.prompt.md), non un tipo di contenuto.

export type {
  Artwork,
  Carta,
  Cella,
  Direzione8 as Direzione,
  Esempio,
  Geometria,
  RigaDescrizione,
  TipoCarta,
} from '../../mazzi/tipi.ts';

/** La densità con cui una faccia è resa: carta intera, tessera del quiz, riga di elenco. */
export type Size = 'carta' | 'tile' | 'lista';
