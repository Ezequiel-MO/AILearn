import type { BankEntry } from '../../content/schema';
import { examen1Coseno } from './examen-1-coseno';
import { examen1ProductoEscalar } from './examen-1-producto-escalar';
import { examen1Proyeccion } from './examen-1-proyeccion';

/**
 * Banco de examen de la Órbita 1: cuatro entradas por proyecto, tres fijas (en el fichero de cada
 * proyecto) y una generada, que da números distintos en cada examen.
 * Ids: `examen-1.<tema>`, únicos en todo el juego.
 */
export const examen1: BankEntry[] = [
  ...examen1ProductoEscalar,
  {
    project: 'producto-escalar',
    question: { type: 'generada', id: 'examen-1.producto', generator: 'producto', params: {} },
  },
  ...examen1Coseno,
  {
    project: 'coseno',
    question: { type: 'generada', id: 'examen-1.coseno', generator: 'coseno', params: {} },
  },
  ...examen1Proyeccion,
  {
    project: 'proyeccion',
    question: { type: 'generada', id: 'examen-1.proyeccion', generator: 'proyeccion', params: {} },
  },
];
