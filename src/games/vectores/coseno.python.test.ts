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
import { coseno } from './coseno';
import { examen1Coseno } from './examen-1-coseno';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen1Coseno
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [...projectQuestions(coseno).filter((q): q is CodigoQ => q.type === 'codigo'), ...bankCode].map(
    (q) => [q.id, q],
  ),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const SIM = 'examen-1.similitud';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo de la Órbita 1: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([...[1, 2, 3, 4, 5].map((n) => `coseno.ex02.${n}`), SIM]);
  });
  for (const id of byId.keys()) {
    it(`${id}: la referencia pasa y el starter no`, async () => {
      // contract: reglas comunes de contenido: la reference supera las comprobaciones y el starter no
      expect(await codeQuestionProblems(pyodide, question(id))).toEqual([]);
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

const fn = (name: string, body: string): string =>
  `\ndef ${name}(a, b):\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;

// ---------- ex02.1: coseno(a, b) ----------

accepts('coseno.ex02.1', [
  {
    name: 'dos divisiones seguidas',
    append: fn('coseno', 'return np.dot(a, b) / np.linalg.norm(a) / np.linalg.norm(b)'),
  },
  {
    name: 'con el operador @',
    append: fn('coseno', 'return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))'),
  },
  {
    name: 'con np.inner',
    append: fn('coseno', 'return np.inner(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))'),
  },
  {
    name: 'producto escalar con suma',
    append: fn('coseno', 'return np.sum(a * b) / (np.linalg.norm(a) * np.linalg.norm(b))'),
  },
  {
    name: 'normas con raíz',
    append: fn('coseno', 'return np.dot(a, b) / (np.sqrt(np.dot(a, a)) * np.sqrt(np.dot(b, b)))'),
  },
  {
    name: 'dividiendo los vectores antes',
    append: fn('coseno', 'return np.dot(a / np.linalg.norm(a), b / np.linalg.norm(b))'),
  },
  {
    name: 'con variables intermedias',
    append: fn(
      'coseno',
      'num = np.dot(a, b)\nden = np.linalg.norm(a) * np.linalg.norm(b)\nreturn num / den',
    ),
  },
  {
    // contract: sonda: la función se llama con arrays, pero una versión que acepta listas también es correcta
    name: 'convirtiendo antes a array',
    append: fn(
      'coseno',
      'a = np.asarray(a)\nb = np.asarray(b)\nreturn float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))',
    ),
  },
]);
rejects('coseno.ex02.1', [
  {
    name: 'solo el producto escalar',
    append: fn('coseno', 'return np.dot(a, b)'),
    message: /devuelve 24, que es el producto escalar/,
  },
  {
    name: 'paréntesis que no agrupan las normas',
    append: fn('coseno', 'return np.dot(a, b) / np.linalg.norm(a) * np.linalg.norm(b)'),
    message: /devuelve 24.*paréntesis/,
  },
  {
    name: 'solo una norma',
    append: fn('coseno', 'return np.dot(a, b) / np.linalg.norm(a)'),
    message: /4,8: has dividido solo entre una/,
    failures: 1,
  },
  {
    name: 'solo el producto de las normas',
    append: fn('coseno', 'return np.linalg.norm(a) * np.linalg.norm(b)'),
    message: /mayor que 1/,
  },
  {
    name: 'signo cambiado',
    append: fn('coseno', 'return -np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))'),
    message: /no da el coseno correcto en todos los casos/,
  },
  {
    name: 'sin return',
    append: fn('coseno', 'c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))'),
    message: /falta el `return`/,
  },
  {
    name: 'devuelve una lista',
    append: fn('coseno', 'return [np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))]'),
    message: /tiene que devolver un número/,
  },
  {
    name: 'una función que da error',
    append: fn('coseno', 'return cos_total'),
    message: /tiene que devolver un número/,
  },
  // contract: review-18r m2 (cadenas y None en lo que devuelve la función no rompen las comprobaciones)
  {
    name: 'devuelve un texto',
    append: fn('coseno', 'return "hola"'),
    message: /tiene que devolver un número/,
    failures: 1,
  },
  {
    name: 'devuelve un array de texto',
    append: fn('coseno', 'return np.array("hola")'),
    message: /tiene que devolver un número/,
    failures: 1,
  },
]);

// ---------- ex02.2: angulo(a, b) ----------

accepts('coseno.ex02.2', [
  {
    name: 'rad2deg',
    append: fn('angulo', 'return np.rad2deg(np.arccos(np.clip(coseno(a, b), -1, 1)))'),
  },
  {
    name: 'multiplicando por 180 / pi',
    append: fn('angulo', 'return np.arccos(np.clip(coseno(a, b), -1, 1)) * 180 / np.pi'),
  },
  {
    name: 'el coseno en una variable',
    append: fn(
      'angulo',
      'c = coseno(a, b)\nc = np.clip(c, -1, 1)\nreturn np.degrees(np.arccos(c))',
    ),
  },
  {
    name: 'recorte con el método clip',
    append: fn('angulo', 'return np.degrees(np.arccos(coseno(a, b).clip(-1, 1)))'),
  },
  {
    name: 'recorte con min y max',
    append: fn('angulo', 'return np.degrees(np.arccos(min(1, max(-1, coseno(a, b)))))'),
  },
  {
    // contract: sonda: en 2D el ángulo también sale de atan2 con el producto vectorial; es correcto y no necesita recorte
    name: 'con arctan2 en 2D',
    append: fn(
      'angulo',
      'return np.degrees(np.arctan2(abs(a[0] * b[1] - a[1] * b[0]), np.dot(a, b)))',
    ),
  },
]);
rejects('coseno.ex02.2', [
  {
    name: 'en radianes',
    append: fn('angulo', 'return np.arccos(np.clip(coseno(a, b), -1, 1))'),
    message: /1,57: es el ángulo en radianes/,
    failures: 1,
  },
  {
    name: 'sin recortar el coseno',
    append: fn('angulo', 'return np.degrees(np.arccos(coseno(a, b)))'),
    message: /devuelve `nan`.*np\.clip/,
    failures: 1,
  },
  {
    name: 'sin arcocoseno',
    append: fn('angulo', 'return np.degrees(np.clip(coseno(a, b), -1, 1))'),
    message: /no da el ángulo correcto en todos los casos/,
  },
  {
    name: 'arcoseno en vez de arcocoseno',
    append: fn('angulo', 'return np.degrees(np.arcsin(np.clip(coseno(a, b), -1, 1)))'),
    message: /no da el ángulo correcto en todos los casos/,
  },
  {
    name: 'sin return',
    append: fn('angulo', 'g = np.degrees(np.arccos(np.clip(coseno(a, b), -1, 1)))'),
    message: /falta el `return`/,
  },
  {
    name: 'devuelve un texto',
    append: fn('angulo', 'return "90"'),
    message: /tiene que devolver un número/,
    failures: 1,
  },
  {
    name: 'una función que da error',
    append: fn('angulo', 'return np.degrees(np.arccos(coseno(a)))'),
    message: /tiene que devolver un número/,
  },
]);

// ---------- ex02.3: unitarios y su producto escalar ----------

const UNITARIOS = 'ua = a / np.linalg.norm(a)\nub = b / np.linalg.norm(b)\n';

accepts('coseno.ex02.3', [
  { name: 'con el operador @', append: UNITARIOS + 'c = ua @ ub\n' },
  { name: 'suma de productos', append: UNITARIOS + 'c = np.sum(ua * ub)\n' },
  { name: 'np.inner', append: UNITARIOS + 'c = np.inner(ua, ub)\n' },
  {
    name: 'unitarios con la raíz a mano',
    append:
      'ua = a / np.sqrt(np.sum(a ** 2))\nub = b / np.sqrt(np.sum(b ** 2))\nc = np.dot(ua, ub)\n',
  },
  {
    name: 'norma de orden 2',
    append:
      'ua = a / np.linalg.norm(a, 2)\nub = b / np.linalg.norm(b, 2)\nc = ua[0] * ub[0] + ua[1] * ub[1]\n',
  },
  {
    name: 'unitarios con multiplicación por el inverso',
    append:
      'ua = a * (1 / np.linalg.norm(a))\nub = b * (1 / np.linalg.norm(b))\nc = np.dot(ua, ub)\n',
  },
]);
rejects('coseno.ex02.3', [
  {
    name: 'sin normalizar',
    append: 'ua = a\nub = b\nc = np.dot(ua, ub)\n',
    message: /`ua` sigue valiendo lo mismo.*`ub` sigue valiendo lo mismo/,
  },
  {
    name: 'dividiendo entre el cuadrado de la norma',
    append:
      'ua = a / np.linalg.norm(a) ** 2\nub = b / np.linalg.norm(b) ** 2\nc = np.dot(ua, ub)\n',
    message: /`ua` tiene que ser el unitario.*`ub` tiene que ser el unitario/,
    notMessage: /sigue valiendo|`c` tiene que/,
  },
  {
    name: 'unitarios bien y c sin normalizar',
    append: 'ua = a / np.linalg.norm(a)\nub = b / np.linalg.norm(b)\nc = np.dot(a, b)\n',
    message: /`c` vale 5/,
    failures: 1,
  },
  {
    name: 'unitarios bien y c con otra cuenta',
    append: 'ua = a / np.linalg.norm(a)\nub = b / np.linalg.norm(b)\nc = np.dot(ua, ub) ** 2\n',
    message: /`c` tiene que valer 0,71/,
    failures: 1,
  },
  {
    name: 'unitarios bien y c es un array de una componente',
    append:
      'ua = a / np.linalg.norm(a)\nub = b / np.linalg.norm(b)\nc = np.array([np.dot(ua, ub)])\n',
    message: /único número/,
    failures: 1,
  },
  {
    name: 'listas de Python',
    append: 'ua = [0.894, 0.447]\nub = [0.316, 0.949]\nc = 0.71\n',
    message: /array de NumPy.*array de NumPy/,
  },
  {
    name: 'cadenas',
    append: 'ua = np.array(["2", "1"])\nub = np.array(["1", "3"])\nc = "0.71"\n',
    message: /array de NumPy.*array de NumPy/,
  },
]);

// ---------- ex02.4: ordenar documentos por coseno ----------

const SIM_OK = 'sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))\n';

accepts('coseno.ex02.4', [
  {
    name: 'con np.argsort(-sim)',
    append: SIM_OK + 'orden = np.argsort(-sim)\n',
  },
  {
    name: 'con np.flip',
    append: SIM_OK + 'orden = np.flip(np.argsort(sim))\n',
  },
  {
    name: 'una lista de Python',
    append: SIM_OK + 'orden = np.argsort(sim)[::-1].tolist()\n',
  },
  {
    name: 'eje explícito',
    append: SIM_OK + 'orden = np.argsort(sim, axis=0)[::-1]\n',
  },
  {
    name: 'filas y consulta normalizadas antes',
    append:
      'Dn = D / np.linalg.norm(D, axis=1, keepdims=True)\nqn = q / np.linalg.norm(q)\nsim = Dn @ qn\norden = np.argsort(sim)[::-1]\n',
  },
  {
    name: 'documento a documento',
    append:
      'sim = np.array([np.dot(d, q) / (np.linalg.norm(d) * np.linalg.norm(q)) for d in D])\norden = np.argsort(sim)[::-1]\n',
  },
  {
    name: 'np.dot y normas por separado',
    append:
      'sim = np.dot(D, q) / np.linalg.norm(D, axis=1) / np.linalg.norm(q)\norden = np.argsort(sim)[::-1]\n',
  },
  {
    name: 'ordenando con sorted',
    append: SIM_OK + 'orden = np.array(sorted(range(4), key=lambda i: -sim[i]))\n',
  },
]);
rejects('coseno.ex02.4', [
  {
    name: 'solo el producto escalar (sim y orden)',
    append: 'sim = D @ q\norden = np.argsort(sim)[::-1]\n',
    message: /productos escalares sin dividir.*sin normalizar/,
  },
  {
    name: 'de menos a más parecido',
    append: SIM_OK + 'orden = np.argsort(sim)\n',
    message: /empieza por el documento menos parecido/,
    failures: 1,
  },
  {
    name: 'ordenando por distancia',
    append: SIM_OK + 'orden = np.argsort(np.linalg.norm(D - q, axis=1))\n',
    message: /ordenando por distancia/,
    failures: 1,
  },
  {
    name: 'los valores ordenados en vez de las posiciones',
    append: SIM_OK + 'orden = np.sort(sim)[::-1]\n',
    message: /números decimales: parecen cosenos/,
    failures: 1,
  },
  {
    name: 'solo la posición del mejor',
    append: SIM_OK + 'orden = np.argmax(sim)\n',
    message: /array de NumPy con 4 posiciones/,
    failures: 1,
  },
  {
    name: 'sim dividido solo entre la norma de la consulta',
    append: 'sim = (D @ q) / np.linalg.norm(q)\norden = np.argsort(sim)[::-1]\n',
    message: /`sim` tiene que valer/,
  },
  {
    name: 'sim es una lista de Python',
    append:
      'sim = list((D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q)))\norden = np.argsort(sim)[::-1]\n',
    message: /`sim` tiene que ser un array de NumPy/,
    failures: 1,
  },
  {
    name: 'orden con las posiciones mal',
    append: SIM_OK + 'orden = np.array([0, 1, 2, 3])\n',
    message: /`orden` tiene que ser \[1, 2, 0, 3\]/,
    failures: 1,
  },
]);

// ---------- ex02.5: coseno frente a distancia ----------

accepts('coseno.ex02.5', [
  {
    name: 'dos medidas y argmax / argmin',
    append:
      'sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))\ndist = np.linalg.norm(D - q, axis=1)\npor_coseno = nombres[np.argmax(sim)]\npor_distancia = nombres[np.argmin(dist)]\n',
  },
  {
    name: 'normalizando antes',
    append:
      'Dn = D / np.linalg.norm(D, axis=1, keepdims=True)\npor_coseno = nombres[np.argmax(Dn @ (q / np.linalg.norm(q)))]\npor_distancia = nombres[np.argmin(np.linalg.norm(D - q, axis=1))]\n',
  },
  {
    name: 'distancia con la raíz a mano e índice entero',
    append:
      'sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))\npor_coseno = nombres[int(np.argmax(sim))]\npor_distancia = nombres[int(np.argmin(np.sqrt(np.sum((D - q) ** 2, axis=1))))]\n',
  },
  {
    name: 'con un bucle y la lista de nombres',
    append:
      'mejor_sim = -2\nmenor_dist = 1000\nfor i in range(3):\n    s = np.dot(D[i], q) / (np.linalg.norm(D[i]) * np.linalg.norm(q))\n    d = np.linalg.norm(D[i] - q)\n    if s > mejor_sim:\n        mejor_sim = s\n        por_coseno = nombres[i]\n    if d < menor_dist:\n        menor_dist = d\n        por_distancia = nombres[i]\n',
  },
  { name: 'escritos a mano', append: 'por_coseno = "tratado"\npor_distancia = "apunte"\n' },
]);
rejects('coseno.ex02.5', [
  {
    name: 'los dos criterios al revés',
    append: 'por_coseno = "apunte"\npor_distancia = "tratado"\n',
    message: /`por_coseno` vale «apunte».*`por_distancia` vale «tratado»/,
  },
  {
    name: 'argmin con el coseno',
    append:
      'sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))\npor_coseno = nombres[np.argmin(sim)]\npor_distancia = nombres[np.argmin(np.linalg.norm(D - q, axis=1))]\n',
    message: /`por_coseno` vale «ensayo»/,
    failures: 1,
  },
  {
    name: 'argmax con la distancia',
    append:
      'sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))\npor_coseno = nombres[np.argmax(sim)]\npor_distancia = nombres[np.argmax(np.linalg.norm(D - q, axis=1))]\n',
    message: /`por_distancia` vale «tratado»/,
    failures: 1,
  },
  {
    name: 'la posición en vez del nombre',
    append: 'por_coseno = 1\npor_distancia = 0\n',
    message: /nombre del documento.*nombre del documento/,
  },
  {
    name: 'un nombre que no está en la lista',
    append: 'por_coseno = "gato"\npor_distancia = "gato"\n',
    message: /uno de los nombres de `nombres`/,
  },
]);

// ---------- banco: examen-1.similitud ----------

accepts(SIM, [
  { name: 'con el operador @', append: 'sim = q @ d / (np.linalg.norm(q) * np.linalg.norm(d))\n' },
  {
    name: 'dos divisiones seguidas',
    append: 'sim = np.dot(q, d) / np.linalg.norm(q) / np.linalg.norm(d)\n',
  },
  {
    name: 'vectores unitarios',
    append: 'sim = np.dot(q / np.linalg.norm(q), d / np.linalg.norm(d))\n',
  },
  { name: 'escrito a mano', append: 'sim = 0.8\n' },
]);
rejects(SIM, [
  {
    name: 'solo el producto escalar',
    append: 'sim = np.dot(q, d)\n',
    message: /vale 8: es el producto escalar/,
    failures: 1,
  },
  {
    name: 'solo una norma',
    append: 'sim = np.dot(q, d) / np.linalg.norm(q)\n',
    message: /se sale del intervalo/,
    failures: 1,
  },
  {
    name: 'la distancia en vez del coseno',
    append: 'sim = np.linalg.norm(q - d)\n',
    message: /se sale del intervalo|tiene que valer 0,8/,
  },
  {
    name: 'una lista de una componente',
    append: 'sim = [0.8]\n',
    message: /único número/,
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
