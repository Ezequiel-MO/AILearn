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
import { rnNumpy } from './rn-numpy';
import { examen2RnNumpy } from './examen-2-rn-numpy';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen2RnNumpy
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [...projectQuestions(rnNumpy).filter((q): q is CodigoQ => q.type === 'codigo'), ...bankCode].map(
    (q) => [q.id, q],
  ),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const CERCA = 'examen-2.dos-cercanos';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo común de la Órbita 2: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([...[1, 2, 3, 4, 5].map((n) => `rn-numpy.ex02.${n}`), CERCA]);
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

// ---------- ex02.1: construir E ----------

accepts('rn-numpy.ex02.1', [
  { name: 'np.vstack', append: 'E = np.vstack([a, b, c])\nforma = E.shape\n' },
  { name: 'np.stack', append: 'E = np.stack([a, b, c])\nforma = E.shape\n' },
  {
    name: 'una tupla de arrays y np.shape',
    append: 'E = np.array((a, b, c))\nforma = np.shape(E)\n',
  },
  {
    name: 'la matriz escrita a mano',
    append: 'E = np.array([[1, 0, 2, 1], [0, 3, 1, 1], [2, 1, 0, 2]])\nforma = E.shape\n',
  },
  {
    name: 'la forma con len',
    append: 'E = np.array([a, b, c])\nforma = (len(E), len(E[0]))\n',
  },
  { name: 'la forma como lista', append: 'E = np.array([a, b, c])\nforma = [3, 4]\n' },
]);
rejects('rn-numpy.ex02.1', [
  {
    name: 'los vectores pegados con np.concatenate',
    append: 'E = np.concatenate([a, b, c])\nforma = E.shape\n',
    message: /un solo vector de 12 números/,
  },
  {
    name: 'los vectores pegados con np.hstack',
    append: 'E = np.hstack([a, b, c])\nforma = E.shape\n',
    message: /un solo vector de 12 números/,
  },
  {
    name: 'matriz traspuesta',
    append: 'E = np.array([a, b, c]).T\nforma = E.shape\n',
    message: /está traspuesta/,
  },
  {
    name: 'una lista de arrays en vez de una matriz',
    append: 'E = [a, b, c]\nforma = (3, 4)\n',
    message: /tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'filas en otro orden',
    append: 'E = np.array([b, a, c])\nforma = E.shape\n',
    message: /`a` como primera fila, `b` como segunda y `c` como tercera/,
    failures: 1,
  },
  {
    name: 'forma es solo el número de filas',
    append: 'E = np.array([a, b, c])\nforma = E.shape[0]\n',
    message: /tupla con el número de filas y de columnas/,
    failures: 1,
  },
  {
    name: 'forma con filas y columnas al revés',
    append: 'E = np.array([a, b, c])\nforma = (4, 3)\n',
    message: /`forma` tiene que valer \(3, 4\)/,
    failures: 1,
  },
  {
    name: 'forma es un array',
    append: 'E = np.array([a, b, c])\nforma = np.array(E.shape)\n',
    message: /tupla con el número de filas y de columnas/,
    failures: 1,
  },
]);

// ---------- ex02.2: E @ q y la posición del mejor ----------

accepts('rn-numpy.ex02.2', [
  { name: 'np.dot', append: 'punt = np.dot(E, q)\nmejor = np.argmax(punt)\n' },
  { name: 'el método dot y argmax', append: 'punt = E.dot(q)\nmejor = punt.argmax()\n' },
  { name: 'posición como int', append: 'punt = E @ q\nmejor = int(np.argmax(punt))\n' },
  {
    name: 'multiplicar y sumar por filas',
    append: 'punt = (E * q).sum(axis=1)\nmejor = np.argmax(punt)\n',
  },
  {
    name: 'fila a fila y búsqueda en la lista',
    append:
      'punt = np.array([np.dot(fila, q) for fila in E])\nmejor = list(punt).index(max(punt))\n',
  },
  { name: 'argmax directo sobre E @ q', append: 'punt = E @ q\nmejor = np.argmax(E @ q)\n' },
]);
rejects('rn-numpy.ex02.2', [
  {
    name: 'E * q sin sumar',
    append: 'punt = E * q\nmejor = 1\n',
    message: /matriz de 4 filas y 3 columnas: `E \* q` multiplica componente a componente/,
    failures: 1,
  },
  {
    name: 'la puntuación más alta en vez de su posición',
    append: 'punt = E @ q\nmejor = int(np.max(punt))\n',
    message: /`mejor` vale 10/,
    failures: 1,
  },
  {
    name: 'np.argmin',
    append: 'punt = E @ q\nmejor = np.argmin(punt)\n',
    message: /`mejor` vale 3.*menos puntúa/,
    failures: 1,
  },
  {
    name: 'suma de cada fila sin multiplicar por q',
    append: 'punt = E.sum(axis=1)\nmejor = 1\n',
    message: /`punt` tiene que valer \(5, 10, 8, 4\)/,
    failures: 1,
  },
  {
    name: 'suma por columnas',
    append: 'punt = E.sum(axis=0)\nmejor = 1\n',
    message: /`punt` tiene que tener 4 números/,
    failures: 1,
  },
  {
    name: 'punt es una lista de Python',
    append: 'punt = list(E @ q)\nmejor = 1\n',
    message: /`punt` tiene que ser un array de NumPy con números/,
    failures: 1,
  },
  {
    name: 'mejor es un decimal',
    append: 'punt = E @ q\nmejor = 1.0\n',
    message: /`mejor` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'mejor es otra posición',
    append: 'punt = E @ q\nmejor = 0\n',
    message: /`mejor` tiene que ser la posición del documento con la puntuación más alta/,
    failures: 1,
  },
]);

// ---------- ex02.3: norma de cada fila ----------

accepts('rn-numpy.ex02.3', [
  {
    name: 'la raíz a mano',
    append: 'normas = np.sqrt((E ** 2).sum(axis=1))\nlarga = np.argmax(normas)\n',
  },
  {
    name: 'axis negativo',
    append: 'normas = np.linalg.norm(E, axis=-1)\nlarga = np.argmax(normas)\n',
  },
  {
    name: 'norma de orden 2',
    append: 'normas = np.linalg.norm(E, ord=2, axis=1)\nlarga = np.argmax(normas)\n',
  },
  {
    name: 'fila a fila y el método argmax',
    append: 'normas = np.array([np.linalg.norm(f) for f in E])\nlarga = int(normas.argmax())\n',
  },
  {
    name: 'producto de la matriz consigo misma',
    append: 'normas = np.sqrt(np.sum(E * E, axis=1))\nlarga = np.argmax(normas)\n',
  },
]);
rejects('rn-numpy.ex02.3', [
  {
    name: 'sin axis',
    append: 'normas = np.linalg.norm(E)\nlarga = 2\n',
    message: /único número: la norma de la matriz entera/,
    failures: 1,
  },
  {
    name: 'axis=0, una norma por columna',
    append: 'normas = np.linalg.norm(E, axis=0)\nlarga = 2\n',
    message: /`normas` tiene 3 números/,
    failures: 1,
  },
  {
    name: 'suma de valores absolutos',
    append: 'normas = np.abs(E).sum(axis=1)\nlarga = np.argmax(normas)\n',
    message: /`normas` tiene que valer \(5, 3, 7, 1\)/,
    failures: 1,
  },
  {
    name: 'una matriz de cuadrados',
    append: 'normas = np.sqrt(E ** 2)\nlarga = 2\n',
    message: /matriz de 4 filas y 3 columnas/,
    failures: 1,
  },
  {
    name: 'la norma mayor en vez de su posición',
    append: 'normas = np.linalg.norm(E, axis=1)\nlarga = int(np.max(normas))\n',
    message: /`larga` vale 7/,
    failures: 1,
  },
  {
    name: 'la norma mayor como decimal',
    append: 'normas = np.linalg.norm(E, axis=1)\nlarga = np.max(normas)\n',
    message: /`larga` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'la posición de la norma menor',
    append: 'normas = np.linalg.norm(E, axis=1)\nlarga = np.argmin(normas)\n',
    message: /`larga` tiene que ser la posición del documento de mayor norma/,
    failures: 1,
  },
]);

// ---------- ex02.4: distancias con broadcasting ----------

accepts('rn-numpy.ex02.4', [
  {
    name: 'la raíz a mano',
    append: 'dist = np.sqrt(((E - q) ** 2).sum(axis=1))\ncercana = np.argmin(dist)\n',
  },
  {
    name: 'restando al revés y con axis negativo',
    append: 'dist = np.linalg.norm(q - E, axis=-1)\ncercana = np.argmin(dist)\n',
  },
  {
    name: 'fila a fila y el método argmin',
    append: 'dist = np.array([np.linalg.norm(f - q) for f in E])\ncercana = int(dist.argmin())\n',
  },
  {
    name: 'la posición sale de las distancias al cuadrado',
    append:
      'dist = np.linalg.norm(E - q, axis=1)\ncercana = int(np.argmin(np.sum((E - q) ** 2, axis=1)))\n',
  },
  {
    name: 'ordenando y tomando el primero',
    append: 'dist = np.linalg.norm(E - q, axis=1)\ncercana = np.argsort(dist)[0]\n',
  },
]);
rejects('rn-numpy.ex02.4', [
  {
    name: 'distancias al cuadrado',
    append: 'dist = ((E - q) ** 2).sum(axis=1)\ncercana = np.argmin(dist)\n',
    message: /distancias al cuadrado/,
    failures: 1,
  },
  {
    name: 'sin axis',
    append: 'dist = np.linalg.norm(E - q)\ncercana = 2\n',
    message: /único número: la norma de la matriz entera/,
    failures: 1,
  },
  {
    name: 'axis=0, una norma por columna',
    append: 'dist = np.linalg.norm(E - q, axis=0)\ncercana = 2\n',
    message: /`dist` tiene 3 números/,
    failures: 1,
  },
  {
    name: 'sin restar q',
    append: 'dist = np.linalg.norm(E, axis=1)\ncercana = 2\n',
    message: /`dist` tiene que valer \(4, 3, 1, 7\)/,
    failures: 1,
  },
  {
    name: 'np.argmax en vez de np.argmin',
    append: 'dist = np.linalg.norm(E - q, axis=1)\ncercana = np.argmax(dist)\n',
    message: /`cercana` vale 3: es el documento más lejano/,
    failures: 1,
  },
  {
    name: 'la distancia menor en vez de su posición',
    append: 'dist = np.linalg.norm(E - q, axis=1)\ncercana = int(np.min(dist))\n',
    message: /`cercana` vale 1: coincide con la distancia menor/,
    failures: 1,
  },
  {
    name: 'la distancia menor como decimal',
    append: 'dist = np.linalg.norm(E - q, axis=1)\ncercana = np.min(dist)\n',
    message: /`cercana` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'otra posición',
    append: 'dist = np.linalg.norm(E - q, axis=1)\ncercana = 0\n',
    message: /`cercana` tiene que ser la posición del documento a menor distancia/,
    failures: 1,
  },
]);

// ---------- ex02.5: los dos mejores y la gráfica ----------

const BAR = 'plt.bar(range(5), punt)\n';

accepts('rn-numpy.ex02.5', [
  {
    name: 'argsort del opuesto',
    append: 'punt = E @ q\n' + BAR + 'top2 = np.argsort(-punt)[:2]\n',
  },
  {
    name: 'etiquetas de texto en el eje y lista de posiciones',
    append:
      'punt = np.dot(E, q)\nplt.bar(["d0", "d1", "d2", "d3", "d4"], punt)\ntop2 = list(np.argsort(punt)[::-1][:2])\n',
  },
  {
    name: 'fila a fila, np.arange y los dos últimos',
    append:
      'punt = np.array([np.dot(f, q) for f in E])\nplt.bar(np.arange(5), punt)\ntop2 = np.argsort(punt)[-2:][::-1]\n',
  },
  {
    name: 'ejes explícitos con subplots',
    append:
      'punt = E @ q\nfig, ax = plt.subplots()\nax.bar(range(5), punt)\ntop2 = np.argsort(punt)[::-1][:2]\n',
  },
  {
    name: 'barras con color y ancho',
    append:
      'punt = E @ q\nplt.bar(range(5), punt, color="gray", width=0.5)\ntop2 = np.argsort(punt)[::-1][:2]\n',
  },
]);
rejects('rn-numpy.ex02.5', [
  {
    name: 'sin dibujar',
    append: 'punt = E @ q\ntop2 = np.argsort(punt)[::-1][:2]\n',
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'una línea en vez de barras',
    append: 'punt = E @ q\nplt.plot(punt)\ntop2 = np.argsort(punt)[::-1][:2]\n',
    message: /No hay barras en la figura/,
    failures: 1,
  },
  {
    name: 'cuatro barras',
    append: 'punt = E @ q\nplt.bar(range(4), punt[:4])\ntop2 = np.argsort(punt)[::-1][:2]\n',
    message: /barras de más o de menos/,
    failures: 1,
  },
  {
    name: 'barras con otra altura',
    append: 'punt = E @ q\nplt.bar(range(5), E[:, 0])\ntop2 = np.argsort(punt)[::-1][:2]\n',
    message: /altura de cada barra tiene que ser la puntuación/,
    failures: 1,
  },
  {
    name: 'sin dar la vuelta, los dos que menos puntúan',
    append: 'punt = E @ q\n' + BAR + 'top2 = np.argsort(punt)[:2]\n',
    message: /los dos documentos que menos puntúan/,
    failures: 1,
  },
  {
    name: 'los dos buenos en orden contrario',
    append: 'punt = E @ q\n' + BAR + 'top2 = np.argsort(punt)[-2:]\n',
    message: /en orden contrario/,
    failures: 1,
  },
  {
    name: 'las puntuaciones en vez de las posiciones',
    append: 'punt = E @ q\n' + BAR + 'top2 = np.sort(punt)[::-1][:2]\n',
    message: /`top2` vale \(8, 7\)/,
    failures: 1,
  },
  {
    name: 'posiciones como decimales',
    append: 'punt = E @ q\n' + BAR + 'top2 = np.argsort(punt)[::-1][:2].astype(float)\n',
    message: /números decimales/,
    failures: 1,
  },
  {
    name: 'solo la posición del mejor',
    append: 'punt = E @ q\n' + BAR + 'top2 = np.argmax(punt)\n',
    message: /con 2 posiciones/,
    failures: 1,
  },
  {
    name: 'puntuaciones sin multiplicar por q',
    append: 'punt = E.sum(axis=1)\n' + BAR + 'top2 = np.argsort(punt)[::-1][:2]\n',
    message: /`punt` tiene que valer \(4, 7, 8, 5, 3\)/,
  },
]);

// ---------- banco: examen-2.dos-cercanos ----------

accepts(CERCA, [
  {
    name: 'distancias al cuadrado, sin raíz',
    append: 'cerca2 = np.argsort(((E - q) ** 2).sum(axis=1))[:2]\n',
  },
  {
    name: 'ordenando con sorted',
    append: 'cerca2 = np.array(sorted(range(5), key=lambda i: np.linalg.norm(E[i] - q))[:2])\n',
  },
  {
    name: 'una lista de posiciones',
    append: 'cerca2 = list(np.argsort(np.linalg.norm(E - q, axis=1))[:2])\n',
  },
  { name: 'escrito a mano', append: 'cerca2 = [2, 4]\n' },
]);
rejects(CERCA, [
  {
    name: 'los dos más lejanos',
    append: 'cerca2 = np.argsort(np.linalg.norm(E - q, axis=1))[::-1][:2]\n',
    message: /los dos documentos más lejanos/,
    failures: 1,
  },
  {
    name: 'los dos buenos en orden contrario',
    append: 'cerca2 = np.argsort(np.linalg.norm(E - q, axis=1))[:2][::-1]\n',
    message: /en orden contrario/,
    failures: 1,
  },
  {
    name: 'ordenando por producto escalar, de mayor a menor',
    append: 'cerca2 = np.argsort(E @ q)[::-1][:2]\n',
    message: /ordenar por producto escalar/,
    failures: 1,
  },
  {
    name: 'ordenando por producto escalar, de menor a mayor',
    append: 'cerca2 = np.argsort(E @ q)[:2]\n',
    message: /ordenar por producto escalar/,
    failures: 1,
  },
  {
    name: 'las distancias en vez de las posiciones',
    append: 'cerca2 = np.sort(np.linalg.norm(E - q, axis=1))[:2]\n',
    message: /números decimales/,
    failures: 1,
  },
  {
    name: 'solo el más cercano',
    append: 'cerca2 = np.argmin(np.linalg.norm(E - q, axis=1))\n',
    message: /con 2 posiciones/,
    failures: 1,
  },
  {
    name: 'sin axis',
    append: 'cerca2 = np.argsort(np.linalg.norm(E - q))[:2]\n',
    message: /con 2 posiciones/,
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
