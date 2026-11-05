import { describe, expect, it } from 'vitest';
import { grade, parseNumber } from '../../content/grade';
import {
  bankEntrySchema,
  type CurvaQ,
  type NumeroQ,
  type OpcionQ,
  type Question,
} from '../../content/schema';
import { checkProject } from '../../content/validate';
import { curveAt, curveSlope, mseBest, type Curve } from '../../engine/curves';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { warmupAsQuestion } from '../../../tests/content/warmup-helpers';
import { minimos } from './minimos';
import { examen0Minimos } from './examen-0-minimos';

const bankQuestions = examen0Minimos
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto minimos', projectQuestions(minimos));
defineProseTests('banco examen-0 minimos', bankQuestions);
defineProseTests('calentamiento minimos', (minimos.warmup ?? []).map(warmupAsQuestion));

const [ex00, ex01] = minimos.exercises;
const curva = (k: number): CurvaQ => {
  const q = ex00!.questions[k]!;
  if (q.type !== 'curva') throw new Error('ex00 solo tiene preguntas curva');
  return q;
};
const calc = (k: number): NumeroQ | OpcionQ => ex01!.questions[k] as NumeroQ | OpcionQ;
const curveOf = (q: { graph?: { curve?: Curve } }): Curve => {
  const c = q.graph?.curve;
  if (!c) throw new Error('la pregunta no tiene curva');
  return c;
};

describe('proyecto minimos', () => {
  it('se identifica como pide el encargo', () => {
    // contract: brief-orbita-0.md, «Lo común a A, B y C»: id minimos, «Mínimos», sub «Donde la pendiente es cero»
    expect([minimos.id, minimos.name, minimos.sub]).toEqual([
      'minimos',
      'Mínimos',
      'Donde la pendiente es cero',
    ]);
  });

  it('pasa checkProject sin problemas', () => {
    // contract: brief-orbita-0.md: checkProject(proyecto) devuelve la lista vacía (metas alcanzables y sin resolver al empezar)
    expect(checkProject(minimos)).toEqual([]);
  });

  it('tiene 3 ejercicios de 5 preguntas, 3 hojas y un calentamiento de 1 o 2 fichas', () => {
    // contract: brief-orbita-0.md: ex00 Manipular, ex01 Calcular, ex02 Programar, 5 preguntas cada uno, 3 hojas, calentamiento de 1 o 2 fichas
    expect(minimos.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(minimos.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(minimos.sheets).toHaveLength(3);
    expect(minimos.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(minimos.warmup?.length).toBeLessThanOrEqual(2);
  });

  it('los ids siguen el patrón minimos.exNN.k y minimos.hoja.k', () => {
    // contract: brief-orbita-0.md: ids `<id>.ex0N.k` y `<id>.hoja.k`
    expect(projectQuestions(minimos).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `minimos.ex0${e}.${k}`)),
      'minimos.hoja.1',
      'minimos.hoja.2',
      'minimos.hoja.3',
    ]);
  });

  it('su bigPicture nombra la pérdida y la actualización', () => {
    // contract: brief-orbita-0.md, apartado C: bigPicture `loss`, `update`
    expect(minimos.bigPicture?.parts).toEqual(['loss', 'update']);
  });
});

describe('visual primero', () => {
  it('ex00 son 5 curvas y la mayoría usa la pérdida mse con su panel de ajuste', () => {
    // contract: guía de contenido del juego 3, «Visual primero»: las 5 de Manipular son `curva`; brief C: la pérdida `mse` con `fit` como protagonista
    expect(ex00!.questions.map((q) => q.type)).toEqual(Array(5).fill('curva'));
    const fits = [0, 1, 2, 3, 4].filter((k) => curva(k).graph.fit).map((k) => k + 1);
    expect(fits).toEqual([1, 2, 3]);
    // contract: brief C, ex00.2: con `step` (la flecha del paso de descenso)
    expect(curva(1).graph.step).toBeDefined();
  });

  it('al menos 3 de las 5 de Calcular llevan graph, y ninguna lleva la lectura que da la respuesta', () => {
    const withGraph = ex01!.questions.filter((q) => (q as NumeroQ).graph);
    // contract: guía de contenido del juego 3: al menos 3 de las 5 de «Calcular» llevan `graph`
    expect(withGraph.length).toBeGreaterThanOrEqual(3);
    for (const q of withGraph) {
      const g = (q as NumeroQ).graph!;
      // contract: guía de contenido del juego 3: en una figura estática no va la lectura que da la respuesta (`slope`, `secant`, `line`)
      expect(
        g.readouts.filter((r) => r !== 'coords'),
        q.id,
      ).toEqual([]);
      // contract: guía de contenido del juego 3: una figura estática de Calcular no lleva puntos móviles
      expect(
        g.points.some((p) => p.movable),
        q.id,
      ).toBe(false);
    }
  });

  it('todas las curvas y todas las de Calcular llevan purpose', () => {
    for (const q of [...ex00!.questions, ...ex01!.questions]) {
      // contract: guía de contenido del juego 3: toda `curva` y toda pregunta de Calcular lleva `purpose`
      expect((q as { purpose?: unknown }).purpose, q.id).toBeDefined();
    }
  });
});

describe('presupuestos de texto', () => {
  const nonCode = projectQuestions(minimos).filter((q) => q.type !== 'codigo');
  const code = projectQuestions(minimos).filter((q) => q.type === 'codigo');
  const within = (n: number, a: number, b: number): boolean => n >= a && n <= b;

  it('prompt, pistas, explain y solution caben', () => {
    for (const q of nonCode) {
      // contract: guía de contenido del juego 3, presupuestos de texto: prompt 420, 2 pistas de 220, explain 380, solution 480
      expect(q.prompt.length, `${q.id} prompt`).toBeLessThanOrEqual(420);
      expect(q.hints.length, `${q.id} hints`).toBeLessThanOrEqual(2);
      for (const h of q.hints) expect(h.length, `${q.id} hint`).toBeLessThanOrEqual(220);
      expect(q.explain.length, `${q.id} explain`).toBeLessThanOrEqual(380);
      expect(q.solution.length, `${q.id} solution`).toBeLessThanOrEqual(480);
    }
    for (const q of code) {
      // contract: guía de contenido del juego 3, presupuestos de texto: prompt de código 600, explain 380, solution 480, tres pistas
      expect(q.prompt.length, `${q.id} prompt`).toBeLessThanOrEqual(600);
      expect(q.hints.length, `${q.id} hints`).toBe(3);
      expect(q.explain.length, `${q.id} explain`).toBeLessThanOrEqual(380);
      expect(q.solution.length, `${q.id} solution`).toBeLessThanOrEqual(480);
    }
  });

  it('purpose y bigPicture caben', () => {
    for (const q of projectQuestions(minimos)) {
      if (!('purpose' in q) || !q.purpose) continue;
      // contract: guía de contenido del juego 3, presupuestos de texto: why 60-300, aim 60-200, takeaway 60-260
      expect(within(q.purpose.why.length, 60, 300), `${q.id} why ${q.purpose.why.length}`).toBe(
        true,
      );
      expect(within(q.purpose.aim.length, 60, 200), `${q.id} aim ${q.purpose.aim.length}`).toBe(
        true,
      );
      expect(
        within(q.purpose.takeaway.length, 60, 260),
        `${q.id} takeaway ${q.purpose.takeaway.length}`,
      ).toBe(true);
    }
    // contract: guía de contenido del juego 3, presupuestos de texto: bigPicture.text de 120 a 480
    expect(within(minimos.bigPicture!.text.length, 120, 480)).toBe(true);
  });

  it('las preguntas del banco también caben', () => {
    for (const q of bankQuestions) {
      // contract: guía de contenido del juego 3, presupuestos de texto (los mismos para el banco)
      expect(q.prompt.length, q.id).toBeLessThanOrEqual(q.type === 'codigo' ? 600 : 420);
      expect(q.explain.length, q.id).toBeLessThanOrEqual(380);
      expect(q.solution.length, q.id).toBeLessThanOrEqual(480);
    }
  });
});

describe('las cifras de ex00 se recalculan con el motor', () => {
  it('ex00.1 a ex00.3: el mínimo de cada pérdida está donde dice el enunciado y la pendiente allí vale 0', () => {
    const w = [0, 1, 2].map((k) => {
      const c = curveOf(curva(k)) as Extract<Curve, { kind: 'mse' }>;
      return [mseBest(c), curveSlope(c, mseBest(c)), curveAt(c, mseBest(c))] as const;
    });
    // contract: NumPy (pyrun): datos (1,1),(2,4),(3,5),(4,9) → w* = 60/30 = 2 y pérdida 0,75; con el dato (2, 21) → w* = 102/34 = 3 y pérdida 51,6
    expect(w[0]![0]).toBeCloseTo(2, 9);
    expect(w[0]![2]).toBeCloseTo(0.75, 9);
    expect(w[2]![0]).toBeCloseTo(3, 9);
    expect(w[2]![2]).toBeCloseTo(51.6, 9);
    // contract: la pendiente de la pérdida en su mínimo vale 0
    expect(w[0]![1]).toBeCloseTo(0, 9);
    expect(w[2]![1]).toBeCloseTo(0, 9);
  });

  it('ex00.1: w = 2 resuelve y la posición de partida no; ex00.2: w = 2,6 resuelve y el paso cae en 2,24', () => {
    // contract: NumPy: pendiente 15·(w − 2): 0 en w = 2 y 9 en w = 2,6; paso 2,6 − 0,04·9 = 2,24
    expect(grade(curva(0), { type: 'curva', points: { p: [2, 0.75] } })).toBe(true);
    expect(grade(curva(0), { type: 'curva', points: { p: [0.5, 0] } })).toBe(false);
    expect(grade(curva(1), { type: 'curva', points: { p: [2.6, 0] } })).toBe(true);
    expect(grade(curva(1), { type: 'curva', points: { p: [2.4, 0] } })).toBe(false);
    expect(curveSlope(curveOf(curva(1)), 2.6)).toBeCloseTo(9, 9);
    expect(2.6 - 0.04 * curveSlope(curveOf(curva(1)), 2.6)).toBeCloseTo(2.24, 9);
  });

  it('ex00.3: el mínimo viejo (w = 2) ya no resuelve, con pendiente −13,6', () => {
    // contract: NumPy: la pendiente en w = 2 con el dato atípico vale −13,6
    expect(curveSlope(curveOf(curva(2)), 2)).toBeCloseTo(-13.6, 9);
    expect(grade(curva(2), { type: 'curva', points: { p: [2, 0] } })).toBe(false);
    expect(grade(curva(2), { type: 'curva', points: { p: [3, 0] } })).toBe(true);
  });

  it('ex00.4: la cuártica tiene su valle global en −2, su cima en 1 y su valle local en 3', () => {
    const c = curveOf(curva(3));
    // contract: NumPy: f′ = (x+2)(x−1)(x−3); alturas −12,67 (global), 3,08 (cima) y −2,25 (local)
    for (const x of [-2, 1, 3]) expect(curveSlope(c, x), `f′(${x})`).toBeCloseTo(0, 9);
    expect(curveAt(c, -2)).toBeCloseTo(-12.6667, 3);
    expect(curveAt(c, 1)).toBeCloseTo(3.0833, 3);
    expect(curveAt(c, 3)).toBeCloseTo(-2.25, 9);
    const at = (a: [number, number], b: [number, number]) =>
      grade(curva(3), { type: 'curva', points: { a, b } });
    // contract: A en el global y B en el local resuelve; al revés, o con A en la cima, no
    expect(at([-2, 0], [3, 0])).toBe(true);
    expect(at([3, 0], [-2, 0])).toBe(false);
    expect(at([1, 0], [3, 0])).toBe(false);
  });

  it('ex00.5: la cúbica tiene la cima en −1 y el valle en 3, y solo el valle resuelve', () => {
    const c = curveOf(curva(4));
    // contract: NumPy: f′ = (x+1)(x−3); alturas 3,67 y −7
    for (const x of [-1, 3]) expect(curveSlope(c, x), `f′(${x})`).toBeCloseTo(0, 9);
    expect(curveAt(c, -1)).toBeCloseTo(3.6667, 3);
    expect(curveAt(c, 3)).toBeCloseTo(-7, 9);
    expect(grade(curva(4), { type: 'curva', points: { p: [3, 0] } })).toBe(true);
    expect(grade(curva(4), { type: 'curva', points: { p: [-1, 0] } })).toBe(false);
  });
});

describe('las cifras de ex01 se recalculan', () => {
  const ok = (q: NumeroQ, typed: string): boolean => {
    const p = parseNumber(typed);
    return grade(q, { type: 'numero', value: p.ok ? p.value : NaN });
  };

  it('ex01.1: w* = 23/14 con tres datos', () => {
    const q = calc(0) as NumeroQ;
    const c = curveOf(q) as Extract<Curve, { kind: 'mse' }>;
    // contract: NumPy: Σxy = 23 y Σxx = 14 → w* = 1,642857…
    expect(mseBest(c)).toBeCloseTo(23 / 14, 9);
    expect(ok(q, '1,64')).toBe(true);
    // contract: error típico: Σy/Σx = 10/6 = 1,67, o dividir entre el cuadrado de la suma, 23/36 = 0,64
    expect(ok(q, '1,67')).toBe(false);
    expect(ok(q, '0,64')).toBe(false);
  });

  it('ex01.2: la pérdida en el mínimo de cuatro datos vale 0,5', () => {
    const q = calc(1) as NumeroQ;
    const c = curveOf(q) as Extract<Curve, { kind: 'mse' }>;
    // contract: NumPy: datos (1,1),(1,3),(2,4),(2,4) → w* = 2 y pérdida 0,5
    expect(mseBest(c)).toBeCloseTo(2, 9);
    expect(curveAt(c, 2)).toBeCloseTo(0.5, 9);
    expect(ok(q, '0,5')).toBe(true);
    // contract: error típico: la suma de los cuadrados (2) en vez de su media
    expect(ok(q, '2')).toBe(false);
  });

  it('ex01.3: el mínimo de 4w² − 10w + 9 está en 1,25 y vale 2,75', () => {
    const q = calc(2) as NumeroQ;
    const c = curveOf(q);
    // contract: −b/(2a) = 10/8 = 1,25; NumPy: L(1,25) = 2,75
    expect(curveSlope(c, 1.25)).toBeCloseTo(0, 9);
    expect(curveAt(c, 1.25)).toBeCloseTo(2.75, 9);
    expect(ok(q, '1,25')).toBe(true);
    // contract: error típico: olvidar el signo de b da −1,25
    expect(ok(q, '-1,25')).toBe(false);
  });

  it('ex01.4 y ex01.5: la opción correcta es la del encargo y la curva tiene la forma dicha', () => {
    // contract: brief C: opcion de un punto de pendiente 0 que no es mínimo (x³ en 0) y opcion del mínimo local de la cuártica
    expect(curveSlope(curveOf(calc(3) as OpcionQ), 0)).toBeCloseTo(0, 9);
    expect(curveAt(curveOf(calc(3) as OpcionQ), -1)).toBeLessThan(0);
    expect(curveAt(curveOf(calc(3) as OpcionQ), 1)).toBeGreaterThan(0);
    expect((calc(3) as OpcionQ).correct).toBe(1);
    expect((calc(4) as OpcionQ).correct).toBe(0);
    // contract: el paso desde x = 2,5 con tasa 0,1 va hacia la derecha, al valle local: 2,5 + 0,1·3,375 = 2,8375
    expect(2.5 - 0.1 * curveSlope(curveOf(calc(4) as OpcionQ), 2.5)).toBeCloseTo(2.8375, 9);
  });
});

describe('banco de examen: 3 entradas fijas de minimos', () => {
  it('son 3, con ids examen-0.* y esquema válido', () => {
    // contract: brief-orbita-0.md, apartado C: banco de 3 fijas; ids `examen-0.<tema>`
    expect(examen0Minimos).toHaveLength(3);
    for (const e of examen0Minimos) {
      expect(e.project).toBe('minimos');
      expect(e.question.id.startsWith('examen-0.'), e.question.id).toBe(true);
      expect(bankEntrySchema.safeParse(e).success, e.question.id).toBe(true);
    }
    expect(examen0Minimos.map((e) => e.question.type)).toEqual(['numero', 'numero', 'codigo']);
  });

  it('los ids del banco no chocan con los del proyecto', () => {
    const ids = [...projectQuestions(minimos), ...bankQuestions].map((q) => q.id);
    // contract: brief-orbita-0.md: ids únicos en todo el juego
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las respuestas numéricas se recalculan', () => {
    const [a, b] = bankQuestions as NumeroQ[];
    // contract: NumPy: (1·2 + 3·7)/(1 + 9) = 2,3; mínimo de 5w² − 12w + 9: 12/10 = 1,2, valor 1,8
    // (el + 9, del hallazgo 5 de la revisión, 2026-11-05: con + 7 la pérdida mínima era negativa)
    expect(23 / 10).toBeCloseTo(a!.answer, 9);
    expect(12 / 10).toBeCloseTo(b!.answer, 9);
    expect(5 * 1.2 ** 2 - 12 * 1.2 + 9).toBeCloseTo(1.8, 9);
    expect(b!.prompt).toContain('5w^{2}-12w+9');
  });
});
