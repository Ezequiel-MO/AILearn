import { measure, type Vec } from '../engine/vectors';
import type { CodigoQ, ManipularQ, Question } from './schema';

export type ParsedNumber = { ok: true; value: number } | { ok: false };

// Un signo opcional y dígitos con un único separador decimal, coma o punto.
const NUMBER = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

/** Acepta coma o punto y el menos tipográfico (U+2212). */
export const parseNumber = (text: string): ParsedNumber => {
  const t = text.trim().replace(/−/g, '-');
  if (!NUMBER.test(t)) return { ok: false };
  const value = Number(t.replace(',', '.'));
  if (!Number.isFinite(value)) return { ok: false };
  return { ok: true, value: value === 0 ? 0 : value }; // sin -0
};

export type Answer =
  | { type: 'manipular'; vectors: Record<string, [number, number]> }
  | { type: 'numero'; value: number }
  | { type: 'vector'; value: number[] }
  | { type: 'opcion'; index: number }
  | { type: 'revision'; faultyLine: number | null };

// Margen para el error de coma flotante en el borde de la tolerancia.
const EPS = 1e-9;
const within = (value: number, target: number, tol: number): boolean =>
  Math.abs(value - target) <= tol + EPS;

const gradeManipular = (q: ManipularQ, a: Extract<Answer, { type: 'manipular' }>): boolean => {
  const vectors: Record<string, Vec> = {};
  for (const v of q.plane.vectors) vectors[v.id] = [v.x, v.y];
  for (const [id, v] of Object.entries(a.vectors)) vectors[id] = v;
  return q.goals.every((g) => within(measure(g.metric, g.of, vectors), g.target, g.tol));
};

/** Las preguntas de código no pasan por aquí: las corrige Python. */
export const grade = (q: Exclude<Question, CodigoQ>, a: Answer): boolean => {
  switch (q.type) {
    case 'manipular':
      return a.type === 'manipular' && gradeManipular(q, a);
    case 'numero':
      return a.type === 'numero' && within(a.value, q.answer, q.tol);
    case 'vector':
      return (
        a.type === 'vector' &&
        a.value.length === q.answer.length &&
        a.value.every((x, i) => within(x, q.answer[i], q.tol))
      );
    case 'opcion':
      return a.type === 'opcion' && a.index === q.correct;
    case 'revision':
      return a.type === 'revision' && a.faultyLine === q.faultyLine;
  }
};
