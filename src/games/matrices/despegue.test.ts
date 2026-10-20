import { describe, expect, it } from 'vitest';
import { grade } from '../../content/grade';
import type { ManipularQ, OpcionQ, Question, VectorQ } from '../../content/schema';
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
  it('se llama así, tiene 10 preguntas de despegue y las Órbitas 0 y 1', () => {
    // contract: encargo T2 (2026-10-17): id `matrices`, título «Matrices y transformaciones», despegue de 10 preguntas
    expect([matrices.id, matrices.title, matrices.launch.length]).toEqual([
      'matrices',
      'Matrices y transformaciones',
      10,
    ]);
    // contract: primera entrega del juego 2 (2026-10-17): despegue y Órbita 0 «La máquina»; README: la siguiente es
    // «El área» (determinante, inversa, rango), entregada el 2026-10-20; las demás órbitas llegan después
    expect(matrices.orbits.map((o) => o.name)).toEqual(['La máquina', 'El área']);
  });

  it('el despegue sigue la secuencia del encargo: tipos en orden', () => {
    // contract: encargo T2, secuencia sugerida de 10 preguntas
    expect(launch.map((q) => q.type)).toEqual([
      'opcion',
      'numero',
      'manipular',
      'vector',
      'manipular',
      'opcion',
      'codigo',
      'codigo',
      'codigo',
      'opcion',
    ]);
    // contract: ids despegue.1 a despegue.10, como en el juego 1
    expect(launch.map((q) => q.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `despegue.${i + 1}`),
    );
  });
});

describe('despegue.1 y despegue.2: leer una matriz', () => {
  it('despegue.1: la matriz mostrada es de 2 filas y 3 columnas', () => {
    const q = byId<OpcionQ>('despegue.1');
    // contract: encargo T2, pregunta 1: la matriz mostrada es 2×3 (dos filas con tres números: 2 -1 0 / 3 4 5)
    expect(q.prompt).toContain('\\begin{pmatrix}2&-1&0\\\\3&4&5\\end{pmatrix}');
    // contract: filas × columnas de esa matriz: 2 filas y 3 columnas
    expect(q.options[q.correct]).toBe('2 filas y 3 columnas');
  });

  it('despegue.2: b21 de la matriz mostrada es 7 (fila 2, columna 1), no -2 (b12)', () => {
    const q = byId('despegue.2');
    if (q.type !== 'numero') throw new Error('despegue.2 no es numero');
    // contract: matriz B = (5 -2 / 7 1 / 0 4): la fila 2 empieza por 7
    expect(grade(q, { type: 'numero', value: 7 })).toBe(true);
    // contract: b12 = -2 es el error de poner los subíndices al revés
    expect(grade(q, { type: 'numero', value: -2 })).toBe(false);
    // contract: B tiene 3 filas y 2 columnas, como pide la prosa de la solución
    expect(q.prompt).toContain('\\begin{pmatrix}5&-2\\\\7&1\\\\0&4\\end{pmatrix}');
  });
});

describe('despegue.3: estirar el plano al doble en horizontal', () => {
  const q = byId<ManipularQ>('despegue.3');
  const vectors = (i: [number, number], j: [number, number]) => ({ i, j });

  it('î en (2, 0) y ĵ en (0, 1) resuelven', () => {
    // contract: encargo T2, pregunta 3: goals î=(2,0), ĵ=(0,1)
    expect(grade(q, { type: 'manipular', vectors: vectors([2, 0], [0, 1]) })).toBe(true);
  });

  it('la identidad de partida y un giro no resuelven', () => {
    // contract: la posición inicial (identidad) no resuelve el ejercicio
    expect(grade(q, { type: 'manipular', vectors: vectors([1, 0], [0, 1]) })).toBe(false);
    // contract: estirar en vertical (î=(1,0), ĵ=(0,2)) es otra transformación
    expect(grade(q, { type: 'manipular', vectors: vectors([1, 0], [0, 2]) })).toBe(false);
    // contract: estirar los dos ejes (î=(2,0), ĵ=(0,2)) tampoco es lo pedido
    expect(grade(q, { type: 'manipular', vectors: vectors([2, 0], [0, 2]) })).toBe(false);
  });

  it('el plano arranca en la identidad, con î y ĵ móviles y la lectura de la matriz', () => {
    const [i, j] = q.plane.vectors;
    // contract: encargo T2: î y ĵ movibles, arrancan en (1,0) y (0,1), etiquetas î y ĵ
    expect([i?.label, i?.x, i?.y, i?.movable]).toEqual(['î', 1, 0, true]);
    expect([j?.label, j?.x, j?.y, j?.movable]).toEqual(['ĵ', 0, 1, true]);
    // contract: encargo T2: lectura `matrix` con transform sobre i y j
    expect(q.plane.readouts).toEqual(['matrix']);
    expect(q.plane.transform?.columns).toEqual(['i', 'j']);
  });
});

describe('despegue.4: la matriz de una transformación dibujada', () => {
  const q = byId<VectorQ>('despegue.4');

  it('î va a (1, 1) y ĵ a (-1, 1) en el plano estático', () => {
    // contract: encargo T2, pregunta 4: î→(1,1), ĵ→(−1,1), sin vectores móviles
    expect(q.plane?.vectors.map((v) => [v.id, v.x, v.y, v.movable])).toEqual([
      ['i', 1, 1, false],
      ['j', -1, 1, false],
    ]);
  });

  it('la respuesta es la matriz por filas con las imágenes como columnas', () => {
    // contract: columnas (1,1) y (-1,1) → matriz (1 -1 / 1 1), que por filas es [1, -1, 1, 1]
    expect(q.shape).toEqual([2, 2]);
    expect(grade(q, { type: 'vector', value: [1, -1, 1, 1] })).toBe(true);
    // contract: la traspuesta (imágenes puestas como filas) es el error típico y no vale
    expect(grade(q, { type: 'vector', value: [1, 1, -1, 1] })).toBe(false);
  });
});

describe('despegue.5: un cuarto de vuelta en sentido antihorario', () => {
  const q = byId<ManipularQ>('despegue.5');

  it('î en (0, 1) y ĵ en (-1, 0) resuelven', () => {
    // contract: encargo T2, pregunta 5: î→(0,1), ĵ→(−1,0)
    expect(grade(q, { type: 'manipular', vectors: { i: [0, 1], j: [-1, 0] } })).toBe(true);
  });

  it('el giro horario y la identidad no resuelven', () => {
    // contract: el cuarto de vuelta horario lleva î a (0,-1) y ĵ a (1,0): es el sentido contrario
    expect(grade(q, { type: 'manipular', vectors: { i: [0, -1], j: [1, 0] } })).toBe(false);
    // contract: la identidad de partida no resuelve
    expect(grade(q, { type: 'manipular', vectors: { i: [1, 0], j: [0, 1] } })).toBe(false);
  });
});

describe('despegue.6: lo que una transformación lineal no puede hacer', () => {
  it('la correcta es mover el origen', () => {
    const q = byId<OpcionQ>('despegue.6');
    // contract: encargo T2, pregunta 6: la respuesta correcta es mover el origen
    expect(q.options[q.correct]).toContain('Mover el origen');
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
