import { describe, expect, it } from 'vitest';
import { bankEntrySchema } from '../../content/schema';
import type { Question } from '../../content/schema';
import { checkProject } from '../../content/validate';
import {
  defineProseTests,
  projectQuestions,
  proseTexts,
} from '../../../tests/content/prose-helpers';
import { examen1ProductoEscalar } from './examen-1-producto-escalar';
import { productoEscalar } from './producto-escalar';

defineProseTests('proyecto producto-escalar', projectQuestions(productoEscalar));
defineProseTests(
  'banco examen-1 producto-escalar',
  examen1ProductoEscalar.map((e) => e.question as Question),
);

describe('proyecto producto-escalar', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1, reglas comunes: checkProject(productoEscalar) devuelve la lista vacía
    expect(checkProject(productoEscalar)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1: id producto-escalar, nombre «Producto escalar», subtítulo «Cuánto van en la misma dirección»
    expect([productoEscalar.id, productoEscalar.name, productoEscalar.sub]).toEqual([
      'producto-escalar',
      'Producto escalar',
      'Cuánto van en la misma dirección',
    ]);
  });

  it('tiene tres ejercicios de cinco preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1: ex00 manipular, ex01 calcular, ex02 programar, 5 preguntas cada uno; tres hojas
    expect(productoEscalar.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(productoEscalar.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(productoEscalar.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón producto-escalar.exNN.k y producto-escalar.hoja.k', () => {
    // contract: encargo de la Órbita 1: ids <id>.ex00.1…<id>.ex02.5 y <id>.hoja.1…<id>.hoja.3
    expect(projectQuestions(productoEscalar).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `producto-escalar.ex0${e}.${k}`)),
      'producto-escalar.hoja.1',
      'producto-escalar.hoja.2',
      'producto-escalar.hoja.3',
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

describe('valores de la tabla del proyecto producto-escalar', () => {
  const [ex00, ex01, ex02] = productoEscalar.exercises;

  it('ex00: metas de manipular', () => {
    // contract: tabla de contenido de producto-escalar, ex00 (producto escalar 10, 0 con ángulo 90, -6, 6 a altura 5, 24 frente a «gato»)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['dot(u,v)=10±0.01'],
      ['dot(u,v)=0±0.01', 'angle(u,v)=90±0.01'],
      ['dot(u,v)=-6±0.01'],
      ['dot(u,v)=6±0.01', 'y(v)=5±0.01'],
      ['dot(gato,doc)=24±0.01'],
    ]);
  });

  it('ex00: rango 6 y rejilla de 1', () => {
    // contract: tabla de contenido de producto-escalar, ex00 (columna «Rango, snap»)
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual(Array(5).fill([6, 1]));
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: tabla de contenido de producto-escalar, ex00 (u fijo en (2, 1), (3, 2), (3, 1), (2, 0); «gato» fijo en el mapa de juguete)
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['u=(2, 1)'],
      ['u=(3, 2)'],
      ['u=(3, 1)'],
      ['u=(2, 0)'],
      ['gato=(3, 4)'],
    ]);
  });

  it('ex00: cada plano declara la lectura del producto escalar sobre su pareja', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo de la Órbita 1: las lecturas con pair llevan el par; aquí todas enseñan el producto escalar
      expect(q.plane.readouts, q.id).toContain('dot');
      expect(q.plane.pair, q.id).toHaveLength(2);
    }
  });

  it('ex00.2: el ángulo recto excluye el vector nulo (la meta de ángulo lo rechaza)', () => {
    const q = ex00!.questions[1]!;
    // contract: decisión didáctica del encargo: (0, 0) daría producto escalar 0 sin ser perpendicular; el ángulo con NaN no cumple la meta
    expect(q.type === 'manipular' ? q.goals.map((g) => g.metric) : []).toContain('angle');
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de contenido de producto-escalar, ex01 (tres números, una opción de signo y una opción de búsqueda)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [-7, 0],
      'Agudo, menor de $90^\\circ$',
      [25, 0],
      [-11, 0],
      'B, porque es mucho más largo: el producto escalar premia también la longitud, no solo la dirección',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: tabla de contenido de producto-escalar, ex02: cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: tabla de hojas (a * b en la tercera línea; signo mal en la segunda; correcta; formatos codigo, texto, texto)
    expect(productoEscalar.sheets.map(answerOf)).toEqual([2, 1, null]);
    expect(productoEscalar.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: las líneas de la tabla', () => {
    // contract: tabla de hojas (líneas literales)
    expect(productoEscalar.sheets.map((s) => (s.type === 'revision' ? s.lines : []))).toEqual([
      ['a = np.array([2, 3, 1])', 'b = np.array([4, -1, 5])', 'p = a * b'],
      [
        'u · v = 2·(−1) + (−3)·(−1)',
        '= −2 − 3 = −5',
        'Como −5 < 0, el ángulo entre u y v es obtuso',
      ],
      [
        'u · v = 4·1 + (−2)·2',
        '= 4 − 4 = 0',
        'Como el producto escalar es 0, u y v son ortogonales',
      ],
    ]);
  });

  it('las tres hojas cierran su explain igual: la frase «no hay error» no sale en ninguna', () => {
    const has = productoEscalar.sheets.map((s) => /no hay error/i.test(s.explain));
    // contract: review-16 m7 (la frase solo en la hoja sin error la delata)
    expect(has).toEqual([false, false, false]);
  });
});

describe('banco examen-1 de producto-escalar', () => {
  it('tiene tres entradas fijas del proyecto, con el esquema de banco', () => {
    // contract: encargo de la Órbita 1: tres entradas fijas { project: 'producto-escalar', question }
    expect(examen1ProductoEscalar).toHaveLength(3);
    for (const e of examen1ProductoEscalar) {
      expect(e.project).toBe('producto-escalar');
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
  });

  it('los ids son examen-1.<tema> y no se repiten con los del proyecto', () => {
    const ids = examen1ProductoEscalar.map((e) => e.question.id);
    // contract: encargo de la Órbita 1: ids examen-1.<tema>, únicos en todo el juego
    expect(ids.every((id) => id.startsWith('examen-1.'))).toBe(true);
    expect(new Set(ids).size).toBe(3);
    const own = new Set(projectQuestions(productoEscalar).map((q) => q.id));
    expect(ids.filter((id) => own.has(id))).toEqual([]);
  });

  it('ninguna es generada y sus respuestas son las de la tabla', () => {
    const qs = examen1ProductoEscalar.map((e) => e.question);
    // contract: encargo de la Órbita 1: las entradas generadas no son de este paso
    expect(qs.map((q) => q.type)).toEqual(['numero', 'opcion', 'codigo']);
    // contract: cálculo a mano: 2·3 + (−1)·6 + 4·(−1) = −4
    expect(qs[0]!.type === 'numero' ? qs[0]!.answer : null).toBe(-4);
    // contract: cálculo a mano: (3, −1)·(1, 3) = 3 − 3 = 0, el único par con producto escalar 0
    expect(qs[1]!.type === 'opcion' ? qs[1]!.options[qs[1]!.correct] : null).toBe(
      '$(3, -1)$ y $(1, 3)$',
    );
  });

  it('sus textos pasan por proseTexts (no vacíos)', () => {
    for (const e of examen1ProductoEscalar) {
      if (e.question.type === 'generada') continue;
      // contract: encargo de la Órbita 1: enunciado, pistas, explain y solution presentes
      expect(proseTexts(e.question).every((t) => t.text.trim() !== '')).toBe(true);
    }
  });
});
