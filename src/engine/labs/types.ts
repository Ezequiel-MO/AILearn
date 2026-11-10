/**
 * Laboratorios: escenas interactivas con datos de un sistema de IA (una nube de embeddings que pasa
 * por una capa, una pérdida que baja, una distribución sobre tokens…). El jugador mueve mandos y el
 * laboratorio mide la consecuencia. Aquí vive lo común a todos: el estado, los mandos y las metas.
 * Cada laboratorio (`./<kind>.ts`) es un modelo puro: de la especificación y el estado saca los valores.
 */

/** Un número por mando. Un punto arrastrable son dos mandos (`<id>x` y `<id>y`). */
export type LabState = Record<string, number>;

/** Lo que mide el laboratorio en un estado: una entrada por métrica. */
export type LabValues = Record<string, number>;

/** Un mando: recorre de `min` a `max` en pasos de `step` y empieza en `start`. */
export interface LabControl {
  id: string;
  min: number;
  max: number;
  step: number;
  start: number;
}

export interface LabModel<S> {
  controls(spec: S): LabControl[];
  measure(spec: S, state: LabState): LabValues;
}

/** `gte`: valor ≥ objetivo. `lte`: valor ≤ objetivo. `eq`: |valor − objetivo| ≤ `tol`. */
export type GoalOp = 'gte' | 'lte' | 'eq';

export interface LabGoal {
  metric: string;
  op: GoalOp;
  target: number;
  tol?: number;
}

// Margen para el error de coma flotante en el borde de una meta.
const EPS = 1e-9;

/** Una métrica que falta o que no es un número finito no cumple ninguna meta. */
export const goalMet = (goal: LabGoal, values: LabValues): boolean => {
  const v = Object.hasOwn(values, goal.metric) ? values[goal.metric] : undefined;
  if (v === undefined || !Number.isFinite(v)) return false;
  switch (goal.op) {
    case 'gte':
      return v >= goal.target - EPS;
    case 'lte':
      return v <= goal.target + EPS;
    case 'eq':
      return Math.abs(v - goal.target) <= (goal.tol ?? 0) + EPS;
  }
};

export const startState = (controls: readonly LabControl[]): LabState => {
  const out: LabState = {};
  for (const c of controls) out[c.id] = c.start;
  return out;
};

/** El valor de la rejilla del mando más cercano a `value`, dentro de sus límites. */
export const settleValue = (c: LabControl, value: number): number => {
  if (!Number.isFinite(value)) return c.start;
  const steps = Math.round((value - c.min) / c.step);
  const last = Math.floor((c.max - c.min) / c.step + EPS);
  const k = Math.min(Math.max(steps, 0), last);
  return Number((c.min + k * c.step).toFixed(10));
};

/**
 * El estado completo y válido más cercano a `state`: cada mando en su rejilla y dentro de sus límites,
 * los que faltan en su valor inicial y las claves que no son de ningún mando, fuera.
 */
export const settle = (controls: readonly LabControl[], state: LabState): LabState => {
  const out: LabState = {};
  for (const c of controls) {
    out[c.id] = Object.hasOwn(state, c.id) ? settleValue(c, state[c.id]!) : c.start;
  }
  return out;
};

/** Problemas de un estado escrito a mano (la solución declarada de una pregunta): claves y rejilla. */
export const stateProblems = (controls: readonly LabControl[], state: LabState): string[] => {
  const byId = new Map(controls.map((c) => [c.id, c]));
  const out: string[] = [];
  for (const [id, value] of Object.entries(state)) {
    const c = byId.get(id);
    if (!c) {
      out.push(`el mando ${id} no existe`);
    } else if (Math.abs(settleValue(c, value) - value) > 1e-9) {
      out.push(
        `el mando ${id} no admite el valor ${value} (de ${c.min} a ${c.max} en pasos de ${c.step})`,
      );
    }
  }
  return out;
};

// ---------- utilidades numéricas que comparten varios laboratorios ----------

export type Vec2 = readonly [number, number];

export const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? NaN : xs.reduce((s, x) => s + x, 0) / xs.length;

/** Varianza poblacional (divide entre n). */
export const variance = (xs: readonly number[]): number => {
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) ** 2));
};

export const softmax = (logits: readonly number[], temperature = 1): number[] => {
  const scaled = logits.map((z) => z / temperature);
  const top = Math.max(...scaled);
  const exps = scaled.map((z) => Math.exp(z - top));
  const total = exps.reduce((s, e) => s + e, 0);
  return exps.map((e) => e / total);
};
