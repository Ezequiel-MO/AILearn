import type { Game } from '../../content/schema';
import { columnas } from './columnas';
import { componer } from './componer';
import { launch } from './despegue';
import { examen0 } from './examen-0';
import { matrizVector } from './matriz-vector';

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
  ],
};
