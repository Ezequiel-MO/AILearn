import type { LabControl, LabModel, LabState, Vec2 } from './types';

/**
 * Laboratorio «atención»: cómo decide un token de una frase a qué otros tokens mirar. Su consulta q se
 * compara (producto escalar) con la clave k de cada token; un softmax convierte las puntuaciones en
 * pesos que suman 1 y la salida es la mezcla de los valores con esos pesos.
 *
 * MANDOS (ids)
 * - `qx`, `qy`: la consulta del token `focus` (si `movable` es `query`, el valor por defecto).
 * - `kx`, `ky`: la clave del token `keyOf` (si `movable` es `key`).
 * - `temp`: la temperatura (solo si hay `temperature`). Las puntuaciones se dividen entre ella.
 * - `mask`: 0 o 1, empieza en 0 (solo si `mask` es `toggle`). Con 1, los tokens posteriores a `focus` no reciben peso.
 *
 * MÉTRICAS (nombre: significado)
 * - `s_<id>`: puntuación q·k del token <id>, ya dividida entre la temperatura. NaN si está enmascarado.
 * - `w_<id>`: peso (0 a 1) que `focus` da al token <id>. 0 si está enmascarado.
 * - `w_max`: el mayor peso. `top`: índice (desde 0) del token con más peso (el primero, si hay empate).
 * - `entropy`: entropía de los pesos en bits (0 si todo el peso va a un token; log2 n si es uniforme).
 * - `self`: peso de `focus` sobre sí mismo. `future`: suma de pesos sobre los tokens posteriores a `focus`.
 * - `masked`: número de tokens enmascarados.
 * - `out_x`, `out_y`: la mezcla Σ wⱼ·valueⱼ (solo si todos los tokens llevan `value`).
 * - `temp`: la temperatura en uso (1 si no hay `temperature`).
 * Los ids de token `max` no se admiten (chocarían con `w_max`).
 */

export interface AtencionToken {
  id: string;
  /** Lo que se rotula: la palabra o el trozo de palabra. */
  text: string;
  /** Clave del token: con qué se compara la consulta de quien mira. */
  key: [number, number];
  /** Valor del token: lo que aporta a la salida cuando se le presta atención. */
  value?: [number, number];
  /** Consulta del token como quien mira. Solo hace falta para el mapa completo (`heatmap`). */
  query?: [number, number];
}

export interface AtencionSpec {
  kind: 'atencion';
  /** De 2 a 8 tokens, en el orden de la frase. */
  tokens: AtencionToken[];
  /** Índice (desde 0) del token que mira. */
  focus: number;
  /** Consulta inicial del token `focus`. */
  query: [number, number];
  /** Qué se arrastra: la consulta de `focus` (por defecto), la clave del token `keyOf` o nada. */
  movable?: 'query' | 'key' | 'none';
  /** Índice del token cuya clave se arrastra. Obligatorio si `movable` es `key`. */
  keyOf?: number;
  /** La ventana del plano de claves va de −range a range en los dos ejes. */
  range: number;
  /** Paso de la rejilla al arrastrar. */
  snap: number;
  /** Si está, hay un deslizador de temperatura. Sin él, la temperatura es 1. */
  temperature?: { min: number; max: number; step: number; start: number };
  /** Enmascarado de los tokens posteriores a `focus`: nunca (por defecto), siempre o con un interruptor. */
  mask?: 'none' | 'causal' | 'toggle';
  /** Dibuja además el mapa n×n (fila: quién mira; columna: a quién). Exige `query` en todos los tokens. */
  heatmap?: true;
  /** Lecturas del panel, por nombre de métrica, en este orden. */
  readouts?: string[];
}

/** Todo lo que el dibujo y las métricas necesitan de un estado. */
export interface AtencionScene {
  /** La consulta de `focus` en vivo. */
  query: Vec2;
  /** La clave de cada token en vivo (la de `keyOf` puede haberse movido). */
  keys: Vec2[];
  temp: number;
  maskOn: boolean;
  /** Si cada token está enmascarado para `focus`. */
  masked: boolean[];
  /** Puntuación q·k / temperatura de cada token; NaN si está enmascarado. */
  scores: number[];
  /** Pesos de `focus`: suman 1; 0 en los enmascarados. */
  weights: number[];
  entropy: number;
  /** Mapa n×n de pesos (fila: quién mira). Vacío sin `heatmap`. La fila de `focus` usa la consulta en vivo. */
  heat: number[][];
}

const dot = (a: Vec2, b: Vec2): number => a[0] * b[0] + a[1] * b[1];

/** Puntuaciones y pesos de una consulta sobre unas claves; `masked[j]` aparta al token j. */
const attend = (
  q: Vec2,
  keys: readonly Vec2[],
  temp: number,
  masked: readonly boolean[],
): { scores: number[]; weights: number[] } => {
  const scores = keys.map((k, j) => (masked[j] ? NaN : dot(q, k) / temp));
  const live = scores.filter((s) => !Number.isNaN(s));
  const top = Math.max(...live);
  const exps = scores.map((s) => (Number.isNaN(s) ? 0 : Math.exp(s - top)));
  const total = exps.reduce((s, e) => s + e, 0);
  return { scores, weights: exps.map((e) => e / total) };
};

const maskOn = (spec: AtencionSpec, state: LabState): boolean => {
  const mode = spec.mask ?? 'none';
  if (mode === 'causal') return true;
  if (mode === 'toggle') return Object.hasOwn(state, 'mask') && state.mask === 1;
  return false;
};

const movable = (spec: AtencionSpec): 'query' | 'key' | 'none' => spec.movable ?? 'query';

export const atencionScene = (spec: AtencionSpec, state: LabState): AtencionScene => {
  const get = (id: string, fallback: number): number =>
    Object.hasOwn(state, id) ? state[id]! : fallback;
  const query: Vec2 = [get('qx', spec.query[0]), get('qy', spec.query[1])];
  const keys: Vec2[] = spec.tokens.map((t, j) =>
    j === spec.keyOf && movable(spec) === 'key'
      ? [get('kx', t.key[0]), get('ky', t.key[1])]
      : t.key,
  );
  const temp = spec.temperature ? get('temp', spec.temperature.start) : 1;
  const on = maskOn(spec, state);
  const masked = spec.tokens.map((_, j) => on && j > spec.focus);
  const { scores, weights } = attend(query, keys, temp, masked);

  let entropy = 0;
  for (const w of weights) if (w > 0) entropy -= w * Math.log2(w);

  const heat: number[][] = spec.heatmap
    ? spec.tokens.map((t, i) => {
        const q: Vec2 | undefined = i === spec.focus ? query : t.query;
        if (!q) return spec.tokens.map(() => NaN);
        const rowMasked = spec.tokens.map((_, j) => on && j > i);
        return attend(q, keys, temp, rowMasked).weights;
      })
    : [];
  return { query, keys, temp, maskOn: on, masked, scores, weights, entropy, heat };
};

const controls = (spec: AtencionSpec): LabControl[] => {
  const out: LabControl[] = [];
  const coord = (id: string, start: number) =>
    out.push({ id, min: -spec.range, max: spec.range, step: spec.snap, start });
  if (movable(spec) === 'query') {
    coord('qx', spec.query[0]);
    coord('qy', spec.query[1]);
  }
  if (movable(spec) === 'key' && spec.keyOf !== undefined) {
    const k = spec.tokens[spec.keyOf]?.key ?? [0, 0];
    coord('kx', k[0]);
    coord('ky', k[1]);
  }
  if (spec.temperature) out.push({ id: 'temp', ...spec.temperature });
  if (spec.mask === 'toggle') out.push({ id: 'mask', min: 0, max: 1, step: 1, start: 0 });
  return out;
};

const measure = (spec: AtencionSpec, state: LabState): Record<string, number> => {
  const scene = atencionScene(spec, state);
  const { weights, scores, masked } = scene;
  const out: Record<string, number> = {};
  spec.tokens.forEach((t, j) => {
    out[`s_${t.id}`] = scores[j]!;
    out[`w_${t.id}`] = weights[j]!;
  });
  let best = 0;
  weights.forEach((w, j) => {
    if (w > weights[best]!) best = j;
  });
  out.w_max = weights[best]!;
  out.top = best;
  out.entropy = scene.entropy;
  out.self = weights[spec.focus]!;
  out.future = weights.reduce((s, w, j) => (j > spec.focus ? s + w : s), 0);
  out.masked = masked.filter(Boolean).length;
  if (spec.tokens.every((t) => t.value)) {
    out.out_x = spec.tokens.reduce((s, t, j) => s + weights[j]! * t.value![0], 0);
    out.out_y = spec.tokens.reduce((s, t, j) => s + weights[j]! * t.value![1], 0);
  }
  out.temp = scene.temp;
  return out;
};

export const atencion: LabModel<AtencionSpec> = { controls, measure };
