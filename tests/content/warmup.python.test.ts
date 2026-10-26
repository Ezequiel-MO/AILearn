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

// Las fichas que enseñan «las filas de la matriz de autovectores no son los autovectores» tienen que usar
// una matriz para la que fila y columna difieran en el eigh del Pyodide del juego (en simétricas como
// [[5, 2], [2, 2]] la matriz de autovectores sale simétrica y la fila vale).
describe('calentamiento: fila ≠ columna en las fichas de eigh', { timeout: 60_000 }, () => {
  const stepOf = (id: string) => {
    const found = allWarmupSteps.find((s) => s.step.id === id);
    if (!found) throw new Error(`No existe la ficha ${id}`);
    return found.step;
  };
  // Imprime, para cada fila de V, si cumple A·v = λv para algún λ.
  const rowsEigen = (a: string, v: string, w: string): string =>
    `\nprint([any(np.allclose(${a} @ ${v}[k], x * ${v}[k]) for x in ${w}) for k in range(2)])\n`;

  const cases: { id: string; name: string; code: (s: ReturnType<typeof stepOf>) => string }[] = [
    {
      id: 'simetricas.cal.4',
      name: 'el ejemplo',
      code: (s) => s.example + rowsEigen('M', 'vecs', 'vals'),
    },
    {
      id: 'simetricas.cal.4',
      name: 'el reto',
      code: (s) => s.task.reference + rowsEigen('N', 'vectores', 'valores'),
    },
    {
      id: 'pca.cal.2',
      name: 'la matriz del experimento',
      code: () =>
        'import numpy as np\nS = np.array([[1, 2], [2, -2]])\nvalores, vectores = np.linalg.eigh(S)' +
        rowsEigen('S', 'vectores', 'valores'),
    },
    {
      id: 'pca.cal.2',
      name: 'el reto',
      code: (s) => s.task.reference + rowsEigen('A', 'vectores', 'valores'),
    },
  ];
  for (const c of cases) {
    it(`${c.id}: ${c.name}`, async () => {
      const r = await runInPyodide(pyodide, c.code(stepOf(c.id)));
      // contract: revisión de la Órbita 2: si alguna fila fuera autovector, «las filas no son autovectores» sería falso en ese ejemplo
      expect(r.error, describeRun(r)).toBeNull();
      expect(r.stdout.trim().split('\n').pop(), describeRun(r)).toBe('[False, False]');
    });
  }

  it('pca.cal.2: el reto rechaza u = una fila de V con el mensaje de las filas', async () => {
    const s = stepOf('pca.cal.2');
    const code = s.task.reference.replace('u = vectores[:, -1]', 'u = vectores[-1]');
    const r = await runInPyodide(pyodide, code, s.task.checks);
    const failed = (r.checks ?? []).filter((c) => !c.passed).map((c) => c.message);
    // contract: revisión de la Órbita 2: con A no simétrica en V, la fila ya no pasa por autovector y salta el mensaje de «filas»
    expect(code).not.toBe(s.task.reference);
    expect(r.passed, describeRun(r)).toBe(false);
    expect(failed.join(' | '), describeRun(r)).toMatch(/no las filas/);
  });

  it('el experimento de pca.cal.2 propone la matriz comprobada', () => {
    // contract: revisión de la Órbita 2: el experimento propone S = [[1, 2], [2, -2]], la de la prueba anterior
    expect(stepOf('pca.cal.2').experiments.join(' ')).toContain('np.array([[1, 2], [2, -2]])');
  });
});
