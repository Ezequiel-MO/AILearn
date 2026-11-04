import type { Game } from '../../content/schema';
import { derivadaPendiente } from './derivada-pendiente';
import { launch } from './despegue';
import { examen0 } from './examen-0';
import { minimos } from './minimos';
import { reglasDerivacion } from './reglas-derivacion';

export const gradiente: Game = {
  id: 'gradiente',
  title: 'Derivadas y gradiente',
  bigPicture: {
    parts: ['loss', 'gradient', 'update'],
    text: 'Una red aprende moviendo sus pesos para equivocarse menos. Este juego construye esa parte: la **pérdida**, que mide cuánto se equivoca; el **gradiente**, que dice hacia dónde sube; y la **actualización**, un paso cuesta abajo. Va después de vectores y matrices porque los pesos son números de vectores y de matrices, y el gradiente es el vector que dice hacia dónde mover cada uno.',
  },
  launch,
  orbits: [
    {
      name: 'La pendiente',
      projects: [derivadaPendiente, reglasDerivacion, minimos],
      examBank: examen0,
    },
  ],
};
