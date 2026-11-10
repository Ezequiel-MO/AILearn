import { fmt } from '../format';
import type { ValueFormat } from './show';

/** Un entero grande con espacios finos entre grupos de tres cifras: «16 777 216». */
export const groupedInt = (n: number): string =>
  Number.isFinite(n)
    ? Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : fmt(n);

/** Textos fijos del laboratorio «lora». */
export const loraStrings = {
  figure: (n: number) => `Afinar una capa: ${n} palabras antes y después de la corrección`,
  legend: 'Grupos',
  zone: (group: string) =>
    `La neurona siguiente responde «${group}» a todo lo que cae en la zona sombreada.`,
  note: 'El círculo hueco es donde deja cada palabra el modelo original; el punto, el modelo afinado.',
  noteLora:
    'Con rango 1, todas las flechas salen paralelas a B: la corrección empuja a todas en la misma dirección.',
  noteFull: 'Con ΔW entera, cada palabra puede ir en su propia dirección.',
  directionB: 'B',
  matrices: 'Las matrices de la capa',
  frozen: 'W (congelada)',
  trained: '+ B·A (lo que se entrena)',
  trainedFull: '+ ΔW (todo se entrena)',
  tuned: '= W afinada',
  padlock: 'Congelada: no se entrena',
  groupB: 'B: hacia dónde empuja',
  groupA: 'A: qué lee de la palabra',
  groupD: 'ΔW: la corrección entera',
  sliderB1: 'B, arriba (b₁)',
  sliderB2: 'B, abajo (b₂)',
  sliderA1: 'A, izquierda (a₁)',
  sliderA2: 'A, derecha (a₂)',
  sliderD: (row: number, col: number) => `ΔW, fila ${row} columna ${col}`,
  size: 'Una capa de tamaño real',
  sizeLine: (d: number, k: number) => `Matriz de ${groupedInt(d)} × ${groupedInt(k)}`,
  full: 'Ajuste completo: d·k',
  loraBar: 'LoRA: r·(d + k)',
  rank: 'Rango r de la corrección',
  percent: (pct: string) => `LoRA entrena el ${pct} % de los parámetros`,
  barFull: (n: number) => `Ajuste completo: ${groupedInt(n)} parámetros`,
  barLora: (n: number) => `LoRA: ${groupedInt(n)} parámetros`,
  /** El rótulo de una lectura, por nombre de métrica. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- la firma `(nombre, spec)` es la de los demás laboratorios
  metric: (m: string, _spec?: unknown): string => {
    const known: Record<string, string> = {
      acc: 'Aciertos de la neurona siguiente',
      hits: 'Palabras bien clasificadas',
      margin: 'Margen de la palabra más justa',
      target_err: 'Distancia a su diana de la palabra más lejana',
      on_target: 'Palabras en su diana',
      delta_rank: 'Rango de la corrección ΔW',
      delta_norm: 'Tamaño de la corrección ΔW',
      moved: 'Lo que más se mueve una palabra',
      r: 'Rango r',
      params_full: 'Parámetros del ajuste completo',
      params_lora: 'Parámetros que entrena LoRA',
      saving: 'LoRA entrena esta parte del total',
      saving_pct: 'LoRA entrena, en % del ajuste completo',
    };
    return known[m] ?? m;
  },
};

/** Cómo se escribe cada métrica que no es un decimal corriente. */
export const loraFormats: Record<string, ValueFormat> = {
  acc: 'percent',
  hits: 'integer',
  on_target: 'integer',
  delta_rank: 'integer',
  r: 'integer',
};

/** Las métricas que son recuentos grandes. */
export const loraBigMetrics: ReadonlySet<string> = new Set(['params_full', 'params_lora']);
