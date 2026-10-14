import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  codeQuestionProblems,
  describeRun,
  getPyodide,
} from '../../../tests/content/python-helpers';
import { NUMPY_ENGLISH, garbageProbes } from '../../../tests/content/prose-helpers';
import { normaDistancia } from './norma-distancia';

// El proyecto no está en el registro del juego hasta la tarea 18, así que ni
// tests/content/python.test.ts ni alternativas.test.ts lo recorren: aquí se comprueban sus preguntas
// de código (referencia que pasa, starter que no pasa), soluciones correctas distintas de la de
// referencia y errores típicos con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const codeQs = normaDistancia.exercises
  .flatMap((e) => e.questions)
  .filter((q): q is CodigoQ => q.type === 'codigo');
const question = (id: string): CodigoQ => {
  const q = codeQs.find((x) => x.id === id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

describe('norma-distancia: referencia y código inicial', { timeout: 60_000 }, () => {
  it('son cinco preguntas de código', () => {
    // contract: tarea 17, tabla de ex02: cinco preguntas de programar
    expect(codeQs.map((q) => q.id)).toEqual(
      [1, 2, 3, 4, 5].map((n) => `norma-distancia.ex02.${n}`),
    );
  });

  for (const q of codeQs) {
    it(`${q.id}: la referencia pasa, el starter no y se llama a check(`, async () => {
      // contract: tarea 8, python.test.ts: la reference supera las comprobaciones, el starter no
      expect(await codeQuestionProblems(pyodide, q)).toEqual([]);
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
        if (v.notMessage) expect(failed.join(' | '), describeRun(r)).not.toMatch(v.notMessage);
        if (v.failures !== undefined) expect(failed, describeRun(r)).toHaveLength(v.failures);
      });
    }
  });
};

accepts('norma-distancia.ex02.1', [
  { name: 'con una lista en vez de un array', append: 'n = np.linalg.norm([3, 4])\n' },
  { name: 'float(...)', append: 'n = float(np.linalg.norm(v))\n' },
  { name: 'con la fórmula', append: 'n = np.sqrt(v[0] ** 2 + v[1] ** 2)\n' },
  { name: 'raíz del producto escalar', append: 'n = np.sqrt(np.dot(v, v))\n' },
  { name: 'ord=2', append: 'n = np.linalg.norm(v, 2)\n' },
  { name: 'número escrito a mano', append: 'n = 5\n' },
  { name: 'array de cero ejes', append: 'n = np.array(np.linalg.norm(v))\n' },
]);
rejects('norma-distancia.ex02.1', [
  { name: 'falta la raíz', append: 'n = np.sum(v ** 2)\n', message: /falta la raíz/ },
  { name: 'el propio vector', append: 'n = v\n', message: /tiene que ser un número/ },
  { name: 'lista de un elemento', append: 'n = [5]\n', message: /tiene que ser un número/ },
  { name: 'suma de componentes', append: 'n = np.sum(v)\n', message: /valer 5/ },
  { name: 'texto', append: 'n = "5"\n', message: /tiene que ser un número/ },
]);

accepts('norma-distancia.ex02.2', [
  // contract: tarea 17, brief: el enunciado pide no usar np.linalg.norm pero nunca se comprueba el texto del código
  { name: 'np.linalg.norm (no se puede vigilar)', append: 'n = np.linalg.norm(v)\n' },
  { name: 'método sum', append: 'n = np.sqrt((v ** 2).sum())\n' },
  { name: 'producto escalar', append: 'n = np.sqrt(np.dot(v, v))\n' },
  { name: 'v * v', append: 'n = np.sqrt(np.sum(v * v))\n' },
  { name: 'valores absolutos', append: 'n = np.sqrt(np.sum(np.abs(v) ** 2))\n' },
  { name: 'exponente 0,5', append: 'n = np.sum(v ** 2) ** 0.5\n' },
  { name: 'paso a paso', append: 'c = v ** 2\ns = np.sum(c)\nn = np.sqrt(s)\n' },
  { name: 'float(...)', append: 'n = float(np.sqrt(np.sum(v ** 2)))\n' },
]);
rejects('norma-distancia.ex02.2', [
  { name: 'falta la raíz', append: 'n = np.sum(v ** 2)\n', message: /`n` vale 9: falta la raíz/ },
  {
    name: 'suma sin elevar al cuadrado',
    append: 'n = np.sum(v)\n',
    message: /sumado sin elevar al cuadrado/,
  },
  {
    name: 'raíz de la suma sin cuadrados',
    append: 'n = np.sqrt(np.sum(v))\n',
    message: /sumado sin elevar al cuadrado/,
  },
  {
    name: 'cuadrado de la suma',
    append: 'n = np.sum(v) ** 2\n',
    message: /sumado sin elevar al cuadrado/,
  },
  { name: 'un array', append: 'n = np.sqrt(v ** 2)\n', message: /tiene que ser un número/ },
  { name: 'cuadrado de más', append: 'n = np.sum(v ** 2) ** 2\n', message: /valer 3/ },
]);

accepts('norma-distancia.ex02.3', [
  { name: 'resta al revés', append: 'd = np.linalg.norm(lobo - gato)\n' },
  { name: 'con la fórmula', append: 'd = np.sqrt(np.sum((gato - lobo) ** 2))\n' },
  {
    name: 'componente a componente',
    append: 'd = np.sqrt((gato[0] - lobo[0]) ** 2 + (gato[1] - lobo[1]) ** 2)\n',
  },
  { name: 'en dos pasos', append: 'dif = gato - lobo\nd = np.linalg.norm(dif)\n' },
  { name: 'producto escalar', append: 'dif = gato - lobo\nd = np.sqrt(np.dot(dif, dif))\n' },
  { name: 'float(...)', append: 'd = float(np.linalg.norm(gato - lobo))\n' },
  { name: 'valor redondeado a mano', append: 'd = 6.0828\n' },
  // contract: review-17 I3: la regla común es 0,01; el jugador viene de ex01.3, que pide dos decimales
  {
    name: 'redondeada a dos decimales con round',
    append: 'd = round(float(np.linalg.norm(gato - lobo)), 2)\n',
  },
  {
    name: 'redondeada a dos decimales con np.round',
    append: 'd = np.round(np.linalg.norm(gato - lobo), 2)\n',
  },
]);
rejects('norma-distancia.ex02.3', [
  {
    name: 'resta de las normas',
    append: 'd = np.linalg.norm(gato) - np.linalg.norm(lobo)\n',
    message: /restado las normas/,
  },
  {
    // contract: ronda de esta tarea: la resta de normas al revés (−0,5279) recibe el mismo mensaje
    name: 'resta de las normas al revés',
    append: 'd = np.linalg.norm(lobo) - np.linalg.norm(gato)\n',
    message: /restado las normas/,
  },
  {
    name: 'suma de los vectores',
    append: 'd = np.linalg.norm(gato + lobo)\n',
    message: /sumado los vectores/,
  },
  { name: 'falta la norma', append: 'd = gato - lobo\n', message: /falta calcular su norma/ },
  {
    name: 'suma de cuadrados',
    append: 'd = np.sum((gato - lobo) ** 2)\n',
    message: /valer 6,0828/,
  },
  { name: 'una lista', append: 'd = [6.08]\n', message: /tiene que ser un número/ },
  {
    // contract: rereview-17 N6: la resta de normas redondeada a dos decimales (0,53) sigue recibiendo su mensaje
    name: 'resta de normas redondeada',
    append: 'd = round(float(np.linalg.norm(gato) - np.linalg.norm(lobo)), 2)\n',
    message: /restado las normas/,
  },
  // contract: review-17 I3: con atol 0,01 un valor redondeado a un decimal (6,1) sigue rechazándose
  { name: 'redondeada a un decimal', append: 'd = 6.1\n', message: /valer 6,0828/ },
  {
    // contract: review-17 m5: con las normas al revés d vale -0,5279 y el mensaje lo dice
    name: 'resta de normas: el mensaje avisa del signo',
    append: 'd = np.linalg.norm(lobo) - np.linalg.norm(gato)\n',
    message: /\(o -0,5279\)/,
  },
]);

accepts('norma-distancia.ex02.4', [
  { name: 'dividiendo entre un número escrito a mano', append: 'u = v / 5\n' },
  { name: 'con la norma en una variable', append: 'n = np.linalg.norm(v)\nu = v / n\n' },
  { name: 'con la fórmula', append: 'u = v / np.sqrt(np.sum(v ** 2))\n' },
  { name: 'multiplicando por el inverso', append: 'u = v * (1 / np.linalg.norm(v))\n' },
  { name: 'array escrito a mano', append: 'u = np.array([0.6, 0.8])\n' },
  { name: 'fracciones', append: 'u = np.array([3 / 5, 4 / 5])\n' },
  { name: 'astype(float)', append: 'u = v.astype(float) / np.linalg.norm(v)\n' },
  {
    name: 'componente a componente',
    append: 'n = np.linalg.norm(v)\nu = np.array([v[0] / n, v[1] / n])\n',
  },
]);
rejects('norma-distancia.ex02.4', [
  { name: 'sin dividir', append: 'u = v\n', message: /sigue valiendo lo mismo que `v`/ },
  {
    name: 'dividido entre el cuadrado de la norma',
    append: 'u = v / np.sum(v ** 2)\n',
    message: /dividido entre 25/,
  },
  {
    name: 'dividido entre la suma',
    append: 'u = v / np.sum(v)\n',
    message: /norma de `u` tiene que ser 1/,
  },
  { name: 'una lista', append: 'u = [0.6, 0.8]\n', message: /array de NumPy/ },
  { name: 'la norma sola', append: 'u = np.linalg.norm(v)\n', message: /array de NumPy/ },
  {
    name: 'norma 1 pero otra dirección',
    append: 'u = np.array([0.8, 0.6])\n',
    message: /valer \(0,6; 0,8\)/,
    notMessage: /norma de `u` tiene que ser 1/,
  },
  { name: 'cadenas', append: 'u = np.array(["0.6", "0.8"])\n', message: /números/ },
]);

const NEAREST_LOOP =
  'for p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < menor:\n        menor = d\n        mas_cercana = p\n';
const MIN_KEY = 'mas_cercana = min(emb, key=lambda w: np.linalg.norm(q - emb[w]))\n';
/** Un bucle con el esquema pedido, con otra fórmula para `d` y otra comparación. */
const loopWith = (d: string, cmp = 'd < menor'): string =>
  `for p in emb:\n    d = ${d}\n    if ${cmp}:\n        menor = d\n        mas_cercana = p\n`;

accepts('norma-distancia.ex02.5', [
  { name: 'bucle con otro nombre', append: NEAREST_LOOP },
  { name: 'min con key', append: MIN_KEY },
  {
    name: 'sorted',
    append: 'mas_cercana = sorted(emb, key=lambda w: np.linalg.norm(emb[w] - q))[0]\n',
  },
  {
    name: 'items y <=',
    append:
      'for w, p in emb.items():\n    if np.linalg.norm(p - q) <= menor:\n        menor = np.linalg.norm(p - q)\n        mas_cercana = w\n',
  },
  { name: 'np.inf', replace: ['menor = 1000', 'menor = np.inf'], append: NEAREST_LOOP },
  {
    name: 'distancias al cuadrado',
    append:
      'for w in emb:\n    s = np.sum((q - emb[w]) ** 2)\n    if s < menor:\n        menor = s\n        mas_cercana = w\n',
  },
  {
    name: 'dos listas',
    append:
      'nombres = list(emb)\ndist = [np.linalg.norm(q - emb[w]) for w in nombres]\nmas_cercana = nombres[int(np.argmin(dist))]\n',
  },
  { name: 'palabra escrita a mano', append: 'mas_cercana = "gato"\n' },
  // contract: rereview-17 RISKS: con menor = np.inf sin usarlo, `menor` no vale 1000 pero tampoco se ha tocado
  {
    name: 'np.inf y min con key (menor sin tocar)',
    replace: ['menor = 1000', 'menor = np.inf'],
    append: MIN_KEY,
  },
  // contract: rereview-17b F1 (C15): `menor` guarda el índice de np.argmin, no una distancia; el programa es correcto
  {
    name: 'menor guarda el índice de np.argmin',
    append:
      'nombres = list(emb)\ndist = [np.linalg.norm(q - emb[w]) for w in nombres]\nmenor = np.argmin(dist)\nmas_cercana = nombres[menor]\n',
  },
  // contract: rereview-17b F1 (C14): `menor` vale un número cualquiera que el programa no usa
  { name: 'menor = 100 y min con key', append: 'menor = 100\n' + MIN_KEY },
  // contract: rereview-17b F1 (C17): `menor` vale la primera distancia y la búsqueda va por min
  {
    name: 'menor = primera distancia y min con key',
    append: 'menor = np.linalg.norm(q - emb[list(emb)[0]])\n' + MIN_KEY,
  },
  // contract: rereview-17b F1 (C18): maximizar -d deja `menor` negativo y es correcto
  {
    name: 'maximiza -d con menor = -1000',
    append:
      'menor = -1000\nfor p in emb:\n    d = -np.linalg.norm(q - emb[p])\n    if d > menor:\n        menor = d\n        mas_cercana = p\n',
  },
  // contract: rereview-17b F3: borrar `menor` o dejar en él un array no rompe las comprobaciones
  { name: 'borra menor con del', append: NEAREST_LOOP + 'del menor\n' },
  {
    name: 'menor es un array de un elemento',
    append: loopWith('np.array([np.linalg.norm(q - emb[p])])'),
  },
  // contract: rereview-17b batería: más formas correctas que solo se distinguen en variables incidentales
  {
    name: 'menor = min(menor, d) fuera del if',
    append:
      'for p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < menor:\n        mas_cercana = p\n    menor = min(menor, d)\n',
  },
  {
    name: 'variable renombrada',
    append:
      'mejor = 1000\nfor p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < mejor:\n        mejor = d\n        mas_cercana = p\n',
  },
  {
    name: 'float("inf")',
    replace: ['menor = 1000', 'menor = float("inf")'],
    append: NEAREST_LOOP,
  },
  {
    name: 'menor es un diccionario de distancias',
    append:
      'menor = {}\nfor p in emb:\n    menor[p] = np.linalg.norm(q - emb[p])\nmas_cercana = min(menor, key=menor.get)\n',
  },
  { name: 'distancia redondeada', append: loopWith('round(float(np.linalg.norm(q - emb[p])), 2)') },
]);

describe('norma-distancia.ex02.5: la solution', { timeout: 60_000 }, () => {
  it('el bloque cercado de la solution, copiado tal cual tras el starter, pasa', async () => {
    const q = question('norma-distancia.ex02.5');
    const block = /```python\n([\s\S]*?)\n```/.exec(q.solution);
    if (!block) throw new Error('la solution no tiene bloque cercado');
    const r = await runInPyodide(pyodide, q.starter + block[1] + '\n', q.checks);
    // contract: rereview-17b encargo, punto 4: la solution copiada tal cual tras el starter debe pasar
    expect(r.passed, describeRun(r)).toBe(true);
  });
});

/**
 * Los errores típicos de ex02.5 con el valor que dejan en `mas_cercana` (su `repr` de Python) y el
 * mensaje que reciben. Las comprobaciones solo ven el estado final, así que el orden de `emb` está
 * elegido para que ninguno deje la respuesta: (perro, gato, lobo, bici) es el único de los 24.
 */
const NORMS_NO_ABS = 'np.linalg.norm(q) - np.linalg.norm(emb[p])';
const TYPICAL_ERRORS: (Variant & { result: string; message: RegExp; notMessage?: RegExp })[] = [
  {
    // contract: rereview-17b datos: sin comparar, el bucle acaba con la última clave, «bici»
    name: 'sin comparar: se queda con la última',
    append: 'for p in emb:\n    mas_cercana = p\n',
    result: "'bici'",
    message: /falta la comparación con `menor`/, // contract: rereview-17c m2 (M11)
  },
  {
    // contract: rereview-17b datos: con menor = 0 y la comparación al revés gana la más lejana, «lobo» (6,32)
    name: 'comparación al revés: la más lejana',
    replace: ['menor = 1000', 'menor = 0'],
    append: loopWith('np.linalg.norm(q - emb[p])', 'd > menor'),
    result: "'lobo'",
    message: /más lejana.*con `menor` empezando en 0/, // contract: rereview-17c m2 (M17)
  },
  {
    // contract: rereview-17 N5: la comparación al revés con el menor = 1000 del starter nunca entra y deja None; el mensaje lo explica
    name: 'comparación al revés con el starter: None',
    append: loopWith('np.linalg.norm(q - emb[p])', 'd > menor'),
    result: 'None',
    message: /no se cumple nunca/,
    notMessage: /más lejana/,
  },
  {
    // contract: rereview-17b datos: sin actualizar `menor` el if se cumple siempre y gana la última, «bici»
    name: 'olvida actualizar menor',
    append:
      'for p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < menor:\n        mas_cercana = p\n',
    result: "'bici'",
    message: /no se guarda en `menor` dentro del `if`/, // contract: rereview-17c m1: la causa va como posibilidad
  },
  {
    // contract: review-17 I2: restar las normas (con abs) en vez de los vectores da «lobo» (‖q‖ = ‖lobo‖) y el mensaje lo dice
    name: 'resta las normas en vez de los vectores',
    append: loopWith('np.abs(np.linalg.norm(q) - np.linalg.norm(emb[p]))'),
    result: "'lobo'",
    message: /restas las normas en vez de los vectores/, // contract: rereview-17c I1: la causa va como posibilidad abierta
  },
  {
    // contract: review-17 m6: comparar la norma de cada embedding (no su distancia a q) da «bici», la de menor norma (3,61)
    name: 'compara la norma de cada embedding, no su distancia a q',
    append: loopWith('np.linalg.norm(emb[p])'),
    result: "'bici'",
    message: /por ejemplo la norma de `emb\[palabra\]` \(`bici` es la de menor norma\)/,
  },
  {
    // contract: rereview-17b datos: sin abs gana la de mayor norma; «perro» y «gato» empatan a 5 y «perro» va antes
    name: 'resta las normas sin valor absoluto',
    append: loopWith(NORMS_NO_ABS),
    result: "'perro'",
    message: /resta de las normas/,
  },
  {
    // contract: rereview-17b datos (E10): lo mismo sin bucle y sin `menor`
    name: 'resta las normas sin valor absoluto, con min y key',
    append: 'mas_cercana = min(emb, key=lambda w: np.linalg.norm(q) - np.linalg.norm(emb[w]))\n',
    result: "'perro'",
    message: /resta de las normas/,
  },
  {
    // contract: rereview-17b datos (E11): lo mismo con la variable renombrada
    name: 'resta las normas sin valor absoluto, con otra variable',
    append: `mejor = 1000\nfor p in emb:\n    d = ${NORMS_NO_ABS}\n    if d < mejor:\n        mejor = d\n        mas_cercana = p\n`,
    result: "'perro'",
    message: /resta de las normas/,
  },
  {
    // contract: rereview-17b datos: menor = d fuera del if compara con la palabra anterior; la última que mejora a su anterior es «bici» (4,12 < 6,32)
    name: 'menor = d fuera del if',
    append:
      'for p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < menor:\n        mas_cercana = p\n    menor = d\n',
    result: "'bici'",
    message: /no se guarda en `menor` dentro del `if`/,
  },
  {
    // contract: rereview-17b datos (E12): lo mismo con la variable renombrada
    name: 'la distancia anterior fuera del if, con otra variable',
    append:
      'mejor = 1000\nfor p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < mejor:\n        mas_cercana = p\n    mejor = d\n',
    result: "'bici'",
    message: /`bici` no es la más cercana/,
  },
  {
    // contract: rereview-17 N4: mas_cercana al nivel del for (fuera del if) acaba en la última palabra; rereview-17b datos: «bici»
    name: 'mas_cercana fuera del if',
    append:
      'for p in emb:\n    d = np.linalg.norm(q - emb[p])\n    if d < menor:\n        menor = d\n    mas_cercana = p\n',
    result: "'bici'",
    message: /`mas_cercana = palabra` no está dentro del `if`/,
  },
  {
    // contract: rereview-17b datos (E17): la de mayor norma es «perro» (empata con «gato» y va antes)
    name: 'max con key sobre la norma',
    append: 'mas_cercana = max(emb, key=lambda w: np.linalg.norm(emb[w]))\n',
    result: "'perro'",
    message: /norma mayor/,
  },
  {
    // contract: rereview-17b datos: quedarse con la primera clave da «perro»
    name: 'se queda con la primera clave',
    append: NEAREST_LOOP.replace(/\n$/, '\n        break\n'),
    result: "'perro'",
    message: /se queda con la primera palabra/, // contract: rereview-17c m2 (M14)
  },
  {
    // contract: rereview-17c I1 (E19): sumar los vectores en vez de restarlos da «lobo»; el resultado se fija en la prueba de datos
    name: 'suma los vectores en vez de restarlos',
    append: loopWith('np.linalg.norm(q + emb[p])'),
    result: "'lobo'",
    message: /una suma o un producto/,
  },
  {
    // contract: rereview-17c I1 (X29): el producto escalar como distancia da «lobo»
    name: 'el producto escalar como distancia',
    append: loopWith('np.dot(q, emb[p])'),
    result: "'lobo'",
    message: /una suma o un producto/,
  },
  {
    // contract: rereview-17c I1 (X17): max con key sobre la distancia da «lobo», la más lejana
    name: 'max con key sobre la distancia',
    append: 'mas_cercana = max(emb, key=lambda w: np.linalg.norm(q - emb[w]))\n',
    result: "'lobo'",
    message: /te quedas con la distancia mayor/,
  },
  {
    // contract: rereview-17c m1 (X32): la resta de normas, emb menos q, da «bici»
    name: 'norma de emb menos norma de q',
    append: loopWith('np.linalg.norm(emb[p]) - np.linalg.norm(q)'),
    result: "'bici'",
    message: /una resta de normas/,
  },
  {
    // contract: rereview-17c m1 (X14): el if fuera del for solo ve la última palabra, «bici»
    name: 'el if fuera del for',
    append:
      'for p in emb:\n    d = np.linalg.norm(q - emb[p])\nif d < menor:\n    menor = d\n    mas_cercana = p\n',
    result: "'bici'",
    message: /el `if` no está dentro del `for`/,
  },
];

describe('norma-distancia.ex02.5: los datos distinguen los errores', { timeout: 60_000 }, () => {
  const id = 'norma-distancia.ex02.5';
  /** Valor final de `mas_cercana` (su `repr`) tras ejecutar la variante con el `emb` del contenido. */
  const finalValue = async (v: Variant): Promise<string | undefined> => {
    const r = await runInPyodide(pyodide, code(question(id), v), 'check(False, repr(mas_cercana))');
    return r.checks?.[0]?.message;
  };

  it('las cifras de los mensajes de «lobo» y «bici» son las de los datos (m-c)', async () => {
    const q = question(id);
    const r = await runInPyodide(
      pyodide,
      q.starter,
      "check(False, f\"{np.linalg.norm(q - emb['lobo']):.2f} {np.linalg.norm(q - emb['bici']):.2f} " +
        "{np.linalg.norm(q - emb['gato']):.0f} {np.isclose(np.linalg.norm(q), np.linalg.norm(emb['lobo']))}\")",
    );
    // contract: rereview-17d m-c: las distancias de q a «lobo» y a «bici», la de «gato» (1) y «q y lobo miden lo mismo»
    expect(r.checks?.[0]?.message).toBe('6.32 4.12 1 True');
    // contract: rereview-17d m-c: los mensajes citan esas cifras con coma decimal
    expect(q.checks).toContain('a unas 6,32 unidades');
    expect(q.checks).toContain('a unas 4,12 unidades');
    // contract: rereview-17d m-a: y la distancia de la más cercana (1), sin nombrarla
    expect(q.checks.match(/la más cercana está a 1\./g)).toHaveLength(2);
    // contract: rereview-17d m-c: «`q` y `lobo` miden lo mismo» sale del True de arriba
    expect(q.checks).toContain('`q` y `lobo` miden lo mismo');
  });

  it('el bucle correcto deja «gato»', async () => {
    // contract: tarea 17, tabla de ex02: mas_cercana == "gato"
    expect(await finalValue({ name: 'bucle', append: NEAREST_LOOP })).toBe("'gato'");
  });

  for (const v of TYPICAL_ERRORS) {
    it(`${v.name}: deja ${v.result}, no la respuesta`, async () => {
      const value = await finalValue(v);
      // contract: rereview-17b datos: tabla programa × resultado del informe (ronda 3), ejecutada en Pyodide
      expect(value).toBe(v.result);
      // contract: rereview-17b datos: ningún error típico deja la respuesta; si falla, se han cambiado el orden o los vectores de emb
      expect(value).not.toBe("'gato'");
    });
  }
});

rejects('norma-distancia.ex02.5', [
  ...TYPICAL_ERRORS,
  {
    name: 'el vector en vez de la palabra',
    append: 'mas_cercana = emb["gato"]\n',
    message: /la palabra/,
  },
  {
    name: 'una palabra que no está',
    append: 'mas_cercana = "tigre"\n',
    message: /claves de `emb`/,
  },
  { name: 'otra mayúscula', append: 'mas_cercana = "Gato"\n', message: /claves de `emb`/ },
  {
    // contract: review-17 m7: el mensaje de tipo no da la respuesta como ejemplo
    name: 'sin tocar mas_cercana (None)',
    message: /un texto entre comillas/,
    notMessage: /texto como/,
  },
  {
    // contract: rereview-17b: con menor = 0 y la comparación correcta el if no se cumple nunca; el mensaje de None lo cubre
    name: 'menor empieza en 0',
    replace: ['menor = 1000', 'menor = 0'],
    append: NEAREST_LOOP,
    message: /no se cumple nunca.*revisa que `menor` empiece muy grande/, // contract: rereview-17c m2 (M16)
  },
]);

// ---------- datos de tipo equivocado: ninguna comprobación saca un error de NumPy en inglés ----------

describe('datos de tipo equivocado: sin errores de NumPy en inglés', { timeout: 60_000 }, () => {
  for (const q of codeQs) {
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
