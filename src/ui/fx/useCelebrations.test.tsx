import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { games } from '../../games';
import { createLocalStore } from '../../storage/local';
import type { ProgressStore } from '../../storage/types';
import { StoreContext, useProgress } from '../useProgress';
import { useCelebrations } from './useCelebrations';

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
};

const game = games.find((g) => g.id === 'vectores')!;
const project = game.orbits[0]!.projects[0]!;

const mount = (store: ProgressStore) =>
  renderHook(
    () => {
      useCelebrations(game);
      return useProgress(game.id);
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
      ),
    },
  );

const toastTitles = () =>
  Array.from(document.querySelectorAll('.fx-toast__title')).map((e) => e.textContent);

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: true })); // movimiento reducido: avisos sí, confeti no
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useCelebrations', () => {
  it('avisa del logro que trae el despegue', () => {
    const { result } = mount(createLocalStore(memoryStorage()));
    act(() => result.current.completeLaunch());
    act(() => vi.advanceTimersByTime(1000));
    // contract: engine/rewards: completar el despegue da el logro «Despegue» (50 XP, sin subir de nivel)
    expect(toastTitles()).toEqual(['Logro: Despegue']);
  });

  it('avisa de la subida de nivel antes que de los logros', () => {
    const store = createLocalStore(memoryStorage());
    const doc = store.load(game.id);
    // 50 del despegue + 80 del proyecto (4+4+4 = nota 80) + 10 de una hoja = 140 XP: nivel 0
    store.save(game.id, {
      ...doc,
      summary: {
        launch: true,
        firsts: { [`${project.id}/0`]: 4, [`${project.id}/1`]: 4, [`${project.id}/2`]: 4 },
        examsPassed: [],
        sheets: [project.sheets[0]!.id],
      },
    });
    const { result } = mount(store);
    act(() => result.current.solveSheet(project.sheets[1]!.id));
    act(() => vi.advanceTimersByTime(1000));
    // contract: 150 XP = nivel 1 (XP_PER_LEVEL); la segunda hoja no da logro (allSheets pide las tres)
    expect(toastTitles()).toEqual(['¡Nivel 1!']);
  });

  it('repetir lo conseguido no celebra nada', () => {
    const { result } = mount(createLocalStore(memoryStorage()));
    act(() => result.current.completeLaunch());
    act(() => vi.advanceTimersByTime(1000));
    document.body.innerHTML = '';
    act(() => result.current.completeLaunch());
    act(() => vi.advanceTimersByTime(1000));
    // contract: sin cambio del resumen no hay aviso (useSummaryChanges)
    expect(toastTitles()).toEqual([]);
  });
});
