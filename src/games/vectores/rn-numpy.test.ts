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
import { rnNumpy } from './rn-numpy';
import { examen2RnNumpy } from './examen-2-rn-numpy';

const bankQuestions = examen2RnNumpy
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto rn-numpy', projectQuestions(rnNumpy));
defineProseTests('banco examen-2 rn-numpy', bankQuestions);

describe('proyecto rn-numpy', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2: checkProject(rnNumpy) devuelve la lista vacía
    expect(checkProject(rnNumpy)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2: id rn-numpy, nombre «ℝⁿ en NumPy», subtítulo «Muchos vectores a la vez»
    expect([rnNumpy.id, rnNumpy.name, rnNumpy.sub]).toEqual([
      'rn-numpy',
      'ℝⁿ en NumPy',
      'Muchos vectores a la vez',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo común de la Órbita 2: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(rnNumpy.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(rnNumpy.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(rnNumpy.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón rn-numpy.exNN.k y rn-numpy.hoja.k', () => {
    // contract: encargo común de la Órbita 2: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(rnNumpy).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `rn-numpy.ex0${e}.${k}`)),
      'rn-numpy.hoja.1',
      'rn-numpy.hoja.2',
      'rn-numpy.hoja.3',
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

describe('valores de la tabla del proyecto rn-numpy', () => {
  const [ex00, ex01, ex02] = rnNumpy.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: E q = (7, 11); E q = (0, 5); norma 5 y puntuación 7; distancia 5 a las dos filas; «gato» 9 y «lobo» 12
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['dot(q,a)=7±0.01', 'dot(q,b)=11±0.01'],
      ['dot(q,a)=0±0.01', 'dot(q,b)=5±0.01'],
      ['norm(d)=5±0.01', 'dot(q,d)=7±0.01'],
      ['distance(q,a)=5±0.01', 'distance(q,b)=5±0.01'],
      ['dot(q,gato)=9±0.01', 'dot(q,lobo)=12±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: (2, 3), (−1, 3), (3, 4) y (4, 3), (4, −2) y (4, 6), (3, 0)
      [0, { q: [2, 3] }],
      [1, { q: [-1, 3] }],
      [2, { d: [3, 4] }],
      [2, { d: [4, 3] }],
      [3, { q: [4, -2] }],
      [3, { q: [4, 6] }],
      [4, { q: [3, 0] }],
    ];
    for (const [i, vectors] of solved) {
      const q = ex00!.questions[i]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    const wrong: [number, Record<string, [number, number]>][] = [
      // contract: la intención didáctica de cada meta: con una sola entrada de E q bien no basta (3, 1) da a·q = 7 pero b·q = 6; (1, −3) da a·q = 0 pero b·q = −5; (5, 0) mide 5 pero puntúa 5; (4, −1) está en la vertical correcta pero a distancia √18 de a; (0, 3) puntúa 12 con «gato» y −6 con «lobo»
      [0, { q: [3, 1] }],
      [1, { q: [1, -3] }],
      [2, { d: [5, 0] }],
      [3, { q: [4, -1] }],
      [4, { q: [0, 3] }],
    ];
    for (const [i, vectors] of wrong) {
      const q = ex00!.questions[i]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
  });

  it('ex00: rango 6 y rejilla de 1, salvo el cuarto (rango 8)', () => {
    // contract: diseño de ex00.4: el punto (4, 6) y las filas (7, 2) necesitan llegar hasta 7
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual([
      [6, 1],
      [6, 1],
      [6, 1],
      [8, 1],
      [6, 1],
    ]);
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: filas a, b de E; q fija en (1, 1) en ex00.3; «gato», «lobo» y «coche» del mapa de juguete
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['a=(2, 1)', 'b=(1, 3)'],
      ['a=(3, 1)', 'b=(1, 2)'],
      ['q=(1, 1)'],
      ['a=(1, 2)', 'b=(7, 2)'],
      ['gato=(3, 4)', 'lobo=(4, -2)', 'coche=(-3, 2)'],
    ]);
  });

  it('ex00: cada plano declara el par y las lecturas que pide su meta', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo común de la Órbita 2: las lecturas de pareja exigen `pair`
      expect(q.plane.pair, q.id).toBeDefined();
    }
    const readouts = ex00!.questions.map((q) => (q.type === 'manipular' ? q.plane.readouts : []));
    // contract: diseño de ex00: producto escalar en 1, 2, 3 y 5; norma en 3; distancia en 4
    expect(readouts.map((r) => r.includes('dot'))).toEqual([true, true, true, false, true]);
    expect(readouts[2]).toContain('norm');
    expect(readouts[3]).toContain('distance');
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: norma 7; distancia 3; opción (4, 3), (3,), (4,) (índice 0); opción axis=1 por filas (índice 0); E @ q = (1, 3, 7)
    expect(ex01!.questions.map(answerOf)).toEqual([[7, 0], [3, 0], 0, 0, [[1, 3, 7], 0]]);
  });

  it('ex01: las respuestas numéricas se recalculan con la fórmula', () => {
    const norm = (v: number[]): number => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    // contract: ‖(2, 3, 6)‖ = √49 = 7 y ‖(2, 5, 1, 3) − (1, 3, 3, 3)‖ = ‖(1, 2, −2, 0)‖ = 3
    expect(norm([2, 3, 6])).toBe(7);
    expect(norm([1, 2, -2, 0])).toBe(3);
    const E = [
      [1, 0, 2, 1],
      [0, 3, 1, 1],
      [2, 1, 0, 2],
    ];
    const q = [2, 1, -1, 1];
    // contract: E @ q fila a fila: producto escalar de cada fila con q
    expect(E.map((row) => row.reduce((s, x, i) => s + x * q[i]!, 0))).toEqual([1, 3, 7]);
  });

  it('ex01.3: la opción correcta da las formas (4, 3), (3,) y (4,)', () => {
    const q = ex01!.questions[2]!;
    // contract: 4 documentos de 3 componentes: E (4, 3), q (3,), E @ q (4,)
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      '`E.shape` es `(4, 3)`; `q.shape`, `(3,)`; `(E @ q).shape`, `(4,)`',
    );
  });

  it('ex01.4: la opción correcta es axis=1 por filas, y las normas son 5, 13 y 17', () => {
    const q = ex01!.questions[3]!;
    // contract: normas de (3, 4), (5, 12), (8, 15) = 5, 13, 17; axis=0 da dos números (una por columna)
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toMatch(
      /^`axis=1` da `\[5, 13, 17\]`.*`axis=0` da dos números/,
    );
    expect(Math.hypot(3, 4)).toBe(5);
    expect(Math.hypot(5, 12)).toBe(13);
    expect(Math.hypot(8, 15)).toBe(17);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo común de la Órbita 2: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo común de la Órbita 2: un cuadrado negativo (línea 1), un axis=0 (línea 2) y una correcta (null); al menos una de código
    expect(rnNumpy.sheets.map(answerOf)).toEqual([1, 2, null]);
    expect(rnNumpy.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: (−1)² escrito como −1 y np.linalg.norm(E - q, axis=0)
    const faulty = rnNumpy.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      '‖a − b‖² = (−1)² + 2² + 0² + 3² = −1 + 4 + 0 + 9 = 12',
      'dist = np.linalg.norm(E - q, axis=0)',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of rnNumpy.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: la hoja 2 es la trampa de la matriz cuadrada (3 filas y 3 columnas)', () => {
    const s = rnNumpy.sheets[1]!;
    // contract: solución de la hoja 2: con una E cuadrada, axis=0 y axis=1 dan tres números, pero distintos (√2 y √5 los separan)
    const E = [
      [1, 0, 2],
      [2, 2, 1],
      [0, 3, 1],
    ];
    const q = [1, 1, 0];
    const diff = E.map((row) => row.map((x, i) => x - q[i]!));
    const byRow = diff.map((row) => Math.hypot(...row));
    const byCol = [0, 1, 2].map((j) => Math.hypot(...diff.map((row) => row[j]!)));
    expect(byRow.indexOf(Math.min(...byRow))).toBe(1);
    expect(byCol.indexOf(Math.min(...byCol))).toBe(0);
    expect(s.type === 'revision' ? s.lines[0] : '').toBe(
      'E = np.array([[1, 0, 2], [2, 2, 1], [0, 3, 1]])',
    );
  });
});

describe('banco de examen 2 del proyecto rn-numpy', () => {
  it('tiene tres entradas fijas del proyecto rn-numpy, con ids examen-2.*', () => {
    // contract: encargo común de la Órbita 2: 3 entradas `{ project: 'rn-numpy', question }` con ids `examen-2.<tema>`
    expect(examen2RnNumpy.map((e) => e.project)).toEqual(['rn-numpy', 'rn-numpy', 'rn-numpy']);
    expect(examen2RnNumpy.map((e) => e.question.id)).toEqual([
      'examen-2.matriz-vector',
      'examen-2.axis-columnas',
      'examen-2.dos-cercanos',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2RnNumpy) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo común de la Órbita 2: la generada la añade la sesión principal; variedad de tipos; ids únicos en el juego
    expect(examen2RnNumpy.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2RnNumpy.map((e) => e.question.type)).toEqual(['opcion', 'vector', 'codigo']);
    const projectIds = new Set(projectQuestions(rnNumpy).map((q) => q.id));
    expect(examen2RnNumpy.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [matriz, axis] = examen2RnNumpy.map((e) => e.question);
    // contract: examen-2.matriz-vector: E (5000, 384) @ q (384,) da (5000,), con E @ q (índice 0)
    expect(matriz!.type === 'opcion' ? matriz!.options[matriz!.correct] : '').toMatch(
      /^`E @ q`: un vector de 5000 puntuaciones/,
    );
    // contract: examen-2.axis-columnas: columnas (3, 0, 4) y (2, 3, 6), de normas 5 y 7
    expect(axis!.type === 'vector' ? [axis!.answer, axis!.tol] : []).toEqual([[5, 7], 0]);
    expect(Math.hypot(3, 0, 4)).toBe(5);
    expect(Math.hypot(2, 3, 6)).toBe(7);
  });
});

describe('proyecto rn-numpy: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(rnNumpy), ...bankQuestions].filter(
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
    // contract: encargo común de la Órbita 2: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `rn-numpy.ex02.${n}`),
      'examen-2.dos-cercanos',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
