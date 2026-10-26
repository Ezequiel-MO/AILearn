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
import { autovectores } from './autovectores';
import { examen2Autovectores } from './examen-2-autovectores';

const bankQuestions = examen2Autovectores
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto autovectores', projectQuestions(autovectores));
defineProseTests('banco examen-2 autovectores', bankQuestions);

type V = [number, number];
type M = [[number, number], [number, number]];
/** A·v con A de columnas i y j. */
const img = (i: V, j: V, v: V): V => [i[0] * v[0] + j[0] * v[1], i[1] * v[0] + j[1] * v[1]];
/** Producto cruzado v × w: 0 si los dos están en la misma recta. */
const cross = (v: V, w: V): number => v[0] * w[1] - v[1] * w[0];
const dot = (v: V, w: V): number => v[0] * w[0] + v[1] * w[1];
/** Ángulo en grados entre v y w. */
const angleDeg = (v: V, w: V): number =>
  (Math.atan2(Math.abs(cross(v, w)), dot(v, w)) * 180) / Math.PI;
/** Cociente de Rayleigh vᵀAv / vᵀv. */
const rayleigh = (i: V, j: V, v: V): number => dot(v, img(i, j, v)) / dot(v, v);
const trace = (m: M): number => m[0][0] + m[1][1];
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
/** Autovalores de una 2×2 por λ² − tλ + d = 0: reales o, con discriminante negativo, ±i·√d. */
const eigen = (m: M): { real: boolean; values: number[]; radius: number; maxReal: number } => {
  const t = trace(m);
  const d = det(m);
  const disc = t * t - 4 * d;
  if (disc >= 0) {
    const values = [(t - Math.sqrt(disc)) / 2, (t + Math.sqrt(disc)) / 2];
    return {
      real: true,
      values,
      radius: Math.max(...values.map(Math.abs)),
      maxReal: Math.max(...values),
    };
  }
  return { real: false, values: [], radius: Math.sqrt(d), maxReal: t / 2 };
};

describe('proyecto autovectores', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2 de matrices: checkProject(autovectores) devuelve la lista vacía
    expect(checkProject(autovectores)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2 de matrices: id autovectores, nombre «Autovectores», subtítulo «Las flechas que no giran»
    expect([autovectores.id, autovectores.name, autovectores.sub]).toEqual([
      'autovectores',
      'Autovectores',
      'Las flechas que no giran',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 2 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(autovectores.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(autovectores.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(autovectores.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón autovectores.exNN.k y autovectores.hoja.k', () => {
    // contract: encargo de la Órbita 2 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(autovectores).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `autovectores.ex0${e}.${k}`)),
      'autovectores.hoja.1',
      'autovectores.hoja.2',
      'autovectores.hoja.3',
    ]);
  });

  it('tiene calentamiento de 1 a 4 fichas con ids autovectores.cal.N', () => {
    // contract: encargo de la Órbita 2 de matrices: calentamiento de 1 a 4 fichas enlazado con `warmup:`
    const ids = (autovectores.warmup ?? []).map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids.length).toBeLessThanOrEqual(4);
    expect(ids).toEqual(ids.map((_, k) => `autovectores.cal.${k + 1}`));
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

describe('valores de la tabla del proyecto autovectores', () => {
  const [ex00, ex01, ex02] = autovectores.exercises;

  it('ex00: metas de cada manipular', () => {
    // contract: encargo de la Órbita 2 de matrices: ángulo 0 y x = 1; ángulo 0 y Rayleigh 2; ángulo 180; imagen (0, 0) y x = 1; A·v = (2, 2) y A·w = (1, 2)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['img_angle(i,j,v)=0±0.5', 'x(v)=1±0.01'],
      ['img_angle(i,j,v)=0±0.5', 'rayleigh(i,j,v)=2±0.01'],
      ['img_angle(i,j,v)=180±0.5'],
      ['img_x(i,j,v)=0±0.01', 'img_y(i,j,v)=0±0.01', 'x(v)=1±0.01'],
      ['img_x(i,j,v)=2±0.01', 'img_y(i,j,v)=2±0.01', 'img_x(i,j,w)=1±0.01', 'img_y(i,j,w)=2±0.01'],
    ]);
  });

  it('ex00: planos con la matriz, los vectores móviles y las lecturas del encargo', () => {
    const shape = ex00!.questions.map((q) => {
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      return [
        q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        q.plane.readouts,
        q.plane.range,
        q.plane.snap,
        q.plane.transform?.apply,
      ];
    });
    // contract: encargo de la Órbita 2 de matrices: A fija y v móvil en las cuatro primeras (rangos 4, 3, 3, 5, rejilla 1); en la quinta î y ĵ móviles desde la identidad y v, w fijos
    expect(shape).toEqual([
      [
        ['i=(2, 1) false', 'j=(1, 2) false', 'v=(1, 0) true'],
        ['matrix', 'image', 'img_angle'],
        4,
        1,
        ['v'],
      ],
      [
        ['i=(3, 0) false', 'j=(1, 2) false', 'v=(1, 0) true'],
        ['image', 'img_angle', 'rayleigh'],
        3,
        1,
        ['v'],
      ],
      [
        ['i=(0, 1) false', 'j=(1, 0) false', 'v=(2, 1) true'],
        ['image', 'img_angle', 'rayleigh'],
        3,
        1,
        ['v'],
      ],
      [
        ['i=(2, 4) false', 'j=(1, 2) false', 'v=(1, 0) true'],
        ['matrix', 'image', 'img_angle'],
        5,
        1,
        ['v'],
      ],
      [
        ['i=(1, 0) true', 'j=(0, 1) true', 'v=(1, 1) false', 'w=(1, 2) false'],
        ['matrix', 'image'],
        3,
        1,
        ['v', 'w'],
      ],
    ]);
  });

  it('ex00: las posiciones de las soluciones cumplen las metas y se recalculan a mano', () => {
    const q = (k: number): Question => ex00!.questions[k]!;
    const ok = (k: number, vectors: Record<string, V>): boolean =>
      grade(q(k) as Exclude<Question, CodigoQ>, { type: 'manipular', vectors });
    // contract: solution de ex00.1: A = (2 1; 1 2); v = (1, 1) da A·v = (3, 3) = 3v y v = (1, −1) da A·v = (1, −1) = 1v
    const A1: [V, V] = [
      [2, 1],
      [1, 2],
    ];
    expect(img(...A1, [1, 1])).toEqual([3, 3]);
    expect(img(...A1, [1, -1])).toEqual([1, -1]);
    expect(ok(0, { v: [1, 1] })).toBe(true);
    expect(ok(0, { v: [1, -1] })).toBe(true);
    // contract: solution de ex00.1: con v = (1, y) hace falta y² = 1: ninguna otra y entera del plano sirve
    for (const y of [-4, -3, -2, 0, 2, 3, 4]) {
      expect(cross([1, y], img(...A1, [1, y])), `y=${y}`).not.toBe(0);
      expect(ok(0, { v: [1, y] }), `y=${y}`).toBe(false);
    }
    // contract: error didáctico de ex00.1: el vector paralelo con x ≠ 1, (−1, −1), cumple el ángulo pero no la x
    expect(ok(0, { v: [-1, -1] })).toBe(false);

    // contract: solution de ex00.2: A = (3 1; 0 2); v = (1, −1) da A·v = (2, −2) = 2v, múltiplos incluidos
    const A2: [V, V] = [
      [3, 0],
      [1, 2],
    ];
    for (const v of [
      [1, -1],
      [2, -2],
      [3, -3],
      [-1, 1],
    ] as V[]) {
      const w = img(...A2, v);
      expect(cross(v, w), String(v)).toBe(0);
      expect(rayleigh(...A2, v), String(v)).toBeCloseTo(2, 12);
      expect(ok(1, { v }), String(v)).toBe(true);
    }
    // contract: enunciado de ex00.2: el vector de partida (1, 0) ya es autovector de λ = 3, y el (0, 1) tiene el cociente 2 sin ser autovector
    expect(img(...A2, [1, 0])).toEqual([3, 0]);
    expect(rayleigh(...A2, [1, 0])).toBe(3);
    expect(rayleigh(...A2, [0, 1])).toBe(2);
    expect(cross([0, 1], img(...A2, [0, 1]))).not.toBe(0);
    expect(ok(1, { v: [1, 0] })).toBe(false);
    expect(ok(1, { v: [0, 1] })).toBe(false);
    expect(ok(1, { v: [1, 1] })).toBe(false);

    // contract: solution de ex00.3: A = (0 1; 1 0); v = (1, −1) da A·v = (−1, 1) = −v (180 grados); (1, 1) es el otro autovector, con λ = 1
    const A3: [V, V] = [
      [0, 1],
      [1, 0],
    ];
    for (const v of [
      [1, -1],
      [2, -2],
      [-2, 2],
    ] as V[]) {
      expect(angleDeg(v, img(...A3, v)), String(v)).toBeCloseTo(180, 9);
      expect(rayleigh(...A3, v), String(v)).toBe(-1);
      expect(ok(2, { v }), String(v)).toBe(true);
    }
    expect(img(...A3, [1, 1])).toEqual([1, 1]);
    expect(ok(2, { v: [1, 1] })).toBe(false);
    // contract: enunciado de ex00.3: v = (2, 1) de partida; A·v = (1, 2), a 36,87 grados de v; (1, −2) da A·v = (−2, 1), a unos 143 grados
    expect(img(...A3, [2, 1])).toEqual([1, 2]);
    expect(angleDeg([2, 1], [1, 2])).toBeCloseTo(36.8699, 3);
    expect(angleDeg([1, -2], img(...A3, [1, -2]))).toBeCloseTo(143.13, 2);
    expect(ok(2, { v: [2, 1] })).toBe(false);
    expect(ok(2, { v: [1, -2] })).toBe(false);

    // contract: solution de ex00.4: A = (2 1; 4 2) y v = (1, −2) da A·v = (0, 0): autovalor 0
    const A4: [V, V] = [
      [2, 4],
      [1, 2],
    ];
    expect(img(...A4, [1, -2])).toEqual([0, 0]);
    expect(ok(3, { v: [1, -2] })).toBe(true);
    // contract: con x = 1 es la única posición de la rejilla: para (1, y), A·v = (2 + y)·(1, 2), nulo solo con y = −2
    for (const y of [-5, -4, -3, -1, 0, 1, 5]) expect(ok(3, { v: [1, y] }), `y=${y}`).toBe(false);
    expect(ok(3, { v: [0, 0] })).toBe(false);

    // contract: solution de ex00.5: î = (3, 2) y ĵ = (−1, 0) dan A·v = (2, 2) y A·w = (1, 2)
    expect(img([3, 2], [-1, 0], [1, 1])).toEqual([2, 2]);
    expect(img([3, 2], [-1, 0], [1, 2])).toEqual([1, 2]);
    expect(ok(4, { i: [3, 2], j: [-1, 0] })).toBe(true);
    // contract: enunciado de ex00.5: con la identidad (posición inicial) w cumple sus metas y v no
    expect(img([1, 0], [0, 1], [1, 2])).toEqual([1, 2]);
    expect(img([1, 0], [0, 1], [1, 1])).toEqual([1, 1]);
    expect(ok(4, { i: [1, 0], j: [0, 1] })).toBe(false);
    // contract: errores didácticos de ex00.5: acertar solo v, o solo w, o cambiar una columna por una unidad
    expect(img([2, 2], [0, 0], [1, 1])).toEqual([2, 2]);
    expect(ok(4, { i: [2, 2], j: [0, 0] })).toBe(false);
    expect(ok(4, { i: [3, 2], j: [-1, 1] })).toBe(false);
    expect(ok(4, { i: [1, 1], j: [1, 1] })).toBe(false);
  });

  it('ex00: la solución de ex00.5 es la única (sistema 2×2 con solución única)', () => {
    // contract: solution de ex00.5: î + ĵ = (2, 2) e î + 2ĵ = (1, 2) restando dan ĵ = (−1, 0) y î = (3, 2)
    const jv: V = [1 - 2, 2 - 2];
    const iv: V = [2 - jv[0], 2 - jv[1]];
    expect([jv, iv]).toEqual([
      [-1, 0],
      [3, 2],
    ]);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: encargo de la Órbita 2 de matrices: λ = 2; autovalores [2, 5]; autovector [1, 1]; opción 2 (el giro); 1024
    expect(ex01!.questions.map(answerOf)).toEqual([[2, 0], [[2, 5], 0], [[1, 1], 0], 2, [1024, 0]]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'numero',
      'vector',
      'vector',
      'opcion',
      'numero',
    ]);
  });

  it('ex01: las respuestas se recalculan', () => {
    const A: M = [
      [4, 1],
      [2, 3],
    ];
    // contract: ex01.1: A·(1, −2) = (4 − 2, 2 − 6) = (2, −4) = 2·(1, −2)
    expect(img([4, 2], [1, 3], [1, -2])).toEqual([2, -4]);
    // contract: ex01.2: traza 7, determinante 10, raíces de λ² − 7λ + 10: 2 y 5
    expect([trace(A), det(A)]).toEqual([7, 10]);
    expect(eigen(A).values).toEqual([2, 5]);
    // contract: ex01.3: (A − 5I)(1, 1) = (−1 + 1, 2 − 2) = (0, 0), así que (1, 1) es el autovector de λ = 5
    expect(img([4 - 5, 2], [1, 3 - 5], [1, 1])).toEqual([0, 0]);
    expect(img([4, 2], [1, 3], [1, 1])).toEqual([5, 5]);
    // contract: ex01.4: giro (traza 0, det 1): discriminante −4 < 0, sin autovalores reales; los otros tres tienen discriminante ≥ 0
    const opts: M[] = [
      [
        [1, 1],
        [0, 1],
      ],
      [
        [2, 0],
        [0, 3],
      ],
      [
        [0, -1],
        [1, 0],
      ],
      [
        [1, 0],
        [0, -1],
      ],
    ];
    expect(opts.map((m) => eigen(m).real)).toEqual([true, true, false, true]);
    expect(opts.findIndex((m) => !eigen(m).real)).toBe(2);
    // contract: ex01.5: cada paso multiplica por λ = 2; tras 10 pasos, 2^10 = 1024, y con λ = 0,5 queda 0,5^10 ≈ 0,001
    expect(2 ** 10).toBe(1024);
    expect(0.5 ** 10).toBeCloseTo(0.001, 3);
  });

  it('ex01.4: las cuatro opciones son las matrices del cálculo', () => {
    const q = ex01!.questions[3]!;
    // contract: solution de ex01.4: las opciones son (1 1; 0 1), (2 0; 0 3), (0 −1; 1 0) y (1 0; 0 −1)
    expect(q.type === 'opcion' ? q.options : []).toEqual([
      '$\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$',
      '$\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$',
      '$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$',
      '$\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const A: M = [
      [4, 1],
      [2, 3],
    ];
    // contract: ex02.1: el mayor autovalor de A es 5 y su autovector es proporcional a (1, 1)
    expect(Math.max(...eigen(A).values)).toBe(5);
    expect(cross([1, 1], img([4, 2], [1, 3], [1, 1]))).toBe(0);
    // contract: ex02.2: con A = (3 1; 0 2) y v = (1, −1), A·v = (2, −2) = 2v; el caso decimal (0,5 0,2; 0,2 0,8) y (0,1; 0,2) tiene λ = 0,9
    expect(img([3, 0], [1, 2], [1, -1])).toEqual([2, -2]);
    const B: [V, V] = [
      [0.5, 0.2],
      [0.2, 0.8],
    ];
    expect(Math.abs(cross([0.1, 0.2], img(...B, [0.1, 0.2])))).toBeLessThan(1e-15);
    expect(rayleigh(...B, [0.1, 0.2])).toBeCloseTo(0.9, 12);
    // contract: ex02.3: iterar A = (2 1; 1 2) desde (1, 0) con normalización converge a (1, 1)/√2
    let v: V = [1, 0];
    for (let k = 0; k < 50; k++) {
      const w = img([2, 1], [1, 2], v);
      const n = Math.hypot(w[0], w[1]);
      v = [w[0] / n, w[1] / n];
    }
    expect(v[0]).toBeCloseTo(Math.SQRT1_2, 12);
    expect(v[1]).toBeCloseTo(Math.SQRT1_2, 12);
    // contract: ex02.3: sin normalizar, 3^1000 se desborda a infinito en un decimal de 64 bits
    expect(3 ** 1000).toBe(Infinity);
    // contract: ex02.4: radios espectrales de los pesos 1,5; 1,2; 0,8; 0,9; 1,3 y estables [no, no, sí, sí, no]
    const Ws: M[] = [
      [
        [0.5, 1.0],
        [0.0, -1.5],
      ],
      [
        [0.0, -1.2],
        [1.2, 0.0],
      ],
      [
        [0.6, 0.3],
        [0.2, 0.5],
      ],
      [
        [0.9, 0.0],
        [0.0, -0.7],
      ],
      [
        [1.3, 0.2],
        [0.0, 0.3],
      ],
    ];
    const radii = Ws.map((m) => eigen(m).radius);
    [1.5, 1.2, 0.8, 0.9, 1.3].forEach((r, k) => expect(radii[k], `W${k + 1}`).toBeCloseTo(r, 12));
    expect(radii.map((r) => r < 1)).toEqual([false, false, true, true, false]);
    // contract: ex02.4, trampas: sin valor absoluto el primero parece estable (0,5); la segunda es compleja (±1,2i), con parte real 0; la tercera tiene autovalores 0,8 y 0,3
    expect(eigen(Ws[0]!).maxReal).toBeCloseTo(0.5, 12);
    expect(eigen(Ws[1]!).real).toBe(false);
    expect(eigen(Ws[1]!).maxReal).toBe(0);
    expect(eigen(Ws[2]!).values.map((x) => Math.round(x * 100) / 100)).toEqual([0.3, 0.8]);
    // contract: ex02.5: A^10 = (6510758 3254867; 6509734 3255891) y VD^10V⁻¹ lleva 2^10 y 5^10 en D^10
    let P: M = [
      [1, 0],
      [0, 1],
    ];
    for (let k = 0; k < 10; k++) P = mul(P, A);
    expect(P).toEqual([
      [6510758, 3254867],
      [6509734, 3255891],
    ]);
    expect([2 ** 10, 5 ** 10]).toEqual([1024, 9765625]);
    // contract: ex02.5: la traza de A^10 es 2^10 + 5^10, suma de los autovalores elevados
    expect(trace(P)).toBe(2 ** 10 + 5 ** 10);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 2 de matrices: código con «v = vecs[0]» (línea 3), razonamiento con la longitud (línea 3) y uno correcto (null); al menos una de código
    expect(autovectores.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(autovectores.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: tomar una fila de la matriz de autovectores, y tomar la longitud por el criterio de autovector
    const faulty = autovectores.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'v = vecs[0]',
      'Como A·v es más largo que v, v es un autovector y λ es el cociente de las longitudes',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of autovectores.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 1: la fila 0 de los autovectores de NumPy, (0,7071; −0,4472), no es autovector de A = (4 1; 2 3), y la columna (1, 1) sí
    expect(cross([0.70710678, -0.4472136], img([4, 2], [1, 3], [0.70710678, -0.4472136]))).not.toBe(
      0,
    );
    expect(
      Math.abs(cross([0.70710678, 0.70710678], img([4, 2], [1, 3], [0.70710678, 0.70710678]))),
    ).toBeLessThan(1e-12);
    // contract: hoja 2: A = (2 0; 0 3) y v = (1, 1) dan A·v = (2, 3), que no es múltiplo de v; los ejes sí son autovectores (λ = 2 y 3)
    expect(img([2, 0], [0, 3], [1, 1])).toEqual([2, 3]);
    expect(cross([1, 1], [2, 3])).not.toBe(0);
    expect(img([2, 0], [0, 3], [1, 0])).toEqual([2, 0]);
    expect(img([2, 0], [0, 3], [0, 1])).toEqual([0, 3]);
    // contract: hoja 3: A = (5 2; 2 2) tiene traza 7, determinante 6 y autovalores 1 y 6
    const S: M = [
      [5, 2],
      [2, 2],
    ];
    expect([trace(S), det(S)]).toEqual([7, 6]);
    expect(eigen(S).values).toEqual([1, 6]);
  });
});

describe('banco de examen 2 del proyecto autovectores', () => {
  it('tiene tres entradas fijas del proyecto autovectores, con ids examen-2.*', () => {
    // contract: encargo de la Órbita 2 de matrices: 3 entradas `{ project: 'autovectores', question }` con ids `examen-2.<tema>`
    expect(examen2Autovectores.map((e) => e.project)).toEqual([
      'autovectores',
      'autovectores',
      'autovectores',
    ]);
    expect(examen2Autovectores.map((e) => e.question.id)).toEqual([
      'examen-2.cual-es-autovector',
      'examen-2.autovalor-potencia',
      'examen-2.capas-que-explotan',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2Autovectores) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 2 de matrices: tres fijas, una opción, un número y un código; ids únicos en el juego
    expect(examen2Autovectores.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2Autovectores.map((e) => e.question.type)).toEqual(['opcion', 'numero', 'codigo']);
    const projectIds = new Set(projectQuestions(autovectores).map((q) => q.id));
    expect(examen2Autovectores.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [cual, potencia] = examen2Autovectores.map((e) => e.question);
    // contract: examen-2.cual-es-autovector: A·(0, 1) = (1, 2), A·(1, 1) = (4, 2), A·(1, −1) = (2, −2) = 2v, A·(1, 2) = (5, 4); solo la tercera
    const opts: V[] = [
      [0, 1],
      [1, 1],
      [1, -1],
      [1, 2],
    ];
    const A: [V, V] = [
      [3, 0],
      [1, 2],
    ];
    expect(opts.map((v) => img(...A, v))).toEqual([
      [1, 2],
      [4, 2],
      [2, -2],
      [5, 4],
    ]);
    expect(opts.map((v) => cross(v, img(...A, v)) === 0)).toEqual([false, false, true, false]);
    expect(cual!.type === 'opcion' ? [cual!.correct, cual!.options] : []).toEqual([
      2,
      ['$(0, 1)$', '$(1, 1)$', '$(1, -1)$', '$(1, 2)$'],
    ]);
    // contract: examen-2.autovalor-potencia: (−2)³ = −8
    expect(potencia!.type === 'numero' ? [potencia!.answer, potencia!.tol] : []).toEqual([-8, 0]);
    expect((-2) ** 3).toBe(-8);
  });

  it('capas-que-explotan: tres capas explotan, y las dos trampas dan 1 y 2', () => {
    const Ws: M[] = [
      [
        [0.8, 0.0],
        [0.0, -1.1],
      ],
      [
        [0.5, -1.0],
        [1.0, 0.5],
      ],
      [
        [0.9, 0.2],
        [0.1, 0.7],
      ],
      [
        [1.2, 0.5],
        [0.0, 0.6],
      ],
      [
        [-0.4, 0.3],
        [0.2, 0.5],
      ],
    ];
    const e = Ws.map(eigen);
    // contract: solution de examen-2.capas-que-explotan: radios 1,1; 1,12; 0,97; 1,2 y 0,56; explotan 3
    expect(e.map((x) => Math.round(x.radius * 100) / 100)).toEqual([1.1, 1.12, 0.97, 1.2, 0.56]);
    expect(e.filter((x) => x.radius > 1)).toHaveLength(3);
    // contract: solution de examen-2.capas-que-explotan: sin valor absoluto ni módulo (mayor parte real) salen 1; con valor absoluto de la parte real salen 2
    expect(e.filter((x) => x.maxReal > 1)).toHaveLength(1);
    const absReal = Ws.map((m) => {
      const x = eigen(m);
      return x.real ? x.radius : Math.abs(trace(m) / 2);
    });
    expect(absReal.filter((r) => r > 1)).toHaveLength(2);
  });
});

describe('proyecto autovectores: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(autovectores), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `autovectores.ex02.${n}`),
      'examen-2.capas-que-explotan',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
