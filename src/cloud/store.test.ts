import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptySummary } from '../engine/types';
import { createLocalStore } from '../storage/local';
import { mergeDocs } from '../storage/merge';
import type { ProgressDoc } from '../storage/types';
import type { CloudUser } from './firebase';
import { createCloudStore, SYNC_DELAY_MS, type CloudApi } from './store';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

const GAME = 'vectores';
const USER: CloudUser = { uid: 'u1', name: 'Oliver' };

const docWith = (firsts: Record<string, number>): ProgressDoc => ({
  schema: 1,
  summary: { ...emptySummary(), firsts },
  attempts: [],
});

/** Nube en memoria con la misma fusión que la real; `hold` deja las sincronizaciones en espera. */
const fakeCloud = () => {
  const remote = new Map<string, ProgressDoc | 'ilegible'>();
  let userListener: (user: CloudUser | null) => void = () => {};
  const held: (() => void)[] = [];
  let hold = false;
  const api: CloudApi = {
    // Como `onAuthStateChanged`: avisa en seguida del estado actual (aquí, sin sesión).
    watchUser: (listener) => {
      userListener = listener;
      listener(null);
      return () => {};
    },
    signIn: () => Promise.resolve(userListener(USER)),
    signOut: () => Promise.resolve(userListener(null)),
    syncProgress: async (_uid, gameId, local) => {
      if (hold) await new Promise<void>((resolve) => held.push(resolve));
      const current = remote.get(gameId);
      if (current === 'ilegible') throw new Error('ilegible');
      const merged = current ? mergeDocs(local, current) : local;
      remote.set(gameId, merged);
      return merged;
    },
  };
  return {
    api,
    remote,
    login: () => userListener(USER),
    holdSyncs: () => (hold = true),
    release: () => held.splice(0).forEach((resolve) => resolve()),
  };
};

const setup = async () => {
  const cloud = fakeCloud();
  const local = createLocalStore(new MemoryStorage());
  const store = createCloudStore(local, () => Promise.resolve(cloud.api));
  const changed: string[] = [];
  store.onExternalChange?.((gameId) => changed.push(gameId));
  await vi.advanceTimersByTimeAsync(0);
  return { cloud, local, store, changed };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('almacén con nube', () => {
  it('al iniciar sesión fusiona lo local con la nube en los dos sentidos y avisa del cambio', async () => {
    const { cloud, local, store, changed } = await setup();
    local.save(GAME, docWith({ 'p/0': 5 }));
    cloud.remote.set(GAME, docWith({ 'q/1': 3 }));
    store.load(GAME);
    expect(store.account.get().status).toBe('out');
    cloud.login();
    await vi.advanceTimersByTimeAsync(0);
    // contract: petición de Oliver 2026-10-14: el progreso se persiste en la cuenta sin perder lo local
    expect(store.load(GAME).summary.firsts).toEqual({ 'p/0': 5, 'q/1': 3 });
    expect(cloud.remote.get(GAME)).toEqual(store.load(GAME));
    expect(changed).toEqual([GAME]);
    expect(store.account.get()).toMatchObject({ status: 'in', name: 'Oliver', failed: false });
  });

  it('con sesión, un guardado se sube tras la espera, no antes', async () => {
    const { cloud, store } = await setup();
    cloud.login();
    store.save(GAME, docWith({ 'p/0': 2 }));
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS - 1);
    // contract: subida agrupada (SYNC_DELAY_MS) para no escribir en cada respuesta
    expect(cloud.remote.has(GAME)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(cloud.remote.get(GAME)).toEqual(docWith({ 'p/0': 2 }));
  });

  it('lo guardado mientras una sincronización está en marcha no se pierde y se sube después', async () => {
    const { cloud, store } = await setup();
    cloud.login();
    cloud.holdSyncs();
    store.save(GAME, docWith({ 'p/0': 1 }));
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);
    // la primera sincronización sigue esperando a la red; mientras tanto se juega
    store.save(GAME, mergeDocs(docWith({ 'p/1': 4 }), store.load(GAME)));
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);
    cloud.release();
    await vi.advanceTimersByTimeAsync(0);
    cloud.release();
    await vi.advanceTimersByTimeAsync(0);
    // contract: lo local manda en el momento; nunca se pisa con lo que vuelve de la nube
    expect(store.load(GAME).summary.firsts).toEqual({ 'p/0': 1, 'p/1': 4 });
    expect(cloud.remote.get(GAME)).toEqual(store.load(GAME));
    expect(store.account.get().syncing).toBe(false);
  });

  it('una nube ilegible no se pisa ni toca lo local: marca el fallo', async () => {
    const { cloud, local, store } = await setup();
    local.save(GAME, docWith({ 'p/0': 5 }));
    cloud.remote.set(GAME, 'ilegible');
    store.load(GAME);
    cloud.login();
    await vi.advanceTimersByTimeAsync(0);
    // contract: CLAUDE.md («Un documento ilegible se aparta, no se borra»), aplicado a la nube
    expect(cloud.remote.get(GAME)).toBe('ilegible');
    expect(store.load(GAME)).toEqual(docWith({ 'p/0': 5 }));
    expect(store.account.get().failed).toBe(true);
  });

  it('sin sesión no se sube nada', async () => {
    const { cloud, store } = await setup();
    cloud.api.signOut();
    store.save(GAME, docWith({ 'p/0': 2 }));
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS * 2);
    // contract: el inicio de sesión es opcional; sin él se juega solo en local
    expect(cloud.remote.size).toBe(0);
  });
});
