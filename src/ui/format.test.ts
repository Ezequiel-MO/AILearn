import { describe, expect, it } from 'vitest';
import { fmt, fmtPair } from './format';

describe('fmt', () => {
  // contract: tarea 9, tabla de casos: fmt(3.5), fmt(6.0828, 2), fmt(5), fmt(-0.5), fmt(1/3, 3)
  it.each([
    [3.5, undefined, '3,5'],
    [6.0828, 2, '6,08'],
    [5, undefined, '5'],
    [-0.5, undefined, '−0,5'],
    [1 / 3, 3, '0,333'],
  ] as const)('fmt(%s, %s) = %s', (n, decimals, expected) => {
    expect(fmt(n, decimals)).toBe(expected);
  });

  // contract: addendum de la tarea 9: «Nivel 1,33»; «Nivel 0» cuando es 0 (dos decimales sin ceros de más)
  it('redondea a dos decimales por defecto y no deja ceros de más', () => {
    expect(fmt(1.3333)).toBe('1,33');
    expect(fmt(0)).toBe('0');
    expect(fmt(2.0)).toBe('2');
    expect(fmt(10)).toBe('10');
  });

  // contract: common.md: los decimales se muestran con coma; el menos es el tipográfico U+2212
  it('nunca muestra «−0» y usa el menos tipográfico', () => {
    expect(fmt(-0.001)).toBe('0');
    expect(fmt(-3)).toBe('−3');
    expect(fmt(-0.5)).not.toContain('-');
  });

  // contract: decisión de la tarea 9 (no está en el brief): un valor no finito se muestra como raya, no como «NaN»
  it('muestra una raya para lo no finito', () => {
    expect(fmt(Number.NaN)).toBe('—');
    expect(fmt(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('fmtPair', () => {
  // contract: ruling R15 de la sesión principal: sin decimales el separador es «, »; con algún decimal, «; » (como `tuple` en generators.ts)
  it.each([
    [[1, 3], '(1, 3)'],
    [[-2, 0], '(−2, 0)'],
    [[1.5, 3], '(1,5; 3)'],
    [[3, 0.5], '(3; 0,5)'],
    [[-1.5, 2], '(−1,5; 2)'],
    [[1, 2, 3], '(1, 2, 3)'],
    [[1, 2.5, 3], '(1; 2,5; 3)'],
  ] as const)('fmtPair(%j) = %s', (values, expected) => {
    expect(fmtPair(values)).toBe(expected);
  });

  // contract: ruling R15: la regla mira el texto ya formateado, así que un decimal que desaparece al redondear no cambia el separador
  it('decide el separador sobre el texto redondeado', () => {
    expect(fmtPair([2.999999, 1])).toBe('(3, 1)');
    expect(fmtPair([1, -0.001])).toBe('(1, 0)');
    expect(fmtPair([1.234, 1], 1)).toBe('(1,2; 1)');
  });
});
