import { describe, expect, it } from 'vitest';
import { makeRng, pick } from './rng';

const take = (rng: () => number, n: number): number[] => Array.from({ length: n }, () => rng());

describe('makeRng', () => {
  it('la misma semilla da la misma secuencia', () => {
    expect(take(makeRng(7), 10)).toEqual(take(makeRng(7), 10)); // contract: tabla tarea 2
  });
  it('semillas distintas dan secuencias distintas', () => {
    expect(take(makeRng(7), 10)).not.toEqual(take(makeRng(8), 10)); // contract: tabla tarea 2
  });
  it('una semilla no entera lanza', () => {
    expect(() => makeRng(0.2)).toThrow(); // contract: fix1 punto 5, la semilla es entera
    expect(() => makeRng(NaN)).toThrow(); // contract: fix1 punto 5, la semilla es entera
  });
  it('los valores están en [0, 1)', () => {
    const ok = take(makeRng(3), 1000).every((x) => x >= 0 && x < 1);
    expect(ok).toBe(true); // contract: firma de makeRng, [0, 1)
  });
});

describe('pick', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  it('devuelve n valores distintos de la lista', () => {
    const out = pick(makeRng(1), items, 6);
    expect(out).toHaveLength(6); // contract: tabla tarea 2
    expect(new Set(out).size).toBe(6); // contract: tabla tarea 2, distintos
    expect(out.every((x) => items.includes(x))).toBe(true); // contract: salen de la lista
  });
  it('la misma semilla da la misma selección', () => {
    expect(pick(makeRng(5), items, 6)).toEqual(pick(makeRng(5), items, 6)); // contract: fix1 punto 3
  });
  it('entre varias semillas hay alguna selección distinta y alguna no es el prefijo', () => {
    const picks = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => pick(makeRng(seed), items, 4).join());
    expect(new Set(picks).size).toBeGreaterThan(1); // contract: fix1 punto 3, pick usa el rng
  });
  it('n negativo o no entero lanza', () => {
    expect(() => pick(makeRng(1), items, -1)).toThrow(); // contract: fix1 punto 4
    expect(() => pick(makeRng(1), items, 2.5)).toThrow(); // contract: fix1 punto 4
    expect(() => pick(makeRng(1), items, NaN)).toThrow(); // contract: fix1 punto 4
  });
  it('n = 0 devuelve una lista vacía', () => {
    expect(pick(makeRng(1), items, 0)).toEqual([]); // contract: fix1 punto 4, 0 es entero no negativo
  });
  it('no modifica la lista recibida', () => {
    const copy = [...items];
    pick(makeRng(1), copy, 6);
    expect(copy).toEqual(items); // contract: contrato de pureza de la tarea 2
  });
  it('lanza si n supera la lista', () => {
    expect(() => pick(makeRng(1), items, 11)).toThrow(); // contract: tabla tarea 2
  });
});
