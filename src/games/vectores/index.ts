import type { Game } from '../../content/schema';
import { componentes } from './componentes';
import { coseno } from './coseno';
import { dimensionAlta } from './dimension-alta';
import { examen0 } from './examen-0';
import { examen1 } from './examen-1';
import { examen2 } from './examen-2';
import { normaDistancia } from './norma-distancia';
import { normalizar } from './normalizar';
import { launch } from './despegue';
import { productoEscalar } from './producto-escalar';
import { proyeccion } from './proyeccion';
import { rnNumpy } from './rn-numpy';
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
    {
      name: 'El ángulo',
      projects: [productoEscalar, coseno, proyeccion],
      examBank: examen1,
    },
    {
      name: 'Muchas dimensiones',
      projects: [rnNumpy, normalizar, dimensionAlta],
      examBank: examen2,
    },
  ],
};
