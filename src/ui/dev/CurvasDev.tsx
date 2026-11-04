import { useState } from 'react';
import { graphPositions } from '../../content/grade';
import type { GraphSpec } from '../../content/schema';
import { CurvePlane } from '../CurvePlane';
import { Layout } from '../Layout';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Plano de curvas (desarrollo)';

// Parábola f(x) = x² − 2x − 1 (mínimo en x = 1) con tangente y derivada.
const parabola: GraphSpec = {
  x: [-2, 4],
  y: [-3, 6],
  snap: 0.5,
  curve: { kind: 'poly', coefs: [-1, -2, 1] },
  points: [{ id: 'p', label: 'P', x: 3, movable: true, onCurve: true }],
  readouts: ['coords', 'slope'],
  derivative: true,
};

// Secante entre dos puntos de la curva.
const secant: GraphSpec = {
  x: [-1, 5],
  y: [-2, 8],
  snap: 0.5,
  curve: { kind: 'poly', coefs: [0, 0, 0.5] },
  points: [
    { id: 'p', label: 'P', x: 1, movable: false, onCurve: true },
    { id: 'q', label: 'Q', x: 4, movable: true, onCurve: true },
  ],
  readouts: ['coords', 'secant'],
  pair: ['p', 'q'],
};

// Recta por dos puntos libres con su triángulo de avance y subida.
const line: GraphSpec = {
  x: [-4, 8],
  y: [-4, 8],
  snap: 1,
  points: [
    { id: 'a', label: 'A', x: 1, y: 1, movable: true },
    { id: 'b', label: 'B', x: 5, y: 4, movable: true },
  ],
  readouts: ['coords', 'line'],
  pair: ['a', 'b'],
};

// Pérdida mse con su panel de ajuste y el paso de descenso.
const loss: GraphSpec = {
  x: [-1, 5],
  y: [0, 40],
  snap: 0.25,
  curve: {
    kind: 'mse',
    data: [
      [1, 2],
      [2, 4],
      [3, 6],
    ],
  },
  points: [{ id: 'w', label: 'w', x: 4, movable: true, onCurve: true }],
  readouts: ['coords', 'slope'],
  labels: { x: 'w', y: 'pérdida' },
  derivative: true,
  step: { of: 'w', rate: 0.1 },
  fit: { of: 'w' },
};

function Demo({ spec }: { spec: GraphSpec }) {
  const [moved, setMoved] = useState<Record<string, [number, number]>>({});
  return (
    <CurvePlane
      spec={spec}
      positions={graphPositions(spec, moved)}
      onMove={(id, to) => setMoved((m) => ({ ...m, [id]: to }))}
    />
  );
}

export default function CurvasDev() {
  return (
    <Layout title={TITLE} back="/">
      <Demo spec={parabola} />
      <Demo spec={secant} />
      <Demo spec={line} />
      <Demo spec={loss} />
    </Layout>
  );
}
