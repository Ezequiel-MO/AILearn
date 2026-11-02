import { describe, expect, it } from 'vitest';
import { checkProject, checkReachable, checkStartNotSolved } from '../../content/validate';
import { grade } from '../../content/grade';
import { measure } from '../../engine/vectors';
import {
  bankEntrySchema,
  type CodigoQ,
  type ManipularQ,
  type Question,
} from '../../content/schema';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { atencion } from './atencion';
import { examen3Atencion } from './examen-3-atencion';

const bankQuestions = examen3Atencion
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto atencion', projectQuestions(atencion));
defineProseTests('banco examen-3 atencion', bankQuestions);

type V = [number, number];
type Graded = Exclude<Question, CodigoQ>;
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1];
/** Producto A·v con las columnas î y ĵ. */
const img = (i: V, j: V, v: V): V => [i[0] * v[0] + j[0] * v[1], i[1] * v[0] + j[1] * v[1]];

const [ex00, ex01, ex02] = atencion.exercises;

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

describe('proyecto atencion', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): checkProject(atencion) devuelve la lista vacía
    expect(checkProject(atencion)).toEqual([]);
  });

  it('tiene calentamiento de Python de 1 a 4 fichas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): calentamiento de 1 a 4 fichas enlazado con warmup
    expect(atencion.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(atencion.warmup?.length).toBeLessThanOrEqual(4);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3 de matrices (tabla de la parte común): id atencion, nombre «Atención como matriz», subtítulo «Quién mira a quién»
    expect([atencion.id, atencion.name, atencion.sub]).toEqual([
      'atencion',
      'Atención como matriz',
      'Quién mira a quién',
    ]);
  });

  it('tiene los tres ejercicios en orden, 5 preguntas cada uno, y tres hojas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): ex00 manipular, ex01 calcular y ex02 programar, de 5 preguntas cada uno; tres hojas
    expect(atencion.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(atencion.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(atencion.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón atencion.exNN.k y atencion.hoja.k', () => {
    // contract: encargo de la Órbita 3 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(atencion).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `atencion.ex0${e}.${k}`)),
      'atencion.hoja.1',
      'atencion.hoja.2',
      'atencion.hoja.3',
    ]);
  });
});

describe('ex00 de atencion: Manipular', () => {
  it('metas de cada manipular', () => {
    // contract: encargo de la Órbita 3 de matrices (atencion): dot(q,k1)=5 y dot(q,k2)=0; img (3, 1); dot 4 y ángulo 45 (tol 0,5); img (0, 2); img (3, 1) y dot(w,unos)=1
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['dot(q,k1)=5±0.01', 'dot(q,k2)=0±0.01'],
      ['img_x(i,j,q)=3±0.01', 'img_y(i,j,q)=1±0.01'],
      ['dot(q,k)=4±0.01', 'angle(q,k)=45±0.5'],
      ['img_x(i,j,x)=0±0.01', 'img_y(i,j,x)=2±0.01'],
      ['img_x(i,j,w)=3±0.01', 'img_y(i,j,w)=1±0.01', 'dot(w,unos)=1±0.01'],
    ]);
  });

  it('los planos son los del encargo', () => {
    const shape = ex00!.questions.map((_, k) => {
      const p = manip(k).plane;
      return [
        p.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        p.readouts,
        p.range,
        p.snap,
        p.transform?.apply,
        p.pair,
      ];
    });
    // contract: encargo de la Órbita 3 de matrices (atencion): k1 = (2, 1), k2 = (−1, 2) fijas y q móvil desde (1, 0); K con filas (2, 1) y (0, 1), es decir î = (2, 0) y ĵ = (1, 1); q = (2, 0) fija y k móvil desde (1, 0); W_Q = giro de 90° (î = (0, 1), ĵ = (−1, 0)) con k = (0, 2) fija y x móvil desde (1, 0); valores v1 = (4, 0), v2 = (0, 4), pesos móviles desde (0,5; 0,5) con snap 0,25, range 4 y el vector fijo (1, 1)
    expect(shape).toEqual([
      [
        ['k1=(2, 1) false', 'k2=(-1, 2) false', 'q=(1, 0) true'],
        ['dot'],
        3,
        1,
        undefined,
        ['q', 'k1'],
      ],
      [
        ['i=(2, 0) false', 'j=(1, 1) false', 'q=(1, 0) true'],
        ['matrix', 'image'],
        3,
        1,
        ['q'],
        undefined,
      ],
      [['q=(2, 0) false', 'k=(1, 0) true'], ['dot', 'angle'], 3, 1, undefined, ['q', 'k']],
      [
        ['i=(0, 1) false', 'j=(-1, 0) false', 'k=(0, 2) false', 'x=(1, 0) true'],
        ['matrix', 'image', 'cos'],
        3,
        1,
        ['x'],
        ['x', 'k'],
      ],
      [
        ['i=(4, 0) false', 'j=(0, 4) false', 'w=(0.5, 0.5) true', 'unos=(1, 1) false'],
        ['matrix', 'image', 'dot'],
        4,
        0.25,
        ['w'],
        ['w', 'unos'],
      ],
    ]);
  });

  it('todos alcanzables, ninguno resuelto al empezar y los vectores fijos caben en range', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: reglas del contenido (CLAUDE.md): meta alcanzable en la rejilla y no resuelta al inicio
      expect(checkReachable(q)).toEqual([]);
      expect(checkStartNotSolved(q)).toEqual([]);
      const outside = q.plane.vectors
        .filter((v) => !v.movable && Math.max(Math.abs(v.x), Math.abs(v.y)) > q.plane.range)
        .map((v) => v.id);
      // contract: revisión de la Órbita 2 (un vector fijo fuera de range deja la flecha fuera de la vista)
      expect(outside).toEqual([]);
    }
  });

  it('las posiciones de las soluciones cumplen las metas y recalculan las lecturas', () => {
    const k1: V = [2, 1];
    const k2: V = [-1, 2];
    // contract: solution de ex00.1: q = (2, 1) puntúa 4 + 1 = 5 con k1 y −2 + 2 = 0 con k2
    expect(grade(manip(0), { type: 'manipular', vectors: { q: [2, 1] } })).toBe(true);
    expect(dot([2, 1], k1)).toBe(5);
    expect(dot([2, 1], k2)).toBe(0);
    // contract: solution de ex00.2: K·(1, 1) = (2 + 1, 0 + 1) = (3, 1), con î = (2, 0) y ĵ = (1, 1)
    expect(grade(manip(1), { type: 'manipular', vectors: { q: [1, 1] } })).toBe(true);
    expect(img([2, 0], [1, 1], [1, 1])).toEqual([3, 1]);
    // contract: solution de ex00.3: k = (2, 2) o (2, −2) puntúa 4 y forma 45° con q = (2, 0); |k| = 2√2
    for (const k of [
      [2, 2],
      [2, -2],
    ] as V[]) {
      expect(grade(manip(2), { type: 'manipular', vectors: { k } })).toBe(true);
      expect(measure('dot', ['q', 'k'], { q: [2, 0], k })).toBeCloseTo(4, 12);
      expect(measure('angle', ['q', 'k'], { q: [2, 0], k })).toBeCloseTo(45, 9);
    }
    // contract: solution de ex00.4: W_Q·(2, 0) = (0, 2) = k, puntúa 4, y el coseno de x con k es 0
    expect(grade(manip(3), { type: 'manipular', vectors: { x: [2, 0] } })).toBe(true);
    expect(img([0, 1], [-1, 0], [2, 0])).toEqual([0, 2]);
    expect(dot(img([0, 1], [-1, 0], [2, 0]), [0, 2])).toBe(4);
    expect(measure('cos', ['x', 'k'], { x: [2, 0], k: [0, 2] })).toBeCloseTo(0, 12);
    // contract: solution de ex00.5: A·(0,75; 0,25) = 0,75·(4, 0) + 0,25·(0, 4) = (3, 1) y la suma de pesos es 1
    expect(grade(manip(4), { type: 'manipular', vectors: { w: [0.75, 0.25] } })).toBe(true);
    expect(img([4, 0], [0, 4], [0.75, 0.25])).toEqual([3, 1]);
    expect(0.75 + 0.25).toBe(1);
  });

  it('las posiciones erróneas didácticas no se dan por buenas', () => {
    // contract: el error didáctico de cada pregunta: q alineada con k1 pero larga o corta, q perpendicular a k2 solo; K·q = (2, 0) de partida y q = (1, 2); k alineada con q (ángulo 0), o a 45° con longitud 1; x = (0, 2) con consulta (−2, 0); pesos (0,5; 0,5) y (0,5; 0,25) que no suman 1
    const wrong: [number, Record<string, V>][] = [
      [0, { q: [1, 0] }],
      [0, { q: [4, 2] }],
      [0, { q: [-1, 2] }],
      [1, { q: [1, 0] }],
      [1, { q: [0, 1] }],
      [1, { q: [2, 1] }],
      [2, { k: [1, 0] }],
      [2, { k: [2, 0] }],
      [2, { k: [1, 1] }],
      [3, { x: [1, 0] }],
      [3, { x: [0, 2] }],
      [3, { x: [-2, 0] }],
      [4, { w: [0.5, 0.5] }],
      [4, { w: [1, 0] }],
      [4, { w: [0.75, 0] }],
    ];
    for (const [k, vectors] of wrong) {
      const q = manip(k);
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
    // contract: cada error se explica con su valor recalculado: (1, 0) puntúa 2 y −1; K·(1, 0) = (2, 0); k = (1, 1) puntúa 2 con q = (2, 0)
    expect([dot([1, 0], [2, 1]), dot([1, 0], [-1, 2])]).toEqual([2, -1]);
    expect(img([2, 0], [1, 1], [1, 0])).toEqual([2, 0]);
    expect(dot([2, 0], [1, 1])).toBe(2);
  });
});

describe('ex01 de atencion: Calcular', () => {
  it('tipos y respuestas', () => {
    // contract: encargo de la Órbita 3 de matrices (atencion): 2; softmax (2, 0, 0) ≈ (0,79; 0,11; 0,11) con tol 0,01; salida (3, 2); 16; opción 2 (para que no crezcan con las componentes)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [2, 0],
      [[0.79, 0.11, 0.11], 0.01],
      [[3, 2], 0],
      [16, 0],
      2,
    ]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'numero',
      'vector',
      'vector',
      'numero',
      'opcion',
    ]);
  });

  it('las respuestas se recalculan', () => {
    // contract: ex01.1: q·k = 2 + 2 + 0 + 0 = 4 con q = (1, 2, 0, 1) y k = (2, 1, 1, 0), entre √4 = 2
    const q = [1, 2, 0, 1];
    const k = [2, 1, 1, 0];
    const s = q.reduce((t, a, n) => t + a * k[n]!, 0);
    expect(s / Math.sqrt(q.length)).toBe(2);
    // contract: ex01.2: softmax de (2, 0, 0): e² / (e² + 2) ≈ 0,787 y 1 / (e² + 2) ≈ 0,107, que suman 1
    const e = [2, 0, 0].map(Math.exp);
    const tot = e.reduce((a, b) => a + b, 0);
    const w = e.map((x) => x / tot);
    expect(w[0]).toBeCloseTo(0.787, 3);
    expect(w[1]).toBeCloseTo(0.107, 3);
    expect(w[0]! + w[1]! + w[2]!).toBeCloseTo(1, 12);
    // contract: ex01.3: 0,5·(4, 0) + 0,25·(0, 4) + 0,25·(4, 4) = (3, 2)
    const vs: V[] = [
      [4, 0],
      [0, 4],
      [4, 4],
    ];
    const ps = [0.5, 0.25, 0.25];
    expect([0, 1].map((c) => vs.reduce((t, v, n) => t + ps[n]! * v[c]!, 0))).toEqual([3, 2]);
    // contract: ex01.4: n² puntuaciones: (4000² / 1000²) = 16
    expect(4000 ** 2 / 1000 ** 2).toBe(16);
  });

  it('las respuestas se califican como correctas', () => {
    // contract: la respuesta declarada de cada pregunta de Calcular se da por buena, y una respuesta ajena no
    const [a, b, c, d, f] = ex01!.questions as Graded[] as [Graded, Graded, Graded, Graded, Graded];
    expect(grade(a, { type: 'numero', value: 2 })).toBe(true);
    expect(grade(a, { type: 'numero', value: 4 })).toBe(false);
    expect(grade(b, { type: 'vector', value: [0.787, 0.107, 0.107] })).toBe(true);
    expect(grade(b, { type: 'vector', value: [1 / 3, 1 / 3, 1 / 3] })).toBe(false);
    expect(grade(c, { type: 'vector', value: [3, 2] })).toBe(true);
    expect(grade(c, { type: 'vector', value: [8, 8] })).toBe(false);
    expect(grade(d, { type: 'numero', value: 16 })).toBe(true);
    expect(grade(d, { type: 'numero', value: 4 })).toBe(false);
    expect(grade(f, { type: 'opcion', index: 2 })).toBe(true);
    expect(grade(f, { type: 'opcion', index: 0 })).toBe(false);
  });

  it('ex01.5: la opción correcta es la del tamaño de las puntuaciones', () => {
    const q = ex01!.questions[4]!;
    // contract: encargo de la Órbita 3 de matrices (atencion): la correcta dice que las puntuaciones no crezcan con el número de componentes y el softmax no ponga casi todo el peso en una clave
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      'Para que las puntuaciones no crezcan con el número de componentes y el softmax no ponga casi todo el peso en una sola clave',
    );
    expect(q.type === 'opcion' ? q.options.length : 0).toBe(4);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const softmaxRow = (r: number[]): number[] => {
      const m = Math.max(...r);
      const e = r.map((x) => Math.exp(x - m));
      const t = e.reduce((a, b) => a + b, 0);
      return e.map((x) => x / t);
    };
    const mul = (a: number[][], b: number[][]): number[][] =>
      a.map((row) => b[0]!.map((_, j) => row.reduce((t, x, k) => t + x * b[k]![j]!, 0)));
    const T = (a: number[][]): number[][] => a[0]!.map((_, j) => a.map((row) => row[j]!));
    // contract: ex02.1: Q y K de 6 filas y 3 columnas (los de la pregunta); la consulta 0 con la clave 0 da 1/√3 = 0,58 y con la clave 2 da 4/√3 = 2,31
    const Q1 = [
      [1, 0, 2],
      [2, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [2, 0, 1],
      [0, 2, 1],
    ];
    const K1 = [
      [1, 1, 0],
      [0, 2, 1],
      [2, 0, 1],
      [1, 0, 1],
      [0, 1, 2],
      [1, 2, 0],
    ];
    const S1 = mul(Q1, T(K1)).map((r) => r.map((x) => x / Math.sqrt(3)));
    expect(S1[0]![0]).toBeCloseTo(0.58, 2);
    expect(S1[0]![2]).toBeCloseTo(2.31, 2);
    // contract: ex02.3: pesos de 4 palabras y V de 4 filas y 2 columnas; la primera palabra da (2,5; 1,5), las columnas suman 0,9; 1,2; 0,8; 1,1 y el mayor de cada fila está en 0, 1, 3, 3
    const P = [
      [0.5, 0.25, 0.25, 0],
      [0.1, 0.6, 0.1, 0.2],
      [0, 0.25, 0.25, 0.5],
      [0.3, 0.1, 0.2, 0.4],
    ];
    const V3 = [
      [4, 0],
      [0, 4],
      [2, 2],
      [1, 3],
    ];
    const out = mul(P, V3);
    expect(out[0]![0]).toBeCloseTo(2.5, 12);
    expect(out[0]![1]).toBeCloseTo(1.5, 12);
    [0.9, 1.2, 0.8, 1.1].forEach((c, j) =>
      expect(P.reduce((t, r) => t + r[j]!, 0)).toBeCloseTo(c, 12),
    );
    expect(P.map((r) => r.indexOf(Math.max(...r)))).toEqual([0, 1, 3, 3]);
    // contract: ex02.5: 5 palabras con máscara causal: la primera fila de pesos es (1, 0, 0, 0, 0), la última (0,08; 0,26; 0,15; 0,05; 0,46) y su salida (0,84; 0,82)
    const Q5 = [
      [1, 0, 1],
      [0, 2, 1],
      [1, 1, 0],
      [2, 0, 0],
      [0, 1, 2],
    ];
    const K5 = [
      [1, 1, 0],
      [0, 1, 1],
      [2, 0, 1],
      [1, 0, 0],
      [0, 2, 1],
    ];
    const V5 = [
      [1, 0],
      [0, 1],
      [2, 0],
      [0, 2],
      [1, 1],
    ];
    const S5 = mul(Q5, T(K5)).map((r, i) =>
      r.map((x, j) => (j > i ? -Infinity : x / Math.sqrt(3))),
    );
    const W5 = S5.map(softmaxRow);
    expect(W5[0]).toEqual([1, 0, 0, 0, 0]);
    [0.08, 0.26, 0.15, 0.05, 0.46].forEach((w, j) => expect(W5[4]![j]).toBeCloseTo(w, 2));
    const o5 = mul(W5, V5);
    expect(o5[4]![0]).toBeCloseTo(0.84, 2);
    expect(o5[4]![1]).toBeCloseTo(0.82, 2);
  });
});

describe('hojas de atencion', () => {
  it('líneas erróneas', () => {
    // contract: encargo de la Órbita 3 de matrices (atencion): hoja 1 con el softmax normalizado por columnas (línea 3, índice 2); hoja 2 con la escala por la raíz del número de palabras (línea 2, índice 1); hoja 3 sin error
    expect(atencion.sheets.map(answerOf)).toEqual([2, 1, null]);
  });

  it('formatos: código y texto, y una sola hoja sin error', () => {
    // contract: encargo de la Órbita 3 de matrices: hojas que mezclan `codigo` y `texto`, con exactamente una sin error
    expect(atencion.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
    expect(
      atencion.sheets.filter((s) => s.type === 'revision' && s.faultyLine === null),
    ).toHaveLength(1);
  });

  it('la hoja 3 es coherente: las filas suman 1 y la primera columna, 1,1', () => {
    // contract: hoja 3: filas (0,7; 0,2; 0,1), (0,1; 0,8; 0,1), (0,3; 0,3; 0,4) y primera columna 0,7 + 0,1 + 0,3
    const rows = [
      [0.7, 0.2, 0.1],
      [0.1, 0.8, 0.1],
      [0.3, 0.3, 0.4],
    ];
    for (const r of rows) expect(r.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(rows.reduce((t, r) => t + r[0]!, 0)).toBeCloseTo(1.1, 12);
  });
});

describe('banco examen-3 de atencion', () => {
  it('las entradas son válidas', () => {
    for (const e of examen3Atencion) {
      // contract: encargo de la Órbita 3 de matrices: cada entrada fija del banco cumple bankEntrySchema
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
  });

  it('tres entradas fijas, del proyecto y con ids únicos', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): una opcion, un numero y un codigo, project atencion, ids examen-3.<tema>
    expect(examen3Atencion.map((e) => [e.project, e.question.id, e.question.type])).toEqual([
      ['atencion', 'examen-3.mascara-causal', 'opcion'],
      ['atencion', 'examen-3.pesos-no-nulos', 'numero'],
      ['atencion', 'examen-3.palabra-mas-dispersa', 'codigo'],
    ]);
  });

  it('respuestas del banco', () => {
    const [op, nu] = bankQuestions.slice(0, 2) as [Graded, Graded];
    // contract: máscara causal: peso 0 sobre las posteriores y la fila sigue sumando 1 (opción 1)
    expect(answerOf(op)).toBe(1);
    // contract: 6 palabras con máscara causal: 1 + 2 + 3 + 4 + 5 + 6 = 21 entradas posibles de 36
    expect(answerOf(nu)).toEqual([21, 0]);
    expect([1, 2, 3, 4, 5, 6].reduce((a, b) => a + b, 0)).toBe(21);
    expect(grade(op, { type: 'opcion', index: 1 })).toBe(true);
    expect(grade(nu, { type: 'numero', value: 21 })).toBe(true);
    expect(grade(nu, { type: 'numero', value: 15 })).toBe(false);
  });

  it('palabra-mas-dispersa: los pesos y la posición se recalculan', () => {
    // contract: Q = (1, 0), (0, 2), (1, 1) y K = (1, 0), (0, 1), (2, 0), (1, 2): pesos mayores 0,45; 0,73 y 0,51 (con raíz de 2), el menor en la palabra 0
    const Q = [
      [1, 0],
      [0, 2],
      [1, 1],
    ];
    const K = [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 2],
    ];
    const maxes = Q.map((q) => {
      const s = K.map((k) => (q[0]! * k[0]! + q[1]! * k[1]!) / Math.sqrt(2));
      const m = Math.max(...s);
      const e = s.map((x) => Math.exp(x - m));
      return Math.max(...e) / e.reduce((a, b) => a + b, 0);
    });
    [0.45, 0.73, 0.51].forEach((w, i) => expect(maxes[i]).toBeCloseTo(w, 2));
    expect(maxes.indexOf(Math.min(...maxes))).toBe(0);
  });
});

describe('atencion: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(atencion), ...bankQuestions].filter(
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

  it('cada pregunta de código tiene mensajes que revisar', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `atencion.ex02.${n}`),
      'examen-3.palabra-mas-dispersa',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
