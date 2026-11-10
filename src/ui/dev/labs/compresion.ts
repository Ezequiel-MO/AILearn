import type { LabQ, NumeroQ } from '../../../content/schema';
import type { CompresionSpec } from '../../../engine/labs/compresion';

const base = { hints: [], explain: 'e', solution: 's' };

// Los laboratorios nuevos no están cableados todavía en `LabQ['lab']`: se convierte aquí, en un solo
// sitio (se cablea después y esta conversión desaparece).
const lab = (spec: CompresionSpec) => spec as unknown as LabQ['lab'];

// Una cara de 8×8 píxeles (0 negro, 0,5 gris, 1 blanco): simétrica, de rango 4.
const face = [
  [0, 0, 0.5, 0.5, 0.5, 0.5, 0, 0],
  [0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0],
  [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
  [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
  [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  [0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5],
  [0, 0.5, 1, 1, 1, 1, 0.5, 0],
  [0, 0, 0.5, 0.5, 0.5, 0.5, 0, 0],
];

// Pesos de 4×6 de rango exactamente 2: u1·v1ᵀ + u2·v2ᵀ (con u1 = (2, 1, 0, −1), v1 = (1, −1, 0, 2, 0, 1),
// u2 = (0, 1, −2, 1) y v2 = (1, 0, 1, −1, 2, 0)).
const u1 = [2, 1, 0, -1];
const v1 = [1, -1, 0, 2, 0, 1];
const u2 = [0, 1, -2, 1];
const v2 = [1, 0, 1, -1, 2, 0];
const weights = u1.map((a, i) => v1.map((b, j) => a * b + u2[i]! * v2[j]!));

const imagen: LabQ = {
  ...base,
  id: 'dev-compresion-imagen',
  type: 'laboratorio',
  prompt:
    'Una imagen es una tabla de números. Quédate con las capas más importantes hasta que la cara se reconozca bien y ocupe poco.',
  lab: lab({
    kind: 'compresion',
    rows: face,
    caption: 'Una cara de 8×8 píxeles',
    start: 1,
    readouts: ['error', 'stored', 'full'],
  }),
  goals: [
    {
      metric: 'error',
      op: 'lte',
      target: 0.25,
      label: 'Error de la aproximación',
      format: 'percent',
    },
    { metric: 'stored', op: 'lte', target: 34, label: 'Números guardados', format: 'integer' },
  ],
  solved: { k: 2 },
};

const pesos: LabQ = {
  ...base,
  id: 'dev-compresion-pesos',
  type: 'laboratorio',
  prompt:
    'Esta tabla de pesos de una capa tiene rango 2. Encuentra el menor número de capas que la reproduce sin perder nada.',
  lab: lab({
    kind: 'compresion',
    rows: weights,
    signed: true,
    caption: 'Pesos de una capa',
    labels: {
      rows: ['perro', 'gato', 'coche', 'tren'],
      cols: ['pelo', 'ruedas', 'ruido', 'tamaño', 'color', 'edad'],
    },
    readouts: ['error', 'stored', 'rank'],
  }),
  goals: [
    { metric: 'error', op: 'lte', target: 0, label: 'Error de la aproximación', format: 'percent' },
    { metric: 'stored', op: 'lte', target: 22, label: 'Números guardados', format: 'integer' },
  ],
  solved: { k: 2 },
};

const elegir: LabQ = {
  ...base,
  id: 'dev-compresion-elegir',
  type: 'laboratorio',
  prompt:
    'Enciende como mucho dos capas y consigue conservar al menos el 90 % de la matriz. ¿Cuáles valen más?',
  lab: lab({
    kind: 'compresion',
    mode: 'pick',
    rows: [
      [5, 4, 0, 0, 1],
      [4, 5, 0, 1, 0],
      [0, 0, 2, 0, 0],
      [0, 1, 0, 2, 1],
      [1, 0, 0, 1, 3],
    ],
    signed: true,
    caption: 'Pesos de una capa de 5×5',
    readouts: ['kept', 'k', 'sigma_1'],
  }),
  goals: [
    { metric: 'kept', op: 'gte', target: 0.9, label: 'Parte conservada', format: 'percent' },
    { metric: 'k', op: 'lte', target: 2, label: 'Capas que se suman', format: 'integer' },
  ],
  solved: { c1: 1, c2: 1 },
};

const explorar: NumeroQ = {
  ...base,
  id: 'dev-compresion-explorar',
  type: 'numero',
  prompt:
    'Con las capas del deslizador, ¿cuántos números hay que guardar para la cara con 3 capas? (k·(filas + columnas + 1))',
  answer: 51,
  tol: 0,
  lab: lab({
    kind: 'compresion',
    rows: face,
    caption: 'Una cara de 8×8 píxeles',
    start: 1,
    readouts: ['k', 'stored', 'full', 'error'],
  }),
};

export const compresionSamples: (LabQ | NumeroQ)[] = [imagen, pesos, elegir, explorar];
