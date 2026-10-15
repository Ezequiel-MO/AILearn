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
import { sumaEscala } from './suma-escala';

// El proyecto no está en el registro del juego hasta la tarea 18, así que tests/content/python.test.ts
// todavía no lo recorre: aquí se comprueban sus cinco preguntas de código (la referencia pasa, el
// `starter` no), las soluciones correctas distintas de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const byId = new Map(
  projectQuestions(sumaEscala)
    .filter((q): q is CodigoQ => q.type === 'codigo')
    .map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código', () => {
    // contract: tarea 16, tabla de ex02: cinco preguntas de código
    expect([...byId.keys()]).toEqual([1, 2, 3, 4, 5].map((n) => `suma-escala.ex02.${n}`));
  });
  for (const n of [1, 2, 3, 4, 5]) {
    it(`suma-escala.ex02.${n}: la referencia pasa y el starter no`, async () => {
      // contract: reglas comunes de contenido: la reference supera las comprobaciones y el starter no
      expect(await codeQuestionProblems(pyodide, question(`suma-escala.ex02.${n}`))).toEqual([]);
    });
  }
});

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
        // contract: review-15 m2: sin cascada, los mensajes que no son el fallo no salen
        if (v.notMessage) expect(failed.join(' | '), describeRun(r)).not.toMatch(v.notMessage);
        if (v.failures !== undefined) expect(failed, describeRun(r)).toHaveLength(v.failures);
      });
    }
  });
};

// ---------- ex02.1: s = u + v ----------

accepts('suma-escala.ex02.1', [
  { name: 'al revés, v + u', append: 's = v + u\n' },
  { name: 'np.add', append: 's = np.add(u, v)\n' },
  { name: 'componente a componente', append: 's = np.array([u[0] + v[0], u[1] + v[1]])\n' },
  { name: 'escrita a mano', append: 's = np.array([5, 3])\n' },
  { name: 'decimales', append: 's = u.astype(float) + v\n' },
  { name: 'suma por ejes', append: 's = np.sum([u, v], axis=0)\n' },
  // contract: review-16 (sondas del revisor: soluciones correctas que deben aceptarse)
  { name: 'sum de una lista de arrays', append: 's = sum([u, v])\n' },
]);
rejects('suma-escala.ex02.1', [
  { name: 'una lista de Python', append: 's = [5, 3]\n', message: /array de NumPy/ },
  { name: 'una tupla', append: 's = (5, 3)\n', message: /array de NumPy/ },
  {
    name: 'las dos listas unidas',
    append: 's = np.concatenate([u, v])\n',
    message: /4 componentes/,
  },
  {
    // contract: review-16 m12 a (dos listas de Python unidas con + también reciben el mensaje de «unido»)
    name: 'dos listas de Python unidas con +',
    append: 's = [2, 1] + [3, 2]\n',
    message: /unido/,
  },
  { name: 'resta', append: 's = u - v\n', message: /restado/ },
  { name: 'componentes cambiadas', append: 's = np.array([3, 5])\n', message: /\(5, 3\)/ },
  { name: 'una fila de una matriz', append: 's = np.array([[5, 3]])\n', message: /2 componentes/ },
  { name: 'cadenas', append: 's = np.array(["5", "3"])\n', message: /números/ },
]);

// ---------- ex02.2: w = -0,5 u ----------

accepts('suma-escala.ex02.2', [
  { name: 'número delante entre paréntesis', append: 'w = (-0.5) * u\n' },
  { name: 'número detrás', append: 'w = u * -0.5\n' },
  { name: 'dividiendo', append: 'w = -u / 2\n' },
  { name: 'dividiendo entre -2', append: 'w = u / -2\n' },
  { name: 'dos pasos', append: 'w = u * 0.5\nw = -w\n' },
  { name: 'np.multiply', append: 'w = np.multiply(-0.5, u)\n' },
  { name: 'escrita a mano', append: 'w = np.array([-2, -1])\n' },
  // contract: review-16 (sondas del revisor: soluciones correctas que deben aceptarse)
  { name: 'sin cero delante', append: 'w = -.5 * u\n' },
  { name: 'multiplicar y dividir', append: 'w = u * -1 / 2\n' },
  { name: 'con división entera', append: 'w = u // -2\n' },
]);
rejects('suma-escala.ex02.2', [
  { name: 'sin el signo menos', append: 'w = 0.5 * u\n', message: /falta el signo menos/ },
  { name: 'por -2', append: 'w = -2 * u\n', message: /por -2/ },
  { name: 'una lista de Python', append: 'w = [-2, -1]\n', message: /array de NumPy/ },
  { name: 'cadenas', append: 'w = np.array(["-2", "-1"])\n', message: /números/ },
  {
    name: 'solo la primera componente',
    append: 'w = np.array([-0.5 * u[0], u[1]])\n',
    message: /\(-2, -1\)/,
  },
  // contract: review-16 I1 (el decimal con coma crea una tupla: el mensaje explica la coma y manda al punto)
  {
    name: 'decimal con coma delante',
    append: 'w = -0,5 * u\n',
    message: /con punto/,
    failures: 1,
  },
  {
    name: 'decimal con coma detrás',
    append: 'w = -u * 0,5\n',
    message: /con punto/,
    failures: 1,
  },
  // contract: review-16 (sondas del revisor: errores que ya tienen su mensaje)
  {
    name: 'dividir entre 2 sin signo',
    append: 'w = u / 2\n',
    message: /\(-2, -1\)/,
    notMessage: /con punto/,
  },
  // contract: rereview-16 N3 (la cola «con punto» solo la lee quien escribió una coma)
  {
    name: 'sin el signo menos, con punto',
    append: 'w = u * 0.5\n',
    message: /falta el signo menos/,
    notMessage: /con punto/,
  },
  {
    name: 'por -2, con punto',
    append: 'w = -2 * u\n',
    message: /por -2/,
    notMessage: /con punto/,
  },
  // contract: rereview-16 N3 (`(-0,5) * u` es el array [0, 10]: mensaje propio que dice su valor)
  {
    name: 'paréntesis con coma delante: w vale (0, 10)',
    append: 'w = (-0,5) * u\n',
    message: /\(0, 10\).*con punto/,
    failures: 1,
  },
  {
    name: 'paréntesis con coma detrás: w vale (0, 10)',
    append: 'w = u * (-0,5)\n',
    message: /\(0, 10\).*con punto/,
    failures: 1,
  },
]);

// ---------- ex02.3: c = 2u - v ----------

accepts('suma-escala.ex02.3', [
  { name: 'factor detrás', append: 'c = u * 2 - v\n' },
  { name: 'u + u - v', append: 'c = u + u - v\n' },
  { name: 'con -v por delante', append: 'c = -v + 2 * u\n' },
  { name: 'dos pasos', append: 'c = 2 * u\nc = c - v\n' },
  { name: 'np.subtract', append: 'c = np.subtract(2 * u, v)\n' },
  { name: 'decimales', append: 'c = 2.0 * u - v\n' },
  { name: 'escrita a mano', append: 'c = np.array([-2, 8])\n' },
]);
rejects('suma-escala.ex02.3', [
  { name: 'resta al revés', append: 'c = v - 2 * u\n', message: /al revés/ },
  { name: 'el 2 escala también a v', append: 'c = 2 * (u - v)\n', message: /también a `v`/ },
  { name: 'sin escalar', append: 'c = u - v\n', message: /tiene que valer \(-2, 8\)/ },
  { name: 'una lista de Python', append: 'c = [-2, 8]\n', message: /array de NumPy/ },
  { name: 'cadenas', append: 'c = np.array(["-2", "8"])\n', message: /números/ },
]);

// ---------- ex02.4: centroide con np.mean ----------

accepts('suma-escala.ex02.4', [
  { name: 'método mean', append: 'centroide = E.mean(axis=0)\n' },
  { name: 'eje sin nombre', append: 'centroide = np.mean(E, 0)\n' },
  { name: 'np.average', append: 'centroide = np.average(E, axis=0)\n' },
  { name: 'suma entre tres', append: 'centroide = np.sum(E, axis=0) / 3\n' },
  { name: 'fila a fila', append: 'centroide = (E[0] + E[1] + E[2]) / 3\n' },
  { name: 'matriz transpuesta', append: 'centroide = np.mean(E.T, axis=1)\n' },
  { name: 'redondeado a dos decimales', append: 'centroide = np.round(np.mean(E, axis=0), 2)\n' },
  { name: 'escrito a mano', append: 'centroide = np.array([-3, 4 / 3])\n' },
  // contract: review-16 (sondas del revisor: soluciones correctas que deben aceptarse)
  { name: 'suma entre len(E)', append: 'centroide = E.sum(axis=0) / len(E)\n' },
  { name: 'eje negativo', append: 'centroide = np.mean(E, axis=-2)\n' },
  { name: 'sum de Python entre tres', append: 'centroide = sum(E) / 3\n' },
]);
rejects('suma-escala.ex02.4', [
  {
    name: 'axis=1 (por filas)',
    append: 'centroide = np.mean(E, axis=1)\n',
    message: /promediado por filas.*axis=0/,
    failures: 1,
  },
  {
    name: 'sin axis',
    append: 'centroide = np.mean(E)\n',
    message: /un solo número/,
    failures: 1,
  },
  {
    name: 'método mean sin axis',
    append: 'centroide = E.mean()\n',
    message: /un solo número/,
    failures: 1,
  },
  {
    name: 'suma sin dividir',
    append: 'centroide = np.sum(E, axis=0)\n',
    message: /tiene que valer \(-3; 1,33\)/,
  },
  {
    name: 'mediana',
    append: 'centroide = np.median(E, axis=0)\n',
    message: /tiene que valer \(-3; 1,33\)/,
  },
  {
    name: 'una lista de Python',
    append: 'centroide = np.mean(E, axis=0).tolist()\n',
    message: /array de NumPy/,
  },
  {
    name: 'con keepdims (una fila de una matriz)',
    append: 'centroide = np.mean(E, axis=0, keepdims=True)\n',
    message: /2 componentes/,
  },
  { name: 'cadenas', append: 'centroide = np.array(["-3", "1.33"])\n', message: /números/ },
  // contract: review-16 (sondas del revisor: errores que ya tienen su mensaje)
  {
    name: 'un solo número con float',
    append: 'centroide = float(np.mean(E))\n',
    message: /un solo número/,
    failures: 1,
  },
  // contract: rereview-16 N5 (`1,33` con coma dentro de np.array da 3 números: no es «promediar por filas»)
  {
    name: 'escrito a mano con coma decimal',
    append: 'centroide = np.array([-3, 1,33])\n',
    message: /con punto/,
    notMessage: /por filas/,
    failures: 1,
  },
  // contract: rereview-16 m2 (la coma decimal no solo sale con dos decimales: `1,333` y `1,3` también son tres números)
  {
    name: 'escrito a mano con coma decimal y tres decimales',
    append: 'centroide = np.array([-3, 1,333])\n',
    message: /con punto/,
    notMessage: /por filas/,
    failures: 1,
  },
  {
    name: 'escrito a mano con coma decimal y un decimal',
    append: 'centroide = np.array([-3, 1,3])\n',
    message: /con punto/,
    notMessage: /por filas/,
    failures: 1,
  },
  // contract: rereview-16 m2 (promediar por filas sigue siendo promediar por filas: no es la coma)
  {
    name: 'axis=1 no es una coma decimal',
    append: 'centroide = np.mean(E, axis=1)\n',
    message: /promediado por filas/,
    notMessage: /con punto/,
    failures: 1,
  },
  // contract: rereview-16 m1 (un array de tres cadenas no rompe el check con un error de NumPy en inglés)
  // contract: review-18r m1: ni tres cadenas ni tres None son números ni se han promediado por filas
  {
    name: 'tres cadenas',
    append: 'centroide = np.array(["coche", "bici", "camión"])\n',
    message: /3 elementos/,
    notMessage: /promediado|ufunc|operand|dtype\(/,
    failures: 1,
  },
  {
    name: 'tres None',
    append: 'centroide = np.array([None, None, None])\n',
    message: /3 elementos/,
    notMessage: /promediado|ufunc|operand|dtype\(/,
    failures: 1,
  },
  // contract: review-18r m1: la primera columna y la suma por filas tienen tres elementos, pero no son la media por filas
  {
    name: 'la primera columna',
    append: 'centroide = E[:, 0]\n',
    message: /3 elementos/,
    notMessage: /promediado/,
    failures: 1,
  },
  {
    name: 'suma por filas',
    append: 'centroide = np.sum(E, axis=1)\n',
    message: /3 elementos/,
    notMessage: /promediado/,
    failures: 1,
  },
  // contract: review-18r m1: la mediana por filas coincide con la media por filas (dos números por fila): mismo mensaje
  {
    name: 'mediana por filas',
    append: 'centroide = np.median(E, axis=1)\n',
    message: /promediado por filas/,
    failures: 1,
  },
  {
    name: 'la matriz transpuesta con axis=0',
    append: 'centroide = np.mean(E.T, axis=0)\n',
    message: /promediado por filas/,
    failures: 1,
  },
]);

// ---------- ex02.5: dibujar u, v y u + v ----------

const QUIVER = 'angles="xy", scale_units="xy", scale=1';

accepts('suma-escala.ex02.5', [
  {
    name: 'v desde la punta de u (punta con cola)',
    append: `s = u + v\nplt.quiver(0, 0, u[0], u[1], ${QUIVER})\nplt.quiver(u[0], u[1], v[0], v[1], ${QUIVER})\nplt.quiver(0, 0, s[0], s[1], ${QUIVER})\n`,
  },
  {
    name: 'una sola llamada con listas',
    append: `s = u + v\nplt.quiver([0, 0, 0], [0, 0, 0], [u[0], v[0], s[0]], [u[1], v[1], s[1]], ${QUIVER})\n`,
  },
  {
    name: 'con ejes creados con subplots',
    append: `s = u + v\nplt.close("all")\nfig, ax = plt.subplots()\nax.quiver(0, 0, 2, 1, ${QUIVER})\nax.quiver(0, 0, 3, 2, ${QUIVER})\nax.quiver(0, 0, s[0], s[1], ${QUIVER})\n`,
  },
  {
    // contract: review-16 (sondas del revisor: formas cortas de llamar a quiver); con las opciones de escala desde el informe de Oliver (2026-10-15)
    name: 'forma corta con desempaquetado',
    append: `s = u + v\nplt.quiver(0, 0, *u, ${QUIVER})\nplt.quiver(0, 0, *v, ${QUIVER})\nplt.quiver(0, 0, *s, ${QUIVER})\n`,
  },
  {
    name: 'con colores y una flecha de adorno',
    append: `s = np.add(u, v)\nplt.quiver(0, 0, u[0], u[1], color="blue", ${QUIVER})\nplt.quiver(0, 0, v[0], v[1], color="green", ${QUIVER})\nplt.quiver(0, 0, s[0], s[1], color="red", ${QUIVER})\nplt.quiver(0, 0, 1, 0, color="gray", ${QUIVER})\n`,
  },
]);
rejects('suma-escala.ex02.5', [
  {
    // contract: informe de Oliver (2026-10-15): con plt.quiver sin opciones la respuesta contaba como correcta y la figura salía deformada
    name: 'dibuja las tres flechas sin las opciones de escala',
    append:
      's = u + v\nplt.quiver(0, 0, u[0], u[1])\nplt.quiver(0, 0, v[0], v[1])\nplt.quiver(0, 0, s[0], s[1])\n',
    message: /no están dibujadas a escala/,
    failures: 1,
  },
  {
    // contract: informe de Oliver (2026-10-15): basta una flecha sin escala para que la figura engañe
    name: 'una de las tres flechas sin las opciones de escala',
    append: `s = u + v\nplt.quiver(0, 0, u[0], u[1], ${QUIVER})\nplt.quiver(0, 0, v[0], v[1], ${QUIVER})\nplt.quiver(0, 0, s[0], s[1])\n`,
    message: /no están dibujadas a escala/,
    failures: 1,
  },
  {
    name: 'falta la flecha de la suma',
    append: `s = u + v\nplt.quiver(0, 0, u[0], u[1], ${QUIVER})\nplt.quiver(0, 0, v[0], v[1], ${QUIVER})\n`,
    message: /Falta la flecha de la suma/,
    failures: 1,
  },
  {
    name: 'falta la flecha de u',
    append: `s = u + v\nplt.quiver(0, 0, v[0], v[1], ${QUIVER})\nplt.quiver(0, 0, s[0], s[1], ${QUIVER})\n`,
    message: /Falta la flecha de `u`/,
    failures: 1,
  },
  {
    name: 'falta la flecha de v',
    append: `s = u + v\nplt.quiver(0, 0, u[0], u[1], ${QUIVER})\nplt.quiver(0, 0, s[0], s[1], ${QUIVER})\n`,
    message: /Falta la flecha de `v`/,
    failures: 1,
  },
  {
    name: 'solo calcula s, sin dibujar nada',
    append: 's = u + v\n',
    message: /No hay flechas/,
    failures: 1,
  },
  {
    name: 'cierra la figura',
    append: 's = u + v\nplt.close("all")\n',
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'dibuja con plt.plot en vez de flechas',
    append: 's = u + v\nplt.plot([0, s[0]], [0, s[1]])\n',
    message: /No hay flechas/,
    failures: 1,
  },
  {
    name: 'suma mal calculada',
    append: `s = u - v\nplt.quiver(0, 0, u[0], u[1], ${QUIVER})\nplt.quiver(0, 0, v[0], v[1], ${QUIVER})\nplt.quiver(0, 0, s[0], s[1], ${QUIVER})\n`,
    message: /`s` tiene que valer \(5, 3\)/,
  },
  { name: 's es una lista', append: 's = [5, 3]\n', message: /array de NumPy/ },
  // contract: review-16 (sonda del revisor: plt.arrow no es plt.quiver y recibe el mensaje de «sin flechas»)
  {
    name: 'dibuja con plt.arrow',
    append: 's = u + v\nplt.arrow(0, 0, s[0], s[1])\n',
    message: /No hay flechas.*plt\.quiver/,
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
