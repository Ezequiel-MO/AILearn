import { describe, expect, it } from 'vitest';
import { grade } from '../../content/grade';
import {
  bankEntrySchema,
  bigPictureSchema,
  type CurvaQ,
  type NumeroQ,
  type Question,
} from '../../content/schema';
import { checkProject } from '../../content/validate';
import { curveAt, curveSlope } from '../../engine/curves';
import { defineProseTests, projectQuestions } from '../../../tests/content/prose-helpers';
import { warmupAsQuestion } from '../../../tests/content/warmup-helpers';
import { reglasDerivacion } from './reglas-derivacion';
import { examen0ReglasDerivacion } from './examen-0-reglas-derivacion';

const bankQuestions = examen0ReglasDerivacion
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto reglas-derivacion', projectQuestions(reglasDerivacion));
defineProseTests('banco examen-0 reglas-derivacion', bankQuestions);
defineProseTests(
  'calentamiento reglas-derivacion',
  (reglasDerivacion.warmup ?? []).map(warmupAsQuestion),
);

const byId = <T extends Question>(id: string): T => {
  const q = projectQuestions(reglasDerivacion).find((x) => x.id === id);
  if (!q) throw new Error(`No existe la pregunta ${id}`);
  return q as T;
};

describe('proyecto reglas-derivacion', () => {
  it('se identifica como pide el encargo', () => {
    // contract: brief de la Órbita 0 del juego 3 («Lo común a A, B y C»): id reglas-derivacion, «Reglas de derivación», «Derivar sin límites»
    expect([reglasDerivacion.id, reglasDerivacion.name, reglasDerivacion.sub]).toEqual([
      'reglas-derivacion',
      'Reglas de derivación',
      'Derivar sin límites',
    ]);
  });

  it('pasa checkProject sin problemas', () => {
    // contract: reglas de contenido de CLAUDE.md: las metas de `curva` son alcanzables y no están resueltas al empezar
    expect(checkProject(reglasDerivacion)).toEqual([]);
  });

  it('tiene calentamiento de 1 o 2 fichas', () => {
    // contract: guía de contenido del juego 3, «Calentamiento»: 1 o 2 fichas
    expect(reglasDerivacion.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(reglasDerivacion.warmup?.length).toBeLessThanOrEqual(2);
  });

  it('tiene tres ejercicios de 5 preguntas de los tipos del encargo y tres hojas', () => {
    // contract: brief B: ex00 curva, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(reglasDerivacion.exercises.map((e) => e.kind)).toEqual([
      'manipular',
      'calcular',
      'programar',
    ]);
    expect(reglasDerivacion.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(reglasDerivacion.sheets).toHaveLength(3);
    expect(reglasDerivacion.exercises[0]!.questions.map((q) => q.type)).toEqual(
      Array(5).fill('curva'),
    );
    expect(reglasDerivacion.exercises[2]!.questions.map((q) => q.type)).toEqual(
      Array(5).fill('codigo'),
    );
  });

  it('los ids siguen el patrón reglas-derivacion.exNN.k y reglas-derivacion.hoja.k', () => {
    // contract: brief de la Órbita 0 («Lo común»): ids `<id>.ex0N.k` y `<id>.hoja.k`
    expect(projectQuestions(reglasDerivacion).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `reglas-derivacion.ex0${e}.${k}`)),
      'reglas-derivacion.hoja.1',
      'reglas-derivacion.hoja.2',
      'reglas-derivacion.hoja.3',
    ]);
  });

  it('su bigPicture es válido y nombra el gradiente', () => {
    // contract: brief B: bigPicture `gradient`
    expect(bigPictureSchema.safeParse(reglasDerivacion.bigPicture).success).toBe(true);
    expect(reglasDerivacion.bigPicture?.parts).toEqual(['gradient']);
  });
});

describe('presupuestos de texto', () => {
  const all = [...projectQuestions(reglasDerivacion), ...bankQuestions];
  const over = (field: string, max: number, get: (q: Question) => string | undefined): string[] =>
    all.flatMap((q) => {
      const s = get(q);
      return s !== undefined && s.length > max ? [`${q.id} ${field}: ${s.length} > ${max}`] : [];
    });

  it('prompt, pistas, explain y solution caben', () => {
    // contract: guía de contenido del juego 3, presupuestos de texto
    expect(over('prompt', 420, (q) => (q.type === 'codigo' ? undefined : q.prompt))).toEqual([]);
    expect(over('prompt', 600, (q) => (q.type === 'codigo' ? q.prompt : undefined))).toEqual([]);
    expect(over('explain', 380, (q) => q.explain)).toEqual([]);
    expect(over('solution', 480, (q) => q.solution)).toEqual([]);
    const hints = all
      .filter((q) => q.type !== 'codigo')
      .flatMap((q) => q.hints.map((h, i) => ({ id: `${q.id} hints[${i}]`, h })))
      .filter(({ h }) => h.length > 220)
      .map(({ id, h }) => `${id}: ${h.length}`);
    expect(hints).toEqual([]);
    // contract: guía de contenido del juego 3: 2 pistas en una pregunta que no es de código
    expect(all.filter((q) => q.type !== 'codigo' && q.hints.length > 2).map((q) => q.id)).toEqual(
      [],
    );
  });

  it('purpose cabe', () => {
    // contract: guía de contenido del juego 3: why 60 a 300, aim 60 a 200, takeaway 60 a 260
    const limits = { why: [60, 300], aim: [60, 200], takeaway: [60, 260] } as const;
    const bad = projectQuestions(reglasDerivacion).flatMap((q) =>
      'purpose' in q && q.purpose
        ? (['why', 'aim', 'takeaway'] as const).flatMap((k) => {
            const n = q.purpose![k].trim().length;
            return n < limits[k][0] || n > limits[k][1] ? [`${q.id} ${k}: ${n}`] : [];
          })
        : [],
    );
    expect(bad).toEqual([]);
  });

  it('bigPicture.text cabe', () => {
    // contract: guía de contenido del juego 3: bigPicture.text de 120 a 480
    const n = reglasDerivacion.bigPicture!.text.length;
    expect(n).toBeGreaterThanOrEqual(120);
    expect(n).toBeLessThanOrEqual(480);
  });
});

describe('ex00: las cinco curvas', () => {
  const curva = (k: number) => byId<CurvaQ>(`reglas-derivacion.ex00.${k}`);
  const at = (q: CurvaQ, points: Record<string, [number, number]>) =>
    grade(q, { type: 'curva', points });

  it('llevan purpose y, salvo la última, la derivada dibujada', () => {
    // contract: brief B ex00: `derivative: true` en casi todas; toda curva lleva purpose (guía)
    for (const k of [1, 2, 3, 4, 5]) expect(curva(k).purpose, `ex00.${k}`).toBeDefined();
    expect([1, 2, 3, 4, 5].map((k) => curva(k).graph.derivative === true)).toEqual([
      true,
      true,
      true,
      true,
      false,
    ]);
  });

  it('1: f = x², pendiente 3 en x = 1,5', () => {
    // contract: f′(x) = 2x = 3 en x = 1,5 (brief B ex00.1)
    expect(at(curva(1), { p: [1.5, 0] })).toBe(true);
    expect(at(curva(1), { p: [1, 0] })).toBe(false);
    expect(curveSlope(curva(1).graph.curve!, 1.5)).toBeCloseTo(3, 9);
  });

  it('2: f = 3x², pendiente 3 en x = 0,5 y no en 1,5', () => {
    // contract: f′(x) = 6x = 3 en x = 0,5; la constante 3 triplica la pendiente
    expect(at(curva(2), { p: [0.5, 0] })).toBe(true);
    expect(at(curva(2), { p: [1.5, 0] })).toBe(false);
  });

  it('3: f = x² + 2x, tangente horizontal en x = −1', () => {
    // contract: f′(x) = 2x + 2 = 0 en x = −1
    expect(at(curva(3), { p: [-1, 0] })).toBe(true);
    expect(at(curva(3), { p: [0, 0] })).toBe(false);
  });

  it('4: f = x³, pendiente 3 en x = 1 y en x = −1, y cada punto en su sitio', () => {
    // contract: f′(x) = 3x² = 3 en x = ±1 (brief B ex00.4)
    expect(at(curva(4), { a: [1, 0], b: [-1, 0] })).toBe(true);
    expect(at(curva(4), { a: [-1, 0], b: [1, 0] })).toBe(false);
    expect(at(curva(4), { a: [1, 0], b: [1, 0] })).toBe(false);
    expect(curveSlope(curva(4).graph.curve!, -1)).toBeCloseTo(3, 9);
  });

  it('5: la tangente a x² en x = 1 es y = 2x − 1, por (0, −1) y (2, 3), no otra recta', () => {
    // contract: f(1) = 1, f′(1) = 2: recta y = 2x − 1 (pendiente 2, ordenada −1)
    const q = curva(5);
    expect(curveAt(q.graph.curve!, 1)).toBe(1);
    expect(at(q, { a: [0, -1], b: [2, 3] })).toBe(true);
    expect(at(q, { a: [-1, -3], b: [3, 5] })).toBe(true);
    // contract: la secante por (0, 0) y (2, 4) tiene pendiente 2 pero ordenada 0: no es la tangente
    expect(at(q, { a: [0, 0], b: [2, 4] })).toBe(false);
    // contract: la recta por (0, −1) y (2, 1) tiene ordenada −1 pero pendiente 1: no es la tangente
    expect(at(q, { a: [0, -1], b: [2, 1] })).toBe(false);
  });
});

describe('ex01: calcular', () => {
  const num = (k: number) => byId<NumeroQ>(`reglas-derivacion.ex01.${k}`);
  const questions = [1, 2, 3, 4, 5].map((k) => byId<Question>(`reglas-derivacion.ex01.${k}`));

  it('las respuestas', () => {
    // contract: ex01.1 f = x³ − 4x + 1, f′(2) = 3·4 − 4 = 8 (NumPy: np.polyval(np.polyder([1, 0, -4, 1]), 2))
    expect(num(1).answer).toBe(8);
    // contract: ex01.2 f = 1 + 2x − 3x² + x³: f′ = 2 − 6x + 3x² (np.polyder([1, -3, 2, 1])[::-1])
    const v = questions[1]!;
    expect(v.type === 'vector' ? v.answer : null).toEqual([2, -6, 3]);
    // contract: ex01.3 f = (x + 1)(x² − 2): f′(2) = 1·2 + 3·4 = 14 (np.polyval(np.polyder([1, 1, -2, -2]), 2))
    expect(num(3).answer).toBe(14);
    // contract: ex01.4 L(w) = (2w − 3)², L′(1) = 8·1 − 12 = −4 (np.mean(2·x·(w·x − y)) con x = 2, y = 3, w = 1)
    expect(num(4).answer).toBe(-4);
    // contract: ex01.5 la regla de la potencia es n·xⁿ⁻¹: la opción de índice 2
    const o = questions[4]!;
    expect(o.type === 'opcion' ? [o.correct, o.options[o.correct]] : null).toEqual([
      2,
      '$n\\,x^{n-1}$',
    ]);
  });

  it('las derivadas de las figuras se recalculan con el motor', () => {
    // contract: la pendiente de la tangente dibujada es la respuesta (ex01.1, ex01.3, ex01.4)
    for (const k of [1, 3, 4]) {
      const g = num(k).graph!;
      const p = g.points[0]!;
      expect(curveSlope(g.curve!, p.x), `ex01.${k}`).toBeCloseTo(num(k).answer, 9);
    }
  });

  it('al menos 3 preguntas llevan figura y ninguna lee la pendiente que se pide', () => {
    // contract: guía de contenido del juego 3: al menos 3 de las 5 de Calcular llevan `graph`; sin la lectura que da la respuesta
    const withGraph = questions.filter((q) => 'graph' in q && q.graph);
    expect(withGraph.length).toBeGreaterThanOrEqual(3);
    for (const q of withGraph) {
      if ('graph' in q && q.graph) {
        expect(q.graph.readouts, q.id).not.toContain('slope');
        expect(q.graph.readouts, q.id).not.toContain('secant');
      }
    }
  });

  it('toda pregunta de Calcular lleva purpose', () => {
    // contract: guía de contenido del juego 3: toda pregunta de Calcular lleva purpose
    expect(questions.filter((q) => !('purpose' in q) || !q.purpose).map((q) => q.id)).toEqual([]);
  });
});

describe('hojas', () => {
  it('línea errónea de cada una', () => {
    // contract: diseño de las hojas: 1 falta quitar el término independiente (línea 3), 2 usa g′h′ en vez de la regla del producto (línea 3), 3 no tiene error
    expect(reglasDerivacion.sheets.map((s) => s.faultyLine)).toEqual([2, 2, null]);
  });

  it('el enunciado acaba con la frase común y el explain no nombra la línea', () => {
    for (const s of reglasDerivacion.sheets) {
      // contract: frase común de las hojas «Caza el error» (R25)
      expect(s.prompt.endsWith('si todo cuadra, no hay error.'), s.id).toBe(true);
      // contract: review-15 I3 (b): el explain no dice qué línea falla
      expect(/línea/i.test(s.explain), s.id).toBe(false);
    }
  });

  it('las cifras de las hojas se recalculan', () => {
    // contract: hoja 2: f = x²(x + 1) = x³ + x²; f′ = 3x² + 2x; f′(1) = 5, y g′h + g·h′ = 2·2 + 1·1 = 5
    expect(3 * 1 + 2 * 1).toBe(5);
    expect(2 * 1 * 2 + 1 * 1).toBe(5);
    // contract: hoja 3: f = 3x² − 6x + 5, f′ = 6x − 6 = 0 en x = 1 y f(1) = 2
    expect(curveSlope({ kind: 'poly', coefs: [5, -6, 3] }, 1)).toBe(0);
    expect(curveAt({ kind: 'poly', coefs: [5, -6, 3] }, 1)).toBe(2);
  });
});

describe('banco de examen 0 del proyecto reglas-derivacion', () => {
  it('tiene tres entradas fijas del proyecto, con ids examen-0.*', () => {
    // contract: brief B: banco de 3 fijas (derivada en un punto, coeficientes de una derivada como vector, una codigo de derivar)
    expect(examen0ReglasDerivacion.map((e) => e.project)).toEqual(
      Array(3).fill('reglas-derivacion'),
    );
    expect(examen0ReglasDerivacion.map((e) => e.question.id)).toEqual([
      'examen-0.derivada-de-la-perdida',
      'examen-0.coeficientes-de-la-derivada',
      'examen-0.derivada-en-codigo',
    ]);
    expect(examen0ReglasDerivacion.map((e) => e.question.type)).toEqual([
      'numero',
      'vector',
      'codigo',
    ]);
  });

  it('cada entrada cumple el esquema, ninguna usa el id de la generada y no chocan con el proyecto', () => {
    for (const entry of examen0ReglasDerivacion) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
    // contract: brief E: la entrada generada del proyecto es examen-0.derivada-polinomio y la añade el montaje
    expect(
      examen0ReglasDerivacion.filter((e) => e.question.id === 'examen-0.derivada-polinomio'),
    ).toEqual([]);
    const projectIds = new Set(projectQuestions(reglasDerivacion).map((q) => q.id));
    expect(examen0ReglasDerivacion.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [num, vec] = examen0ReglasDerivacion.map((e) => e.question);
    // contract: L(w) = w⁴ − 2w² + 3w + 5, L′(w) = 4w³ − 4w + 3, L′(2) = 32 − 8 + 3 = 27 (el + 5, del
    // hallazgo 5 de la revisión, 2026-11-05: una pérdida no es negativa; no cambia la derivada)
    expect(num!.type === 'numero' ? num!.answer : null).toBe(27);
    expect(curveSlope({ kind: 'poly', coefs: [5, 3, -2, 0, 1] }, 2)).toBeCloseTo(27, 9);
    // contract: f = 5 − 4x + 3x³: f′ = −4 + 0x + 9x² (np.polyder([3, 0, -4, 5])[::-1])
    expect(vec!.type === 'vector' ? vec!.answer : null).toEqual([-4, 0, 9]);
  });
});
