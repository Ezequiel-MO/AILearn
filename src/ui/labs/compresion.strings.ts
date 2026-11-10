import type { ValueFormat } from './show';

/** Textos fijos del laboratorio «compresion». `src/ui/strings.ts` los publicará como `t.labs.compresion`. */
export const compresionStrings = {
  figure: (m: number, n: number) => `Una matriz de ${m} por ${n} y su aproximación por capas`,
  original: 'Original',
  approx: (k: number) => (k === 1 ? 'Con 1 capa' : `Con ${k} capas`),
  lost: 'Lo que se pierde',
  matrixLabel: (name: string) => `${name}, en una rejilla de celdas`,
  layers: 'Capas de rango 1',
  layersNote: 'La aproximación es la suma de las capas resaltadas.',
  layer: (i: number, sigma: string, on: boolean) =>
    `Capa ${i}, σ = ${sigma}${on ? ', suma' : ', apagada'}`,
  sigmas: 'Valores singulares',
  sigmaRow: (i: number) => `σ${i}`,
  storage: 'Almacenamiento',
  storageFull: (n: number) => `Matriz entera: ${n} números`,
  storageKept: (n: number) => `Capas elegidas: ${n} números`,
  sliderLabel: 'Capas que se suman (k)',
  pickLegend: 'Capas que se suman',
  pickOption: (i: number) => `Capa ${i}`,
  /** El rótulo de una lectura, por nombre de métrica. */
  metric: (m: string): string => {
    const sigma = /^sigma_(\d+)$/.exec(m);
    if (sigma) return `Valor singular σ${sigma[1]}`;
    const known: Record<string, string> = {
      k: 'Capas que se suman',
      error: 'Error de la aproximación',
      kept: 'Parte conservada',
      stored: 'Números guardados',
      full: 'Números de la matriz entera',
      ratio: 'Guardado respecto al total',
      rank: 'Rango (σ no nulos)',
      max_err: 'Mayor error en una celda',
    };
    return known[m] ?? m;
  },
};

/** Cómo se escribe cada métrica que no es un decimal corriente. */
export const compresionFormats: Record<string, ValueFormat> = {
  k: 'integer',
  error: 'percent',
  kept: 'percent',
  stored: 'integer',
  full: 'integer',
  ratio: 'percent',
  rank: 'integer',
};
