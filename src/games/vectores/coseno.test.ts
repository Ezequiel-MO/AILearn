import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { coseno } from './coseno';
import { examen1Coseno } from './examen-1-coseno';

defineProseTests('proyecto coseno', projectQuestions(coseno));
defineProseTests(
  'banco examen-1 coseno',
  examen1Coseno.map((e) => e.question).filter((q): q is Question => q.type !== 'generada'),
);

describe('proyecto coseno', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1: checkProject(coseno) devuelve la lista vacía
    expect(checkProject(coseno)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1: id coseno, nombre «Coseno», subtítulo «Similitud por la dirección»
    expect([coseno.id, coseno.name, coseno.sub]).toEqual([
      'coseno',
      'Coseno',
      'Similitud por la dirección',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(coseno.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(coseno.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(coseno.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón coseno.exNN.k y coseno.hoja.k', () => {
    // contract: encargo de la Órbita 1: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(coseno).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `coseno.ex0${e}.${k}`)),
      'coseno.hoja.1',
      'coseno.hoja.2',
      'coseno.hoja.3',
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

describe('valores de la tabla del proyecto coseno', () => {
  const [ex00, ex01, ex02] = coseno.exercises;

  it('ex00: metas de manipular', () => {
    // contract: encargo de la Órbita 1, tabla de ex00: 90° con angle; 45° con y=3; coseno −1; coseno 1 con norma 10; coseno 0,96 con «gato»
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['angle(u,w)=90±0.01'],
      ['angle(u,w)=45±0.01', 'y(w)=3±0.01'],
      ['cos(u,w)=-1±0.01'],
      ['cos(v,w)=1±0.001', 'norm(w)=10±0.01'],
      ['cos(q,gato)=0.96±0.001'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: (−2, 3), (3, 3), (−2, −3), (6, 8), (4, 3)
      [0, { w: [-2, 3] }],
      [0, { w: [2, -3] }],
      [1, { w: [3, 3] }],
      [2, { w: [-2, -3] }],
      [2, { w: [-4, -6] }],
      [3, { w: [6, 8] }],
      [4, { q: [4, 3] }],
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
      // contract: la intención didáctica de cada meta: perpendicular no es «cerca de 90°»; 45° sin y=3 no basta; la misma dirección con la misma norma no basta; (8, 6) tiene la norma pedida pero otra dirección
      [0, { w: [-2, 4] }],
      [1, { w: [2, 2] }],
      [2, { w: [-2, -2] }],
      [3, { w: [8, 6] }],
      [3, { w: [3, 4] }],
      [4, { q: [3, 4] }],
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

  it('ex00: rango 6 y rejilla de 1, salvo el cuarto (rango 10)', () => {
    // contract: encargo de la Órbita 1 y diseño de ex00.4 (w = (6, 8) necesita llegar hasta 8)
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual([
      [6, 1],
      [6, 1],
      [6, 1],
      [10, 1],
      [6, 1],
    ]);
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: u fijo en (3, 2), (4, 0), (2, 3); v en (3, 4); gato y lobo del mapa de juguete
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['u=(3, 2)'],
      ['u=(4, 0)'],
      ['u=(2, 3)'],
      ['v=(3, 4)'],
      ['gato=(3, 4)', 'lobo=(4, -2)'],
    ]);
  });

  it('ex00: cada plano declara el par y las lecturas del coseno', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo de la Órbita 1: las lecturas 'cos' (y 'angle') de cada pregunta de ex00, con pair
      expect(q.plane.pair, q.id).toBeDefined();
      expect(q.plane.readouts, q.id).toContain('cos');
      expect(q.plane.readouts, q.id).toContain('angle');
    }
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: 0,96; 45°; opción «1» (índice 2); opción «tratado por coseno» (índice 1); 0,28
    expect(ex01!.questions.map(answerOf)).toEqual([[0.96, 0.005], [45, 0.5], 2, 1, [0.28, 0.005]]);
  });

  it('ex01.3: el coseno de u y 3u es 1', () => {
    const q = ex01!.questions[2]!;
    // contract: tabla de ex01 #3: la opción correcta es «1»
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe('$1$');
  });

  it('ex01.4: la opción correcta nombra al «tratado» por coseno y al «apunte» por distancia', () => {
    const q = ex01!.questions[3]!;
    const correct = q.type === 'opcion' ? q.options[q.correct]! : '';
    // contract: cálculo de la solution: coseno 1 con el tratado (5, 5), distancia 1,41 con el apunte (2, 0)
    expect(correct).toMatch(/coseno gana el «tratado».*distancia, el «apunte»/);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1: una hoja que divide solo por una norma (línea 3), una con argmin (línea 3) y una correcta (null); al menos una de código
    expect(coseno.sheets.map(answerOf)).toEqual([3, 3, null]);
    expect(coseno.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: la división solo por ‖a‖ y el np.argmin con una similitud
    const faulty = coseno.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['cos θ = (a · b) / ‖a‖ = 8 / 5 = 1,6', 'mejor = np.argmin(sim)', null]);
  });
});

describe('banco de examen 1 del proyecto coseno', () => {
  it('tiene tres entradas fijas del proyecto coseno, con ids examen-1.*', () => {
    // contract: encargo de la Órbita 1: 3 entradas `{ project: 'coseno', question }` con ids `examen-1.<tema>`
    expect(examen1Coseno.map((e) => e.project)).toEqual(['coseno', 'coseno', 'coseno']);
    expect(examen1Coseno.map((e) => e.question.id)).toEqual([
      'examen-1.escala',
      'examen-1.perpendicular',
      'examen-1.similitud',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Coseno) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 1: las generadas las añade otro paso; los ids son únicos en todo el juego
    expect(examen1Coseno.some((e) => e.question.type === 'generada')).toBe(false);
    const projectIds = new Set(projectQuestions(coseno).map((q) => q.id));
    expect(examen1Coseno.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [escala, perpendicular] = examen1Coseno.map((e) => e.question);
    // contract: examen-1.escala: el coseno no cambia al duplicar y la distancia suele cambiar (índice 2)
    expect(escala!.type === 'opcion' ? escala!.options[escala!.correct] : '').toMatch(
      /coseno no cambia y la distancia suele cambiar/,
    );
    // contract: examen-1.perpendicular: 2k + 3 = 0, k = −1,5
    expect(
      perpendicular!.type === 'numero' ? [perpendicular!.answer, perpendicular!.tol] : [],
    ).toEqual([-1.5, 0.01]);
  });
});
