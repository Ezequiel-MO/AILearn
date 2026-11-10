import { describe, expect, it } from 'vitest';
import { descenso, descensoScene, type DescensoSpec } from './descenso';
import { goalMet, settle, startState } from './types';

const measure = (spec: DescensoSpec, patch: Record<string, number> = {}) => {
  const c = descenso.controls(spec);
  return descenso.measure(spec, settle(c, { ...startState(c), ...patch }));
};
const scene = (spec: DescensoSpec, patch: Record<string, number> = {}) => {
  const c = descenso.controls(spec);
  return descensoScene(spec, settle(c, { ...startState(c), ...patch }));
};

// Un cuenco L = x² + y² desde (3, 2): el descenso simple multiplica la posición por (1 − 2·lr).
const bowl: DescensoSpec = {
  kind: 'descenso',
  surface: { kind: 'quadratic', a: 1, b: 1 },
  window: { x: [-4, 4], y: [-4, 4] },
  start: { x: 3, y: 2 },
  rate: { min: 0.05, max: 1.2, step: 0.05, start: 0.1 },
  steps: 20,
  threshold: 1,
};

describe('descenso: mandos', () => {
  it('solo hay mandos para lo que la especificación deja variar', () => {
    // contract: un parámetro fijo no tiene mando; cada deslizador y el optimizador sí, y el inicio movible da sx y sy
    expect(descenso.controls({ ...bowl, rate: 0.1 }).map((c) => c.id)).toEqual([]);
    expect(descenso.controls(bowl).map((c) => c.id)).toEqual(['lr']);
    const full: DescensoSpec = {
      ...bowl,
      start: { x: 3, y: 2, movable: true },
      steps: { min: 5, max: 50, step: 5, start: 20 },
      optimizers: ['sgd', 'adam'],
      beta: { min: 0, max: 0.9, step: 0.1, start: 0.9 },
    };
    expect(descenso.controls(full).map((c) => c.id)).toEqual([
      'sx',
      'sy',
      'lr',
      'n',
      'opt',
      'beta',
    ]);
    // contract: el punto movible recorre la ventana con rejilla de 0,5 por defecto
    expect(descenso.controls(full)[0]).toEqual({ id: 'sx', min: -4, max: 4, step: 0.5, start: 3 });
  });
});

describe('descenso: cuenco', () => {
  it('cada paso multiplica la posición por 1 − 2·lr y la pérdida por (1 − 2·lr)²', () => {
    const m = measure(bowl);
    const s = scene(bowl);
    // contract: con lr = 0,1 el factor es 0,8: de (3, 2) a (2,4; 1,6)
    expect(s.path[1]![0]).toBeCloseTo(2.4, 10);
    expect(s.path[1]![1]).toBeCloseTo(1.6, 10);
    // contract: L(3, 2) = 9 + 4 = 13
    expect(m.loss0).toBeCloseTo(13, 10);
    // contract: tras 20 pasos la pérdida es 13·0,64²⁰
    expect(m.loss).toBeCloseTo(13 * 0.64 ** 20, 12);
    expect(s.path).toHaveLength(21);
    // contract: el mínimo global del cuenco es (0, 0), de pérdida 0
    expect(s.minimum).toEqual([0, 0]);
    expect(m.best).toBe(0);
    expect(m.gap).toBeCloseTo(m.loss!, 12);
    expect(m.dist).toBeCloseTo(Math.hypot(3, 2) * 0.8 ** 20, 12);
    // contract: la pérdida baja en cada paso y la posición no cambia de sentido
    expect(m.ups).toBe(0);
    expect(m.turns).toBe(0);
    expect(m.diverged).toBe(0);
    expect(m.min_loss).toBe(m.loss);
  });

  it('first_below es el primer paso con pérdida ≤ umbral, y NaN sin umbral o si nunca llega', () => {
    // contract: 13·0,64⁵ = 1,396 > 1 y 13·0,64⁶ = 0,893 ≤ 1: el paso 6
    expect(measure(bowl).first_below).toBe(6);
    // contract: con lr = 0,05 el factor es 0,9 y tras 20 pasos la pérdida (0,19) sigue sobre el umbral 0,05
    expect(measure({ ...bowl, threshold: 0.05 }, { lr: 0.05 }).first_below).toBeNaN();
    expect(measure({ ...bowl, threshold: undefined }).first_below).toBeNaN();
    // contract: la pérdida de salida ya cumple un umbral mayor que 13: paso 0
    expect(measure({ ...bowl, threshold: 20 }).first_below).toBe(0);
  });

  it('con lr = 1 la posición rebota de lado a lado y con lr > 1 la pérdida sube en cada paso', () => {
    // contract: el factor es −1: x = 3, −3, 3…; el paso cambia de sentido en cada uno salvo el primero (19 de 20)
    const m = measure(bowl, { lr: 1 });
    expect(m.turns).toBe(19);
    expect(m.loss).toBeCloseTo(13, 10);
    // contract: con lr = 1,05 el factor es −1,1: |posición| crece en cada paso, así que la pérdida sube 20 veces
    expect(measure(bowl, { lr: 1.05 }).ups).toBe(20);
  });

  it('una trayectoria que se aleja más de 100 ventanas se corta y marca diverged', () => {
    // contract: con lr = 1,2 el factor es −1,4; 3·1,4ᵏ supera 100·8 = 800 en el paso 17, antes de los 20
    const s = scene(bowl, { lr: 1.2 });
    expect(s.diverged).toBe(true);
    expect(s.path.length).toBeLessThan(21);
    expect(measure(bowl, { lr: 1.2 }).diverged).toBe(1);
    // contract: con lr = 1,05 (factor −1,1) la pérdida sube pero 3·1,1²⁰ = 20 no llega a 800: no se corta
    expect(measure(bowl, { lr: 1.05 }).diverged).toBe(0);
  });

  it('el estado se asienta en los límites de los pasos: nunca más de 200', () => {
    const spec: DescensoSpec = { ...bowl, rate: 0.01, steps: 999 };
    // contract: el modelo corta a 200 pasos aunque la especificación pida más (el esquema ya lo prohíbe)
    expect(measure(spec).steps).toBe(200);
    expect(scene(spec).path).toHaveLength(201);
  });
});

describe('descenso: silla y valle', () => {
  it('en una silla no hay mínimo global', () => {
    const saddle: DescensoSpec = { ...bowl, surface: { kind: 'quadratic', a: 1, b: -1 } };
    const m = measure(saddle);
    // contract: L = x² − y² no tiene mínimo: sin mínimo, best, gap y dist son NaN
    expect(scene(saddle).minimum).toBeNull();
    expect(m.best).toBeNaN();
    expect(m.gap).toBeNaN();
    expect(m.dist).toBeNaN();
  });

  it('un cuadrático con c y centro tiene el mínimo en el centro si es definido positivo', () => {
    const tilted: DescensoSpec = {
      ...bowl,
      surface: { kind: 'quadratic', a: 2, b: 2, c: 1, center: [1, -1] },
    };
    // contract: el Hessiano [[4, 1], [1, 4]] es definido positivo: mínimo en el centro, de pérdida 0
    expect(scene(tilted).minimum).toEqual([1, -1]);
    expect(measure(tilted).best).toBe(0);
    // contract: con c = 4 el Hessiano [[4, 4], [4, 4]] es singular: ya no hay mínimo único
    const flat: DescensoSpec = { ...tilted, surface: { kind: 'quadratic', a: 2, b: 2, c: 4 } };
    expect(scene(flat).minimum).toBeNull();
  });

  it('en el valle a = 10, b = 1 el descenso simple no cumple la meta con ninguna tasa y el momentum sí', () => {
    const valley: DescensoSpec = {
      ...bowl,
      surface: { kind: 'quadratic', a: 10, b: 1 },
      window: { x: [-2, 2], y: [-4, 4] },
      start: { x: 1.5, y: 3 },
      rate: { min: 0.01, max: 0.2, step: 0.01, start: 0.05 },
      steps: 15,
      optimizers: ['sgd', 'momentum'],
      beta: 0.5,
    };
    const rates = Array.from({ length: 20 }, (_, k) => (k + 1) / 100);
    const best = (opt: number) =>
      Math.min(...rates.map((lr) => measure(valley, { lr, opt }).loss!));
    // contract: barrido de las 20 tasas de la rejilla (cálculo con el propio motor): el mejor descenso simple deja 0,0482
    expect(best(0)).toBeCloseTo(0.0482, 4);
    // contract: con momentum β = 0,5 y lr = 0,05 la pérdida baja a 0,0011 (≤ 0,02) tras 15 pasos
    expect(measure(valley, { lr: 0.05, opt: 1 }).loss).toBeLessThan(0.02);
    expect(best(0)).toBeGreaterThan(0.02);
  });

  it('el zigzag se cuenta con turns', () => {
    const valley: DescensoSpec = {
      ...bowl,
      surface: { kind: 'quadratic', a: 10, b: 1 },
      start: { x: 1.5, y: 3 },
      rate: 0.09,
      steps: 15,
    };
    // contract: con lr = 0,09 el factor horizontal es 1 − 20·0,09 = −0,8: la x cambia de signo en cada paso (14 cambios de 15 pasos)
    expect(measure(valley).turns).toBe(14);
    // contract: con lr = 0,04 el factor horizontal es 0,2 > 0: ningún cambio de sentido
    expect(measure({ ...valley, rate: 0.04 }).turns).toBe(0);
  });
});

describe('descenso: optimizadores', () => {
  const lone: DescensoSpec = {
    ...bowl,
    start: { x: 1, y: 0 },
    rate: 0.1,
    steps: 2,
    optimizers: ['sgd', 'momentum', 'rmsprop', 'adam'],
    beta: 0.5,
  };

  it('momentum acumula velocidad: v = β·v + g', () => {
    const s = scene(lone, { opt: 1 });
    // contract: g = 2x = 2 → v = 2 → x = 1 − 0,2 = 0,8; luego g = 1,6, v = 0,5·2 + 1,6 = 2,6 → x = 0,8 − 0,26 = 0,54
    expect(s.path[1]![0]).toBeCloseTo(0.8, 12);
    expect(s.path[2]![0]).toBeCloseTo(0.54, 12);
  });

  it('descenso simple: x = x − lr·g', () => {
    // contract: x = 1 → 0,8 → 0,64
    expect(scene(lone, { opt: 0 }).path[2]![0]).toBeCloseTo(0.64, 12);
  });

  it('RMSProp: el primer paso vale lr/√0,1 por el signo del gradiente', () => {
    // contract: s = 0,1·g² → paso = lr·g/(√0,1·|g|) = 0,1/0,31623 = 0,31623
    expect(scene(lone, { opt: 2 }).path[1]![0]).toBeCloseTo(1 - 0.1 / Math.sqrt(0.1), 6);
  });

  it('Adam: con la corrección de sesgo el primer paso vale lr por el signo del gradiente', () => {
    // contract: m̂ = g y v̂ = g² → paso = lr·g/(|g| + 1e-8) ≈ lr = 0,1
    expect(scene(lone, { opt: 3 }).path[1]![0]).toBeCloseTo(0.9, 6);
  });

  it('el mando opt fuera de rango se asienta en uno válido', () => {
    // contract: el índice se acota a la lista (0 a 3)
    expect(scene(lone, { opt: 9 }).params.optimizer).toBe('adam');
  });
});

// Cuatro puntos exactos sobre y = 2x + 1: el mínimo es w = 2, b = 1 con pérdida 0.
const line: DescensoSpec = {
  kind: 'descenso',
  surface: {
    kind: 'regression',
    data: [
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 7],
    ],
  },
  window: { x: [-1, 4], y: [-2, 3] },
  start: { x: 0, y: 0 },
  rate: 0.01,
  steps: 10,
};

describe('descenso: regresión', () => {
  it('el mínimo es el ajuste de mínimos cuadrados y el gradiente sale del error medio', () => {
    const s = scene(line);
    // contract: los puntos están exactos sobre y = 2x + 1: w = 2, b = 1, pérdida 0
    expect(s.minimum![0]).toBeCloseTo(2, 10);
    expect(s.minimum![1]).toBeCloseTo(1, 10);
    expect(measure(line).best).toBeCloseTo(0, 12);
    // contract: en (0, 0) los residuos son −y: L = (1 + 9 + 25 + 49)/4 = 21
    expect(measure(line).loss0).toBeCloseTo(21, 12);
    // contract: gw = 2·media(r·x) = 2·(−34/4) = −17 y gb = 2·media(r) = 2·(−16/4) = −8
    expect(s.grad0[0]).toBeCloseTo(-17, 12);
    expect(s.grad0[1]).toBeCloseTo(-8, 12);
    // contract: primer paso con lr = 0,01: (0 + 0,17, 0 + 0,08)
    expect(s.path[1]![0]).toBeCloseTo(0.17, 12);
    expect(s.path[1]![1]).toBeCloseTo(0.08, 12);
  });

  it('con x todas iguales no hay mínimo único', () => {
    const same: DescensoSpec = {
      ...line,
      surface: {
        kind: 'regression',
        data: [
          [1, 1],
          [1, 2],
        ],
      },
    };
    // contract: sin variación en x, w y b no se separan: no hay un único mínimo
    expect(scene(same).minimum).toBeNull();
  });

  it('el minilote es determinista y con el tamaño de todos los datos equivale al gradiente completo', () => {
    const mini: DescensoSpec = {
      ...line,
      steps: 10,
      batch: { size: { min: 1, max: 4, step: 1, start: 1 }, seed: 3 },
    };
    // contract: misma semilla, mismo camino (nada de Math.random)
    expect(scene(mini).path).toEqual(scene(mini).path);
    // contract: con un minilote de 4 de 4 datos, cada paso usa todos los datos: igual que sin batch
    expect(scene(mini, { batch: 4 }).path).toEqual(scene(line).path);
    // contract: con un solo dato por paso el camino es otro
    expect(scene(mini, { batch: 1 }).path).not.toEqual(scene(line).path);
    // contract: la pérdida se mide siempre con todos los datos: en la salida es 21 también con minilotes
    expect(measure(mini, { batch: 1 }).loss0).toBeCloseTo(21, 12);
  });
});

describe('descenso: pozos', () => {
  const wells: DescensoSpec = {
    kind: 'descenso',
    surface: {
      kind: 'wells',
      wells: [
        { x: -2, y: 0, depth: 1, width: 0.8 },
        { x: 2, y: 1, depth: 2, width: 0.8 },
      ],
      bowl: 0.02,
    },
    window: { x: [-4, 4], y: [-4, 4] },
    start: { x: -2.5, y: -1, movable: true },
    rate: 0.5,
    steps: 60,
  };

  it('el mínimo global es el pozo hondo, un poco corrido hacia el centro por el cuenco', () => {
    const s = scene(wells);
    // contract: el pozo hondo está en (2, 1) con profundidad 2; el cuenco 0,02·(x² + y²) lo corre menos de 0,05
    expect(Math.hypot(s.minimum![0] - 2, s.minimum![1] - 1)).toBeLessThan(0.05);
    // contract: en el centro del pozo la pérdida es 0,02·5 − 2 = −1,9 y el mínimo no puede quedar por encima
    expect(measure(wells).best).toBeLessThanOrEqual(-1.9);
    expect(measure(wells).best).toBeGreaterThan(-1.95);
    // contract: es un mínimo: la pérdida un poco alrededor no es menor
    const at = s.lossAt(s.minimum![0], s.minimum![1]);
    for (const [dx, dy] of [
      [0.01, 0],
      [-0.01, 0],
      [0, 0.01],
      [0, -0.01],
    ] as const) {
      expect(s.lossAt(s.minimum![0] + dx, s.minimum![1] + dy)).toBeGreaterThanOrEqual(at);
    }
  });

  it('según desde dónde se sale, el descenso cae en el mínimo local o en el global', () => {
    // contract: (−2,5; −1) cae en el pozo somero de (−2, 0): se queda a unos 4 del global
    expect(measure(wells).dist).toBeGreaterThan(3);
    // contract: (1; −1) está en la cuenca del pozo hondo: acaba en el mínimo global
    expect(measure(wells, { sx: 1, sy: -1 }).dist).toBeLessThan(0.3);
  });
});

describe('descenso: metas', () => {
  it('goalMet acepta las métricas del laboratorio', () => {
    const m = measure(bowl);
    // contract: 13·0,64²⁰ ≈ 2e-3 ≤ 0,05 con lr = 0,1; con lr = 0,05 la pérdida es 0,19
    expect(goalMet({ metric: 'loss', op: 'lte', target: 0.05 }, m)).toBe(true);
    expect(goalMet({ metric: 'loss', op: 'lte', target: 0.05 }, measure(bowl, { lr: 0.05 }))).toBe(
      false,
    );
  });
});
