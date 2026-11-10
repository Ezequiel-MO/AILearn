import type { LabControl, LabModel, LabState, Vec2 } from './types';

/**
 * Laboratorio «lora»: afinar un modelo sin tocar sus pesos. La matriz W de una capa se congela y solo se
 * entrena una corrección de rango bajo ΔW = B·A (en rango 1, B es una columna y A una fila). La capa
 * afinada es W + B·A. Se ve cada palabra en el modelo original (W·x), en el afinado ((W + B·A)·x) y el
 * desplazamiento entre ambos: con rango 1 todos salen paralelos a B, cada uno una cantidad distinta
 * (A·x, lo que A «lee» de la palabra). Con `size` se cuentan los parámetros de una capa real.
 *
 * MANDOS (ids)
 *  - modo 'lora' (por defecto): `b1`, `b2` (la columna B) y `a1`, `a2` (la fila A); ΔW = B·A.
 *    Por defecto empiezan en B = (0, 0) y A = (1, 0): con B = 0 el modelo afinado es el original.
 *  - modo 'full': `d11`, `d12`, `d21`, `d22` (ΔW entera, para comparar); empiezan en 0.
 *  - con `size`: `r`, el rango de la corrección (solo cuenta parámetros; el plano es de rango 1).
 *  `start` da los cuatro primeros en el orden anterior. Van de −limit a limit en pasos de `step`.
 *
 * MÉTRICAS (nombre: significado)
 *  - acc, hits, margin (con `readout`): aciertos (0 a 1), palabras bien clasificadas y margen de la más
 *    justa, con las palabras afinadas.
 *  - target_err, on_target (con `targets`): distancia de la palabra más lejana a su diana y cuántas
 *    están en ella, con las palabras afinadas.
 *  - delta_rank: rango de ΔW (0, 1 o 2; tolerancia 1e-9).
 *  - delta_norm: norma de Frobenius de ΔW.
 *  - moved: el mayor desplazamiento de una palabra entre el modelo original y el afinado.
 *  - w11, w12, w21, w22: W; m11…m22: W + ΔW; d11…d22: ΔW.
 *  - con `size`: r, params_full (d·k), params_lora (r·(d + k)), saving (params_lora / params_full) y
 *    saving_pct (saving en %, para que una meta «≤ 1 %» se escriba con un decimal corriente).
 */

export interface LoraPoint {
  id: string;
  /** La palabra (o el nombre del dato) que se rotula. */
  label: string;
  x: number;
  y: number;
  /** Índice en `groups`. Sin grupo, el punto no cuenta para la neurona siguiente. */
  group?: number;
}

export interface LoraSpec {
  kind: 'lora';
  /** La ventana va de −range a range en los dos ejes. */
  range: number;
  points: LoraPoint[];
  /** Nombres de los grupos (la leyenda): el 0 y el 1 son los dos lados de la neurona siguiente. */
  groups?: string[];
  /** Nombre de cada rasgo de entrada (los ejes). */
  axes?: [string, string];
  /** Las columnas de la matriz congelada W. */
  w: { i: [number, number]; j: [number, number] };
  /** 'lora': ΔW = B·A (rango 1). 'full': ΔW entera, cuatro números (para comparar). Por defecto 'lora'. */
  mode?: 'lora' | 'full';
  /** Los deslizadores van de −limit a limit. */
  limit: number;
  /** Paso de los deslizadores. */
  step: number;
  /** Valores iniciales de los cuatro mandos, en el orden de la cabecera. */
  start?: number[];
  /** La neurona siguiente: responde «grupo 1» si w·p′ + b > 0. */
  readout?: { w: [number, number]; b: number };
  /** Dónde debería caer cada palabra afinada, por id. */
  targets?: Record<string, [number, number]>;
  /** Una capa de tamaño real para contar parámetros, con un deslizador `r` (el rango). */
  size?: { d: number; k: number; r: { min: number; max: number; step: number; start: number } };
  /** Lecturas del panel, por nombre de métrica, en este orden. Las matrices se enseñan siempre. */
  readouts?: string[];
}

type M2 = readonly [number, number, number, number]; // [a, b, c, d] = [[a, b], [c, d]]

const apply = (m: M2, p: Vec2): [number, number] => [
  m[0] * p[0] + m[1] * p[1],
  m[2] * p[0] + m[3] * p[1],
];
const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

const RANK_TOL = 1e-9;

export const loraMode = (spec: LoraSpec): 'lora' | 'full' => spec.mode ?? 'lora';

/** Todo lo que el dibujo y las métricas necesitan de un estado. */
export interface LoraScene {
  /** W, la matriz congelada. */
  w: M2;
  /** ΔW: B·A en modo lora, la que se escribe a mano en modo full. */
  delta: M2;
  /** W + ΔW, la capa afinada. */
  tuned: M2;
  /** La columna B y la fila A (solo en modo lora). */
  b: [number, number];
  a: [number, number];
  /** Cada palabra en el modelo original (W·x) y en el afinado ((W + ΔW)·x). */
  original: Record<string, [number, number]>;
  afterTuning: Record<string, [number, number]>;
}

export const loraScene = (spec: LoraSpec, state: LabState): LoraScene => {
  const get = (id: string, fallback: number): number =>
    Object.hasOwn(state, id) ? state[id]! : fallback;
  const start = (k: number, fallback: number): number => spec.start?.[k] ?? fallback;
  const w: M2 = [spec.w.i[0], spec.w.j[0], spec.w.i[1], spec.w.j[1]];
  const b: [number, number] = [get('b1', start(0, 0)), get('b2', start(1, 0))];
  const a: [number, number] = [get('a1', start(2, 1)), get('a2', start(3, 0))];
  const delta: M2 =
    loraMode(spec) === 'lora'
      ? [b[0] * a[0], b[0] * a[1], b[1] * a[0], b[1] * a[1]]
      : [
          get('d11', start(0, 0)),
          get('d12', start(1, 0)),
          get('d21', start(2, 0)),
          get('d22', start(3, 0)),
        ];
  const tuned: M2 = [w[0] + delta[0], w[1] + delta[1], w[2] + delta[2], w[3] + delta[3]];
  const original: Record<string, [number, number]> = {};
  const afterTuning: Record<string, [number, number]> = {};
  for (const p of spec.points) {
    original[p.id] = apply(w, [p.x, p.y]);
    afterTuning[p.id] = apply(tuned, [p.x, p.y]);
  }
  return { w, delta, tuned, b, a, original, afterTuning };
};

const controls = (spec: LoraSpec): LabControl[] => {
  const out: LabControl[] = [];
  const slider = (id: string, k: number, fallback: number) =>
    out.push({
      id,
      min: -spec.limit,
      max: spec.limit,
      step: spec.step,
      start: spec.start?.[k] ?? fallback,
    });
  if (loraMode(spec) === 'lora') {
    slider('b1', 0, 0);
    slider('b2', 1, 0);
    slider('a1', 2, 1);
    slider('a2', 3, 0);
  } else {
    slider('d11', 0, 0);
    slider('d12', 1, 0);
    slider('d21', 2, 0);
    slider('d22', 3, 0);
  }
  if (spec.size) out.push({ id: 'r', ...spec.size.r });
  return out;
};

const measure = (spec: LoraSpec, state: LabState): Record<string, number> => {
  const { w, delta, tuned, original, afterTuning } = loraScene(spec, state);
  const out: Record<string, number> = {
    w11: w[0],
    w12: w[1],
    w21: w[2],
    w22: w[3],
    m11: tuned[0],
    m12: tuned[1],
    m21: tuned[2],
    m22: tuned[3],
    d11: delta[0],
    d12: delta[1],
    d21: delta[2],
    d22: delta[3],
  };

  const det = delta[0] * delta[3] - delta[1] * delta[2];
  const zero = delta.every((v) => Math.abs(v) < RANK_TOL);
  out.delta_rank = zero ? 0 : Math.abs(det) < RANK_TOL ? 1 : 2;
  out.delta_norm = Math.hypot(...delta);

  const pts = spec.points;
  out.moved = Math.max(...pts.map((p) => dist(original[p.id]!, afterTuning[p.id]!)));

  if (spec.readout) {
    const { w: rw, b } = spec.readout;
    const labelled = pts.filter((p) => p.group === 0 || p.group === 1);
    const wn = Math.hypot(rw[0], rw[1]);
    let right = 0;
    let margin = Infinity;
    for (const p of labelled) {
      const s = dot(rw, afterTuning[p.id]!) + b;
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
      const at = afterTuning[id];
      if (!at) continue;
      const d = dist(at, to);
      worst = Math.max(worst, d);
      if (d < 1e-6) home++;
    }
    out.target_err = worst;
    out.on_target = home;
  }

  if (spec.size) {
    const { d, k } = spec.size;
    const r = Object.hasOwn(state, 'r') ? state.r! : spec.size.r.start;
    out.r = r;
    out.params_full = d * k;
    out.params_lora = r * (d + k);
    out.saving = (r * (d + k)) / (d * k);
    out.saving_pct = (100 * r * (d + k)) / (d * k);
  }
  return out;
};

export const lora: LabModel<LoraSpec> = { controls, measure };
