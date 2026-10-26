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

// Transformación lineal: î y ĵ móviles (las columnas de A) y un v fijo cuya imagen A·v se dibuja.
const transformSpec: PlaneSpec = {
  range: 6,
  snap: 0.5,
  vectors: [
    { id: 'i', label: 'î', x: 1, y: 0, movable: true },
    { id: 'j', label: 'ĵ', x: 0, y: 1, movable: true },
    { id: 'v', label: 'v', x: 2, y: 1, movable: false },
  ],
  readouts: ['matrix', 'det'],
  transform: { columns: ['i', 'j'], apply: ['v'] },
};

// Autovectores: A = (2 1; 1 2), un v móvil, las lecturas de A·v y la elipse imagen de la circunferencia.
const eigenSpec: PlaneSpec = {
  range: 4,
  snap: 0.5,
  vectors: [
    { id: 'i', label: 'î', x: 2, y: 1, movable: false },
    { id: 'j', label: 'ĵ', x: 1, y: 2, movable: false },
    { id: 'v', label: 'v', x: 1, y: 0, movable: true },
  ],
  readouts: ['matrix', 'image', 'img_angle', 'rayleigh'],
  transform: { columns: ['i', 'j'], apply: ['v'] },
  circle: 1,
  circleImage: true,
};

export default function PlanoDev() {
  const [positions, setPositions] = useState<Record<string, [number, number]>>({
    u: [2, 1],
    v: [1, 3],
  });
  const [matrix, setMatrix] = useState<Record<string, [number, number]>>({
    i: [1, 0],
    j: [0, 1],
    v: [2, 1],
  });
  const [eigen, setEigen] = useState<Record<string, [number, number]>>({
    i: [2, 1],
    j: [1, 2],
    v: [1, 0],
  });
  return (
    <Layout title={TITLE} back="/">
      <VectorPlane
        spec={spec}
        positions={positions}
        onMove={(id, to) => setPositions((p) => ({ ...p, [id]: to }))}
      />
      <VectorPlane
        spec={transformSpec}
        positions={matrix}
        onMove={(id, to) => setMatrix((p) => ({ ...p, [id]: to }))}
      />
      <VectorPlane
        spec={eigenSpec}
        positions={eigen}
        onMove={(id, to) => setEigen((p) => ({ ...p, [id]: to }))}
      />
    </Layout>
  );
}
