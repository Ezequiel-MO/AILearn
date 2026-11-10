import type { LabQ, NumeroQ } from '../../../content/schema';

const base = { hints: [], explain: 'e', solution: 's' };

const sentiment = [
  { id: 'genial', label: 'genial', x: 2.5, y: 2, group: 1 },
  { id: 'bueno', label: 'bueno', x: 1, y: 1, group: 1 },
  { id: 'feliz', label: 'feliz', x: 2, y: 1.5, group: 1 },
  { id: 'horrible', label: 'horrible', x: 2.5, y: -2, group: 0 },
  { id: 'malo', label: 'malo', x: 1, y: -1, group: 0 },
  { id: 'triste', label: 'triste', x: 1.5, y: -1.5, group: 0 },
];

const clasificar: LabQ = {
  ...base,
  id: 'dev-capa-clasificar',
  type: 'laboratorio',
  prompt:
    'La neurona siguiente solo mira la primera coordenada de salida. Mueve las columnas de la capa hasta que acierte con las seis palabras.',
  lab: {
    kind: 'capa',
    range: 4,
    snap: 0.5,
    points: sentiment,
    groups: ['negativa', 'positiva'],
    axes: ['intensidad', 'tono'],
    i: [1, 0],
    j: [0, 1],
    readout: { w: [1, 0], b: 0 },
    readouts: ['det'],
  },
  goals: [
    {
      metric: 'acc',
      op: 'gte',
      target: 1,
      label: 'Aciertos de la neurona siguiente',
      format: 'percent',
    },
  ],
  solved: { ix: 0, iy: 1, jx: 1, jy: 0 },
};

const pca: LabQ = {
  ...base,
  id: 'dev-capa-pca',
  type: 'laboratorio',
  prompt: 'Gira v hasta que su recta conserve casi toda la varianza de la nube.',
  lab: {
    kind: 'capa',
    range: 4,
    snap: 0.5,
    points: [
      { id: 'a', label: 'perro', x: -3, y: -1.5 },
      { id: 'b', label: 'gato', x: -2, y: -1.5 },
      { id: 'c', label: 'lobo', x: -1, y: 0 },
      { id: 'd', label: 'pan', x: 0, y: 0.5 },
      { id: 'e', label: 'queso', x: 1, y: 0 },
      { id: 'f', label: 'tren', x: 2, y: 1.5 },
      { id: 'g', label: 'coche', x: 3, y: 1 },
    ],
    i: [1, 0],
    j: [0, 1],
    movable: 'none',
    probe: { x: 0, y: 2, movable: true, on: 'input' },
    readouts: ['var_v', 'lost'],
  },
  goals: [
    {
      metric: 'var_frac',
      op: 'gte',
      target: 0.9,
      label: 'Varianza que conserva la recta de v',
      format: 'percent',
    },
  ],
  solved: { vx: 2, vy: 1 },
};

const deshacer: LabQ = {
  ...base,
  id: 'dev-capa-deshacer',
  type: 'laboratorio',
  prompt:
    'La primera capa ha movido las palabras. Construye la capa que devuelve cada una a su diana.',
  lab: {
    kind: 'capa',
    range: 4,
    snap: 0.5,
    points: [
      { id: 'sol', label: 'sol', x: 1, y: 2, group: 0 },
      { id: 'mar', label: 'mar', x: 2, y: 1, group: 1 },
      { id: 'rio', label: 'río', x: -1, y: 1, group: 1 },
    ],
    groups: ['cielo', 'agua'],
    i: [1, 0],
    j: [0, 1],
    before: { i: [2, 0], j: [0, 1] },
    targets: { sol: [1, 2], mar: [2, 1], rio: [-1, 1] },
    readouts: ['det', 'det_total'],
  },
  goals: [
    {
      metric: 'target_err',
      op: 'lte',
      target: 0,
      label: 'Distancia a su diana de la palabra más lejana',
    },
  ],
  solved: { ix: 0.5, iy: 0, jx: 0, jy: 1 },
};

const explorar: NumeroQ = {
  ...base,
  id: 'dev-capa-explorar',
  type: 'numero',
  prompt: 'Esta capa aplasta el plano. ¿Cuántas parejas de palabras dejan de distinguirse?',
  answer: 1,
  tol: 0,
  lab: {
    kind: 'capa',
    range: 4,
    snap: 1,
    points: sentiment,
    groups: ['negativa', 'positiva'],
    axes: ['intensidad', 'tono'],
    i: [1, 0],
    j: [0, 0],
    movable: 'none',
    circle: true,
  },
};

export const capaSamples = [clasificar, pca, deshacer, explorar];
