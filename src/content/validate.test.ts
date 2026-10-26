import { describe, expect, it } from 'vitest';
import { generators } from './generators';
import type {
  Orbit,
  CodigoQ,
  Game,
  GeneradaQ,
  ManipularQ,
  NumeroQ,
  OpcionQ,
  Project,
  VectorQ,
} from './schema';
import { gameSchema } from './schema';
import {
  checkExamBank,
  checkIds,
  checkProject,
  checkReachable,
  checkStartNotSolved,
  codeQuestions,
  gameProblems,
} from './validate';

const base = (id: string) => ({
  id,
  prompt: `Enunciado ${id}`,
  hints: [],
  explain: 'e',
  solution: 's',
});

const numero = (id: string, answer = 1): NumeroQ => ({
  ...base(id),
  type: 'numero',
  answer,
  tol: 0,
});

const codigo = (id: string): CodigoQ => ({
  ...base(id),
  type: 'codigo',
  requirements: ['r'],
  starter: 'v = None',
  checks: 'check(v == 1, "v vale 1")',
  reference: 'v = 1',
});

type Mover = { id: string; x: number; y: number; movable: boolean };

const manipular = (
  id: string,
  vectors: Mover[],
  goals: ManipularQ['goals'],
  range = 6,
  snap = 1,
): ManipularQ => ({
  ...base(id),
  type: 'manipular',
  plane: {
    range,
    snap,
    vectors: vectors.map((v) => ({ ...v, label: v.id })),
    readouts: ['components'],
  },
  goals,
});

const u = (x = 1, y = 1): Mover => ({ id: 'u', x, y, movable: true });

const generada = (id: string, generator: string): GeneradaQ => ({
  type: 'generada',
  id,
  generator,
  params: {},
});

const project = (id: string, manip: ManipularQ[] = []): Project => ({
  id,
  name: `Proyecto ${id}`,
  sub: '',
  exercises: [
    {
      kind: 'manipular',
      questions: Array.from({ length: 5 }, (_, i) =>
        manip[i]
          ? { ...manip[i], id: `${id}-m${i}` }
          : manipular(`${id}-m${i}`, [u()], [{ metric: 'x', of: ['u'], target: 3, tol: 0.1 }]),
      ),
    },
    { kind: 'calcular', questions: Array.from({ length: 5 }, (_, i) => numero(`${id}-c${i}`)) },
    { kind: 'programar', questions: Array.from({ length: 5 }, (_, i) => codigo(`${id}-p${i}`)) },
  ],
  sheets: Array.from({ length: 3 }, (_, i) => ({
    ...base(`${id}-h${i}`),
    type: 'revision' as const,
    format: 'texto' as const,
    lines: ['a', 'b'],
    faultyLine: null,
  })),
});

const GENERATORS = ['desplazamiento', 'suma', 'centroide', 'distancia'];

/** Cuatro entradas generadas por proyecto: el reparto 2+2+2 da exámenes distintos con las semillas 1, 2 y 3. */
const goodOrbit = (): Orbit => ({
  name: 'Órbita de prueba',
  projects: ['a', 'b', 'c'].map((id) => project(id)),
  examBank: ['a', 'b', 'c'].flatMap((p) =>
    GENERATORS.map((g) => ({ project: p, question: generada(`${p}-${g}`, g) })),
  ),
});

const goodGame = (): Game => ({
  id: 'prueba',
  title: 'Juego de prueba',
  launch: [numero('pis-1'), codigo('pis-2')],
  orbits: [goodOrbit()],
});

describe('el juego de prueba', () => {
  it('cumple el esquema', () => {
    expect(gameSchema.safeParse(goodGame()).success).toBe(true); // contract: el juego de prueba es válido por construcción
  });

  it('no da problemas con ninguna función', () => {
    const game = goodGame();
    const orbit = game.orbits[0]!;
    const manip = orbit.projects[0]!.exercises[0]!.questions as ManipularQ[];
    // contract: tarea 8, tabla de casos, fila «Juego de prueba correcto»
    expect(checkIds(game)).toEqual([]);
    expect(manip.flatMap((q) => checkReachable(q))).toEqual([]);
    expect(manip.flatMap((q) => checkStartNotSolved(q))).toEqual([]);
    expect(checkExamBank(orbit)).toEqual([]);
    expect(orbit.projects.flatMap((p) => checkProject(p))).toEqual([]);
  });
});

describe('checkIds', () => {
  it('nombra el id repetido entre dos preguntas', () => {
    const game = goodGame();
    game.launch = [numero('repetida'), numero('repetida')];
    const problems = checkIds(game);
    // contract: tarea 8, tabla de casos, fila 1: un problema que nombra el id
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('repetida');
  });

  it('vigila el id de una pregunta de despegue que coincide con una de proyecto', () => {
    const game = goodGame();
    game.launch = [numero('a-c0')];
    // contract: brief, añadido de la sesión principal: checkIds cubre despegue y proyectos
    expect(checkIds(game).join('\n')).toContain('a-c0');
  });

  it('vigila el id de una pregunta de despegue que coincide con una hoja de proyecto', () => {
    const game = goodGame();
    game.launch = [numero('a-h0')];
    // contract: brief, añadido de la sesión principal: checkIds cubre despegue y proyectos (hojas incluidas)
    expect(checkIds(game).join('\n')).toContain('a-h0');
  });

  it('vigila el id de una entrada del banco que coincide con una pregunta de proyecto', () => {
    const game = goodGame();
    game.orbits[0]!.examBank.push({ project: 'a', question: generada('a-c0', 'suma') });
    // contract: brief, añadido de la sesión principal: checkIds cubre el banco de examen
    expect(checkIds(game).join('\n')).toContain('a-c0');
  });

  it('vigila ids repetidos dentro del banco y entre órbitas', () => {
    const game = goodGame();
    game.orbits[0]!.examBank.push({ project: 'a', question: generada('a-suma', 'suma') });
    // contract: brief, añadido de la sesión principal: checkIds cubre el banco de examen
    expect(checkIds(game).join('\n')).toContain('a-suma');

    const other = goodGame();
    other.orbits.push({ ...goodOrbit(), projects: [project('d')], examBank: [] });
    other.orbits[1]!.projects[0]!.exercises[1]!.questions[0] = numero('a-c1');
    // contract: tarea 8, brief: ids únicos en todo el juego, también entre órbitas
    expect(checkIds(other).join('\n')).toContain('a-c1');
  });
});

describe('checkReachable con metas de tres vectores (juego 2)', () => {
  const imgGoals = (x: number, y: number): ManipularQ['goals'] => [
    { metric: 'img_x', of: ['i', 'j', 'v'], target: x, tol: 0.01 },
    { metric: 'img_y', of: ['i', 'j', 'v'], target: y, tol: 0.01 },
  ];

  it('i y j fijas y v móvil: encuentra v con A·v = (6, 2)', () => {
    const vs: Mover[] = [
      { id: 'i', x: 2, y: 0, movable: false },
      { id: 'j', x: 1, y: 1, movable: false },
      { id: 'v', x: 1, y: 1, movable: true },
    ];
    // contract: A = columnas (2,0) y (1,1); v = (2,2) da 2·(2,0) + 2·(1,1) = (6,2)
    expect(checkReachable(manipular('q', vs, imgGoals(6, 2)))).toEqual([]);
    // contract: img_y = 2 obliga a v.y = 2 y img_x = 5 a v.x = 1,5, que no está en la rejilla de snap 1
    expect(checkReachable(manipular('q', vs, imgGoals(5, 2)))).toHaveLength(1);
  });

  it('i y j móviles y v fija: encuentra la matriz con A·(1, 2) = (3, 4)', () => {
    const vs: Mover[] = [
      { id: 'i', x: 1, y: 0, movable: true },
      { id: 'j', x: 0, y: 1, movable: true },
      { id: 'v', x: 1, y: 2, movable: false },
    ];
    // contract: v = (1,2) -> A·v = i + 2j; i = (1,0) y j = (1,2) dan (3,4)
    expect(checkReachable(manipular('q', vs, imgGoals(3, 4)))).toEqual([]);
    // contract: con v = (1,2) fija, i + 2j tiene componentes ≤ 6 + 12 = 18, pero (19,0) no se alcanza
    expect(checkReachable(manipular('q', vs, imgGoals(19, 0)))).toHaveLength(1);
    // contract: la posición inicial i = (1,0), j = (0,1) da A·v = (1,2), no (3,4)
    expect(checkStartNotSolved(manipular('q', vs, imgGoals(3, 4)))).toEqual([]);
    // contract: y sí la detecta si la meta ya se cumple al inicio
    expect(checkStartNotSolved(manipular('q', vs, imgGoals(1, 2)))).toHaveLength(1);
  });

  it('det con dos columnas móviles: det = -1 es alcanzable', () => {
    const vs: Mover[] = [
      { id: 'i', x: 1, y: 0, movable: true },
      { id: 'j', x: 0, y: 1, movable: true },
    ];
    const goals: ManipularQ['goals'] = [{ metric: 'det', of: ['i', 'j'], target: -1, tol: 0.01 }];
    // contract: columnas (0,1) y (1,0) tienen det 0·0 − 1·1 = −1
    expect(checkReachable(manipular('q', vs, goals))).toEqual([]);
  });
});

describe('checkReachable con img_angle (Órbita 2)', () => {
  it('A fija (2 1; 1 2) y v móvil desde (1, 0): v = (1, 1) es alcanzable y no está resuelta al inicio', () => {
    const vs: Mover[] = [
      { id: 'i', x: 2, y: 1, movable: false },
      { id: 'j', x: 1, y: 2, movable: false },
      { id: 'v', x: 1, y: 0, movable: true },
    ];
    const goals: ManipularQ['goals'] = [
      { metric: 'img_angle', of: ['i', 'j', 'v'], target: 0, tol: 0.5 },
      { metric: 'x', of: ['v'], target: 1, tol: 0.01 },
    ];
    // contract: brief de la tarea 1 de la Órbita 2: v = (1,1) es autovector (A·v = (3,3)) y está en la rejilla de snap 1
    expect(checkReachable(manipular('q', vs, goals))).toEqual([]);
    // contract: brief de la tarea 1 de la Órbita 2: desde v = (1,0) el ángulo con A·v = (2,1) es 26,6°, no 0
    expect(checkStartNotSolved(manipular('q', vs, goals))).toEqual([]);
  });
});

describe('checkReachable', () => {
  const at = (x: number) => [{ metric: 'x' as const, of: ['u'], target: x, tol: 0.1 }];

  it('rechaza una meta fuera de la rejilla (x = 3,5 con snap 1)', () => {
    const problems = checkReachable(manipular('q', [u()], at(3.5), 6, 1));
    // contract: tarea 8, tabla de casos, fila 2: no alcanzable
    expect(problems).toHaveLength(1);
  });

  it('acepta norm = 5 con tol 0,01, range 6 y snap 1', () => {
    const q = manipular('q', [u()], [{ metric: 'norm', of: ['u'], target: 5, tol: 0.01 }], 6, 1);
    // contract: tarea 8, tabla de casos, fila 3: alcanzable
    expect(checkReachable(q)).toEqual([]);
  });

  it('acepta norm = 1 y x = 0,6 con snap 0,2 y range 2', () => {
    const q = manipular(
      'q',
      [u()],
      [
        { metric: 'norm', of: ['u'], target: 1, tol: 0.01 },
        { metric: 'x', of: ['u'], target: 0.6, tol: 0.01 },
      ],
      2,
      0.2,
    );
    // contract: tarea 8, tabla de casos, fila 4: alcanzable (0,6; 0,8)
    expect(checkReachable(q)).toEqual([]);
  });

  it('rechaza una meta fuera del rango aunque esté en la rejilla', () => {
    // contract: la rejilla llega a ±range: x = 7 con range 6 no se alcanza
    expect(checkReachable(manipular('q', [u()], at(7), 6, 1))).toHaveLength(1);
    // contract: el borde del rango sí se alcanza
    expect(checkReachable(manipular('q', [u()], at(6), 6, 1))).toEqual([]);
  });

  it('recorre también las coordenadas negativas', () => {
    // contract: la rejilla va de -range a range: x = -6 se alcanza, x = -7 no
    expect(checkReachable(manipular('q', [u()], at(-6), 6, 1))).toEqual([]);
    expect(checkReachable(manipular('q', [u()], at(-7), 6, 1))).toHaveLength(1);
    const q = manipular('q', [u()], [{ metric: 'y', of: ['u'], target: -4, tol: 0.01 }]);
    // contract: la coordenada y también llega a valores negativos
    expect(checkReachable(q)).toEqual([]);
  });

  it('combina dos vectores móviles', () => {
    const q = manipular(
      'q',
      [u(), { id: 'w', x: 0, y: 0, movable: true }],
      [{ metric: 'sum_x', of: ['u', 'w'], target: 8, tol: 0.01 }],
      6,
      1,
    );
    // contract: tarea 8, regla: busca colocaciones de hasta dos móviles (u.x + w.x = 8 con 4 + 4)
    expect(checkReachable(q)).toEqual([]);
  });

  it('usa los vectores fijos como están', () => {
    const fixed: Mover = { id: 'v', x: 2, y: 0, movable: false };
    const goal = [{ metric: 'distance' as const, of: ['u', 'v'], target: 0, tol: 0.01 }];
    // contract: tarea 8, regla: la meta se cumple con u sobre el fijo v (2, 0)
    expect(checkReachable(manipular('q', [u(), fixed], goal))).toEqual([]);
  });

  it('con tres vectores móviles devuelve «demasiados vectores móviles»', () => {
    const three = [
      u(),
      { id: 'w', x: 0, y: 0, movable: true },
      { id: 'z', x: 1, y: 0, movable: true },
    ];
    const problems = checkReachable(manipular('q', three, at(3)));
    // contract: tarea 8, tabla de casos, fila 6
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('demasiados vectores móviles');
  });

  it('avisa si la rejilla es demasiado grande para comprobarla', () => {
    const two = [u(), { id: 'w', x: 0, y: 0, movable: true }];
    const q = manipular(
      'q',
      two,
      [{ metric: 'sum_x', of: ['u', 'w'], target: 1, tol: 0 }],
      100,
      0.1,
    );
    // contract: decisión de implementación: con dos móviles y rejilla enorme no se recorre, se avisa
    expect(checkReachable(q).join('\n')).toContain('demasiado grande');
  });

  it('sin vectores móviles, la meta se cumple solo si ya se cumple', () => {
    const fixed: Mover = { id: 'v', x: 2, y: 0, movable: false };
    const goal = (target: number) => [{ metric: 'x' as const, of: ['v'], target, tol: 0.01 }];
    // contract: sin móviles solo hay una colocación posible, la inicial
    expect(checkReachable(manipular('q', [fixed], goal(2)))).toEqual([]);
    expect(checkReachable(manipular('q', [fixed], goal(3)))).toHaveLength(1);
  });
});

describe('checkStartNotSolved', () => {
  it('da un problema si el vector móvil empieza ya en la meta', () => {
    const q = manipular('q', [u(3, 1)], [{ metric: 'x', of: ['u'], target: 3, tol: 0.1 }]);
    // contract: tarea 8, tabla de casos, fila 5: un problema
    expect(checkStartNotSolved(q)).toHaveLength(1);
  });

  it('no da problemas si falta alguna meta por cumplir', () => {
    const q = manipular(
      'q',
      [u(3, 1)],
      [
        { metric: 'x', of: ['u'], target: 3, tol: 0.1 },
        { metric: 'y', of: ['u'], target: 4, tol: 0.1 },
      ],
    );
    // contract: la posición inicial solo está resuelta si cumple todas las metas
    expect(checkStartNotSolved(q)).toEqual([]);
  });
});

describe('checkExamBank', () => {
  it('da un problema con 2 entradas fijas por proyecto y ninguna generada', () => {
    const orbit = goodOrbit();
    orbit.examBank = ['a', 'b', 'c'].flatMap((p) => [
      { project: p, question: numero(`${p}-x1`, 1) },
      { project: p, question: numero(`${p}-x2`, 2) },
    ]);
    const problems = checkExamBank(orbit);
    // contract: tarea 8, tabla de casos, fila 7: no hay tres exámenes distintos
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('distintos');
  });

  it('da un problema si un proyecto no tiene entradas suficientes', () => {
    const orbit = goodOrbit();
    orbit.examBank = orbit.examBank.filter((e) => e.project !== 'c');
    // contract: tarea 7, RISKS: drawExam lanza si el banco no cubre la cuota; no debe escapar
    expect(checkExamBank(orbit)).toHaveLength(1);
  });

  it('da un problema si la órbita no tiene proyectos', () => {
    // contract: tarea 7, drawExam lanza con una órbita sin proyectos; checkExamBank lo devuelve como problema
    expect(checkExamBank({ name: 'vacío', projects: [], examBank: [] })).toHaveLength(1);
  });
});

describe('checkProject', () => {
  it('no da problemas con un proyecto correcto', () => {
    expect(checkProject(project('a'))).toEqual([]); // contract: tarea 8, «esquema + las anteriores»
  });

  it('devuelve los problemas del esquema', () => {
    const broken = { ...project('a'), sheets: [] };
    // contract: tarea 8, «esquema + las anteriores»: un proyecto sin hojas no cumple el esquema
    expect(checkProject(broken)).not.toEqual([]);
  });

  it('devuelve los de alcanzabilidad y de posición inicial', () => {
    const unreachable = manipular('q1', [u()], [{ metric: 'x', of: ['u'], target: 3.5, tol: 0.1 }]);
    const solved = manipular('q2', [u(3, 1)], [{ metric: 'x', of: ['u'], target: 3, tol: 0.1 }]);
    const problems = checkProject(project('a', [unreachable, solved]));
    // contract: tarea 8, «esquema + las anteriores»: un problema por pregunta, con su id
    expect(problems).toHaveLength(2);
    expect(problems.join('\n')).toContain('a-m0');
    expect(problems.join('\n')).toContain('a-m1');
  });
});

describe('codeQuestions', () => {
  it('reúne las de despegue, proyectos y banco de examen', () => {
    const game = goodGame();
    game.orbits[0]!.examBank.push({ project: 'a', question: codigo('banco-codigo') });
    const ids = codeQuestions(game).map((q) => q.id);
    // contract: tarea 8, «todas, incluidas las de despegue y bancos»
    expect(ids).toContain('pis-2');
    expect(ids).toContain('banco-codigo');
    expect(ids.filter((id) => id.endsWith('-p0'))).toEqual(['a-p0', 'b-p0', 'c-p0']);
    expect(ids).toHaveLength(1 + 3 * 5 + 1);
  });
});

describe('gameProblems', () => {
  const opcion = (id: string, options: string[], correct = 0): OpcionQ => ({
    ...base(id),
    type: 'opcion',
    options,
    correct,
  });
  const vector = (id: string, answer: number[], tol: number): VectorQ => ({
    ...base(id),
    type: 'vector',
    answer,
    tol,
  });
  const unreachable = (id: string) =>
    manipular(id, [u()], [{ metric: 'x', of: ['u'], target: 3.5, tol: 0.1 }]);
  const alreadySolved = (id: string) =>
    manipular(id, [u(3, 1)], [{ metric: 'x', of: ['u'], target: 3, tol: 0.1 }]);
  const bankWith = (game: Game, question: Orbit['examBank'][number]['question']): Game => {
    game.orbits[0]!.examBank.push({ project: 'a', question });
    return game;
  };
  const pisWith = (...questions: Game['launch']): Game => {
    const game = goodGame();
    game.launch = questions;
    return game;
  };

  it('no da problemas con el juego de prueba', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 1: un juego correcto no da problemas
    expect(gameProblems(goodGame())).toEqual([]);
  });

  it('devuelve los problemas del esquema', () => {
    const game = goodGame();
    game.orbits[0]!.projects[0]!.sheets = [];
    // contract: tarea 8, ronda de arreglo 1, punto 1: clase «esquema»
    expect(gameProblems(game)).not.toEqual([]);
  });

  it('devuelve los ids repetidos', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 1: clase «ids»
    expect(gameProblems(pisWith(numero('rep'), numero('rep'))).join('\n')).toContain('rep');
  });

  it('detecta una manipular inalcanzable en un ejercicio de proyecto y en el despegue', () => {
    const game = goodGame();
    game.orbits[0]!.projects[0]!.exercises[0]!.questions[0] = unreachable('proy-mal');
    game.launch = [unreachable('pis-mal')];
    const text = gameProblems(game).join('\n');
    // contract: tarea 8, ronda de arreglo 1, punto 1: clase «alcanzabilidad»
    expect(text).toContain('proy-mal');
    expect(text).toContain('pis-mal');
  });

  it('detecta una manipular que empieza resuelta', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 1: clase «posición inicial»
    expect(gameProblems(pisWith(alreadySolved('ya-resuelta'))).join('\n')).toContain('ya-resuelta');
  });

  it('detecta una manipular inalcanzable (x = 3,5, snap 1) en el banco de examen', () => {
    const problems = gameProblems(bankWith(goodGame(), unreachable('banco-mal')));
    // contract: tarea 8, ronda de arreglo 1, punto 2: reproducción del revisor, inalcanzable en examBank
    expect(problems.join('\n')).toContain('banco-mal');
    expect(problems.join('\n')).toContain('ninguna colocación');
  });

  it('detecta una manipular que empieza resuelta en el banco de examen', () => {
    const problems = gameProblems(bankWith(goodGame(), alreadySolved('banco-resuelta')));
    // contract: tarea 8, ronda de arreglo 1, punto 2: reproducción del revisor, empieza resuelta en examBank
    expect(problems.join('\n')).toContain('banco-resuelta');
    expect(problems.join('\n')).toContain('posición inicial');
  });

  it('detecta un banco que no da tres exámenes distintos', () => {
    const game = goodGame();
    game.orbits[0]!.examBank = ['a', 'b', 'c'].flatMap((p) => [
      { project: p, question: numero(`${p}-x1`, 1) },
      { project: p, question: numero(`${p}-x2`, 2) },
    ]);
    // contract: tarea 8, ronda de arreglo 1, punto 1: clase «banco de examen»
    expect(gameProblems(game).join('\n')).toContain('distintos');
  });

  it('detecta un generador que no existe y uno que falla al resolverse', () => {
    const missing = gameProblems(bankWith(goodGame(), generada('g-fantasma', 'fantasma')));
    // contract: tarea 8, ronda de arreglo 1, punto 1: clase «generadores existentes»
    expect(missing.join('\n')).toContain('fantasma');
    const failing = bankWith(goodGame(), {
      ...generada('g-norma4', 'norma'),
      params: { dim: 4 },
    });
    // contract: tarea 8, ronda de arreglo 1, punto 1: un generador que lanza con sus params es un problema
    expect(gameProblems(failing).join('\n')).toContain('g-norma4');
  });

  describe('respuesta declarada tecleada con dos decimales (ruling R18)', () => {
    it('numero con √5 y tol 0 da problema; con tol 0,01 no', () => {
      const bad = gameProblems(pisWith({ ...numero('raiz5'), answer: Math.sqrt(5) }));
      // contract: tarea 8, ronda de arreglo 1, punto 3: √5 se teclea 2,24 y con tol 0 no se acepta
      expect(bad.join('\n')).toContain('raiz5');
      expect(bad.join('\n')).toContain('sube la tolerancia o redondea la respuesta');
      const good = pisWith({ ...numero('raiz5'), answer: Math.sqrt(5), tol: 0.01 });
      // contract: tarea 8, ronda de arreglo 1, punto 3: con tol 0,01 el 2,24 tecleado se acepta
      expect(gameProblems(good)).toEqual([]);
    });

    it('numero con tol 0,004 da problema y con 0,005 no (límite de los dos decimales)', () => {
      const answer = 0.004; // se teclea 0 y queda a 0,004 de la respuesta
      // contract: tarea 8, ronda de arreglo 1, punto 3: «una respuesta con más de dos decimales necesita tol ≥ 0,005»
      expect(gameProblems(pisWith({ ...numero('x'), answer, tol: 0.003 }))).not.toEqual([]);
      expect(gameProblems(pisWith({ ...numero('x'), answer, tol: 0.005 }))).toEqual([]);
    });

    it('vector con una componente 1/3 y tol 0,001 da problema; con tol 0,01 no', () => {
      const bad = gameProblems(pisWith(vector('v13', [1, 1 / 3], 0.001)));
      // contract: tarea 8, ronda de arreglo 1, punto 3: 1/3 se teclea 0,33 y queda a 0,0033 > 0,001
      expect(bad.join('\n')).toContain('v13');
      // contract: tarea 8, ronda de arreglo 1, punto 3: con tol 0,01 el 0,33 se acepta
      expect(gameProblems(pisWith(vector('v13', [1, 1 / 3], 0.01)))).toEqual([]);
    });

    it('lo aplica también a una pregunta del banco de examen', () => {
      const bank = bankWith(goodGame(), { ...numero('banco-raiz'), answer: Math.sqrt(5) });
      // contract: tarea 8, ronda de arreglo 1, punto 3: las preguntas del banco se vigilan como las demás
      expect(gameProblems(bank).join('\n')).toContain('banco-raiz');
    });

    it('lo aplica a las preguntas que salen de un generador', () => {
      generators['malo'] = {
        id: 'malo',
        bounds: { min: 0, max: 10 },
        make: (id) => ({ ...numero(id), answer: Math.sqrt(5), tol: 0 }),
      };
      try {
        const problems = gameProblems(bankWith(goodGame(), generada('g-malo', 'malo')));
        // contract: tarea 8, ronda de arreglo 1, punto 3: la respuesta de una generada se corrige tecleada
        expect(problems.join('\n')).toContain('g-malo');
      } finally {
        delete generators['malo'];
      }
    });

    it('opcion: la correcta existe y se acepta; fuera de rango da problema', () => {
      // contract: renombrado despegue/órbita; tarea 8, ronda de arreglo 1, punto 3: la opción marcada como correcta existe
      expect(gameProblems(pisWith(opcion('opc-ok', ['sí', 'no'], 1)))).toEqual([]);
      expect(gameProblems(pisWith(opcion('opc-mala', ['sí', 'no'], 2))).join('\n')).toContain(
        'launch.0.correct',
      );
    });
  });

  describe('opciones distintas', () => {
    it("'3' y ' 3' (y también '3' y '3') dan problema", () => {
      // contract: tarea 8, ronda de arreglo 1, punto 5: opciones casi iguales, comparación tras trim()
      expect(gameProblems(pisWith(opcion('casi', ['3', ' 3', '4']))).join('\n')).toContain('casi');
      expect(gameProblems(pisWith(opcion('igual', ['3', '3', '4']))).join('\n')).toContain('igual');
    });

    it('opciones distintas no dan problema', () => {
      // contract: tarea 8, ronda de arreglo 1, punto 5: sin falsos positivos
      expect(gameProblems(pisWith(opcion('bien', ['3', '4', '5'])))).toEqual([]);
    });

    it('vigila también las del banco de examen', () => {
      const bank = bankWith(goodGame(), opcion('banco-op', ['x', ' x']));
      // contract: tarea 8, ronda de arreglo 1, punto 5: las preguntas del banco se vigilan como las demás
      expect(gameProblems(bank).join('\n')).toContain('banco-op');
    });
  });
});

describe('checkExamBank: mensaje', () => {
  it('dice qué hacer', () => {
    const orbit = goodOrbit();
    orbit.examBank = ['a', 'b', 'c'].flatMap((p) => [
      { project: p, question: numero(`${p}-x1`, 1) },
      { project: p, question: numero(`${p}-x2`, 2) },
    ]);
    // contract: tarea 8, ronda de arreglo 1, punto 7: el mensaje dice qué hacer
    expect(checkExamBank(orbit)[0]).toContain('añade entradas al banco o usa generadas');
  });
});
