import { describe, expect, it } from 'vitest';
import { drawExam } from '../../content/exam';
import { resolve } from '../../content/generators';
import { defineProseTests } from '../../../tests/content/prose-helpers';
import { examen3 } from './examen-3';
import { matrices } from './index';

// Banco de examen de la Órbita 3 del juego de matrices y lo que comparten las hojas de sus tres
// proyectos. Las entradas fijas tienen sus pruebas (prosa y Python) en el fichero de cada proyecto.

const orbit = matrices.orbits[3]!;

describe('matrices: banco examen-3', () => {
  it('es el banco de la Órbita 3 «Descomponer y aproximar»', () => {
    // contract: index.ts: la Órbita 3 del juego de matrices se llama «Descomponer y aproximar» y sortea de examen3
    expect(orbit.name).toBe('Descomponer y aproximar');
    expect(orbit.examBank).toBe(examen3);
  });

  it('tiene los tres proyectos en orden', () => {
    // contract: src/games/roadmap.ts: «Descomponer y aproximar» (SVD, Rango bajo y LoRA, Atención como matriz)
    expect(orbit.projects.map((p) => p.id)).toEqual(['svd', 'rango-bajo', 'atencion']);
  });

  it('tiene 12 entradas: por proyecto, tres fijas (opción, número, código) y una generada', () => {
    // contract: encargo común de la Órbita 3 de matrices: 3 fijas por proyecto más 1 generada, 12 en total
    expect(examen3).toHaveLength(12);
    const generated = examen3.flatMap((e) =>
      e.question.type === 'generada' ? [[e.project, e.question.generator]] : [],
    );
    // contract: traspaso de la Órbita 3 (2026-11-02): una generada por proyecto (valores-singulares, parametros-lora, puntuacion-atencion)
    expect(generated).toEqual([
      ['svd', 'valores-singulares'],
      ['rango-bajo', 'parametros-lora'],
      ['atencion', 'puntuacion-atencion'],
    ]);
    for (const p of orbit.projects) {
      const types = examen3.filter((e) => e.project === p.id).map((e) => e.question.type);
      // contract: encargo común de la Órbita 3 de matrices: un `opcion`, un `numero` o `vector`, un `codigo` y la generada
      expect(types, p.id).toHaveLength(4);
      expect(
        types.filter((t) => t === 'opcion'),
        p.id,
      ).toHaveLength(1);
      expect(
        types.filter((t) => t === 'numero' || t === 'vector'),
        p.id,
      ).toHaveLength(1);
      expect(
        types.filter((t) => t === 'codigo'),
        p.id,
      ).toHaveLength(1);
      expect(
        types.filter((t) => t === 'generada'),
        p.id,
      ).toHaveLength(1);
    }
  });

  it('los ids del banco son únicos, siguen el patrón examen-3.<tema> y no chocan con los de proyecto', () => {
    const ids = examen3.map((e) => e.question.id);
    // contract: encargo común de la Órbita 3 de matrices: ids `examen-3.<tema>`, únicos en todo el juego
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^examen-3\.[a-z0-9-]+$/);
    const projectIds = new Set(
      matrices.orbits.flatMap((o) =>
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
      expect(
        ['svd', 'rango-bajo', 'atencion'].map((p) => exam.filter((e) => e.project === p).length),
      ).toEqual([2, 2, 2]);
    }
  });
});

defineProseTests(
  'matrices: banco examen-3 (generadas, semillas 1 a 10)',
  examen3.flatMap((e) =>
    e.question.type === 'generada'
      ? Array.from({ length: 10 }, (_, i) => resolve(e.question as never, i + 1))
      : [],
  ),
);

describe('matrices: hojas de la Órbita 3', () => {
  const sheets = orbit.projects.flatMap((p) => p.sheets);
  // contract: R25 del juego 1 (prosa.test.ts): la misma frase final en todas las hojas
  const SHEET_END =
    'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';

  it('el enunciado de las nueve hojas acaba con la frase común (R25)', () => {
    // contract: encargo común de la Órbita 3 de matrices: 3 hojas por proyecto
    expect(sheets).toHaveLength(9);
    for (const s of sheets) expect(s.prompt.endsWith(SHEET_END), s.id).toBe(true);
  });

  it('ningún explain lleva «no hay error» ni «todo cuadra»', () => {
    // contract: review-16 m7 del juego 1: la frase va en el enunciado, no en el explain
    for (const s of sheets) expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
  });

  it('cada proyecto tiene una hoja correcta y una de código', () => {
    for (const p of orbit.projects) {
      // contract: encargo común de la Órbita 3 de matrices: 3 hojas `revision` que mezclan código y texto, exactamente una con `faultyLine: null`
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
