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
import { rango } from './rango';
import { examen1Rango } from './examen-1-rango';

const bankQuestions = examen1Rango
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto rango', projectQuestions(rango));
defineProseTests('banco examen-1 rango', bankQuestions);

type Mat = number[][];
/** Rango por eliminación gaussiana (las matrices del proyecto son enteras y pequeñas). */
const rank = (m: Mat): number => {
  const a = m.map((row) => [...row]);
  let r = 0;
  for (let c = 0; c < (a[0]?.length ?? 0) && r < a.length; c++) {
    const p = a.findIndex((row, i) => i >= r && Math.abs(row[c]!) > 1e-9);
    if (p === -1) continue;
    [a[r], a[p]] = [a[p]!, a[r]!];
    for (let i = r + 1; i < a.length; i++) {
      const f = a[i]![c]! / a[r]![c]!;
      a[i] = a[i]!.map((x, k) => x - f * a[r]![k]!);
    }
    r++;
  }
  return r;
};
const apply = (m: Mat, v: number[]): number[] =>
  m.map((row) => row.reduce((s, a, k) => s + a * v[k]!, 0) + 0);
const cols = (m: Mat): Mat => m[0]!.map((_, c) => m.map((row) => row[c]!));
const without = (m: Mat, k: number): Mat => m.map((row) => row.filter((_, c) => c !== k));

describe('proyecto rango', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1 de matrices: checkProject(rango) devuelve la lista vacía
    expect(checkProject(rango)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1 de matrices: id rango, nombre «Rango», subtítulo «Cuántas direcciones sobreviven»
    expect([rango.id, rango.name, rango.sub]).toEqual([
      'rango',
      'Rango',
      'Cuántas direcciones sobreviven',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(rango.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(rango.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(rango.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón rango.exNN.k y rango.hoja.k', () => {
    // contract: encargo de la Órbita 1 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(rango).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `rango.ex0${e}.${k}`)),
      'rango.hoja.1',
      'rango.hoja.2',
      'rango.hoja.3',
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

describe('valores de la tabla del proyecto rango', () => {
  const [ex00, ex01, ex02] = rango.exercises;
  const manip = (k: number) => {
    const q = ex00!.questions[k]!;
    if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
    return q;
  };

  it('ex00: metas de cada pregunta', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00.1 det=0 con x(ĵ)=−2; ex00.2 A·v=0 con x(v)=2; ex00.3 A·v=(3, −3); ex00.4 î=(−1, −2), x(ĵ)=2 y det=0; ex00.5 las dos columnas en el origen
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['det(i,j)=0±0.01', 'x(j)=-2±0.01'],
      ['img_x(i,j,v)=0±0.01', 'img_y(i,j,v)=0±0.01', 'x(v)=2±0.01'],
      ['img_x(i,j,v)=3±0.01', 'img_y(i,j,v)=-3±0.01'],
      ['x(i)=-1±0.01', 'y(i)=-2±0.01', 'x(j)=2±0.01', 'det(i,j)=0±0.01'],
      ['x(i)=0±0.01', 'y(i)=0±0.01', 'x(j)=0±0.01', 'y(j)=0±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y los errores típicos no', () => {
    const ok = (k: number, vectors: Record<string, [number, number]>): boolean =>
      grade(manip(k), { type: 'manipular', vectors });
    // contract: solution de ex00.1: ĵ = (−2, −1), el opuesto de î = (2, 1)
    expect(ok(0, { j: [-2, -1] })).toBe(true);
    // contract: ex00.1: ĵ con la x pedida pero fuera de la recta de î (det = 2·1 + 2 = 4) no vale
    expect(ok(0, { j: [-2, 1] })).toBe(false);
    // contract: solution de ex00.2: v = (2, 1) está en el núcleo de A = (1, −2; −1, 2)
    expect(ok(1, { v: [2, 1] })).toBe(true);
    // contract: ex00.2: el vector nulo anula A·v pero no cumple x(v)=2; (2, 2) no está en el núcleo
    expect(ok(1, { v: [0, 0] })).toBe(false);
    expect(ok(1, { v: [2, 2] })).toBe(false);
    // contract: solution de ex00.3: (3, 0), (1, −1) y (−1, −2) llegan los tres a (3, −3)
    for (const v of [
      [3, 0],
      [1, -1],
      [-1, -2],
    ] as [number, number][])
      expect(ok(2, { v })).toBe(true);
    // contract: ex00.3: v = (3, −3) da A·v = (9, −9) y no vale
    expect(ok(2, { v: [3, -3] })).toBe(false);
    // contract: solution de ex00.4: î = (−1, −2) y ĵ = (2, 4), los dos sobre la recta de (1, 2)
    expect(ok(3, { i: [-1, -2], j: [2, 4] })).toBe(true);
    // contract: ex00.4: ĵ = (2, 3) no está en la recta (det = −3 + 4 = 1)
    expect(ok(3, { i: [-1, -2], j: [2, 3] })).toBe(false);
    // contract: solution de ex00.5: la matriz nula
    expect(ok(4, { i: [0, 0], j: [0, 0] })).toBe(true);
    // contract: ex00.5: una sola columna en el origen deja rango 1, no 0
    expect(ok(4, { i: [0, 0], j: [0, 1] })).toBe(false);
  });

  it('ex00: los rangos de las soluciones se recalculan', () => {
    // contract: solution de ex00.1, ex00.2/3 y ex00.4: matrices de columnas (2, 1)(−2, −1), (1, −1)(−2, 2) y (−1, −2)(2, 4): rango 1; ex00.5: la nula, rango 0
    expect(
      rank(
        cols([
          [2, 1],
          [-2, -1],
        ]),
      ),
    ).toBe(1);
    expect(
      rank(
        cols([
          [1, -1],
          [-2, 2],
        ]),
      ),
    ).toBe(1);
    expect(
      rank(
        cols([
          [-1, -2],
          [2, 4],
        ]),
      ),
    ).toBe(1);
    expect(
      rank([
        [0, 0],
        [0, 0],
      ]),
    ).toBe(0);
    // contract: ex00.2 y ex00.3: A·(2, 1) = (0, 0) y A·(3, 0) = A·(1, −1) = A·(−1, −2) = (3, −3), con A = (1, −2; −1, 2)
    const A = [
      [1, -2],
      [-1, 2],
    ];
    expect(apply(A, [2, 1])).toEqual([0, 0]);
    expect(apply(A, [3, 0])).toEqual([3, -3]);
    expect(apply(A, [1, -1])).toEqual([3, -3]);
    expect(apply(A, [-1, -2])).toEqual([3, -3]);
    expect(apply(A, [5, 1])).toEqual([3, -3]);
  });

  it('ex00: planos, vectores móviles, lecturas y rango', () => {
    const shape = (k: number): unknown => {
      const q = manip(k);
      return [
        q.plane.range,
        q.plane.snap,
        q.plane.readouts,
        q.plane.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        q.plane.transform,
      ];
    };
    // contract: encargo de la Órbita 1 de matrices: ex00.1 con î fijo en (2, 1) y det visible; ex00.2 y ex00.3 con A fija y v móvil (apply); ex00.4 y ex00.5 con las dos columnas móviles desde la identidad, sin det
    expect(shape(0)).toEqual([
      3,
      1,
      ['matrix', 'det'],
      ['i=(2, 1) false', 'j=(0, 1) true'],
      { columns: ['i', 'j'] },
    ]);
    expect(shape(1)).toEqual([
      3,
      1,
      ['matrix', 'components'],
      ['i=(1, -1) false', 'j=(-2, 2) false', 'v=(1, 2) true'],
      { columns: ['i', 'j'], apply: ['v'] },
    ]);
    expect(shape(2)).toEqual([
      3,
      1,
      ['matrix', 'components'],
      ['i=(1, -1) false', 'j=(-2, 2) false', 'v=(1, 1) true'],
      { columns: ['i', 'j'], apply: ['v'] },
    ]);
    expect(shape(3)).toEqual([
      5,
      1,
      ['matrix'],
      ['i=(1, 0) true', 'j=(0, 1) true'],
      { columns: ['i', 'j'] },
    ]);
    expect(shape(4)).toEqual([
      3,
      1,
      ['matrix'],
      ['i=(1, 0) true', 'j=(0, 1) true'],
      { columns: ['i', 'j'] },
    ]);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: rango 1, rango 2, rango 1, núcleo (2, −1), opción 2 (una recta por el origen)
    expect(ex01!.questions.map(answerOf)).toEqual([[1, 0], [2, 0], [1, 0], [[2, -1], 0], 2]);
  });

  it('ex01: los rangos y el núcleo se recalculan', () => {
    // contract: ex01.1: A = (2, −1; −4, 2) tiene rango 1 y det 0
    expect(
      rank([
        [2, -1],
        [-4, 2],
      ]),
    ).toBe(1);
    expect(2 * 2 - -1 * -4).toBe(0);
    const A2 = [
      [1, 0, 1],
      [2, 1, 3],
      [0, 1, 1],
    ];
    // contract: ex01.2: la tercera columna es la suma de las dos primeras y el rango es 2
    expect(cols(A2)[2]).toEqual(cols(A2)[0]!.map((x, k) => x + cols(A2)[1]![k]!));
    expect(rank(A2)).toBe(2);
    // contract: ex01.3: M = u vᵀ con u = (1, 2, 3) y v = (2, 0, −1) se escribe (2, 0, −1; 4, 0, −2; 6, 0, −3) y tiene rango 1
    const u = [1, 2, 3];
    const v = [2, 0, -1];
    const M = u.map((a) => v.map((b) => a * b + 0));
    expect(M).toEqual([
      [2, 0, -1],
      [4, 0, -2],
      [6, 0, -3],
    ]);
    expect(rank(M)).toBe(1);
    const A4 = [
      [1, 2],
      [3, 6],
    ];
    // contract: ex01.4: A = (1, 2; 3, 6) tiene rango 1 y A·(2, −1) = (0, 0); rango 1 más núcleo de dimensión 1 suman las 2 columnas
    expect(rank(A4)).toBe(1);
    expect(apply(A4, [2, -1])).toEqual([0, 0]);
  });

  it('ex01.4 es un vector sin casillas de matriz y ex01.5 acierta con la recta', () => {
    const q = ex01!.questions[3]!;
    // contract: la respuesta de ex01.4 es un vector de dos componentes, sin casillas de matriz
    expect(q.type === 'vector' ? q.shape : 'otro').toBeUndefined();
    const o = ex01!.questions[4]!;
    // contract: solution de ex01.5: rango 1 es una recta por el origen (opción 2)
    expect(o.type === 'opcion' ? o.options[o.correct] : '').toMatch(/^Lo aplasta contra una recta/);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: A = (1, 2; 2, 4) tiene rango 1 y B (tercera columna = suma de las dos primeras) tiene rango 2
    expect(
      rank([
        [1, 2],
        [2, 4],
      ]),
    ).toBe(1);
    expect(
      rank([
        [1, 0, 1],
        [0, 1, 1],
        [1, 1, 2],
      ]),
    ).toBe(2);
    const X = [
      [1, 0, 1, 1],
      [0, 1, 1, 0],
      [1, 1, 2, 0],
      [2, 1, 3, 1],
      [0, 0, 0, 1],
    ];
    // contract: ex02.2: X tiene rango 3 y quitar la columna 0, 1 o 2 lo deja en 3, pero quitar la 3 lo baja a 2
    expect(rank(X)).toBe(3);
    expect([0, 1, 2, 3].map((k) => rank(without(X, k)))).toEqual([3, 3, 3, 2]);
    // contract: ex02.2: la columna 2 es la suma de la 0 y la 1, y quitar dos de las tres a la vez baja el rango
    expect(cols(X)[2]).toEqual(cols(X)[0]!.map((x, k) => x + cols(X)[1]![k]!));
    expect(rank(without(without(X, 1), 0))).toBe(2);
    // contract: ex02.3: outer(u, v) con u = (1, −1, 2, 0) y v = (3, 1, 2) tiene filas (3, 1, 2), (−3, −1, −2), (6, 2, 4), (0, 0, 0) y rango 1
    const O = [1, -1, 2, 0].map((a) => [3, 1, 2].map((b) => a * b + 0));
    expect(O).toEqual([
      [3, 1, 2],
      [-3, -1, -2],
      [6, 2, 4],
      [0, 0, 0],
    ]);
    expect(rank(O)).toBe(1);
    // contract: ex02.4: W = B·A es de 5×5 y tiene rango 2 (menor que 5) porque pasa por un cuello de 2
    const A5 = [
      [1, 0, 2, 1, 0],
      [0, 1, 1, 0, 1],
    ];
    const B5 = [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 0],
      [0, 3],
    ];
    const W = B5.map((row) => A5[0]!.map((_, c) => row[0]! * A5[0]![c]! + row[1]! * A5[1]![c]!));
    expect([W.length, W[0]!.length, rank(W)]).toEqual([5, 5, 2]);
    // contract: ex02.5: 768·768 = 589824; 768·64 + 64·768 = 98304; la razón es 6
    expect([768 * 768, 768 * 64 + 64 * 768, (768 * 768) / (768 * 64 + 64 * 768)]).toEqual([
      589824, 98304, 6,
    ]);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1 de matrices: «det = 0, luego rango 0» (línea 3), contar filas no nulas (línea 2) y una correcta (null); al menos una de código
    expect(rango.sheets.map(answerOf)).toEqual([2, 1, null]);
    expect(rango.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: la conclusión del rango 0 por tener det 0, y la cuenta de filas no nulas como rango
    const faulty = rango.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Luego A no deja pasar ninguna dirección: el rango de A es 0',
      'r = np.count_nonzero(A.any(axis=1))',
      null,
    ]);
  });

  it('hojas: las cifras de la hoja de código se recalculan', () => {
    const A = [
      [1, 2, 3],
      [2, 4, 6],
      [1, 0, 1],
    ];
    // contract: hoja 2: A tiene 3 filas no nulas pero rango 2 (la segunda fila es el doble de la primera)
    expect(A.filter((row) => row.some((x) => x !== 0))).toHaveLength(3);
    expect(rank(A)).toBe(2);
    expect(A[1]).toEqual(A[0]!.map((x) => 2 * x));
  });

  it('hojas: el enunciado acaba con la frase común y el explain no dice que no hay error', () => {
    // contract: R25 del juego 1 (prosa.test.ts) y encargo de la Órbita 1: la misma frase final en todas las hojas
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of rango.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });
});

describe('banco de examen 1 del proyecto rango', () => {
  it('tiene tres entradas fijas del proyecto rango, con ids examen-1.* distintos del generado', () => {
    // contract: encargo de la Órbita 1 de matrices: 3 entradas `{ project: 'rango', question }` con ids `examen-1.<tema>`, sin usar `examen-1.rango`, reservado para la generada
    expect(examen1Rango.map((e) => e.project)).toEqual(['rango', 'rango', 'rango']);
    expect(examen1Rango.map((e) => e.question.id)).toEqual([
      'examen-1.rango-producto',
      'examen-1.nucleo-tres',
      'examen-1.columna-redundante',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Rango) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 1 de matrices: tres fijas, una opción, un vector y un código; ids únicos en el juego
    expect(examen1Rango.map((e) => e.question.type)).toEqual(['opcion', 'vector', 'codigo']);
    const projectIds = new Set(projectQuestions(rango).map((q) => q.id));
    expect(examen1Rango.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [prod, nucleo] = examen1Rango.map((e) => e.question);
    // contract: examen-1.rango-producto: rango(AB) ≤ min(3, 5) = 3, pero puede ser menor (opción 2); 8 y 15 superan el tamaño 6
    expect(prod!.type === 'opcion' ? prod!.options[prod!.correct] : '').toMatch(
      /^Es \$3\$ como mucho/,
    );
    expect(Math.min(3, 5)).toBe(3);
    expect([3 + 5, 3 * 5].every((n) => n > 6)).toBe(true);
    // contract: examen-1.nucleo-tres: A = (1, 2, 3; 4, 5, 6; 7, 8, 9) tiene rango 2 y A·(1, −2, 1) = 0
    const A = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    expect(rank(A)).toBe(2);
    expect(apply(A, [1, -2, 1])).toEqual([0, 0, 0]);
    expect(nucleo!.type === 'vector' ? [nucleo!.answer, nucleo!.shape, nucleo!.tol] : []).toEqual([
      [1, -2, 1],
      undefined,
      0,
    ]);
  });

  it('columna-redundante: la columna nueva es 2·col0 − col1 y el rango no sube', () => {
    const X = [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ];
    const c = cols(X);
    const nueva = c[0]!.map((x, k) => 2 * x - c[1]![k]!);
    // contract: solution de examen-1.columna-redundante: la columna añadida es (2, −1, 1, 3) y los rangos de X y de X2 son 2 y 2
    expect(nueva).toEqual([2, -1, 1, 3]);
    expect([rank(X), rank(X.map((row, k) => [...row, nueva[k]!]))]).toEqual([2, 2]);
  });
});

describe('proyecto rango: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(rango), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `rango.ex02.${n}`),
      'examen-1.columna-redundante',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
