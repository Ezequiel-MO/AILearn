import { describe, expect, it } from 'vitest';
import { WARMUP_MAX_STEPS } from '../../src/content/schema';
import { defineProseTests } from './prose-helpers';
import { allProjects, allWarmupSteps, warmupAsQuestion } from './warmup-helpers';

describe('calentamiento de Python en el registro', () => {
  for (const { game, project } of allProjects) {
    it(`${game}/${project.id} tiene calentamiento de 1 a ${WARMUP_MAX_STEPS} fichas`, () => {
      // contract: petición de Oliver 2026-10-23: un calentamiento antes de cada ejercicio «Programar»
      expect(project.warmup?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(project.warmup?.length ?? 0).toBeLessThanOrEqual(WARMUP_MAX_STEPS);
    });
  }

  it('los ids de las fichas no se repiten dentro de cada juego', () => {
    const ids = allWarmupSteps.map(({ game, step }) => `${game}/${step.id}`);
    // contract: como los ids de las preguntas: únicos por juego (python.test.ts)
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el ejemplo de cada ficha escribe algo con print o dibuja', () => {
    const silent = allWarmupSteps
      .filter(({ step }) => !/\bprint\(|\bplt\./.test(step.example))
      .map(({ game, step }) => `${game}/${step.id}`);
    // contract: petición de Oliver 2026-10-23: el jugador ve lo que hace el concepto al pulsar «Ejecutar»
    expect(silent).toEqual([]);
  });
});

for (const { game, project } of allProjects) {
  if (project.warmup) {
    defineProseTests(`calentamiento ${game}/${project.id}`, project.warmup.map(warmupAsQuestion));
  }
}
