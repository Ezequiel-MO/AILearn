import type { LabControl, LabModel, LabState } from './types';

/**
 * Laboratorio «compresion»: la descomposición en valores singulares (SVD). Una matriz cualquiera (una
 * imagen, una tabla de pesos de una red) es una suma de «capas» de rango 1, σᵢ·uᵢ·vᵢᵀ, ordenadas de
 * más a menos importantes (σ₁ ≥ σ₂ ≥ …). Quedarse con las k primeras es la mejor aproximación de rango
 * k: se guarda mucho menos y se pierde poco. Así se comprimen pesos y por eso funciona LoRA.
 *
 * Mandos:
 * - `k` (modo `top`, por defecto): cuántas capas se suman, de 0 a min(filas, columnas), de 1 en 1.
 * - `c1`, `c2`, … (modo `pick`): un interruptor por capa, 0 (apagada) o 1 (se suma).
 *
 * Métricas:
 * - `k`: cuántas capas se suman.
 * - `error`: ‖A − A_k‖_F / ‖A‖_F, de 0 (idéntica) a 1 (no queda nada).
 * - `kept`: Σσᵢ² de las capas elegidas / Σσᵢ² de todas, de 0 a 1 (la «energía» conservada).
 * - `stored`: números que hay que guardar, k·(m + n + 1): k vectores de m, k de n y k valores σ.
 * - `full`: números de la matriz entera, m·n.
 * - `ratio`: `stored / full`.
 * - `rank`: cuántos σ no son nulos (rango de la matriz).
 * - `max_err`: el mayor error absoluto de una celda de la aproximación.
 * - `sigma_1`, `sigma_2`, …: cada valor singular, de mayor a menor.
 */

export interface CompresionSpec {
  kind: 'compresion';
  /** La matriz m×n (de 2×2 a 16×16). Una imagen lleva valores entre 0 (negro) y 1 (blanco). */
  rows: number[][];
  /** La matriz es una tabla de pesos con signo: se pinta con dos colores en vez de en gris. */
  signed?: true;
  /** `top`: un deslizador k con las k capas más importantes (por defecto). `pick`: una a una. */
  mode?: 'top' | 'pick';
  /** Valor inicial de k (por defecto 1) o, en `pick`, cuántas de las primeras empiezan activas (0). */
  start?: number;
  /** Rótulos de las filas y de las columnas (palabras y rasgos de una tabla de pesos, por ejemplo). */
  labels?: { rows?: string[]; cols?: string[] };
  /** Qué es la matriz: «Un dígito de 8×8 píxeles», «Pesos de una capa». */
  caption?: string;
  /** Lecturas del panel, por nombre de métrica, en este orden. */
  readouts?: string[];
}

/** Los σ menores que esta fracción de σ₁ se tratan como 0. */
const ZERO = 1e-10;

type Matrix = number[][];

const zeros = (m: number, n: number): Matrix =>
  Array.from({ length: m }, () => new Array(n).fill(0));

export interface Svd {
  /** Valores singulares, de mayor a menor (min(m, n) de ellos; los nulos, a 0). */
  sigma: number[];
  /** Capas de rango 1, σᵢ·uᵢ·vᵢᵀ, en el mismo orden. */
  layers: Matrix[];
}

/**
 * SVD por Jacobi de un lado (Hestenes): se giran pares de columnas de A hasta que son ortogonales;
 * entonces la norma de cada columna es σ y su dirección, u. El signo de cada par (u, v) se fija para
 * que la mayor componente de v sea positiva.
 */
export const svd = (rows: readonly (readonly number[])[]): Svd => {
  const m = rows.length;
  const n = rows[0]?.length ?? 0;
  // Columnas de trabajo (U·Σ) y columnas de V.
  const u: number[][] = Array.from({ length: n }, (_, c) => rows.map((r) => r[c]!));
  const v: number[][] = Array.from({ length: n }, (_, c) =>
    Array.from({ length: n }, (_, r) => (r === c ? 1 : 0)),
  );
  const dot = (a: readonly number[], b: readonly number[]): number =>
    a.reduce((s, x, k) => s + x * b[k]!, 0);

  for (let sweep = 0; sweep < 60; sweep++) {
    let rotated = false;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const alpha = dot(u[p]!, u[p]!);
        const beta = dot(u[q]!, u[q]!);
        const gamma = dot(u[p]!, u[q]!);
        if (gamma === 0 || Math.abs(gamma) <= 1e-15 * Math.sqrt(alpha * beta)) continue;
        rotated = true;
        const zeta = (beta - alpha) / (2 * gamma);
        const t = (zeta >= 0 ? 1 : -1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = c * t;
        for (const w of [u, v]) {
          const wp = w[p]!;
          const wq = w[q]!;
          for (let k = 0; k < wp.length; k++) {
            const a = wp[k]!;
            const b = wq[k]!;
            wp[k] = c * a - s * b;
            wq[k] = s * a + c * b;
          }
        }
      }
    }
    if (!rotated) break;
  }

  const norms = u.map((col) => Math.sqrt(dot(col, col)));
  const order = norms.map((_, k) => k).sort((a, b) => norms[b]! - norms[a]! || a - b);
  const top = norms[order[0] ?? 0] ?? 0;
  const count = Math.min(m, n);
  const sigma: number[] = [];
  const layers: Matrix[] = [];
  for (const idx of order.slice(0, count)) {
    const s = norms[idx]!;
    if (!(s > ZERO * top) || s === 0) {
      sigma.push(0);
      layers.push(zeros(m, n));
      continue;
    }
    const vi = v[idx]!;
    // Signo determinista del par (u, v): la componente de v con mayor valor absoluto (la primera si
    // hay empate) es positiva. Cambiar el signo de los dos a la vez no altera la capa σ·u·vᵀ.
    const big = Math.max(...vi.map(Math.abs));
    const lead = vi.find((x) => Math.abs(x) >= big - 1e-9)!;
    const sign = lead < 0 ? -1 : 1;
    const col = u[idx]!.map((x) => x * sign);
    const vs = vi.map((x) => x * sign);
    sigma.push(s);
    layers.push(col.map((x) => vs.map((y) => x * y)));
  }
  return { sigma, layers };
};

/** Todo lo que el dibujo y las métricas necesitan de un estado. */
export interface CompresionScene {
  m: number;
  n: number;
  /** Valores singulares, de mayor a menor. */
  sigma: number[];
  /** Las capas de rango 1, σᵢ·uᵢ·vᵢᵀ. */
  layers: Matrix[];
  /** La suma de las capas elegidas. */
  approx: Matrix;
  /** A − aproximación. */
  error: Matrix;
  /** Qué capas se suman. */
  chosen: boolean[];
}

const cache = new WeakMap<object, Svd>();
const decompose = (spec: CompresionSpec): Svd => {
  const hit = cache.get(spec.rows);
  if (hit) return hit;
  const out = svd(spec.rows);
  cache.set(spec.rows, out);
  return out;
};

const size = (spec: CompresionSpec): { m: number; n: number; r: number } => {
  const m = spec.rows.length;
  const n = spec.rows[0]?.length ?? 0;
  return { m, n, r: Math.min(m, n) };
};

const clampInt = (x: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, Math.trunc(x)));

export const compresionScene = (spec: CompresionSpec, state: LabState): CompresionScene => {
  const { m, n, r } = size(spec);
  const { sigma, layers } = decompose(spec);
  const chosen: boolean[] =
    (spec.mode ?? 'top') === 'pick'
      ? sigma.map((_, i) => (state[`c${i + 1}`] ?? 0) >= 0.5)
      : sigma.map((_, i) => i < clampInt(state.k ?? spec.start ?? 1, 0, r));
  const approx = zeros(m, n);
  layers.forEach((layer, i) => {
    if (!chosen[i]) return;
    for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) approx[a]![b]! += layer[a]![b]!;
  });
  const error = spec.rows.map((row, a) => row.map((x, b) => x - approx[a]![b]!));
  return { m, n, sigma, layers, approx, error, chosen };
};

const controls = (spec: CompresionSpec): LabControl[] => {
  const { r } = size(spec);
  if ((spec.mode ?? 'top') === 'pick') {
    const on = clampInt(spec.start ?? 0, 0, r);
    return Array.from({ length: r }, (_, i) => ({
      id: `c${i + 1}`,
      min: 0,
      max: 1,
      step: 1,
      start: i < on ? 1 : 0,
    }));
  }
  return [{ id: 'k', min: 0, max: r, step: 1, start: clampInt(spec.start ?? 1, 0, r) }];
};

const frob = (a: Matrix): number =>
  Math.sqrt(a.reduce((s, row) => s + row.reduce((t, x) => t + x * x, 0), 0));

const measure = (spec: CompresionSpec, state: LabState): Record<string, number> => {
  const scene = compresionScene(spec, state);
  const { m, n, sigma, chosen } = scene;
  const k = chosen.filter(Boolean).length;
  const energy = sigma.reduce((s, x) => s + x * x, 0);
  const kept = sigma.reduce((s, x, i) => s + (chosen[i] ? x * x : 0), 0);
  const norm = frob(spec.rows);
  const stored = k * (m + n + 1);
  const out: Record<string, number> = {
    k,
    error: norm === 0 ? NaN : frob(scene.error) / norm,
    kept: energy === 0 ? NaN : kept / energy,
    stored,
    full: m * n,
    ratio: stored / (m * n),
    rank: sigma.filter((x) => x > 0).length,
    max_err: Math.max(...scene.error.map((row) => Math.max(...row.map(Math.abs)))),
  };
  sigma.forEach((x, i) => {
    out[`sigma_${i + 1}`] = x;
  });
  return out;
};

export const compresion: LabModel<CompresionSpec> = { controls, measure };
