import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TIMEOUT_MS } from './config';
import type { RunResult } from './core';
import {
  createRunner,
  LOAD_TIMEOUT_MS,
  PythonLoadError,
  type RunnerStatus,
  type WorkerLike,
} from './runner';
import type { WorkerReply, WorkerRequest } from './worker';

// Worker falso: guarda lo que recibe y deja al test decidir cuándo y qué responde.
class FakeWorker implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  onerror: WorkerLike['onerror'] = null;
  posted: WorkerRequest[] = [];
  terminated = false;
  postMessage(message: WorkerRequest): void {
    this.posted.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  emit(reply: WorkerReply): void {
    this.onmessage?.({ data: reply } as MessageEvent<WorkerReply>);
  }
  fail(message: string): void {
    this.onerror?.({ message } as ErrorEvent);
  }
}

const okResult = (stdout: string): RunResult => ({
  stdout,
  error: null,
  figures: [],
  checks: null,
  passed: false,
  timedOut: false,
});

let workers: FakeWorker[];
const factory = (): WorkerLike => {
  const w = new FakeWorker();
  workers.push(w);
  return w;
};
const last = (): FakeWorker => workers[workers.length - 1]!;
// Resultado de una promesa sin dejar un rechazo suelto.
const outcome = <T>(p: Promise<T>): Promise<{ value?: T; error?: unknown }> =>
  p.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );

beforeEach(() => {
  workers = [];
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createRunner: carga perezosa y estados', () => {
  it('no crea ningún worker hasta la primera ejecución', () => {
    const runner = createRunner(factory);
    // contract: tarea 6, contrato de getRunner («carga perezosa»)
    expect(workers).toHaveLength(0);
    // contract: tarea 6, contrato de RunnerStatus (estado inicial 'idle')
    expect(runner.status()).toBe('idle');
  });

  it('pasa por loading, running y ready, y avisa a los suscritos hasta que se dan de baja', async () => {
    const runner = createRunner(factory);
    const seen: RunnerStatus[] = [];
    const off = runner.onStatus((s) => seen.push(s));
    const p = runner.run('print(1)', { checks: 'check(True, "x")' });
    // contract: tarea 6, contrato de RunnerStatus ('loading' mientras Pyodide carga)
    expect(runner.status()).toBe('loading');
    // contract: tarea 6, regla del tiempo límite (no se envía código hasta que el entorno está listo)
    expect(last().posted).toHaveLength(0);

    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6, contrato de RunnerStatus ('running' durante la ejecución)
    expect(runner.status()).toBe('running');
    // contract: tarea 6, contrato de PythonRunner.run (código y comprobaciones llegan al worker)
    expect(last().posted).toEqual([
      { type: 'run', id: 1, code: 'print(1)', checks: 'check(True, "x")' },
    ]);

    last().emit({ type: 'result', id: 1, result: okResult('1\n') });
    const result = await p;
    // contract: tarea 6, contrato de PythonRunner.run (devuelve el RunResult del worker)
    expect(result.stdout).toBe('1\n');
    // contract: tarea 6, contrato de RunnerStatus ('ready' tras terminar)
    expect(runner.status()).toBe('ready');
    // contract: tarea 6, contrato de PythonRunner.onStatus (notifica cada cambio, sin repetir)
    expect(seen).toEqual(['loading', 'ready', 'running', 'ready']);

    off();
    runner.dispose();
    // contract: tarea 6, contrato de PythonRunner.onStatus (la función devuelta da de baja)
    expect(seen).toEqual(['loading', 'ready', 'running', 'ready']);
  });

  it('reutiliza el mismo worker en ejecuciones seguidas y las ejecuta en orden', async () => {
    const runner = createRunner(factory);
    const p1 = runner.run('a');
    const p2 = runner.run('b');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6, contrato de PythonRunner.run (una ejecución cada vez: la segunda espera)
    expect(last().posted.map((m) => m.code)).toEqual(['a']);
    last().emit({ type: 'result', id: 1, result: okResult('A') });
    await vi.advanceTimersByTimeAsync(0);
    expect(last().posted.map((m) => m.code)).toEqual(['a', 'b']);
    last().emit({ type: 'result', id: 2, result: okResult('B') });
    // contract: tarea 6, contrato de PythonRunner.run (cada llamada recibe su resultado)
    expect((await p1).stdout).toBe('A');
    expect((await p2).stdout).toBe('B');
    // contract: tarea 6, contrato de getRunner (una sola instancia de Pyodide, un solo worker)
    expect(workers).toHaveLength(1);
  });
});

describe('createRunner: tiempo límite', () => {
  it('al agotarse termina el worker, devuelve timedOut y crea otro worker que atiende la siguiente llamada', async () => {
    const runner = createRunner(factory);
    const p = runner.run('while True: pass', { timeoutMs: 1000 });
    const first = last();
    first.emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    // El worker falso nunca responde.
    await vi.advanceTimersByTimeAsync(999);
    // contract: tarea 6, regla del tiempo límite (no se corta antes del plazo)
    expect(first.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const result = await p;
    // contract: tarea 6, regla del tiempo límite (devuelve un resultado con timedOut verdadero)
    expect(result.timedOut).toBe(true);
    // contract: tarea 6, contrato de RunResult (sin comprobaciones superadas, passed falso)
    expect(result.passed).toBe(false);
    expect(result.figures).toEqual([]);
    // contract: tarea 6, regla del tiempo límite (termina el worker)
    expect(first.terminated).toBe(true);
    // contract: tarea 6, regla del tiempo límite (se crea otro worker)
    expect(workers).toHaveLength(2);
    expect(last()).not.toBe(first);
    // contract: tarea 6, contrato de RunnerStatus (el worker nuevo está cargando)
    expect(runner.status()).toBe('loading');

    const next = runner.run('print(2)');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6, regla del tiempo límite (la siguiente llamada va al worker nuevo)
    expect(first.posted).toHaveLength(1);
    expect(last().posted).toHaveLength(1);
    last().emit({ type: 'result', id: 2, result: okResult('2\n') });
    // contract: tarea 6, regla del tiempo límite (la siguiente llamada se resuelve)
    expect((await next).stdout).toBe('2\n');
    expect((await next).timedOut).toBe(false);
  });

  it('ignora lo que conteste tarde un worker ya terminado', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x', { timeoutMs: 100 });
    const old = last();
    old.emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(100);
    await p;
    old.emit({ type: 'result', id: 1, result: okResult('tarde') });
    old.emit({ type: 'ready' });
    // contract: tarea 6, regla del tiempo límite (el estado lo marca el worker nuevo, no el viejo)
    expect(runner.status()).toBe('loading');
  });

  it('no cuenta el tiempo mientras el entorno carga', async () => {
    // El plazo de carga (ronda 1, punto 2) se alarga aquí: esta prueba mide solo el plazo de ejecución.
    const runner = createRunner(factory, 120_000);
    const p = runner.run('x', { timeoutMs: 1000 });
    const w = last();
    await vi.advanceTimersByTimeAsync(60_000);
    // contract: tarea 6, regla del tiempo límite («empieza a contar cuando el entorno está listo»)
    expect(w.terminated).toBe(false);
    expect(workers).toHaveLength(1);
    w.emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(999);
    expect(w.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await p).timedOut).toBe(true);
  });

  it('el plazo de una ejecución ya terminada no corta la siguiente', async () => {
    const runner = createRunner(factory);
    const p1 = runner.run('a', { timeoutMs: 1000 });
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'result', id: 1, result: okResult('A') });
    await p1;
    const p2 = runner.run('b', { timeoutMs: 5000 });
    await vi.advanceTimersByTimeAsync(1500);
    // contract: tarea 6, regla del tiempo límite (cada ejecución tiene su propio plazo)
    expect(last().terminated).toBe(false);
    expect(workers).toHaveLength(1);
    last().emit({ type: 'result', id: 2, result: okResult('B') });
    expect((await p2).timedOut).toBe(false);
  });

  it('usa DEFAULT_TIMEOUT_MS si no se indica otro', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS - 1);
    // contract: tarea 6, config.ts (DEFAULT_TIMEOUT_MS = 10_000)
    expect(last().terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await p).timedOut).toBe(true);
  });
});

describe('createRunner: fallo de carga, reintento y cierre', () => {
  it('si Pyodide no se descarga pasa a failed, rechaza la ejecución y no crea más workers hasta retry()', async () => {
    const runner = createRunner(factory);
    const seen: RunnerStatus[] = [];
    runner.onStatus((s) => seen.push(s));
    const p = runner.run('x');
    const assertion = expect(p).rejects.toBeInstanceOf(PythonLoadError);
    last().emit({ type: 'init-error', message: 'Failed to fetch' });
    await assertion;
    // contract: tarea 6, contrato de RunnerStatus ('failed' si la carga falla; RISKS de la sesión principal: mensaje de reintento sin conexión)
    expect(runner.status()).toBe('failed');
    expect(seen).toEqual(['loading', 'failed']);
    // contract: tarea 6, regla del tiempo límite (un worker que no carga se termina)
    expect(workers[0]!.terminated).toBe(true);

    // En failed una nueva ejecución falla sin intentar otra descarga.
    await expect(runner.run('y')).rejects.toBeInstanceOf(PythonLoadError);
    // contract: tarea 6, contrato de PythonRunner.retry (solo retry() vuelve a intentar)
    expect(workers).toHaveLength(1);
  });

  it('retry() crea un worker nuevo y la ejecución siguiente funciona', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x');
    const assertion = expect(p).rejects.toBeInstanceOf(PythonLoadError);
    last().fail('Script error');
    await assertion;
    expect(runner.status()).toBe('failed');

    runner.retry();
    // contract: tarea 6, contrato de PythonRunner.retry (vuelve a cargar tras 'failed')
    expect(runner.status()).toBe('loading');
    expect(workers).toHaveLength(2);

    const q = runner.run('print(3)');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'result', id: 1, result: okResult('3\n') });
    expect((await q).stdout).toBe('3\n');
    expect(runner.status()).toBe('ready');
  });

  it('retry() fuera de failed no hace nada', () => {
    const runner = createRunner(factory);
    runner.retry();
    // contract: tarea 6, contrato de PythonRunner.retry («tras failed»)
    expect(workers).toHaveLength(0);
    expect(runner.status()).toBe('idle');
  });

  it('si el worker se cae durante una ejecución rechaza y queda en failed', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    const assertion = expect(p).rejects.toBeInstanceOf(PythonLoadError);
    last().fail('crash');
    await assertion;
    // contract: tarea 6, contrato de RunnerStatus ('failed' si el worker muere)
    expect(runner.status()).toBe('failed');
    // El plazo de la ejecución caída no debe disparar nada después.
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS * 2);
    expect(workers).toHaveLength(1);
  });

  it('dispose() termina el worker, rechaza lo pendiente y vuelve a idle', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x');
    const assertion = expect(p).rejects.toThrow();
    const w = last();
    runner.dispose();
    await assertion;
    // contract: tarea 6, contrato de PythonRunner.dispose
    expect(w.terminated).toBe(true);
    expect(runner.status()).toBe('idle');
  });
});

describe('createRunner: plazo de carga', () => {
  it('si el entorno no termina de cargar en LOAD_TIMEOUT_MS termina el worker, pasa a failed y rechaza con PythonLoadError', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x');
    const w = last();
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS - 1);
    // contract: tarea 6b, ronda 1, punto 2 (ruling R16: plazo de carga de 60 s; no se corta antes)
    expect(w.terminated).toBe(false);
    expect(runner.status()).toBe('loading');
    await vi.advanceTimersByTimeAsync(1);
    // contract: tarea 6b, ronda 1, punto 2 (la run pendiente rechaza con PythonLoadError)
    expect((await outcome(p)).error).toBeInstanceOf(PythonLoadError);
    // contract: tarea 6b, ronda 1, punto 2 (carga agotada: estado failed y worker terminado)
    expect(runner.status()).toBe('failed');
    expect(w.terminated).toBe(true);
    // contract: tarea 6b, ronda 1, punto 2 (LOAD_TIMEOUT_MS vale 60 s)
    expect(LOAD_TIMEOUT_MS).toBe(60_000);
  });

  it('retry() tras una carga agotada permite una ejecución normal', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x');
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    await outcome(p);
    runner.retry();
    // contract: tarea 6b, ronda 1, punto 2 (retry funciona como tras cualquier fallo de carga)
    expect(runner.status()).toBe('loading');
    expect(workers).toHaveLength(2);
    const q = runner.run('print(5)');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'result', id: 1, result: okResult('5\n') });
    expect((await q).stdout).toBe('5\n');
  });

  it('un plazo de carga agotado rechaza también las ejecuciones en cola', async () => {
    const runner = createRunner(factory);
    const p1 = outcome(runner.run('a'));
    const p2 = outcome(runner.run('b'));
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    // contract: tarea 6b, ronda 1, puntos 2 y 6 (carga agotada con cola: todas rechazan con PythonLoadError)
    expect((await p1).error).toBeInstanceOf(PythonLoadError);
    expect((await p2).error).toBeInstanceOf(PythonLoadError);
    expect(workers).toHaveLength(1);
  });

  it('el plazo de carga no corta un entorno ya cargado ni se suma al de ejecución', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x', { timeoutMs: 500_000 });
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS - 1);
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    // La ejecución dura el doble del plazo de carga: el temporizador de carga ya no cuenta.
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS * 2);
    // contract: tarea 6b, ronda 1, punto 2 (el plazo de carga se limpia al cargar; ningún plazo cuenta para el otro)
    expect(runner.status()).toBe('running');
    expect(last().terminated).toBe(false);
    last().emit({ type: 'result', id: 1, result: okResult('ok') });
    expect((await p).timedOut).toBe(false);
  });

  it('un worker nuevo tras un plazo de ejecución también tiene plazo de carga', async () => {
    const runner = createRunner(factory);
    const p = runner.run('x', { timeoutMs: 100 });
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(100);
    await p;
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    // contract: tarea 6b, ronda 1, puntos 2 y 6 (el worker de relevo que nunca carga acaba en failed)
    expect(runner.status()).toBe('failed');
    expect((await outcome(runner.run('y'))).error).toBeInstanceOf(PythonLoadError);
  });
});

describe('createRunner: dispose con ejecuciones en cola', () => {
  it('dispose() vacía la cola: no resucita ningún worker y las dos ejecuciones rechazan', async () => {
    const runner = createRunner(factory);
    const p1 = outcome(runner.run('a'));
    const p2 = outcome(runner.run('b'));
    runner.dispose();
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6b, ronda 1, punto 1 (dispose no deja que la cola cree un segundo worker)
    expect(workers).toHaveLength(1);
    expect(runner.status()).toBe('idle');
    const [r1, r2] = [await p1, await p2];
    // contract: tarea 6b, ronda 1, punto 1 (las dos rechazan con un Error de cierre, no PythonLoadError)
    expect(r1.error).toBeInstanceOf(Error);
    expect(r1.error).not.toBeInstanceOf(PythonLoadError);
    expect(r2.error).toBeInstanceOf(Error);
    expect(r2.error).not.toBeInstanceOf(PythonLoadError);
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS * 2);
    expect(workers).toHaveLength(1);
    expect(runner.status()).toBe('idle');
  });

  it('dispose() durante una ejecución con otra en cola: rechazan las dos y una run posterior sí crea worker', async () => {
    const runner = createRunner(factory);
    const p1 = outcome(runner.run('a'));
    const p2 = outcome(runner.run('b'));
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    runner.dispose();
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS * 2);
    // contract: tarea 6b, ronda 1, punto 1 (sin worker nuevo tras el cierre aunque la cola tuviera trabajo)
    expect((await p1).error).toBeInstanceOf(Error);
    expect((await p2).error).toBeInstanceOf(Error);
    expect(workers).toHaveLength(1);
    expect(runner.status()).toBe('idle');

    const next = runner.run('c');
    // contract: tarea 6b, ronda 1, punto 1 (tras dispose la siguiente run crea un worker nuevo)
    expect(workers).toHaveLength(2);
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'result', id: last().posted[0]!.id, result: okResult('C') });
    expect((await next).stdout).toBe('C');
  });
});

describe('createRunner: error del núcleo en el worker (run-error)', () => {
  it('rechaza esa run, termina el worker contaminado y la siguiente se resuelve en uno nuevo', async () => {
    const runner = createRunner(factory);
    const p = outcome(runner.run('x'));
    const first = last();
    first.emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    first.emit({ type: 'run-error', id: 1, message: 'json.dumps roto' });
    const r = await p;
    // contract: tarea 6b, ronda 1, punto 3 (run-error rechaza con Error normal y el mensaje del worker)
    expect(r.error).toBeInstanceOf(Error);
    expect(r.error).not.toBeInstanceOf(PythonLoadError);
    expect((r.error as Error).message).toBe('json.dumps roto');
    // contract: tarea 6b, ronda 1, punto 3 (la instancia se da por contaminada: se termina y se crea otra)
    expect(first.terminated).toBe(true);
    expect(workers).toHaveLength(2);
    expect(runner.status()).toBe('loading');

    const next = runner.run('y');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6b, ronda 1, punto 3 (la siguiente run va al worker nuevo y se resuelve)
    expect(first.posted).toHaveLength(1);
    expect(last().posted).toHaveLength(1);
    last().emit({ type: 'result', id: 2, result: okResult('Y') });
    expect((await next).stdout).toBe('Y');
    expect(runner.status()).toBe('ready');
  });

  it('con otra ejecución en cola, esta va al worker nuevo', async () => {
    const runner = createRunner(factory);
    const p1 = outcome(runner.run('a'));
    const p2 = runner.run('b');
    const first = last();
    first.emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    first.emit({ type: 'run-error', id: 1, message: 'roto' });
    expect((await p1).error).toBeInstanceOf(Error);
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6b, ronda 1, puntos 3 y 6 (run-error con cola: la segunda no toca el worker contaminado)
    expect(first.posted.map((m) => m.code)).toEqual(['a']);
    expect(workers).toHaveLength(2);
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    expect(last().posted.map((m) => m.code)).toEqual(['b']);
    last().emit({ type: 'result', id: 2, result: okResult('B') });
    expect((await p2).stdout).toBe('B');
  });

  it('si el worker de relevo no se puede crear, la run rechaza igualmente con el error del núcleo y el estado es failed', async () => {
    let calls = 0;
    const runner = createRunner(() => {
      calls++;
      if (calls > 1) throw new Error('CSP');
      return factory();
    });
    const p = outcome(runner.run('x'));
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'run-error', id: 1, message: 'roto' });
    // contract: tarea 6b, ronda 1, puntos 3 y 5 (el fallo del relevo no tapa el error de la ejecución)
    expect(((await p).error as Error).message).toBe('roto');
    expect(runner.status()).toBe('failed');
  });
});

describe('createRunner: suscriptores de onStatus que lanzan', () => {
  it('la ejecución se resuelve igualmente y los demás suscriptores siguen avisados', async () => {
    const runner = createRunner(factory);
    const seen: RunnerStatus[] = [];
    runner.onStatus((s) => {
      if (s === 'ready') throw new Error('suscriptor roto');
    });
    runner.onStatus((s) => seen.push(s));
    const p = runner.run('x');
    // contract: tarea 6b, ronda 1, punto 4 (un suscriptor que lanza no se propaga al worker)
    expect(() => last().emit({ type: 'ready' })).not.toThrow();
    await vi.advanceTimersByTimeAsync(0);
    expect(last().posted).toHaveLength(1);
    expect(() => last().emit({ type: 'result', id: 1, result: okResult('ok') })).not.toThrow();
    // contract: tarea 6b, ronda 1, punto 4 (la run se resuelve aunque el suscriptor lance)
    expect((await p).stdout).toBe('ok');
    // contract: tarea 6b, ronda 1, punto 4 (el otro suscriptor recibe todos los cambios)
    expect(seen).toEqual(['loading', 'ready', 'running', 'ready']);
  });
});

describe('createRunner: el worker no se puede crear', () => {
  it('run rechaza con PythonLoadError, el estado es failed y retry() vuelve a intentarlo', async () => {
    let broken = true;
    const runner = createRunner(() => {
      if (broken) throw new Error('CSP');
      return factory();
    });
    const r = await outcome(runner.run('x'));
    // contract: tarea 6b, ronda 1, punto 5 (makeWorker que lanza: PythonLoadError con el mensaje técnico)
    expect(r.error).toBeInstanceOf(PythonLoadError);
    expect((r.error as Error).message).toBe('CSP');
    // contract: tarea 6b, ronda 1, punto 5 (estado failed, no idle)
    expect(runner.status()).toBe('failed');
    expect((await outcome(runner.run('y'))).error).toBeInstanceOf(PythonLoadError);

    broken = false;
    runner.retry();
    expect(runner.status()).toBe('loading');
    const q = runner.run('z');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'result', id: 1, result: okResult('Z') });
    expect((await q).stdout).toBe('Z');
  });

  it('si falla al crear el relevo tras un plazo agotado, la ejecución agotada sigue resolviéndose con timedOut', async () => {
    let calls = 0;
    const runner = createRunner(() => {
      calls++;
      if (calls > 1) throw new Error('CSP');
      return factory();
    });
    const p = runner.run('while True: pass', { timeoutMs: 100 });
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(100);
    // contract: tarea 6b, ronda 1, punto 5 (la ejecución agotada se resuelve con timedOut aunque el relevo falle)
    expect((await p).timedOut).toBe(true);
    // contract: tarea 6b, ronda 1, punto 5 (y el estado es failed)
    expect(runner.status()).toBe('failed');
    expect((await outcome(runner.run('y'))).error).toBeInstanceOf(PythonLoadError);
  });
});

describe('createRunner: cola con fallos y plazos', () => {
  it('con un fallo de carga y dos ejecuciones en cola, ambas rechazan con PythonLoadError sin más workers', async () => {
    const runner = createRunner(factory);
    const p1 = outcome(runner.run('a'));
    const p2 = outcome(runner.run('b'));
    last().emit({ type: 'init-error', message: 'x' });
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6b, ronda 1, punto 6 (fallo de carga con cola)
    expect((await p1).error).toBeInstanceOf(PythonLoadError);
    expect((await p2).error).toBeInstanceOf(PythonLoadError);
    expect(workers).toHaveLength(1);
    expect(runner.status()).toBe('failed');
  });

  it('con un plazo agotado y otra ejecución en cola, la segunda va al worker nuevo', async () => {
    const runner = createRunner(factory);
    const p1 = runner.run('a', { timeoutMs: 100 });
    const p2 = runner.run('b');
    const first = last();
    first.emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(100);
    // contract: tarea 6b, ronda 1, punto 6 (plazo agotado con cola)
    expect((await p1).timedOut).toBe(true);
    expect(workers).toHaveLength(2);
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    expect(first.posted.map((m) => m.code)).toEqual(['a']);
    expect(last().posted.map((m) => m.code)).toEqual(['b']);
    last().emit({ type: 'result', id: 2, result: okResult('B') });
    expect((await p2).stdout).toBe('B');
  });

  it('si el worker nuevo tras un plazo falla al cargar, pasa a failed y retry() lo recupera', async () => {
    const runner = createRunner(factory);
    const p1 = runner.run('a', { timeoutMs: 100 });
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(100);
    await p1;
    last().emit({ type: 'init-error', message: 'net' });
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6b, ronda 1, punto 6 (fallo del worker nuevo tras un plazo, sin ninguna run esperando)
    expect(runner.status()).toBe('failed');
    expect((await outcome(runner.run('z'))).error).toBeInstanceOf(PythonLoadError);
    runner.retry();
    const q = runner.run('q');
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    last().emit({ type: 'result', id: 2, result: okResult('Q') });
    expect((await q).stdout).toBe('Q');
  });
});

describe('createRunner: huecos de la re-revisión de la 6b', () => {
  it('retry() con un makeWorker que sigue lanzando no lanza y el estado sigue en failed', async () => {
    const runner = createRunner(() => {
      throw new Error('CSP');
    });
    await outcome(runner.run('x'));
    // contract: tarea 6b, re-revisión (retry() no debe lanzar aunque la fábrica siga fallando)
    expect(() => runner.retry()).not.toThrow();
    // contract: tarea 6b, re-revisión (si vuelve a fallar, el estado sigue siendo failed)
    expect(runner.status()).toBe('failed');
  });

  it('en failed, una segunda run rechaza sin volver a llamar a la fábrica de workers', async () => {
    let calls = 0;
    const runner = createRunner(() => {
      calls++;
      throw new Error('CSP');
    });
    await outcome(runner.run('x'));
    expect(calls).toBe(1);
    const second = await outcome(runner.run('y'));
    // contract: tarea 6b, re-revisión (tras failed toda run rechaza al instante, sin crear workers)
    expect(second.error).toBeInstanceOf(PythonLoadError);
    expect(calls).toBe(1);
  });

  it('retry() dentro de un suscriptor de failed con una ejecución en cola: la en curso rechaza con PythonLoadError y la encolada se resuelve en el worker nuevo', async () => {
    const runner = createRunner(factory);
    runner.onStatus((s) => {
      if (s === 'failed') runner.retry();
    });
    const first = outcome(runner.run('a'));
    const queued = runner.run('b');
    last().fail('boom');
    await vi.advanceTimersByTimeAsync(0);
    // contract: tarea 6b, re-revisión (sonda E1: la ejecución en curso rechaza con PythonLoadError)
    expect((await first).error).toBeInstanceOf(PythonLoadError);
    // contract: tarea 6b, re-revisión (sonda E1: el reintento crea un segundo worker)
    expect(workers).toHaveLength(2);
    last().emit({ type: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    const posted = last().posted[0];
    // contract: tarea 6b, re-revisión (sonda E1: la encolada se envía al worker nuevo, no al caído)
    expect(posted?.type === 'run' ? posted.code : null).toBe('b');
    last().emit({ type: 'result', id: posted!.id, result: okResult('B') });
    expect((await queued).stdout).toBe('B');
  });
});
