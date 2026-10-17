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
import { matrizVector } from './matriz-vector';
import { examen0MatrizVector } from './examen-0-matriz-vector';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen0MatrizVector
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [
    ...projectQuestions(matrizVector).filter((q): q is CodigoQ => q.type === 'codigo'),
    ...bankCode,
  ].map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'matriz-vector.ex02.1',
  'matriz-vector.ex02.2',
  'matriz-vector.ex02.3',
  'matriz-vector.ex02.4',
  'matriz-vector.ex02.5',
  'examen-0.capa-lote',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del examen', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una más
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

// ---------- ex02.1: w = A @ v con A de 3×2 ----------

accepts('matriz-vector.ex02.1', [
  { name: 'np.dot', append: 'w = np.dot(A, v)\n' },
  { name: 'el método dot', append: 'w = A.dot(v)\n' },
  { name: 'np.matmul', append: 'w = np.matmul(A, v)\n' },
  { name: 'multiplicando y sumando por filas', append: 'w = (A * v).sum(axis=1)\n' },
  { name: 'decimales', append: 'w = A.astype(float) @ v\n' },
]);
rejects('matriz-vector.ex02.1', [
  {
    name: 'A * v, que da una matriz',
    append: 'w = A * v\n',
    message: /eso es lo que da `A \* v`/,
    failures: 1,
  },
  {
    name: 'un vector de 2 componentes',
    append: 'w = A[0] * v\n',
    message: /tiene que ser un vector de 3 componentes/,
    failures: 1,
  },
  {
    name: 'el vector cambiado de signo',
    append: 'w = A @ -v\n',
    message: /tiene que valer \(2, 3, -5\)/,
    failures: 1,
  },
]);

// ---------- ex02.2: aplicar(A, v) con las columnas, sin @ ----------

/** El cuerpo de la función `aplicar` en una variante. */
const F = (body: string): string =>
  `\n\ndef aplicar(A, v):\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;

accepts('matriz-vector.ex02.2', [
  {
    name: 'un acumulador que empieza en cero',
    append: F('w = 0\nfor k in range(A.shape[1]):\n    w += v[k] * A[:, k]\nreturn w'),
  },
  {
    name: 'sum sobre las columnas con zip',
    append: F('return sum(vk * col for vk, col in zip(v, A.T))'),
  },
  {
    name: 'sum sobre los índices',
    append: F('return sum(v[k] * A[:, k] for k in range(len(v)))'),
  },
  {
    name: 'multiplicando y sumando por filas',
    append: F('return np.sum(A * v, axis=1)'),
  },
  {
    name: 'una componente por fila',
    append: F('return np.array([np.sum(A[i] * v) for i in range(A.shape[0])])'),
  },
  {
    name: 'np.zeros con la forma de la salida',
    append: F(
      'w = np.zeros(len(A))\nfor k in range(len(v)):\n    w = w + A[:, k] * v[k]\nreturn w',
    ),
  },
]);
rejects('matriz-vector.ex02.2', [
  {
    name: 'sin return',
    append: F('w = np.zeros(A.shape[0])\nfor k in range(len(v)):\n    w = w + v[k] * A[:, k]'),
    message: /tiene que devolver un array de NumPy/,
    failures: 1,
  },
  {
    name: 'con @',
    append: F('return A @ v'),
    message: /usa `@` o `np.dot`/,
    failures: 1,
  },
  {
    name: 'con np.dot',
    append: F('return np.dot(A, v)'),
    message: /usa `@` o `np.dot`/,
    failures: 1,
  },
  {
    name: 'con el método dot',
    append: F('return A.dot(v)'),
    message: /usa `@` o `np.dot`/,
    failures: 1,
  },
  {
    name: 'solo las dos primeras columnas',
    append: F('return v[0] * A[:, 0] + v[1] * A[:, 1]'),
    message: /no calcula bien `A` por `v` en todos los casos/,
    failures: 1,
  },
  {
    name: 'filas en vez de columnas',
    append: F('w = 0\nfor k in range(len(v)):\n    w = w + v[k] * A[k]\nreturn w'),
    message: /no calcula bien `A` por `v` en todos los casos/,
    failures: 1,
  },
]);

// ---------- ex02.3: la imagen por filas con np.dot ----------

const TRES = 'c0 = np.dot(A[0], v)\nc1 = np.dot(A[1], v)\n';
accepts('matriz-vector.ex02.3', [
  {
    name: 'el producto escalar con @',
    append: 'c0 = A[0] @ v\nc1 = A[1] @ v\nw = np.array([c0, c1])\n',
  },
  {
    name: 'multiplicando y sumando',
    append: 'c0 = (A[0] * v).sum()\nc1 = np.sum(A[1] * v)\nw = np.array([c0, c1])\n',
  },
  {
    name: 'números de Python y decimales',
    append:
      'c0 = float(np.dot(A[0], v))\nc1 = int(np.dot(A[1], v))\nw = np.array([c0, c1], dtype=float)\n',
  },
  {
    name: 'w con la matriz entera',
    append: `${TRES}w = A @ v\n`,
  },
]);
rejects('matriz-vector.ex02.3', [
  {
    name: 'la fila por v sin sumar',
    append: 'c0 = A[0] * v\nc1 = A[1] * v\nw = np.array([c0, c1])\n',
    message: /es una lista de números, no uno solo/,
    failures: 2,
  },
  {
    name: 'las filas cambiadas de sitio',
    append: 'c0 = np.dot(A[1], v)\nc1 = np.dot(A[0], v)\nw = np.array([c0, c1])\n',
    message: /están intercambiados/,
    failures: 1,
  },
  {
    name: 'w con las componentes al revés',
    append: `${TRES}w = np.array([c1, c0])\n`,
    message: /`w` tiene que valer \(4, 3\)/,
    failures: 1,
  },
  {
    name: 'un valor mal calculado',
    append: 'c0 = np.dot(A[0], v) + 1\nc1 = np.dot(A[1], v)\nw = np.array([c0, c1])\n',
    message: /`c0` tiene que valer 4/,
  },
  {
    name: 'sin w',
    append: TRES,
    message: /`w` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
]);

// ---------- ex02.4: un lote de vectores en filas, X @ A.T ----------

accepts('matriz-vector.ex02.4', [
  { name: 'np.dot', append: 'Y = np.dot(X, A.T)\n' },
  { name: 'np.matmul', append: 'Y = np.matmul(X, A.T)\n' },
  { name: 'A por X traspuesta, y vuelta a trasponer', append: 'Y = (A @ X.T).T\n' },
  { name: 'transpose', append: 'Y = X @ A.transpose()\n' },
  { name: 'un vector tras otro', append: 'Y = np.array([A @ x for x in X])\n' },
  { name: 'decimales', append: 'Y = X.astype(float) @ A.T\n' },
]);
rejects('matriz-vector.ex02.4', [
  {
    name: 'X @ A, sin trasponer',
    append: 'Y = X @ A\n',
    message: /es `X @ A`, que usa las filas de `A` como si fueran columnas/,
    failures: 1,
  },
  {
    name: 'una columna por vector',
    append: 'Y = A @ X.T\n',
    message: /está traspuesta/,
    failures: 1,
  },
  {
    name: 'las entradas sin transformar',
    append: 'Y = X\n',
    message: /no tiene los valores esperados/,
    failures: 1,
  },
  {
    name: 'un solo vector',
    append: 'Y = A @ X[0]\n',
    message: /tiene que tener 4 filas y 2 columnas/,
    failures: 1,
  },
]);

// ---------- ex02.5: la capa lineal y el lote con sesgo ----------

const CAPA = (body: string): string =>
  `\n\ndef capa(W, b, x):\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;

accepts('matriz-vector.ex02.5', [
  {
    name: 'np.dot y el sesgo delante, con y e Y por otro camino',
    append: `${CAPA('return b + np.dot(W, x)')}y = W @ np.array([1, 2, 1]) + b\nY = np.dot(X, W.T) + b\n`,
  },
  {
    name: 'la salida en una variable, y el lote con la transpuesta',
    append: `${CAPA('z = W @ x\nz = z + b\nreturn z')}y = capa(W, b, np.array([1, 2, 1]))\nY = (W @ X.T).T + b\n`,
  },
  {
    name: 'el lote con un bucle sobre la función',
    append: `${CAPA('return W @ x + b')}y = capa(W, b, X[0])\nY = np.array([capa(W, b, x) for x in X])\n`,
  },
  {
    name: 'el sesgo sumado con np.add',
    append: `${CAPA('return np.add(W @ x, b)')}y = capa(W, b, np.array([1, 2, 1]))\nY = np.add(X @ W.T, b)\n`,
  },
]);
const BIEN = `y = capa(W, b, np.array([1, 2, 1]))\nY = X @ W.T + b\n`;
rejects('matriz-vector.ex02.5', [
  {
    name: 'la función sin sesgo',
    append: `${CAPA('return W @ x')}${BIEN}`,
    message: /no suma el sesgo `b`/,
    failures: 2,
  },
  {
    name: 'el sesgo restado',
    append: `${CAPA('return W @ x - b')}${BIEN}`,
    message: /no calcula bien la capa en todos los casos/,
    failures: 2,
  },
  {
    name: 'el lote sin sesgo',
    append: `${CAPA('return W @ x + b')}y = capa(W, b, np.array([1, 2, 1]))\nY = X @ W.T\n`,
    message: /`Y` no incluye el sesgo `b`/,
    failures: 1,
  },
  {
    name: 'una columna por vector',
    append: `${CAPA('return W @ x + b')}y = capa(W, b, np.array([1, 2, 1]))\nY = W @ X\n`,
    message: /`Y` tiene que tener 3 filas y 2 columnas/,
    failures: 1,
  },
  {
    name: 'la función sin return',
    append: `${CAPA('z = W @ x + b')}y = np.array([0, 4])\nY = X @ W.T + b\n`,
    message: /tiene que devolver un array de NumPy/,
    failures: 1,
  },
]);

// ---------- examen-0.capa-lote: puntuaciones y clase de cada texto ----------

accepts('examen-0.capa-lote', [
  {
    name: 'np.dot y argmax como método',
    append: 'Y = np.dot(X, W.T) + b\nclases = Y.argmax(axis=1)\n',
  },
  {
    name: 'W por X traspuesta y clases como lista',
    append: 'Y = (W @ X.T).T + b\nclases = [int(np.argmax(f)) for f in Y]\n',
  },
  {
    name: 'una tupla de clases',
    append: 'Y = X @ W.T + b\nclases = tuple(np.argmax(Y, axis=1))\n',
  },
  {
    name: 'las clases a mano con una comparación',
    append: 'Y = X @ W.T + b\nclases = (Y[:, 1] > Y[:, 0]).astype(int)\n',
  },
]);
rejects('examen-0.capa-lote', [
  {
    name: 'sin sesgo',
    append: 'Y = X @ W.T\nclases = np.argmax(Y, axis=1)\n',
    message: /`Y` no incluye el sesgo `b`/,
    failures: 1,
  },
  {
    name: 'la mejor puntuación por columnas',
    append: 'Y = X @ W.T + b\nclases = np.argmax(Y, axis=0)\n',
    message: /`clases` tiene 2 números/,
    failures: 1,
  },
  {
    name: 'una columna por texto',
    append: 'Y = (X @ W.T + b).T\nclases = np.array([1, 1, 0])\n',
    message: /`Y` tiene que tener 3 filas y 2 columnas/,
    failures: 1,
  },
  {
    name: 'las clases con otro orden',
    append: 'Y = X @ W.T + b\nclases = np.array([0, 1, 0])\n',
    message: /`clases` tiene que valer \(1, 1, 0\)/,
    failures: 1,
  },
  {
    name: 'un solo número en vez de una clase por texto',
    append: 'Y = X @ W.T + b\nclases = np.argmax(Y)\n',
    message: /`clases` tiene que tener 3 números/,
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
