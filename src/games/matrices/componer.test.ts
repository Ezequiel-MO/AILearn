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
import { componer } from './componer';
import { examen0Componer } from './examen-0-componer';

const bankQuestions = examen0Componer
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto componer', projectQuestions(componer));
defineProseTests('banco examen-0 componer', bankQuestions);

type M = [[number, number], [number, number]];
/** Producto de dos matrices 2×2 (el que el proyecto enseña a leer de derecha a izquierda). */
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
const R: M = [
  [0, -1],
  [1, 0],
]; // giro de un cuarto de vuelta antihorario
const S: M = [
  [2, 0],
  [0, 1],
]; // estiramiento ×2 en horizontal
const H: M = [
  [1, 1],
  [0, 1],
]; // inclinación horizontal
const Fx: M = [
  [1, 0],
  [0, -1],
]; // espejo respecto del eje x
const Fy: M = [
  [-1, 0],
  [0, 1],
]; // espejo respecto del eje y
const flat = (m: M): number[] => [m[0][0] + 0, m[0][1] + 0, m[1][0] + 0, m[1][1] + 0];

describe('proyecto componer', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 0 de matrices: checkProject(componer) devuelve la lista vacía
    expect(checkProject(componer)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 0 de matrices: id componer, nombre «Componer», subtítulo «Una transformación tras otra»
    expect([componer.id, componer.name, componer.sub]).toEqual([
      'componer',
      'Componer',
      'Una transformación tras otra',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 0 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(componer.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(componer.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(componer.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón componer.exNN.k y componer.hoja.k', () => {
    // contract: encargo de la Órbita 0 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(componer).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `componer.ex0${e}.${k}`)),
      'componer.hoja.1',
      'componer.hoja.2',
      'componer.hoja.3',
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

describe('valores de la tabla del proyecto componer', () => {
  const [ex00, ex01, ex02] = componer.exercises;

  it('ex00: î y ĵ son las columnas de la matriz pedida', () => {
    const cols = (x1: number, y1: number, x2: number, y2: number): string[] => [
      `x(i)=${x1}±0.01`,
      `y(i)=${y1}±0.01`,
      `x(j)=${x2}±0.01`,
      `y(j)=${y2}±0.01`,
    ];
    // contract: encargo de la Órbita 0 de matrices: SR (î→(0,1), ĵ→(−2,0)); RS (î→(0,2), ĵ→(−1,0)); H² (ĵ→(2,1)); dos espejos (media vuelta); R³ (î→(0,−1), ĵ→(1,0))
    expect(ex00!.questions.map(goalsOf)).toEqual([
      cols(0, 1, -2, 0),
      cols(0, 2, -1, 0),
      cols(1, 0, 2, 1),
      cols(-1, 0, 0, -1),
      cols(0, -1, 1, 0),
    ]);
  });

  it('ex00: las columnas de las metas son las del producto, recalculado', () => {
    const m = [mul(S, R), mul(R, S), mul(H, H), mul(Fy, Fx), mul(R, mul(R, R))];
    const goals = ex00!.questions.map((q) =>
      q.type === 'manipular' ? q.goals.map((g) => g.target) : [],
    );
    // contract: encargo de la Órbita 0 de matrices: C = SR, RS, HH, Fy·Fx y RRR; las columnas son las imágenes de î y ĵ, es decir, la entrada (fila, columna) de la matriz
    expect(goals).toEqual(m.map((c) => [c[0][0] + 0, c[1][0] + 0, c[0][1] + 0, c[1][1] + 0]));
    // contract: encargo de la Órbita 0 de matrices: SR y RS son distintas (el orden importa)
    expect(mul(S, R)).not.toEqual(mul(R, S));
  });

  it('ex00: las soluciones cumplen las metas y la identidad o el orden contrario no', () => {
    const solved: [number, [number, number], [number, number]][] = [
      // contract: solution de cada pregunta: SR, RS, H², dos espejos y R³
      [0, [0, 1], [-2, 0]],
      [1, [0, 2], [-1, 0]],
      [2, [1, 0], [2, 1]],
      [3, [-1, 0], [0, -1]],
      [4, [0, -1], [1, 0]],
    ];
    for (const [k, i, j] of solved) {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors: { i, j } }), q.id).toBe(true);
    }
    const wrong: [number, [number, number], [number, number]][] = [
      // contract: el error didáctico de cada pregunta: RS en vez de SR; SR en vez de RS; una sola inclinación; un solo espejo; un solo cuarto de vuelta
      [0, [0, 2], [-1, 0]],
      [1, [0, 1], [-2, 0]],
      [2, [1, 0], [1, 1]],
      [3, [1, 0], [0, -1]],
      [4, [0, 1], [-1, 0]],
    ];
    for (const [k, i, j] of wrong) {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors: { i, j } }), q.id).toBe(false);
    }
  });

  it('ex00: plano con î y ĵ móviles desde la identidad, rango 3, rejilla de 1 y lectura de la matriz', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: encargo de la Órbita 0 de matrices: î y ĵ móviles (columnas de la matriz compuesta), lectura `matrix`, desde la identidad, rango 3, rejilla 1
      expect(
        [
          q.plane.range,
          q.plane.snap,
          q.plane.readouts,
          q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
          q.plane.transform?.columns,
        ],
        q.id,
      ).toEqual([3, 1, ['matrix'], ['i=(1, 0) true', 'j=(0, 1) true'], ['i', 'j']]);
    }
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: AB = (4, −2; 6, 0); opción 1 (no son iguales); tamaño 3×2; opción 3 (AC no está definido); tamaño 3×4
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[4, -2, 6, 0], 0],
      1,
      [[3, 2], 0],
      3,
      [[3, 4], 0],
    ]);
    const [prod, , , , w] = ex01!.questions;
    // contract: encargo de la Órbita 0 de matrices: el producto de dos matrices se escribe en las cuatro casillas, por filas
    expect(prod!.type === 'vector' ? prod!.shape : undefined).toEqual([2, 2]);
    // contract: la forma de W en la capa única es un par (filas, columnas), sin casillas de matriz
    expect(w!.type === 'vector' ? w!.shape : 'otro').toBeUndefined();
  });

  it('ex01: las respuestas se recalculan', () => {
    const A: M = [
      [2, 1],
      [0, 3],
    ];
    const B: M = [
      [1, -1],
      [2, 0],
    ];
    // contract: ex01.1: AB = (4, −2; 6, 0) con A = (2, 1; 0, 3) y B = (1, −1; 2, 0)
    expect(flat(mul(A, B))).toEqual([4, -2, 6, 0]);
    const A2: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: ex01.2: AB = (1, −1; 1, 0) y BA = (0, −1; 1, 1) con A la inclinación y B el cuarto de vuelta
    expect(flat(mul(A2, R))).toEqual([1, -1, 1, 0]);
    expect(flat(mul(R, A2))).toEqual([0, -1, 1, 1]);
    // contract: ex01.3 y ex01.5: (3×5)(5×2) = 3×2 y (3×8)(8×4) = 3×4: las filas del primero y las columnas del segundo
    const size = (a: [number, number], b: [number, number]): [number, number] | null =>
      a[1] === b[0] ? [a[0], b[1]] : null;
    expect(size([3, 5], [5, 2])).toEqual([3, 2]);
    expect(size([3, 8], [8, 4])).toEqual([3, 4]);
    // contract: ex01.4: con A 2×3, B 3×4 y C 4×2, AB, BC y CA están definidos y AC no
    expect([
      size([2, 3], [3, 4]),
      size([3, 4], [4, 2]),
      size([4, 2], [2, 3]),
      size([2, 3], [4, 2]),
    ]).toEqual([[2, 4], [3, 2], [4, 3], null]);
  });

  it('ex01.4: las cuatro opciones son los productos AB, BC, CA y AC', () => {
    const q = ex01!.questions[3]!;
    // contract: solution de ex01.4: la única opción no definida es AC (índice 3)
    expect(q.type === 'opcion' ? q.options : []).toEqual(['$AB$', '$BC$', '$CA$', '$AC$']);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const A: M = [
      [1, 2],
      [0, 1],
    ];
    const B: M = [
      [2, 0],
      [1, 3],
    ];
    // contract: ex02.1: AB = (4, 6; 1, 3) y la multiplicación entrada a entrada daría (2, 0; 0, 3)
    expect(flat(mul(A, B))).toEqual([4, 6, 1, 3]);
    expect([A[0][0] * B[0][0], A[0][1] * B[0][1], A[1][0] * B[1][0], A[1][1] * B[1][1]]).toEqual([
      2, 0, 0, 3,
    ]);
    const A2: M = [
      [1, 2],
      [3, 1],
    ];
    const B2: M = [
      [1, 2],
      [3, 0],
    ];
    // contract: ex02.2: col0 = (7, 6), col1 = (2, 6), C = (7, 2; 6, 6)
    expect(flat(mul(A2, B2))).toEqual([7, 2, 6, 6]);
    // contract: ex02.3: componer([R, S]) = SR = (0, −2; 1, 0), al revés RS = (0, −1; 2, 0)
    expect(flat(mul(S, R))).toEqual([0, -2, 1, 0]);
    expect(flat(mul(R, S))).toEqual([0, -1, 2, 0]);
    const A3: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: ex02.4: AB = (2, 1; 0, 1) y BA = (2, 2; 0, 1) con A la inclinación y B el estiramiento
    expect(flat(mul(A3, S))).toEqual([2, 1, 0, 1]);
    expect(flat(mul(S, A3))).toEqual([2, 2, 0, 1]);
    // contract: ex02.5: W = W2 W1 = (1, 5; 1, 1) y W x = (11, 3) con x = (1, 2), igual que W2 (W1 x)
    const W1 = [
      [1, 2],
      [0, 1],
      [-1, 1],
    ];
    const W2 = [
      [2, 0, 1],
      [1, -1, 0],
    ];
    const x = [1, 2];
    const apply = (m: number[][], v: number[]): number[] =>
      m.map((row) => row.reduce((s, a, k) => s + a * v[k]!, 0));
    const W = [0, 1].map((r) =>
      [0, 1].map(
        (c) =>
          apply(
            W2,
            W1.map((row) => row[c]!),
          )[r]!,
      ),
    );
    expect(W).toEqual([
      [1, 5],
      [1, 1],
    ]);
    expect(apply(W, x)).toEqual([11, 3]);
    expect(apply(W2, apply(W1, x))).toEqual([11, 3]);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 0 de matrices: orden mal escrito en código (línea 3), «dos capas lineales aprenden más» (línea 3) y una correcta (null); al menos una de código
    expect(componer.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(componer.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: `C = R @ S` aplica primero S, y la conclusión de que dos capas lineales aprenden más que una
    const faulty = componer.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'C = R @ S',
      'Luego dos capas lineales seguidas pueden aprender cosas que una sola capa no puede',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of componer.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 1: `C = R @ S` vale (0, −1; 2, 0) y `C = S @ R` vale (0, −2; 1, 0), que es lo que pide el enunciado (primero R, después S)
    expect(flat(mul(R, S))).toEqual([0, -1, 2, 0]);
    expect(flat(mul(S, R))).toEqual([0, -2, 1, 0]);
    // contract: hoja 3: A 2×3 y B 3×4: AB es 2×4; en BA los tamaños interiores serían 4 y 2
    const inner = (a: [number, number], b: [number, number]): boolean => a[1] === b[0];
    expect(inner([2, 3], [3, 4])).toBe(true);
    expect(inner([3, 4], [2, 3])).toBe(false);
  });

  it('el espejo respecto del eje x y el del eje y componen una media vuelta', () => {
    // contract: solution de ex00.4: Fy·Fx = −I, el giro de media vuelta (R·R)
    expect(mul(Fy, Fx)).toEqual(mul(R, R));
  });
});

describe('banco de examen 0 del proyecto componer', () => {
  it('tiene tres entradas fijas del proyecto componer, con ids examen-0.*', () => {
    // contract: encargo de la Órbita 0 de matrices: 3 entradas `{ project: 'componer', question }` con ids `examen-0.<tema>`, distintas de los ids generados
    expect(examen0Componer.map((e) => e.project)).toEqual(['componer', 'componer', 'componer']);
    expect(examen0Componer.map((e) => e.question.id)).toEqual([
      'examen-0.orden-producto',
      'examen-0.espejo-y-giro',
      'examen-0.tres-capas',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen0Componer) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 0 de matrices: tres fijas, una opción, un vector de 2×2 y un código; ids únicos en el juego
    expect(examen0Componer.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen0Componer.map((e) => e.question.type)).toEqual(['opcion', 'vector', 'codigo']);
    const projectIds = new Set(projectQuestions(componer).map((q) => q.id));
    expect(examen0Componer.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [orden, espejo] = examen0Componer.map((e) => e.question);
    // contract: examen-0.orden-producto: E(Gv) = (EG)v, la que actúa primero es la más cercana al vector (índice 1)
    expect(orden!.type === 'opcion' ? orden!.options[orden!.correct] : '').toMatch(
      /^\$EG\\vec\{v\}\$, porque la primera en actuar es la más cercana al vector/,
    );
    // contract: examen-0.espejo-y-giro: RF = (0, 1; 1, 0), el espejo respecto de la diagonal; FR = (0, −1; −1, 0) sería el orden contrario
    expect(espejo!.type === 'vector' ? [espejo!.answer, espejo!.shape, espejo!.tol] : []).toEqual([
      [0, 1, 1, 0],
      [2, 2],
      0,
    ]);
    expect(flat(mul(R, Fx))).toEqual([0, 1, 1, 0]);
    expect(flat(mul(Fx, R))).toEqual([0, -1, -1, 0]);
  });

  it('tres-capas: W3 W2 W1 = (0, 2; 1, 2), y la salida (2, 3) coincide con pasar x por las capas', () => {
    const W1: M = [
      [1, 2],
      [0, 1],
    ];
    const W2: M = [
      [0, 1],
      [1, 0],
    ];
    const W3: M = [
      [2, 0],
      [0, 1],
    ];
    // contract: solution de examen-0.tres-capas: W = W3 W2 W1 = (0, 2; 1, 2); en el orden contrario W1 W2 W3 = (4, 1; 2, 0)
    expect(flat(mul(W3, mul(W2, W1)))).toEqual([0, 2, 1, 2]);
    expect(flat(mul(mul(W1, W2), W3))).toEqual([4, 1, 2, 0]);
    // contract: solution de examen-0.tres-capas: con x = (1, 1), W x = (2, 3) y las tres capas por separado dan lo mismo
    const W = mul(W3, mul(W2, W1));
    expect([W[0][0] + W[0][1], W[1][0] + W[1][1]]).toEqual([2, 3]);
    const step = (m: M, v: number[]): number[] => [
      m[0][0] * v[0]! + m[0][1] * v[1]!,
      m[1][0] * v[0]! + m[1][1] * v[1]!,
    ];
    expect(step(W3, step(W2, step(W1, [1, 1])))).toEqual([2, 3]);
  });
});

describe('proyecto componer: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(componer), ...bankQuestions].filter(
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
    // contract: encargo de la Órbita 0 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `componer.ex02.${n}`),
      'examen-0.tres-capas',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
