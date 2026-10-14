import { describe, expect, it } from 'vitest';
import { add, distance, measure, norm, scale } from './vectors';

describe('norm', () => {
  it('norm([3,4]) = 5', () => {
    expect(norm([3, 4])).toBe(5); // contract: tabla tarea 3
  });
  it('norm([1,-2,2]) = 3', () => {
    expect(norm([1, -2, 2])).toBe(3); // contract: tabla tarea 3
  });
});

describe('distance', () => {
  it('distance([3,4],[4,-2]) = raíz de 37', () => {
    expect(distance([3, 4], [4, -2])).toBeCloseTo(6.0828, 4); // contract: tabla tarea 3
  });
  it('lanza error con dimensiones distintas', () => {
    expect(() => distance([1, 2], [1, 2, 3])).toThrow(); // contract: decisión de implementación (no es una fila de la tabla de la tarea 3)
  });
});

describe('add y scale', () => {
  it('add([2,-1],[-5,4]) = [-3,3]', () => {
    expect(add([2, -1], [-5, 4])).toEqual([-3, 3]); // contract: tabla tarea 3
  });
  it('scale(3,[-2,1]) = [-6,3]', () => {
    expect(scale(3, [-2, 1])).toEqual([-6, 3]); // contract: tabla tarea 3
  });
  it('add con dimensiones distintas lanza error', () => {
    expect(() => add([1, 2], [1, 2, 3])).toThrow(); // contract: tabla tarea 3
  });
});

describe('measure', () => {
  const vs = { u: [2, 1], v: [3, 2] };
  it('sum_x de u y v = 5', () => {
    expect(measure('sum_x', ['u', 'v'], vs)).toBe(5); // contract: tabla tarea 3
  });
  it('sum_y de u y v = 3', () => {
    expect(measure('sum_y', ['u', 'v'], vs)).toBe(3); // contract: contrato de measure (suma de las componentes y)
  });
  it('x, y y norm de un vector', () => {
    expect(measure('x', ['v'], vs)).toBe(3); // contract: contrato de measure (componente x)
    expect(measure('y', ['v'], vs)).toBe(2); // contract: contrato de measure (componente y)
    expect(measure('norm', ['v'], { v: [3, 4] })).toBe(5); // contract: tabla tarea 3 (norm([3,4]))
  });
  it('distance entre dos vectores', () => {
    expect(measure('distance', ['u', 'v'], { u: [3, 4], v: [4, -2] })).toBeCloseTo(6.0828, 4); // contract: tabla tarea 3
  });
  it('distance con un solo id lanza error (faltan vectores)', () => {
    expect(() => measure('distance', ['u'], vs)).toThrow(); // contract: tabla tarea 3
  });
  it('un id que no existe lanza error', () => {
    expect(() => measure('x', ['w'], vs)).toThrow(); // contract: contrato de measure (ids de vectores del plano)
  });
  it('x con dos ids lanza error (uno para x, y, norm)', () => {
    expect(() => measure('x', ['u', 'v'], vs)).toThrow(); // contract: contrato de measure, uno para x, y, norm
  });
});
