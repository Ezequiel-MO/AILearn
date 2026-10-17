import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { applyColumns, det2 } from '../../engine/vectors';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { columnas } from './columnas';
import { examen0Columnas } from './examen-0-columnas';

const bankQuestions = examen0Columnas
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto columnas', projectQuestions(columnas));
defineProseTests('banco examen-0 columnas', bankQuestions);

describe('proyecto columnas', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 0 de matrices: checkProject(columnas) devuelve la lista vacía
    expect(checkProject(columnas)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 0 de matrices: id columnas, nombre «Columnas», subtítulo «Adónde van î y ĵ»
    expect([columnas.id, columnas.name, columnas.sub]).toEqual([
      'columnas',
      'Columnas',
      'Adónde van î y ĵ',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 0 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(columnas.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(columnas.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(columnas.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón columnas.exNN.k y columnas.hoja.k', () => {
    // contract: encargo de la Órbita 0 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(columnas).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `columnas.ex0${e}.${k}`)),
      'columnas.hoja.1',
      'columnas.hoja.2',
      'columnas.hoja.3',
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

const columnsGoals = (i: [number, number], j: [number, number]): string[] => [
  `x(i)=${i[0]}±0.01`,
  `y(i)=${i[1]}±0.01`,
  `x(j)=${j[0]}±0.01`,
  `y(j)=${j[1]}±0.01`,
];

describe('valores de la tabla del proyecto columnas', () => {
  const [ex00, ex01, ex02] = columnas.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: reflejo (î=(1, 0), ĵ=(0, −1)); inclinación (ĵ=(1, 1)); matriz (2 −1; 1 1); aplastar (ĵ=(0, 0)); media vuelta (−1, 0) y (0, −1)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      columnsGoals([1, 0], [0, -1]),
      columnsGoals([1, 0], [1, 1]),
      columnsGoals([2, 1], [-1, 1]),
      columnsGoals([1, 0], [0, 0]),
      columnsGoals([-1, 0], [0, -1]),
    ]);
  });

  it('ex00: î y ĵ son móviles, con rango y rejilla que permiten comprobar la meta', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: encargo común de la Órbita 0 de matrices: î y ĵ móviles, con dos móviles rango ≤ 6 y rejilla ≥ 0,5
      expect(
        q.plane.vectors.map((v) => [v.id, v.movable]),
        q.id,
      ).toEqual([
        ['i', true],
        ['j', true],
      ]);
      expect(q.plane.range, q.id).toBeLessThanOrEqual(6);
      expect(q.plane.snap, q.id).toBeGreaterThanOrEqual(0.5);
      // contract: ex00 usa la lectura de la matriz de la transformación
      expect(q.plane.readouts, q.id).toContain('matrix');
      expect(q.plane.transform?.columns, q.id).toEqual(['i', 'j']);
    }
  });

  it('ex00: reflejo, aplastar y media vuelta enseñan el determinante', () => {
    const readouts = ex00!.questions.map((q) => (q.type === 'manipular' ? q.plane.readouts : []));
    // contract: la solution de ex00.1, 2, 4 y 5 compara el determinante (negativo, 1, 0 y 1): su lectura está en el panel
    expect(readouts.map((r) => r.includes('det'))).toEqual([true, true, false, true, true]);
  });

  it('ex00: las soluciones cumplen las metas y una posición cercana no', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: reflejo, inclinación, matriz (2 −1; 1 1), aplastar, media vuelta
      [0, { i: [1, 0], j: [0, -1] }],
      [1, { i: [1, 0], j: [1, 1] }],
      [2, { i: [2, 1], j: [-1, 1] }],
      [3, { i: [1, 0], j: [0, 0] }],
      [4, { i: [-1, 0], j: [0, -1] }],
    ];
    for (const [k, vectors] of solved) {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    const wrong: [number, Record<string, [number, number]>][] = [
      // contract: intención didáctica: reflejo en vertical (−1, 0)/(0, 1) en vez de horizontal; inclinación al otro lado (−1, 1); columnas intercambiadas (−1, 1)/(2, 1); ĵ cerca del origen pero no en él (0, 1); î y ĵ solo uno invertido (−1, 0)/(0, 1)
      [0, { i: [-1, 0], j: [0, 1] }],
      [1, { i: [1, 0], j: [-1, 1] }],
      [2, { i: [-1, 1], j: [2, 1] }],
      [3, { i: [1, 0], j: [0, 1] }],
      [4, { i: [-1, 0], j: [0, 1] }],
    ];
    for (const [k, vectors] of wrong) {
      const q = ex00!.questions[k]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
  });

  it('ex00: los determinantes que cuentan las soluciones se recalculan', () => {
    // contract: solution de ex00.1: el reflejo tiene determinante −1 (cuadrado rojo)
    expect(det2([1, 0], [0, -1])).toBe(-1);
    // contract: solution de ex00.2: la inclinación conserva el área, determinante 1
    expect(det2([1, 0], [1, 1])).toBe(1);
    // contract: solution de ex00.3: el determinante vale 2·1 − (−1)·1 = 3
    expect(det2([2, 1], [-1, 1])).toBe(3);
    // contract: solution de ex00.4: aplastar el plano da determinante 0 (±0 en coma flotante: se compara su valor absoluto)
    expect(Math.abs(det2([1, 0], [0, 0]))).toBe(0);
    // contract: solution de ex00.5: la media vuelta tiene determinante 1
    expect(det2([-1, 0], [0, -1])).toBe(1);
    // contract: solution de ex00.1: el punto (x, y) acaba en (x, −y) con el reflejo; solution de ex00.5: en (−x, −y)
    expect(applyColumns([1, 0], [0, -1], [3, 2])).toEqual([3, -2]);
    expect(applyColumns([-1, 0], [0, -1], [3, 2])).toEqual([-3, -2]);
    // contract: solution de ex00.2: el punto (x, y) acaba en (x + y, y) con la inclinación
    expect(applyColumns([1, 0], [1, 1], [3, 2])).toEqual([5, 2]);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: matriz leída del plano (1 2; −1 1) por filas; imagen de ĵ = (1, 2); reflejo respecto a y = x (índice 2); (2, 3) va a (−1, 4); 3×2 recibe 2 y devuelve 3 (índice 3)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[1, 2, -1, 1], 0],
      [[1, 2], 0],
      2,
      [[-1, 4], 0],
      3,
    ]);
  });

  it('ex01: la matriz de la pregunta 1 sale del plano y la respuesta es la matriz por filas', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'vector') throw new Error('ex01.1 es de vector');
    // contract: ex01.1: el plano dibuja î en (1, −1) y ĵ en (2, 1); la matriz tiene esas columnas
    expect(q.plane?.vectors.map((v) => [v.id, v.x, v.y, v.movable])).toEqual([
      ['i', 1, -1, false],
      ['j', 2, 1, false],
    ]);
    // contract: ex01.1: la matriz es de 2×2 y se teclea como matriz
    expect(q.shape).toEqual([2, 2]);
    // contract: ex01.1: sin la lectura de la matriz, que daría la respuesta
    expect(q.plane?.readouts).toEqual([]);
  });

  it('ex01: las respuestas numéricas se recalculan', () => {
    // contract: ex01.4: la matriz (1 −1; 2 0) manda î a (1, 2) y ĵ a (−1, 0); (2, 3) va a 2·(1, 2) + 3·(−1, 0) = (−1, 4)
    expect(applyColumns([1, 2], [-1, 0], [2, 3])).toEqual([-1, 4]);
    // contract: ex01.2: la segunda columna de (3 1; 0 2) es (1, 2)
    expect(applyColumns([3, 0], [1, 2], [0, 1])).toEqual([1, 2]);
    // contract: ex01.3: la matriz (0 1; 1 0) manda (x, y) a (y, x); su determinante es −1
    expect(applyColumns([0, 1], [1, 0], [3, 5])).toEqual([5, 3]);
    expect(det2([0, 1], [1, 0])).toBe(-1);
  });

  it('ex01.2: la matriz del enunciado es la de la solución', () => {
    const q = ex01!.questions[1]!;
    // contract: ex01.2: A = (3 1; 0 2); la segunda columna es (1, 2), la segunda fila (0, 2)
    expect(q.prompt).toContain('\\begin{pmatrix}3&1\\\\0&2\\end{pmatrix}');
    expect(q.solution).toContain('(1, 2)');
  });

  it('ex01.3: la opción correcta es el reflejo respecto a y = x y las demás se descartan en la solution', () => {
    const q = ex01!.questions[2]!;
    // contract: la matriz (0 1; 1 0) es un reflejo respecto a la recta y = x (índice 2)
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toMatch(
      /^Un reflejo respecto a la recta/,
    );
    expect(q.prompt).toContain('\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}');
  });

  it('ex01.5: la opción correcta recibe vectores de 2 componentes y devuelve vectores de 3', () => {
    const q = ex01!.questions[4]!;
    // contract: solution de ex01.5: W es de 3 filas y 2 columnas: recibe 2 componentes y devuelve 3 (índice 3)
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      'Recibe vectores de 2 componentes y devuelve vectores de 3',
    );
    expect(q.prompt).toContain('\\begin{pmatrix}1&0\\\\2&1\\\\0&3\\end{pmatrix}');
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 0 de matrices: imágenes en filas (línea 3), «A[0] es la imagen de î» (línea 2) y un razonamiento correcto (null); al menos una de código
    expect(columnas.sheets.map(answerOf)).toEqual([2, 1, null]);
    expect(columnas.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: `np.array([img_i, img_j])` sin `.T` y «A[0] es la imagen de î»
    const faulty = columnas.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['A = np.array([img_i, img_j])', 'A[0] es la imagen de î', null]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 del juego 1 (prosa.test.ts): la misma frase final en todas las hojas
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of columnas.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 1: con las imágenes como filas, A @ (1, 0) es la primera columna de la traspuesta, (2, −1), y no (2, 1)
    const rows = [
      [2, 1],
      [-1, 3],
    ];
    expect([rows[0]![0], rows[1]![0]]).toEqual([2, -1]);
    // contract: hoja 2: de A = (1 3; 2 4), A[0] = (1, 3) es la primera fila y la primera columna es (1, 2)
    const A = [
      [1, 3],
      [2, 4],
    ];
    expect(A[0]).toEqual([1, 3]);
    expect(A.map((r) => r[0])).toEqual([1, 2]);
  });
});

describe('banco de examen 0 del proyecto columnas', () => {
  it('tiene tres entradas fijas del proyecto columnas, con ids examen-0.*', () => {
    // contract: encargo de la Órbita 0 de matrices: 3 entradas `{ project: 'columnas', question }` con ids `examen-0.<tema>`
    expect(examen0Columnas.map((e) => e.project)).toEqual(['columnas', 'columnas', 'columnas']);
    expect(examen0Columnas.map((e) => e.question.id)).toEqual([
      'examen-0.reconocer-reflejo',
      'examen-0.matriz-desde-imagenes',
      'examen-0.columnas-con-numpy',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen0Columnas) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 0 de matrices: una opcion, un vector de forma [2, 2] y un codigo; las generadas las añade el ensamblado
    expect(examen0Columnas.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen0Columnas.map((e) => e.question.type)).toEqual(['opcion', 'vector', 'codigo']);
    const projectIds = new Set(projectQuestions(columnas).map((q) => q.id));
    expect(examen0Columnas.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [reflejo, matriz] = examen0Columnas.map((e) => e.question);
    // contract: examen-0.reconocer-reflejo: (−1 0; 0 1) deja ĵ y da la vuelta a î: reflejo respecto al eje vertical (índice 2)
    expect(reflejo!.type === 'opcion' ? reflejo!.options[reflejo!.correct] : '').toBe(
      'Un reflejo respecto al eje vertical',
    );
    expect(applyColumns([-1, 0], [0, 1], [3, 2])).toEqual([-3, 2]);
    // contract: examen-0.matriz-desde-imagenes: î a (0, 3) y ĵ a (−2, 1): primera columna (0, 3), segunda (−2, 1), por filas 0, −2, 3, 1
    expect(matriz!.type === 'vector' ? [matriz!.answer, matriz!.shape, matriz!.tol] : []).toEqual([
      [0, -2, 3, 1],
      [2, 2],
      0,
    ]);
  });
});

describe('proyecto columnas: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(columnas), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `columnas.ex02.${n}`),
      'examen-0.columnas-con-numpy',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
