import { describe, expect, it } from 'vitest';
import { checkReachable, checkStartNotSolved } from '../../content/validate';
import { grade, type Answer } from '../../content/grade';
import { measure } from '../../engine/vectors';
import { bankEntrySchema, type ManipularQ, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { rangoBajo } from './rango-bajo';
import { examen3RangoBajo } from './examen-3-rango-bajo';

const bankQuestions = examen3RangoBajo
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto rango-bajo', projectQuestions(rangoBajo));
defineProseTests('banco examen-3 rango-bajo', bankQuestions);

type V = [number, number];

describe('proyecto rango-bajo', () => {
  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3 de matrices (tabla de la parte común): id rango-bajo, nombre «Rango bajo y LoRA», subtítulo «Comprimir y afinar»
    expect([rangoBajo.id, rangoBajo.name, rangoBajo.sub]).toEqual([
      'rango-bajo',
      'Rango bajo y LoRA',
      'Comprimir y afinar',
    ]);
  });

  it('tiene tres ejercicios, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase A): ex00 manipular y ex01 calcular de 5 preguntas, ex02 programar vacío hasta la fase B; tres hojas
    expect(rangoBajo.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(rangoBajo.exercises.map((e) => e.questions.length)).toEqual([5, 5, 0]);
    expect(rangoBajo.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón rango-bajo.exNN.k y rango-bajo.hoja.k', () => {
    // contract: encargo de la Órbita 3 de matrices: ids `<id>.ex00.1`…`<id>.ex01.5` y `<id>.hoja.1`…`<id>.hoja.3` (ex02 llega en la fase B)
    expect(projectQuestions(rangoBajo).map((q) => q.id)).toEqual([
      ...[0, 1].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `rango-bajo.ex0${e}.${k}`)),
      'rango-bajo.hoja.1',
      'rango-bajo.hoja.2',
      'rango-bajo.hoja.3',
    ]);
  });
});

const [ex00, ex01] = rangoBajo.exercises;
const manip = (k: number): ManipularQ => {
  const q = ex00!.questions[k]!;
  if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
  return q;
};

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

/** Imagen A·v de la matriz de columnas i y j. */
const img = (i: V, j: V, v: V): V => [i[0] * v[0] + j[0] * v[1], i[1] * v[0] + j[1] * v[1]];
const norm = (v: V): number => Math.hypot(v[0], v[1]);

describe('valores del proyecto rango-bajo: Manipular', () => {
  it('ex00: metas de cada manipular', () => {
    // contract: encargo de la Órbita 3 de matrices (rango-bajo): stretch 0; stretch 3,16; imagen de p (2, 4) e imagen de q (0, 0); imagen de p (3, 3) e imagen de q (0, 0); imagen de v (4, 2)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['stretch(i,j,v)=0±0.01'],
      ['stretch(i,j,v)=3.16±0.01'],
      ['img_x(i,j,p)=2±0.01', 'img_y(i,j,p)=4±0.01', 'img_x(i,j,q)=0±0.01', 'img_y(i,j,q)=0±0.01'],
      ['img_x(i,j,p)=3±0.01', 'img_y(i,j,p)=3±0.01', 'img_x(i,j,q)=0±0.01', 'img_y(i,j,q)=0±0.01'],
      ['img_x(i,j,v)=4±0.01', 'img_y(i,j,v)=2±0.01'],
    ]);
  });

  it('ex00: los planos son los del encargo', () => {
    const shape = ex00!.questions.map((q, k) => {
      const p = manip(k).plane;
      return [
        p.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        p.readouts,
        p.range,
        p.snap,
        p.transform?.apply,
        p.circle,
        p.circleImage,
        q.id,
      ];
    });
    // contract: encargo de la Órbita 3 de matrices (rango-bajo): A = (2 2; 1 1) con î = ĵ = (2, 1) y v móvil desde (1, 0) en ex00.1, .2 y .5; ex00.3 con î y ĵ móviles desde la identidad, snap 1, range 3 y sondas p = (1, 1), q = (1, −1); ex00.4 con î y ĵ móviles desde (2, 1) y (1, 2), snap 0,5, range 3; elipse imagen en ex00.1, .2 y .4
    expect(shape).toEqual([
      [
        ['i=(2, 1) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['matrix', 'stretch'],
        3,
        1,
        ['v'],
        1,
        true,
        'rango-bajo.ex00.1',
      ],
      [
        ['i=(2, 1) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['stretch', 'image'],
        3,
        1,
        ['v'],
        1,
        true,
        'rango-bajo.ex00.2',
      ],
      [
        ['i=(1, 0) true', 'j=(0, 1) true', 'p=(1, 1) false', 'q=(1, -1) false'],
        ['matrix', 'image'],
        3,
        1,
        ['p', 'q'],
        undefined,
        undefined,
        'rango-bajo.ex00.3',
      ],
      [
        ['i=(2, 1) true', 'j=(1, 2) true', 'p=(1, 1) false', 'q=(1, -1) false'],
        ['matrix', 'image'],
        3,
        0.5,
        ['p', 'q'],
        1,
        true,
        'rango-bajo.ex00.4',
      ],
      [
        ['i=(2, 1) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['image'],
        3,
        1,
        ['v'],
        undefined,
        undefined,
        'rango-bajo.ex00.5',
      ],
    ]);
  });

  it('ex00: las metas son alcanzables, no están resueltas al inicio y lo fijo cabe en la vista', () => {
    for (let k = 0; k < 5; k++) {
      const q = manip(k);
      // contract: README «Añadir una pregunta», punto 2: la meta es alcanzable y no se cumple al empezar
      expect(checkReachable(q), q.id).toEqual([]);
      expect(checkStartNotSolved(q), q.id).toEqual([]);
      const outside = q.plane.vectors
        .filter((v) => !v.movable && Math.max(Math.abs(v.x), Math.abs(v.y)) > q.plane.range)
        .map((v) => v.id);
      // contract: revisión de la Órbita 2: un vector fijo fuera de range deja la flecha fuera de la vista
      expect(outside, q.id).toEqual([]);
      // contract: README «Matrices en el plano»: como mucho 2 vectores móviles, y con 2, range ≤ 6 y snap ≥ 0,5
      const movable = q.plane.vectors.filter((v) => v.movable).length;
      expect(movable).toBeLessThanOrEqual(2);
      if (movable === 2) {
        expect(q.plane.range).toBeLessThanOrEqual(6);
        expect(q.plane.snap).toBeGreaterThanOrEqual(0.5);
      }
    }
  });

  it('ex00: las posiciones de las soluciones cumplen las metas y sus cifras se recalculan', () => {
    // contract: solution de cada pregunta: v sobre la recta de (1, −1) (también (2, −2) y (−1, 1)); v sobre la recta de (1, 1); î = ĵ = (1, 2); î = ĵ = (1,5; 1,5); v con x + y = 2
    const solved: [number, Record<string, V>][] = [
      [0, { v: [1, -1] }],
      [0, { v: [2, -2] }],
      [0, { v: [-1, 1] }],
      [1, { v: [1, 1] }],
      [1, { v: [2, 2] }],
      [1, { v: [-1, -1] }],
      [2, { i: [1, 2], j: [1, 2] }],
      [3, { i: [1.5, 1.5], j: [1.5, 1.5] }],
      [4, { v: [2, 0] }],
      [4, { v: [1, 1] }],
      [4, { v: [0, 2] }],
      [4, { v: [3, -1] }],
    ];
    for (const [k, vectors] of solved) {
      const q = manip(k);
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    const R = (v: V): V => img([2, 1], [2, 1], v);
    // contract: ex00.1: A = (2 2; 1 1), A·(1, −1) = (0, 0)
    expect(R([1, -1])).toEqual([0, 0]);
    // contract: ex00.2: el valor singular no nulo de u wᵀ es |u|·|w| = √5·√2 = √10 ≈ 3,16, y A·(1, 1) = (4, 2)
    expect(R([1, 1])).toEqual([4, 2]);
    expect(norm(R([1, 1])) / norm([1, 1])).toBeCloseTo(Math.sqrt(5) * Math.sqrt(2), 12);
    expect(Math.sqrt(10)).toBeCloseTo(3.16, 2);
    // contract: ex00.3: ΔW = (1, 2)ᵀ(1, 1) manda p = (1, 1) a (2, 4) y q = (1, −1) a (0, 0)
    expect(img([1, 2], [1, 2], [1, 1])).toEqual([2, 4]);
    expect(img([1, 2], [1, 2], [1, -1])).toEqual([0, 0]);
    // contract: ex00.4: A = (2 1; 1 2) tiene A·(1, 1) = (3, 3) (σ₁ = 3) y A·(1, −1) = (1, −1) (σ₂ = 1); A₁ = 3/2·(1 1; 1 1) conserva 9/(9 + 1) = 90 % de la energía
    expect(img([2, 1], [1, 2], [1, 1])).toEqual([3, 3]);
    expect(img([2, 1], [1, 2], [1, -1])).toEqual([1, -1]);
    expect(img([1.5, 1.5], [1.5, 1.5], [1, 1])).toEqual([3, 3]);
    expect(9 / (9 + 1)).toBe(0.9);
    // contract: ex00.5: A·v = (v_x + v_y)(2, 1), así que todo v con v_x + v_y = 2 da (4, 2)
    for (const v of [
      [2, 0],
      [1, 1],
      [0, 2],
      [3, -1],
    ] as V[])
      expect(R(v)).toEqual([4, 2]);
  });

  it('ex00: las posiciones erróneas didácticas no se dan por buenas', () => {
    // contract: el error didáctico de cada pregunta: la posición de partida, la recta de (1, 1) en lugar de la de (1, −1), el vector nulo (stretch NaN), la perpendicular y la dirección de partida, una sola columna bien, la matriz de partida sin podar y una entrada con otra suma
    const wrong: [number, Record<string, V>][] = [
      [0, { v: [1, 0] }],
      [0, { v: [1, 1] }],
      [0, { v: [0, 0] }],
      [1, { v: [1, 0] }],
      [1, { v: [1, -1] }],
      [1, { v: [0, 0] }],
      [2, { i: [1, 0], j: [0, 1] }],
      [2, { i: [2, 4], j: [0, 0] }],
      [2, { i: [1, 2], j: [0, 0] }],
      [3, { i: [2, 1], j: [1, 2] }],
      [3, { i: [3, 3], j: [0, 0] }],
      [4, { v: [1, 0] }],
      [4, { v: [2, 1] }],
      [4, { v: [0, 0] }],
    ];
    for (const [k, vectors] of wrong) {
      const q = manip(k);
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
    // contract: ex00.1/ex00.2: stretch de un vector nulo es NaN, que no cumple ninguna meta; stretch (1, 1) = √10 y stretch (1, 0) = √5
    expect(measure('stretch', ['i', 'j', 'v'], { i: [2, 1], j: [2, 1], v: [0, 0] })).toBeNaN();
    expect(measure('stretch', ['i', 'j', 'v'], { i: [2, 1], j: [2, 1], v: [1, 0] })).toBeCloseTo(
      Math.sqrt(5),
      12,
    );
  });
});

describe('valores del proyecto rango-bajo: Calcular, hojas y banco', () => {
  it('ex01: tipos y respuestas de calcular', () => {
    // contract: encargo de la Órbita 3 de matrices (rango-bajo): vector 2×3 [3, −1, 2, 6, −2, 4]; 36000; opción 1 (k = 2); 2,24 con tol 0,01; 65536
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'vector',
      'numero',
      'opcion',
      'numero',
      'numero',
    ]);
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[3, -1, 2, 6, -2, 4], 0],
      [36000, 0],
      1,
      [2.24, 0.01],
      [65536, 0],
    ]);
    const q1 = ex01!.questions[0]!;
    expect(q1.type === 'vector' ? q1.shape : undefined).toEqual([2, 3]);
  });

  it('ex01: las respuestas se recalculan y se dan por buenas', () => {
    // contract: ex01.1: u vᵀ con u = (1, 2) y v = (3, −1, 2): el elemento (i, j) vale u_i·v_j
    const u = [1, 2];
    const v = [3, -1, 2];
    expect(u.flatMap((a) => v.map((b) => a * b))).toEqual([3, -1, 2, 6, -2, 4]);
    // contract: ex01.2: 1000×800 con rango 20: 20·(1000 + 800) = 36000 frente a 1000·800 = 800000
    expect(20 * (1000 + 800)).toBe(36000);
    expect(1000 * 800).toBe(800000);
    // contract: ex01.3: σ = 6, 3, 2, 1: cuadrados 36, 9, 4, 1 (total 50); k = 1 conserva 72 % y k = 2 conserva 90 %
    const sigma = [6, 3, 2, 1];
    const sq = sigma.map((s) => s * s);
    const total = sq.reduce((a, b) => a + b, 0);
    expect(total).toBe(50);
    const kept = (k: number): number => sq.slice(0, k).reduce((a, b) => a + b, 0) / total;
    expect(kept(1)).toBe(0.72);
    expect(kept(2)).toBe(0.9);
    expect([1, 2, 3, 4].find((k) => kept(k) >= 0.9)).toBe(2);
    // contract: ex01.3 solution: sin elevar al cuadrado, 9/12 = 75 % y 11/12 ≈ 92 %: saldría k = 3
    expect((6 + 3) / 12).toBe(0.75);
    expect((6 + 3 + 2) / 12).toBeGreaterThan(0.9);
    // contract: ex01.4: error de Frobenius de la aproximación de rango 2: √(2² + 1²) = √5 ≈ 2,24; tamaño total √50 ≈ 7,07; √45 ≈ 6,71
    expect(Math.sqrt(2 ** 2 + 1 ** 2)).toBeCloseTo(2.24, 2);
    expect(Math.sqrt(50)).toBeCloseTo(7.07, 2);
    expect(Math.sqrt(36 + 9)).toBeCloseTo(6.71, 2);
    // contract: ex01.5: r = 8, d = k = 4096: 8·(4096 + 4096) = 65536 frente a 4096² = 16777216 (256 veces más)
    expect(8 * (4096 + 4096)).toBe(65536);
    expect(4096 * 4096).toBe(16777216);
    expect((4096 * 4096) / 65536).toBe(256);
    expect(4096 * 4096 * 8).toBe(134217728);
    // contract: ex01 solution/takeaway: 800000/36000 ≈ 22 y 1000·800·20 = 16000000
    expect(Math.round(800000 / 36000)).toBe(22);
    expect(1000 * 800 * 20).toBe(16000000);
    // contract: cada respuesta de la tabla se da por buena con grade
    const ok: Answer[] = [
      { type: 'vector', value: [3, -1, 2, 6, -2, 4] },
      { type: 'numero', value: 36000 },
      { type: 'opcion', index: 1 },
      { type: 'numero', value: 2.24 },
      { type: 'numero', value: 65536 },
    ];
    ex01!.questions.forEach((q, k) => {
      if (q.type === 'codigo') throw new Error('ex01 no tiene código');
      expect(grade(q, ok[k]!), q.id).toBe(true);
    });
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 3 de matrices (rango-bajo): código con Vt[:, :k] (línea 3), recuento de LoRA que multiplica d·k·r (línea 3) y razonamiento correcto (null)
    expect(rangoBajo.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(rangoBajo.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
    const faulty = rangoBajo.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    // contract: encargo de la Órbita 3 de matrices: la línea errónea es la que trunca con las columnas de Vt y la que multiplica d·k·r
    expect(faulty).toEqual([
      'A_k = U[:, :k] @ np.diag(S[:k]) @ Vt[:, :k].T',
      'Luego LoRA entrena 1000·500·4 = 2000000 parámetros',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of rangoBajo.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras se recalculan', () => {
    // contract: hoja 2: B de 1000×4 y A de 4×500: 4000 + 2000 = 6000 = 4·(1000 + 500); d·k·r = 2000000; W tiene 500000 números
    expect(1000 * 4 + 4 * 500).toBe(6000);
    expect(4 * (1000 + 500)).toBe(6000);
    expect(1000 * 500 * 4).toBe(2000000);
    expect(1000 * 500).toBe(500000);
    // contract: hoja 3: σ = 8, 4, 4, 2: cuadrados 64, 16, 16, 4 (total 100); k = 2 conserva 80 % y descarta 20 %
    const sq = [8, 4, 4, 2].map((s) => s * s);
    expect(sq.reduce((a, b) => a + b, 0)).toBe(100);
    expect((64 + 16) / 100).toBe(0.8);
    expect((16 + 4) / 100).toBe(0.2);
  });

  it('banco: dos entradas fijas del proyecto rango-bajo, con ids examen-3.* y cumpliendo el esquema', () => {
    // contract: encargo de la Órbita 3 de matrices (fase A): `{ project: 'rango-bajo', question }` con ids examen-3.lora-b-cero (opción) y examen-3.error-peor-direccion (número); el código llega en la fase B
    expect(examen3RangoBajo.map((e) => e.project)).toEqual(['rango-bajo', 'rango-bajo']);
    expect(examen3RangoBajo.map((e) => [e.question.id, e.question.type])).toEqual([
      ['examen-3.lora-b-cero', 'opcion'],
      ['examen-3.error-peor-direccion', 'numero'],
    ]);
    for (const entry of examen3RangoBajo) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
    // contract: encargo de la Órbita 3 de matrices: los ids reservados de las entradas generadas no se usan, y no chocan con los del proyecto
    const reserved = [
      'examen-3.valores-singulares',
      'examen-3.parametros-lora',
      'examen-3.puntuacion-atencion',
    ];
    const ids = examen3RangoBajo.map((e) => e.question.id);
    expect(ids.filter((id) => reserved.includes(id))).toEqual([]);
    const projectIds = new Set(projectQuestions(rangoBajo).map((q) => q.id));
    expect(ids.filter((id) => projectIds.has(id))).toEqual([]);
  });

  it('banco: respuestas', () => {
    const [b, e] = examen3RangoBajo.map((x) => x.question);
    // contract: examen-3.lora-b-cero: la opción correcta es la 1, ΔW = 0 al empezar
    expect(b!.type === 'opcion' ? b!.correct : -1).toBe(1);
    // contract: examen-3.error-peor-direccion: σ = 9, 5, 2, 1 y rango 2: el error en la peor dirección es σ₃ = 2; el de Frobenius sería √5 ≈ 2,24
    expect(e!.type === 'numero' ? [e!.answer, e!.tol] : []).toEqual([2, 0]);
    expect([9, 5, 2, 1][2]).toBe(2);
    expect(Math.sqrt(2 ** 2 + 1 ** 2)).toBeCloseTo(2.24, 2);
  });
});
