import type { BankEntry } from '../../content/schema';
import { examen0DerivadaPendiente } from './examen-0-derivada-pendiente';
import { examen0Minimos } from './examen-0-minimos';
import { examen0ReglasDerivacion } from './examen-0-reglas-derivacion';

/**
 * Banco de examen de la Órbita 0 «La pendiente» del juego 3: cuatro entradas por proyecto, tres fijas
 * (en el fichero de cada proyecto) y una generada, que da números distintos en cada examen.
 * Ids: `examen-0.<tema>`, únicos en todo el juego.
 */
export const examen0: BankEntry[] = [
  ...examen0DerivadaPendiente,
  {
    project: 'derivada-pendiente',
    question: {
      type: 'generada',
      id: 'examen-0.pendiente-secante',
      generator: 'pendiente-secante',
      params: {},
    },
  },
  ...examen0ReglasDerivacion,
  {
    project: 'reglas-derivacion',
    question: {
      type: 'generada',
      id: 'examen-0.derivada-polinomio',
      generator: 'derivada-polinomio',
      params: {},
    },
  },
  ...examen0Minimos,
  {
    project: 'minimos',
    question: {
      type: 'generada',
      id: 'examen-0.minimo-perdida',
      generator: 'minimo-perdida',
      params: {},
    },
  },
];
