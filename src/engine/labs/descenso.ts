import { makeRng, pick } from '../rng';
import type { LabControl, LabModel, LabState } from './types';

/**
 * Laboratorio «descenso»: el descenso de gradiente sobre un paisaje de pérdida de dos parámetros.
 * Desde un punto de partida (los pesos iniciales) cada paso va en contra del gradiente, con un tamaño
 * que fija la tasa de aprendizaje. Se ve la trayectoria sobre el mapa de curvas de nivel, la pérdida
 * paso a paso y, si el paisaje sale de datos (`regression`), la recta que mejora.
 *
 * MANDOS (ids; solo existen los que la especificación deja variar):
 *   sx, sy  punto de partida (si `start.movable`), en la rejilla `start.snap`, dentro de la ventana
 *   lr      tasa de aprendizaje (si `rate` es un deslizador)
 *   n       número de pasos, de 1 a 200 (si `steps` es un deslizador)
 *   opt     índice en `optimizers` (si hay más de uno): 0 = el primero de la lista
 *   beta    coeficiente del momentum (si `beta` es un deslizador)
 *   batch   tamaño del minilote (si `batch.size` es un deslizador)
 *
 * MÉTRICAS (todas con el estado completo; un valor imposible es NaN):
 *   loss         pérdida del punto final (sobre todos los datos, también con minilotes)
 *   loss0        pérdida del punto de partida
 *   min_loss     la menor pérdida de todo el camino
 *   best         pérdida del mínimo global (NaN en una silla o si no hay mínimo)
 *   gap          loss − best
 *   dist         distancia del punto final al mínimo global (NaN si no hay)
 *   diverged     1 si la trayectoria se disparó (coordenada no finita o a más de 100 ventanas), si no 0
 *   steps        número de pasos pedidos
 *   lr           tasa de aprendizaje usada
 *   final_x      coordenada horizontal del punto final
 *   final_y      coordenada vertical del punto final
 *   first_below  primer paso (el 0 es la salida) con pérdida ≤ `threshold`; NaN si nunca o sin umbral
 *   turns        veces que el paso cambia de sentido en el eje horizontal (el zigzag)
 *   ups          pasos en los que la pérdida sube
 *
 * Optimizadores: sgd (p −= lr·g), momentum (v = β·v + g; p −= lr·v), rmsprop (decaimiento 0,9) y
 * adam (β₁ = 0,9, β₂ = 0,999, ε = 1e-8, con corrección de sesgo).
 */

/** Un deslizador: de `min` a `max` en pasos de `step`, empezando en `start`. */
export interface DescensoRange {
  min: number;
  max: number;
  step: number;
  start: number;
}

/** Un parámetro fijo (un número) o un mando deslizante. */
export type DescensoParam = number | DescensoRange;

export type DescensoOptimizer = 'sgd' | 'momentum' | 'rmsprop' | 'adam';

export type DescensoSurface =
  | {
      kind: 'quadratic';
      /** L = a·(x−x0)² + b·(y−y0)² + c·(x−x0)·(y−y0). Cuenco si a, b > 0; valle si a ≫ b; silla si a·b < 0. */
      a: number;
      b: number;
      c?: number;
      /** El centro (x0, y0). Por defecto, el origen. */
      center?: [number, number];
    }
  | {
      kind: 'regression';
      /** Pares [x, y]. L(w, b) = media de (w·x + b − y)²: el eje horizontal es w y el vertical b. */
      data: [number, number][];
    }
  | {
      kind: 'wells';
      /** Pozos gaussianos: cada uno resta `depth·exp(−d²/(2·width²))`. */
      wells: { x: number; y: number; depth: number; width: number }[];
      /** L = bowl·(x² + y²) − Σ pozos. Por defecto 0,05. */
      bowl?: number;
    };

export interface DescensoSpec {
  kind: 'descenso';
  /** El paisaje L(x, y). */
  surface: DescensoSurface;
  /** Lo que se dibuja. */
  window: { x: [number, number]; y: [number, number] };
  /** Nombres de los dos parámetros (los ejes). Por defecto «w» y «b». */
  axes?: [string, string];
  /** Punto de partida; si es movible hay mandos `sx`, `sy` con rejilla `snap` (0,5 por defecto). */
  start: { x: number; y: number; movable?: boolean; snap?: number };
  /** Tasa de aprendizaje: fija o deslizador `lr`. */
  rate: DescensoParam;
  /** Número de pasos (hasta 200): fijo o deslizador `n`. */
  steps: DescensoParam;
  /** Optimizadores que se pueden elegir (mando `opt`). Por defecto, solo `sgd`. */
  optimizers?: DescensoOptimizer[];
  /** Coeficiente del momentum: fijo o deslizador `beta`. Por defecto 0,9. */
  beta?: DescensoParam;
  /** Solo con `regression`: minilotes deterministas. `size` fijo o deslizador `batch`. */
  batch?: { size: DescensoParam; seed: number };
  /** Una pérdida «suficientemente buena»: se dibuja su curva de nivel y alimenta `first_below`. */
  threshold?: number;
  /** Lecturas del panel, por nombre de métrica, en este orden. */
  readouts?: string[];
}

export const DEFAULT_BETA = 0.9;
export const DEFAULT_BOWL = 0.05;
export const DEFAULT_SNAP = 0.5;
export const MAX_STEPS = 200;
const FAR = 100; // veces el tamaño de la ventana a partir de las cuales se da por disparada
const RMS_DECAY = 0.9;
const ADAM = { b1: 0.9, b2: 0.999, eps: 1e-8 };

// ---------- el paisaje ----------

interface Surface {
  loss(x: number, y: number): number;
  /** Gradiente; `rows` (solo en `regression`) limita los datos al minilote. */
  grad(x: number, y: number, rows?: readonly number[]): [number, number];
}

const makeSurface = (s: DescensoSurface): Surface => {
  if (s.kind === 'quadratic') {
    const [x0, y0] = s.center ?? [0, 0];
    const c = s.c ?? 0;
    return {
      loss: (x, y) => s.a * (x - x0) ** 2 + s.b * (y - y0) ** 2 + c * (x - x0) * (y - y0),
      grad: (x, y) => [2 * s.a * (x - x0) + c * (y - y0), 2 * s.b * (y - y0) + c * (x - x0)],
    };
  }
  if (s.kind === 'regression') {
    const data = s.data;
    const all = data.map((_, k) => k);
    return {
      loss: (w, b) => data.reduce((sum, [px, py]) => sum + (w * px + b - py) ** 2, 0) / data.length,
      grad: (w, b, rows = all) => {
        let gw = 0;
        let gb = 0;
        for (const k of rows) {
          const [px, py] = data[k]!;
          const r = w * px + b - py;
          gw += 2 * r * px;
          gb += 2 * r;
        }
        return [gw / rows.length, gb / rows.length];
      },
    };
  }
  const bowl = s.bowl ?? DEFAULT_BOWL;
  return {
    loss: (x, y) =>
      bowl * (x * x + y * y) -
      s.wells.reduce(
        (sum, w) =>
          sum + w.depth * Math.exp(-((x - w.x) ** 2 + (y - w.y) ** 2) / (2 * w.width ** 2)),
        0,
      ),
    grad: (x, y) => {
      let gx = 2 * bowl * x;
      let gy = 2 * bowl * y;
      for (const w of s.wells) {
        const e =
          (w.depth * Math.exp(-((x - w.x) ** 2 + (y - w.y) ** 2) / (2 * w.width ** 2))) /
          w.width ** 2;
        gx += e * (x - w.x);
        gy += e * (y - w.y);
      }
      return [gx, gy];
    },
  };
};

/** Mínimo global por búsqueda en rejilla fina afinada con descenso (con retroceso). */
const searchWells = (surf: Surface, window: DescensoSpec['window']): [number, number] => {
  const N = 160;
  let best: [number, number] = [window.x[0], window.y[0]];
  let bestLoss = Infinity;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = window.x[0] + ((window.x[1] - window.x[0]) * i) / N;
      const y = window.y[0] + ((window.y[1] - window.y[0]) * j) / N;
      const l = surf.loss(x, y);
      if (l < bestLoss) {
        bestLoss = l;
        best = [x, y];
      }
    }
  }
  let [x, y] = best;
  let l = bestLoss;
  let size = 0.1;
  for (let k = 0; k < 400; k++) {
    const [gx, gy] = surf.grad(x, y);
    const g2 = gx * gx + gy * gy;
    if (g2 < 1e-24) break;
    let step = size * 2;
    let moved = false;
    while (step > 1e-12) {
      const nx = x - step * gx;
      const ny = y - step * gy;
      const nl = surf.loss(nx, ny);
      if (nl < l - 1e-4 * step * g2) {
        x = nx;
        y = ny;
        l = nl;
        size = step;
        moved = true;
        break;
      }
      step /= 2;
    }
    if (!moved) break;
  }
  return [x, y];
};

const minimumCache = new WeakMap<DescensoSpec, [number, number] | null>();

/** El mínimo global del paisaje, o `null` si no lo hay (una silla, un valle sin fondo). */
const findMinimum = (spec: DescensoSpec, surf: Surface): [number, number] | null => {
  if (minimumCache.has(spec)) return minimumCache.get(spec)!;
  const s = spec.surface;
  let out: [number, number] | null = null;
  if (s.kind === 'quadratic') {
    const c = s.c ?? 0;
    if (s.a > 0 && 4 * s.a * s.b - c * c > 0) out = [...(s.center ?? [0, 0])] as [number, number];
  } else if (s.kind === 'regression') {
    const n = s.data.length;
    const mx = s.data.reduce((t, d) => t + d[0], 0) / n;
    const my = s.data.reduce((t, d) => t + d[1], 0) / n;
    const vx = s.data.reduce((t, d) => t + (d[0] - mx) ** 2, 0);
    if (vx > 0) {
      const w = s.data.reduce((t, d) => t + (d[0] - mx) * (d[1] - my), 0) / vx;
      out = [w, my - w * mx];
    }
  } else {
    out = searchWells(surf, spec.window);
  }
  minimumCache.set(spec, out);
  return out;
};

// ---------- parámetros ----------

const valueOf = (p: DescensoParam, state: LabState, id: string): number =>
  typeof p === 'number' ? p : Object.hasOwn(state, id) ? state[id]! : p.start;

const optimizersOf = (spec: DescensoSpec): DescensoOptimizer[] => spec.optimizers ?? ['sgd'];

/** Las opciones que usa el estado, ya asentadas. */
export const descensoParams = (spec: DescensoSpec, state: LabState) => {
  const opts = optimizersOf(spec);
  const optIndex = Math.min(Math.max(Math.round(state.opt ?? 0), 0), opts.length - 1);
  const rows = spec.surface.kind === 'regression' ? spec.surface.data.length : 0;
  return {
    sx: spec.start.movable && Object.hasOwn(state, 'sx') ? state.sx! : spec.start.x,
    sy: spec.start.movable && Object.hasOwn(state, 'sy') ? state.sy! : spec.start.y,
    lr: valueOf(spec.rate, state, 'lr'),
    n: Math.min(MAX_STEPS, Math.max(1, Math.round(valueOf(spec.steps, state, 'n')))),
    optIndex,
    optimizer: opts[optIndex]!,
    beta: spec.beta === undefined ? DEFAULT_BETA : valueOf(spec.beta, state, 'beta'),
    batch: spec.batch
      ? Math.min(rows, Math.max(1, Math.round(valueOf(spec.batch.size, state, 'batch'))))
      : null,
  };
};

// ---------- la escena ----------

export interface DescensoScene {
  /** Un punto por paso: el 0 es la salida. Se corta si la trayectoria se dispara. */
  path: [number, number][];
  /** Pérdida (sobre todos los datos) en cada punto del camino. */
  losses: number[];
  /** El mínimo global, o `null` si no lo hay. */
  minimum: [number, number] | null;
  lossAt: (x: number, y: number) => number;
  /** Gradiente completo en el punto de partida (la flecha del primer paso es −g). */
  grad0: [number, number];
  diverged: boolean;
  params: ReturnType<typeof descensoParams>;
}

export const descensoScene = (spec: DescensoSpec, state: LabState): DescensoScene => {
  const surf = makeSurface(spec.surface);
  const params = descensoParams(spec, state);
  const { lr, n, optimizer, beta, batch } = params;
  const w = spec.window;
  const size = Math.max(w.x[1] - w.x[0], w.y[1] - w.y[0]);
  const cx = (w.x[0] + w.x[1]) / 2;
  const cy = (w.y[0] + w.y[1]) / 2;

  const rng = spec.batch ? makeRng(spec.batch.seed) : null;
  const allRows = spec.surface.kind === 'regression' ? spec.surface.data.map((_, k) => k) : [];

  let x = params.sx;
  let y = params.sy;
  const path: [number, number][] = [[x, y]];
  const losses: number[] = [surf.loss(x, y)];
  let diverged = !Number.isFinite(losses[0]!);
  let vx = 0;
  let vy = 0; // velocidad (momentum), media de g² (rmsprop) o primer momento (adam)
  let sx = 0;
  let sy = 0; // segundo momento (adam)

  for (let t = 1; t <= n && !diverged; t++) {
    const rows = rng && batch !== null ? pick(rng, allRows, batch) : undefined;
    const [gx, gy] = surf.grad(x, y, rows);
    let dx: number;
    let dy: number;
    if (optimizer === 'momentum') {
      vx = beta * vx + gx;
      vy = beta * vy + gy;
      dx = lr * vx;
      dy = lr * vy;
    } else if (optimizer === 'rmsprop') {
      vx = RMS_DECAY * vx + (1 - RMS_DECAY) * gx * gx;
      vy = RMS_DECAY * vy + (1 - RMS_DECAY) * gy * gy;
      dx = (lr * gx) / (Math.sqrt(vx) + 1e-8);
      dy = (lr * gy) / (Math.sqrt(vy) + 1e-8);
    } else if (optimizer === 'adam') {
      vx = ADAM.b1 * vx + (1 - ADAM.b1) * gx;
      vy = ADAM.b1 * vy + (1 - ADAM.b1) * gy;
      sx = ADAM.b2 * sx + (1 - ADAM.b2) * gx * gx;
      sy = ADAM.b2 * sy + (1 - ADAM.b2) * gy * gy;
      const c1 = 1 - ADAM.b1 ** t;
      const c2 = 1 - ADAM.b2 ** t;
      dx = (lr * (vx / c1)) / (Math.sqrt(sx / c2) + ADAM.eps);
      dy = (lr * (vy / c1)) / (Math.sqrt(sy / c2) + ADAM.eps);
    } else {
      dx = lr * gx;
      dy = lr * gy;
    }
    const nx = x - dx;
    const ny = y - dy;
    const nl = surf.loss(nx, ny);
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nl)) {
      diverged = true;
      break;
    }
    x = nx;
    y = ny;
    path.push([x, y]);
    losses.push(nl);
    if (Math.abs(x - cx) > FAR * size || Math.abs(y - cy) > FAR * size) diverged = true;
  }

  return {
    path,
    losses,
    minimum: findMinimum(spec, surf),
    lossAt: surf.loss,
    grad0: surf.grad(params.sx, params.sy),
    diverged,
    params,
  };
};

// ---------- mandos y métricas ----------

const controls = (spec: DescensoSpec): LabControl[] => {
  const out: LabControl[] = [];
  const slider = (id: string, p: DescensoParam | undefined) => {
    if (p !== undefined && typeof p !== 'number') out.push({ id, ...p });
  };
  if (spec.start.movable) {
    const snap = spec.start.snap ?? DEFAULT_SNAP;
    out.push({
      id: 'sx',
      min: spec.window.x[0],
      max: spec.window.x[1],
      step: snap,
      start: spec.start.x,
    });
    out.push({
      id: 'sy',
      min: spec.window.y[0],
      max: spec.window.y[1],
      step: snap,
      start: spec.start.y,
    });
  }
  slider('lr', spec.rate);
  slider('n', spec.steps);
  const opts = optimizersOf(spec);
  if (opts.length > 1) out.push({ id: 'opt', min: 0, max: opts.length - 1, step: 1, start: 0 });
  slider('beta', spec.beta);
  slider('batch', spec.batch?.size);
  return out;
};

const measure = (spec: DescensoSpec, state: LabState): Record<string, number> => {
  const scene = descensoScene(spec, state);
  const { path, losses, minimum, lossAt, params } = scene;
  const last = path[path.length - 1]!;
  const loss = losses[losses.length - 1]!;
  const best = minimum ? lossAt(minimum[0], minimum[1]) : NaN;

  let firstBelow = NaN;
  if (spec.threshold !== undefined) {
    const k = losses.findIndex((l) => l <= spec.threshold!);
    if (k >= 0) firstBelow = k;
  }
  let turns = 0;
  for (let k = 2; k < path.length; k++) {
    const d0 = path[k - 1]![0] - path[k - 2]![0];
    const d1 = path[k]![0] - path[k - 1]![0];
    if (d0 * d1 < 0) turns++;
  }
  let ups = 0;
  for (let k = 1; k < losses.length; k++) if (losses[k]! > losses[k - 1]! + 1e-12) ups++;

  return {
    loss,
    loss0: losses[0]!,
    min_loss: Math.min(...losses),
    best,
    gap: loss - best,
    dist: minimum ? Math.hypot(last[0] - minimum[0], last[1] - minimum[1]) : NaN,
    diverged: scene.diverged ? 1 : 0,
    steps: params.n,
    lr: params.lr,
    final_x: last[0],
    final_y: last[1],
    first_below: firstBelow,
    turns,
    ups,
  };
};

export const descenso: LabModel<DescensoSpec> = { controls, measure };
