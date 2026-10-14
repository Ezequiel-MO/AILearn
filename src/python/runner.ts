import { DEFAULT_TIMEOUT_MS } from './config';
import type { RunResult } from './core';
import type { WorkerReply, WorkerRequest } from './worker';

export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'failed';

export interface PythonRunner {
  run(code: string, opts?: { checks?: string; timeoutMs?: number }): Promise<RunResult>;
  status(): RunnerStatus;
  onStatus(cb: (s: RunnerStatus) => void): () => void;
  retry(): void; // tras 'failed'
  dispose(): void;
}

/** Pyodide no se pudo cargar (sin conexión, CDN caído) o el worker murió. `run` rechaza con esto; `retry()` reintenta. */
export class PythonLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PythonLoadError';
  }
}

/** Plazo de la carga de Pyodide (worker + paquetes). Aparte del plazo de ejecución: ninguno cuenta para el otro. */
export const LOAD_TIMEOUT_MS = 60_000;

/** Lo mínimo que el runner necesita de un Worker; permite sustituirlo en las pruebas. */
export interface WorkerLike {
  onmessage: ((event: MessageEvent<WorkerReply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: WorkerRequest): void;
  terminate(): void;
}

interface Session {
  worker: WorkerLike;
  ready: Promise<void>;
  /** Rechaza `ready` (carga fallida o cierre). */
  abort: (e: Error) => void;
  /** Plazo de la carga; se limpia al cargar o al cerrar la sesión. */
  loadTimer: ReturnType<typeof setTimeout> | undefined;
  /** Ejecución en curso en este worker, si la hay. */
  pending: { id: number; resolve: (r: RunResult) => void; reject: (e: Error) => void } | null;
}

const timedOutResult = (): RunResult => ({
  stdout: '',
  error: null,
  figures: [],
  checks: null,
  passed: false,
  timedOut: true,
});

export const createRunner = (
  makeWorker: () => WorkerLike,
  loadTimeoutMs: number = LOAD_TIMEOUT_MS,
): PythonRunner => {
  let state: RunnerStatus = 'idle';
  let session: Session | null = null;
  let failure: PythonLoadError | null = null;
  let nextId = 1;
  // Cada `dispose()` abre una época nueva: lo encolado antes del cierre no debe revivir un worker.
  let epoch = 0;
  // Cola: una ejecución cada vez, en orden de llamada.
  let tail: Promise<unknown> = Promise.resolve();
  let active = 0;
  const listeners = new Set<(s: RunnerStatus) => void>();

  const setStatus = (s: RunnerStatus): void => {
    if (s === state) return;
    state = s;
    // Un suscriptor que lanza no debe romper al runner ni a los demás suscriptores.
    for (const cb of [...listeners]) {
      try {
        cb(s);
      } catch {
        // el error del suscriptor es asunto suyo
      }
    }
  };

  // Termina el worker y rechaza lo que esperaba en él (la carga o una ejecución).
  const closeSession = (s: Session, reason: Error): void => {
    clearTimeout(s.loadTimer);
    s.worker.onmessage = null;
    s.worker.onerror = null;
    s.worker.terminate();
    const pending = s.pending;
    s.pending = null;
    s.abort(reason);
    pending?.reject(reason);
  };

  const fail = (s: Session, error: PythonLoadError): void => {
    if (session !== s) return;
    session = null;
    failure = error;
    closeSession(s, error);
    setStatus('failed');
  };

  const startSession = (): Session => {
    let worker: WorkerLike;
    try {
      worker = makeWorker();
    } catch (e) {
      // CSP, navegador sin workers de módulo...: es un fallo de carga como cualquier otro.
      const error = new PythonLoadError(e instanceof Error ? e.message : String(e));
      session = null;
      failure = error;
      setStatus('failed');
      throw error;
    }
    let resolveReady!: () => void;
    let rejectReady!: (e: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    ready.catch(() => undefined); // el rechazo lo recoge quien espera; evita avisos si nadie espera
    const s: Session = { worker, ready, abort: rejectReady, loadTimer: undefined, pending: null };
    session = s;
    s.loadTimer = setTimeout(() => {
      fail(
        s,
        new PythonLoadError(
          `Pyodide no ha terminado de cargar en ${Math.round(loadTimeoutMs / 1000)} s.`,
        ),
      );
    }, loadTimeoutMs);
    setStatus('loading');

    worker.onmessage = (event) => {
      if (session !== s) return; // worker ya terminado
      const reply = event.data;
      if (reply.type === 'ready') {
        clearTimeout(s.loadTimer);
        setStatus('ready');
        resolveReady();
      } else if (reply.type === 'init-error') {
        fail(s, new PythonLoadError(reply.message));
      } else if (s.pending !== null && s.pending.id === reply.id) {
        const pending = s.pending;
        s.pending = null;
        if (reply.type === 'result') {
          setStatus('ready');
          pending.resolve(reply.result);
        } else {
          // Un rechazo de runInPyodide puede ser persistente (el jugador pisó json, io, contextlib...):
          // la instancia se da por contaminada y se sustituye, como tras un plazo agotado.
          session = null;
          closeSession(s, new Error('El ejecutor de Python se ha reiniciado.'));
          restartSession();
          pending.reject(new Error(reply.message));
        }
      }
    };
    worker.onerror = (event) => {
      fail(s, new PythonLoadError(event.message || 'El worker de Python ha fallado.'));
    };
    return s;
  };

  // Worker nuevo tras sustituir uno; si ni siquiera se puede crear, startSession ya dejó el estado en 'failed'.
  const restartSession = (): void => {
    try {
      startSession();
    } catch {
      // estado 'failed' y `failure` ya fijados
    }
  };

  const execute = async (
    code: string,
    opts: { checks?: string; timeoutMs?: number },
    runEpoch: number,
  ): Promise<RunResult> => {
    if (runEpoch !== epoch) throw new Error('El ejecutor de Python se ha cerrado.');
    if (state === 'failed' && failure !== null) throw failure;
    const s = session ?? startSession();
    await s.ready;
    if (session !== s) throw new Error('El ejecutor de Python se ha cerrado.');
    const id = nextId++;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    return new Promise<RunResult>((resolve, reject) => {
      // El plazo empieza aquí: el entorno ya está listo.
      const timer = setTimeout(() => {
        if (session !== s || s.pending === null) return;
        // Se vacía `pending` antes: el cierre no debe rechazar la ejecución que se resuelve con timedOut.
        s.pending = null;
        closeSession(s, new Error('El ejecutor de Python se ha reiniciado.'));
        session = null;
        restartSession(); // worker nuevo, ya cargando
        resolve(timedOutResult());
      }, timeoutMs);
      s.pending = {
        id,
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      };
      setStatus('running');
      const message: WorkerRequest = { type: 'run', id, code, checks: opts.checks };
      s.worker.postMessage(message);
    });
  };

  return {
    run(code, opts = {}) {
      // Sin cola previa se ejecuta ya (el worker se crea en la propia llamada); con cola, a continuación.
      const runEpoch = epoch;
      const job =
        active === 0
          ? execute(code, opts, runEpoch)
          : tail.then(() => execute(code, opts, runEpoch));
      active++;
      tail = job.then(
        () => undefined,
        () => undefined,
      );
      void tail.then(() => {
        active--;
      });
      return job;
    },
    status: () => state,
    onStatus(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    retry() {
      if (state !== 'failed') return;
      failure = null;
      restartSession();
    },
    dispose() {
      epoch++;
      const s = session;
      session = null;
      failure = null;
      if (s !== null) closeSession(s, new Error('El ejecutor de Python se ha cerrado.'));
      setStatus('idle');
    },
  };
};

let instance: PythonRunner | null = null;

/** Única instancia; el worker (y la descarga de Pyodide) se crea en la primera ejecución. */
export const getRunner = (): PythonRunner => {
  instance ??= createRunner(
    () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
  );
  return instance;
};
