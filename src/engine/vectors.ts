export type Vec = readonly number[];

export type Metric =
  | 'x'
  | 'y'
  | 'norm'
  | 'distance'
  | 'sum_x'
  | 'sum_y'
  | 'dot'
  | 'cos'
  | 'angle'
  | 'proj'
  | 'det'
  | 'img_x'
  | 'img_y'
  | 'img_angle'
  | 'rayleigh';

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

/** Determinante de la matriz 2×2 cuyas columnas son a y b: a.x·b.y − a.y·b.x. */
export const det2 = (a: Vec, b: Vec): number => a[0] * b[1] - a[1] * b[0];

/** Imagen de v por la matriz de columnas i y j: v.x·i + v.y·j. */
export const applyColumns = (i: Vec, j: Vec, v: Vec): [number, number] => [
  v[0] * i[0] + v[1] * j[0],
  v[0] * i[1] + v[1] * j[1],
];

/** Número de ids de vectores que exige cada métrica. */
export const METRIC_ARITY: Record<Metric, 1 | 2 | 3> = {
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
  det: 2,
  img_x: 3,
  img_y: 3,
  img_angle: 3,
  rayleigh: 3,
};

/**
 * `of` son ids de vectores del plano: uno para x, y, norm; tres para img_x, img_y; dos para el resto.
 * `det` de `[a, b]` es el determinante de la matriz de columnas a y b; `img_x` e `img_y` de `[i, j, v]`
 * son las componentes de la imagen de v por la matriz de columnas i y j. `img_angle` de `[i, j, v]` es
 * el ángulo en grados entre v y su imagen A·v (NaN si v o A·v es nulo). `rayleigh` de `[i, j, v]` es
 * v·(A·v) / v·v: vale λ si v es autovector de autovalor λ; si A es una matriz de covarianza, es la
 * varianza de los datos en la dirección de v; no depende de la longitud de v (NaN si v es nulo).
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
  const [a, b, c] = vs;
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
    case 'det':
      return det2(a, b);
    case 'img_x':
      return applyColumns(a, b, c)[0];
    case 'img_y':
      return applyColumns(a, b, c)[1];
    case 'img_angle':
      return angle(c, applyColumns(a, b, c));
    case 'rayleigh': {
      const cc = dot(c, c);
      if (cc === 0) return NaN;
      return dot(c, applyColumns(a, b, c)) / cc;
    }
  }
};
