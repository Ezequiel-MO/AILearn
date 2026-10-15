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
import { proyeccion } from './proyeccion';

// El proyecto no está en el registro del juego hasta que se cablea la Órbita 1, así que
// tests/content/python.test.ts todavía no lo recorre: aquí se comprueban sus cinco preguntas de
// código (la referencia pasa, el `starter` no), las soluciones correctas distintas de la de
// referencia y los errores típicos. Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const byId = new Map(
  projectQuestions(proyeccion)
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
    // contract: encargo de la Órbita 1, ex02: cinco preguntas de código
    expect([...byId.keys()]).toEqual([1, 2, 3, 4, 5].map((n) => `proyeccion.ex02.${n}`));
  });
  for (const n of [1, 2, 3, 4, 5]) {
    it(`proyeccion.ex02.${n}: la referencia pasa y el starter no`, async () => {
      // contract: reglas comunes de contenido: la reference supera las comprobaciones y el starter no
      expect(await codeQuestionProblems(pyodide, question(`proyeccion.ex02.${n}`))).toEqual([]);
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

/** Solo el reemplazo del cuerpo (para los errores típicos, que llevan su propio nombre). */
const sub = (text: string, from = '    return None\n'): Pick<Variant, 'replace'> => ({
  replace: [from, text],
});

/** Sustituye el cuerpo `return None` (o la variante dada) de la función del starter. */
const body = (name: string, text: string, from = '    return None\n'): Variant => ({
  name,
  replace: [from, text],
});

// ---------- ex02.1: proyeccion_escalar(a, b) ----------

accepts('proyeccion.ex02.1', [
  body('np.dot', '    return np.dot(a, b) / np.linalg.norm(b)\n'),
  body('raíz de b @ b', '    return (a @ b) / np.sqrt(b @ b)\n'),
  body('con el vector unitario', '    return a @ (b / np.linalg.norm(b))\n'),
  body('sumas y potencias', '    return np.sum(a * b) / np.sqrt(np.sum(b ** 2))\n'),
  body('en dos pasos', '    prod = a @ b\n    n = np.linalg.norm(b)\n    return prod / n\n'),
  body('con float', '    return float(a @ b) / float(np.linalg.norm(b))\n'),
  body('np.inner', '    return np.inner(a, b) / np.linalg.norm(b)\n'),
  // contract: encargo de la Órbita 1 (la función se llama con otros vectores: también con listas de Python)
  body(
    'sirve con listas',
    '    a = np.array(a)\n    b = np.array(b)\n    return (a @ b) / np.linalg.norm(b)\n',
  ),
]);
rejects('proyeccion.ex02.1', [
  {
    name: 'sin dividir',
    ...sub('    return a @ b\n'),
    message: /devuelve 30.*norma de `b`/,
  },
  {
    name: 'entre b @ b',
    ...sub('    return (a @ b) / (b @ b)\n'),
    message: /devuelve 1,2.*`b @ b`/,
  },
  {
    name: 'entre la norma de a',
    ...sub('    return (a @ b) / np.linalg.norm(a)\n'),
    message: /norma de `a`/,
  },
  {
    name: 'imprime en vez de devolver',
    ...sub('    print((a @ b) / np.linalg.norm(b))\n'),
    message: /devolver un número con `return`/,
  },
  {
    name: 'valor absoluto',
    ...sub('    return abs((a @ b) / np.linalg.norm(b))\n'),
    message: /devolver -3.*Conserva el signo/,
    failures: 1,
  },
  {
    name: 'devuelve la proyección vectorial',
    ...sub('    return (a @ b) / (b @ b) * b\n'),
    message: /devolver un número/,
  },
  {
    name: 'un array de un elemento',
    ...sub('    return np.array([(a @ b) / np.linalg.norm(b)])\n'),
    message: /devolver un número/,
  },
  {
    name: 'una cadena',
    ...sub('    return "6"\n'),
    message: /devolver un número/,
  },
  {
    name: 'cadenas dentro de un array',
    ...sub('    return np.array(["a", "b"])\n'),
    message: /devolver un número/,
  },
  {
    name: 'una función que falla',
    ...sub('    return (a @ b) / np.linalg.norm(b) + "x"\n'),
    message: /devolver un número/,
  },
]);

// ---------- ex02.2: proyeccion(a, b) ----------

accepts('proyeccion.ex02.2', [
  body('np.dot', '    return np.dot(a, b) / np.dot(b, b) * b\n'),
  body('multiplicando b antes', '    return b * (a @ b) / (b @ b)\n'),
  body('con el vector unitario', '    u = b / np.linalg.norm(b)\n    return (a @ u) * u\n'),
  body('norma al cuadrado', '    return (a @ b) / np.linalg.norm(b) ** 2 * b\n'),
  body(
    'a partir de la proyección escalar',
    '    k = (a @ b) / np.linalg.norm(b)\n    return k * b / np.linalg.norm(b)\n',
  ),
  body('en dos pasos', '    k = (a @ b) / (b @ b)\n    return k * b\n'),
  body('con decimales', '    return ((a @ b) / (b @ b)) * b.astype(float)\n'),
  body(
    'con listas',
    '    a = np.array(a)\n    b = np.array(b)\n    return (a @ b) / (b @ b) * b\n',
  ),
]);
rejects('proyeccion.ex02.2', [
  {
    name: 'entre la norma (sale 5 veces más larga)',
    ...sub('    return (a @ b) / np.linalg.norm(b) * b\n'),
    message: /5 veces demasiado larga/,
  },
  {
    name: 'solo el cociente, sin multiplicar por b',
    ...sub('    return (a @ b) / (b @ b)\n'),
    message: /un solo número, 1,2.*multiplicarlo por `b`/,
  },
  {
    name: 'proyecta b sobre a',
    ...sub('    return (b @ a) / (a @ a) * a\n'),
    message: /al revés/,
  },
  {
    name: 'una lista de Python',
    ...sub('    return ((a @ b) / (b @ b) * b).tolist()\n'),
    message: /array de NumPy con 2 componentes/,
  },
  {
    name: 'una tupla',
    ...sub('    return tuple((a @ b) / (b @ b) * b)\n'),
    message: /array de NumPy con 2 componentes/,
  },
  {
    name: 'cadenas',
    ...sub('    return np.array(["3", "4"])\n'),
    message: /array de NumPy con 2 componentes/,
  },
  {
    name: 'sin dividir',
    ...sub('    return (a @ b) * b\n'),
    message: /tiene que devolver \(3,6; 4,8\)/,
  },
  {
    name: 'devuelve a',
    ...sub('    return a\n'),
    message: /tiene que devolver \(3,6; 4,8\)/,
  },
  {
    name: 'una función que falla',
    ...sub('    return (a @ b) / (b @ b) * b + "x"\n'),
    message: /array de NumPy con 2 componentes/,
  },
  {
    name: 'con el signo cambiado',
    ...sub('    return abs((a @ b) / (b @ b)) * b\n'),
    message: /\(2,4; -1,8\).*apunta contra `b`/,
  },
]);

// ---------- ex02.3: descomponer(a, b) y ortogonal ----------

const DESCOMPONER_OK =
  '    paralela = (a @ b) / (b @ b) * b\n    perpendicular = a - paralela\n    return paralela, perpendicular\n';
const BODY3 = '    return None, None\n';

accepts('proyeccion.ex02.3', [
  {
    name: 'la referencia, con ortogonal por isclose',
    replace: [BODY3, DESCOMPONER_OK],
    append: 'ortogonal = np.isclose(perpendicular @ b, 0)\n',
  },
  {
    name: 'perpendicular primero, devuelta en una lista',
    replace: [BODY3, '    paralela = b * (a @ b) / (b @ b)\n    return [paralela, a - paralela]\n'],
    append: 'ortogonal = bool(np.isclose(np.dot(perpendicular, b), 0))\n',
  },
  {
    name: 'ortogonal con valor absoluto',
    replace: [BODY3, DESCOMPONER_OK],
    append: 'ortogonal = abs(perpendicular @ b) < 1e-9\n',
  },
  {
    name: 'ortogonal con allclose',
    replace: [BODY3, DESCOMPONER_OK],
    append: 'ortogonal = np.allclose(perpendicular @ b, 0)\n',
  },
  {
    name: 'con el vector unitario',
    replace: [
      BODY3,
      '    u = b / np.linalg.norm(b)\n    paralela = (a @ u) * u\n    return paralela, a - paralela\n',
    ],
    append: 'ortogonal = bool(np.isclose(perpendicular @ b, 0))\n',
  },
  {
    name: 'ortogonal comparando con 0 con una tolerancia',
    replace: [BODY3, DESCOMPONER_OK],
    append: 'ortogonal = bool(abs(np.dot(perpendicular, b)) < 0.000001)\n',
  },
]);
rejects('proyeccion.ex02.3', [
  {
    name: 'perpendicular = b - paralela',
    replace: [BODY3, '    paralela = (a @ b) / (b @ b) * b\n    return paralela, b - paralela\n'],
    append: 'ortogonal = np.isclose(perpendicular @ b, 0)\n',
    message: /tienen que sumar `a`/,
  },
  {
    name: 'paralela dividida entre la norma',
    replace: [
      BODY3,
      '    paralela = (a @ b) / np.linalg.norm(b) * b\n    return paralela, a - paralela\n',
    ],
    append: 'ortogonal = np.isclose(perpendicular @ b, 0)\n',
    message: /no es ortogonal a `b`/,
  },
  {
    name: 'las dos partes intercambiadas',
    replace: [BODY3, '    paralela = (a @ b) / (b @ b) * b\n    return a - paralela, paralela\n'],
    append: 'ortogonal = np.isclose(perpendicular @ b, 0)\n',
    message: /no es ortogonal a `b`/,
  },
  {
    name: 'la perpendicular es a, sin restar',
    replace: [BODY3, '    return (a @ b) / (b @ b) * b, a\n'],
    append: 'ortogonal = np.isclose(perpendicular @ b, 0)\n',
    message: /tienen que sumar `a`/,
  },
  {
    name: 'ortogonal es el producto escalar',
    replace: [BODY3, DESCOMPONER_OK],
    append: 'ortogonal = perpendicular @ b\n',
    message: /tiene que ser `True` o `False`/,
  },
  {
    name: 'ortogonal falso con la función correcta',
    replace: [BODY3, DESCOMPONER_OK],
    append: 'ortogonal = False\n',
    message: /no coincide con lo que dicen los números/,
    failures: 1,
  },
  {
    name: 'ortogonal verdadero con una perpendicular que no lo es',
    replace: [
      BODY3,
      '    paralela = (a @ b) / np.linalg.norm(b) * b\n    return paralela, a - paralela\n',
    ],
    append: 'ortogonal = True\n',
    message: /no coincide con lo que dicen los números/,
  },
  {
    name: 'la función devuelve cadenas',
    replace: [BODY3, '    return "a", "b"\n'],
    message: /pareja `\(paralela, perpendicular\)`/,
  },
  {
    name: 'la función devuelve arrays de tres componentes',
    replace: [BODY3, '    return np.zeros(3), np.zeros(3)\n'],
    message: /pareja `\(paralela, perpendicular\)`/,
  },
]);

// ---------- ex02.4: quitar_componente(E, d) ----------

accepts('proyeccion.ex02.4', [
  body(
    'bucle sobre las filas',
    '    R = np.zeros(E.shape, dtype=float)\n    for i in range(len(E)):\n        R[i] = E[i] - (E[i] @ d) / (d @ d) * d\n    return R\n',
  ),
  body('columna con None', '    return E - ((E @ d) / (d @ d))[:, None] * d\n'),
  body('dividiendo la matriz', '    return E - np.outer(E @ d, d) / (d @ d)\n'),
  body('lista por comprensión', '    return np.array([f - (f @ d) / (d @ d) * d for f in E])\n'),
  body(
    'con el vector unitario',
    '    u = d / np.linalg.norm(d)\n    return E - np.outer(E @ u, u)\n',
  ),
  body('con la matriz de proyección', '    return E - E @ np.outer(d, d) / (d @ d)\n'),
  body('con np.dot', '    return E - np.outer(np.dot(E, d) / np.dot(d, d), d)\n'),
  body('norma al cuadrado', '    return E - np.outer((E @ d) / np.linalg.norm(d) ** 2, d)\n'),
  body(
    'fila a fila, con lista de filas',
    '    filas = []\n    for fila in E:\n        filas.append(fila - (fila @ d) / (d @ d) * d)\n    return np.array(filas)\n',
  ),
]);
rejects('proyeccion.ex02.4', [
  {
    name: 'sin dividir entre d @ d',
    ...sub('    return E - np.outer(E @ d, d)\n'),
    message: /Falta dividir entre `d @ d`/,
  },
  {
    name: 'dividiendo entre la norma de d',
    ...sub('    return E - np.outer((E @ d) / np.linalg.norm(d), d)\n'),
    message: /Has dividido entre la norma de `d`/,
  },
  {
    name: 'devuelve la parte que había que quitar',
    ...sub('    return np.outer((E @ d) / (d @ d), d)\n'),
    message: /justo la parte que había que quitar/,
  },
  {
    name: 'resta d sin proyectar',
    ...sub('    return E - d\n'),
    message: /ortogonales a `d`/,
  },
  {
    name: 'devuelve E sin cambios',
    ...sub('    return E\n'),
    message: /ortogonales a `d`/,
  },
  {
    name: 'una lista de Python',
    ...sub('    return (E - np.outer((E @ d) / (d @ d), d)).tolist()\n'),
    message: /matriz de NumPy con la misma forma/,
  },
  {
    name: 'solo funciona con dos componentes (datos escritos a mano)',
    ...sub('    return np.array([[-2.5, 2.5], [-2.5, 2.5], [-1.5, 1.5], [0, 0]])\n'),
    message:
      /valer para cualquier número de componentes|dejar las filas sin su componente vertical/,
  },
]);

// ---------- ex02.5: dibujar a, b y p ----------

const QUIVER = 'angles="xy", scale_units="xy", scale=1';
const FLECHAS = `plt.quiver(0, 0, a[0], a[1], ${QUIVER})\nplt.quiver(0, 0, b[0], b[1], ${QUIVER})\nplt.quiver(0, 0, p[0], p[1], ${QUIVER})\n`;

accepts('proyeccion.ex02.5', [
  {
    name: 'con np.dot y las flechas de la referencia',
    append: `p = np.dot(a, b) / np.dot(b, b) * b\n${FLECHAS}`,
  },
  {
    name: 'con el vector unitario',
    append: `u = b / np.linalg.norm(b)\np = (a @ u) * u\n${FLECHAS}`,
  },
  {
    name: 'una sola llamada con listas',
    append: `p = (a @ b) / (b @ b) * b\nplt.quiver([0, 0, 0], [0, 0, 0], [a[0], b[0], p[0]], [a[1], b[1], p[1]], ${QUIVER})\n`,
  },
  {
    name: 'forma corta con desempaquetado',
    append: `p = (a @ b) / (b @ b) * b\nplt.quiver(0, 0, *a, ${QUIVER})\nplt.quiver(0, 0, *b, ${QUIVER})\nplt.quiver(0, 0, *p, ${QUIVER})\n`,
  },
  {
    name: 'con la perpendicular dibujada desde la punta de p',
    append: `p = (a @ b) / (b @ b) * b\n${FLECHAS}plt.quiver(p[0], p[1], a[0] - p[0], a[1] - p[1], color="gray", ${QUIVER})\n`,
  },
  {
    name: 'con ejes creados con subplots',
    append: `p = (a @ b) / (b @ b) * b\nplt.close("all")\nfig, ax = plt.subplots()\nax.quiver(0, 0, 6, 2, ${QUIVER})\nax.quiver(0, 0, 2, 2, ${QUIVER})\nax.quiver(0, 0, p[0], p[1], ${QUIVER})\n`,
  },
]);
rejects('proyeccion.ex02.5', [
  {
    // contract: informe de Oliver (2026-10-15): con plt.quiver sin opciones la respuesta contaba como correcta y la figura salía deformada
    name: 'dibuja las tres flechas sin las opciones de escala',
    append:
      'p = (a @ b) / (b @ b) * b\nplt.quiver(0, 0, a[0], a[1])\nplt.quiver(0, 0, b[0], b[1])\nplt.quiver(0, 0, p[0], p[1])\n',
    message: /no están dibujadas a escala/,
    failures: 1,
  },
  {
    // contract: informe de Oliver (2026-10-15): basta una flecha sin escala para que la figura engañe
    name: 'una de las tres flechas sin las opciones de escala',
    append: `p = (a @ b) / (b @ b) * b\nplt.quiver(0, 0, a[0], a[1], ${QUIVER})\nplt.quiver(0, 0, b[0], b[1], ${QUIVER})\nplt.quiver(0, 0, p[0], p[1])\n`,
    message: /no están dibujadas a escala/,
    failures: 1,
  },
  {
    name: 'falta la flecha de p',
    append: `p = (a @ b) / (b @ b) * b\nplt.quiver(0, 0, a[0], a[1], ${QUIVER})\nplt.quiver(0, 0, b[0], b[1], ${QUIVER})\n`,
    message: /Falta la flecha de `p`/,
    failures: 1,
  },
  {
    name: 'falta la flecha de a',
    append: `p = (a @ b) / (b @ b) * b\nplt.quiver(0, 0, b[0], b[1], ${QUIVER})\nplt.quiver(0, 0, p[0], p[1], ${QUIVER})\n`,
    message: /Falta la flecha de `a`/,
    failures: 1,
  },
  {
    name: 'falta la flecha de b',
    append: `p = (a @ b) / (b @ b) * b\nplt.quiver(0, 0, a[0], a[1], ${QUIVER})\nplt.quiver(0, 0, p[0], p[1], ${QUIVER})\n`,
    message: /Falta la flecha de `b`/,
    failures: 1,
  },
  {
    name: 'solo calcula p, sin dibujar nada',
    append: 'p = (a @ b) / (b @ b) * b\n',
    message: /No hay flechas/,
    failures: 1,
  },
  {
    name: 'cierra la figura',
    append: 'p = (a @ b) / (b @ b) * b\nplt.close("all")\n',
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'dibuja con plt.plot en vez de flechas',
    append: 'p = (a @ b) / (b @ b) * b\nplt.plot([0, p[0]], [0, p[1]])\n',
    message: /No hay flechas/,
    failures: 1,
  },
  {
    name: 'dividida entre la norma, con p dibujada',
    append: `p = (a @ b) / np.linalg.norm(b) * b\n${FLECHAS}`,
    message: /dividido entre la norma de `b`/,
  },
  {
    name: 'proyecta b sobre a',
    append: `p = (b @ a) / (a @ a) * a\n${FLECHAS}`,
    message: /proyectado `b` sobre `a`/,
  },
  { name: 'p es una lista', append: 'p = [4, 4]\n', message: /array de NumPy/ },
  {
    name: 'p es un número (solo la proyección escalar)',
    append: 'p = (a @ b) / np.linalg.norm(b)\n',
    message: /array de NumPy con 2 componentes/,
  },
  {
    name: 'p con cadenas',
    append: 'p = np.array(["4", "4"])\n',
    message: /números/,
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

describe(
  'funciones que devuelven basura: sin errores de NumPy en inglés',
  { timeout: 60_000 },
  () => {
    // `None` ya es lo que devuelve el starter: lo cubre la prueba de referencia y starter
    const single = [
      '"hola"',
      '[None]',
      'np.array("hola")',
      'np.array(["a", "b"])',
      'np.array([None, None])',
      '[[1, 2], [3, 4]]',
    ];
    // la tercera pregunta desempaqueta la pareja en el starter: basura solo dentro de una pareja
    const pairs = [
      '(None, None)',
      '("a", "b")',
      '(np.zeros(3), np.zeros(3))',
      '("a", None)',
      '([1, 2], [3, 4])',
      '(np.array(["a", "b"]), np.array(["c", "d"]))',
    ];
    const targets: [string, string, string[]][] = [
      ['proyeccion.ex02.1', '    return None\n', single],
      ['proyeccion.ex02.2', '    return None\n', single],
      ['proyeccion.ex02.3', '    return None, None\n', pairs],
      ['proyeccion.ex02.4', '    return None\n', single],
    ];
    for (const [id, from, values] of targets) {
      for (const value of values) {
        it(`${id}: devuelve ${value}`, async () => {
          const q = question(id);
          const r = await runInPyodide(
            pyodide,
            code(q, { name: value, replace: [from, `    return ${value}\n`] }),
            q.checks,
          );
          const messages = (r.checks ?? []).map((c) => c.message).join(' | ');
          // contract: review-18r m2 (b1): una función que devuelve datos de tipo equivocado no rompe las comprobaciones con un error de NumPy
          expect(r.error, describeRun(r)).toBeNull();
          expect(messages, describeRun(r)).not.toMatch(NUMPY_ENGLISH);
          // contract: review-18r m2: siguen sin superarse y sí se ejecutan las comprobaciones
          expect(r.passed, describeRun(r)).toBe(false);
          expect(r.checks?.length ?? 0, describeRun(r)).toBeGreaterThan(0);
        });
      }
    }
  },
);
