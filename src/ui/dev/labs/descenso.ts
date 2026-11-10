import type { DescensoSpec } from '../../../engine/labs/descenso';
import type { LabQ, NumeroQ } from '../../../content/schema';

const base = { hints: [], explain: 'e', solution: 's' };

// `LabQ['lab']` todavía no admite el tipo `descenso` (se cablea después): se convierte aquí, una sola vez.
const lab = (spec: DescensoSpec) => spec as unknown as LabQ['lab'];

const cuenco: LabQ = {
  ...base,
  id: 'dev-descenso-cuenco',
  type: 'laboratorio',
  prompt:
    'Una neurona con dos pesos (w y b) empieza con la pérdida muy alta. Entrénala 20 pasos y busca una tasa de aprendizaje con la que la pérdida acabe en 0,05 o menos. Prueba también una tasa enorme y mira qué pasa.',
  lab: lab({
    kind: 'descenso',
    surface: { kind: 'quadratic', a: 1, b: 1 },
    window: { x: [-4, 4], y: [-4, 4] },
    start: { x: 3, y: 2 },
    rate: { min: 0.05, max: 1.2, step: 0.05, start: 0.05 },
    steps: 20,
    threshold: 0.05,
    readouts: ['loss', 'ups'],
  }),
  goals: [{ metric: 'loss', op: 'lte', target: 0.05, label: 'Pérdida final' }],
  solved: { lr: 0.4 },
};

const valle: LabQ = {
  ...base,
  id: 'dev-descenso-valle',
  type: 'laboratorio',
  prompt:
    'Este paisaje es un valle estrecho: muy empinado a los lados y casi plano a lo largo. El descenso simple rebota de pared a pared. Con solo 15 pasos, ¿puedes bajar la pérdida de 0,02 cambiando de optimizador?',
  lab: lab({
    kind: 'descenso',
    surface: { kind: 'quadratic', a: 10, b: 1 },
    window: { x: [-2, 2], y: [-4, 4] },
    axes: ['peso 1', 'peso 2'],
    start: { x: 1.5, y: 3 },
    rate: { min: 0.01, max: 0.2, step: 0.01, start: 0.05 },
    steps: 15,
    optimizers: ['sgd', 'momentum'],
    beta: 0.5,
    threshold: 0.02,
    readouts: ['loss', 'turns'],
  }),
  goals: [{ metric: 'loss', op: 'lte', target: 0.02, label: 'Pérdida tras 15 pasos' }],
  solved: { opt: 1, lr: 0.05 },
};

const recta: LabQ = {
  ...base,
  id: 'dev-descenso-recta',
  type: 'laboratorio',
  prompt:
    'Ajustas una recta a seis puntos: w es su pendiente y b su altura en el origen. Elige dónde empezar, la tasa y el tamaño del minilote, y consigue que en 20 pasos la pérdida baje de 0,7. Mira cómo la recta se acerca a los puntos.',
  lab: lab({
    kind: 'descenso',
    surface: {
      kind: 'regression',
      data: [
        [0, 1.2],
        [1, 2.9],
        [2, 5.2],
        [3, 6.8],
        [4, 9.1],
        [5, 11],
      ],
    },
    window: { x: [-1, 4], y: [-3, 5] },
    start: { x: -1, y: 4, movable: true },
    rate: { min: 0.01, max: 0.12, step: 0.01, start: 0.01 },
    steps: 20,
    batch: { size: { min: 1, max: 6, step: 1, start: 2 }, seed: 7 },
    threshold: 0.7,
    readouts: ['loss', 'best'],
  }),
  goals: [{ metric: 'loss', op: 'lte', target: 0.7, label: 'Pérdida de la recta' }],
  solved: { lr: 0.08, batch: 6 },
};

const pozos: LabQ = {
  ...base,
  id: 'dev-descenso-pozos',
  type: 'laboratorio',
  prompt:
    'La pérdida tiene dos valles: uno poco profundo (un mínimo local) y otro más hondo (el global). Desde donde empieza ahora el descenso se queda en el malo. Mueve el punto de partida hasta que acabe a menos de 0,3 del mínimo global.',
  lab: lab({
    kind: 'descenso',
    surface: {
      kind: 'wells',
      wells: [
        { x: -2, y: 0, depth: 1, width: 0.8 },
        { x: 2, y: 1, depth: 2, width: 0.8 },
      ],
      bowl: 0.02,
    },
    window: { x: [-4, 4], y: [-4, 4] },
    start: { x: -2.5, y: -1, movable: true },
    rate: 0.5,
    steps: 60,
    readouts: ['loss', 'dist'],
  }),
  goals: [{ metric: 'dist', op: 'lte', target: 0.3, label: 'Distancia al mínimo global' }],
  solved: { sx: 1, sy: -1 },
};

const explorar: NumeroQ = {
  ...base,
  id: 'dev-descenso-explorar',
  type: 'numero',
  prompt:
    'Con el descenso simple y esta tasa, ¿en qué paso baja por primera vez la pérdida de 1? Cuéntalo en la gráfica de la pérdida (el paso 0 es la salida). Si quieres, compara con los demás optimizadores.',
  answer: 11,
  tol: 0,
  lab: lab({
    kind: 'descenso',
    surface: { kind: 'quadratic', a: 10, b: 1 },
    window: { x: [-2, 2], y: [-4, 4] },
    start: { x: 1.5, y: 3 },
    rate: { min: 0.01, max: 0.2, step: 0.01, start: 0.05 },
    steps: 15,
    optimizers: ['sgd', 'momentum', 'rmsprop', 'adam'],
    beta: { min: 0, max: 0.95, step: 0.05, start: 0.5 },
    threshold: 1,
    readouts: ['loss', 'loss0'],
  }),
};

export const descensoSamples: (LabQ | NumeroQ)[] = [cuenco, valle, recta, pozos, explorar];
