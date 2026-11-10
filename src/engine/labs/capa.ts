import { mean, variance, type LabControl, type LabModel, type LabState, type Vec2 } from './types';

/**
 * Laboratorio «capa»: una nube de embeddings de juguete (palabras con dos rasgos) pasa por una capa
 * lineal, la matriz A cuyas columnas se arrastran. Se ve cada palabra antes y después, y lo que le
 * pasa a lo que viene detrás: la neurona siguiente que clasifica, la dirección sobre la que se
 * proyecta, las palabras que dejan de distinguirse.
 */

export interface CapaPoint {
  id: string;
  /** La palabra (o el nombre del dato) que se rotula. */
  label: string;
  x: number;
  y: number;
  /** Índice en `groups`. Sin grupo, el punto no cuenta para la neurona siguiente. */
  group?: number;
}

export interface CapaSpec {
  kind: 'capa';
  /** La ventana va de −range a range en los dos ejes. */
  range: number;
  /** Paso de la rejilla al arrastrar. */
  snap: number;
  points: CapaPoint[];
  /** Nombres de los grupos (la leyenda): el 0 y el 1 son los dos lados de la neurona siguiente. */
  groups?: string[];
  /** Nombre de cada rasgo de entrada (los ejes): «tamaño», «velocidad»… */
  axes?: [string, string];
  /** Columnas de A al empezar: adónde manda la capa el rasgo 1 y el rasgo 2. */
  i: [number, number];
  j: [number, number];
  /** Qué columnas se arrastran. Por defecto, las dos. */
  movable?: 'ij' | 'i' | 'j' | 'none';
  /** Una capa fija B que actúa antes que A: la salida es A·B·p. Se dibuja el paso intermedio. */
  before?: { i: [number, number]; j: [number, number] };
  /** La neurona siguiente: dice «grupo 1» si w·p′ + b > 0. Se dibuja su frontera y su lado. */
  readout?: { w: [number, number]; b: number };
  /**
   * Una dirección v desde el origen. Se dibujan su recta y la proyección de cada punto sobre ella:
   * los de salida (`output`, por defecto) o los de entrada (`input`).
   */
  probe?: { x: number; y: number; movable: boolean; on?: 'input' | 'output' };
  /** Dónde debería caer cada punto, por id. Se dibuja como una diana. */
  targets?: Record<string, [number, number]>;
  /** Dos puntos cuya distancia y coseno se leen, antes y después de la capa. */
  pair?: [string, string];
  /** Aplica A a v este número de veces y dibuja el camino (una red recurrente, una potencia). */
  iterate?: number;
  /** Dibuja la circunferencia unidad y su imagen. */
  circle?: true;
  /** Lecturas del panel, por nombre de métrica, en este orden. La matriz se enseña siempre. */
  readouts?: string[];
}

type M2 = readonly [number, number, number, number]; // [a, b, c, d] = [[a, b], [c, d]]

const apply = (m: M2, p: Vec2): [number, number] => [
  m[0] * p[0] + m[1] * p[1],
  m[2] * p[0] + m[3] * p[1],
];
const mul = (m: M2, n: M2): M2 => [
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
];
const det = (m: M2): number => m[0] * m[3] - m[1] * m[2];
const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];
const norm = (a: Vec2): number => Math.hypot(a[0], a[1]);
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cos = (a: Vec2, b: Vec2): number => {
  const n = norm(a) * norm(b);
  return n === 0 ? NaN : dot(a, b) / n;
};
const degrees = (c: number): number => (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;

const MERGED = 1e-6;
const iMovable = (s: CapaSpec): boolean => (s.movable ?? 'ij').includes('i');
const jMovable = (s: CapaSpec): boolean => (s.movable ?? 'ij').includes('j');

/** Todo lo que el dibujo y las métricas necesitan de un estado. */
export interface CapaScene {
  /** La capa del jugador, A. */
  a: M2;
  /** La capa fija anterior (la identidad si no hay). */
  b: M2;
  /** A·B: lo que le pasa a un punto de entrada. */
  total: M2;
  /** Posición de cada punto tras la capa fija (igual a la entrada si no hay) y tras A. */
  middle: Record<string, [number, number]>;
  images: Record<string, [number, number]>;
  /** La dirección v, o `null` si el laboratorio no la tiene. */
  v: [number, number] | null;
  /** Los puntos que se proyectan sobre v. */
  projected: Record<string, [number, number]>;
  /** v, A·v, A²·v… hasta `iterate`. */
  path: [number, number][];
}

export const capaScene = (spec: CapaSpec, state: LabState): CapaScene => {
  const get = (id: string, fallback: number): number =>
    Object.hasOwn(state, id) ? state[id]! : fallback;
  const a: M2 = [
    get('ix', spec.i[0]),
    get('jx', spec.j[0]),
    get('iy', spec.i[1]),
    get('jy', spec.j[1]),
  ];
  const b: M2 = spec.before
    ? [spec.before.i[0], spec.before.j[0], spec.before.i[1], spec.before.j[1]]
    : [1, 0, 0, 1];
  const total = mul(a, b);
  const middle: Record<string, [number, number]> = {};
  const images: Record<string, [number, number]> = {};
  for (const p of spec.points) {
    middle[p.id] = apply(b, [p.x, p.y]);
    images[p.id] = apply(a, middle[p.id]!);
  }
  const v: [number, number] | null = spec.probe
    ? [get('vx', spec.probe.x), get('vy', spec.probe.y)]
    : null;
  const projected: Record<string, [number, number]> = {};
  if (spec.probe) {
    for (const p of spec.points) {
      projected[p.id] = spec.probe.on === 'input' ? [p.x, p.y] : images[p.id]!;
    }
  }
  const path: [number, number][] = [];
  if (v) {
    let at = v;
    path.push(at);
    for (let k = 0; k < (spec.iterate ?? 0); k++) {
      at = apply(a, at);
      path.push(at);
    }
  }
  return { a, b, total, middle, images, v, projected, path };
};

const controls = (spec: CapaSpec): LabControl[] => {
  const out: LabControl[] = [];
  const coord = (id: string, start: number) =>
    out.push({ id, min: -spec.range, max: spec.range, step: spec.snap, start });
  if (iMovable(spec)) {
    coord('ix', spec.i[0]);
    coord('iy', spec.i[1]);
  }
  if (jMovable(spec)) {
    coord('jx', spec.j[0]);
    coord('jy', spec.j[1]);
  }
  if (spec.probe?.movable) {
    coord('vx', spec.probe.x);
    coord('vy', spec.probe.y);
  }
  return out;
};

const measure = (spec: CapaSpec, state: LabState): Record<string, number> => {
  const scene = capaScene(spec, state);
  const { a, total, images, v } = scene;
  const out: Record<string, number> = {
    m11: a[0],
    m12: a[1],
    m21: a[2],
    m22: a[3],
    det: det(a),
    area: Math.abs(det(a)),
    det_total: det(total),
  };

  const pts = spec.points;
  const imgs = pts.map((p) => images[p.id]!);

  // Palabras que la capa deja en el mismo sitio: ya no se pueden distinguir.
  let merged = 0;
  for (let p = 0; p < imgs.length; p++) {
    for (let q = p + 1; q < imgs.length; q++) {
      if (dist(imgs[p]!, imgs[q]!) < MERGED) merged++;
    }
  }
  out.merged = merged;
  out.spread_x = variance(imgs.map((p) => p[0]));
  out.spread_y = variance(imgs.map((p) => p[1]));

  if (spec.readout) {
    const { w, b } = spec.readout;
    const labelled = pts.filter((p) => p.group === 0 || p.group === 1);
    const wn = norm(w);
    let right = 0;
    let margin = Infinity;
    for (const p of labelled) {
      const s = dot(w, images[p.id]!) + b;
      const signed = (p.group === 1 ? s : -s) / wn;
      if (signed > 1e-9) right++;
      margin = Math.min(margin, signed);
    }
    out.acc = labelled.length === 0 ? NaN : right / labelled.length;
    out.hits = right;
    out.margin = labelled.length === 0 ? NaN : margin;
  }

  if (spec.targets) {
    let worst = 0;
    let home = 0;
    for (const [id, to] of Object.entries(spec.targets)) {
      const at = images[id];
      if (!at) continue;
      const d = dist(at, to);
      worst = Math.max(worst, d);
      if (d < 1e-6) home++;
    }
    out.target_err = worst;
    out.on_target = home;
  }

  if (spec.pair) {
    const [pa, pb] = spec.pair.map((id) => pts.find((p) => p.id === id));
    if (pa && pb) {
      const a0: Vec2 = [pa.x, pa.y];
      const b0: Vec2 = [pb.x, pb.y];
      out.pair_dist0 = dist(a0, b0);
      out.pair_cos0 = cos(a0, b0);
      out.pair_dist = dist(images[pa.id]!, images[pb.id]!);
      out.pair_cos = cos(images[pa.id]!, images[pb.id]!);
    }
  }

  if (v) {
    const vn = norm(v);
    const av = apply(a, v);
    out.v_norm = vn;
    out.img_angle = vn === 0 ? NaN : degrees(cos(v, av));
    out.stretch = vn === 0 ? NaN : norm(av) / vn;
    out.rayleigh = vn === 0 ? NaN : dot(v, av) / (vn * vn);
    const last = scene.path[scene.path.length - 1]!;
    out.iter_norm = norm(last);

    const source = pts.map((p) => scene.projected[p.id]!);
    const along = source.map((p) => (vn === 0 ? NaN : dot(p, v) / vn));
    const total_var = variance(source.map((p) => p[0])) + variance(source.map((p) => p[1]));
    out.var_v = variance(along);
    out.var_frac = total_var === 0 ? NaN : out.var_v / total_var;
    // Lo que se pierde al quedarse solo con la coordenada sobre v: la media de la distancia² a la recta.
    out.lost = total_var - out.var_v;

    const g0 = along.filter((_, k) => pts[k]!.group === 0);
    const g1 = along.filter((_, k) => pts[k]!.group === 1);
    if (g0.length > 0 && g1.length > 0) {
      const m0 = mean(g0);
      const m1 = mean(g1);
      out.sep_v = Math.abs(m1 - m0);
      // Aciertos de la mejor regla «a un lado u otro del punto medio» sobre la recta de v.
      const mid = (m0 + m1) / 2;
      const side = m1 >= m0 ? 1 : -1;
      const ok =
        g0.filter((t) => (t - mid) * side < -1e-9).length +
        g1.filter((t) => (t - mid) * side > 1e-9).length;
      out.acc_v = ok / (g0.length + g1.length);
      // Hueco entre los dos grupos sobre la recta: positivo si no se mezclan.
      out.gap_v =
        side === 1 ? Math.min(...g1) - Math.max(...g0) : Math.min(...g0) - Math.max(...g1);
    }
  }
  return out;
};

export const capa: LabModel<CapaSpec> = { controls, measure };
