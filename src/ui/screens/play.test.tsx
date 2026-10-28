import { readFileSync } from 'node:fs';
import path from 'node:path';
import { EditorView } from '@codemirror/view';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, type ReactNode } from 'react';
import { Link, MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import { drawExam } from '../../content/exam';
import type {
  BankEntry,
  CodigoQ,
  Exercise,
  Game,
  NumeroQ,
  Project,
  RevisionQ,
} from '../../content/schema';
import type { Summary } from '../../engine/types';
import type { RunResult } from '../../python/core';
import type { PythonRunner, RunnerStatus } from '../../python/runner';
import { WARNINGS, createLocalStore } from '../../storage/local';
import type { ProgressStore } from '../../storage/types';
import { GamesContext } from '../GamesContext';
import { StoreContext } from '../useProgress';
import { resetOpenOverride } from './lookup';

// Ejecutor falso para la pregunta de código (como en ExerciseRunner.test.tsx).
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

const passedResult: RunResult = {
  stdout: '',
  error: null,
  figures: [],
  checks: [{ passed: true, message: 'ok' }],
  passed: true,
  timedOut: false,
};

/** Storage en memoria: cada prueba tiene el suyo, nunca el singleton del hook ni el de jsdom. */
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

// --- El juego de prueba: no depende del contenido real del registro ---

const GAME = 'test';

const num = (id: string): NumeroQ => ({
  id,
  type: 'numero',
  prompt: `Enunciado ${id}`,
  answer: 5,
  tol: 0.01,
  hints: [],
  explain: `EXPLICACION ${id}`,
  solution: `SOLUCION ${id}`,
});
const code = (id: string): CodigoQ => ({
  id,
  type: 'codigo',
  requirements: ['r'],
  prompt: `Escribe código ${id}`,
  hints: [],
  explain: 'Falta asignar.',
  solution: 'x = 1',
  starter: 'x = 0',
  checks: 'check(x == 1, "x debería valer 1")',
  reference: 'x = 1',
});
const sheet = (id: string): RevisionQ => ({
  id,
  type: 'revision',
  prompt: `Revisa ${id}`,
  hints: [],
  format: 'texto',
  lines: ['uno', 'dos', 'tres'],
  faultyLine: 1,
  explain: 'La segunda línea es la errónea.',
  solution: 'La línea 2.',
});
const five = (prefix: string, make: (id: string) => NumeroQ | CodigoQ): Exercise['questions'] =>
  [1, 2, 3, 4, 5].map((n) => make(`${prefix}${n}`));
const project = (id: string, name: string, tag: string): Project => ({
  id,
  name,
  sub: `Subtítulo de ${name}`,
  exercises: [
    { kind: 'manipular', questions: five(`${tag}a`, num) },
    { kind: 'calcular', questions: five(`${tag}b`, num) },
    { kind: 'programar', questions: five(`${tag}c`, code) },
  ],
  sheets: [sheet(`${tag}h0`), sheet(`${tag}h1`), sheet(`${tag}h2`)],
});

/** Seis entradas de banco para un proyecto (el examen de la órbita con un solo proyecto saca las seis). */
const bank = (projectId: string): BankEntry[] =>
  [1, 2, 3, 4, 5, 6].map((n) => ({ project: projectId, question: num(`e${projectId}${n}`) }));

const testGame: Game = {
  id: GAME,
  title: 'Juego de prueba',
  launch: [num('pi1'), num('pi2')],
  orbits: [
    { name: 'Órbita cero', projects: [project('p', 'Proyecto P', 'p')], examBank: bank('p') },
    {
      name: 'Órbita uno',
      projects: [project('r', 'Proyecto R', 'r'), project('q', 'Proyecto Q', 'q')],
      examBank: [...bank('r'), ...bank('q')],
    },
  ],
};

/** Un juego cuyo órbita 1 no tiene proyectos (el esquema no lo prohíbe; `drawExam` lanzaría). */
const EMPTY_GAME = 'vacio';
const emptyOrbitGame: Game = {
  ...testGame,
  id: EMPTY_GAME,
  orbits: [testGame.orbits[0]!, { name: 'Órbita vacía', projects: [], examBank: [] }],
};

// --- Ayudantes ---

const newStore = () => {
  const storage = new MemoryStorage();
  return { storage, store: createLocalStore(storage) };
};

/** Siembra el resumen con la secuencia segura: cargar y después guardar. */
const seed = (store: ProgressStore, summary: Partial<Summary>, game: string = GAME) => {
  const doc = store.load(game);
  store.save(game, { ...doc, summary: { ...doc.summary, ...summary } });
};

const validated = (id: string): Record<string, number> => ({
  [`${id}/0`]: 5,
  [`${id}/1`]: 5,
  [`${id}/2`]: 5,
});

function Wrap({ store, children }: { store: ProgressStore; children: ReactNode }) {
  return (
    <GamesContext.Provider value={[testGame, emptyOrbitGame]}>
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    </GamesContext.Provider>
  );
}

const setup = async (route: string, store: ProgressStore = newStore().store, strict = false) => {
  const user = userEvent.setup();
  const tree = (
    <Wrap store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
        <Link to={`/j/${GAME}/p/p/ex/1?abierto`}>ir al ejercicio 2</Link>
      </MemoryRouter>
    </Wrap>
  );
  const utils = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  // Las pantallas se cargan con `lazy`: se espera a que pinten su título .
  // La primera carga de cada trozo en frío (transformar KaTeX, el ejecutor…) puede pasar de 1 s con la máquina cargada.
  await waitFor(() => expect(document.querySelector('.layout__title')).not.toBeNull(), {
    timeout: 15000,
  });
  return { store, user, ...utils };
};

const saved = (store: ProgressStore) => store.load(GAME);

const submitButton = () => screen.getByRole('button', { name: 'Entregar' });
const nextButton = () => screen.getByRole('button', { name: 'Siguiente' });

// «Entregar» queda desactivado 450 ms tras cada entrega: se espera a que vuelva.
const answer = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await waitFor(() => expect(submitButton()).toBeEnabled());
  const field = screen.getByLabelText('Tu respuesta');
  await user.clear(field);
  await user.type(field, text);
  await user.click(submitButton());
};
const solve = async (user: ReturnType<typeof userEvent.setup>) => {
  await answer(user, '5');
  await user.click(nextButton());
};
/** Fallar dos veces: la primera da una segunda oportunidad y la segunda enseña la solución. */
const miss = async (user: ReturnType<typeof userEvent.setup>) => {
  await answer(user, '9');
  await answer(user, '9');
  await user.click(nextButton());
};

const h1 = () => screen.getByRole('heading', { level: 1 });
const editor = (): EditorView => {
  const found = EditorView.findFromDOM(document.querySelector<HTMLElement>('.cm-editor')!);
  if (!found) throw new Error('no hay editor');
  return found;
};

afterEach(() => {
  fake.run = undefined;
  vi.unstubAllEnvs();
  resetOpenOverride();
});

describe('Puertas y rutas inexistentes', () => {
  it('un ejercicio de la órbita 1 sin examen 0 dice «Todavía no está abierto», con enlace al mapa', async () => {
    const { storage, store } = newStore();
    // la órbita 0 está abierta (despegue hecho) y su proyecto validado, pero falta el examen 0:
    // una puerta que mirase siempre la órbita 0 abriría esta pantalla
    seed(store, { launch: true, firsts: validated('p') });
    const before = [...storage.data.entries()];
    await setup(`/j/${GAME}/p/r/ex/0`, store);
    // contract: brief tarea 13, tabla de casos («Entrar por URL a un ejercicio de la órbita 1 sin examen 0»); review-13b I1
    expect(h1()).toHaveTextContent('Todavía no está abierto');
    expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute('href', '/j/test');
    // la puerta no escribe nada en el almacén
    expect([...storage.data.entries()]).toEqual(before);
  });

  it('una hoja de un proyecto no validado dice «Todavía no está abierto»', async () => {
    await setup(`/j/${GAME}/p/p/hoja/0`);
    // contract: brief tarea 13, tabla de casos («Entrar a una hoja de un proyecto no validado»)
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });

  it('con la órbita abierta pero el proyecto sin validar, la hoja sigue cerrada', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: { 'p/0': 5, 'p/1': 5 } });
    await setup(`/j/${GAME}/p/p/hoja/0`, store);
    // contract: motor sheetsOpen (nota 67 < 80): las hojas se abren al validar el proyecto
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });

  it('una hoja de un proyecto validado pero de una órbita cerrada sigue cerrada', async () => {
    const { store } = newStore();
    // órbita 0 abierta y proyecto R validado, sin examen 0: la órbita 1 sigue cerrada
    seed(store, { launch: true, firsts: { ...validated('p'), ...validated('r') } });
    await setup(`/j/${GAME}/p/r/hoja/0`, store);
    // contract: brief tarea 13, regla de puertas («órbita no abierta, hojas no abiertas»): se combinan orbitOpen y sheetsOpen; review-13b I1
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });

  it('con la órbita abierta y el proyecto validado, la hoja se abre', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: validated('p') });
    await setup(`/j/${GAME}/p/p/hoja/0`, store);
    // contract: motor sheetsOpen (proyecto validado con nota >= 80)
    expect(h1()).toHaveTextContent('Proyecto P · Caza el error 1');
  });

  it('el ejercicio de la órbita 1 se abre al aprobar el examen 0 (órbita abierta)', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: validated('p'), examsPassed: [0] });
    await setup(`/j/${GAME}/p/r/ex/0`, store);
    // contract: motor orbitOpen (despegue y examen de la órbita anterior aprobada)
    expect(h1()).toHaveTextContent('Proyecto R · Ejercicio 1');
  });

  it('?abierto salta la puerta también en producción', async () => {
    vi.stubEnv('DEV', false);
    await setup(`/j/${GAME}/p/r/ex/0?abierto`);
    // contract: petición de Oliver 2026-10-14 («añadiendo ?abierto en la url, tener acceso a todos los niveles»; producción es solo para él)
    expect(h1()).toHaveTextContent('Proyecto R · Ejercicio 1');
  });

  it('?abierto sigue valiendo al navegar a una ruta sin el parámetro, hasta recargar', async () => {
    const first = await setup(`/j/${GAME}?abierto`);
    first.unmount();
    await setup(`/j/${GAME}/p/r/ex/0`);
    // contract: petición de Oliver 2026-10-14; los enlaces del juego no llevan `?abierto`
    expect(h1()).toHaveTextContent('Proyecto R · Ejercicio 1');
    resetOpenOverride();
  });

  it('sin ?abierto la puerta sigue cerrada', async () => {
    await setup(`/j/${GAME}/p/r/ex/0`);
    // contract: motor orbitOpen; `?abierto` no se queda entre pruebas (resetOpenOverride)
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });

  it.each([
    ['proyecto', `/j/${GAME}/p/zzz/ex/0`],
    ['ejercicio 3', `/j/${GAME}/p/p/ex/3`],
    ['ejercicio no numérico', `/j/${GAME}/p/p/ex/abc`],
    ['ejercicio con cero delante', `/j/${GAME}/p/p/ex/01`],
    ['hoja 3', `/j/${GAME}/p/p/hoja/3`],
    ['proyecto de una hoja', `/j/${GAME}/p/zzz/hoja/0`],
  ])(
    'ruta inexistente (%s): «No existe» con enlace al mapa, sin escribir',
    async (_name, route) => {
      const { storage, store } = newStore();
      await setup(route, store);
      // contract: brief tarea 13, tabla de casos («Ruta de proyecto inexistente → No existe»)
      expect(h1()).toHaveTextContent('No existe');
      expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute(
        'href',
        '/j/test',
      );
      expect(storage.data.size).toBe(0);
      // contract: brief 13b (R33): el foco nunca queda en body al cambiar de pantalla
      expect(h1()).toHaveFocus();
    },
  );

  it('un juego inexistente dice «No existe» y manda al inicio (no hay mapa que mostrar)', async () => {
    const { storage, store } = newStore();
    await setup('/j/nada/despegue', store);
    // contract: brief tarea 13, regla («Juego… inexistentes: No existe»); sin juego no hay mapa: el enlace va a «/»
    expect(h1()).toHaveTextContent('No existe');
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
    expect(storage.data.size).toBe(0);
  });

  it('al entrar en una puerta el foco está en el título, no en body', async () => {
    await setup(`/j/${GAME}/p/r/ex/0`);
    // contract: brief 13b (R33): el foco nunca queda en body al cambiar de pantalla
    expect(h1()).toHaveFocus();
  });
});

describe('Despegue', () => {
  it('completarla: summary.launch true y guardado, con intentos de contexto despegue', async () => {
    const { store, user } = await setup(`/j/${GAME}/despegue`);
    expect(h1()).toHaveTextContent('Despegue');
    // contract: renombrado despegue/órbita; brief 13b (R33): el foco pasa al título al entrar
    expect(h1()).toHaveFocus();
    await solve(user);
    await solve(user);
    // contract: renombrado despegue/órbita; brief tarea 13, tabla de casos («Completar el despegue»)
    expect(saved(store).summary.launch).toBe(true);
    expect(saved(store).attempts.map((a) => [a.q, a.context, a.correct])).toEqual([
      ['pi1', 'despegue', true],
      ['pi2', 'despegue', true],
    ]);
    expect(
      screen.getByText('Despegue completado: 2 de 2 acertadas, 2 a la primera.'),
    ).toBeVisible();
    // contract: reglas, XP 50 por despegue y nivel = XP / 150 con dos decimales y coma
    expect(document.querySelector('.layout__level')).toHaveTextContent('Nivel 0,33');
  });

  it('abandonarla a mitad no la marca, pero el intento cerrado queda en el registro', async () => {
    const { store, user, unmount } = await setup(`/j/${GAME}/despegue`);
    await solve(user);
    unmount();
    // contract: review-13b m2 y brief tarea 13 («al terminar llama a completeLaunch»)
    expect(saved(store).summary.launch).toBe(false);
    expect(saved(store).attempts).toHaveLength(1);
  });

  it('abandonarla a mitad y volver: sigue en la pregunta donde se dejó', async () => {
    const { store, user, unmount } = await setup(`/j/${GAME}/despegue`);
    await solve(user);
    unmount();
    const again = await setup(`/j/${GAME}/despegue`, store);
    // contract: petición de Oliver 2026-10-28 («que se guarde el nivel en el que lo dejé»)
    expect(screen.getByText('2 de 2')).toBeInTheDocument();
    await solve(again.user);
    expect(saved(store).summary.launch).toBe(true);
    expect(
      screen.getByText('Despegue completado: 2 de 2 acertadas, 2 a la primera.'),
    ).toBeVisible();
  });

  it('en StrictMode no duplica intentos ni marcas', async () => {
    const { store, user } = await setup(`/j/${GAME}/despegue`, newStore().store, true);
    await solve(user);
    await solve(user);
    // contract: review-12 I3 (los manejadores de la tanda no se duplican en StrictMode)
    expect(saved(store).attempts).toHaveLength(2);
  });

  it('Repetir monta una tanda nueva y devuelve el foco al título', async () => {
    const { user } = await setup(`/j/${GAME}/despegue`);
    await solve(user);
    await solve(user);
    await user.click(screen.getByRole('button', { name: 'Repetir' }));
    expect(screen.getByText('1 de 2')).toBeInTheDocument();
    // contract: brief 13b (R33): el foco nunca queda en body (el botón se desmonta)
    expect(h1()).toHaveFocus();
  });

  it('con el almacén avisando, el aviso se ve en la cabecera', async () => {
    const { storage, store } = newStore();
    storage.setItem(`ailearn:v1:local:${GAME}`, '{basura');
    await setup(`/j/${GAME}/despegue`, store);
    // contract: brief tarea 13, tabla de casos («Almacén con aviso → el aviso se ve en la cabecera»)
    const zone = document.querySelector<HTMLElement>('.layout__warnings')!;
    expect(within(zone).getByText(WARNINGS.corrupt)).toBeVisible();
  });
});

describe('Repaso de un ejercicio ya entregado', () => {
  const handedIn = () => {
    const s = newStore().store;
    seed(s, { firsts: { 'p/0': 3 } });
    return s;
  };

  it('se abre en repaso: aviso, cinco pestañas y la pregunta 1, sin contador de «a la primera»', async () => {
    await setup(`/j/${GAME}/p/p/ex/0?abierto`, handedIn());
    // contract: petición de Oliver (2026-10-15): «lo superado debería poder inspeccionarlo» sin volver a entregar
    expect(screen.getByText(/nada de lo que hagas aquí cuenta para la nota/)).toBeVisible();
    const nav = screen.getByRole('navigation', { name: 'Preguntas del ejercicio' });
    expect(within(nav).getAllByRole('button')).toHaveLength(5); // contract: 5 preguntas por ejercicio
    expect(within(nav).getByRole('button', { name: 'Ir a la pregunta 1' })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByText('Enunciado pa1')).toBeVisible();
    expect(screen.queryByText(/A la primera/)).toBeNull(); // contract: el repaso no puntúa
  });

  it('salta a cualquier pregunta y enseña explicación y solución bajo demanda', async () => {
    const { user } = await setup(`/j/${GAME}/p/p/ex/0?abierto`, handedIn());
    await user.click(screen.getByRole('button', { name: 'Ir a la pregunta 4' }));
    // contract: navegación libre entre las preguntas
    expect(screen.getByText('Enunciado pa4')).toBeVisible();
    expect(screen.getByText('4 de 5')).toBeInTheDocument();
    expect(screen.queryByText('SOLUCION pa4')).toBeNull(); // contract: la solución se pide, no se impone
    await user.click(screen.getByRole('button', { name: 'Ver la solución' }));
    expect(screen.getByText('EXPLICACION pa4')).toBeVisible();
    expect(screen.getByText('SOLUCION pa4')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByText('Enunciado pa3')).toBeVisible(); // contract: Anterior y Siguiente recorren las preguntas
    expect(screen.queryByText('SOLUCION pa3')).toBeNull(); // contract: al cambiar de pregunta se oculta la solución
  });

  it('contestar en el repaso dice si es correcto, pero no registra intentos ni cambia la marca', async () => {
    const store = handedIn();
    const { user } = await setup(`/j/${GAME}/p/p/ex/0?abierto`, store);
    await answer(user, '9');
    expect(screen.getByText(/Todavía no\. Puedes volver a intentarlo/)).toBeVisible();
    await answer(user, '5');
    expect(screen.getByText('¡Correcto!')).toBeVisible();
    // contract: petición de Oliver (2026-10-15): repasar no es volver a entregar
    expect(saved(store).attempts).toHaveLength(0);
    expect(saved(store).summary.firsts).toEqual({ 'p/0': 3 });
  });

  it('«Volver a hacerlo» arranca la tanda que cuenta, y al terminarla «Repasar» vuelve al repaso', async () => {
    const store = handedIn();
    const { user } = await setup(`/j/${GAME}/p/p/ex/0?abierto`, store);
    await user.click(screen.getByRole('button', { name: 'Volver a hacerlo (cuenta)' }));
    // contract: la tanda normal, con su contador
    expect(screen.getByText('A la primera: 0')).toBeInTheDocument();
    for (let n = 0; n < 5; n++) await solve(user);
    expect(saved(store).summary.firsts['p/0']).toBe(5); // contract: la tanda repetida cuenta (mejor marca)
    await user.click(screen.getByRole('button', { name: 'Repasar' }));
    expect(screen.getByRole('navigation', { name: 'Preguntas del ejercicio' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Resultado' })).toBeNull();
  });

  it('con una tanda nueva a medias se abre en esa tanda, donde se dejó, no en repaso', async () => {
    const store = handedIn();
    const { user, unmount } = await setup(`/j/${GAME}/p/p/ex/0?abierto`, store);
    await user.click(screen.getByRole('button', { name: 'Volver a hacerlo (cuenta)' }));
    await solve(user);
    unmount();
    await setup(`/j/${GAME}/p/p/ex/0?abierto`, store);
    // contract: petición de Oliver 2026-10-28 («que se guarde el nivel en el que lo dejé»)
    expect(screen.queryByRole('navigation', { name: 'Preguntas del ejercicio' })).toBeNull();
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
    expect(screen.getByText('A la primera: 1')).toBeInTheDocument();
  });

  it('un ejercicio sin entregar se abre en la tanda normal, no en repaso', async () => {
    await setup(`/j/${GAME}/p/p/ex/1?abierto`, handedIn());
    // contract: solo lo entregado se repasa
    expect(screen.queryByRole('navigation', { name: 'Preguntas del ejercicio' })).toBeNull();
    expect(screen.getByText('A la primera: 0')).toBeInTheDocument();
  });
});

describe('Ejercicio', () => {
  it('4 a la primera y la quinta acertada a la segunda: firsts 4 (no 5), cinco intentos de contexto proyecto y el resultado en pantalla', async () => {
    const { store, user } = await setup(`/j/${GAME}/p/p/ex/0?abierto`);
    for (let n = 0; n < 4; n++) await solve(user);
    await answer(user, '9');
    await answer(user, '5');
    await user.click(nextButton());
    // contract: brief tarea 13, tabla de casos («Ejercicio con 4 a la primera»); review-13b I2: 5 aciertos pero 4 a la primera
    expect(saved(store).summary.firsts['p/0']).toBe(4);
    const attempts = saved(store).attempts;
    expect(attempts).toHaveLength(5);
    expect(attempts.every((a) => a.context === 'proyecto')).toBe(true);
    expect(attempts.map((a) => [a.correct, a.submissions])).toEqual([
      [true, 1],
      [true, 1],
      [true, 1],
      [true, 1],
      [true, 2],
    ]);
    // contract: brief tarea 13, regla («muestra el resultado del ejercicio, la nota actual del proyecto y si queda validado»);
    // nota = round(100 * 4 / 15) = 27 (motor mark)
    const result = screen.getByRole('region', { name: 'Resultado' });
    expect(within(result).getByText('Este intento: 4 de 5 a la primera.')).toBeVisible();
    expect(within(result).getByText('Tu mejor marca en este ejercicio: 4 de 5.')).toBeVisible();
    expect(within(result).getByText('Nota del proyecto: 27 sobre 100.')).toBeVisible();
    expect(
      within(result).getByText('El proyecto aún no está validado: hace falta una nota de 80.'),
    ).toBeVisible();
  });

  it('repetir con 2: la marca sigue en 4 y el registro crece en 5', async () => {
    const { store, user } = await setup(
      `/j/${GAME}/p/p/ex/0?abierto`,
      (() => {
        const s = newStore().store;
        seed(s, { firsts: { 'p/0': 4 } });
        return s;
      })(),
    );
    // contract: petición de Oliver (2026-10-15): un ejercicio entregado se abre en repaso; repetirlo es un gesto explícito
    await user.click(screen.getByRole('button', { name: 'Volver a hacerlo (cuenta)' }));
    for (let n = 0; n < 2; n++) await solve(user);
    for (let n = 0; n < 3; n++) await miss(user);
    // contract: brief tarea 13, tabla de casos («Repetir el ejercicio con 2 → sigue 4; el registro crece en 5»)
    expect(saved(store).summary.firsts['p/0']).toBe(4);
    expect(saved(store).attempts).toHaveLength(5);
    const result = screen.getByRole('region', { name: 'Resultado' });
    expect(within(result).getByText('Este intento: 2 de 5 a la primera.')).toBeVisible();
    expect(within(result).getByText('Tu mejor marca en este ejercicio: 4 de 5.')).toBeVisible();
  });

  it('con 15 a la primera entre los tres ejercicios el proyecto queda validado', async () => {
    const { store, user } = await setup(
      `/j/${GAME}/p/p/ex/1?abierto`,
      (() => {
        const s = newStore().store;
        seed(s, { firsts: { 'p/0': 5, 'p/2': 5 } });
        return s;
      })(),
    );
    for (let n = 0; n < 5; n++) await solve(user);
    // contract: motor projectMark / isValidated (15 de 15 → nota 100, validado desde 80)
    expect(saved(store).summary.firsts['p/1']).toBe(5);
    const result = screen.getByRole('region', { name: 'Resultado' });
    expect(within(result).getByText('Nota del proyecto: 100 sobre 100.')).toBeVisible();
    expect(within(result).getByText('Proyecto validado.')).toBeVisible();
  });

  it('abandonar en la pregunta 3 y volver: sigue en la 3 con sus 2 a la primera, y al terminar cuentan las 5', async () => {
    const { store, user, unmount } = await setup(`/j/${GAME}/p/p/ex/0?abierto`);
    await solve(user);
    await solve(user);
    expect(screen.getByText('3 de 5')).toBeInTheDocument();
    unmount();
    // contract: brief tarea 13, tabla de casos («Abandonar un ejercicio en la pregunta 3 y volver»): la marca no cambia hasta entregar
    expect(saved(store).summary.firsts).toEqual({});
    expect(saved(store).attempts).toHaveLength(2);
    const again = await setup(`/j/${GAME}/p/p/ex/0?abierto`, store);
    // contract: petición de Oliver 2026-10-28 («que se guarde el nivel en el que lo dejé; los niveles que ya he superado no los quiero volver a hacer»)
    expect(screen.getByText('3 de 5')).toBeInTheDocument();
    expect(screen.getByText('Enunciado pa3')).toBeVisible();
    expect(screen.getByText('A la primera: 2')).toBeInTheDocument();
    for (let n = 0; n < 3; n++) await solve(again.user);
    // contract: motor handInExercise: la marca suma las preguntas de antes de salir y las de después
    expect(saved(store).summary.firsts['p/0']).toBe(5);
    expect(saved(store).attempts).toHaveLength(5);
    // contract: una tanda terminada no se retoma: «Repetir» y la próxima visita empiezan de cero
    expect(store.loadRun(GAME, 'p/0')).toBeNull();
  });

  it('salir tras un fallo y volver: sigue con la segunda oportunidad y no cuenta como a la primera', async () => {
    const { store, user, unmount } = await setup(`/j/${GAME}/p/p/ex/0?abierto`);
    await answer(user, '9');
    expect(screen.getByText('EXPLICACION pa1')).toBeVisible();
    unmount();
    const again = await setup(`/j/${GAME}/p/p/ex/0?abierto`, store);
    // contract: motor step (submit): salir no reinicia la pregunta; si lo hiciera, tras fallar se acertaría «a la primera»
    expect(screen.getByText('EXPLICACION pa1')).toBeVisible();
    await answer(again.user, '5');
    await again.user.click(nextButton());
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
    expect(screen.getByText('A la primera: 0')).toBeInTheDocument();
  });

  it('la tanda a medias de un ejercicio no se mezcla con la de otro', async () => {
    const { store, user, unmount } = await setup(`/j/${GAME}/p/p/ex/0?abierto`);
    await solve(user);
    unmount();
    await setup(`/j/${GAME}/p/p/ex/1?abierto`, store);
    // contract: cada ejercicio guarda su tanda con su propio id (`<proyecto>/<n>`)
    expect(screen.getByText('1 de 5')).toBeInTheDocument();
    expect(screen.getByText('Enunciado pb1')).toBeVisible();
  });

  it('cambiar de ejercicio en la misma ruta monta una tanda nueva', async () => {
    const { store, user } = await setup(`/j/${GAME}/p/p/ex/0?abierto`);
    await solve(user);
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'ir al ejercicio 2' }));
    // contract: review-12 (la tanda se fija al montar: otra tanda exige otra key)
    expect(screen.getByText('1 de 5')).toBeInTheDocument();
    expect(screen.getByText('Enunciado pb1')).toBeInTheDocument();
    expect(saved(store).attempts).toHaveLength(1);
  });

  it('un borrador de código guardado sigue al desmontar y volver a montar', async () => {
    fake.run = vi.fn(() => Promise.resolve(passedResult));
    const { store, unmount } = await setup(`/j/${GAME}/p/p/ex/2?abierto`);
    await screen.findByLabelText('Editor de código Python');
    expect(editor().state.doc.toString()).toBe('x = 0');
    act(() =>
      editor().dispatch({ changes: { from: 0, to: editor().state.doc.length, insert: 'x = 42' } }),
    );
    unmount();
    // contract: brief tarea 13, tabla de casos («Borrador guardado en una pregunta de código, desmontar y volver a montar → el borrador sigue»)
    expect(store.loadDraft(GAME, 'pc1')).toBe('x = 42');
    await setup(`/j/${GAME}/p/p/ex/2?abierto`, store);
    await screen.findByLabelText('Editor de código Python');
    expect(editor().state.doc.toString()).toBe('x = 42');
  });

  it('el aviso del almacén también se ve en la puerta', async () => {
    const { storage, store } = newStore();
    storage.setItem(`ailearn:v1:local:${GAME}`, '{basura');
    await setup(`/j/${GAME}/p/r/ex/0`, store);
    // contract: brief tarea 13, tabla de casos («Almacén con aviso → el aviso se ve en la cabecera»)
    expect(screen.getByText(WARNINGS.corrupt)).toBeVisible();
  });
});

describe('Hoja', () => {
  const openSheets = () => {
    const s = newStore();
    seed(s.store, { launch: true, firsts: validated('p') });
    return s.store;
  };

  it('acertada: se añade a sheets y el intento es de contexto hoja', async () => {
    const { store, user } = await setup(`/j/${GAME}/p/p/hoja/0`, openSheets());
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: 'Línea 2: dos' }));
    await user.click(submitButton());
    await user.click(nextButton());
    // contract: brief tarea 13, tabla de casos («Hoja acertada → se añade a sheets»)
    expect(saved(store).summary.sheets).toEqual(['ph0']);
    expect(saved(store).attempts.map((a) => [a.q, a.context, a.correct])).toEqual([
      ['ph0', 'hoja', true],
    ]);
    expect(screen.getByText('Hoja resuelta.')).toBeVisible();
  });

  it('acertada a la segunda: se añade a sheets con dos entregas en el intento', async () => {
    const { store, user } = await setup(`/j/${GAME}/p/p/hoja/0`, openSheets());
    await user.click(screen.getByRole('radio', { name: 'Está bien' }));
    await user.click(submitButton());
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: 'Línea 2: dos' }));
    await user.click(submitButton());
    await user.click(nextButton());
    // contract: review-13b m1 y brief tarea 13 («solveSheet solo si se acertó»; en modo hoja hay segunda oportunidad)
    expect(saved(store).attempts.map((a) => [a.q, a.correct, a.submissions])).toEqual([
      ['ph0', true, 2],
    ]);
    expect(saved(store).summary.sheets).toEqual(['ph0']);
  });

  it('fallada: no se añade a sheets, pero el intento queda en el registro', async () => {
    const { store, user } = await setup(`/j/${GAME}/p/p/hoja/1`, openSheets());
    await user.click(screen.getByRole('radio', { name: 'Está bien' }));
    await user.click(submitButton());
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());
    await user.click(nextButton());
    // contract: brief tarea 13, tabla de casos («Hoja fallada → no se añade»)
    expect(saved(store).summary.sheets).toEqual([]);
    expect(saved(store).attempts.map((a) => [a.q, a.context, a.correct])).toEqual([
      ['ph1', 'hoja', false],
    ]);
    expect(screen.getByText('Esta vez no ha salido. Puedes repetirla.')).toBeVisible();
  });
});

describe('Examen', () => {
  const orbitOne = testGame.orbits[1]!;
  /** Siembra con la órbita 0 abierta y aprobado, y los proyectos dados validados (la órbita 1 abierta). */
  const openExam = (validatedProjects: string[], extra: Partial<Summary> = {}) => {
    const { storage, store } = newStore();
    seed(store, {
      launch: true,
      examsPassed: [0],
      firsts: Object.assign({}, ...validatedProjects.map(validated)) as Record<string, number>,
      ...extra,
    });
    return { storage, store };
  };
  /** Contesta las seis preguntas: `wrong(id)` dice si se falla la de ese id (el enunciado lleva el id). */
  const sit = async (user: ReturnType<typeof userEvent.setup>, wrong: (id: string) => boolean) => {
    for (let n = 0; n < 6; n++) {
      const id = /^Enunciado (\w+)$/.exec(
        screen.getByText(/^Enunciado \w+$/).textContent ?? '',
      )![1]!;
      await answer(user, wrong(id) ? '9' : '5');
      await user.click(nextButton());
    }
  };
  const wrongFirst = (count: number) => {
    let left = count;
    return () => left-- > 0;
  };
  const resultRegion = () => screen.getByRole('region', { name: 'Resultado del examen' });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('puertas', () => {
    it('sin proyectos validados dice «Todavía no está abierto», con la órbita 0 abierta y sin escribir', async () => {
      const { storage, store } = newStore();
      seed(store, { launch: true });
      const before = [...storage.data.entries()];
      await setup(`/j/${GAME}/examen/0`, store);
      // contract: brief tarea 13, tabla de casos («Entrar al examen sin proyectos validados → Todavía no está abierto»)
      expect(h1()).toHaveTextContent('Todavía no está abierto');
      expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute(
        'href',
        '/j/test',
      );
      expect([...storage.data.entries()]).toEqual(before);
      // contract: brief 13b (R33): el foco nunca queda en body al cambiar de pantalla
      expect(h1()).toHaveFocus();
    });

    it('con la órbita cerrada (sin despegue) y su proyecto validado, el examen sigue cerrado', async () => {
      const { store } = newStore();
      seed(store, { firsts: validated('p') });
      await setup(`/j/${GAME}/examen/0`, store);
      // contract: brief tarea 13, añadidos (`examOpen` sola da verdadero en una órbita cerrada: se combina con `orbitOpen`)
      expect(h1()).toHaveTextContent('Todavía no está abierto');
    });

    it('el examen de la órbita 1 con sus proyectos validados pero sin examen 0 sigue cerrado', async () => {
      const { store } = newStore();
      seed(store, {
        launch: true,
        firsts: { ...validated('p'), ...validated('r'), ...validated('q') },
      });
      await setup(`/j/${GAME}/examen/1`, store);
      // contract: review-13b RISKS («puertas en pruebas»: la órbita anterior abierta, y el examen de la órbita pedida)
      expect(h1()).toHaveTextContent('Todavía no está abierto');
    });

    it('el examen de la órbita 1 con la órbita abierta y un proyecto sin validar sigue cerrado', async () => {
      const { store } = openExam(['p', 'r']);
      await setup(`/j/${GAME}/examen/1`, store);
      // contract: motor examOpen (todos los proyectos de la órbita validados): Q no lo está aunque la órbita 0 sí
      expect(h1()).toHaveTextContent('Todavía no está abierto');
    });

    it('se abre con la órbita abierta y todos sus proyectos validados (órbitas 0 y 1)', async () => {
      const first = await setup(`/j/${GAME}/examen/0`, openExam(['p'], { examsPassed: [] }).store);
      // contract: renombrado despegue/órbita; motor orbitOpen y examOpen (despegue hecho y proyecto P validado)
      expect(h1()).toHaveTextContent('Examen · Órbita cero');
      first.unmount();
      await setup(`/j/${GAME}/examen/1`, openExam(['p', 'r', 'q']).store);
      // contract: renombrado despegue/órbita; motor orbitOpen (examen 0 aprobado) y examOpen (R y Q validados)
      expect(h1()).toHaveTextContent('Examen · Órbita uno');
    });

    it('una órbita sin proyectos con la anterior aprobada dice «Todavía no está abierto», no deja la página en blanco', async () => {
      const { storage, store } = newStore();
      seed(store, { launch: true, examsPassed: [0] }, EMPTY_GAME);
      const before = [...storage.data.entries()];
      await setup(`/j/${EMPTY_GAME}/examen/1`, store);
      // contract: review-13c b (R38 punto 2: examAvailable exige un proyecto; antes `drawExam` lanzaba y la raíz se desmontaba)
      expect(h1()).toHaveTextContent('Todavía no está abierto');
      expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute(
        'href',
        `/j/${EMPTY_GAME}`,
      );
      expect([...storage.data.entries()]).toEqual(before);
    });

    it('?abierto salta la puerta en desarrollo', async () => {
      await setup(`/j/${GAME}/examen/0?abierto`);
      // contract: renombrado despegue/órbita; brief tarea 13, añadidos («?abierto solo existe en desarrollo»): Vitest corre con DEV verdadero
      expect(h1()).toHaveTextContent('Examen · Órbita cero');
    });

    it.each([
      ['órbita 2', `/j/${GAME}/examen/2`],
      ['órbita no numérica', `/j/${GAME}/examen/abc`],
      ['órbita con cero delante', `/j/${GAME}/examen/01`],
      ['órbita decimal', `/j/${GAME}/examen/1.5`],
      ['órbita negativa', `/j/${GAME}/examen/-1`],
    ])(
      'ruta inexistente (%s): «No existe» con enlace al mapa, sin escribir',
      async (_name, route) => {
        const { storage, store } = newStore();
        await setup(`${route}?abierto`, store);
        // contract: brief tarea 13, regla («órbita inexistente: No existe»); review-13b RISKS (`c` entero dentro del juego)
        expect(h1()).toHaveTextContent('No existe');
        expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute(
          'href',
          '/j/test',
        );
        expect(storage.data.size).toBe(0);
      },
    );
  });

  describe('examen aprobado y suspendido', () => {
    it('5 aciertos de 6: examsPassed contiene la órbita, seis intentos de contexto examen y el XP', async () => {
      const { store } = openExam(['p'], { examsPassed: [] });
      const { user } = await setup(`/j/${GAME}/examen/0`, store);
      expect(h1()).toHaveFocus();
      await sit(user, wrongFirst(1));
      // contract: brief tarea 13, tabla de casos («Examen con 5 aciertos → examsPassed contiene la órbita»)
      expect(saved(store).summary.examsPassed).toEqual([0]);
      expect(saved(store).attempts.map((a) => [a.context, a.submissions])).toEqual(
        Array.from({ length: 6 }, () => ['examen', 1]),
      );
      const result = resultRegion();
      expect(within(result).getByText('Has acertado 5 de 6.')).toBeVisible();
      expect(within(result).getByText('Examen aprobado.')).toBeVisible();
      // contract: reglas, XP 50 por examen aprobado
      expect(within(result).getByText('Ganas 50 XP.')).toBeVisible();
      // contract: reglas, XP = 50 del despegue + 3 ejercicios de 15 + 50 del examen: (50 + 100 + 50) / 150 = 1,33
      expect(document.querySelector('.layout__level')).toHaveTextContent('Nivel 1,33');
      expect(within(result).queryByText('Conviene repasar estos proyectos:')).toBeNull();
      // contract: review-13c m-1 (la barra roja es solo del suspenso: X8 la ponía siempre)
      expect(result).not.toHaveClass('exam__result--failed');
    });

    it('4 aciertos con el examen ya aprobado: dice suspenso, no gana XP y examsPassed no cambia', async () => {
      const { store } = openExam(['p']);
      const { user } = await setup(`/j/${GAME}/examen/0`, store);
      await sit(user, wrongFirst(2));
      const result = resultRegion();
      // contract: review-13c I-1 (el aprobado de este intento sale del motor: examPassed(4) es falso aunque la órbita ya conste)
      expect(within(result).getByText('Has acertado 4 de 6.')).toBeVisible();
      expect(within(result).queryByText('Examen aprobado.')).toBeNull();
      expect(
        within(result).getByText(
          'No has llegado a 5 aciertos. Puedes repetir el examen con otras preguntas.',
        ),
      ).toBeVisible();
      // contract: review-13c I-1 (sin XP: el motor no suma nada por un suspenso) y reglas (50 XP por examen aprobado, una vez)
      expect(within(result).queryByText('Ganas 50 XP.')).toBeNull();
      expect(saved(store).summary.examsPassed).toEqual([0]);
      // contract: review-13c m-1 (el suspenso lleva la barra roja)
      expect(result).toHaveClass('exam__result--failed');
      // contract: reglas, XP = 50 + 100 + 50 sin cambio: (50 + 100 + 50) / 150 = 1,33
      expect(document.querySelector('.layout__level')).toHaveTextContent('Nivel 1,33');
    });

    it('5 aciertos con el examen ya aprobado: aprobado, sin «Ganas 50 XP»', async () => {
      const { store } = openExam(['p']);
      const { user } = await setup(`/j/${GAME}/examen/0`, store);
      await sit(user, wrongFirst(1));
      const result = resultRegion();
      // contract: review-13c I-1 (examPassed(5) es verdadero: se enseña el aprobado, pero el XP lo decide el motor: 0 más)
      expect(within(result).getByText('Examen aprobado.')).toBeVisible();
      expect(within(result).queryByText('Ganas 50 XP.')).toBeNull();
      expect(
        within(result).getByText(
          'Ya tenías este examen aprobado: el aprobado no se pierde ni suma XP otra vez.',
        ),
      ).toBeVisible();
      expect(saved(store).summary.examsPassed).toEqual([0]);
      expect(result).not.toHaveClass('exam__result--failed'); // contract: review-13c m-1
    });

    it('6 de 6 con el examen ya aprobado: no suma XP otra vez y el aprobado no se revoca', async () => {
      const { store } = openExam(['p']);
      const { user } = await setup(`/j/${GAME}/examen/0`, store);
      await sit(user, () => false);
      // contract: spec (un aprobado no se revoca), reglas (50 XP por examen aprobado, una vez)
      expect(saved(store).summary.examsPassed).toEqual([0]);
      expect(within(resultRegion()).queryByText('Ganas 50 XP.')).toBeNull();
      expect(
        within(resultRegion()).getByText(
          'Ya tenías este examen aprobado: el aprobado no se pierde ni suma XP otra vez.',
        ),
      ).toBeVisible();
    });

    it('4 aciertos de 6: no aprueba y nombra los proyectos a repasar, por su nombre y en el orden de la órbita', async () => {
      const { store } = openExam(['p', 'r', 'q'], { examsPassed: [0] });
      const { user } = await setup(`/j/${GAME}/examen/1`, store);
      // se fallan dos de Q (nunca de R): el examen de la órbita 1 saca tres de cada proyecto
      let failedQ = 0;
      await sit(user, (id) => id.startsWith('eq') && failedQ++ < 2);
      // contract: brief tarea 13, tabla de casos («Examen con 4 aciertos → no aprobado; se nombran los proyectos a repasar»)
      expect(saved(store).summary.examsPassed).toEqual([0]);
      const result = resultRegion();
      expect(within(result).getByText('Has acertado 4 de 6.')).toBeVisible();
      expect(within(result).queryByText('Examen aprobado.')).toBeNull();
      expect(within(result).getByText('Conviene repasar estos proyectos:')).toBeVisible();
      expect(
        within(result)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['Proyecto Q']);
      // contract: review-13c m-1 (el suspenso lleva la barra roja: X8 la ponía siempre y no cambiaba nada)
      expect(result).toHaveClass('exam__result--failed');
    });

    it('con fallos en los dos proyectos, los nombra en el orden de la órbita, sin repetir', async () => {
      // una semilla cuyo examen empieza por una pregunta de Q: el orden del examen es Q, R y el de la órbita R, Q
      const qFirst = Array.from({ length: 200 }, (_, n) => 1000 + n).find(
        (sd) => drawExam(orbitOne, sd)[0]!.project === 'q',
      )!;
      vi.spyOn(Date, 'now').mockReturnValue(qFirst);
      const { store } = openExam(['p', 'r', 'q']);
      const { user } = await setup(`/j/${GAME}/examen/1`, store);
      expect(screen.getByText(drawExam(orbitOne, qFirst)[0]!.question.prompt)).toBeInTheDocument();
      await sit(user, () => true);
      // contract: spec («el panel nombra los proyectos que conviene repasar»); projectsToRevise con la órbita ordena por la órbita (R, Q)
      expect(within(resultRegion()).getByText('Has acertado 0 de 6.')).toBeVisible();
      expect(
        within(resultRegion())
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['Proyecto R', 'Proyecto Q']);
    });

    it('la órbita del examen se guarda tal cual (examen de la órbita 1: examsPassed [0, 1])', async () => {
      const { store } = openExam(['p', 'r', 'q']);
      const { user } = await setup(`/j/${GAME}/examen/1`, store);
      await sit(user, () => false);
      // contract: motor handInExam (añade la órbita pedida, no siempre el 0)
      expect(saved(store).summary.examsPassed).toEqual([0, 1]);
      // contract: review-13c I-2 (primer aprobado de la órbita 1 con el 0 ya aprobado: 50 XP; X1 miraba la órbita 0 y decía «Ya tenías»)
      expect(within(resultRegion()).getByText('Ganas 50 XP.')).toBeVisible();
      expect(within(resultRegion()).queryByText(/Ya tenías este examen/)).toBeNull();
    });
  });

  describe('la tanda', () => {
    it('no enseña pistas, explicaciones ni soluciones, ni da segunda oportunidad', async () => {
      const { user } = await setup(`/j/${GAME}/examen/0?abierto`);
      // contract: brief 13c y R28 (en examen: sin pistas, explicaciones, soluciones ni comprobaciones)
      expect(screen.queryByRole('button', { name: 'Dame una pista' })).toBeNull();
      await answer(user, '9');
      expect(screen.getByText('Respuesta registrada')).toBeVisible();
      expect(screen.queryByText(/EXPLICACION/)).toBeNull();
      expect(screen.queryByText(/SOLUCION/)).toBeNull();
      // contract: spec (un solo intento por pregunta): tras fallar una vez, ya se puede pasar a la siguiente
      await user.click(nextButton());
      expect(screen.getByText('2 de 6')).toBeInTheDocument();
    });

    it('salir a mitad no guarda el examen, pero los intentos cerrados quedan en el registro', async () => {
      const { store } = openExam(['p'], { examsPassed: [] });
      const { user, unmount } = await setup(`/j/${GAME}/examen/0`, store);
      for (let n = 0; n < 5; n++) await solve(user);
      unmount();
      // contract: brief tarea 13, regla («Salir a mitad de una tanda no guarda… el examen; los intentos ya cerrados sí quedan»)
      expect(saved(store).summary.examsPassed).toEqual([]);
      expect(saved(store).attempts.map((a) => a.context)).toEqual(Array(5).fill('examen'));
      // contract: el examen no se retoma a medias (se sortea de nuevo); retomar es solo para ejercicios y despegue
      await setup(`/j/${GAME}/examen/0`, store);
      expect(screen.getByText('1 de 6')).toBeInTheDocument();
    });

    it('el foco no cae en body al pasar de pregunta ni al terminar', async () => {
      const { user } = await setup(`/j/${GAME}/examen/0?abierto`);
      await answer(user, '5');
      await user.click(nextButton());
      // contract: brief 13b (R33): el foco nunca queda en body (el botón se desmonta)
      expect(document.activeElement).not.toBe(document.body);
      for (let n = 0; n < 5; n++) await solve(user);
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement).toHaveTextContent('Tanda terminada');
    });

    it('con el almacén avisando, el aviso se ve en la cabecera del examen', async () => {
      const { storage, store } = newStore();
      storage.setItem(`ailearn:v1:local:${GAME}`, '{basura');
      await setup(`/j/${GAME}/examen/0?abierto`, store);
      // contract: brief tarea 13, tabla de casos («Almacén con aviso → el aviso se ve en la cabecera»)
      expect(screen.getByText(WARNINGS.corrupt)).toBeVisible();
    });
  });

  describe('semilla', () => {
    it('el examen se sortea con la semilla del momento y «Repetir» sortea otro con otra semilla entera', async () => {
      const first = drawExam(orbitOne, 1000)[0]!.question.prompt;
      const second = drawExam(orbitOne, 1001)[0]!.question.prompt;
      // sanidad del propio caso: las dos semillas dan una primera pregunta distinta
      expect(second).not.toBe(first);
      // la hora no avanza: «Repetir» no puede reutilizar la semilla
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      const { store } = openExam(['p', 'r', 'q']);
      const { user } = await setup(`/j/${GAME}/examen/1`, store);
      // contract: brief tarea 13, añadidos («drawExam exige semilla entera: Date.now() vale»; examen sorteado con una semilla nueva al entrar)
      expect(screen.getByText(first)).toBeInTheDocument();
      await sit(user, () => false);
      await user.click(screen.getByRole('button', { name: 'Repetir el examen' }));
      // contract: brief tarea 13 («Botón para repetir con otra semilla»): con la hora igual, la semilla siguiente (1001)
      expect(screen.getByText('1 de 6')).toBeInTheDocument();
      expect(screen.getByText(second)).toBeInTheDocument();
      // contract: brief 13b (R33): el foco nunca queda en body (el botón se desmonta)
      expect(h1()).toHaveFocus();
      expect(screen.queryByRole('region', { name: 'Resultado del examen' })).toBeNull();
    });
  });
});

describe('Hoja de estilos de las pantallas de juego', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/ui/theme.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  const ruleFor = (selector: string): string => {
    const escaped = selector.replace(/[.[\]()*+?^$|\\:-]/g, '\\$&');
    const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(css);
    if (!match) throw new Error(`No hay regla para ${selector}`);
    return match[1]!;
  };

  it('el contenedor de la tanda da separación y deja que sus bloques se desplacen solos', async () => {
    // contract: review-12 RISKS (m5: `.runner` sin margen exterior; contenedor con `min-width: 0` a 360 px)
    expect(ruleFor('.play__runner')).toMatch(/min-width:\s*0/);
    expect(ruleFor('.play__runner')).toMatch(/margin-bottom:\s*var\(--space-/);
  });

  it('el resultado suspendido cambia el color de la barra del resultado', async () => {
    // contract: review-13c m-1 (`.exam__result--failed` fija `border-left-color`; sin ella el suspenso llevaría la barra verde)
    expect(ruleFor('.exam__result--failed')).toMatch(/border-left-color:\s*var\(--color-error\)/);
  });
});
