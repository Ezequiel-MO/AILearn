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
import { derivadaPendiente } from './derivada-pendiente';
import { examen0DerivadaPendiente } from './examen-0-derivada-pendiente';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [
  ...projectQuestions(derivadaPendiente),
  ...examen0DerivadaPendiente.map((e) => e.question),
].filter((q): q is CodigoQ => q.type === 'codigo');
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'derivada-pendiente.ex02.1',
  'derivada-pendiente.ex02.2',
  'derivada-pendiente.ex02.3',
  'derivada-pendiente.ex02.4',
  'derivada-pendiente.ex02.5',
  'examen-0.derivada-numerica',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: brief-orbita-0.md, A: ex02 son cinco preguntas de código y el banco fijo tiene una
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
    for (const step of derivadaPendiente.warmup ?? []) {
      it(`${step.id}: la referencia pasa y el starter no`, async () => {
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

// ---------- pistas de las preguntas de código del proyecto ----------

// Lo que va en cada `___` del esqueleto de la última pista, en orden.
const SKELETON_FILLS: Record<string, string[]> = {
  'derivada-pendiente.ex02.1': ['b', 'a', 'avance'],
  'derivada-pendiente.ex02.2': ['h', 'x', 'h'],
  'derivada-pendiente.ex02.3': ['hs', '2', 'delante', 'exacta'],
  'derivada-pendiente.ex02.4': ['h', 'h', 'x', 'exacta'],
  'derivada-pendiente.ex02.5': ['h', 'h', 'x0'],
  'examen-0.derivada-numerica': ['h', 'h', '2'],
};

defineHintTests(all, SKELETON_FILLS, () => pyodide);

// ---------- ex02.1: pendiente_secante(f, a, b) ----------

accepts('derivada-pendiente.ex02.1', [
  {
    name: 'con variables sueltas',
    append:
      'def pendiente_secante(f, a, b):\n    fa = f(a)\n    fb = f(b)\n    return (fb - fa) / (b - a)\n',
  },
  {
    name: 'restando al revés en los dos (el signo se compensa)',
    append: 'def pendiente_secante(f, a, b):\n    return (f(a) - f(b)) / (a - b)\n',
  },
]);
rejects('derivada-pendiente.ex02.1', [
  {
    name: 'devuelve solo la subida',
    append: 'def pendiente_secante(f, a, b):\n    return f(b) - f(a)\n',
    message: /devuelve solo la subida/,
    failures: 1,
  },
  {
    name: 'avance entre subida',
    append: 'def pendiente_secante(f, a, b):\n    return (b - a) / (f(b) - f(a))\n',
    message: /al revés/,
  },
  {
    name: 'signo cambiado: el avance en el otro orden',
    append: 'def pendiente_secante(f, a, b):\n    return (f(b) - f(a)) / (a - b)\n',
    message: /signo cambiado/,
    failures: 1,
  },
  {
    name: 'divide entre b y no entre el avance',
    append: 'def pendiente_secante(f, a, b):\n    return (f(b) - f(a)) / b\n',
    message: /no da la subida entre el avance/,
    failures: 1,
  },
]);

// ---------- ex02.2: derivada(f, x, h) hacia delante ----------

accepts('derivada-pendiente.ex02.2', [
  {
    name: 'con una variable para el cambio',
    append: 'def derivada(f, x, h):\n    cambio = f(x + h) - f(x)\n    return cambio / h\n',
  },
  {
    name: 'dividiendo cada término por separado',
    append: 'def derivada(f, x, h):\n    return f(x + h) / h - f(x) / h\n',
  },
]);
rejects('derivada-pendiente.ex02.2', [
  {
    name: 'la centrada',
    append: 'def derivada(f, x, h):\n    return (f(x + h) - f(x - h)) / (2 * h)\n',
    message: /secante centrada/,
    failures: 1,
  },
  {
    name: 'hacia atrás',
    append: 'def derivada(f, x, h):\n    return (f(x) - f(x - h)) / h\n',
    message: /hacia atrás/,
    failures: 1,
  },
  {
    name: 'sin dividir entre h',
    append: 'def derivada(f, x, h):\n    return f(x + h) - f(x)\n',
    message: /Falta dividir entre el paso/,
    failures: 1,
  },
  {
    name: 'divide entre x',
    append: 'def derivada(f, x, h):\n    return (f(x + h) - f(x)) / (x + 1e-300)\n',
    message: /divide entre `x`/,
  },
]);

// ---------- ex02.3: centrada y errores con arrays ----------

accepts('derivada-pendiente.ex02.3', [
  {
    name: 'con el error escrito como raíz del cuadrado',
    append:
      'centrada = (f(x0 + hs) - f(x0 - hs)) / (2 * hs)\nerr_delante = np.sqrt((delante - exacta) ** 2)\nerr_centrada = np.sqrt((centrada - exacta) ** 2)\n',
  },
  {
    name: 'con variables intermedias y la resta en el otro orden bajo np.abs',
    append:
      'arriba = f(x0 + hs)\nabajo = f(x0 - hs)\ncentrada = (arriba - abajo) / (2 * hs)\nerr_delante = np.abs(exacta - delante)\nerr_centrada = np.abs(exacta - centrada)\n',
  },
]);
rejects('derivada-pendiente.ex02.3', [
  {
    name: 'centrada sin el 2 del denominador',
    append:
      'centrada = (f(x0 + hs) - f(x0 - hs)) / hs\nerr_delante = np.abs(delante - exacta)\nerr_centrada = np.abs(centrada - exacta)\n',
    message: /el doble de grande/,
  },
  {
    name: 'err_delante sin valor absoluto, restando al revés',
    append:
      'centrada = (f(x0 + hs) - f(x0 - hs)) / (2 * hs)\nerr_delante = exacta - delante\nerr_centrada = np.abs(centrada - exacta)\n',
    message: /`err_delante` sale negativo/,
    failures: 1,
  },
  {
    name: 'err_centrada sin valor absoluto, restando al revés',
    append:
      'centrada = (f(x0 + hs) - f(x0 - hs)) / (2 * hs)\nerr_delante = np.abs(delante - exacta)\nerr_centrada = exacta - centrada\n',
    message: /`err_centrada` sale negativo/,
    failures: 1,
  },
  {
    name: 'err_centrada calculado con delante',
    append:
      'centrada = (f(x0 + hs) - f(x0 - hs)) / (2 * hs)\nerr_delante = np.abs(delante - exacta)\nerr_centrada = np.abs(delante - exacta)\n',
    message: /es el error de la estimación hacia delante/,
    failures: 1,
  },
]);

// ---------- ex02.4: comprobación de gradiente ----------

accepts('derivada-pendiente.ex02.4', [
  {
    name: 'con .mean(), un paso intermedio y una comparación con abs',
    append:
      'numerica = (perdida(w + h) - perdida(w - h)) / (2 * h)\nerrores = w * x - y\nexacta = (2 * x * errores).mean()\ncoincide = abs(numerica - exacta) < 1e-6\n',
  },
  {
    name: 'con np.sum entre el número de datos',
    append:
      'arriba = perdida(w + h)\nabajo = perdida(w - h)\nnumerica = (arriba - abajo) / (2 * h)\nexacta = np.sum(2 * x * (w * x - y)) / len(x)\ncoincide = bool(np.isclose(numerica, exacta))\n',
  },
]);
rejects('derivada-pendiente.ex02.4', [
  {
    name: 'numerica dividida entre h en vez de 2h',
    append:
      'numerica = (perdida(w + h) - perdida(w - h)) / h\nexacta = np.mean(2 * x * (w * x - y))\ncoincide = bool(np.isclose(numerica, exacta))\n',
    message: /`numerica` no es la derivada/,
  },
  {
    name: 'exacta sin el factor x',
    append:
      'numerica = (perdida(w + h) - perdida(w - h)) / (2 * h)\nexacta = np.mean(2 * (w * x - y))\ncoincide = bool(np.isclose(numerica, exacta))\n',
    message: /no lleva el factor `x`/,
    failures: 1,
  },
  {
    name: 'exacta sin el 2',
    append:
      'numerica = (perdida(w + h) - perdida(w - h)) / (2 * h)\nexacta = np.mean(x * (w * x - y))\ncoincide = bool(np.isclose(numerica, exacta))\n',
    message: /falta el `2`/,
    failures: 1,
  },
  {
    name: 'exacta es un array, sin la media',
    append:
      'numerica = (perdida(w + h) - perdida(w - h)) / (2 * h)\nexacta = 2 * x * (w * x - y)\ncoincide = False\n',
    message: /`exacta` tiene que ser un solo número/,
  },
  {
    name: 'coincide escrito a mano, sin comparar',
    append:
      'numerica = (perdida(w + h) - perdida(w - h)) / (2 * h)\nexacta = np.mean(2 * x * (w * x - y))\ncoincide = False\n',
    message: /`coincide` no refleja la comparación/,
    failures: 1,
  },
]);

// ---------- ex02.5: la tangente en un punto ----------

accepts('derivada-pendiente.ex02.5', [
  {
    name: 'm con la diferencia hacia delante y b a partir de ella',
    append: 'm = (f(x0 + h) - f(x0)) / h\nb = f(x0) - m * x0\n',
  },
  {
    name: 'b despejando de la recta con un paso intermedio',
    append: 'm = (f(x0 + h) - f(x0 - h)) / (2 * h)\naltura = f(x0)\nb = altura - m * x0\n',
  },
]);
rejects('derivada-pendiente.ex02.5', [
  {
    name: 'm sin el 2 del denominador',
    append: 'm = (f(x0 + h) - f(x0 - h)) / h\nb = f(x0) - 2.0 * x0\n',
    message: /`m` no es la pendiente/,
    failures: 1,
  },
  {
    name: 'b es solo la altura en x0',
    append: 'm = (f(x0 + h) - f(x0 - h)) / (2 * h)\nb = f(x0)\n',
    message: /Falta restar lo que sube la tangente/,
    failures: 1,
  },
  {
    name: 'b con el signo cambiado',
    append: 'm = (f(x0 + h) - f(x0 - h)) / (2 * h)\nb = m * x0 - f(x0)\n',
    message: /signo cambiado/,
    failures: 1,
  },
  {
    name: 'b resta m en vez de m por x0',
    append: 'm = (f(x0 + h) - f(x0 - h)) / (2 * h)\nb = f(x0) - m\n',
    message: /resta `m` y no `m \* x0`/,
    failures: 1,
  },
]);

// ---------- banco: derivada_centrada(f, x) ----------

accepts('examen-0.derivada-numerica', [
  {
    name: 'con h como parámetro con valor por defecto',
    append: 'def derivada_centrada(f, x, h=0.0001):\n    return (f(x + h) - f(x - h)) / (2 * h)\n',
  },
  {
    name: 'con un paso más pequeño y variables sueltas',
    append:
      'def derivada_centrada(f, x):\n    h = 1e-5\n    derecha = f(x + h)\n    izquierda = f(x - h)\n    return (derecha - izquierda) / (2 * h)\n',
  },
]);
rejects('examen-0.derivada-numerica', [
  {
    name: 'dividida entre h en vez de 2h',
    append: 'def derivada_centrada(f, x):\n    h = 0.0001\n    return (f(x + h) - f(x - h)) / h\n',
    message: /sale el doble/,
    failures: 1,
  },
  {
    name: 'la de hacia delante',
    append: 'def derivada_centrada(f, x):\n    h = 0.0001\n    return (f(x + h) - f(x)) / h\n',
    message: /de hacia delante/,
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
