import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type LabQ, type Question } from '../../content/schema';
import type { LabState } from '../../engine/labs';
import { capaScene } from '../../engine/labs/capa';
import {
  defineLabProjectTests,
  labAt,
  labQuestion,
  solves,
} from '../../../tests/content/lab-helpers';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { matrizVector } from './matriz-vector';
import { examen0MatrizVector } from './examen-0-matriz-vector';

const bankQuestions = examen0MatrizVector
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto matriz-vector', projectQuestions(matrizVector));
defineProseTests('banco examen-0 matriz-vector', bankQuestions);
defineLabProjectTests(matrizVector, examen0MatrizVector);

/** A por v, con A dada por filas. */
const matVec = (rows: number[][], v: number[]): number[] =>
  rows.map((r) => r.reduce((s, a, k) => s + a * v[k]!, 0));

/**
 * Todos los estados de las dos columnas en la rejilla de 0,5 dentro de ±range. Se recorre ±3 (28 561
 * capas): la rejilla entera de ±5 no cabe en el plazo de una prueba. Que la solución sea única, o el
 * máximo de ex00.5, valen en toda la rejilla por la cuenta que da cada `solution`; aquí se comprueban en ±3.
 */
const allLayers = (range: number): LabState[] => {
  const steps: number[] = [];
  for (let k = -2 * range; k <= 2 * range; k++) steps.push(k / 2);
  return steps.flatMap((ix) =>
    steps.flatMap((iy) => steps.flatMap((jx) => steps.map((jy) => ({ ix, iy, jx, jy })))),
  );
};

describe('proyecto matriz-vector', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 0 de matrices: checkProject(matrizVector) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(matrizVector)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10): Matriz por vector, «lo que le pasa a una palabra»; el id no cambia
    expect([matrizVector.id, matrizVector.name, matrizVector.sub]).toEqual([
      'matriz-vector',
      'Matriz por vector',
      'Lo que le pasa a una palabra',
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
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(matrizVector).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `matriz-vector.ex0${e}.${k}`)),
      'matriz-vector.hoja.1',
      'matriz-vector.hoja.2',
      'matriz-vector.hoja.3',
    ]);
  });

  it('los tipos de pregunta de cada ejercicio y de las hojas', () => {
    const [ex00, ex01, ex02] = matrizVector.exercises;
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 0): ex00 cinco laboratorios; ex01 vector, numero, vector, opcion, numero; ex02 cinco codigo
    expect(ex00!.questions.map((q) => q.type)).toEqual(Array(5).fill('laboratorio'));
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'vector',
      'numero',
      'vector',
      'opcion',
      'numero',
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

describe('matriz-vector, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(matrizVector);
  const lab = (k: number) => labQuestion(all, `matriz-vector.ex00.${k}`);

  it('ex00.1: «genial» empieza fuera de su diana; ĵ en (0,5; 1,5) la lleva, y solo esa colocación', () => {
    // contract: enunciado de ex00.1: al empezar, «genial» no está en su diana
    expect(labAt(lab(1)).on_target).toBe(0);
    // contract: solution de ex00.1: ĵ en (0,5; 1,5) lleva «genial» a (3,5; 3)
    expect(solves(lab(1), { jx: 0.5, jy: 1.5 })).toBe(true);
    // contract: solution de ex00.1: «es la única colocación» (î está fija; la diana fija los dos números de ĵ)
    const steps = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => k / 2);
    const found = steps.flatMap((jx) =>
      steps.filter((jy) => solves(lab(1), { jx, jy })).map((jy) => [jx, jy]),
    );
    expect(found).toEqual([[0.5, 1.5]]);
    // contract: tentadora y mala (pista 1): mover ĵ lo que le falta a «genial», (1, 1), la pasa de largo, porque «genial» se mueve el doble
    expect(solves(lab(1), { jx: 1, jy: 2 })).toBe(false);
  });

  it('ex00.2: acertar con «bueno» deja a «malo» fuera; las dos dianas fijan una sola capa', () => {
    // contract: enunciado de ex00.2: al empezar, ninguna de las dos en su diana
    expect(labAt(lab(2)).on_target).toBe(0);
    // contract: solution de ex00.2: î en (0, 1) y ĵ en (2, 0)
    expect(solves(lab(2), { ix: 0, iy: 1, jx: 2, jy: 0 })).toBe(true);
    // contract: enunciado de ex00.2 («prueba a acertar con una sola»): ĵ en (1, 1) lleva «bueno» a su diana y deja a «malo» fuera
    expect(labAt(lab(2), { jx: 1, jy: 1 }).on_target).toBe(1);
    // contract: solution de ex00.2: «No hay otra» (dos ejemplos de rasgos distintos fijan la matriz)
    expect(allLayers(3).filter((s) => solves(lab(2), s))).toEqual([{ ix: 0, iy: 1, jx: 2, jy: 0 }]);
  });

  it('ex00.3: llevar «bueno» a su diana con ĵ sola no basta; hay varias capas que cumplen las dos metas', () => {
    const start = labAt(lab(3));
    // contract: enunciado de ex00.3: al empezar «bueno» no está en su diana y la neurona falla (dice «positiva» a todo)
    expect([start.on_target, start.acc]).toEqual([0, 0.5]);
    // contract: solution de ex00.3: î en (0, 1) y ĵ en (1, 1)
    expect(solves(lab(3), { ix: 0, iy: 1, jx: 1, jy: 1 })).toBe(true);
    // contract: solution de ex00.3: también î en (0; 0,5) con ĵ en (1; 1,5)
    expect(solves(lab(3), { ix: 0, iy: 0.5, jx: 1, jy: 1.5 })).toBe(true);
    // contract: tentadora y mala (pista 1 y solution): ĵ en (0, 2) lleva «bueno» a su diana, pero la neurona sigue diciendo «positiva» a todo
    const tempting = labAt(lab(3), { jx: 0, jy: 2 });
    expect([tempting.on_target, tempting.acc]).toEqual([1, 0.5]);
    // contract: brief-juego-2.md, Matriz por vector 3: «muchas capas valen para un ejemplo»: varias en la rejilla cumplen las dos metas
    expect(allLayers(3).filter((s) => solves(lab(3), s)).length).toBeGreaterThan(5);
  });

  it('ex00.4: la capa de 45° por √2 traduce las tres; fijada con «gato» y «casa», «perro» cae sola', () => {
    // contract: enunciado de ex00.4: al empezar ninguna palabra está en su traducción
    expect(labAt(lab(4)).on_target).toBe(0);
    // contract: solution de ex00.4: î en (1, 1) y ĵ en (−1, 1)
    expect(solves(lab(4), { ix: 1, iy: 1, jx: -1, jy: 1 })).toBe(true);
    // contract: takeaway de ex00.4: «basta fijarla con dos, y la tercera cae sola»: toda capa que lleva «gato» y «casa» a su diana lleva también «perro»
    const spec = lab(4).lab;
    if (spec.kind !== 'capa') throw new Error('ex00.4 usa capa');
    const targets: Record<string, [number, number]> = { gato: [0.5, 2.5], casa: [-3, 1] };
    const two: LabQ = { ...lab(4), lab: { ...spec, targets } };
    const fitTwo = allLayers(3).filter((s) => labAt(two, s).on_target === 2);
    expect(fitTwo).toEqual([{ ix: 1, iy: 1, jx: -1, jy: 1 }]);
    // contract: tentadora y mala: girar 90° sin estirar (î en (0, 1), ĵ en (−1, 0)) no traduce
    expect(solves(lab(4), { ix: 0, iy: 1, jx: -1, jy: 0 })).toBe(false);
  });

  it('ex00.5: empieza acertando con poca holgura; la diana de «malo» deja como máximo 1', () => {
    const start = labAt(lab(5));
    // contract: enunciado de ex00.5: «ya acierta las seis», con «bueno» y «malo» muy cerca de la frontera (0,5), y «malo» fuera de su diana
    expect([start.acc, start.margin, start.on_target]).toEqual([1, 0.5, 0]);
    // contract: solution de ex00.5: ĵ en (1, 0) resuelve, con holgura 1
    expect(solves(lab(5), { jx: 1 })).toBe(true);
    expect(labAt(lab(5), { jx: 1 }).margin).toBe(1);
    // contract: solution de ex00.5: también î en (0,5; 1,5) con ĵ en (1,5; 0)
    expect(solves(lab(5), { ix: 0.5, iy: 1.5, jx: 1.5, jy: 0 })).toBe(true);
    // contract: tentadora y mala (solution): ĵ en (2, 0) sube la holgura a 2, pero «malo» sale de su diana
    const far = labAt(lab(5), { jx: 2 });
    expect([far.margin, far.on_target]).toEqual([2, 0]);
    // contract: takeaway de ex00.5 (el límite): con «malo» en su diana, ninguna capa de la rejilla da más holgura que 1
    const onTarget = allLayers(3).filter((s) => labAt(lab(5), s).on_target === 1);
    expect(Math.max(...onTarget.map((s) => labAt(lab(5), s).margin!))).toBe(1);
  });
});

describe('matriz-vector, «Calcular»: las respuestas se recalculan', () => {
  const qs = matrizVector.exercises[1]!.questions;
  const answers = qs.map((q) => {
    if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
    if (q.type === 'opcion') return q.correct;
    return undefined;
  });

  it('respuestas y tolerancias', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 0): logits (−1, 2); 3,25; forma (32, 128); «perro» (índice 1); 300 pares
    expect(answers).toEqual([[[-1, 2], 0], [3.25, 0], [[32, 128], 0], 1, [300, 0]]);
  });

  it('ex01.1: W·«triste» + b, y el laboratorio es W sin el sesgo', () => {
    const q = qs[0]!;
    if (q.type !== 'vector' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es vector con capa');
    const triste = q.lab.points.find((p) => p.id === 'triste')!;
    const W = [
      [0, 1],
      [1, -1],
    ];
    // contract: enunciado de ex01.1: W = (0 1; 1 −1), b = (0,5; −1) y «triste» = (1,5; −1,5)
    expect([triste.x, triste.y]).toEqual([1.5, -1.5]);
    const wx = matVec(W, [triste.x, triste.y]);
    // contract: solution de ex01.1: W x = (−1,5; 3) y, con el sesgo, (−1, 2)
    expect(wx).toEqual([-1.5, 3]);
    expect(wx.map((c, k) => c + [0.5, -1][k]!)).toEqual([-1, 2]);
    // contract: «en el laboratorio, la capa es W»: î y ĵ son sus columnas, y «triste» cae en W x
    expect([q.lab.i, q.lab.j]).toEqual([
      [0, 1],
      [1, -1],
    ]);
    // contract: sin el sesgo sale W x, que no es la respuesta
    expect(grade(q, { type: 'vector', value: [-1.5, 3] })).toBe(false);
  });

  it('ex01.2: la segunda fila por «horrible»', () => {
    // contract: ex01.2: A = (1 0,5; 0,5 −1) y «horrible» = (2,5; −2): A x = (1,5; 3,25)
    expect(
      matVec(
        [
          [1, 0.5],
          [0.5, -1],
        ],
        [2.5, -2],
      ),
    ).toEqual([1.5, 3.25]);
  });

  it('ex01.3: (32×384)·(384×128) = 32×128, con 4096 números', () => {
    // contract: solution de ex01.3: 32 filas y 128 columnas, 32·128 = 4096
    expect(32 * 128).toBe(4096);
    // contract: las filas y las columnas en otro orden no valen
    const q = qs[2]!;
    if (q.type !== 'vector') throw new Error('ex01.3 es vector');
    expect(grade(q, { type: 'vector', value: [128, 32] })).toBe(false);
  });

  it('ex01.4: «perro» es el que más activa la neurona 2·tamaño + domesticidad', () => {
    const q = qs[3]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.4 es opcion con capa');
    const act = Object.fromEntries(q.lab.points.map((p) => [p.label, 2 * p.x + p.y]));
    // contract: solution de ex01.4: perro 5, oso 4,5, gato 4,5, tigre 2,5
    expect([act['perro'], act['oso'], act['gato'], act['tigre']]).toEqual([5, 4.5, 4.5, 2.5]);
    expect(q.options[q.correct]).toBe('«perro»');
    // contract: pista 2 y solution de ex01.4: con î en (2, 0) y ĵ en (1, 1), la salida 1 es la activación y «perro» queda la más a la derecha, en x = 5, dentro de la ventana
    const spec = q.lab;
    const { images } = capaScene(spec, { ix: 2, iy: 0, jx: 1, jy: 1 });
    const rightmost = Object.entries(images).sort((a, b) => b[1][0] - a[1][0])[0]!;
    expect([rightmost[0], rightmost[1][0]]).toEqual(['perro', 5]);
    const inside = Object.values(images).every(
      ([x, y]) => Math.max(Math.abs(x), Math.abs(y)) <= spec.range,
    );
    expect(inside).toBe(true);
  });

  it('ex01.5: 300·300 pesos entre 300 condiciones por par', () => {
    // contract: solution de ex01.5: 90 000 pesos, 300 pares; en 2×2, 4 pesos y 2 pares
    expect(300 * 300).toBe(90000);
    expect((300 * 300) / 300).toBe(300);
    expect((2 * 2) / 2).toBe(2);
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
    // contract: guía de contenido 2026-11-10 (petición de Oliver): un laboratorio y una cuenta del estilo nuevo con ids nuevos; la de código se conserva
    expect(examen0MatrizVector.map((e) => [e.project, e.question.id])).toEqual([
      ['matriz-vector', 'examen-0.dianas-animales'],
      ['matriz-vector', 'examen-0.logits-correo'],
      ['matriz-vector', 'examen-0.capa-lote'],
    ]);
    const reserved = [
      'examen-0.matriz-vector',
      'examen-0.producto-matrices',
      'examen-0.forma-producto',
    ];
    for (const e of examen0MatrizVector) expect(reserved).not.toContain(e.question.id);
    const projectIds = new Set(projectQuestions(matrizVector).map((q) => q.id));
    // contract: los ids del banco no chocan con los del proyecto
    expect(examen0MatrizVector.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('las entradas pasan el esquema del banco', () => {
    for (const e of examen0MatrizVector) {
      // contract: schema.ts: toda entrada del banco cumple bankEntrySchema
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
  });

  it('mezcla de tipos: laboratorio, vector y codigo', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, una cuenta (vector) y el codigo que ya había
    expect(examen0MatrizVector.map((e) => e.question.type)).toEqual([
      'laboratorio',
      'vector',
      'codigo',
    ]);
  });

  it('respuestas del banco', () => {
    const dianas = labQuestion(bankQuestions, 'examen-0.dianas-animales');
    // contract: examen-0.dianas-animales: al empezar ni «gato» ni «lobo» están en su diana
    expect(labAt(dianas).on_target).toBe(0);
    // contract: solution: î en (0, 1) y ĵ en (1, 0), «la única capa que cumple los dos ejemplos»
    expect(allLayers(3).filter((s) => solves(dianas, s))).toEqual([{ ix: 0, iy: 1, jx: 1, jy: 0 }]);
    // contract: explain: acertar con una sola deja la otra lejos (î en (2,5; 1) con ĵ en el origen lleva a «gato» y no a «lobo»)
    expect(labAt(dianas, { ix: 2.5, iy: 1, jx: 0, jy: 0 }).on_target).toBe(1);
    const logits = bankQuestions[1]!;
    if (logits.type !== 'vector') throw new Error('examen-0.logits-correo es vector');
    const wx = matVec(
      [
        [1, -1],
        [-1, 1],
      ],
      [3, 1],
    );
    // contract: solution de examen-0.logits-correo: W x = (2, −2) y, con b = (0; 0,5), (2; −1,5)
    expect(wx).toEqual([2, -2]);
    expect(wx.map((c, k) => c + [0, 0.5][k]!)).toEqual([2, -1.5]);
    expect([logits.answer, logits.tol]).toEqual([[2, -1.5], 0]);
    // contract: sin el sesgo sale (2, −2), que no vale
    expect(grade(logits, { type: 'vector', value: [2, -2] })).toBe(false);
  });
});
