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

// ---------- lo que los ejemplos dicen que imprimen ----------

/** Una línea `print(...)  # comentario` sin sangría: el `print` y su comentario. */
const PRINT_LINE = /^(print\(.*\))\s+#\s*(.*)$/;

/** Un comentario que empieza por algo con forma de valor impreso: lista, tupla, número, `True`, `False`, `None` o texto entre comillas. */
const VALUE_LIKE = /^(?:[[({'"]|-?\d|True\b|False\b|None\b)/;

/** Marca de la línea con la que el ejemplo instrumentado devuelve lo que imprimió cada `print`. */
const CLAIM_MARK = '__salida_de_los_ejemplos__';

/** Un `print` de un ejemplo cuyo comentario dice qué sale: el número de línea y lo que dice. */
export interface PrintClaim {
  line: number;
  claim: string;
}

/**
 * Las líneas de un ejemplo que dicen qué imprimen: un `print(...)` sin sangría (los de un bucle
 * imprimen varias veces) con un comentario que empieza por un valor. Un comentario que solo describe
 * («# la palabra de esa posición») no dice qué sale y no cuenta.
 */
export const printClaims = (code: string): PrintClaim[] =>
  code.split('\n').flatMap((text, line) => {
    const m = PRINT_LINE.exec(text);
    const claim = m?.[2]?.trim() ?? '';
    return m && VALUE_LIKE.test(claim) ? [{ line, claim }] : [];
  });

/** Los espacios juntados en uno, y fuera los de relleno junto a un corchete (NumPy escribe `[ 3 11]`). */
const squash = (s: string): string =>
  s.replace(/\s+/g, ' ').replace(/\[ /g, '[').replace(/ \]/g, ']').trim();

/**
 * Si lo impreso casa con lo que dice el comentario, con los espacios juntados (una matriz sale en
 * varias líneas): el comentario es la salida, o la salida seguida de «:», «,» o «;» y su explicación.
 * En una salida de varias líneas basta su primera línea, porque el comentario sigue en la siguiente.
 * Un valor cortado con «...» o «…» («0.1353...») casa con la salida que empieza por lo escrito.
 */
export const claimMatches = (output: string, claim: string): boolean => {
  const c = squash(claim);
  const tail = (rest: string): boolean => rest === '' || /^[:;,]/.test(rest);
  const opens = (value: string): boolean => c.startsWith(value) && tail(c.slice(value.length));
  const lines = output.replace(/\n$/, '').split('\n');
  if (opens(squash(output)) || (lines.length > 1 && opens(squash(lines[0]!)))) return true;
  const cut = /^(.+?)(?:\.\.\.|…)(.*)$/.exec(c);
  return cut !== null && squash(output).startsWith(cut[1]!) && tail(cut[2]!);
};

/**
 * El ejemplo con la salida de cada `print` de `claims` en su propio búfer; al final imprime los
 * búferes en JSON tras `CLAIM_MARK`, para leerlos con `claimOutputs`.
 */
export const instrumentClaims = (code: string, claims: readonly PrintClaim[]): string => {
  const lines = code.split('\n');
  claims.forEach(({ line }, k) => {
    lines[line] =
      `with _ej_cl.redirect_stdout(_ej_bufs[${k}]): ${PRINT_LINE.exec(lines[line]!)![1]!}`;
  });
  return [
    'import io as _ej_io, contextlib as _ej_cl, json as _ej_json',
    `_ej_bufs = [_ej_io.StringIO() for _ in range(${claims.length})]`,
    ...lines,
    `print(${JSON.stringify(CLAIM_MARK)} + _ej_json.dumps([_b.getvalue() for _b in _ej_bufs]))`,
    '',
  ].join('\n');
};

/** Lo que imprimió cada `print` de un ejemplo instrumentado, o `null` si no llegó al final. */
export const claimOutputs = (stdout: string): string[] | null => {
  const line = stdout
    .split('\n')
    .reverse()
    .find((l) => l.startsWith(CLAIM_MARK));
  return line ? (JSON.parse(line.slice(CLAIM_MARK.length)) as string[]) : null;
};

/**
 * Pruebas de las pistas de las preguntas de código de un proyecto: cada una tiene relleno para el
 * esqueleto de su última pista, cada ejemplo sin huecos de sus pistas se ejecuta sin error tras el
 * `starter` e imprime lo que dicen sus comentarios (`printClaims`), y el esqueleto rellenado con
 * `fills[id]` aprueba. `pyodide` es un getter porque el intérprete se carga en el `beforeAll` del
 * fichero.
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
        it(`${q.id}: el ejemplo ${k + 1} de las pistas se ejecuta sin error tras el starter e imprime lo que dicen sus comentarios`, async () => {
          const claims = printClaims(block.code);
          const code = q.starter + instrumentClaims(block.code, claims);
          const r = await runInPyodide(pyodide(), code, q.checks);
          // contract: petición de Oliver 2026-10-28: los ejemplos de las pistas se pueden probar tal cual
          expect(r.error, describeRun(r)).toBeNull();
          const outputs = claimOutputs(r.stdout) ?? [];
          const wrong = claims
            .map((c, i) => ({ ...c, got: outputs[i] ?? '(nada)' }))
            .filter((c) => !claimMatches(c.got, c.claim))
            .map(
              (c) =>
                `línea ${c.line + 1}: el comentario dice «${c.claim}» y sale «${c.got.trimEnd()}»`,
            );
          // contract: hallazgo 1 de la revisión de la Órbita 0 del juego 3 (2026-11-05): una pista
          // comentaba [-28.0, -9.0] y salía otra cosa; lo que un ejemplo dice que imprime es lo que imprime
          expect(wrong).toEqual([]);
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
