import { describe, expect, it } from 'vitest';
import { drawExam } from '../../content/exam';
import { resolve } from '../../content/generators';
import { defineProseTests } from '../../../tests/content/prose-helpers';
import { examen2 } from './examen-2';
import { matrices } from './index';

// Banco de examen de la Órbita 2 del juego de matrices y lo que comparten las hojas de sus tres
// proyectos. Las entradas fijas tienen sus pruebas (prosa y Python) en el fichero de cada proyecto.

const orbit = matrices.orbits[2]!;

describe('matrices: banco examen-2', () => {
  it('es el banco de la Órbita 2 «Direcciones propias»', () => {
    // contract: index.ts: la Órbita 2 del juego de matrices se llama «Direcciones propias» y sortea de examen2
    expect(orbit.name).toBe('Direcciones propias');
    expect(orbit.examBank).toBe(examen2);
  });

  it('tiene los tres proyectos en orden', () => {
    // contract: README del juego 2: «Direcciones propias» (autovectores, simetricas, pca)
    expect(orbit.projects.map((p) => p.id)).toEqual(['autovectores', 'simetricas', 'pca']);
  });

  it('cada proyecto tiene tres fijas y una generada con su generador', () => {
    const generated = examen2.flatMap((e) =>
      e.question.type === 'generada' ? [[e.project, e.question.generator]] : [],
    );
    // contract: examen-2.ts: una generada por proyecto (autovalores, covarianza, varianza-explicada)
    expect(generated).toEqual([
      ['autovectores', 'autovalores'],
      ['simetricas', 'covarianza'],
      ['pca', 'varianza-explicada'],
    ]);
    for (const p of orbit.projects) {
      // contract: patrón del juego 1 y de la Órbita 0: cuatro entradas por proyecto en el banco
      expect(
        examen2.filter((e) => e.project === p.id),
        p.id,
      ).toHaveLength(4);
    }
  });

  it('los ids del banco son únicos y siguen el patrón examen-2.<tema>', () => {
    const ids = examen2.map((e) => e.question.id);
    // contract: examen-2.ts: ids `examen-2.<tema>`, únicos en todo el juego
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^examen-2\.[a-z0-9-]+$/);
  });

  it('con las semillas 1 a 30, un examen tiene 6 preguntas y dos de cada proyecto', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const exam = drawExam(orbit, seed);
      // contract: spec del motor: examen de 6 preguntas, 2 por proyecto con tres proyectos
      expect(exam).toHaveLength(6);
      expect(
        ['autovectores', 'simetricas', 'pca'].map(
          (p) => exam.filter((e) => e.project === p).length,
        ),
      ).toEqual([2, 2, 2]);
    }
  });
});

defineProseTests(
  'matrices: banco examen-2 (generadas, semillas 1 a 10)',
  examen2.flatMap((e) =>
    e.question.type === 'generada'
      ? Array.from({ length: 10 }, (_, i) => resolve(e.question as never, i + 1))
      : [],
  ),
);

describe('matrices: hojas de la Órbita 2', () => {
  const sheets = orbit.projects.flatMap((p) => p.sheets);
  // contract: R25 del juego 1 (prosa.test.ts): la misma frase final en todas las hojas
  const SHEET_END =
    'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';

  it('el enunciado de las nueve hojas acaba con la frase común (R25)', () => {
    for (const s of sheets) expect(s.prompt.endsWith(SHEET_END), s.id).toBe(true);
  });

  it('ningún explain lleva «no hay error» ni «todo cuadra»', () => {
    // contract: review-16 m7 del juego 1: la frase va en el enunciado, no en el explain
    for (const s of sheets) expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
  });

  it('cada proyecto tiene una hoja correcta y una de código', () => {
    for (const p of orbit.projects) {
      // contract: encargo común de la Órbita 2 de matrices: una hoja bien y al menos una de código
      expect(
        p.sheets.filter((s) => s.type === 'revision' && s.faultyLine === null),
        p.id,
      ).toHaveLength(1);
      expect(
        p.sheets.some((s) => s.type === 'revision' && s.format === 'codigo'),
        p.id,
      ).toBe(true);
    }
  });
});
