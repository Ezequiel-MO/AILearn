import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type ManipularQ, type Question } from '../../content/schema';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { matrizVector } from './matriz-vector';
import { examen0MatrizVector } from './examen-0-matriz-vector';

const bankQuestions = examen0MatrizVector
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto matriz-vector', projectQuestions(matrizVector));
defineProseTests('banco examen-0 matriz-vector', bankQuestions);

/** A por v, con A dada por filas. */
const matVec = (rows: number[][], v: number[]): number[] =>
  rows.map((r) => r.reduce((s, a, k) => s + a * v[k]!, 0));

describe('proyecto matriz-vector', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 0 de matrices: checkProject(matrizVector) devuelve la lista vacía
    expect(checkProject(matrizVector)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 0 de matrices: id matriz-vector, nombre «Matriz por vector», subtítulo «Combinar las columnas»
    expect([matrizVector.id, matrizVector.name, matrizVector.sub]).toEqual([
      'matriz-vector',
      'Matriz por vector',
      'Combinar las columnas',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 0 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(matrizVector.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(matrizVector.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(matrizVector.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón matriz-vector.exNN.k y matriz-vector.hoja.k', () => {
    // contract: encargo de la Órbita 0 de matrices: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(matrizVector).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `matriz-vector.ex0${e}.${k}`)),
      'matriz-vector.hoja.1',
      'matriz-vector.hoja.2',
      'matriz-vector.hoja.3',
    ]);
  });

  it('los tipos de pregunta de cada ejercicio y de las hojas', () => {
    const [ex00, ex01, ex02] = matrizVector.exercises;
    // contract: encargo de la Órbita 0 de matrices: ex00 cinco manipular; ex01 vector, numero, numero, vector, opcion; ex02 cinco codigo
    expect(ex00!.questions.map((q) => q.type)).toEqual(Array(5).fill('manipular'));
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'vector',
      'numero',
      'numero',
      'vector',
      'opcion',
    ]);
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
    // contract: encargo de la Órbita 0 de matrices: tres hojas de revisión, la primera de código y las otras de texto
    expect(matrizVector.sheets.map((s) => [s.type, s.format])).toEqual([
      ['revision', 'codigo'],
      ['revision', 'texto'],
      ['revision', 'texto'],
    ]);
  });
});

const goalsOf = (q: Question): string[] =>
  q.type === 'manipular'
    ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
    : [];

describe('ex00: manipular', () => {
  const qs = matrizVector.exercises[0]!.questions as ManipularQ[];
  const img = ['img_x(i,j,v)', 'img_y(i,j,v)'];

  it('metas de cada pregunta', () => {
    // contract: diseño de ex00: A v = (4, −3); (3, 2); (3, 3); A v = (4, 3) con v = (2, 1); A v = (0, 0) con x(v) = 2
    expect(qs.map(goalsOf)).toEqual([
      [`${img[0]}=4±0.01`, `${img[1]}=-3±0.01`],
      [`${img[0]}=3±0.01`, `${img[1]}=2±0.01`],
      [`${img[0]}=3±0.01`, `${img[1]}=3±0.01`],
      [`${img[0]}=4±0.01`, `${img[1]}=3±0.01`],
      [`${img[0]}=0±0.01`, `${img[1]}=0±0.01`, 'x(v)=2±0.01'],
    ]);
  });

  it('las matrices y los vectores de partida son los del diseño', () => {
    const start = (q: ManipularQ) => q.plane.vectors.map((v) => [v.id, v.x, v.y, v.movable]);
    // contract: diseño de ex00.1: A = (2 0 / 0 3) fija (î = (2, 0), ĵ = (0, 3)) y v móvil
    expect(start(qs[0]!)).toEqual([
      ['i', 2, 0, false],
      ['j', 0, 3, false],
      ['v', 1, 1, true],
    ]);
    // contract: diseño de ex00.2: A = (1 1 / 0 1) fija (î = (1, 0), ĵ = (1, 1)) y v móvil
    expect(start(qs[1]!)).toEqual([
      ['i', 1, 0, false],
      ['j', 1, 1, false],
      ['v', 2, 1, true],
    ]);
    // contract: diseño de ex00.3: A = (1 −1 / 2 1) fija (î = (1, 2), ĵ = (−1, 1)) y v móvil
    expect(start(qs[2]!)).toEqual([
      ['i', 1, 2, false],
      ['j', -1, 1, false],
      ['v', 1, 1, true],
    ]);
    // contract: diseño de ex00.4: v = (2, 1) fijo y î, ĵ móviles desde la identidad
    expect(start(qs[3]!)).toEqual([
      ['i', 1, 0, true],
      ['j', 0, 1, true],
      ['v', 2, 1, false],
    ]);
    // contract: diseño de ex00.5: A = (2 −2 / 1 −1), de columnas paralelas, fija, y v móvil
    expect(start(qs[4]!)).toEqual([
      ['i', 2, 1, false],
      ['j', -2, -1, false],
      ['v', 1, 2, true],
    ]);
    // contract: encargo de la Órbita 0 de matrices: todas dibujan A·v (apply v) con la lectura de la matriz
    for (const q of qs) {
      expect(q.plane.transform).toEqual({ columns: ['i', 'j'], apply: ['v'] });
      expect(q.plane.readouts).toContain('matrix');
    }
  });

  it('las soluciones de la tabla cumplen las metas', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: v = (2, −1); (1, 2); (2, −1); î = (1, 1) y ĵ = (2, 1); v = (2, 2)
      [0, { v: [2, -1] }],
      [1, { v: [1, 2] }],
      [2, { v: [2, -1] }],
      [3, { i: [1, 1], j: [2, 1] }],
      [4, { v: [2, 2] }],
      // contract: otras soluciones citadas en la solution de ex00.4: î = (2, 1), ĵ = (0, 1); î = (0, 1), ĵ = (4, 1)
      [3, { i: [2, 1], j: [0, 1] }],
      [3, { i: [0, 1], j: [4, 1] }],
    ];
    for (const [n, vectors] of solved) {
      expect(
        grade(qs[n]!, { type: 'manipular', vectors }),
        `${qs[n]!.id} ${JSON.stringify(vectors)}`,
      ).toBe(true);
    }
  });

  it('las posiciones erróneas típicas no se dan por buenas', () => {
    const wrong: [number, Record<string, [number, number]>][] = [
      // contract: v = (4, −3) es el propio objetivo, sin pasar por la matriz: A v = (8, −9)
      [0, { v: [4, -3] }],
      // contract: v = (3, 2) es el objetivo sin la matriz: A v = (5, 2)
      [1, { v: [3, 2] }],
      // contract: v = (3, 3) es el objetivo sin la matriz: A v = (0, 9)
      [2, { v: [3, 3] }],
      // contract: la identidad de partida da A v = (2, 1), no (4, 3)
      [3, { i: [1, 0], j: [0, 1] }],
      // contract: el vector nulo anula A v pero incumple x(v) = 2; (1, 1) también la anula, pero con x(v) = 1
      [4, { v: [0, 0] }],
      [4, { v: [1, 1] }],
      // contract: v = (2, 1) cumple x(v) = 2 pero A v = (2, 1) no es nulo
      [4, { v: [2, 1] }],
    ];
    for (const [n, vectors] of wrong) {
      expect(
        grade(qs[n]!, { type: 'manipular', vectors }),
        `${qs[n]!.id} ${JSON.stringify(vectors)}`,
      ).toBe(false);
    }
  });

  it('las cifras de las soluciones se recalculan', () => {
    // contract: solution de ex00.1: 2·(2, 0) + (−1)·(0, 3) = (4, −3)
    expect(
      matVec(
        [
          [2, 0],
          [0, 3],
        ],
        [2, -1],
      ),
    ).toEqual([4, -3]);
    // contract: solution de ex00.2: 1·(1, 0) + 2·(1, 1) = (3, 2)
    expect(
      matVec(
        [
          [1, 1],
          [0, 1],
        ],
        [1, 2],
      ),
    ).toEqual([3, 2]);
    // contract: solution de ex00.3: 2·(1, 2) + (−1)·(−1, 1) = (3, 3); y v = (3, 3) daría (0, 9)
    expect(
      matVec(
        [
          [1, -1],
          [2, 1],
        ],
        [2, -1],
      ),
    ).toEqual([3, 3]);
    expect(
      matVec(
        [
          [1, -1],
          [2, 1],
        ],
        [3, 3],
      ),
    ).toEqual([0, 9]);
    // contract: solution de ex00.4: 2·(1, 1) + (2, 1) = (4, 3), con v = (2, 1) y columnas (1, 1) y (2, 1)
    expect(
      matVec(
        [
          [1, 2],
          [1, 1],
        ],
        [2, 1],
      ),
    ).toEqual([4, 3]);
    // contract: solution de ex00.5: 2·(2, 1) + 2·(−2, −1) = (0, 0)
    expect(
      matVec(
        [
          [2, -2],
          [1, -1],
        ],
        [2, 2],
      ),
    ).toEqual([0, 0]);
  });
});

describe('ex01: calcular', () => {
  const qs = matrizVector.exercises[1]!.questions;
  const answers = qs.map((q) => {
    if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
    if (q.type === 'opcion') return q.correct;
    return undefined;
  });

  it('respuestas y tolerancias', () => {
    // contract: diseño de ex01: (5, 8); −3; 3 componentes; (5, 1) con la capa lineal; la opción 2 (matriz de 2×3 por vector de 2) no está definida
    expect(answers).toEqual([[[5, 8], 0], [-3, 0], [3, 0], [[5, 1], 0], 2]);
  });

  it('las respuestas se recalculan con el producto matriz por vector', () => {
    // contract: ex01.1: A = (3 −1 / 2 4) por (2, 1) es (5, 8)
    expect(
      matVec(
        [
          [3, -1],
          [2, 4],
        ],
        [2, 1],
      ),
    ).toEqual([5, 8]);
    // contract: ex01.2: A = (2 −1 3 / 1 4 0) por (1, 2, −1) es (−3, 9) y la pregunta pide la primera componente
    expect(
      matVec(
        [
          [2, -1, 3],
          [1, 4, 0],
        ],
        [1, 2, -1],
      ),
    ).toEqual([-3, 9]);
    // contract: ex01.4: W x = (4, 2) y, sumando b = (1, −1), y = (5, 1)
    const wx = matVec(
      [
        [1, 0, 2],
        [-1, 3, 1],
      ],
      [2, 1, 1],
    );
    expect(wx).toEqual([4, 2]);
    expect(wx.map((c, k) => c + [1, -1][k]!)).toEqual([5, 1]);
  });

  it('la forma pedida: 3×2 por 2 componentes da 3 componentes', () => {
    // contract: ex01.3: B de 3 filas y 2 columnas por un vector de 2 componentes da un resultado de 3 componentes
    const q = qs[2]!;
    if (q.type !== 'numero') throw new Error('ex01.3 no es numero');
    expect(grade(q, { type: 'numero', value: 3 })).toBe(true);
    // contract: 2 (las columnas) es el error de contar las componentes de la entrada
    expect(grade(q, { type: 'numero', value: 2 })).toBe(false);
  });

  it('ex01.1 y ex01.4: el orden del sesgo y las columnas cambiadas no valen', () => {
    const q1 = qs[0]!;
    const q4 = qs[3]!;
    if (q1.type !== 'vector' || q4.type !== 'vector') throw new Error('no son vector');
    // contract: ex01.1: las columnas intercambiadas darían 2·(−1, 4) + (3, 2) = (1, 10)
    expect(grade(q1, { type: 'vector', value: [1, 10] })).toBe(false);
    // contract: ex01.4: sin el sesgo sale W x = (4, 2), y sumando b a x antes de multiplicar sale otro vector
    expect(grade(q4, { type: 'vector', value: [4, 2] })).toBe(false);
  });

  it('la opción correcta de ex01.5 es la de matriz 2×3 con vector de 2 componentes', () => {
    const q = qs[4]!;
    if (q.type !== 'opcion') throw new Error('ex01.5 no es opcion');
    // contract: ex01.5: el producto no definido es el de una matriz de 2 filas y 3 columnas por un vector de 2 componentes
    expect(q.options[q.correct]).toBe(
      'Una matriz de 2 filas y 3 columnas por un vector de 2 componentes',
    );
  });
});

describe('hojas', () => {
  const sheets = matrizVector.sheets;

  it('líneas erróneas: la 3.ª (A * v), la 1.ª (sesgo a la entrada) y ninguna', () => {
    // contract: diseño de las hojas: hoja 1 `w = A * v` (índice 2); hoja 2 suma el sesgo a la entrada (índice 0); hoja 3 correcta (null)
    expect(sheets.map((s) => s.faultyLine)).toEqual([2, 0, null]);
    // contract: la hoja 1 es la del `*` en vez de `@`
    expect(sheets[0]!.lines[2]).toBe('w = A * v');
  });

  it('los números de las hojas se recalculan', () => {
    // contract: hoja 2: W x = 3·(1, 0) + 1·(2, −1) = (5, −1) y y = (6, 0); sumar b antes da W (x + b) = (8, −2)
    const wx = matVec(
      [
        [1, 2],
        [0, -1],
      ],
      [3, 1],
    );
    expect(wx).toEqual([5, -1]);
    expect(wx.map((c) => c + 1)).toEqual([6, 0]);
    expect(
      matVec(
        [
          [1, 2],
          [0, -1],
        ],
        [4, 2],
      ),
    ).toEqual([8, -2]);
    // contract: hoja 3: A v por filas = (4, 5) con A = (2 1 / −1 3) y v = (1, 2)
    expect(
      matVec(
        [
          [2, 1],
          [-1, 3],
        ],
        [1, 2],
      ),
    ).toEqual([4, 5]);
  });
});

describe('banco de examen 0 de matriz-vector', () => {
  it('tiene tres entradas fijas del proyecto, con ids propios y sin chocar con el generador', () => {
    // contract: encargo de la Órbita 0 de matrices: tres entradas fijas, project matriz-vector, ids examen-0.<tema> distintos de los reservados
    expect(examen0MatrizVector.map((e) => [e.project, e.question.id])).toEqual([
      ['matriz-vector', 'examen-0.producto-valido'],
      ['matriz-vector', 'examen-0.imagen-columnas'],
      ['matriz-vector', 'examen-0.capa-lote'],
    ]);
    const reserved = [
      'examen-0.matriz-vector',
      'examen-0.producto-matrices',
      'examen-0.forma-producto',
    ];
    for (const e of examen0MatrizVector) expect(reserved).not.toContain(e.question.id);
  });

  it('las entradas pasan el esquema del banco', () => {
    for (const e of examen0MatrizVector) {
      // contract: schema.ts: toda entrada del banco cumple bankEntrySchema
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
  });

  it('mezcla de tipos: opcion, vector y codigo', () => {
    // contract: encargo de la Órbita 0 de matrices: una opcion, un vector y un codigo
    expect(examen0MatrizVector.map((e) => e.question.type)).toEqual(['opcion', 'vector', 'codigo']);
  });

  it('respuestas: la opción (entrada de 4, salida de 3) y el vector (−1, 12, 4)', () => {
    const [o, v] = examen0MatrizVector.map((e) => e.question);
    if (o?.type !== 'opcion' || v?.type !== 'vector') throw new Error('tipos inesperados');
    // contract: W de 3 filas y 4 columnas admite entradas de 4 componentes y da salidas de 3
    expect(o.options[o.correct]).toBe('Una entrada de 4 componentes y una salida de 3');
    // contract: A = (2 −1 / 0 4 / 1 1) por (1, 3) es (−1, 12, 4)
    expect(
      matVec(
        [
          [2, -1],
          [0, 4],
          [1, 1],
        ],
        [1, 3],
      ),
    ).toEqual([-1, 12, 4]);
    expect([v.answer, v.tol]).toEqual([[-1, 12, 4], 0]);
    // contract: pesos intercambiados (3 veces la primera columna y 1 la segunda) darían 3·(2, 0, 1) + (−1, 4, 1) = (5, 4, 4)
    expect(grade(v, { type: 'vector', value: [5, 4, 4] })).toBe(false);
  });
});
