import { mergeSummaries } from '../engine/progression';
import type { Attempt, ProgressDoc } from './types';

const attemptKey = (a: Attempt): string => `${a.at}|${a.q}|${a.context}`;

/**
 * Une dos documentos de progreso del mismo jugador (local y nube). El resumen, según el motor; el
 * registro de intentos, la unión sin repetidos (mismo momento, pregunta y contexto), por fecha.
 */
export const mergeDocs = (a: ProgressDoc, b: ProgressDoc): ProgressDoc => {
  const seen = new Set(a.attempts.map(attemptKey));
  const extra = b.attempts.filter((attempt) => !seen.has(attemptKey(attempt)));
  const attempts =
    extra.length === 0
      ? [...a.attempts]
      : [...a.attempts, ...extra].sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  return { schema: 1, summary: mergeSummaries(a.summary, b.summary), attempts };
};

/** ¿Mismo contenido? */
export const sameDoc = (a: ProgressDoc, b: ProgressDoc): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
