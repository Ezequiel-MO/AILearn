import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  describeRun,
  defineHintTests,
  getPyodide,
} from '../../../tests/content/python-helpers';
import {
  NUMPY_ENGLISH,
  garbageProbes,
  projectQuestions,
} from '../../../tests/content/prose-helpers';
import { columnas } from './columnas';
import { examen0Columnas } from './examen-0-columnas';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen0Columnas
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [...projectQuestions(columnas).filter((q): q is CodigoQ => q.type === 'codigo'), ...bankCode].map(
    (q) => [q.id, q],
  ),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const BANK = 'examen-0.columnas-con-numpy';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([...[1, 2, 3, 4, 5].map((n) => `columnas.ex02.${n}`), BANK]);
  });
  for (const id of byId.keys()) {
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

// ---------- ex02.1: construir A con las imágenes en columnas ----------

accepts('columnas.ex02.1', [
  { name: 'filas y traspuesta', append: 'A = np.array([img_i, img_j]).T\n' },
  { name: 'np.stack con axis=1', append: 'A = np.stack([img_i, img_j], axis=1)\n' },
  { name: 'np.vstack y traspuesta', append: 'A = np.vstack([img_i, img_j]).T\n' },
  { name: 'la matriz escrita a mano', append: 'A = np.array([[2, -1], [1, 3]])\n' },
  {
    name: 'componente a componente',
    append: 'A = np.array([[img_i[0], img_j[0]], [img_i[1], img_j[1]]])\n',
  },
]);
rejects('columnas.ex02.1', [
  {
    name: 'las imágenes como filas',
    append: 'A = np.array([img_i, img_j])\n',
    message: /imágenes de î y de ĵ en las filas/,
    failures: 1,
  },
  {
    name: 'columnas en el orden contrario',
    append: 'A = np.column_stack([img_j, img_i])\n',
    message: /no tiene las columnas pedidas/,
    failures: 1,
  },
  {
    name: 'np.hstack da un solo vector',
    append: 'A = np.hstack([img_i, img_j])\n',
    message: /array de NumPy de 2 filas y 2 columnas/,
    failures: 1,
  },
]);

// ---------- ex02.2: las dos columnas con rebanadas ----------

accepts('columnas.ex02.2', [
  { name: 'la traspuesta', append: 'col_i = A.T[0]\ncol_j = A.T[1]\n' },
  { name: 'índice -1 para la última', append: 'col_i = A[:, 0]\ncol_j = A[:, -1]\n' },
  { name: 'con puntos suspensivos', append: 'col_i = A[..., 0]\ncol_j = A[..., 1]\n' },
  {
    name: 'elemento a elemento',
    append: 'col_i = np.array([A[0, 0], A[1, 0]])\ncol_j = np.array([A[0, 1], A[1, 1]])\n',
  },
]);
rejects('columnas.ex02.2', [
  {
    name: 'las filas en lugar de las columnas',
    append: 'col_i = A[0]\ncol_j = A[1]\n',
    message:
      /`col_i` vale \(3, -1\): es la primera fila[\s\S]*`col_j` vale \(2, 4\): es la segunda fila/,
    failures: 2,
  },
  {
    name: 'columnas intercambiadas',
    append: 'col_i = A[:, 1]\ncol_j = A[:, 0]\n',
    message: /`col_i` tiene que valer \(3, 2\)[\s\S]*`col_j` tiene que valer \(-1, 4\)/,
    failures: 2,
  },
]);

// ---------- ex02.3: la identidad ----------

accepts('columnas.ex02.3', [
  { name: 'np.identity', append: 'I = np.identity(2)\nw = I @ v\n' },
  { name: 'la identidad escrita a mano', append: 'I = np.array([[1, 0], [0, 1]])\nw = I @ v\n' },
  { name: 'np.dot', append: 'I = np.eye(2)\nw = np.dot(I, v)\n' },
  { name: 'enteros', append: 'I = np.eye(2, dtype=int)\nw = I @ v\n' },
]);
rejects('columnas.ex02.3', [
  {
    name: 'una matriz de unos',
    append: 'I = np.ones((2, 2))\nw = I @ v\n',
    message: /unos también fuera de la diagonal/,
    failures: 2,
  },
  {
    name: 'np.eye(3)',
    append: 'I = np.eye(3)\nw = v\n',
    message: /3 filas y 3 columnas/,
    failures: 1,
  },
  {
    name: 'una matriz que intercambia las coordenadas',
    append: 'I = np.array([[0, 1], [1, 0]])\nw = I @ v\n',
    message: /`I` no es la identidad/,
    failures: 2,
  },
  {
    name: 'multiplicar con el asterisco',
    append: 'I = np.eye(2)\nw = I * v\n',
    message: /`w` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
]);

// ---------- ex02.4: la función matriz_desde ----------

accepts('columnas.ex02.4', [
  {
    name: 'filas y traspuesta',
    append: 'def matriz_desde(img_i, img_j):\n    return np.array([img_i, img_j]).T\n',
  },
  {
    name: 'rellenando las columnas',
    append:
      'def matriz_desde(img_i, img_j):\n    M = np.zeros((2, 2))\n    M[:, 0] = img_i\n    M[:, 1] = img_j\n    return M\n',
  },
  {
    name: 'componente a componente',
    append:
      'def matriz_desde(img_i, img_j):\n    return np.array([[img_i[0], img_j[0]], [img_i[1], img_j[1]]])\n',
  },
  {
    name: 'np.stack con axis=1',
    append: 'def matriz_desde(img_i, img_j):\n    return np.stack([img_i, img_j], axis=1)\n',
  },
]);
rejects('columnas.ex02.4', [
  {
    name: 'sin return',
    append: '',
    message: /falta el `return`/,
    failures: 1,
  },
  {
    name: 'las imágenes como filas',
    append: 'def matriz_desde(img_i, img_j):\n    return np.array([img_i, img_j])\n',
    message: /devuelve las imágenes en las filas/,
    failures: 1,
  },
  {
    name: 'np.hstack da un solo vector',
    append: 'def matriz_desde(img_i, img_j):\n    return np.hstack([img_i, img_j])\n',
    message: /array de NumPy de 2 filas y 2 columnas/,
    failures: 1,
  },
  {
    name: 'columnas en el orden contrario',
    append: 'def matriz_desde(img_i, img_j):\n    return np.column_stack([img_j, img_i])\n',
    message: /no devuelve la matriz correcta en todos los casos/,
    failures: 1,
  },
  {
    name: 'una matriz fija',
    append: 'def matriz_desde(img_i, img_j):\n    return np.array([[1, 3], [2, 4]])\n',
    message: /no devuelve la matriz correcta en todos los casos/,
    failures: 1,
  },
]);

// ---------- ex02.5: la columna de una característica y la salida que más empuja ----------

accepts('columnas.ex02.5', [
  {
    name: 'la traspuesta y la posición con index',
    append: 'col = W.T[2]\nposicion = list(col).index(max(col))\n',
  },
  { name: 'el método argmax', append: 'col = W[:, 2]\nposicion = int(col.argmax())\n' },
  {
    name: 'elemento a elemento',
    append: 'col = np.array([W[0, 2], W[1, 2], W[2, 2]])\nposicion = np.argmax(W[:, 2])\n',
  },
]);
rejects('columnas.ex02.5', [
  {
    name: 'una fila en lugar de una columna',
    append: 'col = W[2]\nposicion = np.argmax(col)\n',
    message: /es una fila de `W`/,
    failures: 2,
  },
  {
    name: 'el peso en lugar de su posición',
    append: 'col = W[:, 2]\nposicion = np.max(col)\n',
    message: /peso mayor de la columna y no su posición/,
    failures: 1,
  },
  {
    name: 'np.argmin',
    append: 'col = W[:, 2]\nposicion = np.argmin(col)\n',
    message: /la que menos empuja/,
    failures: 1,
  },
  {
    name: 'otra columna',
    append: 'col = W[:, 1]\nposicion = np.argmax(col)\n',
    message: /`col` tiene que valer \(-2, 1, 6\)/,
    failures: 2,
  },
]);

// ---------- examen-0.columnas-con-numpy ----------

accepts(BANK, [
  { name: 'índice 2 y shape[-1]', append: 'ultima = A[:, 2]\nentradas = A.shape[-1]\n' },
  { name: 'la traspuesta y len', append: 'ultima = A.T[-1]\nentradas = len(A[0])\n' },
  { name: 'np.shape', append: 'ultima = A[:, -1]\nentradas = np.shape(A)[1]\n' },
]);
rejects(BANK, [
  {
    name: 'la última fila',
    append: 'ultima = A[-1]\nentradas = A.shape[1]\n',
    message: /es la última fila de `A`/,
    failures: 1,
  },
  {
    name: 'la primera columna',
    append: 'ultima = A[:, 0]\nentradas = A.shape[1]\n',
    message: /es la primera columna de `A`/,
    failures: 1,
  },
  {
    name: 'las filas en lugar de las columnas',
    append: 'ultima = A[:, -1]\nentradas = A.shape[0]\n',
    message: /es el número de filas/,
    failures: 1,
  },
]);

// ---------- datos de tipo equivocado: ninguna comprobación saca un error de NumPy en inglés ----------

describe('datos de tipo equivocado: sin errores de NumPy en inglés', { timeout: 60_000 }, () => {
  for (const q of [...byId.values()]) {
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
  'columnas.ex02.1': ['img_i', 'img_j'],
  'columnas.ex02.2': ['0', '1'],
  'columnas.ex02.3': ['2', 'I', 'v'],
  'columnas.ex02.4': ['img_i', 'img_j'],
  'columnas.ex02.5': ['2', 'argmax'],
};

defineHintTests(
  projectQuestions(columnas).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);
