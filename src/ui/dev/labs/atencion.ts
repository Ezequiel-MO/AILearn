import type { LabQ, NumeroQ } from '../../../content/schema';
import type { AtencionSpec } from '../../../engine/labs/atencion';

const base = { hints: [], explain: 'e', solution: 's' };

// Se cablea después: hasta que `LabQ['lab']` admita `atencion`, la especificación se convierte aquí.
const asLab = (spec: AtencionSpec): LabQ['lab'] => spec as unknown as LabQ['lab'];

/**
 * «el animal no cruzó porque estaba cansado»: claves y valores de juguete en dos dimensiones.
 * Con la consulta q = (2, 1) las puntuaciones q·k son, en orden:
 *   el (−1, 0) → −2; animal (2, 1) → 5; no (0, −1) → −1; cruzó (1, −2) → 0;
 *   porque (−2, −1) → −5; estaba (0, 1) → 1; cansado (−1, 2) → 0.
 * Con la consulta inicial (0, 1): 0, 1, −1, −2, −1, 1, 2 (la mayor es «cansado»).
 */
const sentence: AtencionSpec['tokens'] = [
  { id: 'el', text: 'el', key: [-1, 0], value: [0, 0] },
  { id: 'animal', text: 'animal', key: [2, 1], value: [2, 2] },
  { id: 'no', text: 'no', key: [0, -1], value: [0, -1] },
  { id: 'cruzo', text: 'cruzó', key: [1, -2], value: [1, 0] },
  { id: 'porque', text: 'porque', key: [-2, -1], value: [0, 1] },
  { id: 'estaba', text: 'estaba', key: [0, 1], value: [1, 1] },
  { id: 'cansado', text: 'cansado', key: [-1, 2], value: [-2, 1] },
];

const mirar: LabQ = {
  ...base,
  id: 'dev-atencion-mirar',
  type: 'laboratorio',
  prompt:
    'En «el animal no cruzó porque estaba cansado», «estaba» tiene que saber quién estaba cansado. Mueve su consulta hasta que «animal» reciba al menos el 70 % de la atención.',
  lab: asLab({
    kind: 'atencion',
    tokens: sentence,
    focus: 5,
    query: [0, 1],
    range: 3,
    snap: 0.5,
    readouts: ['w_animal', 'top', 'out_x', 'out_y'],
  }),
  goals: [
    {
      metric: 'w_animal',
      op: 'gte',
      target: 0.7,
      label: 'Atención que «estaba» da a «animal»',
      format: 'percent',
    },
  ],
  solved: { qx: 2, qy: 1 },
};

const afilar: LabQ = {
  ...base,
  id: 'dev-atencion-afilar',
  type: 'laboratorio',
  prompt:
    'La consulta de «estaba» ya apunta a «animal», pero con esta temperatura reparte la atención entre casi todo. Baja la temperatura hasta que la atención sea afilada: entropía de 1 bit o menos.',
  lab: asLab({
    kind: 'atencion',
    tokens: sentence,
    focus: 5,
    query: [2, 1],
    movable: 'none',
    range: 3,
    snap: 0.5,
    temperature: { min: 0.25, max: 4, step: 0.25, start: 4 },
    readouts: ['w_max', 'entropy', 'temp'],
  }),
  goals: [
    {
      metric: 'entropy',
      op: 'lte',
      target: 1,
      label: 'Entropía de los pesos (bits)',
    },
  ],
  solved: { temp: 1 },
};

const futuro: LabQ = {
  ...base,
  id: 'dev-atencion-futuro',
  type: 'laboratorio',
  prompt:
    'Un modelo que escribe la frase palabra a palabra no puede mirar lo que aún no ha escrito. Activa la máscara causal y recoloca la consulta de «estaba» para que no mire al futuro y aun así «animal» reciba más del 60 %.',
  lab: asLab({
    kind: 'atencion',
    tokens: sentence,
    focus: 5,
    query: [0, 1],
    range: 3,
    snap: 0.5,
    mask: 'toggle',
    readouts: ['w_animal', 'future', 'masked'],
  }),
  goals: [
    {
      metric: 'future',
      op: 'lte',
      target: 0,
      label: 'Atención sobre lo que viene después',
      format: 'percent',
    },
    {
      metric: 'w_animal',
      op: 'gte',
      target: 0.6,
      label: 'Atención que «estaba» da a «animal»',
      format: 'percent',
    },
  ],
  solved: { mask: 1, qx: 2, qy: 1 },
};

/**
 * La consulta de «estaba» queda fija en (0, 1): solo cuenta la segunda coordenada de cada clave.
 * Las puntuaciones de los demás tokens son 0, −1, −2, −1, 1 (estaba) y 2; con la clave de «animal» en
 * (0, 4) su puntuación es 4 y su peso e⁴ / (e⁴ + e⁰ + e⁻¹ + e⁻² + e⁻¹ + e¹ + e²) ≈ 0,82.
 */
const clave: LabQ = {
  ...base,
  id: 'dev-atencion-clave',
  type: 'laboratorio',
  prompt:
    'Ahora la consulta de «estaba» no se toca: se aprende la clave de «animal». Muévela hasta que «animal» se lleve al menos el 70 % de la atención.',
  lab: asLab({
    kind: 'atencion',
    tokens: sentence,
    focus: 5,
    query: [0, 1],
    movable: 'key',
    keyOf: 1,
    range: 4,
    snap: 0.5,
    readouts: ['w_animal', 's_animal', 'entropy'],
  }),
  goals: [
    {
      metric: 'w_animal',
      op: 'gte',
      target: 0.7,
      label: 'Atención que «estaba» da a «animal»',
      format: 'percent',
    },
  ],
  solved: { kx: 0, ky: 4 },
};

/**
 * Cuatro tokens, cada uno con su consulta: la fila de cada token es su atención sobre los demás.
 * Puntuaciones q·k (claves el (1, 0), gato (0, 2), come (2, 0), pescado (0, −1)), con máscara causal
 * (cada token solo ve los anteriores y a sí mismo):
 *   el q (0, 1): ve solo «el» → mira a «el»;
 *   gato q (0, 2): 0, 4 → a «gato»; come q (0, 2): 0, 4, 0 → a «gato»;
 *   pescado q (2, 0): 2, 0, 4, 0 → a «come».
 * Así que «gato» es el favorito de 2 tokens (sin máscara serían 3: «el» también miraría a «gato»).
 */
const explorar: NumeroQ = {
  ...base,
  id: 'dev-atencion-explorar',
  type: 'numero',
  prompt:
    'Mira el mapa: cada fila es un token que mira, y la máscara causal le tapa lo que viene después. ¿Cuántos de los cuatro tokens ponen «gato» como el token al que más atienden?',
  answer: 2,
  tol: 0,
  lab: asLab({
    kind: 'atencion',
    tokens: [
      { id: 'el', text: 'el', key: [1, 0], query: [0, 1] },
      { id: 'gato', text: 'gato', key: [0, 2], query: [0, 2] },
      { id: 'come', text: 'come', key: [2, 0], query: [0, 2] },
      { id: 'pescado', text: 'pescado', key: [0, -1], query: [2, 0] },
    ],
    focus: 2,
    query: [0, 2],
    movable: 'none',
    range: 3,
    snap: 0.5,
    mask: 'causal',
    heatmap: true,
    readouts: ['top', 'entropy'],
  }),
};

export const atencionSamples: (LabQ | NumeroQ)[] = [mirar, afilar, futuro, clave, explorar];
