import type { BankEntry } from '../../content/schema';
import { examen3Atencion } from './examen-3-atencion';
import { examen3RangoBajo } from './examen-3-rango-bajo';
import { examen3Svd } from './examen-3-svd';

/**
 * Banco de examen de la Órbita 3 del juego de matrices: cuatro entradas por proyecto, tres fijas
 * (en el fichero de cada proyecto) y una generada, que da números distintos en cada examen.
 * Ids: `examen-3.<tema>`, únicos en todo el juego.
 */
export const examen3: BankEntry[] = [
  ...examen3Svd,
  {
    project: 'svd',
    question: {
      type: 'generada',
      id: 'examen-3.valores-singulares',
      generator: 'valores-singulares',
      params: {},
    },
  },
  ...examen3RangoBajo,
  {
    project: 'rango-bajo',
    question: {
      type: 'generada',
      id: 'examen-3.parametros-lora',
      generator: 'parametros-lora',
      params: {},
    },
  },
  ...examen3Atencion,
  {
    project: 'atencion',
    question: {
      type: 'generada',
      id: 'examen-3.puntuacion-atencion',
      generator: 'puntuacion-atencion',
      params: {},
    },
  },
];
