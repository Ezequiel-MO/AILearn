import type { ValueFormat } from './show';

/** Textos fijos del laboratorio «capa». `src/ui/strings.ts` los publica como `t.labs.capa`. */
export const capaStrings = {
  figure: (n: number) => `Una capa lineal mueve ${n} palabras del plano`,
  legend: 'Grupos',
  zone: (group: string) =>
    `La neurona siguiente responde «${group}» a todo lo que cae en la zona sombreada.`,
  matrix: 'Pesos de la capa A',
  /** Las dos salidas de la capa: los ejes del dibujo cuando la capa está a la vista y las filas de A. */
  outputs: ['salida 1', 'salida 2'] as [string, string],
  column: (name: string, feature?: string) =>
    feature ? `${name}: adónde va «${feature}»` : `columna ${name}`,
  before: 'Los cuadraditos marcan dónde deja cada palabra la primera capa, antes de A.',
  handleI: (at: string) => `Columna î de la capa, en ${at}`,
  handleJ: (at: string) => `Columna ĵ de la capa, en ${at}`,
  handleV: (at: string) => `Dirección v, en ${at}`,
  /** El rótulo de una lectura, por nombre de métrica. */
  metric: (
    m: string,
    spec: { points: { id: string; label: string }[]; pair?: [string, string] },
  ): string => {
    const name = (id?: string) => spec.points.find((p) => p.id === id)?.label ?? '';
    const both = `«${name(spec.pair?.[0])}» y «${name(spec.pair?.[1])}»`;
    const known: Record<string, string> = {
      det: 'Determinante de A',
      area: 'Por cuánto multiplica las áreas',
      det_total: 'Determinante de las dos capas juntas',
      merged: 'Parejas de palabras que caen en el mismo punto',
      spread_x: 'Varianza de la primera coordenada de salida',
      spread_y: 'Varianza de la segunda coordenada de salida',
      acc: 'Aciertos de la neurona siguiente',
      hits: 'Palabras bien clasificadas',
      margin: 'Margen de la palabra más justa',
      target_err: 'Distancia a su diana de la palabra más lejana',
      on_target: 'Palabras en su diana',
      pair_dist0: `Distancia entre ${both}, antes`,
      pair_dist: `Distancia entre ${both}, después`,
      pair_cos0: `Coseno entre ${both}, antes`,
      pair_cos: `Coseno entre ${both}, después`,
      v_norm: 'Longitud de v',
      img_angle: 'Ángulo entre v y A·v',
      stretch: 'Cuánto estira A a v',
      rayleigh: 'vᵀAv / vᵀv',
      iter_norm: 'Longitud tras aplicar A varias veces',
      iter_turn: 'Giro del último paso',
      cov_xy: 'Covarianza entre las dos coordenadas de salida',
      asym: 'Lo que le falta a A para ser simétrica',
      var_v: 'Varianza sobre la recta de v',
      var_frac: 'Parte de la varianza que conserva la recta de v',
      lost: 'Varianza que se pierde',
      sep_v: 'Separación entre los grupos sobre v',
      acc_v: 'Aciertos mirando solo la coordenada sobre v',
      gap_v: 'Hueco entre los grupos sobre v',
    };
    return known[m] ?? m;
  },
};

/** Cómo se escribe cada métrica que no es un decimal corriente. */
export const capaFormats: Record<string, ValueFormat> = {
  acc: 'percent',
  acc_v: 'percent',
  var_frac: 'percent',
  merged: 'integer',
  hits: 'integer',
  on_target: 'integer',
  img_angle: 'degrees',
  iter_turn: 'degrees',
};
