import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import {
  defineLabProjectTests,
  labAt,
  labQuestion,
  solves,
} from '../../../tests/content/lab-helpers';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { autovectores } from './autovectores';
import { examen2Autovectores } from './examen-2-autovectores';

const bankQuestions = examen2Autovectores
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto autovectores', projectQuestions(autovectores));
defineProseTests('banco examen-2 autovectores', bankQuestions);
defineLabProjectTests(autovectores, examen2Autovectores);

type V = [number, number];
type M = [[number, number], [number, number]];
/** A·v con A de columnas i y j. */
const img = (i: V, j: V, v: V): V => [i[0] * v[0] + j[0] * v[1], i[1] * v[0] + j[1] * v[1]];
/** Producto cruzado v × w: 0 si los dos están en la misma recta. */
const cross = (v: V, w: V): number => v[0] * w[1] - v[1] * w[0];
const dot = (v: V, w: V): number => v[0] * w[0] + v[1] * w[1];
/** Cociente de Rayleigh vᵀAv / vᵀv. */
const rayleigh = (i: V, j: V, v: V): number => dot(v, img(i, j, v)) / dot(v, v);
const trace = (m: M): number => m[0][0] + m[1][1];
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
/** Autovalores de una 2×2 por λ² − tλ + d = 0: reales o, con discriminante negativo, ±i·√d. */
const eigen = (m: M): { real: boolean; values: number[]; radius: number; maxReal: number } => {
  const t = trace(m);
  const d = det(m);
  const disc = t * t - 4 * d;
  if (disc >= 0) {
    const values = [(t - Math.sqrt(disc)) / 2, (t + Math.sqrt(disc)) / 2];
    return {
      real: true,
      values,
      radius: Math.max(...values.map(Math.abs)),
      maxReal: Math.max(...values),
    };
  }
  return { real: false, values: [], radius: Math.sqrt(d), maxReal: t / 2 };
};

describe('proyecto autovectores', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2 de matrices: checkProject(autovectores) devuelve la lista vacía
    expect(checkProject(autovectores)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10, cambia el subtítulo): Autovectores, «direcciones que la capa solo estira»; el id no cambia
    expect([autovectores.id, autovectores.name, autovectores.sub]).toEqual([
      'autovectores',
      'Autovectores',
      'Direcciones que la capa solo estira',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 2 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(autovectores.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(autovectores.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(autovectores.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón autovectores.exNN.k y autovectores.hoja.k', () => {
    // contract: encargo de la Órbita 2 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(autovectores).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `autovectores.ex0${e}.${k}`)),
      'autovectores.hoja.1',
      'autovectores.hoja.2',
      'autovectores.hoja.3',
    ]);
  });

  it('tiene calentamiento de 1 a 4 fichas con ids autovectores.cal.N', () => {
    // contract: encargo de la Órbita 2 de matrices: calentamiento de 1 a 4 fichas enlazado con `warmup:`
    const ids = (autovectores.warmup ?? []).map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids.length).toBeLessThanOrEqual(4);
    expect(ids).toEqual(ids.map((_, k) => `autovectores.cal.${k + 1}`));
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('autovectores, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(autovectores);
  const lab = (k: number) => labQuestion(all, `autovectores.ex00.${k}`);

  it('ex00.1: al empezar la capa gira el estado; las dos diagonales, de cualquier largo y en los dos sentidos, no', () => {
    const start = labAt(lab(1));
    // contract: enunciado de ex00.1: «casi todo estado sale girado»: (1, 0) sale a (1; 0,5), unos 27 grados
    expect(start.img_angle).toBeCloseTo(26.565, 2);
    expect(solves(lab(1))).toBe(false);
    // contract: solution de ex00.1: (1, 1) con autovalor 1,5 y (1, −1) con autovalor 0,5
    expect(solves(lab(1), { vx: 1, vy: 1 })).toBe(true);
    expect(labAt(lab(1), { vx: 1, vy: 1 }).stretch).toBeCloseTo(1.5, 12);
    expect(solves(lab(1), { vx: 1, vy: -1 })).toBe(true);
    expect(labAt(lab(1), { vx: 1, vy: -1 }).stretch).toBeCloseTo(0.5, 12);
    // contract: regla 3 de la guía (varias soluciones) y solution de ex00.1: «largo o corto, en un sentido o en el otro, como (−2, −2)»
    for (const [vx, vy] of [
      [-2, -2],
      [0.5, 0.5],
      [3, 3],
      [-1.5, 1.5],
      [2, -2],
    ] as const) {
      expect(solves(lab(1), { vx, vy }), `(${vx}, ${vy})`).toBe(true);
    }
    // contract: tentadora y mala (solution de ex00.1): (0, 1) sale a (0,5; 1), girado unos 27 grados
    expect(labAt(lab(1), { vx: 0, vy: 1 }).img_angle).toBeCloseTo(26.565, 2);
    expect(solves(lab(1), { vx: 0, vy: 1 })).toBe(false);
    // contract: encargo de autovectores: v = (0, 0) no tiene dirección y no cumple ninguna meta
    expect(solves(lab(1), { vx: 0, vy: 0 })).toBe(false);
  });

  it('ex00.2: el tope de crecimiento desde un estado pequeño solo lo da la recta de autovalor 1,5', () => {
    const start = labAt(lab(2));
    // contract: enunciado de ex00.2: «desde el de ahora, la memoria llega a algo más de 5»
    expect(start.iter_norm).toBeGreaterThan(5);
    expect(start.iter_norm).toBeLessThan(5.5);
    // contract: solution de ex00.2: (1, 1) llega a 1,41·1,5⁵ ≈ 10,74; también (−1, −1)
    expect(labAt(lab(2), { vx: 1, vy: 1 }).iter_norm).toBeCloseTo(Math.SQRT2 * 1.5 ** 5, 9);
    expect(Math.SQRT2 * 1.5 ** 5).toBeCloseTo(10.74, 2);
    expect(solves(lab(2), { vx: 1, vy: 1 })).toBe(true);
    expect(solves(lab(2), { vx: -1, vy: -1 })).toBe(true);
    // contract: regla 4 de la guía (un límite): ningún otro estado de la rejilla de tamaño 1,5 o menos pasa de 10
    const others: string[] = [];
    for (let vx = -1.5; vx <= 1.5; vx += 0.5)
      for (let vy = -1.5; vy <= 1.5; vy += 0.5)
        if (Math.abs(vx) !== 1 || vx !== vy) {
          if (solves(lab(2), { vx, vy })) others.push(`(${vx}, ${vy})`);
        }
    expect(others).toEqual([]);
    // contract: solution de ex00.2: (1,5; 1,5) se pasa del límite de partida; (1,5; 0) solo llega a 8,05
    expect(solves(lab(2), { vx: 1.5, vy: 1.5 })).toBe(false);
    expect(labAt(lab(2), { vx: 1.5, vy: 1.5 }).v_norm).toBeGreaterThan(1.5);
    expect(labAt(lab(2), { vx: 1.5, vy: 0 }).iter_norm).toBeCloseTo(8.05, 2);
    // contract: tentadora y mala: la otra recta propia, (1, −1), se apaga
    expect(labAt(lab(2), { vx: 1, vy: -1 }).iter_norm).toBeLessThan(0.1);
  });

  it('ex00.3: solo la recta de autovalor 0,5 apaga la memoria, y no si el estado es demasiado largo', () => {
    // contract: enunciado de ex00.3: el estado de partida no se apaga
    expect(solves(lab(3))).toBe(false);
    // contract: solution de ex00.3: (1, −1) deja √2·0,5⁵ ≈ 0,044
    expect(labAt(lab(3), { vx: 1, vy: -1 }).iter_norm).toBeCloseTo(Math.SQRT2 * 0.5 ** 5, 12);
    expect(Math.SQRT2 * 0.5 ** 5).toBeCloseTo(0.044, 3);
    // contract: regla 3 de la guía y solution de ex00.3: valen (−1,5; 1,5) y cualquier punto de la recta hasta (2, −2), en los dos sentidos
    for (const [vx, vy] of [
      [1, -1],
      [-1, 1],
      [-1.5, 1.5],
      [1.5, -1.5],
      [2, -2],
      [-2, 2],
    ] as const) {
      expect(solves(lab(3), { vx, vy }), `(${vx}, ${vy})`).toBe(true);
    }
    // contract: solution de ex00.3: (2,5; −2,5) ya deja 0,11 y (1; −0,5) acaba en 2,7
    expect(labAt(lab(3), { vx: 2.5, vy: -2.5 }).iter_norm).toBeCloseTo(0.11, 2);
    expect(solves(lab(3), { vx: 2.5, vy: -2.5 })).toBe(false);
    expect(labAt(lab(3), { vx: 1, vy: -0.5 }).iter_norm).toBeCloseTo(2.7, 1);
    expect(solves(lab(3), { vx: 1, vy: -0.5 })).toBe(false);
    // contract: encargo de autovectores: v = (0, 0) apagaría la memoria sin ser un estado; la meta de tamaño lo impide
    expect(labAt(lab(3), { vx: 0, vy: 0 }).iter_norm).toBe(0);
    expect(solves(lab(3), { vx: 0, vy: 0 })).toBe(false);
  });

  it('ex00.4: la capa que explotaba; autovalor 1 o un giro conservan el tamaño, aplastar no vale', () => {
    const start = labAt(lab(4));
    // contract: enunciado de ex00.4: «pasa de 1,41 a más de 10»
    expect(start.v_norm).toBeCloseTo(1.41, 2);
    expect(start.iter_norm).toBeGreaterThan(10);
    // contract: solution de ex00.4: î en (0,5; 0) y ĵ en (0,5; 1): A·v = v y área 0,5
    expect(solves(lab(4), { ix: 0.5, iy: 0 })).toBe(true);
    expect(labAt(lab(4), { ix: 0.5, iy: 0 }).area).toBe(0.5);
    // contract: regla 3 de la guía y solution de ex00.4: la identidad y el giro de un cuarto de vuelta también valen
    expect(solves(lab(4), { ix: 1, iy: 0, jx: 0, jy: 1 })).toBe(true);
    expect(solves(lab(4), { ix: 0, iy: 1, jx: -1, jy: 0 })).toBe(true);
    // contract: tentadora y mala (solution de ex00.4): las dos columnas en (0,5; 0,5) conservan v con área 0
    const flat = labAt(lab(4), { ix: 0.5, iy: 0.5, jx: 0.5, jy: 0.5 });
    expect([flat.iter_norm, flat.area]).toEqual([Math.SQRT2, 0]);
    expect(solves(lab(4), { ix: 0.5, iy: 0.5, jx: 0.5, jy: 0.5 })).toBe(false);
    // contract: tentadora y mala: encoger toda la capa a la mitad apaga la memoria
    expect(solves(lab(4), { ix: 0.5, iy: 0, jx: 0, jy: 0.5 })).toBe(false);
  });

  it('ex00.5: desde casi cualquier estado el camino se alinea; las rectas propias no cuentan', () => {
    const start = labAt(lab(5));
    // contract: enunciado de ex00.5: el estado de partida está en una recta que no gira y su camino no se tuerce
    expect(start.img_angle).toBeLessThan(1e-4);
    expect(start.iter_turn).toBeLessThan(1e-4);
    expect(solves(lab(5))).toBe(false);
    // contract: solution de ex00.5: (1, 0) gira 27 grados el primer paso y menos de medio grado el último
    const from = labAt(lab(5), { vx: 1, vy: 0 });
    expect(from.img_angle).toBeCloseTo(26.565, 2);
    expect(from.iter_turn).toBeLessThan(0.5);
    // contract: regla 3 de la guía y solution de ex00.5: también (−2, 1) y (0, 3)
    expect(solves(lab(5), { vx: 1, vy: 0 })).toBe(true);
    expect(solves(lab(5), { vx: -2, vy: 1 })).toBe(true);
    expect(solves(lab(5), { vx: 0, vy: 3 })).toBe(true);
    // contract: takeaway de ex00.5 («desde casi cualquier estado»): todo estado de la rejilla que la capa gira 20 grados o más se alinea en seis pasos
    for (let vx = -4; vx <= 4; vx += 0.5)
      for (let vy = -4; vy <= 4; vy += 0.5) {
        const m = labAt(lab(5), { vx, vy });
        if (m.img_angle! >= 20) expect(m.iter_turn, `(${vx}, ${vy})`).toBeLessThanOrEqual(1);
      }
    // contract: tentadora y mala: las diagonales no giran, así que no cumplen el giro de partida; v = (0, 0) tampoco
    expect(solves(lab(5), { vx: 1, vy: 1 })).toBe(false);
    expect(solves(lab(5), { vx: -2, vy: 2 })).toBe(false);
    expect(solves(lab(5), { vx: 0, vy: 0 })).toBe(false);
  });

  it('las cinco comparten las reseñas y la capa recurrente, y cambian una cosa cada vez', () => {
    const scenes = [1, 2, 3, 4, 5].map((k) => {
      const spec = lab(k).lab;
      if (spec.kind !== 'capa') throw new Error('ex00 usa el laboratorio capa');
      return [spec.axes, spec.i, spec.j, spec.movable ?? 'ij', spec.probe?.movable, spec.iterate];
    });
    // contract: brief-juego-2.md, Autovectores: con probe e iterate; v móvil salvo en la 4, que mueve las columnas; 1, 5, 5, 5 y 6 pasos
    const capa = [
      ['intensidad', 'tono'],
      [1, 0.5],
      [0.5, 1],
    ];
    expect(scenes).toEqual([
      [...capa, 'none', true, 1],
      [...capa, 'none', true, 5],
      [...capa, 'none', true, 5],
      [...capa, 'ij', false, 5],
      [...capa, 'none', true, 6],
    ]);
  });
});

describe('autovectores, «Calcular»: las respuestas se recalculan', () => {
  const ex01 = autovectores.exercises[1]!;
  const ex02 = autovectores.exercises[2];
  const q = (k: number): Question => ex01.questions[k - 1]!;
  /** Las métricas del laboratorio de una pregunta de «Calcular» con los mandos de `state`. */
  const measure = (k: number, state: Record<string, number> = {}) => {
    const x = q(k);
    if (!('lab' in x) || !x.lab) throw new Error(`ex01.${k} lleva laboratorio`);
    return labAt(
      { ...labQuestion(projectQuestions(autovectores), 'autovectores.ex00.1'), lab: x.lab },
      state,
    );
  };

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 2): λ = 1,6; 1,1¹⁰ y 0,9¹⁰ con dos decimales; (2, 1) (índice 2); c = 0,5; 5 pasos
    expect(ex01.questions.map(answerOf)).toEqual([
      [1.6, 0],
      [[2.59, 0.35], 0.01],
      2,
      [0.5, 0],
      [5, 0],
    ]);
    // contract: ex01.2: 1,1¹⁰ ≈ 2,5937 y 0,9¹⁰ ≈ 0,3487, dentro de la tolerancia; con cien pasos, 13 781 y 0,00003
    expect(Math.abs(1.1 ** 10 - 2.59)).toBeLessThan(0.01);
    expect(Math.abs(0.9 ** 10 - 0.35)).toBeLessThan(0.01);
    expect(Math.round(1.1 ** 100)).toBe(13781);
    expect(0.9 ** 100).toBeCloseTo(0.00003, 5);
    // contract: ex01.5: (1/3)⁴ ≈ 0,012 aún pasa del 1 % y (1/3)⁵ ≈ 0,004 no; con cociente 0,8 hacen falta 21
    expect((1 / 3) ** 4).toBeGreaterThan(0.01);
    expect((1 / 3) ** 5).toBeLessThan(0.01);
    expect(0.8 ** 20).toBeGreaterThan(0.01);
    expect(0.8 ** 21).toBeLessThan(0.01);
  });

  it('ex01.1: en su laboratorio, (1, 1) no gira y se estira por 1,6; (2, −1) es la otra dirección propia', () => {
    const one = measure(1);
    // contract: solution de ex01.1: A·(1, 1) = (1,6; 1,6)
    expect(one.img_angle).toBe(0);
    expect(one.stretch).toBeCloseTo(1.6, 12);
    expect([one.m11, one.m12, one.m21, one.m22]).toEqual([1.2, 0.4, 0.2, 1.4]);
    // contract: solution de ex01.1: (2, −1) tiene autovalor 1; takeaway: 1,6¹⁰ ≈ 110
    const other = measure(1, { vx: 2, vy: -1 });
    expect(other.img_angle).toBeLessThan(1e-4);
    expect(other.stretch).toBeCloseTo(1, 12);
    expect(Math.round(1.6 ** 10)).toBe(110);
  });

  it('ex01.3: de las cuatro opciones solo (2, 1) no gira; (0, 1) conserva el tamaño y gira 90 grados', () => {
    const x = q(3);
    if (x.type !== 'opcion') throw new Error('ex01.3 es opcion');
    // contract: solution de ex01.3: A(1, 0) gira 45 grados, A(1, 1) gira, A(2, 1) = (2, 1), A(0, 1) = (1, 0)
    const angles = [
      [1, 0],
      [1, 1],
      [2, 1],
      [0, 1],
    ].map(([vx, vy]) => measure(3, { vx: vx!, vy: vy! }));
    expect(angles.map((m) => Math.round(m.img_angle!))).toEqual([45, 27, 0, 90]);
    expect(angles[2]!.stretch).toBeCloseTo(1, 12);
    expect(angles[3]!.stretch).toBeCloseTo(1, 12);
    expect(x.options[x.correct]).toBe('$(2, 1)$');
    // contract: solution de ex01.3: (1, −1) es la otra dirección propia, con autovalor −0,5
    expect(measure(3, { vx: 1, vy: -1 }).rayleigh).toBeCloseTo(-0.5, 12);
  });

  it('ex01.4: con las columnas a la mitad, el autovalor 2 pasa a 1 y el camino de (1, 1) no crece', () => {
    // contract: enunciado de ex01.4: la capa estira (1, 1) por 2 y deja igual (1, −1)
    expect(measure(4).stretch).toBeCloseTo(2, 12);
    expect(measure(4).img_angle).toBeLessThan(1e-4);
    // contract: solution de ex01.4: con c = 0,5 los pesos pasan a (0,75 0,25; 0,25 0,75) y (1, 1) ni crece ni se apaga
    const half = measure(4, { ix: 0.75, iy: 0.25, jx: 0.25, jy: 0.75 });
    expect(half.stretch).toBeCloseTo(1, 12);
    expect(half.iter_norm).toBeCloseTo(Math.SQRT2, 12);
  });

  it('ex01.5: el estado (1, 0) es mitad de cada recta propia en la capa de las reseñas', () => {
    // contract: enunciado de ex01.5: ½(1, 1) + ½(1, −1) = (1, 0); la capa estira (1, 1) por 1,5 y encoge (1, −1) por 0,5
    expect([0.5 + 0.5, 0.5 - 0.5]).toEqual([1, 0]);
    expect(measure(5, { vx: 1, vy: 1 }).stretch).toBeCloseTo(1.5, 12);
    expect(measure(5, { vx: 1, vy: -1 }).stretch).toBeCloseTo(0.5, 12);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const A: M = [
      [4, 1],
      [2, 3],
    ];
    // contract: ex02.1: el mayor autovalor de A es 5 y su autovector es proporcional a (1, 1)
    expect(Math.max(...eigen(A).values)).toBe(5);
    expect(cross([1, 1], img([4, 2], [1, 3], [1, 1]))).toBe(0);
    // contract: ex02.2: con A = (3 1; 0 2) y v = (1, −1), A·v = (2, −2) = 2v; el caso decimal (0,5 0,2; 0,2 0,8) y (0,1; 0,2) tiene λ = 0,9
    expect(img([3, 0], [1, 2], [1, -1])).toEqual([2, -2]);
    const B: [V, V] = [
      [0.5, 0.2],
      [0.2, 0.8],
    ];
    expect(Math.abs(cross([0.1, 0.2], img(...B, [0.1, 0.2])))).toBeLessThan(1e-15);
    expect(rayleigh(...B, [0.1, 0.2])).toBeCloseTo(0.9, 12);
    // contract: ex02.3: iterar A = (2 1; 1 2) desde (1, 0) con normalización converge a (1, 1)/√2
    let v: V = [1, 0];
    for (let k = 0; k < 50; k++) {
      const w = img([2, 1], [1, 2], v);
      const n = Math.hypot(w[0], w[1]);
      v = [w[0] / n, w[1] / n];
    }
    expect(v[0]).toBeCloseTo(Math.SQRT1_2, 12);
    expect(v[1]).toBeCloseTo(Math.SQRT1_2, 12);
    // contract: ex02.3: sin normalizar, 3^1000 se desborda a infinito en un decimal de 64 bits
    expect(3 ** 1000).toBe(Infinity);
    // contract: ex02.4: radios espectrales de los pesos 1,5; 1,2; 0,8; 0,9; 1,3 y estables [no, no, sí, sí, no]
    const Ws: M[] = [
      [
        [0.5, 1.0],
        [0.0, -1.5],
      ],
      [
        [0.0, -1.2],
        [1.2, 0.0],
      ],
      [
        [0.6, 0.3],
        [0.2, 0.5],
      ],
      [
        [0.9, 0.0],
        [0.0, -0.7],
      ],
      [
        [1.3, 0.2],
        [0.0, 0.3],
      ],
    ];
    const radii = Ws.map((m) => eigen(m).radius);
    [1.5, 1.2, 0.8, 0.9, 1.3].forEach((r, k) => expect(radii[k], `W${k + 1}`).toBeCloseTo(r, 12));
    expect(radii.map((r) => r < 1)).toEqual([false, false, true, true, false]);
    // contract: ex02.4, trampas: sin valor absoluto el primero parece estable (0,5); la segunda es compleja (±1,2i), con parte real 0; la tercera tiene autovalores 0,8 y 0,3
    expect(eigen(Ws[0]!).maxReal).toBeCloseTo(0.5, 12);
    expect(eigen(Ws[1]!).real).toBe(false);
    expect(eigen(Ws[1]!).maxReal).toBe(0);
    expect(eigen(Ws[2]!).values.map((x) => Math.round(x * 100) / 100)).toEqual([0.3, 0.8]);
    // contract: ex02.5: A^10 = (6510758 3254867; 6509734 3255891) y VD^10V⁻¹ lleva 2^10 y 5^10 en D^10
    let P: M = [
      [1, 0],
      [0, 1],
    ];
    for (let k = 0; k < 10; k++) P = mul(P, A);
    expect(P).toEqual([
      [6510758, 3254867],
      [6509734, 3255891],
    ]);
    expect([2 ** 10, 5 ** 10]).toEqual([1024, 9765625]);
    // contract: ex02.5: la traza de A^10 es 2^10 + 5^10, suma de los autovalores elevados
    expect(trace(P)).toBe(2 ** 10 + 5 ** 10);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 2 de matrices: código con «v = vecs[0]» (línea 3), razonamiento con la longitud (línea 3) y uno correcto (null); al menos una de código
    expect(autovectores.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(autovectores.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: tomar una fila de la matriz de autovectores, y tomar la longitud por el criterio de autovector
    const faulty = autovectores.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'v = vecs[0]',
      'Como A·v es más largo que v, v es un autovector y λ es el cociente de las longitudes',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of autovectores.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 1: la fila 0 de los autovectores de NumPy, (0,7071; −0,4472), no es autovector de A = (4 1; 2 3), y la columna (1, 1) sí
    expect(cross([0.70710678, -0.4472136], img([4, 2], [1, 3], [0.70710678, -0.4472136]))).not.toBe(
      0,
    );
    expect(
      Math.abs(cross([0.70710678, 0.70710678], img([4, 2], [1, 3], [0.70710678, 0.70710678]))),
    ).toBeLessThan(1e-12);
    // contract: hoja 2: A = (2 0; 0 3) y v = (1, 1) dan A·v = (2, 3), que no es múltiplo de v; los ejes sí son autovectores (λ = 2 y 3)
    expect(img([2, 0], [0, 3], [1, 1])).toEqual([2, 3]);
    expect(cross([1, 1], [2, 3])).not.toBe(0);
    expect(img([2, 0], [0, 3], [1, 0])).toEqual([2, 0]);
    expect(img([2, 0], [0, 3], [0, 1])).toEqual([0, 3]);
    // contract: hoja 3: A = (5 2; 2 2) tiene traza 7, determinante 6 y autovalores 1 y 6
    const S: M = [
      [5, 2],
      [2, 2],
    ];
    expect([trace(S), det(S)]).toEqual([7, 6]);
    expect(eigen(S).values).toEqual([1, 6]);
  });
});

describe('banco de examen 2 del proyecto autovectores', () => {
  it('tiene tres entradas fijas del proyecto autovectores, con ids examen-2.*', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver, sustituye las dos primeras): un laboratorio y una cuenta del estilo nuevo; la de código se conserva («Programar» no se toca)
    expect(examen2Autovectores.map((e) => e.project)).toEqual([
      'autovectores',
      'autovectores',
      'autovectores',
    ]);
    expect(examen2Autovectores.map((e) => e.question.id)).toEqual([
      'examen-2.memoria-estable',
      'examen-2.pasos-hasta-olvidar',
      'examen-2.capas-que-explotan',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2Autovectores) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo; la generada la añade el ensamblado
    expect(examen2Autovectores.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2Autovectores.map((e) => e.question.type)).toEqual([
      'laboratorio',
      'numero',
      'codigo',
    ]);
    const projectIds = new Set(projectQuestions(autovectores).map((q) => q.id));
    expect(examen2Autovectores.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const memoria = labQuestion(bankQuestions, 'examen-2.memoria-estable');
    // contract: examen-2.memoria-estable: desde (1, 0) la memoria se desboca, hasta unos 10
    expect(labAt(memoria).iter_norm).toBeCloseTo(10, 0);
    expect(solves(memoria)).toBe(false);
    // contract: solution: (0, 2) no gira ni crece (autovalor 1); vale cualquier estado del eje vertical entre 1,5 y 3, arriba o abajo
    expect(labAt(memoria, { vx: 0, vy: 2 }).stretch).toBe(1);
    for (const vy of [1.5, 2, 2.5, 3, -1.5, -2, -3])
      expect(solves(memoria, { vx: 0, vy }), `(0, ${vy})`).toBe(true);
    // contract: tentadora y mala: (1, 1) no gira, pero es la otra dirección propia, con autovalor 1,5
    expect(labAt(memoria, { vx: 1, vy: 1 }).stretch).toBeCloseTo(1.5, 12);
    expect(solves(memoria, { vx: 1, vy: 1 })).toBe(false);
    // contract: encargo de autovectores: v = (0, 0) no cumple la meta de tamaño
    expect(solves(memoria, { vx: 0, vy: 0 })).toBe(false);
    // contract: examen-2.pasos-hasta-olvidar: 0,5⁶ ≈ 0,016 aún pasa del 1 % y 0,5⁷ ≈ 0,008 no: 7 palabras
    const pasos = bankQuestions[1]!;
    expect(answerOf(pasos)).toEqual([7, 0]);
    expect(0.5 ** 6).toBeGreaterThan(0.01);
    expect(0.5 ** 7).toBeLessThan(0.01);
  });

  it('capas-que-explotan: tres capas explotan, y las dos trampas dan 1 y 2', () => {
    const Ws: M[] = [
      [
        [0.8, 0.0],
        [0.0, -1.1],
      ],
      [
        [0.5, -1.0],
        [1.0, 0.5],
      ],
      [
        [0.9, 0.2],
        [0.1, 0.7],
      ],
      [
        [1.2, 0.5],
        [0.0, 0.6],
      ],
      [
        [-0.4, 0.3],
        [0.2, 0.5],
      ],
    ];
    const e = Ws.map(eigen);
    // contract: solution de examen-2.capas-que-explotan: radios 1,1; 1,12; 0,97; 1,2 y 0,56; explotan 3
    expect(e.map((x) => Math.round(x.radius * 100) / 100)).toEqual([1.1, 1.12, 0.97, 1.2, 0.56]);
    expect(e.filter((x) => x.radius > 1)).toHaveLength(3);
    // contract: solution de examen-2.capas-que-explotan: sin valor absoluto ni módulo (mayor parte real) salen 1; con valor absoluto de la parte real salen 2
    expect(e.filter((x) => x.maxReal > 1)).toHaveLength(1);
    const absReal = Ws.map((m) => {
      const x = eigen(m);
      return x.real ? x.radius : Math.abs(trace(m) / 2);
    });
    expect(absReal.filter((r) => r > 1)).toHaveLength(2);
  });
});

describe('proyecto autovectores: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(autovectores), ...bankQuestions].filter(
    (q): q is CodigoQ => q.type === 'codigo',
  );

  it('los mensajes de las comprobaciones llevan el código en línea entre acentos graves', () => {
    for (const q of code) {
      for (const m of checkMessages(q)) {
        // contract: rereview-17d n1 (prosa.test.ts): `np.`, `plt.`, `None` y `emb` van en código en línea
        expect(withoutCode(m), `${q.id}: ${m}`).not.toMatch(/\b(np|plt)\.\w|\bNone\b|\bemb\b/);
      }
    }
  });

  it('los identificadores del starter y de la reference van en código en línea (review-18r m3)', () => {
    const SPANISH_WORDS = new Set(['y', 'e', 'o', 'a']);
    for (const q of code) {
      const names = new Set(
        [...`${q.starter}\n${q.reference}`.matchAll(/^(\w+)\s*=/gm)]
          .map((m) => m[1]!)
          .filter((n) => !SPANISH_WORDS.has(n)),
      );
      for (const m of checkMessages(q)) {
        const plain = withoutCode(m);
        for (const n of names)
          // contract: review-18r m3 (M18, prosa.test.ts): ningún nombre que el jugador escribe va suelto en un mensaje
          expect(plain, `${q.id}: ${m}`).not.toMatch(
            new RegExp(`(?<![\\p{L}_\\d])${n}(?![\\p{L}_\\d])`, 'u'),
          );
        // contract: review-18r bn1 (prosa.test.ts): las comillas rectas son código
        expect(plain, `${q.id}: ${m}`).not.toMatch(/\\?"/);
      }
    }
  });

  it('cada pregunta de código tiene mensajes que revisar', () => {
    // contract: encargo de la Órbita 2 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `autovectores.ex02.${n}`),
      'examen-2.capas-que-explotan',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
