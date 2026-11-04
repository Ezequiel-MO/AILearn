import type { Game } from '../../content/schema';
import { columnas } from './columnas';
import { componer } from './componer';
import { launch } from './despegue';
import { determinante } from './determinante';
import { examen0 } from './examen-0';
import { examen1 } from './examen-1';
import { examen2 } from './examen-2';
import { examen3 } from './examen-3';
import { atencion } from './atencion';
import { autovectores } from './autovectores';
import { inversa } from './inversa';
import { matrizVector } from './matriz-vector';
import { pca } from './pca';
import { rango } from './rango';
import { rangoBajo } from './rango-bajo';
import { simetricas } from './simetricas';
import { svd } from './svd';

export const matrices: Game = {
  id: 'matrices',
  title: 'Matrices y transformaciones',
  bigPicture: {
    parts: ['linear', 'attention', 'compress'],
    text: 'Este juego construye la pieza que más pesa en una red: la capa lineal, una matriz que transforma todos los vectores que le llegan. Empieza por ver qué hace una matriz, sigue con cuándo pierde información y con sus direcciones propias, y acaba en la atención y en la compresión con rango bajo. Va tras los vectores porque una matriz solo es una máquina de transformar vectores.',
  },
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
    {
      name: 'Direcciones propias',
      projects: [autovectores, simetricas, pca],
      examBank: examen2,
    },
    {
      name: 'Descomponer y aproximar',
      projects: [svd, rangoBajo, atencion],
      examBank: examen3,
    },
  ],
};
