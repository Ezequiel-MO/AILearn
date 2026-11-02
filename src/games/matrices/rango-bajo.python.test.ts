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
import { rangoBajo } from './rango-bajo';
import { examen3RangoBajo } from './examen-3-rango-bajo';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(rangoBajo), ...examen3RangoBajo.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'rango-bajo.ex02.1',
  'rango-bajo.ex02.2',
  'rango-bajo.ex02.3',
  'rango-bajo.ex02.4',
  'rango-bajo.ex02.5',
  'examen-3.mejor-rango-k',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 3 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una
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
  'rango-bajo.ex02.1': ['u', 'v', 'A', 'x', 'x'],
  'rango-bajo.ex02.2': ['1', '1', '1', '2', '2', '2'],
  'rango-bajo.ex02.3': ['A', '2', '**', '2'],
  'rango-bajo.ex02.4': ['k', 'k', 'k', 'size', 'W'],
  'rango-bajo.ex02.5': ['x', 'B_ent', 'x', 'B_ent'],
};

defineHintTests(
  projectQuestions(rangoBajo).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- rango-bajo.ex02.1: una matriz de rango 1 ----------

accepts('rango-bajo.ex02.1', [
  {
    name: 'np.dot y el método .dot',
    append:
      'A = np.outer(u, v)\nrango_A = np.linalg.matrix_rank(A)\nlee = np.dot(v, x)\ny = A.dot(x)\n',
  },
  {
    name: 'A con columna por fila (difusión), y como lee veces u',
    append:
      'A = u[:, None] * v\nrango_A = int(np.linalg.matrix_rank(A))\nlee = float(v @ x)\ny = lee * u\n',
  },
  {
    name: 'A con reshape y producto de matrices',
    append:
      'A = u.reshape(3, 1) @ v.reshape(1, 3)\nrango_A = np.linalg.matrix_rank(A)\nlee = np.sum(v * x)\ny = A @ x\n',
  },
]);
rejects('rango-bajo.ex02.1', [
  {
    name: 'u * v, posición a posición',
    append: 'A = u * v\nrango_A = 1\nlee = v @ x\ny = lee * u\n',
    message: /`A` tiene solo 3 números/,
    failures: 1,
  },
  {
    name: 'np.outer(v, u), la traspuesta',
    append: 'A = np.outer(v, u)\nrango_A = 1\nlee = v @ x\ny = A @ x\n',
    message: /`A` está traspuesta/,
    failures: 1,
  },
  {
    name: 'lee con u en vez de v',
    append: 'A = np.outer(u, v)\nrango_A = 1\nlee = u @ x\ny = A @ x\n',
    message: /`lee` vale 14/,
    failures: 1,
  },
  {
    name: 'rango como el número de filas',
    append: 'A = np.outer(u, v)\nrango_A = A.shape[0]\nlee = v @ x\ny = A @ x\n',
    message: /`rango_A` tiene que ser el rango de `A`/,
    failures: 1,
  },
  {
    name: 'y sin multiplicar por x',
    append: 'A = np.outer(u, v)\nrango_A = 1\nlee = v @ x\ny = u\n',
    message: /`y` tiene que ser `A` por `x`/,
    failures: 1,
  },
]);

// ---------- rango-bajo.ex02.2: la descomposición truncada ----------

const SVD_LINE = 'U, S, Vt = np.linalg.svd(M, full_matrices=False)\n';
accepts('rango-bajo.ex02.2', [
  {
    name: 'U * S con difusión y Vt[:k]',
    append: `${SVD_LINE}A1 = (U[:, :1] * S[:1]) @ Vt[:1]\nA2 = (U[:, :2] * S[:2]) @ Vt[:2]\n`,
  },
  {
    name: 'suma de productos exteriores, con la descomposición completa',
    append:
      'U, S, Vt = np.linalg.svd(M)\nA1 = S[0] * np.outer(U[:, 0], Vt[0])\nA2 = A1 + S[1] * np.outer(U[:, 1], Vt[1])\n',
  },
  {
    name: 'un bucle que suma las piezas',
    append: `${SVD_LINE}A1 = np.zeros((4, 3))\nfor i in range(1):\n    A1 = A1 + S[i] * np.outer(U[:, i], Vt[i])\nA2 = np.zeros((4, 3))\nfor i in range(2):\n    A2 = A2 + S[i] * np.outer(U[:, i], Vt[i])\n`,
  },
]);
rejects('rango-bajo.ex02.2', [
  {
    name: 'sin los valores singulares',
    append: `${SVD_LINE}A1 = U[:, :1] @ Vt[:1]\nA2 = U[:, :2] @ Vt[:2]\n`,
    message: /`A1` no usa los valores singulares/,
    failures: 2,
  },
  {
    name: 'A1 es la pieza más pequeña',
    append: `${SVD_LINE}A1 = S[2] * np.outer(U[:, 2], Vt[2])\nA2 = (U[:, :2] * S[:2]) @ Vt[:2]\n`,
    message: /`A1` es la pieza más pequeña/,
    failures: 1,
  },
  {
    name: 'A2 solo tiene la segunda pieza',
    append: `${SVD_LINE}A1 = (U[:, :1] * S[:1]) @ Vt[:1]\nA2 = S[1] * np.outer(U[:, 1], Vt[1])\n`,
    message: /`A2` solo tiene la segunda pieza/,
    failures: 1,
  },
  {
    name: 'A2 igual que A1',
    append: `${SVD_LINE}A1 = (U[:, :1] * S[:1]) @ Vt[:1]\nA2 = A1\n`,
    message: /`A2` es igual que la aproximación de rango 1/,
    failures: 1,
  },
]);

describe('rango-bajo.ex02.2: las cifras de la solución', { timeout: 60_000 }, () => {
  it('la referencia da los valores singulares 4,71; 3,09; 2,08 y la primera fila de A2 (2,96; 1,11; -0,08)', async () => {
    const q = question('rango-bajo.ex02.2');
    const extra =
      '\ncheck(np.allclose(S, [4.7054, 3.0905, 2.0755], atol=0.0005), "Los valores singulares no son 4,71; 3,09; 2,08.")\ncheck(np.allclose(A2[0], [2.9551, 1.1133, -0.0815], atol=0.0005), "La primera fila de A2 no es la de la solución.")\ncheck(np.linalg.matrix_rank(A1) == 1 and np.linalg.matrix_rank(A2) == 2, "Los rangos no son 1 y 2.")\n';
    const r = await runInPyodide(pyodide, q.reference, extra);
    // contract: cálculo con NumPy en el Pyodide del juego fuera de la prueba (σ = 4,7054; 3,0905; 2,0755; fila 0 de A2 = 2,9551; 1,1133; -0,0815): coincide con la solution de ex02.2
    expect(r.passed, describeRun(r)).toBe(true);
  });
});

// ---------- rango-bajo.ex02.3: el error se lee en lo que se descarta ----------

accepts('rango-bajo.ex02.3', [
  {
    name: 'la norma de Frobenius a mano, el producto escalar de S[2:] y svd de la diferencia',
    append:
      'error_total = np.sqrt(((A - A2) ** 2).sum())\nerror_formula = (S[2:] @ S[2:]) ** 0.5\nerror_peor = np.linalg.svd(A - A2, compute_uv=False)[0]\n',
  },
  {
    name: "norma 'fro' y el valor singular S[2] directamente",
    append:
      "error_total = np.linalg.norm(A - A2, 'fro')\nerror_formula = float(np.sqrt((S[2:] ** 2).sum()))\nerror_peor = S[2]\n",
  },
]);
const E3_OK = 'error_total = np.linalg.norm(A - A2)\n';
rejects('rango-bajo.ex02.3', [
  {
    name: 'sin elevar al cuadrado los valores descartados',
    append: `${E3_OK}error_formula = np.sqrt(np.sum(S[2:]))\nerror_peor = S[2]\n`,
    message: /`error_formula` suma los valores singulares sin elevarlos/,
    failures: 1,
  },
  {
    name: 'la suma empieza en la posición 1',
    append: `${E3_OK}error_formula = np.sqrt(np.sum(S[1:] ** 2))\nerror_peor = S[2]\n`,
    message: /`error_formula` incluye un valor singular/,
    failures: 1,
  },
  {
    name: 'el peor error es el error total',
    append: `${E3_OK}error_formula = np.sqrt(np.sum(S[2:] ** 2))\nerror_peor = np.linalg.norm(A - A2)\n`,
    message: /`error_peor` es el error total/,
    failures: 1,
  },
  {
    name: 'el peor error es el último valor que se conserva',
    append: `${E3_OK}error_formula = np.sqrt(np.sum(S[2:] ** 2))\nerror_peor = S[1]\n`,
    message: /`error_peor` es el último valor singular que se conserva/,
    failures: 1,
  },
  {
    name: 'el error total con el segundo argumento 2',
    append:
      'error_total = np.linalg.norm(A - A2, 2)\nerror_formula = np.sqrt(np.sum(S[2:] ** 2))\nerror_peor = S[2]\n',
    message: /`error_total` es el mayor estiramiento de la diferencia/,
    failures: 1,
  },
]);

describe('rango-bajo.ex02.3: las cifras de la solución', { timeout: 60_000 }, () => {
  it('la referencia da 3,32 de error total y 2,86 en la peor dirección, y sin cuadrados saldría 2,13', async () => {
    const q = question('rango-bajo.ex02.3');
    const extra =
      '\ncheck(abs(error_total - 3.3214) < 0.0005, "error_total no es 3,32.")\ncheck(abs(error_formula - error_total) < 1e-9, "Las dos formas del error no coinciden.")\ncheck(abs(error_peor - 2.8603) < 0.0005, "error_peor no es 2,86.")\ncheck(abs(S[2] - 2.8603) < 0.0005 and abs(S[3] - 1.6883) < 0.0005, "Los valores descartados no son 2,86 y 1,69.")\ncheck(abs(np.sqrt(np.sum(S[2:])) - 2.1326) < 0.0005, "Sin cuadrados no sale 2,13.")\n';
    const r = await runInPyodide(pyodide, q.reference, extra);
    // contract: cálculo con NumPy en el Pyodide del juego fuera de la prueba (σ = 8,264; 4,967; 2,860; 1,688; √(2,860²+1,688²) = 3,3214; √(2,860+1,688) = 2,1326): coincide con la solution de ex02.3
    expect(r.passed, describeRun(r)).toBe(true);
  });
});

// ---------- rango-bajo.ex02.4: comprimir una matriz de pesos en dos factores ----------

accepts('rango-bajo.ex02.4', [
  {
    name: 'los valores singulares repartidos con raíces entre B y A',
    append:
      'B = U[:, :k] * np.sqrt(S[:k])\nA = np.sqrt(S[:k])[:, None] * Vt[:k]\nnumeros = B.size + A.size\nerror_rel = np.linalg.norm(W - B @ A) / np.linalg.norm(W)\n',
  },
  {
    name: 'los valores singulares en A, y el error relativo desde S',
    append:
      'B = U[:, :k]\nA = np.diag(S[:k]) @ Vt[:k]\nnumeros = int(np.prod(B.shape) + np.prod(A.shape))\nerror_rel = np.sqrt(np.sum(S[k:] ** 2) / np.sum(S ** 2))\n',
  },
]);
rejects('rango-bajo.ex02.4', [
  {
    name: 'U[:, :k] @ S[:k], que da un array de 8 números',
    append: 'B = U[:, :k] @ S[:k]\nA = Vt[:k]\nnumeros = 28\nerror_rel = 0.04\n',
    message: /`B` tiene solo 8 números/,
    failures: 1,
  },
  {
    name: 'sin los valores singulares',
    append:
      'B = U[:, :k]\nA = Vt[:k]\nnumeros = B.size + A.size\nerror_rel = np.linalg.norm(W - B @ A) / np.linalg.norm(W)\n',
    message: /`B @ A` no usa los valores singulares/,
    failures: 1,
  },
  {
    name: 'numeros es W.size',
    append:
      'B = U[:, :k] * S[:k]\nA = Vt[:k]\nnumeros = W.size\nerror_rel = np.linalg.norm(W - B @ A) / np.linalg.norm(W)\n',
    message: /`numeros` vale 48/,
    failures: 1,
  },
  {
    name: 'el error sin dividir entre la norma de W',
    append:
      'B = U[:, :k] * S[:k]\nA = Vt[:k]\nnumeros = B.size + A.size\nerror_rel = np.linalg.norm(W - B @ A)\n',
    message: /`error_rel` no está dividido entre la norma de `W`/,
    failures: 1,
  },
]);

describe('rango-bajo.ex02.4: las cifras de la solución', { timeout: 60_000 }, () => {
  it('la referencia guarda 28 números frente a 48 y un error relativo de 0,0376', async () => {
    const q = question('rango-bajo.ex02.4');
    const extra =
      '\ncheck(numeros == 28 and W.size == 48, "Los números no son 28 frente a 48.")\ncheck(abs(error_rel - 0.0376) < 0.0005, "El error relativo no es 0,038.")\ncheck(np.linalg.matrix_rank(B @ A) == 2, "B @ A no tiene rango 2.")\n';
    const r = await runInPyodide(pyodide, q.reference, extra);
    // contract: cálculo con NumPy en el Pyodide del juego fuera de la prueba (8·2 + 2·6 = 28 frente a 8·6 = 48; error relativo 0,03755): coincide con la solution de ex02.4
    expect(r.passed, describeRun(r)).toBe(true);
  });
});

// ---------- rango-bajo.ex02.5: LoRA, sumar la corrección y fusionarla ----------

accepts('rango-bajo.ex02.5', [
  {
    name: 'np.dot, y la salida fusionada sumando las dos salidas',
    append:
      'salida_inicio = W @ x + B @ (A @ x)\nW_fus = W + np.dot(B_ent, A)\nsalida_fus = W @ x + B_ent @ (A @ x)\nrango_corr = int(np.linalg.matrix_rank(np.dot(B_ent, A)))\n',
  },
  {
    name: 'el rango como el número de columnas de B_ent',
    append:
      'salida_inicio = (W + B @ A) @ x\nW_fus = W + B_ent @ A\nsalida_fus = (W + B_ent @ A) @ x\nrango_corr = B_ent.shape[1]\n',
  },
]);
rejects('rango-bajo.ex02.5', [
  {
    name: 'salida_inicio sin la salida de W',
    append:
      'salida_inicio = B @ (A @ x)\nW_fus = W + B_ent @ A\nsalida_fus = W_fus @ x\nrango_corr = np.linalg.matrix_rank(B_ent @ A)\n',
    message: /`salida_inicio` no incluye la salida de `W`/,
    failures: 1,
  },
  {
    name: 'W_fus es solo la corrección',
    append:
      'salida_inicio = W @ x + B @ (A @ x)\nW_fus = B_ent @ A\nsalida_fus = W_fus @ x\nrango_corr = np.linalg.matrix_rank(B_ent @ A)\n',
    message: /`W_fus` es solo la corrección/,
    failures: 1,
  },
  {
    name: 'W_fus con la B inicial, a cero',
    append:
      'salida_inicio = W @ x + B @ (A @ x)\nW_fus = W + B @ A\nsalida_fus = W_fus @ x\nrango_corr = np.linalg.matrix_rank(B_ent @ A)\n',
    message: /`W_fus` es igual que `W`/,
    failures: 1,
  },
  {
    name: 'salida_fus sin la corrección',
    append:
      'salida_inicio = W @ x + B @ (A @ x)\nW_fus = W + B_ent @ A\nsalida_fus = W @ x\nrango_corr = np.linalg.matrix_rank(B_ent @ A)\n',
    message: /`salida_fus` tiene que ser la matriz `W_fus` por `x`/,
    failures: 1,
  },
  {
    name: 'el rango de W_fus en vez del de la corrección',
    append:
      'salida_inicio = W @ x + B @ (A @ x)\nW_fus = W + B_ent @ A\nsalida_fus = W_fus @ x\nrango_corr = np.linalg.matrix_rank(W_fus)\n',
    message: /`rango_corr` vale 4/,
    failures: 1,
  },
]);

describe('rango-bajo.ex02.5: las cifras de la solución', { timeout: 60_000 }, () => {
  it('la referencia da una corrección de rango 2 sobre una W fusionada de rango 4, y la salida inicial es W @ x', async () => {
    const q = question('rango-bajo.ex02.5');
    const extra =
      '\ncheck(np.linalg.matrix_rank(W_fus) == 4 and rango_corr == 2, "Los rangos no son 4 y 2.")\ncheck(np.allclose(salida_inicio, W @ x), "La salida inicial no es W @ x.")\ncheck(np.allclose(salida_fus, W @ x + B_ent @ (A @ x)), "La salida fusionada no coincide con la suma de las dos salidas.")\ncheck(not np.allclose(salida_fus, salida_inicio), "La corrección entrenada no cambia la salida.")\n';
    const r = await runInPyodide(pyodide, q.reference, extra);
    // contract: cálculo con NumPy en el Pyodide del juego fuera de la prueba (rango de W + B_ent·A = 4, de B_ent·A = 2): coincide con la solution de ex02.5
    expect(r.passed, describeRun(r)).toBe(true);
  });
});

// ---------- examen-3.mejor-rango-k ----------

accepts('examen-3.mejor-rango-k', [
  {
    name: 'la descomposición completa con np.diag',
    append:
      'def mejor_rango(M, k):\n    U, S, Vt = np.linalg.svd(M)\n    return U[:, :k] @ np.diag(S[:k]) @ Vt[:k]\n',
  },
  {
    name: 'un bucle que suma las k piezas',
    append:
      'def mejor_rango(M, k):\n    U, S, Vt = np.linalg.svd(M, full_matrices=False)\n    R = np.zeros(M.shape)\n    for i in range(k):\n        R += S[i] * np.outer(U[:, i], Vt[i])\n    return R\n',
  },
  {
    name: 'la descomposición, anulando los valores singulares sobrantes',
    append:
      'def mejor_rango(M, k):\n    U, S, Vt = np.linalg.svd(M, full_matrices=False)\n    S = S.copy()\n    S[k:] = 0\n    return (U * S) @ Vt\n',
  },
]);
rejects('examen-3.mejor-rango-k', [
  {
    name: 'sin los valores singulares',
    append:
      'def mejor_rango(M, k):\n    U, S, Vt = np.linalg.svd(M, full_matrices=False)\n    return U[:, :k] @ Vt[:k]\n',
    message: /`mejor_rango` no usa los valores singulares/,
    failures: 1,
  },
  {
    name: 'las k últimas piezas',
    append:
      'def mejor_rango(M, k):\n    U, S, Vt = np.linalg.svd(M, full_matrices=False)\n    return (U[:, -k:] * S[-k:]) @ Vt[-k:]\n',
    message: /`mejor_rango` se queda con las piezas que menos pesan/,
    failures: 1,
  },
  {
    name: 'devuelve M sin aproximar',
    append: 'def mejor_rango(M, k):\n    return M\n',
    message: /tiene que tener rango `k`/,
    failures: 1,
  },
  {
    name: 'devuelve los valores singulares en vez de la matriz',
    append:
      'def mejor_rango(M, k):\n    U, S, Vt = np.linalg.svd(M, full_matrices=False)\n    return S[:k]\n',
    message: /mismas filas y columnas que `M`/,
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
