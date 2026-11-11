import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { labMeasure } from '../../engine/labs';
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
import { rango } from './rango';
import { examen1Rango } from './examen-1-rango';

const bankQuestions = examen1Rango
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto rango', projectQuestions(rango));
defineProseTests('banco examen-1 rango', bankQuestions);
defineLabProjectTests(rango, examen1Rango);

type Mat = number[][];
/** Rango por eliminación gaussiana (las matrices del proyecto son enteras y pequeñas). */
const rank = (m: Mat): number => {
  const a = m.map((row) => [...row]);
  let r = 0;
  for (let c = 0; c < (a[0]?.length ?? 0) && r < a.length; c++) {
    const p = a.findIndex((row, i) => i >= r && Math.abs(row[c]!) > 1e-9);
    if (p === -1) continue;
    [a[r], a[p]] = [a[p]!, a[r]!];
    for (let i = r + 1; i < a.length; i++) {
      const f = a[i]![c]! / a[r]![c]!;
      a[i] = a[i]!.map((x, k) => x - f * a[r]![k]!);
    }
    r++;
  }
  return r;
};
const apply = (m: Mat, v: number[]): number[] =>
  m.map((row) => row.reduce((s, a, k) => s + a * v[k]!, 0) + 0);
const cols = (m: Mat): Mat => m[0]!.map((_, c) => m.map((row) => row[c]!));
const without = (m: Mat, k: number): Mat => m.map((row) => row.filter((_, c) => c !== k));

/** Los valores de la rejilla de 0,5 entre −r y r. */
const grid = (r: number): number[] => Array.from({ length: 4 * r + 1 }, (_, k) => -r + k * 0.5);

describe('proyecto rango', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 1 de matrices: checkProject(rango) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(rango)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 1 de matrices: id rango, nombre «Rango», subtítulo «Cuántas direcciones sobreviven» (sigue describiendo el proyecto tras la reescritura de 2026-11-10)
    expect([rango.id, rango.name, rango.sub]).toEqual([
      'rango',
      'Rango',
      'Cuántas direcciones sobreviven',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(rango.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(rango.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(rango.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón rango.exNN.k y rango.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(rango).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `rango.ex0${e}.${k}`)),
      'rango.hoja.1',
      'rango.hoja.2',
      'rango.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('rango, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(rango);
  const lab = (k: number) => labQuestion(all, `rango.ex00.${k}`);
  const ALL_AT_ORIGIN = { ix: 0, iy: 0, jx: 0, jy: 0 };

  it('ex00.1: aplastar quedándose con el tono acierta; con la intensidad, o todo al origen, no', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 1): la identidad no aplasta y acierta 3 de 6
    expect([labAt(lab(1)).det, labAt(lab(1)).hits]).toEqual([1, 3]);
    // contract: solution de ex00.1: î en (0, 0) y ĵ en (1, 0)
    expect(solves(lab(1), { ix: 0, iy: 0, jx: 1, jy: 0 })).toBe(true);
    // contract: regla 3 de la guía (varias soluciones), solution de ex00.1: ĵ en (1, 1) con î en el origen, o î en (0,5; 0) con ĵ en (1, 0)
    expect(solves(lab(1), { ix: 0, iy: 0, jx: 1, jy: 1 })).toBe(true);
    expect(solves(lab(1), { ix: 0.5, iy: 0, jx: 1, jy: 0 })).toBe(true);
    // contract: solution de ex00.1: «quedarse con la intensidad deja la neurona en 3 de 6», aunque aplaste
    const intensidad = labAt(lab(1), { jx: 0, jy: 0 });
    expect([intensidad.det, intensidad.hits]).toEqual([0, 3]);
    // contract: aviso del encargo: la capa nula cumple «det = 0», pero la neurona no acierta ninguna
    expect(labAt(lab(1), ALL_AT_ORIGIN).det).toBe(0);
    expect(solves(lab(1), ALL_AT_ORIGIN)).toBe(false);
  });

  it('ex00.2: borrar el tono confunde «genial» con «horrible» y también «bueno» con «malo»', () => {
    const start = labAt(lab(2));
    // contract: enunciado de ex00.2: misma intensidad y tonos opuestos (2 y −2): distancia 4 al empezar, sin parejas confundidas
    expect([start.pair_dist, start.merged]).toEqual([4, 0]);
    // contract: solution de ex00.2: ĵ en (0, 0), con î en cualquier sitio menos el origen; siempre dos parejas confundidas
    for (const [ix, iy] of [
      [1, 0],
      [0, 1],
      [-1, 2],
    ] as [number, number][]) {
      expect(solves(lab(2), { ix, iy, jx: 0, jy: 0 }), `î = (${ix}, ${iy})`).toBe(true);
      expect(labAt(lab(2), { ix, iy, jx: 0, jy: 0 }).merged).toBe(2);
    }
    // contract: solution de ex00.2: con î también en el origen las seis caen juntas, quince parejas, y no vale
    expect(labAt(lab(2), ALL_AT_ORIGIN).merged).toBe(15);
    expect(solves(lab(2), ALL_AT_ORIGIN)).toBe(false);
    // contract: tentadora y mala: borrar la intensidad no acerca a «genial» y «horrible»
    expect(labAt(lab(2), { ix: 0, iy: 0 }).pair_dist).toBe(4);
    // contract: solution de ex00.2: «no se puede confundir una sola pareja»: ninguna capa de la rejilla deja la distancia en 0 con menos de dos parejas
    const g = grid(4);
    let fewer = 0;
    for (const ix of g)
      for (const iy of g)
        for (const jx of g)
          for (const jy of g) {
            const v = labAt(lab(2), { ix, iy, jx, jy });
            if (v.pair_dist < 1e-9 && v.merged < 2) fewer++;
          }
    expect(fewer).toBe(0);
  });

  it('ex00.3: tras el cuello de botella el máximo es cinco de seis', () => {
    // contract: enunciado de ex00.3: «ahora acierta con cuatro»
    expect(labAt(lab(3)).hits).toBe(4);
    // contract: solution de ex00.3: ĵ en (1, 0) falla «horrible»; (0,5; 0) falla «bueno»; cinco de seis las dos
    expect(solves(lab(3), { jx: 1 })).toBe(true);
    expect(solves(lab(3), { jx: 0.5 })).toBe(true);
    // contract: solution de ex00.3: subir o bajar la punta de ĵ no cambia la primera salida
    expect(solves(lab(3), { jx: 1, jy: 2 })).toBe(true);
    // contract: regla 4 de la guía (un límite) y solution de ex00.3: «seis es imposible» con cualquier ĵ de la rejilla
    const best = Math.max(
      ...grid(6).flatMap((jx) => grid(6).map((jy) => labAt(lab(3), { jx, jy }).hits)),
    );
    expect(best).toBe(5);
    // contract: enunciado y hint de ex00.3: la capa de delante deja los cuadraditos en el eje vertical, «bueno» y «horrible» los dos en 1,5
    const spec = lab(3).lab;
    if (spec.kind !== 'capa' || !spec.before) throw new Error('ex00.3 lleva una capa delante');
    const b = spec.before;
    const middle = (x: number, y: number) => [b.i[0] * x + b.j[0] * y, b.i[1] * x + b.j[1] * y];
    expect([middle(1, 1), middle(2.5, -2)]).toEqual([
      [0, 1.5],
      [0, 1.5],
    ]);
    // contract: aviso del encargo: con la capa nula ninguna positiva pasa el umbral y no vale
    expect(solves(lab(3), { jx: 0, jy: 0 })).toBe(false);
  });

  it('ex00.4: la recta del eje largo conserva el 96,7 %; la horizontal y la diagonal, no', () => {
    // contract: solution de ex00.4: (2, 1) conserva el 96,7 %; (3, 2) y (2,5; 1), algo más del 95 %
    expect(labAt(lab(4), { vx: 2, vy: 1 }).var_frac).toBeCloseTo(0.967, 3);
    expect(solves(lab(4), { vx: 2, vy: 1 })).toBe(true);
    expect(solves(lab(4), { vx: 3, vy: 2 })).toBe(true);
    expect(solves(lab(4), { vx: 2.5, vy: 1 })).toBe(true);
    // contract: solution de ex00.4: en horizontal el 77,8 % y en la diagonal (1, 1) el 87,5 %
    expect(labAt(lab(4), { vx: 1, vy: 0 }).var_frac).toBeCloseTo(0.778, 3);
    expect(labAt(lab(4), { vx: 1, vy: 1 }).var_frac).toBeCloseTo(0.875, 3);
    expect(solves(lab(4), { vx: 1, vy: 1 })).toBe(false);
    // contract: solution de ex00.4: «más del 96,7 % no se puede» con ninguna v de la rejilla
    const best = Math.max(
      ...grid(4)
        .flatMap((vx) => grid(4).map((vy) => labAt(lab(4), { vx, vy }).var_frac ?? 0))
        .filter((x) => Number.isFinite(x)),
    );
    expect(best).toBeCloseTo(0.967, 3);
    // contract: aviso del encargo: v en el origen no mide nada y no cumple la meta
    expect(solves(lab(4), { vx: 0, vy: 0 })).toBe(false);
  });

  it('ex00.5: el cuello de botella que vale es «enlaces − saludos»; un solo rasgo, no', () => {
    // contract: petición de Oliver 2026-11-10: la identidad no aplasta y acierta 3 de 6
    expect([labAt(lab(5)).det, labAt(lab(5)).hits]).toEqual([1, 3]);
    // contract: solution de ex00.5: î en (1, 0) y ĵ en (−1, 0); los tres correos normales caen en el mismo punto
    expect(solves(lab(5), { jx: -1, jy: 0 })).toBe(true);
    expect(labAt(lab(5), { jx: -1, jy: 0 }).merged).toBe(3);
    // contract: regla 3 de la guía (varias soluciones), solution de ex00.5: î (1, 1) con ĵ (−1, −1), o î (2, 0) con ĵ (−1,5; 0)
    expect(solves(lab(5), { ix: 1, iy: 1, jx: -1, jy: -1 })).toBe(true);
    expect(solves(lab(5), { ix: 2, iy: 0, jx: -1.5, jy: 0 })).toBe(true);
    // contract: hint de ex00.5 y explain: quedarse solo con los enlaces aplasta pero deja la mitad mal
    const enlaces = labAt(lab(5), { jx: 0, jy: 0 });
    expect([enlaces.det, enlaces.acc]).toEqual([0, 0.5]);
    // contract: enunciado de ex00.5: «ningún rasgo basta»: quedarse solo con los saludos tampoco acierta todo
    expect(labAt(lab(5), { ix: 0, iy: 0, jx: 1, jy: 0 }).acc).toBeLessThan(1);
    // contract: aviso del encargo: la capa nula cumple «det = 0» pero no vale
    expect(solves(lab(5), ALL_AT_ORIGIN)).toBe(false);
  });

  it('las cinco cambian una cosa cada vez', () => {
    const scene = [1, 2, 3, 4, 5].map((k) => {
      const spec = lab(k).lab;
      if (spec.kind !== 'capa') throw new Error('ex00 usa el laboratorio capa');
      return [
        spec.axes?.[0] ?? null,
        !!spec.before,
        !!spec.probe,
        lab(k).goals.map((g) => g.metric),
      ];
    });
    // contract: brief-juego-2.md, Rango: elegir la recta, el núcleo que confunde, un cuello de botella delante, la recta que conserva la variación y los correos
    expect(scene).toEqual([
      ['intensidad', false, false, ['det', 'acc']],
      ['intensidad', false, false, ['pair_dist', 'merged']],
      ['intensidad', true, false, ['hits']],
      [null, false, true, ['var_frac']],
      ['enlaces', false, false, ['det', 'acc']],
    ]);
  });
});

describe('rango, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01, ex02] = rango.exercises;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 1): rango 1 (opción 1); 1000·10 + 10·1000; 384 − 64; «malo» y «triste» (opción 1); (2,5 − 2)·2
    expect(ex01!.questions.map(answerOf)).toEqual([
      1,
      [1000 * 10 + 10 * 1000, 0],
      [384 - 64, 0],
      1,
      [(2.5 - 2) * 2, 0],
    ]);
  });

  it('ex01.1: la capa del laboratorio es la del enunciado y tiene rango 1', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es opcion con capa');
    // contract: ex01.1: A = (1 0,5; −1 −0,5): î en (1, −1) y ĵ en (0,5; −0,5)
    expect(q.prompt).toContain('\\begin{pmatrix}1&0{,}5\\\\-1&-0{,}5\\end{pmatrix}');
    expect([q.lab.i, q.lab.j]).toEqual([
      [1, -1],
      [0.5, -0.5],
    ]);
    expect(
      rank([
        [1, 0.5],
        [-1, -0.5],
      ]),
    ).toBe(1);
    // contract: solution de ex01.1: «bueno» y «horrible» dan 1,5 y caen juntas
    expect(labMeasure(q.lab, {}).merged).toBe(1);
    expect(q.options[q.correct]).toMatch(/^\$1\$/);
  });

  it('ex01.3: el laboratorio borra el tono: rango 1 y núcleo de dimensión 1', () => {
    const q = ex01!.questions[2]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.3 es numero con capa');
    // contract: solution de ex01.3: en el plano del laboratorio, 2 − 1 = 1, la dirección del tono
    expect(q.lab.j).toEqual([0, 0]);
    expect(rank(cols([q.lab.i, q.lab.j]))).toBe(1);
  });

  it('ex01.4: la capa del enunciado confunde «malo» con «triste», y nada más', () => {
    const q = ex01!.questions[3]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.4 es opcion con capa');
    // contract: ex01.4: A = (0,5 0,5; 0,5 0,5); construida en el laboratorio, una sola pareja confundida
    expect(q.prompt).toContain('\\begin{pmatrix}0{,}5&0{,}5\\\\0{,}5&0{,}5\\end{pmatrix}');
    expect(labMeasure(q.lab, { ix: 0.5, iy: 0.5, jx: 0.5, jy: 0.5 }).merged).toBe(1);
    // contract: solution de ex01.4: «malo» y «triste» suman 0; «genial» 4,5, «horrible» 0,5, «bueno» 2
    const sum = (id: string) => {
      const p = q.lab!.kind === 'capa' ? q.lab!.points.find((x) => x.id === id)! : null;
      return p!.x + p!.y;
    };
    expect(['malo', 'triste', 'genial', 'horrible', 'bueno'].map(sum)).toEqual([0, 0, 4.5, 0.5, 2]);
    expect(q.options[q.correct]).toBe('«malo» y «triste»');
    // contract: ex01.4 es de predecir: el laboratorio empieza en la identidad, sin la capa construida
    expect([q.lab.i, q.lab.j, q.lab.movable]).toEqual([[1, 0], [0, 1], undefined]);
  });

  it('ex01.5: la capa u·wᵀ construida en el laboratorio manda «urgente» a (1; 0,5)', () => {
    const q = ex01!.questions[4]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.5 es numero con capa');
    const urgente = q.lab.points.find((p) => p.id === 'urgente')!;
    // contract: ex01.5: «urgente» tiene 2,5 enlaces y 2 saludos, como en CORREOS
    expect([urgente.x, urgente.y]).toEqual([2.5, 2]);
    // contract: solution de ex01.5: u wᵀ = (2 −2; 1 −1), de rango 1, y su salida para «urgente» es (1; 0,5)
    const A = [2, 1].map((u) => [1, -1].map((w) => u * w + 0));
    expect(A).toEqual([
      [2, -2],
      [1, -1],
    ]);
    expect(rank(A)).toBe(1);
    expect(apply(A, [2.5, 2])).toEqual([1, 0.5]);
  });

  it('ex01.2: las cifras de la solución', () => {
    // contract: solution de ex01.2: 20 000 frente a 1 000 000, cincuenta veces menos
    expect([1000 * 10 + 10 * 1000, (1000 * 1000) / 20000]).toEqual([20000, 50]);
    expect(ex01!.questions[1]!.solution).toContain('20\\,000');
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: A = (1, 2; 2, 4) tiene rango 1 y B (tercera columna = suma de las dos primeras) tiene rango 2
    expect(
      rank([
        [1, 2],
        [2, 4],
      ]),
    ).toBe(1);
    expect(
      rank([
        [1, 0, 1],
        [0, 1, 1],
        [1, 1, 2],
      ]),
    ).toBe(2);
    const X = [
      [1, 0, 1, 1],
      [0, 1, 1, 0],
      [1, 1, 2, 0],
      [2, 1, 3, 1],
      [0, 0, 0, 1],
    ];
    // contract: ex02.2: X tiene rango 3 y quitar la columna 0, 1 o 2 lo deja en 3, pero quitar la 3 lo baja a 2
    expect(rank(X)).toBe(3);
    expect([0, 1, 2, 3].map((k) => rank(without(X, k)))).toEqual([3, 3, 3, 2]);
    // contract: ex02.2: la columna 2 es la suma de la 0 y la 1, y quitar dos de las tres a la vez baja el rango
    expect(cols(X)[2]).toEqual(cols(X)[0]!.map((x, k) => x + cols(X)[1]![k]!));
    expect(rank(without(without(X, 1), 0))).toBe(2);
    // contract: ex02.3: outer(u, v) con u = (1, −1, 2, 0) y v = (3, 1, 2) tiene filas (3, 1, 2), (−3, −1, −2), (6, 2, 4), (0, 0, 0) y rango 1
    const O = [1, -1, 2, 0].map((a) => [3, 1, 2].map((b) => a * b + 0));
    expect(O).toEqual([
      [3, 1, 2],
      [-3, -1, -2],
      [6, 2, 4],
      [0, 0, 0],
    ]);
    expect(rank(O)).toBe(1);
    // contract: ex02.4: W = B·A es de 5×5 y tiene rango 2 (menor que 5) porque pasa por un cuello de 2
    const A5 = [
      [1, 0, 2, 1, 0],
      [0, 1, 1, 0, 1],
    ];
    const B5 = [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 0],
      [0, 3],
    ];
    const W = B5.map((row) => A5[0]!.map((_, c) => row[0]! * A5[0]![c]! + row[1]! * A5[1]![c]!));
    expect([W.length, W[0]!.length, rank(W)]).toEqual([5, 5, 2]);
    // contract: ex02.5: 768·768 = 589824; 768·64 + 64·768 = 98304; la razón es 6
    expect([768 * 768, 768 * 64 + 64 * 768, (768 * 768) / (768 * 64 + 64 * 768)]).toEqual([
      589824, 98304, 6,
    ]);
  });
});

describe('rango: hojas', () => {
  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1 de matrices: «det = 0, luego rango 0» (línea 3), contar filas no nulas (línea 2) y una correcta (null); al menos una de código
    expect(rango.sheets.map(answerOf)).toEqual([2, 1, null]);
    expect(rango.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: la conclusión del rango 0 por tener det 0, y la cuenta de filas no nulas como rango
    const faulty = rango.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Luego A no deja pasar ninguna dirección: el rango de A es 0',
      'r = np.count_nonzero(A.any(axis=1))',
      null,
    ]);
  });

  it('hojas: las cifras de la hoja de código se recalculan', () => {
    const A = [
      [1, 2, 3],
      [2, 4, 6],
      [1, 0, 1],
    ];
    // contract: hoja 2: A tiene 3 filas no nulas pero rango 2 (la segunda fila es el doble de la primera)
    expect(A.filter((row) => row.some((x) => x !== 0))).toHaveLength(3);
    expect(rank(A)).toBe(2);
    expect(A[1]).toEqual(A[0]!.map((x) => 2 * x));
  });

  it('hojas: el enunciado acaba con la frase común y el explain no dice que no hay error', () => {
    // contract: R25 del juego 1 (prosa.test.ts) y encargo de la Órbita 1: la misma frase final en todas las hojas
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of rango.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });
});

describe('banco de examen 1 del proyecto rango', () => {
  it('tiene tres entradas fijas del proyecto rango, con ids examen-1.* distintos del generado', () => {
    // contract: guía de contenido 2026-11-10: una entrada laboratorio y una cuenta del estilo nuevo; la de código se conserva; `examen-1.rango` queda reservado para la generada
    expect(examen1Rango.map((e) => e.project)).toEqual(['rango', 'rango', 'rango']);
    expect(examen1Rango.map((e) => e.question.id)).toEqual([
      'examen-1.cuello-mascotas',
      'examen-1.parametros-rango-bajo',
      'examen-1.columna-redundante',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Rango) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo
    expect(examen1Rango.map((e) => e.question.type)).toEqual(['laboratorio', 'numero', 'codigo']);
    const projectIds = new Set(projectQuestions(rango).map((q) => q.id));
    expect(examen1Rango.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const mascotas = labQuestion(bankQuestions, 'examen-1.cuello-mascotas');
    // contract: examen-1.cuello-mascotas: al empezar la salida 1 es el tamaño y la neurona dice «mascota» a todo (3 de 6, sin aplastar)
    expect([labAt(mascotas).det, labAt(mascotas).hits]).toEqual([1, 3]);
    // contract: solution: î en (0, 0) y ĵ en (1, 0); también ĵ en (1, 1)
    expect(solves(mascotas, { ix: 0, iy: 0, jx: 1, jy: 0 })).toBe(true);
    expect(solves(mascotas, { ix: 0, iy: 0, jx: 1, jy: 1 })).toBe(true);
    // contract: solution: quedarse con el tamaño aplasta y deja la neurona en 3 de 6
    expect(labAt(mascotas, { jx: 0, jy: 0 }).hits).toBe(3);
    // contract: aviso del encargo: la capa nula cumple «det = 0» pero no vale
    expect(solves(mascotas, { ix: 0, iy: 0, jx: 0, jy: 0 })).toBe(false);
    const params = bankQuestions[1]!;
    // contract: solution de examen-1.parametros-rango-bajo: 768·8 + 8·768 = 12 288 frente a 589 824, 48 veces menos
    expect(answerOf(params)).toEqual([768 * 8 + 8 * 768, 0]);
    expect([768 * 8 + 8 * 768, (768 * 768) / 12288]).toEqual([12288, 48]);
  });

  it('columna-redundante: la columna nueva es 2·col0 − col1 y el rango no sube', () => {
    const X = [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ];
    const c = cols(X);
    const nueva = c[0]!.map((x, k) => 2 * x - c[1]![k]!);
    // contract: solution de examen-1.columna-redundante: la columna añadida es (2, −1, 1, 3) y los rangos de X y de X2 son 2 y 2
    expect(nueva).toEqual([2, -1, 1, 3]);
    expect([rank(X), rank(X.map((row, k) => [...row, nueva[k]!]))]).toEqual([2, 2]);
  });
});

describe('proyecto rango: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(rango), ...bankQuestions].filter(
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
    // contract: encargo de la Órbita 1 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `rango.ex02.${n}`),
      'examen-1.columna-redundante',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
