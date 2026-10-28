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
import { analogias } from './analogias';
import { examen3Analogias } from './examen-3-analogias';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia, los errores típicos
// y cada cifra de datos reales que aparece en el contenido, contra el módulo `embeddings`.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen3Analogias
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [
    ...projectQuestions(analogias).filter((q): q is CodigoQ => q.type === 'codigo'),
    ...bankCode,
  ].map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const CONSIST = 'examen-3.consistencia';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo común de la Órbita 3: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `analogias.ex02.${n}`),
      CONSIST,
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

// ---------- ex02.1: aritmética con vectores reales, normalizar y coseno ----------

const W = 'w = vector("rey") - vector("hombre") + vector("mujer")\n';

accepts('analogias.ex02.1', [
  {
    name: 'coseno con la fórmula completa',
    append: `${W}w_unit = w / np.linalg.norm(w)\ncos_reina = w @ vector("reina") / np.linalg.norm(w)\n`,
  },
  {
    name: 'np.dot y float',
    append: `${W}w_unit = w / np.linalg.norm(w)\ncos_reina = float(np.dot(w_unit, vector("reina")))\n`,
  },
  {
    name: 'la norma escrita con raíz y suma',
    append: `${W}w_unit = w / np.sqrt(np.sum(w ** 2))\ncos_reina = w_unit @ vector("reina")\n`,
  },
  {
    name: 'coseno con las normas de los dos vectores',
    append: `${W}r = vector("reina")\nw_unit = w / np.linalg.norm(w)\ncos_reina = w @ r / (np.linalg.norm(w) * np.linalg.norm(r))\n`,
  },
  {
    name: 'con otro orden de los términos',
    append:
      'w = vector("mujer") + vector("rey") - vector("hombre")\nw_unit = w / np.linalg.norm(w)\ncos_reina = w_unit @ vector("reina")\n',
  },
]);
rejects('analogias.ex02.1', [
  {
    name: 'los signos cambiados',
    append:
      'w = vector("rey") + vector("hombre") - vector("mujer")\nw_unit = w / np.linalg.norm(w)\ncos_reina = w_unit @ vector("reina")\n',
    message: /el orden de las palabras y los signos/,
    failures: 1,
  },
  {
    name: 'restando también «mujer»',
    append:
      'w = vector("rey") - vector("hombre") - vector("mujer")\nw_unit = w / np.linalg.norm(w)\ncos_reina = w_unit @ vector("reina")\n',
    message: /el orden de las palabras y los signos/,
    failures: 1,
  },
  {
    name: 'w como lista de Python',
    append: `w = list(vector("rey") - vector("hombre") + vector("mujer"))\nw_unit = np.array(w) / np.linalg.norm(w)\ncos_reina = w_unit @ vector("reina")\n`,
    message: /array de NumPy con 384 números/,
    failures: 1,
  },
  {
    name: 'w_unit sin normalizar',
    append: `${W}w_unit = w\ncos_reina = w @ vector("reina") / np.linalg.norm(w)\n`,
    message: /`w_unit` tiene que medir 1/,
    failures: 1,
  },
  {
    name: 'w_unit dividido entre un número cualquiera',
    append: `${W}w_unit = w / 2\ncos_reina = w @ vector("reina") / np.linalg.norm(w)\n`,
    message: /`w_unit` tiene que medir 1/,
    failures: 1,
  },
  {
    name: 'cos_reina es el producto escalar sin normalizar',
    append: `${W}w_unit = w / np.linalg.norm(w)\ncos_reina = w @ vector("reina")\n`,
    message: /producto escalar de `w` con «reina», no su coseno/,
    failures: 1,
  },
  {
    name: 'cos_reina con otra palabra',
    append: `${W}w_unit = w / np.linalg.norm(w)\ncos_reina = w_unit @ vector("rey")\n`,
    message: /`cos_reina` tiene que ser el coseno entre `w` y «reina»/,
    failures: 1,
  },
  {
    name: 'cos_reina es un entero',
    append: `${W}w_unit = w / np.linalg.norm(w)\ncos_reina = 1\n`,
    message: /`cos_reina` tiene que ser un número decimal/,
    failures: 1,
  },
]);

// ---------- ex02.2: la función analogia ----------

const SALE = 'sale_rey = analogia("rey", "hombre", "mujer")\n';

accepts('analogias.ex02.2', [
  {
    name: 'con el resultado normalizado',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    w = w / np.linalg.norm(w)
    for i in np.argsort(P @ w)[::-1]:
        if palabras[i] not in (a, b, c):
            return palabras[i]
${SALE}`,
  },
  {
    name: 'poniendo las entradas a menos infinito',
    append: `def analogia(a, b, c):
    puntos = P @ (vector(a) - vector(b) + vector(c))
    for p in (a, b, c):
        puntos[palabras.index(p)] = -np.inf
    return palabras[int(np.argmax(puntos))]
${SALE}`,
  },
  {
    name: 'con max y una clave',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    return max((p for p in palabras if p not in (a, b, c)), key=lambda p: vector(p) @ w)
${SALE}`,
  },
  {
    name: 'ordenando con sorted',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    candidatas = [p for p in palabras if p not in (a, b, c)]
    return sorted(candidatas, key=lambda p: -float(vector(p) @ w))[0]
${SALE}`,
  },
  {
    name: 'con el coseno completo de cada palabra',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    mejor, mejor_cos = None, -2
    for p in palabras:
        if p in (a, b, c):
            continue
        cos = np.dot(vector(p), w) / (np.linalg.norm(vector(p)) * np.linalg.norm(w))
        if cos > mejor_cos:
            mejor, mejor_cos = p, cos
    return mejor
${SALE}`,
  },
  {
    name: 'con la distancia euclídea (las palabras miden 1, así que ordena igual)',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    d = np.linalg.norm(P - w, axis=1)
    for i in np.argsort(d):
        if palabras[i] not in (a, b, c):
            return palabras[i]
${SALE}`,
  },
]);
rejects('analogias.ex02.2', [
  {
    name: 'sin excluir las entradas',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    return palabras[int(np.argmax(P @ w))]
${SALE}`,
    message: /devuelve una de las tres entradas/,
    failures: 1,
  },
  {
    name: 'excluyendo solo la que se resta',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    puntos = P @ w
    puntos[palabras.index(b)] = -np.inf
    return palabras[int(np.argmax(puntos))]
${SALE}`,
    message: /devuelve una de las tres entradas/,
    failures: 1,
  },
  {
    name: 'la posición en vez de la palabra',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    puntos = P @ w
    for p in (a, b, c):
        puntos[palabras.index(p)] = -np.inf
    return int(np.argmax(puntos))
${SALE}`,
    message: /devuelve un número: parece la posición/,
    failures: 1,
  },
  {
    name: 'la menos parecida',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    for i in np.argsort(P @ w):
        if palabras[i] not in (a, b, c):
            return palabras[i]
${SALE}`,
    message: /devuelve la palabra menos parecida/,
    failures: 1,
  },
  {
    name: 'una lista de tres palabras',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    orden = [palabras[i] for i in np.argsort(P @ w)[::-1] if palabras[i] not in (a, b, c)]
    return orden[:3]
${SALE}`,
    message: /tiene que devolver una sola palabra/,
    failures: 1,
  },
  {
    name: 'los signos cambiados',
    append: `def analogia(a, b, c):
    w = vector(a) + vector(b) - vector(c)
    for i in np.argsort(P @ w)[::-1]:
        if palabras[i] not in (a, b, c):
            return palabras[i]
${SALE}`,
    message: /tiene que devolver «reina» con «rey», «hombre» y «mujer»/,
    failures: 1,
  },
  {
    name: 'la función es correcta pero sale_rey no guarda su resultado',
    append: `def analogia(a, b, c):
    w = vector(a) - vector(b) + vector(c)
    for i in np.argsort(P @ w)[::-1]:
        if palabras[i] not in (a, b, c):
            return palabras[i]
sale_rey = "reina "
`,
    message: /`sale_rey` tiene que guardar lo que devuelve `analogia`/,
    failures: 1,
  },
  {
    name: 'sin definir la función (se borra)',
    append: 'del analogia\n',
    message: /Hay que definir una función `analogia`/,
  },
]);

// ---------- ex02.3: ver qué gana sin excluir ----------

const GANA = 'ganadoras = [palabras[int(np.argmax(puntos(*caso)))] for caso in lista_casos]\n';

accepts('analogias.ex02.3', [
  {
    name: 'con bucles',
    append: `ganadoras = []
n_entradas = 0
for a, b, c in lista_casos:
    g = palabras[int(np.argmax(puntos(a, b, c)))]
    ganadoras.append(g)
    if g in (a, b, c):
        n_entradas += 1
`,
  },
  {
    name: 'con max sobre las posiciones y una tupla de ganadoras',
    append: `ganadoras = tuple(palabras[max(range(32), key=lambda i: puntos(*caso)[i])] for caso in lista_casos)
n_entradas = len([1 for g, caso in zip(ganadoras, lista_casos) if g in caso])
`,
  },
  {
    name: 'ganadoras como array de NumPy',
    append: `${GANA}ganadoras = np.array(ganadoras)
n_entradas = int(sum(g in caso for g, caso in zip(ganadoras, lista_casos)))
`,
  },
  {
    name: 'contando con una lista de booleanos',
    append: `${GANA}n_entradas = [g in caso for g, caso in zip(ganadoras, lista_casos)].count(True)
`,
  },
]);
rejects('analogias.ex02.3', [
  {
    name: 'excluyendo las entradas',
    append: `ganadoras = []
for a, b, c in lista_casos:
    orden = [palabras[i] for i in np.argsort(puntos(a, b, c))[::-1]]
    ganadoras.append([p for p in orden if p not in (a, b, c)][0])
n_entradas = sum(g in caso for g, caso in zip(ganadoras, lista_casos))
`,
    message: /Aquí no se excluye nada/,
    failures: 1,
  },
  {
    name: 'las posiciones en vez de las palabras',
    append: `ganadoras = [int(np.argmax(puntos(*caso))) for caso in lista_casos]
n_entradas = 4
`,
    message: /tiene números: parecen posiciones/,
    failures: 1,
  },
  {
    name: 'la ganadora se compara con las entradas de todos los casos',
    append: `${GANA}todas = {p for caso in lista_casos for p in caso}
n_entradas = sum(g in todas for g in ganadoras)
`,
    message: /es entrada de otro caso/,
    failures: 1,
  },
  {
    name: 'n_entradas cuenta todos los casos',
    append: `${GANA}n_entradas = len(ganadoras)
`,
    message: /`n_entradas` tiene que valer el número de casos/,
    failures: 1,
  },
  {
    name: 'ganadoras con cinco elementos',
    append: `ganadoras = [palabras[int(np.argmax(puntos(*caso)))] for caso in lista_casos[:5]]
n_entradas = 4
`,
    message: /lista de seis elementos/,
    failures: 1,
  },
  {
    name: 'n_entradas es una proporción',
    append: `${GANA}n_entradas = 4 / 6
`,
    message: /`n_entradas` tiene que ser un número entero/,
    failures: 1,
  },
]);

// ---------- ex02.4: coseno entre relaciones ----------

const REF = 'ref = vector("mujer") - vector("hombre")\n';

accepts('analogias.ex02.4', [
  {
    name: 'con un bucle y np.dot',
    append: `${REF}cos_rel = []
for o, d in lista_pares:
    rel = vector(d) - vector(o)
    cos_rel.append(np.dot(ref, rel) / (np.linalg.norm(ref) * np.linalg.norm(rel)))
floja = lista_pares[cos_rel.index(min(cos_rel))]
cos_otra = float(coseno(ref, vector("Roma") - vector("Italia")))
`,
  },
  {
    name: 'con las relaciones normalizadas',
    append: `${REF}u = ref / np.linalg.norm(ref)
cos_rel = np.array([u @ (vector(d) - vector(o)) / np.linalg.norm(vector(d) - vector(o)) for o, d in lista_pares])
floja = min(lista_pares, key=lambda p: coseno(ref, vector(p[1]) - vector(p[0])))
cos_otra = coseno(ref, vector(otra[1]) - vector(otra[0]))
`,
  },
  {
    name: 'floja como lista',
    append: `${REF}cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
floja = list(lista_pares[int(np.argmin(cos_rel))])
cos_otra = coseno(ref, vector("Roma") - vector("Italia"))
`,
  },
]);
const COS_OK = `cos_otra = coseno(ref, vector("Roma") - vector("Italia"))\n`;
const FLOJA_OK = 'floja = ("hijo", "hija")\n';
rejects('analogias.ex02.4', [
  {
    name: 'con la referencia al revés',
    append: `ref = vector("hombre") - vector("mujer")
cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
${FLOJA_OK}cos_otra = coseno(vector("mujer") - vector("hombre"), vector("Roma") - vector("Italia"))
`,
    message: /signos cambiados/,
    failures: 1,
  },
  {
    name: 'productos escalares sin dividir entre las normas',
    append: `${REF}cos_rel = np.array([ref @ (vector(d) - vector(o)) for o, d in lista_pares])
${FLOJA_OK}${COS_OK}`,
    message: /productos escalares: faltan las normas/,
    failures: 1,
  },
  {
    name: 'floja es la posición',
    append: `${REF}cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
floja = int(np.argmin(cos_rel))
${COS_OK}`,
    message: /`floja` es un número: parece la posición/,
    failures: 1,
  },
  {
    name: 'floja es la pareja de coseno más alto',
    append: `${REF}cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
floja = lista_pares[int(np.argmax(cos_rel))]
${COS_OK}`,
    message: /pareja de coseno más alto/,
    failures: 1,
  },
  {
    name: 'floja es otra pareja',
    append: `${REF}cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
floja = lista_pares[0]
${COS_OK}`,
    message: /`floja` tiene que ser la pareja de `lista_pares` con el coseno más bajo/,
    failures: 1,
  },
  {
    name: 'cos_otra con otra pareja de capital',
    append: `${REF}cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
${FLOJA_OK}cos_otra = coseno(ref, vector("París") - vector("Francia"))
`,
    message: /`cos_otra` tiene que ser el coseno entre mujer - hombre y Roma - Italia/,
    failures: 1,
  },
  {
    name: 'cos_rel con cuatro números que no son cosenos',
    append: `${REF}cos_rel = np.array([1, 2, 3, 4])
${FLOJA_OK}${COS_OK}`,
    message: /`cos_rel` tiene que valer el coseno entre mujer - hombre y destino - origen/,
    failures: 1,
  },
]);

// ---------- ex02.5: contar aciertos y dibujar los puestos ----------

const PUESTOS =
  'lista_puestos = [ranking(a, b, c).index(esperada) + 1 for a, b, c, esperada in lista_casos]\n';

accepts('analogias.ex02.5', [
  {
    name: 'con un bucle y lista_puestos como array',
    append: `lista_puestos = []
for a, b, c, esperada in lista_casos:
    lista_puestos.append(ranking(a, b, c).index(esperada) + 1)
lista_puestos = np.array(lista_puestos)
plt.bar(np.arange(11), lista_puestos)
n_aciertos = int(np.sum(lista_puestos == 1))
`,
  },
  {
    name: 'con ax.bar',
    append: `${PUESTOS}fig, ax = plt.subplots()
ax.bar(range(11), lista_puestos)
n_aciertos = lista_puestos.count(1)
`,
  },
  {
    name: 'con una figura nueva y etiquetas',
    append: `${PUESTOS}plt.figure()
plt.bar(range(len(lista_casos)), lista_puestos)
plt.xlabel("caso")
plt.ylabel("puesto de la esperada")
n_aciertos = len([p for p in lista_puestos if p == 1])
`,
  },
  {
    name: 'con los puestos como tupla',
    append: `lista_puestos = tuple(ranking(*caso[:3]).index(caso[3]) + 1 for caso in lista_casos)
plt.bar(range(11), lista_puestos)
n_aciertos = sum(1 for p in lista_puestos if p == 1)
`,
  },
]);
rejects('analogias.ex02.5', [
  {
    name: 'puestos que empiezan en 0',
    append: `lista_puestos = [ranking(a, b, c).index(esperada) for a, b, c, esperada in lista_casos]
plt.bar(range(11), [p + 1 for p in lista_puestos])
n_aciertos = 8
`,
    message: /empieza a contar en 0/,
    failures: 1,
  },
  {
    name: 'n_aciertos es una proporción',
    append: `${PUESTOS}plt.bar(range(11), lista_puestos)
n_aciertos = sum(p == 1 for p in lista_puestos) / 11
`,
    message: /parece una proporción/,
    failures: 1,
  },
  {
    name: 'n_aciertos cuenta también el puesto 2',
    append: `${PUESTOS}plt.bar(range(11), lista_puestos)
n_aciertos = sum(p <= 2 for p in lista_puestos)
`,
    message: /también los casos con la esperada en el puesto 2/,
    failures: 1,
  },
  {
    name: 'n_aciertos cuenta los fallos',
    append: `${PUESTOS}plt.bar(range(11), lista_puestos)
n_aciertos = sum(p > 1 for p in lista_puestos)
`,
    message: /`n_aciertos` tiene que contar los casos con la palabra esperada en el puesto 1/,
    failures: 1,
  },
  {
    name: 'sin dibujar',
    append: `${PUESTOS}n_aciertos = 8
`,
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'una línea en vez de barras',
    append: `${PUESTOS}plt.plot(lista_puestos)
n_aciertos = 8
`,
    message: /No hay barras en la figura/,
    failures: 1,
  },
  {
    name: 'diez barras',
    append: `${PUESTOS}plt.bar(range(10), lista_puestos[:10])
n_aciertos = 8
`,
    message: /barras de más o de menos/,
    failures: 1,
  },
  {
    name: 'barras con otra altura',
    append: `${PUESTOS}plt.bar(range(11), [1] * 11)
n_aciertos = 8
`,
    message: /La altura de cada barra/,
    failures: 1,
  },
]);

// ---------- pistas: los ejemplos se ejecutan y el esqueleto de la última pista, rellenado, aprueba ----------

/** Lo que el jugador escribe en cada hueco `___` del esqueleto de la última pista, en orden. */
const SKELETON_FILLS: Record<string, string[]> = {
  'analogias.ex02.1': ['-', '+', 'np.linalg.norm(w)', 'w_unit'],
  'analogias.ex02.2': ['-', '+', '(a, b, c)', 'palabras[i]', '"rey"', '"hombre"', '"mujer"'],
  'analogias.ex02.3': ['puntos(a, b, c)', 'palabras[pos]', 'in'],
  'analogias.ex02.4': ['destino', 'origen', 'np.argmin(cos_rel)', 'otra[1]', 'otra[0]'],
  'analogias.ex02.5': ['esperada', 'pos + 1', 'puesto == 1'],
};

defineHintTests(
  projectQuestions(analogias).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- examen-3.consistencia ----------

const CONS = 'consist_rey = consistencia("hombre", "mujer", "rey", "reina")\n';

accepts(CONSIST, [
  {
    name: 'con np.dot y las normas',
    append: `def consistencia(a, b, c, d):
    u = vector(b) - vector(a)
    v = vector(d) - vector(c)
    return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))
${CONS}`,
  },
  {
    name: 'con las diferencias normalizadas',
    append: `def consistencia(a, b, c, d):
    u = vector(b) - vector(a)
    v = vector(d) - vector(c)
    return float((u / np.linalg.norm(u)) @ (v / np.linalg.norm(v)))
${CONS}`,
  },
  {
    name: 'con el coseno por la fórmula del ángulo',
    append: `def consistencia(a, b, c, d):
    u, v = vector(b) - vector(a), vector(d) - vector(c)
    return np.sum(u * v) / np.sqrt(np.sum(u ** 2) * np.sum(v ** 2))
${CONS}`,
  },
]);
rejects(CONSIST, [
  {
    name: 'el producto escalar sin normas',
    append: `def consistencia(a, b, c, d):
    return (vector(b) - vector(a)) @ (vector(d) - vector(c))
${CONS}`,
    message: /devuelve un producto escalar/,
    failures: 1,
  },
  {
    name: 'una de las dos relaciones al revés',
    append: `def consistencia(a, b, c, d):
    u = vector(a) - vector(b)
    v = vector(d) - vector(c)
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))
${CONS}`,
    message: /signos cambiados/,
    failures: 1,
  },
  {
    name: 'con las palabras en vez de las diferencias',
    append: `def consistencia(a, b, c, d):
    u = vector(b) + vector(a)
    v = vector(d) + vector(c)
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))
${CONS}`,
    message:
      /tiene que ser el coseno entre `vector\(b\) - vector\(a\)` y `vector\(d\) - vector\(c\)`/,
    failures: 1,
  },
  {
    name: 'la función es correcta pero consist_rey no la usa',
    append: `def consistencia(a, b, c, d):
    u = vector(b) - vector(a)
    v = vector(d) - vector(c)
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))
consist_rey = 1.0
`,
    message: /`consist_rey` tiene que guardar lo que devuelve `consistencia`/,
    failures: 1,
  },
  {
    name: 'devuelve un entero',
    append: `def consistencia(a, b, c, d):
    return 1
${CONS}`,
    message: /tiene que devolver un número decimal/,
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

// ---------- cifras de datos reales del contenido, contra el módulo `embeddings` ----------

/** Todas las cifras reales que aparecen en el contenido, calculadas con el módulo `embeddings` intacto. */
const REAL_DATA = `import json
import numpy as np
import embeddings as e
v = e.vector
def cos(u, w):
    return float(u @ w / (np.linalg.norm(u) * np.linalg.norm(w)))
def ranking(a, b, c, excluir=True):
    w = v(a) - v(b) + v(c)
    s = e.P @ w / np.linalg.norm(w)
    orden = [(e.palabras[int(i)], round(float(s[int(i)]), 4)) for i in np.argsort(s)[::-1]]
    return [(p, x) for p, x in orden if not excluir or p not in (a, b, c)]
def puesto(a, b, c, esperada):
    return [p for p, _x in ranking(a, b, c)].index(esperada) + 1
casos = [("rey", "hombre", "mujer", "reina"), ("padre", "hombre", "mujer", "madre"), ("príncipe", "hombre", "mujer", "princesa"), ("hijo", "hombre", "mujer", "hija"), ("Roma", "Italia", "Alemania", "Berlín"), ("Lisboa", "Portugal", "Francia", "París"), ("París", "Francia", "España", "Madrid"), ("Madrid", "España", "Italia", "Roma"), ("Berlín", "Alemania", "Portugal", "Lisboa"), ("gato", "tigre", "lobo", "perro"), ("coche", "camión", "tren", "bici")]
w = v("rey") - v("hombre") + v("mujer")
dh = v("mujer") - v("hombre")
out = {
    "modelo": e.modelo,
    "dim": e.dimension,
    "norma_w": float(np.linalg.norm(w)),
    "dot_reina": float(w @ v("reina")),
    "cos_reina": cos(w, v("reina")),
    "cos_rey_reina": cos(dh, v("reina") - v("rey")),
    "cos_hijo_hija": cos(dh, v("hija") - v("hijo")),
    "cos_padre_madre": cos(dh, v("madre") - v("padre")),
    "cos_principe_princesa": cos(dh, v("princesa") - v("príncipe")),
    "cos_italia_roma": cos(dh, v("Roma") - v("Italia")),
    "berlin_sin": ranking("Roma", "Italia", "Alemania", False)[:2],
    "berlin_con": ranking("Roma", "Italia", "Alemania")[:1],
    "madrid_sin": ranking("París", "Francia", "España", False)[:4],
    "madrid_con": ranking("París", "Francia", "España")[:2],
    "hijo_con": ranking("hijo", "hombre", "mujer")[:1],
    "puesto_hija": puesto("hijo", "hombre", "mujer", "hija"),
    "puestos": [puesto(a, b, c, x) for a, b, c, x in casos],
    "perro_cos": [x for p, x in ranking("gato", "tigre", "lobo") if p == "perro"][0],
    "madrid_cos": [x for p, x in ranking("París", "Francia", "España") if p == "Madrid"][0],
    "madrid_italia_sin": ranking("Madrid", "España", "Italia", False)[:4],
    "madrid_italia_con": ranking("Madrid", "España", "Italia")[:1],
    "ganadoras_sin": [ranking(a, b, c, False)[0][0] for a, b, c in [("rey", "hombre", "mujer"), ("Roma", "Italia", "Alemania"), ("Lisboa", "Portugal", "Francia"), ("París", "Francia", "España"), ("Madrid", "España", "Italia"), ("gato", "tigre", "lobo")]],
    "consist": cos(v("mujer") - v("hombre"), v("reina") - v("rey")),
}
print(json.dumps(out))
`;

interface RealData {
  modelo: string;
  dim: number;
  norma_w: number;
  dot_reina: number;
  cos_reina: number;
  cos_rey_reina: number;
  cos_hijo_hija: number;
  cos_padre_madre: number;
  cos_principe_princesa: number;
  cos_italia_roma: number;
  berlin_sin: [string, number][];
  berlin_con: [string, number][];
  madrid_sin: [string, number][];
  madrid_con: [string, number][];
  hijo_con: [string, number][];
  puesto_hija: number;
  puestos: number[];
  perro_cos: number;
  madrid_cos: number;
  madrid_italia_sin: [string, number][];
  madrid_italia_con: [string, number][];
  ganadoras_sin: string[];
  consist: number;
}

const r2 = (x: number): number => Math.round(x * 100) / 100;
const names = (l: [string, number][]): string[] => l.map(([p]) => p);
const cosines = (l: [string, number][]): number[] => l.map(([, x]) => r2(x));

describe(
  'cifras de datos reales del contenido, contra el módulo embeddings',
  { timeout: 60_000 },
  () => {
    let d: RealData;
    beforeAll(async () => {
      const r = await runInPyodide(pyodide, REAL_DATA, '');
      expect(r.error, describeRun(r)).toBeNull();
      d = JSON.parse(r.stdout.trim()) as RealData;
    }, PYODIDE_LOAD_TIMEOUT_MS);

    it('el modelo y las dimensiones', () => {
      // contract: encargo común de la Órbita 3 (commit ebf516f): paraphrase-multilingual-MiniLM-L12-v2, 384 dimensiones
      expect([d.modelo, d.dim]).toEqual(['paraphrase-multilingual-MiniLM-L12-v2', 384]);
    });

    it('ex02.1: rey − hombre + mujer mide 1,07; su producto escalar con «reina» es 0,88 y su coseno, 0,82', () => {
      // contract: hoja de datos (analogías): rey − hombre + mujer → reina 0,822; solution de ex02.1 y de la hoja 3
      expect([r2(d.norma_w), r2(d.dot_reina), r2(d.cos_reina)]).toEqual([1.07, 0.88, 0.82]);
    });

    it('ex01.2, ex02.4 y el examen: cosenos entre relaciones', () => {
      // contract: solution de ex01.2 y de ex02.4: 0,68 (rey → reina), 0,79 (padre → madre), 0,73 (príncipe → princesa), 0,18 (hijo → hija) y 0,05 (Italia → Roma)
      expect([
        r2(d.cos_rey_reina),
        r2(d.cos_padre_madre),
        r2(d.cos_principe_princesa),
        r2(d.cos_hijo_hija),
        r2(d.cos_italia_roma),
      ]).toEqual([0.68, 0.79, 0.73, 0.18, 0.05]);
      // contract: solution de examen-3.consistencia: la consistencia de hombre → mujer con rey → reina es 0,68 (y su signo cambia al invertir una de las dos, por linealidad)
      expect(r2(d.consist)).toBe(0.68);
    });

    it('ex01.3 y la hoja 2: Roma − Italia + Alemania', () => {
      // contract: hoja de datos y solution de ex01.3: sin excluir, Alemania 0,83 y Berlín 0,80; excluyendo, gana Berlín
      expect(names(d.berlin_sin)).toEqual(['Alemania', 'Berlín']);
      expect(cosines(d.berlin_sin)).toEqual([0.83, 0.8]);
      expect(names(d.berlin_con)).toEqual(['Berlín']);
    });

    it('ex01.4: París − Francia + España', () => {
      // contract: enunciado de ex01.4: España 0,88, París 0,77, Lisboa 0,76 y Madrid 0,64 sin excluir
      expect(names(d.madrid_sin)).toEqual(['España', 'París', 'Lisboa', 'Madrid']);
      expect(cosines(d.madrid_sin)).toEqual([0.88, 0.77, 0.76, 0.64]);
      // contract: solution de ex01.4: excluyendo las entradas, Lisboa es la 1.ª y Madrid la 2.ª
      expect(names(d.madrid_con)).toEqual(['Lisboa', 'Madrid']);
    });

    it('ex00.5, ex01.5 y ex02.5: hijo − hombre + mujer gana «madre», «hija» es la 5.ª; 8 aciertos de 11', () => {
      // contract: hoja de datos y solution de ex00.5: hijo − hombre + mujer → madre, hija en el puesto 5
      expect(names(d.hijo_con)).toEqual(['madre']);
      expect(d.puesto_hija).toBe(5);
      // contract: hoja de datos y solution de ex02.5: puestos 1, 1, 1, 5, 1, 1, 2, 1, 1, 1 y 27 (los fallos: hija 5.ª, Madrid 2.ª, bici 27.ª)
      expect(d.puestos).toEqual([1, 1, 1, 5, 1, 1, 2, 1, 1, 1, 27]);
      // contract: solution de ex01.5 y de ex02.5: 8 de 11 acertados (puesto 1)
      expect(d.puestos.filter((p) => p === 1)).toHaveLength(8);
    });

    it('ex01.5: «Madrid» tiene 0,64 y falla; «perro» tiene 0,50 y acierta', () => {
      // contract: solution de ex01.5: Madrid 0,64 con París − Francia + España (2.ª, falla) y perro 0,50 con gato − tigre + lobo (1.ª, acierta)
      expect(r2(d.madrid_cos)).toBe(0.64);
      expect(r2(d.perro_cos)).toBe(0.5);
      expect([d.puestos[6], d.puestos[9]]).toEqual([2, 1]);
    });

    it('ex02.3: ganadoras sin excluir y cuántas son una de las tres entradas', () => {
      // contract: solution de ex02.3: sin excluir ganan reina, Alemania, París, España, Madrid y gato; 4 de 6 son una entrada de su caso
      expect(d.ganadoras_sin).toEqual(['reina', 'Alemania', 'París', 'España', 'Madrid', 'gato']);
      const casos = [
        ['rey', 'hombre', 'mujer'],
        ['Roma', 'Italia', 'Alemania'],
        ['Lisboa', 'Portugal', 'Francia'],
        ['París', 'Francia', 'España'],
        ['Madrid', 'España', 'Italia'],
        ['gato', 'tigre', 'lobo'],
      ];
      expect(d.ganadoras_sin.filter((g, i) => casos[i]!.includes(g))).toHaveLength(4);
      // contract: mensaje de ex02.3: «París» es entrada del cuarto caso y no del tercero, donde gana: contarlo contra todos los casos da 5
      const todas = new Set(casos.flat());
      expect(d.ganadoras_sin.filter((g) => todas.has(g))).toHaveLength(5);
    });

    it('examen-3.excluir-entradas: Madrid − España + Italia', () => {
      // contract: enunciado del examen: sin excluir, Madrid 0,77, Italia 0,77, Roma 0,63 y Lisboa 0,58; al excluir las entradas gana Roma
      expect(names(d.madrid_italia_sin)).toEqual(['Madrid', 'Italia', 'Roma', 'Lisboa']);
      expect(cosines(d.madrid_italia_sin)).toEqual([0.77, 0.77, 0.63, 0.58]);
      expect(names(d.madrid_italia_con)).toEqual(['Roma']);
    });

    it('hoja 2: la función con la exclusión incompleta devuelve «Alemania» y la correcta, «Berlín»', async () => {
      const sheet = analogias.sheets[1]!;
      if (sheet.type !== 'revision') throw new Error('la hoja 2 es una revisión');
      const fn = sheet.lines.join('\n');
      const header = 'import numpy as np\nfrom embeddings import palabras, P, vector\n';
      const r = await runInPyodide(
        pyodide,
        `${header}${fn}\nprint(analogia("Roma", "Italia", "Alemania"))\n`,
        '',
      );
      // contract: solution de la hoja 2: con la exclusión incompleta, Roma − Italia + Alemania devuelve «Alemania», una entrada
      expect(r.stdout.trim(), describeRun(r)).toBe('Alemania');
      const fixed = fn.replace(
        '    puntos[palabras.index(b)] = -np.inf',
        '    for p in (a, b, c):\n        puntos[palabras.index(p)] = -np.inf',
      );
      const r2run = await runInPyodide(
        pyodide,
        `${header}${fixed}\nprint(analogia("Roma", "Italia", "Alemania"))\n`,
        '',
      );
      // contract: con las tres entradas excluidas, la misma función devuelve «Berlín»
      expect(r2run.stdout.trim(), describeRun(r2run)).toBe('Berlín');
    });
  },
);
