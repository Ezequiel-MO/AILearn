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
import {
  NUMPY_ENGLISH,
  garbageProbes,
  projectQuestions,
} from '../../../tests/content/prose-helpers';
import { rango } from './rango';
import { examen1Rango } from './examen-1-rango';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(rango), ...examen1Rango.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'rango.ex02.1',
  'rango.ex02.2',
  'rango.ex02.3',
  'rango.ex02.4',
  'rango.ex02.5',
  'examen-1.columna-redundante',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una
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

// ---------- rango.ex02.1: matrix_rank de dos matrices ----------

accepts('rango.ex02.1', [
  {
    name: 'con int',
    append: 'rA = int(np.linalg.matrix_rank(A))\nrB = int(np.linalg.matrix_rank(B))\n',
  },
  {
    name: 'rango de la traspuesta',
    append: 'rA = np.linalg.matrix_rank(A.T)\nrB = np.linalg.matrix_rank(B.T)\n',
  },
  {
    name: 'importando la función',
    append: 'from numpy.linalg import matrix_rank\n\nrA = matrix_rank(A)\nrB = matrix_rank(B)\n',
  },
]);
rejects('rango.ex02.1', [
  {
    name: 'el determinante en vez del rango',
    append: 'rA = np.linalg.det(A)\nrB = np.linalg.det(B)\n',
    message: /`rA` tiene que ser un número entero/,
  },
  {
    name: 'el tamaño de la matriz en vez del rango de B',
    append: 'rA = np.linalg.matrix_rank(A)\nrB = B.shape[0]\n',
    message: /`rB` vale 3, el tamaño de la matriz/,
    failures: 1,
  },
  {
    name: 'rA igual a 2',
    append: 'rA = 2\nrB = np.linalg.matrix_rank(B)\n',
    message: /`rA` tiene que valer 1/,
    failures: 1,
  },
  {
    name: 'rB igual a 1',
    append: 'rA = np.linalg.matrix_rank(A)\nrB = 1\n',
    message: /`rB` tiene que valer 2/,
    failures: 1,
  },
  {
    name: 'rA como lista',
    append: 'rA = [1]\nrB = np.linalg.matrix_rank(B)\n',
    message: /`rA` tiene que ser un número entero/,
    failures: 1,
  },
]);

// ---------- rango.ex02.2: columnas quitables ----------

accepts('rango.ex02.2', [
  {
    name: 'bucle con np.delete',
    append:
      'r = np.linalg.matrix_rank(X)\nquitables = []\nfor k in range(4):\n    if np.linalg.matrix_rank(np.delete(X, k, axis=1)) == r:\n        quitables.append(k)\n',
  },
  {
    name: 'columnas elegidas por índices',
    append:
      'r = int(np.linalg.matrix_rank(X))\nquitables = [k for k in range(4) if np.linalg.matrix_rank(X[:, [j for j in range(4) if j != k]]) == r]\n',
  },
  {
    name: 'la lista como array',
    append:
      'r = np.linalg.matrix_rank(X)\nquitables = np.array([k for k in range(X.shape[1]) if np.linalg.matrix_rank(np.delete(X, k, 1)) >= r])\n',
  },
  { name: 'la lista a mano', append: 'r = np.linalg.matrix_rank(X)\nquitables = [2, 1, 0]\n' },
]);
rejects('rango.ex02.2', [
  {
    name: 'solo la columna 2, la suma',
    append: 'r = np.linalg.matrix_rank(X)\nquitables = [2]\n',
    message: /`quitables` solo tiene la columna 2/,
    failures: 1,
  },
  {
    name: 'todas las columnas',
    append: 'r = np.linalg.matrix_rank(X)\nquitables = [0, 1, 2, 3]\n',
    message: /incluye todas las columnas/,
    failures: 1,
  },
  {
    name: 'solo la columna independiente',
    append: 'r = np.linalg.matrix_rank(X)\nquitables = [3]\n',
    message: /`quitables` tiene que ser la lista de las columnas cuya ausencia/,
    failures: 1,
  },
  {
    name: 'el rango es el número de columnas',
    append: 'r = X.shape[1]\nquitables = [0, 1, 2]\n',
    message: /`r` tiene que valer 3/,
    failures: 1,
  },
  {
    name: 'un solo número en vez de una lista',
    append: 'r = np.linalg.matrix_rank(X)\nquitables = 2\n',
    message: /`quitables` tiene que ser una lista de índices/,
    failures: 1,
  },
]);

// ---------- rango.ex02.3: producto exterior ----------

accepts('rango.ex02.3', [
  { name: 'con int', append: 'M = np.outer(u, v)\nr = int(np.linalg.matrix_rank(M))\n' },
  { name: 'con broadcasting', append: 'M = u[:, None] * v\nr = np.linalg.matrix_rank(M)\n' },
  {
    name: 'con dot de una columna y una fila',
    append: 'M = np.dot(u.reshape(4, 1), v.reshape(1, 3))\nr = np.linalg.matrix_rank(M)\n',
  },
  {
    name: 'con decimales',
    append: 'M = np.outer(u, v).astype(float)\nr = np.linalg.matrix_rank(M)\n',
  },
  {
    name: 'rango de la traspuesta',
    append: 'M = np.outer(u, v)\nr = np.linalg.matrix_rank(M.T)\n',
  },
]);
rejects('rango.ex02.3', [
  {
    name: 'u y v al revés',
    append: 'M = np.outer(v, u)\nr = np.linalg.matrix_rank(M)\n',
    message: /has puesto `u` y `v` al revés/,
    failures: 1,
  },
  {
    name: 'una matriz que no es el producto exterior',
    append: 'M = np.outer(u, v + 1)\nr = np.linalg.matrix_rank(M)\n',
    message: /`M` tiene que tener en la fila `i` y la columna `j`/,
    failures: 1,
  },
  {
    name: 'el rango es el número de filas',
    append: 'M = np.outer(u, v)\nr = M.shape[0]\n',
    message: /`r` tiene que valer 1/,
    failures: 1,
  },
  {
    name: 'el rango es 2',
    append: 'M = np.outer(u, v)\nr = 2\n',
    message: /`r` tiene que valer 1/,
    failures: 1,
  },
  {
    name: 'M como lista',
    append: 'M = [[3, 1, 2]]\nr = 1\n',
    message: /`M` tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'M de forma distinta',
    append: 'M = np.outer(u[:3], v)\nr = 1\n',
    message: /`M` tiene que ser de 4 filas y 3 columnas/,
    failures: 1,
  },
]);

// ---------- rango.ex02.4: cuello de botella ----------

accepts('rango.ex02.4', [
  {
    name: 'invertible con el tamaño',
    append: 'W = B @ A\nr = int(np.linalg.matrix_rank(W))\ninvertible = bool(r == W.shape[0])\n',
  },
  {
    name: 'np.dot y la comparación con 5',
    append: 'W = np.dot(B, A)\nr = np.linalg.matrix_rank(W)\ninvertible = r == 5\n',
  },
  {
    name: 'rango máximo del tamaño con el operador distinto',
    append: 'W = np.matmul(B, A)\nr = np.linalg.matrix_rank(W)\ninvertible = not (r < 5)\n',
  },
  {
    name: 'invertible escrito a mano',
    append: 'W = B @ A\nr = np.linalg.matrix_rank(W)\ninvertible = False\n',
  },
]);
rejects('rango.ex02.4', [
  {
    name: 'las capas en orden contrario',
    append: 'W = A @ B\nr = np.linalg.matrix_rank(W)\ninvertible = False\n',
    message: /has multiplicado `A @ B`/,
    failures: 1,
  },
  {
    name: 'el rango es el tamaño',
    append: 'W = B @ A\nr = 5\ninvertible = False\n',
    message: /`r` vale 5, el tamaño de `W`/,
    failures: 1,
  },
  {
    name: 'el rango es 3',
    append: 'W = B @ A\nr = 3\ninvertible = False\n',
    message: /`r` tiene que valer 2/,
    failures: 1,
  },
  {
    name: 'invertible vale True',
    append: 'W = B @ A\nr = np.linalg.matrix_rank(W)\ninvertible = True\n',
    message: /`invertible` vale `True`/,
    failures: 1,
  },
  {
    name: 'invertible es una cadena',
    append: 'W = B @ A\nr = np.linalg.matrix_rank(W)\ninvertible = "no"\n',
    message: /`invertible` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'W como lista',
    append: 'W = (B @ A).tolist()\nr = 2\ninvertible = False\n',
    message: /`W` tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'W con una entrada cambiada',
    append: 'W = B @ A\nW[0, 0] = 9\nr = 2\ninvertible = False\n',
    message: /`W` tiene que ser la segunda capa por la primera/,
    failures: 1,
  },
]);

// ---------- rango.ex02.5: números de una matriz de rango bajo ----------

accepts('rango.ex02.5', [
  { name: 'con números a mano', append: 'n_densa = 589824\nn_baja = 98304\nrazon = 6\n' },
  {
    name: 'con división entera',
    append: 'n_densa = d ** 2\nn_baja = 2 * d * r\nrazon = n_densa // n_baja\n',
  },
  {
    name: 'con tamaños de np.zeros',
    append:
      'n_densa = np.zeros((d, d)).size\nn_baja = np.zeros((d, r)).size + np.zeros((r, d)).size\nrazon = n_densa / n_baja\n',
  },
]);
rejects('rango.ex02.5', [
  {
    name: 'solo una de las dos matrices pequeñas',
    append: 'n_densa = d * d\nn_baja = d * r\nrazon = 6\n',
    message: /`n_baja` vale 49152, la mitad/,
    failures: 1,
  },
  {
    name: 'la razón al revés',
    append: 'n_densa = d * d\nn_baja = d * r + r * d\nrazon = n_baja / n_densa\n',
    message: /`razon` está al revés/,
    failures: 1,
  },
  {
    name: 'n_densa con el rango',
    append: 'n_densa = d * r\nn_baja = d * r + r * d\nrazon = 6\n',
    message: /`n_densa` tiene que valer 589824/,
    failures: 1,
  },
  {
    name: 'n_baja con las dos matrices cuadradas',
    append: 'n_densa = d * d\nn_baja = d * d + r * r\nrazon = 6\n',
    message: /`n_baja` tiene que valer 98304/,
    failures: 1,
  },
  {
    name: 'una razón que no es ni 6 ni su inverso',
    append: 'n_densa = d * d\nn_baja = d * r + r * d\nrazon = 5\n',
    message: /`razon` tiene que valer 6/,
    failures: 1,
  },
  {
    name: 'una cadena en n_baja',
    append: 'n_densa = d * d\nn_baja = "98304"\nrazon = 6\n',
    message: /`n_baja` tiene que ser un número/,
    failures: 1,
  },
]);

// ---------- examen-1.columna-redundante: añadir una columna combinación ----------

accepts('examen-1.columna-redundante', [
  {
    name: 'np.hstack con la columna remodelada',
    append:
      'c = 2 * X[:, 0] - X[:, 1]\nX2 = np.hstack([X, c.reshape(4, 1)])\nr0 = np.linalg.matrix_rank(X)\nr1 = np.linalg.matrix_rank(X2)\n',
  },
  {
    name: 'np.c_',
    append:
      'X2 = np.c_[X, 2 * X[:, 0] - X[:, 1]]\nr0 = int(np.linalg.matrix_rank(X))\nr1 = int(np.linalg.matrix_rank(X2))\n',
  },
  {
    name: 'la columna como producto por un vector',
    append:
      'X2 = np.concatenate([X, (X @ np.array([2, -1]))[:, None]], axis=1)\nr0 = np.linalg.matrix_rank(X)\nr1 = np.linalg.matrix_rank(X2)\n',
  },
  {
    name: 'los rangos escritos a mano',
    append: 'X2 = np.column_stack([X, 2 * X[:, 0] - X[:, 1]])\nr0 = 2\nr1 = 2\n',
  },
]);
rejects('examen-1.columna-redundante', [
  {
    name: 'una columna independiente: el rango sube',
    append:
      'X2 = np.column_stack([X, [1, 0, 0, 0]])\nr0 = np.linalg.matrix_rank(X)\nr1 = np.linalg.matrix_rank(X2)\n',
    message: /La tercera columna de `X2` tiene que valer \(2, -1, 1, 3\)/,
    failures: 2,
  },
  {
    name: 'la combinación con los signos cambiados',
    append:
      'X2 = np.column_stack([X, X[:, 1] - 2 * X[:, 0]])\nr0 = np.linalg.matrix_rank(X)\nr1 = np.linalg.matrix_rank(X2)\n',
    message: /La tercera columna de `X2` tiene que valer/,
    failures: 1,
  },
  {
    name: 'X2 es igual a X',
    append: 'X2 = X\nr0 = np.linalg.matrix_rank(X)\nr1 = np.linalg.matrix_rank(X2)\n',
    message: /`X2` tiene que tener 4 filas y 3 columnas/,
    failures: 1,
  },
  {
    name: 'r0 es el número de columnas',
    append:
      'X2 = np.column_stack([X, 2 * X[:, 0] - X[:, 1]])\nr0 = X2.shape[1]\nr1 = np.linalg.matrix_rank(X2)\n',
    message: /`r0` tiene que valer 2/,
    failures: 1,
  },
  {
    name: 'r1 es el número de columnas',
    append:
      'X2 = np.column_stack([X, 2 * X[:, 0] - X[:, 1]])\nr0 = np.linalg.matrix_rank(X)\nr1 = X2.shape[1]\n',
    message: /`r1` tiene que valer 2/,
    failures: 1,
  },
  {
    name: 'X2 como lista',
    append: 'X2 = [[1, 0, 2]]\nr0 = 2\nr1 = 2\n',
    message: /`X2` tiene que ser un array de NumPy con números/,
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

// ---------- pistas de las cinco preguntas de código del ejercicio «Programar» ----------

/** Lo que va en cada hueco `___` del esqueleto de la última pista, en orden. */
const SKELETON_FILLS: Record<string, string[]> = {
  'rango.ex02.1': ['A', 'B'],
  'rango.ex02.2': ['X', '==', 'k'],
  'rango.ex02.3': ['u', 'v', 'M'],
  'rango.ex02.4': ['B', 'A', '=='],
  'rango.ex02.5': ['d', 'r', 'n_densa', 'n_baja'],
};

defineHintTests(
  projectQuestions(rango).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);
