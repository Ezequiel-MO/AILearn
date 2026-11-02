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
  checkMessages,
  garbageProbes,
  projectQuestions,
} from '../../../tests/content/prose-helpers';
import { warmupAsQuestion } from '../../../tests/content/warmup-helpers';
import { atencion } from './atencion';
import { atencionWarmup } from './atencion.calentamiento';
import { examen3Atencion } from './examen-3-atencion';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(atencion), ...examen3Atencion.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'atencion.ex02.1',
  'atencion.ex02.2',
  'atencion.ex02.3',
  'atencion.ex02.4',
  'atencion.ex02.5',
  'examen-3.palabra-mas-dispersa',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): ex02 son cinco preguntas de código y el banco fijo tiene una
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

// ---------- pistas de las cinco preguntas de código del ejercicio Programar ----------

// Lo que va en cada `___` del esqueleto de la última pista, en orden.
const SKELETON_FILLS: Record<string, string[]> = {
  'atencion.ex02.1': ['1', 'T', 'S'],
  'atencion.ex02.2': ['1', '1', 'True'],
  'atencion.ex02.3': ['pesos', '1', '0'],
  'atencion.ex02.4': ['T', '1', '1', 'pesos'],
  'atencion.ex02.5': ['1', '-np.inf', 'S_enm'],
};

defineHintTests(
  projectQuestions(atencion).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- atencion.ex02.1: puntuaciones escaladas y rango ----------

accepts('atencion.ex02.1', [
  {
    name: 'len, np.dot, la raíz como potencia y el rango como entero',
    append:
      'd = len(Q[0])\nS = np.dot(Q, K.T) / d ** 0.5\nrango = int(np.linalg.matrix_rank(Q @ K.T))\n',
  },
  {
    name: 'shape[-1], multiplicando por el inverso de la raíz y matrix_rank con tolerancia',
    append:
      'd = Q.shape[-1]\nS = (Q @ K.T) * (1 / np.sqrt(d))\nrango = np.linalg.matrix_rank(S, tol=1e-9)\n',
  },
]);
rejects('atencion.ex02.1', [
  {
    name: 'dividir entre la raíz del número de palabras',
    append: 'd = Q.shape[1]\nS = Q @ K.T / np.sqrt(len(Q))\nrango = np.linalg.matrix_rank(S)\n',
    message: /dividida entre la raíz del número de palabras/,
    failures: 1,
  },
  {
    name: 'no escalar',
    append: 'd = Q.shape[1]\nS = Q @ K.T\nrango = np.linalg.matrix_rank(S)\n',
    message: /falta escalar/,
    failures: 1,
  },
  {
    name: 'la tabla traspuesta',
    append: 'd = Q.shape[1]\nS = K @ Q.T / np.sqrt(d)\nrango = np.linalg.matrix_rank(S)\n',
    message: /`S` está traspuesta/,
    failures: 1,
  },
  {
    name: 'd con el número de palabras',
    append: 'd = Q.shape[0]\nS = Q @ K.T / np.sqrt(Q.shape[1])\nrango = np.linalg.matrix_rank(S)\n',
    message: /`d` vale 6/,
    failures: 1,
  },
  {
    name: 'el rango como el número de filas',
    append: 'd = Q.shape[1]\nS = Q @ K.T / np.sqrt(d)\nrango = S.shape[0]\n',
    message: /`rango` vale 6/,
    failures: 1,
  },
  {
    name: 'un decimal en vez de un entero',
    append: 'd = 3.0\nS = Q @ K.T / np.sqrt(d)\nrango = np.linalg.matrix_rank(S)\n',
    message: /`d` tiene que ser un número entero/,
    failures: 1,
  },
]);

// ---------- atencion.ex02.2: softmax_filas ----------

accepts('atencion.ex02.2', [
  {
    name: 'con np.max y los ejes añadidos con [:, None]',
    append: `def softmax_filas(S):
    E = np.exp(S - np.max(S, axis=1)[:, None])
    return E / np.sum(E, axis=1)[:, None]
`,
  },
  {
    name: 'fila a fila, con una lista por comprensión',
    append: `def softmax_filas(S):
    return np.array([np.exp(f - f.max()) / np.exp(f - f.max()).sum() for f in S])
`,
  },
  {
    name: 'con la traspuesta para normalizar',
    append: `def softmax_filas(S):
    E = np.exp(S.T - S.max(axis=1))
    return (E / E.sum(axis=0)).T
`,
  },
]);
rejects('atencion.ex02.2', [
  {
    name: 'normalizar por columnas',
    append: `def softmax_filas(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=0, keepdims=True)
`,
    message: /suma 1 por columnas/,
    failures: 1,
  },
  {
    name: 'sin keepdims',
    append: `def softmax_filas(S):
    E = np.exp(S - S.max(axis=1))
    return E / E.sum(axis=1)
`,
    message: /misma forma que la tabla/,
    failures: 1,
  },
  {
    name: 'sin restar el máximo',
    append: `def softmax_filas(S):
    E = np.exp(S)
    return E / E.sum(axis=1, keepdims=True)
`,
    message: /restar a cada fila su máximo/,
    failures: 1,
  },
  {
    name: 'dividir entre el máximo en vez de entre la suma',
    append: `def softmax_filas(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.max(axis=1, keepdims=True)
`,
    message: /tiene que sumar 1/,
    failures: 1,
  },
  {
    name: 'no devolver nada',
    append: `def softmax_filas(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    E / E.sum(axis=1, keepdims=True)
`,
    message: /misma forma que la tabla/,
    failures: 1,
  },
]);

// ---------- atencion.ex02.3: mezcla de valores, palabra más mirada y atención recibida ----------

accepts('atencion.ex02.3', [
  {
    name: 'np.dot, np.argmax y la suma de la traspuesta',
    append:
      'salida = np.dot(pesos, V)\nmas_atendido = np.argmax(pesos, axis=1)\nrecibida = pesos.T.sum(axis=1)\n',
  },
  {
    name: 'valores decimales, un bucle por palabra y np.einsum',
    append:
      "salida = pesos @ V.astype(float)\nmas_atendido = np.array([int(np.argmax(f)) for f in pesos])\nrecibida = np.einsum('ij->j', pesos)\n",
  },
]);
rejects('atencion.ex02.3', [
  {
    name: 'mezclar con las columnas de los pesos',
    append:
      'salida = pesos.T @ V\nmas_atendido = pesos.argmax(axis=1)\nrecibida = pesos.sum(axis=0)\n',
    message: /con las columnas de `pesos`/,
    failures: 1,
  },
  {
    name: 'buscar el mayor por columnas',
    append:
      'salida = pesos @ V\nmas_atendido = pesos.argmax(axis=0)\nrecibida = pesos.sum(axis=0)\n',
    message: /busca el mayor dentro de cada columna/,
    failures: 1,
  },
  {
    name: 'sumar por filas',
    append:
      'salida = pesos @ V\nmas_atendido = pesos.argmax(axis=1)\nrecibida = pesos.sum(axis=1)\n',
    message: /`recibida` vale 1 para todas/,
    failures: 1,
  },
  {
    name: 'el valor mayor en vez de su posición',
    append: 'salida = pesos @ V\nmas_atendido = pesos.max(axis=1)\nrecibida = pesos.sum(axis=0)\n',
    message: /`mas_atendido` tiene que ser un array de NumPy con 4 números enteros/,
    failures: 1,
  },
]);

// ---------- atencion.ex02.4: la función atencion(Q, K, V) ----------

accepts('atencion.ex02.4', [
  {
    name: 'sin restar el máximo (con estos datos no desborda) y np.matmul',
    append: `def atencion(Q, K, V):
    S = np.matmul(Q, K.T) / np.sqrt(K.shape[1])
    E = np.exp(S)
    pesos = E / E.sum(axis=1, keepdims=True)
    return np.matmul(pesos, V), pesos
`,
  },
  {
    name: 'fila a fila, con un bucle sobre las consultas',
    append: `def atencion(Q, K, V):
    d = Q.shape[1]
    filas = []
    for q in Q:
        s = K @ q / np.sqrt(d)
        e = np.exp(s - s.max())
        filas.append(e / e.sum())
    pesos = np.array(filas)
    return pesos @ V, pesos
`,
  },
]);
rejects('atencion.ex02.4', [
  {
    name: 'escalar con la raíz del número de claves',
    append: `def atencion(Q, K, V):
    S = Q @ K.T / np.sqrt(K.shape[0])
    E = np.exp(S - S.max(axis=1, keepdims=True))
    pesos = E / E.sum(axis=1, keepdims=True)
    return pesos @ V, pesos
`,
    message: /raíz del número de claves/,
    failures: 1,
  },
  {
    name: 'sin escalar',
    append: `def atencion(Q, K, V):
    S = Q @ K.T
    E = np.exp(S - S.max(axis=1, keepdims=True))
    pesos = E / E.sum(axis=1, keepdims=True)
    return pesos @ V, pesos
`,
    message: /sin escalar/,
    failures: 1,
  },
  {
    name: 'normalizar por columnas',
    append: `def atencion(Q, K, V):
    S = Q @ K.T / np.sqrt(Q.shape[1])
    E = np.exp(S - S.max(axis=1, keepdims=True))
    pesos = E / E.sum(axis=0, keepdims=True)
    return pesos @ V, pesos
`,
    message: /suman 1 por columnas/,
    failures: 1,
  },
  {
    name: 'devolver solo la salida',
    append: `def atencion(Q, K, V):
    S = Q @ K.T / np.sqrt(Q.shape[1])
    E = np.exp(S - S.max(axis=1, keepdims=True))
    pesos = E / E.sum(axis=1, keepdims=True)
    return pesos @ V
`,
    message: /dos arrays de NumPy, en este orden/,
    failures: 1,
  },
  {
    name: 'la salida sin mezclar los valores',
    append: `def atencion(Q, K, V):
    S = Q @ K.T / np.sqrt(Q.shape[1])
    E = np.exp(S - S.max(axis=1, keepdims=True))
    pesos = E / E.sum(axis=1, keepdims=True)
    return pesos @ V[::-1], pesos
`,
    message: /producto de los pesos por `V`/,
    failures: 1,
  },
]);

// ---------- atencion.ex02.5: la máscara causal ----------

accepts('atencion.ex02.5', [
  {
    name: 'la máscara comparando posiciones y las puntuaciones copiadas',
    append: `mascara = np.arange(5)[None, :] > np.arange(5)[:, None]
S_enm = S.copy()
S_enm[mascara] = -np.inf
pesos = softmax_filas(S_enm)
salida = np.dot(pesos, V)
`,
  },
  {
    name: 'np.triu de unos convertidos a booleanos y -inf como float',
    append: `mascara = np.triu(np.ones((5, 5)), 1).astype(bool)
S_enm = np.where(mascara, float("-inf"), S)
pesos = softmax_filas(S_enm)
salida = pesos @ V
`,
  },
]);
rejects('atencion.ex02.5', [
  {
    name: 'con la diagonal tapada (k=0)',
    append: `mascara = np.triu(np.ones((5, 5), dtype=bool), k=0)
S_enm = np.where(mascara, -np.inf, S)
pesos = softmax_filas(S_enm)
salida = pesos @ V
`,
    message: /`mascara` incluye la diagonal/,
    failures: 1,
  },
  {
    name: 'tapando por debajo de la diagonal',
    append: `mascara = np.tril(np.ones((5, 5), dtype=bool), k=-1)
S_enm = np.where(mascara, -np.inf, S)
pesos = softmax_filas(S_enm)
salida = pesos @ V
`,
    message: /`mascara` tapa por debajo de la diagonal/,
    failures: 1,
  },
  {
    name: 'poner ceros en los pesos después del softmax',
    append: `mascara = np.triu(np.ones((5, 5), dtype=bool), k=1)
S_enm = np.where(mascara, -np.inf, S)
pesos = np.where(mascara, 0, softmax_filas(S))
salida = pesos @ V
`,
    message: /no suman 1: la máscara tiene que ir antes del softmax/,
    failures: 1,
  },
  {
    name: 'la máscara como unos y ceros',
    append: `mascara = np.triu(np.ones((5, 5)), 1)
S_enm = np.where(mascara == 1, -np.inf, S)
pesos = softmax_filas(S_enm)
salida = pesos @ V
`,
    message: /con `True` y `False`, no con unos y ceros/,
    failures: 1,
  },
]);

// ---------- examen-3.palabra-mas-dispersa ----------

accepts('examen-3.palabra-mas-dispersa', [
  {
    name: 'el exponencial sin restar el máximo y np.argmin',
    append:
      'S = Q @ K.T / np.sqrt(2)\npesos = np.exp(S) / np.exp(S).sum(axis=1, keepdims=True)\ndispersa = np.argmin(pesos.max(axis=1))\n',
  },
  {
    name: 'ordenando los pesos mayores de cada fila',
    append:
      'S = Q @ K.T / np.sqrt(Q.shape[1])\nE = np.exp(S - S.max(axis=1, keepdims=True))\npesos = (E.T / E.sum(axis=1)).T\ndispersa = int(np.argsort(pesos.max(axis=1))[0])\n',
  },
]);
rejects('examen-3.palabra-mas-dispersa', [
  {
    name: 'la palabra más concentrada, con argmax',
    append:
      'S = Q @ K.T / np.sqrt(2)\nE = np.exp(S - S.max(axis=1, keepdims=True))\npesos = E / E.sum(axis=1, keepdims=True)\ndispersa = int(pesos.max(axis=1).argmax())\n',
    message: /la más concentrada/,
    failures: 1,
  },
  {
    name: 'sin escalar las puntuaciones',
    append:
      'S = Q @ K.T\nE = np.exp(S - S.max(axis=1, keepdims=True))\npesos = E / E.sum(axis=1, keepdims=True)\ndispersa = 0\n',
    message: /sin escalar/,
    failures: 1,
  },
  {
    name: 'normalizar por columnas',
    append:
      'S = Q @ K.T / np.sqrt(2)\nE = np.exp(S - S.max(axis=0, keepdims=True))\npesos = E / E.sum(axis=0, keepdims=True)\ndispersa = 0\n',
    message: /suma 1 por columnas/,
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

// ---------- calentamiento de Python ----------

describe('calentamiento: fichas de atención que se ejecutan', { timeout: 60_000 }, () => {
  for (const step of atencionWarmup) {
    const q = warmupAsQuestion(step);
    describe(step.id, () => {
      it('el ejemplo se ejecuta sin error y enseña algo', async () => {
        const r = await runInPyodide(pyodide, step.example);
        // contract: petición de Oliver 2026-10-23: el ejemplo se prueba con «Ejecutar» y enseña qué hace
        expect(r.error, describeRun(r)).toBeNull();
        expect(r.stdout !== '' || r.figures.length > 0, describeRun(r)).toBe(true);
      });

      it('la solución del reto pasa, el código de partida no, y hay check(', async () => {
        // contract: las reglas de las preguntas de código (tarea 8) valen para el reto «Ahora tú»
        expect(await codeQuestionProblems(pyodide, q)).toEqual([]);
      });

      it('el código de partida del reto recibe mensajes de las comprobaciones, no un fallo', async () => {
        const r = await runInPyodide(pyodide, step.task.starter, step.task.checks);
        const known = new Set(checkMessages(q));
        const foreign = (r.checks ?? []).map((c) => c.message).filter((m) => !known.has(m));
        // contract: review-18r m2 aplicado al reto: con las variables en None las comprobaciones no se rompen
        expect(r.error, describeRun(r)).toBeNull();
        expect(foreign, describeRun(r)).toEqual([]);
      });
    });
  }
});
