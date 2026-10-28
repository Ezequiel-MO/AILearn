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
import { inversa } from './inversa';
import { examen1Inversa } from './examen-1-inversa';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(inversa), ...examen1Inversa.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'inversa.ex02.1',
  'inversa.ex02.2',
  'inversa.ex02.3',
  'inversa.ex02.4',
  'inversa.ex02.5',
  'examen-1.sistema-en-codigo',
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

// ---------- inversa.ex02.1: inv y comprobación con allclose ----------

accepts('inversa.ex02.1', [
  {
    name: 'con bool y la inversa por la izquierda',
    append: 'Ainv = np.linalg.inv(A)\nes_inversa = bool(np.allclose(Ainv @ A, np.eye(2)))\n',
  },
  {
    name: 'la inversa escrita a mano con la fórmula',
    append: 'Ainv = np.array([[1, -3], [-1, 4]])\nes_inversa = np.allclose(A @ Ainv, np.eye(2))\n',
  },
  {
    name: 'np.identity y np.dot',
    append: 'Ainv = np.linalg.inv(A)\nes_inversa = np.allclose(np.dot(A, Ainv), np.identity(2))\n',
  },
  {
    name: 'la comparación hecha con una diferencia pequeña',
    append: 'Ainv = np.linalg.inv(A)\nes_inversa = np.abs(A @ Ainv - np.eye(2)).max() < 1e-9\n',
  },
]);
rejects('inversa.ex02.1', [
  {
    name: 'el inverso de cada entrada, 1 / A',
    append: 'Ainv = 1 / A\nes_inversa = np.allclose(A @ Ainv, np.eye(2))\n',
    message: /inverso de cada entrada por separado/,
    failures: 1,
  },
  {
    name: 'la traspuesta en vez de la inversa',
    append: 'Ainv = A.T\nes_inversa = np.allclose(A @ Ainv, np.eye(2))\n',
    message: /`Ainv` tiene que valer \(1, -3\) en la primera fila/,
    failures: 1,
  },
  {
    name: 'la comparación con == da un array',
    append: 'Ainv = np.linalg.inv(A)\nes_inversa = A @ Ainv == np.eye(2)\n',
    message: /`es_inversa` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'Ainv como lista',
    append: 'Ainv = [[1, -3], [-1, 4]]\nes_inversa = True\n',
    message: /`Ainv` tiene que ser una matriz de NumPy de 2 filas y 2 columnas/,
  },
  {
    name: 'es_inversa como número',
    append: 'Ainv = np.linalg.inv(A)\nes_inversa = 1\n',
    message: /`es_inversa` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
]);

// ---------- inversa.ex02.2: solve ----------

accepts('inversa.ex02.2', [
  {
    name: 'la inversa por el vector',
    append: 'x = np.linalg.inv(A) @ b\ncoincide = np.allclose(A @ x, b)\n',
  },
  {
    name: 'mínimos cuadrados, que en un sistema cuadrado da la solución',
    append: 'x = np.linalg.lstsq(A, b, rcond=None)[0]\ncoincide = bool(np.allclose(A.dot(x), b))\n',
  },
  {
    name: 'la comprobación con la norma del residuo',
    append: 'x = np.linalg.solve(A, b)\ncoincide = np.linalg.norm(A @ x - b) < 1e-9\n',
  },
]);
rejects('inversa.ex02.2', [
  {
    name: 'la inversa multiplicada entrada a entrada',
    append: 'x = np.linalg.inv(A) * b\ncoincide = True\n',
    message: /`x` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
  {
    name: 'A @ b en vez de resolver',
    append: 'x = A @ b\ncoincide = np.allclose(A @ x, b)\n',
    message: /`x` tiene que valer \(1, 3\)/,
    failures: 1,
  },
  {
    name: 'la solución como lista',
    append: 'x = np.linalg.solve(A, b).tolist()\ncoincide = True\n',
    message: /`x` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
  {
    name: 'la comparación con == da un array',
    append: 'x = np.linalg.solve(A, b)\ncoincide = A @ x == b\n',
    message: /`coincide` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'coincide en False aunque la solución es buena',
    append: 'x = np.linalg.solve(A, b)\ncoincide = False\n',
    message: /`coincide` vale `False`, pero `A @ x` sí da `b`/,
    failures: 1,
  },
]);

// ---------- inversa.ex02.3: inversa_segura ----------

accepts('inversa.ex02.3', [
  {
    name: 'el determinante a mano con una tolerancia',
    append: `def inversa_segura(M):
    d = M[0, 0] * M[1, 1] - M[0, 1] * M[1, 0]
    if abs(d) < 1e-9:
        return None
    return np.linalg.inv(M)


Ainv = inversa_segura(A)
`,
  },
  {
    name: 'la fórmula de 2x2 sin llamar a inv',
    append: `def inversa_segura(M):
    d = np.linalg.det(M)
    if np.isclose(d, 0):
        return None
    a, b, c, e = M[0, 0], M[0, 1], M[1, 0], M[1, 1]
    return np.array([[e, -b], [-c, a]]) / d


Ainv = inversa_segura(A)
`,
  },
]);
rejects('inversa.ex02.3', [
  {
    name: 'invertir sin mirar el determinante',
    append: `def inversa_segura(M):
    return np.linalg.inv(M)


Ainv = inversa_segura(A)
`,
    message: /tiene que devolver `None` con una matriz singular/,
    failures: 1,
  },
  {
    name: 'lanzar una excepción propia con una singular',
    append: `def inversa_segura(M):
    if np.isclose(np.linalg.det(M), 0):
        raise ValueError("singular")
    return np.linalg.inv(M)


Ainv = inversa_segura(A)
`,
    message: /`inversa_segura` lanza un error con una matriz singular/,
    failures: 1,
  },
  {
    name: 'devolver ceros en vez de None con una singular',
    append: `def inversa_segura(M):
    if np.isclose(np.linalg.det(M), 0):
        return np.zeros((2, 2))
    return np.linalg.inv(M)


Ainv = inversa_segura(A)
`,
    message: /tiene que devolver `None` con una matriz singular/,
    failures: 1,
  },
  {
    name: 'devolver siempre None, como el starter',
    append: 'Ainv = inversa_segura(A)\n',
    message: /tiene que devolver la inversa de una matriz que sí la tiene/,
  },
  {
    name: 'devolver la matriz sin invertir',
    append: `def inversa_segura(M):
    if np.isclose(np.linalg.det(M), 0):
        return None
    return M


Ainv = inversa_segura(A)
`,
    message: /tiene que devolver la inversa de una matriz que sí la tiene/,
  },
  {
    name: 'Ainv sin llamar a la función',
    append: `def inversa_segura(M):
    if np.isclose(np.linalg.det(M), 0):
        return None
    return np.linalg.inv(M)


Ainv = A
`,
    message: /`Ainv` tiene que valer \(7, -2\) en la primera fila/,
    failures: 1,
  },
]);

// ---------- inversa.ex02.4: deshacer dos capas ----------

accepts('inversa.ex02.4', [
  { name: 'solve con el producto de las capas', append: 'x = np.linalg.solve(B @ A, y)\n' },
  {
    name: 'dos sistemas seguidos',
    append: 'x = np.linalg.solve(A, np.linalg.solve(B, y))\n',
  },
  { name: 'la inversa del producto', append: 'x = np.linalg.inv(B @ A) @ y\n' },
  {
    name: 'capa a capa con variables intermedias',
    append: 'h = np.linalg.inv(B) @ y\nx = np.linalg.inv(A) @ h\n',
  },
]);
rejects('inversa.ex02.4', [
  {
    name: 'las inversas en el mismo orden que las capas',
    append: 'x = np.linalg.inv(B) @ np.linalg.inv(A) @ y\n',
    message: /deshacer las capas en el mismo orden en que se aplicaron/,
    failures: 1,
  },
  {
    name: 'la inversa de A @ B',
    append: 'x = np.linalg.inv(A @ B) @ y\n',
    message: /deshacer las capas en el mismo orden en que se aplicaron/,
    failures: 1,
  },
  {
    name: 'x = y, sin deshacer nada',
    append: 'x = y\n',
    message: /`x` tiene que valer \(2, 1\)/,
    failures: 1,
  },
  {
    name: 'solo se deshace una capa',
    append: 'x = np.linalg.inv(B) @ y\n',
    message: /`x` tiene que valer \(2, 1\)/,
    failures: 1,
  },
  {
    name: 'x como lista',
    append: 'x = [2, 1]\n',
    message: /`x` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
]);

// ---------- inversa.ex02.5: recuperar la entrada de una capa ----------

accepts('inversa.ex02.5', [
  {
    name: 'la inversa por el vector sin sesgo',
    append: 'x = np.linalg.inv(W) @ (y - b)\nreconstruye = np.allclose(W @ x + b, y)\n',
  },
  {
    name: 'con el sesgo restado en una variable aparte',
    append:
      'z = y - b\nx = np.linalg.solve(W, z)\nreconstruye = bool(np.allclose(np.dot(W, x) + b, y))\n',
  },
  {
    name: 'comprobación con un residuo pequeño',
    append: 'x = np.linalg.solve(W, y - b)\nreconstruye = np.abs(W @ x + b - y).max() < 1e-9\n',
  },
]);
rejects('inversa.ex02.5', [
  {
    name: 'sin quitar el sesgo',
    append: 'x = np.linalg.solve(W, y)\nreconstruye = np.allclose(W @ x + b, y)\n',
    message: /se ha calculado sin quitar el sesgo/,
    failures: 1,
  },
  {
    name: 'el sesgo restado después de resolver',
    append: 'x = np.linalg.solve(W, y) - b\nreconstruye = np.allclose(W @ x + b, y)\n',
    message: /resta el sesgo después de resolver/,
    failures: 1,
  },
  {
    name: 'el vector por la inversa, por el lado equivocado',
    append: 'x = (y - b) @ np.linalg.inv(W)\nreconstruye = np.allclose(W @ x + b, y)\n',
    message: /`x` tiene que valer \(1, 2, 3\)/,
    failures: 1,
  },
  {
    name: 'W por el vector en vez de resolver',
    append: 'x = W @ (y - b)\nreconstruye = np.allclose(W @ x + b, y)\n',
    message: /`x` tiene que valer \(1, 2, 3\)/,
    failures: 1,
  },
  {
    name: 'reconstruye como array',
    append: 'x = np.linalg.solve(W, y - b)\nreconstruye = W @ x + b == y\n',
    message: /`reconstruye` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
]);

// ---------- pistas de las preguntas de código del proyecto ----------

/** Lo que el jugador escribe en cada hueco `___` del esqueleto de la última pista, en orden. */
const SKELETON_FILLS: Record<string, string[]> = {
  'inversa.ex02.1': ['A', 'np.eye(2)'],
  'inversa.ex02.2': ['A', 'b', 'A', 'b'],
  'inversa.ex02.3': ['0', 'None', 'inv', 'inversa_segura'],
  'inversa.ex02.4': ['B', 'A'],
  'inversa.ex02.5': ['-', 'W'],
};

defineHintTests(
  projectQuestions(inversa).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- examen-1.sistema-en-codigo ----------

accepts('examen-1.sistema-en-codigo', [
  {
    name: 'la inversa y el determinante a mano',
    append:
      'x = np.linalg.inv(A) @ b\ninvertible = abs(A[0, 0] * A[1, 1] - A[0, 1] * A[1, 0]) > 1e-9\n',
  },
  {
    name: 'el determinante con np.isclose y bool',
    append:
      'x = np.linalg.solve(A, b)\nd = np.linalg.det(A)\ninvertible = bool(not np.isclose(d, 0))\n',
  },
  {
    name: 'np.isclose negado con ~',
    append: 'x = np.linalg.solve(A, b)\ninvertible = ~np.isclose(np.linalg.det(A), 0)\n',
  },
]);
rejects('examen-1.sistema-en-codigo', [
  {
    name: 'la condición al revés',
    append: 'x = np.linalg.solve(A, b)\ninvertible = np.isclose(np.linalg.det(A), 0)\n',
    message: /`invertible` vale `False`, pero el determinante de `A` es 5/,
    failures: 1,
  },
  {
    name: 'el determinante en vez de un booleano',
    append: 'x = np.linalg.solve(A, b)\ninvertible = np.linalg.det(A)\n',
    message: /`invertible` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'A @ b en vez de resolver',
    append: 'x = A @ b\ninvertible = True\n',
    message: /`x` tiene que valer \(1, 2\)/,
    failures: 1,
  },
  {
    name: 'la inversa multiplicada entrada a entrada',
    append: 'x = np.linalg.inv(A) * b\ninvertible = True\n',
    message: /`x` tiene que ser un array de NumPy con 2 números/,
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
