import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import type { CodigoQ, Game, NumeroQ, Project, RevisionQ, WarmupStep } from '../../content/schema';
import type { Summary } from '../../engine/types';
import type { RunResult } from '../../python/core';
import type { PythonRunner, RunnerStatus } from '../../python/runner';
import { createLocalStore } from '../../storage/local';
import type { ProgressStore } from '../../storage/types';
import { GamesContext } from '../GamesContext';
import { StoreContext } from '../useProgress';
import { resetOpenOverride } from './lookup';

// Pruebas del calentamiento de Python: su fila en el panel, su enlace desde el ejercicio 3 y su pantalla.

const fake = vi.hoisted(() => ({ run: undefined as unknown }));
vi.mock('../../python/runner', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../python/runner')>();
  const runner: PythonRunner = {
    run: (...args) => (fake.run as PythonRunner['run'])(...args),
    status: () => 'ready' as RunnerStatus,
    onStatus: () => () => undefined,
    retry: () => undefined,
    dispose: () => undefined,
  };
  return { ...original, getRunner: () => runner };
});

class MemoryStorage implements Storage {
  data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const GAME = 'test';

const num = (id: string): NumeroQ => ({
  id,
  type: 'numero',
  prompt: `Enunciado ${id}`,
  answer: 5,
  tol: 0.01,
  hints: [],
  explain: 'x',
  solution: 'x',
});
const code = (id: string): CodigoQ => ({
  id,
  type: 'codigo',
  prompt: `Programa ${id}`,
  requirements: ['r'],
  hints: [],
  explain: 'x',
  solution: 'x',
  starter: 'v = None',
  checks: 'check(v == 1, "v vale 1")',
  reference: 'v = 1',
});
const sheet = (id: string): RevisionQ => ({
  id,
  type: 'revision',
  prompt: `Revisa ${id}`,
  hints: [],
  format: 'texto',
  lines: ['uno', 'dos'],
  faultyLine: 1,
  explain: 'x',
  solution: 'x',
});
const step: WarmupStep = {
  id: 'p.cal.1',
  title: 'Sumar con `+`',
  explain: 'Explicación de la ficha.',
  example: 'print(2 + 3)\n',
  experiments: ['Cambia el 3 por un 4.'],
  task: {
    prompt: 'Guarda en `s` la suma de 4 y 5.',
    starter: 's = None\n',
    checks: 'check(s == 9, "`s` tiene que valer 9")',
    reference: 's = 4 + 5\n',
  },
};
const project = (id: string, name: string, warmup?: WarmupStep[]): Project => ({
  id,
  name,
  sub: `Subtítulo de ${name}`,
  exercises: [
    { kind: 'manipular', questions: [1, 2, 3, 4, 5].map((n) => num(`${id}a${n}`)) },
    { kind: 'calcular', questions: [1, 2, 3, 4, 5].map((n) => num(`${id}b${n}`)) },
    { kind: 'programar', questions: [1, 2, 3, 4, 5].map((n) => code(`${id}c${n}`)) },
  ],
  sheets: [sheet(`${id}h0`), sheet(`${id}h1`), sheet(`${id}h2`)],
  ...(warmup ? { warmup } : {}),
});

const testGame: Game = {
  id: GAME,
  title: 'Juego de prueba',
  launch: [num('pi1')],
  orbits: [
    {
      name: 'Órbita cero',
      projects: [project('p', 'Proyecto P', [step]), project('s', 'Proyecto S')],
      examBank: [],
    },
  ],
};

const newStore = (summary: Partial<Summary> = {}) => {
  const store = createLocalStore(new MemoryStorage());
  const doc = store.load(GAME);
  store.save(GAME, { ...doc, summary: { ...doc.summary, ...summary } });
  return store;
};

function Wrap({ store, children }: { store: ProgressStore; children: ReactNode }) {
  return (
    <GamesContext.Provider value={[testGame]}>
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    </GamesContext.Provider>
  );
}

const setup = async (route: string, store: ProgressStore = newStore({ launch: true })) => {
  const user = userEvent.setup();
  render(
    <Wrap store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Wrap>,
  );
  await waitFor(() => expect(document.querySelector('.layout__title')).not.toBeNull(), {
    timeout: 15000,
  });
  return { user };
};

const result = (over: Partial<RunResult>): RunResult => ({
  stdout: '',
  error: null,
  figures: [],
  checks: null,
  passed: false,
  timedOut: false,
  ...over,
});

const h1 = () => screen.getByRole('heading', { level: 1 });

afterEach(() => {
  resetOpenOverride();
  fake.run = undefined;
});

describe('Calentamiento en el panel y en el ejercicio 3', () => {
  it('el panel lo ofrece justo antes del ejercicio «Programar»', async () => {
    await setup(`/j/${GAME}/p/p`);
    const items = within(screen.getByRole('list', { name: 'Ejercicios' })).getAllByRole('listitem');
    // contract: petición de Oliver 2026-10-23: una sección de calentamiento antes de cada ejercicio «Programar»
    expect(items).toHaveLength(4);
    expect(items[2]).toHaveTextContent('Calentamiento de Python');
    expect(items[2]).toHaveTextContent('No cuenta para la nota');
    expect(
      within(items[2]!).getByRole('link', { name: 'Abrir el calentamiento de Python' }),
    ).toHaveAttribute('href', '/j/test/p/p/calentamiento');
    expect(items[3]).toHaveTextContent('Ejercicio 3 · Programar');
  });

  it('un proyecto sin calentamiento no tiene la fila', async () => {
    await setup(`/j/${GAME}/p/s`);
    const list = within(screen.getByRole('list', { name: 'Ejercicios' }));
    // contract: el calentamiento es opcional en el esquema; sin fichas no hay nada que abrir
    expect(list.getAllByRole('listitem')).toHaveLength(3);
    expect(list.queryByText('Calentamiento de Python')).toBeNull();
  });

  it('el ejercicio 3 enlaza al calentamiento; el ejercicio 1 no', async () => {
    await setup(`/j/${GAME}/p/p/ex/2`);
    // contract: petición de Oliver 2026-10-23: el calentamiento se alcanza desde el ejercicio «Programar»
    expect(screen.getByRole('link', { name: 'calentamiento de Python' })).toHaveAttribute(
      'href',
      '/j/test/p/p/calentamiento',
    );
  });

  it('el ejercicio 1 no lo enlaza', async () => {
    await setup(`/j/${GAME}/p/p/ex/0`);
    // contract: el aviso solo acompaña al ejercicio «Programar»
    expect(screen.queryByRole('link', { name: 'calentamiento de Python' })).toBeNull();
  });
});

describe('Pantalla del calentamiento', () => {
  it('enseña las fichas, ejecuta el ejemplo sin comprobaciones y enlaza al ejercicio 3', async () => {
    const run = vi.fn(() => Promise.resolve(result({ stdout: '5\n' })));
    fake.run = run;
    const { user } = await setup(`/j/${GAME}/p/p/calentamiento`);
    // contract: strings t.warmup.title
    expect(h1()).toHaveTextContent('Proyecto P · Calentamiento de Python');
    const card = screen.getByRole('region', { name: 'Sumar con +' });
    expect(within(card).getByText('Ficha 1 de 1')).toBeInTheDocument();
    expect(within(card).getByText('Cambia el 3 por un 4.')).toBeInTheDocument();
    await user.click(within(card).getAllByRole('button', { name: 'Ejecutar' })[0]!);
    // contract: el ejemplo se ejecuta tal cual, sin comprobaciones
    expect(run).toHaveBeenCalledWith('print(2 + 3)\n');
    expect(await within(card).findByText('5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al ejercicio 3 · Programar' })).toHaveAttribute(
      'href',
      '/j/test/p/p/ex/2',
    );
  });

  it('«Comprobar» pasa las comprobaciones del reto y celebra el acierto', async () => {
    const run = vi.fn(() =>
      Promise.resolve(result({ checks: [{ passed: true, message: 'ok' }], passed: true })),
    );
    fake.run = run;
    const { user } = await setup(`/j/${GAME}/p/p/calentamiento`);
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    // contract: el reto se comprueba con sus checks, sin puntuar (no hay sesión ni intento)
    expect(run).toHaveBeenCalledWith('s = None\n', {
      checks: 'check(s == 9, "`s` tiene que valer 9")',
    });
    expect(await screen.findByText(/¡Conseguido!/)).toBeInTheDocument();
  });

  it('una comprobación fallida enseña su mensaje', async () => {
    fake.run = () =>
      Promise.resolve(
        result({ checks: [{ passed: false, message: '`s` tiene que valer 9' }], passed: false }),
      );
    const { user } = await setup(`/j/${GAME}/p/p/calentamiento`);
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    // contract: Outcome de CodigoQuestion: las comprobaciones fallidas se listan con su mensaje
    expect(await screen.findByText('tiene que valer 9', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/¡Conseguido!/)).toBeNull();
  });

  it('con la órbita cerrada, la puerta', async () => {
    await setup(`/j/${GAME}/p/p/calentamiento`, newStore());
    // contract: como el panel: la órbita cerrada no se abre (Gate «closed»)
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });

  it('un proyecto sin calentamiento no tiene pantalla', async () => {
    await setup(`/j/${GAME}/p/s/calentamiento`);
    // contract: Gate «missing», como un proyecto que no existe
    expect(h1()).toHaveTextContent('No existe');
  });
});
