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
