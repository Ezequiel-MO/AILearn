import type { Game } from '../../content/schema';
import { componentes } from './componentes';
import { examen0 } from './examen-0';
import { normaDistancia } from './norma-distancia';
import { launch } from './despegue';
import { sumaEscala } from './suma-escala';

export const vectores: Game = {
  id: 'vectores',
  title: 'Vectores y embeddings',
  launch,
  orbits: [
    {
      name: 'La flecha',
      projects: [componentes, sumaEscala, normaDistancia],
      examBank: examen0,
    },
  ],
};
