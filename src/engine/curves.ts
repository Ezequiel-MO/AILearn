/**
 * Funciones de una variable que se dibujan en el plano de curvas y se miden en sus metas. Son dato
 * (coeficientes o una tabla de datos), nunca código, y su derivada se calcula de forma exacta.
 */
export type Curve =
  /** f(x) = coefs[0] + coefs[1]·x + coefs[2]·x² + … */
  | { kind: 'poly'; coefs: readonly number[] }
  /**
   * La pérdida de un modelo de un solo parámetro, ŷ = w·x, sobre unos datos (x, y): el error
   * cuadrático medio L(w) = media de (w·xᵢ − yᵢ)². La variable del plano es w.
   */
  | { kind: 'mse'; data: readonly (readonly [number, number])[] };

export type CurveMetric = 'x' | 'y' | 'fx' | 'slope' | 'secant' | 'line_slope' | 'line_icpt';

/** Número de ids de puntos que exige cada métrica. */
export const CURVE_METRIC_ARITY: Record<CurveMetric, 1 | 2> = {
  x: 1,
  y: 1,
  fx: 1,
  slope: 1,
  secant: 2,
  line_slope: 2,
  line_icpt: 2,
};

/** Métricas que miden la curva: necesitan `curve` y sus puntos van sobre ella. */
export const ON_CURVE_METRICS: readonly CurveMetric[] = ['fx', 'slope', 'secant'];

/** Métricas de la recta que pasa por dos puntos libres, o de la altura de un punto libre. */
export const FREE_POINT_METRICS: readonly CurveMetric[] = ['y', 'line_slope', 'line_icpt'];

const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? NaN : xs.reduce((s, v) => s + v, 0) / xs.length;

/** Valor de la curva en x. */
export const curveAt = (c: Curve, x: number): number => {
  switch (c.kind) {
    case 'poly':
      // Horner, del coeficiente de mayor grado al término independiente
      return c.coefs.reduceRight((acc, k) => acc * x + k, 0);
    case 'mse':
      return mean(c.data.map(([xi, yi]) => (x * xi - yi) ** 2));
  }
};

/** Derivada exacta de la curva en x: la pendiente de la tangente. */
export const curveSlope = (c: Curve, x: number): number => {
  switch (c.kind) {
    case 'poly':
      return curveAt({ kind: 'poly', coefs: c.coefs.slice(1).map((k, i) => (i + 1) * k) }, x);
    case 'mse':
      return mean(c.data.map(([xi, yi]) => 2 * xi * (x * xi - yi)));
  }
};

/**
 * El valor de w que hace mínima la pérdida `mse`: Σxᵢyᵢ / Σxᵢ². NaN si todos los xᵢ son 0
 * (entonces la pérdida no depende de w).
 */
export const mseBest = (c: Extract<Curve, { kind: 'mse' }>): number => {
  const sxx = c.data.reduce((s, [xi]) => s + xi * xi, 0);
  if (sxx === 0) return NaN;
  return c.data.reduce((s, [xi, yi]) => s + xi * yi, 0) / sxx;
};

/** Pendiente de la recta que pasa por p y q. NaN si tienen la misma x (recta vertical). */
const lineSlope = (p: readonly number[], q: readonly number[]): number =>
  q[0] === p[0] ? NaN : (q[1] - p[1]) / (q[0] - p[0]);

/**
 * `of` son ids de puntos del plano de curvas, con su posición [x, y]. `x` e `y` son sus coordenadas;
 * `fx` es f(x) y `slope` es f′(x), la pendiente de la tangente; `secant` de `[p, q]` es la pendiente
 * de la secante, (f(q.x) − f(p.x)) / (q.x − p.x). `line_slope` y `line_icpt` de `[p, q]` son la
 * pendiente y la ordenada en el origen de la recta que pasa por los dos puntos (libres). `secant`,
 * `line_slope` y `line_icpt` dan NaN si los dos puntos tienen la misma x, y NaN no cumple ninguna meta.
 */
export const measureCurve = (
  metric: CurveMetric,
  of: readonly string[],
  points: Record<string, readonly number[]>,
  curve?: Curve,
): number => {
  const arity = CURVE_METRIC_ARITY[metric];
  if (of.length !== arity) {
    throw new Error(`La métrica ${metric} exige ${arity} punto(s) y recibe ${of.length}`);
  }
  const ps = of.map((id) => {
    const p = Object.hasOwn(points, id) ? points[id] : undefined;
    if (!p) throw new Error(`Falta el punto «${id}»`);
    return p;
  });
  const needCurve = (): Curve => {
    if (!curve) throw new Error(`La métrica ${metric} necesita una curva`);
    return curve;
  };
  const [p, q] = ps;
  switch (metric) {
    case 'x':
      return p[0];
    case 'y':
      return p[1];
    case 'fx':
      return curveAt(needCurve(), p[0]);
    case 'slope':
      return curveSlope(needCurve(), p[0]);
    case 'secant': {
      const c = needCurve();
      return q[0] === p[0] ? NaN : (curveAt(c, q[0]) - curveAt(c, p[0])) / (q[0] - p[0]);
    }
    case 'line_slope':
      return lineSlope(p, q);
    case 'line_icpt': {
      const m = lineSlope(p, q);
      return Number.isNaN(m) ? NaN : p[1] - m * p[0];
    }
  }
};
