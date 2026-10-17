import type { BankEntry } from '../../content/schema';
import { examen0Columnas } from './examen-0-columnas';
import { examen0Componer } from './examen-0-componer';
import { examen0MatrizVector } from './examen-0-matriz-vector';

/**
 * Banco de examen de la Órbita 0 del juego de matrices: cuatro entradas por proyecto, tres fijas
 * (en el fichero de cada proyecto) y una generada, que da números distintos en cada examen.
 * Columnas lleva la imagen de un punto como combinación de columnas; Matriz por vector, la forma
 * de un producto (capas y lotes); Componer, el producto de dos matrices.
 * Ids: `examen-0.<tema>`, únicos en todo el juego.
 */
export const examen0: BankEntry[] = [
  ...examen0Columnas,
  {
    project: 'columnas',
    question: {
      type: 'generada',
      id: 'examen-0.matriz-vector',
      generator: 'matriz-vector',
      params: {},
    },
  },
  ...examen0MatrizVector,
  {
    project: 'matriz-vector',
    question: {
      type: 'generada',
      id: 'examen-0.forma-producto',
      generator: 'forma-producto',
      params: {},
    },
  },
  ...examen0Componer,
  {
    project: 'componer',
    question: {
      type: 'generada',
      id: 'examen-0.producto-matrices',
      generator: 'producto-matrices',
      params: {},
    },
  },
];
