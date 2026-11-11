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
import { pca } from './pca';
import { examen2Pca } from './examen-2-pca';

const bankQuestions = examen2Pca
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto pca', projectQuestions(pca));
defineProseTests('banco examen-2 pca', bankQuestions);
defineLabProjectTests(pca, examen2Pca);

type V = [number, number];
type M = [[number, number], [number, number]];
/** Autovalores de una matriz simétrica 2×2, de menor a mayor. */
const eig2 = (c: M): [number, number] => {
  const tr = c[0][0] + c[1][1];
  const det = c[0][0] * c[1][1] - c[0][1] * c[1][0];
  const s = Math.sqrt(tr * tr - 4 * det);
  return [(tr - s) / 2, (tr + s) / 2];
};
/** Covarianza muestral (dividida entre n − 1) de datos con dos variables. */
const cov2 = (xs: V[]): M => {
  const n = xs.length;
  const mx = xs.reduce((s, p) => s + p[0], 0) / n;
  const my = xs.reduce((s, p) => s + p[1], 0) / n;
  const f = (a: number, b: number): number =>
    xs.reduce((s, p) => s + (p[a] - (a === 0 ? mx : my)) * (p[b] - (b === 0 ? mx : my)), 0) /
    (n - 1);
  return [
    [f(0, 0), f(0, 1)],
    [f(1, 0), f(1, 1)],
  ];
};
/** Redondeo a `d` decimales, para comparar lo que enseña un texto. */
const round = (n: number, d: number): number => Math.round(n * 10 ** d) / 10 ** d;

describe('proyecto pca', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 2 de matrices: checkProject(pca) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(pca)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 2 de matrices (tabla de la parte común): id pca, nombre «PCA», subtítulo «Ver en dos dimensiones»
    expect([pca.id, pca.name, pca.sub]).toEqual(['pca', 'PCA', 'Ver en dos dimensiones']);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 2 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(pca.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(pca.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(pca.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón pca.exNN.k y pca.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(pca).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `pca.ex0${e}.${k}`)),
      'pca.hoja.1',
      'pca.hoja.2',
      'pca.hoja.3',
    ]);
  });

  it('tiene calentamiento de Python de 1 a 4 fichas', () => {
    // contract: encargo de la Órbita 2 de matrices: calentamiento de 1 a 4 fichas enlazado con warmup
    expect(pca.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(pca.warmup?.length).toBeLessThanOrEqual(4);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('pca, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(pca);
  const lab = (k: number) => labQuestion(all, `pca.ex00.${k}`);

  it('ex00.1: con la recta en vertical se pierde casi todo; la del eje largo pierde poco', () => {
    const start = labAt(lab(1));
    // contract: enunciado de ex00.1: «la recta va en vertical y se pierde casi todo» (4 de 5,14)
    expect([round(start.lost!, 2), round(start.lost! + start.var_v!, 2)]).toEqual([4, 5.14]);
    // contract: solution de ex00.1: v en (2, 1), (4, 2) o (−2, −1) pierde 0,17
    expect(round(labAt(lab(1), { vx: 2, vy: 1 }).lost!, 2)).toBe(0.17);
    for (const v of [
      [2, 1],
      [4, 2],
      [-2, -1],
    ])
      expect(solves(lab(1), { vx: v[0]!, vy: v[1]! }), `v = ${v}`).toBe(true);
    // contract: regla 3 de la guía (varias soluciones) y solution: también valen las rectas de (2,5; 1,5) y (3,5; 2)
    expect(solves(lab(1), { vx: 2.5, vy: 1.5 })).toBe(true);
    expect(solves(lab(1), { vx: 3.5, vy: 2 })).toBe(true);
    // contract: tentadora y mala (solution): la diagonal a ojo pierde 0,64 y la horizontal, 1,14
    expect(round(labAt(lab(1), { vx: 1, vy: 1 }).lost!, 2)).toBe(0.64);
    expect(round(labAt(lab(1), { vx: 1, vy: 0 }).lost!, 2)).toBe(1.14);
    expect(solves(lab(1), { vx: 1, vy: 1 })).toBe(false);
  });

  it('ex00.2: el máximo que conserva una coordenada de las frutas es el 77,9 %, en la horizontal', () => {
    // contract: enunciado de ex00.2: «no hay recta que lo conserve todo»; solution: la vertical, de partida, conserva el 22 %
    expect(round(labAt(lab(2)).var_frac!, 2)).toBe(0.22);
    // contract: takeaway de ex00.2 (el límite, regla 4): ninguna recta de la rejilla pasa del 77,9 %, y solo la horizontal llega a la meta (la unicidad es la lección: la meta pide el máximo)
    let best = 0;
    const reach: string[] = [];
    for (let vx = -2; vx <= 2; vx += 0.5)
      for (let vy = -2; vy <= 2; vy += 0.5) {
        if (vx === 0 && vy === 0) continue;
        best = Math.max(best, labAt(lab(2), { vx, vy }).var_frac!);
        if (solves(lab(2), { vx, vy })) reach.push(`${vx},${vy}`);
      }
    expect(round(best, 3)).toBe(0.779);
    expect(reach.every((r) => r.endsWith(',0'))).toBe(true);
    // contract: solution de ex00.2: valen (1, 0), (2, 0) y (−1,5; 0), la misma recta; (2; 0,5) baja al 74,6 %
    for (const v of [
      [1, 0],
      [2, 0],
      [-1.5, 0],
    ])
      expect(solves(lab(2), { vx: v[0]!, vy: v[1]! }), `v = ${v}`).toBe(true);
    expect(round(labAt(lab(2), { vx: 2, vy: 0.5 }).var_frac!, 3)).toBe(0.746);
    expect(solves(lab(2), { vx: 2, vy: 0.5 })).toBe(false);
    // contract: tentadora y mala (solution): la diagonal conserva el 50 %
    expect(round(labAt(lab(2), { vx: 1, vy: 1 }).var_frac!, 3)).toBe(0.5);
    expect(solves(lab(2), { vx: 1, vy: 1 })).toBe(false);
  });

  it('ex00.3: la dirección de PCA conserva el 90 % y confunde la mitad; la perpendicular separa', () => {
    const start = labAt(lab(3));
    // contract: enunciado de ex00.3: empieza en la dirección de PCA y la regla «confunde la mitad»; solution: conserva el 90 %
    expect([start.acc_v, round(start.var_frac!, 2)]).toEqual([0.5, 0.9]);
    // contract: solution de ex00.3: v en (−1, 1) separa todas con el 9,8 % de la varianza
    expect(solves(lab(3), { vx: -1, vy: 1 })).toBe(true);
    expect(round(labAt(lab(3), { vx: -1, vy: 1 }).var_frac!, 3)).toBe(0.098);
    // contract: regla 3 de la guía y solution: también valen (−2; 1,5) y (−3; 2,5)
    expect(solves(lab(3), { vx: -2, vy: 1.5 })).toBe(true);
    expect(solves(lab(3), { vx: -3, vy: 2.5 })).toBe(true);
    // contract: takeaway de ex00.3: la coordenada que separa conserva menos del 15 %: ninguna recta da las dos cosas
    for (let vx = -4; vx <= 4; vx += 0.5)
      for (let vy = -4; vy <= 4; vy += 0.5) {
        const m = labAt(lab(3), { vx, vy });
        if (m.acc_v === 1) expect(m.var_frac!, `v = (${vx}, ${vy})`).toBeLessThan(0.15);
      }
    // contract: tentadora y mala: la horizontal, un rasgo suelto, acierta la mitad
    expect(labAt(lab(3), { vx: 1, vy: 0 }).acc_v).toBe(0.5);
  });

  it('ex00.4: con «asdf», la horizontal baja al 56 % y la recta que más conserva apunta al dato raro', () => {
    // contract: enunciado de ex00.4: la horizontal «conserva poco más de la mitad»; solution: el 56 %
    expect(round(labAt(lab(4)).var_frac!, 2)).toBe(0.56);
    // contract: solution de ex00.4: (3; 2,5) conserva el 91,6 %; también valen (1, 1) y (2; 1,5)
    expect(round(labAt(lab(4), { vx: 3, vy: 2.5 }).var_frac!, 3)).toBe(0.916);
    for (const v of [
      [3, 2.5],
      [1, 1],
      [2, 1.5],
    ])
      expect(solves(lab(4), { vx: v[0]!, vy: v[1]! }), `v = ${v}`).toBe(true);
    // contract: tentadora y mala: la respuesta de ex00.2 (la horizontal) ya no vale
    expect(solves(lab(4), { vx: 1, vy: 0 })).toBe(false);
  });

  it('ex00.5: la identidad reparte la variación; la capa que gira la nube cumple las tres metas', () => {
    const start = labAt(lab(5));
    // contract: enunciado de ex00.5: con la identidad las dos salidas suben a la vez (covarianza positiva)
    expect(start.cov_xy).toBeGreaterThan(1);
    expect(solves(lab(5))).toBe(false);
    // contract: solution de ex00.5: î en (1; −0,5) y ĵ en (0,5; 1): varianzas 6,21 y 0,21, covarianza 0,02
    const solved = labAt(lab(5), { ix: 1, iy: -0.5, jx: 0.5, jy: 1 });
    expect([solved.spread_x, solved.spread_y, solved.cov_xy].map((n) => round(n!, 2))).toEqual([
      6.21, 0.21, 0.02,
    ]);
    expect(solves(lab(5), { ix: 1, iy: -0.5, jx: 0.5, jy: 1 })).toBe(true);
    // contract: regla 3 de la guía y solution: también vale anular la segunda salida, î en (1, 0) y ĵ en (0,5; 0), y la capa con los signos cambiados
    expect(solves(lab(5), { ix: 1, iy: 0, jx: 0.5, jy: 0 })).toBe(true);
    expect(solves(lab(5), { ix: -1, iy: 0.5, jx: -0.5, jy: -1 })).toBe(true);
    // contract: tentadora y mala (solution): un giro de 45° a ojo deja covarianza −2,86
    expect(round(labAt(lab(5), { ix: 1, iy: -1, jx: 1, jy: 1 }).cov_xy!, 2)).toBe(-2.86);
    expect(solves(lab(5), { ix: 1, iy: -1, jx: 1, jy: 1 })).toBe(false);
    // contract: encargo de pca: la capa nula no cumple (anula la covarianza, pero no deja variación)
    expect(solves(lab(5), { ix: 0, iy: 0, jx: 0, jy: 0 })).toBe(false);
  });

  it('con v = (0, 0) ningún laboratorio de recta cumple ninguna meta', () => {
    for (const q of [1, 2, 3, 4].map(lab)) {
      for (const g of q.goals) {
        // contract: aviso del encargo de pca: v = (0, 0) no cumple ninguna meta
        expect(solves({ ...q, goals: [g] }, { vx: 0, vy: 0 }), `${q.id} ${g.metric}`).toBe(false);
      }
    }
    // contract: lo mismo en el banco
    const bank = labQuestion(bankQuestions, 'examen-2.pca-animales');
    expect(solves(bank, { vx: 0, vy: 0 })).toBe(false);
  });
});

describe('pca, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01] = pca.exercises;
  const all = projectQuestions(pca);

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 2): 96,7 %; 7/√5 ≈ 3,13; 3; 5 componentes; ex01.5 se conserva (opción 2, «nada seguro»)
    expect(ex01!.questions.map(answerOf)).toEqual([[96.7, 0.1], [3.13, 0.01], [3, 0], [5, 0], 2]);
  });

  it('ex01.1: la mejor recta del laboratorio conserva 4,97 y pierde 0,17, el 96,7 %', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es numero con capa');
    const best = labAt({ ...labQuestion(all, 'pca.ex00.1'), lab: q.lab }, { vx: 2, vy: 1 });
    // contract: solution de ex01.1: se conservan 4,97 y se pierden 0,17
    expect([round(best.var_v!, 2), round(best.lost!, 2)]).toEqual([4.97, 0.17]);
    // contract: solution de ex01.1: 4,97 / 5,14 ≈ 96,7 %, dentro de la tolerancia, con los valores exactos y con los redondeados
    expect(Math.abs(best.var_frac! * 100 - q.answer)).toBeLessThanOrEqual(q.tol);
    expect(Math.abs((4.97 / 5.14) * 100 - q.answer)).toBeLessThanOrEqual(q.tol);
    // contract: guía de contenido: var_frac, la respuesta, no está entre las lecturas
    expect(q.lab.readouts).toEqual(['var_v', 'lost']);
  });

  it('ex01.2: la coordenada de «coche» sobre (2, 1) es 7/√5', () => {
    const q = ex01!.questions[1]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.2 es numero con capa');
    const coche = q.lab.points.find((p) => p.id === 'coche')!;
    // contract: enunciado de ex01.2: «coche» es (3, 1), como en NUBE_ALARGADA, y la nube está centrada
    expect([coche.x, coche.y]).toEqual([3, 1]);
    const xs = q.lab.points.map((p) => p.x);
    const ys = q.lab.points.map((p) => p.y);
    expect([xs.reduce((s, x) => s + x, 0), ys.reduce((s, y) => s + y, 0)]).toEqual([0, 0]);
    // contract: solution de ex01.2: 0,894·3 + 0,447·1 ≈ 3,13 y 7/√5 ≈ 3,13
    expect(Math.abs(0.894 * 3 + 0.447 - q.answer)).toBeLessThanOrEqual(q.tol);
    expect(Math.abs(7 / Math.sqrt(5) - q.answer)).toBeLessThanOrEqual(q.tol);
    // contract: enunciado: u ≈ (0,894; 0,447) es (2, 1) con norma 1
    expect([2, 1].map((c) => round(c / Math.sqrt(5), 3))).toEqual([0.894, 0.447]);
  });

  it('ex01.3: «asdf» pierde 3 sobre la horizontal y ninguna fruta más de 0,5', () => {
    const q = ex01!.questions[2]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.3 es numero con capa');
    const raro = q.lab.points.find((p) => p.label === 'asdf')!;
    // contract: enunciado de ex01.3: «asdf» es (3, 3) y la componente, la horizontal; lo perdido es su altura
    expect([raro.x, raro.y, q.lab.probe?.y]).toEqual([3, 3, 0]);
    expect(Math.abs(raro.y)).toBe(q.answer);
    // contract: takeaway de ex01.3: ninguna fruta pierde más de 0,5 (seis veces menos)
    const frutas = q.lab.points.filter((p) => p.label !== 'asdf');
    expect(Math.max(...frutas.map((p) => Math.abs(p.y)))).toBe(0.5);
    // contract: solution de ex01.3: la distancia al origen, el error típico, es 3√2 ≈ 4,24
    expect(round(Math.hypot(3, 3), 2)).toBe(4.24);
  });

  it('ex01.4: acumulados 40, 65, 80, 88 y 95 %: hacen falta 5', () => {
    const parts = [40, 25, 15, 8, 7, 5];
    let acc = 0;
    const acumulados = parts.map((p) => (acc += p));
    // contract: solution de ex01.4: acumulados 40, 65, 80, 88, 95 (y 100); el primero que llega al 90 es el quinto
    expect(acumulados).toEqual([40, 65, 80, 88, 95, 100]);
    expect(acumulados.findIndex((a) => a >= 90) + 1).toBe(5);
  });

  it('ex01.5: la opción correcta es la que dice que no se puede concluir nada seguro', () => {
    const q = ex01!.questions[4]!;
    // contract: encargo de la Órbita 2 de matrices (P3-pca): la correcta es «nada seguro», porque el mapa descarta la varianza de las otras direcciones
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      'Nada seguro: el mapa descarta la varianza de las otras direcciones, y en ellas pueden diferir mucho',
    );
    expect(q.type === 'opcion' ? q.options.length : 0).toBe(4);
  });
});

describe('pca: «Programar» y hojas', () => {
  const [, , ex02] = pca.exercises;

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 2 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: datos (2, 3), (3, 1), (5, 6), (6, 4), (8, 8), (10, 7): media (5,67; 4,83), autovalores de la covarianza 1,40 y 14,63
    const X1: V[] = [
      [2, 3],
      [3, 1],
      [5, 6],
      [6, 4],
      [8, 8],
      [10, 7],
    ];
    const C1 = cov2(X1);
    expect(X1.reduce((s, p) => s + p[0], 0) / 6).toBeCloseTo(5.67, 2);
    expect(X1.reduce((s, p) => s + p[1], 0) / 6).toBeCloseTo(4.83, 2);
    expect(eig2(C1)[0]).toBeCloseTo(1.4, 2);
    expect(eig2(C1)[1]).toBeCloseTo(14.63, 2);
    // contract: ex02.3: autovalores 0,3, 0,7, 1,4, 2,2, 5,4 y 10 (total 20): acumulados 50 %, 77 %, 88 % y 95 %; k90 = 4 y ningún acumulado cae en el 90 %
    const vals = [0.3, 0.7, 1.4, 2.2, 5.4, 10];
    const total = vals.reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(20, 12);
    const ratio = [...vals].reverse().map((v) => v / total);
    expect(ratio.map((r) => Math.round(r * 1000) / 1000)).toEqual([
      0.5, 0.27, 0.11, 0.07, 0.035, 0.015,
    ]);
    let acum = 0;
    const acumulados = ratio.map((r) => (acum += r));
    expect(acumulados.map((a) => Math.round(a * 1000) / 1000)).toEqual([
      0.5, 0.77, 0.88, 0.95, 0.985, 1,
    ]);
    expect(acumulados.some((a) => Math.abs(a - 0.9) < 1e-6)).toBe(false);
    expect(acumulados.findIndex((a) => a >= 0.9) + 1).toBe(4);
    // contract: ex02.4: datos (1, 4), (2, 2), (4, 5), (5, 3), (6, 6), (8, 4): el error de la compresión con una componente es el autovalor menor, 1,61
    const X4: V[] = [
      [1, 4],
      [2, 2],
      [4, 5],
      [5, 3],
      [6, 6],
      [8, 4],
    ];
    expect(eig2(cov2(X4))[0]).toBeCloseTo(1.61, 2);
    expect(eig2(cov2(X4))[1]).toBeCloseTo(7.05, 2);
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 2 de matrices (P3-pca): código sin centrar (línea 1), razonamiento correcto (null) y «casi iguales en las 384 dimensiones» (línea 3)
    expect(pca.sheets.map(answerOf)).toEqual([0, null, 2]);
    expect(pca.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas (P3-pca): la covarianza sin centrar, y concluir que dos puntos cercanos en el mapa son casi iguales en las 384 dimensiones
    const faulty = pca.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'C = X.T @ X / (len(X) - 1)',
      null,
      'Luego sus embeddings son casi iguales en las 384 dimensiones',
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of pca.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 2: autovalores 6, 3 y 1 (total 10): las dos primeras explican 9/10 = 90 % y se pierde 1/10 = 10 %
    expect(6 + 3 + 1).toBe(10);
    expect((6 + 3) / 10).toBe(0.9);
    expect(1 / 10).toBe(0.1);
  });
});

describe('banco de examen 2 del proyecto pca', () => {
  it('tiene tres entradas fijas del proyecto pca, con ids examen-2.*', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver): una entrada laboratorio y una cuenta del estilo nuevo; la de código se conserva («Programar» no se toca)
    expect(examen2Pca.map((e) => e.project)).toEqual(['pca', 'pca', 'pca']);
    expect(examen2Pca.map((e) => e.question.id)).toEqual([
      'examen-2.pca-animales',
      'examen-2.memoria-pca',
      'examen-2.componentes-para-95',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen2Pca) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo; las generadas las añade el ensamblado
    expect(examen2Pca.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2Pca.map((e) => e.question.type)).toEqual(['laboratorio', 'numero', 'codigo']);
    const projectIds = new Set(projectQuestions(pca).map((q) => q.id));
    expect(examen2Pca.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const animales = labQuestion(bankQuestions, 'examen-2.pca-animales');
    // contract: examen-2.pca-animales: la horizontal, de partida, solo recoge el tamaño (14,8 %)
    expect(round(labAt(animales).var_frac!, 3)).toBe(0.148);
    // contract: solution: (−0,5; 1,5) conserva el 93,5 %; también (−1; 2,5) y (−1; 3,5)
    expect(round(labAt(animales, { vx: -0.5, vy: 1.5 }).var_frac!, 3)).toBe(0.935);
    for (const v of [
      [-0.5, 1.5],
      [-1, 2.5],
      [-1, 3.5],
    ])
      expect(solves(animales, { vx: v[0]!, vy: v[1]! }), `v = ${v}`).toBe(true);
    // contract: tentadora y mala (solution): la vertical pura, solo la domesticidad, conserva el 85,2 %
    expect(round(labAt(animales, { vx: 0, vy: 1 }).var_frac!, 3)).toBe(0.852);
    expect(solves(animales, { vx: 0, vy: 1 })).toBe(false);
    const memoria = bankQuestions[1]!;
    // contract: examen-2.memoria-pca: 10 000·32 coordenadas + 384 de la media + 32·384 de las componentes
    expect(answerOf(memoria)).toEqual([10000 * 32 + 384 + 32 * 384, 0]);
    expect(10000 * 32 + 384 + 32 * 384).toBe(332672);
    // contract: solution: guardarlos enteros son 10 000·384 = 3 840 000 números
    expect(10000 * 384).toBe(3840000);
  });

  it('componentes-para-95: los acumulados son 60 %, 80 %, 90 % y 96 % y k95 = 4', () => {
    const vals = [0.1, 0.3, 0.6, 1.0, 2.0, 6.0];
    const total = vals.reduce((s, v) => s + v, 0);
    let acum = 0;
    const acumulados = [...vals].reverse().map((v) => (acum += v) / total);
    // contract: solution de examen-2.componentes-para-95: total 10 y acumulados 60 %, 80 %, 90 % y 96 %; con tres no se llega al 95 % y con cuatro sí
    expect(total).toBeCloseTo(10, 12);
    expect(acumulados.slice(0, 4).map((a) => Math.round(a * 100))).toEqual([60, 80, 90, 96]);
    expect(acumulados.findIndex((a) => a >= 0.95) + 1).toBe(4);
    // contract: encargo de la Órbita 2 de matrices: ningún acumulado cae justo en el 95 %
    expect(acumulados.some((a) => Math.abs(a - 0.95) < 1e-6)).toBe(false);
    // contract: solution: acumulando de menor a mayor saldría 6
    let asc = 0;
    const ascendente = vals.map((v) => (asc += v) / total);
    expect(ascendente.findIndex((a) => a >= 0.95) + 1).toBe(6);
  });
});

describe('proyecto pca: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(pca), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `pca.ex02.${n}`),
      'examen-2.componentes-para-95',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
