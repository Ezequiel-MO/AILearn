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
import { dimensionAlta } from './dimension-alta';
import { examen2DimensionAlta } from './examen-2-dimension-alta';

// El proyecto todavía no está en el registro del juego, así que tests/content/python.test.ts no lo
// recorre: aquí se comprueban sus cinco preguntas de código y la del banco de examen (la referencia
// pasa, el `starter` no), las soluciones correctas distintas de la de referencia y los errores típicos.
// Lanzar desde la raíz del repo (la caché de Pyodide usa process.cwd()).

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const bankCode = examen2DimensionAlta
  .map((e) => e.question)
  .filter((q): q is CodigoQ => q.type === 'codigo');

const byId = new Map(
  [
    ...projectQuestions(dimensionAlta).filter((q): q is CodigoQ => q.type === 'codigo'),
    ...bankCode,
  ].map((q) => [q.id, q]),
);
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const UMBRAL = 'examen-2.umbral';

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay cinco preguntas de código en el proyecto y una en el banco', () => {
    // contract: encargo común de la Órbita 2: ex02 programar (cinco preguntas de código) y una pregunta de código en el banco
    expect([...byId.keys()]).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `dimension-alta.ex02.${n}`),
      UMBRAL,
    ]);
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

/** Una función `nombre(parámetros)` con su cuerpo sangrado, para añadir tras el `starter`. */
const fn = (name: string, params: string, body: string): string =>
  `\ndef ${name}(${params}):\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;

// ---------- ex02.1: cosenos(d, n) ----------

const COSENOS = (body: string): string => fn('cosenos', 'd, n', body);

accepts('dimension-alta.ex02.1', [
  {
    name: 'con matrices, sin bucle',
    append: COSENOS(
      'A = rng.normal(size=(n, d))\nB = rng.normal(size=(n, d))\nreturn np.sum(A * B, axis=1) / (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1))',
    ),
  },
  {
    name: 'lista por comprensión',
    append: COSENOS(
      'def una():\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))\nreturn np.array([una() for _ in range(n)])',
    ),
  },
  {
    // contract: sonda: devolver una lista de Python en vez de un array es correcto, el enunciado pide «un array» pero las comprobaciones miran los números
    name: 'devuelve una lista de Python',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    res.append(float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))))\nreturn res',
    ),
  },
  {
    // contract: sonda: componentes uniformes en [-1, 1] son simétricas y dan la misma desviación típica 1/√d
    name: 'componentes uniformes entre -1 y 1',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.uniform(-1, 1, size=d)\n    b = rng.uniform(-1, 1, size=d)\n    res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))\nreturn np.array(res)',
    ),
  },
  {
    name: 'vectores unitarios antes del producto escalar',
    append: COSENOS(
      'res = np.zeros(n)\nfor i in range(n):\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    res[i] = np.dot(a / np.linalg.norm(a), b / np.linalg.norm(b))\nreturn res',
    ),
  },
  {
    name: 'con el generador global de NumPy',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = np.random.normal(size=d)\n    b = np.random.normal(size=d)\n    res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))\nreturn np.array(res)',
    ),
  },
]);
rejects('dimension-alta.ex02.1', [
  {
    name: 'solo el producto escalar',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    res.append(np.dot(a, b))\nreturn np.array(res)',
    ),
    message: /se sale del intervalo de -1 a 1/,
    failures: 1,
  },
  {
    name: 'solo una norma',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    res.append(np.dot(a, b) / np.linalg.norm(a))\nreturn np.array(res)',
    ),
    message: /se sale del intervalo de -1 a 1/,
    failures: 1,
  },
  {
    name: 'números al azar solo positivos',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.random(d)\n    b = rng.random(d)\n    res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))\nreturn np.array(res)',
    ),
    message: /no se centran en 0.*rng\.normal/,
    failures: 1,
  },
  {
    name: 'la misma pareja repetida n veces',
    append: COSENOS(
      'a = rng.normal(size=d)\nb = rng.normal(size=d)\nc = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))\nreturn np.array([c] * n)',
    ),
    message: /no se centran en 0|La dispersión de tus cosenos/,
    failures: 1,
  },
  {
    name: 'vectores de dos componentes sea cual sea d',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.normal(size=2)\n    b = rng.normal(size=2)\n    res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))\nreturn np.array(res)',
    ),
    message: /La dispersión de tus cosenos.*d = 100/,
    failures: 1,
  },
  {
    name: 'sin return',
    append: COSENOS(
      'res = []\nfor _ in range(n):\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))',
    ),
    message: /falta el `return`/,
    failures: 1,
  },
  {
    name: 'devuelve un solo coseno',
    append: COSENOS(
      'a = rng.normal(size=d)\nb = rng.normal(size=d)\nreturn np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))',
    ),
    message: /tiene que devolver un array con `n` números/,
    failures: 1,
  },
  {
    name: 'devuelve n - 1 cosenos',
    append: COSENOS(
      'res = []\nfor _ in range(n - 1):\n    a = rng.normal(size=d)\n    b = rng.normal(size=d)\n    res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))\nreturn np.array(res)',
    ),
    message: /tiene que devolver un array con `n` números/,
    failures: 1,
  },
  // contract: review-18r m2 (cadenas y None en lo que devuelve la función no rompen las comprobaciones)
  {
    name: 'devuelve un texto',
    append: COSENOS('return "hola"'),
    message: /tiene que devolver un array con `n` números/,
    failures: 1,
  },
  {
    name: 'devuelve un array de texto',
    append: COSENOS('return np.array(["a"] * n)'),
    message: /tiene que devolver un array con `n` números/,
    failures: 1,
  },
  {
    name: 'una función que da error',
    append: COSENOS('return cos_total'),
    message: /tiene que devolver un array con `n` números/,
    failures: 1,
  },
]);

// ---------- ex02.2: desviación típica frente a 1 / raíz de d ----------

const SD_OK = 'sd = np.array([np.std(cosenos(d, 2000)) for d in dims])\n';
const TEORIA_OK = 'teoria = 1 / np.sqrt(dims)\n';

accepts('dimension-alta.ex02.2', [
  {
    name: 'con un bucle y listas',
    append:
      'sd = []\nteoria = []\nfor d in dims:\n    sd.append(np.std(cosenos(d, 2000)))\n    teoria.append(1 / np.sqrt(d))\n',
  },
  {
    name: 'menos cosenos por d',
    append: 'sd = np.array([np.std(cosenos(d, 1000)) for d in dims])\n' + TEORIA_OK,
  },
  { name: 'la teoría con una potencia', append: SD_OK + 'teoria = dims ** -0.5\n' },
  { name: 'la teoría con una lista', append: SD_OK + 'teoria = [1 / np.sqrt(d) for d in dims]\n' },
  {
    name: 'desviación típica con ddof',
    append: 'sd = np.array([np.std(cosenos(d, 2000), ddof=1) for d in dims])\n' + TEORIA_OK,
  },
  {
    name: 'la desviación típica a mano',
    append: 'sd = np.array([np.sqrt(np.mean(cosenos(d, 2000) ** 2)) for d in dims])\n' + TEORIA_OK,
  },
]);
rejects('dimension-alta.ex02.2', [
  {
    name: 'la teoría con 1 / d',
    append: SD_OK + 'teoria = 1 / dims\n',
    message: /`teoria` vale 1 \/ d: has dividido entre d/,
    failures: 1,
  },
  {
    name: 'la teoría con la raíz sin invertir',
    append: SD_OK + 'teoria = np.sqrt(dims)\n',
    message: /`teoria` no vale 1 entre la raíz de cada d/,
    failures: 1,
  },
  {
    name: 'la varianza en lugar de la desviación típica',
    append: 'sd = np.array([np.var(cosenos(d, 2000)) for d in dims])\n' + TEORIA_OK,
    message: /`sd` vale 1 \/ d: es la varianza/,
    failures: 1,
  },
  {
    name: 'muy pocos cosenos',
    append: 'sd = np.array([np.std(cosenos(d, 4)) for d in dims])\n' + TEORIA_OK,
    message: /`sd` no se parece a 1 \/ raíz de d/,
    failures: 1,
  },
  {
    name: 'la media en lugar de la desviación típica',
    append: 'sd = np.array([np.mean(cosenos(d, 2000)) for d in dims])\n' + TEORIA_OK,
    message: /`sd` no se parece a 1 \/ raíz de d/,
    failures: 1,
  },
  {
    name: 'solo tres dimensiones',
    append: 'sd = np.array([np.std(cosenos(d, 2000)) for d in dims[:3]])\n' + TEORIA_OK,
    message: /`sd` tiene que ser un array o una lista con 4 números/,
    failures: 1,
  },
  {
    name: 'textos',
    append: 'sd = "hola"\nteoria = "hola"\n',
    message: /`sd` tiene que ser un array.*`teoria` tiene que ser un array/,
    failures: 2,
  },
]);

// ---------- ex02.3: histogramas de los cosenos ----------

accepts('dimension-alta.ex02.3', [
  {
    name: 'dos ejes, uno por histograma',
    append:
      'fig, ax = plt.subplots(1, 2)\nax[0].hist(cosenos(2, 2000), bins=40, range=(-1, 1))\nax[1].hist(cosenos(1000, 2000), bins=40, range=(-1, 1))\n',
  },
  {
    name: 'sin opciones: los tramos por defecto',
    append: 'plt.hist(cosenos(2, 2000))\nplt.hist(cosenos(1000, 2000))\n',
  },
  {
    name: 'con densidad',
    append:
      'plt.hist(cosenos(2, 2000), bins=30, density=True, alpha=0.5, label="d = 2")\nplt.hist(cosenos(1000, 2000), bins=30, density=True, alpha=0.5, label="d = 1000")\nplt.legend()\n',
  },
  {
    name: 'los datos en variables',
    append:
      'c2 = cosenos(2, 2000)\nc1000 = cosenos(1000, 2000)\nplt.hist(c2, bins=50, range=(-1, 1))\nplt.hist(c1000, bins=50, range=(-1, 1))\nplt.xlabel("coseno")\n',
  },
  {
    name: 'más parejas y menos tramos',
    append:
      'plt.hist(cosenos(2, 3000), bins=20, range=(-1, 1))\nplt.hist(cosenos(1000, 3000), bins=20, range=(-1, 1))\n',
  },
]);
rejects('dimension-alta.ex02.3', [
  {
    name: 'solo el histograma de d = 2',
    append: 'plt.hist(cosenos(2, 2000), bins=40, range=(-1, 1))\n',
    message: /menos de dos histogramas/,
    failures: 1,
  },
  {
    name: 'dos veces d = 1000',
    append:
      'plt.hist(cosenos(1000, 2000), bins=40, range=(-1, 1))\nplt.hist(cosenos(1000, 2000), bins=40, range=(-1, 1))\n',
    message: /No veo el histograma de d = 2/,
    failures: 1,
  },
  {
    name: 'dos veces d = 2',
    append:
      'plt.hist(cosenos(2, 2000), bins=40, range=(-1, 1))\nplt.hist(cosenos(2, 2000), bins=40, range=(-1, 1))\n',
    message: /No veo el histograma de d = 1000/,
    failures: 1,
  },
  {
    name: 'una línea en lugar de histogramas',
    append: 'plt.plot(cosenos(2, 2000))\nplt.plot(cosenos(1000, 2000))\n',
    message: /menos de dos histogramas/,
    failures: 1,
  },
  {
    name: 'números sin relación con los cosenos',
    append: 'plt.hist(np.random.rand(2000))\nplt.hist(np.random.rand(2000))\n',
    message: /No veo el histograma de d = 2/,
  },
]);

// ---------- ex02.4: razón entre la mayor y la menor distancia ----------

const RAZON = (body: string): string =>
  `razon = []\nfor d in dims:\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;

accepts('dimension-alta.ex02.4', [
  {
    name: 'la norma a mano',
    append: RAZON(
      'P = rng.normal(size=(500, d))\nq = rng.normal(size=d)\ndist = np.sqrt(np.sum((P - q) ** 2, axis=1))\nrazon.append(dist.max() / dist.min())',
    ),
  },
  {
    name: 'np.max y np.min, con la consulta antes',
    append: RAZON(
      'q = rng.normal(size=d)\nP = rng.normal(size=(500, d))\ndist = np.linalg.norm(P - q, axis=1)\nrazon.append(np.max(dist) / np.min(dist))',
    ),
  },
  {
    name: 'menos puntos y la razón en un array',
    append:
      'razon = np.zeros(4)\nfor i, d in enumerate(dims):\n    P = rng.normal(size=(300, d))\n    q = rng.normal(size=d)\n    dist = np.linalg.norm(P - q, axis=1)\n    razon[i] = dist.max() / dist.min()\n',
  },
  {
    name: 'una distancia por punto con un bucle',
    append: RAZON(
      'P = rng.normal(size=(500, d))\nq = rng.normal(size=d)\ndist = [np.linalg.norm(p - q) for p in P]\nrazon.append(max(dist) / min(dist))',
    ),
  },
]);
rejects('dimension-alta.ex02.4', [
  {
    name: 'al revés: la menor entre la mayor',
    append: RAZON(
      'P = rng.normal(size=(500, d))\nq = rng.normal(size=d)\ndist = np.linalg.norm(P - q, axis=1)\nrazon.append(dist.min() / dist.max())',
    ),
    message: /Alguna razón es menor que 1.*al revés/,
    failures: 1,
  },
  {
    name: 'una sola distancia para toda la matriz',
    append: RAZON(
      'P = rng.normal(size=(500, d))\nq = rng.normal(size=d)\ndist = np.linalg.norm(P - q)\nrazon.append(dist.max() / dist.min())',
    ),
    message: /Todas las razones valen 1/,
    failures: 1,
  },
  {
    name: 'una resta en lugar de un cociente',
    append: RAZON(
      'P = rng.normal(size=(500, d))\nq = rng.normal(size=d)\ndist = np.linalg.norm(P - q, axis=1)\nrazon.append(dist.max() - dist.min())',
    ),
    message: /Las razones no bajan al subir d.*cociente/,
    failures: 1,
  },
  {
    name: 'solo la última dimensión',
    append: RAZON(
      'P = rng.normal(size=(500, d))\nq = rng.normal(size=d)\ndist = np.linalg.norm(P - q, axis=1)\nrazon = [dist.max() / dist.min()]',
    ),
    message: /`razon` tiene que ser una lista o un array con 4 números/,
    failures: 1,
  },
  {
    name: 'un texto',
    append: 'razon = "hola"\n',
    message: /`razon` tiene que ser una lista o un array con 4 números/,
    failures: 1,
  },
]);

// ---------- ex02.5: fracción de parejas casi perpendiculares ----------

const FRAC = (body: string): string =>
  `frac = []\nfor d in dims:\n${body
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n`;
const NORMALIZADA =
  'E = rng.normal(size=(300, d))\nE = E / np.linalg.norm(E, axis=1, keepdims=True)\nC = E @ E.T\n';
const PAREJAS = 'i, j = np.triu_indices(300, k=1)\n';

accepts('dimension-alta.ex02.5', [
  {
    name: 'con toda la matriz, la diagonal incluida',
    append: FRAC(NORMALIZADA + 'frac.append(np.mean(np.abs(C) < 0.2))'),
  },
  {
    name: 'con menor o igual',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac.append(np.mean(np.abs(C[i, j]) <= 0.2))'),
  },
  {
    name: 'normalizando con la raíz a mano y menos vectores',
    append: FRAC(
      'E = rng.normal(size=(200, d))\nE = E / np.sqrt(np.sum(E ** 2, axis=1, keepdims=True))\nC = E @ E.T\ni, j = np.triu_indices(200, k=1)\nfrac.append(np.mean(np.abs(C[i, j]) < 0.2))',
    ),
  },
  {
    name: 'contando y dividiendo entre el total',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac.append(np.sum(np.abs(C[i, j]) < 0.2) / len(i))'),
  },
  {
    name: 'con una máscara por encima de la diagonal',
    append: FRAC(
      NORMALIZADA +
        'sup = np.triu(np.ones((300, 300), dtype=bool), k=1)\nfrac.append(np.mean(np.abs(C[sup]) < 0.2))',
    ),
  },
]);
rejects('dimension-alta.ex02.5', [
  {
    name: 'sin normalizar las filas',
    append: FRAC(
      'E = rng.normal(size=(300, d))\nC = E @ E.T\n' +
        PAREJAS +
        'frac.append(np.mean(np.abs(C[i, j]) < 0.2))',
    ),
    message: /sale casi 0 en dimensión alta.*antes de calcular/,
    failures: 1,
  },
  {
    name: 'sin el valor absoluto',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac.append(np.mean(C[i, j] < 0.2))'),
    message: /cosenos muy negativos.*np\.abs/,
    failures: 1,
  },
  {
    name: 'un recuento en lugar de una fracción',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac.append(np.sum(np.abs(C[i, j]) < 0.2))'),
    message: /fuera del intervalo de 0 a 1/,
    failures: 1,
  },
  {
    name: 'la fracción de las parejas que no son casi perpendiculares',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac.append(np.mean(np.abs(C[i, j]) >= 0.2))'),
    message: /`frac` no es la esperada/,
    failures: 1,
  },
  {
    name: 'un umbral veinte veces menor',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac.append(np.mean(np.abs(C[i, j]) < 0.01))'),
    message: /`frac` no es la esperada|sale casi 0/,
    failures: 1,
  },
  {
    name: 'solo la última dimensión',
    append: FRAC(NORMALIZADA + PAREJAS + 'frac = [np.mean(np.abs(C[i, j]) < 0.2)]'),
    message: /`frac` tiene que ser una lista o un array con 4 números/,
    failures: 1,
  },
  {
    name: 'un texto',
    append: 'frac = "hola"\n',
    message: /`frac` tiene que ser una lista o un array con 4 números/,
    failures: 1,
  },
]);

// ---------- banco: examen-2.umbral ----------

const SENAL = (body: string): string => fn('es_senal', 'c, d', body);

accepts(UMBRAL, [
  { name: 'el umbral dentro de la comparación', append: SENAL('return abs(c) > 3 / np.sqrt(d)') },
  { name: 'con np.abs y una potencia', append: SENAL('return bool(np.abs(c) > 3 * d ** -0.5)') },
  { name: 'con el cuadrado del coseno', append: SENAL('return c ** 2 > 9 / d') },
  {
    name: 'con un if',
    append: SENAL('ruido = 1 / np.sqrt(d)\nif abs(c) > 3 * ruido:\n    return True\nreturn False'),
  },
  {
    name: 'negando estar dentro de la banda',
    append: SENAL('r = 3 / np.sqrt(d)\nreturn not (-r <= c <= r)'),
  },
]);
rejects(UMBRAL, [
  {
    name: 'sin el valor absoluto',
    append: SENAL('return c > 3 / np.sqrt(d)'),
    message: /dan `False`, pero esos cosenos son señal/,
    failures: 1,
  },
  {
    name: 'sin multiplicar por 3',
    append: SENAL('return abs(c) > 1 / np.sqrt(d)'),
    message: /devuelve `True` en todos los casos/,
    failures: 1,
  },
  {
    name: 'dividiendo entre d en lugar de entre su raíz',
    append: SENAL('return abs(c) > 3 / d'),
    message: /devuelve `True` en todos los casos/,
    failures: 1,
  },
  {
    name: 'multiplicando por la raíz',
    append: SENAL('return abs(c) > 3 * np.sqrt(d)'),
    message: /dan `False`/,
    failures: 1,
  },
  {
    name: 'un umbral de 2 veces el ruido',
    append: SENAL('return abs(c) > 2 / np.sqrt(d)'),
    message: /no da el resultado esperado en todos los casos/,
    failures: 1,
  },
  {
    name: 'sin return',
    append: SENAL('ruido = 1 / np.sqrt(d)'),
    message: /tiene que devolver `True` o `False`/,
    failures: 1,
  },
  {
    name: 'devuelve el valor absoluto, un número',
    append: SENAL('return abs(c)'),
    message: /tiene que devolver `True` o `False`/,
    failures: 1,
  },
  {
    name: 'devuelve un texto',
    append: SENAL('return "sí"'),
    message: /tiene que devolver `True` o `False`/,
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
