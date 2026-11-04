import { describe, expect, it } from 'vitest';
import { drawExam } from '../../content/exam';
import { resolve } from '../../content/generators';
import { defineProseTests } from '../../../tests/content/prose-helpers';
import { examen0 } from './examen-0';
import { gradiente } from './index';

// Banco de examen de la Órbita 0 del juego 3 y lo que comparten las hojas de sus tres proyectos.
// Las entradas fijas tienen sus pruebas (prosa y Python) en el fichero de cada proyecto.

const orbit = gradiente.orbits[0]!;
const PROJECTS = ['derivada-pendiente', 'reglas-derivacion', 'minimos'];

describe('gradiente: banco examen-0', () => {
  it('es el banco de la Órbita 0 «La pendiente»', () => {
    // contract: brief-orbita-0.md, E.2: la Órbita 0 del juego 3 se llama «La pendiente» y sortea de examen0
    expect(orbit.name).toBe('La pendiente');
    expect(orbit.examBank).toBe(examen0);
  });

  it('tiene los tres proyectos en orden', () => {
    // contract: src/games/roadmap.ts: «La pendiente» (Derivada como pendiente, Reglas de derivación, Mínimos)
    expect(orbit.projects.map((p) => p.id)).toEqual(PROJECTS);
  });

  it('tiene 12 entradas: por proyecto, tres fijas (una de código) y una generada', () => {
    // contract: brief-orbita-0.md, A a C («Banco: 3 fijas») y E.1 (una generada por proyecto), 12 en total
    expect(examen0).toHaveLength(12);
    const generated = examen0.flatMap((e) =>
      e.question.type === 'generada' ? [[e.project, e.question.generator]] : [],
    );
    // contract: brief-orbita-0.md, D y E.1: pendiente-secante, derivada-polinomio y minimo-perdida
    expect(generated).toEqual([
      ['derivada-pendiente', 'pendiente-secante'],
      ['reglas-derivacion', 'derivada-polinomio'],
      ['minimos', 'minimo-perdida'],
    ]);
    for (const p of PROJECTS) {
      const types = examen0.filter((e) => e.project === p).map((e) => e.question.type);
      // contract: brief-orbita-0.md, A a C: 3 fijas por proyecto, una de ellas una `codigo` corta, y la generada
      expect(types, p).toHaveLength(4);
      expect(
        types.filter((t) => t === 'codigo'),
        p,
      ).toHaveLength(1);
      expect(
        types.filter((t) => t === 'generada'),
        p,
      ).toHaveLength(1);
    }
  });

  it('los ids del banco son únicos, siguen el patrón examen-0.<tema> y no chocan con los de proyecto', () => {
    const ids = examen0.map((e) => e.question.id);
    // contract: brief-orbita-0.md, «Lo común a A, B y C»: ids `examen-0.<tema>`, únicos en todo el juego
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^examen-0\.[a-z0-9-]+$/);
    const projectIds = new Set(
      gradiente.orbits.flatMap((o) =>
        o.projects.flatMap((p) => p.exercises.flatMap((x) => x.questions.map((q) => q.id))),
      ),
    );
    for (const id of ids) expect(projectIds.has(id), id).toBe(false);
  });

  it('con las semillas 1 a 30, un examen tiene 6 preguntas y dos de cada proyecto', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const exam = drawExam(orbit, seed);
      // contract: spec del motor: examen de 6 preguntas, 2 por proyecto con tres proyectos
      expect(exam).toHaveLength(6);
      expect(PROJECTS.map((p) => exam.filter((e) => e.project === p).length)).toEqual([2, 2, 2]);
    }
  });
});

defineProseTests(
  'gradiente: banco examen-0 (generadas, semillas 1 a 10)',
  examen0.flatMap((e) =>
    e.question.type === 'generada'
      ? Array.from({ length: 10 }, (_, i) => resolve(e.question as never, i + 1))
      : [],
  ),
);

describe('gradiente: hojas de la Órbita 0', () => {
  const sheets = orbit.projects.flatMap((p) => p.sheets);
  // contract: R25 del juego 1 (prosa.test.ts): la misma frase final en todas las hojas
  const SHEET_END =
    'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';

  it('el enunciado de las nueve hojas acaba con la frase común (R25)', () => {
    // contract: brief-orbita-0.md, «Lo común a A, B y C»: 3 hojas «Caza el error» por proyecto
    expect(sheets).toHaveLength(9);
    for (const s of sheets) expect(s.prompt.endsWith(SHEET_END), s.id).toBe(true);
  });

  it('ningún explain lleva «no hay error» ni «todo cuadra»', () => {
    // contract: review-16 m7 del juego 1: la frase va en el enunciado, no en el explain
    for (const s of sheets) expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
  });
});
