import { describe, expect, it } from 'vitest';
import { autovectores } from './autovectores';
import { simetricas } from './simetricas';
import { pca } from './pca';
import { examen2Autovectores } from './examen-2-autovectores';
import { examen2Simetricas } from './examen-2-simetricas';
import { examen2Pca } from './examen-2-pca';

// Revisión de la Órbita 2: un vector fijo fuera de `range` deja la flecha y su etiqueta fuera de la vista.
const questions = [
  ...[autovectores, simetricas, pca].flatMap((p) => p.exercises.flatMap((e) => e.questions)),
  ...[...examen2Autovectores, ...examen2Simetricas, ...examen2Pca].map((e) => e.question),
];

describe('planos de la Órbita 2: lo fijo cabe en la vista', () => {
  const planes = questions.flatMap((q) =>
    q.type === 'manipular' ? [{ id: q.id, plane: q.plane }] : [],
  );

  it('hay planos que revisar', () => {
    // contract: revisión de la Órbita 2: el recorrido no puede quedar vacío sin avisar
    expect(planes.length).toBeGreaterThan(10);
  });

  for (const { id, plane } of planes) {
    it(`${id}: los vectores fijos caben en range ${plane.range}`, () => {
      const outside = plane.vectors
        .filter((v) => !v.movable && Math.max(Math.abs(v.x), Math.abs(v.y)) > plane.range)
        .map((v) => `${v.id}=(${v.x}, ${v.y})`);
      // contract: revisión de la Órbita 2 (pca.ex00.2: î = (4, 0) con range 3 quedaba fuera de la vista)
      expect(outside).toEqual([]);
    });
  }
});
