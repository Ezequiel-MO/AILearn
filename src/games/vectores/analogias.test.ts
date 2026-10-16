import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import { cosine, distance, norm } from '../../engine/vectors';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { analogias } from './analogias';
import { examen3Analogias } from './examen-3-analogias';

const bankQuestions = examen3Analogias
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto analogias', projectQuestions(analogias));
defineProseTests('banco examen-3 analogias', bankQuestions);

describe('proyecto analogias', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 3: checkProject(analogias) devuelve la lista vacía
    expect(checkProject(analogias)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3: id analogias, nombre «Analogías», subtítulo «Aritmética con significados»
    expect([analogias.id, analogias.name, analogias.sub]).toEqual([
      'analogias',
      'Analogías',
      'Aritmética con significados',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo común de la Órbita 3: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(analogias.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(analogias.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(analogias.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón analogias.exNN.k y analogias.hoja.k', () => {
    // contract: encargo común de la Órbita 3: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(analogias).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `analogias.ex0${e}.${k}`)),
      'analogias.hoja.1',
      'analogias.hoja.2',
      'analogias.hoja.3',
    ]);
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

describe('valores de la tabla del proyecto analogias', () => {
  const [ex00, ex01, ex02] = analogias.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: w en (4, 3); Berlín con suma (0, 4) con Italia; d con sumas (2, 2) y (−2, 1); coseno 1 y norma 2,5 con «reina»; w en (−2, 3)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['x(w)=4±0.01', 'y(w)=3±0.01'],
      ['sum_x(berlin,italia)=0±0.01', 'sum_y(berlin,italia)=4±0.01'],
      [
        'sum_x(d,hombre)=2±0.01',
        'sum_y(d,hombre)=2±0.01',
        'sum_x(d,rey)=-2±0.01',
        'sum_y(d,rey)=1±0.01',
      ],
      ['cos(w,reina)=1±0.01', 'norm(w)=2.5±0.01'],
      ['x(w)=-2±0.01', 'y(w)=3±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Record<string, [number, number]>][] = [
      // contract: solución escrita en la solution de cada pregunta: (4, 3), (−1, 3), (1, 3), (2; 1,5), (−2, 3)
      [0, { w: [4, 3] }],
      [1, { berlin: [-1, 3] }],
      [2, { d: [1, 3] }],
      [3, { w: [2, 1.5] }],
      [4, { w: [-2, 3] }],
    ];
    for (const [i, vectors] of solved) {
      const q = ex00!.questions[i]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    const wrong: [number, Record<string, [number, number]>][] = [
      // contract: la intención didáctica de cada meta: (3, 0) es rey − hombre sin sumar mujer; (3, 2) es «Roma» sin más; (2, 2) es «mujer» y no la flecha; (4, 3) es «reina» con su longitud entera y (1,5; 2) mide 2,5 pero apunta distinto (coseno 0,96); (−1, 3) es «madre»
      [0, { w: [3, 0] }],
      [1, { berlin: [3, 2] }],
      [2, { d: [2, 2] }],
      [3, { w: [4, 3] }],
      [3, { w: [1.5, 2] }],
      [4, { w: [-1, 3] }],
    ];
    for (const [i, vectors] of wrong) {
      const q = ex00!.questions[i]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: una posición que incumple alguna meta no se da por buena
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        false,
      );
    }
  });

  it('ex00: las soluciones salen de la aritmética a − b + c con las posiciones del plano', () => {
    const at = (qi: number, id: string): [number, number] => {
      const q = ex00!.questions[qi]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      const v = q.plane.vectors.find((x) => x.id === id)!;
      return [v.x, v.y];
    };
    const abc = (a: number[], b: number[], c: number[]): number[] =>
      a.map((x, i) => x - b[i]! + c[i]!);
    // contract: ex00.1 rey − hombre + mujer, ex00.2 Roma − Italia + Alemania, ex00.5 hijo − hombre + mujer
    expect(abc(at(0, 'rey'), at(0, 'hombre'), at(0, 'mujer'))).toEqual([4, 3]);
    expect(abc(at(1, 'roma'), at(1, 'italia'), at(1, 'alemania'))).toEqual([-1, 3]);
    expect(abc(at(4, 'hijo'), at(4, 'hombre'), at(4, 'mujer'))).toEqual([-2, 3]);
    // contract: ex00.3 d = mujer − hombre = (1, 3) y rey + d = reina
    const d = at(2, 'mujer').map((x, i) => x - at(2, 'hombre')[i]!);
    expect(d).toEqual([1, 3]);
    expect(at(2, 'rey').map((x, i) => x + d[i]!)).toEqual(at(2, 'reina'));
    // contract: ex00.4 la norma de «reina» es 5 (terna 3, 4, 5) y la meta pide la mitad
    expect(norm(at(3, 'reina'))).toBe(5);
    // contract: ex00.5 w queda a distancia 1 de «madre» y √5 de «hija»: gana «madre»
    expect(distance([-2, 3], at(4, 'madre'))).toBe(1);
    expect(distance([-2, 3], at(4, 'hija'))).toBeCloseTo(Math.sqrt(5), 10);
    // contract: ex00.4 el coseno entre (1,5; 2) y (4, 3) es 24/25
    expect(cosine([1.5, 2], [4, 3])).toBeCloseTo(0.96, 10);
  });

  it('ex00: rango 6 y rejilla de 1, salvo el cuarto (rejilla de 0,5)', () => {
    // contract: diseño de ex00.4: el punto (2; 1,5) necesita una rejilla de 0,5
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual([
      [6, 1],
      [6, 1],
      [6, 1],
      [6, 0.5],
      [6, 1],
    ]);
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: palabras de los mapas de juguete inventados
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['hombre=(1, 1)', 'mujer=(1, 3)', 'rey=(4, 1)'],
      ['italia=(1, 1)', 'roma=(3, 2)', 'alemania=(-3, 2)'],
      ['hombre=(1, -1)', 'mujer=(2, 2)', 'rey=(-3, -2)', 'reina=(-2, 1)'],
      ['reina=(4, 3)'],
      ['hombre=(1, 1)', 'mujer=(1, 3)', 'hijo=(-2, 1)', 'hija=(-4, 4)', 'madre=(-1, 3)'],
    ]);
  });

  it('ex00: cada plano declara el par y las lecturas que pide su meta', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo común de la Órbita 3: las lecturas de pareja exigen `pair`
      expect(q.plane.pair, q.id).toBeDefined();
    }
    const readouts = ex00!.questions.map((q) => (q.type === 'manipular' ? q.plane.readouts : []));
    // contract: diseño de ex00: suma en 2 y 3 (diagonales del paralelogramo), coseno y norma en 4, distancia en 1 y 5
    expect(readouts.map((r) => r.includes('sum'))).toEqual([false, true, true, false, false]);
    expect(readouts[3]).toEqual(expect.arrayContaining(['cos', 'norm']));
    expect(readouts[0]).toContain('distance');
    expect(readouts[4]).toContain('distance');
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: (5, 5, 2, 2); coseno 0,67 ± 0,01; opción 0 (con y sin excluir); puesto 2; opción 0 (medir con una lista de casos)
    expect(ex01!.questions.map(answerOf)).toEqual([[[5, 5, 2, 2], 0], [0.67, 0.01], 0, [2, 0], 0]);
  });

  it('ex01: las respuestas numéricas se recalculan con la fórmula', () => {
    const rey = [5, 2, 4, 1];
    const hombre = [2, 1, 3, 2];
    const mujer = [2, 4, 1, 3];
    // contract: rey − hombre + mujer componente a componente
    expect(rey.map((x, i) => x - hombre[i]! + mujer[i]!)).toEqual([5, 5, 2, 2]);
    const u = [3, 3, 2].map((x, i) => x - [2, 1, 0][i]!);
    const v = [9, 1, 6].map((x, i) => x - [5, 1, 3][i]!);
    // contract: mujer − hombre = (1, 2, 2) de norma 3 y reina − rey = (4, 0, 3) de norma 5; el coseno es 10/15
    expect([u, v]).toEqual([
      [1, 2, 2],
      [4, 0, 3],
    ]);
    expect([norm(u), norm(v)]).toEqual([3, 5]);
    expect(cosine(u, v)).toBeCloseTo(2 / 3, 10);
    // contract: la respuesta redondeada a dos decimales es 0,67 y su tolerancia, 0,01
    expect(Math.abs(0.67 - cosine(u, v))).toBeLessThan(0.01);
  });

  it('ex01.3: la opción correcta da «Alemania» sin excluir y «Berlín» excluyendo', () => {
    const q = ex01!.questions[2]!;
    // contract: tabla de cosenos del enunciado: máximo «Alemania» (0,80); sin las tres entradas, «Berlín» (0,75)
    expect(q.type === 'opcion' ? q.options[q.correct] : '').toBe(
      'Sin excluir gana «Alemania»; excluyendo las tres entradas, «Berlín»',
    );
    const table: [string, number][] = [
      ['Alemania', 0.8],
      ['Berlín', 0.75],
      ['Roma', 0.6],
      ['Francia', 0.4],
      ['Italia', 0.3],
    ];
    const best = (skip: string[]): string =>
      table.filter(([p]) => !skip.includes(p)).sort((a, b) => b[1] - a[1])[0]![0];
    // contract: sin excluir, gana el coseno más alto; excluyendo Roma, Italia y Alemania, el más alto de los que quedan
    expect(best([])).toBe('Alemania');
    expect(best(['Roma', 'Italia', 'Alemania'])).toBe('Berlín');
  });

  it('ex01.4: con las entradas fuera, «Madrid» es la segunda', () => {
    const ranking: [string, number][] = [
      ['España', 0.88],
      ['París', 0.77],
      ['Lisboa', 0.76],
      ['Madrid', 0.64],
    ];
    const without = ranking.filter(([p]) => !['París', 'Francia', 'España'].includes(p));
    // contract: ranking del enunciado (datos reales) sin las entradas: Lisboa 1.ª y Madrid 2.ª
    expect(without.findIndex(([p]) => p === 'Madrid') + 1).toBe(2);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo común de la Órbita 3: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo común de la Órbita 3: un signo mal repartido (línea 1), una exclusión incompleta (línea 3) y una correcta (null); al menos una de código
    expect(analogias.sheets.map(answerOf)).toEqual([1, 3, null]);
    expect(analogias.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: «rey − (hombre + mujer)» y excluir solo `b`
    const faulty = analogias.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Restar «hombre» y sumar «mujer» es lo mismo que restar la suma de los dos: w = rey − (hombre + mujer)',
      '    puntos[palabras.index(b)] = -np.inf',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of analogias.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hoja 1: el resultado correcto es (4, 5, 4) y el erróneo (2, −3, −2)', () => {
    const rey = [4, 3, 2];
    const hombre = [1, 2, 1];
    const mujer = [1, 4, 3];
    // contract: solución de la hoja 1: rey − hombre + mujer = (4, 5, 4); rey − (hombre + mujer) = (2, −3, −2)
    expect(rey.map((x, i) => x - hombre[i]! + mujer[i]!)).toEqual([4, 5, 4]);
    expect(rey.map((x, i) => x - (hombre[i]! + mujer[i]!))).toEqual([2, -3, -2]);
  });
});

describe('banco de examen 3 del proyecto analogias', () => {
  it('tiene tres entradas fijas del proyecto analogias, con ids examen-3.*', () => {
    // contract: encargo común de la Órbita 3: 3 entradas `{ project: 'analogias', question }` con ids `examen-3.<tema>`
    expect(examen3Analogias.map((e) => e.project)).toEqual(['analogias', 'analogias', 'analogias']);
    expect(examen3Analogias.map((e) => e.question.id)).toEqual([
      'examen-3.excluir-entradas',
      'examen-3.coseno-escala',
      'examen-3.consistencia',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen3Analogias) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo común de la Órbita 3: la generada la añade la sesión principal; variedad de tipos; ids únicos en el juego
    expect(examen3Analogias.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen3Analogias.map((e) => e.question.type)).toEqual(['opcion', 'vector', 'codigo']);
    const projectIds = new Set(projectQuestions(analogias).map((q) => q.id));
    expect(examen3Analogias.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [excluir, escala] = examen3Analogias.map((e) => e.question);
    // contract: examen-3.excluir-entradas: a − b + c = a + (c − b) queda cerca de a y de c; al excluir gana «Roma» (índice 0)
    expect(excluir!.type === 'opcion' ? excluir!.options[excluir!.correct] : '').toMatch(
      /^Porque `a - b \+ c` es `a \+ \(c - b\)`.*gana «Roma»/,
    );
    const w = [2, 3, 6];
    const x = [3, 0, 4];
    // contract: examen-3.coseno-escala: cos(w, x) = 30/35 = 6/7 ≈ 0,86 y el coseno de 5w con x es el mismo
    expect(escala!.type === 'vector' ? [escala!.answer, escala!.tol] : []).toEqual([
      [0.86, 0.86],
      0.01,
    ]);
    expect(cosine(w, x)).toBeCloseTo(6 / 7, 10);
    expect(
      cosine(
        w.map((v) => 5 * v),
        x,
      ),
    ).toBeCloseTo(6 / 7, 10);
    expect(Math.abs(0.86 - 6 / 7)).toBeLessThan(0.01);
  });
});

describe('proyecto analogias: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(analogias), ...bankQuestions].filter(
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
    // contract: encargo común de la Órbita 3: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `analogias.ex02.${n}`),
      'examen-3.consistencia',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
