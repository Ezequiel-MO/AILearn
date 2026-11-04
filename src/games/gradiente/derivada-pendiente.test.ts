import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CurvaQ, type Question } from '../../content/schema';
import { curveAt, curveSlope } from '../../engine/curves';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { warmupAsQuestion } from '../../../tests/content/warmup-helpers';
import { derivadaPendiente } from './derivada-pendiente';
import { examen0DerivadaPendiente } from './examen-0-derivada-pendiente';

const bankQuestions = examen0DerivadaPendiente
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto derivada-pendiente', projectQuestions(derivadaPendiente));
defineProseTests('banco examen-0 derivada-pendiente', bankQuestions);
defineProseTests(
  'calentamiento derivada-pendiente',
  (derivadaPendiente.warmup ?? []).map(warmupAsQuestion),
);

const [ex00, ex01] = derivadaPendiente.exercises;
const curva = (k: number): CurvaQ => {
  const q = ex00!.questions[k]!;
  if (q.type !== 'curva') throw new Error('ex00 solo tiene preguntas curva');
  return q;
};

describe('proyecto derivada-pendiente', () => {
  it('se identifica como pide el encargo', () => {
    // contract: brief-orbita-0.md, «Lo común a A, B y C»: id derivada-pendiente, «Derivada como pendiente», sub «Acercar la secante»
    expect([derivadaPendiente.id, derivadaPendiente.name, derivadaPendiente.sub]).toEqual([
      'derivada-pendiente',
      'Derivada como pendiente',
      'Acercar la secante',
    ]);
  });

  it('pasa checkProject sin problemas', () => {
    // contract: brief-orbita-0.md: las metas de las curva son alcanzables en la rejilla y no se cumplen al empezar (checkProject)
    expect(checkProject(derivadaPendiente)).toEqual([]);
  });

  it('tiene 1 o 2 fichas de calentamiento y el bigPicture de gradiente y pérdida', () => {
    // contract: brief-orbita-0.md, A: calentamiento de 1 o 2 fichas; bigPicture `gradient`, `loss`
    expect(derivadaPendiente.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(derivadaPendiente.warmup?.length).toBeLessThanOrEqual(2);
    expect(derivadaPendiente.bigPicture?.parts).toEqual(['gradient', 'loss']);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos del encargo, y tres hojas', () => {
    // contract: brief-orbita-0.md: ex00 curva, ex01 calcular, ex02 programar (5 `codigo`); 3 hojas «Caza el error»
    expect(derivadaPendiente.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(derivadaPendiente.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(derivadaPendiente.exercises[0]!.questions.map((q) => q.type)).toEqual(
      Array(5).fill('curva'),
    );
    expect(derivadaPendiente.exercises[2]!.questions.map((q) => q.type)).toEqual(
      Array(5).fill('codigo'),
    );
    expect(derivadaPendiente.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón derivada-pendiente.exNN.k y derivada-pendiente.hoja.k', () => {
    // contract: brief-orbita-0.md: ids `<id>.ex0N.k` y `<id>.hoja.k`
    expect(projectQuestions(derivadaPendiente).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `derivada-pendiente.ex0${e}.${k}`)),
      'derivada-pendiente.hoja.1',
      'derivada-pendiente.hoja.2',
      'derivada-pendiente.hoja.3',
    ]);
  });
});

describe('ex00: las cinco curva', () => {
  it('las metas son las del diseño', () => {
    const shape = ex00!.questions.map((q) =>
      q.type === 'curva'
        ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
        : [],
    );
    // contract: brief-orbita-0.md, A, ex00: secante a 0,1 de la tangente (2) por la derecha y por la izquierda (con x de Q en 2..3), slope 0, slope 3 y, en la cúbica, slope 0 y fx = ±2 en dos puntos
    expect(shape).toEqual([
      ['secant(p,q)=2±0.1'],
      ['secant(p,q)=2±0.1', 'x(q)=2.5±0.5'],
      ['slope(p)=0±0.01'],
      ['slope(p)=3±0.01'],
      ['slope(a)=0±0.01', 'fx(a)=2±0.05', 'slope(b)=0±0.01', 'fx(b)=-2±0.05'],
    ]);
  });

  it('hay como mucho 2 puntos móviles y se ven la curva y las lecturas de la pendiente', () => {
    for (const [k, q] of ex00!.questions.entries()) {
      if (q.type !== 'curva') continue;
      // contract: brief-comun.md y guía de contenido del juego 3: como mucho 2 puntos móviles; ex00.5 lleva 2
      expect(q.graph.points.filter((p) => p.movable).length, q.id).toBeLessThanOrEqual(2);
      expect(q.graph.points.filter((p) => p.movable).length, q.id).toBe(k === 4 ? 2 : 1);
      // contract: brief-orbita-0.md, A: lecturas `slope` en todas las del ejercicio (y `secant` en las dos primeras)
      expect(q.graph.readouts.includes('slope'), q.id).toBe(true);
      expect(q.graph.readouts.includes('secant'), q.id).toBe(k < 2);
    }
  });

  it('las dos primeras acercan la secante a la tangente de P (pendiente 2) desde cada lado', () => {
    for (const k of [0, 1]) {
      const q = curva(k);
      const curve = q.graph.curve!;
      // contract: L(w) = (w − 2)², P en w = 3, calculado con NumPy: la pendiente de la tangente en P vale 2
      expect(curveSlope(curve, 3)).toBe(2);
      const at = (x: number) => ({
        type: 'curva' as const,
        points: { q: [x, 0] as [number, number] },
      });
      // contract: la secante entre w = 3 y w = 2,9 vale 1,9 y entre 3 y 3,1 vale 2,1; a 5 y a 1 queda lejos (4 y 0)
      expect(grade(q, at(2.9))).toBe(true);
      expect(grade(q, at(2.2))).toBe(false);
      expect(grade(q, at(5))).toBe(false);
    }
    // contract: la meta de la izquierda exige que Q no pase de P (x en 2 a 3): 3,1 da secante 2,1 pero no vale
    expect(grade(curva(1), { type: 'curva', points: { q: [3.1, 0] } })).toBe(false);
    expect(grade(curva(0), { type: 'curva', points: { q: [3.1, 0] } })).toBe(true);
  });

  it('el fondo está en w = 2, la pendiente 3 en w = 3,5 y la cúbica tiene su cima y su fondo en ±1', () => {
    const loss = curva(2).graph.curve!;
    // contract: L(w) = (w − 2)², pendiente 2w − 4 (NumPy): vale 0 en w = 2 y 3 en w = 3,5
    expect(curveSlope(loss, 2)).toBe(0);
    expect(curveSlope(loss, 3.5)).toBe(3);
    const cubic = curva(4).graph.curve!;
    // contract: f(x) = x³ − 3x (NumPy): pendiente 0 en −1 y en 1, con alturas 2 y −2
    expect([curveSlope(cubic, -1), curveSlope(cubic, 1)]).toEqual([0, 0]);
    expect([curveAt(cubic, -1), curveAt(cubic, 1)]).toEqual([2, -2]);
    // contract: A en la cima y B en el fondo cumple las cuatro metas; intercambiarlos, no
    const q = curva(4);
    expect(grade(q, { type: 'curva', points: { a: [-1, 0], b: [1, 0] } })).toBe(true);
    expect(grade(q, { type: 'curva', points: { a: [1, 0], b: [-1, 0] } })).toBe(false);
  });
});

describe('ex01: las respuestas de «Calcular» cuadran con las curvas de sus figuras', () => {
  const calc = (k: number) => ex01!.questions[k]!;

  it('al menos tres de las cinco llevan figura, y ninguna figura lleva la lectura de la pendiente', () => {
    const figs = ex01!.questions.filter((q) => 'graph' in q && q.graph);
    // contract: guía de contenido del juego 3: al menos 3 de las 5 de «Calcular» llevan `graph`
    expect(figs.length).toBeGreaterThanOrEqual(3);
    for (const q of figs) {
      if (!('graph' in q) || !q.graph) continue;
      // contract: guía de contenido del juego 3: una figura estática no lleva la lectura que da la respuesta
      expect(q.graph.readouts, q.id).not.toContain('slope');
      expect(q.graph.readouts, q.id).not.toContain('secant');
    }
  });

  it('pendiente de la secante de la figura, 6,01 con h = 0,01, tasa 0,4 y ordenada −3', () => {
    const q1 = calc(0);
    const f1 = 'graph' in q1 && q1.graph?.curve ? q1.graph.curve : undefined;
    // contract: L(w) = w² − 2w + 3, P en w = 1 (altura 2) y Q en w = 4 (altura 11) (NumPy): secante (11 − 2) / 3 = 3
    expect([curveAt(f1!, 1), curveAt(f1!, 4), (curveAt(f1!, 4) - curveAt(f1!, 1)) / 3]).toEqual([
      2, 11, 3,
    ]);
    expect(q1.type === 'numero' && q1.answer).toBe(3);
    // contract: (3,01² − 9) / 0,01 = 6,01 (NumPy: 6,00999…, a 0,005 de 6,01)
    expect(Math.abs((3.01 ** 2 - 9) / 0.01 - 6.01)).toBeLessThan(0.005);
    const q2 = calc(1);
    expect(q2.type === 'numero' && [q2.answer, q2.tol]).toEqual([6.01, 0.005]);
    // contract: L(w) = (w − 2)² en w = 4: pendiente 4, y L(4,1) − L(4) = 0,41 (NumPy) frente a la aproximación 4 · 0,1 = 0,4, dentro de 0,05
    const loss = curva(0).graph.curve!;
    expect(curveSlope(loss, 4)).toBe(4);
    const q4 = calc(3);
    expect(q4.type === 'numero' && [q4.answer, q4.tol]).toEqual([0.4, 0.05]);
    expect(Math.abs(curveAt(loss, 4.1) - curveAt(loss, 4) - 0.4)).toBeLessThan(0.05);
    // contract: L(w) = w² + 1 en w = 2: altura 5, pendiente 4, y b = 5 − 4·2 = −3
    const q5 = calc(4);
    const f5 = 'graph' in q5 && q5.graph?.curve ? q5.graph.curve : undefined;
    expect([curveAt(f5!, 2), curveSlope(f5!, 2), curveAt(f5!, 2) - curveSlope(f5!, 2) * 2]).toEqual(
      [5, 4, -3],
    );
    expect(q5.type === 'numero' && q5.answer).toBe(-3);
  });

  it('el signo de la pendiente en A, B y C es −, 0, + y la opción correcta lo dice', () => {
    const q = calc(2);
    const g = 'graph' in q && q.graph ? q.graph : undefined;
    const slopes = ['a', 'b', 'c'].map((id) =>
      curveSlope(g!.curve!, g!.points.find((p) => p.id === id)!.x),
    );
    // contract: f(x) = x² − 6x + 10 (NumPy) en x = 1, 3 y 4,5: pendientes −4, 0 y 3
    expect(slopes).toEqual([-4, 0, 3]);
    // contract: la opción correcta es la primera, «A negativa, B cero y C positiva»
    expect(q.type === 'opcion' && q.options[q.correct]).toBe('A negativa, B cero y C positiva');
  });
});

describe('banco: las tres entradas fijas', () => {
  it('son de este proyecto, con los ids del encargo y el esquema del banco', () => {
    // contract: brief-orbita-0.md, A: banco de 3 fijas (una `numero` de secante, una `opcion` de leer una tangente, una `codigo` de derivada numérica); ids `examen-0.<tema>`
    expect(
      examen0DerivadaPendiente.map((e) => [e.project, e.question.id, e.question.type]),
    ).toEqual([
      ['derivada-pendiente', 'examen-0.secante-en-figura', 'numero'],
      ['derivada-pendiente', 'examen-0.leer-tangente', 'opcion'],
      ['derivada-pendiente', 'examen-0.derivada-numerica', 'codigo'],
    ]);
    for (const e of examen0DerivadaPendiente) {
      // contract: bankEntrySchema (src/content/schema.ts)
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
  });

  it('la secante vale −1 y la tangente de la figura es horizontal', () => {
    const [num, opt] = bankQuestions;
    const gn = num!.type === 'numero' ? num.graph : undefined;
    // contract: L(w) = w² − 6w + 10 (NumPy): L(1) = 5, L(4) = 2, pendiente de la secante (2 − 5) / 3 = −1
    expect([curveAt(gn!.curve!, 1), curveAt(gn!.curve!, 4)]).toEqual([5, 2]);
    expect(num!.type === 'numero' && num.answer).toBe(-1);
    const go = opt!.type === 'opcion' ? opt.graph : undefined;
    // contract: L(w) = (w − 2)² + 1: pendiente 0 y altura 1 en w = 2, la de la tangente de la figura
    expect([curveSlope(go!.curve!, 2), curveAt(go!.curve!, 2)]).toEqual([0, 1]);
    expect(opt!.type === 'opcion' && opt.correct).toBe(0);
  });
});

describe('presupuestos de texto (menos tedio)', () => {
  const lenOf = (s: string) => s.trim().length;
  const all = [...projectQuestions(derivadaPendiente), ...bankQuestions];

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

  it('toda curva y toda pregunta de «Calcular» lleva purpose, de 60 a 300, 60 a 200 y 60 a 260', () => {
    const needs = projectQuestions(derivadaPendiente).filter(
      (q) => ['curva', 'numero', 'vector', 'opcion'].includes(q.type) && !q.id.includes('hoja'),
    );
    // contract: guía de contenido del juego 3: toda `curva` y toda pregunta de «Calcular» lleva purpose
    expect(needs).toHaveLength(10);
    for (const q of needs) {
      if (!('purpose' in q) || !q.purpose) throw new Error(`${q.id} sin purpose`);
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
    const n = lenOf(derivadaPendiente.bigPicture?.text ?? '');
    // contract: guía de contenido del juego 3, presupuestos de texto
    expect(n).toBeGreaterThanOrEqual(120);
    expect(n).toBeLessThanOrEqual(480);
  });
});
