import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import {
  completeLaunch as applyCompleteLaunch,
  handInExam as applyHandInExam,
  handInExercise as applyHandInExercise,
  solveSheet as applySolveSheet,
} from '../engine/progression';
import type { QuestionResult } from '../engine/session';
import type { Summary } from '../engine/types';
import { createLocalStore } from '../storage/local';
import { migrate } from '../storage/migrate';
import type { Attempt, ProgressDoc, ProgressStore } from '../storage/types';

/**
 * El almacén real, una sola instancia por sesión (`known` y `suspect` viven en ella, ver
 * storage-risks). Las pruebas inyectan otro con `StoreContext.Provider`.
 */
export const StoreContext = createContext<ProgressStore>(createLocalStore());

export interface Progress {
  summary: Summary;
  /** Aviso del almacén (ya en castellano) o null. */
  warning: string | null;
  /** El registro de intentos tal como está guardado (solo lectura, también cada intento; crece con `record`). */
  attempts: readonly Readonly<Attempt>[];
  /** Añade un intento al registro (en cualquier modo). */
  record(result: QuestionResult, context: Attempt['context']): void;
  completeLaunch(): void;
  handInExercise(projectId: string, ex: 0 | 1 | 2, firsts: number): void;
  handInExam(c: number, correct: number): void;
  solveSheet(sheetId: string): void;
  /** Lee el borrador de una pregunta de código; null si no hay. */
  getDraft(questionId: string): string | null;
  saveDraft(questionId: string, code: string): void;
}

interface Snapshot {
  summary: Summary;
  warning: string | null;
  attempts: readonly Readonly<Attempt>[];
}

type Actions = Omit<Progress, keyof Snapshot>;

/** Lo que comparten todos los componentes que usan el mismo juego sobre el mismo almacén. */
interface Hub {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Snapshot;
  actions: Actions;
}

const hubs = new WeakMap<ProgressStore, Map<string, Hub>>();

const hubFor = (store: ProgressStore, gameId: string): Hub => {
  let byGame = hubs.get(store);
  if (byGame === undefined) {
    byGame = new Map();
    hubs.set(store, byGame);
  }
  let hub = byGame.get(gameId);
  if (hub === undefined) {
    hub = createHub(store, gameId);
    byGame.set(gameId, hub);
  }
  return hub;
};

const createHub = (store: ProgressStore, gameId: string): Hub => {
  const listeners = new Set<() => void>();
  // Siempre se carga antes de cualquier guardado: la primera lectura es esta.
  const first = store.load(gameId);
  let snapshot: Snapshot = {
    summary: first.summary,
    warning: store.warning(),
    attempts: first.attempts,
  };

  const notify = () => listeners.forEach((listener) => listener());

  /**
   * Adopta el estado y el aviso vigentes. Conserva la identidad del `summary` y de `attempts` si
   * no cambió su contenido (grabar intentos no debe disparar los efectos que dependen del
   * `summary`, ni una marca los que dependen de `attempts`). Devuelve si cambió algo.
   */
  const publish = (
    summary: Summary,
    warning: string | null,
    attempts: readonly Readonly<Attempt>[],
  ): boolean => {
    const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
    const sameSummary = same(summary, snapshot.summary);
    const sameAttempts = same(attempts, snapshot.attempts);
    if (sameSummary && sameAttempts && warning === snapshot.warning) return false;
    snapshot = {
      summary: sameSummary ? snapshot.summary : summary,
      warning,
      attempts: sameAttempts ? snapshot.attempts : attempts,
    };
    return true;
  };

  /**
   * Cargar → modificar por copia → comprobar → guardar → releer el aviso. Si `change` lanza, o el
   * documento resultante no lo releería el almacén, no se guarda ni se publica nada y se lanza.
   */
  const mutate = (change: (doc: ProgressDoc) => ProgressDoc): void => {
    const base = store.load(gameId);
    let next: ProgressDoc;
    try {
      next = change(base);
      // Lo que `migrate` rechazaría al releer (NaN que JSON escribe como null, claves fuera de
      // `<proyecto>/<0|1|2>`, enteros negativos) dejaría el progreso apartado como dañado.
      if (migrate(JSON.parse(JSON.stringify(next))) === null) {
        throw new Error('El documento resultante no pasaría la validación del almacén');
      }
    } catch (error) {
      if (publish(snapshot.summary, store.warning(), snapshot.attempts)) notify();
      throw error;
    }
    store.save(gameId, next);
    if (publish(next.summary, store.warning(), next.attempts)) notify();
  };

  const withSummary =
    (apply: (s: Summary) => Summary) =>
    (doc: ProgressDoc): ProgressDoc => ({ ...doc, summary: apply(doc.summary) });

  /** Tras tocar los borradores, el aviso puede haber cambiado. */
  const refreshWarning = (deferred: boolean): void => {
    if (!publish(snapshot.summary, store.warning(), snapshot.attempts)) return;
    // `getDraft` se llama mientras React pinta una pregunta: avisar a otros componentes en ese
    // momento es un error de React, así que se hace en cuanto termina el render.
    if (deferred) queueMicrotask(notify);
    else notify();
  };

  const actions: Actions = {
    record: (result, context) =>
      mutate((doc) => {
        const attempt: Attempt = {
          q: result.questionId,
          at: new Date().toISOString(),
          correct: result.correct,
          submissions: result.submissions,
          hinted: result.hinted,
          context,
        };
        return { ...doc, attempts: [...doc.attempts, attempt] };
      }),
    completeLaunch: () => mutate(withSummary(applyCompleteLaunch)),
    handInExercise: (projectId, ex, firsts) =>
      mutate(withSummary((s) => applyHandInExercise(s, projectId, ex, firsts))),
    handInExam: (c, correct) => mutate(withSummary((s) => applyHandInExam(s, c, correct))),
    solveSheet: (sheetId) => mutate(withSummary((s) => applySolveSheet(s, sheetId))),
    getDraft: (questionId) => {
      const draft = store.loadDraft(gameId, questionId);
      refreshWarning(true);
      return draft;
    },
    saveDraft: (questionId, code) => {
      store.saveDraft(gameId, questionId, code);
      refreshWarning(false);
    },
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    actions,
  };
};

/**
 * Único punto por el que las pantallas leen y escriben el progreso de un juego. El estado vive
 * en un `Hub` por (almacén, juego): todos los componentes ven lo mismo y las funciones tienen
 * identidad estable (se pueden pasar como `onResult` / `getDraft` / `onDraft` sin provocar efectos).
 */
export function useProgress(gameId: string): Progress {
  const store = useContext(StoreContext);
  const hub = hubFor(store, gameId);
  const { summary, warning, attempts } = useSyncExternalStore(hub.subscribe, hub.getSnapshot);
  return useMemo(
    () => ({ summary, warning, attempts, ...hub.actions }),
    [summary, warning, attempts, hub],
  );
}
