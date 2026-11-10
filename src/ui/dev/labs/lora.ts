import type { LabQ, NumeroQ } from '../../../content/schema';
import type { LoraSpec } from '../../../engine/labs/lora';

const base = { hints: [], explain: 'e', solution: 's' };

// Se cablea después: mientras `LabQ['lab']` no admita `lora`, la especificación se convierte aquí.
const lab = (spec: LoraSpec): LabQ['lab'] => spec as unknown as LabQ['lab'];

const sentiment = [
  { id: 'genial', label: 'genial', x: 2.5, y: 2, group: 1 },
  { id: 'bueno', label: 'bueno', x: 1, y: 1, group: 1 },
  { id: 'feliz', label: 'feliz', x: 2, y: 1.5, group: 1 },
  { id: 'horrible', label: 'horrible', x: 2.5, y: -2, group: 0 },
  { id: 'malo', label: 'malo', x: 1, y: -1, group: 0 },
  { id: 'triste', label: 'triste', x: 1.5, y: -1.5, group: 0 },
];

/** La capa congelada deja las palabras donde están: la neurona siguiente mira solo la primera salida. */
export const loraClassifierSpec: LoraSpec = {
  kind: 'lora',
  range: 4,
  points: sentiment,
  groups: ['negativa', 'positiva'],
  axes: ['intensidad', 'tono'],
  w: { i: [1, 0], j: [0, 1] },
  limit: 2,
  step: 0.5,
  readout: { w: [1, 0], b: 0 },
  readouts: ['acc', 'moved', 'delta_rank'],
};

const clasificar: LabQ = {
  ...base,
  id: 'dev-lora-clasificar',
  type: 'laboratorio',
  prompt:
    'El modelo original no distingue «positiva» de «negativa»: la neurona siguiente solo mira la primera coordenada, y todas las palabras caen del mismo lado. Congela W y entrena una corrección B·A hasta que acierte con las seis palabras.',
  lab: lab(loraClassifierSpec),
  goals: [
    {
      metric: 'acc',
      op: 'gte',
      target: 1,
      label: 'Aciertos de la neurona siguiente',
      format: 'percent',
    },
  ],
  // B empuja solo en la primera salida (1,5) y A lee el tono de la palabra (a₂ = 1): x′ = x + 1,5·y.
  solved: { b1: 1.5, b2: 0, a1: 0, a2: 1 },
};

/** W más variada, para que el original no coincida con la entrada. */
export const loraTargetsSpec: LoraSpec = {
  kind: 'lora',
  range: 4,
  points: [
    { id: 'a', label: 'perro', x: 1, y: 1 },
    { id: 'b', label: 'gato', x: 2, y: 0 },
    { id: 'c', label: 'lobo', x: -1, y: 1 },
    { id: 'd', label: 'pez', x: 0, y: 2 },
  ],
  w: { i: [1, 0.5], j: [-0.5, 1] },
  limit: 2,
  step: 0.5,
  // (W + B·A)·x con B = (0,5; −1) y A = (1; 0,5): W = [[1; −0,5], [0,5; 1]], B·A = [[0,5; 0,25], [−1; −0,5]].
  targets: { a: [1.25, 0], b: [3, -1], c: [-1.75, 1], d: [-0.5, 1] },
  readouts: ['target_err', 'on_target', 'moved'],
};

const dianas: LabQ = {
  ...base,
  id: 'dev-lora-dianas',
  type: 'laboratorio',
  prompt:
    'Llevar cada palabra a su diana pide una corrección precisa, pero de rango 1. Mira las flechas: todas salen paralelas a B. Encuentra B y A.',
  lab: lab(loraTargetsSpec),
  goals: [
    {
      metric: 'target_err',
      op: 'lte',
      target: 0,
      label: 'Distancia a su diana de la palabra más lejana',
    },
  ],
  solved: { b1: 0.5, b2: -1, a1: 1, a2: 0.5 },
};

/** Unas dianas que exigen rango 2: con LoRA de rango 1 no se alcanzan, con ΔW entera sí. */
export const loraFullSpec: LoraSpec = {
  kind: 'lora',
  mode: 'full',
  range: 4,
  points: [
    { id: 'p', label: 'rojo', x: 2, y: 1 },
    { id: 'q', label: 'azul', x: 1, y: -2 },
    { id: 'r', label: 'verde', x: -1, y: 2 },
    { id: 's', label: 'gris', x: 2, y: -1 },
  ],
  w: { i: [1, 0], j: [0.5, 1] },
  limit: 1,
  step: 0.25,
  // (W + ΔW)·x con ΔW = [[0,5; 0], [0; −0,5]] (rango 2) y W = [[1; 0,5], [0; 1]].
  targets: { p: [3.5, 0.5], q: [0.5, -1], r: [-0.5, 1], s: [2.5, -0.5] },
  readouts: ['target_err', 'delta_rank', 'delta_norm'],
};

const completo: LabQ = {
  ...base,
  id: 'dev-lora-completo',
  type: 'laboratorio',
  prompt:
    'Aquí se entrena ΔW entera, los cuatro números. Lleva cada palabra a su diana y fíjate en el rango de ΔW: una corrección de rango 1 (B·A) no podría hacerlo.',
  lab: lab(loraFullSpec),
  goals: [
    {
      metric: 'target_err',
      op: 'lte',
      target: 0,
      label: 'Distancia a su diana de la palabra más lejana',
    },
    {
      metric: 'delta_rank',
      op: 'gte',
      target: 2,
      label: 'Rango de la corrección ΔW',
      format: 'integer',
    },
  ],
  solved: { d11: 0.5, d12: 0, d21: 0, d22: -0.5 },
};

const sizeReal = { d: 4096, k: 4096, r: { min: 1, max: 64, step: 1, start: 32 } };

const contador: LabQ = {
  ...base,
  id: 'dev-lora-contador',
  type: 'laboratorio',
  prompt:
    'En una capa real de 4096 × 4096, el ajuste completo entrena más de 16 millones de números. Baja el rango r hasta que LoRA entrene como mucho el 1 % de ellos.',
  lab: lab({
    kind: 'lora',
    range: 4,
    points: sentiment,
    groups: ['negativa', 'positiva'],
    axes: ['intensidad', 'tono'],
    w: { i: [1, 0], j: [0, 1] },
    limit: 2,
    step: 0.5,
    size: sizeReal,
    readouts: ['params_full', 'params_lora', 'saving_pct'],
  }),
  goals: [
    {
      metric: 'saving_pct',
      op: 'lte',
      target: 1,
      label: 'Parámetros que entrena LoRA, en % del ajuste completo',
    },
  ],
  // r·8192 / 16 777 216 ≤ 1 % → r ≤ 20,48: con r = 16 son 131 072 parámetros (0,78 %).
  solved: { r: 16 },
};

const explorar: NumeroQ = {
  ...base,
  id: 'dev-lora-explorar',
  type: 'numero',
  prompt:
    'Con r = 8, ¿cuántas veces menos parámetros entrena LoRA que el ajuste completo de la capa de 4096 × 4096?',
  answer: 256,
  tol: 0,
  lab: lab({
    kind: 'lora',
    range: 4,
    points: sentiment,
    groups: ['negativa', 'positiva'],
    axes: ['intensidad', 'tono'],
    w: { i: [1, 0], j: [0, 1] },
    limit: 2,
    step: 0.5,
    size: { ...sizeReal, r: { min: 1, max: 64, step: 1, start: 1 } },
    readouts: ['params_full', 'params_lora', 'saving_pct'],
  }),
};

export const loraSamples: (LabQ | NumeroQ)[] = [clasificar, dianas, completo, contador, explorar];
