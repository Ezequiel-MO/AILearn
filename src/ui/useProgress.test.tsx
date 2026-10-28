import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuestionResult } from '../engine/session';
import { emptySummary } from '../engine/types';
import { WARNINGS, createLocalStore } from '../storage/local';
import type { ProgressDoc, ProgressStore } from '../storage/types';
import { StoreContext, useProgress, type Progress } from './useProgress';

// Envuelve el constructor real para contar cuántas instancias del almacén se crean.
const stores = vi.hoisted(() => ({ defaultCreated: 0 }));
vi.mock('../storage/local', async (importOriginal) => {
  const original = await importOriginal<typeof import('../storage/local')>();
  return {
    ...original,
    createLocalStore: (injected?: Storage) => {
      if (injected === undefined) stores.defaultCreated += 1;
      return original.createLocalStore(injected);
    },
  };
});

/** Storage falso en memoria; `failGet` / `failSetOn` simulan modo privado o cuota llena. */
class FakeStorage implements Storage {
  data = new Map<string, string>();
  failGet = false;
  failSet = false;
  failSetOn: ((key: string) => boolean) | null = null;
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    if (this.failGet) throw new Error('lectura bloqueada');
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    if (this.failSet || this.failSetOn?.(key) === true) throw new Error('cuota llena');
    this.data.set(key, value);
  }
}

const GAME = 'g';
const KEY = `ailearn:v1:local:${GAME}`;
const DRAFTS_KEY = `${KEY}:borradores`;

const result = (n: number, over: Partial<QuestionResult> = {}): QuestionResult => ({
  questionId: `q${n}`,
  correct: true,
  submissions: 1,
  hinted: false,
  firstTry: true,
  ...over,
});

const wrapperFor =
  (store: ProgressStore) =>
  ({ children }: { children: ReactNode }) => (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );

const mount = (store: ProgressStore, gameId = GAME) =>
  renderHook(() => useProgress(gameId), { wrapper: wrapperFor(store) });

/** Lee lo que de verdad quedó guardado, con un almacén nuevo sobre el mismo Storage. */
const saved = (storage: Storage, gameId = GAME): ProgressDoc =>
  createLocalStore(storage).load(gameId);

const seed = (storage: FakeStorage, doc: ProgressDoc) => {
  storage.data.set(KEY, JSON.stringify(doc));
};

const deepFreeze = <T,>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

/**
 * Comprueba que una acción lanza capturando la excepción dentro de `act`. Si `act` recibe la
 * excepción, React 19 descarta la cola sin vaciarla y la pantalla no llega a renderizar nada de lo
 * que la acción hubiera publicado: la aserción «no se publicó» no mordería.
 */
const expectThrowsInAct = (action: () => void) => {
  act(() => {
    expect(action).toThrow();
  });
};

afterEach(() => {
  vi.useRealTimers();
});

describe('useProgress: las marcas (casos de la tabla de la tarea 13)', () => {
  it('completar el despegue deja summary.launch en true y lo guarda', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.summary.launch).toBe(false); // contract: emptySummary, tarea 2
    act(() => hook.current.completeLaunch());
    expect(hook.current.summary.launch).toBe(true); // contract: tabla tarea 13, «Completar el despegue»
    expect(saved(storage).summary.launch).toBe(true); // contract: tabla tarea 13, «y guardado en el almacén»
  });

  it('un ejercicio con 4 a la primera deja firsts[p/0] en 4 y repetirlo con 2 no lo baja', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => hook.current.handInExercise('p', 0, 4));
    expect(hook.current.summary.firsts['p/0']).toBe(4); // contract: tabla tarea 13, «Ejercicio con 4 a la primera»
    act(() => hook.current.handInExercise('p', 0, 2));
    expect(hook.current.summary.firsts['p/0']).toBe(4); // contract: tabla tarea 13, «Repetir con 2: sigue 4»
    expect(saved(storage).summary.firsts).toEqual({ 'p/0': 4 }); // contract: tabla tarea 13
  });

  it('un examen con 5 aciertos aprueba la órbita y con 4 no', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => hook.current.handInExam(1, 4));
    expect(hook.current.summary.examsPassed).toEqual([]); // contract: tabla tarea 13, «Examen con 4 aciertos: no aprobado»
    act(() => hook.current.handInExam(0, 5));
    expect(hook.current.summary.examsPassed).toEqual([0]); // contract: tabla tarea 13, «Examen con 5 aciertos»
    expect(saved(storage).summary.examsPassed).toEqual([0]); // contract: tabla tarea 13
  });

  it('resolver una hoja la añade a sheets una sola vez', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => hook.current.solveSheet('h1'));
    act(() => hook.current.solveSheet('h1'));
    expect(hook.current.summary.sheets).toEqual(['h1']); // contract: tabla tarea 13, «Hoja acertada»; engine/progression.solveSheet no duplica
    expect(saved(storage).summary.sheets).toEqual(['h1']); // contract: tabla tarea 13
  });

  it('una entrega que el motor rechaza lanza y no guarda ni cambia nada', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    const before = hook.current;
    expectThrowsInAct(() => hook.current.handInExercise('p', 0, 6)); // contract: engine/progression.handInExercise exige 0..5
    expectThrowsInAct(() => hook.current.handInExam(0, 7)); // contract: engine/progression.handInExam exige 0..6
    expect(hook.current).toBe(before); // contract: rereview-13a M1, «lanza sin guardar nada y sin publicar»: ni un render nuevo
    expect(hook.current.summary).toEqual(before.summary); // contract: nada cambió
    expect(storage.data.has(KEY)).toBe(false); // contract: nada se guardó
  });

  it('dos juegos tienen progreso independiente', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const a = mount(store, 'a');
    const b = mount(store, 'b');
    act(() => a.result.current.completeLaunch());
    expect(a.result.current.summary.launch).toBe(true); // contract: el hook de a lo marcó
    expect(b.result.current.summary.launch).toBe(false); // contract: clave por juego, `ailearn:v1:local:<juego>`
    expect(storage.data.has('ailearn:v1:local:a')).toBe(true); // contract: common.md, clave de progreso
    expect(storage.data.has('ailearn:v1:local:b')).toBe(false); // contract: b no se tocó
  });
});

describe('useProgress: el registro de intentos', () => {
  it('record añade un intento por pregunta cerrada con el contexto dado y el resumen intacto', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => {
      for (let i = 0; i < 5; i += 1) {
        hook.current.record(
          result(i, { correct: i < 4, submissions: 1 + (i % 2), hinted: i === 3 }),
          'proyecto',
        );
      }
    });
    const doc = saved(storage);
    expect(doc.attempts).toHaveLength(5); // contract: tabla tarea 13, «5 intentos añadidos»
    expect(doc.attempts.every((a) => a.context === 'proyecto')).toBe(true); // contract: tabla tarea 13, «con contexto proyecto»
    expect(doc.attempts.map((a) => a.q)).toEqual(['q0', 'q1', 'q2', 'q3', 'q4']); // contract: Attempt.q es el id de la pregunta (storage/types)
    expect(doc.attempts.map((a) => a.correct)).toEqual([true, true, true, true, false]); // contract: Attempt.correct = QuestionResult.correct
    expect(doc.attempts.map((a) => a.submissions)).toEqual([1, 2, 1, 2, 1]); // contract: Attempt.submissions = QuestionResult.submissions
    expect(doc.attempts.map((a) => a.hinted)).toEqual([false, false, false, true, false]); // contract: Attempt.hinted = QuestionResult.hinted
    expect(doc.summary).toEqual(emptySummary()); // contract: grabar intentos no toca las marcas
  });

  it('el registro solo crece: repetir un ejercicio añade otros 5 y las marcas no bajan', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => {
      for (let i = 0; i < 5; i += 1) hook.current.record(result(i), 'proyecto');
      hook.current.handInExercise('p', 0, 4);
    });
    act(() => {
      for (let i = 0; i < 5; i += 1)
        hook.current.record(result(i, { correct: false, firstTry: false }), 'proyecto');
      hook.current.handInExercise('p', 0, 2);
    });
    expect(saved(storage).attempts).toHaveLength(10); // contract: tabla tarea 13, «Repetir el ejercicio con 2: el registro crece en 5»
    expect(saved(storage).summary.firsts['p/0']).toBe(4); // contract: tabla tarea 13, «sigue 4»
  });

  it('record acepta los cuatro contextos', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => {
      (['despegue', 'proyecto', 'hoja', 'examen'] as const).forEach((c, i) =>
        hook.current.record(result(i), c),
      );
    });
    expect(saved(storage).attempts.map((a) => a.context)).toEqual([
      'despegue',
      'proyecto',
      'hoja',
      'examen',
    ]); // contract: Attempt['context'], storage/types
  });

  it('la fecha del intento se escribe con toISOString()', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-13T12:34:56.789Z'));
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => hook.current.record(result(1), 'hoja'));
    expect(saved(storage).attempts[0].at).toBe('2026-10-13T12:34:56.789Z'); // contract: ui-conventions / brief 13, fechas con toISOString(); una fecha sin zona hace que el almacén aparte el documento
  });

  it('un documento con intentos guardados por el hook se relee sin apartarse', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const { result: hook } = mount(store);
    act(() => hook.current.record(result(1), 'despegue'));
    expect(store.warning()).toBeNull(); // contract: storage/migrate rechaza fechas sin zona y el almacén avisaría `corrupt`
    expect([...storage.data.keys()].filter((k) => k.includes(':apartado:'))).toEqual([]); // contract: nada apartado
  });
});

describe('useProgress: borradores de código', () => {
  it('un borrador guardado sobrevive a desmontar y volver a montar', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const first = mount(store);
    expect(first.result.current.getDraft('c1')).toBeNull(); // contract: sin borrador, null
    act(() => first.result.current.saveDraft('c1', 'x = 1'));
    first.unmount();
    const second = mount(store);
    expect(second.result.current.getDraft('c1')).toBe('x = 1'); // contract: tabla tarea 13, «Borrador guardado… el borrador sigue»
    // y con un almacén nuevo sobre el mismo Storage (otra carga de la página)
    expect(mount(createLocalStore(storage)).result.current.getDraft('c1')).toBe('x = 1'); // contract: persistido en `:borradores`
  });

  it('los borradores de preguntas distintas no se pisan y guardar uno no toca el progreso', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    act(() => hook.current.saveDraft('c1', 'a'));
    act(() => hook.current.saveDraft('c2', 'b'));
    act(() => hook.current.saveDraft('c1', 'a2'));
    expect(hook.current.getDraft('c1')).toBe('a2'); // contract: el último guardado de la pregunta
    expect(hook.current.getDraft('c2')).toBe('b'); // contract: otra pregunta intacta
    expect(storage.data.has(KEY)).toBe(false); // contract: los borradores viven en su propia clave, el progreso no se escribe
  });
});

describe('useProgress: reglas del almacén (storage-risks.md)', () => {
  it('una sola instancia por sesión: usar el valor por defecto muchas veces no crea otro almacén', () => {
    const defaultCalls = () => stores.defaultCreated;
    expect(defaultCalls()).toBe(1); // contract: storage-risks, «una sola instancia de createLocalStore por sesión»; la crea StoreContext al importar
    const gameId = 'instancia-unica';
    const a = renderHook(() => useProgress(gameId));
    a.rerender();
    a.unmount();
    const b = renderHook(() => useProgress(gameId));
    act(() => b.result.current.completeLaunch());
    b.rerender();
    expect(b.result.current.summary.launch).toBe(true);
    expect(defaultCalls()).toBe(1); // contract: storage-risks, ni al renderizar, ni al volver a montar, ni al mutar
  });

  it('toda mutación carga antes de guardar y el primer guardado de un almacén nuevo no pisa lo anterior', () => {
    const storage = new FakeStorage();
    seed(storage, {
      schema: 1,
      summary: { launch: true, firsts: { 'p/0': 5 }, examsPassed: [0], sheets: ['h0'] },
      attempts: [],
    });
    const inner = createLocalStore(storage);
    const log: string[] = [];
    const spy: ProgressStore = {
      load: (g) => (log.push('load'), inner.load(g)),
      save: (g, d) => (log.push('save'), inner.save(g, d)),
      loadDraft: (g, q) => inner.loadDraft(g, q),
      saveDraft: (g, q, c) => inner.saveDraft(g, q, c),
      loadRun: (g, r) => inner.loadRun(g, r),
      saveRun: (g, r, run) => inner.saveRun(g, r, run),
      warning: () => inner.warning(),
    };
    const { result: hook } = mount(spy);
    act(() => hook.current.solveSheet('h1'));
    act(() => hook.current.record(result(1), 'hoja'));
    expect(log[0]).toBe('load'); // contract: storage-risks, «load antes de cualquier save»
    log.forEach((entry, i) => {
      if (entry === 'save') expect(log[i - 1]).toBe('load'); // contract: brief 13, «cargar → modificar → guardar»
    });
    expect(log.filter((e) => e === 'save')).toHaveLength(2); // contract: una escritura por mutación («guarda de inmediato»)
    const doc = saved(storage);
    expect(doc.summary).toEqual({
      launch: true,
      firsts: { 'p/0': 5 },
      examsPassed: [0],
      sheets: ['h0', 'h1'],
    }); // contract: lo previo se conserva y se añade h1
    expect(doc.attempts).toHaveLength(1); // contract: el intento se añade al documento cargado
    expect([...storage.data.keys()].filter((k) => k.includes(':apartado:'))).toEqual([]); // contract: sin copias de más
  });

  it('el primer render ya trae el progreso guardado (no hay estado vacío antes de la carga)', () => {
    const storage = new FakeStorage();
    seed(storage, {
      schema: 1,
      summary: { ...emptySummary(), launch: true, sheets: ['h0'] },
      attempts: [],
    });
    const seen: boolean[] = [];
    renderHook(
      () => {
        seen.push(useProgress(GAME).summary.launch);
      },
      { wrapper: wrapperFor(createLocalStore(storage)) },
    );
    expect(seen[0]).toBe(true); // contract: useSyncExternalStore carga de forma síncrona; la 13b no necesita estado «cargando»
    expect(seen.every(Boolean)).toBe(true);
  });

  it('cada guardado parte de una carga nueva: lo que otro escribió entre medias no se pierde', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const { result: hook } = mount(store);
    act(() => hook.current.completeLaunch());
    // otro escritor (otra instancia del hook, p. ej.) guarda por su cuenta
    const external = store.load(GAME);
    store.save(GAME, { ...external, summary: { ...external.summary, sheets: ['h-ext'] } });
    act(() => hook.current.handInExercise('p', 1, 3));
    expect(saved(storage).summary).toEqual({
      launch: true,
      firsts: { 'p/1': 3 },
      examsPassed: [],
      sheets: ['h-ext'],
    }); // contract: brief 13, «nunca guarda un documento derivado de una carga anterior a otra carga»
    expect(hook.current.summary.sheets).toEqual(['h-ext']); // contract: el estado del hook es lo que quedó guardado
  });

  it('deriva por copia: nunca muta el documento que devuelve load', () => {
    // Almacén que devuelve y conserva el mismo objeto (como hace el real) y lo congela a fondo.
    const docs: ProgressDoc[] = [];
    let current: ProgressDoc = deepFreeze({ schema: 1, summary: emptySummary(), attempts: [] });
    const ref: ProgressStore = {
      load: () => current,
      save: (_g, doc) => {
        current = deepFreeze(doc);
        docs.push(doc);
      },
      loadDraft: () => null,
      saveDraft: () => undefined,
      loadRun: () => null,
      saveRun: () => undefined,
      warning: () => null,
    };
    const initial = current;
    const initialJson = JSON.stringify(initial);
    const { result: hook } = mount(ref);
    act(() => {
      hook.current.completeLaunch();
      hook.current.handInExercise('p', 0, 4);
      hook.current.handInExam(0, 5);
      hook.current.solveSheet('h1');
      hook.current.record(result(1), 'proyecto');
    }); // contract: con el documento congelado, una mutación en sitio lanzaría TypeError (módulos en modo estricto)
    expect(docs).toHaveLength(5); // contract: una escritura por mutación
    expect(JSON.stringify(initial)).toBe(initialJson); // contract: storage-risks, «no debe mutarlo: deriva siempre por copia»
    expect(current.summary).toEqual({
      launch: true,
      firsts: { 'p/0': 4 },
      examsPassed: [0],
      sheets: ['h1'],
    }); // contract: las cinco mutaciones aplicadas en orden
    expect(current.attempts).toHaveLength(1); // contract: un intento
  });

  it('relee warning() tras cargar: un almacén que no se puede leer avisa desde el primer render', () => {
    const storage = new FakeStorage();
    storage.failGet = true;
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.warning).toBe(WARNINGS.readFailed); // contract: storage-risks, «warning() se relee tras cada load»; texto de WARNINGS (R14)
  });

  it('relee warning() tras guardar: avisa si el guardado falla y lo retira cuando se recupera, sin perder nada', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.warning).toBeNull(); // contract: almacén sano, sin aviso
    storage.failSet = true;
    act(() => hook.current.handInExercise('p', 0, 4));
    expect(hook.current.warning).toBe(WARNINGS.writeFailed); // contract: storage-risks, writeFailed; el estado en memoria no va por delante sin avisar
    expect(hook.current.summary.firsts['p/0']).toBe(4); // contract: la sesión sigue con lo jugado
    expect(storage.data.has(KEY)).toBe(false); // contract: nada se guardó
    storage.failSet = false;
    act(() => hook.current.solveSheet('h1'));
    expect(hook.current.warning).toBeNull(); // contract: «writeFailed hasta que una escritura tenga éxito»
    expect(saved(storage).summary).toEqual({
      ...emptySummary(),
      firsts: { 'p/0': 4 },
      sheets: ['h1'],
    }); // contract: lo jugado durante el fallo se guardó al recuperarse
  });

  it('un fallo al leer al empezar se retira cuando la siguiente carga es correcta', () => {
    const storage = new FakeStorage();
    storage.failGet = true;
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.warning).toBe(WARNINGS.readFailed); // contract: readFailed mientras la lectura falle
    storage.failGet = false;
    act(() => hook.current.completeLaunch());
    expect(hook.current.warning).toBeNull(); // contract: storage-risks, «readFailed desaparece con un load correcto»
    expect(saved(storage).summary.launch).toBe(true); // contract: se guardó
  });

  it('un aviso del almacén de borradores llega a warning al guardar un borrador', () => {
    const storage = new FakeStorage();
    storage.failSetOn = (key) => key === DRAFTS_KEY;
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.warning).toBeNull(); // contract: aún no se ha tocado ningún borrador
    act(() => hook.current.saveDraft('c1', 'x'));
    expect(hook.current.warning).toBe(WARNINGS.draftsWriteFailed); // contract: WARNINGS.draftsWriteFailed (R14); warning() se relee tras saveDraft
    expect(hook.current.getDraft('c1')).toBe('x'); // contract: el borrador sigue en memoria
  });

  it('un aviso al leer un borrador llega a warning tras el render', async () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const { result: hook } = mount(store);
    storage.failGet = true;
    expect(hook.current.getDraft('c1')).toBeNull(); // contract: sin poder leer, null
    await waitFor(() => expect(hook.current.warning).toContain(WARNINGS.draftsReadFailed)); // contract: warning() se relee tras loadDraft (storage-risks); texto de WARNINGS
  });
});

describe('useProgress: varias pantallas a la vez', () => {
  function Reader({ id }: { id: string }) {
    const { summary, warning } = useProgress(GAME);
    return (
      <p data-testid={id}>
        {summary.sheets.join(',')}|{summary.launch ? 'despegue' : '-'}|{warning ?? 'sin aviso'}
      </p>
    );
  }
  function Writer() {
    const { solveSheet, completeLaunch } = useProgress(GAME);
    return (
      <>
        <button onClick={() => solveSheet('h1')}>hoja</button>
        <button onClick={() => completeLaunch()}>despegue</button>
      </>
    );
  }

  it('dos componentes ven el mismo progreso tras una mutación de uno de ellos', () => {
    const storage = new FakeStorage();
    render(
      <StoreContext.Provider value={createLocalStore(storage)}>
        <Reader id="a" />
        <Reader id="b" />
        <Writer />
      </StoreContext.Provider>,
    );
    expect(screen.getByTestId('a')).toHaveTextContent('|-|sin aviso'); // contract: progreso vacío al empezar
    fireEvent.click(screen.getByText('hoja'));
    expect(screen.getByTestId('a')).toHaveTextContent('h1|-|sin aviso'); // contract: brief 13a, «ven el mismo progreso»
    expect(screen.getByTestId('b')).toHaveTextContent('h1|-|sin aviso'); // contract: ídem para el otro lector
    fireEvent.click(screen.getByText('despegue'));
    expect(screen.getByTestId('b')).toHaveTextContent('h1|despegue|sin aviso'); // contract: la segunda mutación parte de la primera (sin pisarla)
    expect(saved(storage).summary).toEqual({ ...emptySummary(), launch: true, sheets: ['h1'] }); // contract: ambas guardadas
  });

  it('el fallo de guardado se ve en todos los componentes', () => {
    const storage = new FakeStorage();
    storage.failSet = true;
    render(
      <StoreContext.Provider value={createLocalStore(storage)}>
        <Reader id="a" />
        <Writer />
      </StoreContext.Provider>,
    );
    fireEvent.click(screen.getByText('hoja'));
    expect(screen.getByTestId('a')).toHaveTextContent(WARNINGS.writeFailed); // contract: WARNINGS.writeFailed (R14), brief 13a «sin que warning lo diga»
  });

  it('funciona en StrictMode (doble render y doble efecto) sin cargar de más ni duplicar escrituras', () => {
    const storage = new FakeStorage();
    const inner = createLocalStore(storage);
    let saves = 0;
    const spy: ProgressStore = { ...inner, save: (g, d) => ((saves += 1), inner.save(g, d)) };
    render(
      <StrictMode>
        <StoreContext.Provider value={spy}>
          <Reader id="a" />
          <Writer />
        </StoreContext.Provider>
      </StrictMode>,
    );
    fireEvent.click(screen.getByText('hoja'));
    expect(saves).toBe(1); // contract: una mutación = una escritura, también con StrictMode
    expect(screen.getByTestId('a')).toHaveTextContent('h1|-|sin aviso'); // contract: el estado se ve
  });
});

describe('useProgress: identidad estable de las funciones', () => {
  it('las siete funciones conservan su identidad entre renders, mutaciones y remontajes', () => {
    const store = createLocalStore(new FakeStorage());
    const seen: ReturnType<typeof useProgress>[] = [];
    const {
      result: hook,
      rerender,
      unmount,
    } = renderHook(
      () => {
        const p = useProgress(GAME);
        seen.push(p);
        return p;
      },
      { wrapper: wrapperFor(store) },
    );
    rerender();
    act(() => hook.current.completeLaunch());
    act(() => hook.current.record(result(1), 'despegue'));
    rerender();
    unmount();
    const again = mount(store);
    const names = [
      'record',
      'completeLaunch',
      'handInExercise',
      'handInExam',
      'solveSheet',
      'getDraft',
      'saveDraft',
    ] as const;
    expect(seen.length).toBeGreaterThan(3);
    for (const name of names) {
      for (const p of seen) expect(p[name]).toBe(seen[0][name]); // contract: brief 13a, «las mutaciones son estables entre renders»
      expect(again.result.current[name]).toBe(seen[0][name]); // contract: mismo almacén y juego, mismas funciones
    }
  });

  it('un efecto que depende de las funciones no se repite al cambiar el progreso', () => {
    const store = createLocalStore(new FakeStorage());
    const onRun = vi.fn();
    function Effect() {
      const p = useProgress(GAME);
      useEffect(() => {
        onRun();
      }, [
        p.record,
        p.completeLaunch,
        p.handInExercise,
        p.handInExam,
        p.solveSheet,
        p.getDraft,
        p.saveDraft,
      ]);
      return (
        <button
          onClick={() => {
            p.solveSheet(`h${p.summary.sheets.length}`);
            p.record(result(1), 'hoja');
          }}
        >
          pulsar
        </button>
      );
    }
    render(
      <StoreContext.Provider value={store}>
        <Effect />
      </StoreContext.Provider>,
    );
    expect(onRun).toHaveBeenCalledTimes(1); // contract: un efecto al montar
    fireEvent.click(screen.getByText('pulsar'));
    fireEvent.click(screen.getByText('pulsar'));
    expect(onRun).toHaveBeenCalledTimes(1); // contract: brief 13a, «sin provocar bucles de efectos»
    expect(store.load(GAME).summary.sheets).toEqual(['h0', 'h1']); // contract: las dos pulsaciones se guardaron
  });

  it('el summary conserva su identidad cuando solo se añaden intentos', () => {
    const store = createLocalStore(new FakeStorage());
    const { result: hook } = mount(store);
    const before = hook.current.summary;
    act(() => hook.current.record(result(1), 'despegue'));
    expect(hook.current.summary).toBe(before); // contract: un efecto sobre `summary` no se dispara por cada intento grabado
  });
});

describe('useProgress: argumentos que el almacén no releería', () => {
  const seeded: ProgressDoc = {
    schema: 1,
    summary: { launch: true, firsts: { 'p/0': 5 }, examsPassed: [0], sheets: ['h0'] },
    attempts: [],
  };
  const invalid: [string, (p: Progress) => void][] = [
    ['handInExam con NaN', (p) => p.handInExam(Number('abc'), 5)],
    ['handInExam con -1', (p) => p.handInExam(-1, 5)],
    ['handInExam con 1.5', (p) => p.handInExam(1.5, 5)],
    ['handInExercise con ex 3', (p) => p.handInExercise('p', 3 as 0, 2)],
    ['handInExercise con projectId vacío', (p) => p.handInExercise('', 0, 2)],
    // contract: rereview-13a N1, la validación cubre también los intentos, no solo el summary
    ['record con submissions 1.5', (p) => p.record(result(1, { submissions: 1.5 }), 'hoja')],
    ['record con un contexto fuera del enum', (p) => p.record(result(1), 'otro' as 'hoja')],
  ];

  it.each(invalid)(
    '%s lanza sin guardar ni publicar, y la mutación siguiente no aparta nada',
    (_name, bad) => {
      const storage = new FakeStorage();
      seed(storage, seeded);
      const raw = storage.data.get(KEY);
      const { result: hook } = mount(createLocalStore(storage));
      const before = hook.current;
      expectThrowsInAct(() => bad(hook.current)); // contract: review-13a H1 y rereview-13a M1, un documento que migrate rechazaría no se guarda; la excepción se captura dentro de act
      expect(storage.data.get(KEY)).toBe(raw); // contract: review-13a H1, el almacén guarda lo de antes
      expect(saved(storage).summary.firsts['p/0']).toBe(5); // contract: review-13a H1, `firsts['p/0']` sigue
      expect(hook.current).toBe(before); // contract: review-13a H1, nada se publicó
      act(() => hook.current.record(result(1), 'proyecto'));
      expect(hook.current.warning).toBeNull(); // contract: review-13a H1, ningún aviso `corrupt`
      expect([...storage.data.keys()].filter((k) => k.includes(':apartado:'))).toEqual([]); // contract: review-13a H1, nada apartado
      const after = saved(storage);
      expect(after.summary).toEqual(seeded.summary); // contract: review-13a H1, la mutación válida parte de lo de antes
      expect(after.attempts.map((a) => a.q)).toEqual(['q1']); // contract: review-13a H1, y se guarda
    },
  );
});

describe('useProgress: una acción que lanza relee el aviso', () => {
  it('si el almacén avisa al cargar y la acción lanza, el aviso llega a la pantalla', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.warning).toBeNull(); // contract: almacén vacío, sin aviso
    storage.data.set(KEY, '{basura'); // otra pestaña dejó el documento ilegible
    expectThrowsInAct(() => hook.current.handInExam(0, 7)); // contract: engine/progression.handInExam exige 0..6; la carga previa a la acción aparta el texto
    expect(hook.current.warning).toBe(WARNINGS.corrupt); // contract: rereview-13a M1 (RI), la rama que lanza relee y publica el aviso; WARNINGS.corrupt de storage/local
  });
});

describe('useProgress: el aviso de getDraft durante el render de otro componente', () => {
  it('una pregunta que lee su borrador al montarse no hace que React avise de un cambio en la cabecera', async () => {
    const storage = new FakeStorage();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      function Stage() {
        const { getDraft } = useProgress(GAME);
        const [draft] = useState(() => getDraft('c1'));
        return <p data-testid="draft">{String(draft)}</p>;
      }
      function Header() {
        const { warning } = useProgress(GAME);
        return <p data-testid="warning">{warning ?? 'sin aviso'}</p>;
      }
      function Screen() {
        const [next, setNext] = useState(false);
        return (
          <>
            <Header />
            <button onClick={() => setNext(true)}>siguiente</button>
            {next && <Stage />}
          </>
        );
      }
      render(
        <StrictMode>
          <StoreContext.Provider value={createLocalStore(storage)}>
            <Screen />
          </StoreContext.Provider>
        </StrictMode>,
      );
      expect(screen.getByTestId('warning')).toHaveTextContent('sin aviso'); // contract: la cabecera ya está suscrita y sin aviso
      storage.failGet = true;
      fireEvent.click(screen.getByText('siguiente'));
      await waitFor(() =>
        expect(screen.getByTestId('warning')).toHaveTextContent(WARNINGS.draftsReadFailed),
      ); // contract: review-13a H2, el aviso llega a la cabecera tras el render
      expect(errors).not.toHaveBeenCalled(); // contract: review-13a H2, notificar en pleno render da «Cannot update a component while rendering a different component»
    } finally {
      errors.mockRestore();
    }
  });
});

describe('useProgress: attempts (solo lectura)', () => {
  it('tras dos record, attempts tiene los dos intentos con q y context', () => {
    const storage = new FakeStorage();
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.attempts).toEqual([]); // contract: review-13a R31, sin intentos al empezar
    act(() => hook.current.record(result(1), 'despegue'));
    act(() => hook.current.record(result(2, { correct: false }), 'hoja'));
    expect(hook.current.attempts).toHaveLength(2); // contract: review-13a R31, dos record = dos intentos
    expect(hook.current.attempts.map((a) => [a.q, a.context])).toEqual([
      ['q1', 'despegue'],
      ['q2', 'hoja'],
    ]); // contract: review-13a R31, el registro tal como está guardado (Attempt.q, Attempt.context)
    expect(hook.current.attempts).toEqual(saved(storage).attempts); // contract: review-13a R31, igual que lo guardado
  });

  it('dos componentes ven el mismo registro', () => {
    const store = createLocalStore(new FakeStorage());
    function Count({ id }: { id: string }) {
      const { attempts } = useProgress(GAME);
      return <p data-testid={id}>{attempts.map((a) => a.q).join(',')}</p>;
    }
    function Add() {
      const { record } = useProgress(GAME);
      return <button onClick={() => record(result(7), 'examen')}>añadir</button>;
    }
    render(
      <StoreContext.Provider value={store}>
        <Count id="a" />
        <Count id="b" />
        <Add />
      </StoreContext.Provider>,
    );
    fireEvent.click(screen.getByText('añadir'));
    expect(screen.getByTestId('a')).toHaveTextContent('q7'); // contract: review-13a R31, mismo hub
    expect(screen.getByTestId('b')).toHaveTextContent('q7'); // contract: review-13a R31, el otro lector lo ve igual
  });

  it('una mutación que no añade intentos no cambia la identidad de attempts', () => {
    const { result: hook } = mount(createLocalStore(new FakeStorage()));
    act(() => hook.current.record(result(1), 'despegue'));
    const before = hook.current.attempts;
    act(() => hook.current.completeLaunch());
    act(() => hook.current.saveDraft('c1', 'x'));
    expect(hook.current.attempts).toBe(before); // contract: review-13a R31, identidad estable si el registro no cambia
    act(() => hook.current.record(result(2), 'despegue'));
    expect(hook.current.attempts).not.toBe(before); // contract: review-13a R31, se actualiza tras record
  });

  it('el primer render ya trae los intentos guardados, antes de mutar nada', () => {
    const storage = new FakeStorage();
    const doc: ProgressDoc = {
      schema: 1,
      summary: emptySummary(),
      attempts: [
        {
          q: 'q1',
          at: '2026-10-01T10:00:00.000Z',
          correct: true,
          submissions: 1,
          hinted: false,
          context: 'despegue',
        },
        {
          q: 'q2',
          at: '2026-10-01T10:01:00.000Z',
          correct: false,
          submissions: 3,
          hinted: true,
          context: 'examen',
        },
      ],
    };
    seed(storage, doc);
    const { result: hook } = mount(createLocalStore(storage));
    expect(hook.current.attempts.map((a) => a.q)).toEqual(['q1', 'q2']); // contract: rereview-13a M2, lo sembrado, no un registro vacío (StatsScreen lee sin mutar)
    expect(hook.current.attempts).toEqual(saved(storage).attempts); // contract: rereview-13a M2, igual que lo guardado
    expect(hook.current.attempts).toEqual(doc.attempts); // contract: rereview-13a M2, el documento sembrado
  });

  it('ni el array ni sus intentos se pueden escribir desde fuera (comprobado por tsc en npm run check)', () => {
    const { result: hook } = mount(createLocalStore(new FakeStorage()));
    act(() => hook.current.record(result(1), 'despegue'));
    const p = hook.current;
    // contract: rereview-13a M3, `attempts: readonly Readonly<Attempt>[]`; cada línea debe dar error de tipos
    // @ts-expect-error el array es de solo lectura
    const push = () => p.attempts.push(p.attempts[0]);
    // @ts-expect-error el campo de un intento es de solo lectura
    const write = () => (p.attempts[0].correct = false);
    // @ts-expect-error el campo q de un intento es de solo lectura
    const rename = () => (p.attempts[0].q = 'x');
    expect([push, write, rename]).toHaveLength(3); // contract: rereview-13a M3, solo se declaran; no se ejecutan (no se muta nada)
  });
});
