import { describe, expect, it } from 'vitest';
import { compresion, compresionScene, svd, type CompresionSpec } from './compresion';
import { goalMet, startState } from './types';

const make = (rows: number[][], extra: Partial<CompresionSpec> = {}): CompresionSpec => ({
  kind: 'compresion',
  rows,
  ...extra,
});
const measureAt = (spec: CompresionSpec, state: Record<string, number>) =>
  compresion.measure(spec, state);

// Diagonal: sus valores singulares son los valores absolutos de la diagonal, 4 y 3.
const diag = make([
  [3, 0],
  [0, 4],
]);

// Un dibujo de 8×8 (cara con ojos y boca): simétrico izquierda-derecha, así que su rango es ≤ 4.
const smiley = [
  [0, 0, 0.5, 0.5, 0.5, 0.5, 0, 0],
  [0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0],
  [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
  [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
  [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  [0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5],
  [0, 0.5, 1, 1, 1, 1, 0.5, 0],
  [0, 0, 0.5, 0.5, 0.5, 0.5, 0, 0],
];

// Pesos de 4×6 de rango exactamente 2: u1·v1ᵀ + u2·v2ᵀ.
const u1 = [2, 1, 0, -1];
const v1 = [1, -1, 0, 2, 0, 1];
const u2 = [0, 1, -2, 1];
const v2 = [1, 0, 1, -1, 2, 0];
const weights = u1.map((a, i) => v1.map((b, j) => a * b + u2[i]! * v2[j]!));

const pickRows = [
  [5, 4, 0, 0, 1],
  [4, 5, 0, 1, 0],
  [0, 0, 2, 0, 0],
  [0, 1, 0, 2, 1],
  [1, 0, 0, 1, 3],
];

describe('svd', () => {
  it('de una diagonal salen sus valores absolutos, de mayor a menor', () => {
    // contract: los valores singulares de diag(3, 4) son 4 y 3
    const { sigma } = svd(diag.rows);
    expect(sigma[0]).toBeCloseTo(4, 9);
    expect(sigma[1]).toBeCloseTo(3, 9);
  });

  it('las capas suman la matriz original y la suma de σ² es el cuadrado de su norma de Frobenius', () => {
    const { sigma, layers } = svd(smiley);
    const sum = smiley.map((row, r) =>
      row.map((_, c) => layers.reduce((s, layer) => s + layer[r]![c]!, 0)),
    );
    sum.forEach((row, r) =>
      row.forEach((x, c) => {
        // contract: A = Σ σᵢ·uᵢ·vᵢᵀ (la SVD completa reconstruye la matriz)
        expect(x).toBeCloseTo(smiley[r]![c]!, 9);
      }),
    );
    // contract: suma a mano de los cuadrados de las 64 celdas del dibujo = 20,5
    expect(sigma.reduce((s, x) => s + x * x, 0)).toBeCloseTo(20.5, 9);
    // contract: σ viene ordenado de mayor a menor
    for (let i = 1; i < sigma.length; i++) expect(sigma[i - 1]!).toBeGreaterThanOrEqual(sigma[i]!);
  });

  it('una matriz de rango 1 tiene un solo σ, igual a su norma', () => {
    const { sigma } = svd([
      [1, 2],
      [2, 4],
    ]);
    // contract: [[1,2],[2,4]] = (1,2)·(1,2)ᵀ, de rango 1, y su norma de Frobenius es √25 = 5
    expect(sigma[0]).toBeCloseTo(5, 9);
    expect(sigma[1]).toBe(0);
  });

  it('la matriz cero no tiene capas con valor y es determinista', () => {
    const zero = svd([
      [0, 0],
      [0, 0],
    ]);
    // contract: sin energía no hay valores singulares no nulos
    expect(zero.sigma).toEqual([0, 0]);
    // contract: dos llamadas con la misma matriz dan exactamente lo mismo (signo fijado)
    expect(svd(smiley)).toEqual(svd(smiley));
  });

  it('una matriz ancha (4×6) da min(m, n) = 4 valores singulares', () => {
    // contract: 4×6 tiene como mucho 4 valores singulares
    expect(svd(weights).sigma).toHaveLength(4);
  });
});

describe('laboratorio compresion: modo top', () => {
  it('tiene un deslizador k de 0 a min(m, n) que empieza en 1', () => {
    // contract: por defecto k empieza en 1 y llega hasta el menor lado de la matriz
    expect(compresion.controls(make(weights))).toEqual([
      { id: 'k', min: 0, max: 4, step: 1, start: 1 },
    ]);
    // contract: `start` fija el valor inicial, sin pasar del máximo
    expect(compresion.controls(make(weights, { start: 9 }))[0]!.start).toBe(4);
  });

  it('con diag(3, 4): k=1 se queda con el 4 y pierde el 3', () => {
    const v = measureAt(diag, { k: 1 });
    // contract: error = 3/√25 = 0,6; kept = 16/25 = 0,64; max_err = 3 (la celda que se pierde)
    expect(v.error).toBeCloseTo(0.6, 9);
    expect(v.kept).toBeCloseTo(0.64, 9);
    expect(v.max_err).toBeCloseTo(3, 9);
    // contract: stored = k·(m + n + 1) = 1·5; full = 4; ratio = 5/4
    expect(v.stored).toBe(5);
    expect(v.full).toBe(4);
    expect(v.ratio).toBeCloseTo(1.25, 9);
    expect(v.rank).toBe(2);
    expect(v.k).toBe(1);
    expect(v.sigma_1).toBeCloseTo(4, 9);
    expect(v.sigma_2).toBeCloseTo(3, 9);
  });

  it('k=0 pierde todo y k=min(m, n) no pierde nada', () => {
    const none = measureAt(diag, { k: 0 });
    // contract: sin capas, la aproximación es cero: error 1, kept 0, nada guardado
    expect(none.error).toBeCloseTo(1, 9);
    expect(none.kept).toBe(0);
    expect(none.stored).toBe(0);
    const all = measureAt(diag, { k: 2 });
    // contract: con todas las capas se reconstruye la matriz
    expect(all.error).toBeCloseTo(0, 9);
    expect(all.kept).toBeCloseTo(1, 9);
  });

  it('la cara de 8×8: el error baja con k y con k=2 guarda 34 números', () => {
    // contract: error y kept cumplen error² = 1 − kept (Eckart-Young); el 20,5 es Σ celdas² a mano
    const k2 = measureAt(make(smiley), { k: 2 });
    expect(k2.error! ** 2).toBeCloseTo(1 - k2.kept!, 9);
    // contract: valores calculados con este mismo modelo y comprobados con Σσ² = 20,5
    expect(k2.error).toBeCloseTo(0.18966, 4);
    expect(k2.kept).toBeCloseTo(0.96403, 4);
    // contract: stored = 2·(8 + 8 + 1) = 34; full = 64
    expect(k2.stored).toBe(34);
    expect(k2.full).toBe(64);
    // contract: k=1 ya cuesta 17 y deja un error de 34 %, que supera el 25 % de la meta
    const k1 = measureAt(make(smiley), { k: 1 });
    expect(k1.error).toBeCloseTo(0.34004, 4);
    expect(k1.stored).toBe(17);
    // contract: el dibujo es simétrico y de rango 4: con 4 capas no se pierde nada
    expect(measureAt(make(smiley), { k: 4 }).error).toBeCloseTo(0, 9);
    expect(measureAt(make(smiley), { k: 2 }).rank).toBe(4);
  });

  it('los pesos de rango 2: k=2 los reproduce con 22 números en vez de 24', () => {
    const spec = make(weights, { signed: true });
    const k1 = measureAt(spec, { k: 1 });
    const k2 = measureAt(spec, { k: 2 });
    // contract: A = u1·v1ᵀ + u2·v2ᵀ, de rango 2; ‖A‖² = 42 + 42 + 2·(u1·u2)(v1·v2) = 84 con u1·u2 = 0
    expect(k2.rank).toBe(2);
    // contract: σ1²·σ2² = (6·6 − 0²)·(7·7 − (−1)²) = 1728 y σ1² + σ2² = 84, luego σ² = 48 y 36
    expect(k2.sigma_1! ** 2).toBeCloseTo(48, 9);
    expect(k2.sigma_2! ** 2).toBeCloseTo(36, 9);
    // contract: con k=1 se conserva 48/84 de la energía y queda error; con k=2 el error es 0
    expect(k1.kept).toBeCloseTo(48 / 84, 9);
    expect(k1.error).toBeGreaterThan(0.1);
    expect(k2.error).toBeCloseTo(0, 9);
    // contract: stored = 2·(4 + 6 + 1) = 22 < 24 = 4·6
    expect(k2.stored).toBe(22);
    expect(k2.full).toBe(24);
    // contract: los σ de más allá del rango son 0
    expect(k2.sigma_3).toBe(0);
    expect(k2.sigma_4).toBe(0);
  });

  it('el modelo no pasa de `top`: un k fuera de rango se recorta', () => {
    // contract: k nunca supera min(m, n)
    expect(measureAt(diag, { k: 7 }).k).toBe(2);
  });
});

describe('laboratorio compresion: modo pick', () => {
  const spec = make(pickRows, { mode: 'pick' });

  it('tiene un interruptor por capa; start activa las primeras', () => {
    // contract: 5×5 → c1…c5, de 0 a 1, todos apagados por defecto
    const cs = compresion.controls(spec);
    expect(cs.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
    expect(cs.every((c) => c.min === 0 && c.max === 1 && c.step === 1 && c.start === 0)).toBe(true);
    // contract: start: 2 enciende c1 y c2 al empezar
    expect(startState(compresion.controls({ ...spec, start: 2 }))).toEqual({
      c1: 1,
      c2: 1,
      c3: 0,
      c4: 0,
      c5: 0,
    });
  });

  it('las dos primeras capas conservan más del 90 % y las dos últimas, casi nada', () => {
    const top2 = measureAt(spec, { c1: 1, c2: 1, c3: 0, c4: 0, c5: 0 });
    const last2 = measureAt(spec, { c1: 0, c2: 0, c3: 0, c4: 1, c5: 1 });
    // contract: Σ celdas² = 105 a mano; σ² = 84,22 + 12,09 de 105 → 91,7 %; mismo modelo, Σσ² = 105
    expect(top2.kept).toBeCloseTo(0.9173, 3);
    expect(goalMet({ metric: 'kept', op: 'gte', target: 0.9 }, top2)).toBe(true);
    expect(top2.k).toBe(2);
    expect(top2.stored).toBe(22);
    // contract: las capas 4 y 5 tienen σ² = 4 y 0,036: 4,04/105 ≈ 3,8 %
    expect(last2.kept).toBeCloseTo(0.0384, 3);
    expect(goalMet({ metric: 'kept', op: 'gte', target: 0.9 }, last2)).toBe(false);
    // contract: con solo la primera no se llega al 90 %
    expect(measureAt(spec, { c1: 1 }).kept).toBeCloseTo(0.8021, 3);
  });

  it('la escena marca las capas elegidas y la aproximación es su suma', () => {
    const scene = compresionScene(spec, { c1: 1, c3: 1 });
    // contract: chosen refleja los interruptores en 1
    expect(scene.chosen).toEqual([true, false, true, false, false]);
    const a = scene.approx[0]![0]!;
    // contract: la aproximación es la suma de las capas elegidas
    expect(a).toBeCloseTo(scene.layers[0]![0]![0]! + scene.layers[2]![0]![0]!, 9);
    // contract: error = original − aproximación
    expect(scene.error[0]![0]!).toBeCloseTo(pickRows[0]![0]! - a, 9);
  });
});
