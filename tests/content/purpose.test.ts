import { describe, expect, it } from 'vitest';
import type { ManipularQ, Question } from '../../src/content/schema';
import { games } from '../../src/games';

/**
 * El sentido de cada pregunta `manipular` (petición de Oliver, 2026-10-28): «Para qué sirve», «Qué vas
 * a conseguir» y «Lo que te llevas». Se pasó primero de «Por qué falla un RAG» en adelante; lo que
 * queda por pasar está en `PENDING` y la lista solo puede encoger.
 */
const PENDING: Record<string, readonly string[]> = {
  vectores: [
    'despegue',
    'componentes',
    'suma-escala',
    'norma-distancia',
    'producto-escalar',
    'coseno',
    'proyeccion',
    'rn-numpy',
    'normalizar',
    'dimension-alta',
    'vecinos',
    'analogias',
  ],
};

const MIN_CHARS = 60;
const MAX_CHARS = 700;

const manipulars = (qs: readonly Question[]): ManipularQ[] =>
  qs.filter((q): q is ManipularQ => q.type === 'manipular');

/** Cada grupo con preguntas manipular: el despegue y el ejercicio «Manipular» de cada proyecto. */
const groups = games.flatMap((g) => [
  { game: g.id, id: 'despegue', questions: manipulars(g.launch) },
  ...g.orbits.flatMap((o) =>
    o.projects.map((p) => ({
      game: g.id,
      id: p.id,
      questions: manipulars(p.exercises.flatMap((e) => e.questions)),
    })),
  ),
]);

describe('el sentido de las preguntas manipular', () => {
  for (const { game, id, questions } of groups) {
    if (questions.length === 0) continue;
    const pending = PENDING[game]?.includes(id) ?? false;

    if (pending) {
      it(`${game}/${id} está pendiente: todavía ninguna pregunta lleva purpose`, () => {
        // contract: la lista PENDING encoge; un grupo ya pasado sale de ella
        expect(questions.filter((q) => q.purpose).map((q) => q.id)).toEqual([]);
      });
      continue;
    }

    it(`${game}/${id}: toda pregunta manipular lleva purpose`, () => {
      // contract: petición de Oliver 2026-10-28: relevancia, intención y para qué en cada Manipular
      expect(questions.filter((q) => !q.purpose).map((q) => q.id)).toEqual([]);
    });

    it(`${game}/${id}: cada texto de purpose mide de ${MIN_CHARS} a ${MAX_CHARS} caracteres`, () => {
      const out = questions.flatMap((q) =>
        q.purpose
          ? (['why', 'aim', 'takeaway'] as const)
              .filter((k) => {
                const n = q.purpose![k].trim().length;
                return n < MIN_CHARS || n > MAX_CHARS;
              })
              .map((k) => `${q.id} purpose.${k}: ${q.purpose![k].trim().length}`)
          : [],
      );
      // contract: petición de Oliver 2026-10-28: «intenciones detalladas», sin muros de texto
      expect(out).toEqual([]);
    });

    it(`${game}/${id}: ningún texto de purpose se repite entre sus preguntas`, () => {
      const out = (['why', 'aim', 'takeaway'] as const).flatMap((k) => {
        const texts = questions.flatMap((q) => (q.purpose ? [q.purpose[k].trim()] : []));
        return new Set(texts).size === texts.length ? [] : [`purpose.${k} repetido`];
      });
      // contract: cada manipulación enseña algo distinto; un texto copiado no dice para qué sirve esta
      expect(out).toEqual([]);
    });
  }

  it('PENDING solo nombra juegos y grupos que existen', () => {
    const known = new Set(groups.map((g) => `${g.game}/${g.id}`));
    const unknown = Object.entries(PENDING).flatMap(([game, ids]) =>
      ids.map((id) => `${game}/${id}`).filter((k) => !known.has(k)),
    );
    // contract: una lista de pendientes con nombres viejos no protege nada
    expect(unknown).toEqual([]);
  });
});
