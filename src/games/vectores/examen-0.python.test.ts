import { beforeAll, describe, expect, it } from 'vitest';
import { drawExam } from '../../content/exam';
import { resolve } from '../../content/generators';
import type { CodigoQ, Question } from '../../content/schema';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  describeRun,
  getPyodide,
} from '../../../tests/content/python-helpers';
import {
  NUMPY_ENGLISH,
  defineProseTests,
  garbageProbes,
} from '../../../tests/content/prose-helpers';
import { examen0 } from './examen-0';
import { vectores } from './index';

// Banco de examen de la Órbita 0 (tarea 18a): su forma, sus textos (reglas de prosa de
// tests/content/prose-helpers.ts) y sus dos preguntas de código en Pyodide, con soluciones
// correctas distintas de la de referencia y errores típicos. Lanzar desde la raíz del repo
// (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const entriesOf = (project: string) => examen0.filter((e) => e.project === project);
const fixed = (): Question[] =>
  examen0.flatMap((e) => (e.question.type === 'generada' ? [] : [e.question]));
const entry = (id: string) => {
  const e = examen0.find((x) => x.question.id === id);
  if (!e) throw new Error(`No existe la entrada ${id}`);
  return e.question;
};

describe('forma del banco', () => {
  it('lleva cuatro entradas por proyecto, en el orden de la órbita', () => {
    // contract: brief de la tarea 18, tabla «Banco»: 4 entradas por proyecto
    expect(
      ['componentes', 'suma-escala', 'norma-distancia'].map((p) => entriesOf(p).length),
    ).toEqual([4, 4, 4]);
    // contract: brief de la tarea 18: solo hay entradas de esos tres proyectos
    expect(examen0).toHaveLength(12);
  });

  it('componentes: generada desplazamiento, opcion, vector y codigo', () => {
    // contract: brief de la tarea 18, tabla «Banco», fila componentes
    expect(entriesOf('componentes').map((e) => e.question.type)).toEqual([
      'generada',
      'opcion',
      'vector',
      'codigo',
    ]);
    const g = entriesOf('componentes')[0]!.question;
    // contract: brief de la tarea 18, tabla «Banco»: la generada de componentes es desplazamiento
    expect(g.type === 'generada' && g.generator).toBe('desplazamiento');
  });

  it('suma-escala: suma, combinacion, centroide y codigo', () => {
    // contract: brief de la tarea 18, tabla «Banco», fila suma-escala
    expect(
      entriesOf('suma-escala').map((e) =>
        e.question.type === 'generada' ? e.question.generator : e.question.type,
      ),
    ).toEqual(['suma', 'combinacion', 'centroide', 'codigo']);
  });

  it('norma-distancia: norma con dim 2, norma con dim 3, distancia y unitario', () => {
    const qs = entriesOf('norma-distancia').map((e) => e.question);
    // contract: brief de la tarea 18, tabla «Banco», fila norma-distancia
    expect(qs.map((q) => (q.type === 'generada' ? q.generator : q.type))).toEqual([
      'norma',
      'norma',
      'distancia',
      'unitario',
    ]);
    // contract: brief de la tarea 18: norma con dim 2 y norma con dim 3
    expect(qs.map((q) => (q.type === 'generada' ? q.params['dim'] : undefined))).toEqual([
      2,
      3,
      undefined,
      undefined,
    ]);
  });

  it('las preguntas fijas llevan las respuestas de la tabla', () => {
    const forma = entry('examen-0.forma');
    // contract: brief de la tarea 18: la forma de np.array([[1, 2], [3, 4], [5, 6]]) es (3, 2)
    expect(forma.type === 'opcion' && forma.options[forma.correct]).toBe('`(3, 2)`');
    const dibujado = entry('examen-0.dibujado');
    // contract: brief de la tarea 18: las componentes del vector dibujado son (-5, 2)
    expect(dibujado.type === 'vector' && dibujado.answer).toEqual([-5, 2]);
    // contract: brief de la tarea 18: el vector dibujado es el del plano y no es móvil
    expect(dibujado.type === 'vector' && dibujado.plane?.vectors).toEqual([
      { id: 'w', label: 'w', x: -5, y: 2, movable: false },
    ]);
  });

  it('con las semillas 1 a 30, un examen tiene 6 preguntas y dos de cada proyecto', () => {
    const orbit = vectores.orbits[0]!;
    for (let seed = 1; seed <= 30; seed++) {
      const exam = drawExam(orbit, seed);
      // contract: spec del motor: examen de 6 preguntas, 2 por proyecto con tres proyectos
      expect(exam).toHaveLength(6);
      expect(
        ['componentes', 'suma-escala', 'norma-distancia'].map(
          (p) => exam.filter((e) => e.project === p).length,
        ),
      ).toEqual([2, 2, 2]);
    }
  });
});

// Reglas de prosa del banco: las preguntas fijas, y las generadas ya resueltas con varias semillas.
defineProseTests('banco examen-0 (fijas)', fixed());
defineProseTests(
  'banco examen-0 (generadas, semillas 1 a 10)',
  examen0.flatMap((e) =>
    e.question.type === 'generada'
      ? Array.from({ length: 10 }, (_, i) => resolve(e.question as never, i + 1))
      : [],
  ),
);

const codeQuestion = (id: string): CodigoQ => {
  const q = entry(id);
  if (q.type !== 'codigo') throw new Error(`${id} no es de código`);
  return q;
};

describe('referencia y starter de las preguntas de código del banco', { timeout: 60_000 }, () => {
  it('hay dos preguntas de código, una en componentes y otra en suma-escala', () => {
    // contract: brief de la tarea 18, tabla «Banco»: un codigo en componentes y otro en suma-escala
    expect(examen0.filter((e) => e.question.type === 'codigo').map((e) => e.project)).toEqual([
      'componentes',
      'suma-escala',
    ]);
  });
  for (const id of ['examen-0.bici-y', 'examen-0.centroide-animales']) {
    it(`${id}: la referencia pasa y el starter no`, async () => {
      // contract: reglas comunes de contenido: la reference supera las comprobaciones y el starter no
      expect(await codeQuestionProblems(pyodide, codeQuestion(id))).toEqual([]);
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
        const q = codeQuestion(id);
        const r = await runInPyodide(pyodide, code(q, v), q.checks);
        // contract: riesgo del plan: las comprobaciones no deben rechazar una solución correcta alternativa
        expect(r.passed, describeRun(r)).toBe(true);
      });
    }
  });
};

/** Cada variante errónea debe fallar, y alguna comprobación fallida debe nombrar su error. */
const rejects = (
  id: string,
  variants: (Variant & { message: RegExp; notMessage?: RegExp })[],
): void => {
  describe(`${id}: errores típicos`, { timeout: 60_000 }, () => {
    for (const v of variants) {
      it(v.name, async () => {
        const q = codeQuestion(id);
        const r = await runInPyodide(pyodide, code(q, v), q.checks);
        // contract: riesgo del plan: un error típico no pasa y recibe un mensaje que orienta
        expect(r.passed, describeRun(r)).toBe(false);
        const failed = (r.checks ?? []).filter((c) => !c.passed).map((c) => c.message);
        // contract: review-18r m2: ningún error típico saca un texto de error de NumPy o de Python en inglés, ni lanza una excepción propia
        expect(r.error, describeRun(r)).toBeNull();
        expect(failed.join(' | '), describeRun(r)).not.toMatch(NUMPY_ENGLISH);
        expect(failed.join(' | '), describeRun(r)).toMatch(v.message);
        if (v.notMessage) expect(failed.join(' | '), describeRun(r)).not.toMatch(v.notMessage);
      });
    }
  });
};

// ---------- examen-0.bici-y: y = segunda componente de «bici» (3) ----------

accepts('examen-0.bici-y', [
  { name: 'en dos pasos', append: 'v = emb["bici"]\ny = v[1]\n' },
  { name: 'índice negativo', append: 'y = emb["bici"][-1]\n' },
  { name: 'convertido a float', append: 'y = float(emb["bici"][1])\n' },
  { name: 'convertido a int', append: 'y = int(emb["bici"][1])\n' },
  { name: 'con item', append: 'y = emb["bici"].item(1)\n' },
  { name: 'con tolist', append: 'y = emb["bici"].tolist()[1]\n' },
  { name: 'el número escrito a mano', append: 'y = 3\n' },
]);
rejects('examen-0.bici-y', [
  { name: 'primera componente', append: 'y = emb["bici"][0]\n', message: /-2.*primera/s },
  { name: 'otra palabra', append: 'y = emb["coche"][1]\n', message: /«coche»/ },
  { name: 'el array entero', append: 'y = emb["bici"]\n', message: /único número/ },
  { name: 'sin tocar el starter', append: '', message: /único número/ },
  { name: 'una cadena', append: 'y = "3"\n', message: /único número/ },
  {
    // contract: review-18a m3: contar las componentes da 2 con la clave correcta; el mensaje no acusa a la clave
    name: 'contar las componentes con len',
    append: 'y = len(emb["bici"])\n',
    message: /número de componentes/,
    notMessage: /Revisa la clave/,
  },
  {
    // contract: review-18a m3: .shape[0] da 2 con la clave correcta
    name: 'contar las componentes con shape',
    append: 'y = emb["bici"].shape[0]\n',
    message: /número de componentes/,
    notMessage: /Revisa la clave/,
  },
]);

// ---------- examen-0.centroide-animales: centroide de gato, perro, lobo y tigre (3,5; 0,5) ----------

accepts('examen-0.centroide-animales', [
  { name: 'método mean', append: 'centroide = E.mean(axis=0)\n' },
  { name: 'axis sin nombre', append: 'centroide = np.mean(E, 0)\n' },
  { name: 'np.average', append: 'centroide = np.average(E, axis=0)\n' },
  { name: 'suma entre cuatro', append: 'centroide = np.sum(E, axis=0) / 4\n' },
  { name: 'suma entre len', append: 'centroide = E.sum(axis=0) / len(E)\n' },
  {
    name: 'una media por columna a mano',
    append: 'centroide = np.array([E[:, 0].mean(), E[:, 1].mean()])\n',
  },
  { name: 'traspuesta', append: 'centroide = np.mean(E.T, axis=1)\n' },
  { name: 'el resultado escrito a mano', append: 'centroide = np.array([3.5, 0.5])\n' },
  // contract: review-18a R34: los cuatro animales son simétricos, así que media, mediana y punto medio
  // coinciden en (3,5; 0,5) y no hay comprobación sobre el resultado que los distinga. Los datos los fija
  // la tabla «Banco»; no se «arregla» con texto del código.
  {
    name: 'la mediana, que aquí coincide con la media',
    append: 'centroide = np.median(E, axis=0)\n',
  },
  {
    name: 'el punto medio entre máximo y mínimo, que aquí coincide con la media',
    append: 'centroide = (E.max(axis=0) + E.min(axis=0)) / 2\n',
  },
]);
rejects('examen-0.centroide-animales', [
  { name: 'media de todo', append: 'centroide = np.mean(E)\n', message: /un solo número/ },
  {
    // contract: review-18a m2: 2 es el valor de np.mean(E), y solo a ese valor se le nombra la causa
    name: 'media de todo, con la causa',
    append: 'centroide = np.mean(E)\n',
    message: /`np\.mean\(E\)` sin `axis`/,
  },
  { name: 'media por filas', append: 'centroide = np.mean(E, axis=1)\n', message: /4 números/ },
  { name: 'suma sin dividir', append: 'centroide = np.sum(E, axis=0)\n', message: /sumado/ },
  { name: 'una lista', append: 'centroide = [3.5, 0.5]\n', message: /array de NumPy/ },
  { name: 'sin tocar el starter', append: '', message: /array de NumPy/ },
  {
    name: 'solo tres animales',
    append: 'centroide = np.mean(E[:3], axis=0)\n',
    message: /\(3,5; 0,5\)/,
  },
  { name: 'cadenas', append: 'centroide = np.array(["3.5", "0.5"])\n', message: /números/ },
  {
    // contract: review-18a m1: (3,5; 0,5) escrito con comas da cuatro números, y no son medias por filas
    name: 'el decimal escrito con coma',
    append: 'centroide = np.array([3,5, 0,5])\n',
    message: /coma/,
    notMessage: /por filas|promediado/,
  },
  {
    // contract: review-18a m1: una columna entera tiene 4 números y no se ha promediado nada
    name: 'una columna sin promediar',
    append: 'centroide = E[:, 0]\n',
    message: /4 elementos/,
    notMessage: /promediado/,
  },
  {
    // contract: review-18a m1: sumar por filas tampoco es promediar
    name: 'suma por filas',
    append: 'centroide = np.sum(E, axis=1)\n',
    message: /4 elementos/,
    notMessage: /promediado/,
  },
  {
    // contract: review-18r bn2: cuatro cadenas no son números: el mensaje habla de elementos
    name: 'cuatro cadenas',
    append: 'centroide = np.array(["gato", "perro", "lobo", "tigre"])\n',
    message: /4 elementos/,
    notMessage: /promediado|4 números/,
  },
  {
    // contract: review-18r b1 (arreglo del revisor): una cadena suelta en un array de cero ejes no llega a float()
    name: 'un array de cero ejes con una cadena',
    append: 'centroide = np.array("hola")\n',
    message: /un solo número/,
    notMessage: /convert|float\(\)/,
  },
  {
    // contract: review-18r b1: ni un array de cero ejes con None
    name: 'un array de cero ejes con None',
    append: 'centroide = np.array(None)\n',
    message: /un solo número/,
    notMessage: /convert|float\(\)/,
  },
  {
    // contract: review-18a m2: con axis=0 y un índice, el jugador sí usó axis
    name: 'axis=0 y un solo elemento',
    append: 'centroide = np.mean(E, axis=0)[0]\n',
    message: /un solo número/,
    notMessage: /sin `axis`/,
  },
  {
    // contract: review-18a m2: la suma de todo es 16, no el valor de np.mean(E)
    name: 'la suma de todo',
    append: 'centroide = E.sum()\n',
    message: /un solo número/,
    notMessage: /sin `axis`/,
  },
]);

// ---------- datos de tipo equivocado: ninguna comprobación saca un error de NumPy en inglés ----------

describe('datos de tipo equivocado: sin errores de NumPy en inglés', { timeout: 60_000 }, () => {
  for (const q of fixed().filter((q): q is CodigoQ => q.type === 'codigo')) {
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
