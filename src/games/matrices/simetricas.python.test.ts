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
import { simetricas } from './simetricas';
import { examen2Simetricas } from './examen-2-simetricas';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(simetricas), ...examen2Simetricas.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'simetricas.ex02.1',
  'simetricas.ex02.2',
  'simetricas.ex02.3',
  'simetricas.ex02.4',
  'simetricas.ex02.5',
  'examen-2.autovalores-de-mayor-a-menor',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una
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

// ---------- simetricas.ex02.1: np.cov y qué toma como variable ----------

accepts('simetricas.ex02.1', [
  {
    name: 'np.cov de la traspuesta, con índices dobles',
    append: 'C = np.cov(X.T)\nvar_x = C[0][0]\ncov_xy = C[0][1]\n',
  },
  {
    name: 'a mano con las medias y np.var con ddof=1',
    append:
      'Xc = X - X.mean(axis=0)\nC = Xc.T @ Xc / (len(X) - 1)\nvar_x = np.var(X[:, 0], ddof=1)\ncov_xy = C[1, 0]\n',
  },
  {
    name: 'rowvar=False y números de Python',
    append:
      'C = np.cov(X, rowvar=False)\nvar_x = float(np.var(X[:, 0], ddof=1))\ncov_xy = float(C[0, 1])\n',
  },
]);
rejects('simetricas.ex02.1', [
  {
    name: 'np.cov sin avisar de dónde están las variables',
    append: 'C = np.cov(X)\nvar_x = C[0, 0]\ncov_xy = C[0, 1]\n',
    message: /`C` tiene 6 filas y 6 columnas, una por cada muestra/,
  },
  {
    name: 'varianza con np.var por defecto (divide entre n)',
    append: 'C = np.cov(X, rowvar=False)\nvar_x = np.var(X[:, 0])\ncov_xy = C[0, 1]\n',
    message: /`var_x` sale de dividir entre el número de muestras/,
    failures: 1,
  },
  {
    name: 'cov_xy toma una varianza de la diagonal',
    append: 'C = np.cov(X, rowvar=False)\nvar_x = C[0, 0]\ncov_xy = C[1, 1]\n',
    message: /`cov_xy` tiene que valer 4,6/,
    failures: 1,
  },
  {
    name: 'C es la covarianza de una sola variable',
    append: 'C = np.cov(X[:, 0])\nvar_x = 3.5\ncov_xy = 4.6\n',
    message: /`C` tiene que ser un array de NumPy de dos ejes/,
    failures: 1,
  },
  {
    name: 'C dividida entre n (bias=True)',
    append:
      'C = np.cov(X, rowvar=False, bias=True)\nvar_x = np.var(X[:, 0], ddof=1)\ncov_xy = 4.6\n',
    message: /`C` no tiene las varianzas y la covarianza/,
    failures: 1,
  },
]);

// ---------- simetricas.ex02.2: la covarianza a mano ----------

accepts('simetricas.ex02.2', [
  {
    name: 'np.mean, np.dot y n guardado en una variable',
    append: `def covarianza(X):
    n = X.shape[0]
    media = np.mean(X, axis=0)
    D = X - media
    return np.dot(D.T, D) / (n - 1)


C_datos = covarianza(datos)
`,
  },
  {
    name: 'dos bucles sobre las variables',
    append: `def covarianza(X):
    n, k = X.shape
    Xc = X - X.mean(axis=0)
    C = np.zeros((k, k))
    for a in range(k):
        for b in range(k):
            C[a, b] = (Xc[:, a] * Xc[:, b]).sum() / (n - 1)
    return C


C_datos = covarianza(datos)
`,
  },
  {
    name: 'multiplicar por 1 / (n - 1) al final',
    append: `def covarianza(X):
    Xc = X - np.mean(X, axis=0)
    return (Xc.T @ Xc) * (1 / (len(X) - 1))


C_datos = covarianza(datos)
`,
  },
]);
rejects('simetricas.ex02.2', [
  {
    name: 'sin restar la media',
    append: `def covarianza(X):
    return X.T @ X / (len(X) - 1)


C_datos = covarianza(datos)
`,
    message: /no resta la media/,
    failures: 1,
  },
  {
    name: 'dividiendo entre n',
    append: `def covarianza(X):
    Xc = X - X.mean(axis=0)
    return Xc.T @ Xc / len(X)


C_datos = covarianza(datos)
`,
    message: /divide entre el número de muestras/,
    failures: 1,
  },
  {
    name: 'restando la media de cada fila',
    append: `def covarianza(X):
    Xc = X - X.mean(axis=1, keepdims=True)
    return Xc.T @ Xc / (len(X) - 1)


C_datos = covarianza(datos)
`,
    message: /resta la media de cada muestra/,
    failures: 1,
  },
  {
    name: 'multiplicando en el otro orden: una matriz por muestra',
    append: `def covarianza(X):
    Xc = X - X.mean(axis=0)
    return Xc @ Xc.T / (len(X) - 1)


C_datos = covarianza(datos)
`,
    message: /una fila y una columna por cada muestra/,
    failures: 1,
  },
  {
    name: 'devuelve una lista en vez de un array',
    append: `def covarianza(X):
    Xc = X - X.mean(axis=0)
    return (Xc.T @ Xc / (len(X) - 1)).tolist()


C_datos = np.array(covarianza(datos))
`,
    message: /tiene que devolver un array de NumPy/,
    failures: 1,
  },
  {
    name: 'la función es correcta pero C_datos está mal',
    append: `def covarianza(X):
    Xc = X - X.mean(axis=0)
    return Xc.T @ Xc / (len(X) - 1)


C_datos = np.zeros((2, 2))
`,
    message: /`C_datos` tiene que ser lo que devuelve/,
    failures: 1,
  },
]);

// ---------- simetricas.ex02.3: np.linalg.eigh, su orden y sus columnas ----------

accepts('simetricas.ex02.3', [
  {
    name: 'np.max y np.argmax, con un booleano de Python',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = np.max(vals)\nu = vecs[:, np.argmax(vals)]\nperpendiculares = bool(abs(vecs[:, 0] @ vecs[:, 1]) < 1e-9)\n',
  },
  {
    name: 'el autovector con el otro signo',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = float(vals[-1])\nu = -vecs[:, -1]\nperpendiculares = np.allclose(np.dot(vecs[:, 0], vecs[:, 1]), 0)\n',
  },
  {
    name: 'np.linalg.eig, que no garantiza el orden de los autovalores',
    append:
      'vals, vecs = np.linalg.eig(C)\nlam_max = vals.max()\nu = vecs[:, vals.argmax()]\nperpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], 0)\n',
  },
]);
rejects('simetricas.ex02.3', [
  {
    name: 'el autovalor mayor es el primero',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = vals[0]\nu = vecs[:, -1]\nperpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], 0)\n',
    message: /`lam_max` vale -3, el menor/,
    failures: 1,
  },
  {
    name: 'u es la última fila de vecs',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = vals[-1]\nu = vecs[-1]\nperpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], 0)\n',
    message: /`u` es una fila de `vecs`/,
    failures: 1,
  },
  {
    name: 'u es la primera fila de vecs',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = vals[-1]\nu = vecs[0]\nperpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], 0)\n',
    message: /`u` es una fila de `vecs`/,
    failures: 1,
  },
  {
    name: 'u es el autovector del autovalor menor',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = vals[-1]\nu = vecs[:, 0]\nperpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], 0)\n',
    message: /`u` tiene que ser el autovector del autovalor mayor/,
    failures: 1,
  },
  {
    name: 'perpendiculares es el producto escalar, no un booleano',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = vals[-1]\nu = vecs[:, -1]\nperpendiculares = vecs[:, 0] @ vecs[:, 1]\n',
    message: /`perpendiculares` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'perpendiculares vale False',
    append:
      'vals, vecs = np.linalg.eigh(C)\nlam_max = vals[-1]\nu = vecs[:, -1]\nperpendiculares = False\n',
    message: /`perpendiculares` vale `False`/,
    failures: 1,
  },
  {
    name: 'vecs son los autovectores sin ordenar con sus autovalores',
    append:
      'vals, vecs = np.linalg.eigh(C)\nvecs = vecs[:, ::-1]\nlam_max = vals[-1]\nu = vecs[:, 0]\nperpendiculares = True\n',
    message: /`vecs` no es la matriz de autovectores de `C`/,
    failures: 1,
  },
]);

// ---------- simetricas.ex02.4: reconstruir con autovectores ortonormales ----------

accepts('simetricas.ex02.4', [
  {
    name: 'np.dot encadenado y un booleano de Python',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = bool(np.allclose(np.dot(vecs.T, vecs), np.eye(3)))\nC2 = np.dot(np.dot(vecs, np.diag(vals)), vecs.T)\n',
  },
  {
    name: 'las columnas por los autovalores',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = np.allclose(vecs @ vecs.T, np.eye(3))\nC2 = (vecs * vals) @ vecs.T\n',
  },
  {
    name: 'suma de productos externos de cada autovector',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = np.allclose(vecs.T @ vecs, np.eye(3))\nC2 = sum(l * np.outer(vecs[:, k], vecs[:, k]) for k, l in enumerate(vals))\n',
  },
]);
rejects('simetricas.ex02.4', [
  {
    name: 'sin la traspuesta del último factor',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = np.allclose(vecs.T @ vecs, np.eye(3))\nC2 = vecs @ np.diag(vals) @ vecs\n',
    message: /falta la traspuesta de `vecs`/,
    failures: 1,
  },
  {
    name: 'multiplicando por el array de autovalores en vez de por la matriz diagonal',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = np.allclose(vecs.T @ vecs, np.eye(3))\nC2 = vecs @ vals @ vecs.T\n',
    message: /`C2` tiene que ser una matriz de 3 filas y 3 columnas/,
    failures: 1,
  },
  {
    name: 'ortonormal compara vecs con la identidad',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = np.allclose(vecs, np.eye(3))\nC2 = vecs @ np.diag(vals) @ vecs.T\n',
    message: /`ortonormal` vale `False`/,
    failures: 1,
  },
  {
    name: 'ortonormal es la matriz y no un booleano',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = vecs.T @ vecs\nC2 = vecs @ np.diag(vals) @ vecs.T\n',
    message: /`ortonormal` tiene que ser un solo `True` o `False`/,
    failures: 1,
  },
  {
    name: 'la traspuesta en el primer factor y no en el último',
    append:
      'vals, vecs = np.linalg.eigh(C)\nortonormal = np.allclose(vecs.T @ vecs, np.eye(3))\nC2 = vecs.T @ np.diag(vals) @ vecs\n',
    message: /`C2` tiene que coincidir con `C`/,
    failures: 1,
  },
]);

// ---------- simetricas.ex02.5: la varianza en una dirección ----------

accepts('simetricas.ex02.5', [
  {
    name: 'u C u / u u con np.cov',
    append: `def varianza_en(X, u):
    C = np.cov(X, rowvar=False)
    return float(u @ C @ u / (u @ u))


mejor = int(np.argmax([varianza_en(X, c) for c in candidatas]))
`,
  },
  {
    name: 'proyecciones centradas a mano',
    append: `def varianza_en(X, u):
    d = u / np.sqrt(np.sum(u ** 2))
    p = (X - X.mean(axis=0)) @ d
    return np.sum(p ** 2) / (len(p) - 1)


mejor = int(np.argmax([varianza_en(X, c) for c in candidatas]))
`,
  },
  {
    name: 'bucle sobre las muestras, ddof=1 y valores.index',
    append: `def varianza_en(X, u):
    u = np.asarray(u) / np.linalg.norm(u)
    proy = np.array([np.dot(fila, u) for fila in X])
    return proy.var(ddof=1)


valores = [varianza_en(X, c) for c in candidatas]
mejor = valores.index(max(valores))
`,
  },
]);
rejects('simetricas.ex02.5', [
  {
    name: 'sin normalizar u',
    append: `def varianza_en(X, u):
    return np.var(X @ u, ddof=1)


mejor = int(np.argmax([varianza_en(X, c) for c in candidatas]))
`,
    message: /no normaliza la dirección/,
  },
  {
    name: 'np.var sin ddof=1',
    append: `def varianza_en(X, u):
    return np.var(X @ (u / np.linalg.norm(u)))


mejor = int(np.argmax([varianza_en(X, c) for c in candidatas]))
`,
    message: /divide entre el número de muestras n.*`ddof=1`/,
    failures: 1,
  },
  {
    name: 'proyectando sin quitar la media',
    append: `def varianza_en(X, u):
    p = X @ (u / np.linalg.norm(u))
    return np.sum(p ** 2) / (len(p) - 1)


mejor = 2
`,
    message: /sin quitarles antes la media/,
    failures: 1,
  },
  {
    name: 'la función es correcta pero mejor es otra posición',
    append: `def varianza_en(X, u):
    return np.var(X @ (u / np.linalg.norm(u)), ddof=1)


mejor = 0
`,
    message: /`mejor` tiene que ser la posición/,
    failures: 1,
  },
  {
    name: 'mejor es la varianza y no la posición',
    append: `def varianza_en(X, u):
    return np.var(X @ (u / np.linalg.norm(u)), ddof=1)


mejor = 10.25
`,
    message: /`mejor` tiene que ser un número entero/,
    failures: 1,
  },
  {
    name: 'mejor señala la candidata más larga',
    append: `def varianza_en(X, u):
    return np.var(X @ (u / np.linalg.norm(u)), ddof=1)


mejor = 1
`,
    message: /`mejor` señala la candidata más larga/,
    failures: 1,
  },
  {
    name: 'la función devuelve un array de varias varianzas',
    append: `def varianza_en(X, u):
    return np.var(X, axis=0, ddof=1)


mejor = 2
`,
    message: /tiene que devolver un solo número/,
    failures: 1,
  },
]);

// ---------- examen-2.autovalores-de-mayor-a-menor ----------

accepts('examen-2.autovalores-de-mayor-a-menor', [
  {
    name: 'np.linalg.eigvalsh, np.sort y la traspuesta',
    append: 'lam = np.sort(np.linalg.eigvalsh(np.cov(datos.T)))[::-1]\n',
  },
  {
    name: 'np.flip de lo que devuelve eigh',
    append: 'lam = np.flip(np.linalg.eigh(np.cov(datos, rowvar=False))[0])\n',
  },
  {
    name: 'np.linalg.eig ordenado con el signo cambiado',
    append: 'lam = -np.sort(-np.linalg.eig(np.cov(datos, rowvar=False))[0])\n',
  },
]);
rejects('examen-2.autovalores-de-mayor-a-menor', [
  {
    name: 'de menor a mayor, como los devuelve eigh',
    append: 'lam = np.linalg.eigh(np.cov(datos, rowvar=False))[0]\n',
    message: /`lam` está de menor a mayor/,
    failures: 1,
  },
  {
    name: 'np.cov sin avisar de dónde están las variables',
    append: 'C = np.cov(datos)\nlam = np.linalg.eigh(C)[0][::-1]\n',
    message: /`lam` tiene 5 autovalores/,
    failures: 1,
  },
  {
    name: 'una lista en vez de un array',
    append: 'lam = [4.5, 0.5]\n',
    message: /`lam` tiene que ser un array de NumPy/,
    failures: 1,
  },
  {
    name: 'las varianzas de las variables en vez de los autovalores',
    append: 'lam = np.sort(np.var(datos, axis=0, ddof=1))[::-1]\n',
    message: /`lam` tiene que tener los dos autovalores/,
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
