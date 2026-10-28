import { describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../src/content/schema';
import { runInPyodide, type RunResult } from '../../src/python/core';
import { loadNodePyodide } from '../../src/python/node';

/** Plazo de la carga de Pyodide en `beforeAll` (tarda 7-8 s; la primera vez sin caché, más). */
export const PYODIDE_LOAD_TIMEOUT_MS = 60_000;

let loading: Promise<unknown> | undefined;

/**
 * Carga única de Pyodide por fichero de pruebas (Vitest aísla los módulos por fichero).
 * Llamar desde `beforeAll(..., PYODIDE_LOAD_TIMEOUT_MS)` y lanzar Vitest desde la raíz del repo:
 * la caché de paquetes usa `process.cwd()`.
 */
export const getPyodide = (): Promise<unknown> => (loading ??= loadNodePyodide());

/** Ejecuta la solución de referencia con las comprobaciones de la pregunta. */
export const runReference = (pyodide: unknown, q: CodigoQ): Promise<RunResult> =>
  runInPyodide(pyodide, q.reference, q.checks);

/** Ejecuta el código inicial con las comprobaciones de la pregunta. */
export const runStarter = (pyodide: unknown, q: CodigoQ): Promise<RunResult> =>
  runInPyodide(pyodide, q.starter, q.checks);

/**
 * Las comprobaciones llaman al menos una vez a `check(`: una llamada real, con límite de palabra
 * (no `mycheck(` ni `obj.check(`), con espacios opcionales antes del paréntesis y fuera de los
 * comentarios (`# check(`).
 */
export const hasCheckCall = (q: CodigoQ): boolean =>
  q.checks.split('\n').some((line) => /(?<![\w.])check\s*\(/.test(line.replace(/#.*$/, '')));

/** Resumen de una ejecución para el mensaje de un fallo. */
export const describeRun = (r: RunResult): string =>
  [
    r.error ? `error: ${r.error}` : null,
    r.checks === null
      ? 'sin comprobaciones'
      : r.checks.map((c) => `${c.passed ? 'ok' : 'FALLA'}: ${c.message}`).join('; ') ||
        'comprobaciones vacías',
    r.stdout ? `salida: ${r.stdout}` : null,
  ]
    .filter((s): s is string => s !== null)
    .join(' | ');

/**
 * Problemas de una pregunta de código; vacía si la `reference` supera todas las comprobaciones,
 * el `starter` no las supera y las comprobaciones llaman a `check(`.
 */
export const codeQuestionProblems = async (pyodide: unknown, q: CodigoQ): Promise<string[]> => {
  const problems: string[] = [];
  if (!hasCheckCall(q)) problems.push(`${q.id}: las comprobaciones no llaman a check(`);
  const reference = await runReference(pyodide, q);
  if (!reference.passed) {
    problems.push(`${q.id}: la reference no supera las comprobaciones (${describeRun(reference)})`);
  }
  const starter = await runStarter(pyodide, q);
  if (starter.passed) problems.push(`${q.id}: el starter ya supera las comprobaciones`);
  return problems;
};

// ---------- pistas con código (petición de Oliver 2026-10-28: pistas que llevan de la mano) ----------

/** Hueco que el jugador rellena en el esqueleto de una pista. */
export const HOLE = '___';

/** Los bloques ```python de las pistas de una pregunta, en orden, con el número de su pista. */
export const hintBlocks = (q: CodigoQ): { hint: number; code: string }[] =>
  q.hints.flatMap((text, hint) =>
    [...text.matchAll(/```python\n([\s\S]*?)\n```/g)].map((m) => ({ hint, code: `${m[1]!}\n` })),
  );

/**
 * El esqueleto de la última pista (su último bloque ```python con huecos `___`) con cada hueco
 * sustituido, en orden, por su relleno. Falla si no hay esqueleto o si sobran o faltan rellenos.
 */
export const fillSkeleton = (q: CodigoQ, fills: readonly string[]): string => {
  const skeleton = hintBlocks(q)
    .filter((b) => b.hint === q.hints.length - 1 && b.code.includes(HOLE))
    .at(-1);
  if (!skeleton) throw new Error(`${q.id}: la última pista no tiene un esqueleto con huecos`);
  const holes = skeleton.code.split(HOLE).length - 1;
  if (holes !== fills.length)
    throw new Error(`${q.id}: el esqueleto tiene ${holes} huecos y hay ${fills.length} rellenos`);
  let i = 0;
  return skeleton.code.replaceAll(HOLE, () => fills[i++]!);
};

/**
 * Pruebas de las pistas de las preguntas de código de un proyecto: cada una tiene relleno para el
 * esqueleto de su última pista, cada ejemplo sin huecos de sus pistas se ejecuta sin error tras el
 * `starter`, y el esqueleto rellenado con `fills[id]` aprueba. `pyodide` es un getter porque el
 * intérprete se carga en el `beforeAll` del fichero.
 */
export const defineHintTests = (
  questions: readonly CodigoQ[],
  fills: Readonly<Record<string, readonly string[]>>,
  pyodide: () => unknown,
): void => {
  describe('pistas de las preguntas de código del proyecto', { timeout: 60_000 }, () => {
    it('cada pregunta de código tiene relleno para el esqueleto de su última pista', () => {
      // contract: petición de Oliver 2026-10-28: toda pista de código acaba en un esqueleto con huecos
      expect(Object.keys(fills).sort()).toEqual(questions.map((q) => q.id).sort());
    });
    for (const q of questions) {
      const examples = hintBlocks(q).filter((b) => !b.code.includes(HOLE));
      for (const [k, block] of examples.entries()) {
        it(`${q.id}: el ejemplo ${k + 1} de las pistas se ejecuta sin error tras el starter`, async () => {
          const r = await runInPyodide(pyodide(), q.starter + block.code, q.checks);
          // contract: petición de Oliver 2026-10-28: los ejemplos de las pistas se pueden probar tal cual
          expect(r.error, describeRun(r)).toBeNull();
        });
      }
      it(`${q.id}: el esqueleto de la última pista, rellenado, aprueba`, async () => {
        const code = q.starter + fillSkeleton(q, fills[q.id] ?? []);
        const r = await runInPyodide(pyodide(), code, q.checks);
        // contract: petición de Oliver 2026-10-28: la última pista lleva a una solución que aprueba
        expect(r.passed, describeRun(r)).toBe(true);
      });
    }
  });
};
