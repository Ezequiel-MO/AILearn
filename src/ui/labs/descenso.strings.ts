import type { ValueFormat } from './show';

/** Textos fijos del laboratorio «descenso». `src/ui/strings.ts` los publicará como `t.labs.descenso`. */
export const descensoStrings = {
  figure: (steps: number) => `Mapa de la pérdida con el camino de ${steps} pasos de descenso`,
  lossChart: 'La pérdida paso a paso',
  lossChartLabel: 'Gráfica de la pérdida en cada paso',
  dataChart: 'Los datos y la recta',
  dataChartLabel: 'Datos y rectas ajustadas: la de salida y la del punto final',
  stepAxis: 'paso',
  lossAxis: 'pérdida',
  threshold: 'umbral',
  minimum: 'mínimo',
  start: 'salida',
  lineStart: 'recta de salida',
  lineEnd: 'recta final',
  diverged: 'El descenso se ha disparado: la tasa es demasiado grande.',
  legend: 'Las zonas claras tienen poca pérdida; las oscuras, mucha.',
  handleStart: (at: string) => `Punto de partida, en ${at}`,
  controls: {
    rate: 'Tasa de aprendizaje',
    steps: 'Pasos',
    beta: 'Coeficiente del momentum (β)',
    batch: 'Tamaño del minilote',
    optimizer: 'Optimizador',
  },
  optimizers: {
    sgd: 'Descenso simple',
    momentum: 'Momentum',
    rmsprop: 'RMSProp',
    adam: 'Adam',
  },
  /** El rótulo de una lectura, por nombre de métrica. */
  metric: (m: string): string => {
    const known: Record<string, string> = {
      loss: 'Pérdida final',
      loss0: 'Pérdida de salida',
      min_loss: 'Menor pérdida del camino',
      best: 'Pérdida del mínimo',
      gap: 'Lo que falta para el mínimo',
      dist: 'Distancia al mínimo',
      diverged: 'Se ha disparado (1 sí, 0 no)',
      steps: 'Pasos',
      lr: 'Tasa de aprendizaje',
      final_x: 'Posición final, eje horizontal',
      final_y: 'Posición final, eje vertical',
      first_below: 'Primer paso por debajo del umbral',
      turns: 'Cambios de sentido (zigzag)',
      ups: 'Pasos en los que la pérdida sube',
    };
    return known[m] ?? m;
  },
};

/** Cómo se escribe cada métrica que no es un decimal corriente. */
export const descensoFormats: Record<string, ValueFormat> = {
  diverged: 'integer',
  steps: 'integer',
  first_below: 'integer',
  turns: 'integer',
  ups: 'integer',
};
