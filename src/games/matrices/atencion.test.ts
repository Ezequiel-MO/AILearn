import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { labMeasure } from '../../engine/labs';
import { atencionScene, type AtencionSpec } from '../../engine/labs/atencion';
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
import { atencion } from './atencion';
import { examen3Atencion } from './examen-3-atencion';

const bankQuestions = examen3Atencion
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto atencion', projectQuestions(atencion));
defineProseTests('banco examen-3 atencion', bankQuestions);
defineLabProjectTests(atencion, examen3Atencion);

type Graded = Exclude<Question, CodigoQ>;

const [, ex01, ex02] = atencion.exercises;

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('proyecto atencion', () => {
  it('tiene calentamiento de Python de 1 a 4 fichas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): calentamiento de 1 a 4 fichas enlazado con warmup
    expect(atencion.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(atencion.warmup?.length).toBeLessThanOrEqual(4);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3 de matrices (tabla de la parte común): id atencion, nombre «Atención como matriz», subtítulo «Quién mira a quién»
    expect([atencion.id, atencion.name, atencion.sub]).toEqual([
      'atencion',
      'Atención como matriz',
      'Quién mira a quién',
    ]);
  });

  it('tiene los tres ejercicios en orden, 5 preguntas cada uno, y tres hojas', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): ex00 manipular, ex01 calcular y ex02 programar, de 5 preguntas cada uno; tres hojas
    expect(atencion.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(atencion.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(atencion.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón atencion.exNN.k y atencion.hoja.k', () => {
    // contract: encargo de la Órbita 3 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(atencion).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `atencion.ex0${e}.${k}`)),
      'atencion.hoja.1',
      'atencion.hoja.2',
      'atencion.hoja.3',
    ]);
  });
});

describe('atencion, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(atencion);
  const lab = (k: number) => labQuestion(all, `atencion.ex00.${k}`);

  it('ex00.1: al empezar «cansado» se lleva la mayor parte; girar y alargar la consulta hacia «animal» resuelve', () => {
    const start = labAt(lab(1));
    // contract: enunciado de ex00.1: «la mayor parte de la atención se la lleva «cansado»» (índice 6 de la frase)
    expect(start.top).toBe(6);
    expect(start.w_cansado).toBeCloseTo(0.658, 3);
    // contract: solution de ex00.1: (1,5; 1) da a «animal» el 90,7 %, (2, 1) el 96,6 % y (1, 1), el 75,3 %
    expect(solves(lab(1), { qx: 1.5, qy: 1 })).toBe(true);
    expect(labAt(lab(1), { qx: 1.5, qy: 1 }).w_animal).toBeCloseTo(0.907, 3);
    expect(solves(lab(1), { qx: 2, qy: 1 })).toBe(true);
    expect(labAt(lab(1), { qx: 2, qy: 1 }).w_animal).toBeCloseTo(0.966, 3);
    expect(solves(lab(1), { qx: 1, qy: 1 })).toBe(true);
    expect(labAt(lab(1), { qx: 1, qy: 1 }).w_animal).toBeCloseTo(0.753, 3);
    // contract: tentadora y mala (solution): (0,5; 0,5) apunta bien pero es corta y se queda en el 45,6 %
    expect(labAt(lab(1), { qx: 0.5, qy: 0.5 }).w_animal).toBeCloseTo(0.456, 3);
    expect(solves(lab(1), { qx: 0.5, qy: 0.5 })).toBe(false);
  });

  it('ex00.2: la entropía pasa de 2 bits; bajar la temperatura afila y 1 no basta', () => {
    // contract: enunciado de ex00.2: «la entropía pasa de 2 bits» al empezar
    expect(labAt(lab(2)).entropy).toBeGreaterThan(2);
    // contract: solution de ex00.2: con 0,75 la entropía baja a 0,9 bits y «animal» se lleva el 85,5 %; con 0,5, a 0,28
    expect(solves(lab(2), { temp: 0.75 })).toBe(true);
    expect(labAt(lab(2), { temp: 0.75 }).entropy).toBeCloseTo(0.903, 3);
    expect(labAt(lab(2), { temp: 0.75 }).w_animal).toBeCloseTo(0.855, 3);
    expect(solves(lab(2), { temp: 0.5 })).toBe(true);
    expect(labAt(lab(2), { temp: 0.5 }).entropy).toBeCloseTo(0.276, 3);
    // contract: tentadora y mala (solution): con temperatura 1, 1,48 bits
    expect(labAt(lab(2), { temp: 1 }).entropy).toBeCloseTo(1.481, 3);
    expect(solves(lab(2), { temp: 1 })).toBe(false);
    // contract: solution de ex00.2: temperatura 0,5 da los mismos pesos que la consulta (2, 1) con temperatura 1
    expect(labAt(lab(2), { temp: 0.5 }).w_animal).toBeCloseTo(
      labAt(lab(1), { qx: 2, qy: 1 }).w_animal,
      12,
    );
  });

  it('ex00.3: solo la máscara deja el futuro en 0; con ella, girar la consulta lleva «animal» por encima del 90 %', () => {
    const start = labAt(lab(3));
    // contract: enunciado de ex00.3: la atención de «cruzó» se va sobre todo a los tokens posteriores; «animal», el 14,7 %
    expect(start.future).toBeGreaterThan(0.5);
    expect(start.w_animal).toBeCloseTo(0.147, 3);
    // contract: solution de ex00.3: con la máscara sola, «animal» pasa al 77,9 % y el futuro a 0, pero no basta
    const masked = labAt(lab(3), { mask: 1 });
    expect([masked.future, masked.masked]).toEqual([0, 3]);
    expect(masked.w_animal).toBeCloseTo(0.779, 3);
    expect(solves(lab(3), { mask: 1 })).toBe(false);
    // contract: solution de ex00.3: con la máscara, (1, 1) llega al 94,8 % y (2, 1), al 99 %
    expect(solves(lab(3), { mask: 1, qx: 1, qy: 1 })).toBe(true);
    expect(labAt(lab(3), { mask: 1, qx: 1, qy: 1 }).w_animal).toBeCloseTo(0.948, 3);
    expect(solves(lab(3), { mask: 1, qx: 2, qy: 1 })).toBe(true);
    expect(labAt(lab(3), { mask: 1, qx: 2, qy: 1 }).w_animal).toBeCloseTo(0.99, 3);
    // contract: tentadora y mala (solution): sin máscara, (2, 1) da a «animal» el 96,6 % y deja un 2,4 % en el futuro
    const unmasked = labAt(lab(3), { qx: 2, qy: 1 });
    expect(unmasked.w_animal).toBeCloseTo(0.966, 3);
    expect(unmasked.future).toBeCloseTo(0.024, 3);
    expect(solves(lab(3), { qx: 2, qy: 1 })).toBe(false);
  });

  it('ex00.4: bajar la clave de «cansado» le quita la atención; moverla de lado o copiar la de «animal», no', () => {
    // contract: enunciado de ex00.4: «cansado» se lleva casi dos tercios al empezar
    expect(labAt(lab(4)).w_cansado).toBeCloseTo(0.658, 3);
    // contract: solution de ex00.4: con la clave en (1, 0), el 8,7 %; más abajo, aún menos
    expect(solves(lab(4), { kx: 1, ky: 0 })).toBe(true);
    expect(labAt(lab(4), { kx: 1, ky: 0 }).w_cansado).toBeCloseTo(0.087, 3);
    expect(labAt(lab(4), { kx: 1, ky: -1 }).w_cansado).toBeLessThan(0.087);
    expect(solves(lab(4), { kx: 2, ky: -1.5 })).toBe(true);
    // contract: tentadora y mala (solution): (3, 2) no cambia nada; la clave de «animal» empata y se lleva el 30 %
    expect(labAt(lab(4), { kx: 3, ky: 2 }).w_cansado).toBeCloseTo(0.658, 3);
    expect(labAt(lab(4), { kx: 2, ky: 1 }).w_cansado).toBeCloseTo(0.3, 3);
    expect(solves(lab(4), { kx: 2, ky: 1 })).toBe(false);
  });

  it('ex00.5: la salida queda en negativo al empezar, (2, 1) no basta y ninguna consulta llega a 2', () => {
    // contract: hint 1 de ex00.5: al empezar la mayor parte va a «cansado» y la salida queda en negativo
    expect(labAt(lab(5)).out_x).toBeLessThan(0);
    // contract: solution de ex00.5: (3; 1,5) da el 99,6 % y 1,99; también vale (3, 1)
    expect(solves(lab(5), { qx: 3, qy: 1.5 })).toBe(true);
    expect(labAt(lab(5), { qx: 3, qy: 1.5 }).w_animal).toBeCloseTo(0.996, 3);
    expect(labAt(lab(5), { qx: 3, qy: 1.5 }).out_x).toBeCloseTo(1.99, 2);
    expect(solves(lab(5), { qx: 3, qy: 1 })).toBe(true);
    // contract: tentadora y mala (solution): la consulta (2, 1) llega a 1,94
    expect(labAt(lab(5), { qx: 2, qy: 1 }).out_x).toBeCloseTo(1.943, 3);
    expect(solves(lab(5), { qx: 2, qy: 1 })).toBe(false);
    // contract: solution de ex00.5 (el límite, regla 4 de la guía): en toda la rejilla la salida no llega a 2, el valor de «animal»
    let best = -Infinity;
    for (let qx = -3; qx <= 3; qx += 0.5)
      for (let qy = -3; qy <= 3; qy += 0.5) best = Math.max(best, labAt(lab(5), { qx, qy }).out_x!);
    expect(best).toBeLessThan(2);
    expect(best).toBeGreaterThan(1.98);
  });

  it('las cinco comparten la frase del animal y cambian una cosa cada vez', () => {
    const shape = [1, 2, 3, 4, 5].map((k) => {
      const spec = lab(k).lab;
      if (spec.kind !== 'atencion') throw new Error('ex00 usa el laboratorio atencion');
      return [
        spec.tokens.length,
        spec.focus,
        spec.movable ?? 'query',
        !!spec.temperature,
        spec.mask ?? 'none',
      ];
    });
    // contract: brief-juego-2.md, Atención como matriz: consulta, temperatura, máscara (mira «cruzó», índice 3), clave y valores, con la misma frase
    expect(shape).toEqual([
      [7, 5, 'query', false, 'none'],
      [7, 5, 'none', true, 'none'],
      [7, 3, 'query', false, 'toggle'],
      [7, 5, 'key', false, 'none'],
      [7, 5, 'query', false, 'none'],
    ]);
  });
});

describe('atencion, «Calcular»: las respuestas se recalculan', () => {
  it('pasa checkProject sin problemas (incluye checkLab en cada laboratorio)', () => {
    // contract: encargo común (2026-11-10): checkProject(atencion) devuelve la lista vacía
    expect(checkProject(atencion)).toEqual([]);
  });

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 3): 1,5·1 + 1·(−2); softmax de (0, 2, 0); QKᵀ de 10×10; 4000² / 1000² (ex01.4 se conserva); 4 + 3 + 2 + 1 pesos anulados
    expect(ex01!.questions.map(answerOf)).toEqual([
      [1.5 * 1 + 1 * -2, 0],
      [[0.11, 0.79, 0.11], 0.01],
      [[10, 10], 0],
      [16, 0],
      [4 + 3 + 2 + 1, 0],
    ]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'numero',
      'vector',
      'vector',
      'numero',
      'numero',
    ]);
  });

  it('ex01.1 y ex01.2: la cuenta coincide con la barra al llevar la consulta al punto del enunciado, y no al empezar', () => {
    const [q1, q2] = ex01!.questions;
    if (q1?.type !== 'numero' || !q1.lab) throw new Error('ex01.1 es numero con lab');
    if (q2?.type !== 'vector' || !q2.lab) throw new Error('ex01.2 es vector con lab');
    // contract: ex01.1: con la consulta (1,5; 1), la puntuación de «cruzó» es −0,5; al empezar es otra
    expect(labMeasure(q1.lab, { qx: 1.5, qy: 1 }).s_cruzo).toBe(-0.5);
    expect(labMeasure(q1.lab, {}).s_cruzo).not.toBe(-0.5);
    // contract: ex01.2: con la consulta (2, 0), las puntuaciones son 0, 2 y 0 y los pesos 0,107; 0,787; 0,107
    const at = labMeasure(q2.lab, { qx: 2, qy: 0 });
    expect([at.s_el, at.s_gato, at.s_duerme]).toEqual([0, 2, 0]);
    expect(at.w_gato).toBeCloseTo(0.787, 3);
    expect(at.w_el).toBeCloseTo(0.107, 3);
    // contract: guía de contenido 2026-11-10: el laboratorio no empieza enseñando la respuesta
    expect(labMeasure(q2.lab, {}).w_gato).not.toBeCloseTo(0.79, 2);
  });

  it('ex01.5: con la máscara, el mapa de cinco tokens tiene 10 ceros; sin ella, ninguno', () => {
    const q = ex01!.questions[4]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'atencion')
      throw new Error('ex01.5 es numero con atencion');
    const zeros = (mask: number) =>
      atencionScene(q.lab as AtencionSpec, { mask })
        .heat.flat()
        .filter((w) => w === 0).length;
    // contract: solution de ex01.5: 4 + 3 + 2 + 1 + 0 = 10 pesos a 0 con la máscara
    expect(zeros(1)).toBe(10);
    expect(zeros(0)).toBe(0);
  });

  it('las respuestas se califican como correctas', () => {
    const [a, b, c, d, f] = ex01!.questions as Graded[] as [Graded, Graded, Graded, Graded, Graded];
    // contract: la respuesta declarada de cada pregunta de Calcular se da por buena, y el error que nombra su solución no
    expect(grade(a, { type: 'numero', value: -0.5 })).toBe(true);
    expect(grade(a, { type: 'numero', value: 3.5 })).toBe(false);
    expect(grade(b, { type: 'vector', value: [0.107, 0.787, 0.107] })).toBe(true);
    expect(grade(b, { type: 'vector', value: [0.79, 0.11, 0.11] })).toBe(false);
    expect(grade(c, { type: 'vector', value: [10, 10] })).toBe(true);
    expect(grade(c, { type: 'vector', value: [64, 64] })).toBe(false);
    expect(grade(d, { type: 'numero', value: 16 })).toBe(true);
    expect(grade(d, { type: 'numero', value: 4 })).toBe(false);
    expect(grade(f, { type: 'numero', value: 10 })).toBe(true);
    expect(grade(f, { type: 'numero', value: 15 })).toBe(false);
  });

  it('ex01.4 se conserva: el coste crece con n²', () => {
    // contract: encargo de atencion (2026-11-10): conservar atencion.ex01.4; 4000² / 1000² = 16
    expect(4000 ** 2 / 1000 ** 2).toBe(16);
    expect(ex01!.questions[3]!.id).toBe('atencion.ex01.4');
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const softmaxRow = (r: number[]): number[] => {
      const m = Math.max(...r);
      const e = r.map((x) => Math.exp(x - m));
      const t = e.reduce((a, b) => a + b, 0);
      return e.map((x) => x / t);
    };
    const mul = (a: number[][], b: number[][]): number[][] =>
      a.map((row) => b[0]!.map((_, j) => row.reduce((t, x, k) => t + x * b[k]![j]!, 0)));
    const T = (a: number[][]): number[][] => a[0]!.map((_, j) => a.map((row) => row[j]!));
    // contract: ex02.1: Q y K de 6 filas y 3 columnas (los de la pregunta); la consulta 0 con la clave 0 da 1/√3 = 0,58 y con la clave 2 da 4/√3 = 2,31
    const Q1 = [
      [1, 0, 2],
      [2, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [2, 0, 1],
      [0, 2, 1],
    ];
    const K1 = [
      [1, 1, 0],
      [0, 2, 1],
      [2, 0, 1],
      [1, 0, 1],
      [0, 1, 2],
      [1, 2, 0],
    ];
    const S1 = mul(Q1, T(K1)).map((r) => r.map((x) => x / Math.sqrt(3)));
    expect(S1[0]![0]).toBeCloseTo(0.58, 2);
    expect(S1[0]![2]).toBeCloseTo(2.31, 2);
    // contract: ex02.3: pesos de 4 palabras y V de 4 filas y 2 columnas; la primera palabra da (2,5; 1,5), las columnas suman 0,9; 1,2; 0,8; 1,1 y el mayor de cada fila está en 0, 1, 3, 3
    const P = [
      [0.5, 0.25, 0.25, 0],
      [0.1, 0.6, 0.1, 0.2],
      [0, 0.25, 0.25, 0.5],
      [0.3, 0.1, 0.2, 0.4],
    ];
    const V3 = [
      [4, 0],
      [0, 4],
      [2, 2],
      [1, 3],
    ];
    const out = mul(P, V3);
    expect(out[0]![0]).toBeCloseTo(2.5, 12);
    expect(out[0]![1]).toBeCloseTo(1.5, 12);
    [0.9, 1.2, 0.8, 1.1].forEach((c, j) =>
      expect(P.reduce((t, r) => t + r[j]!, 0)).toBeCloseTo(c, 12),
    );
    expect(P.map((r) => r.indexOf(Math.max(...r)))).toEqual([0, 1, 3, 3]);
    // contract: ex02.5: 5 palabras con máscara causal: la primera fila de pesos es (1, 0, 0, 0, 0), la última (0,08; 0,26; 0,15; 0,05; 0,46) y su salida (0,84; 0,82)
    const Q5 = [
      [1, 0, 1],
      [0, 2, 1],
      [1, 1, 0],
      [2, 0, 0],
      [0, 1, 2],
    ];
    const K5 = [
      [1, 1, 0],
      [0, 1, 1],
      [2, 0, 1],
      [1, 0, 0],
      [0, 2, 1],
    ];
    const V5 = [
      [1, 0],
      [0, 1],
      [2, 0],
      [0, 2],
      [1, 1],
    ];
    const S5 = mul(Q5, T(K5)).map((r, i) =>
      r.map((x, j) => (j > i ? -Infinity : x / Math.sqrt(3))),
    );
    const W5 = S5.map(softmaxRow);
    expect(W5[0]).toEqual([1, 0, 0, 0, 0]);
    [0.08, 0.26, 0.15, 0.05, 0.46].forEach((w, j) => expect(W5[4]![j]).toBeCloseTo(w, 2));
    const o5 = mul(W5, V5);
    expect(o5[4]![0]).toBeCloseTo(0.84, 2);
    expect(o5[4]![1]).toBeCloseTo(0.82, 2);
  });
});

describe('hojas de atencion', () => {
  it('líneas erróneas', () => {
    // contract: encargo de la Órbita 3 de matrices (atencion): hoja 1 con el softmax normalizado por columnas (línea 3, índice 2); hoja 2 con la escala por la raíz del número de palabras (línea 2, índice 1); hoja 3 sin error
    expect(atencion.sheets.map(answerOf)).toEqual([2, 1, null]);
  });

  it('formatos: código y texto, y una sola hoja sin error', () => {
    // contract: encargo de la Órbita 3 de matrices: hojas que mezclan `codigo` y `texto`, con exactamente una sin error
    expect(atencion.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
    expect(
      atencion.sheets.filter((s) => s.type === 'revision' && s.faultyLine === null),
    ).toHaveLength(1);
  });

  it('la hoja 3 es coherente: las filas suman 1 y la primera columna, 1,1', () => {
    // contract: hoja 3: filas (0,7; 0,2; 0,1), (0,1; 0,8; 0,1), (0,3; 0,3; 0,4) y primera columna 0,7 + 0,1 + 0,3
    const rows = [
      [0.7, 0.2, 0.1],
      [0.1, 0.8, 0.1],
      [0.3, 0.3, 0.4],
    ];
    for (const r of rows) expect(r.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(rows.reduce((t, r) => t + r[0]!, 0)).toBeCloseTo(1.1, 12);
  });
});

describe('banco examen-3 de atencion', () => {
  it('las entradas son válidas', () => {
    for (const e of examen3Atencion) {
      // contract: encargo de la Órbita 3 de matrices: cada entrada fija del banco cumple bankEntrySchema
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
  });

  it('tres entradas fijas, del proyecto y con ids únicos', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver): un laboratorio con otra frase, una cuenta del estilo nuevo y el código, que se conserva
    expect(examen3Atencion.map((e) => [e.project, e.question.id, e.question.type])).toEqual([
      ['atencion', 'examen-3.vaso-roto', 'laboratorio'],
      ['atencion', 'examen-3.pesos-por-bloque', 'numero'],
      ['atencion', 'examen-3.palabra-mas-dispersa', 'codigo'],
    ]);
    const projectIds = new Set(projectQuestions(atencion).map((q) => q.id));
    // contract: los ids del banco no chocan con los del proyecto
    expect(examen3Atencion.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('vaso-roto: «vaso» queda entre dos vecinas y no pasa del 78,5 %', () => {
    const q = labQuestion(bankQuestions, 'examen-3.vaso-roto');
    const start = labAt(q);
    // contract: enunciado de vaso-roto: al empezar reparte su atención entre «niña» y «estaba», empatadas
    expect(start.w_nina).toBeCloseTo(0.402, 3);
    expect(start.w_estaba).toBeCloseTo(start.w_nina!, 12);
    // contract: solution de vaso-roto: (3, −1) da el 78,5 %; también (3; −1,5) y (2,5; −1)
    expect(solves(q, { qx: 3, qy: -1 })).toBe(true);
    expect(labAt(q, { qx: 3, qy: -1 }).w_vaso).toBeCloseTo(0.785, 3);
    expect(solves(q, { qx: 3, qy: -1.5 })).toBe(true);
    expect(solves(q, { qx: 2.5, qy: -1 })).toBe(true);
    // contract: tentadora y mala (solution): apuntar justo a la clave de «vaso» da el 65,5 %, y (2, 0) empata con «niña»
    expect(labAt(q, { qx: 2, qy: -1 }).w_vaso).toBeCloseTo(0.655, 3);
    expect(solves(q, { qx: 2, qy: -1 })).toBe(false);
    const tie = labAt(q, { qx: 2, qy: 0 });
    expect(tie.w_vaso).toBeCloseTo(tie.w_nina!, 12);
    // contract: solution de vaso-roto («lo más que se consigue en la rejilla»): el máximo de la rejilla está en (3, −1)
    let best = { w: -1, at: '' };
    for (let qx = -3; qx <= 3; qx += 0.5)
      for (let qy = -3; qy <= 3; qy += 0.5) {
        const w = labAt(q, { qx, qy }).w_vaso!;
        if (w > best.w) best = { w, at: `${qx},${qy}` };
      }
    expect(best.at).toBe('3,-1');
  });

  it('pesos-por-bloque: 12 cabezas por 500² pesos', () => {
    const q = bankQuestions[1]!;
    // contract: solution de pesos-por-bloque: 12 · 500 · 500 = 3 000 000; 12 · 500 = 6000 es el error que nombra
    expect(answerOf(q)).toEqual([12 * 500 * 500, 0]);
    expect(12 * 500 * 500).toBe(3000000);
    expect(grade(q as Graded, { type: 'numero', value: 6000 })).toBe(false);
  });

  it('palabra-mas-dispersa: los pesos y la posición se recalculan', () => {
    // contract: Q = (1, 0), (0, 2), (1, 1) y K = (1, 0), (0, 1), (2, 0), (1, 2): pesos mayores 0,45; 0,73 y 0,51 (con raíz de 2), el menor en la palabra 0
    const Q = [
      [1, 0],
      [0, 2],
      [1, 1],
    ];
    const K = [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 2],
    ];
    const maxes = Q.map((q) => {
      const s = K.map((k) => (q[0]! * k[0]! + q[1]! * k[1]!) / Math.sqrt(2));
      const m = Math.max(...s);
      const e = s.map((x) => Math.exp(x - m));
      return Math.max(...e) / e.reduce((a, b) => a + b, 0);
    });
    [0.45, 0.73, 0.51].forEach((w, i) => expect(maxes[i]).toBeCloseTo(w, 2));
    expect(maxes.indexOf(Math.min(...maxes))).toBe(0);
  });
});

describe('atencion: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(atencion), ...bankQuestions].filter(
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

  it('cada pregunta de código tiene mensajes que revisar', () => {
    // contract: encargo de la Órbita 3 de matrices (fase B): cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `atencion.ex02.${n}`),
      'examen-3.palabra-mas-dispersa',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
