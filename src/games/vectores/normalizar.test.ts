import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { normalizar } from './normalizar';
import { examen2Normalizar } from './examen-2-normalizar';

defineProseTests('proyecto normalizar', projectQuestions(normalizar));
defineProseTests(
  'banco examen-2 normalizar',
  examen2Normalizar.map((e) => e.question).filter((q): q is Question => q.type !== 'generada'),
);

describe('proyecto normalizar', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2: checkProject(normalizar) devuelve la lista vacía
    expect(checkProject(normalizar)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2: id normalizar, nombre «Normalizar», subtítulo «Todos a la misma longitud»
    expect([normalizar.id, normalizar.name, normalizar.sub]).toEqual([
      'normalizar',
      'Normalizar',
      'Todos a la misma longitud',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo común: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(normalizar.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(normalizar.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(normalizar.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón normalizar.exNN.k y normalizar.hoja.k', () => {
    // contract: encargo común: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(normalizar).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `normalizar.ex0${e}.${k}`)),
      'normalizar.hoja.1',
      'normalizar.hoja.2',
      'normalizar.hoja.3',
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

describe('valores de la tabla del proyecto normalizar', () => {
  const [ex00, ex01, ex02] = normalizar.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: norma 1 y coseno 1; norma 1 y distancia √2; norma 1 y producto escalar 0,6; norma 1 y coseno 0,8; norma 1 y producto escalar 0,6 con «gato»
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['norm(w)=1±0.01', 'cos(u,w)=1±0.001'],
      ['norm(b)=1±0.01', 'distance(a,b)=1.4142±0.01'],
      ['norm(w)=1±0.01', 'dot(f,w)=0.6±0.01'],
      ['norm(b)=1±0.01', 'cos(a,b)=0.8±0.01'],
      ['norm(q)=1±0.01', 'dot(q,gato)=0.6±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: (0,6; 0,8); (−0,8; 0,6) y (0,8; −0,6); (0,6; ±0,8); (1, 0); (1, 0)
      [0, { w: [0.6, 0.8] }],
      [1, { b: [-0.8, 0.6] }],
      [1, { b: [0.8, -0.6] }],
      [2, { w: [0.6, 0.8] }],
      [2, { w: [0.6, -0.8] }],
      [3, { b: [1, 0] }],
      [4, { q: [1, 0] }],
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
      // contract: intención didáctica: la misma dirección sin norma 1 no vale; norma 1 con otra dirección no vale; (0,7; 0,7) tiene norma 0,99 pero no el coseno; el producto escalar 0,6 sin norma 1 no vale
      [0, { w: [1.5, 2] }],
      [0, { w: [0.7, 0.7] }],
      [1, { b: [0.6, 0.8] }],
      [1, { b: [-1.6, 1.2] }],
      [2, { w: [0.6, 0] }],
      [2, { w: [0.6, 1.2] }],
      [3, { b: [0.8, 0.6] }],
      [3, { b: [1.6, 0] }],
      [4, { q: [0.6, 0.8] }],
      [4, { q: [0.6, 0] }],
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

  it('ex00: todos los planos dibujan la circunferencia unidad y usan una rejilla de 0,1', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo de la Órbita 2: circle: 1 en cada plano, para ver normalizar como «llevar la punta a la circunferencia unidad»
      expect(q.plane.circle, q.id).toBe(1);
      // contract: diseño de ex00: con snap 0,1 hay puntos de la rejilla sobre la circunferencia, como (0,6; 0,8)
      expect(q.plane.snap, q.id).toBe(0.1);
    }
  });

  it('ex00: rango 2, salvo el primero (2,5, para que quepa u = (1,5; 2))', () => {
    // contract: diseño de ex00: u = (1,5; 2) necesita llegar hasta 2; el resto, vectores unitarios
    expect(ex00!.questions.map((q) => (q.type === 'manipular' ? q.plane.range : 0))).toEqual([
      2.5, 2, 2, 2, 2,
    ]);
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: u = (1,5; 2); a = (0,6; 0,8); f = (1, 0); a = (0,8; 0,6); gato y perro normalizados
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['u=(1.5, 2)'],
      ['a=(0.6, 0.8)'],
      ['f=(1, 0)'],
      ['a=(0.8, 0.6)'],
      ['gato=(0.6, 0.8)', 'perro=(0.8, 0.6)'],
    ]);
  });

  it('ex00: los vectores fijos de ex00.2 a ex00.5 (menos u) son unitarios', () => {
    for (const q of ex00!.questions.slice(1)) {
      if (q.type !== 'manipular') continue;
      for (const v of q.plane.vectors.filter((v) => !v.movable)) {
        // contract: diseño de ex00: los vectores fijos de 2 a 5 son unitarios (0,6² + 0,8² = 1)
        expect(Math.hypot(v.x, v.y), `${q.id} ${v.id}`).toBeCloseTo(1, 9);
      }
    }
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: (−5/13, 12/13); (2/7, −3/7, 6/7); 1,2; opción «ficha por coseno» (índice 1); opción «las tres ordenan igual» (índice 0)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[-5 / 13, 12 / 13], 0.01],
      [[2 / 7, -3 / 7, 6 / 7], 0.01],
      [1.2, 0.01],
      1,
      0,
    ]);
  });

  it('ex01.1 y ex01.2: los vectores de la respuesta miden 1', () => {
    for (const i of [0, 1]) {
      const q = ex01!.questions[i]!;
      const answer = q.type === 'vector' ? q.answer : [];
      // contract: un vector normalizado tiene norma 1
      expect(Math.hypot(...answer), q.id).toBeCloseTo(1, 9);
    }
  });

  it('ex01.3: la distancia sale de √(2 − 2·0,28)', () => {
    const q = ex01!.questions[2]!;
    // contract: solution de ex01.3: ‖a − b‖² = 2 − 2·0,28 = 1,44, distancia 1,2
    expect(q.type === 'numero' ? q.answer : 0).toBeCloseTo(Math.sqrt(2 - 2 * 0.28), 9);
  });

  it('ex01.4: la opción correcta nombra al «manual» por producto escalar y a la «ficha» por coseno', () => {
    const q = ex01!.questions[3]!;
    const correct = q.type === 'opcion' ? q.options[q.correct]! : '';
    // contract: cálculo de la solution: producto escalar 4 (ficha) y 8 (manual); coseno 1 (ficha) y 0,71 (manual)
    expect(correct).toMatch(/producto escalar gana el «manual»; por coseno, la «ficha»/);
  });

  it('ex01.5: la opción correcta dice que las tres métricas ordenan igual', () => {
    const q = ex01!.questions[4]!;
    const correct = q.type === 'opcion' ? q.options[q.correct]! : '';
    // contract: con normas 1, coseno = producto interno y L2² = 2 − 2·producto interno: el mismo orden
    expect(correct).toMatch(/Las tres métricas ordenan igual/);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo común: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo común: una hoja que divide entre ‖v‖² (línea 1), una de código sin keepdims (línea 2) y una correcta (null); al menos una de código
    expect(normalizar.sheets.map(answerOf)).toEqual([1, 2, null]);
    expect(normalizar.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: dividir entre ‖v‖² y dividir E entre un array de normas sin keepdims
    const faulty = normalizar.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['v̂ = v / ‖v‖² = (6, −8) / 100', 'En = E / normas', null]);
  });
});

describe('banco de examen 2 del proyecto normalizar', () => {
  it('tiene tres entradas fijas del proyecto normalizar, con ids examen-2.*', () => {
    // contract: encargo de la Órbita 2: 3 entradas `{ project: 'normalizar', question }` con ids `examen-2.<tema>`
    expect(examen2Normalizar.map((e) => e.project)).toEqual([
      'normalizar',
      'normalizar',
      'normalizar',
    ]);
    expect(examen2Normalizar.map((e) => e.question.id)).toEqual([
      'examen-2.metricas',
      'examen-2.distancia-unitarios',
      'examen-2.filas',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2Normalizar) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada y los ids no chocan con los del proyecto', () => {
    // contract: encargo de la Órbita 2: la generada la añade otro paso; los ids son únicos en todo el juego
    expect(examen2Normalizar.some((e) => e.question.type === 'generada')).toBe(false);
    const projectIds = new Set(projectQuestions(normalizar).map((q) => q.id));
    expect(examen2Normalizar.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('las tres entradas son de tipos distintos', () => {
    // contract: encargo común: variedad de tipos en las entradas fijas
    expect(examen2Normalizar.map((e) => e.question.type)).toEqual(['opcion', 'numero', 'codigo']);
  });

  it('respuestas del banco', () => {
    const [metricas, distancia] = examen2Normalizar.map((e) => e.question);
    // contract: examen-2.metricas: distancias² 0,2 (A), 0,6 (C), 1,6 (B): el orden es A, C, B (índice 0)
    expect(metricas!.type === 'opcion' ? metricas!.options[metricas!.correct] : '').toBe(
      '$A$, $C$, $B$',
    );
    // contract: examen-2.distancia-unitarios: cos 120° = −0,5, distancia² = 2 − 2·(−0,5) = 3, distancia √3
    expect(distancia!.type === 'numero' ? [distancia!.answer, distancia!.tol] : []).toEqual([
      Math.sqrt(3),
      0.01,
    ]);
  });
});
