import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { simetricas } from './simetricas';
import { examen2Simetricas } from './examen-2-simetricas';

const bankQuestions = examen2Simetricas
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto simetricas', projectQuestions(simetricas));
defineProseTests('banco examen-2 simetricas', bankQuestions);

type V = [number, number];
type M = [[number, number], [number, number]];
/** Determinante ad − bc de una matriz 2×2. */
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
/** Matriz de columnas u y v. */
const cols = (u: V, v: V): M => [
  [u[0], v[0]],
  [u[1], v[1]],
];
/** A·v. */
const apply = (a: M, v: V): V => [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
const dot = (a: number[], b: number[]): number => a.reduce((s, x, k) => s + x * b[k]!, 0);
/** Ángulo en grados entre dos vectores, recalculado con acos. */
const degrees = (a: V, b: V): number =>
  (Math.acos(dot(a, b) / Math.sqrt(dot(a, a) * dot(b, b))) * 180) / Math.PI;
/** Cociente vᵀAv / vᵀv. */
const rayleigh = (a: M, v: V): number => dot(v, apply(a, v)) / dot(v, v);
/** Covarianza de dos columnas, dividiendo entre n − 1. */
const cov = (x: number[], y: number[]): number => {
  const mx = x.reduce((s, t) => s + t, 0) / x.length;
  const my = y.reduce((s, t) => s + t, 0) / y.length;
  return x.reduce((s, t, k) => s + (t - mx) * (y[k]! - my), 0) / (x.length - 1);
};

describe('proyecto simetricas', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2 de matrices: checkProject(simetricas) devuelve la lista vacía
    expect(checkProject(simetricas)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2 de matrices (tabla de P0-comun): id simetricas, nombre «Matrices simétricas», subtítulo «Ejes perpendiculares y covarianza»
    expect([simetricas.id, simetricas.name, simetricas.sub]).toEqual([
      'simetricas',
      'Matrices simétricas',
      'Ejes perpendiculares y covarianza',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, tres hojas y calentamiento', () => {
    // contract: encargo de la Órbita 2 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas; de 1 a 4 fichas de calentamiento
    expect(simetricas.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(simetricas.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(simetricas.sheets).toHaveLength(3);
    expect(simetricas.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(simetricas.warmup?.length).toBeLessThanOrEqual(4);
  });

  it('los ids siguen el patrón simetricas.exNN.k y simetricas.hoja.k', () => {
    // contract: encargo de la Órbita 2 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(simetricas).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `simetricas.ex0${e}.${k}`)),
      'simetricas.hoja.1',
      'simetricas.hoja.2',
      'simetricas.hoja.3',
    ]);
  });
});

const goalsOf = (q: Question): string[] =>
  q.type === 'manipular'
    ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
    : [];

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('valores de la tabla del proyecto simetricas', () => {
  const [ex00, ex01, ex02] = simetricas.exercises;
  const manipular = (k: number) => {
    const q = ex00!.questions[k]!;
    if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
    return q;
  };

  it('ex00: metas de cada manipular', () => {
    // contract: encargo de la Órbita 2 de matrices: x de ĵ = 1 y det = 3; img_angle 0 de v y de w y ángulo 90; img_angle 0 y cociente 2 para v, img_angle 0 y cociente 1 para w; imagen (4, 4) de v y (2, −2) de w; cociente −1
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['x(j)=1±0.01', 'det(i,j)=3±0.01'],
      ['img_angle(i,j,v)=0±0.5', 'img_angle(i,j,w)=0±0.5', 'angle(v,w)=90±0.5'],
      [
        'img_angle(i,j,v)=0±0.5',
        'rayleigh(i,j,v)=2±0.01',
        'img_angle(i,j,w)=0±0.5',
        'rayleigh(i,j,w)=1±0.01',
      ],
      ['img_x(i,j,v)=4±0.01', 'img_y(i,j,v)=4±0.01', 'img_x(i,j,w)=2±0.01', 'img_y(i,j,w)=-2±0.01'],
      ['rayleigh(i,j,v)=-1±0.01'],
    ]);
  });

  it('ex00.1: la solución es única y recalcula simetría y determinante', () => {
    const q = manipular(0);
    // contract: solution de ex00.1: ĵ = (1, 2), con A = (2 1; 1 2) simétrica y det = 4 − 1 = 3
    expect(grade(q, { type: 'manipular', vectors: { j: [1, 2] } })).toBe(true);
    const a = cols([2, 1], [1, 2]);
    expect(a[0][1]).toBe(a[1][0]);
    expect(det(a)).toBe(3);
    // contract: el error didáctico de ex00.1: simétrica con det 5 (ĵ = (1, 3)), o det 3 sin simetría (ĵ = (3, 3))
    expect(grade(q, { type: 'manipular', vectors: { j: [1, 3] } })).toBe(false);
    expect(grade(q, { type: 'manipular', vectors: { j: [3, 3] } })).toBe(false);
    expect(det(cols([2, 1], [1, 3]))).toBe(5);
    expect(det(cols([2, 1], [3, 3]))).toBe(3);
  });

  it('ex00.2: v y w sobre las diagonales, perpendiculares, y las erróneas fallan', () => {
    const q = manipular(1);
    const A = cols([2, 1], [1, 2]);
    const solved: [V, V][] = [
      // contract: solution de ex00.2: v = (1, 1) y w = (1, −1) en cualquier orden y con cualquier múltiplo
      [
        [1, 1],
        [1, -1],
      ],
      [
        [1, -1],
        [1, 1],
      ],
      [
        [2, 2],
        [-2, 2],
      ],
    ];
    for (const [v, w] of solved) {
      expect(grade(q, { type: 'manipular', vectors: { v, w } }), `${v} ${w}`).toBe(true);
      // contract: encargo: A·v no gira (ángulo 0) y v, w forman 90°; los cocientes son 3 y 1 (autovalores)
      expect(degrees(v, apply(A, v))).toBeLessThan(1e-4);
      expect(degrees(w, apply(A, w))).toBeLessThan(1e-4);
      expect(degrees(v, w)).toBeCloseTo(90, 9);
    }
    expect([rayleigh(A, [1, 1]), rayleigh(A, [1, -1])]).toEqual([3, 1]);
    const wrong: [V, V][] = [
      // contract: error didáctico de ex00.2: w sobre una diagonal pero v no (45°); las dos flechas en el mismo eje; perpendiculares pero fuera de los ejes; la posición inicial
      [
        [1, 1],
        [1, 0],
      ],
      [
        [1, 1],
        [2, 2],
      ],
      [
        [1, 2],
        [-2, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
    ];
    for (const [v, w] of wrong)
      expect(grade(q, { type: 'manipular', vectors: { v, w } }), `${v} ${w}`).toBe(false);
  });

  it('ex00.3: A no simétrica; las dos direcciones forman 45° o 135°, no 90°', () => {
    const q = manipular(2);
    const A = cols([2, 0], [1, 1]);
    // contract: encargo: A = (2 1; 0 1) tiene i = (2, 0) y j = (1, 1), y no es simétrica (1 ≠ 0)
    expect(A[0][1]).not.toBe(A[1][0]);
    const solved: [V, V, number][] = [
      // contract: solution de ex00.3: v = (t, 0) y w = (1, −1) o su opuesto; 45° o 135°
      [[1, 0], [1, -1], 45],
      [[2, 0], [-1, 1], 135],
      [[-1, 0], [1, -1], 135],
    ];
    for (const [v, w, ang] of solved) {
      expect(grade(q, { type: 'manipular', vectors: { v, w } }), `${v} ${w}`).toBe(true);
      expect(rayleigh(A, v)).toBe(2);
      expect(rayleigh(A, w)).toBe(1);
      expect(degrees(v, apply(A, v))).toBeLessThan(1e-4);
      expect(degrees(w, apply(A, w))).toBeLessThan(1e-4);
      expect(degrees(v, w)).toBeCloseTo(ang, 9);
    }
    const wrong: [V, V][] = [
      // contract: error didáctico de ex00.3: w sin conservar la dirección; v y w con los cocientes cambiados; w con el cociente de v; la posición inicial
      [
        [1, 0],
        [1, 1],
      ],
      [
        [1, -1],
        [1, 0],
      ],
      [
        [1, 0],
        [1, 0],
      ],
      [
        [0, 1],
        [1, 1],
      ],
    ];
    for (const [v, w] of wrong)
      expect(grade(q, { type: 'manipular', vectors: { v, w } }), `${v} ${w}`).toBe(false);
  });

  it('ex00.4: la matriz con A·v = (4, 4) y A·w = (2, −2) es única y simétrica', () => {
    const q = manipular(3);
    // contract: solution de ex00.4: î = (3, 1), ĵ = (1, 3), con A·v = î + ĵ y A·w = î − ĵ
    expect(grade(q, { type: 'manipular', vectors: { i: [3, 1], j: [1, 3] } })).toBe(true);
    const A = cols([3, 1], [1, 3]);
    expect(apply(A, [1, 1])).toEqual([4, 4]);
    expect(apply(A, [1, -1])).toEqual([2, -2]);
    expect(A[0][1]).toBe(A[1][0]);
    // contract: error didáctico de ex00.4: columnas cambiadas de sitio (A·w sale (−2, 2)); la identidad
    expect(grade(q, { type: 'manipular', vectors: { i: [1, 3], j: [3, 1] } })).toBe(false);
    expect(apply(cols([1, 3], [3, 1]), [1, -1])).toEqual([-2, 2]);
    expect(grade(q, { type: 'manipular', vectors: { i: [1, 0], j: [0, 1] } })).toBe(false);
  });

  it('ex00.5: el cociente −1 está en la dirección de (1, −1); el máximo 3, en la de (1, 1)', () => {
    const q = manipular(4);
    const A = cols([1, 2], [2, 1]);
    for (const v of [
      [1, -1],
      [2, -2],
      [-1, 1],
    ] as V[]) {
      // contract: solution de ex00.5: cualquier múltiplo de (1, −1), con A·v = −v
      expect(grade(q, { type: 'manipular', vectors: { v } }), `${v}`).toBe(true);
      expect(rayleigh(A, v)).toBe(-1);
    }
    // contract: solution de ex00.5: el máximo, 3, está en la recta de (1, 1); (1, 0) da 1 (posición inicial)
    expect([rayleigh(A, [1, 1]), rayleigh(A, [1, 0])]).toEqual([3, 1]);
    for (const v of [
      [1, 1],
      [1, 0],
      [1, -2],
    ] as V[])
      expect(grade(q, { type: 'manipular', vectors: { v } }), `${v}`).toBe(false);
  });

  it('ex00: planos, vectores móviles, lecturas, rango, rejilla, pareja y elipse', () => {
    const shape = ex00!.questions.map((q) => {
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      return [
        q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        q.plane.readouts,
        q.plane.range,
        q.plane.snap,
        q.plane.transform,
        q.plane.pair,
        q.plane.circle,
        q.plane.circleImage,
      ];
    });
    // contract: encargo de la Órbita 2 de matrices (P2): î fijo y ĵ móvil desde (0, 1) en la primera; A fija y v, w móviles con pair, circle 1 y circleImage en la segunda; v y w móviles en la tercera; î y ĵ móviles con v, w fijos y elipse (circle 1 y circleImage, que el enunciado de ex00.4 anuncia y la revisión de la Órbita 2 añadió) en la cuarta (range 4, snap 1); v móvil en la quinta
    expect(shape).toEqual([
      [
        ['i=(2, 1) false', 'j=(0, 1) true'],
        ['matrix', 'det'],
        3,
        1,
        { columns: ['i', 'j'] },
        undefined,
        undefined,
        undefined,
      ],
      [
        ['i=(2, 1) false', 'j=(1, 2) false', 'v=(1, 0) true', 'w=(0, 1) true'],
        ['img_angle', 'rayleigh', 'angle'],
        3,
        1,
        { columns: ['i', 'j'], apply: ['v', 'w'] },
        ['v', 'w'],
        1,
        true,
      ],
      [
        ['i=(2, 0) false', 'j=(1, 1) false', 'v=(0, 1) true', 'w=(1, 1) true'],
        ['img_angle', 'rayleigh', 'angle'],
        3,
        1,
        { columns: ['i', 'j'], apply: ['v', 'w'] },
        ['v', 'w'],
        undefined,
        undefined,
      ],
      [
        ['i=(1, 0) true', 'j=(0, 1) true', 'v=(1, 1) false', 'w=(1, -1) false'],
        ['matrix', 'image'],
        4,
        1,
        { columns: ['i', 'j'], apply: ['v', 'w'] },
        undefined,
        1,
        true,
      ],
      [
        ['i=(1, 2) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['image', 'rayleigh'],
        3,
        1,
        { columns: ['i', 'j'], apply: ['v'] },
        undefined,
        undefined,
        undefined,
      ],
    ]);
  });

  it('ex01: respuestas de calcular y tipos', () => {
    // contract: encargo de la Órbita 2 de matrices (P2): opción 2 (la tercera matriz); covarianza 8; matriz [4, 2, 2, 4]; autovalor mayor 6; otro autovector [−1, 2]; todo con tol 0
    expect(ex01!.questions.map(answerOf)).toEqual([
      2,
      [8, 0],
      [[4, 2, 2, 4], 0],
      [6, 0],
      [[-1, 2], 0],
    ]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'opcion',
      'numero',
      'vector',
      'numero',
      'vector',
    ]);
    const q3 = ex01!.questions[2]!;
    // contract: encargo de la Órbita 2 de matrices (P2): la tercera pregunta teclea una matriz 2×2
    expect(q3.type === 'vector' ? q3.shape : undefined).toEqual([2, 2]);
  });

  it('ex01: las respuestas se recalculan', () => {
    // contract: ex01.1: solo (4 −2; −2 1) tiene la entrada de arriba a la derecha igual a la de abajo a la izquierda
    const opts: M[] = [
      [
        [1, 2],
        [3, 2],
      ],
      [
        [2, -1],
        [1, 2],
      ],
      [
        [4, -2],
        [-2, 1],
      ],
      [
        [0, 1],
        [0, 0],
      ],
    ];
    expect(opts.map((m) => m[0][1] === m[1][0])).toEqual([false, false, true, false]);
    // contract: ex01.2: cov de x = (2, 4, 9) e y = (1, 5, 6): medias 5 y 4, suma de productos 16, entre n − 1 = 2 da 8
    expect(cov([2, 4, 9], [1, 5, 6])).toBe(8);
    // contract: ex01.2 (solution): dividir entre n daría 16/3 ≈ 5,33; sin restar las medias, 76/2 = 38
    expect(16 / 3).toBeCloseTo(5.33, 2);
    expect((2 * 1 + 4 * 5 + 9 * 6) / 2).toBe(38);
    // contract: ex01.3: los puntos (0, 1), (2, 5), (4, 3) dan var x = 4, cov = 2, var y = 4
    const xs = [0, 2, 4];
    const ys = [1, 5, 3];
    expect([cov(xs, xs), cov(xs, ys), cov(ys, xs), cov(ys, ys)]).toEqual([4, 2, 2, 4]);
    // contract: ex01.4: C = (4 2; 2 4) tiene traza 8 y determinante 12, luego λ² − 8λ + 12 = 0 da 6 y 2; C·(1, 1) = 6·(1, 1)
    const C: M = [
      [4, 2],
      [2, 4],
    ];
    expect([4 + 4, det(C)]).toEqual([8, 12]);
    expect([6, 2].map((l) => l * l - 8 * l + 12)).toEqual([0, 0]);
    expect(apply(C, [1, 1])).toEqual([6, 6]);
    expect(apply(C, [1, -1])).toEqual([2, -2]);
    // contract: ex01.5: el otro autovector (−1, 2) es perpendicular a (2, 1): producto escalar 0
    expect(dot([2, 1], [-1, 2])).toBe(0);
  });

  it('ex01.1: las cuatro opciones son las matrices del cálculo', () => {
    const q = ex01!.questions[0]!;
    // contract: solution de ex01.1: las opciones son (1 2; 3 2), (2 −1; 1 2), (4 −2; −2 1) y (0 1; 0 0)
    expect(q.type === 'opcion' ? q.options : []).toEqual([
      '$\\begin{pmatrix}1&2\\\\3&2\\end{pmatrix}$',
      '$\\begin{pmatrix}2&-1\\\\1&2\\end{pmatrix}$',
      '$\\begin{pmatrix}4&-2\\\\-2&1\\end{pmatrix}$',
      '$\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: X con x = 1…6 e y = (2, 3, 5, 4, 7, 9): var x = 3,5, cov = 4,6, var y = 6,8
    const x = [1, 2, 3, 4, 5, 6];
    const y = [2, 3, 5, 4, 7, 9];
    expect([cov(x, x), cov(x, y), cov(y, y)].map((t) => Math.round(t * 1e9) / 1e9)).toEqual([
      3.5, 4.6, 6.8,
    ]);
    // contract: ex02.1 (checks): dividir var x entre n daría 17,5/6 = 35/12
    expect(((x.length - 1) * cov(x, x)) / x.length).toBeCloseTo(35 / 12, 12);
    // contract: ex02.2: los datos (1, 2), (2, 1), (3, 4), (4, 3), (5, 5) dan la covarianza (2,5 2; 2 2,5)
    const dx = [1, 2, 3, 4, 5];
    const dy = [2, 1, 4, 3, 5];
    expect([cov(dx, dx), cov(dx, dy), cov(dy, dy)]).toEqual([2.5, 2, 2.5]);
    // contract: ex02.3: C = (1 2; 2 −2) tiene traza −1 y determinante −6 (λ = 2 y −3); C·(2, 1) = 2·(2, 1) y C·(1, −2) = −3·(1, −2); (2, 1)·(1, −2) = 0
    const C: M = [
      [1, 2],
      [2, -2],
    ];
    expect([1 + -2, det(C)]).toEqual([-1, -6]);
    expect([2, -3].map((l) => l * l + l - 6)).toEqual([0, 0]);
    expect(apply(C, [2, 1])).toEqual([4, 2]);
    expect(apply(C, [1, -2])).toEqual([-3, 6]);
    expect(dot([2, 1], [1, -2])).toBe(0);
    // contract: ex02.4: C = (5 −2 0; −2 4 −2; 0 −2 3) tiene autovectores (1, 2, 2), (2, 1, −2) y (2, −2, 1) de autovalores 1, 4 y 7
    const C3 = [
      [5, -2, 0],
      [-2, 4, -2],
      [0, -2, 3],
    ];
    const times = (m: number[][], v: number[]): number[] => m.map((row) => dot(row, v));
    expect(times(C3, [1, 2, 2])).toEqual([1, 2, 2]);
    expect(times(C3, [2, 1, -2])).toEqual([8, 4, -8]);
    expect(times(C3, [2, -2, 1])).toEqual([14, -14, 7]);
    expect(
      dot([1, 2, 2], [2, 1, -2]) + dot([1, 2, 2], [2, -2, 1]) + dot([2, 1, -2], [2, -2, 1]),
    ).toBe(0);
    // contract: ex02.5: X con x = (2, 4, 6, 8, 10) e y = (1, 3, 2, 6, 3) tiene C = (10 3,5; 3,5 3,5); varianzas de (1, 0), (0, 3), (1, 1), (1, −1) normalizadas: 10, 3,5, 10,25 y 3,25
    const px = [2, 4, 6, 8, 10];
    const py = [1, 3, 2, 6, 3];
    const Cx: M = [
      [cov(px, px), cov(px, py)],
      [cov(px, py), cov(py, py)],
    ];
    expect(Cx).toEqual([
      [10, 3.5],
      [3.5, 3.5],
    ]);
    const cands: V[] = [
      [1, 0],
      [0, 3],
      [1, 1],
      [1, -1],
    ];
    expect(cands.map((u) => rayleigh(Cx, u))).toEqual([10, 3.5, 10.25, 3.25]);
    // contract: ex02.5 (solution): sin normalizar gana la candidata más larga, la 1 (uᵀCu = 10, 31,5, 20,5, 6,5)
    const raw = cands.map((u) => dot(u, apply(Cx, u)));
    expect(raw).toEqual([10, 31.5, 20.5, 6.5]);
    expect(raw.indexOf(Math.max(...raw))).toBe(1);
    expect(cands.map((u) => rayleigh(Cx, u)).indexOf(10.25)).toBe(2);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 2 de matrices (P2): código con np.cov(X) (línea 2), autovectores falsos (línea 3) y una correcta (null); al menos una de código
    expect(simetricas.sheets.map(answerOf)).toEqual([1, 2, null]);
    expect(simetricas.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas (P2): `C = np.cov(X)` sin rowvar, y «(1, 2) para λ = 1»
    const faulty = simetricas.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'C = np.cov(X)',
      'Sus autovectores son (1, 1) para λ = 3 y (1, 2) para λ = 1',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of simetricas.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    const A: M = [
      [2, 1],
      [1, 2],
    ];
    // contract: hoja 2: A = (2 1; 1 2) tiene traza 4 y determinante 3 (λ = 3 y 1); A·(1, 1) = 3·(1, 1), A·(1, −1) = (1, −1)
    expect([A[0][0] + A[1][1], det(A)]).toEqual([4, 3]);
    expect(apply(A, [1, 1])).toEqual([3, 3]);
    expect(apply(A, [1, -1])).toEqual([1, -1]);
    // contract: hoja 2 (solution): A·(1, 2) = (4, 5), no es múltiplo de (1, 2); (1, 1)·(1, 2) = 3
    expect(apply(A, [1, 2])).toEqual([4, 5]);
    expect(dot([1, 1], [1, 2])).toBe(3);
    // contract: hoja 3: C = (4 −3; −3 9) es simétrica, con var x = 4 < var y = 9, covarianza −3 y determinante 27 > 0
    const C: M = [
      [4, -3],
      [-3, 9],
    ];
    expect(C[0][1]).toBe(C[1][0]);
    expect(det(C)).toBe(27);
    expect(Math.abs(C[0][1])).toBeLessThanOrEqual(Math.sqrt(C[0][0] * C[1][1]));
  });
});

describe('banco de examen 2 del proyecto simetricas', () => {
  it('tiene tres entradas fijas del proyecto simetricas, con ids examen-2.*', () => {
    // contract: encargo de la Órbita 2 de matrices (P2): 3 entradas `{ project: 'simetricas', question }` con ids examen-2.angulo-autovectores, examen-2.varianza-direccion y examen-2.autovalores-de-mayor-a-menor
    expect(examen2Simetricas.map((e) => e.project)).toEqual([
      'simetricas',
      'simetricas',
      'simetricas',
    ]);
    expect(examen2Simetricas.map((e) => e.question.id)).toEqual([
      'examen-2.angulo-autovectores',
      'examen-2.varianza-direccion',
      'examen-2.autovalores-de-mayor-a-menor',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2Simetricas) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 2 de matrices (P2): tres fijas, una opción, un número y un código; ids únicos en el juego
    expect(examen2Simetricas.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2Simetricas.map((e) => e.question.type)).toEqual(['opcion', 'numero', 'codigo']);
    const projectIds = new Set(projectQuestions(simetricas).map((q) => q.id));
    expect(examen2Simetricas.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [angulo, varianza] = examen2Simetricas.map((e) => e.question);
    // contract: examen-2.angulo-autovectores: 90° (opción 0), porque (1, 1)·(1, −1) = 0 en el ejemplo
    expect(
      angulo!.type === 'opcion' ? [angulo!.correct, angulo!.options[angulo!.correct]] : [],
    ).toEqual([
      0,
      '$90^\\circ$, porque en una matriz simétrica las dos direcciones que solo se estiran son perpendiculares',
    ]);
    expect(dot([1, 1], [1, -1])).toBe(0);
    // contract: examen-2.varianza-direccion: uᵀCu = 4·0,36 + 2·2·0,48 + 4·0,64 = 5,92 con u = (0,6; 0,8), tol 0,01
    expect(varianza!.type === 'numero' ? [varianza!.answer, varianza!.tol] : []).toEqual([
      5.92, 0.01,
    ]);
    const C: M = [
      [4, 2],
      [2, 4],
    ];
    const u: V = [0.6, 0.8];
    expect(dot(u, apply(C, u))).toBeCloseTo(5.92, 12);
    expect(4 * 0.36 + 2 * 2 * 0.48 + 4 * 0.64).toBeCloseTo(5.92, 12);
    expect(dot(u, u)).toBeCloseTo(1, 12);
  });

  it('autovalores-de-mayor-a-menor: la covarianza de datos tiene autovalores 4,5 y 0,5', () => {
    // contract: solution de examen-2.autovalores-de-mayor-a-menor: datos con x = 1…5 e y = (0, −1, 1, 3, 2) dan C = (2,5 2; 2 2,5), de traza 5 y determinante 2,25
    const x = [1, 2, 3, 4, 5];
    const y = [0, -1, 1, 3, 2];
    const C: M = [
      [cov(x, x), cov(x, y)],
      [cov(x, y), cov(y, y)],
    ];
    expect(C).toEqual([
      [2.5, 2],
      [2, 2.5],
    ]);
    expect([C[0][0] + C[1][1], det(C)]).toEqual([5, 2.25]);
    // contract: λ² − 5λ + 2,25 = 0 tiene por raíces 4,5 y 0,5; C·(1, 1) = 4,5·(1, 1)
    expect([4.5, 0.5].map((l) => l * l - 5 * l + 2.25)).toEqual([0, 0]);
    expect(apply(C, [1, 1])).toEqual([4.5, 4.5]);
  });
});

describe('proyecto simetricas: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(simetricas), ...bankQuestions].filter(
    (q): q is CodigoQ => q.type === 'codigo',
  );

  it('los mensajes de las comprobaciones llevan el código en línea entre acentos graves', () => {
    for (const q of code) {
      for (const m of checkMessages(q)) {
        // contract: rereview-17d n1 (prosa.test.ts): `np.`, `plt.`, `None` y `emb` van en código en línea
        expect(withoutCode(m), `${q.id}: ${m}`).not.toMatch(/\b(np|plt)\.\w|\bNone\b|\bemb\b/);
      }
    }
  });

  it('los identificadores del starter y de la reference van en código en línea (review-18r m3)', () => {
    const SPANISH_WORDS = new Set(['y', 'e', 'o', 'a']);
    for (const q of code) {
      const names = new Set(
        [...`${q.starter}\n${q.reference}`.matchAll(/^(\w+)\s*=/gm)]
          .map((m) => m[1]!)
          .filter((n) => !SPANISH_WORDS.has(n)),
      );
      for (const m of checkMessages(q)) {
        const plain = withoutCode(m);
        for (const n of names)
          // contract: review-18r m3 (M18, prosa.test.ts): ningún nombre que el jugador escribe va suelto en un mensaje
          expect(plain, `${q.id}: ${m}`).not.toMatch(
            new RegExp(`(?<![\\p{L}_\\d])${n}(?![\\p{L}_\\d])`, 'u'),
          );
        // contract: review-18r bn1 (prosa.test.ts): las comillas rectas son código
        expect(plain, `${q.id}: ${m}`).not.toMatch(/\\?"/);
      }
    }
  });

  it('cada pregunta de código tiene mensajes que revisar', () => {
    // contract: encargo de la Órbita 2 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `simetricas.ex02.${n}`),
      'examen-2.autovalores-de-mayor-a-menor',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
