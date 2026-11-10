import { describe, expect, it } from 'vitest';
import { lora, loraScene, type LoraSpec } from './lora';
import { goalMet, settle, startState, type LabControl, type LabState } from './types';

// Seis palabras con dos rasgos (intensidad, tono); W = identidad; la neurona siguiente mira la primera salida.
const loraClassifierSpec: LoraSpec = {
  kind: 'lora',
  range: 4,
  points: [
    { id: 'genial', label: 'genial', x: 2.5, y: 2, group: 1 },
    { id: 'bueno', label: 'bueno', x: 1, y: 1, group: 1 },
    { id: 'feliz', label: 'feliz', x: 2, y: 1.5, group: 1 },
    { id: 'horrible', label: 'horrible', x: 2.5, y: -2, group: 0 },
    { id: 'malo', label: 'malo', x: 1, y: -1, group: 0 },
    { id: 'triste', label: 'triste', x: 1.5, y: -1.5, group: 0 },
  ],
  groups: ['negativa', 'positiva'],
  w: { i: [1, 0], j: [0, 1] },
  limit: 2,
  step: 0.5,
  readout: { w: [1, 0], b: 0 },
};

const loraTargetsSpec: LoraSpec = {
  kind: 'lora',
  range: 4,
  points: [
    { id: 'a', label: 'perro', x: 1, y: 1 },
    { id: 'b', label: 'gato', x: 2, y: 0 },
    { id: 'c', label: 'lobo', x: -1, y: 1 },
    { id: 'd', label: 'pez', x: 0, y: 2 },
  ],
  w: { i: [1, 0.5], j: [-0.5, 1] },
  limit: 2,
  step: 0.5,
  targets: { a: [1.25, 0], b: [3, -1], c: [-1.75, 1], d: [-0.5, 1] },
};

const loraFullSpec: LoraSpec = {
  kind: 'lora',
  mode: 'full',
  range: 4,
  points: [
    { id: 'p', label: 'rojo', x: 2, y: 1 },
    { id: 'q', label: 'azul', x: 1, y: -2 },
    { id: 'r', label: 'verde', x: -1, y: 2 },
    { id: 's', label: 'gris', x: 2, y: -1 },
  ],
  w: { i: [1, 0], j: [0.5, 1] },
  limit: 1,
  step: 0.25,
  targets: { p: [3.5, 0.5], q: [0.5, -1], r: [-0.5, 1], s: [2.5, -0.5] },
};

const sizeSpec: LoraSpec = {
  ...loraClassifierSpec,
  size: { d: 4096, k: 4096, r: { min: 1, max: 64, step: 1, start: 32 } },
};

const measureAt = (spec: LoraSpec, patch: LabState = {}) =>
  lora.measure(spec, settle(lora.controls(spec), { ...startState(lora.controls(spec)), ...patch }));

/** Todos los estados de la rejilla de los cuatro mandos (más `r` fijo). */
const grid = (controls: readonly LabControl[]): LabState[] => {
  const four = controls.slice(0, 4);
  const axes = four.map((c) => {
    const n = Math.round((c.max - c.min) / c.step);
    return Array.from({ length: n + 1 }, (_, k) => c.min + k * c.step);
  });
  const out: LabState[] = [];
  for (const v0 of axes[0]!)
    for (const v1 of axes[1]!)
      for (const v2 of axes[2]!)
        for (const v3 of axes[3]!)
          out.push({ [four[0]!.id]: v0, [four[1]!.id]: v1, [four[2]!.id]: v2, [four[3]!.id]: v3 });
  return out;
};

describe('laboratorio lora: mandos', () => {
  it('en modo lora hay B y A, y A empieza en (1, 0) y B en 0', () => {
    // contract: la cabecera de lora.ts: b1, b2, a1, a2; por defecto B = (0, 0) y A = (1, 0)
    expect(lora.controls(loraClassifierSpec)).toEqual([
      { id: 'b1', min: -2, max: 2, step: 0.5, start: 0 },
      { id: 'b2', min: -2, max: 2, step: 0.5, start: 0 },
      { id: 'a1', min: -2, max: 2, step: 0.5, start: 1 },
      { id: 'a2', min: -2, max: 2, step: 0.5, start: 0 },
    ]);
  });

  it('en modo full hay cuatro mandos d, y con size, el mando r', () => {
    // contract: la cabecera de lora.ts: d11, d12, d21, d22 empiezan en 0; con size, r con los límites de size.r
    expect(lora.controls(loraFullSpec).map((c) => [c.id, c.start])).toEqual([
      ['d11', 0],
      ['d12', 0],
      ['d21', 0],
      ['d22', 0],
    ]);
    expect(lora.controls(sizeSpec).at(-1)).toEqual({
      id: 'r',
      min: 1,
      max: 64,
      step: 1,
      start: 32,
    });
  });

  it('start fija los valores iniciales de los cuatro mandos, en orden', () => {
    // contract: start = [b1, b2, a1, a2] en modo lora
    const spec: LoraSpec = { ...loraClassifierSpec, start: [0.5, -0.5, 1.5, 1] };
    expect(lora.controls(spec).map((c) => c.start)).toEqual([0.5, -0.5, 1.5, 1]);
  });
});

describe('laboratorio lora: el modelo afinado empieza siendo el original', () => {
  it('con B = 0 la corrección es nula y nada se mueve', () => {
    const m = measureAt(loraClassifierSpec);
    // contract: B = 0 hace ΔW = B·A = 0: rango 0, norma 0 y ninguna palabra se mueve
    expect(m.delta_rank).toBe(0);
    expect(m.delta_norm).toBe(0);
    expect(m.moved).toBe(0);
    expect(m.m11).toBe(m.w11);
    expect(m.m22).toBe(m.w22);
    // con A cualquiera, también
    expect(measureAt(loraClassifierSpec, { a1: -1, a2: 2 }).moved).toBe(0);
  });

  it('el clasificador falla con el modelo original: acierta la mitad', () => {
    // contract: con W = identidad, las seis palabras tienen x > 0 y la neurona dice «positiva» a todas: 3 de 6
    const m = measureAt(loraClassifierSpec);
    expect(m.acc).toBe(0.5);
    expect(m.hits).toBe(3);
  });
});

describe('laboratorio lora: una corrección de rango 1', () => {
  it('B = (1,5; 0) y A = (0, 1) dan ΔW = [[0, 1,5], [0, 0]] de rango 1', () => {
    const m = measureAt(loraClassifierSpec, { b1: 1.5, b2: 0, a1: 0, a2: 1 });
    // contract: ΔW = B·A = [[b1·a1, b1·a2], [b2·a1, b2·a2]] = [[0, 1,5], [0, 0]]
    expect([m.d11, m.d12, m.d21, m.d22]).toEqual([0, 1.5, 0, 0]);
    // contract: W + ΔW con W = identidad es [[1, 1,5], [0, 1]]
    expect([m.m11, m.m12, m.m21, m.m22]).toEqual([1, 1.5, 0, 1]);
    // contract: un producto columna por fila no nulo tiene rango 1; la norma de Frobenius de [[0, 1,5], [0, 0]] es 1,5
    expect(m.delta_rank).toBe(1);
    expect(m.delta_norm).toBeCloseTo(1.5, 12);
  });

  it('con esa corrección el clasificador acierta todo, con margen 0,5 y moviendo 3 a la palabra más lejana', () => {
    const m = measureAt(loraClassifierSpec, { b1: 1.5, b2: 0, a1: 0, a2: 1 });
    // contract: x′ = x + 1,5·y; «horrible» (2,5; −2) → −0,5, «malo» (1; −1) → −0,5, «triste» (1,5; −1,5) → −0,75: todos < 0, y los positivos > 0
    expect(m.acc).toBe(1);
    expect(m.hits).toBe(6);
    // contract: el margen es la menor distancia con signo a la frontera x′ = 0: 0,5 («horrible» y «malo»)
    expect(m.margin).toBeCloseTo(0.5, 12);
    // contract: cada palabra se mueve 1,5·|y| en horizontal; el mayor |y| es 2 («genial» y «horrible») → 3
    expect(m.moved).toBeCloseTo(3, 12);
  });

  it('todas las flechas de desplazamiento son paralelas a B, y distintas', () => {
    const spec = loraClassifierSpec;
    const state = { b1: -1, b2: 0.5, a1: 1.5, a2: -0.5 };
    const scene = loraScene(spec, state);
    const lengths = spec.points.map((p) => {
      const from = scene.original[p.id]!;
      const to = scene.afterTuning[p.id]!;
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      // contract: el desplazamiento de x es ΔW·x = B·(A·x): su producto vectorial con B es 0 (paralelos)
      expect(dx * state.b2 - dy * state.b1).toBeCloseTo(0, 12);
      return Math.hypot(dx, dy);
    });
    // contract: la cantidad es |A·x|·|B|: palabras con A·x distinto se mueven distinto
    expect(new Set(lengths.map((l) => l.toFixed(6))).size).toBeGreaterThan(1);
  });

  it('existe una solución de rango 1 en la rejilla de los deslizadores', () => {
    // contract: la solución declarada de la muestra está en la rejilla y es de rango ≤ 1 por construcción
    const states = grid(lora.controls(loraClassifierSpec));
    const winners = states.filter((s) => lora.measure(loraClassifierSpec, s).acc === 1);
    expect(winners.length).toBeGreaterThan(0);
    expect(winners.every((s) => lora.measure(loraClassifierSpec, s).delta_rank <= 1)).toBe(true);
  });
});

describe('laboratorio lora: dianas', () => {
  const solved = { b1: 0.5, b2: -1, a1: 1, a2: 0.5 };

  it('al empezar, la palabra más lejana de su diana está a √5', () => {
    // contract: ΔW = [[0,5; 0,25], [−1; −0,5]]; ΔW·(2, 0) = (1, −2), el mayor de los cuatro desvíos: √5 (los otros: 1,68; 0,56; 1,12)
    const m = measureAt(loraTargetsSpec);
    expect(m.target_err).toBeCloseTo(Math.sqrt(5), 12);
    expect(m.on_target).toBe(0);
  });

  it('con B = (0,5; −1) y A = (1; 0,5) las cuatro palabras caen en su diana', () => {
    const m = measureAt(loraTargetsSpec, solved);
    // contract: las dianas se construyeron como (W + B·A)·x para esos B y A
    expect(m.target_err).toBe(0);
    expect(m.on_target).toBe(4);
    expect(m.delta_rank).toBe(1);
    expect(goalMet({ metric: 'target_err', op: 'lte', target: 0 }, m)).toBe(true);
  });

  it('W + B·A son las cuatro entradas de la capa afinada', () => {
    const m = measureAt(loraTargetsSpec, solved);
    // contract: W = [[1; −0,5], [0,5; 1]] (columnas (1; 0,5) y (−0,5; 1)); B·A = [[0,5; 0,25], [−1; −0,5]]; suma [[1,5; −0,25], [−0,5; 0,5]]
    expect([m.m11, m.m12, m.m21, m.m22]).toEqual([1.5, -0.25, -0.5, 0.5]);
  });
});

describe('laboratorio lora: ajuste completo frente a rango 1', () => {
  it('ΔW entera lleva las palabras a unas dianas que exigen rango 2', () => {
    const m = measureAt(loraFullSpec, { d11: 0.5, d12: 0, d21: 0, d22: -0.5 });
    // contract: las dianas son (W + ΔW)·x con ΔW = diag(0,5; −0,5), de rango 2
    expect(m.target_err).toBe(0);
    expect(m.delta_rank).toBe(2);
    // contract: norma de Frobenius de diag(0,5; −0,5) = √(0,25 + 0,25)
    expect(m.delta_norm).toBeCloseTo(Math.sqrt(0.5), 12);
  });

  it('ninguna corrección de rango 1 de la rejilla alcanza esas dianas', () => {
    const asLora: LoraSpec = { ...loraFullSpec, mode: 'lora' };
    const best = Math.min(
      ...grid(lora.controls(asLora)).map((s) => lora.measure(asLora, s).target_err!),
    );
    // contract: dos palabras independientes fijan ΔW entera, y es de rango 2: un producto B·A no puede ser igual
    expect(best).toBeGreaterThan(1e-6);
  });

  it('el rango de ΔW es 0, 1 o 2 según su determinante', () => {
    // contract: [[1, 1], [1, 1]] tiene det 0 y no es nula → rango 1; la identidad tiene det 1 → rango 2; la nula, rango 0
    expect(measureAt(loraFullSpec, { d11: 1, d12: 1, d21: 1, d22: 1 }).delta_rank).toBe(1);
    expect(measureAt(loraFullSpec, { d11: 1, d22: 1 }).delta_rank).toBe(2);
    expect(measureAt(loraFullSpec).delta_rank).toBe(0);
  });
});

describe('laboratorio lora: parámetros de una capa real', () => {
  it('cuenta d·k frente a r·(d + k)', () => {
    const m = measureAt(sizeSpec, { r: 16 });
    // contract: 4096 · 4096 = 16 777 216; 16 · (4096 + 4096) = 131 072; cociente 131 072 / 16 777 216 = 1/128
    expect(m.params_full).toBe(16_777_216);
    expect(m.params_lora).toBe(131_072);
    expect(m.saving).toBe(1 / 128);
    expect(m.saving_pct).toBeCloseTo(0.78125, 12);
    expect(m.r).toBe(16);
  });

  it('r = 8 entrena 256 veces menos, y la meta «≤ 1 %» pide r ≤ 20', () => {
    // contract: 16 777 216 / (8 · 8192) = 256
    expect(
      measureAt(sizeSpec, { r: 8 }).params_full! / measureAt(sizeSpec, { r: 8 }).params_lora!,
    ).toBe(256);
    // contract: r · 8192 / 16 777 216 ≤ 0,01 ⇔ r ≤ 20,48
    const goal = { metric: 'saving_pct', op: 'lte' as const, target: 1 };
    expect(goalMet(goal, measureAt(sizeSpec, { r: 20 }))).toBe(true);
    expect(goalMet(goal, measureAt(sizeSpec, { r: 21 }))).toBe(false);
  });

  it('sin size no hay métricas de parámetros', () => {
    // contract: params_* y saving existen solo con size
    expect(Object.hasOwn(measureAt(loraClassifierSpec), 'params_lora')).toBe(false);
  });
});
