import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  describeRun,
  getPyodide,
} from '../../../tests/content/python-helpers';
import {
  NUMPY_ENGLISH,
  garbageProbes,
  projectQuestions,
} from '../../../tests/content/prose-helpers';
import { componer } from './componer';
import { examen0Componer } from './examen-0-componer';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(componer), ...examen0Componer.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'componer.ex02.1',
  'componer.ex02.2',
  'componer.ex02.3',
  'componer.ex02.4',
  'componer.ex02.5',
  'examen-0.tres-capas',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una
    expect([...byId.keys()]).toEqual(IDS);
  });
  for (const id of IDS) {
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

// ---------- componer.ex02.1: C = A @ B ----------

accepts('componer.ex02.1', [
  { name: 'np.dot', append: 'C = np.dot(A, B)\n' },
  { name: 'np.matmul', append: 'C = np.matmul(A, B)\n' },
  { name: 'el método dot', append: 'C = A.dot(B)\n' },
  { name: 'con decimales', append: 'C = (A @ B).astype(float)\n' },
  { name: 'columna a columna', append: 'C = np.array([A @ B[:, 0], A @ B[:, 1]]).T\n' },
]);
rejects('componer.ex02.1', [
  {
    name: 'A * B, entrada a entrada',
    append: 'C = A * B\n',
    message: /sale de multiplicar entrada a entrada/,
    failures: 1,
  },
  {
    name: 'el orden cambiado, B @ A',
    append: 'C = B @ A\n',
    message: /producto en orden contrario/,
    failures: 1,
  },
  {
    name: 'una matriz con una entrada mal',
    append: 'C = np.array([[4, 6], [1, 2]])\n',
    message: /`C` tiene que valer \(4, 6\) en la primera fila/,
    failures: 1,
  },
  {
    name: 'una lista de listas en vez de un array',
    append: 'C = [[4, 6], [1, 3]]\n',
    message: /`C` tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'solo la primera fila del producto',
    append: 'C = (A @ B)[0]\n',
    message: /`C` tiene que ser una matriz de 2 filas y 2 columnas/,
    failures: 1,
  },
]);

// ---------- componer.ex02.2: el producto columna a columna ----------

accepts('componer.ex02.2', [
  {
    name: 'np.stack en el eje 1',
    append: 'col0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = np.stack([col0, col1], axis=1)\n',
  },
  {
    name: 'las columnas como filas y la traspuesta',
    append: 'col0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = np.array([col0, col1]).T\n',
  },
  {
    name: 'np.dot y hstack con columnas de una sola columna',
    append:
      'col0 = np.dot(A, B[:, 0])\ncol1 = np.dot(A, B[:, 1])\nC = np.hstack([col0.reshape(2, 1), col1.reshape(2, 1)])\n',
  },
  {
    name: 'las columnas sacadas de la traspuesta',
    append: 'col0 = A @ B.T[0]\ncol1 = A @ B.T[1]\nC = np.column_stack((col0, col1))\n',
  },
  {
    name: 'C del producto completo',
    append: 'col0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = A @ B\n',
  },
]);
rejects('componer.ex02.2', [
  {
    name: 'la primera fila de B en vez de la primera columna',
    append: 'col0 = A @ B[0]\ncol1 = A @ B[:, 1]\nC = A @ B\n',
    message: /`col0` tiene que valer \(7, 6\)/,
    failures: 1,
  },
  {
    name: 'la segunda columna repetida',
    append: 'col0 = A @ B[:, 0]\ncol1 = A @ B[:, 0]\nC = A @ B\n',
    message: /`col1` tiene que valer \(2, 6\)/,
    failures: 1,
  },
  {
    name: 'las columnas juntas como filas',
    append: 'col0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = np.array([col0, col1])\n',
    message: /`C` está traspuesta/,
    failures: 1,
  },
  {
    name: 'una columna como lista',
    append: 'col0 = [7, 6]\ncol1 = A @ B[:, 1]\nC = A @ B\n',
    message: /`col0` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
  {
    name: 'C es solo la primera columna',
    append: 'col0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = col0\n',
    message: /`C` tiene que ser una matriz de NumPy de 2 filas y 2 columnas/,
    failures: 1,
  },
]);

// ---------- componer.ex02.3: componer(lista) en el orden dado ----------

accepts('componer.ex02.3', [
  {
    name: 'reduce con la matriz nueva a la izquierda',
    append:
      'from functools import reduce\n\n\ndef componer(lista):\n    return reduce(lambda M, N: N @ M, lista)\n\n\nC = componer([R, S])\n',
  },
  {
    name: 'multi_dot con la lista invertida',
    append:
      'def componer(lista):\n    return np.linalg.multi_dot(lista[::-1])\n\n\nC = componer([R, S])\n',
  },
  {
    name: 'recursiva',
    append:
      'def componer(lista):\n    if len(lista) == 1:\n        return lista[0]\n    return componer(lista[1:]) @ lista[0]\n\n\nC = componer([R, S])\n',
  },
  {
    name: 'empezando por la primera de la lista',
    append:
      'def componer(lista):\n    M = lista[0]\n    for N in lista[1:]:\n        M = N @ M\n    return M\n\n\nC = componer([R, S])\n',
  },
  {
    name: 'np.dot con la identidad',
    append:
      'def componer(lista):\n    M = np.eye(2)\n    for N in lista:\n        M = np.dot(N, M)\n    return M\n\n\nC = componer([R, S])\n',
  },
  {
    name: 'recorriendo la lista al revés',
    append:
      'def componer(lista):\n    M = np.eye(2)\n    for N in reversed(lista):\n        M = M @ N\n    return M\n\n\nC = componer([R, S])\n',
  },
]);
rejects('componer.ex02.3', [
  {
    name: 'la matriz nueva a la derecha',
    append:
      'def componer(lista):\n    M = np.eye(2)\n    for N in lista:\n        M = M @ N\n    return M\n\n\nC = componer([R, S])\n',
    message: /devuelve el producto en orden contrario/,
    failures: 1,
  },
  {
    name: 'multi_dot sin invertir la lista',
    append:
      'def componer(lista):\n    return np.linalg.multi_dot(lista)\n\n\nC = componer([R, S])\n',
    message: /devuelve el producto en orden contrario/,
    failures: 1,
  },
  {
    name: 'devuelve solo la última matriz',
    append: 'def componer(lista):\n    return lista[-1]\n\n\nC = componer([R, S])\n',
    message: /tiene que devolver la matriz que gira primero y estira después/,
    failures: 1,
  },
  {
    name: 'suma las matrices',
    append: 'def componer(lista):\n    return sum(lista)\n\n\nC = componer([R, S])\n',
    message: /tiene que devolver la matriz que gira primero y estira después/,
    failures: 1,
  },
  {
    name: 'multiplica entrada a entrada',
    append:
      'def componer(lista):\n    M = np.ones((2, 2))\n    for N in lista:\n        M = M * N\n    return M\n\n\nC = componer([R, S])\n',
    message: /tiene que devolver la matriz que gira primero y estira después/,
    failures: 1,
  },
  {
    name: 'devuelve una lista en vez de una matriz',
    append: 'def componer(lista):\n    return [lista[1] @ lista[0]]\n\n\nC = componer([R, S])\n',
    message: /tiene que devolver una matriz de NumPy de 2 filas y 2 columnas/,
    failures: 1,
  },
  {
    name: 'la función bien, pero C con el orden contrario',
    append:
      'def componer(lista):\n    M = np.eye(2)\n    for N in lista:\n        M = N @ M\n    return M\n\n\nC = R @ S\n',
    message: /`C` tiene que ser lo que devuelve `componer`/,
    failures: 1,
  },
]);

// ---------- componer.ex02.4: AB distinto de BA ----------

accepts('componer.ex02.4', [
  { name: 'np.array_equal', append: 'AB = A @ B\nBA = B @ A\niguales = np.array_equal(AB, BA)\n' },
  { name: 'todo con .all()', append: 'AB = A @ B\nBA = B @ A\niguales = (AB == BA).all()\n' },
  {
    name: 'bool de allclose',
    append: 'AB = A @ B\nBA = B @ A\niguales = bool(np.allclose(AB, BA))\n',
  },
  {
    name: 'np.dot',
    append: 'AB = np.dot(A, B)\nBA = np.dot(B, A)\niguales = np.allclose(AB, BA)\n',
  },
]);
rejects('componer.ex02.4', [
  {
    name: 'iguales es la matriz de comparaciones',
    append: 'AB = A @ B\nBA = B @ A\niguales = AB == BA\n',
    message: /`iguales` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'iguales vale True',
    append: 'AB = A @ B\nBA = B @ A\niguales = True\n',
    message: /`iguales` vale `True`/,
    failures: 1,
  },
  {
    name: 'BA calculado con el mismo orden que AB',
    append: 'AB = A @ B\nBA = A @ B\niguales = False\n',
    message: /`BA` tiene que valer \(2, 2\)/,
    failures: 1,
  },
  {
    name: 'AB calculado con el orden contrario',
    append: 'AB = B @ A\nBA = B @ A\niguales = False\n',
    message: /`AB` tiene que valer \(2, 1\)/,
    failures: 1,
  },
  {
    name: 'AB como lista en vez de array',
    append: 'AB = [[2, 1], [0, 1]]\nBA = B @ A\niguales = False\n',
    message: /`AB` tiene que ser una matriz de NumPy de 2 filas y 2 columnas/,
    failures: 1,
  },
]);

// ---------- componer.ex02.5: dos capas lineales en una ----------

accepts('componer.ex02.5', [
  { name: 'np.dot', append: 'W = np.dot(W2, W1)\ny = np.dot(W, x)\n' },
  { name: 'y calculada capa a capa', append: 'W = W2 @ W1\ny = W2 @ (W1 @ x)\n' },
  { name: 'np.matmul', append: 'W = np.matmul(W2, W1)\ny = W @ x\n' },
  { name: 'con decimales', append: 'W = (W2 @ W1).astype(float)\ny = W.dot(x)\n' },
  { name: 'multi_dot', append: 'W = np.linalg.multi_dot([W2, W1])\ny = W @ x\n' },
]);
rejects('componer.ex02.5', [
  {
    name: 'las capas en orden contrario',
    append: 'W = W1 @ W2\ny = W2 @ (W1 @ x)\n',
    message: /has multiplicado las capas en orden contrario/,
    failures: 1,
  },
  {
    name: 'W traspuesta',
    append: 'W = (W2 @ W1).T\ny = np.array([11, 3])\n',
    message: /`W` tiene que valer \(1, 5\) en la primera fila/,
    failures: 1,
  },
  {
    name: 'W como lista',
    append: 'W = [[1, 5], [1, 1]]\ny = np.array([11, 3])\n',
    message: /`W` tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'y con la entrada cambiada',
    append: 'W = W2 @ W1\ny = W @ np.array([2, 1])\n',
    message: /`y` tiene que valer \(11, 3\)/,
    failures: 1,
  },
  {
    name: 'y es un solo número',
    append: 'W = W2 @ W1\ny = np.sum(W @ x)\n',
    message: /`y` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
]);

// ---------- examen-0.tres-capas: tres capas lineales en una ----------

accepts('examen-0.tres-capas', [
  { name: 'multi_dot', append: 'W = np.linalg.multi_dot([W3, W2, W1])\ny = W @ x\n' },
  {
    name: 'con paréntesis y la salida capa a capa',
    append: 'W = W3 @ (W2 @ W1)\ny = W3 @ (W2 @ (W1 @ x))\n',
  },
  { name: 'np.dot anidado', append: 'W = np.dot(W3, np.dot(W2, W1))\ny = np.dot(W, x)\n' },
  { name: 'agrupando de izquierda a derecha', append: 'W = (W3 @ W2) @ W1\ny = W @ x\n' },
]);
rejects('examen-0.tres-capas', [
  {
    name: 'las capas en orden contrario',
    append: 'W = W1 @ W2 @ W3\ny = W @ x\n',
    message: /calculada con las capas en orden contrario/,
    failures: 1,
  },
  {
    name: 'capas en un orden mezclado',
    append: 'W = W2 @ W3 @ W1\ny = np.array([2, 3])\n',
    message: /`W` tiene que valer \(0, 2\) en la primera fila/,
    failures: 1,
  },
  {
    name: 'solo dos de las tres capas',
    append: 'W = W2 @ W1\ny = np.array([2, 3])\n',
    message: /`W` tiene que valer \(0, 2\) en la primera fila/,
    failures: 1,
  },
  {
    name: 'y con otra entrada',
    append: 'W = W3 @ W2 @ W1\ny = W @ np.array([1, 0])\n',
    message: /`y` tiene que valer \(2, 3\)/,
    failures: 1,
  },
  {
    name: 'W como lista',
    append: 'W = [[0, 2], [1, 2]]\ny = np.array([2, 3])\n',
    message: /`W` tiene que ser un array de NumPy con números/,
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
