import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  defineHintTests,
  describeRun,
  getPyodide,
} from '../../../tests/content/python-helpers';
import { NUMPY_ENGLISH, garbageProbes } from '../../../tests/content/prose-helpers';
import { launch } from './despegue';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const byId = new Map(launch.filter((q): q is CodigoQ => q.type === 'codigo').map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay tres preguntas de código: despegue.7, 8 y 9', () => {
    // contract: encargo T2: las preguntas 7, 8 y 9 del despegue son de código
    expect([...byId.keys()]).toEqual(['despegue.7', 'despegue.8', 'despegue.9']);
  });
  for (const id of ['despegue.7', 'despegue.8', 'despegue.9']) {
    it(`${id}: la referencia pasa y el starter no`, async () => {
      // contract: reglas comunes de contenido: la reference supera las comprobaciones y el starter no
      expect(await codeQuestionProblems(pyodide, question(id))).toEqual([]);
    });
  }
});

/** Lo que el jugador entrega: el código inicial y su añadido. */
interface Variant {
  name: string;
  append: string;
}

const code = (q: CodigoQ, v: Variant): string => q.starter + v.append;

/** Cada variante correcta debe pasar todas las comprobaciones. */
const accepts = (id: string, variants: Variant[]): void => {
  describe(`${id}: soluciones correctas distintas de la de referencia`, { timeout: 60_000 }, () => {
    for (const v of variants) {
      it(v.name, async () => {
        const r = await runInPyodide(pyodide, code(question(id), v), question(id).checks);
        // contract: riesgo del plan: las comprobaciones no deben rechazar una solución correcta alternativa
        expect(r.passed, describeRun(r)).toBe(true);
      });
    }
  });
};

/** Cada variante errónea debe fallar, y alguna comprobación fallida debe nombrar su error. */
const rejects = (
  id: string,
  variants: (Variant & { message: RegExp; notMessage?: RegExp; failures?: number })[],
): void => {
  describe(`${id}: errores típicos`, { timeout: 60_000 }, () => {
    for (const v of variants) {
      it(v.name, async () => {
        const r = await runInPyodide(pyodide, code(question(id), v), question(id).checks);
        // contract: riesgo del plan: un error típico no pasa y recibe un mensaje que orienta
        expect(r.passed, describeRun(r)).toBe(false);
        const failed = (r.checks ?? []).filter((c) => !c.passed).map((c) => c.message);
        // contract: review-18r m2: ningún error típico saca un texto de error de NumPy o de Python en inglés, ni lanza una excepción propia
        expect(r.error, describeRun(r)).toBeNull();
        expect(failed.join(' | '), describeRun(r)).not.toMatch(NUMPY_ENGLISH);
        expect(failed.join(' | '), describeRun(r)).toMatch(v.message);
        // contract: review-15 m2: sin cascada, los mensajes que no son el fallo no salen
        if (v.notMessage) expect(failed.join(' | '), describeRun(r)).not.toMatch(v.notMessage);
        if (v.failures !== undefined) expect(failed, describeRun(r)).toHaveLength(v.failures);
      });
    }
  });
};

// ---------- despegue.7: construir A y su forma ----------

accepts('despegue.7', [
  {
    name: 'np.shape en vez de .shape',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]])\nforma = np.shape(A)\n',
  },
  {
    name: 'una tupla de filas',
    append: 'A = np.array(((2, 0, 1), (1, 3, -1)))\nforma = A.shape\n',
  },
  {
    name: 'apilando dos filas con np.vstack',
    append: 'A = np.vstack([np.array([2, 0, 1]), np.array([1, 3, -1])])\nforma = A.shape\n',
  },
  {
    name: 'una lista plana con reshape',
    append: 'A = np.array([2, 0, 1, 1, 3, -1]).reshape(2, 3)\nforma = A.shape\n',
  },
  {
    name: 'decimales',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]], dtype=float)\nforma = A.shape\n',
  },
  {
    name: 'la forma con len',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]])\nforma = (len(A), len(A[0]))\n',
  },
  {
    name: 'la forma como lista',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]])\nforma = [2, 3]\n',
  },
]);
rejects('despegue.7', [
  {
    name: 'un solo vector de 6 números',
    append: 'A = np.array([2, 0, 1, 1, 3, -1])\nforma = A.shape\n',
    message: /un solo vector de 6 números/,
  },
  {
    name: 'matriz traspuesta',
    append: 'A = np.array([[2, 1], [0, 3], [1, -1]])\nforma = A.shape\n',
    message: /está traspuesta/,
  },
  {
    name: 'una lista de listas sin np.array',
    append: 'A = [[2, 0, 1], [1, 3, -1]]\nforma = (2, 3)\n',
    message: /tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'filas en otro orden',
    append: 'A = np.array([[1, 3, -1], [2, 0, 1]])\nforma = A.shape\n',
    message: /2, 0, 1 como primera fila y 1, 3, -1 como segunda/,
    failures: 1,
  },
  {
    name: 'forma es solo el número de filas',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]])\nforma = A.shape[0]\n',
    message: /tupla con el número de filas y de columnas/,
    failures: 1,
  },
  {
    name: 'forma con filas y columnas al revés',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]])\nforma = (3, 2)\n',
    message: /`forma` tiene que valer \(2, 3\)/,
    failures: 1,
  },
  {
    name: 'forma es un array',
    append: 'A = np.array([[2, 0, 1], [1, 3, -1]])\nforma = np.array(A.shape)\n',
    message: /tupla con el número de filas y de columnas/,
    failures: 1,
  },
]);

// ---------- despegue.8: A @ v ----------

accepts('despegue.8', [
  { name: 'np.dot', append: 'w = np.dot(A, v)\n' },
  { name: 'el método dot', append: 'w = A.dot(v)\n' },
  { name: 'np.matmul', append: 'w = np.matmul(A, v)\n' },
  { name: 'multiplicar y sumar por filas', append: 'w = (A * v).sum(axis=1)\n' },
  { name: 'fila a fila', append: 'w = np.array([A[0] @ v, A[1] @ v])\n' },
  { name: 'con decimales', append: 'w = (A @ v).astype(float)\n' },
]);
rejects('despegue.8', [
  {
    name: 'A * v, componente a componente',
    append: 'w = A * v\n',
    message: /multiplica componente a componente y da una matriz/,
    failures: 1,
  },
  {
    name: 'el orden cambiado, v @ A',
    append: 'w = v @ A\n',
    message: /has multiplicado `v` por `A`/,
    failures: 1,
  },
  {
    name: 'un vector que no es el producto',
    append: 'w = np.array([4, 5])\n',
    message: /`w` tiene que valer \(4, 6\)/,
    failures: 1,
  },
  {
    name: 'una lista en vez de un array',
    append: 'w = [4, 6]\n',
    message: /tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'la suma de las componentes, un número',
    append: 'w = np.sum(A @ v)\n',
    message: /tiene que ser un array de NumPy con números/,
    failures: 1,
  },
]);

// ---------- despegue.9: la primera columna y la imagen de î ----------

accepts('despegue.9', [
  { name: 'np.dot con una lista', append: 'col = A[:, 0]\nimagen_i = np.dot(A, [1, 0])\n' },
  {
    name: 'la columna con la traspuesta',
    append: 'col = A.T[0]\nimagen_i = A @ np.array([1, 0])\n',
  },
  {
    name: 'la columna copiada y la imagen con @ y una lista',
    append: 'col = A[:, 0].copy()\nimagen_i = A @ [1, 0]\n',
  },
  {
    name: 'la columna componente a componente',
    append: 'col = np.array([A[0, 0], A[1, 0]])\nimagen_i = A.dot(np.array([1, 0]))\n',
  },
  { name: 'la imagen igual a la columna', append: 'col = A[:, 0]\nimagen_i = col\n' },
]);
rejects('despegue.9', [
  {
    name: 'la primera fila en vez de la primera columna',
    append: 'col = A[0]\nimagen_i = A @ np.array([1, 0])\n',
    message: /es la primera fila de `A`, no la primera columna/,
    failures: 1,
  },
  {
    name: 'la segunda columna',
    append: 'col = A[:, 1]\nimagen_i = A @ np.array([1, 0])\n',
    message: /`col` tiene que valer \(3, 2\)/,
    failures: 1,
  },
  {
    name: 'un solo número en vez de la columna',
    append: 'col = A[0, 0]\nimagen_i = A @ np.array([1, 0])\n',
    message: /`col` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
  {
    name: 'la imagen de ĵ en vez de la de î',
    append: 'col = A[:, 0]\nimagen_i = A @ np.array([0, 1])\n',
    message: /`imagen_i` tiene que valer \(3, 2\)/,
    failures: 1,
  },
  {
    name: 'el orden cambiado, vector por matriz',
    append: 'col = A[:, 0]\nimagen_i = np.array([1, 0]) @ A\n',
    message: /con la matriz a la izquierda de `@`/,
    failures: 1,
  },
  {
    name: 'A * vector, que da una matriz',
    append: 'col = A[:, 0]\nimagen_i = A * np.array([1, 0])\n',
    message: /`imagen_i` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
]);

// ---------- datos de tipo equivocado ----------

describe('datos de tipo equivocado: sin errores de NumPy en inglés', { timeout: 60_000 }, () => {
  for (const q of byId.values()) {
    for (const probe of garbageProbes(q)) {
      it(`${q.id}: ${probe.name}`, async () => {
        const r = await runInPyodide(pyodide, probe.code, q.checks);
        const messages = (r.checks ?? []).map((c) => c.message).join(' | ');
        // contract: review-18r m2 (b1): cadenas, None o listas de una cadena en la variable de la respuesta no rompen las comprobaciones
        expect(r.error, describeRun(r)).toBeNull();
        expect(messages, describeRun(r)).not.toMatch(NUMPY_ENGLISH);
        // contract: review-18r m2: siguen sin superarse (la respuesta es basura) y sí se ejecutan las comprobaciones
        expect(r.passed, describeRun(r)).toBe(false);
        expect(r.checks?.length ?? 0, describeRun(r)).toBeGreaterThan(0);
      });
    }
  }
});

// ---------- pistas: los ejemplos se ejecutan y el esqueleto de la última pista, rellenado, aprueba ----------

/** Lo que el jugador escribe en cada hueco `___` del esqueleto de la última pista, en orden. */
const SKELETON_FILLS: Record<string, string[]> = {
  'despegue.7': ['2, 0, 1', '1, 3, -1', 'A'],
  'despegue.8': ['A', 'v'],
  'despegue.9': [':', '0', '1, 0'],
};

defineHintTests([...byId.values()], SKELETON_FILLS, () => pyodide);
