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
import { vecinos } from './vecinos';
import { examen3Vecinos } from './examen-3-vecinos';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia, los errores típicos
// y cada cifra de datos reales que aparece en el contenido, contra el módulo `embeddings`.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen3Vecinos
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [...projectQuestions(vecinos).filter((q): q is CodigoQ => q.type === 'codigo'), ...bankCode].map(
    (q) => [q.id, q],
  ),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const BERLIN = 'examen-3.vecinos-berlin';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo común de la Órbita 3: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([...[1, 2, 3, 4, 5].map((n) => `vecinos.ex02.${n}`), BERLIN]);
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

// ---------- ex02.1: D @ q y la posición del mejor ----------

accepts('vecinos.ex02.1', [
  { name: 'np.dot', append: 'punt = np.dot(D, q)\nmejor = np.argmax(punt)\n' },
  { name: 'el método dot y argmax', append: 'punt = D.dot(q)\nmejor = punt.argmax()\n' },
  { name: 'q @ D.T', append: 'punt = q @ D.T\nmejor = int(np.argmax(punt))\n' },
  { name: 'Q[1] directamente', append: 'punt = D @ Q[1]\nmejor = np.argmax(punt)\n' },
  {
    name: 'multiplicar y sumar por filas',
    append: 'punt = (D * q).sum(axis=1)\nmejor = np.argmax(punt)\n',
  },
  {
    name: 'fila a fila y búsqueda en la lista',
    append:
      'punt = np.array([np.dot(fila, q) for fila in D])\nmejor = list(punt).index(max(punt))\n',
  },
]);
rejects('vecinos.ex02.1', [
  {
    name: 'D * q sin sumar',
    append: 'punt = D * q\nmejor = 1\n',
    message: /matriz de 16 filas y 384 columnas: `D \* q` multiplica componente a componente/,
    failures: 1,
  },
  {
    name: 'np.argmin',
    append: 'punt = D @ q\nmejor = np.argmin(punt)\n',
    message: /`mejor` es la posición del documento que menos puntúa/,
    failures: 1,
  },
  {
    name: 'la puntuación más alta en vez de su posición',
    append: 'punt = D @ q\nmejor = np.max(punt)\n',
    message: /`mejor` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'mejor es un decimal',
    append: 'punt = D @ q\nmejor = 1.0\n',
    message: /`mejor` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'el segundo documento en vez del primero',
    append: 'punt = D @ q\nmejor = int(np.argsort(punt)[-2])\n',
    message: /`mejor` tiene que ser la posición del documento con la puntuación más alta/,
    failures: 1,
  },
  {
    name: 'suma de cada fila sin multiplicar por q',
    append: 'punt = D.sum(axis=1)\nmejor = 1\n',
    message: /`punt` tiene que ser el producto escalar de cada fila de `D` con `q`/,
    failures: 1,
  },
  {
    name: 'suma por columnas',
    append: 'punt = D.sum(axis=0)\nmejor = 1\n',
    message: /`punt` tiene que tener 16 números/,
    failures: 1,
  },
  {
    name: 'punt es una lista de Python',
    append: 'punt = list(D @ q)\nmejor = 1\n',
    message: /`punt` tiene que ser un array de NumPy con números/,
    failures: 1,
  },
]);

// ---------- ex02.2: top_k ----------

accepts('vecinos.ex02.2', [
  {
    name: 'ordenar y dar la vuelta',
    append: 'def top_k(M, q, k):\n    return np.argsort(M @ q)[::-1][:k]\n',
  },
  {
    name: 'una lista de posiciones',
    append: 'def top_k(M, q, k):\n    return list(np.argsort(-(M @ q))[:k])\n',
  },
  {
    name: 'signo menos sobre la matriz',
    append: 'def top_k(M, q, k):\n    return np.argsort(-M @ q)[:k]\n',
  },
  {
    name: 'sorted con una clave',
    append:
      'def top_k(M, q, k):\n    return sorted(range(len(M)), key=lambda i: -(M[i] @ q))[:k]\n',
  },
  {
    name: 'por distancia, que con filas unitarias ordena igual',
    append: 'def top_k(M, q, k):\n    return np.argsort(np.linalg.norm(M - q, axis=1))[:k]\n',
  },
  {
    name: 'con el coseno completo',
    append:
      'def top_k(M, q, k):\n    s = M @ q / (np.linalg.norm(M, axis=1) * np.linalg.norm(q))\n    return np.argsort(-s)[:k]\n',
  },
  {
    name: 'np.argpartition y orden de los k elegidos',
    append:
      'def top_k(M, q, k):\n    s = M @ q\n    idx = np.argpartition(-s, k - 1)[:k]\n    return idx[np.argsort(-s[idx])]\n',
  },
]);
rejects('vecinos.ex02.2', [
  {
    name: 'los k peores',
    append: 'def top_k(M, q, k):\n    return np.argsort(M @ q)[:k]\n',
    message: /los `k` documentos que menos puntúan/,
    failures: 1,
  },
  {
    name: 'los k mejores en orden contrario',
    append: 'def top_k(M, q, k):\n    return np.argsort(M @ q)[-k:]\n',
    message: /los `k` mejores pero en orden contrario/,
    failures: 1,
  },
  {
    name: 'las puntuaciones en vez de las posiciones',
    append: 'def top_k(M, q, k):\n    return np.sort(M @ q)[::-1][:k]\n',
    message: /números decimales/,
    failures: 1,
  },
  {
    name: 'todas las posiciones, sin cortar',
    append: 'def top_k(M, q, k):\n    return np.argsort(-(M @ q))\n',
    message: /exactamente 3 posiciones/,
    failures: 1,
  },
  {
    name: 'siempre 3, sin usar k',
    append: 'def top_k(M, q, k):\n    return np.argsort(-(M @ q))[:3]\n',
    message: /con cualquier `k`/,
    failures: 1,
  },
  {
    name: 'solo la mejor',
    append: 'def top_k(M, q, k):\n    return np.argmax(M @ q)\n',
    message: /una lista o un array de NumPy con posiciones/,
    failures: 1,
  },
  {
    name: 'sin return',
    append: 'def top_k(M, q, k):\n    s = M @ q\n',
    message: /falta el `return`/,
    failures: 1,
  },
]);

// ---------- ex02.3: puntuaciones, figura, mejores y textos ----------

accepts('vecinos.ex02.3', [
  {
    name: 'barras con los textos como etiquetas',
    append:
      'punt = D @ q\nplt.bar(documentos, punt)\nmejores = top_k(D, q, 3)\ntextos = [documentos[j] for j in mejores]\n',
  },
  {
    name: 'ordenando a mano, listas de enteros y np.array para los textos',
    append:
      'punt = np.dot(D, q)\nplt.bar(np.arange(16), punt)\nmejores = list(np.argsort(punt)[::-1][:3])\ntextos = list(np.array(documentos)[mejores])\n',
  },
  {
    name: 'figura antes de calcular los mejores y enteros de Python',
    append:
      'punt = D @ q\nplt.figure()\nplt.bar(range(len(punt)), punt)\nmejores = [int(j) for j in top_k(D, q, 3)]\ntextos = [documentos[j] for j in mejores]\n',
  },
]);
rejects('vecinos.ex02.3', [
  {
    name: 'los tres peores',
    append:
      'punt = D @ q\nplt.bar(range(16), punt)\nmejores = np.argsort(punt)[:3]\ntextos = [documentos[j] for j in mejores]\n',
    message: /`mejores` tiene los 3 documentos que menos puntúan/,
  },
  {
    name: 'los tres mejores en orden contrario',
    append:
      'punt = D @ q\nplt.bar(range(16), punt)\nmejores = np.argsort(punt)[-3:]\ntextos = [documentos[j] for j in mejores]\n',
    message: /`mejores` tiene los documentos buenos pero en orden contrario/,
  },
  {
    name: 'las puntuaciones en vez de las posiciones',
    append:
      'punt = D @ q\nplt.bar(range(16), punt)\nmejores = np.sort(punt)[::-1][:3]\ntextos = [documentos[0]] * 3\n',
    message: /`mejores` tiene números decimales/,
  },
  {
    name: 'textos son posiciones',
    append:
      'punt = D @ q\nplt.bar(range(16), punt)\nmejores = top_k(D, q, 3)\ntextos = list(mejores)\n',
    message: /una lista de 3 frases, no de posiciones/,
    failures: 1,
  },
  {
    name: 'textos es una sola frase',
    append:
      'punt = D @ q\nplt.bar(range(16), punt)\nmejores = top_k(D, q, 3)\ntextos = documentos[3]\n',
    message: /`textos` tiene que ser una lista con las frases de los 3 documentos/,
    failures: 1,
  },
  {
    name: 'textos en orden contrario',
    append:
      'punt = D @ q\nplt.bar(range(16), punt)\nmejores = top_k(D, q, 3)\ntextos = [documentos[j] for j in mejores][::-1]\n',
    message: /de la que más puntúa a la que menos/,
    failures: 1,
  },
  {
    name: 'sin figura',
    append: 'punt = D @ q\nmejores = top_k(D, q, 3)\ntextos = [documentos[j] for j in mejores]\n',
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'barras con las puntuaciones cambiadas de signo',
    append:
      'punt = D @ q\nplt.bar(range(16), -punt)\nmejores = top_k(D, q, 3)\ntextos = [documentos[j] for j in mejores]\n',
    message: /La altura de cada barra tiene que ser la puntuación/,
    failures: 1,
  },
  {
    name: 'solo las barras de los tres mejores',
    append:
      'punt = D @ q\nmejores = top_k(D, q, 3)\nplt.bar(range(3), punt[mejores])\ntextos = [documentos[j] for j in mejores]\n',
    message: /barras de más o de menos/,
    failures: 1,
  },
  {
    name: 'punt es la matriz sin sumar',
    append:
      'punt = D * q\nplt.bar(range(16), D @ q)\nmejores = top_k(D, q, 3)\ntextos = [documentos[j] for j in mejores]\n',
    message: /`punt` tiene que ser un array de NumPy con 16 números/,
    failures: 1,
  },
]);

// ---------- ex02.4: los vecinos de «Lisboa» sin ella ----------

accepts('vecinos.ex02.4', [
  {
    name: 'dejando a Lisboa fuera de las puntuaciones',
    append: 's = P @ q\ns[i] = -np.inf\nvecinos = [palabras[j] for j in np.argsort(-s)[:3]]\n',
  },
  {
    name: 'filtrando la propia posición',
    append: 'vecinos = [palabras[j] for j in top_k(P, q, 4) if j != i][:3]\n',
  },
  {
    name: 'quitándola de la lista de posiciones',
    append:
      'orden = list(top_k(P, q, 4))\norden.remove(i)\nvecinos = [palabras[j] for j in orden]\n',
  },
  {
    name: 'un array de palabras',
    append: 'vecinos = np.array(palabras)[top_k(P, q, 4)[1:]]\n',
  },
  { name: 'una tupla', append: 'vecinos = tuple(palabras[j] for j in top_k(P, q, 4)[1:])\n' },
  { name: 'escrito a mano', append: "vecinos = ['Portugal', 'París', 'España']\n" },
]);
rejects('vecinos.ex02.4', [
  {
    name: 'sin quitar a Lisboa',
    append: 'vecinos = [palabras[j] for j in top_k(P, q, 3)]\n',
    message: /«Lisboa» está entre sus propios resultados/,
    failures: 1,
  },
  {
    name: 'posiciones en vez de palabras',
    append: 'vecinos = list(top_k(P, q, 4)[1:])\n',
    message: /palabras y no números/,
    failures: 1,
  },
  {
    name: 'las tres buenas en orden contrario',
    append: 'vecinos = [palabras[j] for j in top_k(P, q, 4)[1:]][::-1]\n',
    message: /en orden contrario/,
    failures: 1,
  },
  {
    name: 'las tres menos parecidas',
    append: 'vecinos = [palabras[j] for j in np.argsort(P @ q)[:3]]\n',
    message: /las 3 palabras menos parecidas/,
    failures: 1,
  },
  {
    name: 'solo dos palabras',
    append: 'vecinos = [palabras[j] for j in top_k(P, q, 3)[1:]]\n',
    message: /exactamente 3 palabras/,
    failures: 1,
  },
  {
    name: 'una sola palabra, no una lista',
    append: "vecinos = 'Portugal'\n",
    message: /tiene que ser una lista con las 3 palabras/,
    failures: 1,
  },
]);

// ---------- ex02.5: recall@k ----------

const RECALL_MASK = `def recall(k):
    hits = 0
    for pais, capital in pares:
        i = palabras.index(pais)
        s = P @ P[i]
        s[i] = -np.inf
        if palabras.index(capital) in np.argsort(-s)[:k]:
            hits += 1
    return hits / len(pares)
`;

accepts('vecinos.ex02.5', [
  {
    name: 'dejando al país fuera de las puntuaciones',
    append: `${RECALL_MASK}r1 = recall(1)\nr5 = recall(5)\n`,
  },
  {
    name: 'filtrando la posición del país',
    append: `def recall(k):
    hits = 0
    for pais, capital in pares:
        i = palabras.index(pais)
        cercanas = [palabras[j] for j in top_k(P, P[i], k + 1) if j != i][:k]
        hits += capital in cercanas
    return hits / len(pares)


r1 = recall(1)
r5 = recall(5)
`,
  },
  {
    name: 'una suma con comprensión',
    append: `def recall(k):
    return sum(capital in [palabras[j] for j in top_k(P, P[palabras.index(pais)], k + 1)[1:]] for pais, capital in pares) / 5


r1 = recall(1)
r5 = recall(5)
`,
  },
  {
    name: 'r1 y r5 escritos a mano, con recall bien',
    append: `${RECALL_MASK}r1 = 0.8\nr5 = 1.0\n`,
  },
]);
rejects('vecinos.ex02.5', [
  {
    name: 'sin quitar al país',
    append: `def recall(k):
    hits = 0
    for pais, capital in pares:
        i = palabras.index(pais)
        if capital in [palabras[j] for j in top_k(P, P[i], k)]:
            hits += 1
    return hits / len(pares)


r1 = recall(1)
r5 = recall(5)
`,
    message: /`recall\(1\)` vale 0/,
    failures: 1,
  },
  {
    name: 'un recuento en vez de una fracción',
    append:
      RECALL_MASK.replace('return hits / len(pares)', 'return hits') +
      'r1 = recall(1)\nr5 = recall(5)\n',
    message: /`recall\(1\)` vale más de 1/,
    failures: 1,
  },
  {
    name: 'la precisión en vez del recall',
    append:
      RECALL_MASK.replace('return hits / len(pares)', 'return hits / (k * len(pares))') +
      'r1 = recall(1)\nr5 = recall(5)\n',
    message: /Prueba con `recall\(2\)`/,
    failures: 1,
  },
  {
    name: 'r1 y r5 con el mismo k',
    append: `${RECALL_MASK}r1 = recall(5)\nr5 = recall(5)\n`,
    message: /`r1` y `r5` tienen que ser `recall\(1\)` y `recall\(5\)`/,
    failures: 1,
  },
  {
    name: 'r1 y r5 son textos',
    append: `${RECALL_MASK}r1 = '0.8'\nr5 = '1'\n`,
    message: /`r1` y `r5` tienen que ser números/,
    failures: 1,
  },
  {
    name: 'recall sin return',
    append: 'def recall(k):\n    hits = 0\n\n\nr1 = recall(1)\nr5 = recall(5)\n',
    message: /falta el `return`/,
  },
]);

// ---------- examen-3.vecinos-berlin ----------

accepts(BERLIN, [
  {
    name: 'dejando a Berlín fuera de las puntuaciones',
    append: 's = P @ q\ns[i] = -np.inf\nvecinos2 = [palabras[j] for j in np.argsort(-s)[:2]]\n',
  },
  {
    name: 'filtrando la propia posición',
    append: 'vecinos2 = [palabras[j] for j in top_k(P, q, 3) if j != i][:2]\n',
  },
  { name: 'escrito a mano', append: "vecinos2 = ['Alemania', 'París']\n" },
]);
rejects(BERLIN, [
  {
    name: 'sin quitar a Berlín',
    append: 'vecinos2 = [palabras[j] for j in top_k(P, q, 2)]\n',
    message: /«Berlín» está entre sus propios resultados/,
    failures: 1,
  },
  {
    name: 'posiciones en vez de palabras',
    append: 'vecinos2 = list(top_k(P, q, 3)[1:])\n',
    message: /palabras y no números/,
    failures: 1,
  },
  {
    name: 'en orden contrario',
    append: 'vecinos2 = [palabras[j] for j in top_k(P, q, 3)[1:]][::-1]\n',
    message: /en orden contrario/,
    failures: 1,
  },
  {
    name: 'las dos menos parecidas',
    append: 'vecinos2 = [palabras[j] for j in np.argsort(P @ q)[:2]]\n',
    message: /las 2 palabras menos parecidas/,
    failures: 1,
  },
  {
    name: 'una sola palabra',
    append: 'vecinos2 = [palabras[j] for j in top_k(P, q, 2)[1:]]\n',
    message: /exactamente 2 palabras/,
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

// ---------- cifras de datos reales: cada una que aparece en el contenido se comprueba contra el módulo ----------

interface Facts {
  modelo: string;
  dimension: number;
  consultas: Record<number, string>;
  documentos: Record<number, string>;
  q1: { top: number[]; scores: number[] };
  q6: { top: number[]; scores: number[] };
  q9: { top: number[]; scores: number[] };
  lisboa: { vecinos: string[]; scores: number[]; propia: number };
  berlin: { vecinos: string[]; scores: number[] };
  hombreVecino: number;
  recall: Record<string, number>;
  espana: { primero: string; scorePrimero: number; puestoMadrid: number; scoreMadrid: number };
}

const FACTS_CODE = `
import json
import numpy as np
import embeddings as e

def top(M, q, k):
    return np.argsort(-(M @ q))[:k]

def sc(M, q, idx):
    return [round(float((M @ q)[j]), 4) for j in idx]

def vec(palabra, n):
    i = e.palabras.index(palabra)
    s = e.P @ e.P[i]
    idx = [int(j) for j in np.argsort(-s) if int(j) != i][:n]
    return [e.palabras[j] for j in idx], [round(float(s[j]), 4) for j in idx], round(float(s[i]), 4)

def consulta(n):
    idx = [int(j) for j in top(e.D, e.Q[n], 3)]
    return {"top": idx, "scores": sc(e.D, e.Q[n], idx)}

lis = vec("Lisboa", 3)
ber = vec("Berlín", 2)
pares = [("Francia", "París"), ("España", "Madrid"), ("Italia", "Roma"), ("Alemania", "Berlín"), ("Portugal", "Lisboa")]

def recall(k):
    return sum(c in vec(p, k)[0] for p, c in pares) / len(pares)

h = e.palabras.index("hombre")
hv = 0
for i, p in enumerate(e.palabras):
    if i != h:
        v = vec(p, 5)[0]
        hv += "hombre" in v

esp = vec("España", 31)
print(json.dumps({
    "modelo": e.modelo,
    "dimension": e.dimension,
    "consultas": {n: e.consultas[n] for n in (1, 6, 9)},
    "documentos": {n: e.documentos[n] for n in (1, 3, 7, 9, 15)},
    "q1": consulta(1), "q6": consulta(6), "q9": consulta(9),
    "lisboa": {"vecinos": lis[0], "scores": lis[1], "propia": lis[2]},
    "berlin": {"vecinos": ber[0], "scores": ber[1]},
    "hombreVecino": hv,
    "recall": {str(k): recall(k) for k in (1, 2, 3, 4, 5)},
    "espana": {"primero": esp[0][0], "scorePrimero": esp[1][0], "puestoMadrid": esp[0].index("Madrid") + 1, "scoreMadrid": esp[1][esp[0].index("Madrid")]},
}))
`;

describe(
  'cifras de datos reales del contenido, contra el módulo embeddings',
  { timeout: 60_000 },
  () => {
    let facts: Facts;
    beforeAll(async () => {
      const r = await runInPyodide(pyodide, FACTS_CODE);
      expect(r.error, describeRun(r)).toBeNull();
      facts = JSON.parse(r.stdout) as Facts;
    }, PYODIDE_LOAD_TIMEOUT_MS);

    /** Una cifra del contenido tiene dos decimales: coincide con el dato real salvo el redondeo. */
    const near = (real: number, shown: number): boolean => Math.abs(real - shown) <= 0.0051;

    it('el modelo y la dimensión son los que dice el contenido', () => {
      // contract: encargo común de la Órbita 3: el modelo es paraphrase-multilingual-MiniLM-L12-v2 y da 384 dimensiones
      expect(facts.modelo).toBe('paraphrase-multilingual-MiniLM-L12-v2');
      expect(facts.dimension).toBe(384);
    });

    it('las consultas y los documentos citados son los del módulo', () => {
      // contract: hoja de datos del módulo embeddings: q1, q6 y q9 son las consultas «perro», «aparcar» y «aeropuerto»; d3, d7, d9 son aparcamiento, wifi y aeropuerto
      expect(facts.consultas[1]).toBe('¿Puedo llevar a mi perro?');
      expect(facts.consultas[6]).toBe('¿Cuánto cuesta aparcar el coche?');
      expect(facts.consultas[9]).toBe('¿Cómo llego desde el aeropuerto?');
      expect(facts.documentos[9]).toBe('El hotel está a 20 minutos del aeropuerto en taxi.');
      expect(facts.documentos[3]).toBe(
        'El aparcamiento cuesta 25 euros al día y hay que reservarlo con antelación.',
      );
      expect(facts.documentos[7]).toBe('La conexión wifi es gratuita en todo el hotel.');
      expect(facts.documentos[1]).toBe(
        'El hotel admite mascotas de menos de 10 kilos con un suplemento de 20 euros por noche.',
      );
      expect(facts.documentos[15]).toBe('En las habitaciones no se puede fumar.');
    });

    it('ex02.1: la consulta del perro gana con el documento de las mascotas (0,33) y el siguiente es el de fumar (0,17)', () => {
      // contract: solution de ex02.1: mejor = 1 con coseno 0,33; el segundo, la prohibición de fumar (documento 15), 0,17
      expect(facts.q1.top.slice(0, 2)).toEqual([1, 15]);
      expect(near(facts.q1.scores[0]!, 0.33)).toBe(true);
      expect(near(facts.q1.scores[1]!, 0.17)).toBe(true);
    });

    it('ex02.2 y ex02.3: top_k(D, Q[6], 3) es [3, 9, 1] con cosenos 0,59, 0,30 y 0,28', () => {
      // contract: solution de ex02.2 y ex02.3: el aparcamiento (0,59), el aeropuerto (0,30) y las mascotas (0,28)
      expect(facts.q6.top).toEqual([3, 9, 1]);
      expect(facts.q6.scores.map((s, i) => near(s, [0.59, 0.3, 0.28][i]!))).toEqual([
        true,
        true,
        true,
      ]);
    });

    it('ex01.5: la pregunta del aeropuerto da 0,56, 0,24 y 0,24 con los documentos 9, 3 y 7', () => {
      // contract: prompt de ex01.5: aeropuerto en taxi (0,56), aparcamiento (0,24) y wifi (0,24)
      expect(facts.q9.top).toEqual([9, 3, 7]);
      expect(facts.q9.scores.map((s, i) => near(s, [0.56, 0.24, 0.24][i]!))).toEqual([
        true,
        true,
        true,
      ]);
    });

    it('ex02.4: los vecinos de «Lisboa» son Portugal (0,87), París (0,76) y España (0,73), y ella misma da 1', () => {
      // contract: solution de ex02.4: vecinos = ['Portugal', 'París', 'España'] con 0,87, 0,76 y 0,73; el coseno consigo misma es 1
      expect(facts.lisboa.vecinos).toEqual(['Portugal', 'París', 'España']);
      expect(facts.lisboa.scores.map((s, i) => near(s, [0.87, 0.76, 0.73][i]!))).toEqual([
        true,
        true,
        true,
      ]);
      expect(facts.lisboa.propia).toBeCloseTo(1, 3);
    });

    it('ex02.4: «hombre» está entre los 5 vecinos de 14 de las otras 31 palabras', () => {
      // contract: solution de ex02.4: «hombre» sale entre los 5 vecinos de 14 de las otras 31 palabras
      expect(facts.hombreVecino).toBe(14);
    });

    it('ex02.5: recall@1 = 0,8 y recall@5 = 1; para España gana «Lisboa» (0,73) y «Madrid» (0,72) es la quinta', () => {
      // contract: solution de ex02.5: r1 = 0,8 (falla España) y r5 = 1; el recall nunca baja al subir k
      expect(facts.recall['1']).toBe(0.8);
      expect(facts.recall['5']).toBe(1);
      const ks = [1, 2, 3, 4, 5].map((k) => facts.recall[String(k)]!);
      expect(ks).toEqual([...ks].sort((a, b) => a - b));
      // contract: solution de ex02.5: el vecino más cercano de España es «Lisboa» (0,73) y «Madrid» (0,72) es solo el quinto
      expect(facts.espana.primero).toBe('Lisboa');
      expect(near(facts.espana.scorePrimero, 0.73)).toBe(true);
      expect(facts.espana.puestoMadrid).toBe(5);
      expect(near(facts.espana.scoreMadrid, 0.72)).toBe(true);
    });

    it('examen-3.vecinos-berlin: los vecinos de «Berlín» son Alemania (0,79) y París (0,67)', () => {
      // contract: solution de examen-3.vecinos-berlin: vecinos2 = ['Alemania', 'París'] con 0,79 y 0,67
      expect(facts.berlin.vecinos).toEqual(['Alemania', 'París']);
      expect(facts.berlin.scores.map((s, i) => near(s, [0.79, 0.67][i]!))).toEqual([true, true]);
    });
  },
);
