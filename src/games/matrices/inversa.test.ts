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
import { inversa } from './inversa';
import { examen1Inversa } from './examen-1-inversa';

const bankQuestions = examen1Inversa
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto inversa', projectQuestions(inversa));
defineProseTests('banco examen-1 inversa', bankQuestions);

type M = [[number, number], [number, number]];
type V = [number, number];
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
const det = (a: M): number => a[0][0] * a[1][1] - a[0][1] * a[1][0];
/** Inversa de 2×2 con la fórmula (1/det)·[[d, −b], [−c, a]]. */
const inv = (a: M): M => {
  const d = det(a);
  return [
    [a[1][1] / d + 0, -a[0][1] / d + 0],
    [-a[1][0] / d + 0, a[0][0] / d + 0],
  ];
};
const apply = (a: M, v: V): V => [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
const flat = (m: M): number[] => [m[0][0] + 0, m[0][1] + 0, m[1][0] + 0, m[1][1] + 0];
/** Columnas de una matriz como posiciones de î y ĵ. */
const cols = (m: M): { i: V; j: V } => ({ i: [m[0][0], m[1][0]], j: [m[0][1], m[1][1]] });

describe('proyecto inversa', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1 de matrices: checkProject(inversa) devuelve la lista vacía
    expect(checkProject(inversa)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1 de matrices: id inversa, nombre «Inversa», subtítulo «Deshacer la transformación»
    expect([inversa.id, inversa.name, inversa.sub]).toEqual([
      'inversa',
      'Inversa',
      'Deshacer la transformación',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(inversa.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(inversa.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(inversa.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón inversa.exNN.k e inversa.hoja.k', () => {
    // contract: encargo de la Órbita 1 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(inversa).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `inversa.ex0${e}.${k}`)),
      'inversa.hoja.1',
      'inversa.hoja.2',
      'inversa.hoja.3',
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

describe('valores de la tabla del proyecto inversa', () => {
  const [ex00, ex01, ex02] = inversa.exercises;

  // Matrices de ex00.1 a ex00.3 (columnas fijas del plano), sus destinos y las entradas buscadas.
  const A1: M = [
    [3, 0],
    [0, 2],
  ];
  const A2: M = [
    [1, -1],
    [0, 1],
  ];
  const A3: M = [
    [1, 1],
    [-1, 1],
  ];
  const targets: [M, V, V][] = [
    [A1, [3, -4], [1, -2]],
    [A2, [3, -1], [2, -1]],
    [A3, [1, 2], [-0.5, 1.5]],
  ];

  it('ex00.1 a ex00.3: la meta es A·v = b sobre las columnas fijas de A', () => {
    // contract: encargo de la Órbita 1 de matrices: A fija (î y ĵ no movibles) y v movible; metas img_x e img_y en b = (3, −4), (3, −1) y (1, 2)
    expect(ex00!.questions.slice(0, 3).map(goalsOf)).toEqual(
      targets.map(([, b]) => [`img_x(i,j,v)=${b[0]}±0.01`, `img_y(i,j,v)=${b[1]}±0.01`]),
    );
  });

  it('ex00.1 a ex00.3: las columnas del plano son las de la matriz del enunciado', () => {
    ex00!.questions.slice(0, 3).forEach((q, k) => {
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      const { i, j } = cols(targets[k]![0]);
      // contract: enunciado de ex00.1–3: A = (3, 0; 0, 2), (1, −1; 0, 1) y (1, 1; −1, 1), con columnas î y ĵ fijas
      expect(
        q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        q.id,
      ).toEqual([`i=(${i[0]}, ${i[1]}) false`, `j=(${j[0]}, ${j[1]}) false`, 'v=(1, 1) true']);
      // contract: encargo de la Órbita 1 de matrices: la flecha discontinua A·v se dibuja con apply:['v'] y la lectura de la matriz está activa
      expect(q.plane.transform).toEqual({ columns: ['i', 'j'], apply: ['v'] });
      expect(q.plane.readouts, q.id).toEqual(['matrix', 'components']);
    });
  });

  it('ex00.1 a ex00.3: A·v da b con la entrada de la solución, que se recalcula con la inversa', () => {
    targets.forEach(([a, b, v], k) => {
      // contract: solution de ex00.1–3: v = A⁻¹b = (1, −2), (2, −1) y (−0,5; 1,5), y A·v = b
      expect(apply(inv(a), b), `A⁻¹b ${k}`).toEqual(v);
      expect(apply(a, v), `A·v ${k}`).toEqual(b);
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución cumple las metas del plano (con î y ĵ como columnas de A)
      const { i, j } = cols(a);
      expect(grade(q, { type: 'manipular', vectors: { i, j, v } }), q.id).toBe(true);
    });
  });

  it('ex00.1 a ex00.3: la entrada inicial, la identidad y la inversa mal aplicada no cumplen', () => {
    targets.forEach(([a, b], k) => {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      const { i, j } = cols(a);
      // contract: error didáctico: dejar v donde está, o poner v = b (olvidar que A mueve el vector)
      expect(grade(q, { type: 'manipular', vectors: { i, j, v: [1, 1] } }), q.id).toBe(false);
      expect(grade(q, { type: 'manipular', vectors: { i, j, v: b } }), q.id).toBe(false);
    });
  });

  it('ex00.3: la solución tiene medios, y la rejilla es de 0,5', () => {
    const q = ex00!.questions[2]!;
    // contract: encargo de la Órbita 1 de matrices: det A = 2 y la solución (−0,5; 1,5) cae en la rejilla de 0,5
    expect(det(A3)).toBe(2);
    expect(q.type === 'manipular' ? [q.plane.snap, q.plane.range] : []).toEqual([0.5, 4]);
  });

  it('ex00.4 y ex00.5: î y ĵ son las columnas de la inversa de escalar por 2 y del cuarto de vuelta', () => {
    const scale: M = [
      [2, 0],
      [0, 2],
    ];
    const quarter: M = [
      [0, -1],
      [1, 0],
    ];
    const cols4 = (m: M): string[] => {
      const c = cols(m);
      return [
        `x(i)=${c.i[0]}±0.01`,
        `y(i)=${c.i[1]}±0.01`,
        `x(j)=${c.j[0]}±0.01`,
        `y(j)=${c.j[1]}±0.01`,
      ];
    };
    // contract: encargo de la Órbita 1 de matrices: A⁻¹ de escalar por 2 es (0,5; 0 / 0; 0,5) y R⁻¹ del cuarto de vuelta es (0, 1; −1, 0)
    expect([ex00!.questions[3], ex00!.questions[4]].map((q) => goalsOf(q!))).toEqual([
      cols4(inv(scale)),
      cols4(inv(quarter)),
    ]);
    expect(flat(inv(quarter))).toEqual([0, 1, -1, 0]);
    // contract: la inversa deshace: A⁻¹A = I en los dos casos
    expect(flat(mul(inv(scale), scale))).toEqual([1, 0, 0, 1]);
    expect(flat(mul(inv(quarter), quarter))).toEqual([1, 0, 0, 1]);
  });

  it('ex00.4 y ex00.5: î y ĵ móviles desde la identidad; rejilla de 0,5 en la primera y de 1 en la segunda', () => {
    const planes = [ex00!.questions[3], ex00!.questions[4]].map((q) => {
      if (q?.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      return [
        q.plane.range,
        q.plane.snap,
        q.plane.readouts,
        q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        q.plane.transform?.columns,
      ];
    });
    const base = ['i=(1, 0) true', 'j=(0, 1) true'];
    // contract: encargo de la Órbita 1 de matrices: dos vectores móviles desde la identidad, lectura de la matriz, rango 3
    expect(planes).toEqual([
      [3, 0.5, ['matrix'], base, ['i', 'j']],
      [3, 1, ['matrix'], base, ['i', 'j']],
    ]);
  });

  it('ex00.4 y ex00.5: las soluciones cumplen las metas y la matriz original o su opuesta no', () => {
    const [q4, q5] = [ex00!.questions[3]!, ex00!.questions[4]!];
    if (q4.type !== 'manipular' || q5.type !== 'manipular') throw new Error('manipular');
    // contract: solution de ex00.4 y ex00.5: î y ĵ en las columnas de A⁻¹
    expect(grade(q4, { type: 'manipular', vectors: { i: [0.5, 0], j: [0, 0.5] } })).toBe(true);
    expect(grade(q5, { type: 'manipular', vectors: { i: [0, -1], j: [1, 0] } })).toBe(true);
    // contract: error didáctico: dejar la propia matriz A (no la inversa) o la identidad
    expect(grade(q4, { type: 'manipular', vectors: { i: [2, 0], j: [0, 2] } })).toBe(false);
    expect(grade(q5, { type: 'manipular', vectors: { i: [0, 1], j: [-1, 0] } })).toBe(false);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: inversa de diag(2, 4) = (0,5; 0 / 0; 0,25); de (3, 2; 1, 1) = (1, −2; −1, 3); x = (3, −2); opción 2 (singular); (AB)⁻¹ = (2, 2; 0, 1)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[0.5, 0, 0, 0.25], 0.01],
      [[1, -2, -1, 3], 0],
      [[3, -2], 0],
      2,
      [[2, 2, 0, 1], 0],
    ]);
    const shapes = ex01!.questions.map((q) => (q.type === 'vector' ? q.shape : 'otro'));
    // contract: encargo de la Órbita 1 de matrices: una matriz se escribe en cuatro casillas (shape 2×2), el vector solución sin forma
    expect(shapes).toEqual([[2, 2], [2, 2], undefined, 'otro', [2, 2]]);
  });

  it('ex01: las respuestas se recalculan con la fórmula y por multiplicación', () => {
    const D: M = [
      [2, 0],
      [0, 4],
    ];
    // contract: ex01.1: la inversa de una diagonal es la de cada número de la diagonal; D⁻¹D = I
    expect(flat(inv(D))).toEqual([0.5, 0, 0, 0.25]);
    expect(flat(mul(inv(D), D))).toEqual([1, 0, 0, 1]);
    const A2: M = [
      [3, 2],
      [1, 1],
    ];
    // contract: ex01.2: det = 1 y la inversa por la fórmula es (1, −2; −1, 3); A A⁻¹ = I
    expect(det(A2)).toBe(1);
    expect(flat(inv(A2))).toEqual([1, -2, -1, 3]);
    expect(flat(mul(A2, inv(A2)))).toEqual([1, 0, 0, 1]);
    const A3: M = [
      [2, 1],
      [5, 3],
    ];
    // contract: ex01.3: A⁻¹ = (3, −1; −5, 2), x = A⁻¹b = (3, −2) y A x = b = (4, 9)
    expect(flat(inv(A3))).toEqual([3, -1, -5, 2]);
    expect(apply(inv(A3), [4, 9])).toEqual([3, -2]);
    expect(apply(A3, [3, -2])).toEqual([4, 9]);
    // contract: ex01.5: con A⁻¹ = (1, 1; 0, 1) y B⁻¹ = (2, 0; 0, 1), (AB)⁻¹ = B⁻¹A⁻¹ = (2, 2; 0, 1) y A⁻¹B⁻¹ = (2, 1; 0, 1)
    const Ai: M = [
      [1, 1],
      [0, 1],
    ];
    const Bi: M = [
      [2, 0],
      [0, 1],
    ];
    expect(flat(mul(Bi, Ai))).toEqual([2, 2, 0, 1]);
    expect(flat(mul(Ai, Bi))).toEqual([2, 1, 0, 1]);
    // contract: (AB)⁻¹ = B⁻¹A⁻¹: coincide con la inversa de AB calculada con la fórmula
    const A = inv(Ai);
    const B = inv(Bi);
    expect(flat(inv(mul(A, B)))).toEqual([2, 2, 0, 1]);
  });

  it('ex01.4: solo la tercera matriz tiene determinante 0, y es la correcta', () => {
    const q = ex01!.questions[3]!;
    const mats: M[] = [
      [
        [1, 2],
        [3, 4],
      ],
      [
        [0, 1],
        [1, 0],
      ],
      [
        [2, 4],
        [1, 2],
      ],
      [
        [2, 1],
        [1, 1],
      ],
    ];
    // contract: solution de ex01.4: determinantes −2, −1, 0 y 1; la opción 2 es la singular
    expect(mats.map(det)).toEqual([-2, -1, 0, 1]);
    expect(q.type === 'opcion' ? q.options : []).toEqual([
      '$\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$',
      '$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$',
      '$\\begin{pmatrix}2&4\\\\1&2\\end{pmatrix}$',
      '$\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const A1c: M = [
      [4, 3],
      [1, 1],
    ];
    // contract: ex02.1: A⁻¹ = (1, −3; −1, 4) con det = 1, y A A⁻¹ = I
    expect(flat(inv(A1c))).toEqual([1, -3, -1, 4]);
    expect(flat(mul(A1c, inv(A1c)))).toEqual([1, 0, 0, 1]);
    const A2c: M = [
      [2, 1],
      [1, 3],
    ];
    // contract: ex02.2: det = 5 y la solución de A x = (5, 10) es (1, 3)
    expect(det(A2c)).toBe(5);
    expect(apply(A2c, [1, 3])).toEqual([5, 10]);
    const A3c: M = [
      [1, 2],
      [3, 7],
    ];
    // contract: ex02.3: det = 1 y A⁻¹ = (7, −2; −3, 1); (2, 4; 1, 2) es singular
    expect(det(A3c)).toBe(1);
    expect(flat(inv(A3c))).toEqual([7, -2, -3, 1]);
    expect(
      det([
        [2, 4],
        [1, 2],
      ]),
    ).toBe(0);
    const L1: M = [
      [1, 2],
      [0, 1],
    ];
    const L2: M = [
      [1, 0],
      [1, 1],
    ];
    // contract: ex02.4: y = B A x con x = (2, 1) da (4, 5); deshaciendo en orden A⁻¹B⁻¹y se recupera (2, 1) y B⁻¹A⁻¹y da (−6, 11)
    expect(apply(L2, apply(L1, [2, 1]))).toEqual([4, 5]);
    expect(apply(inv(L1), apply(inv(L2), [4, 5]))).toEqual([2, 1]);
    expect(apply(inv(L2), apply(inv(L1), [4, 5]))).toEqual([-6, 11]);
    // contract: ex02.5: W = (2, 0, 1; 1, 1, 0; 0, 1, 1), det = 3, x = (1, 2, 3), W x = (5, 3, 5) y W x + b = (6, 2, 7) con b = (1, −1, 2)
    const W = [
      [2, 0, 1],
      [1, 1, 0],
      [0, 1, 1],
    ];
    const x = [1, 2, 3];
    const b = [1, -1, 2];
    const Wx = W.map((row) => row.reduce((s, a, k) => s + a * x[k]!, 0));
    expect(Wx).toEqual([5, 3, 5]);
    expect(Wx.map((v, k) => v + b[k]!)).toEqual([6, 2, 7]);
    const d3 =
      W[0]![0]! * (W[1]![1]! * W[2]![2]! - W[1]![2]! * W[2]![1]!) -
      W[0]![1]! * (W[1]![0]! * W[2]![2]! - W[1]![2]! * W[2]![0]!) +
      W[0]![2]! * (W[1]![0]! * W[2]![1]! - W[1]![1]! * W[2]![0]!);
    expect(d3).toBe(3);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1 de matrices: fórmula sin intercambiar a y d (línea 3), (AB)⁻¹ = A⁻¹B⁻¹ (línea 3) y una correcta (null); al menos una de código
    expect(inversa.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(inversa.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'codigo',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: la fórmula con la diagonal sin intercambiar, el producto de inversas en el orden de A y B, y una hoja correcta
    const faulty = inversa.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Ainv = np.array([[A[0, 0], -A[0, 1]], [-A[1, 0], A[1, 1]]]) / det',
      'Luego (AB)⁻¹ = A⁻¹B⁻¹, con las inversas en el mismo orden que A y B',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of inversa.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    const A: M = [
      [3, 1],
      [5, 2],
    ];
    // contract: hoja 1: det = 3·2 − 1·5 = 1 y la inversa es (2, −1; −5, 3); la línea dada, sin intercambiar a y d, da (3, −1; −5, 2), que no es la inversa
    expect(det(A)).toBe(1);
    expect(flat(inv(A))).toEqual([2, -1, -5, 3]);
    expect(
      flat(
        mul(A, [
          [3, -1],
          [-5, 2],
        ]),
      ),
    ).not.toEqual([1, 0, 0, 1]);
    const Ak: M = [
      [2, 0],
      [0, 3],
    ];
    const Bk: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: hoja 2: (AB)⁻¹ = B⁻¹A⁻¹ y no A⁻¹B⁻¹ (comprobado con dos matrices cuyos productos no conmutan)
    expect(flat(inv(mul(Ak, Bk)))).toEqual(flat(mul(inv(Bk), inv(Ak))));
    expect(flat(inv(mul(Ak, Bk)))).not.toEqual(flat(mul(inv(Ak), inv(Bk))));
    // contract: hoja 3: W = (2, 1; 1, 3), b = (1, −1), y = (6, 9); y − b = (5, 10) y W⁻¹(y − b) = (1, 3); sin quitar el sesgo saldría otra entrada
    const W: M = [
      [2, 1],
      [1, 3],
    ];
    expect(apply(inv(W), [5, 10])).toEqual([1, 3]);
    expect(apply(W, [1, 3]).map((v, k) => v + [1, -1][k]!)).toEqual([6, 9]);
    expect(apply(inv(W), [6, 9])).not.toEqual([1, 3]);
  });
});

describe('banco de examen 1 del proyecto inversa', () => {
  it('tiene tres entradas fijas del proyecto inversa, con ids examen-1.*', () => {
    // contract: encargo de la Órbita 1 de matrices: 3 entradas `{ project: 'inversa', question }` con ids `examen-1.<tema>`, sin usar `examen-1.resolver-sistema`
    expect(examen1Inversa.map((e) => e.project)).toEqual(['inversa', 'inversa', 'inversa']);
    expect(examen1Inversa.map((e) => e.question.id)).toEqual([
      'examen-1.formula-inversa',
      'examen-1.es-invertible',
      'examen-1.sistema-en-codigo',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Inversa) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 1 de matrices: tres fijas, un vector de 2×2, una opción y un código; ids únicos en el juego
    expect(examen1Inversa.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen1Inversa.map((e) => e.question.type)).toEqual(['vector', 'opcion', 'codigo']);
    const projectIds = new Set(projectQuestions(inversa).map((q) => q.id));
    expect(examen1Inversa.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('formula-inversa: la inversa de (1, 2; 1, 1) con det −1 es (−1, 2; 1, −1)', () => {
    const A: M = [
      [1, 2],
      [1, 1],
    ];
    const q = examen1Inversa[0]!.question;
    // contract: solution de examen-1.formula-inversa: det = −1 y A⁻¹ = (−1, 2; 1, −1); A A⁻¹ = I
    expect(det(A)).toBe(-1);
    expect(flat(inv(A))).toEqual([-1, 2, 1, -1]);
    expect(flat(mul(A, inv(A)))).toEqual([1, 0, 0, 1]);
    expect(q.type === 'vector' ? [q.answer, q.shape, q.tol] : []).toEqual([
      [-1, 2, 1, -1],
      [2, 2],
      0,
    ]);
  });

  it('es-invertible: (2, 6; 1, 3) tiene det 0 y la opción correcta lo dice', () => {
    const q = examen1Inversa[1]!.question;
    // contract: solution de examen-1.es-invertible: det = 2·3 − 6·1 = 0 y la segunda columna es el triple de la primera; la opción 1 dice que no tiene inversa
    expect(
      det([
        [2, 6],
        [1, 3],
      ]),
    ).toBe(0);
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toMatch(
      /^No, porque su determinante es/,
    );
    expect(q.type === 'opcion' ? q.correct : -1).toBe(1);
  });

  it('sistema-en-codigo: A = (3, 1; 1, 2) tiene det 5 y la solución es (1, 2)', () => {
    const A: M = [
      [3, 1],
      [1, 2],
    ];
    // contract: solution de examen-1.sistema-en-codigo: det = 5, x = A⁻¹(5, 5) = (1, 2) y A x = (5, 5)
    expect(det(A)).toBe(5);
    expect(apply(A, [1, 2])).toEqual([5, 5]);
  });
});

describe('proyecto inversa: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(inversa), ...bankQuestions].filter(
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
    // contract: encargo de la Órbita 1 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `inversa.ex02.${n}`),
      'examen-1.sistema-en-codigo',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
