import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { dimensionAlta } from './dimension-alta';
import { examen2DimensionAlta } from './examen-2-dimension-alta';

defineProseTests('proyecto dimensión alta', projectQuestions(dimensionAlta));
defineProseTests(
  'banco examen-2 dimensión alta',
  examen2DimensionAlta.map((e) => e.question).filter((q): q is Question => q.type !== 'generada'),
);

describe('proyecto dimensión alta', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2: checkProject(dimensionAlta) devuelve la lista vacía
    expect(checkProject(dimensionAlta)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2: id dimension-alta, nombre «Dimensión alta», subtítulo «Donde casi todo es perpendicular»
    expect([dimensionAlta.id, dimensionAlta.name, dimensionAlta.sub]).toEqual([
      'dimension-alta',
      'Dimensión alta',
      'Donde casi todo es perpendicular',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo común de la Órbita 2: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(dimensionAlta.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(dimensionAlta.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(dimensionAlta.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón dimension-alta.exNN.k y dimension-alta.hoja.k', () => {
    // contract: encargo común de la Órbita 2: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(dimensionAlta).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `dimension-alta.ex0${e}.${k}`)),
      'dimension-alta.hoja.1',
      'dimension-alta.hoja.2',
      'dimension-alta.hoja.3',
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

type Placement = Record<string, [number, number]>;

describe('valores de la tabla del proyecto dimensión alta', () => {
  const [ex00, ex01, ex02] = dimensionAlta.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: perpendicular a u con w1 = 1; pareja perpendicular de norma 5 con a1 = 3; 45° con u y con v con w1 = 3; coseno 0,2 con w2 = 5; cosenos 0,6 y 0,8 con los dos ejes
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['angle(u,w)=90±0.01', 'x(w)=1±0.01'],
      ['dot(a,b)=0±0.01', 'norm(a)=5±0.01', 'norm(b)=5±0.01', 'x(a)=3±0.01'],
      ['angle(u,w)=45±0.01', 'angle(v,w)=45±0.01', 'x(w)=3±0.01'],
      ['cos(u,w)=0.2±0.02', 'y(w)=5±0.01'],
      ['cos(musica,deporte)=0.6±0.01', 'cos(musica,cocina)=0.8±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Placement][] = [
      // contract: solución escrita en la solution de cada pregunta: (1, −3); a (3, 4) y b (−4, 3) o (4, −3); (3, 3); (1, 5); (3, 4)
      [0, { w: [1, -3] }],
      [1, { a: [3, 4], b: [-4, 3] }],
      [1, { a: [3, 4], b: [4, -3] }],
      [1, { a: [3, -4], b: [4, 3] }],
      [2, { w: [3, 3] }],
      [3, { w: [1, 5] }],
      [4, { musica: [3, 4] }],
    ];
    for (const [i, vectors] of solved) {
      const q = ex00!.questions[i]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    const wrong: [number, Placement][] = [
      // contract: la intención didáctica de cada meta: (−1, 3) es perpendicular pero con w1 = −1; la pareja con producto escalar 24 no es perpendicular; (3, −3) forma 45° con u pero 135° con v; (0, 5) es perpendicular, no casi; (−1, 5) tiene coseno −0,196; (4, 3) tiene coseno 0,8 con «deporte» y 0,6 con «cocina»
      [0, { w: [-1, 3] }],
      [0, { w: [1, 3] }],
      [1, { a: [3, 4], b: [4, 3] }],
      [1, { a: [4, 3], b: [-3, 4] }],
      [2, { w: [3, -3] }],
      [2, { w: [2, 2] }],
      [3, { w: [0, 5] }],
      [3, { w: [-1, 5] }],
      [3, { w: [2, 5] }],
      [4, { musica: [4, 3] }],
      [4, { musica: [3, -4] }],
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

  it('ex00: rango 6 y rejilla de 1', () => {
    // contract: diseño de ex00: todas las soluciones caben en el rango 6 con rejilla de 1
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual(Array(5).fill([6, 1]));
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: u fijo en (3, 1), (4, 0) con v en (0, 4), (5, 0); «deporte» (5, 0) y «cocina» (0, 5); ex00.2 no tiene vectores fijos
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['u=(3, 1)'],
      [],
      ['u=(4, 0)', 'v=(0, 4)'],
      ['u=(5, 0)'],
      ['deporte=(5, 0)', 'cocina=(0, 5)'],
    ]);
  });

  it('ex00: cada plano declara su pareja y las lecturas de la tabla', () => {
    // contract: diseño de ex00: la pareja que se lee en cada plano y las lecturas del producto escalar, el coseno o el ángulo
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.pair, q.plane.readouts] : [])),
    ).toEqual([
      [
        ['u', 'w'],
        ['components', 'dot', 'angle'],
      ],
      [
        ['a', 'b'],
        ['components', 'norm', 'dot', 'angle'],
      ],
      [
        ['u', 'w'],
        ['components', 'dot', 'cos', 'angle'],
      ],
      [
        ['u', 'w'],
        ['components', 'norm', 'cos', 'angle'],
      ],
      [
        ['musica', 'deporte'],
        ['components', 'cos', 'angle'],
      ],
    ]);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: diseño de ex01: (0, 0, 2); 1/√400 = 0,05; 33/30 = 1,1; opción «muchos más que 1000» (índice 2); opción «a más de 8 desviaciones» (índice 3)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[0, 0, 2], 0.01],
      [0.05, 0.002],
      [1.1, 0.01],
      2,
      3,
    ]);
  });

  it('ex01.1: el vector de la respuesta es perpendicular a los dos y mide 2', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'vector') throw new Error('ex01.1 es de vector');
    const [w1, w2, w3] = q.answer as [number, number, number];
    // contract: enunciado de ex01.1: u = (1, 0, 0), v = (0, 1, 0); el producto escalar de w con ellos es w1 y w2; la norma de w es 2 y w3 > 0
    expect([w1, w2, Math.hypot(w1, w2, w3), w3 > 0]).toEqual([0, 0, 2, true]);
    // contract: el vector opuesto, (0, 0, −2), no cumple el enunciado (tercera componente positiva)
    expect(grade(q, { type: 'vector', value: [0, 0, -2] })).toBe(false);
    expect(grade(q, { type: 'vector', value: [0, 0, 2] })).toBe(true);
  });

  it('ex01.2 y ex01.3: las respuestas se recalculan', () => {
    const [, d, r] = ex01!.questions;
    // contract: cálculo de la solution: 1/√400 = 1/20
    expect(d!.type === 'numero' ? d!.answer : -1).toBeCloseTo(1 / Math.sqrt(400), 12);
    // contract: cálculo de la solution: la distancia mayor, 33, entre la menor, 30
    expect(r!.type === 'numero' ? r!.answer : -1).toBeCloseTo(33 / 30, 12);
    // contract: 1/400 = 0,0025 no es la respuesta: dividir entre d en lugar de entre su raíz no se da por bueno
    if (d!.type !== 'numero') throw new Error('ex01.2 es de número');
    expect(grade(d!, { type: 'numero', value: 1 / 400 })).toBe(false);
  });

  it('ex01.4: la opción correcta habla de muchos más vectores que 1000', () => {
    const q = ex01!.questions[3]!;
    const correct = q.type === 'opcion' ? q.options[q.correct]! : '';
    // contract: cálculo de la solution: 0,2 está a 6 desviaciones típicas de 0 en dimensión 1000, así que caben muchísimos más que 1000
    expect(correct).toMatch(/Muchos más que \$1000\$/);
    // contract: 0,2 · √1000 ≈ 6,3 desviaciones típicas
    expect(0.2 * Math.sqrt(1000)).toBeCloseTo(6.32, 2);
  });

  it('ex01.5: la opción correcta dice que son más de 8 desviaciones típicas', () => {
    const q = ex01!.questions[4]!;
    const correct = q.type === 'opcion' ? q.options[q.correct]! : '';
    // contract: cálculo de la solution: 0,3 · √768 ≈ 8,3 desviaciones típicas por encima del azar
    expect(correct).toMatch(/más de \$8\$ desviaciones típicas/);
    expect(0.3 * Math.sqrt(768)).toBeCloseTo(8.31, 2);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo común de la Órbita 2: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: toda pregunta que sortea usa la semilla 0', () => {
    for (const q of ex02!.questions) {
      if (q.type !== 'codigo') continue;
      // contract: encargo común de la Órbita 2: todo aleatorio con np.random.default_rng(0)
      expect(q.starter, q.id).toMatch(/np\.random\.default_rng\(0\)/);
      expect(q.reference, q.id).toMatch(/np\.random\.default_rng\(0\)/);
    }
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: diseño de las hojas: σ = 1/d en la segunda línea (índice 1), rng.random en la segunda línea (índice 1) y una correcta (null); una de código
    expect(dimensionAlta.sheets.map(answerOf)).toEqual([1, 1, null]);
    expect(dimensionAlta.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: la desviación típica 1/400 en vez de 1/√400 y los números de rng.random (todos positivos) en vez de rng.normal
    const faulty = dimensionAlta.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['σ = 1/400 = 0,0025', 'a = rng.random(1000)', null]);
  });

  it('hojas: frase final común, explain sin «no hay error» y una hoja correcta y una de código', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of dimensionAlta.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase va en el enunciado, no en el explain
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
    // contract: encargo de proyecto de la Órbita 1 y 2: al menos una hoja bien y una de código
    expect(dimensionAlta.sheets.some((s) => s.type === 'revision' && s.faultyLine === null)).toBe(
      true,
    );
    expect(dimensionAlta.sheets.some((s) => s.type === 'revision' && s.format === 'codigo')).toBe(
      true,
    );
  });

  it('hojas: los números de las líneas cuadran con los cálculos correctos', () => {
    const [h1, , h3] = dimensionAlta.sheets;
    const text = (s: typeof h1): string => (s!.type === 'revision' ? s!.lines.join('\n') : '');
    // contract: hoja 1: con σ = 1/√400 = 0,05, el coseno 0,08 son 1,6 desviaciones típicas (la solution), y con el σ erróneo, 32
    expect(0.08 / (1 / Math.sqrt(400))).toBeCloseTo(1.6, 12);
    expect(0.08 / (1 / 400)).toBeCloseTo(32, 12);
    expect(text(h1)).toMatch(/0,08 \/ 0,0025 = 32/);
    // contract: hoja 3 (correcta): √2000 ≈ 44,7 y 47 / 42 ≈ 1,12
    expect(Math.sqrt(2 * 1000)).toBeCloseTo(44.7, 1);
    expect(47 / 42).toBeCloseTo(1.12, 2);
    expect(text(h3)).toMatch(/√2000 ≈ 44,7/);
    expect(text(h3)).toMatch(/47 \/ 42 ≈ 1,12/);
  });
});

describe('banco de examen 2 del proyecto dimensión alta', () => {
  it('tiene tres entradas fijas del proyecto, con ids examen-2.*', () => {
    // contract: encargo común de la Órbita 2: 3 entradas `{ project: 'dimension-alta', question }` con ids `examen-2.<tema>`
    expect(examen2DimensionAlta.map((e) => e.project)).toEqual([
      'dimension-alta',
      'dimension-alta',
      'dimension-alta',
    ]);
    expect(examen2DimensionAlta.map((e) => e.question.id)).toEqual([
      'examen-2.maximo',
      'examen-2.concentracion',
      'examen-2.umbral',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2DimensionAlta) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada y los ids no chocan con los del proyecto', () => {
    // contract: encargo común de la Órbita 2: la generada la añade la sesión principal; los ids son únicos en todo el juego
    expect(examen2DimensionAlta.some((e) => e.question.type === 'generada')).toBe(false);
    const projectIds = new Set(projectQuestions(dimensionAlta).map((q) => q.id));
    expect(examen2DimensionAlta.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('variedad de tipos: número, opción y código', () => {
    // contract: encargo común de la Órbita 2: variedad de tipos en las tres entradas fijas
    expect(examen2DimensionAlta.map((e) => e.question.type)).toEqual([
      'numero',
      'opcion',
      'codigo',
    ]);
  });

  it('respuestas del banco', () => {
    const [maximo, concentracion] = examen2DimensionAlta.map((e) => e.question);
    // contract: examen-2.maximo: en ℝ⁵ caben 5 perpendiculares dos a dos, hay 4, caben 5 − 4 = 1 más
    expect(maximo!.type === 'numero' ? [maximo!.answer, maximo!.tol] : []).toEqual([5 - 4, 0]);
    // contract: examen-2.concentracion: el más cercano apenas se distingue del resto y el ruido puede cambiar el resultado
    expect(
      concentracion!.type === 'opcion' ? concentracion!.options[concentracion!.correct] : '',
    ).toMatch(/apenas se distingue del resto/);
  });
});
