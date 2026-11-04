import { describe, expect, it } from 'vitest';
import { grade } from '../../content/grade';
import type { CurvaQ, NumeroQ, OpcionQ, Question } from '../../content/schema';
import { gameProblems } from '../../content/validate';
import { curveAt, curveSlope, mseBest } from '../../engine/curves';
import { defineProseTests } from '../../../tests/content/prose-helpers';
import { launch } from './despegue';
import { gradiente } from './index';

// Reglas generales de prosa: el despegue de gradiente pasa por las mismas que los de los otros juegos.
defineProseTests('Despegue de gradiente', launch);

const byId = <T extends Question>(id: string): T => {
  const q = launch.find((x) => x.id === id);
  if (!q) throw new Error(`No existe la pregunta ${id}`);
  return q as T;
};

describe('el juego «Derivadas y gradiente»', () => {
  it('se llama así, tiene 8 preguntas de despegue y todavía ninguna órbita', () => {
    // contract: encargo del despegue del juego 3 (2026-11-04) y roadmap.ts: id `gradiente`, título «Derivadas y gradiente»
    expect([gradiente.id, gradiente.title, gradiente.launch.length]).toEqual([
      'gradiente',
      'Derivadas y gradiente',
      8,
    ]);
    // contract: encargo del despegue del juego 3: «orbits: [] (la Órbita 0 llega en otro encargo)»
    expect(gradiente.orbits).toEqual([]);
  });

  it('su bigPicture nombra la pérdida, el gradiente y la actualización', () => {
    // contract: encargo del despegue del juego 3: piezas `loss`, `gradient`, `update`
    expect(gradiente.bigPicture?.parts).toEqual(['loss', 'gradient', 'update']);
  });

  it('el despegue sigue la secuencia del encargo: tipos en orden', () => {
    // contract: encargo del despegue del juego 3, secuencia de 8 preguntas
    expect(launch.map((q) => q.type)).toEqual([
      'curva',
      'numero',
      'numero',
      'curva',
      'opcion',
      'curva',
      'codigo',
      'codigo',
    ]);
    // contract: ids despegue.1 a despegue.8, como en los otros juegos
    expect(launch.map((q) => q.id)).toEqual(
      Array.from({ length: 8 }, (_, i) => `despegue.${i + 1}`),
    );
  });

  it('sin problemas de esquema, alcanzabilidad ni posición inicial', () => {
    // contract: reglas de contenido de CLAUDE.md: las metas de `curva` son alcanzables y no están resueltas al empezar
    expect(gameProblems(gradiente)).toEqual([]);
  });
});

describe('despegue.1: la pendiente de una recta', () => {
  const q = byId<CurvaQ>('despegue.1');
  const at = (b: [number, number]) => grade(q, { type: 'curva', points: { b } });

  it('B en (1, 3), (2, 5) o (3, 7) dan pendiente 2 con A en (0, 1)', () => {
    // contract: A = (0, 1); la subida es el doble que el avance: (3−1)/1 = (5−1)/2 = (7−1)/3 = 2
    expect(at([1, 3])).toBe(true);
    expect(at([2, 5])).toBe(true);
    expect(at([3, 7])).toBe(true);
  });

  it('la posición inicial (pendiente 1) y una recta que baja no resuelven', () => {
    // contract: B arranca en (1, 2): pendiente (2−1)/1 = 1
    expect(at([1, 2])).toBe(false);
    // contract: B en (2, 1): pendiente (1−1)/2 = 0
    expect(at([2, 1])).toBe(false);
    // contract: B en (1, 0): pendiente (0−1)/1 = −1
    expect(at([1, 0])).toBe(false);
  });

  it('A es fijo, B es móvil y se lee la recta con su triángulo', () => {
    // contract: encargo del despegue, pregunta 1: A fijo, B móvil, lectura `line`
    expect(q.graph.points.map((p) => [p.id, p.movable])).toEqual([
      ['a', false],
      ['b', true],
    ]);
    expect(q.graph.readouts).toEqual(['line']);
  });
});

describe('despegue.2 y despegue.3: pendiente y tasa de cambio con figura', () => {
  it('despegue.2: la recta 9 − 3x pasa por P(1, 6) y Q(3, 0) y su pendiente es −3', () => {
    const q = byId<NumeroQ>('despegue.2');
    if (q.graph?.curve?.kind !== 'poly') throw new Error('despegue.2 sin recta');
    const curve = q.graph.curve;
    // contract: cálculo aparte con NumPy: f(1) = 9 − 3 = 6, f(3) = 9 − 9 = 0, pendiente (0 − 6)/(3 − 1) = −3
    expect([curveAt(curve, 1), curveAt(curve, 3)]).toEqual([6, 0]);
    expect(grade(q, { type: 'numero', value: -3 })).toBe(true);
    // contract: el signo cambiado (3) es el error de olvidar que la recta baja
    expect(grade(q, { type: 'numero', value: 3 })).toBe(false);
  });

  it('despegue.2: la figura no lleva la lectura de la pendiente', () => {
    const q = byId<NumeroQ>('despegue.2');
    // contract: guía del juego 3, «Visual primero»: en una figura estática no va la lectura que da la respuesta
    expect(q.graph?.readouts).toEqual(['coords']);
    expect(q.graph?.tangent).toBeUndefined();
  });

  it('despegue.3: la pérdida pasa de 9 a 1 entre los pasos 0 y 4 y baja 2 por paso', () => {
    const q = byId<NumeroQ>('despegue.3');
    if (q.graph?.curve?.kind !== 'poly') throw new Error('despegue.3 sin curva');
    const curve = q.graph.curve;
    // contract: cálculo aparte con NumPy: 0,25·(t − 6)² vale 9 en t = 0 y 1 en t = 4; (9 − 1)/4 = 2
    expect([curveAt(curve, 0), curveAt(curve, 4)]).toEqual([9, 1]);
    expect(grade(q, { type: 'numero', value: 2 })).toBe(true);
    // contract: 9 − 1 = 8 es la bajada total, no la tasa por paso
    expect(grade(q, { type: 'numero', value: 8 })).toBe(false);
    // contract: guía del juego 3: sin la lectura de la pendiente en la figura
    expect(q.graph.readouts).toEqual(['coords']);
  });
});

describe('despegue.4, 5 y 6: la pérdida de ŷ = w·x sobre unos datos', () => {
  const q4 = byId<CurvaQ>('despegue.4');
  const q5 = byId<OpcionQ>('despegue.5');
  const q6 = byId<CurvaQ>('despegue.6');
  const curveOf = (g: { curve?: { kind: string } } | undefined) => {
    const c = g?.curve;
    if (c?.kind !== 'mse') throw new Error('la figura no lleva una pérdida mse');
    return c as Extract<NonNullable<CurvaQ['graph']['curve']>, { kind: 'mse' }>;
  };

  it('las tres preguntas usan los mismos datos y su mínimo cae en w = 1,5', () => {
    const c4 = curveOf(q4.graph);
    // contract: cálculo aparte con NumPy: Σxy / Σxx = 45 / 30 = 1,5 con x = (1, 2, 3, 4) e y = (2, 2, 5, 6)
    expect(mseBest(c4)).toBe(1.5);
    // contract: la pérdida en el mínimo es la media de (0,5², 1², 0,5², 0²) = 0,375
    expect(curveAt(c4, 1.5)).toBe(0.375);
    // contract: el mismo hilo: las preguntas 5 y 6 dibujan la misma pérdida que la 4
    expect(curveOf(q5.graph).data).toEqual(c4.data);
    expect(curveOf(q6.graph).data).toEqual(c4.data);
  });

  it('despegue.4: w = 1,5 resuelve; los vecinos de la rejilla y la partida no', () => {
    const at = (x: number) => grade(q4, { type: 'curva', points: { p: [x, 0] } });
    // contract: la pérdida mínima es 0,375, en w = 1,5
    expect(at(1.5)).toBe(true);
    // contract: a un paso de rejilla (0,1) la pérdida vale 0,375 + 7,5·0,01 = 0,45, fuera de la tolerancia de 0,01
    expect(at(1.4)).toBe(false);
    expect(at(1.6)).toBe(false);
    // contract: w = 0,5 es la posición inicial, con pérdida 7,875
    expect(at(0.5)).toBe(false);
  });

  it('despegue.4: el panel de ajuste sigue al punto, y la ventana enseña toda la parábola', () => {
    // contract: encargo del despegue, pregunta 4: curva mse con fit sobre el punto móvil
    expect(q4.graph.fit).toEqual({ of: 'p' });
    // contract: L(0) = L(3) = 17,25 < 18: la parábola cabe entera entre w = 0 y 3
    expect(curveAt(curveOf(q4.graph), 0)).toBe(17.25);
    expect(curveAt(curveOf(q4.graph), 3)).toBe(17.25);
    expect(q4.graph.y[1]).toBeGreaterThan(17.25);
  });

  it('despegue.5: en w = 2,5 la pendiente es 15 (sube a la derecha), así que hay que ir a la izquierda', () => {
    const c = curveOf(q5.graph);
    // contract: cálculo aparte con NumPy: L′(w) = 15·(w − 1,5), que en w = 2,5 vale 15 > 0
    expect(curveSlope(c, 2.5)).toBeCloseTo(15, 9);
    // contract: la pendiente positiva manda hacia la izquierda
    expect(q5.options[q5.correct]).toBe('A la izquierda: una $w$ más pequeña');
    // contract: guía del juego 3: figura con la tangente dibujada y sin la lectura `slope`
    expect(q5.graph?.tangent).toBe(true);
    expect(q5.graph?.readouts).toEqual(['coords']);
    // contract: el punto de la tangente es el que dice el enunciado
    expect(q5.graph?.points).toEqual([
      { id: 'p', label: 'P', x: 2.5, movable: false, onCurve: true },
    ]);
  });

  it('despegue.6: la pendiente −6 se alcanza en w = 1,1 y el paso va a la derecha', () => {
    const c = curveOf(q6.graph);
    // contract: cálculo aparte con NumPy: 15·(1,1 − 1,5) = −6
    expect(curveSlope(c, 1.1)).toBeCloseTo(-6, 9);
    const at = (x: number) => grade(q6, { type: 'curva', points: { p: [x, 0] } });
    expect(at(1.1)).toBe(true);
    // contract: los vecinos de la rejilla dan −7,5 y −4,5 (de 1,5 en 1,5): no valen
    expect(at(1)).toBe(false);
    expect(at(1.2)).toBe(false);
    // contract: la partida, w = 2,5 con pendiente 15, no resuelve
    expect(at(2.5)).toBe(false);
    // contract: el paso 0,04 · 6 = 0,24 hacia la derecha: x − tasa·pendiente = 1,1 + 0,24 = 1,34
    expect(q6.graph.step).toEqual({ of: 'p', rate: 0.04 });
    expect(1.1 - 0.04 * curveSlope(c, 1.1)).toBeCloseTo(1.34, 9);
  });
});

describe('despegue.7 y despegue.8: las de código', () => {
  it('son de código y llevan sus requisitos', () => {
    // contract: encargo del despegue del juego 3: las preguntas 7 y 8 son de código
    expect(launch.slice(6).map((q) => q.type)).toEqual(['codigo', 'codigo']);
  });
});

describe('presupuestos de texto (menos tedio)', () => {
  const lenOf = (s: string) => s.trim().length;
  const all = [...launch];

  it('el enunciado cabe: 420 caracteres, o 600 en las de código', () => {
    for (const q of all) {
      const max = q.type === 'codigo' ? 600 : 420;
      // contract: guía de contenido del juego 3, presupuestos de texto
      expect(lenOf(q.prompt), `${q.id} prompt`).toBeLessThanOrEqual(max);
    }
  });

  it('las pistas de las preguntas que no son de código: 2 y de 220 caracteres como mucho', () => {
    for (const q of all.filter((x) => x.type !== 'codigo')) {
      // contract: guía de contenido del juego 3, presupuestos de texto
      expect(q.hints.length, `${q.id} hints`).toBe(2);
      for (const h of q.hints) expect(lenOf(h), `${q.id} hint`).toBeLessThanOrEqual(220);
    }
  });

  it('explain en 380 y solution en 480 caracteres como mucho', () => {
    for (const q of all) {
      // contract: guía de contenido del juego 3, presupuestos de texto
      expect(lenOf(q.explain), `${q.id} explain`).toBeLessThanOrEqual(380);
      expect(lenOf(q.solution), `${q.id} solution`).toBeLessThanOrEqual(480);
    }
  });

  it('purpose: why de 60 a 300, aim de 60 a 200 y takeaway de 60 a 260', () => {
    const withPurpose = all.filter((q) => 'purpose' in q && q.purpose);
    // contract: toda `curva` del despegue lleva purpose (tests/content/purpose.test.ts)
    expect(withPurpose.map((q) => q.id)).toEqual(['despegue.1', 'despegue.4', 'despegue.6']);
    for (const q of withPurpose) {
      if (!('purpose' in q) || !q.purpose) continue;
      // contract: guía de contenido del juego 3, presupuestos de texto
      expect(lenOf(q.purpose.why), `${q.id} why`).toBeGreaterThanOrEqual(60);
      expect(lenOf(q.purpose.why), `${q.id} why`).toBeLessThanOrEqual(300);
      expect(lenOf(q.purpose.aim), `${q.id} aim`).toBeGreaterThanOrEqual(60);
      expect(lenOf(q.purpose.aim), `${q.id} aim`).toBeLessThanOrEqual(200);
      expect(lenOf(q.purpose.takeaway), `${q.id} takeaway`).toBeGreaterThanOrEqual(60);
      expect(lenOf(q.purpose.takeaway), `${q.id} takeaway`).toBeLessThanOrEqual(260);
    }
  });

  it('bigPicture.text de 120 a 480 caracteres', () => {
    const n = lenOf(gradiente.bigPicture?.text ?? '');
    // contract: guía de contenido del juego 3, presupuestos de texto
    expect(n).toBeGreaterThanOrEqual(120);
    expect(n).toBeLessThanOrEqual(480);
  });
});
