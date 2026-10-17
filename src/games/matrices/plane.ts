import type { PlaneSpec, PlaneVector } from '../../content/schema';

export interface TransformPlaneOptions {
  /** Posición de î (id `i`). Por defecto (1, 0). */
  i?: [number, number];
  /** Posición de ĵ (id `j`). Por defecto (0, 1). */
  j?: [number, number];
  /** Si î y ĵ se pueden arrastrar. Por defecto no. */
  movable?: boolean;
  /** Otros vectores del plano (por ejemplo, los que se transforman con `apply`). */
  extra?: PlaneVector[];
  /** Ids de vectores cuya imagen A·v se dibuja (no pueden ser î ni ĵ). */
  apply?: string[];
  /** Lecturas del panel: `'matrix'`, `'det'`, `'components'`… Por defecto ninguna. */
  readouts?: PlaneSpec['readouts'];
  /** Por defecto 3. Con dos vectores móviles, como mucho 6 (tope de alcanzabilidad). */
  range?: number;
  /** Por defecto 1. Con dos vectores móviles, al menos 0,5. */
  snap?: number;
}

/**
 * Plano con transformación para el juego «Matrices y transformaciones»: las columnas de la matriz
 * son î (id `i`) y ĵ (id `j`).
 *
 *   transformPlane({ movable: true, readouts: ['matrix'] })   // î y ĵ arrastrables desde la identidad
 *   transformPlane({ i: [1, 1], j: [-1, 1] })                 // una transformación fija
 *   transformPlane({ extra: [{ id: 'v', label: 'v', x: 1, y: 2, movable: false }], apply: ['v'] })
 */
export const transformPlane = (o: TransformPlaneOptions = {}): PlaneSpec => {
  const movable = o.movable ?? false;
  const [ix, iy] = o.i ?? [1, 0];
  const [jx, jy] = o.j ?? [0, 1];
  return {
    range: o.range ?? 3,
    snap: o.snap ?? 1,
    vectors: [
      { id: 'i', label: 'î', x: ix, y: iy, movable },
      { id: 'j', label: 'ĵ', x: jx, y: jy, movable },
      ...(o.extra ?? []),
    ],
    readouts: o.readouts ?? [],
    transform: { columns: ['i', 'j'], ...(o.apply ? { apply: o.apply } : {}) },
  };
};
