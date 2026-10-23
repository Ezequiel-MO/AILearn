import { beforeAll, describe, expect, it } from 'vitest';
import { runInPyodide } from '../../src/python/core';
import { NUMPY_ENGLISH, checkMessages, garbageProbes } from './prose-helpers';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  describeRun,
  getPyodide,
} from './python-helpers';
import { allWarmupSteps, warmupAsQuestion } from './warmup-helpers';

let pyodide: unknown;

// Una sola instancia de Pyodide por fichero. Lanzar desde la raíz del repo (caché de paquetes en process.cwd()).
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

describe('calentamiento: fichas que se ejecutan', { timeout: 60_000 }, () => {
  for (const { game, step } of allWarmupSteps) {
    const q = warmupAsQuestion(step);
    describe(`${game}/${step.id}`, () => {
      it('el ejemplo se ejecuta sin error y enseña algo', async () => {
        const r = await runInPyodide(pyodide, step.example);
        // contract: petición de Oliver 2026-10-23: el ejemplo se prueba con «Ejecutar» y enseña qué hace
        expect(r.error, describeRun(r)).toBeNull();
        expect(r.stdout !== '' || r.figures.length > 0, describeRun(r)).toBe(true);
      });

      it('la solución del reto pasa, el código de partida no, y hay check(', async () => {
        // contract: las reglas de las preguntas de código (tarea 8) valen para el reto «Ahora tú»
        expect(await codeQuestionProblems(pyodide, q)).toEqual([]);
      });

      it('el código de partida del reto recibe mensajes de las comprobaciones, no un fallo', async () => {
        const r = await runInPyodide(pyodide, step.task.starter, step.task.checks);
        const known = new Set(checkMessages(q));
        const foreign = (r.checks ?? []).map((c) => c.message).filter((m) => !known.has(m));
        // contract: review-18r m2 aplicado al reto: con las variables en None las comprobaciones no se rompen
        expect(r.error, describeRun(r)).toBeNull();
        expect(foreign, describeRun(r)).toEqual([]);
      });

      for (const probe of garbageProbes(q)) {
        it(`datos de tipo equivocado: ${probe.name}`, async () => {
          const r = await runInPyodide(pyodide, probe.code, step.task.checks);
          const messages = (r.checks ?? []).map((c) => c.message).join(' | ');
          // contract: review-18r m2 (b1) aplicado al reto: sin errores de NumPy en inglés y sin superarse
          expect(r.error, describeRun(r)).toBeNull();
          expect(messages, describeRun(r)).not.toMatch(NUMPY_ENGLISH);
          expect(r.passed, describeRun(r)).toBe(false);
        });
      }
    });
  }
});
