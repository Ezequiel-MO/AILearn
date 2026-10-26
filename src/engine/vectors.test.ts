import { describe, expect, it } from 'vitest';
import {
  add,
  angle,
  applyColumns,
  cosine,
  det2,
  distance,
  dot,
  measure,
  norm,
  projection,
  scalarProjection,
  scale,
} from './vectors';

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

describe('producto escalar, coseno, ángulo y proyección (Órbita 1)', () => {
  it('dot([3,4],[4,-2]) = 4', () => {
    expect(dot([3, 4], [4, -2])).toBe(4); // contract: 3·4 + 4·(-2) = 4, definición del producto escalar
  });
  it('vectores perpendiculares: producto escalar 0, coseno 0, ángulo 90', () => {
    expect(dot([2, 1], [-1, 2])).toBe(0); // contract: definición, 2·(-1) + 1·2 = 0
    expect(cosine([2, 1], [-1, 2])).toBe(0); // contract: cos = 0 / (‖a‖‖b‖)
    expect(angle([2, 1], [-1, 2])).toBeCloseTo(90, 10); // contract: acos(0) = 90°
  });
  it('misma dirección: coseno 1 y ángulo 0; opuestos: coseno -1 y ángulo 180', () => {
    expect(cosine([1, 2], [2, 4])).toBeCloseTo(1, 12); // contract: vectores paralelos del mismo sentido
    expect(angle([1, 2], [2, 4])).toBe(0); // contract: decisión de la Órbita 1, exacto en la rejilla (sin residuo de acos)
    expect(angle([1, 2, 2], [2, 4, 4])).toBeCloseTo(0, 6); // contract: en 3D, misma dirección
    expect(angle([1, 0, 0], [0, 0, 3])).toBeCloseTo(90, 10); // contract: en 3D, perpendiculares
    expect(cosine([1, 2], [-2, -4])).toBeCloseTo(-1, 12); // contract: sentidos opuestos
    expect(angle([1, 2], [-2, -4])).toBeCloseTo(180, 10); // contract: acos(-1) = 180°
  });
  it('coseno de (3,4) y (4,3) = 24/25, ángulo de (1,0) y (1,1) = 45', () => {
    expect(cosine([3, 4], [4, 3])).toBeCloseTo(0.96, 12); // contract: 24 / (5·5)
    expect(angle([1, 0], [1, 1])).toBeCloseTo(45, 10); // contract: diagonal del primer cuadrante
  });
  it('con el vector nulo no hay ángulo: coseno, ángulo y proyección son NaN', () => {
    expect(cosine([0, 0], [1, 2])).toBeNaN(); // contract: decisión de la Órbita 1, sin ángulo con el vector nulo
    expect(angle([1, 2], [0, 0])).toBeNaN(); // contract: decisión de la Órbita 1
    expect(scalarProjection([1, 2], [0, 0])).toBeNaN(); // contract: decisión de la Órbita 1
    expect(projection([1, 2], [0, 0])).toBeNull(); // contract: decisión de la Órbita 1
    expect(scalarProjection([0, 0], [1, 2])).toBe(0); // contract: proyectar el vector nulo da 0
  });
  it('proyección de (3,4) sobre (1,0): escalar 3 y vector (3,0)', () => {
    expect(scalarProjection([3, 4], [1, 0])).toBe(3); // contract: a·b/‖b‖ = 3/1
    expect(projection([3, 4], [1, 0])).toEqual([3, 0]); // contract: (a·b/b·b) b
  });
  it('proyección de (2,4) sobre (3,4): escalar 4,4 y vector (2,64; 3,52)', () => {
    expect(scalarProjection([2, 4], [3, 4])).toBeCloseTo(4.4, 12); // contract: a·b/‖b‖ = 22/5
    const p = projection([2, 4], [3, 4])!;
    expect(p[0]).toBeCloseTo(2.64, 12); // contract: (22/25)·3
    expect(p[1]).toBeCloseTo(3.52, 12); // contract: (22/25)·4
  });
  it('measure con las métricas nuevas', () => {
    const vs = { u: [3, 4], v: [4, 3] };
    expect(measure('dot', ['u', 'v'], vs)).toBe(24); // contract: 12 + 12
    expect(measure('cos', ['u', 'v'], vs)).toBeCloseTo(0.96, 12); // contract: 24/25
    expect(measure('angle', ['u', 'v'], vs)).toBeCloseTo(16.26, 2); // contract: acos(0,96) ≈ 16,26°
    expect(measure('proj', ['u', 'v'], vs)).toBeCloseTo(4.8, 12); // contract: 24/5
    expect(() => measure('dot', ['u'], vs)).toThrow(); // contract: dot exige dos vectores
  });
});

describe('determinante e imagen por una matriz (juego 2)', () => {
  it('det de las columnas (2,0) y (0,3) es 6', () => {
    expect(det2([2, 0], [0, 3])).toBe(6); // contract: 2·3 − 0·0
  });
  it('una reflexión (columnas (0,1) y (1,0)) tiene det negativo', () => {
    expect(det2([0, 1], [1, 0])).toBe(-1); // contract: 0·0 − 1·1
  });
  it('columnas paralelas dan det 0', () => {
    expect(det2([1, 2], [2, 4])).toBe(0); // contract: 1·4 − 2·2
  });
  it('imagen de (3,2) con columnas (1,0) y (1,1) es (5,2)', () => {
    expect(applyColumns([1, 0], [1, 1], [3, 2])).toEqual([5, 2]); // contract: 3·(1,0) + 2·(1,1)
  });
  it('imagen de (1,2) por la reflexión de columnas (0,1) y (1,0) es (2,1)', () => {
    expect(applyColumns([0, 1], [1, 0], [1, 2])).toEqual([2, 1]); // contract: 1·(0,1) + 2·(1,0)
  });
  it('measure con det, img_x e img_y', () => {
    const vs = { i: [2, 1], j: [-1, 3], v: [2, 1] };
    expect(measure('det', ['i', 'j'], vs)).toBe(7); // contract: 2·3 − 1·(−1)
    expect(measure('img_x', ['i', 'j', 'v'], vs)).toBe(3); // contract: 2·2 + 1·(−1)
    expect(measure('img_y', ['i', 'j', 'v'], vs)).toBe(5); // contract: 2·1 + 1·3
    expect(() => measure('img_x', ['i', 'j'], vs)).toThrow(); // contract: img_x exige tres vectores
    expect(() => measure('det', ['i', 'j', 'v'], vs)).toThrow(); // contract: det exige dos vectores
  });
});

describe('img_angle y rayleigh (Órbita 2)', () => {
  const sym = { i: [2, 1], j: [1, 2] }; // A simétrica, autovalores 3 y 1
  const at = (metric: 'img_angle' | 'rayleigh', v: number[], m: Record<string, number[]> = sym) =>
    measure(metric, ['i', 'j', 'v'], { ...m, v });

  it('img_angle vale 0 en los autovectores', () => {
    expect(at('img_angle', [1, 1])).toBeCloseTo(0, 9); // contract: brief de la tarea 1 de la Órbita 2, A·(1,1) = (3,3)
    expect(at('img_angle', [1, -1])).toBeCloseTo(0, 9); // contract: brief de la tarea 1 de la Órbita 2, A·(1,−1) = (1,−1)
  });
  it('img_angle de (1, 0) es el ángulo entre (1, 0) y (2, 1)', () => {
    expect(at('img_angle', [1, 0])).toBeCloseTo(26.565, 3); // contract: brief de la tarea 1 de la Órbita 2, atan(1/2) en grados
  });
  it('img_angle es NaN si v o A·v es nulo', () => {
    expect(at('img_angle', [0, 0])).toBeNaN(); // contract: brief de la tarea 1 de la Órbita 2, v nulo
    const singular = { i: [2, 4], j: [1, 2] };
    expect(at('img_angle', [1, -2], singular)).toBeNaN(); // contract: brief de la tarea 1 de la Órbita 2, A·(1,−2) = (0,0)
  });
  it('img_angle vale 180 con la reflexión y v = (1, −1)', () => {
    const flip = { i: [0, 1], j: [1, 0] };
    expect(at('img_angle', [1, -1], flip)).toBeCloseTo(180, 9); // contract: brief de la tarea 1 de la Órbita 2, A·(1,−1) = (−1,1)
  });
  it('rayleigh vale λ en los autovectores y no depende de la longitud', () => {
    expect(at('rayleigh', [1, 1])).toBeCloseTo(3, 9); // contract: brief de la tarea 1 de la Órbita 2, autovalor 3
    expect(at('rayleigh', [2, 2])).toBeCloseTo(3, 9); // contract: brief de la tarea 1 de la Órbita 2, misma dirección, mismo cociente
    expect(at('rayleigh', [1, -1])).toBeCloseTo(1, 9); // contract: brief de la tarea 1 de la Órbita 2, autovalor 1
  });
  it('rayleigh de (1, 0) es 2 y el de v nulo es NaN', () => {
    expect(at('rayleigh', [1, 0])).toBeCloseTo(2, 9); // contract: brief de la tarea 1 de la Órbita 2, (1,0)·(2,1) / 1
    expect(at('rayleigh', [0, 0])).toBeNaN(); // contract: brief de la tarea 1 de la Órbita 2, v nulo
  });
  it('las dos exigen tres vectores', () => {
    const vs = { ...sym, v: [1, 0] };
    expect(() => measure('img_angle', ['i', 'j'], vs)).toThrow(); // contract: brief de la tarea 1 de la Órbita 2, aridad 3
    expect(() => measure('rayleigh', ['i', 'j', 'v', 'v'], vs)).toThrow(); // contract: brief de la tarea 1 de la Órbita 2, aridad 3
  });
});
