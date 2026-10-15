import { useState } from 'react';
import type { PlaneSpec } from '../../content/schema';
import { Layout } from '../Layout';
import { VectorPlane } from '../VectorPlane';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Plano de vectores (desarrollo)';

// Plano de ejemplo: dos vectores móviles y todas las lecturas. Solo existe en desarrollo.
const spec: PlaneSpec = {
  range: 6,
  snap: 0.5,
  vectors: [
    { id: 'u', label: 'u', x: 2, y: 1, movable: true },
    { id: 'v', label: 'v', x: 1, y: 3, movable: true },
  ],
  readouts: ['components', 'norm', 'distance', 'sum', 'dot', 'cos', 'angle', 'projection'],
  pair: ['u', 'v'],
};

export default function PlanoDev() {
  const [positions, setPositions] = useState<Record<string, [number, number]>>({
    u: [2, 1],
    v: [1, 3],
  });
  return (
    <Layout title={TITLE} back="/">
      <VectorPlane
        spec={spec}
        positions={positions}
        onMove={(id, to) => setPositions((p) => ({ ...p, [id]: to }))}
      />
    </Layout>
  );
}
