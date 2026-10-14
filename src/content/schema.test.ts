import { describe, expect, it } from 'vitest';
import {
  bankEntrySchema,
  orbitSchema,
  exerciseSchema,
  gameSchema,
  planeSpecSchema,
  projectSchema,
  questionSchema,
  toShape,
} from './schema';

const base = (id: string) => ({ id, prompt: 'p', hints: [], explain: 'e', solution: 's' });
const num = (id: string) => ({ ...base(id), type: 'numero' as const, answer: 1, tol: 0 });
const plane = {
  range: 6,
  snap: 1,
  vectors: [
    { id: 'u', label: 'u', x: 1, y: 1, movable: true },
    { id: 'v', label: 'v', x: 2, y: 2, movable: false },
  ],
  readouts: ['components' as const],
};
const manip = (id: string) => ({
  ...base(id),
  type: 'manipular' as const,
  plane,
  goals: [{ metric: 'x' as const, of: ['u'], target: 3, tol: 0.1 }],
});
const code = (id: string) => ({
  ...base(id),
  type: 'codigo' as const,
  starter: 'x = 1',
  checks: 'assert True',
  reference: 'x = 1',
});
const sheet = (id: string) => ({
  ...base(id),
  type: 'revision' as const,
  format: 'texto' as const,
  lines: ['a', 'b'],
  faultyLine: null,
});
const five = (f: (id: string) => unknown, p: string) => [0, 1, 2, 3, 4].map((i) => f(`${p}-${i}`));
const project = (id = 'p1') => ({
  id,
  name: 'Proyecto',
  sub: 'sub',
  exercises: [
    { kind: 'manipular', questions: five(manip, `${id}-m`) },
    { kind: 'calcular', questions: five(num, `${id}-c`) },
    { kind: 'programar', questions: five(code, `${id}-g`) },
  ],
  sheets: [sheet(`${id}-h0`), sheet(`${id}-h1`), sheet(`${id}-h2`)],
});
const game = () => ({
  id: 'vectores',
  title: 'Vectores',
  launch: [num('pis-0')],
  orbits: [
    {
      name: 'Órbita 0',
      projects: [project('p1')],
      examBank: [
        { project: 'p1', question: num('b-0') },
        {
          project: 'p1',
          question: { type: 'generada', id: 'b-1', generator: 'g', params: { n: 2 } },
        },
      ],
    },
  ],
});

describe('gameSchema', () => {
  it('acepta un juego mínimo válido', () => {
    expect(gameSchema.safeParse(game()).success).toBe(true); // contract: tabla tarea 3
  });
  it('toShape devuelve ids de proyecto y de hojas', () => {
    const g = gameSchema.parse(game());
    expect(toShape(g)).toEqual({
      orbits: [{ projects: [{ id: 'p1', sheetIds: ['p1-h0', 'p1-h1', 'p1-h2'] }] }],
    }); // contract: tabla tarea 3 (ids de proyecto y de hojas)
  });
  it('rechaza un objeto con una función en un campo desconocido', () => {
    const g = game();
    (g.launch[0] as Record<string, unknown>).extra = () => 1;
    expect(gameSchema.safeParse(g).success).toBe(false); // contract: tabla tarea 3 (función en un campo)
  });
  it('rechaza una función en un campo conocido', () => {
    const g = game();
    (g.launch[0] as Record<string, unknown>).prompt = () => 'x';
    expect(gameSchema.safeParse(g).success).toBe(false); // contract: tabla tarea 3 (función en un campo)
  });
  it('rechaza una función dentro de params de una generada', () => {
    const g = game();
    (g.orbits[0].examBank[1].question as { params: Record<string, unknown> }).params.f = () => 1;
    expect(gameSchema.safeParse(g).success).toBe(false); // contract: spec 6, el contenido no contiene la función
  });
  it('rechaza un BankEntry que apunta a un proyecto inexistente', () => {
    const g = game();
    g.orbits[0].examBank[0].project = 'nope';
    expect(gameSchema.safeParse(g).success).toBe(false); // contract: reglas del esquema, BankEntry.project existe
  });
});

describe('projectSchema', () => {
  it('acepta un proyecto válido', () => {
    expect(projectSchema.safeParse(project()).success).toBe(true); // contract: reglas del esquema
  });
  it('rechaza un ejercicio con 4 preguntas', () => {
    const p = project();
    p.exercises[1].questions = five(num, 'x').slice(0, 4);
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: tabla tarea 3
  });
  it('rechaza 2 ejercicios', () => {
    const p = project();
    p.exercises.pop();
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: reglas del esquema, exercises longitud 3
  });
  it('rechaza ejercicios fuera de orden manipular, calcular, programar', () => {
    const p = project();
    [p.exercises[0], p.exercises[1]] = [p.exercises[1], p.exercises[0]];
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: reglas del esquema, orden de kind
  });
  it('rechaza un proyecto con 2 hojas', () => {
    const p = project();
    p.sheets.pop();
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: reglas del esquema, 3 hojas
  });
});

describe('orbitSchema y bankEntrySchema', () => {
  it('rechaza una órbita cuyo banco nombra un proyecto que no existe', () => {
    const c = game().orbits[0];
    c.examBank[0].project = 'otro';
    expect(orbitSchema.safeParse(c).success).toBe(false); // contract: reglas del esquema
  });
  it('bankEntry acepta una pregunta generada', () => {
    const e = {
      project: 'p1',
      question: { type: 'generada', id: 'g', generator: 'g', params: {} },
    };
    expect(bankEntrySchema.safeParse(e).success).toBe(true); // contract: tipo GeneradaQ del brief
  });
});

describe('questionSchema', () => {
  it('rechaza correct: 5 con 4 opciones', () => {
    const q = { ...base('o'), type: 'opcion', options: ['a', 'b', 'c', 'd'], correct: 5 };
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: tabla tarea 3
  });
  it('acepta correct dentro de las opciones', () => {
    const q = { ...base('o'), type: 'opcion', options: ['a', 'b', 'c', 'd'], correct: 3 };
    expect(questionSchema.safeParse(q).success).toBe(true); // contract: reglas del esquema
  });
  it('rechaza una opción con una sola respuesta', () => {
    const q = { ...base('o'), type: 'opcion', options: ['a'], correct: 0 };
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: reglas del esquema, al menos 2 opciones
  });
  it('rechaza una meta que nombra un vector inexistente', () => {
    const q = manip('m');
    q.goals = [{ metric: 'x', of: ['zzz'], target: 1, tol: 0 }];
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: tabla tarea 3
  });
  it.each([
    ['x', ['u', 'v']],
    ['norm', ['u', 'v']],
    ['distance', ['u']],
    ['sum_x', ['u']],
    ['sum_y', ['u', 'v', 'u']],
  ] as const)('rechaza la métrica %s con of %j', (metric, of) => {
    const q = manip('m');
    q.goals = [{ metric, of: [...of], target: 1, tol: 0 } as (typeof q.goals)[number]];
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: reglas del esquema, uno para x/y/norm, dos para el resto
  });
  it('acepta distance con dos vectores y pair', () => {
    const q = manip('m');
    q.plane = { ...plane, readouts: ['distance' as never], pair: ['u', 'v'] } as typeof plane;
    q.goals = [{ metric: 'distance' as never, of: ['u', 'v'], target: 1, tol: 0 }];
    expect(questionSchema.safeParse(q).success).toBe(true); // contract: reglas del esquema
  });
  it.each(['distance', 'sum'])('rechaza el readout %s sin pair', (readout) => {
    const q = { ...num('n'), plane: { ...plane, readouts: [readout] } };
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: reglas del esquema, pair obligatorio
  });
  it('rechaza tol negativa', () => {
    expect(questionSchema.safeParse({ ...num('n'), tol: -1 }).success).toBe(false); // contract: reglas del esquema, tol >= 0
  });
  it('rechaza id vacío', () => {
    expect(questionSchema.safeParse(num('')).success).toBe(false); // contract: reglas del esquema, id no vacío
  });
  it('acepta hints vacío', () => {
    expect(questionSchema.safeParse({ ...num('n'), hints: [] }).success).toBe(true); // contract: reglas del esquema
  });
  it('rechaza faultyLine fuera de lines', () => {
    expect(questionSchema.safeParse({ ...sheet('s'), faultyLine: 2 }).success).toBe(false); // contract: reglas del esquema (lines tiene 2)
    expect(questionSchema.safeParse({ ...sheet('s'), faultyLine: -1 }).success).toBe(false); // contract: reglas del esquema
  });
  it('acepta faultyLine dentro de lines', () => {
    expect(questionSchema.safeParse({ ...sheet('s'), faultyLine: 1 }).success).toBe(true); // contract: reglas del esquema
  });
  it('un type desconocido se rechaza', () => {
    expect(questionSchema.safeParse({ ...num('n'), type: 'otro' }).success).toBe(false); // contract: tipos de pregunta del spec 6
  });
});

describe('ronda de arreglo 1', () => {
  it('rechaza una manipular con goals vacío', () => {
    const q = { ...manip('m'), goals: [] };
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: fix1 punto 1, goals con al menos una meta
  });
  it('rechaza range 0 y range negativo', () => {
    expect(planeSpecSchema.safeParse({ ...plane, range: 0 }).success).toBe(false); // contract: regla propia, range positivo (fix1 punto 2)
    expect(planeSpecSchema.safeParse({ ...plane, range: -3 }).success).toBe(false); // contract: regla propia, range positivo (fix1 punto 2)
  });
  it('rechaza snap 0 y snap negativo', () => {
    expect(planeSpecSchema.safeParse({ ...plane, snap: 0 }).success).toBe(false); // contract: regla propia, snap positivo (fix1 punto 2)
    expect(planeSpecSchema.safeParse({ ...plane, snap: -1 }).success).toBe(false); // contract: regla propia, snap positivo (fix1 punto 2)
  });
  it('rechaza ids de vector repetidos en el plano', () => {
    const p = { ...plane, vectors: [plane.vectors[0], { ...plane.vectors[1], id: 'u' }] };
    expect(planeSpecSchema.safeParse(p).success).toBe(false); // contract: regla propia, ids de vector únicos (fix1 punto 2)
  });
  it('rechaza un pair que nombra un vector inexistente', () => {
    const p = { ...plane, readouts: ['distance' as const], pair: ['u', 'zzz'] };
    expect(planeSpecSchema.safeParse(p).success).toBe(false); // contract: regla propia, pair existente (fix1 punto 2)
  });
  it('rechaza vector.answer vacío', () => {
    const q = { ...base('v'), type: 'vector', answer: [], tol: 0 };
    expect(questionSchema.safeParse(q).success).toBe(false); // contract: regla propia, answer con un componente (fix1 punto 2)
  });
  it('rechaza una generada con generator vacío', () => {
    const e = { project: 'p1', question: { type: 'generada', id: 'g', generator: '', params: {} } };
    expect(bankEntrySchema.safeParse(e).success).toBe(false); // contract: regla propia, generator no vacío (fix1 punto 2)
  });

  const exercise = (kind: string, make: (id: string) => unknown) => ({
    kind,
    questions: five(make, 'e'),
  });
  it.each([
    ['manipular', num],
    ['manipular', code],
    ['manipular', sheet],
    ['calcular', manip],
    ['calcular', code],
    ['calcular', sheet],
    ['programar', manip],
    ['programar', num],
    ['programar', sheet],
  ] as const)('rechaza un ejercicio %s lleno de otro tipo de pregunta', (kind, make) => {
    expect(exerciseSchema.safeParse(exercise(kind, make)).success).toBe(false); // contract: fix1 punto 3, tipos por kind
  });
  it('rechaza un ejercicio con una sola pregunta de tipo ajeno', () => {
    const e = exercise('calcular', num) as { questions: unknown[] };
    e.questions[4] = code('e-x');
    expect(exerciseSchema.safeParse(e).success).toBe(false); // contract: fix1 punto 3, tipos por kind
  });
  it('acepta calcular con numero, vector y opcion mezclados', () => {
    const vec = (id: string) => ({ ...base(id), type: 'vector', answer: [1, 2], tol: 0 });
    const opt = (id: string) => ({ ...base(id), type: 'opcion', options: ['a', 'b'], correct: 0 });
    const e = { kind: 'calcular', questions: [num('a'), vec('b'), opt('c'), num('d'), vec('e')] };
    expect(exerciseSchema.safeParse(e).success).toBe(true); // contract: fix1 punto 3, calcular admite numero, vector y opcion
  });

  it('rechaza ids de pregunta repetidos entre ejercicios del proyecto', () => {
    const p = project();
    p.exercises[1].questions[0] = num('p1-m-0');
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: fix1 punto 4, ids únicos en el proyecto
  });
  it('rechaza una hoja con el id de una pregunta del proyecto', () => {
    const p = project();
    p.sheets[0] = sheet('p1-m-0');
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: fix1 punto 4, preguntas y hojas únicas
  });
  it('rechaza dos hojas con el mismo id', () => {
    const p = project();
    p.sheets[1] = sheet(p.sheets[0].id);
    expect(projectSchema.safeParse(p).success).toBe(false); // contract: fix1 punto 4, hojas únicas
  });
  it('rechaza ids de proyecto repetidos en el juego, también entre órbitas', () => {
    const g = game();
    g.orbits.push({ name: 'Órbita 1', projects: [project('p1')], examBank: [] });
    expect(gameSchema.safeParse(g).success).toBe(false); // contract: fix1 punto 4, ids de proyecto únicos (clave firsts)
  });
  it('acepta dos proyectos con ids distintos', () => {
    const g = game();
    g.orbits[0].projects.push(project('p2'));
    expect(gameSchema.safeParse(g).success).toBe(true); // contract: fix1 punto 4
  });
});
