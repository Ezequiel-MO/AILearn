import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { grade } from '../../content/grade';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { fallosRag } from './fallos-rag';
import { examen3FallosRag } from './examen-3-fallos-rag';

const bankQuestions = examen3FallosRag
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto fallos-rag', projectQuestions(fallosRag));
defineProseTests('banco examen-3 fallos-rag', bankQuestions);

describe('proyecto fallos-rag', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo de la Órbita 3: checkProject(fallosRag) devuelve la lista vacía
    expect(checkProject(fallosRag)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3: id fallos-rag, nombre «Por qué falla un RAG», subtítulo «Parecido no es correcto»
    expect([fallosRag.id, fallosRag.name, fallosRag.sub]).toEqual([
      'fallos-rag',
      'Por qué falla un RAG',
      'Parecido no es correcto',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo común: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(fallosRag.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(fallosRag.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(fallosRag.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón fallos-rag.exNN.k y fallos-rag.hoja.k', () => {
    // contract: encargo común: ids `<id>.ex00.1`…`<id>.ex02.5` y `<id>.hoja.1`…`<id>.hoja.3`
    expect(projectQuestions(fallosRag).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `fallos-rag.ex0${e}.${k}`)),
      'fallos-rag.hoja.1',
      'fallos-rag.hoja.2',
      'fallos-rag.hoja.3',
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

type Placement = Record<string, [number, number]>;

/** Todas las posiciones de la rejilla de la pregunta para el vector móvil `id`, con el resto de móviles en `others`. */
const gridSolutions = (q: Question, id: string, others: Placement): [number, number][] => {
  if (q.type !== 'manipular') throw new Error('solo preguntas de manipular');
  const n = Math.floor(q.plane.range / q.plane.snap);
  const out: [number, number][] = [];
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const p: [number, number] = [i * q.plane.snap, j * q.plane.snap];
      if (grade(q, { type: 'manipular', vectors: { ...others, [id]: p } })) out.push(p);
    }
  return out;
};

describe('valores de la tabla del proyecto fallos-rag', () => {
  const [ex00, ex01, ex02] = fallosRag.exercises;

  it('ex00: metas de manipular', () => {
    // contract: diseño de ex00: borde del cono (cos 0,8 y norma 5); cos 0,8 con a y 0,96 con b; 0,71 con a y con b; 0,98 con q y 0,97 con a; 0,6 con m y 0,8 con p
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['cos(q,d)=0.8±0.01', 'norm(q)=5±0.01'],
      ['cos(q,a)=0.8±0.01', 'cos(q,b)=0.96±0.01'],
      ['cos(q,a)=0.71±0.01', 'cos(q,b)=0.71±0.01'],
      ['cos(q,b)=0.98±0.01', 'cos(a,b)=0.97±0.01'],
      ['cos(q1,m)=0.6±0.01', 'cos(q2,p)=0.8±0.01'],
    ]);
  });

  it('ex00: las soluciones de la tabla cumplen las metas y una posición cercana no', () => {
    const solved: [number, Placement][] = [
      // contract: solución escrita en la solution de cada pregunta: (0, 5), (4, 3), (3, 3), b = (4, 2), q1 = q2 = (3, 4)
      [0, { q: [0, 5] }],
      [1, { q: [4, 3] }],
      [2, { q: [3, 3] }],
      [3, { b: [4, 2] }],
      [4, { q1: [3, 4], q2: [3, 4] }],
      // contract: las otras posiciones que dice la solution de ex00.5: (3, −4) para q1 y (−3, 4) para q2
      [4, { q1: [3, -4], q2: [-3, 4] }],
    ];
    for (const [i, vectors] of solved) {
      const q = ex00!.questions[i]!;
      if (q.type !== 'manipular') throw new Error('ex00 solo tiene preguntas de manipular');
      // contract: la solución de la tabla cumple todas las metas
      expect(grade(q, { type: 'manipular', vectors }), `${q.id} ${JSON.stringify(vectors)}`).toBe(
        true,
      );
    }
    const wrong: [number, Placement][] = [
      // contract: la intención didáctica de cada meta: (4, 3) tiene coseno 0,96 con d, no 0,8; (4, −3) da 0,80 con a pero 0 con b; (5, 0) da 1 con a; b = (5, 1) es paralelo a a (coseno 1 con a y 1,00 con q); q2 = (4, 3) da 0,6 con p
      [0, { q: [4, 3] }],
      [1, { q: [4, -3] }],
      [2, { q: [5, 0] }],
      [3, { b: [5, 1] }],
      [4, { q1: [3, 4], q2: [4, 3] }],
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

  it('ex00: lo que dicen las soluciones sobre el resto de la rejilla', () => {
    // contract: solution de ex00.1: de los dos bordes del cono, con longitud 5 y rejilla de 1 solo (0, 5) cae en un punto de la rejilla
    expect(gridSolutions(ex00!.questions[0]!, 'q', {})).toEqual([[0, 5]]);
    // contract: solution de ex00.2: la otra posición con 0,80 de a, (4, −3), puntúa 0 con b; la única solución de la rejilla es (4, 3)
    expect(gridSolutions(ex00!.questions[1]!, 'q', {})).toEqual([[4, 3]]);
    // contract: solution de ex00.3: sirve cualquier punto de la bisectriz, de (1, 1) a (6, 6), y solo esos
    expect(gridSolutions(ex00!.questions[2]!, 'q', {})).toEqual(
      [1, 2, 3, 4, 5, 6].map((k) => [k, k]),
    );
    // contract: solution de ex00.5: para q1 sirven (3, −4) y (3, 4); para q2, (−3, 4) y (3, 4)
    expect(
      gridSolutions(ex00!.questions[4]!, 'q1', { q2: [3, 4] }).sort((a, b) => a[1] - b[1]),
    ).toEqual([
      [3, -4],
      [3, 4],
    ]);
    expect(
      gridSolutions(ex00!.questions[4]!, 'q2', { q1: [3, 4] }).sort((a, b) => a[0] - b[0]),
    ).toEqual([
      [-3, 4],
      [3, 4],
    ]);
  });

  it('ex00: rango 6 y rejilla de 1', () => {
    // contract: diseño de ex00: todos los puntos de las soluciones caben en el rango 6 de rejilla 1
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual(Array(5).fill([6, 1]));
  });

  it('ex00: los vectores fijos de la tabla', () => {
    // contract: diseño de ex00: d, a y b, la bisectriz entre a y b, q y a de la negación, y m y p del aparcamiento
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['d=(3, 4)'],
      ['a=(5, 0)', 'b=(3, 4)'],
      ['a=(5, 0)', 'b=(0, 5)'],
      ['q=(4, 1)', 'a=(5, 1)'],
      ['m=(5, 0)', 'p=(0, 5)'],
    ]);
  });

  it('ex00: cada plano declara el par y las lecturas que pide su meta', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: encargo común: las lecturas de pareja exigen `pair`, y todas las metas son de coseno
      expect(q.plane.pair, q.id).toBeDefined();
      expect(q.plane.readouts, q.id).toContain('cos');
    }
    // contract: diseño de ex00.1: lecturas de la norma y del ángulo además del coseno
    expect(ex00!.questions[0]!.type === 'manipular' && ex00!.questions[0]!.plane.readouts).toEqual([
      'components',
      'norm',
      'cos',
      'angle',
    ]);
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tabla de ex01: (10, 8, 6) consultas contestadas; opción 0 (d12 y la sala de 30 personas); 6 aciertos con umbral 0,35; opción 0 (el coseno no dice sí o no); opción 0 (la asignación de remedios)
    expect(ex01!.questions.map(answerOf)).toEqual([[[10, 8, 6], 0], 0, [6, 0], 0, 0]);
  });

  it('ex01: los tipos de las cinco preguntas', () => {
    // contract: diseño de ex01: vector, opción, número, opción y opción
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'vector',
      'opcion',
      'numero',
      'opcion',
      'opcion',
    ]);
  });

  it('ex01.1 y ex01.3: se recalculan con los cosenos del enunciado', () => {
    // contract: mejores cosenos reales de la hoja de datos (a dos decimales) y etiquetas de las consultas
    const best = [0.77, 0.33, 0.64, 0.7, 0.62, 0.86, 0.59, 0.41, 0.72, 0.56];
    const doc = [0, 1, 12, 5, 14, 13, 3, 3, 15, 9];
    const label = [0, 1, 4, 5, 14, null, 3, null, 15, 9];
    // contract: ex01.1: consultas contestadas con umbral 0,30, 0,45 y 0,60
    expect([0.3, 0.45, 0.6].map((u) => best.filter((b) => b >= u).length)).toEqual([10, 8, 6]);
    const right = (u: number): number =>
      best.filter((b, i) => (b >= u ? doc[i] : null) === label[i]).length;
    // contract: ex01.3: con umbral 0,35 se contestan bien 6 de 10 (y 7 sin umbral)
    expect(right(0.35)).toBe(6);
    expect(right(0)).toBe(7);
    const text = fallosRag.exercises[1]!.questions[0]!.prompt;
    // contract: el enunciado de ex01.1 lleva los diez cosenos de la lista
    for (const b of best) expect(text).toContain(String(b.toFixed(2)).replace('.', ','));
  });

  it('ex01.2 y ex01.5: la opción correcta es la primera y las opciones erróneas no la repiten', () => {
    const qs = [ex01!.questions[1]!, ex01!.questions[4]!];
    for (const q of qs) {
      if (q.type !== 'opcion') throw new Error('se esperaba una pregunta de opción');
      // contract: tabla de ex01: la correcta es la opción 0
      expect(q.correct).toBe(0);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
    const remedies = ex01!.questions[4]!;
    // contract: ex01.5: código a palabras clave o híbrida, capacidad a filtro por metadatos, negación a reordenación, sin respuesta a umbral
    expect(remedies.type === 'opcion' ? remedies.options[remedies.correct] : '').toBe(
      '(1) palabras clave o híbrida; (2) filtro por metadatos; (3) reordenación; (4) umbral y «no lo sé»',
    );
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo común: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo común: al menos una hoja correcta (null) y una de código; aquí un umbral que no puede existir (línea 3), un `not r` con la posición 0 (línea 3) y una correcta
    expect(fallosRag.sheets.map(answerOf)).toEqual([3, 3, null]);
    expect(fallosRag.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'texto',
      'codigo',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: «Con un umbral de 0,37 se cumplen las dos cosas a la vez» y el `if not r`
    const faulty = fallosRag.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual([
      'Con un umbral de 0,37 se cumplen las dos cosas a la vez',
      'sin_respuesta = [i for i, r in enumerate(respuestas) if not r]',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of fallosRag.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: la hoja 1 enuncia dos condiciones que ningún umbral cumple a la vez', () => {
    // contract: cosenos reales de q1 (0,33) y de q7 (0,41): contestar a q1 exige u <= 0,33 y rechazar q7 exige u > 0,41
    const u = 0.37;
    expect(u <= 0.33 && u > 0.41).toBe(false);
    const lines = fallosRag.sheets[0]!.type === 'revision' ? fallosRag.sheets[0]!.lines : [];
    expect(lines[2]).toBe(
      'Para contestar a q1 hace falta un umbral de 0,33 o menos; para rechazar q7 hace falta uno mayor que 0,41',
    );
  });
});

describe('banco de examen 3 del proyecto fallos-rag', () => {
  it('tiene tres entradas fijas del proyecto fallos-rag, con ids examen-3.*', () => {
    // contract: encargo común de la Órbita 3: 3 entradas `{ project: 'fallos-rag', question }` con ids `examen-3.<tema>`
    expect(examen3FallosRag.map((e) => e.project)).toEqual([
      'fallos-rag',
      'fallos-rag',
      'fallos-rag',
    ]);
    expect(examen3FallosRag.map((e) => e.question.id)).toEqual([
      'examen-3.negacion',
      'examen-3.umbral-alto',
      'examen-3.filtro-capacidad',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen3FallosRag) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: encargo común de la Órbita 3: la generada la añade la sesión principal; variedad de tipos; ids únicos en el juego
    expect(examen3FallosRag.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen3FallosRag.map((e) => e.question.type)).toEqual(['opcion', 'numero', 'codigo']);
    const projectIds = new Set(projectQuestions(fallosRag).map((q) => q.id));
    expect(examen3FallosRag.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const [negacion, alto] = bankQuestions;
    // contract: examen-3.negacion: el coseno mide parecido de tema y forma (opción 0)
    expect(negacion!.type === 'opcion' ? negacion!.options[negacion!.correct] : '').toMatch(
      /^El coseno mide parecido de tema y de forma/,
    );
    // contract: examen-3.umbral-alto: con 0,87 nadie alcanza el umbral y solo q5 y q7 (sin respuesta) se contestan bien: 2
    const best = [0.77, 0.33, 0.64, 0.7, 0.62, 0.86, 0.59, 0.41, 0.72, 0.56];
    const sinRespuesta = [5, 7];
    expect(best.filter((b) => b >= 0.87)).toEqual([]);
    expect(sinRespuesta.length).toBe(2);
    expect(alto!.type === 'numero' ? [alto!.answer, alto!.tol] : []).toEqual([2, 0]);
    for (const b of best) expect(alto!.prompt).toContain(`$${b.toFixed(2).replace('.', '{,}')}$`);
  });
});

describe('proyecto fallos-rag: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(fallosRag), ...bankQuestions].filter(
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
      ...[1, 2, 3, 4, 5].map((n) => `fallos-rag.ex02.${n}`),
      'examen-3.filtro-capacidad',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });

  it('las preguntas de código que usan datos reales nombran el módulo y el modelo', () => {
    for (const q of code) {
      // contract: encargo común de la Órbita 3: los datos reales se presentan como reales; el starter importa del módulo `embeddings`
      if (q.starter.includes('from embeddings')) expect(q.prompt, q.id).toMatch(/embeddings/);
    }
    const first = fallosRag.exercises[2]!.questions[0]!;
    // contract: encargo común de la Órbita 3: el modelo se nombra con su nombre
    expect(first.prompt).toContain('paraphrase-multilingual-MiniLM-L12-v2');
    expect(first.prompt).toContain('384');
  });
});
