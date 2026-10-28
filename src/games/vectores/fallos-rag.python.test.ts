import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ, Question } from '../../content/schema';
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
import { fallosRag } from './fallos-rag';
import { examen3FallosRag } from './examen-3-fallos-rag';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia, los errores típicos
// y todas las cifras de datos reales que cuenta el contenido, contra el módulo `embeddings`.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankQ = examen3FallosRag
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');
const bankCode = examen3FallosRag
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [
    ...projectQuestions(fallosRag).filter((q): q is CodigoQ => q.type === 'codigo'),
    ...bankCode,
  ].map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const FILTRO = 'examen-3.filtro-capacidad';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo común de la Órbita 3: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `fallos-rag.ex02.${n}`),
      FILTRO,
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

// ---------- ex02.1: la matriz de cosenos y el mejor documento de cada consulta ----------

accepts('fallos-rag.ex02.1', [
  {
    name: 'fila a fila y los métodos argmax y max',
    append: 'S = np.array([D @ q for q in Q])\nmejor = S.argmax(axis=1)\npunt = S.max(axis=1)\n',
  },
  {
    name: 'np.dot y listas',
    append:
      'S = np.dot(Q, D.T)\nmejor = [int(np.argmax(f)) for f in S]\npunt = [max(f) for f in S]\n',
  },
  {
    name: 'el coseno de cada mejor documento por índices',
    append: 'S = Q @ D.T\nmejor = np.argmax(S, axis=1)\npunt = S[np.arange(10), mejor]\n',
  },
  {
    name: 'np.einsum',
    append:
      'S = np.einsum("ik,jk->ij", Q, D)\nmejor = np.argmax(S, axis=1)\npunt = np.max(S, axis=1)\n',
  },
]);
rejects('fallos-rag.ex02.1', [
  {
    name: 'D @ Q.T: la matriz al revés',
    append: 'S = D @ Q.T\nmejor = np.argmax(S, axis=0)\npunt = np.max(S, axis=0)\n',
    message: /16 filas y 10 columnas: está al revés/,
    failures: 1,
  },
  {
    name: 'el mayor recorriendo el eje de las consultas',
    append: 'S = Q @ D.T\nmejor = np.argmax(S, axis=0)\npunt = np.max(S, axis=0)\n',
    message: /`mejor` tiene 16 posiciones/,
    failures: 2,
  },
  {
    name: 'mejor con los cosenos en vez de las posiciones',
    append: 'S = Q @ D.T\nmejor = np.max(S, axis=1)\npunt = np.max(S, axis=1)\n',
    message: /`mejor` tiene números decimales/,
    failures: 1,
  },
  {
    name: 'punt con las posiciones en vez de los cosenos',
    append: 'S = Q @ D.T\nmejor = np.argmax(S, axis=1)\npunt = np.argmax(S, axis=1)\n',
    message: /`punt` repite las posiciones de `mejor`/,
    failures: 1,
  },
  {
    name: 'S no tiene los cosenos',
    append: 'S = (Q @ D.T) / 2\nmejor = np.argmax(S, axis=1)\npunt = np.max(Q @ D.T, axis=1)\n',
    message: /la forma buena pero no los cosenos/,
    failures: 1,
  },
  {
    name: 'S con otra forma',
    append: 'S = Q[:, :20]\nmejor = np.argmax(Q @ D.T, axis=1)\npunt = np.max(Q @ D.T, axis=1)\n',
    message: /10 filas, una por consulta, y 16 columnas/,
    failures: 1,
  },
]);

// ---------- ex02.2: aplicar el umbral ----------

accepts('fallos-rag.ex02.2', [
  {
    name: 'un bucle for y el método count',
    append:
      'respuestas = []\nfor m, p in zip(mejor, punt):\n    respuestas.append(int(m) if p >= umbral else None)\nsin_respuesta = respuestas.count(None)\n',
  },
  {
    name: 'sin int() y sum',
    append:
      'respuestas = [m if p >= umbral else None for m, p in zip(mejor, punt)]\nsin_respuesta = sum(r is None for r in respuestas)\n',
  },
  {
    name: 'por posición y la resta de las contestadas',
    append:
      'respuestas = [int(mejor[i]) if punt[i] >= umbral else None for i in range(10)]\nsin_respuesta = 10 - sum(r is not None for r in respuestas)\n',
  },
  {
    name: 'un array de objetos y np.sum',
    append:
      'respuestas = np.array([int(m) if p >= umbral else None for m, p in zip(mejor, punt)], dtype=object)\nsin_respuesta = int(np.sum(punt < umbral))\n',
  },
  {
    name: 'una tupla y la condición negada',
    append:
      'respuestas = tuple(None if p < umbral else int(m) for m, p in zip(mejor, punt))\nsin_respuesta = len([r for r in respuestas if r is None])\n',
  },
]);
rejects('fallos-rag.ex02.2', [
  {
    name: 'la condición al revés',
    append:
      'respuestas = [None if p >= umbral else int(m) for m, p in zip(mejor, punt)]\nsin_respuesta = 3\n',
    message: /`respuestas` está al revés/,
    failures: 1,
  },
  {
    name: 'ceros en vez de None',
    append:
      'respuestas = [int(m) if p >= umbral else 0 for m, p in zip(mejor, punt)]\nsin_respuesta = 3\n',
    message: /Para «no lo sé» el elemento tiene que ser `None`/,
    failures: 1,
  },
  {
    name: 'siempre el mejor documento, sin umbral',
    append: 'respuestas = [int(m) for m in mejor]\nsin_respuesta = 3\n',
    message: /cuyo coseno no llega a `umbral`/,
    failures: 1,
  },
  {
    name: 'los cosenos en vez de las posiciones',
    append:
      'respuestas = [p if p >= umbral else None for m, p in zip(mejor, punt)]\nsin_respuesta = 3\n',
    message: /`respuestas` tiene números decimales/,
    failures: 1,
  },
  {
    name: 'un documento que no es el mejor',
    append:
      'respuestas = [3 if p >= umbral else None for m, p in zip(mejor, punt)]\nsin_respuesta = 3\n',
    message: /no es el más parecido a su consulta/,
    failures: 1,
  },
  {
    name: 'solo las cinco primeras consultas',
    append:
      'respuestas = [int(m) if p >= umbral else None for m, p in zip(mejor[:5], punt[:5])]\nsin_respuesta = 3\n',
    message: /lista con 10 elementos/,
    failures: 1,
  },
  {
    name: 'sin_respuesta cuenta las consultas contestadas',
    append:
      'respuestas = [int(m) if p >= umbral else None for m, p in zip(mejor, punt)]\nsin_respuesta = len(respuestas) - respuestas.count(None)\n',
    message: /`sin_respuesta` vale 7/,
    failures: 1,
  },
  {
    name: 'sin_respuesta es la lista entera',
    append:
      'respuestas = [int(m) if p >= umbral else None for m, p in zip(mejor, punt)]\nsin_respuesta = respuestas\n',
    message: /`sin_respuesta` tiene que ser un número entero/,
    failures: 1,
  },
]);

// ---------- ex02.3: medir con consultas etiquetadas ----------

accepts('fallos-rag.ex02.3', [
  {
    name: 'un bucle con contadores y listas',
    append:
      'aciertos = 0\nfalsos = []\nperdidas = []\nfor i in range(10):\n    if respuestas[i] == correctas[i]:\n        aciertos += 1\n    elif correctas[i] is None:\n        falsos.append(i)\n    elif respuestas[i] is None:\n        perdidas.append(i)\n',
  },
  {
    name: 'arrays de objetos',
    append:
      'r = np.array(respuestas, dtype=object)\nc = np.array(correctas, dtype=object)\naciertos = int(np.sum(r == c))\nfalsos = [i for i in range(10) if c[i] is None and r[i] is not None]\nperdidas = [i for i in range(10) if c[i] is not None and r[i] is None]\n',
  },
  {
    name: 'una tupla y un array de posiciones',
    append:
      'aciertos = len([1 for r, c in zip(respuestas, correctas) if r == c])\nfalsos = np.array([i for i in range(10) if correctas[i] is None and respuestas[i] is not None])\nperdidas = tuple(i for i in range(10) if correctas[i] is not None and respuestas[i] is None)\n',
  },
]);
const PAIRS = 'enumerate(zip(respuestas, correctas))';
const LISTAS = `falsos = [i for i, (r, c) in ${PAIRS} if c is None and r is not None]\nperdidas = [i for i, (r, c) in ${PAIRS} if c is not None and r is None]\n`;
rejects('fallos-rag.ex02.3', [
  {
    name: 'sin contar la comparación de None con None',
    append:
      'aciertos = sum(r == c for r, c in zip(respuestas, correctas) if r is not None)\n' + LISTAS,
    message: /`aciertos` vale 5/,
    failures: 1,
  },
  {
    name: 'las consultas contestadas',
    append: 'aciertos = sum(r is not None for r in respuestas)\n' + LISTAS,
    message: /`aciertos` vale 7/,
    failures: 1,
  },
  {
    name: 'los fallos en vez de los aciertos',
    append: 'aciertos = sum(r != c for r, c in zip(respuestas, correctas))\n' + LISTAS,
    message: /`aciertos` vale 4/,
    failures: 1,
  },
  {
    name: 'falsos cuenta los rechazos correctos',
    append: `aciertos = 6\nfalsos = [i for i, (r, c) in ${PAIRS} if c is None and r is None]\nperdidas = [i for i, (r, c) in ${PAIRS} if c is not None and r is None]\n`,
    message: /`falsos` es \[7\]/,
    failures: 1,
  },
  {
    name: 'falsos incluye el documento equivocado',
    append: `aciertos = 6\nfalsos = [i for i, (r, c) in ${PAIRS} if r is not None and r != c]\nperdidas = [i for i, (r, c) in ${PAIRS} if c is not None and r is None]\n`,
    message: /`falsos` incluye la consulta 2/,
    failures: 1,
  },
  {
    name: 'perdidas incluye el rechazo correcto',
    append: `aciertos = 6\nfalsos = [i for i, (r, c) in ${PAIRS} if c is None and r is not None]\nperdidas = [i for i, r in enumerate(respuestas) if r is None]\n`,
    message: /`perdidas` incluye la consulta 7/,
    failures: 1,
  },
  {
    name: 'falsos como un recuento',
    append: `aciertos = 6\nfalsos = 1\nperdidas = [i for i, (r, c) in ${PAIRS} if c is not None and r is None]\n`,
    message: /`falsos` tiene que ser una lista de posiciones/,
    failures: 1,
  },
  {
    name: 'perdidas como un recuento',
    append: `aciertos = 6\nfalsos = [i for i, (r, c) in ${PAIRS} if c is None and r is not None]\nperdidas = 2\n`,
    message: /`perdidas` tiene que ser una lista de posiciones/,
    failures: 1,
  },
]);

// ---------- ex02.4: buscar el umbral y dibujar la curva ----------

const CURVA =
  'aciertos = np.array([sum((int(m) if p >= u else None) == c for m, p, c in zip(mejor, punt, correctas)) for u in umbrales])\n';
accepts('fallos-rag.ex02.4', [
  {
    name: 'una comprensión de lista y un valor entero',
    append: CURVA + 'plt.plot(umbrales, aciertos)\ntecho = int(aciertos.max())\n',
  },
  {
    name: 'plt.step y max de Python',
    append: CURVA + 'plt.step(umbrales, aciertos)\ntecho = max(aciertos)\n',
  },
  {
    name: 'ejes explícitos con subplots',
    append:
      CURVA + 'fig, ax = plt.subplots()\nax.plot(umbrales, aciertos)\ntecho = np.max(aciertos)\n',
  },
  {
    name: 'una lista, marcadores y la comparación estricta',
    append:
      'aciertos = []\nfor u in umbrales:\n    rs = [int(m) if p > u else None for m, p in zip(mejor, punt)]\n    aciertos.append(sum(r == c for r, c in zip(rs, correctas)))\nplt.plot(umbrales, aciertos, "o-")\ntecho = max(aciertos)\n',
  },
]);
rejects('fallos-rag.ex02.4', [
  {
    name: 'sin dibujar',
    append: CURVA + 'techo = aciertos.max()\n',
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'barras en vez de una línea',
    append: CURVA + 'plt.bar(umbrales, aciertos, width=0.01)\ntecho = aciertos.max()\n',
    message: /No hay ninguna línea en la figura/,
    failures: 1,
  },
  {
    name: 'una línea con otra altura',
    append: CURVA + 'plt.plot(umbrales, aciertos / 2)\ntecho = aciertos.max()\n',
    message: /altura de cada punto de la línea/,
    failures: 1,
  },
  {
    name: 'una línea con menos puntos',
    append: CURVA + 'plt.plot(umbrales[::2], aciertos[::2])\ntecho = aciertos.max()\n',
    message: /La línea tiene que tener 101 puntos/,
    failures: 1,
  },
  {
    name: 'techo es la posición del máximo',
    append: CURVA + 'plt.plot(umbrales, aciertos)\ntecho = np.argmax(aciertos)\n',
    message: /`techo` vale 0/,
    failures: 1,
  },
  {
    name: 'la fracción de aciertos',
    append:
      'aciertos = np.array([sum((int(m) if p >= u else None) == c for m, p, c in zip(mejor, punt, correctas)) for u in umbrales]) / 10\nplt.plot(umbrales, aciertos)\ntecho = aciertos.max()\n',
    message: /parece una fracción/,
  },
  {
    name: 'un solo número en vez de uno por umbral',
    append: 'aciertos = 7\nplt.plot(umbrales, umbrales)\ntecho = 7\n',
    message: /`aciertos` tiene que ser un array de NumPy/,
  },
  {
    name: 'sin contar el None de la etiqueta',
    append:
      'aciertos = np.array([sum((int(m) if p >= u else None) == c for m, p, c in zip(mejor, punt, correctas) if c is not None) for u in umbrales])\nplt.plot(umbrales, aciertos)\ntecho = aciertos.max()\n',
    message: /`aciertos` no coincide con el recuento/,
  },
  {
    name: 'solo 100 umbrales',
    append:
      'aciertos = np.array([sum((int(m) if p >= u else None) == c for m, p, c in zip(mejor, punt, correctas)) for u in umbrales[:100]])\nplt.plot(umbrales[:100], aciertos)\ntecho = aciertos.max()\n',
    message: /`aciertos` tiene que tener 101 números/,
  },
]);

// ---------- ex02.5: un remedio, el código tiene que aparecer tal cual ----------

const CODIGO_OK = 'aciertos = sum(r == c for r, c in zip(respuestas, correctas))\n';
accepts('fallos-rag.ex02.5', [
  {
    name: 'una función auxiliar',
    append:
      'def vale(i):\n    return all(c in documentos[mejor[i]] for c in re.findall(patron, consultas[i]))\nrespuestas = [int(mejor[i]) if vale(i) else None for i in range(10)]\n' +
      CODIGO_OK,
  },
  {
    name: 'any y zip de consultas con mejor',
    append:
      'respuestas = []\nfor q, m in zip(consultas, mejor):\n    falta = any(c not in documentos[m] for c in re.findall(patron, q))\n    respuestas.append(None if falta else int(m))\naciertos = len([1 for r, c in zip(respuestas, correctas) if r == c])\n',
  },
  {
    name: 'una comparación de conjuntos',
    append:
      'respuestas = [int(m) if set(re.findall(patron, consultas[i])) <= set(re.findall(patron, documentos[m])) else None for i, m in enumerate(mejor)]\n' +
      CODIGO_OK,
  },
  {
    name: 'la lista escrita a mano',
    append: 'respuestas = [0, 1, 12, 5, 14, None, 3, 3, 15, 9]\naciertos = 8\n',
  },
]);
rejects('fallos-rag.ex02.5', [
  {
    name: 'sin remedio',
    append: 'respuestas = [int(m) for m in mejor]\n' + CODIGO_OK,
    message: /La consulta 5 pide el código CONG-2025/,
    notMessage: /Sin código no hay nada que exigir/,
  },
  {
    name: 'rechazar también las consultas sin código',
    append:
      'respuestas = []\nfor i, m in enumerate(mejor):\n    codigos = re.findall(patron, consultas[i])\n    if codigos and all(c in documentos[m] for c in codigos):\n        respuestas.append(int(m))\n    else:\n        respuestas.append(None)\n' +
      CODIGO_OK,
    message: /Sin código no hay nada que exigir/,
  },
  {
    name: 'aciertos sin contar el None correcto',
    append:
      'respuestas = [None if re.findall(patron, consultas[i]) and not all(c in documentos[m] for c in re.findall(patron, consultas[i])) else int(m) for i, m in enumerate(mejor)]\naciertos = sum(r == c for r, c in zip(respuestas, correctas) if r is not None)\n',
    message: /`aciertos` vale 7/,
    failures: 1,
  },
  {
    name: 'otro documento distinto del mejor',
    append: 'respuestas = [0] * 10\n' + CODIGO_OK,
    message: /cambia el documento de una consulta/,
  },
  {
    name: 'respuestas con decimales',
    append: 'respuestas = [float(m) for m in mejor]\n' + CODIGO_OK,
    message: /`respuestas` tiene números decimales/,
  },
  {
    name: 'aciertos como la lista de respuestas',
    append: 'respuestas = [0, 1, 12, 5, 14, None, 3, 3, 15, 9]\naciertos = respuestas\n',
    message: /`aciertos` tiene que ser un número entero/,
    failures: 1,
  },
]);

// ---------- banco: examen-3.filtro-capacidad ----------

accepts(FILTRO, [
  {
    name: 'los índices originales de los válidos',
    append:
      'validos = capacidad >= 250\ncosenos = D @ Q[2]\nelegido = np.arange(16)[validos][np.argmax(cosenos[validos])]\n',
  },
  {
    name: 'un bucle con max y key',
    append:
      'validos = capacidad >= 250\ncosenos = np.dot(D, Q[2])\nelegido = max((i for i in range(16) if validos[i]), key=lambda i: cosenos[i])\n',
  },
  {
    name: 'menos infinito en los no válidos',
    append:
      'validos = capacidad >= 250\ncosenos = (D * Q[2]).sum(axis=1)\nelegido = int(np.argmax(np.where(validos, cosenos, -np.inf)))\n',
  },
  {
    name: 'los candidatos con flatnonzero',
    append:
      'validos = capacidad >= 250\ncosenos = D @ Q[2]\ncandidatos = np.flatnonzero(validos)\nelegido = candidatos[np.argmax(cosenos[candidatos])]\n',
  },
]);
rejects(FILTRO, [
  {
    name: 'sin filtro',
    append: 'validos = capacidad >= 250\ncosenos = D @ Q[2]\nelegido = np.argmax(cosenos)\n',
    message: /`elegido` vale 12/,
    failures: 1,
  },
  {
    name: 'el filtro deja pasar también la sala pequeña',
    append:
      'validos = capacidad > 0\ncosenos = D @ Q[2]\nelegido = np.argmax(np.where(validos, cosenos, -1))\n',
    message: /`validos` deja pasar 2 documentos/,
    failures: 2,
  },
  {
    name: 'la posición dentro de los documentos filtrados',
    append:
      'validos = capacidad >= 250\ncosenos = D @ Q[2]\nelegido = np.argmax(cosenos[validos])\n',
    message: /`elegido` vale 0/,
    failures: 1,
  },
  {
    name: 'validos como posiciones y no como verdadero y falso',
    append: 'validos = np.where(capacidad >= 250)[0]\ncosenos = D @ Q[2]\nelegido = 4\n',
    message: /array de NumPy de verdadero y falso/,
    failures: 1,
  },
  {
    name: 'la consulta equivocada',
    append:
      'validos = capacidad >= 250\ncosenos = D @ Q[1]\nelegido = np.argmax(np.where(validos, cosenos, -1))\n',
    message: /con la consulta 2, la fila 2 de `Q`/,
    failures: 1,
  },
  {
    name: 'los cosenos de todas las consultas',
    append:
      'validos = capacidad >= 250\ncosenos = D @ Q.T\nelegido = np.argmax(np.where(validos, D @ Q[2], -1))\n',
    message: /`cosenos` tiene que tener 16 números/,
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

// ---------- las cifras de datos reales que cuenta el contenido, contra el módulo `embeddings` ----------

interface Facts {
  documentos: string[];
  consultas: string[];
  frases: string[];
  S: number[][];
  G: number[][];
  modelo: string;
  dimension: number;
  mejor: number[];
  aciertos: number[];
  sinUmbral: number;
}

const FACTS = String.raw`
import json
import numpy as np
import embeddings as e
S = e.Q @ e.D.T
G = e.F @ e.F.T
mejor = np.argmax(S, axis=1)
punt = np.max(S, axis=1)
corr = [0, 1, 4, 5, 14, None, 3, None, 15, 9]
curva = [sum((int(m) if p >= u else None) == c for m, p, c in zip(mejor, punt, corr)) for u in np.linspace(0, 1, 101)]
print(json.dumps({
    "documentos": e.documentos, "consultas": e.consultas, "frases": e.frases,
    "S": S.tolist(), "G": G.tolist(), "modelo": e.modelo, "dimension": e.dimension,
    "mejor": [int(m) for m in mejor], "aciertos": curva, "sinUmbral": curva[0],
}))
`;

/** «0,77» o «$0{,}77$» como número. */
const num = (s: string): number =>
  Number(s.replace('{,}', '.').replace(',', '.').replace(/\$/g, ''));
const round2 = (x: number): number => Math.round(x * 100) / 100;
const promptOf = (id: string): string => {
  const q = projectQuestions(fallosRag).find((x) => x.id === id);
  if (!q) throw new Error(`No existe ${id}`);
  return q.prompt;
};
const textsOf = (id: string): string => {
  const q = projectQuestions(fallosRag).find((x) => x.id === id);
  if (!q) throw new Error(`No existe ${id}`);
  return [q.prompt, q.explain, q.solution, ...q.hints].join('\n');
};

describe(
  'las cifras reales del contenido coinciden con el módulo embeddings',
  { timeout: 60_000 },
  () => {
    let f: Facts;
    beforeAll(async () => {
      const r = await runInPyodide(pyodide, FACTS);
      expect(r.error, describeRun(r)).toBeNull();
      f = JSON.parse(r.stdout) as Facts;
    });

    it('el modelo es paraphrase-multilingual-MiniLM-L12-v2 de 384 dimensiones', () => {
      // contract: src/python/embeddings.py: modelo y dimension del módulo
      expect(f.modelo).toBe('paraphrase-multilingual-MiniLM-L12-v2');
      expect(f.dimension).toBe(384);
    });

    it('los mejores documentos y sus cosenos (ex01.1, ex01.3 y el examen) son los del módulo', () => {
      // contract: hoja de datos: el mejor documento de cada consulta
      expect(f.mejor).toEqual([0, 1, 12, 5, 14, 13, 3, 3, 15, 9]);
      const best = f.S.map((row) => Math.max(...row));
      const lines = [...promptOf('fallos-rag.ex01.1').matchAll(/^- q(\d) «(.+)»: (\d,\d\d)$/gm)];
      expect(lines).toHaveLength(10);
      for (const [, i, text, score] of lines) {
        // contract: la consulta citada es la consulta i del módulo y su mejor coseno redondeado a dos decimales es el del enunciado
        expect(f.consultas[Number(i)]).toBe(text);
        expect(round2(best[Number(i)]!)).toBe(num(score!));
      }
      const rows = [
        ...promptOf('fallos-rag.ex01.3').matchAll(
          /^- q(\d): recupera d(\d+) con (\d,\d\d); correcto: (?:d(\d+)|ninguno)/gm,
        ),
      ];
      expect(rows).toHaveLength(10);
      const label = [0, 1, 4, 5, 14, null, 3, null, 15, 9];
      for (const [, i, d, score, ok] of rows) {
        // contract: el documento recuperado y su coseno son los del módulo, y la etiqueta es la de la hoja de datos
        expect(f.mejor[Number(i)]).toBe(Number(d));
        expect(round2(best[Number(i)]!)).toBe(num(score!));
        expect(ok === undefined ? null : Number(ok)).toBe(label[Number(i)]);
      }
      const exam = bankQ[1]!;
      for (const [, i, score] of exam.prompt.matchAll(/q(\d) (\$0\{,\}\d\d\$)/g)) {
        // contract: examen-3.umbral-alto cita los cosenos de q0 a q9 salvo q5 (que cita aparte, 0,86)
        expect(round2(best[Number(i)]!)).toBe(num(score!));
      }
      expect(round2(best[5]!)).toBe(0.86);
      // contract: hoja de datos: el coseno de q5 es el más alto de toda la tabla (ex02.1)
      expect(Math.max(...f.S.flat())).toBe(best[5]);
    });

    it('q2: los cuatro documentos de ex01.2, y la sala de 300 es el tercero (0,54)', () => {
      const rows = [...promptOf('fallos-rag.ex01.2').matchAll(/^- d(\d+) «(.+)»: (\d,\d\d)$/gm)];
      expect(rows.map((r) => Number(r[1]))).toEqual([12, 5, 4, 10]);
      for (const [, d, text, score] of rows) {
        // contract: texto del documento d y coseno con q2 redondeado a dos decimales
        expect(f.documentos[Number(d)]).toBe(text);
        expect(round2(f.S[2]![Number(d)]!)).toBe(num(score!));
      }
      // contract: hoja de datos: los cuatro cosenos más altos de q2 son d12, d5, d4 y d10, en ese orden
      const order = f.S[2]!.map((x, d) => [x, d] as const)
        .sort((a, b) => b[0] - a[0])
        .map(([, d]) => d);
      expect(order.slice(0, 4)).toEqual([12, 5, 4, 10]);
    });

    it('q4 recupera d14 con 0,62, el más alto, y d14 dice que el spa no está incluido', () => {
      // contract: hoja de datos: q4 → d14 con 0,618; d14 es «El spa no está incluido en la tarifa y se paga aparte.»
      expect(f.mejor[4]).toBe(14);
      expect(round2(f.S[4]![14]!)).toBe(0.62);
      expect(f.documentos[14]).toBe('El spa no está incluido en la tarifa y se paga aparte.');
      expect(f.consultas[4]).toBe('¿El spa está incluido en el precio?');
      expect(promptOf('fallos-rag.ex01.4')).toContain(f.documentos[14]!);
      expect(promptOf('fallos-rag.ex01.4')).toContain(f.consultas[4]!);
    });

    it('las frases: 0,57 la negación, 0,61 la paráfrasis y 0,84 «300 personas» con «30 personas»', () => {
      // contract: hoja de datos: frases f0·f1 = 0,574; f0·f2 = 0,608; f5·f6 = 0,839
      expect(f.frases[0]).toBe('El hotel admite mascotas.');
      expect(f.frases[1]).toBe('El hotel no admite mascotas.');
      expect(f.frases[2]).toBe('Se aceptan perros y gatos.');
      expect(round2(f.G[0]![1]!)).toBe(0.57);
      expect(round2(f.G[0]![2]!)).toBe(0.61);
      expect(f.frases[5]).toBe('La sala tiene capacidad para 300 personas.');
      expect(f.frases[6]).toBe('La sala tiene capacidad para 30 personas.');
      expect(round2(f.G[5]![6]!)).toBe(0.84);
      // contract: las tres cifras aparecen en el contenido donde se cuentan
      expect(textsOf('fallos-rag.ex00.4')).toContain('$0{,}57$');
      expect(textsOf('fallos-rag.ex00.4')).toContain('$0{,}61$');
      expect(textsOf('fallos-rag.ex01.2')).toContain('$0{,}84$');
      const [negacion] = bankQ;
      expect(negacion!.prompt).toContain(
        '«El hotel admite mascotas.» y «El hotel no admite mascotas.»',
      );
      expect(negacion!.prompt).toContain('$0{,}57$');
      expect(negacion!.prompt).toContain('$0{,}61$');
    });

    it('q1 puntúa 0,33 y q7 0,41; q5 y q7 no tienen su respuesta en la base (ex00.5, hoja 1)', () => {
      // contract: hoja de datos: mejor coseno de q1 (0,328) y de q7 (0,409)
      expect(round2(Math.max(...f.S[1]!))).toBe(0.33);
      expect(round2(Math.max(...f.S[7]!))).toBe(0.41);
      expect(textsOf('fallos-rag.ex00.5')).toContain('$0{,}33$');
      expect(textsOf('fallos-rag.ex00.5')).toContain('$0{,}41$');
      const sheet = fallosRag.sheets[0]!;
      expect(sheet.type === 'revision' ? sheet.lines.slice(0, 2).join(' ') : '').toMatch(
        /0,33.*0,41/,
      );
      // contract: la etiqueta de q1 es d1 («mascotas»); en la base no hay vuelos ni CONG-2025
      expect(f.documentos[1]).toMatch(/mascotas/);
      expect(f.documentos.some((d) => /vuelo/i.test(d))).toBe(false);
      expect(f.documentos.some((d) => d.includes('CONG-2025'))).toBe(false);
      expect(f.documentos[13]).toBe('El código de la tarifa para congresos es CONG-2026.');
    });

    it('ex01.1: los recuentos por umbral (10, 8, 6) y ex01.3: 6 aciertos con 0,35', () => {
      const best = f.S.map((row) => Math.max(...row));
      // contract: ex01.1: consultas cuyo mejor coseno alcanza 0,30, 0,45 y 0,60
      expect([0.3, 0.45, 0.6].map((u) => best.filter((b) => b >= u).length)).toEqual([10, 8, 6]);
      const label = [0, 1, 4, 5, 14, null, 3, null, 15, 9];
      const right = (u: number): number =>
        best.filter((b, i) => (b >= u ? f.mejor[i] : null) === label[i]).length;
      // contract: ex01.3: con 0,35 se contestan bien 6 de 10, y sin umbral 7
      expect(right(0.35)).toBe(6);
      expect(right(0)).toBe(7);
      // contract: examen-3.umbral-alto: con 0,87 nadie alcanza el umbral y se contestan bien 2 de 10
      expect(best.filter((b) => b >= 0.87)).toEqual([]);
      expect(right(0.87)).toBe(2);
    });

    it('ex02.2 y ex02.3: con 0,58, [0, None, 12, 5, 14, 13, 3, None, 15, None] y 6 aciertos', () => {
      const best = f.S.map((row) => Math.max(...row));
      const answers = best.map((b, i) => (b >= 0.58 ? f.mejor[i]! : null));
      // contract: ex02.2: respuestas con umbral 0,58 (q1, q7 y q9 quedan sin respuesta)
      expect(answers).toEqual([0, null, 12, 5, 14, 13, 3, null, 15, null]);
      const label = [0, 1, 4, 5, 14, null, 3, null, 15, 9];
      // contract: ex02.3: aciertos 6, falsos [5] y perdidas [1, 9], y los cuatro fallos suman 10 con los aciertos
      expect(answers.filter((a, i) => a === label[i])).toHaveLength(6);
      expect(answers.flatMap((a, i) => (label[i] === null && a !== null ? [i] : []))).toEqual([5]);
      expect(answers.flatMap((a, i) => (label[i] !== null && a === null ? [i] : []))).toEqual([
        1, 9,
      ]);
      expect(
        answers.flatMap((a, i) => (a !== null && label[i] !== null && a !== label[i] ? [i] : [])),
      ).toEqual([2]);
      // contract: el starter de ex02.3 lleva exactamente esas respuestas y esas etiquetas
      expect(question('fallos-rag.ex02.3').starter).toContain(
        'respuestas = [0, None, 12, 5, 14, 13, 3, None, 15, None]',
      );
      expect(question('fallos-rag.ex02.3').starter).toContain(
        'correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]',
      );
    });

    it('ex02.4: la curva no pasa de 7, con 6 entre 0,33 y 0,40, 7 entre 0,41 y 0,56 y 5 con 0,60', () => {
      // contract: solution de ex02.4: techo 7 (también con el umbral 0), 6 de 0,33 a 0,40 y 7 de 0,41 a 0,56
      expect(Math.max(...f.aciertos)).toBe(7);
      expect(f.sinUmbral).toBe(7);
      expect(f.aciertos.slice(33, 41)).toEqual(Array(8).fill(6));
      expect(f.aciertos.slice(41, 57)).toEqual(Array(16).fill(7));
      expect(f.aciertos[57]).toBe(6);
      expect(f.aciertos[60]).toBe(5);
      // contract: «nunca llega a 8»: q2 y q5 fallan con cualquier umbral
      expect(f.aciertos.filter((a) => a >= 8)).toEqual([]);
    });

    it('ex02.5: con el remedio de los códigos se acierta 8', () => {
      // contract: solution de ex02.5: el único código de las consultas es CONG-2025 y no está en d13 («…es CONG-2026.»)
      const codes = f.consultas.flatMap((c) => c.match(/[A-Z]+-\d+/g) ?? []);
      expect(codes).toEqual(['CONG-2025']);
      expect(f.documentos[13]).toContain('CONG-2026');
      expect(f.documentos[13]).not.toContain('CONG-2025');
      const answers = f.mejor.map((m, i) => (i === 5 ? null : m));
      const label = [0, 1, 4, 5, 14, null, 3, null, 15, 9];
      expect(answers).toEqual([0, 1, 12, 5, 14, null, 3, 3, 15, 9]);
      expect(answers.filter((a, i) => a === label[i])).toHaveLength(8);
    });

    it('examen-3.filtro-capacidad: la capacidad de d4 y d5, y los cosenos de q2', () => {
      // contract: documentos del módulo: d4 «…capacidad para 300 personas…», d5 «…capacidad para 30 personas…»
      expect(f.documentos[4]).toMatch(/capacidad para 300 personas/);
      expect(f.documentos[5]).toMatch(/capacidad para 30 personas/);
      expect(f.documentos.filter((d) => /capacidad para/.test(d))).toHaveLength(2);
      // contract: solution del examen: d12 0,64, d5 0,61 y d4 0,54 con la consulta 2
      expect([12, 5, 4].map((d) => round2(f.S[2]![d]!))).toEqual([0.64, 0.61, 0.54]);
      expect(f.consultas[2]).toBe('¿Hay una sala para 250 asistentes?');
    });

    it('hojas: los cosenos de la hoja 3 y el resultado de la hoja 2', async () => {
      // contract: hoja 3 repite los cosenos de q2: 0,61 con la sala de 30 y 0,54 con la de 300, y 0,84 entre «300 personas» y «30 personas»
      const sheet = fallosRag.sheets[2]!;
      const lines = sheet.type === 'revision' ? sheet.lines.join(' ') : '';
      expect(lines).toContain('0,61');
      expect(lines).toContain('0,54');
      expect(lines).toContain('0,84');
      expect(round2(f.S[2]![5]!)).toBe(0.61);
      expect(round2(f.S[2]![4]!)).toBe(0.54);
      // contract: hoja 2: con `not r` el resultado es [0, 1, 7] en vez de [1, 7], porque q0 recupera el documento 0
      const sheet2 = fallosRag.sheets[1]!;
      const body = sheet2.type === 'revision' ? sheet2.lines : [];
      const run = async (line: string): Promise<string> => {
        const r = await runInPyodide(
          pyodide,
          `import numpy as np\nfrom embeddings import D, Q\n${body.slice(0, 3).join('\n')}\n${line}\nprint(sin_respuesta)`,
        );
        expect(r.error, describeRun(r)).toBeNull();
        return r.stdout.trim();
      };
      expect(await run(body[3]!)).toBe('[0, 1, 7]');
      expect(await run('sin_respuesta = [i for i, r in enumerate(respuestas) if r is None]')).toBe(
        '[1, 7]',
      );
    });
  },
);

// ---------- pistas de las preguntas de código ----------

/** Lo que el jugador escribe en cada hueco `___` del esqueleto de la última pista, en orden. */
const SKELETON_FILLS: Record<string, string[]> = {
  'fallos-rag.ex02.1': ['@', 'argmax', '1', 'max', '1'],
  'fallos-rag.ex02.2': ['>=', 'None', 'count'],
  'fallos-rag.ex02.3': ['==', 'is', 'is not', 'is not', 'is'],
  'fallos-rag.ex02.4': ['umbrales', '>=', '==', 'umbrales', 'aciertos', 'max'],
  'fallos-rag.ex02.5': ['m', 'None', '=='],
};

defineHintTests(
  projectQuestions(fallosRag).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);
