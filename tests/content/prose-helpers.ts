import katex from 'katex';
import { describe, expect, it } from 'vitest';
import type { CodigoQ, Project, Question } from '../../src/content/schema';

/**
 * Pruebas de prosa de los textos visibles de un juego (ronda de arreglo 1 de la tarea 15).
 * Cada proyecto nuevo (tareas 16 a 18) y el despegue pasan por las mismas reglas:
 *
 *   defineProseTests('proyecto normas', projectQuestions(normas));
 *
 * Las reglas son datos (`proseRules`) y `rulesProblems` las aplica sin vitest, para poder
 * ejercitarlas con un texto roto en una prueba propia.
 */

/** Todas las preguntas de un proyecto: las de sus ejercicios y las tres hojas. */
export const projectQuestions = (p: Project): Question[] => [
  ...p.exercises.flatMap((e) => e.questions),
  ...p.sheets,
];

export interface ProseText {
  /** `prompt`, `hint[0]`, `explain`, `solution`, `option[2]`, `line[1]`. */
  field: string;
  text: string;
}

/** Los textos que ve el jugador de una pregunta. No incluye `starter`, `checks` ni `reference`. */
export const proseTexts = (q: Question): ProseText[] => [
  { field: 'prompt', text: q.prompt },
  ...q.hints.map((text, i) => ({ field: `hint[${i}]`, text })),
  { field: 'explain', text: q.explain },
  { field: 'solution', text: q.solution },
  ...(q.type === 'opcion' ? q.options.map((text, i) => ({ field: `option[${i}]`, text })) : []),
  ...(q.type === 'revision' ? q.lines.map((text, i) => ({ field: `line[${i}]`, text })) : []),
  ...(q.type === 'codigo'
    ? q.requirements.map((text, i) => ({ field: `requirement[${i}]`, text }))
    : []),
  ...(q.type === 'manipular' && q.purpose
    ? [
        { field: 'purpose.why', text: q.purpose.why },
        { field: 'purpose.aim', text: q.purpose.aim },
        { field: 'purpose.takeaway', text: q.purpose.takeaway },
      ]
    : []),
];

const squash = (s: string): string => s.replace(/\s+/g, ' ').trim();

/**
 * Quita el comentario de una línea de Python: el que sigue al código (`código  # comentario`) y el
 * de una línea entera (`# comentario`, también en la columna 0). Un `#` dentro de una cadena
 * (`plt.title("v # 1")`) no es un comentario.
 */
export const stripComment = (line: string): string => {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quote !== null) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#') return line.slice(0, i).trim();
  }
  return line.trim();
};

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `text` contiene `snippet` con límites de palabra (`suma` no está en `sumando`). */
const mentions = (text: string, snippet: string): boolean =>
  new RegExp(`(?<!\\w)${escapeRe(snippet)}(?!\\w)`).test(text);

/** Una línea vale como «respuesta» si tiene al menos una letra y 4 o más caracteres. */
const substantial = (s: string): boolean => s.length >= 4 && /[A-Za-z]/.test(s);

/** Una línea que solo cierra un paréntesis, corchete o llave (`)`, `],`). */
const loneCloser = (s: string): boolean => /^[)\]}]+,?$/.test(s);

/**
 * Última línea no vacía (sin su comentario) del programa de referencia, si es sustancial. Si la
 * última línea es un cierre suelto (`)`), se vigila la última línea sustancial anterior.
 */
export const lastLine = (reference: string): string | undefined => {
  const lines = reference
    .split('\n')
    .map(stripComment)
    .filter((l) => l !== '');
  const last = lines.at(-1);
  if (last === undefined) return undefined;
  if (loneCloser(last)) return lines.slice(0, -1).findLast(substantial);
  return substantial(last) ? last : undefined;
};

const balanced = (s: string): boolean => {
  let depth = 0;
  for (const c of s) {
    if ('([{'.includes(c)) depth++;
    if (')]}'.includes(c)) depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
};

/**
 * Parte derecha de la última asignación `nombre = expresión` (de una sola línea, sin su comentario)
 * del programa, si es sustancial y no es un solo identificador (`mas_cercana = palabra` no
 * convierte «palabra» en la respuesta).
 */
export const lastAssignmentRhs = (reference: string): string | undefined => {
  const rhs = reference
    .split('\n')
    .map((l) => /^[A-Za-z_]\w*\s*=(?!=)\s*(.+)$/.exec(stripComment(l))?.[1]?.trim())
    .filter((r): r is string => r !== undefined && substantial(r) && balanced(r));
  const last = rhs.at(-1);
  return last !== undefined && !/^[A-Za-z_]\w*$/.test(last) ? last : undefined;
};

// ---------- textos con sus comprobaciones, trozos de código y de fórmula ----------

/** Un literal de cadena de Python, entre comillas dobles o simples. */
const PY_STRING = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g;

/**
 * Los mensajes de las comprobaciones de una pregunta de código: las cadenas de `checks` con algún
 * espacio (las claves de `emb` y similares no son mensajes). El arnés pinta cada mensaje con `Md`.
 */
export const checkMessages = (q: Question): string[] =>
  q.type !== 'codigo'
    ? []
    : q.checks
        .split('\n')
        .map(stripComment)
        .flatMap((line) => [...line.matchAll(PY_STRING)].map((m) => m[1] ?? m[2] ?? ''))
        .filter((m) => m.includes(' '));

/**
 * Fragmentos de los errores de NumPy y de Python en inglés: ningún mensaje de comprobación los
 * contiene y ninguna ejecución con datos de tipo equivocado los saca (review-18r m2).
 */
export const NUMPY_ENGLISH =
  /ufunc|operand|dtype\(|could not convert|must be a string or a real number|TypeError|ValueError|IndexError|KeyError|AttributeError|out of bounds|has no attribute|is not subscriptable|not supported between|object is not|[Cc]annot /;

/**
 * Programas del jugador con datos de tipo equivocado (cadenas, `None`, listas de una cadena) en cada
 * variable que el `starter` deja en `None`. Vacía si el `starter` no deja ninguna (preguntas de dibujo).
 */
export const garbageProbes = (q: Question): { name: string; code: string }[] => {
  if (q.type !== 'codigo') return [];
  const targets = [...q.starter.matchAll(/^(\w+)\s*=\s*None\s*(?:#.*)?$/gm)].map((m) => m[1]!);
  if (targets.length === 0) return [];
  const values = [
    'np.array("hola")',
    'np.array(None)',
    'np.array(["a", "b", "c"])',
    'np.array([None, None, None])',
    '"hola"',
    '[None]',
  ];
  return values.map((value) => ({
    name: value,
    code: q.starter + targets.map((t) => `${t} = ${value}\n`).join(''),
  }));
};

/** Textos de prosa más los mensajes de las comprobaciones (`check[i]`). */
export const allTexts = (q: Question): ProseText[] => [
  ...proseTexts(q),
  ...checkMessages(q).map((text, i) => ({ field: `check[${i}]`, text })),
];

/** Quita los bloques cercados y el código en línea. */
export const withoutCode = (s: string): string =>
  s.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ');

/** Las fórmulas (`$…$`, `$$…$$`) de un texto, sin su código, y el resto del texto sin ellas. */
export const splitMath = (text: string): { math: string[]; display: boolean[]; rest: string } => {
  const math: string[] = [];
  const display: boolean[] = [];
  const rest = withoutCode(text).replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_m, d, i) => {
    math.push((d ?? i) as string);
    display.push(d !== undefined);
    return ' ';
  });
  return { math, display, rest };
};

const PAIR_NUMBER = String.raw`[-−]?\d+(?:,\d+)?`;
const PAIR = new RegExp(String.raw`^\s*${PAIR_NUMBER}(?:\s*[,;]\s*${PAIR_NUMBER})+\s*$`);

/**
 * Pares y tuplas de números entre paréntesis (sin anidar) con alguna coma decimal («1,33» o
 * «1{,}33») y sin «;» (regla R15). Un paréntesis que no es un par, como «(6,08 con dos decimales)»,
 * no cuenta.
 */
export const decimalPairs = (text: string): string[] =>
  [
    ...text
      .replace(/\{,\}/g, ',')
      .replace(/\\[ ,;]/g, ' ')
      .matchAll(/\(([^()]*)\)/g),
  ]
    .map((m) => m[1]!)
    .filter((inner) => PAIR.test(inner) && /\d,\d/.test(inner) && !inner.includes(';'));

/** Lo que en un texto se lee como fórmula, como prosa (sin código ni fórmulas) y como código. */
const isPlainLine = (t: ProseText): boolean => t.field.startsWith('line[');

export interface ProseRule {
  name: string;
  /** Origen de la regla, para el comentario `// contract:` de la prueba. */
  contract: string;
  /** Lista de problemas de una pregunta; vacía si cumple. */
  problems(q: Question): string[];
}

export const proseRules: ProseRule[] = [
  {
    name: '«dimensión» solo para el número de componentes: con `.shape` o `ndim` se habla de «ejes»',
    contract: 'review-15 I1',
    problems: (q) =>
      proseTexts(q)
        .filter(
          (t) =>
            /dimensi/i.test(t.text) &&
            /\.shape|\bndim\b/.test(t.text) &&
            !/\bejes?\b/i.test(t.text),
        )
        .map(
          (t) =>
            `${q.id} ${t.field}: usa «dimensión» junto a .shape o ndim sin hablar de ejes (si el texto habla de ` +
            '`.shape`/`ndim` y de dimensiones del vector, nombra también los ejes del array): ' +
            t.text,
        ),
  },
  {
    name: 'el `explain` de una pregunta de código no contiene su última línea ni su última asignación',
    contract: 'review-15 I3 (a)',
    problems: (q) => {
      if (q.type !== 'codigo') return [];
      const explain = squash(q.explain);
      const last = lastLine((q as CodigoQ).reference);
      const rhs = lastAssignmentRhs((q as CodigoQ).reference);
      return [last, rhs]
        .filter((s): s is string => s !== undefined && mentions(explain, squash(s)))
        .map((s) => `${q.id} explain: contiene «${s}», que es la respuesta`);
    },
  },
  {
    name: 'el `explain` de una hoja no nombra la línea (ni dice cuál es la errónea)',
    contract: 'review-15 I3 (b)',
    problems: (q) =>
      q.type === 'revision' && /(primera|segunda|tercera|cuarta|última) línea/i.test(q.explain)
        ? [`${q.id} explain: nombra una línea: ${q.explain}`]
        : [],
  },
  {
    name: 'la palabra del juego es «opuesto», no «vector contrario»',
    contract: 'review-15 m8',
    problems: (q) =>
      proseTexts(q)
        .filter((t) => /vector(es)? contrario(s)?/i.test(t.text))
        .map((t) => `${q.id} ${t.field}: dice «vector contrario» en vez de «opuesto»`),
  },
  {
    name: 'todo enunciado que habla del juguete (`emb`, «juguete») dice que los reales tienen «cientos»',
    contract: 'review-15 m5',
    problems: (q) =>
      (/\bemb\b/.test(q.prompt) || /juguete/i.test(q.prompt)) && !/cientos/i.test(q.prompt)
        ? [
            `${q.id} prompt: habla del juguete sin decir que los reales tienen cientos de dimensiones`,
          ]
        : [],
  },
  {
    name: 'en una hoja de código que usa `np`, el enunciado dice que NumPy ya está importado',
    contract: 'review-15 m11',
    problems: (q) =>
      q.type === 'revision' &&
      q.format === 'codigo' &&
      q.lines.some((l) => /\bnp\./.test(l)) &&
      !/importado como `np`/.test(q.prompt)
        ? [`${q.id} prompt: usa np sin decir que NumPy ya está importado`]
        : [],
  },
  {
    name: 'todo texto tiene contenido, sus `$` van emparejados y sus fórmulas pasan KaTeX estricto',
    contract: 'review-15, propuesta de la 18 (prueba de prosa del juego entero)',
    problems: (q) =>
      allTexts(q).flatMap((t) => {
        if (t.text.trim() === '') return [`${q.id} ${t.field}: texto vacío`];
        if (isPlainLine(t)) return [];
        const { math, display, rest } = splitMath(t.text);
        const out: string[] = [];
        if (rest.includes('$')) out.push(`${q.id} ${t.field}: hay un \`$\` sin pareja: ${t.text}`);
        math.forEach((m, i) => {
          try {
            katex.renderToString(m, {
              throwOnError: true,
              strict: 'error',
              displayMode: display[i]!,
            });
          } catch (e) {
            out.push(`${q.id} ${t.field}: KaTeX rechaza «${m}»: ${(e as Error).message}`);
          }
        });
        return out;
      }),
  },
  {
    name: 'sin punto decimal en prosa y sin coma decimal sin `{,}` en fórmula',
    contract: 'review-15, propuesta de la 18; spec: los decimales se escriben con coma',
    problems: (q) =>
      allTexts(q)
        .filter((t) => !isPlainLine(t))
        .flatMap((t) => {
          const { math, rest } = splitMath(t.text);
          const out: string[] = [];
          if (/\d\.\d/.test(rest))
            out.push(`${q.id} ${t.field}: punto decimal en prosa: ${t.text}`);
          for (const m of math)
            if (/\d,\d/.test(m)) out.push(`${q.id} ${t.field}: coma decimal sin {,} en «${m}»`);
          return out;
        }),
  },
  {
    name: 'un par con algún decimal se separa con «; » (R15), en prosa, fórmulas y mensajes',
    contract: 'review-16 m1 y m2 (R15)',
    problems: (q) =>
      allTexts(q)
        .filter((t) => !isPlainLine(t))
        .flatMap((t) => {
          const { math, rest } = splitMath(t.text);
          return [...math, rest].flatMap((piece) =>
            decimalPairs(piece).map((i) => `${q.id} ${t.field}: el par (${i}) lleva «;»`),
          );
        }),
  },
  {
    name: 'los mensajes de las comprobaciones se pintan con Markdown: sin `*`, `$`, `#`, `1.` ni imágenes fuera de código',
    contract: 're-review-11 N4',
    problems: (q) =>
      checkMessages(q).flatMap((m) => {
        const out: string[] = [];
        if ((m.match(/`/g) ?? []).length % 2 === 1)
          out.push(`${q.id} mensaje: acentos graves sin pareja: ${m}`);
        const plain = withoutCode(m);
        if (/[*$#]|!\[|^\s*\d+[.)]\s/m.test(plain))
          out.push(`${q.id} mensaje: \`*\`, \`$\`, \`#\`, lista o imagen fuera de código: ${m}`);
        return out;
      }),
  },
  {
    name: 'el `explain` de una pregunta de código no nombra `axis=N` ni «eje N» si la referencia lo usa',
    contract: 'review-16 I2, propuesta de la 18',
    problems: (q) => {
      if (q.type !== 'codigo') return [];
      const axes = [...q.reference.matchAll(/axis\s*=\s*(-?\d)/g)].map((m) => m[1]!);
      return axes
        .filter((n) => new RegExp(`axis\\s*=\\s*${n}|\\beje ${n}\\b`).test(q.explain))
        .map((n) => `${q.id} explain: nombra el eje ${n}, que es la decisión de la pregunta`);
    },
  },
  {
    name: 'lo que se comprueba (`requirements`) no da la respuesta: ni la última línea, ni la última asignación, ni el eje',
    contract: 'petición de Oliver 2026-10-20: decir qué se comprueba sin resolver la pregunta',
    problems: (q) => {
      if (q.type !== 'codigo') return [];
      const last = lastLine(q.reference);
      const rhs = lastAssignmentRhs(q.reference);
      const axes = [...q.reference.matchAll(/axis\s*=\s*(-?\d)/g)].map((m) => m[1]!);
      return q.requirements.flatMap((text, i) => {
        const flat = squash(text);
        const leaks = [last, rhs]
          .filter((s): s is string => s !== undefined && mentions(flat, squash(s)))
          .map((s) => `${q.id} requirement[${i}]: contiene «${s}», que es la respuesta`);
        const axisLeaks = axes
          .filter((n) => new RegExp(`axis\\s*=\\s*${n}|\\beje ${n}\\b`).test(text))
          .map(
            (n) =>
              `${q.id} requirement[${i}]: nombra el eje ${n}, que es la decisión de la pregunta`,
          );
        return [...leaks, ...axisLeaks];
      });
    },
  },
  {
    name: 'ningún texto remite a algo «que ya conoces» de otro proyecto',
    contract: 'rereview-16 N2: los proyectos de la órbita se abren a la vez',
    problems: (q) =>
      proseTexts(q)
        .filter((t) => /que ya conoces|como ya (sabes|viste)/i.test(t.text))
        .map((t) => `${q.id} ${t.field}: remite a algo que el jugador ya conoce`),
  },
  {
    name: 'ningún mensaje de las comprobaciones contiene un texto de error de NumPy o de Python en inglés',
    contract: 'review-18r m2 (RISKS de rereview-16-fix2)',
    problems: (q) =>
      checkMessages(q)
        .filter((m) => NUMPY_ENGLISH.test(m))
        .map((m) => `${q.id} mensaje: texto de error en inglés: ${m}`),
  },
  {
    name: 'el `starter` de una pregunta de código no tiene un decimal con coma',
    contract: 'rereview-16 N4: en Python, `-0,5` es una tupla',
    problems: (q) =>
      q.type === 'codigo' && /\d,\d/.test(q.starter)
        ? [`${q.id} starter: decimal con coma (en Python es una tupla)`]
        : [],
  },
];

/** Problemas de una regla sobre una lista de preguntas. */
export const ruleProblems = (rule: ProseRule, questions: readonly Question[]): string[] =>
  questions.flatMap((q) => rule.problems(q));

/** Una prueba por regla sobre todas las preguntas del juego o proyecto. */
export const defineProseTests = (label: string, questions: readonly Question[]): void => {
  describe(`prosa: ${label}`, () => {
    for (const rule of proseRules) {
      it(rule.name, () => {
        // contract: el origen de cada regla está en `rule.contract` (revisión de la tarea 15)
        expect(ruleProblems(rule, questions)).toEqual([]);
      });
    }
  });
};
