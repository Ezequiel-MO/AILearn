import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { labMeasure, labStart } from '../../engine/labs';
import { capaScene } from '../../engine/labs/capa';
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
import { inversa } from './inversa';
import { examen1Inversa } from './examen-1-inversa';

const bankQuestions = examen1Inversa
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto inversa', projectQuestions(inversa));
defineProseTests('banco examen-1 inversa', bankQuestions);
defineLabProjectTests(inversa, examen1Inversa);

type M = [[number, number], [number, number]];
type V = [number, number];
const mul = (a: M, b: M): M => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
];
const det = (a: M): number => a[0][0] * a[1][1] - a[0][1] * a[1][0];
/** Inversa de 2×2 con la fórmula (1/det)·[[d, −b], [−c, a]]. */
const inv = (a: M): M => {
  const d = det(a);
  return [
    [a[1][1] / d + 0, -a[0][1] / d + 0],
    [-a[1][0] / d + 0, a[0][0] / d + 0],
  ];
};
const apply = (a: M, v: V): V => [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
const flat = (m: M): number[] => [m[0][0] + 0, m[0][1] + 0, m[1][0] + 0, m[1][1] + 0];

describe('proyecto inversa', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 1 de matrices: checkProject(inversa) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(inversa)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10): Inversa, «deshacer una capa»; el id no cambia
    expect([inversa.id, inversa.name, inversa.sub]).toEqual([
      'inversa',
      'Inversa',
      'Deshacer una capa',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 1 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(inversa.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(inversa.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(inversa.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón inversa.exNN.k e inversa.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(inversa).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `inversa.ex0${e}.${k}`)),
      'inversa.hoja.1',
      'inversa.hoja.2',
      'inversa.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

/** La capa fija del laboratorio de `q` como matriz por filas. */
const encoderOf = (spec: { before?: { i: V; j: V } }): M => {
  if (!spec.before) throw new Error('el laboratorio no tiene codificador');
  const { i, j } = spec.before;
  return [
    [i[0], j[0]],
    [i[1], j[1]],
  ];
};

describe('inversa, «Manipular»: el autoencoder se mide con el laboratorio', () => {
  const all = projectQuestions(inversa);
  const lab = (k: number) => labQuestion(all, `inversa.ex00.${k}`);
  const capa = (k: number) => {
    const spec = lab(k).lab;
    if (spec.kind !== 'capa') throw new Error('ex00 usa el laboratorio capa');
    return spec;
  };

  it('las cinco son el mismo autoencoder: las reseñas, con dianas en su sitio de entrada', () => {
    for (const k of [1, 2, 3, 4, 5]) {
      const spec = capa(k);
      // contract: brief-juego-2.md, Inversa: dianas = las posiciones originales; el jugador decodifica desde la identidad
      expect(
        spec.points.map((p) => spec.targets?.[p.id]),
        `ex00.${k}`,
      ).toEqual(spec.points.map((p) => [p.x, p.y]));
      expect([spec.i, spec.j], `ex00.${k}`).toEqual([
        [1, 0],
        [0, 1],
      ]);
    }
  });

  it('en las de reconstruir, la solución es la inversa del codificador, y cae en la rejilla', () => {
    for (const k of [1, 2, 3, 5]) {
      const q = lab(k);
      const B = encoderOf(capa(k));
      const A = inv(B);
      const state = { ix: A[0][0], iy: A[1][0], jx: A[0][1], jy: A[1][1] };
      // contract: guía de contenido 2026-11-10 (aviso del encargo de Inversa): la decodificadora es B⁻¹, con entradas múltiplos de 0,5
      expect(solves(q, state), `ex00.${k}`).toBe(true);
      expect(
        Object.values(state).every((v) => Number.isInteger(v * 2)),
        `ex00.${k}`,
      ).toBe(true);
      // contract: el estado inicial (la identidad) no reconstruye
      expect(solves(q), `ex00.${k}`).toBe(false);
    }
  });

  it('los cuadraditos del código caben en la ventana', () => {
    for (const k of [1, 2, 3, 4, 5]) {
      const spec = capa(k);
      const middle = Object.values(capaScene(spec, labStart(spec)).middle);
      // contract: brief común 2026-11-10: nada importante cae fuera de la ventana
      expect(
        middle.every((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])) <= spec.range),
        `ex00.${k}`,
      ).toBe(true);
    }
  });

  it('ex00.1: el codificador escala; arreglar solo la intensidad deja «genial» a 1 de su diana', () => {
    // contract: enunciado de ex00.1: el codificador estira a lo ancho (×2) y encoge a lo alto (×0,5)
    expect(encoderOf(capa(1))).toEqual([
      [2, 0],
      [0, 0.5],
    ]);
    // contract: solution de ex00.1: î en (0,5; 0) y ĵ en (0, 2)
    expect(solves(lab(1), { ix: 0.5, jy: 2 })).toBe(true);
    // contract: tentadora y mala (solution): solo la intensidad deja el tono a la mitad, «genial» y «horrible» a 1
    expect(labAt(lab(1), { ix: 0.5 }).target_err).toBe(1);
    // contract: tentadora y mala: aplicar otra vez el codificador aleja aún más
    expect(solves(lab(1), { ix: 2, jy: 0.5 })).toBe(false);
  });

  it('ex00.2: la cizalla se deshace moviendo solo ĵ; ningún î lo arregla', () => {
    // contract: enunciado de ex00.2: salida 1 = intensidad + tono, salida 2 = tono
    expect(encoderOf(capa(2))).toEqual([
      [1, 1],
      [0, 1],
    ]);
    // contract: solution de ex00.2: ĵ en (−1, 1)
    expect(solves(lab(2), { jx: -1 })).toBe(true);
    // contract: solution de ex00.2: «mover î no sirve»
    for (const ix of [-1, -0.5, 0, 0.5, 1.5, 2]) {
      expect(solves(lab(2), { ix }), `ix = ${ix}`).toBe(false);
    }
    // contract: hint 2 de ex00.2: «sin cambiar su altura»: con ĵ en (−1, 0) se pierde el tono
    expect(solves(lab(2), { jx: -1, jy: 0 })).toBe(false);
  });

  it('ex00.3: hay que girar y encoger; girar sin encoger deja cada palabra al doble', () => {
    // contract: enunciado de ex00.3: salida 1 = intensidad − tono, salida 2 = la suma (det 2)
    expect(encoderOf(capa(3))).toEqual([
      [1, -1],
      [1, 1],
    ]);
    const solved = { ix: 0.5, iy: -0.5, jx: 0.5, jy: 0.5 };
    // contract: solution de ex00.3: determinante de la capa 0,5 y de las dos juntas 1
    expect([labAt(lab(3), solved).det, labAt(lab(3), solved).det_total]).toEqual([0.5, 1]);
    // contract: solution de ex00.3: î en (1, −1) y ĵ en (1, 1) deja cada palabra al doble de lejos
    const twice = { ix: 1, iy: -1, jx: 1, jy: 1 };
    expect(solves(lab(3), twice)).toBe(false);
    const spec = capa(3);
    const images = capaScene(spec, twice).images;
    expect(spec.points.map((p) => images[p.id])).toEqual(
      spec.points.map((p) => [2 * p.x, 2 * p.y]),
    );
  });

  it('ex00.4: el codificador borra la intensidad; el máximo sobre toda la rejilla es 2', () => {
    // contract: enunciado de ex00.4: al empezar ninguna vuelve; todas caen en el eje vertical, a la altura de su tono
    expect(labAt(lab(4)).on_target).toBe(0);
    const spec = capa(4);
    const middle = capaScene(spec, {}).middle;
    expect(spec.points.map((p) => middle[p.id])).toEqual(spec.points.map((p) => [0, p.y]));
    // contract: solution de ex00.4: ĵ en (−1, 1) salva «malo» y «triste», con î donde quieras
    expect(solves(lab(4), { jx: -1 })).toBe(true);
    expect(solves(lab(4), { jx: -1, ix: 3, iy: -2 })).toBe(true);
    // contract: solution de ex00.4: «bueno» acaba en (−1, 1), lejos de su diana
    expect(capaScene(spec, { jx: -1 }).images.bueno).toEqual([-1, 1]);
    // contract: tentadora y mala: ĵ en (1, 1) solo salva «bueno»
    expect(labAt(lab(4), { jx: 1 }).on_target).toBe(1);
    // contract: enunciado de ex00.4 («¿cuántas puedes salvar? Consigue el máximo»): ningún estado de la rejilla salva más de 2
    const steps: number[] = [];
    for (let v = -spec.range; v <= spec.range; v += spec.snap) steps.push(v);
    let best = 0;
    for (const jx of steps)
      for (const jy of steps)
        for (const ix of steps)
          best = Math.max(best, labMeasure(spec, { ix, iy: 0, jx, jy }).on_target!);
    expect(best).toBe(2);
  });

  it('ex00.5: casi singular: columnas largas, determinante 4, y medio paso de error deja «genial» a más de 1', () => {
    // contract: enunciado de ex00.5: el codificador tiene determinante 0,25
    expect(det(encoderOf(capa(5)))).toBe(0.25);
    const solved = { ix: 2, iy: -2, jx: -2, jy: 4 };
    // contract: solution de ex00.5: î en (2, −2) y ĵ en (−2, 4), con determinante 4
    expect(solves(lab(5), solved)).toBe(true);
    expect(labAt(lab(5), solved).det).toBe(4);
    // contract: enunciado y solution de ex00.5: «malo» y «triste» a 0,25 en el código, a más de 0,7 a la salida
    const middle = capaScene(capa(5), {}).middle;
    expect(
      Math.hypot(middle.malo![0] - middle.triste![0], middle.malo![1] - middle.triste![1]),
    ).toBe(0.25);
    expect(Math.hypot(0.5, 0.5)).toBeGreaterThan(0.7);
    // contract: solution de ex00.5: ĵ en (−2; 3,5) deja «genial» a más de 1 de su diana
    expect(labAt(lab(5), { ...solved, jy: 3.5 }).target_err).toBeGreaterThan(1);
    // contract: takeaway de ex00.5: un error de 0,25 en la segunda salida del código acaba a más de 1 (columnas de casi 3 y casi 4,5)
    const A: M = [
      [2, -2],
      [-2, 4],
    ];
    expect(Math.hypot(...apply(A, [0, 0.25]))).toBeGreaterThan(1);
    expect([Math.hypot(2, -2), Math.hypot(-2, 4)].map((n) => Math.round(n * 10) / 10)).toEqual([
      2.8, 4.5,
    ]);
  });
});

describe('inversa, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01, ex02] = inversa.exercises;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 1): reseña (1, 2); no hay inversa (opción 1); det 4; 0,5·60 + 240; solve (opción 1)
    expect(ex01!.questions.map(answerOf)).toEqual([[[1, 2], 0], 1, [4, 0], [0.5 * 60 + 240, 0], 1]);
  });

  it('ex01.1: el codificador del laboratorio lleva la reseña de la respuesta al código del enunciado', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'vector' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es vector con capa');
    const A: M = [
      [q.lab.i[0], q.lab.j[0]],
      [q.lab.i[1], q.lab.j[1]],
    ];
    // contract: enunciado de ex01.1: salida 1 = intensidad − tono, salida 2 = intensidad + tono, código (−1, 3)
    expect(A).toEqual([
      [1, -1],
      [1, 1],
    ]);
    expect(apply(A, q.answer as V)).toEqual([-1, 3]);
    expect(apply(inv(A), [-1, 3])).toEqual([1, 2]);
  });

  it('ex01.2: la capa del laboratorio junta «horrible» y «triste» y tiene determinante 0', () => {
    const q = ex01!.questions[1]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.2 es opcion con capa');
    const values = labMeasure(q.lab, {});
    // contract: solution de ex01.2: determinante 0; «horrible» y «triste» caen en el mismo punto (−0,75; −0,75)
    expect(values.det).toBe(0);
    const images = capaScene(q.lab, {}).images;
    expect([images.horrible, images.triste]).toEqual([
      [-0.75, -0.75],
      [-0.75, -0.75],
    ]);
    // contract: ex01.2: la opción correcta dice que no se puede deshacer
    expect(q.options[q.correct]).toMatch(/^No:/);
  });

  it('ex01.3: la decodificadora de la normalización, construida en su laboratorio, reconstruye y tiene la respuesta de determinante', () => {
    const q = ex01!.questions[2]!;
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.3 es numero con capa');
    const B = encoderOf(q.lab);
    // contract: enunciado de ex01.3: la normalización multiplica los dos rasgos por 0,5
    expect(B).toEqual([
      [0.5, 0],
      [0, 0.5],
    ]);
    // contract: solution de ex01.3: la capa que deshace es 2·I, con determinante 4 = 1/0,25
    const values = labMeasure(q.lab, { ix: 2, jy: 2 });
    expect([values.target_err, values.det]).toEqual([0, q.answer]);
    expect(1 / det(B)).toBe(4);
    // contract: el laboratorio de ex01.3 no enseña la lectura del determinante
    expect(q.lab.readouts ?? []).not.toContain('det');
  });

  it('ex01.4: la estandarización se deshace al revés; el otro orden da 14 430', () => {
    // contract: solution de ex01.4: 0,5·60 + 240 = 270 y (0,5 + 240)·60 = 14 430
    expect(0.5 * 60 + 240).toBe(270);
    expect((0.5 + 240) * 60).toBe(14430);
    expect(ex01!.questions[3]!.solution).toContain('14\\,430');
  });

  it('ex01.5: la opción correcta es la de no construir la inversa', () => {
    const q = ex01!.questions[4]!;
    if (q.type !== 'opcion') throw new Error('ex01.5 es opcion');
    // contract: aviso del encargo de Inversa: el Pyodide del juego no lanza error con inv singular; la respuesta habla de cuentas y redondeo
    expect(q.options[q.correct]).toMatch(/sin construir la inversa/);
    expect([q.prompt, q.solution, ...q.options].join(' ')).not.toMatch(/lanza/);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 1 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('ex02: las cifras de las soluciones se recalculan', () => {
    const A1c: M = [
      [4, 3],
      [1, 1],
    ];
    // contract: ex02.1: A⁻¹ = (1, −3; −1, 4) con det = 1, y A A⁻¹ = I
    expect(flat(inv(A1c))).toEqual([1, -3, -1, 4]);
    expect(flat(mul(A1c, inv(A1c)))).toEqual([1, 0, 0, 1]);
    const A2c: M = [
      [2, 1],
      [1, 3],
    ];
    // contract: ex02.2: det = 5 y la solución de A x = (5, 10) es (1, 3)
    expect(det(A2c)).toBe(5);
    expect(apply(A2c, [1, 3])).toEqual([5, 10]);
    const A3c: M = [
      [1, 2],
      [3, 7],
    ];
    // contract: ex02.3: det = 1 y A⁻¹ = (7, −2; −3, 1); (2, 4; 1, 2) es singular
    expect(det(A3c)).toBe(1);
    expect(flat(inv(A3c))).toEqual([7, -2, -3, 1]);
    expect(
      det([
        [2, 4],
        [1, 2],
      ]),
    ).toBe(0);
    const L1: M = [
      [1, 2],
      [0, 1],
    ];
    const L2: M = [
      [1, 0],
      [1, 1],
    ];
    // contract: ex02.4: y = B A x con x = (2, 1) da (4, 5); deshaciendo en orden A⁻¹B⁻¹y se recupera (2, 1) y B⁻¹A⁻¹y da (−6, 11)
    expect(apply(L2, apply(L1, [2, 1]))).toEqual([4, 5]);
    expect(apply(inv(L1), apply(inv(L2), [4, 5]))).toEqual([2, 1]);
    expect(apply(inv(L2), apply(inv(L1), [4, 5]))).toEqual([-6, 11]);
    // contract: ex02.5: W = (2, 0, 1; 1, 1, 0; 0, 1, 1), det = 3, x = (1, 2, 3), W x = (5, 3, 5) y W x + b = (6, 2, 7) con b = (1, −1, 2)
    const W = [
      [2, 0, 1],
      [1, 1, 0],
      [0, 1, 1],
    ];
    const x = [1, 2, 3];
    const b = [1, -1, 2];
    const Wx = W.map((row) => row.reduce((s, a, k) => s + a * x[k]!, 0));
    expect(Wx).toEqual([5, 3, 5]);
    expect(Wx.map((v, k) => v + b[k]!)).toEqual([6, 2, 7]);
    const d3 =
      W[0]![0]! * (W[1]![1]! * W[2]![2]! - W[1]![2]! * W[2]![1]!) -
      W[0]![1]! * (W[1]![0]! * W[2]![2]! - W[1]![2]! * W[2]![0]!) +
      W[0]![2]! * (W[1]![0]! * W[2]![1]! - W[1]![1]! * W[2]![0]!);
    expect(d3).toBe(3);
  });
});

describe('inversa: hojas', () => {
  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 1 de matrices: fórmula sin intercambiar a y d (línea 3), (AB)⁻¹ = A⁻¹B⁻¹ (línea 3) y una correcta (null); al menos una de código
    expect(inversa.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(inversa.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'codigo',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: la fórmula con la diagonal sin intercambiar, el producto de inversas en el orden de A y B, y una hoja correcta
    const faulty = inversa.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Ainv = np.array([[A[0, 0], -A[0, 1]], [-A[1, 0], A[1, 1]]]) / det',
      'Luego (AB)⁻¹ = A⁻¹B⁻¹, con las inversas en el mismo orden que A y B',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of inversa.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    const A: M = [
      [3, 1],
      [5, 2],
    ];
    // contract: hoja 1: det = 3·2 − 1·5 = 1 y la inversa es (2, −1; −5, 3); la línea dada, sin intercambiar a y d, da (3, −1; −5, 2), que no es la inversa
    expect(det(A)).toBe(1);
    expect(flat(inv(A))).toEqual([2, -1, -5, 3]);
    expect(
      flat(
        mul(A, [
          [3, -1],
          [-5, 2],
        ]),
      ),
    ).not.toEqual([1, 0, 0, 1]);
    const Ak: M = [
      [2, 0],
      [0, 3],
    ];
    const Bk: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: hoja 2: (AB)⁻¹ = B⁻¹A⁻¹ y no A⁻¹B⁻¹ (comprobado con dos matrices cuyos productos no conmutan)
    expect(flat(inv(mul(Ak, Bk)))).toEqual(flat(mul(inv(Bk), inv(Ak))));
    expect(flat(inv(mul(Ak, Bk)))).not.toEqual(flat(mul(inv(Ak), inv(Bk))));
    // contract: hoja 3: W = (2, 1; 1, 3), b = (1, −1), y = (6, 9); y − b = (5, 10) y W⁻¹(y − b) = (1, 3); sin quitar el sesgo saldría otra entrada
    const W: M = [
      [2, 1],
      [1, 3],
    ];
    expect(apply(inv(W), [5, 10])).toEqual([1, 3]);
    expect(apply(W, [1, 3]).map((v, k) => v + [1, -1][k]!)).toEqual([6, 9]);
    expect(apply(inv(W), [6, 9])).not.toEqual([1, 3]);
  });
});

describe('banco de examen 1 del proyecto inversa', () => {
  it('tiene tres entradas fijas del proyecto inversa, con ids examen-1.*', () => {
    // contract: guía de contenido 2026-11-10: una entrada laboratorio y una cuenta del estilo nuevo; la de código se conserva («Programar» no se toca); sin usar `examen-1.resolver-sistema`
    expect(examen1Inversa.map((e) => e.project)).toEqual(['inversa', 'inversa', 'inversa']);
    expect(examen1Inversa.map((e) => e.question.id)).toEqual([
      'examen-1.decodificar-correos',
      'examen-1.recuperar-correo',
      'examen-1.sistema-en-codigo',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen1Inversa) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un vector y un codigo; las generadas las añade el ensamblado
    expect(examen1Inversa.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen1Inversa.map((e) => e.question.type)).toEqual(['laboratorio', 'vector', 'codigo']);
    const projectIds = new Set(projectQuestions(inversa).map((q) => q.id));
    expect(examen1Inversa.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('decodificar-correos: otro codificador (un giro) con otros datos; su inversa es la traspuesta', () => {
    const q = labQuestion(bankQuestions, 'examen-1.decodificar-correos');
    if (q.lab.kind !== 'capa') throw new Error('capa');
    const B = encoderOf(q.lab);
    // contract: enunciado de decodificar-correos: el codificador gira un cuarto de vuelta (antihorario)
    expect(B).toEqual([
      [0, -1],
      [1, 0],
    ]);
    // contract: solution: î en (0, −1) y ĵ en (1, 0), la traspuesta de B
    expect(solves(q, { ix: 0, iy: -1, jx: 1, jy: 0 })).toBe(true);
    expect(flat(inv(B))).toEqual([B[0][0], B[1][0], B[0][1], B[1][1]]);
    // contract: solution: «premio», codificado en (−1, 3), vuelve a (3, 1)
    expect(capaScene(q.lab, {}).middle.premio).toEqual([-1, 3]);
    // contract: tentadora y mala (solution): girar otra vez en el mismo sentido deja cada correo al otro lado del origen
    expect(solves(q, { ix: 0, iy: 1, jx: -1, jy: 0 })).toBe(false);
    expect(capaScene(q.lab, { ix: 0, iy: 1, jx: -1, jy: 0 }).images.premio).toEqual([-3, -1]);
    // contract: el estado inicial no reconstruye
    expect(solves(q)).toBe(false);
  });

  it('recuperar-correo: el código (4; 1,5) viene del correo (2,5; 1,5)', () => {
    const A: M = [
      [1, 1],
      [0, 1],
    ];
    // contract: solution de recuperar-correo: salida 1 = enlaces + saludos, salida 2 = saludos; A·(2,5; 1,5) = (4; 1,5)
    expect(apply(A, [2.5, 1.5])).toEqual([4, 1.5]);
    expect(answerOf(bankQuestions[1]!)).toEqual([[2.5, 1.5], 0]);
  });

  it('sistema-en-codigo: A = (3, 1; 1, 2) tiene det 5 y la solución es (1, 2)', () => {
    const A: M = [
      [3, 1],
      [1, 2],
    ];
    // contract: solution de examen-1.sistema-en-codigo: det = 5, x = A⁻¹(5, 5) = (1, 2) y A x = (5, 5)
    expect(det(A)).toBe(5);
    expect(apply(A, [1, 2])).toEqual([5, 5]);
  });
});

describe('proyecto inversa: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(inversa), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `inversa.ex02.${n}`),
      'examen-1.sistema-en-codigo',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
