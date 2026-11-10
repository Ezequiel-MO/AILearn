import { describe, expect, it } from 'vitest';
import { atencion, atencionScene, type AtencionSpec } from './atencion';
import { startState } from './types';

// Dos tokens: «a» con clave (1, 0) y valor (10, 0); «b» con clave (0, 0) y valor (0, 10). Mira «a» con q = (1, 0).
const two: AtencionSpec = {
  kind: 'atencion',
  tokens: [
    { id: 'a', text: 'a', key: [1, 0], value: [10, 0] },
    { id: 'b', text: 'b', key: [0, 0], value: [0, 10] },
  ],
  focus: 0,
  query: [1, 0],
  range: 3,
  snap: 0.5,
};

const run = (spec: AtencionSpec, patch: Record<string, number> = {}) =>
  atencion.measure(spec, { ...startState(atencion.controls(spec)), ...patch });

describe('laboratorio atención', () => {
  it('con una consulta y dos claves reparte los pesos con un softmax', () => {
    const v = run(two);
    // contract: puntuaciones q·k = 1 y 0; pesos e/(e+1) = 0,7310586 y 1/(e+1) = 0,2689414
    expect(v.s_a).toBe(1);
    expect(v.s_b).toBe(0);
    expect(v.w_a).toBeCloseTo(0.7310586, 6);
    expect(v.w_b).toBeCloseTo(0.2689414, 6);
    // contract: el mayor peso es el de «a», índice 0, y «a» es el token que mira (self)
    expect(v.w_max).toBeCloseTo(0.7310586, 6);
    expect(v.top).toBe(0);
    expect(v.self).toBeCloseTo(0.7310586, 6);
    // contract: entropía binaria de 0,731 = −0,731·log2 0,731 − 0,269·log2 0,269 = 0,33040 + 0,50957 = 0,83997 bits
    expect(v.entropy).toBeCloseTo(0.83997, 4);
    // contract: sin máscara nada está enmascarado y el peso sobre el futuro (token 1) es el de «b»
    expect(v.masked).toBe(0);
    expect(v.future).toBeCloseTo(0.2689414, 6);
    // contract: la salida mezcla los valores: 0,7310586·(10, 0) + 0,2689414·(0, 10)
    expect(v.out_x).toBeCloseTo(7.310586, 5);
    expect(v.out_y).toBeCloseTo(2.689414, 5);
    // contract: sin `temperature` la temperatura es 1
    expect(v.temp).toBe(1);
  });

  it('sin valores no publica la salida', () => {
    const noValues: AtencionSpec = { ...two, tokens: two.tokens.map((t) => ({ id: t.id, text: t.text, key: t.key })) };
    // contract: out_x y out_y existen solo si todos los tokens tienen value
    expect(run(noValues)).not.toHaveProperty('out_x');
  });

  it('con consulta nula todos pesan igual y la entropía es log2 n', () => {
    const v = run(two, { qx: 0, qy: 0 });
    // contract: puntuaciones iguales (0 y 0) dan pesos 0,5 y 0,5; entropía de dos igualados = 1 bit
    expect(v.w_a).toBe(0.5);
    expect(v.w_b).toBe(0.5);
    expect(v.entropy).toBeCloseTo(1, 10);
    // contract: en un empate gana el primer token
    expect(v.top).toBe(0);
  });

  it('la temperatura divide las puntuaciones antes del softmax', () => {
    const spec: AtencionSpec = { ...two, temperature: { min: 0.5, max: 4, step: 0.5, start: 1 } };
    const v = run(spec, { temp: 2 });
    // contract: con temperatura 2 las puntuaciones son 0,5 y 0; w_a = 1/(1 + e^−0,5) = 0,6224593
    expect(v.s_a).toBe(0.5);
    expect(v.w_a).toBeCloseTo(0.6224593, 6);
    expect(v.temp).toBe(2);
    // contract: con temperatura 0,5 las puntuaciones son 2 y 0; w_a = 1/(1 + e^−2) = 0,8807971
    expect(run(spec, { temp: 0.5 }).w_a).toBeCloseTo(0.8807971, 6);
  });

  it('la máscara causal aparta a los tokens posteriores a focus', () => {
    const three: AtencionSpec = {
      kind: 'atencion',
      tokens: [
        { id: 'a', text: 'a', key: [0, 0] },
        { id: 'b', text: 'b', key: [0, 0] },
        { id: 'c', text: 'c', key: [5, 5] },
      ],
      focus: 1,
      query: [1, 1],
      range: 3,
      snap: 0.5,
      mask: 'causal',
    };
    const v = run(three);
    // contract: «c» viene después de «b» (focus 1): enmascarado, puntuación NaN y peso 0
    expect(v.s_c).toBeNaN();
    expect(v.w_c).toBe(0);
    expect(v.masked).toBe(1);
    expect(v.future).toBe(0);
    // contract: el peso se reparte solo entre «a» y «b», con puntuaciones 0 y 0: 0,5 cada uno
    expect(v.w_a).toBe(0.5);
    expect(v.w_b).toBe(0.5);
    // contract: out no existe (sin value); la entropía es 1 bit
    expect(v.entropy).toBeCloseTo(1, 10);
  });

  it('el interruptor activa la máscara y es un mando 0 o 1', () => {
    const spec: AtencionSpec = { ...two, mask: 'toggle' };
    // contract: el interruptor `mask` empieza en 0 (sin máscara) y va de 0 a 1 en pasos de 1
    expect(atencion.controls(spec).find((c) => c.id === 'mask')).toEqual({
      id: 'mask',
      min: 0,
      max: 1,
      step: 1,
      start: 0,
    });
    expect(run(spec).masked).toBe(0);
    // contract: con mask = 1 el token 1 (posterior a focus 0) queda fuera: «a» se lleva todo
    const on = run(spec, { mask: 1 });
    expect(on.masked).toBe(1);
    expect(on.w_a).toBe(1);
    expect(on.entropy).toBe(0);
    expect(on.future).toBe(0);
  });

  it('los mandos dependen de qué se arrastra', () => {
    // contract: por defecto se arrastra la consulta (qx, qy) desde su valor inicial
    expect(atencion.controls(two)).toEqual([
      { id: 'qx', min: -3, max: 3, step: 0.5, start: 1 },
      { id: 'qy', min: -3, max: 3, step: 0.5, start: 0 },
    ]);
    // contract: con movable «none» no hay mandos de posición
    expect(atencion.controls({ ...two, movable: 'none' })).toEqual([]);
    // contract: con movable «key» los mandos kx, ky parten de la clave de keyOf (token 1: (0, 0))
    const keyed: AtencionSpec = { ...two, movable: 'key', keyOf: 1 };
    expect(atencion.controls(keyed).map((c) => [c.id, c.start])).toEqual([
      ['kx', 0],
      ['ky', 0],
    ]);
    // contract: mover la clave de «b» a (1, 0) iguala las puntuaciones (1 y 1): pesos 0,5 y 0,5
    const v = run(keyed, { kx: 1, ky: 0 });
    expect(v.w_b).toBe(0.5);
    expect(atencionScene(keyed, { kx: 1, ky: 0, qx: 1, qy: 0 }).keys[1]).toEqual([1, 0]);
  });

  it('el mapa completo usa la consulta de cada fila y la de focus en vivo', () => {
    const spec: AtencionSpec = {
      kind: 'atencion',
      tokens: [
        { id: 'a', text: 'a', key: [1, 0], query: [0, 0] },
        { id: 'b', text: 'b', key: [0, 0], query: [0, 0] },
      ],
      focus: 1,
      query: [1, 0],
      range: 3,
      snap: 0.5,
      heatmap: true,
    };
    const heat = atencionScene(spec, startState(atencion.controls(spec))).heat;
    // contract: la fila de «a» (consulta nula) es uniforme; la de «b» (focus) usa q = (1, 0): e/(e+1), 1/(e+1)
    expect(heat[0]).toEqual([0.5, 0.5]);
    expect(heat[1]![0]).toBeCloseTo(0.7310586, 6);
    expect(heat[1]![1]).toBeCloseTo(0.2689414, 6);
    const causal = atencionScene(
      { ...spec, mask: 'causal' },
      startState(atencion.controls(spec)),
    ).heat;
    // contract: con máscara causal la fila 0 solo ve la columna 0 (la 1 es posterior)
    expect(causal[0]).toEqual([1, 0]);
    // contract: sin heatmap no hay mapa
    expect(atencionScene(two, startState(atencion.controls(two))).heat).toEqual([]);
  });
});
