import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import {
  labAt,
  defineLabProjectTests,
  labQuestion,
  solves,
} from '../../../tests/content/lab-helpers';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { simetricas } from './simetricas';
import { examen2Simetricas } from './examen-2-simetricas';

const bankQuestions = examen2Simetricas
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto simetricas', projectQuestions(simetricas));
defineProseTests('banco examen-2 simetricas', bankQuestions);
defineLabProjectTests(simetricas, examen2Simetricas);

type V = [number, number];
type M = [[number, number], [number, number]];
/** Determinante ad − bc de una matriz 2×2. */
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
/** Matriz de columnas u y v. */
const cols = (u: V, v: V): M => [
  [u[0], v[0]],
  [u[1], v[1]],
];
/** A·v. */
const apply = (a: M, v: V): V => [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
const dot = (a: number[], b: number[]): number => a.reduce((s, x, k) => s + x * b[k]!, 0);
/** Ángulo en grados entre dos vectores, recalculado con acos. */
const degrees = (a: V, b: V): number =>
  (Math.acos(dot(a, b) / Math.sqrt(dot(a, a) * dot(b, b))) * 180) / Math.PI;
/** Cociente vᵀAv / vᵀv. */
const rayleigh = (a: M, v: V): number => dot(v, apply(a, v)) / dot(v, v);
/** Covarianza de dos columnas, dividiendo entre n − 1. */
const cov = (x: number[], y: number[]): number => {
  const mx = x.reduce((s, t) => s + t, 0) / x.length;
  const my = y.reduce((s, t) => s + t, 0) / y.length;
  return x.reduce((s, t, k) => s + (t - mx) * (y[k]! - my), 0) / (x.length - 1);
};

describe('proyecto simetricas', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2 de matrices: checkProject(simetricas) devuelve la lista vacía
    expect(checkProject(simetricas)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2 de matrices (tabla de P0-comun): id simetricas, nombre «Matrices simétricas», subtítulo «Ejes perpendiculares y covarianza»
    expect([simetricas.id, simetricas.name, simetricas.sub]).toEqual([
      'simetricas',
      'Matrices simétricas',
      'Ejes perpendiculares y covarianza',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, tres hojas y calentamiento', () => {
    // contract: encargo de la Órbita 2 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas; de 1 a 4 fichas de calentamiento
    expect(simetricas.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(simetricas.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(simetricas.sheets).toHaveLength(3);
    expect(simetricas.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(simetricas.warmup?.length).toBeLessThanOrEqual(4);
  });

  it('los ids siguen el patrón simetricas.exNN.k y simetricas.hoja.k', () => {
    // contract: encargo de la Órbita 2 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(simetricas).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `simetricas.ex0${e}.${k}`)),
      'simetricas.hoja.1',
      'simetricas.hoja.2',
      'simetricas.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('simetricas, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(simetricas);
  const lab = (k: number) => labQuestion(all, `simetricas.ex00.${k}`);

  it('la nube de textos tiene la covarianza (1,25 1; 1 1,25): 90 % sobre (1, 1) y 10 % sobre (1, −1)', () => {
    const spec = lab(1).lab;
    if (spec.kind !== 'capa') throw new Error('ex00.1 usa el laboratorio capa');
    const xs = spec.points.map((p) => p.x);
    const ys = spec.points.map((p) => p.y);
    const mean = (t: number[]) => t.reduce((s, x) => s + x, 0) / t.length;
    const pop = (a: number[], b: number[]) =>
      mean(a.map((x, k) => (x - mean(a)) * (b[k]! - mean(b))));
    // contract: comentario de TEXTOS y prompt de ex00.3/ex01.3: nube centrada con covarianza (1,25 1; 1 1,25), dividiendo entre n como el laboratorio
    expect([mean(xs), mean(ys)]).toEqual([0, 0]);
    expect([pop(xs, xs), pop(xs, ys), pop(ys, ys)]).toEqual([1.25, 1, 1.25]);
    // contract: takeaway de ex00.1 y ex00.2: la longitud recoge el 90 % y los tokens por palabra, el 10 %
    expect(labAt(lab(1), { vx: 1, vy: 1 }).var_frac).toBeCloseTo(0.9, 12);
    expect(labAt(lab(1), { vx: 1, vy: -1 }).var_frac).toBeCloseTo(0.1, 12);
  });

  it('ex00.1: al empezar v recoge la mitad; la diagonal resuelve y apuntar a «código» no', () => {
    // contract: enunciado de ex00.1: «ahora v mira solo las palabras y recoge la mitad»
    expect(labAt(lab(1)).var_frac).toBeCloseTo(0.5, 12);
    // contract: solution de ex00.1: (1, 1) y cualquier múltiplo; también (2; 1,5) y (1,5; 2)
    for (const s of [
      { vx: 1, vy: 1 },
      { vx: -2, vy: -2 },
      { vx: 2, vy: 1.5 },
      { vx: 1.5, vy: 2 },
    ])
      expect(solves(lab(1), s), JSON.stringify(s)).toBe(true);
    // contract: solution de ex00.1: apuntar a «código», (1, 2), se queda en el 82 %; la vertical, en el 50 %
    expect(labAt(lab(1), { vx: 1, vy: 2 }).var_frac).toBeCloseTo(0.82, 12);
    expect(solves(lab(1), { vx: 1, vy: 2 })).toBe(false);
    expect(labAt(lab(1), { vx: 0, vy: 1 }).var_frac).toBeCloseTo(0.5, 12);
  });

  it('ex00.2: la dirección de menos variación es la perpendicular; la horizontal no basta', () => {
    // contract: enunciado de ex00.2: «ahora v sigue la nube y recoge casi toda su variación» (90 %)
    expect(labAt(lab(2)).var_frac).toBeCloseTo(0.9, 12);
    // contract: solution de ex00.2: (1, −1) o (−1, 1); regla 3 de la guía: también una dirección cercana, (1,5; −2)
    for (const s of [
      { vx: 1, vy: -1 },
      { vx: -1, vy: 1 },
      { vx: 1.5, vy: -2 },
    ])
      expect(solves(lab(2), s), JSON.stringify(s)).toBe(true);
    // contract: takeaway de ex00.2: ninguna dirección baja del 10 % (muestreo de la rejilla)
    let least = Infinity;
    for (let vx = -4; vx <= 4; vx += 0.5)
      for (let vy = -4; vy <= 4; vy += 0.5)
        if (vx !== 0 || vy !== 0) least = Math.min(least, labAt(lab(2), { vx, vy }).var_frac!);
    expect(least).toBeCloseTo(0.1, 12);
    // contract: solution de ex00.2: la horizontal se queda en el 50 %
    expect(solves(lab(2), { vx: 1, vy: 0 })).toBe(false);
    // contract: solution de ex00.2: sobre (1, −1) «código» y «cuento» quedan en los extremos
    const spec = lab(2).lab;
    if (spec.kind !== 'capa') throw new Error('ex00.2 usa el laboratorio capa');
    const along = spec.points.map((p) => [p.id, p.y - p.x] as const);
    const sorted = [...along].sort((a, b) => a[1] - b[1]);
    expect([sorted[0]![0], sorted[sorted.length - 1]![0]]).toEqual(['cuento', 'codigo']);
  });

  it('ex00.3: la covarianza como capa estira (1, 1) por 2,25 sin girarlo; (1, −1) no gira pero estira 0,25', () => {
    const spec = lab(3).lab;
    if (spec.kind !== 'capa') throw new Error('ex00.3 usa el laboratorio capa');
    // contract: enunciado de ex00.3: la capa es la matriz de covarianza de los seis textos
    expect([spec.i, spec.j, spec.movable]).toEqual([[1.25, 1], [1, 1.25], 'none']);
    // contract: solution de ex00.3: (1, 1) o cualquier múltiplo resuelve
    for (const s of [
      { vx: 1, vy: 1 },
      { vx: 2, vy: 2 },
      { vx: -1, vy: -1 },
    ])
      expect(solves(lab(3), s), JSON.stringify(s)).toBe(true);
    const main = labAt(lab(3), { vx: 1, vy: 1 });
    // contract: solution de ex00.3: estira 2,25, que es también la varianza de la nube sobre la recta y el cociente
    expect(main.stretch).toBeCloseTo(2.25, 12);
    expect(main.var_v).toBeCloseTo(2.25, 12);
    expect(main.rayleigh).toBeCloseTo(2.25, 12);
    // contract: tentadora y mala (solution): (1, −1) no gira, pero estira solo 0,25
    const minor = labAt(lab(3), { vx: 1, vy: -1 });
    expect(minor.img_angle).toBeLessThan(1e-3);
    expect(minor.stretch).toBeCloseTo(0.25, 12);
    expect(solves(lab(3), { vx: 1, vy: -1 })).toBe(false);
    // contract: regla 4 de la guía (un límite): ninguna dirección de la rejilla estira más de 2,25
    let most = 0;
    for (let vx = -5; vx <= 5; vx += 0.5)
      for (let vy = -5; vy <= 5; vy += 0.5)
        if (vx !== 0 || vy !== 0) most = Math.max(most, labAt(lab(3), { vx, vy }).stretch!);
    expect(most).toBeCloseTo(2.25, 12);
    // contract: enunciado de ex00.3: al empezar, la capa gira v
    expect(labAt(lab(3)).img_angle).toBeGreaterThan(30);
  });

  it('ex00.1 a ex00.3: v en el origen no cumple ninguna meta', () => {
    for (const k of [1, 2, 3]) {
      const q = lab(k);
      const values = labAt(q, { vx: 0, vy: 0 });
      // contract: encargo de simetricas (parent, 2026-11-11): v = (0, 0) no cumple ninguna meta
      for (const g of q.goals)
        expect(
          solves({ ...q, goals: [g] }, { vx: 0, vy: 0 }),
          `${q.id} ${g.metric} = ${values[g.metric]}`,
        ).toBe(false);
    }
  });

  it('ex00.4: decorrelar sin aplastar; hay más de una capa que vale y aplastar no cuenta', () => {
    const start = labAt(lab(4));
    // contract: enunciado de ex00.4: «con la capa en la identidad, sus dos salidas van juntas: la covarianza es alta»
    expect(start.cov_xy).toBe(1);
    // contract: solution de ex00.4: î en (1, −1) y ĵ en (1, 1): covarianza 0 y área 2
    const turned = labAt(lab(4), { ix: 1, iy: -1, jx: 1, jy: 1 });
    expect([turned.cov_xy, turned.area]).toEqual([0, 2]);
    expect(solves(lab(4), { ix: 1, iy: -1, jx: 1, jy: 1 })).toBe(true);
    // contract: solution de ex00.4 (regla 3): también î en (1, −2) y ĵ en (0; 2,5), y el giro a media escala
    expect(solves(lab(4), { ix: 1, iy: -2, jx: 0, jy: 2.5 })).toBe(true);
    expect(solves(lab(4), { ix: 0.5, iy: -0.5, jx: 0.5, jy: 0.5 })).toBe(true);
    // contract: tentadora y mala (solution): ĵ en el origen da covarianza 0, pero la capa aplasta
    const flat = labAt(lab(4), { jx: 0, jy: 0 });
    expect([flat.cov_xy, flat.area]).toEqual([0, 0]);
    expect(solves(lab(4), { jx: 0, jy: 0 })).toBe(false);
  });

  it('ex00.5: la capa acierta sin ser simétrica; igualar los pesos cruzados por el buen lado resuelve', () => {
    const start = labAt(lab(5));
    // contract: enunciado de ex00.5: «ya acierta con las seis, pero no es simétrica»
    expect([start.acc, start.asym]).toEqual([1, 2]);
    // contract: solution de ex00.5: î en (0, 1); también bajar los dos pesos cruzados a 0,5
    expect(solves(lab(5), { iy: 1 })).toBe(true);
    expect(solves(lab(5), { iy: 0.5, jx: 0.5 })).toBe(true);
    // contract: tentadora y mala (solution): ĵ en (−1; 0,5) es simétrica, pero falla con las seis
    const flipped = labAt(lab(5), { jx: -1 });
    expect([flipped.asym, flipped.acc]).toEqual([0, 0]);
  });
});

describe('simetricas, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01] = simetricas.exercises;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 2): covarianza 2 de los cuatro textos; la segunda opción; uᵀCu = 2,21; la tercera opción; 768·769/2
    expect(ex01!.questions.map(answerOf)).toEqual([
      [2, 0],
      1,
      [2.21, 0.01],
      2,
      [(768 * 769) / 2, 0],
    ]);
  });

  it('ex01.1: la media de los productos de los cuatro textos es 2, y 8/3 con n − 1', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es numero con capa');
    const pts = q.lab.points;
    // contract: prompt de ex01.1: cuatro textos centrados
    expect([pts.reduce((s, p) => s + p.x, 0), pts.reduce((s, p) => s + p.y, 0)]).toEqual([0, 0]);
    // contract: solution de ex01.1: productos 4, 0, 0 y 4; suman 8; entre 4 da 2 y entre 3, 8/3
    expect(pts.map((p) => p.x * p.y + 0)).toEqual([4, 0, 0, 4]);
    expect(
      cov(
        pts.map((p) => p.x),
        pts.map((p) => p.y),
      ),
    ).toBeCloseTo(8 / 3, 12);
  });

  it('ex01.2: la covarianza de los seis textos es positiva y «saludo» está por debajo en los dos rasgos', () => {
    const q = ex01!.questions[1]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.2 es opcion con capa');
    // contract: prompt de ex01.2: «el panel da su covarianza, que es positiva»
    expect(
      labAt({ ...labQuestion(projectQuestions(simetricas), 'simetricas.ex00.1'), lab: q.lab })
        .cov_xy,
    ).toBe(1);
    const saludo = q.lab.points.find((p) => p.id === 'saludo')!;
    // contract: solution de ex01.2: «saludo» está por debajo de la media en ambos
    expect(saludo.x < 0 && saludo.y < 0).toBe(true);
  });

  it('ex01.3: uᵀCu con u = (0,6; 0,8) es 2,21 y es la varianza de la nube sobre la recta del laboratorio', () => {
    const q = ex01!.questions[2]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.3 es numero con capa');
    const C: M = [
      [1.25, 1],
      [1, 1.25],
    ];
    const u: V = [0.6, 0.8];
    // contract: solution de ex01.3: Cu = (1,55; 1,6) y uᵀCu = 0,93 + 1,28 = 2,21
    expect(apply(C, u).map((t) => Math.round(t * 1e9) / 1e9)).toEqual([1.55, 1.6]);
    expect(dot(u, apply(C, u))).toBeCloseTo(2.21, 12);
    // contract: prompt de ex01.3: la recta del laboratorio va en la dirección de u, y su varianza es la respuesta
    expect(q.lab.probe).toEqual({ x: 1.5, y: 2, movable: false, on: 'input' });
    const values = labAt({
      ...labQuestion(projectQuestions(simetricas), 'simetricas.ex00.1'),
      lab: q.lab,
    });
    expect(values.var_v).toBeCloseTo(2.21, 12);
    // contract: solution de ex01.3: la recta va a unos 8° de la diagonal
    expect(Math.round(degrees(u, [1, 1]))).toBe(8);
  });

  it('ex01.4: la opción correcta habla de simetría y las direcciones propias son perpendiculares', () => {
    const q = ex01!.questions[3]!;
    if (q.type !== 'opcion') throw new Error('ex01.4 es opcion');
    // contract: takeaway de ex01.4: la covarianza es simétrica (teorema espectral)
    expect(q.options[q.correct]).toMatch(/simétrica/);
    const C: M = [
      [1.25, 1],
      [1, 1.25],
    ];
    // contract: solution de ex01.4: (1, 1) y (1, −1) son direcciones propias de C y su producto escalar es 0
    expect(apply(C, [1, 1])).toEqual([2.25, 2.25]);
    expect(apply(C, [1, -1])).toEqual([0.25, -0.25]);
    expect(dot([1, 1], [1, -1])).toBe(0);
    // contract: solution de ex01.4: (2 1; 0 1) tiene direcciones propias (1, 0) y (1, −1), a 45°
    const N = cols([2, 0], [1, 1]);
    expect(apply(N, [1, 0])).toEqual([2, 0]);
    expect(apply(N, [1, -1])).toEqual([1, -1]);
    expect(degrees([1, 0], [1, -1])).toBeCloseTo(45, 9);
  });

  it('ex01.5: las cifras de la solución', () => {
    // contract: solution de ex01.5: 768² − 768 = 589 056 casillas, 294 528 parejas, 295 296 en total y 589 824 sin simetría
    expect(768 * 768 - 768).toBe(589056);
    expect((768 * 768 - 768) / 2).toBe(294528);
    expect(294528 + 768).toBe(295296);
    expect(768 * 768).toBe(589824);
  });
});

describe('simetricas: «Programar» y hojas', () => {
  const [, , ex02] = simetricas.exercises;
  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: X con x = 1…6 e y = (2, 3, 5, 4, 7, 9): var x = 3,5, cov = 4,6, var y = 6,8
    const x = [1, 2, 3, 4, 5, 6];
    const y = [2, 3, 5, 4, 7, 9];
    expect([cov(x, x), cov(x, y), cov(y, y)].map((t) => Math.round(t * 1e9) / 1e9)).toEqual([
      3.5, 4.6, 6.8,
    ]);
    // contract: ex02.1 (checks): dividir var x entre n daría 17,5/6 = 35/12
    expect(((x.length - 1) * cov(x, x)) / x.length).toBeCloseTo(35 / 12, 12);
    // contract: ex02.2: los datos (1, 2), (2, 1), (3, 4), (4, 3), (5, 5) dan la covarianza (2,5 2; 2 2,5)
    const dx = [1, 2, 3, 4, 5];
    const dy = [2, 1, 4, 3, 5];
    expect([cov(dx, dx), cov(dx, dy), cov(dy, dy)]).toEqual([2.5, 2, 2.5]);
    // contract: ex02.3: C = (1 2; 2 −2) tiene traza −1 y determinante −6 (λ = 2 y −3); C·(2, 1) = 2·(2, 1) y C·(1, −2) = −3·(1, −2); (2, 1)·(1, −2) = 0
    const C: M = [
      [1, 2],
      [2, -2],
    ];
    expect([1 + -2, det(C)]).toEqual([-1, -6]);
    expect([2, -3].map((l) => l * l + l - 6)).toEqual([0, 0]);
    expect(apply(C, [2, 1])).toEqual([4, 2]);
    expect(apply(C, [1, -2])).toEqual([-3, 6]);
    expect(dot([2, 1], [1, -2])).toBe(0);
    // contract: ex02.4: C = (5 −2 0; −2 4 −2; 0 −2 3) tiene autovectores (1, 2, 2), (2, 1, −2) y (2, −2, 1) de autovalores 1, 4 y 7
    const C3 = [
      [5, -2, 0],
      [-2, 4, -2],
      [0, -2, 3],
    ];
    const times = (m: number[][], v: number[]): number[] => m.map((row) => dot(row, v));
    expect(times(C3, [1, 2, 2])).toEqual([1, 2, 2]);
    expect(times(C3, [2, 1, -2])).toEqual([8, 4, -8]);
    expect(times(C3, [2, -2, 1])).toEqual([14, -14, 7]);
    expect(
      dot([1, 2, 2], [2, 1, -2]) + dot([1, 2, 2], [2, -2, 1]) + dot([2, 1, -2], [2, -2, 1]),
    ).toBe(0);
    // contract: ex02.5: X con x = (2, 4, 6, 8, 10) e y = (1, 3, 2, 6, 3) tiene C = (10 3,5; 3,5 3,5); varianzas de (1, 0), (0, 3), (1, 1), (1, −1) normalizadas: 10, 3,5, 10,25 y 3,25
    const px = [2, 4, 6, 8, 10];
    const py = [1, 3, 2, 6, 3];
    const Cx: M = [
      [cov(px, px), cov(px, py)],
      [cov(px, py), cov(py, py)],
    ];
    expect(Cx).toEqual([
      [10, 3.5],
      [3.5, 3.5],
    ]);
    const cands: V[] = [
      [1, 0],
      [0, 3],
      [1, 1],
      [1, -1],
    ];
    expect(cands.map((u) => rayleigh(Cx, u))).toEqual([10, 3.5, 10.25, 3.25]);
    // contract: ex02.5 (solution): sin normalizar gana la candidata más larga, la 1 (uᵀCu = 10, 31,5, 20,5, 6,5)
    const raw = cands.map((u) => dot(u, apply(Cx, u)));
    expect(raw).toEqual([10, 31.5, 20.5, 6.5]);
    expect(raw.indexOf(Math.max(...raw))).toBe(1);
    expect(cands.map((u) => rayleigh(Cx, u)).indexOf(10.25)).toBe(2);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 2 de matrices (P2): código con np.cov(X) (línea 2), autovectores falsos (línea 3) y una correcta (null); al menos una de código
    expect(simetricas.sheets.map(answerOf)).toEqual([1, 2, null]);
    expect(simetricas.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas (P2): `C = np.cov(X)` sin rowvar, y «(1, 2) para λ = 1»
    const faulty = simetricas.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'C = np.cov(X)',
      'Sus autovectores son (1, 1) para λ = 3 y (1, 2) para λ = 1',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of simetricas.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    const A: M = [
      [2, 1],
      [1, 2],
    ];
    // contract: hoja 2: A = (2 1; 1 2) tiene traza 4 y determinante 3 (λ = 3 y 1); A·(1, 1) = 3·(1, 1), A·(1, −1) = (1, −1)
    expect([A[0][0] + A[1][1], det(A)]).toEqual([4, 3]);
    expect(apply(A, [1, 1])).toEqual([3, 3]);
    expect(apply(A, [1, -1])).toEqual([1, -1]);
    // contract: hoja 2 (solution): A·(1, 2) = (4, 5), no es múltiplo de (1, 2); (1, 1)·(1, 2) = 3
    expect(apply(A, [1, 2])).toEqual([4, 5]);
    expect(dot([1, 1], [1, 2])).toBe(3);
    // contract: hoja 3: C = (4 −3; −3 9) es simétrica, con var x = 4 < var y = 9, covarianza −3 y determinante 27 > 0
    const C: M = [
      [4, -3],
      [-3, 9],
    ];
    expect(C[0][1]).toBe(C[1][0]);
    expect(det(C)).toBe(27);
    expect(Math.abs(C[0][1])).toBeLessThanOrEqual(Math.sqrt(C[0][0] * C[1][1]));
  });
});

describe('banco de examen 2 del proyecto simetricas', () => {
  it('tiene tres entradas fijas del proyecto simetricas, con ids examen-2.*', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver): un laboratorio y una cuenta del estilo nuevo; la de código se conserva («Programar» no se toca)
    expect(examen2Simetricas.map((e) => e.project)).toEqual([
      'simetricas',
      'simetricas',
      'simetricas',
    ]);
    expect(examen2Simetricas.map((e) => e.question.id)).toEqual([
      'examen-2.decorrelar-nube',
      'examen-2.covarianza-384',
      'examen-2.autovalores-de-mayor-a-menor',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2Simetricas) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo; las generadas las añade el ensamblado
    expect(examen2Simetricas.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2Simetricas.map((e) => e.question.type)).toEqual([
      'laboratorio',
      'numero',
      'codigo',
    ]);
    const projectIds = new Set(projectQuestions(simetricas).map((q) => q.id));
    expect(examen2Simetricas.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('decorrelar-nube: empieza correlada; la capa de la solución vale y el giro de los textos no', () => {
    const q = labQuestion(bankQuestions, 'examen-2.decorrelar-nube');
    // contract: enunciado: «con la capa en la identidad, la covarianza de las dos salidas es alta» (13,5/7)
    expect(labAt(q).cov_xy).toBeCloseTo(13.5 / 7, 12);
    // contract: solution: î en (1; −0,5) y ĵ en (0,5; 1), con área 1,25
    expect(solves(q, { ix: 1, iy: -0.5, jx: 0.5, jy: 1 })).toBe(true);
    expect(labAt(q, { ix: 1, iy: -0.5, jx: 0.5, jy: 1 }).area).toBe(1.25);
    // contract: regla 3 de la guía (varias soluciones): también con la salida 2 el doble de larga, ĵ en (0,5; 2)
    expect(solves(q, { ix: 1, iy: -1, jx: 0.5, jy: 2 })).toBe(true);
    // contract: tentadora y mala (solution): el giro de un octavo de vuelta, que valía para los textos, aquí no
    expect(solves(q, { ix: 1, iy: -1, jx: 1, jy: 1 })).toBe(false);
  });

  it('covarianza-384: las cifras de la solución', () => {
    const q = bankQuestions[1]!;
    // contract: examen-2.covarianza-384: 384·385/2 = 73 920
    expect(answerOf(q)).toEqual([(384 * 385) / 2, 0]);
    // contract: solution: 384² − 384 = 147 072, 73 536 parejas, 147 456 casillas
    expect(384 * 384 - 384).toBe(147072);
    expect((384 * 384 - 384) / 2).toBe(73536);
    expect(73536 + 384).toBe(73920);
    expect(384 * 384).toBe(147456);
  });

  it('autovalores-de-mayor-a-menor: la covarianza de datos tiene autovalores 4,5 y 0,5', () => {
    // contract: solution de examen-2.autovalores-de-mayor-a-menor: datos con x = 1…5 e y = (0, −1, 1, 3, 2) dan C = (2,5 2; 2 2,5), de traza 5 y determinante 2,25
    const x = [1, 2, 3, 4, 5];
    const y = [0, -1, 1, 3, 2];
    const C: M = [
      [cov(x, x), cov(x, y)],
      [cov(x, y), cov(y, y)],
    ];
    expect(C).toEqual([
      [2.5, 2],
      [2, 2.5],
    ]);
    expect([C[0][0] + C[1][1], det(C)]).toEqual([5, 2.25]);
    // contract: λ² − 5λ + 2,25 = 0 tiene por raíces 4,5 y 0,5; C·(1, 1) = 4,5·(1, 1)
    expect([4.5, 0.5].map((l) => l * l - 5 * l + 2.25)).toEqual([0, 0]);
    expect(apply(C, [1, 1])).toEqual([4.5, 4.5]);
  });
});

describe('proyecto simetricas: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(simetricas), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `simetricas.ex02.${n}`),
      'examen-2.autovalores-de-mayor-a-menor',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
