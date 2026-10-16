import type { BankEntry } from '../../content/schema';
import { examen2DimensionAlta } from './examen-2-dimension-alta';
import { examen2Normalizar } from './examen-2-normalizar';
import { examen2RnNumpy } from './examen-2-rn-numpy';

/**
 * Banco de examen de la Órbita 2: cuatro entradas por proyecto, tres fijas (en el fichero de cada
 * proyecto) y una generada, que da números distintos en cada examen.
 * Ids: `examen-2.<tema>`, únicos en todo el juego.
 */
export const examen2: BankEntry[] = [
  ...examen2RnNumpy,
  {
    project: 'rn-numpy',
    question: {
      type: 'generada',
      id: 'examen-2.producto-rn',
      generator: 'producto-rn',
      params: {},
    },
  },
  ...examen2Normalizar,
  {
    project: 'normalizar',
    question: { type: 'generada', id: 'examen-2.normalizar', generator: 'normalizar', params: {} },
  },
  ...examen2DimensionAlta,
  {
    project: 'dimension-alta',
    question: {
      type: 'generada',
      id: 'examen-2.coseno-azar',
      generator: 'coseno-azar',
      params: {},
    },
  },
];
