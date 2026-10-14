import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import { codeQuestions } from '../../content/validate';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  describeRun,
  getPyodide,
} from '../../../tests/content/python-helpers';
import { NUMPY_ENGLISH, garbageProbes } from '../../../tests/content/prose-helpers';
import { vectores } from './index';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const byId = new Map(codeQuestions(vectores).map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

/** Lo que el jugador entrega: el código inicial (con un reemplazo opcional) y su añadido. */
interface Variant {
  name: string;
  replace?: [string, string];
  append?: string;
}

const code = (q: CodigoQ, v: Variant): string => {
  const base = v.replace ? q.starter.replace(v.replace[0], v.replace[1]) : q.starter;
  if (v.replace && base === q.starter) throw new Error(`${v.name}: el reemplazo no encaja`);
  return base + (v.append ?? '');
};

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
        // contract: ronda de arreglo 1 de la tarea 15, m2: sin cascada, los mensajes que no son el fallo no salen
        if (v.notMessage) expect(failed.join(' | '), describeRun(r)).not.toMatch(v.notMessage);
        if (v.failures !== undefined) expect(failed, describeRun(r)).toHaveLength(v.failures);
      });
    }
  });
};

// ---------- Despegue ----------

accepts('despegue.7', [
  { name: 'tupla en vez de lista', append: 'v = np.array((3, 2))\n' },
  { name: 'decimales', append: 'v = np.array([3.0, 2.0])\n' },
  { name: 'np.asarray', append: 'v = np.asarray([3, 2])\n' },
  { name: 'con dtype', append: 'v = np.array([3, 2], dtype=float)\n' },
  { name: 'np.r_', append: 'v = np.r_[3, 2]\n' },
  { name: 'suma de dos arrays', append: 'v = np.array([1, 2]) + np.array([2, 0])\n' },
]);
rejects('despegue.7', [
  { name: 'una lista de Python', append: 'v = [3, 2]\n', message: /array de NumPy/ },
  { name: 'una fila de una matriz', append: 'v = np.array([[3, 2]])\n', message: /forma \(2,\)/ },
  { name: 'columna', append: 'v = np.array([[3], [2]])\n', message: /forma \(2,\)/ },
  { name: 'componentes cambiadas de orden', append: 'v = np.array([2, 3])\n', message: /\(3, 2\)/ },
  // contract: review-15 m4: un array de cadenas recibe un mensaje en castellano, no el error de NumPy
  { name: 'cadenas', append: 'v = np.array(["3", "2"])\n', message: /números/ },
]);

accepts('despegue.8', [
  { name: 'desempaquetando', append: 'x, y = v\n' },
  { name: 'con tolist', append: 'x, y = v.tolist()\n' },
  { name: 'enteros de Python', append: 'x = int(v[0])\ny = int(v[1])\n' },
  { name: 'decimales', append: 'x = float(v[0])\ny = float(v[1])\n' },
  { name: 'último elemento', append: 'x = v[0]\ny = v[-1]\n' },
  { name: 'números escritos a mano', append: 'x = 5\ny = -3\n' },
  { name: 'con item', append: 'x = v.item(0)\ny = v.item(1)\n' },
]);
rejects('despegue.8', [
  { name: 'componentes cambiadas', append: 'x = v[1]\ny = v[0]\n', message: /x tiene que valer 5/ },
  { name: 'listas de un elemento', append: 'x = [5]\ny = [-3]\n', message: /un número/ },
  // contract: review-15 m4: un array de cadenas de cero ejes no llega a np.isclose
  { name: 'cadenas', append: 'x = np.array("5")\ny = np.array("-3")\n', message: /un número/ },
]);

accepts('despegue.9', [
  { name: 'componentes enteras', replace: ['np.array([0, 0])', 'np.array([3, 2])'] },
  { name: 'componentes decimales', replace: ['np.array([0, 0])', 'np.array([3.0, 2.0])'] },
  { name: 'doble y mitad', replace: ['np.array([0, 0])', 'np.array([6, 4]) / 2'] },
  {
    name: 'quiver con listas',
    append: 'v = np.array([3, 2])\nplt.clf()\nplt.quiver([0], [0], [v[0]], [v[1]], angles="xy")\n',
  },
  {
    name: 'ejes creados con subplots',
    append:
      'v = np.array([3, 2])\nplt.close("all")\nfig, ax = plt.subplots()\nax.quiver(0, 0, v[0], v[1], angles="xy", scale_units="xy", scale=1)\n',
  },
  {
    // contract: renombrado despegue/órbita; review-15 m3: una segunda flecha de adorno no invalida la que llega a (3, 2)
    name: 'con una segunda flecha de adorno',
    replace: ['np.array([0, 0])', 'np.array([3, 2])'],
    append: 'plt.quiver(0, 0, 1, 0, color="gray", angles="xy", scale_units="xy", scale=1)\n',
  },
]);
rejects('despegue.9', [
  {
    name: 'v correcto pero la flecha dibuja otra cosa',
    replace: ['np.array([0, 0])', 'np.array([3, 2])'],
    append: 'plt.clf()\nplt.quiver(0, 0, 2, 3, angles="xy", scale_units="xy", scale=1)\n',
    message: /no avanza 3 en horizontal y 2 en vertical/,
  },
  {
    name: 'componentes cambiadas',
    replace: ['np.array([0, 0])', 'np.array([2, 3])'],
    message: /v tiene que valer \(3, 2\)/,
  },
  // contract: review-15 m4: un array de cadenas recibe un mensaje en castellano
  { name: 'cadenas', append: 'v = np.array(["3", "2"])\n', message: /números/ },
]);

// ---------- Proyecto componentes ----------

accepts('componentes.ex02.1', [
  { name: 'tupla en vez de lista', append: 'v = np.array((4, 3))\n' },
  { name: 'decimales', append: 'v = np.array([4.0, 3.0])\n' },
  { name: 'np.asarray', append: 'v = np.asarray([4, 3])\n' },
  { name: 'np.r_', append: 'v = np.r_[4, 3]\n' },
]);
rejects('componentes.ex02.1', [
  { name: 'componentes cambiadas', append: 'v = np.array([3, 4])\n', message: /\(4, 3\)/ },
  { name: 'una lista', append: 'v = [4, 3]\n', message: /array de NumPy/ },
  { name: 'columna', append: 'v = np.array([[4], [3]])\n', message: /forma `\(2,\)`/ },
  // contract: review-15 m4: un array de cadenas recibe un mensaje en castellano
  { name: 'cadenas', append: 'v = np.array(["4", "3"])\n', message: /números/ },
]);

accepts('componentes.ex02.2', [
  { name: 'len', append: 'dim = len(v)\n' },
  { name: 'shape[0]', append: 'dim = v.shape[0]\n' },
  { name: 'np.size', append: 'dim = np.size(v)\n' },
  { name: 'np.shape', append: 'dim = np.shape(v)[0]\n' },
  { name: 'número escrito a mano', append: 'dim = 5\n' },
  { name: 'contando con una suma', append: 'dim = int(np.sum(np.ones_like(v)))\n' },
]);
rejects('componentes.ex02.2', [
  { name: 'ndim (ejes)', append: 'dim = v.ndim\n', message: /v\.ndim/ },
  { name: 'la tupla shape', append: 'dim = v.shape\n', message: /tiene que ser un número/ },
  { name: 'sin contar el cero', append: 'dim = np.count_nonzero(v)\n', message: /valer 5/ },
]);

accepts('componentes.ex02.3', [
  { name: 'np.subtract', append: 'd = np.subtract(B, A)\n' },
  { name: 'menos (A - B)', append: 'd = -(A - B)\n' },
  { name: 'componente a componente', append: 'd = np.array([B[0] - A[0], B[1] - A[1]])\n' },
  { name: 'con decimales', append: 'd = B.astype(float) - A\n' },
  { name: 'suma del opuesto', append: 'd = B + (-1) * A\n' },
]);
rejects('componentes.ex02.3', [
  { name: 'resta al revés', append: 'd = A - B\n', message: /restado al revés/ },
  { name: 'suma', append: 'd = A + B\n', message: /valer \(3, 4\)/ },
  { name: 'lista', append: 'd = [3, 4]\n', message: /array de NumPy/ },
  // contract: review-15 m6: el enunciado pide un array, y una lista (también .tolist()) se rechaza con mensaje
  { name: 'tolist', append: 'd = (B - A).tolist()\n', message: /array de NumPy/ },
  // contract: review-15 m4: un array de cadenas recibe un mensaje en castellano
  { name: 'cadenas', append: 'd = np.array(["3", "4"])\n', message: /números/ },
]);

accepts('componentes.ex02.4', [
  { name: 'copia', append: 'v = emb["perro"].copy()\nprimera = v[0]\n' },
  { name: 'get', append: 'v = emb.get("perro")\nprimera = v[0]\n' },
  { name: 'primera directa', append: 'v = emb["perro"]\nprimera = emb["perro"][0]\n' },
  { name: 'entero de Python', append: 'v = emb["perro"]\nprimera = int(v[0])\n' },
  { name: 'desempaquetando', append: 'v = emb["perro"]\nprimera, _ = v\n' },
  { name: 'array nuevo', append: 'v = np.array(emb["perro"])\nprimera = v.item(0)\n' },
  { name: 'decimal', append: 'v = emb["perro"]\nprimera = float(v[0])\n' },
]);
rejects('componentes.ex02.4', [
  { name: 'otra palabra', append: 'v = emb["gato"]\nprimera = 4\n', message: /«perro»/ },
  {
    name: 'segunda componente',
    append: 'v = emb["perro"]\nprimera = v[1]\n',
    message: /posición 0/,
  },
  // contract: review-15 m4: un array de cadenas recibe un mensaje en castellano
  { name: 'cadenas', append: 'v = np.array(["4", "3"])\nprimera = 4\n', message: /números/ },
]);

const points = 'pts = np.array(list(emb.values()))\n';
accepts('componentes.ex02.5', [
  { name: 'columnas de un array', append: `${points}plt.scatter(pts[:, 0], pts[:, 1])\n` },
  { name: 'transpuesta', append: `${points}plt.scatter(pts.T[0], pts.T[1])\n` },
  { name: 'zip', append: 'plt.scatter(*zip(*emb.values()))\n' },
  {
    name: 'listas por comprensión',
    append:
      'x = [p[0] for p in emb.values()]\ny = [p[1] for p in emb.values()]\nplt.scatter(x, y)\n',
  },
  { name: 'un scatter por punto', append: 'for p in emb.values():\n    plt.scatter(p[0], p[1])\n' },
  {
    // contract: review-15 I4: la solución que el texto enseña, cuatro llamadas con emb["…"][0]
    name: 'cuatro llamadas con emb["…"][0]',
    append:
      'plt.scatter(emb["gato"][0], emb["gato"][1])\nplt.scatter(emb["perro"][0], emb["perro"][1])\nplt.scatter(emb["coche"][0], emb["coche"][1])\nplt.scatter(emb["bici"][0], emb["bici"][1])\n',
  },
  {
    // contract: review-15 I4: la versión corta de la solución, el bucle en una línea
    name: 'bucle en una línea',
    append: 'for p in emb.values(): plt.scatter(p[0], p[1])\n',
  },
  {
    // contract: review-15 m1: las flechas (Quiver es una colección, pero no un punto de scatter) no cuentan
    name: 'con flechas plt.quiver',
    append:
      'for p in emb.values():\n    plt.scatter(p[0], p[1])\nplt.quiver(0, 0, 3, 4, angles="xy", scale_units="xy", scale=1)\nplt.quiver([0, 0], [0, 0], [4, -3], [3, 2], angles="xy", scale_units="xy", scale=1)\n',
  },
  {
    name: 'con etiquetas',
    append:
      'for name, p in emb.items():\n    plt.scatter(p[0], p[1])\n    plt.annotate(name, (p[0], p[1]))\n',
  },
  {
    name: 'ejes con subplots',
    append: `${points}fig, ax = plt.subplots()\nax.scatter(pts[:, 0], pts[:, 1])\n`,
  },
  { name: 'números escritos a mano', append: 'plt.scatter([3, 4, -3, -2], [4, 3, 2, 3])\n' },
  {
    name: 'con estilo y plt.show',
    append: `${points}plt.scatter(pts[:, 0], pts[:, 1], c="red", s=80)\nplt.xlabel("vivo")\nplt.show()\n`,
  },
]);
rejects('componentes.ex02.5', [
  {
    name: 'x e y cambiadas',
    append: `${points}plt.scatter(pts[:, 1], pts[:, 0])\n`,
    message: /primera componente/,
  },
  {
    // contract: review-15 m2: con tres puntos el fallo es el recuento, no el eje de la primera componente
    name: 'solo tres puntos',
    append: 'plt.scatter([3, 4, -3], [4, 3, 2])\n',
    message: /4 puntos/,
    notMessage: /primera componente/,
  },
  {
    // contract: review-15 m2: sin figura sale un solo mensaje
    name: 'sin figura',
    append: 'pass\n',
    message: /ninguna figura/,
    failures: 1,
  },
  {
    // contract: review-15 m1: un quinto punto de scatter sigue fallando y el mensaje lo dice
    name: 'con un quinto punto',
    append: 'for p in emb.values():\n    plt.scatter(p[0], p[1])\nplt.scatter(0, 0, marker="+")\n',
    message: /solo los cuatro puntos de `emb`/,
  },
  {
    name: 'plt.plot en vez de scatter',
    append: `${points}plt.plot(pts[:, 0], pts[:, 1], "o")\n`,
    message: /plt\.scatter/,
  },
]);

// ---------- datos de tipo equivocado: ninguna comprobación saca un error de NumPy en inglés ----------

describe('datos de tipo equivocado: sin errores de NumPy en inglés', { timeout: 60_000 }, () => {
  for (const q of [...byId.values()].filter((q) => /^(despegue|componentes)\./.test(q.id))) {
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
