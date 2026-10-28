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
import { pca } from './pca';
import { examen2Pca } from './examen-2-pca';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(pca), ...examen2Pca.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'pca.ex02.1',
  'pca.ex02.2',
  'pca.ex02.3',
  'pca.ex02.4',
  'pca.ex02.5',
  'examen-2.componentes-para-95',
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

// ---------- pistas de las cinco preguntas de código del ejercicio Programar ----------

// Lo que va en cada `___` del esqueleto de la última pista, en orden.
const SKELETON_FILLS: Record<string, string[]> = {
  'pca.ex02.1': ['0', '-', 'Xc.T', '-1', 'Xc'],
  'pca.ex02.2': ['0', 'Xc.T', '::-1', 'Xc'],
  'pca.ex02.3': ['::-1', '0.9', '1'],
  'pca.ex02.4': ['-1', 'media', 'z', '1'],
  'pca.ex02.5': ['-', '-1', '-2', '-1', '-2'],
};

defineHintTests(
  projectQuestions(pca).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- pca.ex02.1: la cadena de pasos hasta la primera componente ----------

accepts('pca.ex02.1', [
  {
    name: 'np.cov con rowvar, argmax de los autovalores y .dot',
    append:
      'media = np.mean(X, axis=0)\nXc = X - media\nC = np.cov(X, rowvar=False)\nw, V = np.linalg.eigh(C)\npc1 = V[:, np.argmax(w)]\nz = Xc.dot(pc1)\n',
  },
  {
    name: 'la covarianza a mano y pc1 con el primer elemento positivo',
    append:
      'media = X.sum(axis=0) / len(X)\nXc = X - media\nC = Xc.T @ Xc / (len(X) - 1)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, 1]\nif pc1[0] < 0:\n    pc1 = -pc1\nz = Xc @ pc1\n',
  },
  {
    name: 'np.linalg.eig en vez de eigh, tomando la parte real',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc.T)\nw, V = np.linalg.eig(C)\npc1 = np.real(V[:, np.argmax(w)])\nz = Xc @ pc1\n',
  },
  {
    name: 'pc1 con el signo cambiado y z coherente con él',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = -vecs[:, -1]\nz = Xc @ pc1\n',
  },
]);
rejects('pca.ex02.1', [
  {
    name: 'los datos sin centrar',
    append:
      'media = X.mean(axis=0)\nXc = X\nC = np.cov(X.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, -1]\nz = Xc @ pc1\n',
    message: /`Xc` es igual a `X`/,
    failures: 1,
  },
  {
    name: 'la media de todos los datos juntos',
    append:
      'media = X.mean()\nXc = X - media\nC = np.cov(Xc.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, -1]\nz = Xc @ pc1\n',
    message: /`media` tiene que ser un array/,
    failures: 1,
  },
  {
    name: 'np.cov sin trasponer los datos',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc)\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = vecs[:, -1]\nz = Xc @ pc1\n',
    message: /`C` sale de 6 filas y 6 columnas/,
    failures: 1,
  },
  {
    name: 'la covarianza de los datos sin centrar',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = X.T @ X / (len(X) - 1)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, -1]\nz = Xc @ pc1\n',
    message: /falta centrarlos antes de calcular la covarianza/,
    failures: 1,
  },
  {
    name: 'la covarianza dividida entre n',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = Xc.T @ Xc / len(X)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, -1]\nz = Xc @ pc1\n',
    message: /`C` está dividida entre n,/,
    failures: 1,
  },
  {
    name: 'la componente del autovalor menor',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, 0]\nz = Xc @ pc1\n',
    message: /`pc1` es la componente de menor varianza/,
    failures: 1,
  },
  {
    // En una matriz de 2×2, el `eigh` de este Pyodide devuelve una matriz simétrica y `vecs[-1]` coincide
    // por casualidad con la última columna; se prueba con una fila de una matriz de autovectores no simétrica
    name: 'una fila de vecs en vez de una columna (matriz de autovectores no simétrica)',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = np.array([vecs[1, 0], -vecs[1, 1]])\nz = Xc @ pc1\n',
    message: /`pc1` no es un autovector de `C`/,
    failures: 1,
  },
  {
    name: 'la coordenada con los datos sin centrar',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, -1]\nz = X @ pc1\n',
    message: /`z` tiene que salir de los datos centrados/,
    failures: 1,
  },
  {
    name: 'z con el signo contrario al de pc1',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nC = np.cov(Xc.T)\nvals, vecs = np.linalg.eigh(C)\npc1 = vecs[:, -1]\nz = -(Xc @ pc1)\n',
    message: /`z` no corresponde al signo de `pc1`/,
    failures: 1,
  },
]);

// ---------- pca.ex02.2: la función pca(X, k) ----------

accepts('pca.ex02.2', [
  {
    name: 'argsort de los autovalores y el signo cambiado',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(Xc.T @ Xc / (len(X) - 1))
    orden = np.argsort(vals)[::-1]
    return -(Xc @ vecs[:, orden[:k]])
`,
  },
  {
    name: 'por descomposición en valores singulares',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
    return Xc @ Vt[:k].T
`,
  },
  {
    name: 'una columna por componente con np.column_stack',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov(Xc, rowvar=False))
    cols = [Xc @ vecs[:, -(j + 1)] for j in range(k)]
    return np.column_stack(cols)
`,
  },
]);
rejects('pca.ex02.2', [
  {
    name: 'las columnas en el orden de eigh, de menor a mayor',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov(Xc.T))
    return Xc @ vecs[:, -k:]
`,
    message: /salen de menor a mayor varianza/,
    failures: 1,
  },
  {
    name: 'sin centrar los datos',
    append: `def pca(X, k):
    vals, vecs = np.linalg.eigh(np.cov(X.T))
    return X @ vecs[:, ::-1][:, :k]
`,
    message: /tienen que tener media 0/,
    failures: 1,
  },
  {
    name: 'devuelve las componentes en vez de las coordenadas',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov(Xc.T))
    return vecs[:, ::-1][:, :k]
`,
    message: /n filas y k columnas/,
    failures: 1,
  },
  {
    name: 'las componentes de menor varianza',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov(Xc.T))
    return Xc @ vecs[:, :k]
`,
    message: /no son las de las k componentes|tienen que ser los k autovalores mayores/,
    failures: 1,
  },
  {
    name: 'una lista de Python en vez de un array',
    append: `def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov(Xc.T))
    return (Xc @ vecs[:, ::-1][:, :k]).tolist()
`,
    message: /tiene que devolver un array de NumPy/,
    failures: 1,
  },
]);

// ---------- pca.ex02.3: varianza explicada y componentes necesarias ----------

accepts('pca.ex02.3', [
  {
    name: 'np.sort, np.sum y un recuento de los acumulados menores',
    append:
      'ratio = np.sort(vals)[::-1] / np.sum(vals)\nk90 = int((np.cumsum(ratio) < 0.9).sum()) + 1\n',
  },
  {
    name: 'un bucle que acumula hasta pasar del 90 %',
    append:
      'ratio = (vals / vals.sum())[::-1]\ntotal = 0\nk90 = 0\nfor r in ratio:\n    total += r\n    k90 += 1\n    if total >= 0.9:\n        break\n',
  },
  {
    name: 'np.flip y np.searchsorted',
    append:
      'ratio = np.flip(vals) / vals.sum()\nk90 = np.searchsorted(np.cumsum(ratio), 0.9) + 1\n',
  },
]);
rejects('pca.ex02.3', [
  {
    name: 'ratio en el orden de eigh',
    append: 'ratio = vals / vals.sum()\nk90 = 4\n',
    message: /`ratio` va de menor a mayor/,
    failures: 1,
  },
  {
    name: 'ratio en porcentajes',
    append: 'ratio = vals[::-1] / vals.sum() * 100\nk90 = 4\n',
    message: /`ratio` está en porcentajes/,
    failures: 1,
  },
  {
    name: 'ratio es un solo número',
    append: 'ratio = vals.max() / vals.sum()\nk90 = 4\n',
    message: /`ratio` tiene que ser un array de NumPy con 6 números/,
    failures: 1,
  },
  {
    name: 'la posición en vez del número de componentes',
    append: 'ratio = vals[::-1] / vals.sum()\nk90 = int(np.argmax(np.cumsum(ratio) >= 0.9))\n',
    message: /`k90` vale 3/,
    failures: 1,
  },
  {
    name: 'acumulando de menor a mayor',
    append:
      'ratio = vals[::-1] / vals.sum()\nk90 = int(np.argmax(np.cumsum(vals / vals.sum()) >= 0.9)) + 1\n',
    message: /`k90` pide casi todas las componentes/,
    failures: 1,
  },
  {
    name: 'k90 es un decimal',
    append: 'ratio = vals[::-1] / vals.sum()\nk90 = 4.0\n',
    message: /`k90` tiene que ser un número entero/,
    failures: 1,
  },
]);

// ---------- pca.ex02.4: comprimir y reconstruir ----------

accepts('pca.ex02.4', [
  {
    name: 'por descomposición en valores singulares',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nU, s, Vt = np.linalg.svd(Xc, full_matrices=False)\nX_rec = media + (Xc @ Vt[0])[:, None] * Vt[0]\nerror = np.sum((X - X_rec) ** 2) / (len(X) - 1)\n',
  },
  {
    name: 'con el proyector u uT y las normas de las diferencias',
    append:
      'media = X.mean(axis=0)\nvals, vecs = np.linalg.eigh(np.cov(X.T))\nu = vecs[:, 1]\nX_rec = media + (X - media) @ np.outer(u, u)\nerror = np.sum(np.linalg.norm(X - X_rec, axis=1) ** 2) / (X.shape[0] - 1)\n',
  },
  {
    name: 'la componente con el signo cambiado',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = -vecs[:, -1]\nz = Xc @ pc1\nX_rec = media + np.outer(z, pc1)\nerror = ((X - X_rec) ** 2).sum() / (len(X) - 1)\n',
  },
]);
rejects('pca.ex02.4', [
  {
    name: 'sin sumar la media',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = vecs[:, -1]\nz = Xc @ pc1\nX_rec = np.outer(z, pc1)\nerror = ((X - X_rec) ** 2).sum() / (len(X) - 1)\n',
    message: /`X_rec` queda centrada en el origen/,
    failures: 1,
  },
  {
    name: 'reconstruyendo con la componente menor',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = vecs[:, 0]\nz = Xc @ pc1\nX_rec = media + np.outer(z, pc1)\nerror = ((X - X_rec) ** 2).sum() / (len(X) - 1)\n',
    message: /reconstruida con la componente de menor varianza/,
    failures: 1,
  },
  {
    name: 'con las dos componentes, sin perder nada',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\nX_rec = media + (Xc @ vecs) @ vecs.T\nerror = ((X - X_rec) ** 2).sum() / (len(X) - 1)\n',
    message: /`X_rec` es igual a `X`/,
    failures: 1,
  },
  {
    name: 'el error dividido entre n',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = vecs[:, -1]\nX_rec = media + np.outer(Xc @ pc1, pc1)\nerror = ((X - X_rec) ** 2).sum() / len(X)\n',
    message: /`error` está dividido entre n\./,
    failures: 1,
  },
  {
    name: 'el error sin dividir',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = vecs[:, -1]\nX_rec = media + np.outer(Xc @ pc1, pc1)\nerror = ((X - X_rec) ** 2).sum()\n',
    message: /`error` es la suma sin dividir/,
    failures: 1,
  },
  {
    name: 'un error por dato en vez de un número',
    append:
      'media = X.mean(axis=0)\nXc = X - media\nvals, vecs = np.linalg.eigh(np.cov(Xc.T))\npc1 = vecs[:, -1]\nX_rec = media + np.outer(Xc @ pc1, pc1)\nerror = ((X - X_rec) ** 2).sum(axis=1)\n',
    message: /`error` tiene que ser un número/,
    failures: 1,
  },
]);

describe('pca.ex02.4: el error coincide con el autovalor descartado', { timeout: 60_000 }, () => {
  it('la referencia da un error igual al autovalor menor de la covarianza', async () => {
    const q = question('pca.ex02.4');
    const extra =
      '\ncheck(np.isclose(error, np.linalg.eigvalsh(np.cov(X.T))[0]), "El error no coincide con el autovalor menor.")\ncheck(abs(error - 1.61) < 0.005, "El error no es 1,61.")\n';
    const r = await runInPyodide(pyodide, q.reference, extra);
    // contract: P3-pca, ex02.4: el error de reconstruir con una componente es el autovalor descartado; con estos datos vale 1,61 (cálculo a mano en la prueba de pca.test.ts)
    expect(r.passed, describeRun(r)).toBe(true);
  });
});

// ---------- pca.ex02.5: el mapa de los embeddings ----------

accepts('pca.ex02.5', [
  {
    name: 'por descomposición en valores singulares y plt.text con zip',
    append: `Pc = P - P.mean(axis=0)
U, s, Vt = np.linalg.svd(Pc, full_matrices=False)
mapa = Pc @ Vt[:2].T
explicada = (s[0] ** 2 + s[1] ** 2) / np.sum(s ** 2)
plt.scatter(mapa[:, 0], mapa[:, 1])
for palabra, (x, y) in zip(palabras, mapa):
    plt.text(x, y, palabra)
`,
  },
  {
    name: 'eigh con argsort, el signo cambiado y plt.annotate con el punto entero',
    append: `Pc = P - P.mean(axis=0)
vals, vecs = np.linalg.eigh(np.cov(P, rowvar=False))
orden = np.argsort(vals)[::-1]
mapa = -(Pc @ vecs[:, orden[:2]])
explicada = vals[orden[:2]].sum() / vals.sum()
plt.scatter(mapa[:, 0], mapa[:, 1])
for i in range(len(palabras)):
    plt.annotate(palabras[i], mapa[i])
`,
  },
  {
    name: 'un plt.scatter por palabra',
    append: `Pc = P - P.mean(axis=0)
vals, vecs = np.linalg.eigh(np.cov(Pc.T))
mapa = Pc @ vecs[:, ::-1][:, :2]
explicada = vals[-2:].sum() / np.trace(np.cov(Pc.T))
for i, palabra in enumerate(palabras):
    plt.scatter(mapa[i, 0], mapa[i, 1])
    plt.text(mapa[i, 0], mapa[i, 1], palabra)
`,
  },
]);

const PCA_BASE = `Pc = P - P.mean(axis=0)
vals, vecs = np.linalg.eigh(np.cov(Pc.T))
`;
const PCA_DRAW = `plt.scatter(mapa[:, 0], mapa[:, 1])
for i, palabra in enumerate(palabras):
    plt.annotate(palabra, (mapa[i, 0], mapa[i, 1]))
`;
rejects('pca.ex02.5', [
  {
    name: 'sin centrar los embeddings',
    append: `${PCA_BASE}mapa = P @ vecs[:, [-1, -2]]\nexplicada = (vals[-1] + vals[-2]) / vals.sum()\n${PCA_DRAW}`,
    message: /tienen que tener media 0/,
    failures: 1,
  },
  {
    name: 'las componentes de menor varianza',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, :2]\nexplicada = (vals[-1] + vals[-2]) / vals.sum()\n${PCA_DRAW}`,
    message: /no son las de las dos componentes de mayor varianza/,
    failures: 1,
  },
  {
    name: 'las dos componentes en el orden contrario',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-2, -1]]\nexplicada = (vals[-1] + vals[-2]) / vals.sum()\n${PCA_DRAW}`,
    message: /en el orden contrario/,
    failures: 1,
  },
  {
    name: 'explicada es la suma de las dos varianzas',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-1, -2]]\nexplicada = vals[-1] + vals[-2]\n${PCA_DRAW}`,
    message: /`explicada` es la suma de las dos varianzas/,
    failures: 1,
  },
  {
    name: 'explicada solo cuenta la primera componente',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-1, -2]]\nexplicada = vals[-1] / vals.sum()\n${PCA_DRAW}`,
    message: /`explicada` solo cuenta la primera componente/,
    failures: 1,
  },
  {
    name: 'explicada es el porcentaje',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-1, -2]]\nexplicada = 100 * (vals[-1] + vals[-2]) / vals.sum()\n${PCA_DRAW}`,
    message: /`explicada` tiene que ser la suma de los dos autovalores mayores/,
    failures: 1,
  },
  {
    name: 'puntos sin el nombre de las palabras',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-1, -2]]\nexplicada = (vals[-1] + vals[-2]) / vals.sum()\nplt.scatter(mapa[:, 0], mapa[:, 1])\n`,
    message: /Falta el nombre de alguna palabra/,
    failures: 1,
  },
  {
    name: 'sin ninguna figura',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-1, -2]]\nexplicada = (vals[-1] + vals[-2]) / vals.sum()\n`,
    message: /No hay ninguna figura/,
    failures: 1,
  },
  {
    name: 'los puntos dibujados no son los de mapa',
    append: `${PCA_BASE}mapa = Pc @ vecs[:, [-1, -2]]\nexplicada = (vals[-1] + vals[-2]) / vals.sum()\nplt.scatter(mapa[:, 1], mapa[:, 0])\nfor i, palabra in enumerate(palabras):\n    plt.annotate(palabra, (mapa[i, 1], mapa[i, 0]))\n`,
    message: /Los puntos de la figura no son las coordenadas/,
    failures: 1,
  },
]);

describe(
  'pca.ex02.5: el mapa conserva una parte pequeña de la variación',
  { timeout: 60_000 },
  () => {
    it('con la referencia, explicada vale 0,28 y las dos varianzas son 0,114 y 0,062', async () => {
      const q = question('pca.ex02.5');
      const extra =
        '\ncheck(abs(explicada - 0.2835) < 0.001, "explicada no vale 0,28.")\ncheck(abs(np.var(mapa[:, 0], ddof=1) - 0.1144) < 0.0005, "La primera varianza no es 0,114.")\ncheck(abs(np.var(mapa[:, 1], ddof=1) - 0.0616) < 0.0005, "La segunda varianza no es 0,062.")\n';
      const r = await runInPyodide(pyodide, q.reference, extra);
      // contract: cálculo con NumPy 2.5 fuera del juego (autovalores de la covarianza de P: 0,11439 y 0,06155; total 0,62058; fracción 0,2835): coincide con la solution de ex02.5
      expect(r.passed, describeRun(r)).toBe(true);
    });
  },
);

// ---------- examen-2.componentes-para-95 ----------

accepts('examen-2.componentes-para-95', [
  {
    name: 'np.searchsorted sobre el acumulado',
    append: 'k95 = int(np.searchsorted(np.cumsum(vals[::-1]) / vals.sum(), 0.95)) + 1\n',
  },
  {
    name: 'un bucle que acumula hasta llegar al 95 %',
    append:
      'total = 0\nk95 = 0\nfor v in np.sort(vals)[::-1]:\n    total += v / vals.sum()\n    k95 += 1\n    if total >= 0.95:\n        break\n',
  },
  {
    name: 'contar los acumulados que se quedan cortos',
    append: 'k95 = int((np.cumsum(np.sort(vals)[::-1]) / vals.sum() < 0.95).sum()) + 1\n',
  },
]);
rejects('examen-2.componentes-para-95', [
  {
    name: 'la posición en vez del número de componentes',
    append: 'k95 = int(np.argmax(np.cumsum(vals[::-1]) / vals.sum() >= 0.95))\n',
    message: /`k95` vale 3/,
    failures: 1,
  },
  {
    name: 'acumulando de menor a mayor',
    append: 'k95 = int(np.argmax(np.cumsum(vals) / vals.sum() >= 0.95)) + 1\n',
    message: /`k95` pide todas las componentes/,
    failures: 1,
  },
  {
    name: 'una cuenta equivocada',
    append: 'k95 = 5\n',
    message: /`k95` tiene que ser el menor número de componentes/,
    failures: 1,
  },
  {
    name: 'un decimal en vez de un entero',
    append: 'k95 = 4.0\n',
    message: /`k95` tiene que ser un número entero/,
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
