// Recompensas que se ven: estrellas de una tanda, avance hacia el siguiente nivel y logros.
// Todo sale del resumen que ya se guarda: nada de esto se almacena aparte ni cambia la nota o el XP.

import { examAvailable, isValidated, orbitOpen, projectMark, xp } from './progression';
import { QUESTIONS_PER_EXERCISE, VALID, XP_PER_LEVEL, type Shape, type Summary } from './types';

/** Nota mínima de una tanda (de 0 a 100) para cada estrella, de la primera a la tercera. */
export const STAR_MARKS = [60, VALID, 100] as const;

/** Estrellas de una tanda de ejercicio por sus aciertos a la primera (0 a 5): 3 de 5 → 1, 4 → 2, 5 → 3. */
export const stars = (firsts: number): 0 | 1 | 2 | 3 => {
  if (!Number.isInteger(firsts) || firsts < 0 || firsts > QUESTIONS_PER_EXERCISE)
    throw new Error(
      `stars: se esperaba un entero entre 0 y ${QUESTIONS_PER_EXERCISE} y llegó ${firsts}`,
    );
  const mark = (100 * firsts) / QUESTIONS_PER_EXERCISE;
  return STAR_MARKS.filter((min) => mark >= min).length as 0 | 1 | 2 | 3;
};

/** Nivel entero alcanzado, la parte recorrida del siguiente (0 a 1) y el XP que falta para él. */
export const levelProgress = (
  points: number,
): { whole: number; fraction: number; toNext: number } => {
  const whole = Math.floor(points / XP_PER_LEVEL);
  const into = points - whole * XP_PER_LEVEL;
  return { whole, fraction: into / XP_PER_LEVEL, toNext: XP_PER_LEVEL - into };
};

/** El XP que corresponde a un nivel con decimales (el que enseña la cabecera): la inversa de `level`. */
export const pointsOfLevel = (lv: number): number => Math.round(lv * XP_PER_LEVEL);

/** Lo siguiente que conviene jugar en un juego, para señalarlo en el mapa. */
export type NextStep =
  { kind: 'launch' } | { kind: 'project'; id: string } | { kind: 'exam'; c: number } | null;

/**
 * El despegue si falta; si no, en la primera órbita sin terminar, su primer proyecto sin validar o, con
 * todos validados, su examen. Nada si el juego está terminado o lo pendiente aún no se ha abierto.
 */
export const nextStep = (shape: Shape, s: Summary): NextStep => {
  if (!s.launch) return { kind: 'launch' };
  for (const [c, orbit] of shape.orbits.entries()) {
    if (!orbitOpen(shape, s, c)) return null;
    const pending = orbit.projects.find((p) => !isValidated(s, p.id));
    if (pending) return { kind: 'project', id: pending.id };
    if (!s.examsPassed.includes(c)) return examAvailable(shape, s, c) ? { kind: 'exam', c } : null;
  }
  return null;
};

/** Los logros de un juego, en el orden en que se enseñan (de los primeros pasos al juego completo). */
export const ACHIEVEMENTS = [
  'launch',
  'perfectRun',
  'firstProject',
  'firstSheet',
  'level2',
  'perfectProject',
  'allSheets',
  'firstExam',
  'fullOrbit',
  'level5',
  'allOrbits',
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number];

const projectsOf = (shape: Shape) => shape.orbits.flatMap((o) => o.projects);

const RULES: Record<AchievementId, (shape: Shape, s: Summary) => boolean> = {
  // El despegue completado.
  launch: (_, s) => s.launch,
  // Una tanda de ejercicio con todas las preguntas a la primera.
  perfectRun: (_, s) => Object.values(s.firsts).some((n) => n >= QUESTIONS_PER_EXERCISE),
  // Un proyecto validado (nota 80 o más).
  firstProject: (shape, s) => projectsOf(shape).some((p) => isValidated(s, p.id)),
  // Una hoja «Caza el error» resuelta.
  firstSheet: (shape, s) =>
    projectsOf(shape).some((p) => p.sheetIds.some((id) => s.sheets.includes(id))),
  // Nivel 2.
  level2: (shape, s) => xp(shape, s) >= 2 * XP_PER_LEVEL,
  // Un proyecto con nota 100: sus tres ejercicios sin un fallo.
  perfectProject: (shape, s) => projectsOf(shape).some((p) => projectMark(s, p.id) >= 100),
  // Todas las hojas de un proyecto.
  allSheets: (shape, s) =>
    projectsOf(shape).some(
      (p) => p.sheetIds.length > 0 && p.sheetIds.every((id) => s.sheets.includes(id)),
    ),
  // Un examen de órbita aprobado.
  firstExam: (shape, s) => shape.orbits.some((_, c) => s.examsPassed.includes(c)),
  // Una órbita entera: sus proyectos validados y su examen aprobado.
  fullOrbit: (shape, s) =>
    shape.orbits.some(
      (o, c) => s.examsPassed.includes(c) && o.projects.every((p) => isValidated(s, p.id)),
    ),
  // Nivel 5.
  level5: (shape, s) => xp(shape, s) >= 5 * XP_PER_LEVEL,
  // Todas las órbitas del juego con su examen aprobado.
  allOrbits: (shape, s) =>
    shape.orbits.length > 0 && shape.orbits.every((_, c) => s.examsPassed.includes(c)),
};

/** Los logros conseguidos con este resumen, en el orden de `ACHIEVEMENTS`. */
export const achievements = (shape: Shape, s: Summary): AchievementId[] =>
  ACHIEVEMENTS.filter((id) => RULES[id](shape, s));

/** Los logros que trae el paso de `before` a `after` (los que no estaban antes). */
export const newAchievements = (shape: Shape, before: Summary, after: Summary): AchievementId[] => {
  const had = new Set(achievements(shape, before));
  return achievements(shape, after).filter((id) => !had.has(id));
};
