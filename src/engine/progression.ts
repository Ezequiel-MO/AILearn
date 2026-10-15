import {
  EXAM_PASS,
  EXAM_SIZE,
  EXERCISES_PER_PROJECT,
  QUESTIONS_PER_EXERCISE,
  VALID,
  XP_EXAM,
  XP_PER_LEVEL,
  XP_LAUNCH,
  XP_SHEET,
  type Shape,
  type Summary,
} from './types';

const assertIntInRange = (what: string, value: number, max: number): void => {
  if (!Number.isInteger(value) || value < 0 || value > max)
    throw new Error(`${what}: se esperaba un entero entre 0 y ${max} y llegó ${value}`);
};

const maxFirsts = QUESTIONS_PER_EXERCISE * EXERCISES_PER_PROJECT;

export const mark = (firsts: number): number => Math.round((100 * firsts) / maxFirsts);

export const projectMark = (s: Summary, projectId: string): number => {
  let total = 0;
  for (let ex = 0; ex < EXERCISES_PER_PROJECT; ex++) total += s.firsts[`${projectId}/${ex}`] ?? 0;
  return mark(total);
};

export const isValidated = (s: Summary, projectId: string): boolean =>
  projectMark(s, projectId) >= VALID;

export const orbitOpen = (shape: Shape, s: Summary, c: number): boolean => {
  if (!Number.isInteger(c) || c < 0 || c >= shape.orbits.length) return false;
  if (c === 0) return s.launch;
  return orbitOpen(shape, s, c - 1) && s.examsPassed.includes(c - 1);
};

export const examOpen = (shape: Shape, s: Summary, c: number): boolean => {
  const orbit = shape.orbits[c];
  if (!orbit) return false;
  return orbit.projects.every((p) => isValidated(s, p.id));
};

/** El examen de la órbita se puede sentar: órbita abierta, proyectos validados y al menos un proyecto que examinar. */
export const examAvailable = (shape: Shape, s: Summary, c: number): boolean =>
  orbitOpen(shape, s, c) && examOpen(shape, s, c) && (shape.orbits[c]?.projects.length ?? 0) > 0;

export const sheetsOpen = (s: Summary, projectId: string): boolean => isValidated(s, projectId);

export const completeLaunch = (s: Summary): Summary => ({ ...s, launch: true });

export const handInExercise = (
  s: Summary,
  projectId: string,
  ex: 0 | 1 | 2,
  firsts: number,
): Summary => {
  const key = `${projectId}/${ex}`;
  assertIntInRange('handInExercise', firsts, QUESTIONS_PER_EXERCISE);
  return { ...s, firsts: { ...s.firsts, [key]: Math.max(s.firsts[key] ?? 0, firsts) } };
};

/** ¿Aprueba un examen con `correct` aciertos? Única fuente de la regla de aprobado. */
export const examPassed = (correct: number): boolean => {
  assertIntInRange('examPassed', correct, EXAM_SIZE);
  return correct >= EXAM_PASS;
};

/** La regla de «a la primera» de un intento: acertado, entregado una vez y sin pista. */
export const firstTry = (a: { correct: boolean; submissions: number; hinted: boolean }): boolean =>
  a.correct && a.submissions === 1 && !a.hinted;

export const handInExam = (s: Summary, c: number, correct: number): Summary => {
  if (!examPassed(correct) || s.examsPassed.includes(c))
    return { ...s, examsPassed: [...s.examsPassed] };
  return { ...s, examsPassed: [...s.examsPassed, c] };
};

export const solveSheet = (s: Summary, sheetId: string): Summary =>
  s.sheets.includes(sheetId)
    ? { ...s, sheets: [...s.sheets] }
    : { ...s, sheets: [...s.sheets, sheetId] };

/**
 * Une dos resúmenes del mismo jugador (dos dispositivos): lo conseguido en cualquiera cuenta.
 * La mejor marca por ejercicio; exámenes y hojas, la unión (primero los de `a`).
 */
export const mergeSummaries = (a: Summary, b: Summary): Summary => {
  const firsts = { ...a.firsts };
  for (const [key, value] of Object.entries(b.firsts)) {
    firsts[key] = Math.max(firsts[key] ?? 0, value);
  }
  const union = <T>(x: T[], y: T[]): T[] => [...x, ...y.filter((v) => !x.includes(v))];
  return {
    launch: a.launch || b.launch,
    firsts,
    examsPassed: union(a.examsPassed, b.examsPassed),
    sheets: union(a.sheets, b.sheets),
  };
};

export const xp = (shape: Shape, s: Summary): number => {
  let total = s.launch ? XP_LAUNCH : 0;
  const sheetIds = new Set<string>();
  shape.orbits.forEach((orbit, c) => {
    if (s.examsPassed.includes(c)) total += XP_EXAM;
    for (const p of orbit.projects) {
      if (isValidated(s, p.id)) total += projectMark(s, p.id);
      p.sheetIds.forEach((id) => sheetIds.add(id));
    }
  });
  for (const id of new Set(s.sheets)) if (sheetIds.has(id)) total += XP_SHEET;
  return total;
};

export const level = (points: number): number => points / XP_PER_LEVEL;
