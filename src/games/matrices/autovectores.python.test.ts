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
import { autovectores } from './autovectores';
import { examen2Autovectores } from './examen-2-autovectores';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [
  ...projectQuestions(autovectores),
  ...examen2Autovectores.map((e) => e.question),
].filter((q): q is CodigoQ => q.type === 'codigo');
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'autovectores.ex02.1',
  'autovectores.ex02.2',
  'autovectores.ex02.3',
  'autovectores.ex02.4',
  'autovectores.ex02.5',
  'examen-2.capas-que-explotan',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una
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

// ---------- autovectores.ex02.1: np.linalg.eig y sus columnas ----------

accepts('autovectores.ex02.1', [
  {
    name: 'argmax, columna y allclose',
    append:
      'vals, vecs = np.linalg.eig(A)\nk = int(np.argmax(vals))\nlam = vals[k]\nv = vecs[:, k]\nok = bool(np.allclose(A @ v, lam * v))\n',
  },
  {
    name: 'max, la columna como fila de la traspuesta, con el signo cambiado, y una norma',
    append:
      'vals, vecs = np.linalg.eig(A)\nlam = vals.max()\nv = -vecs.T[list(vals).index(lam)]\nok = np.linalg.norm(A @ v - lam * v) < 1e-9\n',
  },
  {
    name: 'un orden propio con argsort',
    append:
      'vals, vecs = np.linalg.eig(A)\norden = np.argsort(vals)\nlam = vals[orden][-1]\nv = vecs[:, orden[-1]]\nok = np.allclose(A @ v, lam * v)\n',
  },
]);
rejects('autovectores.ex02.1', [
  {
    name: 'una fila de vecs en vez de una columna',
    append:
      'vals, vecs = np.linalg.eig(A)\nk = np.argmax(vals)\nlam = vals[k]\nv = vecs[k]\nok = np.allclose(A @ v, lam * v)\n',
    message: /`v` es una fila de `vecs`/,
    failures: 1,
  },
  {
    name: 'el autovalor menor',
    append:
      'vals, vecs = np.linalg.eig(A)\nk = np.argmin(vals)\nlam = vals[k]\nv = vecs[:, k]\nok = np.allclose(A @ v, lam * v)\n',
    message: /`lam` vale 2, el autovalor menor/,
    failures: 1,
  },
  {
    name: 'el autovector del otro autovalor',
    append:
      'vals, vecs = np.linalg.eig(A)\nlam = vals.max()\nv = vecs[:, np.argmin(vals)]\nok = np.allclose(A @ v, lam * v)\n',
    message: /`v` tiene que ser el autovector que corresponde a `lam`/,
  },
  {
    name: 'v es toda la matriz',
    append: 'vals, vecs = np.linalg.eig(A)\nlam = vals.max()\nv = vecs\nok = True\n',
    message: /`v` tiene que ser un array de NumPy con 2 números/,
    failures: 1,
  },
  {
    name: 'ok no es un valor lógico',
    append:
      'vals, vecs = np.linalg.eig(A)\nk = np.argmax(vals)\nlam = vals[k]\nv = vecs[:, k]\nok = A @ v\n',
    message: /`ok` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'solo los autovalores, sin los autovectores',
    append:
      'vals = np.linalg.eigvals(A)\nvecs = vals\nlam = vals.max()\nv = np.array([1.0, 1.0])\nok = True\n',
    message: /`vecs` tiene que ser un array de NumPy de 2 filas y 2 columnas/,
  },
]);

// ---------- autovectores.ex02.2: es_autovector ----------

accepts('autovectores.ex02.2', [
  {
    name: 'el determinante de v y A @ v, con isclose',
    append: `def es_autovector(A, v):
    w = A @ v
    return bool(np.any(v)) and bool(np.isclose(np.linalg.det(np.array([v, w])), 0))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
  },
  {
    name: 'el cociente de Rayleigh y allclose',
    append: `def es_autovector(A, v):
    if not np.any(v):
        return False
    lam = (v @ (A @ v)) / (v @ v)
    return bool(np.allclose(A @ v, lam * v))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
  },
  {
    name: 'el valor absoluto del coseno',
    append: `def es_autovector(A, v):
    w = A @ v
    if np.linalg.norm(v) == 0:
        return False
    if np.linalg.norm(w) == 0:
        return True
    return bool(np.isclose(abs(v @ w) / (np.linalg.norm(v) * np.linalg.norm(w)), 1))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
  },
]);
rejects('autovectores.ex02.2', [
  {
    name: 'el vector nulo cuenta como autovector',
    append: `def es_autovector(A, v):
    w = A @ v
    return bool(np.isclose(v[0] * w[1] - v[1] * w[0], 0))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /devuelve `True` para el vector nulo/,
    failures: 1,
  },
  {
    name: 'exige el mismo sentido',
    append: `def es_autovector(A, v):
    w = A @ v
    return bool(np.any(v)) and bool(np.isclose(v[0] * w[1] - v[1] * w[0], 0)) and bool(v @ w >= 0)


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /imagen apunta al lado opuesto/,
    failures: 1,
  },
  {
    name: 'excluye los vectores del núcleo',
    append: `def es_autovector(A, v):
    w = A @ v
    return bool(np.any(v)) and bool(np.any(w)) and bool(np.isclose(v[0] * w[1] - v[1] * w[0], 0))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /aplasta en el vector nulo/,
    failures: 1,
  },
  {
    name: 'una igualdad exacta con decimales',
    append: `def es_autovector(A, v):
    w = A @ v
    return bool(np.any(v)) and bool(v[0] * w[1] == v[1] * w[0])


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /falla con decimales/,
    failures: 1,
  },
  {
    name: 'solo compara longitudes',
    append: `def es_autovector(A, v):
    return bool(np.any(v)) and bool(np.linalg.norm(A @ v) >= np.linalg.norm(v))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /cuya imagen cambia de dirección/,
  },
  {
    name: 'siempre True',
    append: `def es_autovector(A, v):
    return True


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /cuya imagen cambia de dirección/,
  },
  {
    name: 'devuelve la imagen en vez de un valor lógico',
    append: `def es_autovector(A, v):
    return A @ v


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
    message: /tiene que devolver un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'propio no es lo que devuelve la función',
    append: `def es_autovector(A, v):
    w = A @ v
    return bool(np.any(v)) and bool(np.isclose(np.linalg.det(np.array([v, w])), 0))


propio = False
`,
    message: /`propio` tiene que ser `True`/,
    failures: 1,
  },
]);

// ---------- autovectores.ex02.3: iteración de potencias ----------

accepts('autovectores.ex02.3', [
  {
    name: 'for con np.dot y una raíz a mano',
    append: `def iteracion_potencia(A, pasos):
    v = v0.copy()
    for _ in range(pasos):
        v = np.dot(A, v)
        v = v / np.sqrt(v @ v)
    return v


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
  },
  {
    name: 'while con contador y división en el sitio',
    append: `def iteracion_potencia(A, pasos):
    v = v0.copy()
    n = 0
    while n < pasos:
        v = A @ v
        v /= np.linalg.norm(v)
        n += 1
    return v


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
  },
  {
    name: 'normaliza por el máximo en cada paso y por la norma al final',
    append: `def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
        v = v / np.max(np.abs(v))
    return v / np.linalg.norm(v)


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
  },
]);
rejects('autovectores.ex02.3', [
  {
    name: 'no normaliza en ningún paso',
    append: `def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
    return v


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
    message: /tiene `nan` o `inf`/,
    failures: 1,
  },
  {
    name: 'normaliza solo al final',
    append: `def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
    return v / np.linalg.norm(v)


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
    message: /tiene `nan` o `inf`/,
    failures: 1,
  },
  {
    name: 'devuelve el autovalor en vez del vector',
    append: `def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
        v = v / np.linalg.norm(v)
    return float(v @ A @ v)


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
    message: /devuelve un solo número/,
    failures: 1,
  },
  {
    name: 'un solo paso en vez de los pedidos',
    append: `def iteracion_potencia(A, pasos):
    v = A @ v0
    return v / np.linalg.norm(v)


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
    message: /no apunta en la dirección del autovector de mayor valor absoluto/,
    failures: 1,
  },
  {
    name: 'devuelve una lista de Python',
    append: `def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
        v = v / np.linalg.norm(v)
    return list(v)


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
    message: /tiene que devolver un array de NumPy con 2 números/,
    failures: 1,
  },
  {
    name: 'direccion no es el resultado de la función',
    append: `def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
        v = v / np.linalg.norm(v)
    return v


direccion = np.array([1.0, 0.0])
`,
    message: /`direccion` tiene que ser lo que devuelve la función/,
    failures: 1,
  },
]);

// ---------- autovectores.ex02.4: radio espectral y estabilidad ----------

accepts('autovectores.ex02.4', [
  {
    name: 'un bucle por matriz con np.max y np.abs',
    append:
      'radios = np.array([np.max(np.abs(np.linalg.eigvals(W))) for W in Ws])\nestables = radios < 1\n',
  },
  {
    name: 'el módulo con abs de Python y una lista de valores lógicos',
    append:
      'radios = np.array([max(abs(l) for l in np.linalg.eig(W)[0]) for W in Ws])\nestables = np.array([r < 1 for r in radios])\n',
  },
  {
    name: 'np.abs de la pila y el máximo del último eje',
    append: 'radios = np.max(np.abs(np.linalg.eigvals(Ws)), axis=-1)\nestables = ~(radios >= 1)\n',
  },
]);
rejects('autovectores.ex02.4', [
  {
    name: 'el mayor autovalor sin valor absoluto',
    append:
      'radios = np.array([np.max(np.linalg.eigvals(W).real) for W in Ws])\nestables = radios < 1\n',
    message: /Falta el valor absoluto/,
  },
  {
    name: 'el valor absoluto de la parte real de un complejo',
    append: 'radios = np.abs(np.linalg.eigvals(Ws).real).max(axis=1)\nestables = radios < 1\n',
    message: /el módulo, no la parte real/,
    notMessage: /Falta el valor absoluto/,
    failures: 1,
  },
  {
    name: 'estables al revés',
    append: 'radios = np.abs(np.linalg.eigvals(Ws)).max(axis=1)\nestables = radios > 1\n',
    message: /`estables` está al revés/,
    failures: 1,
  },
  {
    name: 'estables es una lista de Python',
    append:
      'radios = np.abs(np.linalg.eigvals(Ws)).max(axis=1)\nestables = [bool(r < 1) for r in radios]\n',
    message: /`estables` tiene que ser un array de NumPy con 5 valores/,
    failures: 1,
  },
  {
    name: 'radios guarda todos los autovalores, complejos',
    append: 'radios = np.linalg.eigvals(Ws)\nestables = np.array([True, True, True, True, True])\n',
    message: /`radios` tiene que ser un array de NumPy con 5 números reales/,
    failures: 1,
  },
]);

// ---------- autovectores.ex02.5: diagonalizar ----------

accepts('autovectores.ex02.5', [
  {
    name: 'np.diag, inversa guardada y una tolerancia propia',
    append:
      'D = np.diag(vals)\nVi = np.linalg.inv(vecs)\nA2 = np.dot(np.dot(vecs, D), Vi)\nigual = bool(np.abs(A2 - A).max() < 1e-9)\nA10 = vecs @ np.diag(vals ** 10) @ Vi\n',
  },
  {
    name: 'D con ceros, la potencia de D y matrix_power para comparar',
    append:
      'D = np.zeros((2, 2))\nD[0, 0] = vals[0]\nD[1, 1] = vals[1]\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = vecs @ (D ** 10) @ np.linalg.inv(vecs)\n',
  },
  {
    name: 'la potencia con matrix_power de D',
    append:
      'D = np.diag(vals)\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = vecs @ np.linalg.matrix_power(D, 10) @ np.linalg.inv(vecs)\n',
  },
]);
rejects('autovectores.ex02.5', [
  {
    name: 'D es el array de autovalores, no una matriz',
    append:
      'D = vals\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = False\nA10 = vecs @ np.diag(vals ** 10) @ np.linalg.inv(vecs)\n',
    message: /`D` tiene que ser un array de NumPy de 2 filas y 2 columnas/,
  },
  {
    name: 'el orden de los factores',
    append:
      'D = np.diag(vals)\nA2 = D @ vecs @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = vecs @ np.diag(vals ** 10) @ np.linalg.inv(vecs)\n',
    message: /el orden de los factores importa/,
    failures: 1,
  },
  {
    name: 'igual con una igualdad exacta',
    append:
      'D = np.diag(vals)\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = bool(np.array_equal(A2, A))\nA10 = vecs @ np.diag(vals ** 10) @ np.linalg.inv(vecs)\n',
    message: /Compáralas con `np.allclose`/,
    failures: 1,
  },
  {
    name: 'los autovalores multiplicados por 10 en vez de elevados',
    append:
      'D = np.diag(vals)\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = vecs @ np.diag(vals * 10) @ np.linalg.inv(vecs)\n',
    message: /`A10` vale 10 veces `A`/,
    failures: 1,
  },
  {
    name: 'cada número de A elevado a 10',
    append:
      'D = np.diag(vals)\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = A ** 10\n',
    message: /eleva cada número de `A` a 10/,
    failures: 1,
  },
  {
    name: 'A10 es la propia A2',
    append:
      'D = np.diag(vals)\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = A2\n',
    message: /tiene que coincidir con la matriz que da `np.linalg.matrix_power/,
    failures: 1,
  },
]);

// ---------- examen-2.capas-que-explotan ----------

accepts('examen-2.capas-que-explotan', [
  {
    name: 'un bucle con un contador',
    append:
      'explotan = 0\nfor W in Ws:\n    if np.max(np.abs(np.linalg.eigvals(W))) > 1:\n        explotan += 1\n',
  },
  {
    name: 'np.sum de la comparación',
    append: 'explotan = np.sum(np.abs(np.linalg.eigvals(Ws)).max(axis=1) > 1)\n',
  },
  {
    name: 'una lista por comprensión y len',
    append: 'explotan = len([W for W in Ws if max(abs(np.linalg.eigvals(W))) > 1])\n',
  },
]);
rejects('examen-2.capas-que-explotan', [
  {
    name: 'el mayor autovalor sin valor absoluto ni módulo',
    append: 'explotan = int((np.linalg.eigvals(Ws).real.max(axis=1) > 1).sum())\n',
    message: /solo cuenta una capa/,
    failures: 1,
  },
  {
    name: 'el valor absoluto de la parte real',
    append: 'explotan = int((np.abs(np.linalg.eigvals(Ws).real).max(axis=1) > 1).sum())\n',
    message: /se deja una capa que explota/,
    failures: 1,
  },
  {
    name: 'una lista con las capas',
    append: 'explotan = [W for W in Ws if np.max(np.abs(np.linalg.eigvals(W))) > 1]\n',
    message: /`explotan` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'un decimal en vez de un entero',
    append: 'explotan = 3.0\n',
    message: /`explotan` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'el recuento de todas las capas',
    append: 'explotan = 5\n',
    message: /`explotan` tiene que valer 3/,
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
  'autovectores.ex02.1': ['A', 'argmax', ':', 'lam'],
  'autovectores.ex02.2': ['v', 'False', '0'],
  'autovectores.ex02.3': ['v0', 'pasos', 'A', 'v', '50'],
  'autovectores.ex02.4': ['Ws', 'abs', '<'],
  'autovectores.ex02.5': ['vals', 'D', 'allclose', '**'],
};

defineHintTests(
  projectQuestions(autovectores).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);
