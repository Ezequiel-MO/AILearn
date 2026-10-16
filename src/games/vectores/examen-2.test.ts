import { describe, expect, it } from 'vitest';
import { drawExam } from '../../content/exam';
import { resolve } from '../../content/generators';
import { defineProseTests } from '../../../tests/content/prose-helpers';
import { examen2 } from './examen-2';
import { vectores } from './index';

// Banco de examen de la Órbita 2 y lo que comparten las hojas de sus tres proyectos. Las entradas
// fijas tienen sus pruebas (prosa y Python) en el fichero de prueba de cada proyecto.

const orbit = vectores.orbits[2]!;

describe('banco examen-2', () => {
  it('es el banco de la Órbita 2', () => {
    // contract: index.ts: la Órbita 2 sortea su examen de examen2
    expect(orbit.examBank).toBe(examen2);
  });

  it('cada proyecto tiene una entrada generada con su generador', () => {
    const generated = examen2.flatMap((e) =>
      e.question.type === 'generada' ? [[e.project, e.question.generator]] : [],
    );
    // contract: examen-2.ts: una generada por proyecto (producto-rn, normalizar, coseno-azar)
    expect(generated).toEqual([
      ['rn-numpy', 'producto-rn'],
      ['normalizar', 'normalizar'],
      ['dimension-alta', 'coseno-azar'],
    ]);
  });

  it('con las semillas 1 a 30, un examen tiene 6 preguntas y dos de cada proyecto', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const exam = drawExam(orbit, seed);
      // contract: spec del motor: examen de 6 preguntas, 2 por proyecto con tres proyectos
      expect(exam).toHaveLength(6);
      expect(
        ['rn-numpy', 'normalizar', 'dimension-alta'].map(
          (p) => exam.filter((e) => e.project === p).length,
        ),
      ).toEqual([2, 2, 2]);
    }
  });
});

defineProseTests(
  'banco examen-2 (generadas, semillas 1 a 10)',
  examen2.flatMap((e) =>
    e.question.type === 'generada'
      ? Array.from({ length: 10 }, (_, i) => resolve(e.question as never, i + 1))
      : [],
  ),
);

describe('hojas de la Órbita 2', () => {
  const sheets = orbit.projects.flatMap((p) => p.sheets);
  // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
  const SHEET_END =
    'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';

  it('el enunciado de las nueve hojas acaba con la frase común de la Órbita 0 (R25)', () => {
    for (const s of sheets) expect(s.prompt.endsWith(SHEET_END), s.id).toBe(true);
  });

  it('ningún explain lleva «no hay error» ni «todo cuadra» (review-16 m7)', () => {
    // contract: review-16 m7: la frase va en el enunciado, no en el explain
    for (const s of sheets) expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
  });

  it('cada proyecto tiene una hoja correcta y una de código', () => {
    for (const p of orbit.projects) {
      // contract: encargo de proyecto de la Órbita 2: al menos una hoja bien y una de código
      expect(
        p.sheets.some((s) => s.type === 'revision' && s.faultyLine === null),
        p.id,
      ).toBe(true);
      expect(
        p.sheets.some((s) => s.type === 'revision' && s.format === 'codigo'),
        p.id,
      ).toBe(true);
    }
  });
});
