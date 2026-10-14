export type Vec = readonly number[];

export type Metric = 'x' | 'y' | 'norm' | 'distance' | 'sum_x' | 'sum_y';

const sameDim = (a: Vec, b: Vec): void => {
  if (a.length !== b.length) {
    throw new Error(`Dimensiones distintas: ${a.length} y ${b.length}`);
  }
};

export const add = (a: Vec, b: Vec): number[] => {
  sameDim(a, b);
  return a.map((v, i) => v + b[i]);
};

export const scale = (k: number, a: Vec): number[] => a.map((v) => k * v);

export const norm = (a: Vec): number => Math.sqrt(a.reduce((s, v) => s + v * v, 0));

export const distance = (a: Vec, b: Vec): number => {
  sameDim(a, b);
  return norm(a.map((v, i) => v - b[i]));
};

/** Número de ids de vectores que exige cada métrica. */
export const METRIC_ARITY: Record<Metric, 1 | 2> = {
  x: 1,
  y: 1,
  norm: 1,
  distance: 2,
  sum_x: 2,
  sum_y: 2,
};

/** `of` son ids de vectores del plano: uno para x, y, norm; dos para el resto. */
export const measure = (metric: Metric, of: string[], vectors: Record<string, Vec>): number => {
  const arity = METRIC_ARITY[metric];
  if (of.length !== arity) {
    throw new Error(`La métrica ${metric} exige ${arity} vector(es) y recibe ${of.length}`);
  }
  const vs = of.map((id) => {
    const v = Object.hasOwn(vectors, id) ? vectors[id] : undefined;
    if (!v) throw new Error(`Falta el vector «${id}»`);
    return v;
  });
  const [a, b] = vs;
  switch (metric) {
    case 'x':
      return a[0];
    case 'y':
      return a[1];
    case 'norm':
      return norm(a);
    case 'distance':
      return distance(a, b);
    case 'sum_x':
      return a[0] + b[0];
    case 'sum_y':
      return a[1] + b[1];
  }
};
