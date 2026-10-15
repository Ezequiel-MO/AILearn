import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { examen1Proyeccion } from './examen-1-proyeccion';
import { proyeccion } from './proyeccion';

defineProseTests('proyecto proyeccion', projectQuestions(proyeccion));

/** Las preguntas fijas del banco (ninguna es generada en este fichero). */
const bankQuestions = examen1Proyeccion
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('banco examen-1 proyeccion', bankQuestions);

describe('proyecto proyeccion', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1: checkProject(proyeccion) devuelve la lista vacía
    expect(checkProject(proyeccion)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1: id proyeccion, nombre «Proyección», subtítulo «La sombra de una flecha»
    expect([proyeccion.id, proyeccion.name, proyeccion.sub]).toEqual([
      'proyeccion',
      'Proyección',
      'La sombra de una flecha',
    ]);
  });

  it('tiene tres ejercicios de cinco preguntas, de los tipos del encargo, y tres hojas', () => {
    // contract: encargo de la Órbita 1: ex00 manipular, ex01 calcular, ex02 programar, cinco preguntas cada uno; tres hojas
    expect(proyeccion.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(proyeccion.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(proyeccion.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón del encargo', () => {
    // contract: encargo de la Órbita 1: ids proyeccion.ex00.1 … proyeccion.ex02.5 y proyeccion.hoja.1 … 3
    expect(projectQuestions(proyeccion).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((n) => `proyeccion.ex0${e}.${n}`)),
      'proyeccion.hoja.1',
      'proyeccion.hoja.2',
      'proyeccion.hoja.3',
    ]);
  });
});

const goalsOf = (q: Question): string[] =>
  q.type === 'manipular'
    ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
    : [];

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.options[q.correct];
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('valores de la tabla del proyecto proyeccion', () => {
  const [ex00, ex01, ex02] = proyeccion.exercises;

  it('ex00: metas de manipular', () => {
    // contract: encargo de la Órbita 1, ex00 (sombra de longitud dada, nula, negativa, con b inclinado, con una dirección de concepto); tolerancia 0,01
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['proj(a,b)=4±0.01'],
      ['x(a)=3±0.01', 'proj(a,b)=0±0.01'],
      ['y(a)=2±0.01', 'proj(a,b)=-3±0.01'],
      ['x(a)=2±0.01', 'proj(a,b)=2±0.01'],
      ['x(w)=-2±0.01', 'proj(w,d)=3±0.01'],
    ]);
  });

  it('ex00: los vectores fijos de la tabla (b o d), con su dirección', () => {
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    // contract: encargo de la Órbita 1, ex00: b horizontal (3, 0), (2, 3), (-2, 0), inclinado (3, 4) de norma 5; d = (0, 2)
    expect(fixed).toEqual([['b=(3, 0)'], ['b=(2, 3)'], ['b=(-2, 0)'], ['b=(3, 4)'], ['d=(0, 2)']]);
  });

  it('ex00: todas declaran la lectura de proyección con su pareja', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo de la Órbita 1: la lectura 'projection' dibuja la sombra de pair[0] sobre la recta de pair[1]
      expect(q.plane.readouts, q.id).toContain('projection');
      expect(q.plane.pair, q.id).toBeDefined();
    }
  });

  it('ex00: la pareja es (móvil, fijo): se proyecta lo móvil sobre lo fijo', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular' || !q.plane.pair) continue;
      const [first, second] = q.plane.pair;
      // contract: encargo de la Órbita 1: la sombra es la de pair[0] sobre la recta de pair[1]
      expect(q.plane.vectors.find((v) => v.id === first)!.movable, q.id).toBe(true);
      expect(q.plane.vectors.find((v) => v.id === second)!.movable, q.id).toBe(false);
    }
  });

  it('ex01: respuestas de calcular', () => {
    // contract: encargo de la Órbita 1, ex01: 30/5 = 6; (3, 3); (4, -2); la opción «No cambia…»; (1, 1) (cuentas del solution)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [6, 0],
      [[3, 3], 0],
      [[4, -2], 0],
      'No cambia: solo importa la dirección de $\\vec{b}$',
      [[1, 1], 0],
    ]);
  });

  it('ex01: tipos de pregunta', () => {
    // contract: encargo de la Órbita 1, ex01: escalar numérico, tres de tipo vector y una opción
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'numero',
      'vector',
      'vector',
      'opcion',
      'vector',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1, ex02: cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: la referencia de las funciones las define con el nombre del encargo', () => {
    const refs = ex02!.questions.map((q) => (q.type === 'codigo' ? q.reference : ''));
    // contract: encargo de la Órbita 1: proyeccion_escalar(a, b) y proyeccion(a, b), y la descomposición en paralela y perpendicular
    expect(refs[0]).toContain('def proyeccion_escalar(a, b):');
    expect(refs[1]).toContain('def proyeccion(a, b):');
    expect(refs[2]).toContain('def descomponer(a, b):');
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1, hojas: b·b → norma (línea 2), a·a en vez de b·b (línea 1), una correcta (null); al menos una de código
    expect(proyeccion.sheets.map(answerOf)).toEqual([2, 1, null]);
    expect(proyeccion.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: las líneas erróneas de la tabla', () => {
    const faulty = proyeccion.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    // contract: encargo de la Órbita 1, hojas: dividir entre la norma en vez de entre b·b, y proyectar b sobre a (a·a)
    expect(faulty).toEqual(['k = (a @ b) / np.linalg.norm(b)', 'a · a = 3·3 + 1·1 = 10', null]);
  });
});

describe('banco examen-1 proyeccion', () => {
  it('tiene tres entradas fijas del proyecto, con ids examen-1.<tema>', () => {
    // contract: encargo de la Órbita 1: tres entradas fijas { project: 'proyeccion', question }, ids examen-1.<tema>
    expect(examen1Proyeccion.map((e) => e.project)).toEqual(Array(3).fill('proyeccion'));
    expect(examen1Proyeccion.map((e) => e.question.id)).toEqual([
      'examen-1.proy-escalar',
      'examen-1.proy-vector',
      'examen-1.sesgo',
    ]);
  });

  it('pasa el esquema de entrada de banco', () => {
    for (const entry of examen1Proyeccion) {
      const parsed = bankEntrySchema.safeParse(entry);
      // contract: encargo de la Órbita 1: las tres entradas del banco validan con el esquema
      expect(parsed.success, entry.question.id).toBe(true);
    }
  });

  it('no repite ids de las preguntas del proyecto', () => {
    const own = new Set(projectQuestions(proyeccion).map((q) => q.id));
    // contract: encargo de la Órbita 1: los ids del banco son únicos en todo el juego
    expect(examen1Proyeccion.filter((e) => own.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    // contract: encargo de la Órbita 1, banco: (1·3 + (-7)·4)/5 = -5; (-4/2)·(1, -1) = (-2, 2); producto escalar 0
    expect(bankQuestions.map(answerOf)).toEqual([
      [-5, 0],
      [[-2, 2], 0],
      '$0$: lo que queda es ortogonal a $\\vec{d}$',
    ]);
  });

  it('el banco no tiene preguntas de código ni de manipular', () => {
    // contract: encargo de la Órbita 1: preguntas cortas de los tipos de examen-0 y sin dibujo que haya que construir
    expect(bankQuestions.map((q) => q.type)).toEqual(['numero', 'vector', 'opcion']);
  });
});
