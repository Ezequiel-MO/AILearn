import { describe, expect, it } from 'vitest';
import { grade } from '../../content/grade';
import { checkProject } from '../../content/validate';
import type { ManipularQ, Question } from '../../content/schema';
import { distance, norm } from '../../engine/vectors';
import {
  defineProseTests,
  projectQuestions,
  proseTexts,
} from '../../../tests/content/prose-helpers';
import { normaDistancia } from './norma-distancia';
import { toy } from './toy';

describe('proyecto norma-distancia', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: tarea 17, brief: checkProject(normaDistancia) devuelve la lista vacía
    expect(checkProject(normaDistancia)).toEqual([]);
  });

  it('identifica el proyecto como pide el brief', () => {
    // contract: tarea 17, brief: id norma-distancia, nombre «Norma y distancia», subtítulo «Cuánto mide y cuánto separa»
    expect([normaDistancia.id, normaDistancia.name, normaDistancia.sub]).toEqual([
      'norma-distancia',
      'Norma y distancia',
      'Cuánto mide y cuánto separa',
    ]);
  });
});

const goalsOf = (q: Question): string[] =>
  q.type === 'manipular'
    ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
    : [];

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.options[q.correct];
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

const [ex00, ex01, ex02] = normaDistancia.exercises;
const manipular = (i: number): ManipularQ => {
  const q = ex00!.questions[i];
  if (q?.type !== 'manipular') throw new Error(`ex00.${i + 1} no es de manipular`);
  return q;
};

describe('valores de la tabla del proyecto norma-distancia', () => {
  it('ex00: metas de manipular', () => {
    // contract: tarea 17, tabla de ex00 (norma 5; distancia 5; unitario con x = 0,6; distancia 1,2 ± 0,3; norma 10 y distancia 5)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['norm(v)=5±0.01'],
      ['distance(u,v)=5±0.01'],
      ['norm(v)=1±0.01', 'x(v)=0.6±0.01'],
      ['distance(q,perro)=1.2±0.3'],
      ['norm(w)=10±0.01', 'distance(w,u)=5±0.01'],
    ]);
  });

  it('ex00: rango y rejilla de cada plano', () => {
    // contract: tarea 17, tabla de ex00 (rango y snap: 6/1, 6/1, 2/0,2, 6/1, 10/1)
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual([
      [6, 1],
      [6, 1],
      [2, 0.2],
      [6, 1],
      [10, 1],
    ]);
  });

  it('ex00: vectores fijos y posición inicial de la tabla', () => {
    const fixed = (q: ManipularQ): string[] =>
      q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`);
    // contract: tarea 17, tabla de ex00: u fijo en (1, 1) / perro fijo en (4, 3) / u fijo en (3, 4)
    expect(fixed(manipular(1))).toEqual(['u=(1, 1)']);
    expect(fixed(manipular(3))).toEqual(['perro=(4, 3)']);
    expect(fixed(manipular(4))).toEqual(['u=(3, 4)']);
    // contract: tarea 17, tabla de ex00: v empieza en (1, 2) en la pregunta 2
    expect(manipular(1).plane.vectors.find((v) => v.id === 'v')).toMatchObject({ x: 1, y: 2 });
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tarea 17, tabla de ex01 (5; 3; 6,083 ± 0,01; (0,6; 0,8); gato)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [5, 0],
      [3, 0],
      [6.083, 0.01],
      [[0.6, 0.8], 0.01],
      'gato',
    ]);
  });

  it('ex01: los tipos de pregunta de la tabla', () => {
    // contract: tarea 17, tabla de ex01 (numero, numero, numero, vector, opcion)
    expect(ex01!.questions.map((q) => q.type)).toEqual([
      'numero',
      'numero',
      'numero',
      'vector',
      'opcion',
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: tarea 17, tabla de ex02: cinco preguntas de programar
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea y formato de cada una', () => {
    // contract: tarea 17, tabla de hojas (la segunda, la tercera, ninguna)
    expect(normaDistancia.sheets.map(answerOf)).toEqual([1, 2, null]);
    // contract: tarea 17, tabla de hojas (texto, codigo, codigo)
    expect(normaDistancia.sheets.map((s) => s.format)).toEqual(['texto', 'codigo', 'codigo']);
  });

  it('hojas: las líneas son las de la tabla', () => {
    // contract: tarea 17, tabla de hojas (líneas de cada hoja)
    expect(normaDistancia.sheets.map((s) => s.lines)).toEqual([
      ['v = (1, 2, 2)', '‖v‖ = 1 + 2 + 2', '‖v‖ = 5'],
      [
        'a = np.array([3, 4])',
        'b = np.array([4, -2])',
        'd = np.linalg.norm(a) - np.linalg.norm(b)',
      ],
      ['v = np.array([3, 4])', 'u = v / np.linalg.norm(v)'],
    ]);
  });

  it('ids: <proyecto>.ex0N.<n> y <proyecto>.hoja.<n>', () => {
    // contract: tarea 17, reglas comunes de contenido: ids <etapa>.<ejercicio>.<n>
    expect(normaDistancia.exercises.flatMap((e) => e.questions.map((q) => q.id))).toEqual(
      [0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((n) => `norma-distancia.ex0${e}.${n}`)),
    );
    expect(normaDistancia.sheets.map((s) => s.id)).toEqual([
      'norma-distancia.hoja.1',
      'norma-distancia.hoja.2',
      'norma-distancia.hoja.3',
    ]);
  });
});

/** Todas las colocaciones de la rejilla del único móvil que cumplen las metas. */
const solutions = (q: ManipularQ): [number, number][] => {
  const mover = q.plane.vectors.find((v) => v.movable)!;
  const n = Math.floor(q.plane.range / q.plane.snap + 1e-9);
  const values = Array.from({ length: 2 * n + 1 }, (_, i) =>
    Number(((i - n) * q.plane.snap).toFixed(10)),
  );
  const found: [number, number][] = [];
  for (const x of values) {
    for (const y of values) {
      if (grade(q, { type: 'manipular', vectors: { [mover.id]: [x, y] } })) found.push([x, y]);
    }
  }
  return found;
};

describe('metas de manipular: qué colocaciones de la rejilla las cumplen', () => {
  it('ex00.1: todas las que están a 5 del origen, y solo ellas', () => {
    const found = solutions(manipular(0));
    // contract: independiente: la norma del motor (src/engine/vectors) sobre cada punto aceptado
    expect(found.length).toBeGreaterThan(0);
    for (const p of found) expect(norm(p)).toBeCloseTo(5, 6);
    // contract: tarea 17, brief: norma 5, con (3, 4), (4, 3), (5, 0) y (0, 5) entre las soluciones
    expect(found).toEqual(
      expect.arrayContaining([
        [3, 4],
        [4, 3],
        [5, 0],
        [0, 5],
      ]),
    );
  });

  it('ex00.2: todas las que están a 5 de u = (1, 1), y alguna', () => {
    const found = solutions(manipular(1));
    expect(found.length).toBeGreaterThan(0);
    // contract: independiente: la distancia del motor sobre cada punto aceptado
    for (const p of found) expect(distance(p, [1, 1])).toBeCloseTo(5, 6);
    // contract: tarea 17, solución de ex00.2: (4, 5), (6, 1) y (1, 6) sirven
    expect(found).toEqual(
      expect.arrayContaining([
        [4, 5],
        [6, 1],
        [1, 6],
      ]),
    );
  });

  it('ex00.3: solo (0,6; 0,8) y (0,6; −0,8) en la rejilla de 0,2', () => {
    // contract: tarea 17, brief: unitario con x = 0,6; x² + y² = 1 da y = ±0,8
    expect(solutions(manipular(2))).toEqual([
      [0.6, -0.8],
      [0.6, 0.8],
    ]);
  });

  it('ex00.4: los ocho puntos a distancia 1 o √2 de perro, y ninguno más', () => {
    // contract: tarea 17, brief: la meta 4 admite los puntos de rejilla a distancia 1 o √2 de perro
    expect(solutions(manipular(3)).sort((a, b) => a[0] - b[0] || a[1] - b[1])).toEqual([
      [3, 2],
      [3, 3],
      [3, 4],
      [4, 2],
      [4, 4],
      [5, 2],
      [5, 3],
      [5, 4],
    ]);
  });

  it('ex00.5: unicidad, solo (6, 8) cumple las dos metas en toda la rejilla', () => {
    // contract: tarea 17, brief: la meta 5 solo la cumple (6, 8) entre los puntos de rejilla
    expect(solutions(manipular(4))).toEqual([[6, 8]]);
  });
});

describe('respuestas declaradas, recalculadas con el motor', () => {
  const at = (i: number): Question => ex01!.questions[i]!;

  it('numero: normas y distancia', () => {
    // contract: independiente: norm de src/engine/vectors sobre los datos del enunciado
    expect(norm([3, 4])).toBeCloseTo(5, 9);
    expect(norm([1, -2, 2])).toBeCloseTo(3, 9);
    expect(distance(toy['gato']!, toy['lobo']!)).toBeCloseTo(Math.sqrt(37), 9);
    // contract: tarea 17, tabla de ex01: las respuestas declaradas son esas
    expect([at(0), at(1), at(2)].map((q) => (q.type === 'numero' ? q.answer : NaN))).toEqual([
      5, 3, 6.083,
    ]);
    // contract: R18, regla de los dos decimales: 6,08 releído queda dentro de la tolerancia
    const q3 = at(2);
    if (q3.type !== 'numero') throw new Error('ex01.3 no es numero');
    expect(Math.abs(Math.round(Math.sqrt(37) * 100) / 100 - q3.answer)).toBeLessThanOrEqual(q3.tol);
  });

  it('vector: el unitario de (3, 4)', () => {
    const q = at(3);
    if (q.type !== 'vector') throw new Error('ex01.4 no es vector');
    const n = norm([3, 4]);
    // contract: independiente: v / ‖v‖ con la norma del motor
    expect(q.answer).toEqual([3 / n, 4 / n]);
  });

  it('opcion: la palabra más cercana a q = (2, 4) entre las opciones', () => {
    const q = at(4);
    if (q.type !== 'opcion') throw new Error('ex01.5 no es opcion');
    const dist = (w: string): number => distance(toy[w]!, [2, 4]);
    const sorted = [...q.options].sort((a, b) => dist(a) - dist(b));
    // contract: independiente: distance del motor con los vectores del juguete (gato 1, perro 2,24, bici 4,12, lobo 6,32)
    expect(sorted).toEqual(['gato', 'perro', 'bici', 'lobo']);
    expect(q.options[q.correct]).toBe(sorted[0]);
    expect([1, 2.24, 4.12, 6.32]).toEqual(
      ['gato', 'perro', 'bici', 'lobo'].map((w) => Math.round(dist(w) * 100) / 100),
    );
  });

  it('plano de ex01.3: gato y lobo del juguete, sin lecturas', () => {
    const q = at(2);
    if (q.type !== 'numero' || !q.plane) throw new Error('ex01.3 sin plano');
    // contract: tarea 17, reglas comunes: los planos de lectura llevan readouts vacíos para no regalar la respuesta
    expect(q.plane.readouts).toEqual([]);
    // contract: tabla de embeddings de juguete: gato (3, 4) y lobo (4, −2)
    expect(q.plane.vectors.map((v) => [v.id, v.x, v.y])).toEqual([
      ['gato', 3, 4],
      ['lobo', 4, -2],
    ]);
  });
});

describe('contenido del proyecto', () => {
  const all = projectQuestions(normaDistancia);
  const textOf = (q: Question): string =>
    proseTexts(q)
      .map((t) => t.text)
      .join('\n');

  it('cada ejercicio enlaza con IA con el juguete', () => {
    for (const [i, e] of normaDistancia.exercises.entries()) {
      // contract: reglas comunes de contenido: al menos una pregunta de cada ejercicio enlaza con IA con los embeddings de juguete
      expect(
        e.questions.some((q) => /juguete/i.test(q.prompt)),
        `ex0${i}`,
      ).toBe(true);
    }
  });

  it('los textos no llevan punto decimal ni coma decimal sin llaves dentro de una fórmula', () => {
    for (const q of all) {
      const text = textOf(q);
      // contract: spec: los decimales se muestran con coma; en fórmulas `{,}` (R18, prosa de la tarea 15)
      expect(text.match(/\d\.\d/g) ?? [], `${q.id}: punto decimal`).toEqual([]);
      const math = text.match(/\$[^$]+\$/g) ?? [];
      for (const m of math) expect(m, `${q.id}: coma decimal sin {,}`).not.toMatch(/\d,\d/);
    }
  });

  it('ningún texto está vacío ni lleva un $ sin pareja', () => {
    for (const q of all) {
      for (const t of proseTexts(q)) {
        // contract: spec: nada vigila los textos vacíos ni los $ sueltos en el contenido escrito a mano
        expect(t.text.trim(), `${q.id} ${t.field}`).not.toBe('');
        const dollars = t.text.replace(/\\\$/g, '').split('$').length - 1;
        expect(dollars % 2, `${q.id} ${t.field}: $ desparejado`).toBe(0);
      }
    }
  });

  it('en el proyecto «dimensión» es el número de componentes: nunca se habla de ejes ni de .shape', () => {
    for (const q of all) {
      // contract: review-15 I1: «dimensión» = número de componentes; este proyecto no usa ndim, .shape ni axis en su prosa
      expect(textOf(q), q.id).not.toMatch(/\.shape|ndim|axis=|\beje[s]? del array/);
    }
  });

  it('las líneas de las hojas son texto plano, sin Markdown ni KaTeX', () => {
    for (const s of normaDistancia.sheets) {
      // contract: review-15, «Datos que las tareas siguientes deben conocer»: las líneas de una hoja son texto plano
      for (const l of s.lines) expect(l, s.id).not.toMatch(/[$`]/);
    }
  });

  it('en la pregunta 5 de código el diccionario sigue el orden que no regala el error del último elemento', () => {
    const q = ex02!.questions[4]!;
    if (q.type !== 'codigo') throw new Error('ex02.5 no es codigo');
    // contract: tarea 17, diseño de ex02.5: «gato» ni primera ni última clave, para que ni «quedarse con la primera» ni «con la última» acierten
    const keys = [...q.starter.matchAll(/^\s+"(\w+)":/gm)].map((m) => m[1]);
    expect(keys).toHaveLength(4);
    expect(keys.indexOf('gato')).not.toBe(0);
    expect(keys.indexOf('gato')).not.toBe(keys.length - 1);
  });
});

describe('ronda de arreglo 1 (revisión de la tarea 17)', () => {
  const byId = (id: string): Question => {
    const q = projectQuestions(normaDistancia).find((x) => x.id === `norma-distancia.${id}`);
    if (!q) throw new Error(`No existe ${id}`);
    return q;
  };
  const codigo = (id: string) => {
    const q = byId(id);
    if (q.type !== 'codigo') throw new Error(`${id} no es de código`);
    return q;
  };

  it('I1: la solution de cada pregunta de código contiene, literales, las líneas de la reference que no están en el starter', () => {
    for (const q of ex02!.questions) {
      if (q.type !== 'codigo') throw new Error(`${q.id} no es de código`);
      const bare = (l: string): string => l.replace(/\s+#.*$/, '').trim();
      const starter = new Set(q.starter.split('\n').map(bare));
      const missing = q.reference
        .split('\n')
        .map(bare)
        .filter((l) => l !== '' && !starter.has(l))
        .filter((l) => !q.solution.includes(l));
      // contract: review-17 I1
      expect(missing, `${q.id}: líneas de la reference que la solution no escribe`).toEqual([]);
    }
  });

  it('I1: el enunciado de ex02.5 dice qué vale `palabra` en cada vuelta y que el cuerpo va sangrado', () => {
    const { prompt } = codigo('ex02.5');
    // contract: review-17 I1
    expect(prompt).toMatch(/`palabra` vale esa clave/);
    // contract: review-17 I1
    expect(prompt).toMatch(/sangrad/);
  });

  it('I1 (resto, N2): la solution de ex02.5 lleva el programa en un bloque cercado con su sangrado', () => {
    const solution = codigo('ex02.5').solution;
    const block = /```python\n([\s\S]*?)\n```/.exec(solution);
    // contract: rereview-17 I1/N2: un bloque cercado de cinco líneas, con 4 y 8 espacios de sangrado
    expect(block, 'la solution no tiene bloque ```python').not.toBeNull();
    expect(block![1]!.split('\n')).toEqual([
      'for palabra in emb:',
      '    d = np.linalg.norm(q - emb[palabra])',
      '    if d < menor:',
      '        menor = d',
      '        mas_cercana = palabra',
    ]);
  });

  it('I1 (resto, N3): el enunciado de ex02.5 explica el for y el if con frases cortas, un ejemplo ajeno y el paso de guardar', () => {
    const { prompt } = codigo('ex02.5');
    const example = /```python\n([\s\S]*?)\n```/.exec(prompt);
    // contract: rereview-17 I1: un ejemplo mínimo de for + if con otros nombres y otra tarea
    expect(example, 'el enunciado no tiene ejemplo cercado').not.toBeNull();
    expect(example![1]).toMatch(/^for \w+ in \w+:\n {4}if .*:\n {8}\w+ = /);
    expect(example![1]).not.toMatch(/emb|menor|mas_cercana|palabra/);
    // contract: rereview-17b F6: el ejemplo no usa `mayor`, que parece pareja de `menor` y no lo es
    expect(example![1]).not.toMatch(/mayor/);
    expect(prompt).not.toMatch(/`mayor`/);
    const prose = prompt.replace(/```[\s\S]*?```/g, ' ');
    // contract: rereview-17 I1: ninguna frase del enunciado pasa de 45 palabras (la de la ronda 1 tenía 110)
    for (const sentence of prose.split(/(?<=[.:?!])\s+/)) {
      expect(sentence.trim().split(/\s+/).length, sentence).toBeLessThanOrEqual(45);
    }
    // contract: rereview-17 I1: el paso de guardar, dicho expresamente
    expect(prose).toMatch(/guarda[^.]*`menor`[^.]*`mas_cercana`/);
    // contract: rereview-17 N3: el paréntesis aclara qué es sangrar y que el Tab se usa para sangrar
    expect(prose).toMatch(/metidas hacia la derecha; se hace con la tecla Tab/);
  });

  it('ronda 3: las comprobaciones de ex02.5 solo miran `mas_cercana`, nunca `menor`', () => {
    const { checks } = codigo('ex02.5');
    // Los mensajes sí pueden hablar de `menor` al jugador: se mira el código, sin los textos entre comillas.
    const source = checks.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    // contract: rereview-17b F1: ninguna comprobación lee `menor` (variable incidental) ni busca nombres con globals()
    expect(source).not.toMatch(/menor|globals|locals|_m\b/);
    expect(source).not.toMatch(/'/);
    // contract: rereview-17b encargo, punto 3: las comprobaciones miran mas_cercana (tipo y valor) y nada más
    const names = new Set(source.match(/\b[a-z_][a-z_0-9]*\b/gi));
    expect([...names].sort()).toEqual(
      ['_str', 'check', 'emb', 'in', 'isinstance', 'mas_cercana', 'not', 'or', 'and', 'str'].sort(),
    );
  });

  it('ronda 4: los mensajes de ex02.5 se pintan con Markdown (acentos graves emparejados, sin *, # ni $ sueltos)', () => {
    const { checks } = codigo('ex02.5');
    const messages = [...checks.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1] ?? '');
    expect(messages.length).toBeGreaterThan(0);
    for (const m of messages) {
      // contract: rereview-17c encargo: código en línea entre acentos graves, sin *, # ni $ sueltos
      expect(m.split('`').length % 2, m).toBe(1);
      expect(m, m).not.toMatch(/[*#$]/);
    }
    // contract: rereview-17c I1/m1: los mensajes de «lobo» y «bici» dicen el hecho cierto y no nombran la respuesta
    for (const word of ['lobo', 'bici']) {
      const m = messages.find((x) => x.startsWith(`\`${word}\` no es la más cercana`));
      expect(m, word).toBeDefined();
      expect(m, word).not.toMatch(/gato/);
    }
  });

  it('ronda 5 (m-b): «lobo» y «bici» dan primero el hecho y después las causas como posibilidades', () => {
    const { checks } = codigo('ex02.5');
    const messages = [...checks.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1] ?? '');
    for (const word of ['lobo', 'bici']) {
      const m = messages.find((x) => x.startsWith(`\`${word}\` no es la más cercana`))!;
      // contract: rereview-17d m-b: una sola frase de hecho y después «Suele pasar si» (posibilidad, no causa cerrada)
      expect(m, word).toMatch(/^[^.]*\. Suele pasar si /);
    }
  });

  it('ronda 5 (nit): los mensajes de ex02.5 llevan todo el código en línea entre acentos graves', () => {
    const { checks } = codigo('ex02.5');
    const messages = [...checks.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1] ?? '');
    for (const m of messages) {
      const plain = m.replace(/`[^`]*`/g, '');
      // contract: rereview-17d n1: ningún identificador del código va suelto en un mensaje
      expect(plain, m).not.toMatch(/(?<![\p{L}_])(mas_cercana|emb|q|d|None)(?![\p{L}_])/u);
    }
  });

  it('(5) el explain de ex02.5 puede decir «palabra»: la regla ya no la prohíbe', () => {
    // contract: brief 18, punto (5): «la mejor palabra» en vez de «la mejor candidata»
    expect(codigo('ex02.5').explain).toContain('la mejor palabra');
    expect(codigo('ex02.5').explain).not.toContain('candidata');
  });

  it('ronda 4 (m2): la solution de ex02.5 da las distancias en el orden del diccionario y dice cuándo cambia mas_cercana', () => {
    const { solution } = codigo('ex02.5');
    // contract: rereview-17c m2 (M21): las cuatro distancias van en el orden de emb, como las ve el jugador al seguir el bucle
    expect(solution).toMatch(/«perro»[^«]*«gato»[^«]*«lobo»[^«]*«bici»/);
    // contract: rereview-17c m2 (M22): con perro, 2,24 < 1000; con gato, 1 < 2,24; lobo y bici no mejoran
    expect(solution).toMatch(/con «perro» y después con «gato»/);
  });

  it('ronda 3: el orden de emb en ex02.5 es perro, gato, lobo, bici, igual en el starter y en la reference', () => {
    const q = codigo('ex02.5');
    const keys = (src: string) =>
      [...src.matchAll(/^\s+"(\w+)": np\.array\(\[(.*?)\]\)/gm)].map((m) => `${m[1]} ${m[2]}`);
    // contract: rereview-17b R27: único orden de los 24 en que ningún error típico deja «gato»; vectores de toy.ts sin cambio
    expect(keys(q.starter)).toEqual(['perro 4, 3', 'gato 3, 4', 'lobo 4, -2', 'bici -2, 3']);
    expect(keys(q.reference)).toEqual(keys(q.starter));
  });

  it('ronda 3 (F4, F5): el enunciado dice dónde va el cálculo de la distancia y la pista 2 da la línea del if', () => {
    const { prompt, hints } = codigo('ex02.5');
    // contract: rereview-17b F4
    expect(prompt).toMatch(/dentro del `for`, antes del `if`/);
    // contract: rereview-17b F5: la pista 2 añade la línea de la comparación, que el enunciado no escribe
    expect(hints[1]).toMatch(/`if d < menor:`/);
    expect(prompt).not.toMatch(/if d < menor/);
  });

  it('I4 y R25: el enunciado de toda hoja acaba con la frase común, que dice dónde se señala el error', () => {
    for (const s of normaDistancia.sheets) {
      // contract: review-17 I4 y R25: la frase común dice dónde se comete el error, que las siguientes lo arrastran y que sin error no hay nada que señalar
      expect(s.prompt, s.id).toMatch(
        /Si hay error, señala la línea donde se comete \(las siguientes pueden arrastrarlo\); si todo cuadra, no hay error\.$/,
      );
    }
  });

  it('I5: la pista de ex00.2 manda hacia arriba y desde (1, 2) se llega a la meta; hacia la derecha no', () => {
    const q = manipular(1);
    const start = q.plane.vectors.find((v) => v.id === 'v')!;
    const reaches = (step: [number, number]): boolean => {
      for (let k = 0; k <= 12; k++) {
        const p: [number, number] = [start.x + k * step[0], start.y + k * step[1]];
        if (Math.abs(p[0]) > q.plane.range || Math.abs(p[1]) > q.plane.range) return false;
        if (grade(q, { type: 'manipular', vectors: { v: p } })) return true;
      }
      return false;
    };
    // contract: review-17 I5: hacia arriba desde (1, 2) llega a (1, 6), que está a 5 de u = (1, 1)
    expect(q.hints[1]).toMatch(/hacia arriba/);
    expect(reaches([0, 1])).toBe(true);
    // contract: review-17 I5: hacia la derecha desde (1, 2) la distancia es √(k²+1), que nunca vale 5
    expect(reaches([1, 0])).toBe(false);
  });

  it('m1: ex00.5 y el explain de ex01.4 distinguen dirección y sentido', () => {
    // contract: review-17 m1
    expect(byId('ex00.5').prompt).toMatch(/dirección y (el mismo )?sentido/);
    expect(byId('ex01.4').explain).toMatch(/ni su sentido/);
  });

  it('m2: la solution de ex01.3 da la distancia con los dos decimales que pide', () => {
    // contract: review-17 m2
    expect(byId('ex01.3').solution).toMatch(/6\{,\}08(?!\d)/);
  });

  it('m3: ningún texto usa \\hat{v}, que no se presenta en ninguna parte', () => {
    for (const q of projectQuestions(normaDistancia)) {
      for (const t of proseTexts(q)) {
        // contract: review-17 m3
        expect(t.text, `${q.id} ${t.field}`).not.toMatch(/\\hat\{/);
      }
    }
  });

  it('m4: la solution de ex00.3 dice de dónde sale x² + y² = 1', () => {
    // contract: review-17 m4
    expect(byId('ex00.3').solution).toMatch(/norma es \$\\sqrt\{x\^2\+y\^2\}\$/);
  });

  it('m8: la primera pista de ex02.5 avisa de que la distancia es un número, la norma de la resta', () => {
    // contract: review-17 m8: sin la norma, `d < menor` lanza un error de NumPy en inglés
    expect(codigo('ex02.5').hints[0]).toMatch(/número/);
  });
});

defineProseTests('proyecto norma-distancia', projectQuestions(normaDistancia));
