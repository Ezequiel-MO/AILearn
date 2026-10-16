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
import { normalizar } from './normalizar';
import { examen2Normalizar } from './examen-2-normalizar';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen2Normalizar
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [
    ...projectQuestions(normalizar).filter((q): q is CodigoQ => q.type === 'codigo'),
    ...bankCode,
  ].map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const FILAS = 'examen-2.filas';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo común: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `normalizar.ex02.${n}`),
      FILAS,
    ]);
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

/** Una función de un parámetro, con el cuerpo sangrado. */
const fn = (name: string, param: string, body: string): string =>
  `\ndef ${name}(${param}):\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;

// ---------- ex02.1: normalizar(v) ----------

const N = (body: string): string => fn('normalizar', 'v', body);

accepts('normalizar.ex02.1', [
  { name: 'la norma en una variable', append: N('n = np.linalg.norm(v)\nreturn v / n') },
  { name: 'norma con raíz a mano', append: N('return v / np.sqrt(np.sum(v ** 2))') },
  { name: 'norma con el producto escalar', append: N('return v / np.sqrt(np.dot(v, v))') },
  { name: 'norma de orden 2', append: N('return v / np.linalg.norm(v, 2)') },
  { name: 'multiplicando por el inverso', append: N('return v * (1 / np.linalg.norm(v))') },
  {
    // contract: sonda: la función se llama con arrays de enteros; una versión que pasa a decimales antes también es correcta
    name: 'convirtiendo antes a decimales',
    append: N('v = np.asarray(v, dtype=float)\nreturn v / np.linalg.norm(v)'),
  },
  {
    // contract: sonda: devolver una lista de números también es un vector unitario
    name: 'devolviendo una lista',
    append: N('return list(v / np.linalg.norm(v))'),
  },
]);
rejects('normalizar.ex02.1', [
  {
    name: 'devuelve v sin cambios',
    append: N('return v'),
    message: /devuelve el propio `v`/,
    failures: 1,
  },
  {
    name: 'entre el cuadrado de la norma',
    append: N('return v / np.linalg.norm(v) ** 2'),
    message: /cuadrado de la norma/,
    failures: 1,
  },
  {
    name: 'entre el cuadrado de la norma, sin raíz',
    append: N('return v / np.dot(v, v)'),
    message: /cuadrado de la norma/,
    failures: 1,
  },
  {
    name: 'entre la suma de las componentes',
    append: N('return v / np.sum(v)'),
    message: /suma de las componentes/,
    failures: 1,
  },
  {
    name: 'entre la norma de orden 1',
    append: N('return v / np.linalg.norm(v, 1)'),
    message: /suma de las componentes/,
    failures: 1,
  },
  {
    name: 'entre la mayor componente',
    append: N('return v / np.max(v)'),
    message: /no da el vector unitario correcto en todos los casos/,
    failures: 1,
  },
  {
    name: 'solo funciona con dos componentes',
    append: N('return np.array([v[0], v[1]]) / np.linalg.norm(v)'),
    message: /no da el vector unitario correcto en todos los casos.*cuatro componentes/,
    failures: 1,
  },
  {
    name: 'devuelve la norma, no el vector',
    append: N('return np.linalg.norm(v)'),
    message: /tiene que devolver un array/,
    failures: 1,
  },
  {
    name: 'sin return',
    append: N('n = np.linalg.norm(v)\nu = v / n'),
    message: /falta el `return`/,
    failures: 1,
  },
  {
    name: 'una función que da error',
    append: N('return v / norma_total'),
    message: /tiene que devolver un array/,
    failures: 1,
  },
  // contract: review-18r m2 (cadenas y None en lo que devuelve la función no rompen las comprobaciones)
  {
    name: 'devuelve un texto',
    append: N('return "hola"'),
    message: /tiene que devolver un array/,
    failures: 1,
  },
  {
    name: 'devuelve un array de texto',
    append: N('return np.array(["a", "b"])'),
    message: /tiene que devolver un array/,
    failures: 1,
  },
]);

// ---------- ex02.2 y examen-2.filas: normalizar las filas con keepdims ----------

const filas = (id: string, M: string, Mn: string): void => {
  accepts(id, [
    {
      name: 'reshape de las normas a una columna',
      append: `${Mn} = ${M} / np.linalg.norm(${M}, axis=1).reshape(-1, 1)\n`,
    },
    {
      name: 'np.newaxis',
      append: `${Mn} = ${M} / np.linalg.norm(${M}, axis=1)[:, np.newaxis]\n`,
    },
    {
      name: 'None como eje nuevo',
      append: `${Mn} = ${M} / np.linalg.norm(${M}, axis=1)[:, None]\n`,
    },
    {
      name: 'con la traspuesta',
      append: `${Mn} = (${M}.T / np.linalg.norm(${M}, axis=1)).T\n`,
    },
    {
      name: 'raíz a mano con keepdims',
      append: `${Mn} = ${M} / np.sqrt((${M} ** 2).sum(axis=1, keepdims=True))\n`,
    },
    {
      name: 'un bucle por filas',
      append: `${Mn} = np.array([fila / np.linalg.norm(fila) for fila in ${M}])\n`,
    },
    {
      name: 'normas en una variable',
      append: `normas = np.linalg.norm(${M}, axis=1, keepdims=True)\n${Mn} = ${M} / normas\n`,
    },
    {
      name: 'copia decimal y se divide fila a fila',
      append: `${Mn} = ${M}.astype(float)\nfor i in range(3):\n    ${Mn}[i] = ${Mn}[i] / np.linalg.norm(${Mn}[i])\n`,
    },
  ]);
};

filas('normalizar.ex02.2', 'E', 'En');
rejects('normalizar.ex02.2', [
  {
    name: 'sin normalizar',
    append: 'En = E\n',
    message: /`En` sigue valiendo lo mismo que `E`/,
    failures: 1,
  },
  {
    name: 'sin keepdims, con la matriz cuadrada (no da error)',
    append: 'En = E / np.linalg.norm(E, axis=1)\n',
    message: /divide cada columna entre la norma de una fila distinta.*keepdims=True/,
    failures: 1,
  },
  {
    name: 'las normas de las columnas',
    append: 'En = E / np.linalg.norm(E, axis=0, keepdims=True)\n',
    message: /normalizadas las columnas, no las filas/,
    failures: 1,
  },
  {
    name: 'la norma de toda la matriz',
    append: 'En = E / np.linalg.norm(E)\n',
    message: /una sola norma, la de toda la matriz/,
    failures: 1,
  },
  {
    name: 'entre el cuadrado de la norma',
    append: 'En = E / np.linalg.norm(E, axis=1, keepdims=True) ** 2\n',
    message: /`En` tiene que ser `E` con cada fila dividida entre su propia norma/,
    failures: 1,
  },
  {
    name: 'solo la primera fila',
    append: 'En = E[0] / np.linalg.norm(E[0])\n',
    message: /3 filas y 3 columnas/,
    failures: 1,
  },
  {
    name: 'una lista',
    append: 'En = [0.6, 0, 0.8]\n',
    message: /3 filas y 3 columnas/,
    failures: 1,
  },
]);

filas(FILAS, 'M', 'Mn');
rejects(FILAS, [
  {
    name: 'sin normalizar',
    append: 'Mn = M\n',
    message: /`Mn` sigue valiendo lo mismo que `M`/,
    failures: 1,
  },
  {
    name: 'sin keepdims, con la matriz cuadrada (no da error)',
    append: 'Mn = M / np.linalg.norm(M, axis=1)\n',
    message: /divide cada columna entre la norma de una fila distinta.*keepdims=True/,
    failures: 1,
  },
  {
    name: 'las normas de las columnas',
    append: 'Mn = M / np.linalg.norm(M, axis=0, keepdims=True)\n',
    message: /normalizadas las columnas, no las filas/,
    failures: 1,
  },
  {
    name: 'la norma de toda la matriz',
    append: 'Mn = M / np.linalg.norm(M)\n',
    message: /una sola norma, la de toda la matriz/,
    failures: 1,
  },
  {
    name: 'entre la suma de cada fila',
    append: 'Mn = M / M.sum(axis=1, keepdims=True)\n',
    message: /`Mn` tiene que ser `M` con cada fila dividida entre su propia norma/,
    failures: 1,
  },
]);

// ---------- ex02.3: normalizar_filas(E) con una fila nula ----------

const NF = (body: string): string => fn('normalizar_filas', 'E', body);

accepts('normalizar.ex02.3', [
  {
    name: 'np.divide con where',
    append: NF(
      'n = np.linalg.norm(E, axis=1, keepdims=True)\nreturn np.divide(E, n, out=np.zeros(E.shape), where=n > 0)',
    ),
  },
  {
    name: 'una máscara que cambia las normas nulas por 1',
    append: NF('n = np.linalg.norm(E, axis=1, keepdims=True)\nn[n == 0] = 1\nreturn E / n'),
  },
  {
    name: 'np.maximum con un valor muy pequeño',
    append: NF('return E / np.maximum(np.linalg.norm(E, axis=1, keepdims=True), 1e-12)'),
  },
  {
    // contract: sonda: dividir y sustituir los nan por ceros también deja la fila nula en ceros
    name: 'np.nan_to_num sobre la división',
    append: NF('return np.nan_to_num(E / np.linalg.norm(E, axis=1, keepdims=True))'),
  },
  {
    name: 'un bucle por filas',
    append: NF(
      'salida = np.zeros(E.shape)\nfor i, fila in enumerate(E):\n    n = np.linalg.norm(fila)\n    if n > 0:\n        salida[i] = fila / n\nreturn salida',
    ),
  },
  {
    name: 'asignación solo en las filas con norma',
    append: NF(
      'salida = E.astype(float)\nn = np.linalg.norm(E, axis=1)\nok = n > 0\nsalida[ok] = E[ok] / n[ok, None]\nreturn salida',
    ),
  },
]);
rejects('normalizar.ex02.3', [
  {
    name: 'sin tratar la fila nula',
    append: NF('return E / np.linalg.norm(E, axis=1, keepdims=True)'),
    message: /devuelve `nan`.*dividirla entre 0/,
    failures: 1,
  },
  {
    name: 'sin keepdims',
    append: NF('return E / np.linalg.norm(E, axis=1)'),
    message: /devuelve `nan`|tiene que devolver un array/,
  },
  {
    name: 'la fila nula sale con unos',
    append: NF('n = np.linalg.norm(E, axis=1, keepdims=True)\nreturn np.where(n == 0, 1, E / n)'),
    message: /Una fila de ceros tiene que quedarse en ceros/,
    failures: 1,
  },
  {
    name: 'la salida de enteros (np.zeros_like) no admite decimales',
    append: NF(
      'n = np.linalg.norm(E, axis=1, keepdims=True)\nreturn np.divide(E, n, out=np.zeros_like(E), where=n > 0)',
    ),
    message: /tiene que devolver un array.*admita decimales/,
    failures: 1,
  },
  {
    name: 'quita las filas nulas',
    append: NF('n = np.linalg.norm(E, axis=1)\nreturn E[n > 0] / n[n > 0, None]'),
    message: /las mismas filas y columnas que `E`/,
    failures: 1,
  },
  {
    name: 'devuelve E sin cambios',
    append: NF('return E'),
    message: /Las filas que no son nulas tienen que quedar divididas entre su propia norma/,
    failures: 1,
  },
  {
    name: 'sin return',
    append: NF('n = np.linalg.norm(E, axis=1, keepdims=True)'),
    message: /falta el `return`/,
    failures: 1,
  },
  {
    name: 'devuelve un texto',
    append: NF('return "hola"'),
    message: /tiene que devolver un array/,
    failures: 1,
  },
]);

// ---------- ex02.4: En @ qn da los cosenos ----------

accepts('normalizar.ex02.4', [
  {
    name: 'np.dot y np.allclose',
    append:
      'qn = q / np.linalg.norm(q)\nsim = np.dot(En, qn)\ncoinciden = np.allclose(sim, cos_largo)\n',
  },
  {
    name: 'np.matmul y una tolerancia explícita',
    append:
      'qn = q / np.linalg.norm(q)\nsim = np.matmul(En, qn)\ncoinciden = np.allclose(sim, cos_largo, atol=1e-9)\n',
  },
  {
    name: 'la raíz de la norma a mano y la diferencia máxima',
    append:
      'qn = q / np.sqrt(np.sum(q ** 2))\nsim = En @ qn\ncoinciden = bool(np.max(np.abs(sim - cos_largo)) < 1e-9)\n',
  },
  {
    name: 'np.isclose con all()',
    append:
      'qn = q / np.linalg.norm(q)\nsim = En @ qn\ncoinciden = np.isclose(sim, cos_largo).all()\n',
  },
]);
rejects('normalizar.ex02.4', [
  {
    name: 'qn sin normalizar',
    append: 'qn = q\nsim = En @ qn\ncoinciden = np.allclose(sim, cos_largo)\n',
    message: /`qn` sigue valiendo lo mismo que `q`/,
  },
  {
    name: 'qn dividido entre otro número',
    append:
      'qn = q / np.linalg.norm(q) ** 2\nsim = En @ qn\ncoinciden = np.allclose(sim, cos_largo)\n',
    message: /`qn` tiene que ser el unitario de `q`/,
  },
  {
    name: 'los productos escalares sin normalizar',
    append: 'qn = q / np.linalg.norm(q)\nsim = E @ q\ncoinciden = np.allclose(sim, cos_largo)\n',
    message: /`sim` vale \(14, 8, 29, 19, 20\)/,
    failures: 1,
  },
  {
    name: 'En por q, sin normalizar la consulta',
    append: 'qn = q / np.linalg.norm(q)\nsim = En @ q\ncoinciden = np.allclose(sim, cos_largo)\n',
    message: /multiplicados por la norma de `q`, que es 3/,
    failures: 1,
  },
  {
    name: 'E por qn, con las filas sin normalizar',
    append: 'qn = q / np.linalg.norm(q)\nsim = E @ qn\ncoinciden = np.allclose(sim, cos_largo)\n',
    message: /faltan las normas de las filas de `E`/,
    failures: 1,
  },
  {
    name: 'sim correcto y coinciden en False',
    append: 'qn = q / np.linalg.norm(q)\nsim = En @ qn\ncoinciden = False\n',
    message: /`coinciden` vale `False`, pero `sim` y `cos_largo` son el mismo coseno/,
    failures: 1,
  },
  {
    name: 'coinciden es un array de booleanos',
    append: 'qn = q / np.linalg.norm(q)\nsim = En @ qn\ncoinciden = np.isclose(sim, cos_largo)\n',
    message: /único valor, `True` o `False`/,
    failures: 1,
  },
  {
    name: 'coinciden es un texto',
    append: 'qn = q / np.linalg.norm(q)\nsim = En @ qn\ncoinciden = "sí"\n',
    message: /único valor, `True` o `False`/,
    failures: 1,
  },
  {
    name: 'sim es una lista de una componente',
    append: 'qn = q / np.linalg.norm(q)\nsim = [0.93]\ncoinciden = True\n',
    message: /array de NumPy con 5 números/,
    failures: 1,
  },
]);

// ---------- ex02.5: el orden por distancia es el orden por coseno ----------

accepts('normalizar.ex02.5', [
  {
    name: 'la distancia con la raíz a mano',
    append:
      'dist = np.sqrt(((En - qn) ** 2).sum(axis=1))\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
  },
  {
    name: 'el orden por coseno con el signo cambiado',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(-(En @ qn))\nmismo = np.array_equal(orden_dist, orden_cos)\n',
  },
  {
    name: 'los órdenes como listas',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = list(np.argsort(dist))\norden_cos = (np.argsort(En @ qn)[::-1]).tolist()\nmismo = np.array_equal(orden_dist, orden_cos)\n',
  },
  {
    name: 'mismo con all()',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = bool((orden_dist == orden_cos).all())\n',
  },
  {
    // contract: sonda: el coseno con la fórmula completa, sin normalizar, da el mismo orden
    name: 'el orden por coseno con la fórmula completa',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\ncos = (E @ q) / (np.linalg.norm(E, axis=1) * np.linalg.norm(q))\norden_cos = np.argsort(cos)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
  },
]);
rejects('normalizar.ex02.5', [
  {
    name: 'la distancia sin normalizar',
    append:
      'dist = np.linalg.norm(E - q, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
    message: /distancia entre `E` y `q`, sin normalizar/,
    failures: 1,
  },
  {
    name: 'la distancia al cuadrado',
    append:
      'dist = ((En - qn) ** 2).sum(axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
    message: /distancia al cuadrado: falta la raíz cuadrada/,
    failures: 1,
  },
  {
    name: 'orden_dist del más lejano al más cercano',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)[::-1]\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
    message: /`orden_dist` empieza por el documento más lejano/,
    failures: 1,
  },
  {
    name: 'orden_cos de menor a mayor',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)\nmismo = np.array_equal(orden_dist, orden_cos)\n',
    message: /`orden_cos` empieza por el documento menos parecido/,
    failures: 1,
  },
  {
    name: 'orden_cos con el producto escalar sin normalizar',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(E @ q)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
    message: /el documento 2, que es el más largo, se cuela el primero/,
    failures: 1,
  },
  {
    name: 'mismo en False con los dos órdenes iguales',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = False\n',
    message: /`mismo` vale `False`, pero `orden_dist` y `orden_cos` son la misma lista/,
    failures: 1,
  },
  {
    name: 'mismo es un array de booleanos',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.argsort(dist)\norden_cos = np.argsort(En @ qn)[::-1]\nmismo = orden_dist == orden_cos\n',
    message: /único valor, `True` o `False`.*`np.array_equal`/,
    failures: 1,
  },
  {
    name: 'valores en vez de posiciones',
    append:
      'dist = np.linalg.norm(En - qn, axis=1)\norden_dist = np.sort(dist)\norden_cos = np.sort(En @ qn)[::-1]\nmismo = np.array_equal(orden_dist, orden_cos)\n',
    message:
      /`orden_dist` tiene que ser un array de NumPy con 5 posiciones.*`orden_cos` tiene que ser un array de NumPy con 5 posiciones/,
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
