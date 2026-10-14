/** Generador determinista mulberry32, valores en [0, 1). La semilla es un entero; si no, lanza. */
export const makeRng = (seed: number): (() => number) => {
  if (!Number.isInteger(seed))
    throw new Error(`makeRng: la semilla debe ser entera y llegó ${seed}`);
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** `n` elementos distintos de la lista (Fisher-Yates parcial sobre una copia). */
export const pick = <T>(rng: () => number, items: readonly T[], n: number): T[] => {
  if (!Number.isInteger(n) || n < 0)
    throw new Error(`pick: n debe ser un entero no negativo y llegó ${n}`);
  if (n > items.length) throw new Error(`pick: se piden ${n} de ${items.length} elementos`);
  const pool = [...items];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, n);
};
