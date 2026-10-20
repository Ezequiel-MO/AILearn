import type { Game } from '../../content/schema';
import { columnas } from './columnas';
import { componer } from './componer';
import { launch } from './despegue';
import { determinante } from './determinante';
import { examen0 } from './examen-0';
import { examen1 } from './examen-1';
import { inversa } from './inversa';
import { matrizVector } from './matriz-vector';
import { rango } from './rango';

export const matrices: Game = {
  id: 'matrices',
  title: 'Matrices y transformaciones',
  launch,
  orbits: [
    {
      name: 'La máquina',
      projects: [columnas, matrizVector, componer],
      examBank: examen0,
    },
    {
      name: 'El área',
      projects: [determinante, inversa, rango],
      examBank: examen1,
    },
  ],
};
