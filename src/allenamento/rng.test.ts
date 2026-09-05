import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeRng, seedFromQuery } from './rng.ts';

describe('makeRng', () => {
  it('con un seme produce sempre la stessa sequenza', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const sequenzaA = Array.from({ length: 20 }, () => a());
    const sequenzaB = Array.from({ length: 20 }, () => b());
    expect(sequenzaA).toEqual(sequenzaB);
  });

  it('semi diversi producono sequenze diverse', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const sequenzaA = Array.from({ length: 10 }, () => a());
    const sequenzaB = Array.from({ length: 10 }, () => b());
    expect(sequenzaA).not.toEqual(sequenzaB);
  });

  it('ogni valore prodotto è in [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 200; i += 1) {
      const valore = rng();
      expect(valore).toBeGreaterThanOrEqual(0);
      expect(valore).toBeLessThan(1);
    }
  });

  it('senza seme usa Math.random', () => {
    expect(makeRng()).toBe(Math.random);
  });
});

describe('seedFromQuery', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('con VITE_TEST_SEED=1 legge ?seme=<n>', () => {
    vi.stubEnv('VITE_TEST_SEED', '1');
    expect(seedFromQuery('?seme=7')).toBe(7);
  });

  it('senza il flag ignora la query anche se presente', () => {
    vi.stubEnv('VITE_TEST_SEED', '0');
    expect(seedFromQuery('?seme=7')).toBeUndefined();
  });

  it('senza alcun flag impostato ignora la query', () => {
    expect(seedFromQuery('?seme=7')).toBeUndefined();
  });

  it('con il flag ma senza il parametro ritorna undefined', () => {
    vi.stubEnv('VITE_TEST_SEED', '1');
    expect(seedFromQuery('?altro=1')).toBeUndefined();
  });

  it('con il flag ma un valore non numerico ritorna undefined', () => {
    vi.stubEnv('VITE_TEST_SEED', '1');
    expect(seedFromQuery('?seme=abc')).toBeUndefined();
  });
});
