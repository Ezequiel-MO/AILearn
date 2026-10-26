import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
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

type V = [number, number];
type M = [[number, number], [number, number]];
/** Producto C·v de una matriz 2×2 por un vector. */
const apply = (c: M, v: V): V => [c[0][0] * v[0] + c[0][1] * v[1], c[1][0] * v[0] + c[1][1] * v[1]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1];
/** Cociente vᵀCv / vᵀv. */
const rayleigh = (c: M, v: V): number => dot(v, apply(c, v)) / dot(v, v);
/** Ángulo en grados entre v y C·v. */
const angleWith = (c: M, v: V): number => {
  const w = apply(c, v);
  return (Math.acos(dot(v, w) / Math.sqrt(dot(v, v) * dot(w, w))) * 180) / Math.PI;
};
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

describe('proyecto pca', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 2 de matrices: checkProject(pca) devuelve la lista vacía
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
    // contract: encargo de la Órbita 2 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
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

const goalsOf = (q: Question): string[] =>
  q.type === 'manipular'
    ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
    : [];

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

/** Covarianzas fijas de las cuatro primeras preguntas de manipular. */
const C33: M = [
  [3, 1],
  [1, 3],
];
const C41: M = [
  [4, 0],
  [0, 1],
];
const C2m: M = [
  [2, -1],
  [-1, 2],
];

describe('valores de la tabla del proyecto pca', () => {
  const [ex00, ex01, ex02] = pca.exercises;
  const manip = (k: number) => {
    const q = ex00!.questions[k]!;
    if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
    return q;
  };

  it('ex00: metas de cada manipular', () => {
    // contract: encargo de la Órbita 2 de matrices (P3-pca): rayleigh 4; rayleigh 4; rayleigh 3; rayleigh de u 4 y proj de p sobre u 2,83; x de î 3, y de ĵ 3, ángulo 0 y rayleigh 5
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['rayleigh(i,j,v)=4±0.01'],
      ['rayleigh(i,j,v)=4±0.01'],
      ['rayleigh(i,j,v)=3±0.01'],
      ['rayleigh(i,j,u)=4±0.01', 'proj(p,u)=2.83±0.01'],
      ['x(i)=3±0.01', 'y(j)=3±0.01', 'img_angle(i,j,v)=0±0.5', 'rayleigh(i,j,v)=5±0.01'],
    ]);
  });

  it('ex00: las matrices de los planos son las covarianzas del encargo, con la elipse imagen', () => {
    const shape = ex00!.questions.map((q, k) => {
      const p = manip(k).plane;
      return [
        p.vectors.map((v) => `${v.id}=(${v.x}, ${v.y}) ${v.movable}`),
        p.readouts,
        p.range,
        p.snap,
        p.transform?.apply,
        p.circle,
        p.circleImage,
        p.pair,
        q.id,
      ];
    });
    // contract: encargo de la Órbita 2 de matrices (P3-pca): C = (3 1; 1 3), (4 0; 0 1), (2 −1; −1 2) y (3 1; 1 3) en las columnas î y ĵ, v móvil desde (1, 0), (1, 1), (1, 1) y u desde (0, 1) con p = (3, 1) fijo; en la última î y ĵ móviles desde la identidad y v = (1, 1) fijo; circle 1 y circleImage
    expect(shape).toEqual([
      [
        ['i=(3, 1) false', 'j=(1, 3) false', 'v=(1, 0) true'],
        ['matrix', 'rayleigh'],
        3,
        1,
        ['v'],
        1,
        true,
        undefined,
        'pca.ex00.1',
      ],
      [
        ['i=(4, 0) false', 'j=(0, 1) false', 'v=(1, 1) true'],
        ['rayleigh'],
        3,
        1,
        ['v'],
        1,
        true,
        undefined,
        'pca.ex00.2',
      ],
      [
        ['i=(2, -1) false', 'j=(-1, 2) false', 'v=(1, 1) true'],
        ['rayleigh', 'image'],
        3,
        1,
        ['v'],
        1,
        true,
        undefined,
        'pca.ex00.3',
      ],
      [
        ['i=(3, 1) false', 'j=(1, 3) false', 'p=(3, 1) false', 'u=(0, 1) true'],
        ['rayleigh', 'projection'],
        3,
        1,
        ['u'],
        1,
        true,
        ['p', 'u'],
        'pca.ex00.4',
      ],
      [
        ['i=(1, 0) true', 'j=(0, 1) true', 'v=(1, 1) false'],
        ['matrix', 'img_angle', 'rayleigh'],
        3,
        1,
        ['v'],
        1,
        true,
        undefined,
        'pca.ex00.5',
      ],
    ]);
  });

  it('ex00: las posiciones de las soluciones cumplen las metas y recalculan la varianza', () => {
    // contract: solution de cada pregunta: v sobre la recta de (1, 1) (también (2, 2) y (−1, −1)); v sobre el eje x; v sobre la recta de (1, −1); u múltiplo positivo de (1, 1); î = (3, 2) y ĵ = (2, 3)
    const solved: [number, string, V][] = [
      [0, 'v', [1, 1]],
      [0, 'v', [2, 2]],
      [0, 'v', [-1, -1]],
      [1, 'v', [1, 0]],
      [1, 'v', [-2, 0]],
      [2, 'v', [1, -1]],
      [2, 'v', [-2, 2]],
      [3, 'u', [1, 1]],
      [3, 'u', [2, 2]],
    ];
    const target = [4, 4, 4, 4, 4, 3, 3, 4, 4];
    const mats: M[] = [C33, C33, C33, C41, C41, C2m, C2m, C33, C33];
    solved.forEach(([k, id, v], n) => {
      const q = manip(k);
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors: { [id]: v } }), `${q.id} ${v}`).toBe(true);
      // contract: encargo de la Órbita 2 de matrices: el cociente vᵀCv/vᵀv de la solución es el de la meta, recalculado a mano
      expect(rayleigh(mats[n]!, v), `${q.id} ${v}`).toBeCloseTo(target[n]!, 9);
    });
    // contract: solution de ex00.5: con î = (3, 2) y ĵ = (2, 3), A·(1, 1) = (5, 5) (ángulo 0) y el cociente vale (6 + 2 + 2)/2 = 5
    const A: M = [
      [3, 2],
      [2, 3],
    ];
    expect(grade(manip(4), { type: 'manipular', vectors: { i: [3, 2], j: [2, 3] } })).toBe(true);
    expect(apply(A, [1, 1])).toEqual([5, 5]);
    expect(angleWith(A, [1, 1])).toBeCloseTo(0, 6);
    expect(rayleigh(A, [1, 1])).toBe(5);
    // contract: solution de ex00.5: autovalores 5 y 1, y la primera componente explica 5/6 ≈ 83 %
    expect(eig2(A)).toEqual([1, 5]);
    expect(5 / (5 + 1)).toBeCloseTo(0.8333, 4);
  });

  it('ex00: las posiciones erróneas didácticas no se dan por buenas', () => {
    // contract: el error didáctico de cada pregunta: la posición de partida, la dirección perpendicular a la máxima, el promedio 2,5, la mínima, la componente con el sentido contrario, y una diagonal sin la covarianza pedida
    const wrong: [number, Record<string, V>][] = [
      [0, { v: [1, 0] }],
      [0, { v: [1, -1] }],
      [1, { v: [1, 1] }],
      [1, { v: [0, 1] }],
      [2, { v: [1, 1] }],
      [2, { v: [1, 0] }],
      [3, { u: [0, 1] }],
      [3, { u: [-1, -1] }],
      [3, { u: [1, -1] }],
      [4, { i: [3, 0], j: [0, 3] }],
      [4, { i: [3, 3], j: [3, 3] }],
      [4, { i: [3, 1], j: [1, 3] }],
      [4, { i: [2, 2], j: [2, 3] }],
      [4, { i: [3, 2], j: [2, 2] }],
    ];
    for (const [k, vectors] of wrong) {
      const q = manip(k);
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
    // contract: cada error se explica con su valor recalculado: 3, 2, 2,5, 1, 1 y 2 en las preguntas 1 a 4
    expect(rayleigh(C33, [1, 0])).toBe(3);
    expect(rayleigh(C33, [1, -1])).toBe(2);
    expect(rayleigh(C41, [1, 1])).toBe(2.5);
    expect(rayleigh(C41, [0, 1])).toBe(1);
    expect(rayleigh(C2m, [1, 1])).toBe(1);
    expect(rayleigh(C2m, [1, 0])).toBe(2);
    // contract: P3-pca ex00.4: con u = (−1, −1) la proyección de p = (3, 1) sale −2,83
    expect(dot([3, 1], [-1, -1]) / Math.sqrt(2)).toBeCloseTo(-2.83, 2);
    expect(dot([3, 1], [1, 1]) / Math.sqrt(2)).toBeCloseTo(2.83, 2);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: encargo de la Órbita 2 de matrices (P3-pca): primer dato centrado (−2, −3); 75; 2; 3; opción 2 (nada seguro)
    expect(ex01!.questions.map(answerOf)).toEqual([[[-2, -3], 0], [75, 0], [2, 0], [3, 0], 2]);
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'vector',
      'numero',
      'numero',
      'numero',
      'opcion',
    ]);
  });

  it('ex01: las respuestas se recalculan', () => {
    // contract: ex01.1: datos (2, 3), (4, 5), (6, 10): media (4, 6) y primer dato centrado (−2, −3)
    const datos: V[] = [
      [2, 3],
      [4, 5],
      [6, 10],
    ];
    const media = [0, 1].map((a) => datos.reduce((s, p) => s + p[a]!, 0) / datos.length);
    expect(media).toEqual([4, 6]);
    expect([datos[0]![0] - media[0]!, datos[0]![1] - media[1]!]).toEqual([-2, -3]);
    // contract: ex01.2: autovalores 6 y 2: la primera explica 6/8 = 75 %
    expect((6 / (6 + 2)) * 100).toBe(75);
    // contract: ex01.3: (0,6; 0,8) · (2, 1) = 1,2 + 0,8 = 2, con u de norma 1
    expect(dot([0.6, 0.8], [2, 1])).toBeCloseTo(2, 12);
    expect(Math.hypot(0.6, 0.8)).toBeCloseTo(1, 12);
    // contract: ex01.4: autovalores 5, 3, 1,5 y 0,5 (total 10): acumulados 50 %, 80 % y 95 %; hacen falta 3 para el 90 %
    const vals = [5, 3, 1.5, 0.5];
    const total = vals.reduce((s, v) => s + v, 0);
    let acum = 0;
    const acumulados = vals.map((v) => (acum += v) / total);
    expect(acumulados).toEqual([0.5, 0.8, 0.95, 1]);
    expect(acumulados.findIndex((a) => a >= 0.9) + 1).toBe(3);
  });

  it('ex01.5: la opción correcta es la que dice que no se puede concluir nada seguro', () => {
    const q = ex01!.questions[4]!;
    // contract: encargo de la Órbita 2 de matrices (P3-pca): la correcta es «nada seguro», porque el mapa descarta la varianza de las otras direcciones
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      'Nada seguro: el mapa descarta la varianza de las otras direcciones, y en ellas pueden diferir mucho',
    );
    expect(q.type === 'opcion' ? q.options.length : 0).toBe(4);
  });

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
    // contract: encargo de la Órbita 2 de matrices (P3-pca): 3 entradas `{ project: 'pca', question }` con ids examen-2.coordenada-componente, examen-2.signo-componente y examen-2.componentes-para-95
    expect(examen2Pca.map((e) => e.project)).toEqual(['pca', 'pca', 'pca']);
    expect(examen2Pca.map((e) => e.question.id)).toEqual([
      'examen-2.coordenada-componente',
      'examen-2.signo-componente',
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
    // contract: encargo de la Órbita 2 de matrices: tres fijas, un número, una opción y un código; ids únicos en el juego
    expect(examen2Pca.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen2Pca.map((e) => e.question.type)).toEqual(['numero', 'opcion', 'codigo']);
    const projectIds = new Set(projectQuestions(pca).map((q) => q.id));
    expect(examen2Pca.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [coord, signo] = examen2Pca.map((e) => e.question);
    // contract: examen-2.coordenada-componente: dato (4, 6) − media (1, 2) = (3, 4); 0,6·3 + 0,8·4 = 5
    expect(coord!.type === 'numero' ? [coord!.answer, coord!.tol] : []).toEqual([5, 0]);
    expect(dot([0.6, 0.8], [4 - 1, 6 - 2])).toBeCloseTo(5, 12);
    // contract: examen-2.coordenada-componente: sin centrar saldría 0,6·4 + 0,8·6 = 7,2
    expect(dot([0.6, 0.8], [4, 6])).toBeCloseTo(7.2, 12);
    // contract: examen-2.signo-componente: la opción correcta es la 2, «ninguno»
    expect(
      signo!.type === 'opcion' ? [signo!.correct, signo!.options[signo!.correct]] : [],
    ).toEqual([
      2,
      'Ninguno: las dos describen la misma recta, y el signo de una componente es arbitrario',
    ]);
    // contract: examen-2.signo-componente: una covarianza con autovector (0,6; 0,8) y autovalor 5 (5·uuᵀ + vvᵀ) lo tiene también en su opuesto
    const A: M = [
      [2.44, 1.92],
      [1.92, 3.56],
    ];
    const u: V = [0.6, 0.8];
    const w = apply(A, u);
    expect(w[0]).toBeCloseTo(5 * 0.6, 9);
    expect(w[1]).toBeCloseTo(5 * 0.8, 9);
    const wn = apply(A, [-0.6, -0.8]);
    expect(wn[0]).toBeCloseTo(5 * -0.6, 9);
    expect(wn[1]).toBeCloseTo(5 * -0.8, 9);
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
