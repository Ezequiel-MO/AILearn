import { describe, expect, it } from 'vitest';
import { curveAt, curveSlope, measureCurve, mseBest, type Curve } from './curves';

// f(x) = x² − 4x + 3: raíces 1 y 3, mínimo en x = 2 con f(2) = −1.
const parabola: Curve = { kind: 'poly', coefs: [3, -4, 1] };
// Datos de ŷ = w·x: (1, 2), (2, 4), (3, 7). Σxy = 2 + 8 + 21 = 31, Σx² = 14.
const fit: Curve = {
  kind: 'mse',
  data: [
    [1, 2],
    [2, 4],
    [3, 7],
  ],
};

describe('curveAt y curveSlope con un polinomio', () => {
  it('evalúa x² − 4x + 3', () => {
    // contract: cuenta a mano: f(0) = 3, f(2) = 4 − 8 + 3 = −1, f(5) = 25 − 20 + 3 = 8
    expect([0, 2, 5].map((x) => curveAt(parabola, x))).toEqual([3, -1, 8]);
  });
  it('su derivada es 2x − 4', () => {
    // contract: regla de la potencia: f′(x) = 2x − 4; f′(0) = −4, f′(2) = 0, f′(5) = 6
    expect([0, 2, 5].map((x) => curveSlope(parabola, x))).toEqual([-4, 0, 6]);
  });
  it('una constante tiene derivada 0 y el polinomio vacío vale 0', () => {
    // contract: la derivada de una constante es 0; sin coeficientes, f = 0
    expect(curveSlope({ kind: 'poly', coefs: [7] }, 3)).toBe(0);
    expect(curveAt({ kind: 'poly', coefs: [] }, 3)).toBe(0);
  });
  it('una cúbica: x³ en x = 2 vale 8 y su pendiente, 12', () => {
    // contract: (x³)′ = 3x²
    const cubic: Curve = { kind: 'poly', coefs: [0, 0, 0, 1] };
    expect([curveAt(cubic, 2), curveSlope(cubic, 2)]).toEqual([8, 12]);
  });
});

describe('la pérdida mse de ŷ = w·x', () => {
  it('es la media de los errores al cuadrado', () => {
    // contract: con w = 2 los errores son 0, 0 y −1: L = 1/3
    expect(curveAt(fit, 2)).toBeCloseTo(1 / 3, 12);
  });
  it('su derivada es la media de 2·xᵢ·(w·xᵢ − yᵢ)', () => {
    // contract: con w = 2: (0 + 0 + 2·3·(−1)) / 3 = −2
    expect(curveSlope(fit, 2)).toBeCloseTo(-2, 12);
  });
  it('el mínimo está en Σxy / Σx² y allí la pendiente es 0', () => {
    // contract: w* = 31 / 14; derivada nula en el mínimo
    expect(mseBest(fit)).toBeCloseTo(31 / 14, 12);
    expect(curveSlope(fit, mseBest(fit))).toBeCloseTo(0, 12);
  });
  it('sin datos con x distinto de 0 el mínimo no existe', () => {
    // contract: con todos los xᵢ = 0 la pérdida no depende de w
    expect(mseBest({ kind: 'mse', data: [[0, 1]] })).toBeNaN();
  });
});

describe('measureCurve', () => {
  const points = { p: [1, 0], q: [3, 0], a: [0, 1], b: [2, 5], c: [2, 9] };

  it('x, y, fx y slope de un punto', () => {
    // contract: f(1) = 0 y f′(1) = −2 en x² − 4x + 3; x e y son las coordenadas del punto
    expect(measureCurve('x', ['b'], points)).toBe(2);
    expect(measureCurve('y', ['b'], points)).toBe(5);
    expect(measureCurve('fx', ['p'], points, parabola)).toBe(0);
    expect(measureCurve('slope', ['p'], points, parabola)).toBe(-2);
  });
  it('la secante entre x = 1 y x = 3 es horizontal', () => {
    // contract: f(1) = f(3) = 0, así que (f(3) − f(1)) / (3 − 1) = 0
    expect(measureCurve('secant', ['p', 'q'], points, parabola)).toBe(0);
  });
  it('la secante con los dos puntos en la misma x no existe', () => {
    // contract: sin Δx no hay pendiente: NaN no cumple ninguna meta
    expect(measureCurve('secant', ['p', 'p'], points, parabola)).toBeNaN();
  });
  it('pendiente y ordenada de la recta por dos puntos libres', () => {
    // contract: por (0, 1) y (2, 5): pendiente (5 − 1) / 2 = 2, corta el eje y en 1
    expect(measureCurve('line_slope', ['a', 'b'], points)).toBe(2);
    expect(measureCurve('line_icpt', ['a', 'b'], points)).toBe(1);
  });
  it('una recta vertical no tiene pendiente ni ordenada', () => {
    // contract: misma x: NaN
    expect(measureCurve('line_slope', ['b', 'c'], points)).toBeNaN();
    expect(measureCurve('line_icpt', ['b', 'c'], points)).toBeNaN();
  });
  it('lanza error con una aridad equivocada, sin curva o con un punto que falta', () => {
    // contract: mismas reglas que measure del plano de vectores
    expect(() => measureCurve('secant', ['p'], points, parabola)).toThrow();
    expect(() => measureCurve('slope', ['p'], points)).toThrow();
    expect(() => measureCurve('x', ['z'], points)).toThrow();
  });
});
