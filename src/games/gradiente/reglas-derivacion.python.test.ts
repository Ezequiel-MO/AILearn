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
import { reglasDerivacion } from './reglas-derivacion';
import { examen0ReglasDerivacion } from './examen-0-reglas-derivacion';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [
  ...projectQuestions(reglasDerivacion),
  ...examen0ReglasDerivacion.map((e) => e.question),
].filter((q): q is CodigoQ => q.type === 'codigo');
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'reglas-derivacion.ex02.1',
  'reglas-derivacion.ex02.2',
  'reglas-derivacion.ex02.3',
  'reglas-derivacion.ex02.4',
  'reglas-derivacion.ex02.5',
  'examen-0.derivada-en-codigo',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: brief B: ex02 son cinco preguntas de código y el banco fijo tiene una
    expect([...byId.keys()]).toEqual(IDS);
  });
  for (const id of IDS) {
    it(`${id}: la referencia pasa, el starter no y hay check(`, async () => {
      // contract: reglas comunes de contenido: reference pasa, starter no, hay check(
      expect(await codeQuestionProblems(pyodide, question(id))).toEqual([]);
      const start = await runInPyodide(pyodide, question(id).starter, question(id).checks);
      // contract: reglas comunes de contenido: el starter se ejecuta sin error de Python
      expect(start.error, describeRun(start)).toBeNull();
    });
  }
});

describe(
  'calentamiento: la referencia de cada reto pasa y su starter no',
  { timeout: 60_000 },
  () => {
    for (const step of reglasDerivacion.warmup ?? []) {
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
        expect(ex.stdout, describeRun(ex)).not.toBe('');
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
const rejects = (id: string, variants: (Variant & { message: RegExp })[]): void => {
  describe(`${id}: errores típicos`, { timeout: 60_000 }, () => {
    for (const v of variants) {
      it(v.name, async () => {
        const r = await runInPyodide(pyodide, code(question(id), v), question(id).checks);
        // contract: riesgo del plan: un error típico no pasa y recibe un mensaje que orienta
        expect(r.passed, describeRun(r)).toBe(false);
        const failed = (r.checks ?? []).filter((c) => !c.passed).map((c) => c.message);
        // contract: review-18r m2: ningún error típico saca un texto de error de NumPy o de Python en inglés
        expect(r.error, describeRun(r)).toBeNull();
        expect(failed.join(' | '), describeRun(r)).not.toMatch(NUMPY_ENGLISH);
        expect(failed.join(' | '), describeRun(r)).toMatch(v.message);
      });
    }
  });
};

// ---------- ex02.1: evaluar ----------

accepts('reglas-derivacion.ex02.1', [
  {
    name: 'con np.polyval y la vuelta',
    append: '\ndef evaluar(coefs, x):\n    return np.polyval(coefs[::-1], x)\n',
  },
  {
    name: 'con un bucle',
    append:
      '\ndef evaluar(coefs, x):\n    total = 0\n    for k in range(len(coefs)):\n        total += coefs[k] * x ** k\n    return total\n',
  },
]);

rejects('reglas-derivacion.ex02.1', [
  {
    name: 'exponentes desde 1: sale multiplicado por x',
    append:
      '\ndef evaluar(coefs, x):\n    return np.sum(coefs * x ** np.arange(1, len(coefs) + 1))\n',
    message: /multiplicado por `x`/,
  },
  {
    name: 'coeficientes al revés (np.polyval directo)',
    append: '\ndef evaluar(coefs, x):\n    return np.polyval(coefs, x)\n',
    message: /al revés/,
  },
  {
    name: 'suma los coeficientes sin potencias',
    append: '\ndef evaluar(coefs, x):\n    return np.sum(coefs)\n',
    message: /no da el valor del polinomio/,
  },
]);

// ---------- ex02.2: derivar ----------

accepts('reglas-derivacion.ex02.2', [
  {
    name: 'con np.polyder y la vuelta',
    append: '\ndef derivar(coefs):\n    return np.polyder(coefs[::-1])[::-1]\n',
  },
  {
    name: 'con una lista por comprensión',
    append:
      '\ndef derivar(coefs):\n    return np.array([k * coefs[k] for k in range(1, len(coefs))])\n',
  },
]);

rejects('reglas-derivacion.ex02.2', [
  {
    name: 'sin quitar el término independiente',
    append: '\ndef derivar(coefs):\n    return coefs * np.arange(len(coefs))\n',
    message: /deja un 0 delante/,
  },
  {
    name: 'exponentes mal puestos (de 0)',
    append: '\ndef derivar(coefs):\n    return coefs[1:] * np.arange(len(coefs) - 1)\n',
    message: /no multiplica bien cada coeficiente/,
  },
  {
    name: 'devuelve la entrada',
    append: '\ndef derivar(coefs):\n    return coefs\n',
    message: /un coeficiente menos/,
  },
]);

// ---------- ex02.3: np.polyder y el orden ----------

accepts('reglas-derivacion.ex02.3', [
  {
    name: 'con np.polynomial, que ya va en nuestro orden',
    append: '\nc_np = c[::-1]\nd_np = np.polynomial.polynomial.polyder(c)\n',
  },
  {
    name: 'con np.flip',
    append: '\nc_np = np.flip(c)\nd_np = np.flip(np.polyder(c_np))\n',
  },
]);

rejects('reglas-derivacion.ex02.3', [
  {
    name: 'polyder sin dar la vuelta a la entrada',
    append: '\nc_np = c[::-1]\nd_np = np.polyder(c)\n',
    message: /sin darle la vuelta/,
  },
  {
    name: 'no da la vuelta a la salida',
    append: '\nc_np = c[::-1]\nd_np = np.polyder(c_np)\n',
    message: /de mayor a menor grado/,
  },
  {
    name: 'c_np sin dar la vuelta',
    append: '\nc_np = c\nd_np = np.polyder(c_np[::-1])[::-1]\n',
    message: /`c_np` tiene que ser `c` dado la vuelta/,
  },
]);

// ---------- ex02.4: el gradiente de un modelo de un peso ----------

accepts('reglas-derivacion.ex02.4', [
  {
    name: 'con la derivada escrita término a término y np.sum / n',
    append: '\nerrores = x * w - y\ngrad = np.sum(2 * x * errores) / len(x)\n',
  },
  {
    name: 'con un producto escalar',
    append: '\nerrores = w * x - y\ngrad = 2 * (x @ errores) / len(x)\n',
  },
]);

rejects('reglas-derivacion.ex02.4', [
  {
    name: 'la pérdida en vez de su derivada',
    append: '\nerrores = w * x - y\ngrad = np.mean(errores ** 2)\n',
    message: /es la pérdida/,
  },
  {
    name: 'signo cambiado',
    append: '\nerrores = w * x - y\ngrad = -np.mean(2 * x * errores)\n',
    message: /signo cambiado/,
  },
  {
    name: 'suma en vez de media',
    append: '\nerrores = w * x - y\ngrad = np.sum(2 * x * errores)\n',
    message: /suma de los términos/,
  },
  {
    name: 'sin el factor x',
    append: '\nerrores = w * x - y\ngrad = np.mean(2 * errores)\n',
    message: /a medias/,
  },
  {
    name: 'errores al revés (y - w x)',
    append: '\nerrores = y - w * x\ngrad = np.mean(2 * x * errores)\n',
    message: /no son `w \* x - y`/,
  },
]);

// ---------- ex02.5: la fórmula frente a la derivada numérica ----------

accepts('reglas-derivacion.ex02.5', [
  {
    name: 'con difusión en vez de lista por comprensión',
    append:
      '\nexactas = np.mean(2 * x * (ws[:, None] * x - y), axis=1)\nerror_max = np.abs(exactas - numericas).max()\n',
  },
]);

rejects('reglas-derivacion.ex02.5', [
  {
    name: 'signo cambiado',
    append:
      '\nexactas = np.array([np.mean(2 * x * (y - w * x)) for w in ws])\nerror_max = np.max(np.abs(exactas - numericas))\n',
    message: /signo cambiado/,
  },
  {
    name: 'sin el factor x',
    append:
      '\nexactas = np.array([np.mean(2 * (w * x - y)) for w in ws])\nerror_max = np.max(np.abs(exactas - numericas))\n',
    message: /no es la media/,
  },
  {
    name: 'error_max sin comparar de verdad (vale 5)',
    append: '\nexactas = np.array([np.mean(2 * x * (w * x - y)) for w in ws])\nerror_max = 5\n',
    message: /casi 0/,
  },
  // contract: hallazgo 2 de la revisión de la Órbita 0 (2026-11-05): las diferencias son de 1e-13 a
  // 3e-12, así que cualquier número casi cero aprobaba
  {
    name: 'error_max a 0, sin comparar',
    append: '\nexactas = np.array([np.mean(2 * x * (w * x - y)) for w in ws])\nerror_max = 0\n',
    message: /no es la mayor de las distancias/,
  },
  {
    name: 'error_max con signo (sin np.abs)',
    append:
      '\nexactas = np.array([np.mean(2 * x * (w * x - y)) for w in ws])\nerror_max = np.max(exactas - numericas)\n',
    message: /conserva el signo/,
  },
  {
    name: 'error_max es la menor distancia',
    append:
      '\nexactas = np.array([np.mean(2 * x * (w * x - y)) for w in ws])\nerror_max = np.min(np.abs(exactas - numericas))\n',
    message: /la menor de las distancias/,
  },
  {
    name: 'error_max es la media de las distancias',
    append:
      '\nexactas = np.array([np.mean(2 * x * (w * x - y)) for w in ws])\nerror_max = np.mean(np.abs(exactas - numericas))\n',
    message: /o su media/,
  },
]);

// ---------- banco: derivada_en ----------

accepts('examen-0.derivada-en-codigo', [
  {
    name: 'con np.polyder y np.polyval',
    append: '\ndef derivada_en(coefs, x0):\n    return np.polyval(np.polyder(coefs[::-1]), x0)\n',
  },
]);

rejects('examen-0.derivada-en-codigo', [
  {
    name: 'evalúa el polinomio, no su derivada',
    append:
      '\ndef derivada_en(coefs, x0):\n    return np.sum(coefs * x0 ** np.arange(len(coefs)))\n',
    message: /no el de su derivada/,
  },
  {
    name: 'devuelve la derivada sin evaluarla (un array)',
    append: '\ndef derivada_en(coefs, x0):\n    return coefs[1:] * np.arange(1, len(coefs))\n',
    message: /un número/,
  },
]);

// ---------- pistas de las preguntas de código del ejercicio Programar ----------

// Lo que va en cada `___` del esqueleto de la última pista, en orden.
const SKELETON_FILLS: Record<string, string[]> = {
  'reglas-derivacion.ex02.1': ['arange', 'sum', '**'],
  'reglas-derivacion.ex02.2': ['1', '1'],
  'reglas-derivacion.ex02.3': ['::-1', '::-1'],
  'reglas-derivacion.ex02.4': ['-', 'mean'],
  'reglas-derivacion.ex02.5': ['ws', 'max', 'numericas'],
};

defineHintTests(
  projectQuestions(reglasDerivacion).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

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
