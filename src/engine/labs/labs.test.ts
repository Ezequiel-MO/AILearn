import { describe, expect, it } from 'vitest';
import { labControls, labMeasure, labSolved, labStart } from './index';
import type { CapaSpec } from './capa';
import { goalMet, settle, settleValue, stateProblems, type LabControl } from './types';

const slider: LabControl = { id: 'k', min: -2, max: 2, step: 0.5, start: 1 };

describe('metas y mandos de un laboratorio', () => {
  it('una meta se cumple según su operador y un valor que no es finito no cumple ninguna', () => {
    // contract: gte y lte son desigualdades con el borde incluido; eq admite la tolerancia declarada
    expect(goalMet({ metric: 'm', op: 'gte', target: 1 }, { m: 1 })).toBe(true);
    expect(goalMet({ metric: 'm', op: 'gte', target: 1 }, { m: 0.99 })).toBe(false);
    expect(goalMet({ metric: 'm', op: 'lte', target: 1 }, { m: 1 })).toBe(true);
    expect(goalMet({ metric: 'm', op: 'lte', target: 1 }, { m: 1.01 })).toBe(false);
    expect(goalMet({ metric: 'm', op: 'eq', target: 1, tol: 0.1 }, { m: 1.1 })).toBe(true);
    expect(goalMet({ metric: 'm', op: 'eq', target: 1 }, { m: 1.1 })).toBe(false);
    // contract: NaN (una dirección nula, una división por cero) y una métrica que no existe no cumplen
    expect(goalMet({ metric: 'm', op: 'lte', target: 1 }, { m: NaN })).toBe(false);
    expect(goalMet({ metric: 'otra', op: 'lte', target: 1 }, { m: 0 })).toBe(false);
  });

  it('un valor se asienta en la rejilla del mando y dentro de sus límites', () => {
    // contract: el estado que se mide siempre es alcanzable con el mando
    expect(settleValue(slider, 0.7)).toBe(0.5);
    expect(settleValue(slider, 9)).toBe(2);
    expect(settleValue(slider, -9)).toBe(-2);
    expect(settleValue(slider, NaN)).toBe(1);
    expect(settle([slider], { otro: 3 })).toEqual({ k: 1 });
  });

  it('un estado escrito a mano con un mando inexistente o fuera de rejilla es un problema', () => {
    // contract: la solución declarada de una pregunta tiene que poder ponerse con los mandos
    expect(stateProblems([slider], { k: 1.5 })).toEqual([]);
    expect(stateProblems([slider], { k: 0.3 })).toHaveLength(1);
    expect(stateProblems([slider], { z: 0 })).toHaveLength(1);
  });
});

// Seis palabras con dos rasgos: intensidad (x) y tono (y). La neurona siguiente solo mira la salida 1.
const sentiment: CapaSpec = {
  kind: 'capa',
  range: 4,
  snap: 0.5,
  points: [
    { id: 'genial', label: 'genial', x: 2.5, y: 2, group: 1 },
    { id: 'bueno', label: 'bueno', x: 1, y: 1, group: 1 },
    { id: 'feliz', label: 'feliz', x: 2, y: 1.5, group: 1 },
    { id: 'horrible', label: 'horrible', x: 2.5, y: -2, group: 0 },
    { id: 'malo', label: 'malo', x: 1, y: -1, group: 0 },
    { id: 'triste', label: 'triste', x: 1.5, y: -1.5, group: 0 },
  ],
  groups: ['negativa', 'positiva'],
  i: [1, 0],
  j: [0, 1],
  readout: { w: [1, 0], b: 0 },
  pair: ['genial', 'horrible'],
};

describe('laboratorio capa', () => {
  it('tiene un mando por coordenada de cada columna que se arrastra', () => {
    // contract: las columnas de A son î y ĵ; por defecto se arrastran las dos
    expect(labControls(sentiment).map((c) => c.id)).toEqual(['ix', 'iy', 'jx', 'jy']);
    expect(labControls({ ...sentiment, movable: 'j' }).map((c) => c.id)).toEqual(['jx', 'jy']);
    expect(labStart(sentiment)).toEqual({ ix: 1, iy: 0, jx: 0, jy: 1 });
  });

  it('con la identidad, la neurona que mira la intensidad acierta la mitad', () => {
    const v = labMeasure(sentiment, labStart(sentiment));
    // contract: las seis palabras tienen intensidad positiva: dice «positiva» a todas y acierta 3 de 6
    expect(v.acc).toBeCloseTo(0.5);
    expect(v.hits).toBe(3);
    expect(v.det).toBe(1);
    expect(v.merged).toBe(0);
  });

  it('una capa que lleva el tono a la primera salida hace acertar a la neurona', () => {
    // contract: A = [[0, 1], [1, 0]] intercambia los rasgos; la salida 1 pasa a ser el tono
    const swap = { ix: 0, iy: 1, jx: 1, jy: 0 };
    const v = labMeasure(sentiment, swap);
    expect(v.acc).toBe(1);
    expect(v.det).toBe(-1);
    // contract: el margen es la distancia a la frontera de la palabra más justa: «bueno» y «malo», a 1
    expect(v.margin).toBeCloseTo(1);
    expect(labSolved(sentiment, [{ metric: 'acc', op: 'gte', target: 1 }], swap)).toBe(true);
  });

  it('una capa que borra el tono junta las palabras que solo se distinguían por él', () => {
    // contract: con ĵ = (0, 0) la salida es (intensidad, 0): genial–horrible y bueno–malo coinciden
    const v = labMeasure(sentiment, { jx: 0, jy: 0 });
    expect(v.det).toBe(0);
    expect(v.merged).toBe(2);
    expect(v.pair_dist0).toBeCloseTo(4);
    expect(v.pair_dist).toBeCloseTo(0);
  });

  it('la recta de v mide cuánta varianza conserva y si separa los grupos', () => {
    const spec: CapaSpec = {
      ...sentiment,
      movable: 'none',
      readout: undefined,
      probe: { x: 1, y: 0, movable: true, on: 'input' },
    };
    const along = labMeasure(spec, { vx: 0, vy: 1 });
    const across = labMeasure(spec, { vx: 1, vy: 0 });
    // contract: el tono (y) separa del todo los dos grupos; la intensidad (x), no
    expect(along.acc_v).toBe(1);
    expect(along.gap_v).toBeCloseTo(2);
    expect(across.acc_v).toBeLessThan(1);
    // contract: var_v + lost = varianza total, en cualquier dirección
    expect(along.var_v! + along.lost!).toBeCloseTo(across.var_v! + across.lost!);
    expect(along.var_frac).toBeGreaterThan(across.var_frac!);
    // contract: una dirección nula no tiene recta: sus métricas no son números
    expect(labMeasure(spec, { vx: 0, vy: 0 }).var_v).toBeNaN();
  });

  it('una capa fija anterior se compone con la del jugador y las dianas miden el resultado', () => {
    const spec: CapaSpec = {
      kind: 'capa',
      range: 4,
      snap: 0.5,
      points: [{ id: 'p', label: 'p', x: 1, y: 2 }],
      i: [1, 0],
      j: [0, 1],
      before: { i: [2, 0], j: [0, 1] },
      targets: { p: [1, 2] },
    };
    // contract: B = diag(2, 1) lleva (1, 2) a (2, 2); A = diag(0,5; 1) lo devuelve a su diana
    expect(labMeasure(spec, labStart(spec)).target_err).toBeCloseTo(1);
    const undone = labMeasure(spec, { ix: 0.5 });
    expect(undone.target_err).toBeCloseTo(0);
    expect(undone.on_target).toBe(1);
    expect(undone.det_total).toBeCloseTo(1);
  });

  it('aplicar la capa varias veces a v alarga o encoge según el autovalor', () => {
    const spec: CapaSpec = {
      kind: 'capa',
      range: 6,
      snap: 0.5,
      points: [{ id: 'p', label: 'p', x: 1, y: 1 }],
      i: [1.5, 0],
      j: [0, 0.5],
      movable: 'none',
      probe: { x: 1, y: 0, movable: true },
      iterate: 3,
    };
    // contract: (1, 0) es autovector de autovalor 1,5: tres pasos lo multiplican por 1,5³
    const grow = labMeasure(spec, { vx: 1, vy: 0 });
    expect(grow.img_angle).toBeCloseTo(0);
    expect(grow.stretch).toBeCloseTo(1.5);
    expect(grow.iter_norm).toBeCloseTo(3.375);
    // contract: (0, 1) es autovector de autovalor 0,5: tres pasos lo dejan en 0,125
    expect(labMeasure(spec, { vx: 0, vy: 1 }).iter_norm).toBeCloseTo(0.125);
  });
});
