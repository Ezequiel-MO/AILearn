import { describe, expect, it } from 'vitest';
import type { Question } from '../../content/schema';
import { resolve } from '../../content/generators';
import {
  allTexts,
  checkMessages,
  decimalPairs,
  defineProseTests,
  garbageProbes,
  lastAssignmentRhs,
  lastLine,
  projectQuestions,
  proseRules,
  ruleProblems,
  stripComment,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { componentes } from './componentes';
import { vectores } from './index';
import { launch } from './despegue';

// Reglas generales de prosa: el despegue y el proyecto pasan por las mismas que pasarán los
// proyectos de las tareas 16 a 18 (ver tests/content/prose-helpers.ts).
defineProseTests('Despegue', launch);
defineProseTests('proyecto componentes', projectQuestions(componentes));

const all: Question[] = [...launch, ...projectQuestions(componentes)];
const byId = (id: string): Question => {
  const q = all.find((x) => x.id === id);
  if (!q) throw new Error(`No existe la pregunta ${id}`);
  return q;
};
const texts = (id: string): string => {
  const q = byId(id);
  return [q.prompt, ...q.hints, q.explain, q.solution].join('\n');
};
const lastHint = (id: string): string => byId(id).hints.at(-1)!;

describe('las reglas de prosa muerden', () => {
  const rule = (fragment: string) => {
    const r = proseRules.find((x) => x.name.includes(fragment));
    if (!r) throw new Error(`No hay regla con «${fragment}»`);
    return r;
  };
  const q = (over: Record<string, unknown>): Question =>
    ({
      id: 'x.1',
      type: 'opcion',
      prompt: 'p',
      hints: [],
      explain: 'e',
      solution: 's',
      options: ['a', 'b'],
      correct: 0,
      ...over,
    }) as Question;

  it('dimensión junto a .shape sin «eje»', () => {
    const bad = q({ prompt: 'El atributo `.shape` dice cuántos elementos hay en cada dimensión.' });
    // contract: review-15 I1: el texto roto de despegue.10 se detecta
    expect(ruleProblems(rule('«dimensión»'), [bad])).toHaveLength(1);
    const ok = q({ prompt: 'El atributo `.shape` dice cuántos elementos hay en cada eje.' });
    // contract: review-15 I1: con «eje» el texto pasa
    expect(ruleProblems(rule('«dimensión»'), [ok])).toEqual([]);
  });

  it('explain de código con la última asignación', () => {
    const bad = q({
      type: 'codigo',
      reference: 'import numpy as np\nd = B - A\n',
      explain: 'La resta `B - A` se hace componente a componente.',
    });
    // contract: review-15 I3 (a): el explain de ex02.3 con «B - A» se detecta
    expect(ruleProblems(rule('última línea'), [bad])).toHaveLength(1);
  });

  it('explain de hoja que nombra una línea', () => {
    const bad = q({
      type: 'revision',
      format: 'texto',
      lines: ['a', 'b'],
      faultyLine: 0,
      explain: 'Mira la primera línea.',
    });
    // contract: review-15 I3 (b): el explain de la hoja 3 con «la primera línea» se detecta
    expect(ruleProblems(rule('hoja no nombra'), [bad])).toHaveLength(1);
  });

  it('extractores de la referencia', () => {
    const ref = 'import numpy as np\n\nemb = {\n    "a": 1,\n}\nv = emb["a"]\nplt.show()\n';
    // contract: review-15 I3 (a): última línea no vacía y parte derecha de la última asignación
    expect(lastLine(ref)).toBe('plt.show()');
    expect(lastAssignmentRhs(ref)).toBe('emb["a"]');
  });

  it('una referencia que acaba en «)» solo no marca cualquier explain con «)»', () => {
    const ok = q({
      type: 'codigo',
      reference: 'x = foo(\n    1,\n)\n',
      explain: 'Se llama a la función (con paréntesis).',
    });
    // contract: re-review-15 2: una última línea de un solo carácter no es la respuesta
    expect(ruleProblems(rule('última línea'), [ok])).toEqual([]);
    // contract: brief 18, punto (4): con un `)` suelto al final se vigila la última línea sustancial anterior
    expect(lastLine('x = foo(\n    1,\n)\n')).toBe('x = foo(');
    const bad = q({
      type: 'codigo',
      reference: 'x = foo(\n    1,\n)\n',
      explain: 'Se escribe x = foo( con el dato dentro.',
    });
    // contract: brief 18, punto (4): el explain que contiene esa línea se marca
    expect(ruleProblems(rule('última línea'), [bad])).toHaveLength(1);
    // contract: brief 18, punto (4): una línea corta y un cierre con coma no son la respuesta
    expect(lastLine('plt.show()\n  ],\n')).toBe('plt.show()');
  });

  it('`n = 768` no marca un explain con «768 dimensiones»', () => {
    const ok = q({
      type: 'codigo',
      reference: 'import numpy as np\nn = 768\n',
      explain: 'Un embedding real tiene 768 dimensiones.',
    });
    // contract: re-review-15 2: un número suelto no es la respuesta
    expect(ruleProblems(rule('última línea'), [ok])).toEqual([]);
    // contract: re-review-15 2: el extractor exige una letra
    expect(lastAssignmentRhs('n = 768\n')).toBeUndefined();
  });

  it('`d = B - A  # resta` se detecta aunque lleve comentario', () => {
    const bad = q({
      type: 'codigo',
      reference: 'import numpy as np\nd = B - A  # resta\n',
      explain: 'La resta `B - A` se hace componente a componente.',
    });
    // contract: re-review-15 2: se quita el comentario final antes de comparar
    expect(ruleProblems(rule('última línea'), [bad])).toHaveLength(1);
    // contract: re-review-15 2: los extractores devuelven el código sin el comentario
    expect(lastAssignmentRhs('d = B - A  # resta\n')).toBe('B - A');
    expect(lastLine('d = B - A  # resta\n')).toBe('d = B - A');
  });

  it('«ejemplo» y «ejercicio» no cuentan como «eje»', () => {
    const bad = q({
      prompt: 'Por ejemplo, `.shape` dice cuántos elementos hay en cada dimensión.',
    });
    // contract: re-review-15 3: \bejes?\b no se satisface con «ejemplo»
    const problems = ruleProblems(rule('«dimensión»'), [bad]);
    expect(problems).toHaveLength(1);
    // contract: re-review-15 3: el mensaje dice cómo cumplir la regla
    expect(problems[0]).toContain('nombra también los ejes del array');
    const ok = q({
      prompt: 'Un embedding real tiene 768 dimensiones: su `.shape` sería `(768,)`, un solo eje.',
    });
    // contract: re-review-15 3: dimensiones + .shape + «eje» pasa
    expect(ruleProblems(rule('«dimensión»'), [ok])).toEqual([]);
    const okPlural = q({
      prompt: 'Las dimensiones del vector no son los ejes del array: mira `.shape`.',
    });
    // contract: re-review-15 3: «ejes» en plural también cuenta
    expect(ruleProblems(rule('«dimensión»'), [okPlural])).toEqual([]);
  });

  it('«vectores contrarios» (plural) también se detecta', () => {
    const bad = q({ explain: 'Los vectores contrarios suman cero.' });
    // contract: re-review-15 6: la regla m8 ve el plural
    expect(ruleProblems(rule('opuesto'), [bad])).toHaveLength(1);
    const bad2 = q({ explain: 'Un vector contrario al otro.' });
    // contract: re-review-15 6: y sigue viendo el singular
    expect(ruleProblems(rule('opuesto'), [bad2])).toHaveLength(1);
  });

  it('la regla de la opción más larga no es general: una pregunta legítima de 40+ pasa', () => {
    const legit = q({
      options: [
        'Una frase corta pero de más de cuarenta c.',
        'Otra frase de más de cuarenta caracteres, un poco más larga',
      ],
      correct: 1,
    });
    // contract: re-review-15 7: ninguna regla general marca la correcta más larga (es solo de despegue.5)
    expect(proseRules.flatMap((r) => r.problems(legit))).toEqual([]);
  });
});

describe('prose-helpers: retoques de la 18 (puntos 1 a 6)', () => {
  const rule = (fragment: string) => {
    const r = proseRules.find((x) => x.name.includes(fragment));
    if (!r) throw new Error(`No hay regla con «${fragment}»`);
    return r;
  };
  const q = (over: Record<string, unknown>): Question =>
    ({
      id: 'x.1',
      type: 'codigo',
      prompt: 'p',
      hints: [],
      explain: 'e',
      solution: 's',
      requirements: ['r'],
      starter: 'import numpy as np\n',
      reference: 'import numpy as np\n',
      checks: 'check(True, "ok")\n',
      ...over,
    }) as Question;

  it('(1) stripComment no corta dentro de cadenas y quita los comentarios en columna 0', () => {
    // contract: brief 18, punto (1): `plt.title("v # 1")` se conserva entera
    expect(lastLine('plt.title("v # 1")\n')).toBe('plt.title("v # 1")');
    expect(stripComment("print('a # b')  # nota")).toBe("print('a # b')");
    // contract: brief 18, punto (1): `'d = B - A\n# fin\n'` -> `d = B - A`
    expect(lastLine('d = B - A\n# fin\n')).toBe('d = B - A');
    expect(lastAssignmentRhs('d = B - A\n# fin\n')).toBe('B - A');
  });

  it('(2) `ndim` va con límites de palabra: «rendimiento» no dispara la regla de «dimensión»', () => {
    const ok = q({ prompt: 'El rendimiento no depende de las dimensiones del vector.' });
    // contract: brief 18, punto (2): `\bndim\b`, «rendimiento» no la dispara
    expect(ruleProblems(rule('«dimensión»'), [ok])).toEqual([]);
    const bad = q({ prompt: 'En este ejercicio, `ndim` cuenta las dimensiones.' });
    // contract: brief 18, punto (2): «ejercicio» no cuenta como «eje»
    expect(ruleProblems(rule('«dimensión»'), [bad])).toHaveLength(1);
  });

  it('(3) la regla del explain compara con límites de palabra', () => {
    const ok = q({ reference: 'r = x + yy\n', explain: 'Se calcula x + yyy en otro sitio.' });
    // contract: brief 18, punto (3): `x + yy` no está en `x + yyy`
    expect(ruleProblems(rule('última línea'), [ok])).toEqual([]);
    const bad = q({ reference: 'r = x + yy\n', explain: 'Se calcula x + yy, nada más.' });
    // contract: brief 18, punto (3): la coincidencia entera sigue marcándose
    expect(ruleProblems(rule('última línea'), [bad])).toHaveLength(1);
  });

  it('(5) una parte derecha que es un solo identificador no es la respuesta', () => {
    const ok = q({
      reference: 'mas_cercana = palabra\n',
      explain: 'Guarda la mejor palabra que veas.',
    });
    // contract: brief 18, punto (5): `mas_cercana = palabra` no convierte «palabra» en respuesta prohibida
    expect(lastAssignmentRhs('mas_cercana = palabra\n')).toBeUndefined();
    expect(ruleProblems(rule('última línea'), [ok])).toEqual([]);
  });

  it('(6) el explain no nombra `axis=N` ni «eje N» si la referencia lo usa', () => {
    const bad = q({ reference: 'm = np.mean(E, axis=0)\n', explain: 'Promedia por el eje 0.' });
    // contract: rereview-16 RISKS / review-16 I2: el eje es la decisión de la pregunta
    expect(ruleProblems(rule('axis=N'), [bad])).toHaveLength(1);
    const bad2 = q({ reference: 'm = np.mean(E, axis=0)\n', explain: 'Usa axis=0.' });
    expect(ruleProblems(rule('axis=N'), [bad2])).toHaveLength(1);
    const ok = q({
      reference: 'm = np.mean(E, axis=0)\n',
      explain: 'Piensa qué recorre cada eje.',
    });
    // contract: rereview-16 RISKS: sin número no hay problema
    expect(ruleProblems(rule('axis=N'), [ok])).toEqual([]);
  });

  it('(6) «que ya conoces» y decimal con coma en el starter', () => {
    // contract: rereview-16 N2
    expect(
      ruleProblems(rule('que ya conoces'), [q({ prompt: 'La resta que ya conoces.' })]),
    ).toHaveLength(1);
    // contract: rereview-16 N4
    expect(ruleProblems(rule('starter'), [q({ starter: 'w = -0,5 * u\n' })])).toHaveLength(1);
    expect(ruleProblems(rule('starter'), [q({ starter: 'w = -0.5 * u\n' })])).toEqual([]);
  });

  it('prueba de prosa del juego: vacío, `$` suelto, KaTeX estricto, punto y coma decimales', () => {
    const base = { prompt: 'p', hints: [], explain: 'e', solution: 's' };
    const opt = (over: Record<string, unknown>) =>
      q({ type: 'opcion', options: ['a', 'b'], correct: 0, ...base, ...over });
    const kt = rule('KaTeX estricto');
    // contract: brief 18, prueba de prosa del juego: texto vacío
    expect(ruleProblems(kt, [opt({ explain: '  ' })])).toHaveLength(1);
    // contract: brief 18: `$` desparejado
    expect(ruleProblems(kt, [opt({ prompt: 'Cuesta $5 y $x$ ' })])).toHaveLength(1);
    // contract: brief 18: fórmula que KaTeX rechaza con strict: 'error'
    expect(ruleProblems(kt, [opt({ prompt: 'Mira $\\frac{1}{$' })]).length).toBeGreaterThan(0);
    expect(ruleProblems(kt, [opt({ prompt: 'Mira $é$' })])).toHaveLength(1);
    expect(ruleProblems(kt, [opt({ prompt: 'Mira $(3, 4)$ y $\\vec{v}$' })])).toEqual([]);
    const dec = rule('sin punto decimal');
    // contract: brief 18: punto decimal en prosa, pero no dentro de código en línea
    expect(ruleProblems(dec, [opt({ hint: 'x', prompt: 'Vale 0.5 aquí' })])).toHaveLength(1);
    expect(ruleProblems(dec, [opt({ prompt: 'Escribe `0.5` aquí' })])).toEqual([]);
    // contract: brief 18: coma decimal sin {,} en fórmula
    expect(ruleProblems(dec, [opt({ prompt: 'Vale $0,5$' })])).toHaveLength(1);
    expect(ruleProblems(dec, [opt({ prompt: 'Vale $0{,}5$ y 0,5' })])).toEqual([]);
    // contract: review-16 m1 (R15): un par con decimales lleva «;»
    expect(decimalPairs('el punto (1,5; 3) y (1,5, 3)')).toEqual(['1,5, 3']);
    // contract: brief 18, regla R15: un paréntesis que no es un par no cuenta
    expect(decimalPairs('vale (6,08 con dos decimales) y (5-4,47)')).toEqual([]);
    expect(ruleProblems(rule('R15'), [opt({ prompt: 'En $(1{,}5, 3)$' })])).toHaveLength(1);
    expect(ruleProblems(rule('R15'), [opt({ prompt: 'En $(1{,}5;\\ 3)$' })])).toEqual([]);
  });

  it('N4: los mensajes de las comprobaciones se leen como Markdown seguro', () => {
    const code = (checks: string) => q({ checks });
    // contract: re-review-11 N4: se extraen los mensajes y no las claves
    expect(
      checkMessages(code('check(emb["gato"] > 1, "El valor es 5.")\nx = \'a b\'  # "no"')),
    ).toEqual(['El valor es 5.', 'a b']);
    const md = rule('Markdown');
    // contract: re-review-11 N4: `*`, `$`, `#`, lista numerada e imagen fuera de código
    for (const bad of [
      'Usa 2 * u',
      'Vale $5',
      'Un # suelto',
      '1. Primero',
      'Mira ![x](y)',
      'Un `suelto',
    ])
      expect(ruleProblems(md, [code(`check(False, "${bad}")`)]), bad).toHaveLength(1);
    // contract: re-review-11 N4: dentro de código en línea todo vale
    expect(ruleProblems(md, [code('check(False, "Usa `2 * u` y `#`")')])).toEqual([]);
    expect(allTexts(code('check(False, "dos palabras")')).at(-1)).toEqual({
      field: 'check[0]',
      text: 'dos palabras',
    });
  });
});

describe('despegue.5 y la longitud de sus opciones', () => {
  const longest = (q: Question): number => {
    if (q.type !== 'opcion') throw new Error('no es opcion');
    const lengths = q.options.map((o) => o.length);
    return lengths.reduce((best, n, i) => (n > lengths[best]! ? i : best), 0);
  };

  it('la correcta no es la más larga y el distractor de la traducción no se contradice (m13, 5)', () => {
    const q = byId('despegue.5');
    // contract: review-15 m13: la opción correcta (la 1) no es la más larga
    expect(q.type === 'opcion' && longest(q) !== q.correct).toBe(true);
    // contract: re-review-15 5: «palabra por palabra» y el orden original, sin «conservando las palabras»
    expect(q.type === 'opcion' && q.options[2]).toBe(
      'La traducción del texto a otro idioma, palabra por palabra y respetando el orden original de cada frase',
    );
  });
});

describe('Despegue: retoques de la revisión 15', () => {
  it('despegue.10 habla de ejes y avisa de que el vector tiene 3 dimensiones (I1)', () => {
    // contract: renombrado despegue/órbita; review-15 I1: el vector tiene 3 dimensiones (3 componentes) y un solo eje
    expect(byId('despegue.10').solution).toContain(
      'no confundas los ejes del array con las dimensiones del vector: este vector tiene 3',
    );
    // contract: renombrado despegue/órbita; review-15 I1: ningún texto de despegue.10 usa «dimensión» para el eje
    expect(texts('despegue.10')).not.toMatch(
      /una sola dimensi|solo dimensi|cada dimensi|una dimensi|dos dimensi/,
    );
  });

  it('despegue.2: el explain no describe los distractores (I3)', () => {
    // contract: renombrado despegue/órbita; review-15 I3: el explain no dice cuántas opciones tienen el signo cambiado ni cuál está permutada
    expect(byId('despegue.2').explain).not.toMatch(/signo cambiado|orden contrario/);
  });

  it('despegue.8: «e `y`» y no «y `y`» (m12)', () => {
    // contract: renombrado despegue/órbita; review-15 m12: unificar en «e `y`», como el enunciado
    expect(byId('despegue.8').solution).toContain('e `y = v[1]`');
    // contract: renombrado despegue/órbita; review-15 m12: la forma anterior ya no está
    expect(byId('despegue.8').solution).not.toContain('y `y = v[1]`');
  });
});

describe('Proyecto componentes: retoques de la revisión 15', () => {
  it('ex00.3 no dice «eje correspondiente» (I2)', () => {
    // contract: review-15 I2: la frase falsa sobre la componente nula
    expect(byId('componentes.ex00.3').prompt).not.toContain('eje correspondiente');
    // contract: review-15 I2: el texto nuevo habla de la dirección y del otro eje
    expect(byId('componentes.ex00.3').prompt).toContain('no avanza nada en esa dirección');
  });

  it('ex01.3: el cero no «aporta nada» (m9)', () => {
    // contract: review-15 m9
    expect(byId('componentes.ex01.3').solution).toContain('no se descarta aunque valga cero');
  });

  it('ex02.2 y ex02.3: la última pista nombra la operación sin escribir la expresión (m10)', () => {
    // contract: review-15 m10: sin `v.size` ni `len(v)`
    expect(lastHint('componentes.ex02.2')).not.toMatch(/v\.size|len\(v\)/);
    // contract: re-review-15 1: nombra el atributo y la función que la solución usa
    expect(lastHint('componentes.ex02.2')).toMatch(/\bsize\b/);
    expect(lastHint('componentes.ex02.2')).toMatch(/\blen\b/);
    // contract: review-15 m10: sin `B - A`
    expect(lastHint('componentes.ex02.3')).not.toMatch(/B\s*-\s*A/);
  });

  it('ex02.3 y ex02.4: el enunciado dice cómo se entrega y cómo se consulta (m6, m7)', () => {
    // contract: review-15 m6
    expect(byId('componentes.ex02.3').prompt).toContain('Calcula en `d`, como array de NumPy,');
    // contract: review-15 m7
    expect(byId('componentes.ex02.4').prompt).toContain(
      '(se consulta con la clave entre corchetes, como `emb["gato"]`)',
    );
  });

  it('ex02.4: la pista 1 no repite el paréntesis del enunciado (4)', () => {
    const q = byId('componentes.ex02.4');
    // contract: re-review-15 4: el enunciado ya explica la consulta por clave
    expect(q.hints[0]).toBe('El embedding de «perro» se pide igual, con su clave.');
    // contract: re-review-15 4: sin repetir el paréntesis del enunciado
    expect(q.hints[0]).not.toContain('entre corchetes');
  });

  it('ex02.5: enunciado con una llamada por palabra y sin construcciones no enseñadas (I4, m5)', () => {
    const q = byId('componentes.ex02.5');
    // contract: review-15 I4 (a): el enunciado dice, en prosa, que se llama una vez por palabra
    expect(q.prompt).toContain(
      'Puedes llamar a `plt.scatter` una vez por palabra, con su primera componente y su segunda.',
    );
    // contract: review-15 I4 (b): las pistas no hablan de «dos listas» ni de `emb.values()`
    expect(q.hints.join('\n')).not.toMatch(/dos listas|emb\.values/);
    // contract: review-15 I4 (b): la última pista da el ejemplo de una palabra
    expect(q.hints.at(-1)).toContain('plt.scatter(emb["gato"][0], emb["gato"][1])');
    // contract: review-15 I4 (c): la solución da primero las cuatro llamadas y después el bucle
    expect(q.solution).toContain(
      'Más corto, con un bucle: `for p in emb.values(): plt.scatter(p[0], p[1])`',
    );
    expect(q.solution.indexOf('emb["gato"][0]')).toBeLessThan(q.solution.indexOf('for p in'));
    // contract: review-15 I4 (c): fuera la versión matricial
    expect(q.solution + q.explain).not.toMatch(/\[:, 0\]|np\.array\(list/);
  });
});

// ---------- prueba de prosa del juego entero (tarea 18r) ----------

const orbit = vectores.orbits[0]!;
const bank: Question[] = orbit.examBank.flatMap((e) =>
  e.question.type === 'generada'
    ? Array.from({ length: 10 }, (_, i) => resolve(e.question as never, i + 1) as Question)
    : [e.question],
);
const game: Question[] = [...vectores.launch, ...orbit.projects.flatMap(projectQuestions), ...bank];

// El despegue, los tres proyectos (con sus hojas), el banco de examen (las generadas resueltas con
// las semillas 1 a 10) y los mensajes de las comprobaciones pasan por todas las reglas de prosa.
defineProseTests('juego vectores', game);

describe('juego vectores: lo que ninguna regla por pregunta ve', () => {
  const sheets = orbit.projects.flatMap((p) => p.sheets);
  // R25: la frase final común de las nueve hojas
  const SHEET_END =
    'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';

  it('hay nueve hojas', () => {
    // contract: brief 18, comprobación: 9 hojas
    expect(sheets).toHaveLength(9);
  });

  it('el enunciado de las nueve hojas acaba con la misma frase, que dice las dos cosas (R25)', () => {
    for (const s of sheets) {
      // contract: R25 (re-revisión 17, N1): el final del enunciado es idéntico palabra por palabra
      expect(s.prompt.endsWith(SHEET_END), s.id).toBe(true);
      // contract: R25: la frase dice dónde se señala y que sin error no hay nada que señalar
      expect(s.prompt, s.id).toMatch(/donde se comete.*arrastrarlo.*no hay error\.$/);
    }
    // contract: R25: ninguna hoja tiene otra coletilla propia en el enunciado
    expect(new Set(sheets.map((s) => s.prompt.split('? ').at(-1))).size).toBe(1);
  });

  it('el explain de ninguna hoja lleva «Si todo cuadra, no hay error» (review-16 m7)', () => {
    for (const s of sheets) {
      // contract: review-16 m7: la frase está en todas (en el enunciado) o en ninguna (en el explain)
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('los mensajes de las comprobaciones llevan el código en línea entre acentos graves (nit de la sesión 5)', () => {
    for (const q of game.filter((x) => x.type === 'codigo' && !x.id.startsWith('despegue.'))) {
      for (const m of checkMessages(q)) {
        // contract: rereview-17d n1: `np.`, `plt.`, `None` y `emb` van en código en línea en los tres proyectos y el banco
        expect(withoutCode(m), `${q.id}: ${m}`).not.toMatch(/\b(np|plt)\.\w|\bNone\b|\bemb\b/);
      }
    }
  });

  it('los identificadores del starter y de la reference y los números con signo de Python van en código en línea (review-18r m3)', () => {
    // palabras del castellano que además son nombres del starter o de la reference: `primera` (componentes.ex02.4),
    // `centroide` («el centroide tiene 2 componentes» habla del concepto), `menor` («la palabra de menor distancia»)
    // y `gato` y `lobo` (norma-distancia.ex02.3 los nombra como palabras: «de gato a lobo»; pendiente de «»)
    const SPANISH_WORDS = new Set([
      'y',
      'e',
      'o',
      'a',
      'primera',
      'centroide',
      'menor',
      'gato',
      'lobo',
    ]);
    for (const q of game.filter((x) => x.type === 'codigo' && !x.id.startsWith('despegue.'))) {
      if (q.type !== 'codigo') continue;
      const names = new Set(
        [...`${q.starter}\n${q.reference}`.matchAll(/^(\w+)\s*=/gm)]
          .map((m) => m[1]!)
          .filter((n) => !SPANISH_WORDS.has(n)),
      );
      for (const m of checkMessages(q)) {
        const plain = withoutCode(m);
        for (const n of names)
          // contract: review-18r m3 (M18): ningún nombre que el jugador escribe va suelto en un mensaje
          expect(plain, `${q.id}: ${m}`).not.toMatch(
            new RegExp(`(?<![\\p{L}_\\d])${n}(?![\\p{L}_\\d])`, 'u'),
          );
        // contract: review-18r m3: si el mensaje habla de cómo se escribe (o de la tupla), «-0,5» es código; en una cuenta sigue siendo cifra
        if (/escrib|Python|tupla/.test(m)) expect(plain, `${q.id}: ${m}`).not.toMatch(/-\d+,\d/);
        // contract: review-18r bn1: las comillas rectas son código (`"bici"`); la palabra de la prosa va entre « »
        expect(plain, `${q.id}: ${m}`).not.toMatch(/\\?"/);
      }
    }
  });

  it('la regla de red de los errores en inglés muerde y deja pasar el castellano (review-18r m2)', () => {
    const rule = proseRules.find((r) => r.name.includes('en inglés'))!;
    const withMessage = (message: string): Question =>
      ({
        id: 'x.1',
        type: 'codigo',
        prompt: 'p',
        hints: [],
        explain: 'e',
        solution: 's',
        requirements: ['r'],
        starter: '',
        reference: '',
        checks: `check(False, "${message}")`,
      }) as Question;
    for (const bad of [
      "ufunc 'add' did not contain a loop",
      'unsupported operand type(s)',
      "could not convert string to float: 'hola'",
      "float() argument must be a string or a real number, not 'NoneType'",
      'Cannot cast',
      'index 3 is out of bounds',
    ])
      // contract: review-18r m2: los textos de error de NumPy y de Python no llegan a un mensaje
      expect(ruleProblems(rule, [withMessage(bad)]), bad).toHaveLength(1);
    // contract: review-18r m2: un mensaje en castellano con código en línea pasa
    expect(ruleProblems(rule, [withMessage('`w` vale (2, 1): falta el signo menos.')])).toEqual([]);
  });

  it('las sondas de datos de tipo equivocado asignan basura a cada variable del starter (review-18r m2)', () => {
    const q = {
      id: 'x.1',
      type: 'codigo',
      starter: 'import numpy as np\nx = None  # un número\ny = None\nz = 1\n',
    } as Question;
    const probes = garbageProbes(q);
    // contract: review-18r m2: cadenas, None y listas de una cadena, en todas las variables que el starter deja en None
    expect(probes.map((p) => p.name)).toContain('np.array("hola")');
    expect(probes.map((p) => p.name)).toContain('np.array(None)');
    for (const p of probes) {
      expect(p.code).toMatch(/\nx = .*\ny = .*\n$/s);
      expect(p.code).not.toMatch(/\nz = (?!1)/);
    }
    // contract: review-18r m2: sin variable en None (preguntas de dibujo) no hay sonda
    expect(garbageProbes({ ...q, starter: 'plt.plot([1])\n' } as Question)).toEqual([]);
  });

  it('cada pregunta de código tiene mensajes que revisar', () => {
    const codes = game.filter((x) => x.type === 'codigo');
    // contract: brief 18: la prueba recorre despegue, proyectos y banco (hay preguntas de código en los tres)
    expect(codes.length).toBeGreaterThanOrEqual(18);
    // contract: review-18r M10: el banco de examen sigue incluido (sin él quedan 18 y la cota de arriba no lo vería)
    expect(codes.map((c) => c.id)).toEqual(
      expect.arrayContaining(['examen-0.bici-y', 'examen-0.centroide-animales']),
    );
    for (const c of codes) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});

describe('prose-helpers: lo que se comprueba no da la respuesta', () => {
  const rule = proseRules.find((r) => r.name.includes('`requirements`'))!;
  const q = (requirements: string[]): Question =>
    ({
      id: 'x.1',
      type: 'codigo',
      prompt: 'p',
      hints: [],
      explain: 'e',
      solution: 's',
      requirements,
      starter: 'import numpy as np\nE = np.array([[1, 2], [3, 4]])\nm = None\n',
      reference: 'import numpy as np\nE = np.array([[1, 2], [3, 4]])\nm = np.mean(E, axis=0)\n',
      checks: 'check(True, "ok")\n',
    }) as Question;

  it('muerde con la expresión de la referencia o con su eje, y deja pasar una descripción', () => {
    // contract: petición de Oliver 2026-10-20: decir qué se comprueba sin resolver la pregunta
    // (la última asignación y el eje; la línea entera, `m = …`, no está)
    expect(ruleProblems(rule, [q(['`m` es `np.mean(E, axis=0)`.'])])).toHaveLength(2);
    // contract: la decisión del eje no se nombra (como en el `explain`, review-16 I2)
    expect(ruleProblems(rule, [q(['`m` se calcula por el eje 0.'])])).toHaveLength(1);
    expect(
      ruleProblems(rule, [q(['`m` es un array con la media de cada columna de `E`.'])]),
    ).toEqual([]);
  });

  it('los `requirements` pasan por las reglas de prosa como el resto de textos', () => {
    const texts = allTexts(q(['`m` vale 0.5.']));
    // contract: proseTexts incluye `requirement[i]` (punto decimal, KaTeX, vocabulario…)
    expect(texts.map((t) => t.field)).toContain('requirement[0]');
  });
});
