import { drawExam, sameExam, type ExamQuestion } from './exam';
import { generators, resolve } from './generators';
import { grade, parseNumber } from './grade';
import {
  gameSchema,
  projectSchema,
  type Orbit,
  type CodigoQ,
  type CurvaQ,
  type Game,
  type GeneradaQ,
  type ManipularQ,
  type Project,
  type Question,
} from './schema';

// Cada función devuelve la lista de problemas, vacía si no hay.

/** Colocaciones que se recorren como máximo al buscar una meta alcanzable. */
const MAX_PLACEMENTS = 5_000_000;
const MAX_MOVABLE = 2;
const EXAM_SEEDS = [1, 2, 3] as const;

/** Todas las preguntas del juego: Despegue, ejercicios y hojas de los proyectos, y banco de examen (con las generadas sin resolver). */
const everyQuestion = (game: Game): (Question | Orbit['examBank'][number]['question'])[] => [
  ...game.launch,
  ...game.orbits.flatMap((c) => [
    ...c.projects.flatMap((p) => [...p.exercises.flatMap((e) => e.questions), ...p.sheets]),
    ...c.examBank.map((e) => e.question),
  ]),
];

/** Ids únicos en todo el juego: Despegue, proyectos (preguntas y hojas) y banco de examen. */
export const checkIds = (game: Game): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const q of everyQuestion(game)) {
    if (seen.has(q.id)) repeated.add(q.id);
    seen.add(q.id);
  }
  return [...repeated].map((id) => `Id repetido en el juego ${game.id}: ${id}`);
};

/** Valores de una coordenada en la rejilla: de -range a range de snap en snap. */
const gridValues = (range: number, snap: number): number[] => {
  const n = Math.floor(range / snap + 1e-9);
  return Array.from({ length: 2 * n + 1 }, (_, i) => Number(((i - n) * snap).toFixed(10)));
};

export const checkReachable = (q: ManipularQ): string[] => {
  const movable = q.plane.vectors.filter((v) => v.movable);
  if (movable.length > MAX_MOVABLE) {
    return [
      `${q.id}: demasiados vectores móviles para comprobar (${movable.length}, el máximo es ${MAX_MOVABLE})`,
    ];
  }
  const values = gridValues(q.plane.range, q.plane.snap);
  const placements = (values.length * values.length) ** movable.length;
  if (placements > MAX_PLACEMENTS) {
    return [
      `${q.id}: la rejilla es demasiado grande para comprobarla (${placements} colocaciones, el máximo es ${MAX_PLACEMENTS})`,
    ];
  }
  const vectors: Record<string, [number, number]> = {};
  const search = (i: number): boolean => {
    if (i === movable.length) return grade(q, { type: 'manipular', vectors });
    const id = movable[i]!.id;
    for (const x of values) {
      for (const y of values) {
        vectors[id] = [x, y];
        if (search(i + 1)) return true;
      }
    }
    return false;
  };
  return search(0) ? [] : [`${q.id}: ninguna colocación de la rejilla cumple todas las metas`];
};

/** Múltiplos de `snap` dentro de [lo, hi]. */
const gridBetween = (lo: number, hi: number, snap: number): number[] => {
  const first = Math.ceil(lo / snap - 1e-9);
  const last = Math.floor(hi / snap + 1e-9);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) =>
    Number(((first + i) * snap).toFixed(10)),
  );
};

/**
 * Como `checkReachable`, en el plano de curvas: un punto sobre la curva recorre las x de la rejilla
 * (su altura es f(x)); un punto libre, todas las parejas (x, y) de la rejilla.
 */
export const checkReachableCurva = (q: CurvaQ): string[] => {
  const movable = q.graph.points.filter((p) => p.movable);
  if (movable.length > MAX_MOVABLE) {
    return [
      `${q.id}: demasiados puntos móviles para comprobar (${movable.length}, el máximo es ${MAX_MOVABLE})`,
    ];
  }
  const xs = gridBetween(q.graph.x[0], q.graph.x[1], q.graph.snap);
  const ys = gridBetween(q.graph.y[0], q.graph.y[1], q.graph.snap);
  const options = movable.map((p): [number, number][] =>
    p.onCurve ? xs.map((x) => [x, 0]) : xs.flatMap((x) => ys.map((y): [number, number] => [x, y])),
  );
  const placements = options.reduce((n, o) => n * o.length, 1);
  if (placements > MAX_PLACEMENTS) {
    return [
      `${q.id}: la rejilla es demasiado grande para comprobarla (${placements} colocaciones, el máximo es ${MAX_PLACEMENTS})`,
    ];
  }
  const points: Record<string, [number, number]> = {};
  const search = (i: number): boolean => {
    if (i === movable.length) return grade(q, { type: 'curva', points });
    for (const at of options[i]!) {
      points[movable[i]!.id] = at;
      if (search(i + 1)) return true;
    }
    return false;
  };
  return search(0) ? [] : [`${q.id}: ninguna colocación de la rejilla cumple todas las metas`];
};

export const checkStartNotSolved = (q: ManipularQ | CurvaQ): string[] =>
  (
    q.type === 'manipular'
      ? grade(q, { type: 'manipular', vectors: {} })
      : grade(q, { type: 'curva', points: {} })
  )
    ? [`${q.id}: la posición inicial ya cumple todas las metas`]
    : [];

/** Alcanzable y no resuelta al empezar: lo que se exige a toda `manipular` y toda `curva`. */
const checkPlayable = (q: Question | GeneradaQ): string[] => {
  if (q.type === 'manipular') return [...checkReachable(q), ...checkStartNotSolved(q)];
  if (q.type === 'curva') return [...checkReachableCurva(q), ...checkStartNotSolved(q)];
  return [];
};

export const checkExamBank = (orbit: Orbit): string[] => {
  const exams: ExamQuestion[][] = [];
  for (const seed of EXAM_SEEDS) {
    try {
      exams.push(drawExam(orbit, seed));
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      return [`La órbita «${orbit.name}»: drawExam con la semilla ${seed} falla: ${reason}`];
    }
  }
  const same = exams.some((a, i) => exams.some((b, j) => i < j && sameExam(a, b)));
  return same
    ? [
        `La órbita «${orbit.name}»: el banco no permite ${EXAM_SEEDS.length} exámenes distintos con las semillas ${EXAM_SEEDS.join(', ')}: añade entradas al banco o usa generadas`,
      ]
    : [];
};

/** Esquema más las comprobaciones de las preguntas de manipular de un proyecto suelto. */
export const checkProject = (project: Project): string[] => {
  const parsed = projectSchema.safeParse(project);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (i) => `Proyecto ${project.id}: ${i.path.join('.')}: ${i.message}`,
    );
  }
  return parsed.data.exercises.flatMap((e) => e.questions).flatMap(checkPlayable);
};

/** Todas las preguntas de código, incluidas las de despegue y las de los bancos de examen. */
export const codeQuestions = (game: Game): CodigoQ[] =>
  everyQuestion(game).filter((q): q is CodigoQ => q.type === 'codigo');

/** Semillas con las que se resuelven las entradas generadas para comprobar sus respuestas. */
const RESOLVE_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Lo que teclearía el jugador para un número: redondeado a dos decimales y con coma. */
const typed = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

const UNTYPEABLE =
  'la respuesta no se puede teclear con dos decimales: sube la tolerancia o redondea la respuesta';

/** Problemas de la respuesta declarada de una pregunta: se corrige como correcta con ella (tecleada con dos decimales). */
const answerProblems = (q: Exclude<Question, CodigoQ>): string[] => {
  switch (q.type) {
    case 'numero': {
      const parsed = parseNumber(typed(q.answer));
      return parsed.ok && grade(q, { type: 'numero', value: parsed.value })
        ? []
        : [`${q.id}: ${UNTYPEABLE}`];
    }
    case 'vector': {
      const parsed = q.answer.map((x) => parseNumber(typed(x)));
      const value = parsed.flatMap((p) => (p.ok ? [p.value] : []));
      return value.length === parsed.length && grade(q, { type: 'vector', value })
        ? []
        : [`${q.id}: ${UNTYPEABLE}`];
    }
    case 'opcion':
      return q.options[q.correct] !== undefined && grade(q, { type: 'opcion', index: q.correct })
        ? []
        : [`${q.id}: la opción correcta (${q.correct}) no existe o no se corrige como correcta`];
    case 'revision':
      return grade(q, { type: 'revision', faultyLine: q.faultyLine })
        ? []
        : [`${q.id}: la línea defectuosa declarada no se corrige como correcta`];
    case 'manipular':
    case 'curva':
      return []; // sin respuesta declarada: lo vigilan checkReachable(Curva) y checkStartNotSolved
  }
};

/**
 * Todas las comprobaciones de un juego que no necesitan Pyodide: esquema, ids, alcanzabilidad y
 * posición inicial de toda `manipular` (también en el banco), banco de examen, generadores,
 * respuestas declaradas y opciones distintas. Las de código viven en `tests/content/python.test.ts`.
 */
export const gameProblems = (game: Game): string[] => {
  const parsed = gameSchema.safeParse(game);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `Juego ${game.id}: ${i.path.join('.')}: ${i.message}`);
  }
  const problems: string[] = [...checkIds(game)];
  const all = everyQuestion(game);

  for (const q of all) problems.push(...checkPlayable(q));
  for (const orbit of game.orbits) problems.push(...checkExamBank(orbit));

  const entries = all.filter((q): q is GeneradaQ => q.type === 'generada');
  const resolved: Question[] = [];
  for (const entry of entries) {
    if (!Object.hasOwn(generators, entry.generator)) {
      problems.push(`${entry.id}: el generador «${entry.generator}» no existe`);
      continue;
    }
    for (const seed of RESOLVE_SEEDS) {
      try {
        resolved.push(resolve(entry, seed));
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        problems.push(`${entry.id}: el generador falla con la semilla ${seed}: ${reason}`);
        break;
      }
    }
  }

  const plain = all.filter((q): q is Question => q.type !== 'generada');
  for (const q of [...plain, ...resolved]) {
    if (q.type === 'codigo') continue;
    problems.push(...answerProblems(q));
  }
  for (const q of plain) {
    if (q.type === 'opcion' && new Set(q.options.map((o) => o.trim())).size !== q.options.length) {
      problems.push(`${q.id}: hay opciones repetidas (se comparan sin espacios sobrantes)`);
    }
  }
  return problems;
};
