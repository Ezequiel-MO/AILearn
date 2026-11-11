import { describe, expect, it } from 'vitest';
import { grade } from '../../content/grade';
import { checkLab } from '../../content/validate';
import type { LabQ, NumeroQ, OpcionQ, Question } from '../../content/schema';
import { labStart, type LabState } from '../../engine/labs';
import { capaScene } from '../../engine/labs/capa';
import { labAt, labQuestion, solves } from '../../../tests/content/lab-helpers';
import { defineProseTests } from '../../../tests/content/prose-helpers';
import { launch } from './despegue';
import { matrices } from './index';
import { transformPlane } from './plane';

// Reglas generales de prosa: el despegue de matrices pasa por las mismas que el de vectores.
defineProseTests('Despegue de matrices', launch);

const byId = <T extends Question>(id: string): T => {
  const q = launch.find((x) => x.id === id);
  if (!q) throw new Error(`No existe la pregunta ${id}`);
  return q as T;
};

describe('el juego «Matrices y transformaciones»', () => {
  it('se llama así, tiene 10 preguntas de despegue y las Órbitas 0, 1 y 2', () => {
    // contract: encargo T2 (2026-10-17): id `matrices`, título «Matrices y transformaciones», despegue de 10 preguntas
    expect([matrices.id, matrices.title, matrices.launch.length]).toEqual([
      'matrices',
      'Matrices y transformaciones',
      10,
    ]);
    // contract: primera entrega del juego 2 (2026-10-17): despegue y Órbita 0 «La máquina»; README: la siguiente es
    // «El área» (determinante, inversa, rango), entregada el 2026-10-20, «Direcciones propias» (autovectores, simétricas, PCA), entregada el 2026-10-26,
    // y «Descomponer y aproximar» (SVD, rango bajo y LoRA, atención), entregada el 2026-11-02, la última de src/games/roadmap.ts
    expect(matrices.orbits.map((o) => o.name)).toEqual([
      'La máquina',
      'El área',
      'Direcciones propias',
      'Descomponer y aproximar',
    ]);
  });

  it('el despegue sigue la secuencia del encargo: tipos en orden', () => {
    // contract: cambio de contrato pedido por Oliver el 2026-11-10 (brief-juego-2.md, «Despegue»): 3 y 5 pasan a laboratorio, 1, 2 y 4 son cuentas de una capa, 6 y 10 decisiones; 7 a 9, el código de siempre
    expect(launch.map((q) => q.type)).toEqual([
      'numero',
      'numero',
      'laboratorio',
      'numero',
      'laboratorio',
      'opcion',
      'codigo',
      'codigo',
      'codigo',
      'opcion',
    ]);
    // contract: ids despegue.1 a despegue.10, como en el juego 1 (se conservan: el progreso guardado los nombra)
    expect(launch.map((q) => q.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `despegue.${i + 1}`),
    );
  });
});

const labs = launch.filter((q): q is LabQ => q.type === 'laboratorio');
const notCode = launch.filter((q) => q.type !== 'codigo');
const within = (n: number, min: number, max: number): boolean => n >= min && n <= max;

describe('despegue de matrices: reglas de la guía de contenido con laboratorios', () => {
  it('ninguna pregunta es manipular y hay dos laboratorios', () => {
    // contract: guía de contenido 2026-11-10, regla 1 (petición de Oliver): datos de IA a la vista; brief-juego-2.md: dos laboratorios en el despegue
    expect(launch.filter((q) => q.type === 'manipular').map((q) => q.id)).toEqual([]);
    expect(labs.map((q) => q.id)).toEqual(['despegue.3', 'despegue.5']);
  });

  it('los dos laboratorios pasan checkLab', () => {
    // contract: CLAUDE.md, «Contenido»: solved alcanzable y cumple, el estado inicial no, y cada meta nombra una métrica medida
    expect(labs.flatMap((q) => checkLab(q))).toEqual([]);
  });

  it('ninguna meta es una posición disfrazada y ningún rótulo lleva su número', () => {
    const goals = labs.flatMap((q) => q.goals.map((g) => [q.id, g.metric, g.label] as const));
    // contract: guía de contenido 2026-11-10, regla 2: la meta es una consecuencia, nunca m11…m22
    expect(goals.filter(([, m]) => /^m\d\d$/.test(m))).toEqual([]);
    // contract: guía de contenido 2026-11-10: `label` dice qué se mide; el medidor ya enseña el objetivo
    expect(goals.filter(([, , label]) => /\d/.test(label))).toEqual([]);
  });

  it('las palabras caben en la ventana, al empezar y resuelto', () => {
    const out = labs.flatMap((q) => {
      const spec = q.lab;
      if (spec.kind !== 'capa') return [`${q.id} no es un laboratorio capa`];
      const states: [string, LabState][] = [
        ['al empezar', labStart(spec)],
        ['resuelto', { ...labStart(spec), ...q.solved }],
      ];
      return states.flatMap(([when, state]) =>
        Object.entries(capaScene(spec, state).images)
          .filter(([, p]) => Math.max(Math.abs(p[0]), Math.abs(p[1])) > spec.range)
          .map(([id]) => `${q.id}: «${id}» fuera de la ventana ${when}`),
      );
    });
    // contract: revisión de la Órbita 2 (lo fijo cabe en la vista), llevada a los laboratorios: lo que no se ve no enseña
    expect(out).toEqual([]);
  });

  it('enunciado, pistas, explicación y solución caben en su presupuesto', () => {
    for (const q of notCode) {
      // contract: guía de contenido del juego 3 («Menos tedio», sigue en pie): prompt 420, 2 pistas de 220, explain 380, solution 480
      expect(q.prompt.length, `${q.id} prompt`).toBeLessThanOrEqual(420);
      expect(q.hints.length, `${q.id} hints`).toBe(2);
      for (const h of q.hints) expect(h.length, `${q.id} hint`).toBeLessThanOrEqual(220);
      expect(q.explain.length, `${q.id} explain`).toBeLessThanOrEqual(380);
      expect(q.solution.length, `${q.id} solution`).toBeLessThanOrEqual(480);
    }
  });

  it('toda pregunta que no es de código lleva purpose dentro de su presupuesto', () => {
    for (const q of notCode) {
      if (!('purpose' in q) || !q.purpose) throw new Error(`${q.id} no lleva purpose`);
      const { why, aim, takeaway } = q.purpose;
      // contract: encargo común 2026-11-10 (purpose en toda pregunta de «Manipular» y «Calcular»); presupuestos de «Menos tedio»: why 60 a 300, aim 60 a 200, takeaway 60 a 260
      expect(within(why.length, 60, 300), `${q.id} why ${why.length}`).toBe(true);
      expect(within(aim.length, 60, 200), `${q.id} aim ${aim.length}`).toBe(true);
      expect(within(takeaway.length, 60, 260), `${q.id} takeaway ${takeaway.length}`).toBe(true);
    }
  });
});

describe('despegue.1 y despegue.2: la matriz de una capa', () => {
  it('despegue.1: una capa de 3 entradas y 2 salidas tiene 6 pesos, no 5', () => {
    const q = byId<NumeroQ>('despegue.1');
    // contract: brief-juego-2.md, Despegue (2026-11-10): «cuántos números tiene la matriz de una capa de 3 entradas y 2 salidas»: 2 filas por 3 columnas
    expect(grade(q, { type: 'numero', value: 2 * 3 })).toBe(true);
    // contract: solution de despegue.1: sumar filas y columnas (5) es el error típico
    expect(grade(q, { type: 'numero', value: 2 + 3 })).toBe(false);
  });

  it('despegue.2: el tono pesa −3 en la salida 2 (fila 2, columna 2); el 2 es su peso en la salida 1', () => {
    const q = byId<NumeroQ>('despegue.2');
    // contract: enunciado de despegue.2: W = (0,5 2 −1 / 1 −3 0), columnas intensidad, tono, longitud
    expect(q.prompt).toContain('\\begin{pmatrix}0{,}5&2&-1\\\\1&-3&0\\end{pmatrix}');
    // contract: fila 2 (salida 2), columna 2 (tono) de esa W
    expect(grade(q, { type: 'numero', value: -3 })).toBe(true);
    // contract: solution de despegue.2: el 2 es el peso del tono en la salida 1 (fila y columna cambiadas)
    expect(grade(q, { type: 'numero', value: 2 })).toBe(false);
  });
});

describe('despegue.3: tu primera capa, una columna que mueve todas las palabras', () => {
  const q = labQuestion(launch, 'despegue.3');

  it('al empezar, a la neurona le llega la intensidad y dice «positiva» de las cuatro', () => {
    // contract: enunciado de despegue.3: «Ahora le llega la intensidad, y lo dice de todas» (acierta 2 de 4, la mitad)
    expect([labAt(q).hits, labAt(q).acc]).toEqual([2, 0.5]);
    // contract: enunciado de despegue.3: «Mueve ĵ»: solo se arrastra la columna del tono
    expect(q.lab.kind === 'capa' && q.lab.movable).toBe('j');
  });

  it('el tono pesando 1,5 o más resuelve, a cualquier altura de ĵ', () => {
    // contract: solution de despegue.3: ĵ en (1,5; 1)
    expect(solves(q, { jx: 1.5 })).toBe(true);
    // contract: regla 3 de la guía (varias soluciones) y solution: «cualquier altura de ĵ y cualquier peso del tono desde 1,5»
    expect(solves(q, { jx: 2, jy: 0 })).toBe(true);
    expect(solves(q, { jx: 3, jy: -1 })).toBe(true);
  });

  it('con el tono pesando 1, «horrible» sigue en el lado positivo y «malo» queda en la frontera', () => {
    // contract: tentadora y mala (solution de despegue.3): «Con 1 no basta»; la frontera no cuenta como acierto, así que siguen 2 de 4
    expect(solves(q, { jx: 1 })).toBe(false);
    expect(labAt(q, { jx: 1 }).hits).toBe(2);
    if (q.lab.kind !== 'capa') throw new Error('despegue.3 usa el laboratorio capa');
    const images = capaScene(q.lab, { ...labStart(q.lab), jx: 1 }).images;
    // contract: solution de despegue.3: «malo» (1, −1) cae en la salida 1 = 1 − 1 = 0, y «horrible», en 2,5 − 2 = 0,5
    expect([images.malo?.[0], images.horrible?.[0]]).toEqual([0, 0.5]);
  });
});

describe('despegue.4: la salida de una neurona para «genial»', () => {
  const q = byId<NumeroQ>('despegue.4');
  const row1 = [1, 1.5]; // contract: enunciado de despegue.4: fila 1 de A = (1, 1,5)
  const genial = [2.5, 2]; // contract: RESENAS_CUATRO en datos.ts: «genial» con intensidad 2,5 y tono 2

  it('es el producto escalar de la fila 1 con la palabra: 5,5; con la columna 1 saldría 2,5', () => {
    // contract: brief-juego-2.md, Despegue: «la salida de una neurona para genial (producto escalar de su fila con la palabra)»
    expect(grade(q, { type: 'numero', value: row1[0]! * genial[0]! + row1[1]! * genial[1]! })).toBe(
      true,
    );
    // contract: solution de despegue.4: usar la primera columna (1, 0) en vez de la fila da 2,5
    expect(grade(q, { type: 'numero', value: 1 * 2.5 + 0 * 2 })).toBe(false);
  });

  it('en el laboratorio, esa capa deja «genial» en (5,5; 2) y la neurona acierta las cuatro', () => {
    if (q.lab?.kind !== 'capa') throw new Error('despegue.4 lleva un laboratorio capa');
    const state = { ...labStart(q.lab), ix: 1, iy: 0, jx: 1.5, jy: 1 };
    // contract: solution de despegue.4: con î en (1, 0) y ĵ en (1,5; 1), «genial» cae en (5,5; 2), dentro de la ventana
    expect(capaScene(q.lab, state).images.genial).toEqual([5.5, 2]);
    expect(q.lab.range).toBeGreaterThanOrEqual(5.5);
    // contract: enunciado de despegue.4: «Una capa que hace acertar a la neurona»
    expect(labAt({ ...labQuestion(launch, 'despegue.3'), lab: q.lab }, state).acc).toBe(1);
  });
});

describe('despegue.5: una capa que borra el tono', () => {
  const q = labQuestion(launch, 'despegue.5');

  it('al empezar, la capa hace acertar a la neurona con las cuatro y no funde ninguna pareja', () => {
    const start = labAt(q);
    // contract: enunciado de despegue.5: «Esta capa hace acertar a la neurona con las cuatro reseñas»
    expect([start.acc, start.merged]).toEqual([1, 0]);
  });

  it('ĵ en el origen funde dos parejas, con î donde sea, y la neurona baja a la mitad', () => {
    // contract: solution de despegue.5: ĵ en (0, 0) e î en (1, 1): «genial» con «horrible» en (2,5; 2,5) y «bueno» con «malo» en (1, 1); la neurona acierta dos de cuatro
    expect(solves(q, { iy: 1, jx: 0, jy: 0 })).toBe(true);
    expect(labAt(q, { iy: 1, jx: 0, jy: 0 }).acc).toBe(0.5);
    if (q.lab.kind !== 'capa') throw new Error('despegue.5 usa el laboratorio capa');
    const images = capaScene(q.lab, { ...labStart(q.lab), iy: 1, jx: 0, jy: 0 }).images;
    expect([images.genial, images.horrible, images.bueno, images.malo]).toEqual([
      [2.5, 2.5],
      [2.5, 2.5],
      [1, 1],
      [1, 1],
    ]);
    // contract: regla 3 de la guía (varias soluciones) y solution: «î puede ir a cualquier sitio»
    expect(solves(q, { jx: 0, jy: 0 })).toBe(true);
    expect(solves(q, { ix: 0, iy: 1, jx: 0, jy: 0 })).toBe(true);
    expect(solves(q, { ix: -2, iy: 1.5, jx: 0, jy: 0 })).toBe(true);
  });

  it('borrar la intensidad o poner ĵ sobre la recta de î no funde ninguna pareja', () => {
    // contract: tentadora y mala (solution de despegue.5): «Borrar la intensidad no funde ninguna pareja»
    expect(labAt(q, { ix: 0, iy: 0 }).merged).toBe(0);
    // contract: tentadora y mala (pista 2 y solution): ĵ sobre la recta de î aplasta el plano (det 0) pero deja las palabras separadas
    const inLine = labAt(q, { jx: 1, jy: 0 });
    expect([inLine.det, inLine.merged]).toEqual([0, 0]);
  });
});

describe('despegue.6: lo que ninguna matriz puede hacer', () => {
  const q = byId<OpcionQ>('despegue.6');

  it('«normal», con los dos rasgos a 0, se queda en el origen con cualquier capa', () => {
    if (q.lab?.kind !== 'capa') throw new Error('despegue.6 lleva un laboratorio capa');
    const spec = q.lab;
    const layers = [
      { ix: 1, iy: 0, jx: 0, jy: 2 },
      { ix: 2, iy: -1, jx: 1.5, jy: 3 },
      { ix: 0, iy: 0, jx: 0, jy: 0 },
    ];
    for (const layer of layers) {
      const at = capaScene(spec, { ...labStart(spec), ...layer }).images.normal;
      // contract: solution de despegue.6: 0·î + 0·ĵ = (0, 0) con cualquier matriz
      expect(at?.map((c) => Math.abs(c))).toEqual([0, 0]);
    }
    // contract: solution de despegue.6: la respuesta es mover «normal»
    expect(q.options[q.correct]).toContain('«normal»');
  });

  it('las otras tres sí las hace una matriz: ĵ en el origen junta «genial» y «horrible»', () => {
    if (q.lab?.kind !== 'capa') throw new Error('despegue.6 lleva un laboratorio capa');
    const images = capaScene(q.lab, { ...labStart(q.lab), jx: 0, jy: 0 }).images;
    // contract: solution de despegue.6: «llevarla al origen junta genial y horrible»
    expect(images.genial).toEqual(images.horrible);
  });
});

describe('despegue.10: forma de la matriz de pesos', () => {
  it('3 puntuaciones y 768 componentes dan (3, 768)', () => {
    const q = byId<OpcionQ>('despegue.10');
    // contract: encargo T2, pregunta 10: 768 componentes a 3 puntuaciones → matriz (3, 768)
    expect(q.options[q.correct]).toBe('`(3, 768)`');
  });
});

describe('transformPlane', () => {
  it('por defecto: identidad, ids i y j, etiquetas î y ĵ, fijos y sin lecturas', () => {
    const p = transformPlane();
    // contract: encargo T2: î y ĵ con ids `i` y `j`, a (1,0) y (0,1) salvo que se den otros
    expect(p.vectors).toEqual([
      { id: 'i', label: 'î', x: 1, y: 0, movable: false },
      { id: 'j', label: 'ĵ', x: 0, y: 1, movable: false },
    ]);
    expect(p.transform).toEqual({ columns: ['i', 'j'] });
    expect(p.readouts).toEqual([]);
    // contract: valores por defecto documentados en plane.ts: rango 3 y paso 1
    expect([p.range, p.snap]).toEqual([3, 1]);
  });

  it('acepta posiciones, vectores extra, apply y lecturas', () => {
    const p = transformPlane({
      i: [2, 1],
      j: [-1, 0],
      movable: true,
      extra: [{ id: 'v', label: 'v', x: 1, y: 1, movable: false }],
      apply: ['v'],
      readouts: ['matrix', 'det'],
      range: 4,
      snap: 0.5,
    });
    // contract: encargo T2: opciones de posición, extra, apply y lecturas pasan tal cual al PlaneSpec
    expect(p.vectors.map((v) => [v.id, v.x, v.y, v.movable])).toEqual([
      ['i', 2, 1, true],
      ['j', -1, 0, true],
      ['v', 1, 1, false],
    ]);
    expect(p.transform).toEqual({ columns: ['i', 'j'], apply: ['v'] });
    expect(p.readouts).toEqual(['matrix', 'det']);
    expect([p.range, p.snap]).toEqual([4, 0.5]);
  });
});
