import type { BankEntry } from '../../content/schema';
import { examen1Determinante } from './examen-1-determinante';
import { examen1Inversa } from './examen-1-inversa';
import { examen1Rango } from './examen-1-rango';

/**
 * Banco de examen de la Órbita 1 del juego de matrices: cuatro entradas por proyecto, tres fijas
 * (en el fichero de cada proyecto) y una generada, que da números distintos en cada examen.
 * Determinante lleva el determinante de una 2×2; Inversa, un sistema A·x = b; Rango, el rango de
 * una 3×3.
 * Ids: `examen-1.<tema>`, únicos en todo el juego.
 */
export const examen1: BankEntry[] = [
  ...examen1Determinante,
  {
    project: 'determinante',
    question: {
      type: 'generada',
      id: 'examen-1.determinante',
      generator: 'determinante',
      params: {},
    },
  },
  ...examen1Inversa,
  {
    project: 'inversa',
    question: {
      type: 'generada',
      id: 'examen-1.resolver-sistema',
      generator: 'resolver-sistema',
      params: {},
    },
  },
  ...examen1Rango,
  {
    project: 'rango',
    question: {
      type: 'generada',
      id: 'examen-1.rango',
      generator: 'rango',
      params: {},
    },
  },
];
