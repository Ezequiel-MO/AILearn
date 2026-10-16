import type { BankEntry } from '../../content/schema';
import { examen3Analogias } from './examen-3-analogias';
import { examen3FallosRag } from './examen-3-fallos-rag';
import { examen3Vecinos } from './examen-3-vecinos';

/**
 * Banco de examen de la Órbita 3: cuatro entradas por proyecto, tres fijas (en el fichero de cada
 * proyecto) y una generada, que da números distintos en cada examen.
 * Ids: `examen-3.<tema>`, únicos en todo el juego.
 */
export const examen3: BankEntry[] = [
  ...examen3Vecinos,
  {
    project: 'vecinos',
    question: {
      type: 'generada',
      id: 'examen-3.mejor-puntuacion',
      generator: 'mejor-puntuacion',
      params: {},
    },
  },
  ...examen3Analogias,
  {
    project: 'analogias',
    question: { type: 'generada', id: 'examen-3.analogia', generator: 'analogia', params: {} },
  },
  ...examen3FallosRag,
  {
    project: 'fallos-rag',
    question: { type: 'generada', id: 'examen-3.umbral', generator: 'umbral', params: {} },
  },
];
