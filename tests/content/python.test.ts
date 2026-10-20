import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../src/content/schema';
import { codeQuestions } from '../../src/content/validate';
import { games } from '../../src/games';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  describeRun,
  getPyodide,
  hasCheckCall,
  runReference,
  runStarter,
} from './python-helpers';

let pyodide: unknown;

// Una sola instancia de Pyodide por fichero. Lanzar desde la raíz del repo (caché de paquetes en process.cwd()).
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const question = (over: Partial<CodigoQ>): CodigoQ => ({
  id: 'q',
  type: 'codigo',
  requirements: ['r'],
  prompt: 'p',
  hints: [],
  explain: 'e',
  solution: 's',
  starter: 'v = None',
  checks: 'check(v == 1, "v vale 1")',
  reference: 'v = 1',
  ...over,
});

describe('ayudante de preguntas de código', { timeout: 60_000 }, () => {
  it('no da problemas con una pregunta correcta', async () => {
    // contract: tarea 8, regla: reference supera sus checks, starter no, hay check(
    expect(await codeQuestionProblems(pyodide, question({}))).toEqual([]);
  });

  it('atrapa una reference rota', async () => {
    const problems = await codeQuestionProblems(pyodide, question({ reference: 'v = 2' }));
    // contract: tarea 8, regla: la reference debe superar sus checks
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('reference');
  });

  it('atrapa un starter que ya supera las comprobaciones', async () => {
    const problems = await codeQuestionProblems(pyodide, question({ starter: 'v = 1' }));
    // contract: tarea 8, regla: el starter no debe superar los checks
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('starter');
  });

  it('atrapa unas comprobaciones sin check(', async () => {
    const problems = await codeQuestionProblems(pyodide, question({ checks: 'assert v == 1' }));
    // contract: tarea 8, regla: las checks contienen al menos una llamada a check(
    expect(problems.join('\n')).toContain('check(');
    expect(hasCheckCall(question({ checks: 'assert v == 1' }))).toBe(false);
  });
});

const allCode = games.flatMap((game) => codeQuestions(game).map((q) => ({ game: game.id, q })));

describe('preguntas de código del registro', { timeout: 60_000 }, () => {
  it('los ids de las preguntas de código no se repiten', () => {
    const ids = allCode.map(({ game, q }) => `${game}/${q.id}`);
    // contract: tarea 8, brief: el registro vacío no falla por «no hay pruebas»; ids únicos por juego
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const { game, q } of allCode) {
    describe(`${game}/${q.id}`, () => {
      it('la reference supera sus checks', async () => {
        const r = await runReference(pyodide, q);
        // contract: tarea 8, reglas de python.test.ts: passed verdadero
        expect(r.passed, describeRun(r)).toBe(true);
      });

      it('el starter no las supera', async () => {
        const r = await runStarter(pyodide, q);
        // contract: tarea 8, reglas de python.test.ts: el starter no pasa
        expect(r.passed, describeRun(r)).toBe(false);
      });

      it('las checks llaman a check(', () => {
        // contract: tarea 8, reglas de python.test.ts: al menos una llamada a check(
        expect(hasCheckCall(q)).toBe(true);
      });
    });
  }
});
