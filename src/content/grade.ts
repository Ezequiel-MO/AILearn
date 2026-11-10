import { curveAt, measureCurve } from '../engine/curves';
import { labSolved, type LabState } from '../engine/labs';
import { measure, type Vec } from '../engine/vectors';
import type { CodigoQ, CurvaQ, GraphSpec, LabQ, ManipularQ, Question } from './schema';

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
  | { type: 'curva'; points: Record<string, [number, number]> }
  | { type: 'laboratorio'; state: LabState }
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

/**
 * Posiciones [x, y] de los puntos de un plano de curvas: las iniciales, con `moved` encima. Un punto
 * `onCurve` está siempre en (x, f(x)): de lo que llegue solo cuenta su x.
 */
export const graphPositions = (
  graph: GraphSpec,
  moved: Record<string, readonly number[]> = {},
): Record<string, [number, number]> => {
  const out: Record<string, [number, number]> = {};
  for (const p of graph.points) {
    const at = Object.hasOwn(moved, p.id) ? moved[p.id] : undefined;
    const x = at ? at[0] : p.x;
    const y = p.onCurve && graph.curve ? curveAt(graph.curve, x) : at ? at[1] : (p.y ?? 0);
    out[p.id] = [x, y];
  }
  return out;
};

const gradeCurva = (q: CurvaQ, a: Extract<Answer, { type: 'curva' }>): boolean => {
  const points = graphPositions(q.graph, a.points);
  return q.goals.every((g) =>
    within(measureCurve(g.metric, g.of, points, q.graph.curve), g.target, g.tol),
  );
};

const gradeLab = (q: LabQ, a: Extract<Answer, { type: 'laboratorio' }>): boolean =>
  labSolved(q.lab, q.goals, a.state);

/** Las preguntas de código no pasan por aquí: las corrige Python. */
export const grade = (q: Exclude<Question, CodigoQ>, a: Answer): boolean => {
  switch (q.type) {
    case 'manipular':
      return a.type === 'manipular' && gradeManipular(q, a);
    case 'curva':
      return a.type === 'curva' && gradeCurva(q, a);
    case 'laboratorio':
      return a.type === 'laboratorio' && gradeLab(q, a);
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
