export const VALID = 80;
export const QUESTIONS_PER_EXERCISE = 5;
export const EXERCISES_PER_PROJECT = 3;
export const EXAM_SIZE = 6;
export const EXAM_PASS = 5;
export const XP_LAUNCH = 50;
export const XP_EXAM = 50;
export const XP_SHEET = 10;
export const XP_PER_LEVEL = 150;

export interface Summary {
  launch: boolean;
  /** Mejor marca por ejercicio, clave `${projectId}/${0|1|2}`, valor 0..5. */
  firsts: Record<string, number>;
  /** Índices de órbita con el examen aprobado. */
  examsPassed: number[];
  /** Ids de hojas resueltas. */
  sheets: string[];
}

export const emptySummary = (): Summary => ({
  launch: false,
  firsts: {},
  examsPassed: [],
  sheets: [],
});

/** Lo mínimo que las reglas necesitan saber de un juego. */
export interface Shape {
  orbits: { projects: { id: string; sheetIds: string[] }[] }[];
}
