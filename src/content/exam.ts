import { pick, makeRng } from '../engine/rng';
import { EXAM_SIZE } from '../engine/types';
import { resolve } from './generators';
import type { Orbit, Question } from './schema';

export interface ExamQuestion {
  project: string;
  question: Question;
}

/** Hash FNV-1a de un texto a entero sin signo de 32 bits. */
const hash = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Semilla entera de una entrada generada, a partir de la del examen y del id de la entrada. */
const entrySeed = (examSeed: number, entryId: string): number => hash(`${examSeed}:${entryId}`);

/** Cuántas preguntas tocan a cada proyecto: reparto por igual, el resto en rotación desde el primero. */
const quotas = (projects: number): number[] =>
  Array.from(
    { length: projects },
    (_, i) => Math.floor(EXAM_SIZE / projects) + (i < EXAM_SIZE % projects ? 1 : 0),
  );

export const drawExam = (orbit: Orbit, seed: number): ExamQuestion[] => {
  if (orbit.projects.length === 0) {
    throw new Error(`La órbita «${orbit.name}» no tiene proyectos: no se puede sortear un examen`);
  }
  const rng = makeRng(seed);
  const quota = quotas(orbit.projects.length);
  const drawn: ExamQuestion[] = [];
  orbit.projects.forEach((project, i) => {
    const need = quota[i]!;
    if (need === 0) return;
    const bank = orbit.examBank.filter((e) => e.project === project.id);
    if (bank.length < need) {
      throw new Error(
        `El proyecto ${project.id} tiene ${bank.length} entradas en el banco de examen y necesita ${need}`,
      );
    }
    for (const entry of pick(rng, bank, need)) {
      const q = entry.question;
      drawn.push({
        project: project.id,
        question: q.type === 'generada' ? resolve(q, entrySeed(seed, q.id)) : q,
      });
    }
  });
  return pick(rng, drawn, drawn.length);
};

/** La respuesta correcta de una pregunta, para comparar exámenes. */
const answerOf = (q: Question): unknown => {
  switch (q.type) {
    case 'numero':
    case 'vector':
      return q.answer;
    case 'opcion':
      return q.correct;
    case 'revision':
      return q.faultyLine;
    case 'manipular':
      return q.goals;
    case 'codigo':
      return q.reference;
  }
};

const key = (e: ExamQuestion): string =>
  JSON.stringify([e.project, e.question.id, e.question.prompt, answerOf(e.question)]);

/** Dos exámenes son el mismo si tienen las mismas preguntas (id, enunciado y respuesta), sin contar el orden. */
export const sameExam = (a: readonly ExamQuestion[], b: readonly ExamQuestion[]): boolean => {
  if (a.length !== b.length) return false;
  const ka = a.map(key).sort();
  const kb = b.map(key).sort();
  return ka.every((k, i) => k === kb[i]);
};

/**
 * Proyectos con alguna pregunta fallada, sin repetir. Con la órbita, en su orden;
 * sin él, en el orden en que aparecen en el examen.
 */
export const projectsToRevise = (
  exam: readonly ExamQuestion[],
  correct: readonly boolean[],
  orbit?: Orbit,
): string[] => {
  if (exam.length !== correct.length) {
    throw new Error(
      `El examen tiene ${exam.length} preguntas y se dieron ${correct.length} resultados`,
    );
  }
  const failed = new Set(exam.filter((_, i) => !correct[i]).map((e) => e.project));
  if (!orbit) return [...failed];
  return orbit.projects.map((p) => p.id).filter((id) => failed.has(id));
};
