import { describe, expect, it } from 'vitest';
import { resolve } from '../../src/content/generators';
import type { GeneradaQ, GraphSpec } from '../../src/content/schema';
import { curveAt } from '../../src/engine/curves';
import { games } from '../../src/games';

/**
 * Una pérdida no es negativa (hallazgo 5 de la revisión de la Órbita 0 del juego 3, 2026-11-05):
 * había curvas llamadas «pérdida» que bajaban de 0, lo contrario de lo que enseña el juego. Una
 * figura es una pérdida si su curva es `mse` o si su eje vertical se llama «pérdida». Recorre todo el
 * contenido de todos los juegos, también las preguntas generadas (con 50 semillas).
 */

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

const figures: { label: string; graph: GraphSpec }[] = [];
const walk = (node: unknown, label: string): void => {
  if (Array.isArray(node)) {
    node.forEach((x) => walk(x, label));
    return;
  }
  if (!node || typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  const here = typeof record.id === 'string' ? record.id : label;
  if (record.type === 'generada') {
    for (const seed of SEEDS) {
      const q = resolve(record as unknown as GeneradaQ, seed);
      if ('graph' in q && q.graph)
        figures.push({ label: `${here} (semilla ${seed})`, graph: q.graph });
    }
  }
  if (record.graph && typeof record.graph === 'object') {
    figures.push({ label: here, graph: record.graph as GraphSpec });
  }
  for (const [key, value] of Object.entries(record)) if (key !== 'graph') walk(value, here);
};
walk(games, '');

const losses = figures.filter(
  ({ graph }) =>
    graph.curve && (graph.curve.kind === 'mse' || /pérdida/i.test(graph.labels?.y ?? '')),
);

/** El valor más bajo de la curva en la ventana horizontal de la figura (400 muestras). */
const lowest = (graph: GraphSpec): number => {
  let low = Infinity;
  for (let i = 0; i <= 400; i++) {
    low = Math.min(low, curveAt(graph.curve!, graph.x[0] + ((graph.x[1] - graph.x[0]) * i) / 400));
  }
  return low;
};

describe('las curvas de pérdida', () => {
  it('hay figuras de pérdida que revisar', () => {
    // contract: el juego 3 dibuja pérdidas desde su despegue; si no sale ninguna, el recorrido está roto
    expect(losses.length).toBeGreaterThan(20);
  });

  it('ninguna baja de 0 en su ventana', () => {
    const bad = losses
      .map(({ label, graph }) => ({ label, low: lowest(graph) }))
      .filter(({ low }) => low < -1e-9)
      .map(({ label, low }) => `${label}: baja hasta ${low.toFixed(2)}`);
    // contract: hallazgo 5 de la revisión (2026-11-05): la pérdida cuadrática media nunca es negativa
    expect(bad).toEqual([]);
  });

  it('su ventana enseña poco por debajo de 0: como mucho una décima de su altura', () => {
    const bad = losses
      .filter(({ graph }) => graph.y[0] < -0.1 * (graph.y[1] - graph.y[0]))
      .map(({ label, graph }) => `${label}: y = [${graph.y.join(', ')}]`);
    // contract: hallazgo 4 de la revisión (2026-11-05): la figura de minimo-perdida tenía un tercio
    // negativo y el valle aplastado; un margen de 1 bajo el 0 en una ventana de 11 sí se admite
    expect(bad).toEqual([]);
  });
});
