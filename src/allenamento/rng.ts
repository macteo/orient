/// <reference types="vite/client" />
// RNG seedabile per l'allenamento (mescolamento delle carte, distrattori del
// quiz, posizione della risposta). In produzione ogni run usa `Math.random`;
// in test/E2E un seme deterministico può essere richiesto tramite
// `?seme=<n>`, ma **solo** quando la build è marcata `VITE_TEST_SEED === '1'`
// — altrimenti il parametro di query è ignorato anche se presente.

/** Un generatore di numeri in [0, 1), come `Math.random`. */
export type Rng = () => number;

/**
 * Mulberry32: PRNG a 32 bit, veloce e a periodo lungo abbastanza per un
 * mazzo di poche centinaia di carte. Deterministico per lo stesso seme.
 */
function mulberry32(seme: number): Rng {
  let a = seme >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Costruisce un RNG: mulberry32 se `seed` è dato, altrimenti `Math.random`.
 * Lo stesso seme produce sempre la stessa sequenza.
 */
export function makeRng(seed?: number): Rng {
  if (seed === undefined) {
    return Math.random;
  }
  return mulberry32(seed);
}

/**
 * Legge `?seme=<n>` da una query string, ma solo quando
 * `import.meta.env.VITE_TEST_SEED === '1'`. In produzione (o senza quel
 * flag) il parametro è sempre ignorato e la funzione ritorna `undefined`,
 * qualunque sia il contenuto di `search`.
 */
export function seedFromQuery(search: string): number | undefined {
  if (import.meta.env.VITE_TEST_SEED !== '1') {
    return undefined;
  }
  const parametri = new URLSearchParams(search);
  const grezzo = parametri.get('seme');
  if (grezzo === null) {
    return undefined;
  }
  const numero = Number(grezzo);
  return Number.isFinite(numero) ? numero : undefined;
}
