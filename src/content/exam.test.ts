import { describe, expect, it } from 'vitest';
import { drawExam, projectsToRevise, sameExam, type ExamQuestion } from './exam';
import type { BankEntry, Orbit, NumeroQ, Project } from './schema';

const numero = (id: string, answer: number): NumeroQ => ({
  type: 'numero',
  id,
  prompt: `Enunciado ${id}`,
  hints: [],
  explain: '',
  solution: '',
  answer,
  tol: 0,
});

const project = (id: string): Project => ({
  id,
  name: `Proyecto ${id}`,
  sub: '',
  exercises: (['manipular', 'calcular', 'programar'] as const).map((kind) => ({
    kind,
    questions: Array.from({ length: 5 }, (_, i) => numero(`${id}-${kind}-${i}`, i)),
  })),
  sheets: Array.from({ length: 3 }, (_, i) => ({
    type: 'revision' as const,
    id: `${id}-hoja-${i}`,
    prompt: '',
    hints: [],
    explain: '',
    solution: '',
    format: 'texto' as const,
    lines: ['a'],
    faultyLine: null,
  })),
});

const entries = (projectId: string, count: number): BankEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    project: projectId,
    question: numero(`${projectId}${i}`, i),
  }));

const orbit = (ids: string[], perProject = 4): Orbit => ({
  name: 'Prueba',
  projects: ids.map(project),
  examBank: ids.flatMap((id) => entries(id, perProject)),
});

const countBy = (exam: ExamQuestion[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const e of exam) out[e.project] = (out[e.project] ?? 0) + 1;
  return out;
};

describe('drawExam', () => {
  it('3 proyectos con 4 entradas: 6 preguntas, 2 por proyecto, ids distintos', () => {
    const exam = drawExam(orbit(['a', 'b', 'c']), 1);
    expect(exam).toHaveLength(6); // contract: brief, EXAM_SIZE = 6
    expect(countBy(exam)).toEqual({ a: 2, b: 2, c: 2 }); // contract: brief, 2 por proyecto
    expect(new Set(exam.map((e) => e.question.id)).size).toBe(6); // contract: brief, ids distintos
  });

  it('cada pregunta pertenece al proyecto con el que viene etiquetada', () => {
    const exam = drawExam(orbit(['a', 'b', 'c']), 2);
    for (const e of exam) expect(e.question.id.startsWith(e.project)).toBe(true); // contract: el banco de prueba nombra ids por proyecto
  });

  it('misma órbita y misma semilla dan el mismo examen, en el mismo orden', () => {
    const c = orbit(['a', 'b', 'c']);
    expect(drawExam(c, 7)).toEqual(drawExam(c, 7)); // contract: brief, determinista
  });

  it('semillas 1, 2 y 3: tres exámenes distintos entre sí', () => {
    const c = orbit(['a', 'b', 'c']);
    const [e1, e2, e3] = [1, 2, 3].map((s) => drawExam(c, s));
    expect(sameExam(e1!, e2!)).toBe(false); // contract: brief, tres exámenes distintos
    expect(sameExam(e1!, e3!)).toBe(false); // contract: brief
    expect(sameExam(e2!, e3!)).toBe(false); // contract: brief
  });

  it('el orden final está barajado con la semilla (no siempre agrupado por proyecto)', () => {
    const c = orbit(['a', 'b', 'c']);
    const grouped = [1, 2, 3, 4, 5, 6, 7, 8].filter((s) => {
      const ps = drawExam(c, s).map((e) => e.project);
      return ps.join('') === [...ps].sort().join('');
    });
    expect(grouped.length).toBeLessThan(8); // contract: brief, se baraja con la semilla
  });

  it('2 proyectos: reparto 3 y 3', () => {
    expect(countBy(drawExam(orbit(['a', 'b']), 1))).toEqual({ a: 3, b: 3 }); // contract: brief
  });

  it('4 proyectos: reparto 2, 2, 1, 1', () => {
    expect(countBy(drawExam(orbit(['a', 'b', 'c', 'd']), 1))).toEqual({
      a: 2,
      b: 2,
      c: 1,
      d: 1,
    }); // contract: brief
  });

  it('un proyecto con menos entradas de las que le tocan lanza un error que lo nombra', () => {
    const c = orbit(['a', 'b', 'c']);
    c.examBank = c.examBank.filter((e) => e.project !== 'b' || e.question.id === 'b0');
    expect(() => drawExam(c, 1)).toThrow(/b/); // contract: brief, error que nombra el proyecto
    expect(() => drawExam(c, 1)).toThrow(/proyecto/i); // contract: brief, el error dice que falta en un proyecto
  });

  it('una órbita sin proyectos lanza un error', () => {
    // contract: brief, una órbita sin proyectos no tiene reparto posible y lanza
    expect(() => drawExam({ name: 'Vacío', projects: [], examBank: [] }, 1)).toThrow();
  });

  it('las entradas generadas se resuelven a preguntas concretas, deterministas y con el id de la entrada', () => {
    const c = orbit(['a', 'b', 'c'], 2);
    c.examBank = c.examBank.map((e, i) =>
      i % 2 === 0
        ? {
            project: e.project,
            question: { type: 'generada', id: `${e.project}-gen`, generator: 'suma', params: {} },
          }
        : e,
    );
    const exam = drawExam(c, 4);
    const gen = exam.filter((e) => e.question.id.endsWith('-gen'));
    expect(gen.length).toBeGreaterThan(0);
    for (const g of gen) expect(g.question.type).toBe('vector'); // contract: el generador suma da un vector
    expect(drawExam(c, 4)).toEqual(exam); // contract: brief, determinista
  });

  it('una entrada generada da enunciados distintos con semillas de examen distintas', () => {
    const c: Orbit = {
      name: 'Gen',
      projects: [project('a')],
      examBank: Array.from({ length: 6 }, (_, i) => ({
        project: 'a',
        question: {
          type: 'generada' as const,
          id: `g${i}`,
          generator: 'suma',
          params: {},
        },
      })),
    };
    const prompts = new Set(
      Array.from({ length: 20 }, (_, s) => drawExam(c, s + 1)[0]!.question.prompt),
    );
    expect(prompts.size).toBeGreaterThan(5); // contract: la semilla del examen cambia los números
  });

  it('un generador inexistente en el banco hace fallar el sorteo con su nombre', () => {
    const c: Orbit = {
      name: 'Mal',
      projects: [project('a')],
      examBank: Array.from({ length: 6 }, (_, i) => ({
        project: 'a',
        question: { type: 'generada' as const, id: `g${i}`, generator: 'fantasma', params: {} },
      })),
    };
    expect(() => drawExam(c, 1)).toThrow(/fantasma/);
  });
});

describe('sameExam', () => {
  const q = (project: string, id: string, answer = 1): ExamQuestion => ({
    project,
    question: numero(id, answer),
  });

  it('ignora el orden', () => {
    expect(sameExam([q('a', 'x'), q('b', 'y')], [q('b', 'y'), q('a', 'x')])).toBe(true); // contract: nota de la sesión principal, conjunto sin orden
  });

  it('distingue por id', () => {
    expect(sameExam([q('a', 'x')], [q('a', 'z')])).toBe(false); // contract: nota de la sesión principal, id
  });

  it('distingue por respuesta con el mismo id', () => {
    expect(sameExam([q('a', 'x', 1)], [q('a', 'x', 2)])).toBe(false); // contract: nota, respuesta
  });

  it('distingue por enunciado con el mismo id', () => {
    const other = q('a', 'x');
    other.question = { ...other.question, prompt: 'Otro' };
    expect(sameExam([q('a', 'x')], [other])).toBe(false); // contract: nota, enunciado
  });

  it('distingue por tamaño', () => {
    expect(sameExam([q('a', 'x')], [q('a', 'x'), q('a', 'y')])).toBe(false); // contract: nota, conjunto
  });
});

describe('projectsToRevise', () => {
  const c = orbit(['a', 'b', 'c']);
  const exam: ExamQuestion[] = [
    { project: 'c', question: numero('c0', 0) },
    { project: 'b', question: numero('b0', 0) },
    { project: 'a', question: numero('a0', 0) },
    { project: 'a', question: numero('a1', 0) },
    { project: 'c', question: numero('c1', 0) },
    { project: 'b', question: numero('b1', 0) },
  ];

  it('fallos en preguntas de a y c: [a, c], en el orden de la órbita y sin repetir', () => {
    const correct = [false, true, false, true, false, true]; // c0, a0 y c1 falladas
    expect(projectsToRevise(exam, correct, c)).toEqual(['a', 'c']); // contract: brief
  });

  it('sin la lista de la órbita, usa el orden de aparición en el examen y no repite', () => {
    const correct = [false, true, false, true, false, true];
    expect(projectsToRevise(exam, correct)).toEqual(['c', 'a']); // contract: contrato de dos argumentos del brief
  });

  it('sin fallos: lista vacía', () => {
    expect(projectsToRevise(exam, [true, true, true, true, true, true], c)).toEqual([]); // contract: brief
  });

  it('un examen y un vector de aciertos de distinta longitud lanza un error', () => {
    expect(() => projectsToRevise(exam, [true])).toThrow(); // contract: contrato de dos argumentos del brief, un acierto por pregunta
  });
});
