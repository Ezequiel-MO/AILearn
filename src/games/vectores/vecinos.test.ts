import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { cosine, distance } from '../../engine/vectors';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { vecinos } from './vecinos';
import { examen3Vecinos } from './examen-3-vecinos';

const bankQuestions = examen3Vecinos
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto vecinos', projectQuestions(vecinos));
defineProseTests('banco examen-3 vecinos', bankQuestions);

describe('proyecto vecinos', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 3: checkProject(vecinos) devuelve la lista vacía
    expect(checkProject(vecinos)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3: id vecinos, nombre «Vecinos y top-k», subtítulo «Los k más parecidos»
    expect([vecinos.id, vecinos.name, vecinos.sub]).toEqual([
      'vecinos',
      'Vecinos y top-k',
      'Los k más parecidos',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo común de la Órbita 3: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(vecinos.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(vecinos.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(vecinos.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón vecinos.exNN.k y vecinos.hoja.k', () => {
    // contract: encargo común de la Órbita 3: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(vecinos).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `vecinos.ex0${e}.${k}`)),
      'vecinos.hoja.1',
      'vecinos.hoja.2',
      'vecinos.hoja.3',
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

describe('valores de la tabla del proyecto vecinos', () => {
  const [ex00, ex01, ex02] = vecinos.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: coseno 1 con «lobo»; empate en 0,99 con «gato» y «perro»; coseno 1 y distancia 4; E q = (0,6; 0,8); 0,8 con «parking» y 0,96 con «aeropuerto»
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['cos(q,lobo)=1±0.001'],
      ['cos(q,gato)=0.99±0.005', 'cos(q,perro)=0.99±0.005'],
      ['cos(q,d)=1±0.001', 'distance(q,d)=4±0.01'],
      ['dot(q,u1)=0.6±0.01', 'dot(q,u2)=0.8±0.01'],
      ['dot(q,parking)=0.8±0.01', 'dot(q,aeropuerto)=0.96±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: (2, −1), (4, −2) y (6, −3); (1, 1) y (3, 3); d = (6, 0); (1; 0); (0,8; 0,6)
      [0, { q: [2, -1] }],
      [0, { q: [4, -2] }],
      [0, { q: [6, -3] }],
      [1, { q: [1, 1] }],
      [1, { q: [3, 3] }],
      [2, { d: [6, 0] }],
      [3, { q: [1, 0] }],
      [4, { q: [0.8, 0.6] }],
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
      // contract: la intención didáctica de cada meta: (−2, 1) apunta al lado opuesto de «lobo» (coseno −1); (2, 1) puntúa 0,89 con «gato» y 0,98 con «perro»; (−6, 0) está a distancia 4 pero el coseno es −1; (0; 1) da cosenos 0,8 y −0,6; (0,6; 0,8) puntúa 0,6 con «parking» y 1 con «aeropuerto»
      [0, { q: [-2, 1] }],
      [1, { q: [2, 1] }],
      [2, { d: [-2, 0] }],
      [3, { q: [0, 1] }],
      [4, { q: [0.6, 0.8] }],
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

  it('ex00: las cifras de las soluciones se recalculan con el motor', () => {
    const lobo = [4, -2];
    const gato = [3, 4];
    const perro = [4, 3];
    const coche = [-3, 2];
    // contract: solution de ex00.1: con q = (2, −1) los cosenos son 1 con «lobo», 0,18 con «gato» y −0,99 con «coche»
    expect(cosine([2, -1], lobo)).toBeCloseTo(1, 10);
    expect(cosine([2, -1], gato)).toBeCloseTo(0.18, 2);
    expect(cosine([2, -1], coche)).toBeCloseTo(-0.99, 2);
    // contract: solution de ex00.2: con q = (1, 1) «gato» y «perro» puntúan lo mismo (≈ 0,99), el ángulo es 8,1° y «coche» da −0,20
    expect(cosine([1, 1], gato)).toBeCloseTo(cosine([1, 1], perro), 12);
    expect(cosine([1, 1], gato)).toBeCloseTo(0.99, 2);
    expect((Math.acos(cosine([1, 1], gato)) * 180) / Math.PI).toBeCloseTo(8.1, 1);
    expect(cosine([1, 1], coche)).toBeCloseTo(-0.2, 2);
    // contract: solution de ex00.3: «corto» (2, 2) tiene coseno 0,71 y distancia 2 con q = (2, 0); «largo» (6, 0) tiene coseno 1 y distancia 4
    expect(cosine([2, 0], [2, 2])).toBeCloseTo(0.71, 2);
    expect(distance([2, 0], [2, 2])).toBe(2);
    expect(cosine([2, 0], [6, 0])).toBe(1);
    expect(distance([2, 0], [6, 0])).toBe(4);
    // contract: solution de ex00.4: las filas (0,6; 0,8) y (0,8; −0,6) son unitarias y perpendiculares; q = (1; 0) puntúa 0,6 y 0,8
    expect(Math.hypot(0.6, 0.8)).toBeCloseTo(1, 12);
    expect(Math.hypot(0.8, -0.6)).toBeCloseTo(1, 12);
    expect(0.6 * 0.8 + 0.8 * -0.6).toBeCloseTo(0, 12);
    // contract: solution de ex00.5: q = (0,8; 0,6) puntúa 0,8 con «parking», 0,96 con «aeropuerto» y −1 con «desayuno» (todos unitarios)
    const q = [0.8, 0.6];
    expect(q[0]! * 1 + q[1]! * 0).toBeCloseTo(0.8, 12);
    expect(q[0]! * 0.6 + q[1]! * 0.8).toBeCloseTo(0.96, 12);
    expect(q[0]! * -0.8 + q[1]! * -0.6).toBeCloseTo(-1, 12);
    expect(Math.hypot(-0.8, -0.6)).toBeCloseTo(1, 12);
  });

  it('ex00: rango 6 y rejilla de 1 en los tres primeros; rango 2, rejilla de 0,1 y circunferencia unidad en los dos últimos', () => {
    // contract: diseño de ex00: ex00.4 y ex00.5 trabajan con filas unitarias, que caen en la rejilla de 0,1 (0,6; 0,8)
    expect(
      ex00!.questions.map((q) =>
        q.type === 'manipular' ? [q.plane.range, q.plane.snap, q.plane.circle ?? null] : [],
      ),
    ).toEqual([
      [6, 1, null],
      [6, 1, null],
      [6, 1, null],
      [2, 0.1, 1],
      [2, 0.1, 1],
    ]);
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: mapa de juguete «gato», «lobo», «coche» y «perro» de toy.ts; q, «corto»; filas unitarias u1, u2; «parking», «aeropuerto», «desayuno»
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['gato=(3, 4)', 'lobo=(4, -2)', 'coche=(-3, 2)'],
      ['gato=(3, 4)', 'perro=(4, 3)', 'coche=(-3, 2)'],
      ['q=(2, 0)', 'corto=(2, 2)'],
      ['u1=(0.6, 0.8)', 'u2=(0.8, -0.6)'],
      ['parking=(1, 0)', 'aeropuerto=(0.6, 0.8)', 'desayuno=(-0.8, -0.6)'],
    ]);
  });

  it('ex00: cada plano declara el par y las lecturas que pide su meta', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo común de la Órbita 2: las lecturas de pareja exigen `pair`
      expect(q.plane.pair, q.id).toBeDefined();
    }
    const readouts = ex00!.questions.map((q) => (q.type === 'manipular' ? q.plane.readouts : []));
    // contract: diseño de ex00: coseno en 1 y 2; distancia y coseno en 3; producto escalar en 4 y 5
    expect(readouts.map((r) => r.includes('cos'))).toEqual([true, true, true, false, false]);
    expect(readouts[2]).toContain('distance');
    expect(readouts[3]).toContain('dot');
    expect(readouts[4]).toContain('dot');
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: top-3 (1, 4, 3); recall@5 = 0,75; opción `np.argsort(-s)[:k]` (índice 0); 768 millones; opción del compromiso de k (índice 0)
    expect(ex01!.questions.map(answerOf)).toEqual([[[1, 4, 3], 0], [0.75, 0], 0, [768, 0], 0]);
  });

  it('ex01: las respuestas numéricas se recalculan', () => {
    const s = [0.31, 0.72, 0.15, 0.64, 0.7, -0.1];
    const top3 = s
      .map((v, i) => [v, i] as const)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3)
      .map(([, i]) => i);
    // contract: ex01.1: de mayor a menor 0,72 (documento 1), 0,70 (documento 4) y 0,64 (documento 3)
    expect(top3).toEqual([1, 4, 3]);
    const relevantes = new Set([2, 5, 7, 9]);
    const devueltos = [5, 0, 9, 3, 2];
    const aciertos = devueltos.filter((d) => relevantes.has(d)).length;
    // contract: ex01.2: tres relevantes entre los cinco devueltos y cuatro relevantes en total: recall@5 = 3/4, precisión 3/5
    expect(aciertos / relevantes.size).toBe(0.75);
    expect(aciertos / devueltos.length).toBe(0.6);
    // contract: ex01.4: 500 000 documentos de 1536 componentes = 768 millones de multiplicaciones
    expect((500_000 * 1536) / 1_000_000).toBe(768);
  });

  it('ex01.3: la opción correcta es argsort(-s) y las demás se describen como en la solución', () => {
    const q = ex01!.questions[2]!;
    // contract: np.argsort(-s)[:k] es la única expresión que da posiciones de mayor a menor puntuación (índice 0)
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toMatch(/^`np\.argsort\(-s\)\[:k\]`/);
    // contract: cada opción empieza por una expresión distinta, tal como las analiza la solution
    expect(q.type === 'opcion' ? q.options.map((o) => o.split('`')[1]) : []).toEqual([
      'np.argsort(-s)[:k]',
      'np.argsort(s)[:k]',
      'np.argsort(s)[-k:]',
      'np.sort(s)[::-1][:k]',
    ]);
  });

  it('ex01.5: la opción correcta es la del compromiso de k', () => {
    const q = ex01!.questions[4]!;
    // contract: solution de ex01.5: solo el primer trozo destaca (0,56 frente a 0,24) y elegir k es un compromiso
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toMatch(
      /^Solo el primer trozo destaca.*compromiso/,
    );
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo común de la Órbita 3: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo común de la Órbita 3: argsort al revés (línea 2), argmax que devuelve la propia consulta (línea 3) y una correcta (null); al menos una de código
    expect(vecinos.sheets.map(answerOf)).toEqual([2, 3, null]);
    expect(vecinos.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: «los dos primeros de esa lista» tras un argsort ascendente y `vecino = np.argmax(puntos)` sin excluir la consulta
    const faulty = vecinos.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Los dos documentos que más puntúan son los dos primeros de esa lista: los documentos 0 y 2',
      'vecino = np.argmax(puntos)',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of vecinos.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    const argsort = (x: number[]): number[] =>
      x
        .map((v, i) => [v, i] as const)
        .sort((a, b) => a[0] - b[0])
        .map(([, i]) => i);
    // contract: hoja 1: np.argsort([0,2; 0,9; 0,5; 0,7]) = [0, 2, 3, 1]; los dos mejores son las dos últimas posiciones, 3 y 1
    expect(argsort([0.2, 0.9, 0.5, 0.7])).toEqual([0, 2, 3, 1]);
    expect(argsort([-0.2, -0.9, -0.5, -0.7]).slice(0, 2)).toEqual([1, 3]);
    // contract: hoja 2: con P = [[1, 0], [0,6; 0,8], [0, 1]] y q = P[0], puntos = [1, 0,6, 0]; sin la propia consulta gana la fila 1
    const P = [
      [1, 0],
      [0.6, 0.8],
      [0, 1],
    ];
    const puntos = P.map((row) => row[0]! * P[0]![0]! + row[1]! * P[0]![1]!);
    expect(puntos).toEqual([1, 0.6, 0]);
    expect(puntos.indexOf(Math.max(...puntos))).toBe(0);
    expect(puntos.slice(1).indexOf(Math.max(...puntos.slice(1))) + 1).toBe(1);
    // contract: hoja 3: 3 relevantes devueltos de 4 relevantes = 0,75
    expect(3 / 4).toBe(0.75);
  });
});

describe('banco de examen 3 del proyecto vecinos', () => {
  it('tiene tres entradas fijas del proyecto vecinos, con ids examen-3.*', () => {
    // contract: encargo común de la Órbita 3: 3 entradas `{ project: 'vecinos', question }` con ids `examen-3.<tema>`
    expect(examen3Vecinos.map((e) => e.project)).toEqual(['vecinos', 'vecinos', 'vecinos']);
    expect(examen3Vecinos.map((e) => e.question.id)).toEqual([
      'examen-3.coste-busqueda',
      'examen-3.elegir-k',
      'examen-3.vecinos-berlin',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen3Vecinos) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo común de la Órbita 3: la generada la añade la sesión principal; variedad de tipos; ids únicos en el juego
    expect(examen3Vecinos.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen3Vecinos.map((e) => e.question.type)).toEqual(['numero', 'opcion', 'codigo']);
    const projectIds = new Set(projectQuestions(vecinos).map((q) => q.id));
    expect(examen3Vecinos.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [coste, k] = examen3Vecinos.map((e) => e.question);
    // contract: examen-3.coste-busqueda: 3 000 000 documentos × 384 componentes = 1152 millones de multiplicaciones
    expect(coste!.type === 'numero' ? [coste!.answer, coste!.tol] : []).toEqual([1152, 0]);
    expect((3_000_000 * 384) / 1_000_000).toBe(1152);
    // contract: examen-3.elegir-k: el recall@k no baja al subir k, y a cambio hay más ruido y coste (índice 0)
    expect(k!.type === 'opcion' ? k!.options[k!.correct] : '').toMatch(/^El recall@k no baja/);
  });
});

describe('proyecto vecinos: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(vecinos), ...bankQuestions].filter(
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
    // contract: encargo común de la Órbita 3: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `vecinos.ex02.${n}`),
      'examen-3.vecinos-berlin',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
