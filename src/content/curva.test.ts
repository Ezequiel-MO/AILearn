import { describe, expect, it } from 'vitest';
import { grade, graphPositions } from './grade';
import {
  bigPictureSchema,
  exerciseSchema,
  graphSpecSchema,
  questionSchema,
  type CurvaQ,
  type GraphSpec,
} from './schema';
import { checkReachableCurva, checkStartNotSolved } from './validate';

// El plano de curvas y la pregunta `curva` (juego 3): esquema, corrección y alcanzabilidad.

const base = (id: string) => ({ id, prompt: 'p', hints: [], explain: 'e', solution: 's' });

/** f(x) = x² − 4x + 3, mínimo en x = 2. */
const parabolaGraph: GraphSpec = {
  x: [-1, 5],
  y: [-2, 8],
  snap: 0.5,
  curve: { kind: 'poly', coefs: [3, -4, 1] },
  points: [{ id: 'p', label: 'P', x: 0, movable: true, onCurve: true }],
  readouts: ['coords', 'slope'],
};

const minimum: CurvaQ = {
  ...base('t.min'),
  type: 'curva',
  graph: parabolaGraph,
  goals: [{ metric: 'slope', of: ['p'], target: 0, tol: 0.01 }],
};

describe('esquema del plano de curvas', () => {
  it('acepta una parábola con un punto sobre la curva', () => {
    // contract: forma mínima del plano de curvas
    expect(graphSpecSchema.safeParse(parabolaGraph).success).toBe(true);
  });

  it('un punto onCurve no lleva y, y uno libre la necesita', () => {
    // contract: la altura de un punto de la curva es f(x), nunca un dato aparte
    const onCurveWithY = {
      ...parabolaGraph,
      points: [{ id: 'p', label: 'P', x: 0, y: 3, movable: true, onCurve: true }],
    };
    const freeWithoutY = {
      ...parabolaGraph,
      points: [{ id: 'p', label: 'P', x: 0, movable: true }],
    };
    expect(graphSpecSchema.safeParse(onCurveWithY).success).toBe(false);
    expect(graphSpecSchema.safeParse(freeWithoutY).success).toBe(false);
  });

  it('rechaza ventanas vacías, puntos onCurve sin curva y fit sin pérdida mse', () => {
    // contract: superRefine de graphSpecSchema
    expect(graphSpecSchema.safeParse({ ...parabolaGraph, x: [5, -1] }).success).toBe(false);
    const noCurve = { ...parabolaGraph, curve: undefined };
    expect(graphSpecSchema.safeParse(noCurve).success).toBe(false);
    expect(graphSpecSchema.safeParse({ ...parabolaGraph, fit: { of: 'p' } }).success).toBe(false);
  });

  it('secant pide pair sobre la curva y line pide pair de puntos libres', () => {
    // contract: GRAPH_READOUTS: secant entre dos puntos de la curva; line entre dos puntos libres
    const two = {
      ...parabolaGraph,
      points: [
        { id: 'p', label: 'P', x: 0, movable: true, onCurve: true as const },
        { id: 'q', label: 'Q', x: 4, movable: true, onCurve: true as const },
      ],
    };
    expect(graphSpecSchema.safeParse({ ...two, readouts: ['secant'] }).success).toBe(false);
    expect(
      graphSpecSchema.safeParse({ ...two, readouts: ['secant'], pair: ['p', 'q'] }).success,
    ).toBe(true);
    expect(
      graphSpecSchema.safeParse({ ...two, readouts: ['line'], pair: ['p', 'q'] }).success,
    ).toBe(false);
  });

  it('la pregunta curva cabe en el ejercicio Manipular y no en Calcular', () => {
    // contract: KIND_QUESTIONS: manipular admite manipular y curva
    const five = (type: string) => [1, 2, 3, 4, 5].map((n) => ({ ...minimum, id: `t.${n}`, type }));
    expect(exerciseSchema.safeParse({ kind: 'manipular', questions: five('curva') }).success).toBe(
      true,
    );
    expect(exerciseSchema.safeParse({ kind: 'calcular', questions: five('curva') }).success).toBe(
      false,
    );
  });

  it('una meta de la curva necesita puntos sobre ella; una de recta, puntos libres', () => {
    // contract: ON_CURVE_METRICS y FREE_POINT_METRICS de src/engine/curves.ts
    const lineGoalOnCurvePoint = {
      ...minimum,
      goals: [{ metric: 'y', of: ['p'], target: 0, tol: 0 }],
    };
    expect(questionSchema.safeParse(minimum).success).toBe(true);
    expect(questionSchema.safeParse(lineGoalOnCurvePoint).success).toBe(false);
  });

  it('una figura de curvas cabe en una pregunta numero', () => {
    // contract: numero, vector y opcion admiten graph como figura estática
    const q = { ...base('t.n'), type: 'numero', answer: 0, tol: 0, graph: parabolaGraph };
    expect(questionSchema.safeParse(q).success).toBe(true);
  });
});

describe('corrección de una pregunta curva', () => {
  it('el mínimo de x² − 4x + 3 está en x = 2', () => {
    // contract: f′(2) = 0
    expect(grade(minimum, { type: 'curva', points: { p: [2, 999] } })).toBe(true);
    expect(grade(minimum, { type: 'curva', points: { p: [1.5, -0.75] } })).toBe(false);
  });

  it('un punto de la curva ignora la y que llegue: su altura es f(x)', () => {
    // contract: graphPositions: (x, f(x)) para todo punto onCurve
    expect(graphPositions(parabolaGraph, { p: [1, 50] })).toEqual({ p: [1, 0] });
    expect(graphPositions(parabolaGraph)).toEqual({ p: [0, 3] });
  });
});

describe('alcanzabilidad de una pregunta curva', () => {
  it('el mínimo se alcanza en la rejilla y no está resuelto al empezar', () => {
    // contract: mismas reglas que manipular: alcanzable y no resuelta en la posición inicial
    expect(checkReachableCurva(minimum)).toEqual([]);
    expect(checkStartNotSolved(minimum)).toEqual([]);
  });

  it('una meta que la rejilla no alcanza se detecta', () => {
    // contract: con snap 0,5 la pendiente 2x − 4 solo toma valores enteros: 0,5 no sale
    const unreachable: CurvaQ = {
      ...minimum,
      goals: [{ metric: 'slope', of: ['p'], target: 0.5, tol: 0.01 }],
    };
    expect(checkReachableCurva(unreachable)).toHaveLength(1);
  });

  it('una recta por dos puntos libres con pendiente 2 y ordenada 1', () => {
    // contract: line_slope y line_icpt con dos puntos libres de la rejilla
    const line: CurvaQ = {
      ...base('t.line'),
      type: 'curva',
      graph: {
        x: [-3, 3],
        y: [-3, 3],
        snap: 1,
        points: [
          { id: 'a', label: 'A', x: 0, y: 0, movable: true },
          { id: 'b', label: 'B', x: 1, y: 0, movable: true },
        ],
        readouts: ['line'],
        pair: ['a', 'b'],
      },
      goals: [
        { metric: 'line_slope', of: ['a', 'b'], target: 2, tol: 0 },
        { metric: 'line_icpt', of: ['a', 'b'], target: 1, tol: 0 },
      ],
    };
    expect(checkReachableCurva(line)).toEqual([]);
    expect(checkStartNotSolved(line)).toEqual([]);
  });
});

describe('bigPicture', () => {
  it('nombra de 1 a 4 piezas de la red conocidas', () => {
    // contract: NETWORK_PARTS de schema.ts; el dibujo resalta como mucho 4 piezas
    expect(bigPictureSchema.safeParse({ parts: ['loss'], text: 't' }).success).toBe(true);
    expect(bigPictureSchema.safeParse({ parts: [], text: 't' }).success).toBe(false);
    expect(bigPictureSchema.safeParse({ parts: ['cerebro'], text: 't' }).success).toBe(false);
  });
});
