import type { CapaPoint, CapaSpec } from '../../engine/labs/capa';

/**
 * Los datos del juego 2: nubes de palabras con dos rasgos legibles, que vuelven de una pregunta a otra
 * para que el jugador las reconozca. Toda pregunta `laboratorio` de `capa` parte de una de ellas con
 * `capaLab`; una variante que solo usa un proyecto vive en el fichero de ese proyecto.
 *
 * Coordenadas en múltiplos de 0,5 y dentro de ±3, para que quepan transformadas en una ventana de ±4
 * a ±6. Lo que cada nube promete (qué rasgo separa, cuánta varianza lleva cada dirección) lo afirma
 * `datos.test.ts`.
 */
export interface Cloud {
  points: CapaPoint[];
  /** El grupo 1 es el que reconoce la neurona siguiente (su zona sombreada). */
  groups?: string[];
  /** Nombre de los dos rasgos de entrada. */
  axes?: [string, string];
}

/**
 * Reseñas de una palabra. El rasgo que separa las positivas de las negativas es el segundo, el tono:
 * la intensidad es alta en «genial» y en «horrible» por igual.
 */
export const RESENAS: Cloud = {
  points: [
    { id: 'genial', label: 'genial', x: 2.5, y: 2, group: 1 },
    { id: 'bueno', label: 'bueno', x: 1, y: 1, group: 1 },
    { id: 'feliz', label: 'feliz', x: 2, y: 1.5, group: 1 },
    { id: 'horrible', label: 'horrible', x: 2.5, y: -2, group: 0 },
    { id: 'malo', label: 'malo', x: 1, y: -1, group: 0 },
    { id: 'triste', label: 'triste', x: 1.5, y: -1.5, group: 0 },
  ],
  groups: ['negativa', 'positiva'],
  axes: ['intensidad', 'tono'],
};

/** Las cuatro primeras reseñas que ve el jugador, en el despegue. */
export const RESENAS_CUATRO: Cloud = {
  ...RESENAS,
  points: RESENAS.points.filter((p) => ['genial', 'bueno', 'horrible', 'malo'].includes(p.id)),
};

/** Las mismas reseñas con el segundo rasgo medido al revés: cuanto más negativa, más alto. */
export const RESENAS_NEGATIVIDAD: Cloud = {
  ...RESENAS,
  points: RESENAS.points.map((p) => ({ ...p, y: -p.y })),
  axes: ['intensidad', 'negatividad'],
};

/**
 * Correos por su asunto. Ningún rasgo separa por sí solo el spam (hay spam con saludos y correo
 * normal con enlaces): lo separa la diferencia «enlaces − saludos».
 */
export const CORREOS: Cloud = {
  points: [
    { id: 'premio', label: 'premio', x: 3, y: 1, group: 1 },
    { id: 'oferta', label: 'oferta', x: 2, y: 0.5, group: 1 },
    { id: 'urgente', label: 'urgente', x: 2.5, y: 2, group: 1 },
    { id: 'reunion', label: 'reunión', x: 0.5, y: 1.5, group: 0 },
    { id: 'factura', label: 'factura', x: 1.5, y: 2.5, group: 0 },
    { id: 'boletin', label: 'boletín', x: 2, y: 3, group: 0 },
  ],
  groups: ['normal', 'spam'],
  axes: ['enlaces', 'saludos'],
};

/**
 * Animales. «gato», «perro» y «hámster» quedan cerca (casi sinónimos para un modelo); «lobo» se
 * parece a «perro» en tamaño y se opone en domesticidad.
 */
export const ANIMALES: Cloud = {
  points: [
    { id: 'gato', label: 'gato', x: 1, y: 2.5, group: 1 },
    { id: 'perro', label: 'perro', x: 1.5, y: 2, group: 1 },
    { id: 'hamster', label: 'hámster', x: 0.5, y: 1.5, group: 1 },
    { id: 'lobo', label: 'lobo', x: 1.5, y: -2, group: 0 },
    { id: 'tigre', label: 'tigre', x: 2.5, y: -2.5, group: 0 },
    { id: 'oso', label: 'oso', x: 3, y: -1.5, group: 0 },
  ],
  groups: ['salvaje', 'mascota'],
  axes: ['tamaño', 'domesticidad'],
};

/**
 * Una nube alargada y centrada en el origen, con tres temas a lo largo de una diagonal: la dirección
 * (2, 1) lleva el 96,7 % de su varianza y la perpendicular, el 3,3 %.
 */
export const NUBE_ALARGADA: Cloud = {
  points: [
    { id: 'perro', label: 'perro', x: -3, y: -1.5, group: 0 },
    { id: 'gato', label: 'gato', x: -2, y: -1.5, group: 0 },
    { id: 'lobo', label: 'lobo', x: -1, y: 0, group: 0 },
    { id: 'pan', label: 'pan', x: 0, y: 0.5, group: 1 },
    { id: 'queso', label: 'queso', x: 1, y: 0, group: 1 },
    { id: 'tren', label: 'tren', x: 2, y: 1.5, group: 2 },
    { id: 'coche', label: 'coche', x: 3, y: 1, group: 2 },
  ],
  groups: ['animales', 'comida', 'transporte'],
};

/**
 * Seis frutas apiñadas y un texto basura lejos. Sin él, la dirección de más varianza es la horizontal
 * (77,9 %); con él, la horizontal baja al 56,1 % y manda la que apunta al dato raro: (3; 2,5), 91,6 %.
 */
export const NUBE_CON_ATIPICO: Cloud = {
  points: [
    { id: 'manzana', label: 'manzana', x: -1, y: 0 },
    { id: 'pera', label: 'pera', x: -0.5, y: 0.5 },
    { id: 'uva', label: 'uva', x: 0, y: -0.5 },
    { id: 'kiwi', label: 'kiwi', x: 0.5, y: 0.5 },
    { id: 'melon', label: 'melón', x: 1, y: 0 },
    { id: 'fresa', label: 'fresa', x: 0, y: 0 },
    { id: 'raro', label: 'asdf', x: 3, y: 3 },
  ],
};

/** `NUBE_CON_ATIPICO` sin el dato raro, para comparar. */
export const NUBE_SIN_ATIPICO: Cloud = {
  points: NUBE_CON_ATIPICO.points.filter((p) => p.id !== 'raro'),
};

/**
 * Reseñas de comida y de tecnología. Lo que más varía es el tema, a lo largo de (1, 1), con el 90,2 %
 * de la varianza, y sobre esa dirección las dos clases se mezclan; las separa la perpendicular,
 * (−1, 1), que solo lleva el 9,8 %.
 */
export const NUBE_CLASES_CRUZADAS: Cloud = {
  points: [
    { id: 'soso', label: 'soso', x: -1.5, y: -2.5, group: 0 },
    { id: 'rancio', label: 'rancio', x: -0.5, y: -1.5, group: 0 },
    { id: 'lento', label: 'lento', x: 1, y: 0, group: 0 },
    { id: 'roto', label: 'roto', x: 2.5, y: 1.5, group: 0 },
    { id: 'rico', label: 'rico', x: -2.5, y: -1.5, group: 1 },
    { id: 'sabroso', label: 'sabroso', x: -1, y: 0, group: 1 },
    { id: 'rapido', label: 'rápido', x: 0.5, y: 1.5, group: 1 },
    { id: 'fiable', label: 'fiable', x: 1.5, y: 2.5, group: 1 },
  ],
  groups: ['negativa', 'positiva'],
};

/** Lo que una pregunta decide de su laboratorio `capa`; el resto lo pone `capaLab`. */
export type CapaOptions = Partial<Omit<CapaSpec, 'kind' | 'points' | 'groups' | 'axes'>>;

/**
 * Laboratorio `capa` sobre una nube: ventana ±4, rejilla 0,5 y la capa en la identidad, salvo lo que
 * diga `options`.
 *
 *   capaLab(RESENAS, { readout: { w: [1, 0], b: 0 } })               // la neurona siguiente mira la salida 1
 *   capaLab(RESENAS, { i: [0, 1], j: [1, 0], movable: 'none' })      // una capa fija, para mirar
 *   capaLab(NUBE_ALARGADA, { movable: 'none', probe: { x: 0, y: 2, movable: true, on: 'input' } })
 */
export const capaLab = (cloud: Cloud, options: CapaOptions = {}): CapaSpec => ({
  kind: 'capa',
  range: 4,
  snap: 0.5,
  ...cloud,
  i: [1, 0],
  j: [0, 1],
  ...options,
});
