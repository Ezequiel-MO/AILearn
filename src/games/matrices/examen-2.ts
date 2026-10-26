import type { BankEntry } from '../../content/schema';
import { examen2Autovectores } from './examen-2-autovectores';
import { examen2Pca } from './examen-2-pca';
import { examen2Simetricas } from './examen-2-simetricas';

/**
 * Banco de examen de la Órbita 2 del juego de matrices: cuatro entradas por proyecto, tres fijas
 * (en el fichero de cada proyecto) y una generada, que da números distintos en cada examen.
 * Ids: `examen-2.<tema>`, únicos en todo el juego.
 */
export const examen2: BankEntry[] = [
  ...examen2Autovectores,
  {
    project: 'autovectores',
    question: {
      type: 'generada',
      id: 'examen-2.autovalores',
      generator: 'autovalores',
      params: {},
    },
  },
  ...examen2Simetricas,
  {
    project: 'simetricas',
    question: {
      type: 'generada',
      id: 'examen-2.covarianza',
      generator: 'covarianza',
      params: {},
    },
  },
  ...examen2Pca,
  {
    project: 'pca',
    question: {
      type: 'generada',
      id: 'examen-2.varianza-explicada',
      generator: 'varianza-explicada',
      params: {},
    },
  },
];
