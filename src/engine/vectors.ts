export type Vec = readonly number[];

export type Metric =
  'x' | 'y' | 'norm' | 'distance' | 'sum_x' | 'sum_y' | 'dot' | 'cos' | 'angle' | 'proj';

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

export const dot = (a: Vec, b: Vec): number => {
  sameDim(a, b);
  return a.reduce((s, v, i) => s + v * b[i], 0);
};

/** Coseno del ángulo entre a y b. NaN si alguno es el vector nulo (el ángulo no existe). */
export const cosine = (a: Vec, b: Vec): number => {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return NaN;
  return Math.min(1, Math.max(-1, dot(a, b) / (na * nb)));
};

/**
 * Ángulo entre a y b en grados, de 0 a 180. NaN si alguno es el vector nulo.
 * Con atan2 y no con acos(coseno): acos pierde precisión cerca de 0° y de 180°. En 2D,
 * atan2(|a×b|, a·b); en otras dimensiones, la fórmula de Kahan con los vectores reescalados.
 */
export const angle = (a: Vec, b: Vec): number => {
  sameDim(a, b);
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return NaN;
  const rad =
    a.length === 2
      ? Math.atan2(Math.abs(a[0] * b[1] - a[1] * b[0]), dot(a, b))
      : 2 *
        Math.atan2(
          norm(a.map((v, i) => v * nb - b[i] * na)),
          norm(a.map((v, i) => v * nb + b[i] * na)),
        );
  return (rad * 180) / Math.PI;
};

/** Proyección escalar de a sobre b: a·b / ‖b‖. NaN si b es el vector nulo. */
export const scalarProjection = (a: Vec, b: Vec): number => {
  const nb = norm(b);
  if (nb === 0) return NaN;
  return dot(a, b) / nb;
};

/** Vector proyección de a sobre b: (a·b / b·b) b. null si b es el vector nulo. */
export const projection = (a: Vec, b: Vec): number[] | null => {
  const bb = dot(b, b);
  if (bb === 0) return null;
  return scale(dot(a, b) / bb, b);
};

/** Número de ids de vectores que exige cada métrica. */
export const METRIC_ARITY: Record<Metric, 1 | 2> = {
  x: 1,
  y: 1,
  norm: 1,
  distance: 2,
  sum_x: 2,
  sum_y: 2,
  dot: 2,
  cos: 2,
  angle: 2,
  proj: 2,
};

/**
 * `of` son ids de vectores del plano: uno para x, y, norm; dos para el resto.
 * `proj` es la proyección escalar del primero sobre el segundo. `cos`, `angle` y `proj` dan NaN
 * cuando el ángulo no existe (vector nulo), y NaN no cumple ninguna meta.
 */
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
    case 'dot':
      return dot(a, b);
    case 'cos':
      return cosine(a, b);
    case 'angle':
      return angle(a, b);
    case 'proj':
      return scalarProjection(a, b);
  }
};
