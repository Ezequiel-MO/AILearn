import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type LabQ, type Question } from '../../content/schema';
import { labMeasure, type LabState } from '../../engine/labs';
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
import { componer } from './componer';
import { examen0Componer } from './examen-0-componer';

const bankQuestions = examen0Componer
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto componer', projectQuestions(componer));
defineProseTests('banco examen-0 componer', bankQuestions);
defineLabProjectTests(componer, examen0Componer);

type M = [[number, number], [number, number]];
/** Producto de dos matrices 2×2 (el que el proyecto enseña a leer de derecha a izquierda). */
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
const R: M = [
  [0, -1],
  [1, 0],
]; // giro de un cuarto de vuelta antihorario
const S: M = [
  [2, 0],
  [0, 1],
]; // estiramiento ×2 en horizontal
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const flat = (m: M): number[] => [m[0][0] + 0, m[0][1] + 0, m[1][0] + 0, m[1][1] + 0];

describe('proyecto componer', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 0 de matrices: checkProject(componer) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(componer)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10): Componer, «dos capas seguidas»; el id no cambia
    expect([componer.id, componer.name, componer.sub]).toEqual([
      'componer',
      'Componer',
      'Dos capas seguidas',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 0 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(componer.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(componer.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(componer.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón componer.exNN.k y componer.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(componer).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `componer.ex0${e}.${k}`)),
      'componer.hoja.1',
      'componer.hoja.2',
      'componer.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

/**
 * El mayor número de aciertos de la neurona con cualquier capa de la rejilla. La neurona solo mira
 * la primera salida (w = (1, 0)), que depende solo de `ix` y `jx`: basta recorrer esos dos mandos.
 */
const bestHits = (q: LabQ): number => {
  if (q.lab.kind !== 'capa') throw new Error('se espera un laboratorio capa');
  const { range, snap, readout } = q.lab;
  if (readout?.w[1] !== 0) throw new Error('bestHits supone una neurona que mira la salida 1');
  const grid: number[] = [];
  for (let v = -range; v <= range + 1e-9; v += snap) grid.push(v);
  let best = 0;
  for (const ix of grid)
    for (const jx of grid) {
      const state: LabState = { ix, jx };
      best = Math.max(best, labAt(q, state).hits ?? 0);
    }
  return best;
};

describe('componer, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(componer);
  const lab = (k: number) => labQuestion(all, `componer.ex00.${k}`);

  it('ex00.1: tras la capa que mezcla, la neurona acierta la mitad; restar las salidas resuelve y el intercambio no', () => {
    // contract: enunciado de ex00.1: «le llega intensidad + tono y solo acierta con la mitad»
    expect(labAt(lab(1)).acc).toBe(0.5);
    // contract: solution de ex00.1: î en (1, 0) y ĵ en (−1, 1)
    expect(solves(lab(1), { jx: -1 })).toBe(true);
    // contract: regla 3 de la guía (varias soluciones): «siempre que la primera fila reste una coordenada de la otra»
    expect(solves(lab(1), { ix: 0.5, jx: -0.5 })).toBe(true);
    expect(solves(lab(1), { ix: 2, jx: -2, jy: 0 })).toBe(true);
    // contract: tentadora y mala (solution de ex00.1): intercambiar las columnas, la solución de Columnas, no basta
    expect(solves(lab(1), { ix: 0, iy: 1, jx: 1, jy: 0 })).toBe(false);
  });

  it('ex00.2: una sola capa, el producto de las dos, lleva las seis a sus dianas; el otro orden no', () => {
    // contract: enunciado de ex00.2: al empezar las palabras no están en sus dianas
    expect(labAt(lab(2)).on_target).toBe(0);
    // contract: solution de ex00.2: î en (0, 1) y ĵ en (2, 0), el producto (2 0; 0 1)(0 1; 1 0)
    expect(solves(lab(2), { ix: 0, iy: 1, jx: 2, jy: 0 })).toBe(true);
    expect(
      flat(
        mul(S, [
          [0, 1],
          [1, 0],
        ]),
      ),
    ).toEqual([0, 2, 1, 0]);
    expect(labAt(lab(2), { ix: 0, iy: 1, jx: 2, jy: 0 }).on_target).toBe(6);
    // contract: tentadora y mala (solution de ex00.2): doblar la intensidad, el otro orden, no llega
    expect(solves(lab(2), { ix: 0, iy: 2, jx: 1, jy: 0 })).toBe(false);
    // contract: tentadora y mala: solo el intercambio, sin doblar, tampoco
    expect(solves(lab(2), { ix: 0, iy: 1, jx: 1, jy: 0 })).toBe(false);
  });

  it('ex00.3: tras el aplastamiento, el máximo de la rejilla son cuatro aciertos', () => {
    const start = labAt(lab(3));
    // contract: enunciado de ex00.3: «ahora no lo pasa ninguna» (las tres negativas aciertan, las positivas no)
    expect(start.hits).toBe(3);
    // contract: pista 1 de ex00.3: «hay menos de seis cuadraditos»: genial/horrible y bueno/malo caen juntas
    expect(start.merged).toBe(2);
    // contract: solution de ex00.3 y encargo («pide el máximo de verdad»): con ninguna capa de la rejilla se pasa de cuatro
    expect(bestHits(lab(3))).toBe(4);
    // contract: solution de ex00.3: ĵ en (1, 1) resuelve, y cualquier capa cuyas dos primeras coordenadas sumen 2
    expect(solves(lab(3), { jx: 1 })).toBe(true);
    expect(solves(lab(3), { ix: 2 })).toBe(true);
    expect(solves(lab(3), { ix: 0.5, jx: 1.5, iy: -1 })).toBe(true);
    // contract: tentadora y mala: con la suma en 2,5 «triste» pasa el umbral y se aciertan tres
    expect(labAt(lab(3), { ix: 2.5 }).hits).toBe(3);
  });

  it('ex00.4: el determinante total es el producto: empieza en 4, una columna a la mitad lo deja en 2', () => {
    // contract: enunciado de ex00.4: la primera capa multiplica cada área por 4 y la tuya aún no hace nada
    expect(labAt(lab(4)).det_total).toBe(4);
    // contract: solution de ex00.4: î en (0,5; 0) y ĵ en (0; 0,5); también con ĵ en (0,5; 0,5)
    expect(solves(lab(4), { ix: 0.5, jy: 0.5 })).toBe(true);
    expect(solves(lab(4), { ix: 0.5, jx: 0.5, jy: 0.5 })).toBe(true);
    // contract: takeaway de ex00.4: encoger una sola columna deja el total en 2
    expect(labAt(lab(4), { ix: 0.5 }).det_total).toBe(2);
    expect(solves(lab(4), { ix: 0.5 })).toBe(false);
    // contract: solution de ex00.4: con î en (−0,5; 0) el total es −1 y no vale
    expect(labAt(lab(4), { ix: -0.5, jy: 0.5 }).det_total).toBe(-1);
    expect(solves(lab(4), { ix: -0.5, jy: 0.5 })).toBe(false);
  });

  it('ex00.5: tras el intercambio hay que doblar la segunda salida; doblar la primera da las dianas de ex00.2', () => {
    // contract: enunciado de ex00.5: al empezar las palabras no están en sus dianas
    expect(labAt(lab(5)).target_err).toBeGreaterThan(0);
    // contract: solution de ex00.5: ĵ en (0, 2)
    expect(solves(lab(5), { jy: 2 })).toBe(true);
    // contract: enunciado de ex00.5 («poner detrás doblar la primera salida no da lo mismo»): î en (2, 0) no resuelve…
    expect(solves(lab(5), { ix: 2 })).toBe(false);
    // contract: …porque es el otro orden: lleva las palabras a las dianas de ex00.2
    const other = lab(2).lab;
    const spec = lab(5).lab;
    if (other.kind !== 'capa' || spec.kind !== 'capa') throw new Error('capa');
    expect(labMeasure({ ...spec, targets: other.targets }, { ix: 2 }).target_err).toBe(0);
    // contract: solution de ex00.5: las dos juntas son (1 0; 0 2)(0 1; 1 0) = (0 1; 2 0), distinta del producto de ex00.2
    const swap: M = [
      [0, 1],
      [1, 0],
    ];
    const D2: M = [
      [1, 0],
      [0, 2],
    ];
    expect(flat(mul(D2, swap))).toEqual([0, 1, 2, 0]);
    expect(mul(D2, swap)).not.toEqual(mul(S, swap));
  });

  it('todas llevan una primera capa fija salvo ex00.2, que la sustituye', () => {
    const before = [1, 2, 3, 4, 5].map((k) => {
      const spec = lab(k).lab;
      if (spec.kind !== 'capa') throw new Error('ex00 usa el laboratorio capa');
      if (!spec.before) return null;
      const { i, j } = spec.before;
      return det([
        [i[0], j[0]],
        [i[1], j[1]],
      ]);
    });
    // contract: brief-juego-2.md, Componer: «todas con before» salvo la 2; la 3 aplasta (det 0) y la 4 tiene determinante 4
    expect(before).toEqual([-2, null, 0, 4, -1]);
  });
});

describe('componer, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01, ex02] = componer.exercises;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 0): parámetros del MLP de GPT-2 pequeño; peso del tono 1·1 + 2·1; la opción del producto (índice 1); det 0,75·2; «feliz» con ReLU
    expect(ex01!.questions.map(answerOf)).toEqual([
      [3072 * 768 + 3072 + 768 * 3072 + 768, 0],
      [1 * 1 + 2 * 1, 0],
      1,
      [0.75 * 2, 0],
      [[3.5, 0], 0],
    ]);
  });

  it('ex01.1: las cifras de la solución', () => {
    // contract: solution de ex01.1: 2 362 368 + 2 360 064 = 4 722 432; takeaway: 12 bloques pasan de 56 millones
    expect(3072 * 768 + 3072).toBe(2362368);
    expect(768 * 3072 + 768).toBe(2360064);
    expect(2362368 + 2360064).toBe(4722432);
    expect(12 * 4722432).toBeGreaterThan(56e6);
    expect(ex01!.questions[0]!.solution).toContain('4\\,722\\,432');
  });

  it('ex01.2: AB = (1 3; 0 1) y el laboratorio tiene B delante', () => {
    const A: M = [
      [1, 2],
      [0, 1],
    ];
    const B: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: solution de ex01.2: AB = (1 3; 0 1)
    expect(flat(mul(A, B))).toEqual([1, 3, 0, 1]);
    const q = ex01!.questions[1]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.2 es numero con capa');
    // contract: enunciado de ex01.2: la primera capa del laboratorio es B
    expect(q.lab.before).toEqual({ i: [1, 0], j: [1, 1] });
  });

  it('ex01.4: el determinante de las dos capas del laboratorio es el de la respuesta', () => {
    const q = ex01!.questions[3]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.4 es numero con capa');
    // contract: solution de ex01.4: det B = 2, det A = 0,75 y det(AB) = 1,5; el laboratorio lleva puestas las dos
    expect(labMeasure(q.lab, {}).det).toBe(0.75);
    expect(labMeasure(q.lab, {}).det_total).toBe(q.answer);
    expect(q.lab.readouts).toBeUndefined();
  });

  it('ex01.5: «feliz» por B, ReLU y A', () => {
    const B: M = [
      [1, 1],
      [-1, 1],
    ];
    const A: M = [
      [1, 2],
      [0, 1],
    ];
    const ap = (m: M, v: [number, number]): [number, number] => [
      m[0][0] * v[0] + m[0][1] * v[1],
      m[1][0] * v[0] + m[1][1] * v[1],
    ];
    const h = ap(B, [2, 1.5]);
    // contract: solution de ex01.5: B da (3,5; −0,5), ReLU (3,5; 0), A (3,5; 0); sin ReLU, (2,5; −0,5)
    expect(h).toEqual([3.5, -0.5]);
    expect(ap(A, [Math.max(0, h[0]), Math.max(0, h[1])])).toEqual([3.5, 0]);
    expect(ap(mul(A, B), [2, 1.5])).toEqual([2.5, -0.5]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const A: M = [
      [1, 2],
      [0, 1],
    ];
    const B: M = [
      [2, 0],
      [1, 3],
    ];
    // contract: ex02.1: AB = (4, 6; 1, 3) y la multiplicación entrada a entrada daría (2, 0; 0, 3)
    expect(flat(mul(A, B))).toEqual([4, 6, 1, 3]);
    expect([A[0][0] * B[0][0], A[0][1] * B[0][1], A[1][0] * B[1][0], A[1][1] * B[1][1]]).toEqual([
      2, 0, 0, 3,
    ]);
    const A2: M = [
      [1, 2],
      [3, 1],
    ];
    const B2: M = [
      [1, 2],
      [3, 0],
    ];
    // contract: ex02.2: col0 = (7, 6), col1 = (2, 6), C = (7, 2; 6, 6)
    expect(flat(mul(A2, B2))).toEqual([7, 2, 6, 6]);
    // contract: ex02.3: componer([R, S]) = SR = (0, −2; 1, 0), al revés RS = (0, −1; 2, 0)
    expect(flat(mul(S, R))).toEqual([0, -2, 1, 0]);
    expect(flat(mul(R, S))).toEqual([0, -1, 2, 0]);
    const A3: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: ex02.4: AB = (2, 1; 0, 1) y BA = (2, 2; 0, 1) con A la inclinación y B el estiramiento
    expect(flat(mul(A3, S))).toEqual([2, 1, 0, 1]);
    expect(flat(mul(S, A3))).toEqual([2, 2, 0, 1]);
    // contract: ex02.5: W = W2 W1 = (1, 5; 1, 1) y W x = (11, 3) con x = (1, 2), igual que W2 (W1 x)
    const W1 = [
      [1, 2],
      [0, 1],
      [-1, 1],
    ];
    const W2 = [
      [2, 0, 1],
      [1, -1, 0],
    ];
    const x = [1, 2];
    const apply = (m: number[][], v: number[]): number[] =>
      m.map((row) => row.reduce((s, a, k) => s + a * v[k]!, 0));
    const W = [0, 1].map((r) =>
      [0, 1].map(
        (c) =>
          apply(
            W2,
            W1.map((row) => row[c]!),
          )[r]!,
      ),
    );
    expect(W).toEqual([
      [1, 5],
      [1, 1],
    ]);
    expect(apply(W, x)).toEqual([11, 3]);
    expect(apply(W2, apply(W1, x))).toEqual([11, 3]);
  });
});

describe('componer: hojas', () => {
  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 0 de matrices: orden mal escrito en código (línea 3), «dos capas lineales aprenden más» (línea 3) y una correcta (null); al menos una de código
    expect(componer.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(componer.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: `C = R @ S` aplica primero S, y la conclusión de que dos capas lineales aprenden más que una
    const faulty = componer.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'C = R @ S',
      'Luego dos capas lineales seguidas pueden aprender cosas que una sola capa no puede',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of componer.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 1: `C = R @ S` vale (0, −1; 2, 0) y `C = S @ R` vale (0, −2; 1, 0), que es lo que pide el enunciado (primero R, después S)
    expect(flat(mul(R, S))).toEqual([0, -1, 2, 0]);
    expect(flat(mul(S, R))).toEqual([0, -2, 1, 0]);
    // contract: hoja 3: A 2×3 y B 3×4: AB es 2×4; en BA los tamaños interiores serían 4 y 2
    const inner = (a: [number, number], b: [number, number]): boolean => a[1] === b[0];
    expect(inner([2, 3], [3, 4])).toBe(true);
    expect(inner([3, 4], [2, 3])).toBe(false);
  });
});

describe('banco de examen 0 del proyecto componer', () => {
  it('tiene tres entradas fijas del proyecto componer, con ids examen-0.*', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver): un laboratorio y una cuenta del estilo nuevo con ids nuevos; la de código se conserva
    expect(examen0Componer.map((e) => e.project)).toEqual(['componer', 'componer', 'componer']);
    expect(examen0Componer.map((e) => e.question.id)).toEqual([
      'examen-0.capa-tras-mezcla',
      'examen-0.capa-equivalente',
      'examen-0.tres-capas',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen0Componer) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo; las generadas las añade el ensamblado
    expect(examen0Componer.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen0Componer.map((e) => e.question.type)).toEqual([
      'laboratorio',
      'numero',
      'codigo',
    ]);
    const projectIds = new Set(projectQuestions(componer).map((q) => q.id));
    expect(examen0Componer.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const mezcla = labQuestion(bankQuestions, 'examen-0.capa-tras-mezcla');
    // contract: examen-0.capa-tras-mezcla: tras la mezcla, la primera salida es tamaño − domesticidad y la neurona falla con los seis
    expect(labAt(mezcla).acc).toBe(0);
    // contract: solution: î en (−1, 0) resuelve; también î en (−1, 0) y ĵ en (1, 1)
    expect(solves(mezcla, { ix: -1 })).toBe(true);
    expect(solves(mezcla, { ix: -1, jx: 1, jy: 1 })).toBe(true);
    // contract: tentadora y mala (solution): intercambiar las columnas deja tamaño + domesticidad y fallan «tigre» y «oso»
    expect(labAt(mezcla, { ix: 0, iy: 1, jx: 1, jy: 0 }).hits).toBe(4);
    const equivalente = bankQuestions[1]!;
    // contract: examen-0.capa-equivalente: la capa única es de 384×384; las dos capas guardan 2·1536·384
    expect(answerOf(equivalente)).toEqual([384 * 384, 0]);
    expect(384 * 384).toBe(147456);
    expect(2 * 1536 * 384).toBe(1179648);
  });

  it('tres-capas: W3 W2 W1 = (0, 2; 1, 2), y la salida (2, 3) coincide con pasar x por las capas', () => {
    const W1: M = [
      [1, 2],
      [0, 1],
    ];
    const W2: M = [
      [0, 1],
      [1, 0],
    ];
    const W3: M = [
      [2, 0],
      [0, 1],
    ];
    // contract: solution de examen-0.tres-capas: W = W3 W2 W1 = (0, 2; 1, 2); en el orden contrario W1 W2 W3 = (4, 1; 2, 0)
    expect(flat(mul(W3, mul(W2, W1)))).toEqual([0, 2, 1, 2]);
    expect(flat(mul(mul(W1, W2), W3))).toEqual([4, 1, 2, 0]);
    // contract: solution de examen-0.tres-capas: con x = (1, 1), W x = (2, 3) y las tres capas por separado dan lo mismo
    const W = mul(W3, mul(W2, W1));
    expect([W[0][0] + W[0][1], W[1][0] + W[1][1]]).toEqual([2, 3]);
    const step = (m: M, v: number[]): number[] => [
      m[0][0] * v[0]! + m[0][1] * v[1]!,
      m[1][0] * v[0]! + m[1][1] * v[1]!,
    ];
    expect(step(W3, step(W2, step(W1, [1, 1])))).toEqual([2, 3]);
  });
});

describe('proyecto componer: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(componer), ...bankQuestions].filter(
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
    // contract: encargo de la Órbita 0 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `componer.ex02.${n}`),
      'examen-0.tres-capas',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
