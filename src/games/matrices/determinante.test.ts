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
import { determinante } from './determinante';
import { RESENAS } from './datos';
import { examen1Determinante } from './examen-1-determinante';

const bankQuestions = examen1Determinante
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto determinante', projectQuestions(determinante));
defineProseTests('banco examen-1 determinante', bankQuestions);
defineLabProjectTests(determinante, examen1Determinante);

type M = [[number, number], [number, number]];
/** Determinante ad − bc de una matriz 2×2. */
const det = (m: M): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
/** Producto de dos matrices 2×2. */
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
/** Matriz de columnas u y v. */
const cols = (u: [number, number], v: [number, number]): M => [
  [u[0], v[0]],
  [u[1], v[1]],
];

describe('proyecto determinante', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 1 de matrices: checkProject(determinante) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(determinante)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10): Determinante, «cuánto espacio deja la capa»; el id no cambia
    expect([determinante.id, determinante.name, determinante.sub]).toEqual([
      'determinante',
      'Determinante',
      'Cuánto espacio deja la capa',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(determinante.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(determinante.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(determinante.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón determinante.exNN.k y determinante.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(determinante).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `determinante.ex0${e}.${k}`)),
      'determinante.hoja.1',
      'determinante.hoja.2',
      'determinante.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('determinante, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(determinante);
  const lab = (k: number) => labQuestion(all, `determinante.ex00.${k}`);

  it('ex00.1: la capa encoge a un cuarto de área; estirar sin dar la vuelta al tono resuelve', () => {
    const start = labAt(lab(1));
    // contract: enunciado de ex00.1: la capa lo encoge todo a la mitad y el cuadrado unidad se queda en un cuarto; la neurona acierta
    expect([start.area, start.acc]).toEqual([0.25, 1]);
    // contract: solution de ex00.1: î en (2, 0) y ĵ en (0, 2) dan determinante 4 y seis aciertos
    expect(solves(lab(1), { ix: 2, jy: 2 })).toBe(true);
    expect(labAt(lab(1), { ix: 2, jy: 2 }).det).toBe(4);
    // contract: regla 3 de la guía (varias soluciones): «cualquier pareja de columnas que no dé la vuelta al tono y cuyo cuadrado mida 4 o más»
    expect(solves(lab(1), { ix: 2, jy: 2.5 })).toBe(true);
    expect(solves(lab(1), { ix: 1, jx: 1, jy: 4 })).toBe(true);
    // contract: tentadora y mala (pista 2 y solution): ĵ en (0, −2) da área 4 y determinante −4, pero la neurona falla con las seis
    const flipped = labAt(lab(1), { ix: 2, jy: -2 });
    expect([flipped.area, flipped.det, flipped.acc]).toEqual([4, -4, 0]);
  });

  it('ex00.2: borrar el tono funde dos parejas; aplastar en otra dirección funde una', () => {
    // contract: enunciado de ex00.2: al empezar no hay nada fundido y el determinante no es 0
    expect([labAt(lab(2)).merged, labAt(lab(2)).det]).toEqual([0, 1]);
    // contract: solution de ex00.2: con ĵ en el origen y î en (0, 1) se funden «genial»–«horrible» y «bueno»–«malo»
    expect(labAt(lab(2), { ix: 0, iy: 1, jy: 0 }).merged).toBe(2);
    expect(solves(lab(2), { ix: 0, iy: 1, jy: 0 })).toBe(true);
    // contract: regla 3 (varias soluciones): «con î en otro sitio pasa igual»; y con î también en el origen se funde todo
    expect(solves(lab(2), { jy: 0 })).toBe(true);
    expect(solves(lab(2), { ix: 2, iy: -1, jy: 0 })).toBe(true);
    expect(labAt(lab(2), { ix: 0, jy: 0 }).merged).toBe(15);
    // contract: tentadora y mala (pista 2 y solution): ĵ en (1, 0) aplasta, pero solo funde «malo» y «triste»
    const line = labAt(lab(2), { jx: 1, jy: 0 });
    expect([line.det, line.merged]).toEqual([0, 1]);
  });

  it('ex00.3: empieza aplastando el tono y diciendo «positiva» a todo; aplastar la intensidad acierta las seis', () => {
    const start = labAt(lab(3));
    // contract: enunciado de ex00.3: «aplasta (determinante 0) y ha borrado el tono … dice positiva a todas» (3 de 6)
    expect([start.det, start.acc, start.merged]).toEqual([0, 0.5, 2]);
    // contract: solution de ex00.3: î en (0, 0) y ĵ en (0, 1), sin ninguna pareja fundida (takeaway)
    expect(solves(lab(3), { iy: 0, jy: 1 })).toBe(true);
    expect(labAt(lab(3), { iy: 0, jy: 1 }).merged).toBe(0);
    // contract: solution de ex00.3: también î en (0; 0,5) y ĵ en (0, 2)
    expect(solves(lab(3), { iy: 0.5, jy: 2 })).toBe(true);
    // contract: tentadora y mala (solution): subir ĵ sin tocar î deja el determinante en 0, pero «horrible» entra en la zona y «malo» y «triste» quedan en la frontera (3 aciertos)
    const mixed = labAt(lab(3), { jy: 1 });
    expect([mixed.det, mixed.hits]).toEqual([0, 3]);
    // contract: tentadora y mala: volver a la capa que no cambia nada acierta, pero ya no aplasta
    const identity = labAt(lab(3), { ix: 1, iy: 0, jy: 1 });
    expect([identity.acc, identity.det]).toEqual([1, 1]);
  });

  it('ex00.4: voltear la intensidad no cambia lo que lee la neurona; voltear el tono o intercambiar, sí', () => {
    // contract: solution de ex00.4: î en (−1, 0) da determinante −1 y seis aciertos; (−2, 0) da −2
    expect(solves(lab(4), { ix: -1 })).toBe(true);
    expect(labAt(lab(4), { ix: -2 }).det).toBe(-2);
    expect(solves(lab(4), { ix: -2 })).toBe(true);
    // contract: tentadora y mala (solution): ĵ en (0, −1) da −1 y falla con todas
    const flipTone = labAt(lab(4), { jy: -1 });
    expect([flipTone.det, flipTone.acc]).toEqual([-1, 0]);
    // contract: tentadora y mala (solution): intercambiar las columnas da −1 y acierta solo tres
    const swap = labAt(lab(4), { ix: 0, iy: 1, jx: 1, jy: 0 });
    expect([swap.det, swap.hits]).toEqual([-1, 3]);
  });

  it('ex00.5: «genial» y «feliz» empiezan a 0,71; casi aplastar los acerca, aplastar del todo los funde', () => {
    // contract: enunciado de ex00.5: «están a 0,71»
    expect(labAt(lab(5)).pair_dist).toBeCloseTo(0.71, 2);
    // contract: solution de ex00.5: ĵ en (−0,5; 0,5): determinante 0,5, distancia 0,35, nada fundido y seis aciertos
    const near = labAt(lab(5), { jx: -0.5, jy: 0.5 });
    expect([near.det, near.merged, near.acc]).toEqual([0.5, 0, 1]);
    expect(near.pair_dist).toBeCloseTo(0.35, 2);
    expect(solves(lab(5), { jx: -0.5, jy: 0.5 })).toBe(true);
    // contract: solution de ex00.5: «encoger toda la capa a la mitad también vale»
    expect(solves(lab(5), { ix: 0.5, jy: 0.5 })).toBe(true);
    // contract: tentadora y mala (solution): ĵ en (−1, 0) los deja a 0, con determinante 0 y fundidos
    const flat = labAt(lab(5), { jx: -1, jy: 0 });
    expect([flat.pair_dist, flat.det, flat.merged]).toEqual([0, 0, 1]);
    expect(solves(lab(5), { jx: -1, jy: 0 })).toBe(false);
  });

  it('las cinco comparten las reseñas y la neurona que mira la segunda salida', () => {
    const scenes = [1, 2, 3, 4, 5].map((k) => {
      const spec = lab(k).lab;
      if (spec.kind !== 'capa') throw new Error('ex00 usa el laboratorio capa');
      return [spec.readout?.w, spec.readout?.b, spec.axes];
    });
    // contract: brief-juego-2.md, Determinante: misma escena en las cinco; el determinante es el protagonista, no la neurona
    expect(scenes).toEqual(Array(5).fill([[0, 1], 0, ['intensidad', 'tono']]));
  });
});

describe('determinante, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01, ex02] = determinante.exercises;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 1): pierde información (opción 0); 4,5·|−2|; 4 intensidades distintas; 2·0,5·(−3); no pierde nada (opción 1)
    expect(ex01!.questions.map(answerOf)).toEqual([0, [4.5 * 2, 0], [4, 0], [2 * 0.5 * -3, 0], 1]);
  });

  it('ex01.1: la capa del enunciado tiene determinante 0 y funde «horrible» con «triste»; −1 es el error de sumar', () => {
    const A: M = [
      [0.5, 1],
      [-0.5, -1],
    ];
    // contract: solution de ex01.1: det = 0,5·(−1) − 1·(−0,5) = 0, y sumar los productos da −1
    expect(det(A)).toBe(0);
    expect(0.5 * -1 + 1 * -0.5).toBe(-1);
    const q = ex01!.questions[0]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es opcion con capa');
    const values = labAt(
      { ...labQuestion(projectQuestions(determinante), 'determinante.ex00.2'), lab: q.lab },
      { ix: 0.5, iy: -0.5, jx: 1, jy: -1 },
    );
    // contract: solution de ex01.1: «horrible» y «triste» salen en el mismo punto (una pareja fundida)
    expect(values.merged).toBe(1);
    const at = (id: string) => {
      const p = RESENAS.points.find((x) => x.id === id)!;
      return [0.5 * p.x + p.y, -0.5 * p.x - p.y];
    };
    expect(at('horrible')).toEqual([-0.75, 0.75]);
    expect(at('triste')).toEqual([-0.75, 0.75]);
  });

  it('ex01.2: el cuadrilátero mide 4,5 y la capa tiene determinante −2', () => {
    // contract: prompt de ex01.2: esquinas en «bueno», «malo», «horrible» y «genial» (un trapecio de lados verticales 2 y 4, a 1,5 de distancia)
    const corner = (id: string) => RESENAS.points.find((p) => p.id === id)!;
    const poly = ['bueno', 'malo', 'horrible', 'genial'].map(corner);
    const shoelace =
      Math.abs(
        poly.reduce((s, p, k) => {
          const n = poly[(k + 1) % poly.length]!;
          return s + p.x * n.y - n.x * p.y;
        }, 0),
      ) / 2;
    expect(shoelace).toBe(4.5);
    // contract: solution de ex01.2: det (−1 0; 0 2) = −2
    expect(
      det([
        [-1, 0],
        [0, 2],
      ]),
    ).toBe(-2);
  });

  it('ex01.3: las seis reseñas dan cuatro intensidades distintas', () => {
    // contract: solution de ex01.3: intensidades 2,5, 1, 2, 2,5, 1 y 1,5; cuatro valores distintos
    expect(RESENAS.points.map((p) => p.x)).toEqual([2.5, 1, 2, 2.5, 1, 1.5]);
    expect(new Set(RESENAS.points.map((p) => p.x)).size).toBe(4);
    const q = ex01!.questions[2]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.3 es numero con capa');
    const values = labAt(
      { ...labQuestion(projectQuestions(determinante), 'determinante.ex00.2'), lab: q.lab },
      { ix: 1, iy: 2, jx: 0, jy: 0 },
    );
    // contract: solution de ex01.3: con la capa del enunciado se funden dos parejas: 6 − 2 = 4 puntos
    expect(values.merged).toBe(2);
    // contract: guía de contenido: el laboratorio de ex01.3 no enseña la lectura merged
    expect(q.lab.readouts ?? []).not.toContain('merged');
  });

  it('ex01.5: las cifras de la capa de 768 dimensiones', () => {
    // contract: prompt de ex01.5: 0,9^768 ≈ 7·10⁻³⁶
    expect(0.9 ** 768).toBeGreaterThan(6.5e-36);
    expect(0.9 ** 768).toBeLessThan(7.5e-36);
    // contract: solution de ex01.5: 768·ln 0,9 ≈ −80,9
    expect(768 * Math.log(0.9)).toBeCloseTo(-80.9, 1);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: el determinante exacto de (1, 2; 3, 4) es −2
    expect(
      det([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(-2);
    // contract: ex02.2: los lados (1, 3) y (4, 1) desde (1, 1) dan det −11 y área 5,5
    expect(
      det([
        [1, 3],
        [4, 1],
      ]),
    ).toBe(-11);
    expect(
      Math.abs(
        det([
          [1, 3],
          [4, 1],
        ]),
      ) / 2,
    ).toBe(5.5);
    // contract: ex02.3: con a = (0, 0), b = (4, 1), c = (1, 3) el determinante es 11, positivo: c queda a la izquierda
    expect(
      det([
        [4, 1],
        [1, 3],
      ]),
    ).toBe(11);
    // contract: ex02.4: det A = 5, det B = 2, AB = (4, −2; 7, −1) con det 10
    const A: M = [
      [2, 1],
      [1, 3],
    ];
    const B: M = [
      [1, -1],
      [2, 0],
    ];
    expect([det(A), det(B), det(mul(A, B))]).toEqual([5, 2, 10]);
    expect(mul(A, B)).toEqual([
      [4, -2],
      [7, -1],
    ]);
    // contract: ex02.5: determinantes de los pesos 0,5; ~0 (filas proporcionales); 1e-9 aprox.; −1; 0,005
    expect(
      det([
        [1, 0],
        [0, 0.5],
      ]),
    ).toBe(0.5);
    expect(
      Math.abs(
        det([
          [0.3, 0.1],
          [0.9, 0.3],
        ]),
      ),
    ).toBeLessThan(1e-15);
    expect(
      Math.abs(
        det([
          [1, 2],
          [0.5, 1.000000001],
        ]) - 1e-9,
      ),
    ).toBeLessThan(1e-12);
    expect(
      det([
        [0, 1],
        [1, 0],
      ]),
    ).toBe(-1);
    expect(
      det([
        [1, 0],
        [0, 0.005],
      ]),
    ).toBe(0.005);
  });
});

describe('determinante: hojas', () => {
  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1 de matrices: código con «== 0» (línea 3), área negativa (línea 3) y una correcta (null); al menos una de código
    expect(determinante.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(determinante.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: comparar un determinante decimal con «== 0», y tomar un determinante negativo como área
    const faulty = determinante.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['aplasta = det_A == 0', 'Luego el área del paralelogramo es −5', null]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of determinante.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 2: det (1, 3; 2, 1) = 1·1 − 3·2 = −5, y el área es 5
    expect(det(cols([1, 2], [3, 1]))).toBe(-5);
    // contract: hoja 3: det(W₂W₁) = 3·(−2) = −6 con det W₁ = 3 y det W₂ = −2
    const W1: M = [
      [3, 0],
      [0, 1],
    ];
    const W2: M = [
      [1, 0],
      [0, -2],
    ];
    expect([det(W1), det(W2), det(mul(W2, W1))]).toEqual([3, -2, -6]);
  });
});

describe('banco de examen 1 del proyecto determinante', () => {
  it('tiene tres entradas fijas del proyecto determinante, con ids examen-1.*', () => {
    // contract: guía de contenido 2026-11-10 (petición de Oliver): una entrada laboratorio y una cuenta del estilo nuevo con ids nuevos; la de código se conserva («Programar» no se toca)
    expect(examen1Determinante.map((e) => e.project)).toEqual([
      'determinante',
      'determinante',
      'determinante',
    ]);
    expect(examen1Determinante.map((e) => e.question.id)).toEqual([
      'examen-1.aplastar-animales',
      'examen-1.densidad-flujo',
      'examen-1.capas-volteadas',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Determinante) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo; las generadas las añade el ensamblado
    expect(examen1Determinante.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen1Determinante.map((e) => e.question.type)).toEqual([
      'laboratorio',
      'numero',
      'codigo',
    ]);
    const projectIds = new Set(projectQuestions(determinante).map((q) => q.id));
    expect(examen1Determinante.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const animales = labQuestion(bankQuestions, 'examen-1.aplastar-animales');
    // contract: examen-1.aplastar-animales: al empezar la salida 1 es el tamaño y la neurona dice «mascota» a todos
    expect(labAt(animales).acc).toBe(0.5);
    // contract: solution: î en (0, 0) y ĵ en (1, 0) da determinante 0 y seis aciertos; también con ĵ en (1, 1)
    expect(solves(animales, { ix: 0, jx: 1, jy: 0 })).toBe(true);
    expect(solves(animales, { ix: 0, jx: 1, jy: 1 })).toBe(true);
    // contract: tentadora y mala (solution): llevar ĵ al origen aplasta, pero se pierde la domesticidad
    const lost = labAt(animales, { jy: 0 });
    expect([lost.det, lost.acc]).toEqual([0, 0.5]);
    // contract: tentadora y mala: intercambiar las columnas acierta, pero no aplasta (determinante −1)
    expect(labAt(animales, { ix: 0, iy: 1, jx: 1, jy: 0 }).det).toBe(-1);
    expect(solves(animales, { ix: 0, iy: 1, jx: 1, jy: 0 })).toBe(false);
    const densidad = bankQuestions[1]!;
    // contract: examen-1.densidad-flujo: det (2 1; 1 2) = 3 y la densidad 0,3 se divide entre 3
    expect(
      det([
        [2, 1],
        [1, 2],
      ]),
    ).toBe(3);
    expect(answerOf(densidad)).toEqual([0.1, 0]);
    expect(0.3 / 3).toBeCloseTo(0.1, 12);
  });

  it('capas-volteadas: los siete determinantes tienen dos negativos, uno cero y cuatro positivos', () => {
    const capas: M[] = [
      [
        [1, 2],
        [3, 4],
      ],
      [
        [2, 0],
        [0, 3],
      ],
      [
        [0, 1],
        [1, 0],
      ],
      [
        [1, 2],
        [2, 4],
      ],
      [
        [1, -1],
        [1, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [2, 1],
        [0, 1],
      ],
    ];
    // contract: solution de examen-1.capas-volteadas: determinantes −2, 6, −1, 0, 2, 1, 2 y dos negativos
    expect(capas.map(det)).toEqual([-2, 6, -1, 0, 2, 1, 2]);
    expect(capas.filter((m) => det(m) < 0)).toHaveLength(2);
    // contract: error típico «<= 0» cuenta 3 y «> 0» cuenta 4, ambos distintos de la respuesta
    expect(capas.filter((m) => det(m) <= 0)).toHaveLength(3);
    expect(capas.filter((m) => det(m) > 0)).toHaveLength(4);
  });
});

describe('proyecto determinante: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(determinante), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `determinante.ex02.${n}`),
      'examen-1.capas-volteadas',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
