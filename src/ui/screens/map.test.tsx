import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../../App';
import type { BankEntry, Game, NumeroQ, Project, RevisionQ } from '../../content/schema';
import type { Summary } from '../../engine/types';
import { createLocalStore } from '../../storage/local';
import type { Attempt, ProgressStore } from '../../storage/types';
import { GamesContext } from '../GamesContext';
import { StoreContext } from '../useProgress';
import { resetOpenOverride } from './lookup';

// Pruebas del Hub, el mapa, el panel de proyecto y las estadísticas (tarea 14). El juego es de prueba:
// no depende del contenido real. Cada prueba tiene su propio almacén (nunca el singleton del hook).

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
const five = (prefix: string): NumeroQ[] => [1, 2, 3, 4, 5].map((n) => num(`${prefix}${n}`));
const project = (id: string, name: string): Project => ({
  id,
  name,
  sub: `Subtítulo de ${name}`,
  exercises: [
    { kind: 'manipular', questions: five(`${id}a`) },
    { kind: 'calcular', questions: five(`${id}b`) },
    { kind: 'programar', questions: five(`${id}c`) },
  ],
  sheets: [sheet(`${id}h0`), sheet(`${id}h1`), sheet(`${id}h2`)],
});
const bank = (projectId: string): BankEntry[] =>
  [1, 2, 3, 4, 5, 6].map((n) => ({ project: projectId, question: num(`e${projectId}${n}`) }));

const testGame: Game = {
  id: GAME,
  title: 'Juego de prueba',
  launch: [num('pi1'), num('pi2')],
  orbits: [
    { name: 'Órbita cero', projects: [project('p', 'Proyecto P')], examBank: bank('p') },
    {
      name: 'Órbita uno',
      projects: [project('r', 'Proyecto R'), project('q', 'Proyecto Q')],
      examBank: [...bank('r'), ...bank('q')],
    },
  ],
};

/** Un segundo juego, con una órbita 1 sin proyectos (el esquema no lo prohíbe). */
const emptyOrbitGame: Game = {
  ...testGame,
  id: 'vacio',
  title: 'Juego con órbita vacía',
  orbits: [testGame.orbits[0]!, { name: 'Órbita vacía', projects: [], examBank: [] }],
};

// --- Ayudantes ---

const newStore = () => {
  const storage = new MemoryStorage();
  return { storage, store: createLocalStore(storage) };
};

const seed = (
  store: ProgressStore,
  summary: Partial<Summary>,
  attempts: Attempt[] = [],
  game: string = GAME,
) => {
  const doc = store.load(game);
  store.save(game, { ...doc, summary: { ...doc.summary, ...summary }, attempts });
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

const setup = async (route: string, store: ProgressStore = newStore().store) => {
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
  return { user, store };
};

const h1 = () => screen.getByRole('heading', { level: 1 });
const region = (name: string) => screen.getByRole('region', { name });

describe('Mapa del juego', () => {
  it('progreso vacío: Despegue abierto, órbita 0 cerrada con «Completa el despegue», «Nivel 0»', async () => {
    await setup(`/j/${GAME}`);
    // contract: renombrado despegue/órbita; brief tarea 14, tabla de casos («Progreso vacío»)
    expect(h1()).toHaveTextContent('Juego de prueba');
    expect(screen.getByText('Nivel 0')).toBeInTheDocument();
    expect(screen.getByText('0 XP')).toBeInTheDocument();
    const launch = region('Despegue');
    expect(within(launch).getByText('Abierto')).toBeInTheDocument();
    expect(within(launch).getByRole('link', { name: 'Jugar el despegue' })).toHaveAttribute(
      'href',
      '/j/test/despegue',
    );
    const zero = region('Órbita cero');
    expect(within(zero).getByText('Órbita cerrada')).toBeInTheDocument();
    // la órbita y su examen dicen lo mismo (R47: en una órbita cerrada el examen no dice «Valida todos los proyectos»)
    expect(within(zero).getAllByText('Completa el despegue')).toHaveLength(2);
    const zeroExam = within(zero).getByRole('group', { name: 'Examen' });
    expect(within(zeroExam).getByText('Completa el despegue')).toBeInTheDocument();
    expect(within(zero).queryByText('Valida todos los proyectos')).toBeNull();
    // lo cerrado se ve pero no se abre: ni el proyecto ni el examen son enlaces
    expect(within(zero).queryByRole('link')).toBeNull();
    // el proyecto de una órbita cerrada se ve, con su nota, y dice «Cerrado» (no «Abierto»)
    const closedProject = within(zero).getByRole('listitem', { name: 'Proyecto P' });
    expect(within(closedProject).getByText('Cerrado')).toBeInTheDocument();
    expect(within(closedProject).getByText('Nota 0')).toBeInTheDocument();
    // la órbita 1 pide el examen del 0 (y no el despegue)
    const one = region('Órbita uno');
    expect(within(one).getAllByText('Aprueba el examen de la órbita anterior')).toHaveLength(2);
    expect(
      within(within(one).getByRole('group', { name: 'Examen' })).getByText(
        'Aprueba el examen de la órbita anterior',
      ),
    ).toBeInTheDocument();
    expect(within(one).queryByText('Valida todos los proyectos')).toBeNull();
    expect(within(one).queryByRole('link')).toBeNull();
  });

  it('Despegue superado: órbita 0 abierta, su proyecto abierto y el examen cerrado con «Valida todos los proyectos»', async () => {
    const { store } = newStore();
    seed(store, { launch: true });
    await setup(`/j/${GAME}`, store);
    // contract: renombrado despegue/órbita; brief tarea 14, tabla de casos («Despegue superado»)
    expect(within(region('Despegue')).getByText('Superado')).toBeInTheDocument();
    expect(
      within(region('Despegue')).getByRole('link', { name: 'Repetir el despegue' }),
    ).toBeVisible();
    const zero = region('Órbita cero');
    expect(within(zero).getByText('Órbita abierta')).toBeInTheDocument();
    expect(within(zero).queryByText('Completa el despegue')).toBeNull();
    const proyecto = within(zero).getByRole('listitem', { name: 'Proyecto P' });
    expect(within(proyecto).getByText('Abierto')).toBeInTheDocument();
    expect(within(proyecto).getByText('Nota 0')).toBeInTheDocument();
    expect(within(proyecto).getByRole('link', { name: 'Proyecto P' })).toHaveAttribute(
      'href',
      '/j/test/p/p',
    );
    const exam = within(zero).getByRole('group', { name: 'Examen' });
    expect(within(exam).getByText('Cerrado')).toBeInTheDocument();
    expect(within(exam).getByText('Valida todos los proyectos')).toBeInTheDocument();
    expect(within(exam).queryByRole('link')).toBeNull();
  });

  it('con todos los proyectos de la órbita 0 validados el examen está abierto, con enlace', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: validated('p') });
    await setup(`/j/${GAME}`, store);
    // contract: renombrado despegue/órbita; brief tarea 14, tabla de casos («Todos los proyectos de la órbita 0 validados»)
    const zero = region('Órbita cero');
    const proyecto = within(zero).getByRole('listitem', { name: 'Proyecto P' });
    expect(within(proyecto).getByText('Validado')).toBeInTheDocument();
    expect(within(proyecto).getByText('Nota 100')).toBeInTheDocument();
    const exam = within(zero).getByRole('group', { name: 'Examen' });
    expect(within(exam).getByText('Abierto')).toBeInTheDocument();
    expect(within(exam).getByRole('link', { name: 'Hacer el examen' })).toHaveAttribute(
      'href',
      '/j/test/examen/0',
    );
    // la órbita 1 sigue cerrada hasta aprobar el examen
    expect(within(region('Órbita uno')).getByText('Órbita cerrada')).toBeInTheDocument();
  });

  it('órbita 1: el estado sale de la órbita 1, no del 0 (examen 0 aprobado, proyecto R validado, Q no)', async () => {
    const { store } = newStore();
    // la órbita 0 está entera hecha: una puerta o un estado que mirase siempre el 0 diría «abierta»
    seed(store, {
      launch: true,
      firsts: { ...validated('p'), ...validated('r') },
      examsPassed: [0],
    });
    await setup(`/j/${GAME}`, store);
    // contract: renombrado despegue/órbita; brief tarea 14, sesión 6 («prueban c 0 y 1»); motor orbitOpen/examOpen/examAvailable
    const zero = region('Órbita cero');
    const exam0 = within(zero).getByRole('group', { name: 'Examen' });
    expect(within(exam0).getByText('Aprobado')).toBeInTheDocument();
    // un examen aprobado se puede repetir
    expect(within(exam0).getByRole('link', { name: 'Repetir el examen' })).toHaveAttribute(
      'href',
      '/j/test/examen/0',
    );
    const one = region('Órbita uno');
    expect(within(one).getByText('Órbita abierta')).toBeInTheDocument();
    expect(within(one).queryByText('Aprueba el examen de la órbita anterior')).toBeNull();
    expect(
      within(within(one).getByRole('listitem', { name: 'Proyecto R' })).getByText('Validado'),
    ).toBeInTheDocument();
    const q = within(one).getByRole('listitem', { name: 'Proyecto Q' });
    expect(within(q).getByText('Abierto')).toBeInTheDocument();
    expect(within(q).getByRole('link', { name: 'Proyecto Q' })).toHaveAttribute(
      'href',
      '/j/test/p/q',
    );
    const exam1 = within(one).getByRole('group', { name: 'Examen' });
    expect(within(exam1).getByText('Cerrado')).toBeInTheDocument();
    expect(within(exam1).getByText('Valida todos los proyectos')).toBeInTheDocument();
    expect(within(exam1).queryByRole('link')).toBeNull();
  });

  it('órbita 1 con sus dos proyectos validados: examen abierto con la ruta de la órbita 1', async () => {
    const { store } = newStore();
    seed(store, {
      launch: true,
      firsts: { ...validated('p'), ...validated('r'), ...validated('q') },
      examsPassed: [0],
    });
    await setup(`/j/${GAME}`, store);
    // contract: renombrado despegue/órbita; brief tarea 14 («El enlace solo aparece con el examen abierto o aprobado»); ruta /j/:game/examen/:c
    const exam1 = within(within(region('Órbita uno')).getByRole('group', { name: 'Examen' }));
    expect(exam1.getByText('Abierto')).toBeInTheDocument();
    expect(exam1.getByRole('link', { name: 'Hacer el examen' })).toHaveAttribute(
      'href',
      '/j/test/examen/1',
    );
  });

  it('la órbita 1 no se abre con el despegue y los proyectos del 0 validados sin el examen 0', async () => {
    const { store } = newStore();
    // los dos proyectos de la órbita 1 tienen nota 100, pero la órbita sigue cerrada: su examen también
    seed(store, {
      launch: true,
      firsts: { ...validated('p'), ...validated('r'), ...validated('q') },
    });
    await setup(`/j/${GAME}`, store);
    // contract: renombrado despegue/órbita; motor orbitOpen y examAvailable (la órbita 1 pide el examen 0 aprobado; examOpen sola daría abierto)
    const one = region('Órbita uno');
    expect(within(one).getByText('Órbita cerrada')).toBeInTheDocument();
    expect(within(one).queryByRole('link')).toBeNull();
    // los proyectos de la órbita cerrada conservan su nota pero no abren nada
    const r = within(one).getByRole('listitem', { name: 'Proyecto R' });
    expect(within(r).getByText('Nota 100')).toBeInTheDocument();
    expect(within(r).getByText('Cerrado')).toBeInTheDocument();
    const exam = within(one).getByRole('group', { name: 'Examen' });
    expect(within(exam).getByText('Cerrado')).toBeInTheDocument();
    // contract: renombrado despegue/órbita; Ruling R47 (m-3 de review-14): en una órbita cerrada el examen dice lo que falta de la órbita,
    // no «Valida todos los proyectos» (que sería falso: los proyectos están validados)
    expect(within(exam).getByText('Aprueba el examen de la órbita anterior')).toBeInTheDocument();
    expect(within(one).queryByText('Valida todos los proyectos')).toBeNull();
  });

  it('XP 200 enseña «Nivel 1,33»', async () => {
    const { store } = newStore();
    // 50 (despegue) + 50 (examen 0) + 100 (nota del proyecto P validado) = 200
    seed(store, { launch: true, firsts: validated('p'), examsPassed: [0] });
    await setup(`/j/${GAME}`, store);
    // contract: brief tarea 14, tabla de casos («XP 200»)
    expect(screen.getByText('Nivel 1,33')).toBeInTheDocument();
    expect(screen.getByText('200 XP')).toBeInTheDocument();
  });

  it('una órbita abierta sin proyectos no ofrece el examen', async () => {
    const { store } = newStore();
    seed(store, { launch: true, examsPassed: [0] }, [], 'vacio');
    await setup('/j/vacio', store);
    // contract: renombrado despegue/órbita; motor examAvailable (órbita sin proyectos no tiene examen que sortear)
    const empty = region('Órbita vacía');
    expect(within(empty).getByText('Órbita abierta')).toBeInTheDocument();
    const exam = within(empty).getByRole('group', { name: 'Examen' });
    expect(within(exam).getByText('Cerrado')).toBeInTheDocument();
    // contract: renombrado despegue/órbita; review-14 m-2 («Esta órbita aún no tiene proyectos» en el examen de una órbita abierta sin proyectos)
    expect(within(exam).getByText('Esta órbita aún no tiene proyectos')).toBeInTheDocument();
    expect(within(exam).queryByText('Valida todos los proyectos')).toBeNull();
    expect(within(exam).queryByRole('link')).toBeNull();
  });

  it('enlaza a las estadísticas', async () => {
    await setup(`/j/${GAME}`);
    // contract: brief tarea 14 («Enlace desde el mapa»); ruta /j/:game/estadisticas
    expect(screen.getByRole('link', { name: 'Estadísticas' })).toHaveAttribute(
      'href',
      '/j/test/estadisticas',
    );
  });

  it('un juego inexistente dice «No existe»', async () => {
    await setup('/j/nada');
    // contract: convención de la 13b (Gate «missing»)
    expect(h1()).toHaveTextContent('No existe');
  });

  it('al entrar, el foco está en el título', async () => {
    await setup(`/j/${GAME}`);
    // contract: sesión 6 del brief («foco al título al entrar»)
    await waitFor(() => expect(h1()).toHaveFocus());
  });

  it('«Volver al mapa» de una pantalla de la 13 llega al mapa', async () => {
    const { user } = await setup(`/j/${GAME}/examen/0`);
    // contract: sesión 6 del brief («los "Volver" de las pantallas de la 13 llegando al mapa»)
    expect(h1()).toHaveTextContent('Todavía no está abierto');
    await user.click(screen.getByRole('link', { name: 'Volver al mapa' }));
    await waitFor(() => expect(h1()).toHaveTextContent('Juego de prueba'));
  });
});

describe('?abierto en el mapa y el panel', () => {
  afterEach(() => resetOpenOverride());

  it('sin progreso, la órbita 1 se ve abierta con enlaces a sus proyectos y a su examen', async () => {
    await setup(`/j/${GAME}?abierto`);
    // contract: petición de Oliver 2026-10-14 («añadiendo ?abierto en la url, tener acceso a todos los niveles»)
    const one = region('Órbita uno');
    expect(within(one).getByText('Órbita abierta')).toBeInTheDocument();
    expect(within(one).getByRole('link', { name: 'Proyecto R' })).toHaveAttribute(
      'href',
      '/j/test/p/r',
    );
    const exam = within(within(one).getByRole('group', { name: 'Examen' }));
    expect(exam.getByRole('link', { name: 'Hacer el examen' })).toHaveAttribute(
      'href',
      '/j/test/examen/1',
    );
  });

  it('el panel de un proyecto sin validar enlaza sus hojas', async () => {
    await setup(`/j/${GAME}/p/p?abierto`);
    // contract: petición de Oliver 2026-10-14 (todas las hojas accesibles con ?abierto)
    expect(screen.getByRole('link', { name: 'Abrir la hoja 1' })).toBeInTheDocument();
    expect(screen.queryByText('Cerrada: valida el proyecto')).toBeNull();
  });
});

describe('Hub', () => {
  it('una tarjeta por juego registrado con título, nivel y XP, y enlace al mapa', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: validated('p'), examsPassed: [0] });
    await setup('/', store);
    // contract: renombrado despegue/órbita; brief tarea 14 («Hub: una tarjeta por juego registrado con título, nivel y XP»)
    expect(h1()).toHaveTextContent('AIlearn');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    const card = within(screen.getByRole('listitem', { name: 'Juego de prueba' }));
    expect(card.getByRole('link', { name: 'Juego de prueba' })).toHaveAttribute('href', '/j/test');
    expect(card.getByText('Nivel 1,33')).toBeInTheDocument();
    expect(card.getByText('200 XP')).toBeInTheDocument();
    // el otro juego tiene su propio progreso, vacío
    const other = within(screen.getByRole('listitem', { name: 'Juego con órbita vacía' }));
    expect(other.getByText('Nivel 0')).toBeInTheDocument();
    expect(other.getByText('0 XP')).toBeInTheDocument();
    expect(other.getByRole('link', { name: 'Juego con órbita vacía' })).toHaveAttribute(
      'href',
      '/j/vacio',
    );
  });
});

describe('Panel de proyecto', () => {
  it('firsts 5, 4 y sin tercero: nota 60, ejercicios «5 de 5», «4 de 5», «sin hacer» y hojas cerradas', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: { 'p/0': 5, 'p/1': 4 } });
    await setup(`/j/${GAME}/p/p`, store);
    // contract: brief tarea 14, tabla de casos («Panel con firsts 5, 4 y sin tercero»)
    expect(h1()).toHaveTextContent('Proyecto P');
    expect(screen.getByText('Subtítulo de Proyecto P')).toBeInTheDocument();
    expect(screen.getByText(/Nota del proyecto: 60 de 100/)).toBeInTheDocument();
    expect(screen.getByText(/se valida con 80/)).toBeInTheDocument();
    // contract: motor isValidated (nota 60 < 80); review-14 m-1: la etiqueta de la nota dice «Abierto»
    const mark60 = screen.getByText(/Nota del proyecto: 60 de 100/).parentElement!;
    expect(within(mark60).getByText('Abierto')).toBeInTheDocument();
    expect(within(mark60).queryByText('Validado')).toBeNull();
    const exercises = within(screen.getByRole('list', { name: 'Ejercicios' }));
    const items = exercises.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]!).getByText('5 de 5')).toBeInTheDocument();
    expect(within(items[1]!).getByText('4 de 5')).toBeInTheDocument();
    expect(within(items[2]!).getByText('sin hacer')).toBeInTheDocument();
    expect(within(items[2]!).getByRole('link', { name: 'Jugar el ejercicio 3' })).toHaveAttribute(
      'href',
      '/j/test/p/p/ex/2',
    );
    expect(within(items[0]!).getByRole('link', { name: 'Jugar el ejercicio 1' })).toHaveAttribute(
      'href',
      '/j/test/p/p/ex/0',
    );
    const sheets = within(screen.getByRole('list', { name: 'Caza el error' }));
    expect(sheets.getAllByRole('listitem')).toHaveLength(3);
    expect(sheets.getAllByText('Cerrada: valida el proyecto')).toHaveLength(3);
    expect(sheets.queryByRole('link')).toBeNull();
  });

  it('una marca de 0 aciertos se distingue de «sin hacer»', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: { 'p/0': 0 } });
    await setup(`/j/${GAME}/p/p`, store);
    // contract: motor handInExercise guarda 0 (máximo con 0) cuando el ejercicio se jugó y no acertó ninguna a la primera
    const items = within(screen.getByRole('list', { name: 'Ejercicios' })).getAllByRole('listitem');
    expect(within(items[0]!).getByText('0 de 5')).toBeInTheDocument();
    expect(within(items[1]!).getByText('sin hacer')).toBeInTheDocument();
  });

  it('con nota 80 las hojas están abiertas, con enlace, y la resuelta lo dice', async () => {
    const { store } = newStore();
    // (5 + 5 + 2) de 15 = 80
    seed(store, { launch: true, firsts: { 'p/0': 5, 'p/1': 5, 'p/2': 2 }, sheets: ['ph1'] });
    await setup(`/j/${GAME}/p/p`, store);
    // contract: brief tarea 14, tabla de casos («Panel con nota 80»); motor sheetsOpen
    expect(screen.getByText(/Nota del proyecto: 80 de 100/)).toBeInTheDocument();
    // contract: motor isValidated (nota 80 >= 80); review-14 m-1: la etiqueta de la nota dice «Validado»
    const mark80 = screen.getByText(/Nota del proyecto: 80 de 100/).parentElement!;
    expect(within(mark80).getByText('Validado')).toBeInTheDocument();
    expect(within(mark80).queryByText('Abierto')).toBeNull();
    const sheets = within(screen.getByRole('list', { name: 'Caza el error' })).getAllByRole(
      'listitem',
    );
    expect(sheets).toHaveLength(3);
    expect(within(sheets[0]!).getByRole('link', { name: 'Abrir la hoja 1' })).toHaveAttribute(
      'href',
      '/j/test/p/p/hoja/0',
    );
    expect(within(sheets[0]!).queryByText('Resuelta')).toBeNull();
    expect(within(sheets[1]!).getByText('Resuelta')).toBeInTheDocument();
    expect(within(sheets[2]!).getByRole('link', { name: 'Abrir la hoja 3' })).toHaveAttribute(
      'href',
      '/j/test/p/p/hoja/2',
    );
    expect(screen.queryByText('Cerrada: valida el proyecto')).toBeNull();
  });

  it('un proyecto de la órbita 1 con la órbita cerrada dice «Todavía no está abierto»', async () => {
    const { store } = newStore();
    // la órbita 0 está abierta y su proyecto validado, pero falta el examen 0
    seed(store, { launch: true, firsts: validated('p') });
    await setup(`/j/${GAME}/p/r`, store);
    // contract: motor orbitOpen para la órbita del proyecto (no siempre el 0)
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });

  it('un proyecto de la órbita 1 con el examen 0 aprobado se abre, con enlace de vuelta al mapa', async () => {
    const { store } = newStore();
    seed(store, { launch: true, firsts: validated('p'), examsPassed: [0] });
    const { user } = await setup(`/j/${GAME}/p/r`, store);
    // contract: motor orbitOpen (órbita 1 abierta con el examen 0 aprobado)
    expect(h1()).toHaveTextContent('Proyecto R');
    await user.click(screen.getByRole('link', { name: 'Volver' }));
    await waitFor(() => expect(h1()).toHaveTextContent('Juego de prueba'));
  });

  it('un proyecto inexistente dice «No existe»', async () => {
    await setup(`/j/${GAME}/p/nada`);
    // contract: convención de la 13b (Gate «missing»)
    expect(h1()).toHaveTextContent('No existe');
  });

  it('un proyecto de la órbita 0 sin despegue dice «Todavía no está abierto»', async () => {
    await setup(`/j/${GAME}/p/p`);
    // contract: motor orbitOpen (la órbita 0 pide el despegue)
    expect(h1()).toHaveTextContent('Todavía no está abierto');
  });
});

describe('Estadísticas', () => {
  const at = '2026-10-14T10:00:00.000Z';
  const attempt = (
    q: string,
    context: Attempt['context'],
    over: Partial<Attempt> = {},
  ): Attempt => ({ q, at, correct: true, submissions: 1, hinted: false, context, ...over });

  /** 10 intentos, 7 a la primera. Reparto: despegue 2/2, P 4/3, R 3/3, Q 1/1. */
  const ten: Attempt[] = [
    attempt('pi1', 'despegue'),
    attempt('pi2', 'despegue'),
    attempt('pa1', 'proyecto'),
    attempt('pa2', 'proyecto'),
    attempt('pa3', 'proyecto', { correct: false, submissions: 2 }),
    attempt('ph0', 'hoja', { submissions: 2 }), // acertada a la segunda: no es a la primera
    attempt('ra1', 'proyecto', { hinted: true }), // acertada con pista: tampoco
    attempt('er1', 'examen'),
    attempt('er2', 'examen'),
    attempt('eq1', 'examen'),
  ];

  it('10 intentos, 7 a la primera: «10» y «70 %»', async () => {
    const { store } = newStore();
    seed(store, { launch: true }, ten);
    await setup(`/j/${GAME}/estadisticas`, store);
    // contract: brief tarea 14, tabla de casos («Estadísticas con 10 intentos, 7 a la primera»)
    expect(h1()).toHaveTextContent('Estadísticas');
    expect(screen.getByText('Preguntas respondidas')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Preguntas respondidas' })).toHaveTextContent('10');
    expect(screen.getByRole('group', { name: 'Acierto a la primera' })).toHaveTextContent('70 %');
    expect(screen.queryByText('Aún no hay datos')).toBeNull();
  });

  it('la tabla tiene una fila «Despegue» y una por proyecto en el orden de las órbitas, con intentos y aciertos', async () => {
    const { store } = newStore();
    seed(store, { launch: true }, ten);
    await setup(`/j/${GAME}/estadisticas`, store);
    // contract: renombrado despegue/órbita; sesión 6 del brief (R39): cada intento va a su fila por su `q` (los de examen, por el banco)
    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0]!.textContent);
    expect(names).toEqual(['Despegue', 'Proyecto P', 'Proyecto R', 'Proyecto Q']);
    const cells = (name: string) =>
      within(screen.getByRole('row', { name: new RegExp(`^${name}`) }))
        .getAllByRole('cell')
        .map((c) => c.textContent);
    expect(cells('Despegue')).toEqual(['Despegue', '2', '2']);
    expect(cells('Proyecto P')).toEqual(['Proyecto P', '4', '3']);
    expect(cells('Proyecto R')).toEqual(['Proyecto R', '3', '3']);
    expect(cells('Proyecto Q')).toEqual(['Proyecto Q', '1', '1']);
  });

  it('un intento cuyo id ya no está en el contenido cuenta en los totales y no sale en la tabla', async () => {
    const { store } = newStore();
    seed(store, { launch: true }, [
      ...ten,
      attempt('borrada', 'proyecto'),
      // un id de proyecto con contexto de examen no está en el banco: tampoco va a la fila de P
      attempt('pa1', 'examen'),
    ]);
    await setup(`/j/${GAME}/estadisticas`, store);
    // contract: sesión 6 del brief (R39): totales con todos los intentos, 9 a la primera de 12 = 75 %
    expect(screen.getByRole('group', { name: 'Preguntas respondidas' })).toHaveTextContent('12');
    expect(screen.getByRole('group', { name: 'Acierto a la primera' })).toHaveTextContent('75 %');
    // ninguna fila cambia: ni la de P ni, por ejemplo, la del despegue
    const table = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) =>
        within(r)
          .getAllByRole('cell')
          .map((c) => c.textContent),
      );
    expect(table).toEqual([
      ['Despegue', '2', '2'],
      ['Proyecto P', '4', '3'],
      ['Proyecto R', '3', '3'],
      ['Proyecto Q', '1', '1'],
    ]);
  });

  it.each([
    // [a la primera, de tres intentos, texto]: 2/3 = 66,67 (floor daría 66) y 1/3 = 33,33 (ceil daría 34)
    [2, '67 %'],
    [1, '33 %'],
  ])(
    '%i de 3 a la primera: el porcentaje se redondea al entero más cercano, «%s»',
    async (firsts, text) => {
      const { store } = newStore();
      seed(
        store,
        { launch: true },
        [0, 1, 2].map((i) =>
          attempt(`pi${(i % 2) + 1}`, 'despegue', i < firsts ? {} : { correct: false }),
        ),
      );
      await setup(`/j/${GAME}/estadisticas`, store);
      // contract: brief tarea 14, sesión 6 (R39: el porcentaje se redondea a entero); review-14 I-1
      expect(screen.getByRole('group', { name: 'Preguntas respondidas' })).toHaveTextContent('3');
      expect(screen.getByRole('group', { name: 'Acierto a la primera' })).toHaveTextContent(text);
    },
  );

  it('sin intentos: «Aún no hay datos», sin tabla ni división por cero', async () => {
    await setup(`/j/${GAME}/estadisticas`);
    // contract: brief tarea 14, tabla de casos («Estadísticas sin intentos»)
    expect(screen.getByText('Aún no hay datos')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('un juego inexistente dice «No existe»', async () => {
    await setup('/j/nada/estadisticas');
    // contract: convención de la 13b (Gate «missing»)
    expect(h1()).toHaveTextContent('No existe');
  });

  it('el «Volver» llega al mapa', async () => {
    const { user } = await setup(`/j/${GAME}/estadisticas`);
    // contract: brief tarea 14 («Enlace desde el mapa»)
    await user.click(screen.getByRole('link', { name: 'Volver' }));
    await waitFor(() => expect(h1()).toHaveTextContent('Juego de prueba'));
  });
});
