import { beforeAll, describe, expect, it } from 'vitest';
import { runInPyodide } from './core';
import { loadNodePyodide } from './node';

let pyodide: unknown;

// Una sola instancia de Pyodide por fichero; la primera carga puede descargar paquetes.
beforeAll(async () => {
  pyodide = await loadNodePyodide();
}, 300_000);

const run = (code: string, checks?: string) => runInPyodide(pyodide, code, checks);

describe('módulo embeddings', { timeout: 60_000 }, () => {
  it('se importa y trae las cuatro listas con sus matrices de 384 columnas', async () => {
    const r = await run(
      'import embeddings as e\nprint(e.modelo, e.dimension, e.P.shape, e.D.shape, e.Q.shape, e.F.shape)',
    );
    // contract: scripts/embeddings.py: 32 palabras, 16 documentos, 10 consultas y 9 frases, modelo de 384 dimensiones
    expect(r.error).toBeNull();
    expect(r.stdout).toBe(
      'paraphrase-multilingual-MiniLM-L12-v2 384 (32, 384) (16, 384) (10, 384) (9, 384)\n',
    );
  });

  it('cada fila tiene norma 1 y vector(texto) devuelve su fila', async () => {
    const r = await run(
      [
        'import numpy as np',
        'import embeddings as e',
        'M = np.vstack([e.P, e.D, e.Q, e.F])',
        'print(np.allclose(np.linalg.norm(M, axis=1), 1))',
        'print(np.array_equal(e.vector("reina"), e.P[e.palabras.index("reina")]))',
      ].join('\n'),
    );
    // contract: embeddings.py: filas normalizadas al cargar; vector() busca en las listas
    expect(r.stdout).toBe('True\nTrue\n');
  });

  it('son embeddings reales: la consulta del desayuno encuentra el documento del desayuno', async () => {
    const r = await run(
      'import numpy as np\nimport embeddings as e\nprint(int(np.argmax(e.D @ e.Q[0])), round(float(e.D[0] @ e.Q[0]), 2))',
    );
    // contract: medido con el modelo al generar los datos (coseno 0,770 en float32)
    expect(r.stdout).toBe('0 0.77\n');
  });

  it('un texto que no está en las listas da un KeyError que lo explica', async () => {
    const r = await run('import embeddings as e\ne.vector("hola")');
    // contract: embeddings.py: aquí no hay modelo para textos nuevos
    expect(r.error).toContain('No tengo el embedding de');
  });

  it('modificar un array en una ejecución no afecta a sus comprobaciones ni a la siguiente', async () => {
    const r = await run(
      'import embeddings as e\ne.D[:] = 0',
      'import embeddings as e2\ncheck(e2.D.any(), "las comprobaciones ven los datos intactos")',
    );
    // contract: harness.ts _fresh_modules: el módulo se importa de nuevo antes de las comprobaciones
    expect(r.passed).toBe(true);
    const next = await run('import embeddings as e\nprint(bool(e.D.any()))');
    // contract: harness.ts _fresh_modules: y de nuevo en la siguiente ejecución
    expect(next.stdout).toBe('True\n');
  });
});
