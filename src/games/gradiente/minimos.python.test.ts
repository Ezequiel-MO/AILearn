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
import { NUMPY_ENGLISH, garbageProbes } from '../../../tests/content/prose-helpers';
import { minimos } from './minimos';
import { examen0Minimos } from './examen-0-minimos';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.
// La órbita aún no está registrada: las pruebas genéricas de tests/content no recorren este proyecto.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const isCode = (q: { type: string }): q is CodigoQ => q.type === 'codigo';
const projectCode = minimos.exercises.flatMap((e) => e.questions).filter(isCode);
const bankCode = examen0Minimos.map((e) => e.question).filter(isCode);
const byId = new Map([...projectCode, ...bankCode].map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'minimos.ex02.1',
  'minimos.ex02.2',
  'minimos.ex02.3',
  'minimos.ex02.4',
  'minimos.ex02.5',
  'examen-0.minimos-rejilla',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: brief-orbita-0.md, apartado C: ex02 son cinco preguntas de código y el banco fijo tiene una
    expect([...byId.keys()]).toEqual(IDS);
  });
  for (const id of IDS) {
    it(`${id}: la referencia pasa y el starter no`, async () => {
      // contract: reglas comunes de contenido: la reference supera las comprobaciones y el starter no
      expect(await codeQuestionProblems(pyodide, question(id))).toEqual([]);
    });
  }
});

describe(
  'calentamiento: la referencia de cada reto pasa y su starter no',
  { timeout: 60_000 },
  () => {
    for (const step of minimos.warmup ?? []) {
      it(`${step.id}: la referencia pasa, el starter no y el ejemplo se ejecuta`, async () => {
        const ref = await runInPyodide(pyodide, step.task.reference, step.task.checks);
        // contract: reglas comunes de contenido (warmup.python.test.ts): la reference supera los checks del reto
        expect(ref.passed, describeRun(ref)).toBe(true);
        const start = await runInPyodide(pyodide, step.task.starter, step.task.checks);
        // contract: reglas comunes de contenido (warmup.python.test.ts): el starter no los supera
        expect(start.passed, describeRun(start)).toBe(false);
        const ex = await runInPyodide(pyodide, step.example, '');
        // contract: reglas comunes de contenido (warmup.python.test.ts): el ejemplo se ejecuta sin error
        expect(ex.error, describeRun(ex)).toBeNull();
      });
    }
  },
);

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

// ---------- ex02.1: la pérdida de todos los pesos a la vez ----------

accepts('minimos.ex02.1', [
  {
    name: 'con np.mean(axis=1) y .argmin()',
    append:
      'perdidas = np.mean((ws[:, None] * x - y) ** 2, axis=1)\nmejor_w = ws[perdidas.argmin()]\n',
  },
  {
    name: 'con un bucle y una lista, y un float',
    append:
      'perdidas = [np.mean((w * x - y) ** 2) for w in ws]\nmejor_w = float(ws[int(np.argmin(perdidas))])\n',
  },
  {
    name: 'con np.sum entre el número de datos y np.where',
    append:
      'perdidas = np.sum((ws[:, None] * x - y) ** 2, axis=1) / len(x)\nmejor_w = ws[np.where(perdidas == perdidas.min())[0][0]]\n',
  },
]);
rejects('minimos.ex02.1', [
  {
    name: 'la suma de los errores al cuadrado en vez de la media',
    append:
      'perdidas = ((ws[:, None] * x - y) ** 2).sum(axis=1)\nmejor_w = ws[np.argmin(perdidas)]\n',
    message: /está sumando los errores al cuadrado en vez de promediarlos/,
    failures: 1,
  },
  {
    name: 'los errores sin elevar al cuadrado',
    append:
      'perdidas = (ws[:, None] * x - y).mean(axis=1)\nmejor_w = ws[np.argmin(np.abs(perdidas))]\n',
    message: /no eleva los errores al cuadrado/,
  },
  {
    name: 'mejor_w es la posición del mejor peso',
    append: 'perdidas = ((ws[:, None] * x - y) ** 2).mean(axis=1)\nmejor_w = np.argmin(perdidas)\n',
    message: /vale 23: es la posición del mejor peso/,
    failures: 1,
  },
  {
    name: 'mejor_w es la menor pérdida',
    append: 'perdidas = ((ws[:, None] * x - y) ** 2).mean(axis=1)\nmejor_w = perdidas.min()\n',
    message: /es la menor pérdida, no el peso/,
    failures: 1,
  },
  {
    name: 'mejor_w es el peso de la mayor pérdida',
    append:
      'perdidas = ((ws[:, None] * x - y) ** 2).mean(axis=1)\nmejor_w = ws[np.argmax(perdidas)]\n',
    message: /no es el peso de menor pérdida/,
    failures: 1,
  },
  {
    name: 'perdidas promediada por columnas: 4 números en vez de 41',
    append: 'perdidas = ((ws[:, None] * x - y) ** 2).mean(axis=0)\nmejor_w = 2.3\n',
    message: /con 41 números: una pérdida por cada peso/,
  },
]);

// ---------- ex02.2: w_optimo(x, y) ----------

const WOPT = 'def w_optimo(x, y):\n';

accepts('minimos.ex02.2', [
  {
    name: 'con np.dot',
    append: `${WOPT}    return np.dot(x, y) / np.dot(x, x)\n`,
  },
  {
    name: 'con medias en vez de sumas',
    append: `${WOPT}    return np.mean(x * y) / np.mean(x ** 2)\n`,
  },
  {
    name: 'con una lambda y un producto escalar con @',
    append: 'w_optimo = lambda x, y: (x @ y) / (x @ x)\n',
  },
]);
rejects('minimos.ex02.2', [
  {
    name: 'sin función: se borra el nombre',
    append: 'del w_optimo\n',
    message: /Hay que definir una función `w_optimo`/,
    failures: 1,
  },
  {
    name: 'sin return: devuelve None',
    append: `${WOPT}    arriba = np.sum(x * y)\n    abajo = np.sum(x ** 2)\n`,
    message: /da un error con algún conjunto de datos, o devuelve `None`/,
    failures: 1,
  },
  {
    name: 'divide entre el cuadrado de la suma',
    append: `${WOPT}    return np.sum(x * y) / np.sum(x) ** 2\n`,
    message: /divide entre el cuadrado de la suma de las x/,
    failures: 1,
  },
  {
    name: 'suma de las y entre suma de las x',
    append: `${WOPT}    return np.sum(y) / np.sum(x)\n`,
    message: /suma de las y entre la suma de las x/,
    failures: 1,
  },
  {
    name: 'al revés: cuadrados entre productos',
    append: `${WOPT}    return np.sum(x ** 2) / np.sum(x * y)\n`,
    message: /está al revés/,
    failures: 1,
  },
  {
    name: 'devuelve una pareja',
    append: `${WOPT}    return (np.sum(x * y), np.sum(x ** 2))\n`,
    message: /tiene que devolver un solo número/,
    failures: 1,
  },
]);

// ---------- ex02.3: pendiente(w) y su valor en el mínimo ----------

const PEND = 'def pendiente(w):\n';

accepts('minimos.ex02.3', [
  {
    name: 'con la media escrita como suma entre len',
    append: `${PEND}    return np.sum(2 * x * (w * x - y)) / len(x)\nen_minimo = pendiente(w_star)\n`,
  },
  {
    name: 'con np.dot',
    append: `${PEND}    return 2 * np.dot(x, w * x - y) / len(x)\nen_minimo = pendiente(w_star)\n`,
  },
]);
rejects('minimos.ex02.3', [
  {
    name: 'sin función: se borra el nombre',
    append: 'del pendiente\n',
    message: /Hay que definir una función `pendiente`/,
  },
  {
    name: 'sin return: devuelve None',
    append: `${PEND}    errores = w * x - y\n`,
    message: /da un error con algún peso, o devuelve `None`/,
  },
  {
    name: 'falta el factor 2',
    append: `${PEND}    return np.mean(x * (w * x - y))\n`,
    message: /sale la mitad de lo que debe: falta el factor 2/,
  },
  {
    name: 'devuelve la pérdida',
    append: `${PEND}    return np.mean((w * x - y) ** 2)\n`,
    message: /está devolviendo la pérdida/,
  },
  {
    name: 'suma en vez de promediar',
    append: `${PEND}    return np.sum(2 * x * (w * x - y))\n`,
    message: /está sumando en vez de promediar/,
  },
  {
    name: 'no multiplica el error por su x',
    append: `${PEND}    return np.mean(2 * (w * x - y))\n`,
    message: /no multiplica cada error por su x/,
  },
]);
rejects('minimos.ex02.3', [
  {
    name: 'en_minimo es la pendiente en 0, no en w_star',
    append: `${PEND}    return np.mean(2 * x * (w * x - y))\nen_minimo = pendiente(0)\n`,
    message: /`en_minimo` tiene que ser casi 0/,
    failures: 1,
  },
  {
    name: 'en_minimo es una lista',
    append: `${PEND}    return np.mean(2 * x * (w * x - y))\nen_minimo = [0.0]\n`,
    message: /`en_minimo` tiene que ser un número/,
    failures: 1,
  },
]);

// ---------- ex02.4: el dato atípico ----------

accepts('minimos.ex02.4', [
  {
    name: 'con listas y np.array',
    append:
      'w_sin = w_optimo(x, y)\nw_con = w_optimo(np.array(list(x) + [x_nuevo]), np.array(list(y) + [y_nuevo]))\nsalto = w_con - w_sin\n',
  },
  {
    name: 'con np.concatenate y float',
    append:
      'w_sin = float(w_optimo(x, y))\nw_con = float(w_optimo(np.concatenate([x, [x_nuevo]]), np.concatenate([y, [y_nuevo]])))\nsalto = float(w_con - w_sin)\n',
  },
]);
rejects('minimos.ex02.4', [
  {
    name: 'w_con sin añadir el dato: igual que w_sin',
    append: 'w_sin = w_optimo(x, y)\nw_con = w_optimo(x, y)\nsalto = w_con - w_sin\n',
    message: /es igual a `w_sin`: no has añadido el dato nuevo/,
  },
  {
    name: 'w_con solo con el dato nuevo',
    append:
      'w_sin = w_optimo(x, y)\nw_con = w_optimo(np.array([x_nuevo]), np.array([y_nuevo]))\nsalto = w_con - w_sin\n',
    message: /es el peso de solo el dato nuevo/,
    failures: 1,
  },
  {
    name: 'salto al revés',
    append:
      'w_sin = w_optimo(x, y)\nw_con = w_optimo(np.append(x, x_nuevo), np.append(y, y_nuevo))\nsalto = w_sin - w_con\n',
    message: /`salto` tiene que ser `w_con` menos `w_sin`/,
    failures: 1,
  },
  {
    name: 'w_sin es el de los datos con el atípico',
    append:
      'w_sin = w_optimo(np.append(x, x_nuevo), np.append(y, y_nuevo))\nw_con = w_sin\nsalto = 0.0\n',
    message: /`w_sin` no es el peso óptimo de los datos de siempre/,
  },
  {
    name: 'salto es una lista',
    append:
      'w_sin = w_optimo(x, y)\nw_con = w_optimo(np.append(x, x_nuevo), np.append(y, y_nuevo))\nsalto = [1.0]\n',
    message: /`salto` tiene que ser un número/,
    failures: 1,
  },
]);

// ---------- ex02.5: los valles de la cuártica ----------

accepts('minimos.ex02.5', [
  {
    name: 'con np.logical_and y np.argmin sobre las alturas',
    append:
      'fx = f(xs)\nes_min = np.logical_and(fx[1:-1] < fx[:-2], fx[1:-1] < fx[2:])\nminimos = xs[1:-1][es_min]\nx_global = minimos[np.argmin(fx[1:-1][es_min])]\n',
  },
  {
    name: 'con np.where y float',
    append:
      'fx = f(xs)\nes_min = (fx[1:-1] < fx[:-2]) & (fx[1:-1] < fx[2:])\nminimos = xs[1:-1][np.where(es_min)[0]]\nx_global = float(min(minimos, key=f))\n',
  },
]);
rejects('minimos.ex02.5', [
  {
    name: 'solo compara con el vecino de la izquierda',
    append:
      'fx = f(xs)\nes_min = fx[1:-1] < fx[:-2]\nminimos = xs[1:-1][es_min]\nx_global = -2.0\n',
    message: /marca demasiados puntos/,
  },
  {
    name: 'busca la cima: más alto que los dos vecinos',
    append:
      'fx = f(xs)\nes_min = (fx[1:-1] > fx[:-2]) & (fx[1:-1] > fx[2:])\nminimos = xs[1:-1][es_min]\nx_global = 1.0\n',
    message: /marca la cima y no los valles/,
  },
  {
    name: 'x_global es la altura del valle',
    append:
      'fx = f(xs)\nes_min = (fx[1:-1] < fx[:-2]) & (fx[1:-1] < fx[2:])\nminimos = xs[1:-1][es_min]\nx_global = f(minimos).min()\n',
    message: /es la altura del valle, no su posición/,
    failures: 1,
  },
  {
    name: 'x_global es el valle local',
    append:
      'fx = f(xs)\nes_min = (fx[1:-1] < fx[:-2]) & (fx[1:-1] < fx[2:])\nminimos = xs[1:-1][es_min]\nx_global = minimos[np.argmax(f(minimos))]\n',
    message: /es el valle de la derecha, que es un mínimo local/,
    failures: 1,
  },
  {
    name: 'minimos con todos los puntos de xs',
    append:
      'fx = f(xs)\nes_min = (fx[1:-1] < fx[:-2]) & (fx[1:-1] < fx[2:])\nminimos = xs\nx_global = -2.0\n',
    message: /`minimos` no tiene los valores de `xs` donde hay un valle/,
    failures: 1,
  },
  {
    name: 'fx sin llamar a f con xs',
    append:
      'fx = f(1.0)\nes_min = (xs[1:-1] < 0) & (xs[1:-1] > -3)\nminimos = xs[1:-1][es_min]\nx_global = -2.0\n',
    message: /`fx` tiene que ser un array con la altura de `f`/,
  },
]);

// ---------- banco: la búsqueda en rejilla ----------

accepts('examen-0.minimos-rejilla', [
  {
    name: 'con un bucle y la mejor pérdida a mano',
    append:
      'mejor_w = ws[0]\nmejor = None\nfor w in ws:\n    p = np.mean((w * x - y) ** 2)\n    if mejor is None or p < mejor:\n        mejor, mejor_w = p, w\n',
  },
  {
    name: 'con broadcasting y argmin',
    append: 'mejor_w = ws[np.argmin(((ws[:, None] * x - y) ** 2).mean(axis=1))]\n',
  },
]);
rejects('examen-0.minimos-rejilla', [
  {
    name: 'mejor_w es la posición',
    append: 'mejor_w = np.argmin(((ws[:, None] * x - y) ** 2).mean(axis=1))\n',
    message: /vale 26: es la posición del mejor peso/,
    failures: 1,
  },
  {
    name: 'mejor_w es el peso de la mayor pérdida',
    append: 'mejor_w = ws[np.argmax(((ws[:, None] * x - y) ** 2).mean(axis=1))]\n',
    message: /no es el peso de `ws` con la menor pérdida/,
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
  'minimos.ex02.1': ['1', 'argmin'],
  'minimos.ex02.2': ['*', '**', 'abajo'],
  'minimos.ex02.3': ['y', 'errores', 'w_star'],
  'minimos.ex02.4': ['append', 'y_nuevo', 'w_sin'],
  'minimos.ex02.5': ['xs', '&', 'es_min', 'argmin'],
};

defineHintTests(projectCode, SKELETON_FILLS, () => pyodide);
