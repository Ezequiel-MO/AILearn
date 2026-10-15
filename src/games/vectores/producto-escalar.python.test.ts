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
import { examen1ProductoEscalar } from './examen-1-producto-escalar';
import { productoEscalar } from './producto-escalar';

// El proyecto no está en el registro del juego hasta el cableado de la Órbita 1, así que
// tests/content/python.test.ts todavía no lo recorre: aquí se comprueban sus cinco preguntas de código
// y la de código de su banco (la referencia pasa, el `starter` no), las soluciones correctas distintas
// de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const banco = examen1ProductoEscalar.flatMap((e) =>
  e.question.type === 'codigo' ? [e.question] : [],
);
const byId = new Map(
  [...projectQuestions(productoEscalar), ...banco]
    .filter((q): q is CodigoQ => q.type === 'codigo')
    .map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [...[1, 2, 3, 4, 5].map((n) => `producto-escalar.ex02.${n}`), 'examen-1.signo-agudo'];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código del proyecto y una del banco', () => {
    // contract: encargo de la Órbita 1: ex02 son cinco preguntas de código; el banco tiene una de código
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

// ---------- ex02.1: p = a · b (12) ----------

accepts('producto-escalar.ex02.1', [
  { name: 'operador @', append: 'p = a @ b\n' },
  { name: 'al revés, b @ a', append: 'p = b @ a\n' },
  { name: 'suma de productos', append: 'p = np.sum(a * b)\n' },
  { name: 'método sum', append: 'p = (a * b).sum()\n' },
  { name: 'sum de Python', append: 'p = sum(a * b)\n' },
  { name: 'np.inner', append: 'p = np.inner(a, b)\n' },
  { name: 'np.vdot', append: 'p = np.vdot(a, b)\n' },
  { name: 'componente a componente', append: 'p = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]\n' },
  { name: 'decimal', append: 'p = float(np.dot(a, b))\n' },
  { name: 'np.einsum', append: 'p = np.einsum("i,i", a, b)\n' },
]);
rejects('producto-escalar.ex02.1', [
  {
    // contract: encargo de la Órbita 1 y hoja 1 (`a * b` es el producto elemento a elemento, no el escalar)
    name: 'a * b: el producto elemento a elemento',
    append: 'p = a * b\n',
    message: /componente a componente.*suma/,
    failures: 1,
  },
  { name: 'suma de vectores', append: 'p = a + b\n', message: /3 componentes/, failures: 1 },
  {
    name: 'producto de las sumas',
    append: 'p = np.sum(a) * np.sum(b)\n',
    message: /tiene que valer 12/,
    failures: 1,
  },
  { name: 'a con a', append: 'p = a @ a\n', message: /tiene que valer 12/, failures: 1 },
  { name: 'una lista de Python', append: 'p = [4, -10, 18]\n', message: /único número/ },
  { name: 'cadena', append: 'p = "12"\n', message: /único número/ },
]);

// ---------- ex02.2: producto(a, b) sin np.dot ----------

accepts('producto-escalar.ex02.2', [
  {
    name: 'bucle con índices',
    append:
      'def producto(a, b):\n    total = 0\n    for i in range(len(a)):\n        total = total + a[i] * b[i]\n    return total\n',
  },
  {
    name: 'sum de un generador',
    append: 'def producto(a, b):\n    return sum(x * y for x, y in zip(a, b))\n',
  },
  {
    name: 'lista por comprensión',
    append:
      'def producto(a, b):\n    productos = [x * y for x, y in zip(a, b)]\n    return sum(productos)\n',
  },
  {
    name: 'bucle while',
    append:
      'def producto(a, b):\n    total = 0\n    i = 0\n    while i < len(a):\n        total += a[i] * b[i]\n        i += 1\n    return total\n',
  },
  { name: 'con NumPy, sin np.dot', append: 'def producto(a, b):\n    return np.sum(a * b)\n' },
  {
    name: 'decimal',
    append: 'def producto(a, b):\n    return float(sum(x * y for x, y in zip(a, b)))\n',
  },
]);
rejects('producto-escalar.ex02.2', [
  {
    name: 'devuelve a * b: un array',
    append: 'def producto(a, b):\n    return a * b\n',
    message: /único número/,
    failures: 1,
  },
  {
    name: 'return dentro del bucle',
    append:
      'def producto(a, b):\n    total = 0\n    for x, y in zip(a, b):\n        total += x * y\n        return total\n',
    message: /tiene que dar 11/,
    failures: 1,
  },
  {
    name: 'solo vale con 2 componentes',
    append: 'def producto(a, b):\n    return a[0] * b[0] + a[1] * b[1]\n',
    message: /3 componentes/,
    failures: 1,
  },
  {
    name: 'solo vale con 3 componentes',
    append: 'def producto(a, b):\n    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]\n',
    message: /tiene que dar 11/,
  },
  {
    name: 'producto de las sumas',
    append: 'def producto(a, b):\n    return sum(a) * sum(b)\n',
    message: /tiene que dar 11/,
  },
  {
    name: 'solo las tres primeras componentes',
    append:
      'def producto(a, b):\n    total = 0\n    for i in range(min(len(a), 3)):\n        total += a[i] * b[i]\n    return total\n',
    message: /con 1 o con 5/,
    failures: 1,
  },
  {
    name: 'no devuelve nada (print)',
    append: 'def producto(a, b):\n    print(sum(x * y for x, y in zip(a, b)))\n',
    message: /con `return`/,
    failures: 1,
  },
]);

// ---------- ex02.3: ortogonales(a, b) con tolerancia ----------

accepts('producto-escalar.ex02.3', [
  {
    name: 'np.isclose sin bool',
    append: 'def ortogonales(a, b):\n    return np.isclose(a @ b, 0)\n',
  },
  {
    name: 'valor absoluto y umbral',
    append: 'def ortogonales(a, b):\n    return abs(np.dot(a, b)) < 1e-9\n',
  },
  {
    name: 'np.allclose',
    append: 'def ortogonales(a, b):\n    return np.allclose(np.dot(a, b), 0)\n',
  },
  {
    name: 'if con True y False',
    append:
      'def ortogonales(a, b):\n    if np.isclose(np.sum(a * b), 0, atol=1e-10):\n        return True\n    return False\n',
  },
  {
    name: 'suma a mano',
    append:
      'def ortogonales(a, b):\n    d = sum(x * y for x, y in zip(a, b))\n    return abs(d) < 1e-12\n',
  },
]);
rejects('producto-escalar.ex02.3', [
  {
    // contract: encargo de la Órbita 1 (comprobar ortogonalidad con tolerancia): `== 0` falla con decimales
    name: 'igualdad exacta con 0',
    append: 'def ortogonales(a, b):\n    return a @ b == 0\n',
    message: /tolerancia.*np\.isclose/,
    failures: 1,
  },
  {
    name: 'devuelve el producto escalar, no True o False',
    append: 'def ortogonales(a, b):\n    return a @ b\n',
    message: /`True` o `False`/,
    failures: 1,
  },
  {
    name: 'tolerancia demasiado grande',
    append: 'def ortogonales(a, b):\n    return abs(a @ b) < 0.1\n',
    message: /muy pequeño/,
    failures: 1,
  },
  {
    name: 'siempre True',
    append: 'def ortogonales(a, b):\n    return True\n',
    message: /no son ortogonales/,
  },
  {
    name: 'siempre False',
    append: 'def ortogonales(a, b):\n    return False\n',
    message: /tiene que dar `True`/,
  },
]);

// ---------- ex02.4: v · v = ‖v‖² ----------

accepts('producto-escalar.ex02.4', [
  {
    name: 'np.dot y np.linalg.norm',
    append: 'cuadrado = np.dot(v, v)\nnorma = np.linalg.norm(v)\n',
  },
  { name: 'suma de cuadrados', append: 'cuadrado = np.sum(v ** 2)\nnorma = cuadrado ** 0.5\n' },
  {
    name: 'suma de productos',
    append: 'cuadrado = np.sum(v * v)\nnorma = np.sqrt(np.sum(v * v))\n',
  },
  { name: 'a mano', append: 'cuadrado = 169\nnorma = 13\n' },
]);
rejects('producto-escalar.ex02.4', [
  {
    name: 'cuadrado de cada componente sin sumar',
    append: 'cuadrado = v * v\nnorma = np.sqrt(v @ v)\n',
    message: /falta sumarlos/,
    failures: 1,
  },
  {
    name: 'norma sin raíz',
    append: 'cuadrado = v @ v\nnorma = cuadrado\n',
    message: /falta la raíz cuadrada/,
    failures: 1,
  },
  {
    name: 'cuadrado de la suma',
    append: 'cuadrado = np.sum(v) ** 2\nnorma = np.sqrt(v @ v)\n',
    message: /cuadrado.*tiene que valer 169/,
    failures: 1,
  },
  {
    name: 'norma mal calculada',
    append: 'cuadrado = v @ v\nnorma = cuadrado / 2\n',
    message: /norma.*tiene que valer 13/,
    failures: 1,
  },
]);

// ---------- ex02.5: puntuaciones = M @ q y mejor = np.argmax ----------

accepts('producto-escalar.ex02.5', [
  {
    name: 'np.dot y método argmax',
    append: 'puntuaciones = np.dot(M, q)\nmejor = puntuaciones.argmax()\n',
  },
  {
    name: 'método dot',
    append: 'puntuaciones = M.dot(q)\nmejor = int(np.argmax(puntuaciones))\n',
  },
  {
    name: 'suma por filas',
    append: 'puntuaciones = np.sum(M * q, axis=1)\nmejor = np.argmax(puntuaciones)\n',
  },
  { name: 'q @ M.T', append: 'puntuaciones = q @ M.T\nmejor = np.argmax(puntuaciones)\n' },
  {
    name: 'fila a fila',
    append: 'puntuaciones = np.array([fila @ q for fila in M])\nmejor = np.argmax(puntuaciones)\n',
  },
  {
    name: 'posición con index',
    append: 'puntuaciones = M @ q\nmejor = list(puntuaciones).index(max(puntuaciones))\n',
  },
  {
    name: 'posición con where',
    append: 'puntuaciones = M @ q\nmejor = np.where(puntuaciones == puntuaciones.max())[0][0]\n',
  },
]);
rejects('producto-escalar.ex02.5', [
  {
    name: 'M * q: una fila de 2 números por documento',
    append: 'puntuaciones = M * q\nmejor = 2\n',
    message: /falta sumar/,
    failures: 1,
  },
  {
    name: 'mejor es la puntuación más alta',
    append: 'puntuaciones = M @ q\nmejor = np.max(puntuaciones)\n',
    message: /vale 24.*posición/,
    failures: 1,
  },
  {
    name: 'mejor cuenta desde 1',
    append: 'puntuaciones = M @ q\nmejor = np.argmax(puntuaciones) + 1\n',
    message: /empieza a contar en 0/,
    failures: 1,
  },
  {
    name: 'posición del peor documento',
    append: 'puntuaciones = M @ q\nmejor = np.argmin(puntuaciones)\n',
    message: /contando desde 0/,
    failures: 1,
  },
  {
    name: 'puntuaciones en una lista de Python',
    append: 'puntuaciones = [fila @ q for fila in M]\nmejor = 2\n',
    message: /array de NumPy con 5 números/,
    failures: 1,
  },
  {
    name: 'falta mejor',
    append: 'puntuaciones = M @ q\n',
    message: /`mejor` tiene que ser un único número/,
    failures: 1,
  },
]);

// ---------- examen-1.signo-agudo: agudo = a · b > 0 ----------

accepts('examen-1.signo-agudo', [
  { name: 'np.dot', append: 'agudo = np.dot(a, b) > 0\n' },
  { name: 'con bool', append: 'agudo = bool(a @ b > 0)\n' },
  { name: 'mayor o igual', append: 'agudo = np.sum(a * b) >= 0\n' },
  { name: 'if', append: 'agudo = True if a @ b > 0 else False\n' },
]);
rejects('examen-1.signo-agudo', [
  {
    name: 'el producto escalar, sin comparar',
    append: 'agudo = a @ b\n',
    message: /`True` o `False`/,
    failures: 1,
  },
  {
    name: 'signo al revés',
    append: 'agudo = a @ b < 0\n',
    message: /tiene que ser `True`/,
    failures: 1,
  },
  {
    name: 'todos los productos positivos',
    append: 'agudo = np.all(a * b > 0)\n',
    message: /tiene que ser `True`/,
    failures: 1,
  },
  { name: 'cadena', append: 'agudo = "sí"\n', message: /`True` o `False`/, failures: 1 },
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

describe('las preguntas de función no tienen variables a rellenar con basura', () => {
  it('producto y ortogonales son funciones: sus sondas de basura están vacías', () => {
    // contract: garbageProbes solo genera sondas para variables que el starter deja en `None`; estas preguntas dejan `return None`
    expect(garbageProbes(question('producto-escalar.ex02.2'))).toEqual([]);
    expect(garbageProbes(question('producto-escalar.ex02.3'))).toEqual([]);
  });
});
