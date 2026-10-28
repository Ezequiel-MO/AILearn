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
import { determinante } from './determinante';
import { examen1Determinante } from './examen-1-determinante';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [
  ...projectQuestions(determinante),
  ...examen1Determinante.map((e) => e.question),
].filter((q): q is CodigoQ => q.type === 'codigo');
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'determinante.ex02.1',
  'determinante.ex02.2',
  'determinante.ex02.3',
  'determinante.ex02.4',
  'determinante.ex02.5',
  'examen-1.capas-volteadas',
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

// ---------- determinante.ex02.1: el determinante de NumPy y el redondeo ----------

accepts('determinante.ex02.1', [
  {
    name: 'comparar con abs y una tolerancia propia',
    append: 'd = np.linalg.det(A)\nbien = bool(abs(d + 2) < 1e-9)\nd_int = int(np.round(d))\n',
  },
  {
    name: 'el determinante a mano y np.round',
    append:
      'd = A[0, 0] * A[1, 1] - A[0, 1] * A[1, 0]\nbien = np.isclose(d, -2)\nd_int = round(d)\n',
  },
  {
    name: 'allclose y astype',
    append:
      'd = float(np.linalg.det(A))\nbien = np.allclose(d, -2)\nd_int = np.linalg.det(A).round().astype(int)\n',
  },
]);
rejects('determinante.ex02.1', [
  {
    name: 'bien con una igualdad exacta',
    append: 'd = np.linalg.det(A)\nbien = d == -2\nd_int = round(d)\n',
    message: /`bien` vale `False`/,
    failures: 1,
  },
  {
    name: 'entero sin redondear',
    append: 'd = np.linalg.det(A)\nbien = np.isclose(d, -2)\nd_int = d\n',
    message: /`d_int` tiene que valer -2/,
    failures: 1,
  },
  {
    name: 'el determinante con el signo cambiado',
    append: 'd = -np.linalg.det(A)\nbien = np.isclose(d, -2)\nd_int = round(d)\n',
    message: /`d` tiene que valer -2/,
  },
  {
    name: 'd es la matriz traspuesta en vez del determinante',
    append: 'd = A.T\nbien = True\nd_int = -2\n',
    message: /`d` tiene que ser un número/,
    failures: 1,
  },
]);

// ---------- determinante.ex02.2: el área de un triángulo ----------

accepts('determinante.ex02.2', [
  {
    name: 'la fórmula a mano con la mitad',
    append: `def area_triangulo(a, b, c):
    return abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
  },
  {
    name: 'las columnas con .T y 0,5 por el valor absoluto',
    append: `def area_triangulo(a, b, c):
    M = np.array([b - a, c - a]).T
    return 0.5 * abs(np.linalg.det(M))


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
  },
  {
    name: 'np.abs y la función con listas de entrada',
    append: `def area_triangulo(a, b, c):
    lado1 = np.asarray(b) - np.asarray(a)
    lado2 = np.asarray(c) - np.asarray(a)
    return np.abs(np.linalg.det(np.column_stack([lado1, lado2]))) / 2


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
  },
]);
rejects('determinante.ex02.2', [
  {
    name: 'sin valor absoluto',
    append: `def area_triangulo(a, b, c):
    return np.linalg.det(np.array([b - a, c - a])) / 2


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
    message: /devuelve un área negativa/,
    failures: 1,
  },
  {
    name: 'sin dividir entre 2',
    append: `def area_triangulo(a, b, c):
    return abs(np.linalg.det(np.array([b - a, c - a])))


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
    message: /área del paralelogramo, que es el doble/,
    failures: 1,
  },
  {
    name: 'el determinante de los vértices sin restar el primero',
    append: `def area_triangulo(a, b, c):
    return abs(np.linalg.det(np.array([a, b, c])[:2])) / 2


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
    message: /tiene que dar 5,5 para los vértices/,
    failures: 1,
  },
  {
    name: 'la función devuelve un texto',
    append: `def area_triangulo(a, b, c):
    return "5,5"


area = 5.5
`,
    message: /tiene que devolver un número/,
    failures: 1,
  },
]);

// ---------- determinante.ex02.3: a qué lado de una recta ----------

accepts('determinante.ex02.3', [
  {
    name: 'el producto cruzado a mano',
    append: `def a_la_izquierda(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0


lado = a_la_izquierda(np.array([0, 0]), np.array([4, 1]), np.array([1, 3]))
`,
  },
  {
    name: 'if y return explícitos con la matriz de columnas',
    append: `def a_la_izquierda(a, b, c):
    d = np.linalg.det(np.column_stack([b - a, c - a]))
    if d > 0:
        return True
    return False


lado = a_la_izquierda(np.array([0, 0]), np.array([4, 1]), np.array([1, 3]))
`,
  },
  {
    name: 'una tolerancia pequeña en lugar de cero',
    append: `def a_la_izquierda(a, b, c):
    return bool(np.linalg.det(np.array([b - a, c - a])) > 1e-9)


lado = True
`,
  },
]);
rejects('determinante.ex02.3', [
  {
    name: 'el signo al revés',
    append: `def a_la_izquierda(a, b, c):
    return bool(np.linalg.det(np.array([b - a, c - a])) < 0)


lado = False
`,
    message: /contesta al revés/,
    failures: 1,
  },
  {
    name: 'mayor o igual: un punto sobre la recta cuenta',
    append: `def a_la_izquierda(a, b, c):
    return bool(np.linalg.det(np.array([b - a, c - a])) >= 0)


lado = True
`,
    message: /da `True` para un punto sobre la recta/,
    failures: 1,
  },
  {
    name: 'devuelve el determinante en vez de un booleano',
    append: `def a_la_izquierda(a, b, c):
    return np.linalg.det(np.array([b - a, c - a]))


lado = True
`,
    message: /tiene que devolver un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'la función es correcta pero lado está mal',
    append: `def a_la_izquierda(a, b, c):
    return bool(np.linalg.det(np.array([b - a, c - a])) > 0)


lado = False
`,
    message: /`lado` tiene que ser `True`/,
    failures: 1,
  },
]);

// ---------- determinante.ex02.4: det(AB) = det(A) det(B) ----------

accepts('determinante.ex02.4', [
  {
    name: 'np.dot y allclose',
    append:
      'dAB = np.linalg.det(np.dot(A, B))\ndA_dB = np.linalg.det(A) * np.linalg.det(B)\ncoincide = np.allclose(dAB, dA_dB)\n',
  },
  {
    name: 'determinantes con float y un booleano de Python',
    append:
      'dAB = float(np.linalg.det(A @ B))\ndA_dB = float(np.linalg.det(A)) * float(np.linalg.det(B))\ncoincide = bool(abs(dAB - dA_dB) < 1e-9)\n',
  },
  {
    name: 'np.prod de los dos determinantes',
    append:
      'dAB = np.linalg.det(A @ B)\ndA_dB = np.prod([np.linalg.det(A), np.linalg.det(B)])\ncoincide = np.isclose(dAB, dA_dB)\n',
  },
]);
rejects('determinante.ex02.4', [
  {
    name: 'los determinantes se suman',
    append:
      'dAB = np.linalg.det(A @ B)\ndA_dB = np.linalg.det(A) + np.linalg.det(B)\ncoincide = np.isclose(dAB, dA_dB)\n',
    message: /`dA_dB` tiene que valer 10/,
    notMessage: /`dAB` tiene que valer 10/,
  },
  {
    name: 'dAB es el determinante de A solo',
    append:
      'dAB = np.linalg.det(A)\ndA_dB = np.linalg.det(A) * np.linalg.det(B)\ncoincide = np.isclose(dAB, dA_dB)\n',
    message: /`dAB` tiene que valer 10/,
  },
  {
    name: 'coincide con una igualdad exacta',
    append:
      'dAB = np.linalg.det(A @ B)\ndA_dB = np.linalg.det(A) * np.linalg.det(B)\ncoincide = dAB == dA_dB\n',
    message: /`coincide` vale `False`/,
    failures: 1,
  },
  {
    name: 'el producto de las matrices por entradas',
    append:
      'dAB = np.linalg.det(A * B)\ndA_dB = np.linalg.det(A) * np.linalg.det(B)\ncoincide = np.isclose(dAB, dA_dB)\n',
    message: /`dAB` tiene que valer 10/,
  },
]);

// ---------- determinante.ex02.5: capas que casi aplastan el plano ----------

accepts('determinante.ex02.5', [
  {
    name: 'un bucle sobre las matrices',
    append:
      'colapsan = np.array([abs(np.linalg.det(W)) < 1e-6 for W in pesos])\ncuantas = int(np.sum(colapsan))\n',
  },
  {
    name: 'np.less y len',
    append:
      'colapsan = np.less(np.abs(np.linalg.det(pesos)), 1e-6)\ncuantas = len(pesos[colapsan])\n',
  },
  {
    name: 'un umbral más pequeño, 1e-8',
    append:
      'colapsan = np.abs(np.linalg.det(pesos)) < 1e-8\ncuantas = np.count_nonzero(colapsan)\n',
  },
]);
rejects('determinante.ex02.5', [
  {
    name: 'igualdad exacta con cero',
    append: 'colapsan = np.linalg.det(pesos) == 0\ncuantas = int(colapsan.sum())\n',
    message: /no marca ninguna matriz/,
    failures: 1,
  },
  {
    name: 'sin valor absoluto',
    append: 'colapsan = np.linalg.det(pesos) < 1e-6\ncuantas = int(colapsan.sum())\n',
    message: /solo lo voltea/,
    failures: 1,
  },
  {
    name: 'un umbral demasiado grande',
    append: 'colapsan = np.abs(np.linalg.det(pesos)) < 1e-2\ncuantas = int(colapsan.sum())\n',
    message: /no menor que el umbral/,
    failures: 1,
  },
  {
    name: 'una lista de números en vez de valores lógicos',
    append: 'colapsan = np.linalg.det(pesos)\ncuantas = 2\n',
    message: /`colapsan` tiene que ser un array de NumPy con 5 valores/,
    failures: 1,
  },
  {
    name: 'cuantas es una lista',
    append: 'colapsan = np.abs(np.linalg.det(pesos)) < 1e-6\ncuantas = [1, 2]\n',
    message: /`cuantas` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'cuantas está mal contado',
    append: 'colapsan = np.abs(np.linalg.det(pesos)) < 1e-6\ncuantas = 3\n',
    message: /`cuantas` tiene que valer 2/,
    failures: 1,
  },
]);

// ---------- pistas de las preguntas de código del proyecto ----------

/** Lo que va en cada `___` del esqueleto de la última pista, en orden. */
const SKELETON_FILLS: Record<string, string[]> = {
  'determinante.ex02.1': ['A', '-2', 'd'],
  'determinante.ex02.2': ['b - a', 'c - a', 'abs', '2'],
  'determinante.ex02.3': ['>'],
  'determinante.ex02.4': ['A @ B', '*', 'dAB', 'dA_dB'],
  'determinante.ex02.5': ['np.abs', '1e-6'],
};

defineHintTests(
  projectQuestions(determinante).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- examen-1.capas-volteadas ----------

accepts('examen-1.capas-volteadas', [
  {
    name: 'un bucle con un contador',
    append: 'volteadas = 0\nfor W in Ws:\n    if np.linalg.det(W) < 0:\n        volteadas += 1\n',
  },
  {
    name: 'np.sum de la comparación',
    append: 'volteadas = np.sum(np.linalg.det(Ws) < 0)\n',
  },
  {
    name: 'una lista por comprensión y len',
    append: 'volteadas = len([W for W in Ws if np.linalg.det(W) < 0])\n',
  },
]);
rejects('examen-1.capas-volteadas', [
  {
    name: 'menor o igual que cero',
    append: 'volteadas = int(np.sum(np.linalg.det(Ws) <= 0))\n',
    message: /cuenta también la capa de determinante 0/,
    failures: 1,
  },
  {
    name: 'mayor que cero',
    append: 'volteadas = int(np.sum(np.linalg.det(Ws) > 0))\n',
    message: /cuenta las capas de determinante positivo/,
    failures: 1,
  },
  {
    name: 'una lista con los determinantes negativos',
    append: 'volteadas = [d for d in np.linalg.det(Ws) if d < 0]\n',
    message: /`volteadas` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'el recuento de todas las capas',
    append: 'volteadas = 7\n',
    message: /`volteadas` tiene que valer 2/,
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
