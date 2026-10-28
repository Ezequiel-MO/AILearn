import { mergeDocs, sameDoc } from '../storage/merge';
import type { ProgressStore } from '../storage/types';
import type { CloudUser } from './firebase';

/** Lo que se usa de `./firebase`; las pruebas lo sustituyen. */
export interface CloudApi {
  watchUser(listener: (user: CloudUser | null) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  syncProgress: typeof import('./firebase').syncProgress;
}

export interface AccountState {
  /** `loading`: aún no se sabe si hay sesión. */
  status: 'loading' | 'out' | 'in';
  name: string | null;
  syncing: boolean;
  /** La última sincronización falló (sin red, nube ilegible…); se reintenta en el próximo guardado. */
  failed: boolean;
}

export interface Account {
  subscribe(listener: () => void): () => void;
  get(): AccountState;
  signIn(): void;
  signOut(): void;
}

export interface CloudStore extends ProgressStore {
  account: Account;
}

/** Espera tras un guardado antes de subirlo: una tanda de preguntas guarda varias veces seguidas. */
export const SYNC_DELAY_MS = 1500;

/**
 * El almacén local, más la nube cuando hay sesión: al iniciar sesión (o al cargar con la sesión
 * abierta) y tras cada guardado, el progreso de cada juego visto se fusiona con el de la nube.
 * Lo local manda en el momento: el juego nunca espera a la red.
 */
export const createCloudStore = (
  local: ProgressStore,
  loadApi: () => Promise<CloudApi> = () => import('./firebase'),
): CloudStore => {
  let api: CloudApi | null = null;
  let uid: string | null = null;
  let state: AccountState = { status: 'loading', name: null, syncing: false, failed: false };
  const accountListeners = new Set<() => void>();
  const changeListeners = new Set<(gameId: string) => void>();
  /** Juegos leídos en esta sesión: los que se sincronizan al entrar. */
  const seen = new Set<string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const running = new Set<string>();
  /** Guardado durante una sincronización en curso: hay que repetirla al acabar. */
  const again = new Set<string>();
  let pending = 0;

  const setState = (patch: Partial<AccountState>) => {
    state = { ...state, ...patch };
    accountListeners.forEach((listener) => listener());
  };

  const sync = async (gameId: string): Promise<void> => {
    if (api === null || uid === null) return;
    if (running.has(gameId)) {
      again.add(gameId);
      return;
    }
    running.add(gameId);
    pending += 1;
    setState({ syncing: true });
    const user = uid;
    try {
      const merged = await api.syncProgress(user, gameId, local.load(gameId));
      if (uid === user) {
        // Lo jugado mientras tanto sigue en lo local: se fusiona encima, nunca se pisa.
        const now = local.load(gameId);
        const next = mergeDocs(now, merged);
        if (!sameDoc(next, now)) {
          local.save(gameId, next);
          changeListeners.forEach((listener) => listener(gameId));
        }
      }
      setState({ failed: false });
    } catch {
      setState({ failed: true });
    } finally {
      running.delete(gameId);
      pending -= 1;
      setState({ syncing: pending > 0 });
      if (again.delete(gameId)) void sync(gameId);
    }
  };

  const schedule = (gameId: string) => {
    if (uid === null) return;
    clearTimeout(timers.get(gameId));
    timers.set(
      gameId,
      setTimeout(() => {
        timers.delete(gameId);
        void sync(gameId);
      }, SYNC_DELAY_MS),
    );
  };

  loadApi()
    .then((loaded) => {
      api = loaded;
      loaded.watchUser((user) => {
        uid = user?.uid ?? null;
        setState(
          user
            ? { status: 'in', name: user.name, failed: false }
            : { status: 'out', name: null, failed: false },
        );
        if (user) seen.forEach((gameId) => void sync(gameId));
      });
    })
    // Sin Firebase (sin red al cargar) se juega igual, solo en local.
    .catch(() => setState({ status: 'out', failed: true }));

  return {
    load: (gameId) => {
      if (!seen.has(gameId)) {
        seen.add(gameId);
        // `load` se llama al pintar: la sincronización empieza después.
        if (uid !== null) setTimeout(() => void sync(gameId), 0);
      }
      return local.load(gameId);
    },
    save: (gameId, doc) => {
      local.save(gameId, doc);
      schedule(gameId);
    },
    loadDraft: (gameId, questionId) => local.loadDraft(gameId, questionId),
    saveDraft: (gameId, questionId, code) => local.saveDraft(gameId, questionId, code),
    // Las tandas a medias, como los borradores, se quedan en este navegador.
    loadRun: (gameId, runId) => local.loadRun(gameId, runId),
    saveRun: (gameId, runId, run) => local.saveRun(gameId, runId, run),
    warning: () => local.warning(),
    onExternalChange: (listener) => {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },
    account: {
      subscribe: (listener) => {
        accountListeners.add(listener);
        return () => {
          accountListeners.delete(listener);
        };
      },
      get: () => state,
      signIn: () => {
        api?.signIn().catch(() => {
          // Ventana cerrada o bloqueada: no pasa nada, sigue sin sesión.
        });
      },
      signOut: () => {
        api?.signOut().catch(() => setState({ failed: true }));
      },
    },
  };
};
