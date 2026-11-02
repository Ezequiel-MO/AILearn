import { beforeAll, describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import { runInPyodide } from '../../python/core';
import {
  PYODIDE_LOAD_TIMEOUT_MS,
  defineHintTests,
  describeRun,
  getPyodide,
} from '../../../tests/content/python-helpers';
import {
  NUMPY_ENGLISH,
  garbageProbes,
  projectQuestions,
} from '../../../tests/content/prose-helpers';
import { svd } from './svd';
import { examen3Svd } from './examen-3-svd';

// Las pruebas genéricas (tests/content/python.test.ts) solo garantizan que la `reference` pasa.
// Aquí se fijan soluciones correctas distintas de la de referencia, que las comprobaciones deben
// aceptar, y errores típicos, que deben rechazar con su mensaje. Lanzar desde la raíz del repo.

let pyodide: unknown;
beforeAll(async () => {
  pyodide = await getPyodide();
}, PYODIDE_LOAD_TIMEOUT_MS);

const all = [...projectQuestions(svd), ...examen3Svd.map((e) => e.question)].filter(
  (q): q is CodigoQ => q.type === 'codigo',
);
const byId = new Map(all.map((q) => [q.id, q]));
const question = (id: string): CodigoQ => {
  const q = byId.get(id);
  if (!q) throw new Error(`No existe la pregunta de código ${id}`);
  return q;
};

const IDS = [
  'svd.ex02.1',
  'svd.ex02.2',
  'svd.ex02.3',
  'svd.ex02.4',
  'svd.ex02.5',
  'examen-3.volumen-con-valores-singulares',
];

describe('referencia y starter de las preguntas de código', { timeout: 60_000 }, () => {
  it('hay seis preguntas de código: las cinco de ex02 y la del banco', () => {
    // contract: encargo de la Órbita 3 de matrices: ex02 son cinco preguntas de código y el banco fijo tiene una
    expect([...byId.keys()]).toEqual(IDS);
  });
  for (const id of IDS) {
    it(`${id}: la referencia pasa y el starter no`, async () => {
      const q = question(id);
      const ref = await runInPyodide(pyodide, q.reference, q.checks);
      // contract: reglas comunes de contenido: la reference supera las comprobaciones
      expect(ref.passed, describeRun(ref)).toBe(true);
      const start = await runInPyodide(pyodide, q.starter, q.checks);
      // contract: reglas comunes de contenido: el starter no las supera, y sin error de Python
      expect(start.passed, describeRun(start)).toBe(false);
      expect(start.error, describeRun(start)).toBeNull();
    });
  }
});

describe(
  'calentamiento: la referencia de cada reto pasa y su starter no',
  { timeout: 60_000 },
  () => {
    for (const step of svd.warmup ?? []) {
      it(`${step.id}: la referencia pasa y el starter no`, async () => {
        const ref = await runInPyodide(pyodide, step.task.reference, step.task.checks);
        // contract: reglas comunes de contenido (warmup.python.test.ts): la reference supera los checks del reto
        expect(ref.passed, describeRun(ref)).toBe(true);
        const start = await runInPyodide(pyodide, step.task.starter, step.task.checks);
        // contract: reglas comunes de contenido (warmup.python.test.ts): el starter no los supera
        expect(start.passed, describeRun(start)).toBe(false);
        const ex = await runInPyodide(pyodide, step.example, '');
        // contract: reglas comunes de contenido (warmup.python.test.ts): el ejemplo se ejecuta sin error
        expect(ex.error, describeRun(ex)).toBeNull();
      });
    }
  },
);

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
  'svd.ex02.1': ['0', '0', '0'],
  'svd.ex02.2': ['False', 'diag', 'allclose'],
  'svd.ex02.3': ['False', 'T', '::-1', 'sqrt'],
  'svd.ex02.4': ['False', '1e-6', '>'],
  'svd.ex02.5': ['0', '/', 'W_sn', 'norm'],
};

defineHintTests(
  projectQuestions(svd).filter((q): q is CodigoQ => q.type === 'codigo'),
  SKELETON_FILLS,
  () => pyodide,
);

// ---------- svd.ex02.1: sigma1, v1 (fila de Vt) y u1 (columna de U) ----------

accepts('svd.ex02.1', [
  {
    name: 'con np.linalg.svd y full_matrices=False, tomando los factores por nombre',
    append:
      'U, S, Vt = np.linalg.svd(A, full_matrices=False)\nsigma1 = float(S.max())\nv1 = Vt[0, :]\nu1 = U[:, 0]\n',
  },
  {
    name: 'v1 y u1 con el signo cambiado a la vez',
    append: 'U, S, Vt = np.linalg.svd(A)\nsigma1 = S[0]\nv1 = -Vt[0]\nu1 = -U[:, 0]\n',
  },
  {
    name: 'u1 calculada como A @ v1 / sigma1',
    append: 'U, S, Vt = np.linalg.svd(A)\nsigma1 = S[0]\nv1 = Vt[0]\nu1 = A @ v1 / sigma1\n',
  },
]);
rejects('svd.ex02.1', [
  {
    // En la hoja 1 ya se rechaza esta misma columna; aquí se prueba que el mensaje de la pregunta la nombra
    name: 'v1 como columna de Vt en vez de fila',
    append: 'U, S, Vt = np.linalg.svd(A)\nsigma1 = S[0]\nv1 = Vt[:, 0]\nu1 = U[:, 0]\n',
    message: /`v1` es la primera columna de `Vt`/,
    failures: 1,
  },
  {
    name: 'u1 como fila de U en vez de columna',
    append: 'U, S, Vt = np.linalg.svd(A)\nsigma1 = S[0]\nv1 = Vt[0]\nu1 = U[0]\n',
    message: /`u1` es la primera fila de `U`/,
    failures: 1,
  },
  {
    name: 'sigma1 es el array S entero',
    append: 'U, S, Vt = np.linalg.svd(A)\nsigma1 = S\nv1 = Vt[0]\nu1 = U[:, 0]\n',
    message: /`sigma1` tiene que ser un solo número/,
  },
  {
    name: 'u1 con el signo contrario al de v1',
    append: 'U, S, Vt = np.linalg.svd(A)\nsigma1 = S[0]\nv1 = Vt[0]\nu1 = -U[:, 0]\n',
    message: /`u1` no cumple que `A @ v1` sea `sigma1 \* u1`/,
    failures: 1,
  },
]);

// ---------- svd.ex02.2: la descomposición reducida y la reconstrucción ----------

accepts('svd.ex02.2', [
  {
    name: 'U * S en vez de la matriz diagonal',
    append:
      'U, S, Vt = np.linalg.svd(A, full_matrices=False)\nA_rec = (U * S) @ Vt\nreconstruye = bool(np.allclose(A, A_rec))\n',
  },
  {
    name: 'np.dot encadenado y np.allclose con atol explícito',
    append:
      'U, S, Vt = np.linalg.svd(A, full_matrices=False)\nA_rec = np.dot(U, np.dot(np.diag(S), Vt))\nreconstruye = np.allclose(A_rec, A, atol=1e-8)\n',
  },
]);
rejects('svd.ex02.2', [
  {
    name: 'la descomposición completa, con una U de 3 por 3',
    append: 'U, S, Vt = np.linalg.svd(A)\nA_rec = A.copy()\nreconstruye = True\n',
    message: /`U` sale de 3 filas y 3 columnas/,
    failures: 1,
  },
  {
    name: 'U @ Vt, sin S',
    append:
      'U, S, Vt = np.linalg.svd(A, full_matrices=False)\nA_rec = U @ Vt\nreconstruye = False\n',
    message: /`A_rec` es `U @ Vt`, sin `S`/,
    failures: 1,
  },
  {
    name: 'los valores singulares en el orden contrario',
    append:
      'U, S, Vt = np.linalg.svd(A, full_matrices=False)\nA_rec = U @ np.diag(S[::-1]) @ Vt\nreconstruye = False\n',
    message: /`A_rec` no coincide con `A`/,
    failures: 1,
  },
  {
    name: 'reconstruye con el nombre pero a mano y equivocado',
    append:
      'U, S, Vt = np.linalg.svd(A, full_matrices=False)\nA_rec = U @ np.diag(S) @ Vt\nreconstruye = False\n',
    message: /`reconstruye` vale `False`, pero `A_rec` coincide con `A`/,
    failures: 1,
  },
]);

// ---------- svd.ex02.3: σ desde los vals de AᵀA ----------

accepts('svd.ex02.3', [
  {
    name: 'np.sort en vez de [::-1] y la raíz con ** 0.5',
    append:
      'S = np.linalg.svd(A)[1]\nvals = np.sort(np.linalg.eigvalsh(A.T @ A))[::-1]\nsigma_eig = vals ** 0.5\ncoinciden = bool(np.allclose(S, sigma_eig))\n',
  },
  {
    name: 'np.linalg.eigh en vez de eigvalsh y np.flip',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\nw, _ = np.linalg.eigh(A.T @ A)\nvals = np.flip(w)\nsigma_eig = np.sqrt(vals)\ncoinciden = np.allclose(S, sigma_eig, atol=1e-9)\n',
  },
]);
rejects('svd.ex02.3', [
  {
    name: 'vals de menor a mayor',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\nvals = np.linalg.eigvalsh(A.T @ A)\nsigma_eig = np.sqrt(vals[::-1])\ncoinciden = True\n',
    message: /`vals` está de menor a mayor/,
    failures: 1,
  },
  {
    name: 'sin la raíz cuadrada',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\nvals = np.linalg.eigvalsh(A.T @ A)[::-1]\nsigma_eig = vals\ncoinciden = False\n',
    message: /`sigma_eig` son los autovalores sin más/,
    failures: 1,
  },
  {
    name: 'A @ A.T, de 3 por 3',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\nvals = np.linalg.eigvalsh(A @ A.T)[::-1]\nsigma_eig = np.sqrt(np.abs(vals[:2]))\ncoinciden = True\n',
    message: /`vals` trae 3 números/,
    failures: 1,
  },
  {
    name: 'vals que ya llevan la raíz',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\nvals = np.sqrt(np.linalg.eigvalsh(A.T @ A)[::-1])\nsigma_eig = np.sqrt(vals)\ncoinciden = True\n',
    message: /`vals` ya son los valores singulares/,
    failures: 1,
  },
]);

// ---------- svd.ex02.4: el rango numérico ----------

accepts('svd.ex02.4', [
  {
    name: 'umbral relativo al mayor valor singular y np.count_nonzero',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\numbral = 1e-8 * S[0]\nrango = int(np.count_nonzero(S > umbral))\n',
  },
  {
    name: 'np.linalg.matrix_rank con el umbral como tolerancia',
    append:
      'S = np.linalg.svd(A, compute_uv=False)\numbral = 1e-6\nrango = int(np.linalg.matrix_rank(A, tol=umbral))\n',
  },
]);
rejects('svd.ex02.4', [
  {
    name: 'rango como len(S)',
    append: 'S = np.linalg.svd(A, compute_uv=False)\numbral = 1e-6\nrango = len(S)\n',
    message: /`rango` vale 3/,
    failures: 1,
  },
  {
    name: 'rango como np.sum(S > 0)',
    append: 'S = np.linalg.svd(A, compute_uv=False)\numbral = 1e-6\nrango = int(np.sum(S > 0))\n',
    message: /`rango` vale 3/,
    failures: 1,
  },
  {
    name: 'umbral 0, que deja pasar el ruido',
    append: 'S = np.linalg.svd(A, compute_uv=False)\numbral = 0\nrango = 2\n',
    message: /`umbral` es menor que el valor singular del ruido/,
    failures: 1,
  },
  {
    name: 'umbral demasiado grande, que tira un valor singular real',
    append: 'S = np.linalg.svd(A, compute_uv=False)\numbral = 3\nrango = 2\n',
    message: /`umbral` es mayor que un valor singular real/,
    failures: 1,
  },
  {
    name: 'S con solo dos valores singulares',
    append: 'S = np.linalg.svd(A.T, compute_uv=False)[:2]\numbral = 1e-6\nrango = 2\n',
    message: /`S` tiene que ser un array de NumPy con 3 números/,
    failures: 1,
  },
]);

// ---------- svd.ex02.5: normalización espectral ----------

accepts('svd.ex02.5', [
  {
    name: 'np.linalg.norm(W, 2) como mayor valor singular',
    append:
      'sigma_max = np.linalg.norm(W, 2)\nW_sn = W / sigma_max\nsigma_despues = np.linalg.norm(W_sn, 2)\nnorma_y = np.linalg.norm(np.dot(W_sn, x))\n',
  },
  {
    name: 'S.max() y la norma por raíz de la suma de cuadrados',
    append:
      'S = np.linalg.svd(W, compute_uv=False)\nsigma_max = float(S.max())\nW_sn = W * (1 / sigma_max)\nsigma_despues = float(np.linalg.svd(W_sn, compute_uv=False).max())\ny = W_sn @ x\nnorma_y = float(np.sqrt(np.sum(y ** 2)))\n',
  },
]);
rejects('svd.ex02.5', [
  {
    name: 'la norma de Frobenius en vez del mayor valor singular',
    append:
      'sigma_max = np.linalg.norm(W)\nW_sn = W / sigma_max\nsigma_despues = np.linalg.svd(W_sn, compute_uv=False)[0]\nnorma_y = np.linalg.norm(W_sn @ x)\n',
    message: /`sigma_max` es la norma de toda la matriz/,
  },
  {
    name: 'dividir entre la suma de los valores singulares',
    append:
      'S = np.linalg.svd(W, compute_uv=False)\nsigma_max = S[0]\nW_sn = W / S.sum()\nsigma_despues = 1.0\nnorma_y = 0.5\n',
    message: /`W_sn` tiene que ser `W` dividida entre `sigma_max`/,
    failures: 1,
  },
  {
    name: 'sigma_despues calculado sobre W en vez de sobre W_sn',
    append:
      'S = np.linalg.svd(W, compute_uv=False)\nsigma_max = S[0]\nW_sn = W / sigma_max\nsigma_despues = S[0]\nnorma_y = np.linalg.norm(W_sn @ x)\n',
    message: /`sigma_despues` tiene que valer 1/,
    failures: 1,
  },
  {
    name: 'la salida de la capa sin normalizar',
    append:
      'S = np.linalg.svd(W, compute_uv=False)\nsigma_max = S[0]\nW_sn = W / sigma_max\nsigma_despues = np.linalg.svd(W_sn, compute_uv=False)[0]\nnorma_y = np.linalg.norm(W @ x)\n',
    message: /`norma_y` tiene que ser la longitud de `W_sn @ x`/,
    failures: 1,
  },
]);

// ---------- examen-3.volumen-con-valores-singulares ----------

accepts('examen-3.volumen-con-valores-singulares', [
  {
    name: 'np.prod con svd completo y np.abs',
    append:
      'U, S, Vt = np.linalg.svd(V)\nvolumen = float(np.prod(S))\ncoincide = bool(np.isclose(volumen, np.abs(np.linalg.det(V))))\n',
  },
  {
    name: 'el producto con un bucle',
    append:
      'S = np.linalg.svd(V, compute_uv=False)\nvolumen = 1.0\nfor s in S:\n    volumen = volumen * s\ncoincide = np.isclose(volumen, abs(np.linalg.det(V)))\n',
  },
]);
rejects('examen-3.volumen-con-valores-singulares', [
  {
    name: 'el determinante con su signo en vez del producto de los valores singulares',
    append: 'S = np.linalg.svd(V, compute_uv=False)\nvolumen = np.linalg.det(V)\ncoincide = True\n',
    message: /`volumen` es negativo/,
    failures: 1,
  },
  {
    name: 'la suma de los valores singulares',
    append: 'S = np.linalg.svd(V, compute_uv=False)\nvolumen = np.sum(S)\ncoincide = False\n',
    message: /`volumen` es la suma de los valores singulares/,
    failures: 1,
  },
  {
    name: 'coincide como False cuando el volumen es correcto',
    append: 'S = np.linalg.svd(V, compute_uv=False)\nvolumen = np.prod(S)\ncoincide = False\n',
    message: /`coincide` vale `False`, pero `volumen` es igual al valor/,
    failures: 1,
  },
  {
    name: 'una cuenta equivocada',
    append: 'S = np.linalg.svd(V, compute_uv=False)\nvolumen = 7.0\ncoincide = False\n',
    message: /`volumen` tiene que ser el producto de los tres valores singulares/,
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
