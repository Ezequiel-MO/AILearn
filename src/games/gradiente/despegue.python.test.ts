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
import { launch } from './despegue';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const byId = new Map(launch.filter((q): q is CodigoQ => q.type === 'codigo').map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay dos preguntas de código: despegue.7 y 8', () => {
    // contract: encargo del despegue del juego 3: las preguntas 7 y 8 son de código
    expect([...byId.keys()]).toEqual(['despegue.7', 'despegue.8']);
  });
  for (const id of ['despegue.7', 'despegue.8']) {
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

// ---------- despegue.7: pendiente(p, q) ----------

const PEND = 'def pendiente(p, q):\n';

accepts('despegue.7', [
  {
    name: 'desempaquetando los dos puntos',
    append: `${PEND}    x1, y1 = p\n    x2, y2 = q\n    return (y2 - y1) / (x2 - x1)\n`,
  },
  {
    name: 'restando p a q en las dos, al revés que la referencia',
    append: `${PEND}    return (p[1] - q[1]) / (p[0] - q[0])\n`,
  },
  {
    name: 'con subida y avance en variables y float',
    append: `${PEND}    subida = q[1] - p[1]\n    avance = q[0] - p[0]\n    return float(subida / avance)\n`,
  },
  {
    name: 'con np.diff',
    append: `${PEND}    return np.diff([p[1], q[1]])[0] / np.diff([p[0], q[0]])[0]\n`,
  },
  {
    name: 'con una función lambda',
    append: 'pendiente = lambda p, q: (q[1] - p[1]) / (q[0] - p[0])\n',
  },
]);
rejects('despegue.7', [
  {
    name: 'sin función: se borra el nombre',
    append: 'del pendiente\n',
    message: /Hay que definir una función `pendiente`/,
    failures: 1,
  },
  {
    name: 'sin return: devuelve None',
    append: `${PEND}    subida = q[1] - p[1]\n    avance = q[0] - p[0]\n`,
    message: /da un error con alguna pareja de puntos, o devuelve `None`/,
    failures: 1,
  },
  {
    name: 'el avance entre la subida, al revés',
    append: `${PEND}    return (q[0] - p[0]) / (q[1] - p[1])\n`,
    message: /está al revés: has dividido el avance entre la subida/,
    failures: 1,
  },
  {
    name: 'el signo cambiado por restar en órdenes distintos',
    append: `${PEND}    return (q[1] - p[1]) / (p[0] - q[0])\n`,
    message: /sale con el signo cambiado/,
    failures: 1,
  },
  {
    name: 'devuelve la subida y el avance sin dividir',
    append: `${PEND}    return (q[1] - p[1], q[0] - p[0])\n`,
    message: /tiene que devolver un número/,
    failures: 1,
  },
  {
    name: 'devuelve solo la subida',
    append: `${PEND}    return q[1] - p[1]\n`,
    message: /no da la subida entre el avance/,
    failures: 1,
  },
]);

// ---------- despegue.8: la pérdida de cada w y el mejor ----------

accepts('despegue.8', [
  {
    name: 'sin bucle, con broadcasting y .argmin()',
    append:
      'perdidas = ((ws[:, None] * x - y) ** 2).mean(axis=1)\nmejor_w = ws[perdidas.argmin()]\n',
  },
  {
    name: 'una lista de Python y .index(min(...))',
    append:
      'perdidas = [np.mean((w * x - y) ** 2) for w in ws]\nmejor_w = ws[perdidas.index(min(perdidas))]\n',
  },
  {
    name: 'con np.square, sum y len, y un float de Python',
    append:
      'perdidas = np.array([np.sum(np.square(w * x - y)) / len(x) for w in ws])\nmejor_w = float(ws[np.argmin(perdidas)])\n',
  },
  {
    name: 'con un bucle for y np.where',
    append:
      'perdidas = np.zeros(len(ws))\nfor i, w in enumerate(ws):\n    perdidas[i] = ((w * x - y) ** 2).mean()\nmejor_w = ws[np.where(perdidas == perdidas.min())[0][0]]\n',
  },
]);
rejects('despegue.8', [
  {
    name: 'la suma de los errores al cuadrado en vez de la media',
    append:
      'perdidas = np.array([np.sum((w * x - y) ** 2) for w in ws])\nmejor_w = ws[np.argmin(perdidas)]\n',
    message: /está sumando los errores al cuadrado en vez de promediarlos/,
    failures: 1,
  },
  {
    name: 'los errores sin elevar al cuadrado',
    append:
      'perdidas = np.array([np.mean(w * x - y) for w in ws])\nmejor_w = ws[np.argmin(perdidas)]\n',
    message: /no eleva los errores al cuadrado/,
  },
  {
    name: 'mejor_w es la posición del mejor peso',
    append:
      'perdidas = np.array([np.mean((w * x - y) ** 2) for w in ws])\nmejor_w = np.argmin(perdidas)\n',
    message: /vale 3: es la posición del mejor peso/,
    failures: 1,
  },
  {
    name: 'mejor_w es la menor pérdida',
    append:
      'perdidas = np.array([np.mean((w * x - y) ** 2) for w in ws])\nmejor_w = perdidas.min()\n',
    message: /es la menor pérdida, no el peso/,
    failures: 1,
  },
  {
    name: 'mejor_w es el peso de la mayor pérdida',
    append:
      'perdidas = np.array([np.mean((w * x - y) ** 2) for w in ws])\nmejor_w = ws[np.argmax(perdidas)]\n',
    message: /es un peso de `ws`, pero no el de menor pérdida/,
    failures: 1,
  },
  {
    name: 'perdidas con solo dos números',
    append: 'perdidas = np.array([1.0, 2.0])\nmejor_w = 1.5\n',
    message: /con 7 números: una pérdida por cada peso/,
  },
  {
    name: 'mejor_w es una lista',
    append: 'perdidas = np.array([np.mean((w * x - y) ** 2) for w in ws])\nmejor_w = [1.5]\n',
    message: /`mejor_w` tiene que ser un número/,
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
  'despegue.7': ['1', '1', '0', '0', 'avance'],
  'despegue.8': ['**', 'argmin'],
};

defineHintTests([...byId.values()], SKELETON_FILLS, () => pyodide);
