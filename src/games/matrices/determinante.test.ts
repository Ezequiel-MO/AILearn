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
import { determinante } from './determinante';
import { examen1Determinante } from './examen-1-determinante';

const bankQuestions = examen1Determinante
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto determinante', projectQuestions(determinante));
defineProseTests('banco examen-1 determinante', bankQuestions);

type M = [[number, number], [number, number]];
/** Determinante ad − bc de una matriz 2×2. */
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
/** Producto de dos matrices 2×2. */
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
/** Matriz de columnas u y v. */
const cols = (u: [number, number], v: [number, number]): M => [
  [u[0], v[0]],
  [u[1], v[1]],
];

describe('proyecto determinante', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1 de matrices: checkProject(determinante) devuelve la lista vacía
    expect(checkProject(determinante)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1 de matrices: id determinante, nombre «Determinante», subtítulo «El área con signo»
    expect([determinante.id, determinante.name, determinante.sub]).toEqual([
      'determinante',
      'Determinante',
      'El área con signo',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(determinante.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(determinante.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(determinante.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón determinante.exNN.k y determinante.hoja.k', () => {
    // contract: encargo de la Órbita 1 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(determinante).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `determinante.ex0${e}.${k}`)),
      'determinante.hoja.1',
      'determinante.hoja.2',
      'determinante.hoja.3',
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

describe('valores de la tabla del proyecto determinante', () => {
  const [ex00, ex01, ex02] = determinante.exercises;

  it('ex00: metas de cada manipular', () => {
    // contract: encargo de la Órbita 1 de matrices: det = 3 con î fijo; ĵ con x = 2 y det = 2; î = (2, 1), x de ĵ = 2 y det = 6; det = −2; x de ĵ = −2 y det = 0
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['det(i,j)=3±0.01'],
      ['x(j)=2±0.01', 'det(i,j)=2±0.01'],
      ['x(i)=2±0.01', 'y(i)=1±0.01', 'x(j)=2±0.01', 'det(i,j)=6±0.01'],
      ['det(i,j)=-2±0.01'],
      ['x(j)=-2±0.01', 'det(i,j)=0±0.01'],
    ]);
  });

  it('ex00: las posiciones de las soluciones cumplen las metas y recalculan el determinante', () => {
    const solved: [number, [number, number], [number, number]][] = [
      // contract: solution de cada pregunta: ĵ con y = 3; ĵ = (2, 2); î = (2, 1) y ĵ = (2, 4); ĵ = (2, 0) o (1, −1); ĵ = (−2, −1)
      [0, [1, 0], [0, 3]],
      [0, [1, 0], [2, 3]],
      [1, [1, 0], [2, 2]],
      [2, [2, 1], [2, 4]],
      [3, [1, 1], [2, 0]],
      [3, [1, 1], [1, -1]],
      [4, [2, 1], [-2, -1]],
    ];
    const wanted = [3, 3, 2, 6, -2, -2, 0];
    solved.forEach(([k, i, j], n) => {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors: { i, j } }), q.id).toBe(true);
      // contract: encargo de la Órbita 1 de matrices: el determinante de la matriz de columnas î y ĵ es el de la meta
      expect(det(cols(i, j)), q.id).toBe(wanted[n]);
    });
    const wrong: [number, [number, number], [number, number]][] = [
      // contract: el error didáctico de cada pregunta: área 2 en vez de 3; área 3 en vez de 2; altura 3 con x ≠ 2; det +2 en vez de −2; ĵ sin la x pedida
      [0, [1, 0], [0, 2]],
      [1, [1, 0], [2, 3]],
      [2, [2, 1], [2, 3]],
      [3, [1, 1], [-2, 0]],
      [4, [2, 1], [0, 0]],
    ];
    for (const [k, i, j] of wrong) {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors: { i, j } }), q.id).toBe(false);
    }
  });

  it('ex00: î fijo salvo en la tercera, ĵ móvil; lecturas elegidas a propósito', () => {
    const shape = ex00!.questions.map((q) => {
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      return [
        q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        q.plane.readouts,
        q.plane.range,
        q.plane.snap,
        q.plane.transform?.columns,
      ];
    });
    // contract: encargo de la Órbita 1 de matrices: det oculto en la primera (se razona como base por altura) y a la vista en el resto; î fijo salvo en la tercera (dos móviles, rango 5, rejilla 1)
    expect(shape).toEqual([
      [['i=(1, 0) false', 'j=(0, 1) true'], ['matrix'], 4, 1, ['i', 'j']],
      [['i=(1, 0) false', 'j=(0, 2) true'], ['matrix', 'det'], 3, 1, ['i', 'j']],
      [['i=(1, 0) true', 'j=(0, 1) true'], ['matrix', 'det'], 5, 1, ['i', 'j']],
      [['i=(1, 1) false', 'j=(0, 1) true'], ['matrix', 'det'], 3, 1, ['i', 'j']],
      [['i=(2, 1) false', 'j=(0, 1) true'], ['matrix', 'det'], 3, 1, ['i', 'j']],
    ]);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: encargo de la Órbita 1 de matrices: det = 11; área 10; det triangular −8; opción 2 (la tercera matriz); det(W₂W₁) = −6
    expect(ex01!.questions.map(answerOf)).toEqual([[11, 0], [10, 0], [-8, 0], 2, [-6, 0]]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'numero',
      'numero',
      'numero',
      'opcion',
      'numero',
    ]);
  });

  it('ex01: las respuestas se recalculan', () => {
    // contract: ex01.1: det (2, −3; 1, 4) = 2·4 − (−3)·1 = 11, y ad + bc daría 5
    expect(
      det([
        [2, -3],
        [1, 4],
      ]),
    ).toBe(11);
    expect(2 * 4 + -3 * 1).toBe(5);
    // contract: ex01.2: el paralelogramo de u = (2, 3) y v = (4, 1) tiene det −10 y área 10
    expect(det(cols([2, 3], [4, 1]))).toBe(-10);
    expect(Math.abs(det(cols([2, 3], [4, 1])))).toBe(10);
    // contract: ex01.3: det (−2, 5; 0, 4) = −8, el producto de la diagonal
    expect(
      det([
        [-2, 5],
        [0, 4],
      ]),
    ).toBe(-8);
    // contract: ex01.4: determinantes de las cuatro matrices 1, 1, −5 y 2; solo la tercera es negativa
    const opts: M[] = [
      [
        [2, 1],
        [1, 1],
      ],
      [
        [0, -1],
        [1, 0],
      ],
      [
        [1, 3],
        [2, 1],
      ],
      [
        [-1, 0],
        [0, -2],
      ],
    ];
    expect(opts.map(det)).toEqual([1, 1, -5, 2]);
    expect(opts.findIndex((m) => det(m) < 0)).toBe(2);
    // contract: ex01.5: det(W₂W₁) = det W₂ · det W₁ = (−3)·2 = −6, comprobado con dos matrices de determinantes 2 y −3
    const W1: M = [
      [2, 0],
      [0, 1],
    ];
    const W2: M = [
      [1, 0],
      [0, -3],
    ];
    expect([det(W1), det(W2), det(mul(W2, W1))]).toEqual([2, -3, -6]);
  });

  it('ex01.4: las cuatro opciones son las matrices del cálculo', () => {
    const q = ex01!.questions[3]!;
    // contract: solution de ex01.4: las opciones son (2, 1; 1, 1), (0, −1; 1, 0), (1, 3; 2, 1) y (−1, 0; 0, −2)
    expect(q.type === 'opcion' ? q.options : []).toEqual([
      '$\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$',
      '$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$',
      '$\\begin{pmatrix}1&3\\\\2&1\\end{pmatrix}$',
      '$\\begin{pmatrix}-1&0\\\\0&-2\\end{pmatrix}$',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: el determinante exacto de (1, 2; 3, 4) es −2
    expect(
      det([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(-2);
    // contract: ex02.2: los lados (1, 3) y (4, 1) desde (1, 1) dan det −11 y área 5,5
    expect(
      det([
        [1, 3],
        [4, 1],
      ]),
    ).toBe(-11);
    expect(
      Math.abs(
        det([
          [1, 3],
          [4, 1],
        ]),
      ) / 2,
    ).toBe(5.5);
    // contract: ex02.3: con a = (0, 0), b = (4, 1), c = (1, 3) el determinante es 11, positivo: c queda a la izquierda
    expect(
      det([
        [4, 1],
        [1, 3],
      ]),
    ).toBe(11);
    // contract: ex02.4: det A = 5, det B = 2, AB = (4, −2; 7, −1) con det 10
    const A: M = [
      [2, 1],
      [1, 3],
    ];
    const B: M = [
      [1, -1],
      [2, 0],
    ];
    expect([det(A), det(B), det(mul(A, B))]).toEqual([5, 2, 10]);
    expect(mul(A, B)).toEqual([
      [4, -2],
      [7, -1],
    ]);
    // contract: ex02.5: determinantes de los pesos 0,5; ~0 (filas proporcionales); 1e-9 aprox.; −1; 0,005
    expect(
      det([
        [1, 0],
        [0, 0.5],
      ]),
    ).toBe(0.5);
    expect(
      Math.abs(
        det([
          [0.3, 0.1],
          [0.9, 0.3],
        ]),
      ),
    ).toBeLessThan(1e-15);
    expect(
      Math.abs(
        det([
          [1, 2],
          [0.5, 1.000000001],
        ]) - 1e-9,
      ),
    ).toBeLessThan(1e-12);
    expect(
      det([
        [0, 1],
        [1, 0],
      ]),
    ).toBe(-1);
    expect(
      det([
        [1, 0],
        [0, 0.005],
      ]),
    ).toBe(0.005);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1 de matrices: código con «== 0» (línea 3), área negativa (línea 3) y una correcta (null); al menos una de código
    expect(determinante.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(determinante.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: comparar un determinante decimal con «== 0», y tomar un determinante negativo como área
    const faulty = determinante.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['aplasta = det_A == 0', 'Luego el área del paralelogramo es −5', null]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of determinante.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 2: det (1, 3; 2, 1) = 1·1 − 3·2 = −5, y el área es 5
    expect(det(cols([1, 2], [3, 1]))).toBe(-5);
    // contract: hoja 3: det(W₂W₁) = 3·(−2) = −6 con det W₁ = 3 y det W₂ = −2
    const W1: M = [
      [3, 0],
      [0, 1],
    ];
    const W2: M = [
      [1, 0],
      [0, -2],
    ];
    expect([det(W1), det(W2), det(mul(W2, W1))]).toEqual([3, -2, -6]);
  });
});

describe('banco de examen 1 del proyecto determinante', () => {
  it('tiene tres entradas fijas del proyecto determinante, con ids examen-1.*', () => {
    // contract: encargo de la Órbita 1 de matrices: 3 entradas `{ project: 'determinante', question }` con ids `examen-1.<tema>`, distintas del id generado examen-1.determinante
    expect(examen1Determinante.map((e) => e.project)).toEqual([
      'determinante',
      'determinante',
      'determinante',
    ]);
    expect(examen1Determinante.map((e) => e.question.id)).toEqual([
      'examen-1.determinante-escala',
      'examen-1.area-imagen',
      'examen-1.capas-volteadas',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Determinante) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 1 de matrices: tres fijas, una opción, un número y un código; ids únicos en el juego
    expect(examen1Determinante.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen1Determinante.map((e) => e.question.type)).toEqual(['opcion', 'numero', 'codigo']);
    const projectIds = new Set(projectQuestions(determinante).map((q) => q.id));
    expect(examen1Determinante.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [escala, area] = examen1Determinante.map((e) => e.question);
    // contract: examen-1.determinante-escala: det(3A) = 3²·4 = 36 (opción 1)
    expect(
      escala!.type === 'opcion' ? [escala!.correct, escala!.options[escala!.correct]] : [],
    ).toEqual([
      1,
      '$36$, porque $3A$ estira por $3$ en las dos direcciones y las áreas se multiplican por $3\\cdot 3$',
    ]);
    expect(
      det([
        [3, 0],
        [0, 3],
      ]) * 4,
    ).toBe(36);
    // contract: examen-1.area-imagen: |det (1, 2; 3, 4)| = 2 y el cuadrado de área 5 pasa a 10
    expect(area!.type === 'numero' ? [area!.answer, area!.tol] : []).toEqual([10, 0]);
    expect(
      Math.abs(
        det([
          [1, 2],
          [3, 4],
        ]),
      ) * 5,
    ).toBe(10);
  });

  it('capas-volteadas: los siete determinantes tienen dos negativos, uno cero y cuatro positivos', () => {
    const capas: M[] = [
      [
        [1, 2],
        [3, 4],
      ],
      [
        [2, 0],
        [0, 3],
      ],
      [
        [0, 1],
        [1, 0],
      ],
      [
        [1, 2],
        [2, 4],
      ],
      [
        [1, -1],
        [1, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [2, 1],
        [0, 1],
      ],
    ];
    // contract: solution de examen-1.capas-volteadas: determinantes −2, 6, −1, 0, 2, 1, 2 y dos negativos
    expect(capas.map(det)).toEqual([-2, 6, -1, 0, 2, 1, 2]);
    expect(capas.filter((m) => det(m) < 0)).toHaveLength(2);
    // contract: error típico «<= 0» cuenta 3 y «> 0» cuenta 4, ambos distintos de la respuesta
    expect(capas.filter((m) => det(m) <= 0)).toHaveLength(3);
    expect(capas.filter((m) => det(m) > 0)).toHaveLength(4);
  });
});

describe('proyecto determinante: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(determinante), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `determinante.ex02.${n}`),
      'examen-1.capas-volteadas',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
