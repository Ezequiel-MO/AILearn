import type { loadPyodide as LoadPyodide } from 'pyodide';
import { PACKAGES, PYODIDE_INDEX_URL } from './config';
import { runInPyodide, type RunResult } from './core';
import { installModules } from './modules';

// Protocolo entre runner.ts (hilo principal) y este worker.
export type WorkerRequest = { type: 'run'; id: number; code: string; checks?: string };
export type WorkerReply =
  | { type: 'ready' }
  | { type: 'init-error'; message: string }
  | { type: 'result'; id: number; result: RunResult }
  | { type: 'run-error'; id: number; message: string };

// El tsconfig del proyecto no incluye la librería WebWorker: se declara solo lo que se usa de `self`.
interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(reply: WorkerReply): void;
}
const scope = self as unknown as WorkerScope;

const messageOf = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// Pyodide se descarga del CDN (única llamada de red del juego, junto con sus paquetes) y no se empaqueta.
const init = async (): Promise<unknown> => {
  const mod = (await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`)) as {
    loadPyodide: typeof LoadPyodide;
  };
  const pyodide = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  await pyodide.loadPackage([...PACKAGES]);
  installModules(pyodide);
  // La primera importación de matplotlib es lenta (caché de fuentes): se paga aquí, antes de 'ready',
  // para que no cuente contra el tiempo límite de la primera ejecución.
  await pyodide.runPythonAsync(
    'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot',
  );
  return pyodide;
};

const pyodideReady = init().then(
  (pyodide) => {
    scope.postMessage({ type: 'ready' });
    return pyodide;
  },
  (e: unknown) => {
    scope.postMessage({ type: 'init-error', message: messageOf(e) });
    return null;
  },
);

scope.onmessage = (event) => {
  const { id, code, checks } = event.data;
  void pyodideReady.then(async (pyodide) => {
    if (pyodide === null) return;
    try {
      const result = await runInPyodide(pyodide, code, checks);
      scope.postMessage({ type: 'result', id, result });
    } catch (e) {
      scope.postMessage({ type: 'run-error', id, message: messageOf(e) });
    }
  });
};
