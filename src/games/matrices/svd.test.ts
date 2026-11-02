import { describe, expect, it } from 'vitest';
import { checkReachable, checkStartNotSolved } from '../../content/validate';
import { grade } from '../../content/grade';
import { measure } from '../../engine/vectors';
import { bankEntrySchema, type ManipularQ, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { svd } from './svd';
import { examen3Svd } from './examen-3-svd';

const bankQuestions = examen3Svd
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto svd', projectQuestions(svd));
defineProseTests('banco examen-3 svd', bankQuestions);

type V = [number, number];
type M = [[number, number], [number, number]];
/** Producto A·v de una matriz 2×2 por un vector. */
const apply = (a: M, v: V): V => [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
const norm = (v: V): number => Math.hypot(v[0], v[1]);
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1];
/** Estiramiento |A·v| / |v|. */
const stretch = (a: M, v: V): number => norm(apply(a, v)) / norm(v);
/** Valores singulares de una matriz 2×2, de mayor a menor: raíces de los autovalores de AᵀA. */
const sv2 = (a: M): [number, number] => {
  const ata = [
    [a[0][0] * a[0][0] + a[1][0] * a[1][0], a[0][0] * a[0][1] + a[1][0] * a[1][1]],
    [a[0][0] * a[0][1] + a[1][0] * a[1][1], a[0][1] * a[0][1] + a[1][1] * a[1][1]],
  ] as M;
  const tr = ata[0][0] + ata[1][1];
  const det = ata[0][0] * ata[1][1] - ata[0][1] * ata[1][0];
  const s = Math.sqrt(Math.max(tr * tr - 4 * det, 0));
  return [Math.sqrt((tr + s) / 2), Math.sqrt(Math.max((tr - s) / 2, 0))];
};
const det2 = (a: M): number => a[0][0] * a[1][1] - a[0][1] * a[1][0];

describe('proyecto svd', () => {
  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3 de matrices (tabla de la parte común): id svd, nombre «SVD», subtítulo «Girar, estirar, girar»
    expect([svd.id, svd.name, svd.sub]).toEqual(['svd', 'SVD', 'Girar, estirar, girar']);
  });

  it('tiene tres ejercicios, de los tipos del encargo, y tres hojas (programar vacío hasta la fase B)', () => {
    // contract: encargo de la Órbita 3 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 + 5 preguntas hechas; tres hojas
    expect(svd.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(svd.exercises.map((e) => e.questions.length)).toEqual([5, 5, 0]);
    expect(svd.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón svd.exNN.k y svd.hoja.k', () => {
    // contract: encargo de la Órbita 3 de matrices: ids `<id>.ex00.1`…`<id>.ex01.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(svd).map((q) => q.id)).toEqual([
      ...[0, 1].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `svd.ex0${e}.${k}`)),
      'svd.hoja.1',
      'svd.hoja.2',
      'svd.hoja.3',
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

/** Matrices fijas de las preguntas de manipular. */
const A1: M = [
  [2, 2],
  [-1, 1],
];
const A3: M = [
  [2, 1],
  [-2, 1],
];
const A4: M = [
  [1, 2],
  [2, 1],
];

describe('valores de la tabla del proyecto svd', () => {
  const [ex00, ex01] = svd.exercises;
  const manip = (k: number): ManipularQ => {
    const q = ex00!.questions[k]!;
    if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
    return q;
  };

  it('ex00: metas de cada manipular', () => {
    // contract: encargo de la Órbita 3 de matrices (svd): stretch 2,83; 1,41; (2,83 y 1,41); 1; (2,24 y 2,24), siempre con tolerancia 0,01
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['stretch(i,j,v)=2.83±0.01'],
      ['stretch(i,j,v)=1.41±0.01'],
      ['stretch(i,j,v)=2.83±0.01', 'stretch(i,j,w)=1.41±0.01'],
      ['stretch(i,j,v)=1±0.01'],
      ['stretch(i,j,p)=2.24±0.01', 'stretch(i,j,q)=2.24±0.01'],
    ]);
  });

  it('ex00: los planos tienen las matrices, la elipse imagen y la lectura de estiramiento del encargo', () => {
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
    // contract: encargo de la Órbita 3 de matrices (svd): A = (2 2; −1 1) en ex00.1 y ex00.2 con v desde (1, 0); A = (2 1; −2 1) con v desde (1, 1) y w desde (1, −1); A = (1 2; 2 1) con v desde (1, 0); î = (2, 1) fija y ĵ móvil desde (0, 1) con p = (1, 1) y q = (1, −1) fijos; circle 1 y circleImage; range 4, 4, 3, 3, 3 para que quepan la elipse y la imagen de la solución
    expect(shape).toEqual([
      [
        ['i=(2, -1) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['matrix', 'stretch'],
        4,
        1,
        ['v'],
        1,
        true,
        'svd.ex00.1',
      ],
      [
        ['i=(2, -1) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['stretch', 'image'],
        4,
        1,
        ['v'],
        1,
        true,
        'svd.ex00.2',
      ],
      [
        ['i=(2, -2) false', 'j=(1, 1) false', 'v=(1, 1) true', 'w=(1, -1) true'],
        ['stretch', 'image'],
        3,
        1,
        ['v', 'w'],
        1,
        true,
        'svd.ex00.3',
      ],
      [
        ['i=(1, 2) false', 'j=(2, 1) false', 'v=(1, 0) true'],
        ['stretch', 'image'],
        3,
        1,
        ['v'],
        1,
        true,
        'svd.ex00.4',
      ],
      [
        ['i=(2, 1) false', 'j=(0, 1) true', 'p=(1, 1) false', 'q=(1, -1) false'],
        ['matrix', 'stretch'],
        3,
        1,
        ['p', 'q'],
        1,
        true,
        'svd.ex00.5',
      ],
    ]);
  });

  it('ex00: las metas son alcanzables en la rejilla y no están resueltas al empezar', () => {
    for (let k = 0; k < 5; k++) {
      // contract: checkReachable y checkStartNotSolved (src/content/validate.ts): la rejilla alcanza las metas y la posición inicial no las cumple
      expect(checkReachable(manip(k)), `ex00.${k + 1}`).toEqual([]);
      expect(checkStartNotSolved(manip(k)), `ex00.${k + 1}`).toEqual([]);
    }
  });

  it('ex00: todo vector fijo, su imagen y el semieje largo de la elipse caben en el plano', () => {
    for (let k = 0; k < 5; k++) {
      const q = manip(k);
      const r = q.plane.range;
      for (const v of q.plane.vectors) {
        // contract: orbita-2-planos.test.ts: cada vector del plano está dentro de ±range
        expect(Math.abs(v.x), `${q.id} ${v.id}`).toBeLessThanOrEqual(r);
        expect(Math.abs(v.y), `${q.id} ${v.id}`).toBeLessThanOrEqual(r);
      }
    }
    // contract: encargo de la Órbita 3 de matrices: la imagen de la solución cabe en el plano: A·(1, 1) = (4, 0) en range 4, A·(1, −1) = (0, −2), A·(1, 0) = (2, −2) en range 3
    expect(apply(A1, [1, 1])).toEqual([4, 0]);
    expect(apply(A1, [1, -1])).toEqual([0, -2]);
    expect(apply(A3, [1, 0])).toEqual([2, -2]);
    expect(apply(A4, [1, -1])).toEqual([-1, 1]);
    // contract: el semieje largo de la elipse (σ₁) cabe en el range de cada plano: 2,83 ≤ 4; 3 ≤ 3
    expect(sv2(A1)[0]).toBeLessThanOrEqual(4);
    expect(sv2(A3)[0]).toBeLessThanOrEqual(3);
    expect(sv2(A4)[0]).toBeLessThanOrEqual(3);
  });

  it('ex00: las matrices tienen los valores singulares del encargo', () => {
    // contract: encargo de la Órbita 3 de matrices (svd): A = (2 2; −1 1) tiene σ = 2√2 y √2 (σ₁σ₂ = 4 = |det|) y no tiene autovalores reales (traza 3, det 4: 9 − 16 < 0)
    expect(sv2(A1)[0]).toBeCloseTo(2 * Math.SQRT2, 9);
    expect(sv2(A1)[1]).toBeCloseTo(Math.SQRT2, 9);
    expect(sv2(A1)[0] * sv2(A1)[1]).toBeCloseTo(Math.abs(det2(A1)), 9);
    expect(det2(A1)).toBe(4);
    expect(3 * 3 - 4 * 4).toBeLessThan(0);
    // contract: A = (2 1; −2 1) tiene columnas perpendiculares (producto escalar 0) y σ = |(2, −2)| = 2√2, |(1, 1)| = √2
    expect(dot([2, -2], [1, 1])).toBe(0);
    expect(sv2(A3)[0]).toBeCloseTo(norm([2, -2]), 9);
    expect(sv2(A3)[1]).toBeCloseTo(norm([1, 1]), 9);
    // contract: A = (1 2; 2 1) es simétrica con autovalores 3 y −1 (traza 2, det −3) y valores singulares 3 y 1 = |λ|
    expect(sv2(A4)[0]).toBeCloseTo(3, 9);
    expect(sv2(A4)[1]).toBeCloseTo(1, 9);
    expect(1 * 1 - 2 * 2).toBe(-3);
  });

  it('ex00: las posiciones de las soluciones cumplen las metas y recalculan el estiramiento', () => {
    // contract: solution de cada pregunta: v en la recta de (1, 1); v en la de (1, −1); v en el eje x y w en el eje y; v en la de (1, −1); ĵ = (−1, 2) o (1, −2)
    const solved: [number, Record<string, V>][] = [
      [0, { v: [1, 1] }],
      [0, { v: [2, 2] }],
      [0, { v: [-1, -1] }],
      [1, { v: [1, -1] }],
      [1, { v: [-2, 2] }],
      [2, { v: [1, 0], w: [0, 1] }],
      [2, { v: [2, 0], w: [0, -1] }],
      [3, { v: [1, -1] }],
      [3, { v: [-1, 1] }],
      [4, { j: [-1, 2] }],
      [4, { j: [1, -2] }],
    ];
    for (const [k, vectors] of solved) {
      const q = manip(k);
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    // contract: encargo de la Órbita 3 de matrices: el estiramiento de cada solución, recalculado a mano: 4/√2, 2/√2, 2√2 y √2 sobre los ejes, 1
    expect(stretch(A1, [1, 1])).toBeCloseTo(2 * Math.SQRT2, 9);
    expect(stretch(A1, [1, -1])).toBeCloseTo(Math.SQRT2, 9);
    expect(stretch(A3, [1, 0])).toBeCloseTo(2 * Math.SQRT2, 9);
    expect(stretch(A3, [0, 1])).toBeCloseTo(Math.SQRT2, 9);
    expect(stretch(A4, [1, -1])).toBeCloseTo(1, 9);
    expect(stretch(A4, [1, 1])).toBeCloseTo(3, 9);
    // contract: solution de ex00.5: con ĵ = (−1, 2), A·p = (1, 3) y A·q = (3, −1), de longitud √10; con ĵ = (1, −2), el estiramiento también es √5
    const A5: M = [
      [2, -1],
      [1, 2],
    ];
    const A5b: M = [
      [2, 1],
      [1, -2],
    ];
    expect(apply(A5, [1, 1])).toEqual([1, 3]);
    expect(apply(A5, [1, -1])).toEqual([3, -1]);
    for (const a of [A5, A5b]) {
      expect(stretch(a, [1, 1])).toBeCloseTo(Math.sqrt(5), 9);
      expect(stretch(a, [1, -1])).toBeCloseTo(Math.sqrt(5), 9);
      expect(sv2(a)[0]).toBeCloseTo(Math.sqrt(5), 9);
      expect(sv2(a)[1]).toBeCloseTo(Math.sqrt(5), 9);
    }
    // contract: la métrica del motor coincide con el cálculo a mano
    expect(measure('stretch', ['i', 'j', 'v'], { i: [2, -1], j: [2, 1], v: [1, 1] })).toBeCloseTo(
      2 * Math.SQRT2,
      9,
    );
  });

  it('ex00: las posiciones erróneas didácticas no se dan por buenas', () => {
    // contract: el error didáctico de cada pregunta: la posición de partida, la dirección del otro extremo, los dos intercambiados, la dirección propia de autovalor 3 y ĵ de la posición de partida o con la longitud buena pero no perpendicular
    const wrong: [number, Record<string, V>][] = [
      [0, { v: [1, 0] }],
      [0, { v: [1, -1] }],
      [1, { v: [1, 0] }],
      [1, { v: [1, 1] }],
      [2, { v: [0, 1], w: [1, 0] }],
      [2, { v: [1, 0], w: [1, 0] }],
      [2, { v: [1, 1], w: [1, -1] }],
      [3, { v: [1, 0] }],
      [3, { v: [1, 1] }],
      [4, { j: [0, 1] }],
      [4, { j: [1, 2] }],
      [4, { j: [2, -1] }],
      [4, { j: [-2, 1] }],
    ];
    for (const [k, vectors] of wrong) {
      const q = manip(k);
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
    // contract: cada error se explica con su valor recalculado: √5 ≈ 2,24 al partir, 2,83 en el otro extremo; 3 en la dirección de (1, 1) de A4
    expect(stretch(A1, [1, 0])).toBeCloseTo(Math.sqrt(5), 9);
    expect(stretch(A1, [1, -1])).toBeCloseTo(1.414, 3);
    expect(stretch(A3, [1, 1])).toBeCloseTo(Math.sqrt(5), 9);
    expect(stretch(A3, [1, -1])).toBeCloseTo(Math.sqrt(5), 9);
    expect(stretch(A4, [1, 0])).toBeCloseTo(Math.sqrt(5), 9);
    // contract: ex00.5 al empezar (ĵ = (0, 1)): A·p = (2, 2), estiramiento 2, y A·q = (2, 0), estiramiento √2
    const A5s: M = [
      [2, 0],
      [1, 1],
    ];
    expect(stretch(A5s, [1, 1])).toBeCloseTo(2, 9);
    expect(stretch(A5s, [1, -1])).toBeCloseTo(Math.SQRT2, 9);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: encargo de la Órbita 3 de matrices (svd): vector (5, 3); número 6,71 (tol 0,01); 2; 18; opción 1 (rango 2)
    expect(ex01!.questions.map(answerOf)).toEqual([[[5, 3], 0], [6.71, 0.01], [2, 0], [18, 0], 1]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'vector',
      'numero',
      'numero',
      'numero',
      'opcion',
    ]);
  });

  it('ex01: las respuestas se recalculan', () => {
    // contract: ex01.1: diag(3, −5) tiene valores singulares |−5| = 5 y |3| = 3, de mayor a menor
    const d: M = [
      [3, 0],
      [0, -5],
    ];
    expect(sv2(d)).toEqual([5, 3]);
    // contract: ex01.2: A = (3 0; 4 5): AᵀA = (25 20; 20 25) con autovalores 45 y 5; σ₁ = √45 ≈ 6,71; σ₁σ₂ = |det| = 15
    const a2: M = [
      [3, 0],
      [4, 5],
    ];
    expect(sv2(a2)[0]).toBeCloseTo(Math.sqrt(45), 9);
    expect(sv2(a2)[1]).toBeCloseTo(Math.sqrt(5), 9);
    expect(Math.sqrt(45)).toBeCloseTo(6.71, 2);
    expect(sv2(a2)[0] * sv2(a2)[1]).toBeCloseTo(Math.abs(det2(a2)), 9);
    expect(det2(a2)).toBe(15);
    expect(25 + 20).toBe(45);
    expect(25 - 20).toBe(5);
    // contract: ex01.3: valores singulares 4 y 0,5: el área de la elipse es π·4·0,5 = 2π, el doble que la circunferencia unidad (π)
    expect((Math.PI * 4 * 0.5) / Math.PI).toBe(2);
    expect(4 * 0.5).toBe(2);
    // contract: ex01.4: σ₁ = 6 y |x| = 3: la mayor norma de Wx es 18; la menor, 0,5 · 3 = 1,5
    expect(6 * 3).toBe(18);
    expect(0.5 * 3).toBe(1.5);
    // contract: ex01.5: 4·10⁻¹⁰ frente a 8,3 es ruido (cociente del orden de 10⁻¹⁰, por debajo de la tolerancia de matrix_rank); 2,1 / 8,3 ≈ 0,25 no lo es
    expect(4e-10 / 8.3).toBeLessThan(1e-9);
    expect(2.1 / 8.3).toBeGreaterThan(0.2);
  });

  it('ex01.5: la opción correcta es el rango 2 por ruido de redondeo', () => {
    const q = ex01!.questions[4]!;
    // contract: encargo de la Órbita 3 de matrices (svd): la correcta es la que dice rango 2 y que el tercer valor es ruido de redondeo
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      'Rango 2: el tercer valor es tan pequeño frente a los otros que es ruido de redondeo',
    );
    expect(q.type === 'opcion' ? q.options.length : 0).toBe(4);
  });

  it('ex02: programar está vacío hasta la fase B', () => {
    // contract: encargo de la Órbita 3 de matrices (fase A): el ejercicio programar es un marcador sin preguntas
    expect(svd.exercises[2]).toEqual({ kind: 'programar', questions: [] });
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 3 de matrices (svd): código con Vt[:, 0] (línea 2), razonamiento con σ negativo (línea 2) y razonamiento correcto (null)
    expect(svd.sheets.map(answerOf)).toEqual([1, 1, null]);
    expect(svd.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas (svd): `v1 = Vt[:, 0]` (columna en vez de fila) y «los valores singulares de A son 3 y −1»
    const faulty = svd.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['v1 = Vt[:, 0]', 'Luego los valores singulares de A son 3 y −1', null]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of svd.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 2: A = (1 2; 2 1) tiene det 1 − 4 = −3, así que σ₁σ₂ = 3 = 3 · 1
    expect(det2(A4)).toBe(-3);
    expect(sv2(A4)[0] * sv2(A4)[1]).toBeCloseTo(3, 9);
    // contract: hoja 3: un giro de 30° no cambia la longitud de ningún vector, y todos sus valores singulares valen 1
    const t = (30 * Math.PI) / 180;
    const Q: M = [
      [Math.cos(t), -Math.sin(t)],
      [Math.sin(t), Math.cos(t)],
    ];
    expect(sv2(Q)[0]).toBeCloseTo(1, 9);
    expect(sv2(Q)[1]).toBeCloseTo(1, 9);
    expect(stretch(Q, [3, -7])).toBeCloseTo(1, 9);
    // contract: hoja 1: la primera columna de Vt no es la primera fila salvo por casualidad; con A = (2 2; −1 1), v₁ = (1, 1)/√2 estira 2√2
    expect(stretch(A1, [1, 1])).toBeCloseTo(sv2(A1)[0], 9);
  });
});

describe('banco de examen 3 del proyecto svd', () => {
  it('tiene dos entradas fijas del proyecto svd, con ids examen-3.* (la de código la añade la fase B)', () => {
    // contract: encargo de la Órbita 3 de matrices (svd): entradas `{ project: 'svd', question }` con una opción y un número de ids examen-3.svd-sin-autovalores y examen-3.numero-de-condicion
    expect(examen3Svd.map((e) => e.project)).toEqual(['svd', 'svd']);
    expect(examen3Svd.map((e) => e.question.id)).toEqual([
      'examen-3.svd-sin-autovalores',
      'examen-3.numero-de-condicion',
    ]);
    expect(examen3Svd.map((e) => e.question.type)).toEqual(['opcion', 'numero']);
  });

  it('cada entrada cumple el esquema del banco, ninguna usa un id reservado y no chocan con el proyecto', () => {
    for (const entry of examen3Svd) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
    // contract: encargo de la Órbita 3 de matrices: ids reservados de las entradas generadas del padre
    const reserved = [
      'examen-3.valores-singulares',
      'examen-3.parametros-lora',
      'examen-3.puntuacion-atencion',
    ];
    expect(examen3Svd.filter((e) => reserved.includes(e.question.id))).toEqual([]);
    const projectIds = new Set(projectQuestions(svd).map((q) => q.id));
    expect(examen3Svd.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [opc, num] = examen3Svd.map((e) => e.question);
    // contract: examen-3.svd-sin-autovalores: la opción correcta es la 1, «existe, como en toda matriz»
    expect(
      opc!.type === 'opcion' ? [opc!.correct, opc!.options.length, opc!.options[opc!.correct]] : [],
    ).toEqual([
      1,
      4,
      'Existe, como en toda matriz: los dos valores singulares valen 2, y el giro queda en los factores que giran',
    ]);
    // contract: examen-3.svd-sin-autovalores: A = (0 −2; 2 0) gira 90° y dobla: sin autovalores reales (traza 0, det 4), con σ₁ = σ₂ = 2
    const A: M = [
      [0, -2],
      [2, 0],
    ];
    expect(sv2(A)[0]).toBeCloseTo(2, 9);
    expect(sv2(A)[1]).toBeCloseTo(2, 9);
    expect(0 * 0 - 4 * det2(A)).toBeLessThan(0);
    expect(apply(A, [1, 0])).toEqual([0, 2]);
    // contract: examen-3.numero-de-condicion: autovalores 36 y 4: σ = 6 y 2, κ = 3; sin la raíz saldría 9
    expect(num!.type === 'numero' ? [num!.answer, num!.tol] : []).toEqual([3, 0]);
    expect(Math.sqrt(36) / Math.sqrt(4)).toBe(3);
    expect(36 / 4).toBe(9);
  });
});
