import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import type { Question } from '../../content/schema';
import { componentes } from './componentes';
import { launch } from './despegue';
import { toy } from './toy';

describe('proyecto componentes', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: tarea 15, brief: checkProject(componentes) devuelve la lista vacía
    expect(checkProject(componentes)).toEqual([]);
  });
});

describe('embeddings de juguete', () => {
  it('tienen los ocho vectores de la tabla', () => {
    // contract: tarea 15, tabla de embeddings de juguete (reglas comunes de contenido)
    expect(toy).toEqual({
      gato: [3, 4],
      perro: [4, 3],
      lobo: [4, -2],
      tigre: [3, -3],
      coche: [-3, 2],
      bici: [-2, 3],
      camión: [-4, -1],
      tractor: [-3, -3],
    });
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

describe('valores de la tabla del proyecto componentes', () => {
  const [ex00, ex01] = componentes.exercises;

  it('ex00: metas de manipular', () => {
    // contract: tarea 15, tabla de ex00 (metas x e y de cada pregunta; tolerancia 0,01)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['x(v)=4±0.01', 'y(v)=3±0.01'],
      ['x(v)=-2±0.01', 'y(v)=5±0.01'],
      ['x(v)=0±0.01', 'y(v)=-4±0.01'],
      ['x(u)=3±0.01', 'y(u)=1±0.01', 'x(v)=-3±0.01', 'y(v)=-1±0.01'],
      ['x(camion)=-4±0.01', 'y(camion)=-1±0.01'],
    ]);
  });

  it('ex00: rango 6 y rejilla de 1', () => {
    for (const q of ex00!.questions) {
      // contract: tarea 15, brief: ex00 con rango 6 y snap 1
      if (q.type === 'manipular') expect([q.plane.range, q.plane.snap]).toEqual([6, 1]);
    }
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tarea 15, tabla de ex01 (vector, numero, opcion, vector, opcion)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[-3, 2], 0],
      [-2, 0],
      '4',
      [[3, 4], 0],
      'Una lista de 768 números',
    ]);
  });

  it('hojas: línea errónea de cada una', () => {
    // contract: tarea 15, tabla de hojas (la segunda línea, ninguna, la primera)
    expect(componentes.sheets.map(answerOf)).toEqual([1, null, 0]);
  });

  it('identifica el proyecto como pide el brief', () => {
    // contract: tarea 15, brief: id componentes, nombre «Componentes», subtítulo
    expect([componentes.id, componentes.name, componentes.sub]).toEqual([
      'componentes',
      'Componentes',
      'Un vector es una flecha y es una lista',
    ]);
  });
});

describe('valores de la tabla del despegue', () => {
  it('tiene 10 preguntas con los tipos de la tabla', () => {
    // contract: tarea 15, tabla del despegue (tipos en orden)
    expect(launch.map((q) => q.type)).toEqual([
      'manipular',
      'opcion',
      'vector',
      'numero',
      'opcion',
      'manipular',
      'codigo',
      'codigo',
      'codigo',
      'opcion',
    ]);
  });

  it('respuestas y metas de la tabla', () => {
    // contract: tarea 15, tabla del despegue (metas, respuestas y opción correcta)
    expect(goalsOf(launch[0]!)).toEqual(['x(v)=3±0.01', 'y(v)=2±0.01']);
    expect(answerOf(launch[1]!)).toBe('$(-2, 3)$');
    expect(answerOf(launch[2]!)).toEqual([[4, -1], 0]);
    expect(answerOf(launch[3]!)).toEqual([-3, 0]);
    expect(answerOf(launch[4]!)).toBe(
      'Una lista de números que sitúa un texto como un punto, de modo que textos parecidos queden cerca',
    );
    expect(goalsOf(launch[5]!)).toEqual(['distance(perro,gato)=1±0.5']);
    expect(answerOf(launch[9]!)).toBe('`(3,)`');
  });

  it('las preguntas 2 y 10 tienen las opciones de la tabla', () => {
    // contract: tarea 15, tabla del despegue: opciones incorrectas de las preguntas 2 y 10
    const opts = (i: number): string[] => {
      const q = launch[i]!;
      return q.type === 'opcion' ? [...q.options].sort() : [];
    };
    expect(opts(1)).toEqual(['$(-2, -3)$', '$(-2, 3)$', '$(2, 3)$', '$(3, -2)$']);
    expect(opts(9)).toEqual(['`(1, 3)`', '`(3, 1)`', '`(3,)`', '`3`']);
  });

  it('el rango es 6 y la rejilla de 1 en los planos', () => {
    for (const q of launch) {
      // contract: tarea 15, brief: Despegue con rango 6 y snap 1 en los planos
      if ('plane' in q && q.plane) expect([q.plane.range, q.plane.snap]).toEqual([6, 1]);
    }
  });
});
