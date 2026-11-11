import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { labMeasure } from '../../engine/labs';
import { compresionScene } from '../../engine/labs/compresion';
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
import { warmupAsQuestion } from '../../../tests/content/warmup-helpers';
import { RAYAS_CON_RUIDO, svd } from './svd';
import { examen3Svd } from './examen-3-svd';

const bankQuestions = examen3Svd
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto svd', projectQuestions(svd));
defineProseTests('banco examen-3 svd', bankQuestions);
defineProseTests('calentamiento svd', (svd.warmup ?? []).map(warmupAsQuestion));
defineLabProjectTests(svd, examen3Svd);

type V = [number, number];
type M = [[number, number], [number, number]];
/** Producto A·v de una matriz 2×2 por un vector. */
const apply = (a: M, v: V): V => [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
const norm = (v: V): number => Math.hypot(v[0], v[1]);
/** Estiramiento |A·v| / |v|. */
const stretch = (a: M, v: V): number => norm(apply(a, v)) / norm(v);
/** Valores singulares de una matriz 2×2, de mayor a menor: raíces de los autovalores de AᵀA. */
const sv2 = (a: M): [number, number] => {
  const ata = [
    [a[0][0] * a[0][0] + a[1][0] * a[1][0], a[0][0] * a[0][1] + a[1][0] * a[1][1]],
    [a[0][0] * a[0][1] + a[1][0] * a[1][1], a[0][1] * a[0][1] + a[1][1] * a[1][1]],
  ] as M;
  const tr = ata[0][0] + ata[1][1];
  const det = ata[0][0] * ata[1][1] - ata[0][1] * ata[1][0];
  const s = Math.sqrt(Math.max(tr * tr - 4 * det, 0));
  return [Math.sqrt((tr + s) / 2), Math.sqrt(Math.max((tr - s) / 2, 0))];
};
const det2 = (a: M): number => a[0][0] * a[1][1] - a[0][1] * a[1][0];

/** Matrices de las hojas. */
const A1: M = [
  [2, 2],
  [-1, 1],
];
const A4: M = [
  [1, 2],
  [2, 1],
];

describe('proyecto svd', () => {
  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10): SVD, «capas de más a menos importantes»; el id no cambia
    expect([svd.id, svd.name, svd.sub]).toEqual(['svd', 'SVD', 'Capas de más a menos importantes']);
  });

  it('pasa checkProject sin problemas', () => {
    // contract: encargo común (2026-11-10): checkProject(svd) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(svd)).toEqual([]);
  });

  it('tiene calentamiento de Python de 1 a 4 fichas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): calentamiento de 1 a 4 fichas enlazado con warmup
    expect(svd.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(svd.warmup?.length).toBeLessThanOrEqual(4);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos del encargo, y tres hojas', () => {
    // contract: encargo de la Órbita 3 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(svd.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(svd.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(svd.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón svd.exNN.k y svd.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(svd).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `svd.ex0${e}.${k}`)),
      'svd.hoja.1',
      'svd.hoja.2',
      'svd.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('svd, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(svd);
  const lab = (k: number) => labQuestion(all, `svd.ex00.${k}`);

  it('ex00.1: con una capa la cara no se reconoce; 2 o 3 capas valen y 4 cuesta más que la imagen', () => {
    const start = labAt(lab(1));
    // contract: enunciado de ex00.1: «son 64» números y «con una sola capa la cara no se reconoce» (error del 34 %, por encima del 25 %)
    expect(start.full).toBe(64);
    expect(start.error).toBeGreaterThan(0.25);
    // contract: solution de ex00.1: 2 capas (19 %, 34 números) y 3 capas (7,5 %, 51 números) resuelven: dos soluciones (regla 3)
    expect(solves(lab(1), { k: 2 })).toBe(true);
    expect(solves(lab(1), { k: 3 })).toBe(true);
    expect([labAt(lab(1), { k: 2 }).stored, labAt(lab(1), { k: 3 }).stored]).toEqual([34, 51]);
    expect(labAt(lab(1), { k: 2 }).error).toBeCloseTo(0.19, 2);
    expect(labAt(lab(1), { k: 3 }).error).toBeCloseTo(0.075, 3);
    // contract: tentadora y mala (solution): 4 capas dan la cara exacta pero cuestan 68 números, más que la imagen
    expect(labAt(lab(1), { k: 4 }).error).toBeLessThan(1e-9);
    expect(labAt(lab(1), { k: 4 }).stored).toBe(68);
    expect(solves(lab(1), { k: 4 })).toBe(false);
  });

  it('ex00.2: la tabla de pesos tiene rango 2; 2 capas la reproducen con 22 números y 3 cuestan 33', () => {
    const start = labAt(lab(2));
    // contract: enunciado de ex00.2: «son 24 números»; solution: con 1 capa se pierde el 65 %
    expect(start.full).toBe(24);
    expect(start.error).toBeCloseTo(0.65, 2);
    // contract: solution de ex00.2: con 2 capas el error es 0 y se guardan 22 números; σ₃ = 0
    expect(solves(lab(2), { k: 2 })).toBe(true);
    expect(labAt(lab(2), { k: 2 }).stored).toBe(22);
    expect(labAt(lab(2)).sigma_3).toBe(0);
    // contract: tentadora y mala (solution): con 3 el error sigue en 0 pero se guardan 33
    expect(labAt(lab(2), { k: 3 }).stored).toBe(33);
    expect(solves(lab(2), { k: 3 })).toBe(false);
  });

  it('ex00.3: sin la primera capa no se llega; la 1 con la 2 o con la 3 sí, y con la 4 no', () => {
    // contract: solution de ex00.3: la 1 con la 2 (96 %) o con la 3 (91 %) resuelven: dos soluciones (regla 3)
    expect(solves(lab(3), { c1: 1, c2: 1 })).toBe(true);
    expect(solves(lab(3), { c1: 1, c3: 1 })).toBe(true);
    expect(labAt(lab(3), { c1: 1, c2: 1 }).kept).toBeCloseTo(0.96, 2);
    expect(labAt(lab(3), { c1: 1, c3: 1 }).kept).toBeCloseTo(0.91, 2);
    // contract: solution de ex00.3: la 1 con la 4 se queda en el 89 %; la 2 con la 3, en el 11 %
    expect(labAt(lab(3), { c1: 1, c4: 1 }).kept).toBeCloseTo(0.89, 2);
    expect(labAt(lab(3), { c2: 1, c3: 1 }).kept).toBeCloseTo(0.11, 2);
    expect(solves(lab(3), { c2: 1, c3: 1 })).toBe(false);
    // contract: explain de ex00.3: la primera sola lleva el 88 % (σ₁ ≈ 4,26); hint: el primer σ es más del triple que el segundo
    expect(labAt(lab(3), { c1: 1 }).kept).toBeCloseTo(0.88, 2);
    expect(labAt(lab(3)).sigma_1).toBeCloseTo(4.26, 2);
    expect(labAt(lab(3)).sigma_1! / labAt(lab(3)).sigma_2!).toBeGreaterThan(3);
    // contract: regla 3: tres capas encendidas no valen aunque conserven más
    expect(solves(lab(3), { c1: 1, c2: 1, c3: 1 })).toBe(false);
  });

  it('ex00.4: la dirección que más alarga es la de «genial», no el eje largo de la elipse', () => {
    const A: M = [
      [2, 2],
      [-1, 1],
    ];
    // contract: solution de ex00.4: A·(1, 1) = (4, 0) y σ₁ = 2√2 ≈ 2,83 es el máximo
    expect(apply(A, [1, 1])).toEqual([4, 0]);
    expect(sv2(A)[0]).toBeCloseTo(2 * Math.SQRT2, 9);
    expect(labAt(lab(4), { vx: 1, vy: 1 }).stretch).toBeCloseTo(sv2(A)[0], 9);
    // contract: enunciado y pista 1 de ex00.4: «genial» y «horrible» salen igual de lejos y «genial» acaba el doble de lejos
    expect(norm([1, 1])).toBe(norm([1, -1]));
    expect(norm(apply(A, [1, 1])) / norm(apply(A, [1, -1]))).toBe(2);
    // contract: solution de ex00.4: vale cualquier v en la recta de (1, 1) o cerca, como (2; 1,5)
    for (const [vx, vy] of [
      [1, 1],
      [-1, -1],
      [0.5, 0.5],
      [2, 1.5],
    ] as const) {
      expect(solves(lab(4), { vx, vy }), `v = (${vx}, ${vy})`).toBe(true);
    }
    // contract: tentadora y mala (solution): v en el eje largo de la elipse, (1, 0), estira √5 ≈ 2,24, lo mismo que la posición de partida, (0, 1)
    expect(labAt(lab(4)).stretch).toBeCloseTo(Math.sqrt(5), 9);
    expect(labAt(lab(4), { vx: 1, vy: 0 }).stretch).toBeCloseTo(Math.sqrt(5), 9);
    expect(solves(lab(4), { vx: 1, vy: 0 })).toBe(false);
    expect(solves(lab(4), { vx: 0, vy: 1 })).toBe(false);
    // contract: regla 4 (un límite): ninguna dirección de la rejilla pasa de σ₁
    for (let vx = -4.5; vx <= 4.5; vx += 0.5)
      for (let vy = -4.5; vy <= 4.5; vy += 0.5)
        if (vx !== 0 || vy !== 0)
          expect(labAt(lab(4), { vx, vy }).stretch!).toBeLessThanOrEqual(sv2(A)[0] + 1e-9);
  });

  it('ex00.4: las imágenes de las reseñas caben en la ventana', () => {
    const spec = lab(4).lab;
    if (spec.kind !== 'capa') throw new Error('ex00.4 usa el laboratorio capa');
    // contract: encargo común: las palabras caben en la ventana (la mayor imagen es «genial», en (4, 0))
    expect(spec.range).toBeGreaterThanOrEqual(4);
  });

  it('ex00.5: empieza con las seis capas; 1 o 2 resuelven y la capa 1 queda más cerca de las rayas limpias', () => {
    const start = labAt(lab(5));
    // contract: enunciado de ex00.5: al empezar se suman las seis capas y se guardan más números que la tabla
    expect([start.k, start.full]).toEqual([6, 36]);
    expect(start.stored).toBeGreaterThan(36);
    // contract: solution de ex00.5: 1 o 2 capas, con error del 9 % o del 4 % y 13 o 26 números
    expect(solves(lab(5), { k: 1 })).toBe(true);
    expect(solves(lab(5), { k: 2 })).toBe(true);
    expect(labAt(lab(5), { k: 1 }).error).toBeCloseTo(0.09, 2);
    expect(labAt(lab(5), { k: 2 }).error).toBeCloseTo(0.04, 2);
    expect([labAt(lab(5), { k: 1 }).stored, labAt(lab(5), { k: 2 }).stored]).toEqual([13, 26]);
    // contract: solution de ex00.5: con 0 capas se pierde todo; con 3 se guardan 39
    expect(solves(lab(5), { k: 0 })).toBe(false);
    expect(labAt(lab(5), { k: 3 }).stored).toBe(39);
    expect(solves(lab(5), { k: 3 })).toBe(false);
    // contract: comentario de RAYAS_CON_RUIDO: las rayas limpias son (0,3; 0,6; 0,9; 0,9; 0,6; 0,3) por (0,5; 1; 1; 0,5; 0,5; 1) y el ruido no pasa de 0,05
    const u = [0.3, 0.6, 0.9, 0.9, 0.6, 0.3];
    const s = [0.5, 1, 1, 0.5, 0.5, 1];
    const clean = u.map((a) => s.map((b) => a * b));
    const noise = RAYAS_CON_RUIDO.flatMap((row, i) => row.map((x, j) => x - clean[i]![j]!));
    expect(Math.max(...noise.map(Math.abs))).toBeLessThanOrEqual(0.05 + 1e-9);
    // contract: solution y takeaway de ex00.5: la capa 1 se aleja un 2 % de las rayas limpias y la tabla original, un 9 % («cinco veces más cerca»)
    const fro = (rows: number[][]) => Math.hypot(...rows.flat());
    const spec = lab(5).lab;
    if (spec.kind !== 'compresion') throw new Error('ex00.5 usa el laboratorio compresion');
    const one = compresionScene(spec, { k: 1 }).approx;
    const fromClean = (rows: number[][]) =>
      fro(rows.map((r, i) => r.map((x, j) => x - clean[i]![j]!))) / fro(clean);
    expect(fromClean(one)).toBeCloseTo(0.02, 2);
    expect(fromClean(RAYAS_CON_RUIDO)).toBeCloseTo(0.09, 2);
    expect(fromClean(RAYAS_CON_RUIDO) / fromClean(one)).toBeGreaterThan(5);
    // contract: enunciado de ex00.5: «uno grande y los demás muy pequeños»
    expect(start.sigma_2! / start.sigma_1!).toBeLessThan(0.1);
  });
});

describe('svd, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01] = svd.exercises;
  const q = (k: number) => ex01!.questions[k - 1]!;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 3): 2·(40 + 60 + 1); 20/22 en %; rango 4; 64·(4096 + 4096 + 1); σ₁·|x| = 6·3
    expect(ex01!.questions.map(answerOf)).toEqual([
      [2 * (40 + 60 + 1), 0],
      [90.9, 0.1],
      [4, 0],
      [64 * (4096 + 4096 + 1), 0],
      [6 * 3, 0],
    ]);
    // contract: solution de ex01.2: 20/22 ≈ 90,9 %; sumando los σ saldría 6/8 = 75 %
    expect((100 * (16 + 4)) / 22).toBeCloseTo(90.9, 1);
    // contract: solution de ex01.4: 524 352 frente a 16 777 216, alrededor del 3 % (unas 32 veces menos); sin los σ, 524 288
    expect(64 * 8193).toBe(524352);
    expect(4096 * 4096).toBe(16777216);
    expect(16777216 / 524352).toBeCloseTo(32, 0);
    expect(64 * 8192).toBe(524288);
  });

  it('ex01.1: su laboratorio es la tabla de 4×6 y rango 2, que no enseña la respuesta de la de 40×60', () => {
    const one = q(1);
    if (one.type !== 'numero' || one.lab?.kind !== 'compresion')
      throw new Error('ex01.1 es numero con compresion');
    // contract: enunciado de ex01.1: una tabla de 4×6 y rango 2; pista 1: una capa cuesta 11 números
    expect([one.lab.rows.length, one.lab.rows[0]!.length]).toEqual([4, 6]);
    expect(labMeasure(one.lab, {}).rank).toBe(2);
    expect(labMeasure(one.lab, { k: 1 }).stored).toBe(11);
    // contract: solution de ex01.1: en la de 4×6 eran 22 frente a 24; en la de 40×60, 202 frente a 2400 (un 8 %), y sin los σ, 200
    expect([labMeasure(one.lab, { k: 2 }).stored, labMeasure(one.lab, {}).full]).toEqual([22, 24]);
    expect(40 * 60).toBe(2400);
    expect((100 * 202) / 2400).toBeCloseTo(8, 0);
    expect(2 * (40 + 60)).toBe(200);
    // contract: guía de contenido: ningún estado del deslizador enseña la respuesta
    for (let k = 0; k <= 4; k++) expect(labMeasure(one.lab, { k }).stored).not.toBe(one.answer);
  });

  it('ex01.2: los σ de la tabla son 4, 2, 1 y 1 y la parte conservada con 2 capas es la respuesta', () => {
    const two = q(2);
    if (two.type !== 'numero' || two.lab?.kind !== 'compresion')
      throw new Error('ex01.2 es numero con compresion');
    const values = labMeasure(two.lab, { k: 2 });
    // contract: enunciado de ex01.2: σ = 4, 2, 1 y 1
    expect([1, 2, 3, 4].map((i) => values[`sigma_${i}`])).toEqual(
      [4, 2, 1, 1].map((x) => expect.closeTo(x, 9)),
    );
    // contract: solution de ex01.2: 20/22; takeaway: el error que queda es √(2/22) ≈ 30 %
    expect(100 * values.kept!).toBeCloseTo(90.9, 1);
    expect(values.error).toBeCloseTo(Math.sqrt(2 / 22), 9);
    expect(Math.sqrt(2 / 22)).toBeCloseTo(0.3, 1);
  });

  it('ex01.3: la cara tiene rango 4 y 4 capas dejan el error en 0', () => {
    const three = q(3);
    if (three.type !== 'numero' || three.lab?.kind !== 'compresion')
      throw new Error('ex01.3 es numero con compresion');
    const values = labMeasure(three.lab, { k: 4 });
    // contract: solution de ex01.3: rango 4, σ ≈ 4,26; 1,28; 0,79; 0,34 y los otros cuatro 0
    expect(values.rank).toBe(three.answer);
    expect([1, 2, 3, 4].map((i) => Math.round(100 * values[`sigma_${i}`]!) / 100)).toEqual([
      4.26, 1.28, 0.79, 0.34,
    ]);
    expect([5, 6, 7, 8].map((i) => values[`sigma_${i}`])).toEqual([0, 0, 0, 0]);
    expect(values.error).toBeLessThan(1e-9);
    // contract: solution de ex01.3: cada fila es simétrica (la columna 8 repite la 1, la 7 la 2…)
    for (const row of three.lab.rows) expect(row).toEqual([...row].reverse());
  });
});

describe('svd: «Programar» y hojas, que no cambian', () => {
  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 3 de matrices: ex02 programar, cinco preguntas de código
    expect(svd.exercises[2]!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: A = (3 2; 0 2): AᵀA = (9 6; 6 8), autovalores 8,5 ± √6,25... se recalculan con sv2: σ₁ = 3,81 y σ₂ = 1,57
    const A: M = [
      [3, 2],
      [0, 2],
    ];
    expect(sv2(A)[0]).toBeCloseTo(3.81, 2);
    expect(sv2(A)[1]).toBeCloseTo(1.57, 2);
    // contract: ex02.1: v₁ ≈ (0,74; 0,68) y A·v₁ ≈ (3,56; 1,35), de norma σ₁ (u₁ ≈ (0,93; 0,36))
    const v1: V = [0.73588229, 0.67710949];
    expect(apply(A, v1)[0]).toBeCloseTo(3.56, 2);
    expect(apply(A, v1)[1]).toBeCloseTo(1.35, 2);
    expect(norm(apply(A, v1))).toBeCloseTo(sv2(A)[0], 6);
    // contract: ex02.2: A = (1 0; 2 1; 0 3): AᵀA = (1+4 2; 2 1+9) = (5 2; 2 10), autovalores 7,5 ± √(6,25+4) = 10,70 y 4,30: σ = 3,27 y 2,07
    const ata2: M = [
      [5, 2],
      [2, 10],
    ];
    const tr2 = ata2[0][0] + ata2[1][1];
    const d2 = Math.sqrt(tr2 * tr2 - 4 * det2(ata2));
    expect(Math.sqrt((tr2 + d2) / 2)).toBeCloseTo(3.27, 2);
    expect(Math.sqrt((tr2 - d2) / 2)).toBeCloseTo(2.07, 2);
    // contract: ex02.3: A = (2 1; 0 2; 1 0): AᵀA = (4+0+1 2+0+0; 2 1+4+0) = (5 2; 2 5), autovalores 7 y 3: σ = √7 ≈ 2,65 y √3 ≈ 1,73
    const ata3: M = [
      [5, 2],
      [2, 5],
    ];
    expect(2 * 2 + 0 * 0 + 1 * 1).toBe(ata3[0][0]);
    expect(1 * 1 + 2 * 2 + 0 * 0).toBe(ata3[1][1]);
    expect(2 * 1 + 0 * 2 + 1 * 0).toBe(ata3[0][1]);
    expect(ata3[0][0] + ata3[1][1]).toBe(10);
    expect(det2(ata3)).toBe(21);
    expect((10 + Math.sqrt(100 - 84)) / 2).toBe(7);
    expect((10 - Math.sqrt(100 - 84)) / 2).toBe(3);
    expect(Math.sqrt(7)).toBeCloseTo(2.65, 2);
    expect(Math.sqrt(3)).toBeCloseTo(1.73, 2);
    // contract: ex02.5: W = (3 1 0; 1 2 −1; 0 2 2) y x = (0,6; 0; 0,8): W·x = (1,8; −0,2; 1,6), de norma 2,42; con σ₁ = 3,82 (NumPy) la salida normalizada mide 0,63
    const W = [
      [3, 1, 0],
      [1, 2, -1],
      [0, 2, 2],
    ];
    const x = [0.6, 0, 0.8];
    const wx = W.map((r) => r[0]! * x[0]! + r[1]! * x[1]! + r[2]! * x[2]!);
    expect(Math.hypot(...wx)).toBeCloseTo(2.42, 2);
    expect(Math.hypot(...wx) / 3.816353138401893).toBeCloseTo(0.63, 2);
  });

  it('ex02: los mensajes de las comprobaciones llevan el código en línea entre acentos graves', () => {
    const code = [...projectQuestions(svd), ...bankQuestions].filter(
      (q): q is CodigoQ => q.type === 'codigo',
    );
    // contract: encargo de la Órbita 3 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `svd.ex02.${n}`),
      'examen-3.volumen-con-valores-singulares',
    ]);
    for (const q of code) {
      expect(checkMessages(q).length, q.id).toBeGreaterThan(0);
      const names = new Set(
        [...`${q.starter}\n${q.reference}`.matchAll(/^(\w+)\s*=/gm)].map((m) => m[1]!),
      );
      for (const m of checkMessages(q)) {
        const plain = withoutCode(m);
        // contract: rereview-17d n1 (prosa.test.ts): `np.`, `plt.` y `None` van en código en línea
        expect(plain, `${q.id}: ${m}`).not.toMatch(/\b(np|plt)\.\w|\bNone\b/);
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

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 3 de matrices (svd): código con Vt[:, 0] (línea 2), razonamiento con σ negativo (línea 2) y razonamiento correcto (null)
    expect(svd.sheets.map(answerOf)).toEqual([1, 1, null]);
    expect(svd.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas (svd): `v1 = Vt[:, 0]` (columna en vez de fila) y «los valores singulares de A son 3 y −1»
    const faulty = svd.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['v1 = Vt[:, 0]', 'Luego los valores singulares de A son 3 y −1', null]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of svd.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 2: A = (1 2; 2 1) tiene det 1 − 4 = −3, así que σ₁σ₂ = 3 = 3 · 1
    expect(det2(A4)).toBe(-3);
    expect(sv2(A4)[0] * sv2(A4)[1]).toBeCloseTo(3, 9);
    // contract: hoja 3: un giro de 30° no cambia la longitud de ningún vector, y todos sus valores singulares valen 1
    const t = (30 * Math.PI) / 180;
    const Q: M = [
      [Math.cos(t), -Math.sin(t)],
      [Math.sin(t), Math.cos(t)],
    ];
    expect(sv2(Q)[0]).toBeCloseTo(1, 9);
    expect(sv2(Q)[1]).toBeCloseTo(1, 9);
    expect(stretch(Q, [3, -7])).toBeCloseTo(1, 9);
    // contract: hoja 1: la primera columna de Vt no es la primera fila salvo por casualidad; con A = (2 2; −1 1), v₁ = (1, 1)/√2 estira 2√2
    expect(stretch(A1, [1, 1])).toBeCloseTo(sv2(A1)[0], 9);
  });
});

describe('banco de examen 3 del proyecto svd', () => {
  it('tiene tres entradas fijas del proyecto svd, con ids examen-3.*', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver): un laboratorio, una cuenta del estilo nuevo y el código, que se conserva («Programar» no se toca)
    expect(examen3Svd.map((e) => e.project)).toEqual(['svd', 'svd', 'svd']);
    expect(examen3Svd.map((e) => e.question.id)).toEqual([
      'examen-3.capas-del-corazon',
      'examen-3.numeros-rango-k',
      'examen-3.volumen-con-valores-singulares',
    ]);
    expect(examen3Svd.map((e) => e.question.type)).toEqual(['laboratorio', 'numero', 'codigo']);
  });

  it('cada entrada cumple el esquema del banco, ninguna usa un id reservado y no chocan con el proyecto', () => {
    for (const entry of examen3Svd) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
    // contract: encargo de la Órbita 3 de matrices: ids reservados de las entradas generadas del padre
    const reserved = [
      'examen-3.valores-singulares',
      'examen-3.parametros-lora',
      'examen-3.puntuacion-atencion',
    ];
    expect(examen3Svd.filter((e) => reserved.includes(e.question.id))).toEqual([]);
    const projectIds = new Set(projectQuestions(svd).map((q) => q.id));
    expect(examen3Svd.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('examen-3.capas-del-corazon: la 1 con la 2 o con la 3 resuelven; sin la 1 no', () => {
    const corazon = labQuestion(bankQuestions, 'examen-3.capas-del-corazon');
    // contract: enunciado: al empezar no hay ninguna capa encendida
    expect(labAt(corazon).k).toBe(0);
    // contract: solution: la 1 con la 2 o con la 3 (σ₂ = σ₃ = √2) llevan el total al 90,6 %
    expect(solves(corazon, { c1: 1, c2: 1 })).toBe(true);
    expect(solves(corazon, { c1: 1, c3: 1 })).toBe(true);
    expect(labAt(corazon, { c1: 1, c2: 1 }).kept).toBeCloseTo(0.906, 3);
    expect(labAt(corazon).sigma_2).toBeCloseTo(Math.SQRT2, 9);
    expect(labAt(corazon).sigma_3).toBeCloseTo(Math.SQRT2, 9);
    // contract: explain: la primera sola lleva el 83 %; solution: la 1 con la 4, el 85 %, y la 2 con la 3, el 15 %
    expect(labAt(corazon, { c1: 1 }).kept).toBeCloseTo(0.83, 2);
    expect(labAt(corazon, { c1: 1, c4: 1 }).kept).toBeCloseTo(0.85, 2);
    expect(labAt(corazon, { c2: 1, c3: 1 }).kept).toBeCloseTo(0.15, 2);
    expect(solves(corazon, { c1: 1, c4: 1 })).toBe(false);
    expect(solves(corazon, { c2: 1, c3: 1 })).toBe(false);
  });

  it('respuestas del banco', () => {
    const [, num, cod] = examen3Svd.map((e) => e.question);
    // contract: examen-3.numeros-rango-k: 8·(3072 + 768 + 1) = 30 728, frente a 3072·768 = 2 359 296 (1,3 %); sin los σ, 30 720
    expect(num!.type === 'numero' ? [num!.answer, num!.tol] : []).toEqual([30728, 0]);
    expect(8 * (3072 + 768 + 1)).toBe(30728);
    expect(3072 * 768).toBe(2359296);
    expect((100 * 30728) / 2359296).toBeCloseTo(1.3, 1);
    expect(8 * (3072 + 768)).toBe(30720);
    // contract: examen-3.volumen-con-valores-singulares: V = (2 −1 1; 0 3 1; 1 1 −2) tiene det = 2·(−6−1) − (−1)·(0−1) + 1·(0−3) = −14 − 1 − 3 = −18, y |det| = producto de los σ = 18
    expect(cod!.type).toBe('codigo');
    const V = [
      [2, -1, 1],
      [0, 3, 1],
      [1, 1, -2],
    ];
    const detV =
      V[0]![0]! * (V[1]![1]! * V[2]![2]! - V[1]![2]! * V[2]![1]!) -
      V[0]![1]! * (V[1]![0]! * V[2]![2]! - V[1]![2]! * V[2]![0]!) +
      V[0]![2]! * (V[1]![0]! * V[2]![1]! - V[1]![1]! * V[2]![0]!);
    expect(detV).toBe(-18);
  });
});
